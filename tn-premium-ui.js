(function(){
  "use strict";

  const PAGE_IDS = ["pageHome","pageAdd","pageWords","pageStudy","pageQuiz","pageAudio","pageManage","pagePlaylists","pageStudyHub","pageSearch"];
  const MAIN_PAGES = new Set(["home","create","library","cards","quiz","listen","settings"]);

  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function dbRef(){
    try{ if(window.db)return window.db; }catch(e){}
    try{
      const raw = localStorage.getItem("tangonest_production_stable_v1");
      if(raw)return JSON.parse(raw);
    }catch(e){}
    return {lists:[],words:[],prefs:{}};
  }

  function listName(id){
    const data = dbRef();
    return data.lists?.find(list => list.id === id)?.name || "No playlist";
  }

  function wordCountForList(id){
    const data = dbRef();
    return (data.words || []).filter(word => word.listId === id).length;
  }

  function friendlyDate(value){
    if(!value)return "Recently updated";
    const date = new Date(value);
    if(Number.isNaN(date.getTime()))return "Recently updated";
    return date.toLocaleDateString(undefined,{month:"short",day:"numeric"});
  }

  function createPremiumPages(){
    const app = document.querySelector(".app");
    if(!app || $("pagePlaylists"))return;

    const playlists = document.createElement("section");
    playlists.id = "pagePlaylists";
    playlists.className = "page tn-premium-page";
    playlists.innerHTML = `
      <div class="tn-page-heading">
        <span class="tn-kicker">Collections</span>
        <h2>Playlists</h2>
        <p>Organize vocabulary the way you would organize albums and playlists.</p>
      </div>
      <div class="tn-playlist-create">
        <input id="tnPremiumNewList" placeholder="New playlist name">
        <button type="button" id="tnPremiumCreateList">Create playlist</button>
      </div>
      <div id="tnPremiumPlaylistCards" class="tn-playlist-grid"></div>
    `;

    const study = document.createElement("section");
    study.id = "pageStudyHub";
    study.className = "page tn-premium-page";
    study.innerHTML = `
      <div class="tn-page-heading">
        <span class="tn-kicker">Practice</span>
        <h2>Study</h2>
        <p>Flashcards, quiz, and listening practice live together here.</p>
      </div>
      <div class="tn-study-grid">
        <button type="button" data-go="cards" class="tn-study-card">
          <span>Flashcards</span><strong>Review with clean cards</strong><em>Open cards</em>
        </button>
        <button type="button" data-go="quiz" class="tn-study-card">
          <span>Quiz</span><strong>Test your memory</strong><em>Start quiz</em>
        </button>
        <button type="button" data-go="listen" class="tn-study-card">
          <span>Listen</span><strong>Audio practice</strong><em>Open listen</em>
        </button>
      </div>
    `;

    const search = document.createElement("section");
    search.id = "pageSearch";
    search.className = "page tn-premium-page";
    search.innerHTML = `
      <div class="tn-page-heading tn-search-heading">
        <span class="tn-kicker">Dictionary</span>
        <h2>Search</h2>
        <p>Find words, meanings, examples, playlists, and tags.</p>
      </div>
      <div class="tn-search-panel">
        <input id="tnPremiumSearchInput" placeholder="Search your vocabulary">
      </div>
      <div id="tnPremiumSearchResults" class="tn-search-results"></div>
    `;

    app.appendChild(playlists);
    app.appendChild(study);
    app.appendChild(search);
  }

  function createFab(){
    const app = document.querySelector(".app");
    if(!app || $("tnPremiumAddFab"))return;
    const button = document.createElement("button");
    button.id = "tnPremiumAddFab";
    button.className = "tn-premium-add";
    button.type = "button";
    button.innerHTML = `<span>+</span><b>Add word</b>`;
    button.onclick = () => showPremiumPage("add");
    app.appendChild(button);

    const stats = document.querySelector(".stats");
    if(stats && !$("tnPremiumHeaderAdd")){
      const headerButton = document.createElement("button");
      headerButton.id = "tnPremiumHeaderAdd";
      headerButton.className = "tn-premium-header-add";
      headerButton.type = "button";
      headerButton.textContent = "+ Add word";
      headerButton.onclick = () => showPremiumPage("add");
      stats.insertBefore(headerButton,stats.firstChild);
    }
  }

  function configureNav(){
    const items = [
      ["navHome","Home","home"],
      ["navAdd","Create","create"],
      ["navWords","Library","library"],
      ["navStudy","Cards","cards"],
      ["navQuiz","Quiz","quiz"],
      ["navAudio","Listen","listen"],
      ["navManage","Settings","settings"],
      ["mnavHome","Home","home"],
      ["mnavAdd","Create","create"],
      ["mnavWords","Library","library"],
      ["mnavQuiz","Quiz","quiz"],
      ["mnavManage","Settings","settings"]
    ];
    items.forEach(([id,label,page]) => {
      const button = $(id);
      if(!button)return;
      button.textContent = label;
      button.onclick = event => {
        event.preventDefault();
        showPremiumPage(page);
      };
    });
    ["navQuiz","navAudio"].forEach(id => {
      const button = $(id);
      if(button)button.style.display = "";
    });
    configureMobileNav();
  }

  function configureMobileNav(){
    const bar = document.querySelector(".mobile-tabbar");
    if(!bar || bar.__tnStableSevenNav)return;
    bar.__tnStableSevenNav = true;
    bar.innerHTML = "";
    [
      ["Home","home"],
      ["Create","create"],
      ["Library","library"],
      ["Cards","cards"],
      ["Quiz","quiz"],
      ["Listen","listen"],
      ["Settings","settings"]
    ].forEach(([label,page]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.dataset.tnPage = page;
      button.onclick = event => {
        event.preventDefault();
        showPremiumPage(page);
      };
      bar.appendChild(button);
    });
  }

  function bindNavCapture(){
    if(document.__tnPremiumNavCapture)return;
    document.__tnPremiumNavCapture = true;
    document.addEventListener("click",event => {
      const button = event.target?.closest?.(".nav button,.mobile-tabbar button");
      if(!button)return;
      const label = String(button.textContent || "").trim().toLowerCase();
      const page = {
        home:"home",
        create:"create",
        library:"library",
        cards:"cards",
        quiz:"quiz",
        listen:"listen",
        settings:"settings"
      }[label] || button.dataset?.tnPage;
      if(!page)return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      showPremiumPage(page);
    },true);
  }

  function targetFor(page){
    const normalized = String(page || "library").toLowerCase();
    if(["home"].includes(normalized))return ["pageHome","home"];
    if(["words","wordlist","library"].includes(normalized))return ["pageWords","library"];
    if(["playlists","playlist"].includes(normalized))return ["pagePlaylists","playlists"];
    if(["study","studyhub"].includes(normalized))return ["pageStudyHub","study"];
    if(["cards","card"].includes(normalized))return ["pageStudy","cards"];
    if(["quiz"].includes(normalized))return ["pageQuiz","quiz"];
    if(["listen","audio"].includes(normalized))return ["pageAudio","listen"];
    if(["search","dictionary"].includes(normalized))return ["pageSearch","search"];
    if(["settings","manage"].includes(normalized))return ["pageManage","settings"];
    if(["add","create"].includes(normalized))return ["pageAdd","create"];
    return ["pageWords","library"];
  }

  function setActiveNav(active){
    document.querySelectorAll(".nav button,.mobile-tabbar button").forEach(button => button.classList.remove("active"));
    const ids = {
      home:["navHome"],
      create:["navAdd"],
      library:["navWords"],
      cards:["navStudy"],
      quiz:["navQuiz"],
      listen:["navAudio"],
      settings:["navManage"]
    }[active] || [];
    ids.forEach(id => $(id)?.classList.add("active"));
    document.querySelectorAll(".mobile-tabbar button").forEach(button => {
      button.classList.toggle("active",button.dataset.tnPage === active);
    });
  }

  function showPremiumPage(page){
    createPremiumPages();
    const [target, nav] = targetFor(page);
    PAGE_IDS.forEach(id => $(id)?.classList.remove("active"));
    $(target)?.classList.add("active");
    if(nav)setActiveNav(nav);
    if(MAIN_PAGES.has(nav)){
      try{ localStorage.setItem("tangonest_last_page_v2",nav); }catch(e){}
    }
    renderPremium();
    if(target === "pageStudy"){
      try{ if(typeof resetCard === "function")resetCard(); }catch(e){}
    }
  }

  function renderLibraryIntro(){
    const mount = $("tn82LibraryMount");
    if(!mount)return;
    let intro = $("tnPremiumLibraryIntro");
    if(!intro){
      intro = document.createElement("div");
      intro.id = "tnPremiumLibraryIntro";
      mount.parentNode.insertBefore(intro,mount);
    }
    const data = dbRef();
    const words = data.words || [];
    const lists = data.lists || [];
    const recent = [...words].slice(-4).reverse();
    const saved = words.filter(word => word.saved).slice(0,4);
    const languages = [...new Set(words.flatMap(word => [word.frontLang,word.backLang]).filter(Boolean))].slice(0,6);
    intro.innerHTML = `
      <div class="tn-library-hero">
        <div>
          <span class="tn-kicker">Library</span>
          <h2>Your vocabulary library</h2>
          <p>Collect words like tracks, organize them into playlists, and come back when you are ready to study.</p>
        </div>
        <button type="button" onclick="appShow('add')">Add word</button>
      </div>
      <div class="tn-library-sections">
        <section>
          <h3>Recently added</h3>
          ${miniWordList(recent)}
        </section>
        <section>
          <h3>Saved words</h3>
          ${miniWordList(saved)}
        </section>
      </div>
      <div class="tn-collection-strip">
        ${lists.slice(0,5).map(list => `<button type="button" onclick="go('playlists')"><span>${esc(list.name)}</span><small>${wordCountForList(list.id)} words</small></button>`).join("") || `<button type="button" onclick="go('playlists')"><span>No playlists yet</span><small>Create one when ready</small></button>`}
        ${languages.map(lang => `<button type="button" onclick="go('search')"><span>${esc(lang)}</span><small>Language</small></button>`).join("")}
      </div>
    `;
  }

  function miniWordList(words){
    if(!words.length)return `<div class="tn-empty-line">Nothing here yet.</div>`;
    return `<div class="tn-mini-list">${words.map(word => `
      <div class="tn-mini-word">
        <strong>${esc(word.front)}</strong>
        <span>${esc(word.back)}</span>
      </div>
    `).join("")}</div>`;
  }

  function renderPlaylists(){
    const mount = $("tnPremiumPlaylistCards");
    if(!mount)return;
    const data = dbRef();
    const lists = data.lists || [];
    mount.innerHTML = lists.length ? lists.map((list,index) => `
      <article class="tn-playlist-card">
        <div class="tn-playlist-art">${esc(String(list.name || "P").slice(0,2).toUpperCase())}</div>
        <div>
          <h3>${esc(list.name || "Untitled playlist")}</h3>
          <p>${wordCountForList(list.id)} words</p>
          <small>${friendlyDate(list.updatedAt || list.createdAt)}</small>
        </div>
        <button type="button" data-rename-id="${esc(list.id)}">Rename</button>
      </article>
    `).join("") : `<div class="tn-empty-state"><h3>No playlists yet</h3><p>Create your first playlist, then add words from the + button.</p></div>`;
  }

  function renderSearch(){
    const input = $("tnPremiumSearchInput");
    const mount = $("tnPremiumSearchResults");
    if(!input || !mount)return;
    const data = dbRef();
    const query = input.value.trim().toLowerCase();
    const words = (data.words || []).filter(word => {
      if(!query)return true;
      return [word.front,word.back,word.memo,word.tags,word.pos,listName(word.listId)].join(" ").toLowerCase().includes(query);
    }).slice(0,80);
    mount.innerHTML = words.length ? words.map(word => `
      <article class="tn-dictionary-row">
        <div>
          <h3>${esc(word.front)}</h3>
          <p>${esc(word.back)}</p>
          ${word.memo ? `<blockquote>${esc(word.memo)}</blockquote>` : ""}
        </div>
        <aside>
          ${word.pos ? `<span>${esc(word.pos)}</span>` : ""}
          <small>${esc(word.frontLang || "en-US")} / ${esc(word.backLang || "ja-JP")}</small>
          <small>${esc(listName(word.listId))}</small>
        </aside>
      </article>
    `).join("") : `<div class="tn-empty-state"><h3>No results</h3><p>Try another word, meaning, playlist, or tag.</p></div>`;
  }

  function bindPremiumActions(){
    const create = $("tnPremiumCreateList");
    if(create && !create.__tnPremium){
      create.__tnPremium = true;
      create.onclick = () => {
        const value = $("tnPremiumNewList")?.value || "";
        const oldInput = $("newList");
        if(oldInput)oldInput.value = value;
        if(typeof createList === "function")createList();
        if($("tnPremiumNewList"))$("tnPremiumNewList").value = "";
        setTimeout(renderPremium,120);
      };
    }
    const search = $("tnPremiumSearchInput");
    if(search && !search.__tnPremium){
      search.__tnPremium = true;
      search.addEventListener("input",renderSearch);
    }
    document.querySelectorAll("[data-go]").forEach(button => {
      if(button.__tnPremium)return;
      button.__tnPremium = true;
      button.onclick = () => showPremiumPage(button.dataset.go);
    });
    document.querySelectorAll("[data-rename-id]").forEach(button => {
      if(button.__tnPremium)return;
      button.__tnPremium = true;
      button.onclick = () => {
        const id = button.getAttribute("data-rename-id");
        const current = dbRef().lists?.find(list => list.id === id)?.name || "";
        const next = prompt("Playlist name",current);
        if(!next || next.trim() === current)return;
        if(typeof tn82RenamePlaylist === "function")tn82RenamePlaylist(id,next.trim());
        else {
          const select = $("renameListSelect");
          const input = $("renameListInput");
          if(select)select.value = id;
          if(input)input.value = next.trim();
          if(typeof renameList === "function")renameList();
        }
        setTimeout(renderPremium,160);
      };
    });
  }

  function renderPremium(){
    renderLibraryIntro();
    renderPlaylists();
    renderSearch();
    bindPremiumActions();
  }

  function install(){
    createPremiumPages();
    createFab();
    configureNav();
    bindNavCapture();
    const oldGo = window.go;
    window.go = function(page){
      const normalized = String(page || "").toLowerCase();
      if(["home","words","library","playlists","playlist","study","studyhub","cards","quiz","listen","audio","search","dictionary","settings","manage","add","create"].includes(normalized)){
        showPremiumPage(normalized);
        return;
      }
      if(typeof oldGo === "function")return oldGo(page);
      showPremiumPage("library");
    };
    const oldAppShow = window.appShow;
    window.appShow = function(page){
      const normalized = String(page || "").toLowerCase();
      if(["add","create","quiz","audio","listen","cards","study","library","words","manage","settings"].includes(normalized)){
        showPremiumPage(normalized);
        return;
      }
      if(typeof oldAppShow === "function")return oldAppShow(page);
    };
    renderPremium();
    const current = localStorage.getItem("tangonest_last_page_v2") || "home";
    showPremiumPage(current === "search" || current === "study" ? "home" : current);
  }

  if(document.readyState === "loading")document.addEventListener("DOMContentLoaded",install);
  else install();
})();
