(function(){
  "use strict";

  const DATA_KEY = "vocabrise_production_stable_v1";
  const RESET_KEY = "tangonest_beta83_library_clean_reset_v1";
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  let activeView = localStorage.getItem("tangonest_library_view_v1") || "words";
  let pendingDeleteId = "";
  let contextTargetId = "";

  function dbRef(){
    try{ if(typeof db !== "undefined" && db)return db; }catch(e){}
    try{ return JSON.parse(localStorage.getItem(DATA_KEY) || "{}"); }catch(e){}
    return {ui:"en",prefs:{frontLang:"en-US",backLang:"ja-JP"},lists:[],words:[],meta:{}};
  }

  function setDb(next){
    try{
      if(typeof db !== "undefined" && db){
        Object.keys(db).forEach(key => delete db[key]);
        Object.assign(db,next);
        return;
      }
    }catch(e){}
    window.db = next;
  }

  function persist(){
    const data = dbRef();
    data.meta = data.meta || {};
    data.meta.updatedAt = new Date().toISOString();
    try{ localStorage.setItem(DATA_KEY,JSON.stringify(data)); }catch(e){}
  }

  function toast(message){
    const t = $("toast");
    if(t){
      t.textContent = message;
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"),1600);
    }
  }

  function cleanStartOnce(){
    if(localStorage.getItem(RESET_KEY))return;
    const fresh = {
      ui:"en",
      prefs:{frontLang:"en-US",backLang:"ja-JP"},
      lists:[{id:"starter",name:"New Playlist",createdAt:new Date().toISOString()}],
      words:[],
      meta:{updatedAt:new Date().toISOString()}
    };
    setDb(fresh);
    localStorage.setItem(DATA_KEY,JSON.stringify(fresh));
    localStorage.setItem(RESET_KEY,"1");
  }

  function ensureData(){
    const data = dbRef();
    data.lists = Array.isArray(data.lists) ? data.lists : [];
    data.words = Array.isArray(data.words) ? data.words : [];
    data.prefs = data.prefs || {frontLang:"en-US",backLang:"ja-JP"};
    if(!data.lists.length){
      data.lists.push({id:"starter",name:"New Playlist",createdAt:new Date().toISOString()});
    }
    data.words.forEach(word => {
      if(!data.lists.some(list => list.id === word.listId))word.listId = data.lists[0].id;
    });
    return data;
  }

  function listName(id){
    return ensureData().lists.find(list => list.id === id)?.name || "New Playlist";
  }

  function wordCount(listId){
    return ensureData().words.filter(word => word.listId === listId).length;
  }

  function friendlyDate(value){
    if(!value)return "Recently updated";
    const date = new Date(value);
    if(Number.isNaN(date.getTime()))return "Recently updated";
    return date.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  }

  function languageLabel(code){
    const names = {
      "en-US":"English","en-GB":"English","ja-JP":"Japanese","ko-KR":"Korean",
      "zh-CN":"Chinese","zh-TW":"Chinese","fr-FR":"French","es-ES":"Spanish",
      "de-DE":"German","it-IT":"Italian","pt-BR":"Portuguese"
    };
    return names[code] || code || "Unknown";
  }

  function firstLatinLetter(word){
    const first = String(word?.front || "").trim().charAt(0).toUpperCase();
    return /^[A-Z]$/.test(first) ? first : "";
  }

  function filterState(){
    return {
      query:String($("tnLibrarySearch")?.value || "").trim().toLowerCase(),
      language:$("tnFilterLanguage")?.value || "all",
      letter:$("tnFilterLetter")?.value || "all",
      playlist:$("tnFilterPlaylist")?.value || "all",
      pos:$("tnFilterPos")?.value || "all"
    };
  }

  function isFilterActive(state=filterState()){
    return !!state.query || state.language !== "all" || state.letter !== "all" || state.playlist !== "all" || state.pos !== "all";
  }

  function filteredWords(){
    const data = ensureData();
    const state = filterState();
    let words = [...data.words];
    if(state.query){
      words = words.filter(word => [word.front,word.back,word.memo,word.tags,word.pos,word.gender,listName(word.listId)].join(" ").toLowerCase().includes(state.query));
    }
    if(state.language !== "all")words = words.filter(word => word.frontLang === state.language || word.backLang === state.language);
    if(state.letter !== "all")words = words.filter(word => firstLatinLetter(word) === state.letter);
    if(state.playlist !== "all")words = words.filter(word => word.listId === state.playlist);
    if(state.pos !== "all")words = words.filter(word => String(word.pos || "") === state.pos);
    return words;
  }

  function options(items,current){
    return items.map(item => `<option value="${esc(item.value)}" ${item.value === current ? "selected" : ""}>${esc(item.label)}</option>`).join("");
  }

  function libraryShell(content){
    return `
      <div class="tn-library-shell">
        <div class="tn-library-top">
          <div>
            <span class="tn-library-kicker">Library</span>
            <h3>Your collection</h3>
          </div>
          <div class="tn-library-tabs" role="tablist">
            <button type="button" data-library-view="words" class="${activeView === "words" ? "active" : ""}">Words</button>
            <button type="button" data-library-view="playlists" class="${activeView === "playlists" ? "active" : ""}">Playlists</button>
          </div>
        </div>
        ${content}
      </div>
    `;
  }

  function wordsTools(){
    const data = ensureData();
    const state = filterState();
    const languages = [...new Set(data.words.flatMap(word => [word.frontLang,word.backLang]).filter(Boolean))]
      .sort((a,b) => languageLabel(a).localeCompare(languageLabel(b)));
    const pos = [...new Set(data.words.map(word => word.pos).filter(Boolean))]
      .sort((a,b) => String(a).localeCompare(String(b)));
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => ({value:letter,label:letter}));
    return `
      <div class="tn-library-tools">
        <input id="tnLibrarySearch" placeholder="Search words" value="${esc(state.query)}">
        <div class="tn-library-filter-row">
          <select id="tnFilterLanguage">${options([{value:"all",label:"All languages"},...languages.map(value => ({value,label:languageLabel(value)}))],state.language)}</select>
          <select id="tnFilterLetter">${options([{value:"all",label:"All letters"},...letters],state.letter)}</select>
          <select id="tnFilterPlaylist">${options([{value:"all",label:"All playlists"},...data.lists.map(list => ({value:list.id,label:list.name || "New Playlist"}))],state.playlist)}</select>
          <select id="tnFilterPos">${options([{value:"all",label:"All POS"},...pos.map(value => ({value,label:value}))],state.pos)}</select>
          <button type="button" id="tnClearFilters" class="${isFilterActive(state) ? "is-active" : ""}">Reset</button>
        </div>
      </div>
    `;
  }

  function wordsView(){
    const words = filteredWords();
    const body = words.length ? `
      <div class="tn82-word-list">
        ${words.map(word => `
          <div class="tn82-word-card" data-word-id="${esc(word.id)}">
            <div class="tn82-word-main">
              <div class="tn82-front">${esc(word.front)}</div>
              <div class="tn82-back">${esc(word.back)}</div>
            </div>
            <div class="tn82-word-meta">
              <span>${esc(listName(word.listId))}</span>
              <span>${esc(languageLabel(word.frontLang))} -> ${esc(languageLabel(word.backLang))}</span>
              ${word.pos ? `<span>${esc(word.pos)}</span>` : ""}
              ${word.saved ? `<span>Saved</span>` : ""}
            </div>
          </div>
        `).join("")}
      </div>
    ` : `
      <div class="tn-library-empty">
        <h3>${isFilterActive() ? "No words found" : "No words yet"}</h3>
        <p>${isFilterActive() ? "Try changing your search or filters." : "Add your first word from Create."}</p>
        <button type="button" data-go-create>Add word</button>
      </div>
    `;
    return libraryShell(`
      ${wordsTools()}
      <div class="tn82-library-summary">${words.length} word${words.length === 1 ? "" : "s"} shown</div>
      ${body}
    `);
  }

  function playlistsView(){
    const data = ensureData();
    const cards = data.lists.length ? `
      <div class="tn-library-playlist-grid">
        ${data.lists.map(list => `
          <article class="tn-library-playlist-card" data-playlist-id="${esc(list.id)}" tabindex="0">
            <button type="button" class="tn-playlist-open" data-open-playlist="${esc(list.id)}">
              <span class="tn-playlist-art">${esc(String(list.name || "N").slice(0,2).toUpperCase())}</span>
              <span class="tn-playlist-copy">
                <strong>${esc(list.name || "New Playlist")}</strong>
                <em>${wordCount(list.id)} word${wordCount(list.id) === 1 ? "" : "s"} · ${esc(friendlyDate(list.updatedAt || list.createdAt))}</em>
              </span>
            </button>
            <button type="button" class="tn-playlist-delete-btn" data-delete-playlist="${esc(list.id)}">Delete</button>
            <button type="button" class="tn-playlist-menu-btn" data-menu-playlist="${esc(list.id)}" aria-label="Playlist menu">...</button>
          </article>
        `).join("")}
      </div>
    ` : `
      <div class="tn-library-empty">
        <h3>No playlists yet</h3>
        <p>Create a playlist, then collect words into it.</p>
        <button type="button" data-go-create>Create playlist</button>
      </div>
    `;
    return libraryShell(`
      <div class="tn-library-playlists-head">
        <h3>Playlists</h3>
        <span>${data.lists.length} list${data.lists.length === 1 ? "" : "s"}</span>
      </div>
      ${cards}
    `);
  }

  function renderLibrary(){
    const mount = $("tn82LibraryMount");
    if(!mount)return;
    activeView = activeView === "playlists" ? "playlists" : "words";
    mount.innerHTML = activeView === "playlists" ? playlistsView() : wordsView();
    bindLibraryUi();
    updateLegacyControls();
  }

  function updateLegacyControls(){
    const state = filterState();
    if($("wordSearch"))$("wordSearch").value = state.query;
    if($("wordListSelect") && [...$("wordListSelect").options].some(option => option.value === state.playlist))$("wordListSelect").value = state.playlist;
  }

  function resetFilters(){
    ["tnLibrarySearch","wordSearch"].forEach(id => { if($(id))$(id).value = ""; });
    ["tnFilterLanguage","tnFilterLetter","tnFilterPlaylist","tnFilterPos"].forEach(id => { if($(id))$(id).value = "all"; });
    if($("wordListSelect"))$("wordListSelect").value = "all";
    if($("statusFilter"))$("statusFilter").value = "all";
    renderLibrary();
  }

  function switchView(view){
    activeView = view === "playlists" ? "playlists" : "words";
    localStorage.setItem("tangonest_library_view_v1",activeView);
    renderLibrary();
  }

  function openPlaylist(listId){
    activeView = "words";
    localStorage.setItem("tangonest_library_view_v1",activeView);
    renderLibrary();
    const select = $("tnFilterPlaylist");
    if(select)select.value = listId;
    if($("wordListSelect"))$("wordListSelect").value = listId;
    renderLibrary();
  }

  function showContextMenu(listId,x,y){
    hideContextMenu();
    contextTargetId = listId;
    const menu = document.createElement("div");
    menu.id = "tnPlaylistContextMenu";
    menu.className = "tn-context-menu";
    menu.style.left = Math.min(x,window.innerWidth - 210) + "px";
    menu.style.top = Math.min(y,window.innerHeight - 82) + "px";
    menu.innerHTML = `<button type="button" data-context-delete>Delete playlist</button>`;
    document.body.appendChild(menu);
  }

  function hideContextMenu(){
    $("tnPlaylistContextMenu")?.remove();
  }

  function showDeleteModal(listId){
    hideContextMenu();
    pendingDeleteId = listId;
    const list = ensureData().lists.find(item => item.id === listId);
    if(!list)return toast("Playlist not found");
    let modal = $("tnPlaylistDeleteModal");
    if(!modal){
      modal = document.createElement("div");
      modal.id = "tnPlaylistDeleteModal";
      modal.className = "tn-delete-modal";
      document.body.appendChild(modal);
    }
    modal.innerHTML = `
      <div class="tn-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="tnDeleteTitle">
        <h2 id="tnDeleteTitle">Delete playlist?</h2>
        <p>The playlist will be deleted. Words inside it will remain in your Library.</p>
        <strong>${esc(list.name || "New Playlist")}</strong>
        <div class="tn-delete-actions">
          <button type="button" data-cancel-delete>Cancel</button>
          <button type="button" data-confirm-delete>Delete playlist</button>
        </div>
      </div>
    `;
    modal.classList.add("show");
  }

  function hideDeleteModal(){
    $("tnPlaylistDeleteModal")?.classList.remove("show");
    pendingDeleteId = "";
  }

  function fallbackPlaylist(exceptId){
    const data = ensureData();
    let fallback = data.lists.find(list => list.id !== exceptId);
    if(!fallback){
      fallback = {id:"starter",name:"New Playlist",createdAt:new Date().toISOString()};
      data.lists.push(fallback);
    }
    return fallback;
  }

  async function syncPlaylistDeletion(listId,fallbackId){
    try{
      const client = typeof window.tnCloudFirstClient === "function" ? window.tnCloudFirstClient() : null;
      if(!client?.auth)return;
      const userResult = await client.auth.getUser();
      const userId = userResult?.data?.user?.id;
      if(!userId)return;
      await client.from("tn_words").update({playlist_id:fallbackId}).eq("playlist_id",listId).eq("user_id",userId);
      await client.from("tn_playlists").delete().eq("id",listId).eq("user_id",userId);
      if(typeof window.tnCloudFirstLoad === "function")setTimeout(() => window.tnCloudFirstLoad(),200);
    }catch(error){
      console.warn("Playlist cloud deletion sync skipped",error);
    }
  }

  function deletePlaylist(listId){
    const data = ensureData();
    const list = data.lists.find(item => item.id === listId);
    if(!list)return toast("Playlist not found");
    const fallback = fallbackPlaylist(listId);
    data.words.forEach(word => {
      if(word.listId === listId)word.listId = fallback.id;
    });
    data.lists = data.lists.filter(item => item.id !== listId);
    persist();
    renderSelectsSafe();
    if($("tnFilterPlaylist")?.value === listId)$("tnFilterPlaylist").value = "all";
    if($("wordListSelect")?.value === listId)$("wordListSelect").value = "all";
    renderLibrary();
    try{ if(typeof renderHome === "function")renderHome(); }catch(e){}
    try{ if(typeof tn82CloudSaveSoon === "function")tn82CloudSaveSoon("playlist-delete"); }catch(e){}
    syncPlaylistDeletion(listId,fallback.id);
    hideDeleteModal();
    toast("Playlist deleted");
  }

  function renderSelectsSafe(){
    const data = ensureData();
    ["addList","bulkList","studyList","quizList","audioList","renameListSelect","editList"].forEach(id => {
      const el = $(id);
      if(!el)return;
      const current = el.value;
      el.innerHTML = data.lists.map(list => `<option value="${esc(list.id)}">${esc(list.name || "New Playlist")}</option>`).join("");
      if([...el.options].some(option => option.value === current))el.value = current;
    });
    const wordSelect = $("wordListSelect");
    if(wordSelect){
      const current = wordSelect.value;
      wordSelect.innerHTML = `<option value="all">All</option>` + data.lists.map(list => `<option value="${esc(list.id)}">${esc(list.name || "New Playlist")}</option>`).join("");
      wordSelect.value = [...wordSelect.options].some(option => option.value === current) ? current : "all";
    }
  }

  function stabilizeHeader(){
    const header = $("tn80HeaderCloud");
    if(header){
      if(header.textContent !== "Cloud")header.textContent = "Cloud";
      header.title = "Cloud sync details are in Settings.";
      header.style.minWidth = "76px";
      header.style.width = "76px";
    }
    const pill = $("tn80StatusPill");
    if(pill){
      if(pill.textContent !== "Sync")pill.textContent = "Sync";
      pill.style.minWidth = "62px";
    }
    const account = $("tn80Account");
    if(account && /@/.test(account.textContent || ""))account.textContent = "Signed in";
    const syncBadge = $("syncStatusBadge");
    if(syncBadge && syncBadge.textContent !== "Sync")syncBadge.textContent = "Sync";
  }

  function bindLibraryUi(){
    ["tnLibrarySearch","tnFilterLanguage","tnFilterLetter","tnFilterPlaylist","tnFilterPos"].forEach(id => {
      const el = $(id);
      if(el && !el.__tnLibraryBound){
        el.addEventListener(el.tagName === "INPUT" ? "input" : "change",() => {
          const shouldRefocus = id === "tnLibrarySearch";
          renderLibrary();
          if(shouldRefocus){
            requestAnimationFrame(() => {
              const next = $("tnLibrarySearch");
              if(next){
                next.focus();
                const len = next.value.length;
                try{ next.setSelectionRange(len,len); }catch(e){}
              }
            });
          }
        });
        el.__tnLibraryBound = true;
      }
    });
    const clear = $("tnClearFilters");
    if(clear)clear.onclick = resetFilters;
  }

  document.addEventListener("click",event => {
    const view = event.target?.closest?.("[data-library-view]");
    if(view){
      event.preventDefault();
      switchView(view.dataset.libraryView);
      return;
    }
    const create = event.target?.closest?.("[data-go-create]");
    if(create){
      event.preventDefault();
      try{ if(typeof appShow === "function")appShow("add"); else if(typeof go === "function")go("add"); }catch(e){}
      return;
    }
    const open = event.target?.closest?.("[data-open-playlist]");
    if(open){
      event.preventDefault();
      openPlaylist(open.dataset.openPlaylist);
      return;
    }
    const directDelete = event.target?.closest?.("[data-delete-playlist]");
    if(directDelete){
      event.preventDefault();
      event.stopPropagation();
      showDeleteModal(directDelete.dataset.deletePlaylist);
      return;
    }
    const menu = event.target?.closest?.("[data-menu-playlist]");
    if(menu){
      event.preventDefault();
      event.stopPropagation();
      const rect = menu.getBoundingClientRect();
      showContextMenu(menu.dataset.menuPlaylist,rect.left,rect.bottom + 8);
      return;
    }
    if(event.target?.closest?.("[data-context-delete]")){
      showDeleteModal(contextTargetId);
      return;
    }
    if(event.target?.closest?.("[data-cancel-delete]")){
      hideDeleteModal();
      return;
    }
    if(event.target?.closest?.("[data-confirm-delete]")){
      deletePlaylist(pendingDeleteId);
      return;
    }
    if(!event.target?.closest?.("#tnPlaylistContextMenu"))hideContextMenu();
  },true);

  document.addEventListener("contextmenu",event => {
    const card = event.target?.closest?.("[data-playlist-id],.playlist-card");
    if(!card)return;
    const listId = card.dataset.playlistId || card.querySelector("[data-open-playlist]")?.dataset.openPlaylist;
    if(!listId)return;
    event.preventDefault();
    showContextMenu(listId,event.clientX,event.clientY);
  },true);

  document.addEventListener("keydown",event => {
    if(event.key === "Escape"){
      hideContextMenu();
      hideDeleteModal();
    }
  });

  const previousRenderWords = window.renderWords;
  window.tnLibraryRender = renderLibrary;
  window.tn82RenderLibrary = renderLibrary;
  window.tnFixRenderLibrary = renderLibrary;
  window.renderWords = function(){
    renderLibrary();
    try{ if(typeof previousRenderWords === "function" && !document.getElementById("tn82LibraryMount"))previousRenderWords(); }catch(e){}
  };
  window.tnDeletePlaylist = showDeleteModal;
  window.tnStableHeader = stabilizeHeader;

  function boot(){
    cleanStartOnce();
    ensureData();
    renderSelectsSafe();
    renderLibrary();
    stabilizeHeader();
    ["wordSearch","wordListSelect","statusFilter"].forEach(id => {
      const el = $(id);
      if(el && !el.__tnLibraryProxyBound){
        el.addEventListener(el.tagName === "INPUT" ? "input" : "change",renderLibrary);
        el.__tnLibraryProxyBound = true;
      }
    });
  }

  if(document.readyState === "loading")document.addEventListener("DOMContentLoaded",boot);
  else boot();
  setTimeout(boot,400);
  setTimeout(boot,1300);
  const observer = new MutationObserver(stabilizeHeader);
  if(document.body)observer.observe(document.body,{subtree:true,childList:true,characterData:true});
})();
