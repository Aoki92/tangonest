(function(){
  "use strict";

  const $ = id => document.getElementById(id);
  const toast = msg => { try{ (window.tnStableToast || window.tn82Toast || window.toast || console.log)(msg); }catch(e){} };
  const dbRef = () => { try{return db;}catch(e){return window.db || {lists:[],words:[],prefs:{}};} };
  const today = () => new Date().toISOString().slice(0,10);
  const norm = value => String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLocaleLowerCase()
    .replace(/ß/g,"ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"");

  const LANG_ORDER = [
    ["ja-JP","Japanese","意味"],
    ["en-US","English","word"],
    ["ko-KR","Korean","단어"],
    ["zh-CN","Chinese Simplified","词"],
    ["zh-TW","Chinese Traditional","詞"],
    ["es-ES","Spanish","palabra"],
    ["fr-FR","French","mot"],
    ["ar-SA","Arabic","كلمة"],
    ["nl-NL","Dutch","woord"],
    ["de-DE","German","Wort"],
    ["hi-IN","Hindi","शब्द"],
    ["it-IT","Italian","parola"],
    ["pt-BR","Portuguese","palavra"],
    ["ru-RU","Russian","слово"],
    ["th-TH","Thai","คำ"],
    ["tr-TR","Turkish","kelime"],
    ["vi-VN","Vietnamese","tu"]
  ];
  const LANG_EXTRA = [
    ["el-GR","Greek","λέξη"],
    ["he-IL","Hebrew","מילה"],
    ["id-ID","Indonesian","kata"]
  ].sort((a,b)=>a[1].localeCompare(b[1]));
  const LANGS_FIXED = LANG_ORDER.concat(LANG_EXTRA);
  const langIndex = code => {
    const index = LANGS_FIXED.findIndex(item => item[0] === code);
    return index < 0 ? 999 : index;
  };
  const langNameFixed = code => (LANGS_FIXED.find(item => item[0] === code) || [code,code || "Unknown"])[1];
  const placeholderFixed = code => (LANGS_FIXED.find(item => item[0] === code) || ["","","word"])[2];

  function escapeHtml(value){
    return String(value ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  }

  function optionsHTMLFixed(selected){
    return LANGS_FIXED.map(item => `<option value="${item[0]}" ${item[0] === selected ? "selected" : ""}>${item[1]}</option>`).join("");
  }

  function setSelectOptions(select,selected,{allowAll=false}={}){
    if(!select)return;
    const current = selected !== undefined ? selected : select.value;
    let html = allowAll ? '<option value="all">All languages</option>' : "";
    html += optionsHTMLFixed(current);
    select.innerHTML = html;
    if([...select.options].some(option => option.value === current))select.value = current;
    else if(allowAll)select.value = "all";
  }

  function installLanguageOrder(){
    try{ window.tnLanguageOrder = LANGS_FIXED.map(item => item[0]); }catch(e){}
    try{ langName = langNameFixed; placeholderFor = placeholderFixed; optionsHTML = optionsHTMLFixed; }catch(e){}
    const data = dbRef();
    data.prefs = data.prefs || {};
    data.prefs.frontLang = data.prefs.frontLang || "ja-JP";
    data.prefs.backLang = data.prefs.backLang || "en-US";
    ["frontLang","bulkFrontLang","editFrontLang"].forEach(id => setSelectOptions($(id),$(id)?.value || data.prefs.frontLang));
    ["backLang","bulkBackLang","editBackLang"].forEach(id => setSelectOptions($(id),$(id)?.value || data.prefs.backLang));
    reorderExistingLanguageFilter();
    try{ if(typeof updatePlaceholders === "function")updatePlaceholders(); }catch(e){}
  }

  function reorderExistingLanguageFilter(){
    const select = $("tnFilterLanguage");
    if(!select)return;
    const current = select.value || "all";
    const values = [...new Set([...select.options].map(option => option.value).filter(Boolean))].filter(value => value !== "all");
    values.sort((a,b) => langIndex(a) - langIndex(b) || langNameFixed(a).localeCompare(langNameFixed(b)));
    select.innerHTML = '<option value="all">All languages</option>' + values.map(value => `<option value="${value}">${escapeHtml(langNameFixed(value))}</option>`).join("");
    select.value = values.includes(current) ? current : "all";
  }

  function renderVoiceSettingsFinal(){
    const box = $("voiceSettingsBox");
    if(!box)return;
    const voices = typeof refreshVoices === "function" ? refreshVoices() : [];
    if(!voices.length){
      box.innerHTML = '<p class="desc">Browser voices are still loading. Press Refresh Voices if this does not update.</p>';
      return;
    }
    box.innerHTML = LANG_ORDER.map(item => {
      const code = item[0];
      const matches = typeof matchingVoicesForLanguage === "function" ? matchingVoicesForLanguage(code) : [];
      const current = typeof pickVoice === "function" ? pickVoice(code) : null;
      const currentId = current && typeof voiceIdentity === "function" ? voiceIdentity(current) : "";
      const options = ['<option value="">Auto best voice</option>'].concat(matches.map(voice => {
        const id = typeof voiceIdentity === "function" ? voiceIdentity(voice) : `${voice.name}||${voice.lang}`;
        return `<option value="${escapeHtml(id)}" ${id === currentId ? "selected" : ""}>${escapeHtml(voice.name)} / ${escapeHtml(voice.lang)}</option>`;
      })).join("");
      return `<div class="tn-voice-row"><div class="tn-voice-meta"><strong>${escapeHtml(item[1])}</strong><span>${current ? escapeHtml(current.name)+" / "+escapeHtml(current.lang) : "Auto voice unavailable"}</span></div><div class="tn-voice-controls"><select onchange="tnSetVoicePreference('${code}',this.value)">${options}</select><button type="button" onclick="tnTestVoice('${code}')">Test</button></div></div>`;
    }).join("");
  }

  function lists(){
    const data = dbRef();
    data.lists = Array.isArray(data.lists) ? data.lists : [];
    return data.lists;
  }

  function words(){
    const data = dbRef();
    data.words = Array.isArray(data.words) ? data.words : [];
    return data.words;
  }

  function listExists(id){
    return !!id && lists().some(list => list.id === id);
  }

  function selectedPlaylistId(selectId,{allowAll=false}={}){
    const select = $(selectId);
    const current = select?.value || "";
    if(allowAll && (!current || current === "all"))return "all";
    if(listExists(current))return current;
    const first = lists()[0]?.id || "";
    if(select && first)select.value = first;
    return first;
  }

  function playlistWords(selectId,{allowAll=false}={}){
    const selected = selectedPlaylistId(selectId,{allowAll});
    if(allowAll && selected === "all")return words();
    if(!selected)return [];
    return words().filter(word => word.listId === selected);
  }

  function ensureModeSelects(){
    [
      ["quizList",false],
      ["studyList",false],
      ["audioList",false],
      ["bulkList",false],
      ["addList",false],
      ["editList",false],
      ["wordListSelect",true]
    ].forEach(([id,allowAll]) => {
      const select = $(id);
      if(!select)return;
      const current = select.value;
      const dataLists = lists();
      let html = allowAll ? '<option value="all">All</option>' : "";
      html += dataLists.map(list => `<option value="${escapeHtml(list.id)}">${escapeHtml(list.name || "New Playlist")}</option>`).join("");
      select.innerHTML = html;
      if([...select.options].some(option => option.value === current))select.value = current;
      else if(allowAll)select.value = "all";
      else if(dataLists[0])select.value = dataLists[0].id;
    });
  }

  function installInputImmutability(){
    ["front","back","memo","bulkText","wordSearch","tnLibrarySearch","quizAnswer","editFront","editBack"].forEach(id => {
      const el = $(id);
      if(!el)return;
      el.removeAttribute("oninput");
      if(!el.__tnNoMutationGuard){
        el.addEventListener("beforeinput",event => {
          el.__tnBeforeInputValue = el.value;
          el.__tnBeforeSelectionStart = el.selectionStart;
          el.__tnBeforeSelectionEnd = el.selectionEnd;
        });
        el.__tnNoMutationGuard = true;
      }
    });
    try{ autoDetectFront = function(){}; autoDetectBack = function(){}; detectLangWithContext = function(text,currentLang){ return currentLang || detectLang(text,currentLang); }; }catch(e){}
  }

  function isDueSafe(word){
    return word.status === "hard" || !!word.nextReview && word.nextReview <= today();
  }

  function studyWordsFinal(){
    let result = playlistWords("studyList");
    const mode = $("studyMode")?.value || "front";
    if(mode === "hard")result = result.filter(word => word.status === "hard");
    if(mode === "due")result = result.filter(isDueSafe);
    if(mode === "star")result = result.filter(word => word.saved);
    return result;
  }

  function pickWord(pool){
    if(!pool.length)return null;
    const weighted = [];
    pool.forEach(word => {
      const count = word.status === "hard" ? 4 : isDueSafe(word) ? 3 : word.status === "new" ? 2 : 1;
      for(let i=0;i<count;i++)weighted.push(word);
    });
    return weighted[Math.floor(Math.random() * weighted.length)] || pool[0];
  }

  function setCard(word){
    current = word;
    flipped = false;
    $("flash")?.classList.remove("is-flipped");
    if(word){
      word.seen = Number(word.seen || 0) + 1;
      if(typeof drawCard === "function")drawCard();
      try{ persist(); }catch(e){}
    }
    try{ if(typeof updateStudyStar === "function")updateStudyStar(); }catch(e){}
  }

  function nextCardFinal(){
    clearFlashTimersFinal();
    const pool = studyWordsFinal();
    if(!pool.length){
      if(typeof resetCard === "function")resetCard();
      return toast("No words");
    }
    setCard(pickWord(pool));
  }

  function clearFlashTimersFinal(){
    try{ flashTimers.forEach(timer => clearTimeout(timer)); flashTimers = []; }catch(e){}
  }

  function stopFlashAutoFinal(){
    clearFlashTimersFinal();
    if($("flashAutoMode"))$("flashAutoMode").value = "off";
  }

  function speakCardSide(side){
    if(!current || typeof speak !== "function")return;
    const mode = $("studyMode")?.value || "front";
    if(side === "front"){
      const text = mode === "back" ? current.back : current.front;
      const lang = mode === "back" ? current.backLang : current.frontLang;
      speak(text,lang);
    }else{
      const text = mode === "back" ? current.front : current.back;
      const lang = mode === "back" ? current.frontLang : current.backLang;
      speak(text,lang);
    }
  }

  function startFlashAutoFinal(){
    clearFlashTimersFinal();
    if($("flashAutoMode"))$("flashAutoMode").value = "on";
    runFlashAutoCycle();
  }

  function runFlashAutoCycle(){
    clearFlashTimersFinal();
    if($("flashAutoMode")?.value !== "on")return;
    const pool = studyWordsFinal();
    if(!pool.length){ stopFlashAutoFinal(); return toast("No words"); }
    setCard(pickWord(pool));
    speakCardSide("front");
    const frontMs = 2000;
    const backMs = 3000;
    const gapMs = 1000;
    flashTimers.push(setTimeout(() => {
      if($("flashAutoMode")?.value !== "on" || !current)return;
      if(!flipped){
        flipped = true;
        $("flash")?.classList.add("is-flipped");
      }
      speakCardSide("back");
    },frontMs));
    flashTimers.push(setTimeout(() => {
      if($("flashAutoMode")?.value === "on")runFlashAutoCycle();
    },frontMs + backMs + gapMs));
  }

  function quizWordsFinal(){
    let result = playlistWords("quizList");
    const scope = $("quizScope")?.value || "all";
    if(scope === "hard")result = result.filter(word => Number(word.level || 3) <= 2 || word.status === "hard" || word.lastWrongAt);
    if(scope === "due")result = result.filter(isDueSafe);
    if(scope === "star")result = result.filter(word => word.saved);
    return result;
  }

  function startQuizFinal(){
    try{ if(typeof clearQuizTimers === "function")clearQuizTimers(); }catch(e){}
    const pool = quizWordsFinal();
    let requested = parseInt($("quizCount")?.value || "10",10) || 10;
    requested = Math.max(1,requested);
    if(!pool.length)return toast("No words");
    const allow = !!$("quizAllowDuplicates")?.checked;
    let queue = (typeof quizAdaptiveOrder === "function" ? quizAdaptiveOrder(pool) : pool.slice()).slice(0,Math.min(requested,pool.length));
    if(allow && requested > pool.length){
      while(queue.length < requested){
        const next = typeof quizAdaptiveOrder === "function" ? quizAdaptiveOrder(pool) : pool.slice();
        queue = queue.concat(next.slice(0,requested - queue.length));
      }
    }else if(requested > pool.length){
      toast(`Only ${queue.length} words available`);
    }
    quiz = {queue,wrong:[],allWrong:[],index:0,score:0,current:null,answered:false,type:$("quizType")?.value || "choice",direction:$("quizDirection")?.value || "front",total:queue.length,previousQuestionId:"",previousQuestionKey:"",selectedAnswer:""};
    if($("quizSetup"))$("quizSetup").style.display = "none";
    if($("quizRun"))$("quizRun").style.display = "block";
    if($("quizEnd"))$("quizEnd").style.display = "none";
    showQuizQuestion();
  }

  function answerText(word){
    return quiz.direction === "front" ? word.back : word.front;
  }

  function renderChoicesFinal(){
    if(!quiz.current)return;
    const correct = answerText(quiz.current);
    const seen = new Set([norm(correct)]);
    const pool = playlistWords("quizList")
      .filter(word => word.id !== quiz.current.id)
      .map(answerText)
      .filter(value => {
        const k = norm(value);
        if(!k || seen.has(k))return false;
        seen.add(k);
        return true;
      });
    pool.sort(() => Math.random() - 0.5);
    const choices = [correct].concat(pool.slice(0,3)).sort(() => Math.random() - 0.5);
    $("choiceArea").innerHTML = choices.map(choice => `<button type="button" class="choice" onclick="chooseAnswer(this,'${String(choice).replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,"&quot;")}')">${escapeHtml(choice)}</button>`).join("");
  }

  function audioWordsFinal(){
    let result = playlistWords("audioList");
    const order = $("audioOrder")?.value || "normal";
    if(order === "star")result = result.filter(word => word.saved);
    if(order === "due")result = result.filter(isDueSafe);
    if(order === "hard")result = result.filter(word => word.status === "hard" || Number(word.level || 3) <= 2);
    if(order === "random")result = shuffleFinal(result);
    return result;
  }

  function shuffleFinal(items){
    const out = items.slice();
    for(let i=out.length-1;i>0;i--){
      const j = Math.floor(Math.random() * (i+1));
      [out[i],out[j]] = [out[j],out[i]];
    }
    return out;
  }

  function startAudioFinal(){
    if(typeof stopAudio === "function")stopAudio();
    audioQueue = audioWordsFinal();
    if(!audioQueue.length)return toast("No words");
    audioIndex = 0;
    audioPaused = false;
    playAudioCurrent();
  }

  function playAudioOnceFinal(){
    const pool = audioWordsFinal();
    if(!pool.length)return toast("No words");
    const word = pool[Math.floor(Math.random() * pool.length)];
    if(typeof updateNow === "function")updateNow(word);
    if(typeof speakByPattern === "function")speakByPattern(word);
  }

  function searchText(word){
    const playlist = lists().find(list => list.id === word.listId);
    return [
      word.front,
      word.back,
      word.memo,
      word.example,
      word.pronunciation,
      word.tags,
      word.pos,
      word.gender,
      playlist?.name,
      langNameFixed(word.frontLang),
      langNameFixed(word.backLang)
    ].map(norm).join(" ");
  }

  function wordMatchesQuery(word,query){
    const q = norm(query);
    return !q || searchText(word).includes(q);
  }

  function renderLibraryFinal(){
    const mount = $("tn82LibraryMount");
    if(!mount)return false;
    const query = $("tnLibrarySearch")?.value || $("wordSearch")?.value || "";
    const language = $("tnFilterLanguage")?.value || "all";
    const playlist = $("tnFilterPlaylist")?.value || "all";
    const pos = $("tnFilterPos")?.value || "all";
    let result = words().filter(word => wordMatchesQuery(word,query));
    if(language !== "all")result = result.filter(word => word.frontLang === language || word.backLang === language);
    if(playlist !== "all")result = result.filter(word => word.listId === playlist);
    if(pos !== "all")result = result.filter(word => String(word.pos || "") === pos);
    const languages = [...new Set(LANGS_FIXED.map(item => item[0]).concat(words().flatMap(word => [word.frontLang,word.backLang]).filter(Boolean)))]
      .sort((a,b) => langIndex(a) - langIndex(b) || langNameFixed(a).localeCompare(langNameFixed(b)));
    const playlistOptions = lists().map(list => `<option value="${escapeHtml(list.id)}" ${playlist === list.id ? "selected" : ""}>${escapeHtml(list.name || "New Playlist")}</option>`).join("");
    const langOptions = languages.map(code => `<option value="${escapeHtml(code)}" ${language === code ? "selected" : ""}>${escapeHtml(langNameFixed(code))}</option>`).join("");
    const posValues = [...new Set(words().map(word => word.pos).filter(Boolean))].sort();
    const posOptions = posValues.map(value => `<option value="${escapeHtml(value)}" ${pos === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("");
    mount.innerHTML = `
      <div class="tn-library-shell">
        <div class="tn-library-tools">
          <input id="tnLibrarySearch" value="${escapeHtml(query)}" placeholder="Search">
          <div class="tn-library-filter-row">
            <select id="tnFilterLanguage"><option value="all">All languages</option>${langOptions}</select>
            <select id="tnFilterPlaylist"><option value="all">All playlists</option>${playlistOptions}</select>
            <select id="tnFilterPos"><option value="all">All POS</option>${posOptions}</select>
          </div>
        </div>
        <div class="tn82-library-summary">${result.length} word${result.length === 1 ? "" : "s"} shown</div>
        <div class="tn82-word-list">
          ${result.length ? result.map(word => `<div class="tn82-word-card" data-word-id="${escapeHtml(word.id)}"><div class="tn82-word-main"><div class="tn82-front">${escapeHtml(word.front)}</div><div class="tn82-back">${escapeHtml(word.back)}</div>${word.pronunciation ? `<div class="tn-word-example">${escapeHtml(word.pronunciation)}</div>` : ""}${word.memo ? `<div class="tn-word-example">${escapeHtml(word.memo)}</div>` : ""}</div><div class="tn82-word-meta"><span>${escapeHtml(lists().find(list => list.id === word.listId)?.name || "New Playlist")}</span><span>${escapeHtml(langNameFixed(word.frontLang))} -> ${escapeHtml(langNameFixed(word.backLang))}</span>${word.pos ? `<span>${escapeHtml(word.pos)}</span>` : ""}</div></div>`).join("") : `<div class="tn82-empty">No words found.</div>`}
        </div>
      </div>
    `;
    ["tnLibrarySearch","tnFilterLanguage","tnFilterPlaylist","tnFilterPos"].forEach(id => {
      const el = $(id);
      if(el && !el.__tnCriticalSearchBound){
        el.addEventListener(el.tagName === "INPUT" ? "input" : "change",renderLibraryFinal);
        el.__tnCriticalSearchBound = true;
      }
    });
    return true;
  }

  function installLibrarySearch(){
    window.tnLibraryRender = function(){
      renderLibraryFinal();
    };
    const oldRenderWords = window.renderWords;
    try{
      renderWords = function(){
        const q = $("wordSearch")?.value || "";
        if(q && $("wordsBox")){
          const result = words().filter(word => wordMatchesQuery(word,q));
          $("wordsBox").innerHTML = result.length ? result.map(word => `<div class="mobile-word-card"><div class="mobile-word-main"><div><div class="mobile-front">${escapeHtml(word.front)}</div><div class="mobile-back">${escapeHtml(word.back)}</div>${word.pronunciation ? `<div class="mobile-back">${escapeHtml(word.pronunciation)}</div>` : ""}</div></div><div class="mobile-meta"><span class="badge">${escapeHtml(langNameFixed(word.frontLang))}->${escapeHtml(langNameFixed(word.backLang))}</span></div></div>`).join("") : '<div class="empty">No words</div>';
          return;
        }
        if(typeof oldRenderWords === "function")oldRenderWords();
      };
    }catch(e){}
  }

  function stopModeTimersOnNavigation(){
    const oldGo = window.go;
    if(typeof oldGo === "function" && !oldGo.__tnCriticalWrapped){
      const wrapped = function(page){
        const normalized = {cards:"study",listen:"audio",create:"add",library:"words",settings:"manage"}[page] || page;
        if(normalized !== "study")stopFlashAutoFinal();
        if(normalized !== "audio" && typeof stopAudio === "function")try{ stopAudio(); }catch(e){}
        return oldGo.apply(this,arguments);
      };
      wrapped.__tnCriticalWrapped = true;
      window.go = wrapped;
    }
    const oldStableGo = window.tnEmergencyStableGo;
    if(typeof oldStableGo === "function" && !oldStableGo.__tnCriticalWrapped){
      const wrappedStable = function(page){
        if(page !== "cards" && page !== "study")stopFlashAutoFinal();
        if(page !== "listen" && page !== "audio" && typeof stopAudio === "function")try{ stopAudio(); }catch(e){}
        return oldStableGo.apply(this,arguments);
      };
      wrappedStable.__tnCriticalWrapped = true;
      window.tnEmergencyStableGo = wrappedStable;
    }
  }

  function installCriticalFixes(){
    installLanguageOrder();
    installInputImmutability();
    ensureModeSelects();
    installLibrarySearch();
    stopModeTimersOnNavigation();
    try{
      studyWords = studyWordsFinal;
      nextCard = nextCardFinal;
      startFlashAuto = startFlashAutoFinal;
      stopFlashAuto = stopFlashAutoFinal;
      playFlashAutoCycle = runFlashAutoCycle;
      quizPool = quizWordsFinal;
      startQuiz = startQuizFinal;
      tnFinalStartQuiz = startQuizFinal;
      renderChoices = renderChoicesFinal;
      audioWords = audioWordsFinal;
      startAudio = startAudioFinal;
      playAudioOnce = playAudioOnceFinal;
      langName = langNameFixed;
      placeholderFor = placeholderFixed;
      optionsHTML = optionsHTMLFixed;
      window.renderVoiceSettings = renderVoiceSettingsFinal;
    }catch(e){}
    const startQuizButton = [...document.querySelectorAll("#quizSetup button")].find(button => /start quiz/i.test(button.textContent || ""));
    if(startQuizButton){ startQuizButton.removeAttribute("onclick"); startQuizButton.onclick = startQuizFinal; }
    const autoButton = [...document.querySelectorAll("#pageStudy button")].find(button => /auto/i.test(button.textContent || ""));
    if(autoButton){ autoButton.removeAttribute("onclick"); autoButton.onclick = startFlashAutoFinal; }
    const stopButton = [...document.querySelectorAll("#pageStudy button")].find(button => /^stop$/i.test((button.textContent || "").trim()));
    if(stopButton){ stopButton.removeAttribute("onclick"); stopButton.onclick = stopFlashAutoFinal; }
    const audioStart = [...document.querySelectorAll("#pageAudio button")].find(button => /start/i.test(button.textContent || ""));
    if(audioStart){ audioStart.removeAttribute("onclick"); audioStart.onclick = startAudioFinal; }
    const audioOnce = [...document.querySelectorAll("#pageAudio button")].find(button => /once/i.test(button.textContent || ""));
    if(audioOnce){ audioOnce.removeAttribute("onclick"); audioOnce.onclick = playAudioOnceFinal; }
  }

  document.addEventListener("click",event => {
    const quizButton = event.target?.closest?.("#quizSetup button");
    if(quizButton && /start quiz/i.test(quizButton.textContent || "")){
      event.preventDefault();
      event.stopImmediatePropagation();
      startQuizFinal();
    }
    const autoButton = event.target?.closest?.("#pageStudy button");
    if(autoButton && /auto/i.test(autoButton.textContent || "")){
      event.preventDefault();
      event.stopImmediatePropagation();
      startFlashAutoFinal();
    }
  },true);

  if(document.readyState === "loading")document.addEventListener("DOMContentLoaded",installCriticalFixes);
  else installCriticalFixes();
  setTimeout(installCriticalFixes,500);
  setInterval(installCriticalFixes,1200);
})();
