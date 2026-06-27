(function(){
  "use strict";

  const $ = id => document.getElementById(id);
  const clean = v => String(v ?? "").trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,"").trim();
  const esc = v => String(v ?? "").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
  const key = v => clean(v).toLowerCase();
  const val = id => clean($(id)?.value || "");
  const toast = msg => { try{ (window.tnStableToast || window.tn82Toast || window.toast || console.log)(msg); }catch(e){} };
  const data = () => { try{ return db; }catch(e){ return window.db || {lists:[],words:[],prefs:{}}; } };
  const persist = () => {
    try{ if(typeof window.tnSafePersistOnly === "function")window.tnSafePersistOnly(); else if(typeof window.tn82Persist === "function")window.tn82Persist(); else if(typeof window.persist === "function")window.persist(); }catch(e){}
    try{ if(typeof window.tnUpdateHeaderCountsOnly === "function")window.tnUpdateHeaderCountsOnly(); else if(typeof window.tn82UpdateCounts === "function")window.tn82UpdateCounts(); }catch(e){}
  };
  const uid = () => "w_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,8);
  const plusDays = n => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0,10);
  };

  function bindPlaceholders(){
    const bulk = $("bulkText");
    if(bulk)bulk.placeholder = "front word\tback meaning\tPOS\tgender\texample sentence\tpronunciation";
    const pron = $("pronunciation");
    if(pron && !pron.placeholder)pron.placeholder = "kànjiàn / əˈbaʊt";
    const editPron = $("editPronunciation");
    if(editPron && !editPron.placeholder)editPron.placeholder = "kànjiàn / əˈbaʊt";
  }

  function selected(id,fallback){
    const el = $(id);
    return el && el.value ? el.value : fallback;
  }

  function addWordFinal(event){
    event?.preventDefault?.();
    const dbRef = data();
    dbRef.words = Array.isArray(dbRef.words) ? dbRef.words : [];
    dbRef.lists = Array.isArray(dbRef.lists) && dbRef.lists.length ? dbRef.lists : [{id:"starter",name:"New Playlist"}];
    const front = val("front");
    const back = val("back");
    if(!front || !back){ toast("Front and Back are required"); return false; }
    let listId = selected("addList",dbRef.lists[0].id);
    if(!dbRef.lists.some(list => list.id === listId))listId = dbRef.lists[0].id;
    dbRef.words.push({
      id:uid(),
      front,
      back,
      listId,
      frontLang:selected("frontLang",dbRef.prefs?.frontLang || "en-US"),
      backLang:selected("backLang",dbRef.prefs?.backLang || "ja-JP"),
      pos:selected("pos",""),
      gender:selected("gender",""),
      pronunciation:val("pronunciation"),
      tags:val("tags"),
      memo:val("memo"),
      saved:false,
      status:"new",
      seen:0,
      level:1,
      nextReview:plusDays(1),
      createdAt:new Date().toISOString()
    });
    ["front","back","memo","tags","pronunciation"].forEach(id => { const el=$(id); if(el)el.value=""; });
    ["pos","gender"].forEach(id => { const el=$(id); if(el)el.value=""; });
    persist();
    try{ if(typeof window.tnLibraryRender === "function")window.tnLibraryRender(); else if(typeof window.renderWords === "function")window.renderWords(); }catch(e){}
    try{ if(typeof window.tn82RenderPlaylistSelects === "function")window.tn82RenderPlaylistSelects(); }catch(e){}
    try{ if(typeof window.tn82CloudSaveSoon === "function")window.tn82CloudSaveSoon(); }catch(e){}
    toast("1 word added");
    return false;
  }

  function bindAdd(){
    window.tnRegisterWordCritical = addWordFinal;
    window.addWord = addWordFinal;
    window.registerWord = addWordFinal;
    let btn = $("addWordBtn") || [...document.querySelectorAll("button")].find(b => (b.textContent || "").includes("Register"));
    if(!btn)return;
    if(!btn.__tnFinalCloned && btn.parentNode){
      const clone = btn.cloneNode(true);
      clone.__tnFinalCloned = true;
      btn.parentNode.replaceChild(clone,btn);
      btn = clone;
    }
    btn.id = "addWordBtn";
    btn.type = "button";
    btn.removeAttribute("onclick");
    btn.onclick = addWordFinal;
    if(!btn.__tnFinalAddCapture){
      btn.addEventListener("click",event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        addWordFinal(event);
      },true);
      btn.__tnFinalAddCapture = true;
    }
  }

  function splitLine(line){
    const raw = clean(line);
    if(!raw)return [];
    if(raw.includes("\t"))return raw.split("\t").map(clean);
    if(raw.includes(","))return raw.split(",").map(clean);
    const multi = raw.split(/\s{2,}/).map(clean).filter(Boolean);
    if(multi.length >= 2)return multi;
    return raw.split(/\s+/).map(clean).filter(Boolean);
  }

  function parseBulkFinal(text){
    return String(text || "").split(/\r?\n/).map((line,i)=>({line:clean(line),row:i+1})).filter(item => item.line).map(({line,row}) => {
      let before = line;
      let pipeExample = "";
      if(line.includes("|")){
        const pieces = line.split("|");
        before = pieces.shift().trim();
        pipeExample = pieces.join("|").trim();
      }
      const parts = splitLine(before);
      let front="",back="",pos="",gender="",memo="",pronunciation="";
      if(parts.length >= 6){ front=parts[0]; back=parts[1]; pos=parts[2]; gender=parts[3]; memo=parts[4]; pronunciation=parts.slice(5).join(" "); }
      else if(parts.length === 5){ front=parts[0]; back=parts[1]; pos=parts[2]; gender=parts[3]; memo=parts[4]; }
      else if(parts.length === 4){ front=parts[0]; back=parts[1]; pos=parts[2]; gender=parts[3]; }
      else if(parts.length === 3){ front=parts[0]; back=parts[1]; pos=parts[2]; }
      else if(parts.length === 2){ front=parts[0]; back=parts[1]; }
      if(pipeExample)memo = memo ? `${memo} | ${pipeExample}` : pipeExample;
      return {row,front:clean(front),back:clean(back),pos:clean(pos),gender:clean(gender),memo:clean(memo),pronunciation:clean(pronunciation)};
    }).filter(row => row.front && row.back);
  }

  function duplicateMatch(row,listId){
    return (data().words || []).find(word => word.listId === listId && key(word.front) === key(row.front) && key(word.back) === key(row.back) && key(word.pos) === key(row.pos));
  }
  function softDuplicateMatch(row,listId){
    return (data().words || []).find(word => word.listId === listId && key(word.front) === key(row.front));
  }
  function bulkRowsFinal(){
    const listId = selected("bulkList",data().lists?.[0]?.id || "starter");
    const seenFront = new Set();
    const seenExact = new Set();
    return parseBulkFinal($("bulkText")?.value || "").map(row => {
      const frontKey = key(row.front);
      const exactKey = [row.front,row.back,row.pos].map(key).join("||");
      const existingExact = duplicateMatch(row,listId);
      const existingFront = softDuplicateMatch(row,listId);
      const pastedFront = seenFront.has(frontKey);
      const pastedExact = seenExact.has(exactKey);
      seenFront.add(frontKey);
      seenExact.add(exactKey);
      return {...row,duplicate:!!existingExact || pastedExact,frontDuplicate:!!existingFront || pastedFront,duplicateReason:existingExact?"Already exists":pastedExact?"Duplicate in pasted text":existingFront?"Same front already exists":pastedFront?"Same front in pasted text":""};
    });
  }
  function bulkBox(){
    let box = $("bulkPreview");
    if(!box){
      box = document.createElement("div");
      box.id = "bulkPreview";
      box.className = "bulk-preview";
      ($("bulkText")?.closest(".card") || document.body).appendChild(box);
    }
    return box;
  }
  function previewBulkFinal(){
    const box = bulkBox();
    const rows = bulkRowsFinal();
    box.style.display = "block";
    if(!rows.length){ box.innerHTML = '<div class="bulk-empty">No readable rows. Use: Front / Back / POS / Gender / Example / Pronunciation</div>'; return; }
    const frontDupCount = rows.filter(row => row.frontDuplicate).length;
    const exactDupCount = rows.filter(row => row.duplicate).length;
    box.innerHTML = `
      ${frontDupCount ? `<div class="bulk-warning"><b>${frontDupCount} possible duplicate${frontDupCount>1?"s":""}</b><span>Choose how to import them below.</span></div>` : ""}
      <div class="bulk-summary"><span>${rows.length} readable rows</span><span>${frontDupCount} possible duplicates</span><span>${exactDupCount} exact duplicates</span></div>
      <div class="bulk-table-wrap"><table class="bulk-table"><thead><tr><th>#</th><th>Front</th><th>Back</th><th>POS</th><th>Gender</th><th>Example</th><th>Pronunciation</th><th>Status</th></tr></thead><tbody>
        ${rows.map(row => `<tr class="${row.frontDuplicate?"dup-row":""}"><td>${row.row}</td><td><b>${esc(row.front)}</b></td><td>${esc(row.back)}</td><td>${esc(row.pos || "-")}</td><td>${esc(row.gender || "-")}</td><td>${esc(row.memo)}</td><td>${esc(row.pronunciation)}</td><td>${row.frontDuplicate ? `<span class="badge yellow">${esc(row.duplicateReason || "Possible duplicate")}</span>` : `<span class="badge green">Ready</span>`}</td></tr>`).join("")}
      </tbody></table></div>
      ${frontDupCount ? `<div class="bulk-review-actions"><button class="btn primary small" onclick="bulkImport('addBoth')">Import all</button><button class="btn small" onclick="bulkImport('skip')">Skip duplicates</button><button class="btn small" onclick="bulkImport('replace')">Replace same front</button></div>` : ""}
    `;
  }
  function clearBulkPreviewFinal(){
    const box = bulkBox();
    box.style.display = "none";
    box.innerHTML = "";
  }
  function bulkImportFinal(mode){
    let rows = bulkRowsFinal();
    const dbRef = data();
    dbRef.words = Array.isArray(dbRef.words) ? dbRef.words : [];
    const listId = selected("bulkList",dbRef.lists?.[0]?.id || "starter");
    const frontLang = selected("bulkFrontLang","en-US");
    const backLang = selected("bulkBackLang","ja-JP");
    if(!rows.length){ previewBulkFinal(); toast("No readable words"); return; }
    if(rows.some(row => row.frontDuplicate) && !mode){ previewBulkFinal(); toast("Duplicate check needs your choice"); return; }
    if(mode === "skip")rows = rows.filter(row => !row.frontDuplicate && !row.duplicate);
    let added = 0, replaced = 0;
    const assign = (word,row) => Object.assign(word,{front:row.front,back:row.back,pos:row.pos,gender:row.gender,memo:row.memo,pronunciation:row.pronunciation,frontLang,backLang,listId});
    if(mode === "replace"){
      rows.forEach(row => {
        const existing = softDuplicateMatch(row,listId);
        if(existing){ assign(existing,row); replaced++; }
        else{ dbRef.words.push({id:uid(),front:row.front,back:row.back,pos:row.pos,gender:row.gender,memo:row.memo,pronunciation:row.pronunciation,frontLang,backLang,listId,tags:"",saved:false,status:"new",seen:0,level:1,nextReview:plusDays(1),createdAt:new Date().toISOString()}); added++; }
      });
    }else{
      const seen = new Set();
      rows.filter(row => { const k = [row.front,row.back,row.pos].map(key).join("||"); if(seen.has(k))return false; seen.add(k); return true; }).forEach(row => {
        dbRef.words.push({id:uid(),front:row.front,back:row.back,pos:row.pos,gender:row.gender,memo:row.memo,pronunciation:row.pronunciation,frontLang,backLang,listId,tags:"",saved:false,status:"new",seen:0,level:1,nextReview:plusDays(1),createdAt:new Date().toISOString()});
        added++;
      });
    }
    if($("bulkText"))$("bulkText").value = "";
    clearBulkPreviewFinal();
    persist();
    try{ if(typeof window.tnLibraryRender === "function")window.tnLibraryRender(); else if(typeof window.renderWords === "function")window.renderWords(); }catch(e){}
    toast(replaced ? `${added} added, ${replaced} replaced` : `${added} added`);
  }

  function startQuizFinal(){
    if(typeof window.clearQuizTimers === "function")window.clearQuizTimers();
    if(typeof window.ensureQuizFeedbackDefault === "function")window.ensureQuizFeedbackDefault();
    const dbRef = data();
    const list = $("quizList")?.value;
    const scope = $("quizScope")?.value || "all";
    const today = new Date().toISOString().slice(0,10);
    let words = (dbRef.words || []).filter(word => !list || word.listId === list);
    if(scope === "hard")words = words.filter(word => (Number(word.level || 3) <= 2) || word.status === "hard" || word.lastWrongAt);
    if(scope === "due")words = words.filter(word => word.status === "hard" || (word.nextReview && word.nextReview <= today));
    if(scope === "star")words = words.filter(word => word.saved);
    let requested = parseInt($("quizCount")?.value || "10",10) || 10;
    requested = Math.max(1,requested);
    if(!words.length){ toast("No words"); return; }
    const allow = !!$("quizAllowDuplicates")?.checked;
    let actual = Math.min(requested,words.length);
    let ordered = typeof window.quizAdaptiveOrder === "function" ? window.quizAdaptiveOrder(words) : [...words];
    let queue = ordered.slice(0,actual);
    if(allow && requested > words.length){
      while(queue.length < requested){
        const next = typeof window.quizAdaptiveOrder === "function" ? window.quizAdaptiveOrder(words) : [...words];
        queue = queue.concat(next.slice(0,requested - queue.length));
      }
      actual = requested;
    }else if(requested > words.length){
      toast(`Only ${actual} words available`);
    }
    quiz = {queue,wrong:[],allWrong:[],index:0,score:0,current:null,answered:false,type:$("quizType")?.value || "choice",direction:$("quizDirection")?.value || "front",total:actual,previousQuestionId:"",previousQuestionKey:"",selectedAnswer:""};
    if($("quizSetup"))$("quizSetup").style.display = "none";
    if($("quizRun"))$("quizRun").style.display = "block";
    if($("quizEnd"))$("quizEnd").style.display = "none";
    window.showQuizQuestion();
  }
  function quizFeedbackHtmlFinal(){
    return `<button type="button" class="quiz-next-btn" onclick="nextQuizQuestion()">Next</button>`;
  }
  function renderQuizQuestionAnswerFinal(ok){
    const box = $("quizQuestionAnswer");
    if(!box || !quiz?.current)return;
    const answer = window.correctAnswer();
    const pronunciation = clean(quiz.current.pronunciation || "");
    const card = document.querySelector(".quiz-question");
    if(card){ card.classList.add("is-answered"); card.classList.toggle("has-long-answer",String(answer).length > 32 || pronunciation.length > 32); }
    box.className = `quiz-question-answer show ${ok ? "ok" : "no"}`;
    box.innerHTML = `<div class="quiz-answer-block"><span>Correct answer</span><strong>${esc(answer)}</strong></div><div class="quiz-answer-block"><span>Pronunciation</span><strong>${pronunciation ? esc(pronunciation) : "-"}</strong></div><div class="quiz-answer-status ${ok ? "ok" : "no"}">${ok ? "Correct" : "Incorrect"}</div>`;
  }
  function finishAnswerFinal(ok){
    const q = quiz;
    if(q.answered)return;
    q.answered = true;
    q.previousQuestionId = q.current?.id || q.previousQuestionId;
    q.previousQuestionKey = window.quizQuestionKey(q.current) || q.previousQuestionKey;
    clearInterval(quizTimerInterval);
    if(ok){
      q.score++;
      window.updateWordLearning(q.current.id,"learned");
      $("quizResult").className = "result-box show ok";
      $("quizResult").innerHTML = quizFeedbackHtmlFinal(true);
    }else{
      window.updateWordLearning(q.current.id,"hard");
      $("quizResult").className = "result-box show no";
      $("quizResult").innerHTML = quizFeedbackHtmlFinal(false);
      q.wrong.push(q.current);
      if(!q.allWrong.some(word => word.id === q.current.id))q.allWrong.push(q.current);
    }
    renderQuizQuestionAnswerFinal(ok);
    $("quizScore").textContent = q.score + " / " + q.total;
    if($("quizAudioAfter")?.value === "on")setTimeout(()=>{ try{ window.speakQuizFront(); }catch(e){} },80);
    if(window.isAutoAdvance())window.scheduleNext(ok);
  }

  function install(){
    bindPlaceholders();
    bindAdd();
    if(!window.__tnFinalAddDocumentCapture){
      document.addEventListener("click",event => {
        const button = event.target?.closest?.("#addWordBtn");
        if(!button)return;
        event.preventDefault();
        event.stopImmediatePropagation();
        addWordFinal(event);
      },true);
      window.__tnFinalAddDocumentCapture = true;
    }
    if(!window.__tnFinalQuizDocumentCapture){
      document.addEventListener("click",event => {
        const button = event.target?.closest?.("#quizSetup button");
        if(!button || !/start quiz/i.test(button.textContent || ""))return;
        event.preventDefault();
        event.stopImmediatePropagation();
        startQuizFinal();
      },true);
      window.__tnFinalQuizDocumentCapture = true;
    }
    window.parseBulk = parseBulkFinal;
    window.bulkRows = bulkRowsFinal;
    window.previewBulk = previewBulkFinal;
    window.bulkImport = bulkImportFinal;
    window.clearBulkPreview = clearBulkPreviewFinal;
    window.startQuiz = startQuizFinal;
    window.tnFinalStartQuiz = startQuizFinal;
    window.quizFeedbackHtml = quizFeedbackHtmlFinal;
    window.renderQuizQuestionAnswer = renderQuizQuestionAnswerFinal;
    window.finishAnswer = finishAnswerFinal;
    const startButton = [...document.querySelectorAll("#quizSetup button")].find(button => /start quiz/i.test(button.textContent || ""));
    if(startButton){
      startButton.removeAttribute("onclick");
      startButton.onclick = startQuizFinal;
    }
  }

  if(document.readyState === "loading")document.addEventListener("DOMContentLoaded",install);
  else install();
  setTimeout(install,300);
  setInterval(install,250);
})();
