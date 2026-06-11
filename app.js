
/* ===== TangoNest Supabase Config - Beta51 ===== */
window.TANGONEST_SUPABASE_URL = "https://bkbteylavujkfiwuqwdq.supabase.co";
window.TANGONEST_SUPABASE_KEY = "sb_publishable_UKX5qCXkbIRac4cc62_LXw_yEGDG6BZ";
var TANGONEST_SUPABASE_URL = window.TANGONEST_SUPABASE_URL;
var TANGONEST_SUPABASE_KEY = window.TANGONEST_SUPABASE_KEY;


function showAccountPage(){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  const account=document.getElementById("pageAccount");
  if(account)account.classList.add("active");
  document.querySelectorAll(".nav button").forEach(b=>b.classList.remove("active"));
  [...document.querySelectorAll(".nav button")].find(b=>b.textContent.trim()==="Account")?.classList.add("active");
  if(typeof rememberCurrentSession==="function")rememberCurrentSession("account");
}


function appShow(pageId){
  if(pageId==='account'){showAccountPage();return;}
  if(typeof go==="function"){go(pageId);return;}
  if(typeof showPage==="function"){showPage(pageId);return;}
  const target=document.querySelector(`[data-page="${pageId}"]`);
  if(target)target.click();
}

// TangoNest Split Edition - app.js

const KEY="vocabrise_production_stable_v1";
const LEGACY_KEYS=[
  "vocabrise_stable_reset_v32",
  "vocabrise_beta34",
  "vocabrise_beta33",
  "vocabrise_beta32",
  "vocabrise_beta31",
  "vocabrise_beta30",
  "vocabrise_beta29",
  "vocabrise_beta28",
  "vocabrise_beta27",
  "vocabrise_beta26",
  "vocabrise_beta25",
  "vocabrise_beta24",
  "vocabrise_beta23",
  "vocabrise_beta22",
  "vocabrise_beta21",
  "vocabrise_beta20",
  "vocabrise_beta19",
  "vocabrise_beta18"
];
function loadTangoNestDB(){
  const current=localStorage.getItem(KEY);
  if(current){
    try{return JSON.parse(current)}catch(e){}
  }
  let best=null,bestCount=-1,bestKey="";
  const keys=[...LEGACY_KEYS];
  for(let i=0;i<localStorage.length;i++){
    const k=localStorage.key(i);
    if(k&&k.toLowerCase().includes("vocabrise")&&!keys.includes(k))keys.push(k);
  }
  keys.forEach(k=>{
    try{
      const raw=localStorage.getItem(k);
      if(!raw)return;
      const parsed=JSON.parse(raw);
      if(parsed&&Array.isArray(parsed.words)&&Array.isArray(parsed.lists)){
        const count=parsed.words.length;
        if(count>bestCount){best=parsed;bestCount=count;bestKey=k;}
      }
    }catch(e){}
  });
  if(best){
    localStorage.setItem(KEY,JSON.stringify(best));
    console.log("TangoNest migrated data from",bestKey);
    return best;
  }
  return {ui:"en",prefs:{frontLang:"fr-FR",backLang:"en-US"},lists:[{id:"starter",name:"New Playlist"}],words:[]};
}
const LANGS=[
  ["fr-FR","French","pomme"],["en-US","English","apple"],["ja-JP","Japanese","りんご"],["ko-KR","Korean","사과"],["zh-CN","Chinese Simplified","苹果"],["zh-TW","Chinese Traditional","蘋果"],["es-ES","Spanish","manzana"],["ar-SA","Arabic","تفاحة"],["it-IT","Italian","mela"],["de-DE","German","Apfel"],["pt-BR","Portuguese","maçã"],["ru-RU","Russian","яблоко"],["nl-NL","Dutch","appel"],["vi-VN","Vietnamese","táo"],["th-TH","Thai","แอปเปิล"],["tr-TR","Turkish","elma"],["hi-IN","Hindi","सेब"],["id-ID","Indonesian","apel"],["el-GR","Greek","μήλο"],["he-IL","Hebrew","תפוח"]
];
let db=loadTangoNestDB();
db.prefs=db.prefs||{frontLang:"fr-FR",backLang:"en-US"};db.lists=db.lists&&db.lists.length?db.lists:[{id:"starter",name:"New Playlist"}];db.words=db.words||[];
let current=null,flipped=false,timer=null,flashTimers=[],audioTimer=null,audioQueue=[],audioIndex=0,audioPaused=false,selectedIds=new Set();
let quiz={queue:[],wrong:[],allWrong:[],index:0,score:0,current:null,answered:false,type:"choice",direction:"front",total:0};let quizAutoTimer=null,quizTimerInterval=null,quizQuestionStartedAt=0;
const $=id=>document.getElementById(id);
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2);
const today=()=>new Date().toISOString().slice(0,10);
function addDays(n){let d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
function isDue(w){return !!w.nextReview&&w.nextReview<=today()}
function save(renderUI=true){localStorage.setItem(KEY,JSON.stringify(db));if(renderUI)render()}
function persist(){localStorage.setItem(KEY,JSON.stringify(db))}
function toast(m){$("toast").textContent=m;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),1700)}
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
function escAttr(s){return String(s??"").replace(/\\/g,"\\\\").replace(/'/g,"\\'").replace(/"/g,'&quot;')}
function cap(s){return s[0].toUpperCase()+s.slice(1)}
function langName(c){return (LANGS.find(l=>l[0]===c)||[c,c])[1]}
function placeholderFor(c){return (LANGS.find(l=>l[0]===c)||["","", "apple"])[2]}
function optionsHTML(selected){return LANGS.map(l=>`<option value="${l[0]}" ${l[0]===selected?"selected":""}>${l[1]}</option>`).join("")}
function fillLangSelects(){["frontLang","bulkFrontLang","editFrontLang"].forEach(id=>{if($(id))$(id).innerHTML=optionsHTML(db.prefs.frontLang)});["backLang","bulkBackLang","editBackLang"].forEach(id=>{if($(id))$(id).innerHTML=optionsHTML(db.prefs.backLang)});updatePlaceholders();attachLangMemory()}
function attachLangMemory(){["frontLang","backLang","bulkFrontLang","bulkBackLang"].forEach(id=>{let el=$(id);if(el&&!el.dataset.attached){el.addEventListener("change",()=>{if(id.includes("Front"))db.prefs.frontLang=el.value;else if(id.includes("Back"))db.prefs.backLang=el.value;else if(id==="frontLang")db.prefs.frontLang=el.value;else if(id==="backLang")db.prefs.backLang=el.value;persist();updatePlaceholders()});el.dataset.attached=1}})}
function updatePlaceholders(){if($("front"))$("front").placeholder=placeholderFor($("frontLang").value);if($("back"))$("back").placeholder=placeholderFor($("backLang").value)}
function detectLang(t){
  const s=String(t||"").trim().toLowerCase();
  if(/[؀-ۿ]/.test(s))return"ar-SA";
  if(/[֐-׿]/.test(s))return"he-IL";
  if(/[ऀ-ॿ]/.test(s))return"hi-IN";
  if(/[ก-๿]/.test(s))return"th-TH";
  if(/[가-힣]/.test(s))return"ko-KR";
  if(/[ぁ-んァ-ン]/.test(s))return"ja-JP";
  if(/[一-龯]/.test(s))return"zh-CN";
  if(/[а-яё]/i.test(s))return"ru-RU";
  if(/[α-ωάέήίόύώϊϋΐΰ]/i.test(s))return"el-GR";
  if(/[àâçéèêëîïôûùüÿœæ]/i.test(s))return"fr-FR";
  if(/[äöüß]/i.test(s))return"de-DE";
  if(/[ãõ]/i.test(s))return"pt-BR";
  if(/[áéíóúñ¿¡]/i.test(s))return"es-ES";
  if(/[ăâđêôơư]/i.test(s))return"vi-VN";
  const dict={pomme:"fr-FR",bonjour:"fr-FR",merci:"fr-FR",mela:"it-IT",ciao:"it-IT",apfel:"de-DE",hallo:"de-DE","maçã":"pt-BR","olá":"pt-BR",manzana:"es-ES",hola:"es-ES",appel:"nl-NL",elma:"tr-TR",apel:"id-ID"};
  return dict[s]||"en-US";
}
function autoDetectFront(){let t=$("front").value.trim();if(t){$("frontLang").value=detectLang(t);db.prefs.frontLang=$("frontLang").value;persist();updatePlaceholders()}}
function autoDetectBack(){let t=$("back").value.trim();if(t){$("backLang").value=detectLang(t);db.prefs.backLang=$("backLang").value;persist();updatePlaceholders()}}
function renderSelect(id,all=false){let el=$(id);if(!el)return;let v=el.value;el.innerHTML="";if(all){let o=document.createElement("option");o.value="all";o.textContent="All";el.appendChild(o)}db.lists.forEach(l=>{let o=document.createElement("option");o.value=l.id;o.textContent=l.name;el.appendChild(o)});if([...el.options].some(o=>o.value===v))el.value=v;else if(all)el.value="all"}
function go(p){["home","add","words","study","quiz","audio","manage"].forEach(x=>{let page=$("page"+cap(x)),nav=$("nav"+cap(x)),mnav=$("mnav"+cap(x));if(page)page.classList.toggle("active",x===p);if(nav)nav.classList.toggle("active",x===p);if(mnav)mnav.classList.toggle("active",x===p)});if(p==="quiz")resetQuiz();render()}

function listWords(listId){
  return db.words.filter(w=>w.listId===listId);
}
function playlistLangMeta(listId){
  const words=listWords(listId);
  if(!words.length)return "No words yet";
  const first=words[0];
  const front=langName(first.frontLang)||first.frontLang||"Front";
  const back=langName(first.backLang)||first.backLang||"Back";
  return `${front} → ${back}`;
}
function activeListId(){
  const selectors=["quizList","cardList","audioList","listFilter","bulkList","addList"];
  for(const id of selectors){
    const el=$(id);
    if(el&&el.value)return el.value;
  }
  return db.lists[0]?.id||"starter";
}
function updateBrandContext(){
  const total=db.words.length;
  const learned=db.words.filter(w=>w.status==="learned").length;
  const listId=activeListId();
  const list=db.lists.find(l=>l.id===listId)||db.lists[0]||{id:"starter",name:"New Playlist"};
  const words=listWords(list.id);
  const meta=playlistLangMeta(list.id);
  if($("heroWords"))$("heroWords").textContent=total;
  if($("heroLists"))$("heroLists").textContent=db.lists.length;
  if($("heroLearned"))$("heroLearned").textContent=learned;
  if($("heroPlaylistName"))$("heroPlaylistName").textContent=list.name;
  if($("heroPlaylistMeta"))$("heroPlaylistMeta").textContent=`${meta} · ${words.length} words`;
  if($("contextPlaylistName"))$("contextPlaylistName").textContent=list.name;
  if($("contextPlaylistMeta"))$("contextPlaylistMeta").textContent=`${meta} · ${words.length} words`;
  if($("heroPhoneDeck"))$("heroPhoneDeck").textContent=list.name;
  if($("heroPhoneMeta"))$("heroPhoneMeta").textContent=`${meta} · ${words.length} words`;
}
function goStudy(listId,mode){
  ["quizList","cardList","audioList","listFilter"].forEach(id=>{const el=$(id);if(el)el.value=listId;});
  if(mode==="quiz")showPage("quiz");
  else if(mode==="audio")showPage("audio");
  else if(mode==="cards")showPage("cards");
  else showPage("list");
  updateBrandContext();
}

function render(){fillLangSelects();["addList","bulkList","studyList","quizList","audioList","renameListSelect","editList"].forEach(id=>renderSelect(id,false));renderSelect("wordListSelect",true);renderHome();renderWords();renderManage();updateStudyStar()}
function renderHome(){
  $("totalWords").textContent=db.words.length;
  $("totalLists").textContent=db.lists.length;
  $("totalLearned").textContent=db.words.filter(w=>w.status==="learned").length;
  $("totalHard").textContent=db.words.filter(w=>w.status==="hard").length;
  $("dashTotal").textContent=db.words.length;
  $("dashLearned").textContent=Math.round((db.words.filter(w=>w.status==="learned").length/Math.max(1,db.words.length))*100)+"%";
  $("dashDue").textContent=dueWords().length;
  $("dashHard").textContent=db.words.filter(w=>w.status==="hard").length;
  $("homeLists").innerHTML=db.lists.map(l=>{
    const ws=listWords(l.id);
    const meta=playlistLangMeta(l.id);
    const learned=ws.filter(w=>w.status==="learned").length;
    const hard=ws.filter(w=>w.status==="hard").length;
    return `<div class="playlist-card">
      <div class="playlist-main">
        <div class="playlist-icon">${esc(l.name.slice(0,1).toUpperCase())}</div>
        <div>
          <b>${esc(l.name)}</b>
          <span>${esc(meta)} · ${ws.length} words</span>
        </div>
      </div>
      <div class="playlist-stats">
        <span>${learned} learned</span>
        <span>${hard} hard</span>
      </div>
      <div class="playlist-actions">
        <button class="btn small primary" onclick="goStudy('${l.id}','quiz')">Quiz</button>
        <button class="btn small" onclick="goStudy('${l.id}','cards')">Cards</button>
        <button class="btn small" onclick="goStudy('${l.id}','audio')">Listen</button>
      </div>
    </div>`
  }).join("")||'<div class="empty">No playlists yet</div>';
  updateBrandContext();
}

/* =========================================================
   Beta53 Bulk Add Parser Fix
   Supports:
   - tab separated: front back pos gender example
   - comma separated
   - multi-space separated
   - "front back pos gender pinyin | example" style
========================================================= */
function cleanBulkValue(v){
  return String(v ?? "").trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,"").trim();
}

function splitBulkLine(line){
  const raw=String(line||"").trim();
  if(!raw)return [];
  if(raw.includes("\t"))return raw.split("\t").map(cleanBulkValue);
  if(raw.includes(","))return raw.split(",").map(cleanBulkValue);
  // Prefer 2+ spaces as column separators.
  let parts=raw.split(/\s{2,}/).map(cleanBulkValue).filter(Boolean);
  if(parts.length>=2)return parts;
  // Fallback: normal whitespace. This is useful for Chinese/Japanese rows with compact columns.
  return raw.split(/\s+/).map(cleanBulkValue).filter(Boolean);
}

function parseBulk(text){
  return String(text||"")
    .split(/\r?\n/)
    .map((line,i)=>({line:String(line||"").trim(),row:i+1}))
    .filter(x=>x.line)
    .map(({line,row})=>{
      let exampleFromPipe="";
      let before=line;
      if(line.includes("|")){
        const pieces=line.split("|");
        before=pieces.shift().trim();
        exampleFromPipe=pieces.join("|").trim();
      }

      let parts=splitBulkLine(before);
      let front="",back="",pos="",gender="",memo="";

      if(parts.length>=5){
        front=parts[0];
        back=parts[1];
        pos=parts[2];
        gender=parts[3];
        memo=parts.slice(4).join(" ");
      }else if(parts.length===4){
        front=parts[0];
        back=parts[1];
        pos=parts[2];
        gender=parts[3];
      }else if(parts.length===3){
        front=parts[0];
        back=parts[1];
        pos=parts[2];
      }else if(parts.length===2){
        front=parts[0];
        back=parts[1];
      }else{
        front=line;
      }

      if(exampleFromPipe){
        memo = memo ? `${memo} | ${exampleFromPipe}` : exampleFromPipe;
      }

      return {
        row,
        front:cleanBulkValue(front),
        back:cleanBulkValue(back),
        pos:cleanBulkValue(pos),
        gender:cleanBulkValue(gender),
        memo:cleanBulkValue(memo)
      };
    })
    .filter(r=>r.front && r.back);
}

function duplicateMatch(row,listId){
  const f=String(row.front||"").trim().toLowerCase();
  const b=String(row.back||"").trim().toLowerCase();
  const p=String(row.pos||"").trim().toLowerCase();
  return db.words.find(w=>
    w.listId===listId &&
    String(w.front||"").trim().toLowerCase()===f &&
    String(w.back||"").trim().toLowerCase()===b &&
    String(w.pos||"").trim().toLowerCase()===p
  );
}

function setBulkMessage(message,type="info"){
  let box=$("bulkPreview");
  if(!box)return;
  box.style.display="block";
  const cls=type==="error"?"badge red":type==="success"?"badge green":"badge";
  box.innerHTML=`<p><span class="${cls}">${esc(message)}</span></p>` + (box.innerHTML||"");
}

function softDuplicateMatch(row,listId){
  const f=String(row.front||"").trim().toLowerCase();
  return db.words.find(w=>w.listId===listId && String(w.front||"").trim().toLowerCase()===f);
}
function bulkRows(){
  let listId=$("bulkList").value,seenExact=new Set(),seenFront=new Set();
  return parseBulk($("bulkText").value).map(r=>{
    let exactKey=[r.front,r.back,r.pos].map(x=>String(x||"").trim().toLowerCase()).join("||");
    let frontKey=String(r.front||"").trim().toLowerCase();
    let exactDuplicate=!!duplicateMatch(r,listId)||seenExact.has(exactKey);
    let frontDuplicate=!!softDuplicateMatch(r,listId)||seenFront.has(frontKey);
    seenExact.add(exactKey);
    seenFront.add(frontKey);
    return{...r,duplicate:exactDuplicate,frontDuplicate,existing:softDuplicateMatch(r,listId)||null};
  });
}
function clearBulkPreview(){
  let b=$("bulkPreview");if(b){b.style.display="none";b.innerHTML=""}
  let d=$("bulkDuplicatePanel");if(d){d.classList.remove("show");d.innerHTML=""}
}
function renderDuplicatePanel(rows){
  const panel=$("bulkDuplicatePanel");
  if(!panel)return;
  const dup=rows.filter(r=>r.frontDuplicate);
  if(!dup.length){panel.classList.remove("show");panel.innerHTML="";return;}
  panel.classList.add("show");
  panel.innerHTML=`<div class="dup-title">Duplicate front words found: ${dup.length}</div>
  <p class="desc">Frontが同じ単語があります。自動スキップせず、下のボタンで登録方法を選んでください。</p>
  <div class="dup-list">`+dup.map(r=>{
    let ex=r.existing;
    return `<div class="dup-item"><b>${esc(r.front)}</b>
      <span class="badge">New: ${esc(r.back)} / ${esc(r.pos||"—")}</span>
      ${ex?`<span class="badge yellow">Existing: ${esc(ex.back)} / ${esc(ex.pos||"—")}</span>`:"<span class='badge'>Duplicate in pasted rows</span>"}
    </div>`
  }).join("")+`</div>
  <div class="dup-actions">
    <button class="btn red" onclick="bulkImport('skip')">Skip Exact Duplicates</button>
    <button class="btn green" onclick="bulkImport('addBoth')">Add Both</button>
    <button class="btn blue" onclick="bulkImport('replace')">Replace Existing</button>
  </div>`;
}
function previewBulk(){
  let rows=bulkRows(),box=$("bulkPreview");
  box.style.display="block";
  if(!rows.length){box.innerHTML='<div class="empty">No readable words</div>';return}
  renderDuplicatePanel(rows);
  box.innerHTML=`<p class="desc">Rows: ${rows.length} / Exact duplicates: ${rows.filter(r=>r.duplicate).length} / Same-front words: ${rows.filter(r=>r.frontDuplicate).length}</p><div class="tablewrap"><table><thead><tr><th>Row</th><th>Front</th><th>Back</th><th>POS</th><th>Gender</th><th>Example</th><th>Status</th></tr></thead><tbody>`+rows.map(r=>`<tr><td>${r.row}</td><td><b>${esc(r.front)}</b></td><td>${esc(r.back)}</td><td>${esc(r.pos)}</td><td>${esc(r.gender)}</td><td>${esc(r.memo)}</td><td>${r.duplicate?'<span class="badge red">Exact Duplicate</span>':r.frontDuplicate?'<span class="badge yellow">Same Front</span>':'<span class="badge green">New</span>'}</td></tr>`).join("")+"</tbody></table></div>"
}
function bulkImport(mode){
  let rows=bulkRows();
  if(!rows.length)return toast("No readable words");
  const hasFrontDup=rows.some(r=>r.frontDuplicate);
  if(hasFrontDup&&!mode){previewBulk();return toast("Duplicate words need confirmation");}
  let listId=$("bulkList").value,frontLang=$("bulkFrontLang").value,backLang=$("bulkBackLang").value;
  if(mode==="replace"){
    rows.forEach(r=>{
      const ex=softDuplicateMatch(r,listId);
      if(ex){
        db.words=db.words.map(w=>w.id===ex.id?{...w,front:r.front,back:r.back,frontLang,backLang,listId,memo:r.memo,pos:r.pos,gender:r.gender}:w);
      }else{
        db.words.push({id:uid(),front:r.front,back:r.back,frontLang,backLang,listId,memo:r.memo,pos:r.pos,gender:r.gender,tags:"",saved:false,status:"new",seen:0,level:1,nextReview:addDays(1),createdAt:new Date().toISOString()});
      }
    });
    $("bulkText").value="";clearBulkPreview();save();return toast(`${rows.length} processed`);
  }
  if(mode==="skip"||!mode){
    rows=rows.filter(r=>!r.duplicate);
  }
  if(mode==="addBoth"){
    const seen=new Set();
    rows=rows.filter(r=>{
      const k=[r.front,r.back,r.pos].map(x=>String(x||"").trim().toLowerCase()).join("||");
      if(seen.has(k))return false;
      seen.add(k);
      return true;
    });
  }
  db.words=[...db.words,...rows.map(r=>({id:uid(),front:r.front,back:r.back,frontLang,backLang,listId,memo:r.memo,pos:r.pos,gender:r.gender,tags:"",saved:false,status:"new",seen:0,level:1,nextReview:addDays(1),createdAt:new Date().toISOString()}))];
  $("bulkText").value="";clearBulkPreview();save();toast(`${rows.length} added`);
}
function posBadge(pos){return pos?`<span class="badge ${["noun","verb","adjective","adverb","phrase"].includes(pos)?pos:""}">${esc(pos)}</span>`:""}
function genderBadge(g){if(!g)return"";let letter=g==="masculine"?"M":g==="feminine"?"F":g==="neutral"?"N":g==="plural"?"PL":g[0].toUpperCase();let cls=g==="masculine"?"m":g==="feminine"?"f":"n";return`<span class="badge ${cls}">${letter}</span>`}
function sortedWords(words){let mode=$("sortMode")?$("sortMode").value:"added",arr=[...words];if(mode==="frontAZ")arr.sort((a,b)=>String(a.front).localeCompare(String(b.front),undefined,{sensitivity:"base"}));if(mode==="backAZ")arr.sort((a,b)=>String(a.back).localeCompare(String(b.back),undefined,{sensitivity:"base"}));return arr}
function moveWord(id,dir){let w=db.words.find(x=>x.id===id);if(!w)return;let same=db.words.filter(x=>x.listId===w.listId),pos=same.findIndex(x=>x.id===id),target=same[pos+dir];if(!target)return toast("Cannot move further");let i1=db.words.findIndex(x=>x.id===id),i2=db.words.findIndex(x=>x.id===target.id);[db.words[i1],db.words[i2]]=[db.words[i2],db.words[i1]];save()}
function filteredWordsForList(){let list=$("wordListSelect").value||"all",filter=$("statusFilter").value||"all",q=($("wordSearch").value||"").toLowerCase();let words=list==="all"?[...db.words]:db.words.filter(w=>w.listId===list);if(filter==="star")words=words.filter(w=>w.saved);else if(filter==="due")words=words.filter(isDue);else if(filter!=="all")words=words.filter(w=>(w.status||"new")===filter);if(q)words=words.filter(w=>(w.front+" "+w.back+" "+(w.memo||"")+" "+(w.tags||"")+" "+(w.pos||"")+" "+(w.gender||"")).toLowerCase().includes(q));return sortedWords(words)}
function renderWords(){let box=$("wordsBox");if(!box)return;let words=filteredWordsForList(),view=$("tableView").value||"both";if(!words.length){box.innerHTML='<div class="empty">No words</div>';return}let h=view==="both"?"<th>Front</th><th>Back</th>":view==="front"?"<th>Front only</th>":"<th>Back only</th>";let table='<div class="tablewrap desktop-word-table"><table><thead><tr><th></th>'+h+'<th>Info</th><th>Status</th><th>Review</th><th>Actions</th></tr></thead><tbody>'+words.map(w=>{let main=view==="both"?`<td><b onclick="openDetail('${w.id}')">${esc(w.front)}</b></td><td>${esc(w.back)}</td>`:view==="front"?`<td><b onclick="openDetail('${w.id}')">${esc(w.front)}</b></td>`:`<td><b onclick="openDetail('${w.id}')">${esc(w.back)}</b></td>`;let st=w.status==="learned"?"<span class='badge green'>learned</span>":w.status==="hard"?"<span class='badge red'>hard</span>":"<span class='badge'>new</span>";return`<tr><td><input type="checkbox" ${selectedIds.has(w.id)?"checked":""} onchange="toggleSelected('${w.id}',this.checked)"></td>${main}<td>${langName(w.frontLang)} → ${langName(w.backLang)}<br>${posBadge(w.pos)} ${genderBadge(w.gender)} ${w.tags?`<span class="badge">${esc(w.tags)}</span>`:""}</td><td>${w.saved?"<span class='badge yellow'>★</span> ":""}${st} <span class='badge'>Lv.${w.level||1}</span></td><td>${w.nextReview||"-"} ${isDue(w)?"<span class='badge red'>Due</span>":""}</td><td><button class="icon" onclick="moveWord('${w.id}',-1)">↑</button> <button class="icon" onclick="moveWord('${w.id}',1)">↓</button> <button class="icon ${w.saved?'saved':''}" onclick="toggleStar('${w.id}')">${w.saved?'★':'☆'}</button> <button class="icon" onclick="speakListWord('${w.id}')">▶</button> <button class="icon edit" onclick="openEdit('${w.id}')">✎</button> <button class="icon" onclick="removeWord('${w.id}')">🗑</button></td></tr>`}).join("")+"</tbody></table></div>";
let cards='<div class="mobile-word-cards">'+words.map(w=>{let st=w.status==="learned"?"<span class='badge green'>learned</span>":w.status==="hard"?"<span class='badge red'>hard</span>":"<span class='badge'>new</span>";return`<div class="mobile-word-card"><div class="mobile-word-main"><button class="mobile-play" onclick="speakListWord('${w.id}')">▶</button><div onclick="openDetail('${w.id}')"><div class="mobile-front">${esc(w.front)}</div><div class="mobile-back">${esc(w.back)}</div></div></div><div class="mobile-meta">${posBadge(w.pos)} ${genderBadge(w.gender)} ${st} ${w.saved?"<span class='badge yellow'>★</span>":""}<span class="badge">${langName(w.frontLang)}→${langName(w.backLang)}</span></div><div class="mobile-actions"><button onclick="moveWord('${w.id}',-1)">↑</button><button onclick="moveWord('${w.id}',1)">↓</button><button onclick="toggleStar('${w.id}')">${w.saved?'★':'☆'}</button><button class="edit" onclick="openEdit('${w.id}')">Edit</button><button class="del" onclick="removeWord('${w.id}')">Delete</button></div></div>`}).join("")+"</div>";box.innerHTML=table+cards}
function toggleSelected(id,c){c?selectedIds.add(id):selectedIds.delete(id)}
function toggleSelectAll(){let words=filteredWordsForList(),all=words.every(w=>selectedIds.has(w.id));words.forEach(w=>all?selectedIds.delete(w.id):selectedIds.add(w.id));renderWords()}
function deleteSelected(){if(!selectedIds.size)return toast("Select words first");if(!confirm(`${selectedIds.size} words will be deleted.`))return;db.words=db.words.filter(w=>!selectedIds.has(w.id));selectedIds.clear();save()}
function removeWord(id){if(!confirm("Delete this word?"))return;db.words=db.words.filter(w=>w.id!==id);selectedIds.delete(id);save()}
function toggleStar(id){db.words=db.words.map(w=>w.id===id?{...w,saved:!w.saved}:w);if(current&&current.id===id)current=db.words.find(w=>w.id===id);save()}
function speakListWord(id){let w=db.words.find(x=>x.id===id),side=$("listSpeakSide").value;if(!w)return;if(side==="front")speak(w.front,w.frontLang);else if(side==="back")speak(w.back,w.backLang);else speakPair(w,"frontBack")}
function openDetail(id){let w=db.words.find(x=>x.id===id);if(!w)return;$("detailContent").innerHTML=`<div class="dict-title">${esc(w.front)}</div><div class="dict-meaning">${esc(w.back)}</div><div>${posBadge(w.pos)} ${genderBadge(w.gender)} ${w.tags?`<span class="badge">${esc(w.tags)}</span>`:""}</div><div class="actions"><button class="btn blue" onclick="speak('${escAttr(w.front)}','${w.frontLang}')">▶ Front</button><button class="btn blue" onclick="speak('${escAttr(w.back)}','${w.backLang}')">▶ Back</button><button class="btn" onclick="openEdit('${w.id}')">Edit</button></div><div class="dict-grid"><div class="dict-box"><b>Languages</b>${langName(w.frontLang)} → ${langName(w.backLang)}</div><div class="dict-box"><b>Status</b>${w.status||"new"} / Lv.${w.level||1}</div><div class="dict-box"><b>Next Review</b>${w.nextReview||"-"}</div><div class="dict-box"><b>Memo / Example</b>${esc(w.memo||"-")}</div></div>`;$("detailModal").classList.add("show")}
function closeDetail(){$("detailModal").classList.remove("show")}
function openEdit(id){let w=db.words.find(x=>x.id===id);if(!w)return;$("editId").value=w.id;$("editFront").value=w.front;$("editBack").value=w.back;$("editFrontLang").innerHTML=optionsHTML(w.frontLang);$("editBackLang").innerHTML=optionsHTML(w.backLang);$("editList").value=w.listId;$("editPOS").value=w.pos||"";$("editGender").value=w.gender||"";$("editTags").value=w.tags||"";$("editStatus").value=w.status||"new";$("editLevel").value=w.level||1;$("editMemo").value=w.memo||"";$("editModal").classList.add("show")}
function closeEdit(){$("editModal").classList.remove("show")}
function saveEdit(){let id=$("editId").value;db.words=db.words.map(w=>w.id===id?{...w,front:$("editFront").value.trim(),back:$("editBack").value.trim(),frontLang:$("editFrontLang").value,backLang:$("editBackLang").value,listId:$("editList").value,pos:$("editPOS").value,gender:$("editGender").value,tags:$("editTags").value.trim(),status:$("editStatus").value,level:parseInt($("editLevel").value),memo:$("editMemo").value.trim()}:w);closeEdit();save()}
function studyWords(){let list=$("studyList").value,mode=$("studyMode").value;let words=db.words.filter(w=>w.listId===list);if(mode==="hard")words=words.filter(w=>w.status==="hard");if(mode==="due")words=words.filter(isDue);if(mode==="star")words=words.filter(w=>w.saved);return words}
function resetCard(){clearFlashTimers();current=null;flipped=false;$("flash").classList.remove("is-flipped");$("frontWord").textContent="---";$("backWord").textContent="---";$("frontMemo").textContent="";$("backMemo").textContent="";updateStudyStar()}
function weighted(words){let pool=[];words.forEach(w=>{let n=w.status==="hard"?4:isDue(w)?3:w.status==="new"?2:1;for(let i=0;i<n;i++)pool.push(w)});return pool[Math.floor(Math.random()*pool.length)]}
function nextCard(){clearFlashTimers();let words=studyWords();if(!words.length){resetCard();return toast("No words")}current=weighted(words);flipped=false;$("flash").classList.remove("is-flipped");current.seen=(current.seen||0)+1;drawCard();persist();updateStudyStar()}
function drawCard(){if(!current)return;let mode=$("studyMode").value;if(mode==="back"){$("frontWord").textContent=current.back;$("backWord").textContent=current.front;$("backMemo").textContent=current.memo||""}else{$("frontWord").textContent=current.front;$("backWord").textContent=current.back;$("backMemo").textContent=current.memo||""}$("frontMemo").textContent=[current.pos,current.gender].filter(Boolean).join(" / ")}
function flipCard(){if(!current)return;flipped=!flipped;$("flash").classList.toggle("is-flipped",flipped)}
function speakCard(){if(!current)return;let mode=$("studyMode").value,text,lang;if(mode==="back"){text=flipped?current.front:current.back;lang=flipped?current.frontLang:current.backLang}else{text=flipped?current.back:current.front;lang=flipped?current.backLang:current.frontLang}speak(text,lang)}
function markCard(status){if(!current)return;updateWordLearning(current.id,status);current=db.words.find(w=>w.id===current.id);save();toast(status)}
function toggleCardStar(){if(current)toggleStar(current.id)}
function updateStudyStar(){let b=$("studyStar");if(b)b.textContent=current&&current.saved?"★ Saved":"☆ Save"}
function clearFlashTimers(){flashTimers.forEach(t=>clearTimeout(t));flashTimers=[]}
function startFlashAuto(){$("flashAutoMode").value="on";playFlashAutoCycle()}
function stopFlashAuto(){clearFlashTimers();$("flashAutoMode").value="off"}
function playFlashAutoCycle(){clearFlashTimers();if($("flashAutoMode").value!=="on")return;nextCard();if(!current)return stopFlashAuto();let mode=$("studyMode").value,frontText=mode==="back"?current.back:current.front,frontLang=mode==="back"?current.backLang:current.frontLang,backText=mode==="back"?current.front:current.back,backLang=mode==="back"?current.frontLang:current.backLang;speak(frontText,frontLang);let flipDelay=parseInt($("flashFlipDelay").value),nextDelay=parseInt($("flashNextDelay").value);flashTimers.push(setTimeout(()=>{if($("flashAutoMode").value!=="on")return;if(!flipped)flipCard();speak(backText,backLang)},flipDelay));flashTimers.push(setTimeout(()=>playFlashAutoCycle(),flipDelay+nextDelay))}
function updateWordLearning(id,status){db.words=db.words.map(w=>{if(w.id!==id)return w;let level=w.level||1,next=w.nextReview;if(status==="learned"){level=Math.min(4,level+1);next=addDays(level===2?2:level===3?5:10)}else{level=1;next=addDays(1)}return{...w,status,level,nextReview:next,lastReviewed:today()}});persist()}
function quizPool(){let list=$("quizList").value,scope=$("quizScope").value;let words=db.words.filter(w=>w.listId===list);if(scope==="hard")words=words.filter(w=>w.status==="hard");if(scope==="due")words=words.filter(isDue);if(scope==="star")words=words.filter(w=>w.saved);return [...words]}
function shuffle(arr){let a=[...arr];for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function resetQuiz(){clearQuizTimers();quiz={queue:[],wrong:[],allWrong:[],index:0,score:0,current:null,answered:false,type:"choice",direction:"front",total:0};if($("quizType"))$("quizType").value="choice";$("quizSetup").style.display="block";$("quizRun").style.display="none";$("quizEnd").style.display="none"}
function startQuiz(){clearQuizTimers();let words=quizPool();let requested=parseInt($("quizCount").value,10)||10;if(requested<1)requested=1;if(!words.length)return toast("No words");let actual=Math.min(requested,words.length);if(actual<requested)toast(`Only ${actual} words available`);quiz={queue:shuffle(words).slice(0,actual),wrong:[],allWrong:[],index:0,score:0,current:null,answered:false,type:$("quizType").value||"choice",direction:$("quizDirection").value,total:actual};$("quizSetup").style.display="none";$("quizRun").style.display="block";$("quizEnd").style.display="none";showQuizQuestion()}
function showQuizQuestion(){clearQuizTimers();quiz.answered=false;quiz.current=quiz.queue[quiz.index];if(!quiz.current)return endQuiz();$("quizProgress").textContent=(quiz.index+1)+" / "+quiz.total;$("quizScore").textContent=quiz.score+" / "+quiz.total;$("quizResult").className="result-box";$("quizResult").textContent="";let q=quiz.direction==="front"?quiz.current.front:quiz.current.back;$("quizWord").textContent=q;$("quizLabel").textContent=quiz.direction==="front"?"Front → ?":"Back → ?";$("typingArea").style.display=quiz.type==="typing"?"block":"none";$("choiceArea").style.display=quiz.type==="choice"?"grid":"none";$("quizAnswer").value="";if(quiz.type==="choice")renderChoices();startQuestionTimer()}
function correctAnswer(){return quiz.direction==="front"?quiz.current.back:quiz.current.front}
function normalize(s){return String(s||"").trim().toLowerCase()}
function checkTypingAnswer(){if(quiz.answered)return;finishAnswer(normalize($("quizAnswer").value)===normalize(correctAnswer()))}
function renderChoices(){
  let correct=correctAnswer();
  const currentList=quiz.current.listId;
  const answerLang=quiz.direction==="front"?quiz.current.backLang:quiz.current.frontLang;
  let pool=db.words
    .filter(w=>w.listId===currentList)
    .filter(w=>(quiz.direction==="front"?w.backLang:w.frontLang)===answerLang)
    .map(w=>quiz.direction==="front"?w.back:w.front)
    .filter(x=>normalize(x)!==normalize(correct));
  pool=[...new Set(pool)].sort(()=>Math.random()-.5).slice(0,3);
  while(pool.length<3)pool.push("—");
  let choices=shuffle([correct,...pool]);
  $("choiceArea").innerHTML=choices.map(c=>`<button type="button" class="choice" onclick="chooseAnswer(this,'${escAttr(c)}')">${esc(c)}</button>`).join("");
}
function chooseAnswer(btn,ans){if(quiz.answered)return;let ok=normalize(ans)===normalize(correctAnswer());[...document.querySelectorAll(".choice")].forEach(b=>{b.disabled=true;if(normalize(b.textContent)===normalize(correctAnswer()))b.classList.add("correct")});if(!ok)btn.classList.add("wrong");finishAnswer(ok)}
function finishAnswer(ok){if(quiz.answered)return;quiz.answered=true;clearInterval(quizTimerInterval);if(ok){quiz.score++;$("quizResult").className="result-box show ok";$("quizResult").textContent="Correct";updateWordLearning(quiz.current.id,"learned")}else{$("quizResult").className="result-box show no";$("quizResult").textContent="Wrong. Answer: "+correctAnswer();quiz.wrong.push(quiz.current);if(!quiz.allWrong.some(w=>w.id===quiz.current.id))quiz.allWrong.push(quiz.current);updateWordLearning(quiz.current.id,"hard")}$("quizScore").textContent=quiz.score+" / "+quiz.total;if($("quizAudioAfter").value==="on")setTimeout(()=>{try{speakQuizQuestion()}catch(e){}},20);if(isAutoAdvance())scheduleNext(ok)}
function isAutoAdvance(){return !$("quizAutoAdvance")||$("quizAutoAdvance").value==="on"}
function nextDelay(ok){let v=parseFloat($("quizNextDelay").value||"0.8");v=Math.max(0.3,Math.min(10,v));return v*1000}
function scheduleNext(ok){clearTimeout(quizAutoTimer);quizAutoTimer=setTimeout(()=>advanceQuiz(),nextDelay(ok))}
function advanceQuiz(){clearQuizTimers();if(!quiz.current)return;if(!quiz.answered){finishAnswer(false);return}quiz.index++;if(quiz.index>=quiz.queue.length)return endQuiz();showQuizQuestion()}
function nextQuizQuestion(){if(!quiz.current)return;if(!quiz.answered){finishAnswer(false);return}advanceQuiz()}
function speakQuizQuestion(){if(!quiz.current)return;let text=quiz.direction==="front"?quiz.current.front:quiz.current.back,lang=quiz.direction==="front"?quiz.current.frontLang:quiz.current.backLang;speak(text,lang)}
function clearQuizTimers(){clearTimeout(quizAutoTimer);clearInterval(quizTimerInterval);quizAutoTimer=null;quizTimerInterval=null}
function startQuestionTimer(){let wrap=$("quizTimerWrap"),fill=$("quizTimerFill"),text=$("quizTimerText");if($("quizHardMode").value!=="on"){wrap.classList.remove("show");return}let limit=Math.max(2,parseInt($("quizTimeLimit").value||"8",10));quizQuestionStartedAt=Date.now();wrap.classList.add("show");fill.style.width="100%";fill.classList.remove("danger");text.textContent=limit+"s";quizTimerInterval=setInterval(()=>{if(quiz.answered){clearInterval(quizTimerInterval);return}let remain=Math.max(0,limit-(Date.now()-quizQuestionStartedAt)/1000),pct=remain/limit*100;fill.style.width=pct+"%";if(pct<30)fill.classList.add("danger");text.textContent=Math.ceil(remain)+"s";if(remain<=0){clearInterval(quizTimerInterval);finishAnswer(false)}},200)}
function endQuiz(){clearQuizTimers();$("quizRun").style.display="none";$("quizEnd").style.display="block";$("quizEndText").textContent=`Score: ${quiz.score} / ${quiz.total}`;renderWrongList();render()}
function renderWrongList(){let box=$("quizWrongList"),wrong=quiz.allWrong||[];if(!wrong.length){box.innerHTML='<div class="empty">No wrong answers. Great job!</div>';return}box.innerHTML='<h2 style="margin-top:8px">Wrong Answers</h2>'+wrong.map(item=>{let w=db.words.find(x=>x.id===item.id)||item,q=quiz.direction==="front"?w.front:w.back,a=quiz.direction==="front"?w.back:w.front,lang=quiz.direction==="front"?w.frontLang:w.backLang;return`<div class="quiz-wrong-card"><div onclick="openDetail('${w.id}')"><div class="quiz-wrong-front">${esc(q)}</div><div class="quiz-wrong-back">Answer: ${esc(a)}</div></div><div class="quiz-wrong-actions"><button onclick="speak('${escAttr(q)}','${lang}')">▶</button><button class="${w.saved?'starred':''}" onclick="toggleQuizWrongStar('${w.id}')">${w.saved?'★ Saved':'☆ Save'}</button><button onclick="openDetail('${w.id}')">Detail</button></div></div>`}).join("")}
function toggleQuizWrongStar(id){toggleStar(id);renderWrongList()}
function restartWrongQuiz(){let wrong=quiz.allWrong||[];if(!wrong.length)return resetQuiz();quiz={...quiz,queue:shuffle(wrong),wrong:[],index:0,score:0,current:null,answered:false,total:wrong.length};$("quizEnd").style.display="none";$("quizRun").style.display="block";showQuizQuestion()}
function audioWords(){let list=$("audioList").value,order=$("audioOrder").value;let words=db.words.filter(w=>w.listId===list);if(order==="star")words=words.filter(w=>w.saved);if(order==="due")words=words.filter(isDue);if(order==="hard")words=[...words].sort((a,b)=>(b.status==="hard")-(a.status==="hard"));if(order==="random")words=shuffle(words);return words}
function startAudio(){stopAudio();audioQueue=audioWords();if(!audioQueue.length)return toast("No words");audioIndex=0;audioPaused=false;playAudioCurrent()}
function pauseAudio(){audioPaused=true;clearTimeout(audioTimer);speechSynthesis.cancel();toast("Paused")}
function stopAudio(){clearTimeout(audioTimer);speechSynthesis.cancel();audioPaused=false;audioIndex=0;$("audioNow").textContent="---";$("audioSub").textContent="Start"}
function playAudioOnce(){let words=audioWords();if(!words.length)return toast("No words");let w=words[Math.floor(Math.random()*words.length)];updateNow(w);speakByPattern(w)}
function playAudioCurrent(){if(audioPaused)return;if(audioIndex>=audioQueue.length){audioIndex=0;if($("audioOrder").value==="random")audioQueue=shuffle(audioQueue)}let w=audioQueue[audioIndex++];updateNow(w);speakByPattern(w);audioTimer=setTimeout(playAudioCurrent,Math.max(.5,parseFloat($("audioIntervalCustom").value||"5"))*1000)}
function updateNow(w){$("audioNow").textContent=w.front;$("audioSub").textContent=`${w.front} → ${w.back}`}
function speakByPattern(w){speakPair(w,$("audioPattern").value)}
function speakPair(w,p){
  let gap=Math.max(.1,parseFloat($("pairGapCustom")?.value||"1.8"))*1000;
  if(p==="front")speak(w.front,w.frontLang);
  if(p==="back")speak(w.back,w.backLang);
  if(p==="frontBack")speakQueued([{text:w.front,lang:w.frontLang},{text:w.back,lang:w.backLang}],gap);
  if(p==="backFront")speakQueued([{text:w.back,lang:w.backLang},{text:w.front,lang:w.frontLang}],gap);
}

function downloadBackupFile(){
  const data={app:"TangoNest",version:"backup-v1",exportedAt:new Date().toISOString(),data:db};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download="vocabrise_backup_"+new Date().toISOString().slice(0,10)+".json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast("Backup downloaded");
}

function exportDataText(){let data={app:"TangoNest",version:"stable-reset-v32",exportedAt:new Date().toISOString(),data:db},text=JSON.stringify(data),box=$("syncDataBox");box.value=text;box.focus();box.select();if(navigator.clipboard&&window.isSecureContext)navigator.clipboard.writeText(text).then(()=>toast("Copied export data")).catch(()=>toast("Export data is ready"));else toast("Export data is ready. Copy the text.")}
function importDataText(){let text=($("syncDataBox").value||"").trim();if(!text)return toast("Paste export data first");let parsed;try{parsed=JSON.parse(text)}catch(e){return alert("Import failed: invalid data")}let incoming=parsed.data&&parsed.data.words?parsed.data:parsed;if(!incoming.words||!incoming.lists)return alert("Import failed: this is not TangoNest data");if(!confirm(`Import ${incoming.words.length} words? Current data will be replaced.`))return;db={ui:incoming.ui||"en",prefs:incoming.prefs||{frontLang:"fr-FR",backLang:"en-US"},lists:incoming.lists.length?incoming.lists:[{id:"starter",name:"New Playlist"}],words:incoming.words};save();toast("Imported")}
function clearAll(){if(!confirm(`Delete all vocabulary data in this browser? (${db.words.length} words)`))return;let final=prompt("Type DELETE to confirm.");if(final!=="DELETE")return toast("Cancelled");db={ui:"en",prefs:{frontLang:"fr-FR",backLang:"en-US"},lists:[{id:"starter",name:"New Playlist"}],words:[]};localStorage.setItem(KEY,JSON.stringify(db));resetCard();resetQuiz();render();toast("All data deleted")}

let VOICES_READY=false;
let VOICE_CACHE=[];
let voiceLoadStarted=false;

function normalizeVoiceLang(lang){
  const map={
    "en":"en-US","en-US":"en-US","en-GB":"en-GB",
    "fr":"fr-FR","fr-FR":"fr-FR",
    "ja":"ja-JP","ja-JP":"ja-JP",
    "ko":"ko-KR","ko-KR":"ko-KR",
    "zh":"zh-CN","zh-CN":"zh-CN","zh-TW":"zh-TW",
    "es":"es-ES","es-ES":"es-ES",
    "ar":"ar-SA","ar-SA":"ar-SA",
    "it":"it-IT","it-IT":"it-IT",
    "de":"de-DE","de-DE":"de-DE",
    "pt":"pt-BR","pt-BR":"pt-BR","pt-PT":"pt-PT",
    "ru":"ru-RU","ru-RU":"ru-RU",
    "nl":"nl-NL","nl-NL":"nl-NL",
    "vi":"vi-VN","vi-VN":"vi-VN",
    "th":"th-TH","th-TH":"th-TH",
    "tr":"tr-TR","tr-TR":"tr-TR",
    "hi":"hi-IN","hi-IN":"hi-IN",
    "id":"id-ID","id-ID":"id-ID",
    "el":"el-GR","el-GR":"el-GR",
    "he":"he-IL","he-IL":"he-IL"
  };
  return map[lang]||lang||"en-US";
}

function refreshVoices(){
  try{
    VOICE_CACHE=window.speechSynthesis?window.speechSynthesis.getVoices():[];
    VOICES_READY=VOICE_CACHE.length>0;
  }catch(e){
    VOICE_CACHE=[];
    VOICES_READY=false;
  }
  return VOICE_CACHE;
}

function waitForVoices(timeout=1200){
  return new Promise(resolve=>{
    let voices=refreshVoices();
    if(voices.length)return resolve(voices);
    if(!window.speechSynthesis)return resolve([]);
    let done=false;
    const finish=()=>{
      if(done)return;
      done=true;
      voices=refreshVoices();
      resolve(voices);
    };
    window.speechSynthesis.onvoiceschanged=finish;
    setTimeout(finish,timeout);
  });
}

function voiceScore(v,lang){
  const target=normalizeVoiceLang(lang).toLowerCase();
  const prefix=target.split("-")[0];
  const vlang=String(v.lang||"").toLowerCase();
  const name=String(v.name||"").toLowerCase();
  let score=0;
  if(vlang===target)score+=100;
  if(vlang.startsWith(prefix))score+=60;
  if(name.includes("google"))score+=50;
  if(name.includes("premium"))score+=20;
  if(name.includes("enhanced"))score+=15;
  if(name.includes("natural"))score+=15;
  if(name.includes("microsoft"))score+=8;
  if(name.includes("siri"))score+=5;
  return score;
}

function pickVoice(lang){
  const target=normalizeVoiceLang(lang);
  const voices=refreshVoices();
  if(!voices.length)return null;
  const prefix=target.toLowerCase().split("-")[0];
  const candidates=voices.filter(v=>String(v.lang||"").toLowerCase().startsWith(prefix));
  if(!candidates.length)return voices.find(v=>String(v.lang||"").toLowerCase()===target.toLowerCase())||null;
  return candidates.sort((a,b)=>voiceScore(b,target)-voiceScore(a,target))[0]||null;
}

async function speak(text,lang,opts={}){
  text=String(text||"").trim();
  if(!text)return;
  const finalLang=normalizeVoiceLang(lang);
  if(!window.speechSynthesis)return;
  await waitForVoices();
  try{
    // Cancel only before a new manual utterance. This prevents overlapped voices.
    if(opts.cancel!==false)window.speechSynthesis.cancel();
  }catch(e){}
  const u=new SpeechSynthesisUtterance(text);
  u.lang=finalLang;
  u.rate=parseFloat($("audioRate")?.value||"0.92");
  u.pitch=1;
  u.volume=1;
  const voice=pickVoice(finalLang);
  if(voice)u.voice=voice;
  try{
    window.speechSynthesis.speak(u);
  }catch(e){
    console.warn("Speech failed",e);
  }
}

function speakQueued(items,gap=900){
  if(!items||!items.length)return;
  try{window.speechSynthesis.cancel()}catch(e){}
  let delay=0;
  items.forEach((it,idx)=>{
    setTimeout(()=>speak(it.text,it.lang,{cancel:false}),delay);
    delay+=gap;
  });
}

function showVoiceStatus(){
  const box=$("voiceStatusBox");
  if(!box)return;
  const voices=refreshVoices();
  const langs=["en-US","fr-FR","ja-JP","ko-KR","zh-CN","zh-TW","es-ES","de-DE","it-IT","pt-BR","ru-RU"];
  box.style.display="block";
  if(!voices.length){
    box.innerHTML='<p class="desc">No browser voices loaded yet. Try again after a few seconds, or reload the page.</p>';
    waitForVoices().then(showVoiceStatus);
    return;
  }
  box.innerHTML='<p class="desc">Available voices: '+voices.length+'</p>'+
    langs.map(l=>{
      const v=pickVoice(l);
      const google=v&&String(v.name||"").toLowerCase().includes("google");
      return `<div style="padding:8px;border-bottom:1px solid var(--line)"><b>${langName(l)||l}</b> → ${v?esc(v.name)+" / "+esc(v.lang):"No voice"} ${google?'<span class="badge green">Google</span>':'<span class="badge">Fallback</span>'}</div>`
    }).join("");
}

function testAllMainVoices(){
  const tests=[
    ["Hello, this is English.","en-US"],
    ["Bonjour, ceci est le français.","fr-FR"],
    ["こんにちは、日本語です。","ja-JP"],
    ["안녕하세요. 한국어입니다.","ko-KR"],
    ["你好，这是中文。","zh-CN"]
  ];
  speakQueued(tests.map(([text,lang])=>({text,lang})),1600);
}

if(window.speechSynthesis){
  refreshVoices();
  window.speechSynthesis.onvoiceschanged=()=>refreshVoices();
  setTimeout(refreshVoices,300);
  setTimeout(refreshVoices,1000);
}

function attachBrandContextListeners(){
  ["quizList","cardList","audioList","listFilter","bulkList","addList"].forEach(id=>{
    const el=$(id);
    if(el&&!el.dataset.contextAttached){
      el.dataset.contextAttached="1";
      el.addEventListener("change",updateBrandContext);
    }
  });
}

attachBrandContextListeners();
render();resetQuiz();

const VR_SESSION_KEY="vocabrise_last_session_v1";
function getLastSession(){
  try{return JSON.parse(localStorage.getItem(VR_SESSION_KEY)||"{}")}catch(e){return{}}
}
function setLastSession(patch){
  const current=getLastSession();
  const next={...current,...patch,updatedAt:new Date().toISOString()};
  localStorage.setItem(VR_SESSION_KEY,JSON.stringify(next));
  updateResumeCard();
}
function selectedValue(id){
  const el=$(id);
  return el?el.value:"";
}
function applyLastSessionToControls(){
  const s=getLastSession();
  if(s.listId){
    ["quizList","cardList","audioList","listFilter","bulkList","addList"].forEach(id=>{
      const el=$(id);
      if(el&&[...el.options].some(o=>o.value===s.listId))el.value=s.listId;
    });
  }
  if(s.quizCount&&$("quizCount"))$("quizCount").value=s.quizCount;
  if(s.quizMode&&$("quizMode"))$("quizMode").value=s.quizMode;
  if(s.quizDirection&&$("quizDirection"))$("quizDirection").value=s.quizDirection;
  if(s.quizOrder&&$("quizOrder"))$("quizOrder").value=s.quizOrder;
  if(s.audioMode&&$("audioMode"))$("audioMode").value=s.audioMode;
  if(s.cardDirection&&$("cardDirection"))$("cardDirection").value=s.cardDirection;
}
function rememberCurrentSession(mode){
  const listId=selectedValue(mode==="cards"?"cardList":mode==="audio"?"audioList":mode==="quiz"?"quizList":"listFilter")||activeListId?.();
  const patch={mode:mode||"home",listId};
  if($("quizCount"))patch.quizCount=$("quizCount").value;
  if($("quizMode"))patch.quizMode=$("quizMode").value;
  if($("quizDirection"))patch.quizDirection=$("quizDirection").value;
  if($("quizOrder"))patch.quizOrder=$("quizOrder").value;
  if($("audioMode"))patch.audioMode=$("audioMode").value;
  if($("cardDirection"))patch.cardDirection=$("cardDirection").value;
  setLastSession(patch);
}
function resumeLastSession(){
  const s=getLastSession();
  applyLastSessionToControls();
  const mode=s.mode||"quiz";
  if(mode==="audio")appShow("audio");
  else if(mode==="cards")appShow("cards");
  else if(mode==="list")appShow("list");
  else appShow("quiz");
}
function updateResumeCard(){
  const s=getLastSession();
  const list=db?.lists?.find(l=>l.id===s.listId)||db?.lists?.[0];
  const modeLabel=(s.mode||"quiz").replace(/^./,c=>c.toUpperCase());
  const count=s.quizCount?` · ${s.quizCount} questions`:"";
  const lang=list?playlistLangMeta(list.id):"Choose a playlist";
  if($("resumeMeta"))$("resumeMeta").textContent=list?`${list.name} · ${lang} · ${modeLabel}${count}`:"Your last playlist and study mode will stay ready.";
  if($("resumeMainBtn"))$("resumeMainBtn").textContent=list?`Resume ${modeLabel}`:"Start Quiz";
}
function attachSessionMemory(){
  const map={quizList:"quiz",cardList:"cards",audioList:"audio",listFilter:"list",quizCount:"quiz",quizMode:"quiz",quizDirection:"quiz",quizOrder:"quiz",audioMode:"audio",cardDirection:"cards"};
  Object.entries(map).forEach(([id,mode])=>{
    const el=$(id);
    if(el&&!el.dataset.sessionMemory){
      el.dataset.sessionMemory="1";
      el.addEventListener("change",()=>rememberCurrentSession(mode));
    }
  });
}
function rotateHeroLanguages(){
  const sets=[
    {front:"你好",frontLang:"Chinese",back:"hello",backLang:"English",mode:"Quiz"},
    {front:"こんにちは",frontLang:"Japanese",back:"hello",backLang:"English",mode:"Cards"},
    {front:"안녕하세요",frontLang:"Korean",back:"hello",backLang:"English",mode:"Listen"},
    {front:"bonjour",frontLang:"French",back:"hello",backLang:"English",mode:"Review"},
    {front:"hola",frontLang:"Spanish",back:"hello",backLang:"English",mode:"Typing"},
    {front:"مرحبا",frontLang:"Arabic",back:"hello",backLang:"English",mode:"Audio"},
    {front:"苹果",frontLang:"Chinese",back:"りんご",backLang:"Japanese",mode:"Quiz"}
  ];
  const one=document.querySelector(".float-one");
  const two=document.querySelector(".float-two");
  const three=document.querySelector(".float-three");
  if(!one||!two||!three)return;
  let i=0;
  const apply=()=>{
    const s=sets[i%sets.length];
    [one,two,three].forEach(el=>el.classList.add("changing"));
    setTimeout(()=>{
      one.innerHTML=`<span>Front</span><b>${s.front}</b><small>${s.frontLang}</small>`;
      two.innerHTML=`<span>Back</span><b>${s.back}</b><small>${s.backLang}</small>`;
      three.innerHTML=`<span>Mode</span><b>${s.mode}</b><small>Ready</small>`;
      [one,two,three].forEach(el=>el.classList.remove("changing"));
    },220);
    i++;
  };
  apply();
  if(!window.__tnHeroLanguageTimer)window.__tnHeroLanguageTimer=setInterval(apply,3600);
}


function enhanceTangoNestApp(){
  applyLastSessionToControls();
  attachSessionMemory();
  updateResumeCard();
  rotateHeroLanguages();
  if(typeof updateBrandContext==="function")updateBrandContext();
}
setTimeout(enhanceTangoNestApp,120);
setTimeout(enhanceTangoNestApp,800);


setTimeout(()=>{
  if(typeof go==="function"&&!go.__wrappedForSession){
    const originalGo=go;
    window.go=function(page){
      originalGo(page);
      const modeMap={quiz:"quiz",audio:"audio",cards:"cards",list:"list",add:"add",home:"home"};
      rememberCurrentSession(modeMap[page]||page);
      updateResumeCard();
      rotateHeroLanguages();
    };
    window.go.__wrappedForSession=true;
  }
  if(typeof showPage==="function"&&!showPage.__wrappedForSession){
    const originalShow=showPage;
    window.showPage=function(page){
      originalShow(page);
      const modeMap={quiz:"quiz",audio:"audio",cards:"cards",list:"list",add:"add",home:"home"};
      rememberCurrentSession(modeMap[page]||page);
      updateResumeCard();
      rotateHeroLanguages();
    };
    window.showPage.__wrappedForSession=true;
  }
},200);



/* =========================================================
   TangoNest Beta46 Login & Supabase Sync
   Public publishable key is okay to ship in browser.
   Data access is protected by Supabase RLS policies.
========================================================= */

var TANGONEST_SUPABASE_URL = window.TANGONEST_SUPABASE_URL;
var TANGONEST_SUPABASE_KEY = window.TANGONEST_SUPABASE_KEY;
var tnSupabase = null;
var tnUser = null;
var tnSyncReady = false;
var tnLastCloudSave = 0;

function initTangoNestSupabase(){
  if(!window.supabase){
    console.warn("Supabase library not loaded yet.");
    return;
  }
  if(!tnSupabase){
    tnSupabase = window.supabase.createClient(TANGONEST_SUPABASE_URL, TANGONEST_SUPABASE_KEY);
  }
}

function safeToast(msg){
  if(typeof toast==="function")toast(msg);
  else console.log(msg);
}

function getUserEmail(){
  return $("authEmail")?.value?.trim() || "";
}

function getUserPassword(){
  return $("authPassword")?.value || "";
}

function setAuthMessage(status, sub){
  if($("authStatus"))$("authStatus").textContent=status;
  if($("authSub"))$("authSub").textContent=sub;
}

function updateAuthUI(){
  const form=$("authForm");
  const actions=$("authActions");
  if(tnUser){
    hideLoginGate();
    setAuthMessage("Logged in", tnUser.email || "TangoNest account");
    if(form)form.style.display="none";
    if(actions)actions.style.display="flex";
  }else{
    setAuthMessage("Guest mode", "Login to sync your words across PC and phone.");
    if(form)form.style.display="flex";
    if(actions)actions.style.display="none";
  }
}

async function refreshTangoNestSession(){
  initTangoNestSupabase();
  if(!tnSupabase)return;
  const {data,error} = await tnSupabase.auth.getUser();
  if(error || !data?.user){
    tnUser=null;
  }else{
    tnUser=data.user;
  }
  updateAuthUI();
}

function cloudPayload(){
  return {
    version:"tangonest-cloud-v1",
    savedAt:new Date().toISOString(),
    data:db
  };
}

async function ensureCloudRow(){
  if(!tnSupabase||!tnUser)throw new Error("Not logged in");
  const payload=cloudPayload();
  const {data,error} = await tnSupabase
    .from("tangonest_data")
    .select("id")
    .eq("user_id", tnUser.id)
    .maybeSingle();

  if(error)throw error;
  if(data?.id){
    const {error:updateError} = await tnSupabase
      .from("tangonest_data")
      .update({data:payload, updated_at:new Date().toISOString()})
      .eq("id", data.id)
      .eq("user_id", tnUser.id);
    if(updateError)throw updateError;
  }else{
    const {error:insertError} = await tnSupabase
      .from("tangonest_data")
      .insert({user_id:tnUser.id, data:payload});
    if(insertError)throw insertError;
  }
}

async function saveProfile(){
  if(!tnSupabase||!tnUser)return;
  await tnSupabase.from("tangonest_profiles").upsert({
    id:tnUser.id,
    email:tnUser.email || ""
  });
}

async function signUpTangoNest(){
  initTangoNestSupabase();
  const email=getUserEmail();
  const password=getUserPassword();
  if(!email||!password)return safeToast("Email and password are required");
  if(password.length<6)return safeToast("Password must be at least 6 characters");
  const {data,error} = await tnSupabase.auth.signUp({email,password});
  if(error)return safeToast(error.message);
  tnUser=data.user || null;
  await refreshTangoNestSession();
  await saveProfile();
  if(tnUser){
    await syncNowToCloud();
    safeToast("Account created and synced");
  }else{
    safeToast("Check your email to confirm signup");
  }
}

async function loginTangoNest(){
  initTangoNestSupabase();
  const email=getUserEmail();
  const password=getUserPassword();
  if(!email||!password)return safeToast("Email and password are required");
  const {data,error} = await tnSupabase.auth.signInWithPassword({email,password});
  if(error)return safeToast(error.message);
  tnUser=data.user;
  await saveProfile();
  updateAuthUI();
  safeToast("Logged in");
}

async function logoutTangoNest(){
  initTangoNestSupabase();
  if(tnSupabase)await tnSupabase.auth.signOut();
  tnUser=null;
  updateAuthUI();
  localStorage.removeItem("tangonest_guest_mode");
  showLoginGate();
  safeToast("Logged out");
}

async function syncNowToCloud(){
  initTangoNestSupabase();
  await refreshTangoNestSession();
  if(!tnUser)return safeToast("Login first");
  try{
    await saveProfile();
    await ensureCloudRow();
    tnLastCloudSave=Date.now();
    safeToast("Saved to cloud");
  }catch(e){
    console.error(e);
    safeToast("Cloud save failed: "+(e.message||e));
  }
}

async function loadFromCloud(){
  initTangoNestSupabase();
  await refreshTangoNestSession();
  if(!tnUser)return safeToast("Login first");
  try{
    const {data,error} = await tnSupabase
      .from("tangonest_data")
      .select("data, updated_at")
      .eq("user_id", tnUser.id)
      .order("updated_at", {ascending:false})
      .limit(1)
      .maybeSingle();
    if(error)throw error;
    if(!data?.data?.data)return safeToast("No cloud data yet");
    const cloudDb=data.data.data;
    if(!cloudDb.words||!cloudDb.lists)return safeToast("Cloud data format error");
    db=cloudDb;
    if(typeof save==="function")save();
    if(typeof render==="function")render();
    if(typeof updateBrandContext==="function")updateBrandContext();
    safeToast("Loaded from cloud");
  }catch(e){
    console.error(e);
    safeToast("Cloud load failed: "+(e.message||e));
  }
}

async function autoCloudSaveIfNeeded(){
  if(!tnUser)return;
  const now=Date.now();
  if(now-tnLastCloudSave<5000)return;
  try{
    await ensureCloudRow();
    tnLastCloudSave=now;
  }catch(e){
    console.warn("Auto cloud save failed",e);
  }
}

function wrapLocalSaveForCloud(){
  if(typeof save!=="function"||save.__cloudWrapped)return;
  const originalSave=save;
  window.save=function(){
    originalSave();
    autoCloudSaveIfNeeded();
  };
  window.save.__cloudWrapped=true;
}

function initLoginSyncEdition(){
  initTangoNestSupabase();
  wrapLocalSaveForCloud();
  refreshTangoNestSession();
  if(tnSupabase){
    tnSupabase.auth.onAuthStateChange((_event,session)=>{
      tnUser=session?.user || null;
      updateAuthUI();
    });
  }
}

setTimeout(initLoginSyncEdition,300);
setTimeout(initLoginSyncEdition,1200);


/* =========================================================
   Beta48 Login Gate
========================================================= */
function showLoginGate(){
  const gate=document.getElementById("loginGate");
  if(gate)gate.classList.remove("hidden");
}
function hideLoginGate(){
  const gate=document.getElementById("loginGate");
  if(gate)gate.classList.add("hidden");
}
function copyGateCredentials(){
  const ge=document.getElementById("gateEmail");
  const gp=document.getElementById("gatePassword");
  const ae=document.getElementById("authEmail");
  const ap=document.getElementById("authPassword");
  if(ae&&ge)ae.value=ge.value;
  if(ap&&gp)ap.value=gp.value;
}
async function gateLogin(){
  copyGateCredentials();
  if(typeof loginTangoNest==="function"){
    await loginTangoNest();
    if(window.tnUser || tnUser)hideLoginGate();
  }
}
async function gateSignUp(){
  copyGateCredentials();
  if(typeof signUpTangoNest==="function"){
    await signUpTangoNest();
    if(window.tnUser || tnUser)hideLoginGate();
  }
}
function continueAsGuest(){
  localStorage.setItem("tangonest_guest_mode","1");
  hideLoginGate();
}
function checkLoginGateState(){
  const guest=localStorage.getItem("tangonest_guest_mode")==="1";
  if(typeof tnUser!=="undefined" && tnUser){hideLoginGate();return;}
  if(guest){hideLoginGate();return;}
  showLoginGate();
}
setTimeout(checkLoginGateState,500);
setTimeout(checkLoginGateState,1600);


/* =========================================================
   Beta49 Login Feedback
========================================================= */
function setGateMessage(message,type="info"){
  const box=document.getElementById("gateMessage");
  if(!box)return;
  box.textContent=message;
  box.className="gate-message "+type;
}
function gateCredentials(){
  const email=document.getElementById("gateEmail")?.value?.trim()||"";
  const password=document.getElementById("gatePassword")?.value||"";
  return {email,password};
}
async function gateLogin(){
  const {email,password}=gateCredentials();
  if(!email||!password){
    setGateMessage("Email and password are required.","error");
    return;
  }
  setGateMessage("Logging in...","info");
  try{
    ensureTangoNestSupabaseReady();
    const {data,error}=await tnSupabase.auth.signInWithPassword({email,password});
    if(error){
      setGateMessage(error.message,"error");
      return;
    }
    tnUser=data.user;
    updateAuthUI();
    hideLoginGate();
    setGateMessage("Logged in.","success");
    safeToast("Logged in");
  }catch(e){
    setGateMessage(e.message||String(e),"error");
  }
}
async function gateSignUp(){
  const {email,password}=gateCredentials();
  if(!email||!password){
    setGateMessage("Email and password are required.","error");
    return;
  }
  if(password.length<6){
    setGateMessage("Password must be at least 6 characters.","error");
    return;
  }
  setGateMessage("Creating account...","info");
  try{
    ensureTangoNestSupabaseReady();
    const {data,error}=await tnSupabase.auth.signUp({email,password});
    if(error){
      setGateMessage(error.message,"error");
      return;
    }
    tnUser=data.user||null;
    if(tnUser){
      await saveProfile();
      await syncNowToCloud();
      updateAuthUI();
      hideLoginGate();
      safeToast("Account created");
    }else{
      setGateMessage("Account created. Check your email to confirm, then login.","success");
    }
  }catch(e){
    setGateMessage(e.message||String(e),"error");
  }
}


/* =========================================================
   Beta50 Supabase Init Safety Patch
========================================================= */
function ensureTangoNestSupabaseReady(){
  if(typeof window.supabase==="undefined"){
    throw new Error("Supabase library is still loading. Please wait a moment and try again.");
  }
  if(typeof tnSupabase==="undefined" || !tnSupabase){
    tnSupabase = window.supabase.createClient(TANGONEST_SUPABASE_URL, TANGONEST_SUPABASE_KEY);
  }
  return tnSupabase;
}

if(typeof initTangoNestSupabase==="function"){
  initTangoNestSupabase = function(){
    try{
      ensureTangoNestSupabaseReady();
    }catch(e){
      console.warn(e.message);
    }
  };
}


/* =========================================================
   Beta51 Supabase URL Hard Fix
========================================================= */
function getTangoNestSupabaseConfig(){
  return {
    url: "https://bkbteylavujkfiwuqwdq.supabase.co",
    key: "sb_publishable_UKX5qCXkbIRac4cc62_LXw_yEGDG6BZ"
  };
}

function ensureTangoNestSupabaseReady(){
  if(typeof window.supabase==="undefined"){
    throw new Error("Supabase library is still loading. Please wait a moment and try again.");
  }
  const cfg=getTangoNestSupabaseConfig();
  if(!cfg.url)throw new Error("Supabase URL is missing.");
  if(!cfg.key)throw new Error("Supabase publishable key is missing.");
  if(typeof tnSupabase==="undefined" || !tnSupabase){
    tnSupabase = window.supabase.createClient(cfg.url, cfg.key);
  }
  return tnSupabase;
}

function initTangoNestSupabase(){
  try{
    ensureTangoNestSupabaseReady();
  }catch(e){
    console.warn(e.message);
  }
}


/* =========================================================
   Beta52 Mobile Login Polish & Email Confirmation
========================================================= */
function isEmailNotConfirmedError(message){
  return String(message||"").toLowerCase().includes("email not confirmed");
}
function showResendButton(show=true){
  const btn=document.getElementById("resendEmailBtn");
  if(btn)btn.style.display=show?"block":"none";
}
async function resendConfirmEmail(){
  const email=document.getElementById("gateEmail")?.value?.trim() || document.getElementById("authEmail")?.value?.trim() || "";
  if(!email){
    setGateMessage("Enter your email first, then resend the confirmation email.","error");
    return;
  }
  try{
    ensureTangoNestSupabaseReady();
    setGateMessage("Sending confirmation email...","info");
    const {error}=await tnSupabase.auth.resend({type:"signup",email});
    if(error){
      setGateMessage(error.message,"error");
      return;
    }
    setGateMessage("Confirmation email sent. Open your email, confirm your account, then login again.","success");
    showResendButton(false);
  }catch(e){
    setGateMessage(e.message||String(e),"error");
  }
}

// Override gateLogin with better email-confirmation message.
async function gateLogin(){
  const email=document.getElementById("gateEmail")?.value?.trim()||"";
  const password=document.getElementById("gatePassword")?.value||"";
  showResendButton(false);
  if(!email||!password){
    setGateMessage("Email and password are required.","error");
    return;
  }
  setGateMessage("Logging in...","info");
  try{
    ensureTangoNestSupabaseReady();
    const {data,error}=await tnSupabase.auth.signInWithPassword({email,password});
    if(error){
      if(isEmailNotConfirmedError(error.message)){
        setGateMessage("Email not confirmed. Check your inbox, or resend the confirmation email below.","error");
        showResendButton(true);
      }else{
        setGateMessage(error.message,"error");
      }
      return;
    }
    tnUser=data.user;
    updateAuthUI();
    hideLoginGate();
    setGateMessage("Logged in.","success");
    safeToast("Logged in");
  }catch(e){
    setGateMessage(e.message||String(e),"error");
  }
}

// Override gateSignUp with clearer confirmation flow.
async function gateSignUp(){
  const email=document.getElementById("gateEmail")?.value?.trim()||"";
  const password=document.getElementById("gatePassword")?.value||"";
  showResendButton(false);
  if(!email||!password){
    setGateMessage("Email and password are required.","error");
    return;
  }
  if(password.length<6){
    setGateMessage("Password must be at least 6 characters.","error");
    return;
  }
  setGateMessage("Creating account...","info");
  try{
    ensureTangoNestSupabaseReady();
    const {data,error}=await tnSupabase.auth.signUp({email,password});
    if(error){
      setGateMessage(error.message,"error");
      return;
    }
    tnUser=data.user||null;

    // If Supabase requires email confirmation, session may be missing.
    if(data.session){
      await saveProfile();
      await syncNowToCloud();
      updateAuthUI();
      hideLoginGate();
      safeToast("Account created");
    }else{
      setGateMessage("Account created. Check your email, confirm your account, then login.","success");
      showResendButton(true);
    }
  }catch(e){
    setGateMessage(e.message||String(e),"error");
  }
}


/* =========================================================
   Beta53 Bulk Import Safe Override
========================================================= */
function bulkImport(mode){
  try{
    let rows=bulkRows();
    let box=$("bulkPreview");
    if(!rows.length){
      if(box){box.style.display="block";box.innerHTML='<div class="empty">No readable words. Use: Front / Back / POS / Gender / Example</div>'}
      return toast("No readable words");
    }

    const hasFrontDup=rows.some(r=>r.frontDuplicate);
    if(hasFrontDup&&!mode){
      previewBulk();
      return toast("Duplicate words need confirmation");
    }

    let listId=$("bulkList").value;
    let frontLang=$("bulkFrontLang").value;
    let backLang=$("bulkBackLang").value;

    if(mode==="replace"){
      rows.forEach(r=>{
        const ex=softDuplicateMatch(r,listId);
        if(ex){
          db.words=db.words.map(w=>w.id===ex.id?{...w,front:r.front,back:r.back,frontLang,backLang,listId,memo:r.memo,pos:r.pos,gender:r.gender}:w);
        }else{
          db.words.push({id:uid(),front:r.front,back:r.back,frontLang,backLang,listId,memo:r.memo,pos:r.pos,gender:r.gender,tags:"",saved:false,status:"new",seen:0,level:1,nextReview:addDays(1),createdAt:new Date().toISOString()});
        }
      });
      $("bulkText").value="";
      clearBulkPreview();
      save();
      toast(`${rows.length} processed`);
      return;
    }

    if(mode==="skip"||!mode){
      rows=rows.filter(r=>!r.duplicate);
    }

    if(mode==="addBoth"){
      const seen=new Set();
      rows=rows.filter(r=>{
        const k=[r.front,r.back,r.pos].map(x=>String(x||"").trim().toLowerCase()).join("||");
        if(seen.has(k))return false;
        seen.add(k);
        return true;
      });
    }

    const newWords=rows.map(r=>({
      id:uid(),
      front:r.front,
      back:r.back,
      frontLang,
      backLang,
      listId,
      memo:r.memo,
      pos:r.pos,
      gender:r.gender,
      tags:"",
      saved:false,
      status:"new",
      seen:0,
      level:1,
      nextReview:addDays(1),
      createdAt:new Date().toISOString()
    }));

    db.words=[...db.words,...newWords];
    $("bulkText").value="";
    clearBulkPreview();
    save();
    toast(`${newWords.length} added`);
  }catch(e){
    console.error(e);
    let box=$("bulkPreview");
    if(box){
      box.style.display="block";
      box.innerHTML=`<div class="empty">Bulk Add error: ${esc(e.message||e)}</div>`;
    }
    toast("Bulk Add error");
  }
}


/* =========================================================
   Beta53 Bulk Button Event Binding
========================================================= */
function attachBulkButtonFix(){
  const addPage=document.getElementById("pageAdd");
  if(!addPage)return;
  const buttons=[...addPage.querySelectorAll("button")];
  buttons.forEach(btn=>{
    const txt=(btn.textContent||"").trim().toLowerCase();
    if(txt==="preview"&&!btn.dataset.bulkFixed){
      btn.dataset.bulkFixed="1";
      btn.addEventListener("click",e=>{e.preventDefault();previewBulk();});
    }
    if(txt==="bulk register"&&!btn.dataset.bulkFixed){
      btn.dataset.bulkFixed="1";
      btn.addEventListener("click",e=>{e.preventDefault();bulkImport();});
    }
  });
}
setTimeout(attachBulkButtonFix,300);
setTimeout(attachBulkButtonFix,1200);


/* =========================================================
   Beta54 English-Japanese Defaults
========================================================= */
function setSelectIfExists(id,value){
  const el=$(id);
  if(!el)return;
  if([...el.options].some(o=>o.value===value))el.value=value;
}
function applyEnglishJapaneseDefaults(force=false){
  const pairs=[
    ["frontLang","en-US"],["backLang","ja-JP"],
    ["bulkFrontLang","en-US"],["bulkBackLang","ja-JP"]
  ];
  pairs.forEach(([id,val])=>{
    const el=$(id);
    if(!el)return;
    if(force || !el.dataset.userChanged){
      setSelectIfExists(id,val);
    }
    if(!el.dataset.defaultWatch){
      el.dataset.defaultWatch="1";
      el.addEventListener("change",()=>{el.dataset.userChanged="1"});
    }
  });
  const memo=$("memo");
  if(memo && !memo.value && memo.placeholder) memo.placeholder="I eat an apple.";
  const newList=$("newListName");
  if(newList && newList.placeholder) newList.placeholder="English A1";
  const bulk=$("bulkText");
  if(bulk && !bulk.value && bulk.placeholder){
    bulk.placeholder="apple\tりんご\tnoun\tnone\tI eat an apple.\nhello\tこんにちは\tinterjection\tnone\tHello!";
  }
}
setTimeout(()=>applyEnglishJapaneseDefaults(true),400);
setTimeout(()=>applyEnglishJapaneseDefaults(false),1200);

setTimeout(()=>{
  if(typeof render==="function" && !render.__beta54Wrapped){
    const originalRender=render;
    window.render=function(){
      originalRender();
      applyEnglishJapaneseDefaults(false);
    };
    window.render.__beta54Wrapped=true;
  }
},500);


/* =========================================================
   Beta54 Quiz Order
========================================================= */
function orderQuizWords(words){
  const order=$("quizOrder")?.value || "random";
  let arr=[...words];
  if(order==="added"){
    arr.sort((a,b)=>new Date(a.createdAt||0)-new Date(b.createdAt||0));
  }else if(order==="az"){
    const dir=$("quizDirection")?.value || "front";
    const key=dir==="back"?"back":"front";
    arr.sort((a,b)=>String(a[key]||"").localeCompare(String(b[key]||""),undefined,{sensitivity:"base"}));
  }else{
    arr.sort(()=>Math.random()-.5);
  }
  return arr;
}

// Wrap startQuiz to apply selected order after original list is prepared.
setTimeout(()=>{
  if(typeof startQuiz==="function"&&!startQuiz.__beta54OrderWrapped){
    const originalStartQuiz=startQuiz;
    window.startQuiz=function(){
      originalStartQuiz();
      try{
        if(typeof quiz!=="undefined" && Array.isArray(quiz.queue)){
          quiz.queue=orderQuizWords(quiz.queue);
          quiz.index=0;
          if(typeof renderQuiz==="function")renderQuiz();
        }else if(typeof quizState!=="undefined" && Array.isArray(quizState.queue)){
          quizState.queue=orderQuizWords(quizState.queue);
          quizState.index=0;
          if(typeof renderQuiz==="function")renderQuiz();
        }
      }catch(e){
        console.warn("Quiz order fallback",e);
      }
      if(typeof rememberCurrentSession==="function")rememberCurrentSession("quiz");
    };
    window.startQuiz.__beta54OrderWrapped=true;
  }
},600);



/* =========================================================
   Beta55 Stable Bulk Add Override
   This override avoids old missing DOM references and handles all output inside #bulkPreview.
========================================================= */

function tnEsc(v){
  if(typeof esc==="function")return esc(v);
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}

function tnBulkPreviewBox(){
  let box=document.getElementById("bulkPreview");
  if(!box){
    const text=document.getElementById("bulkText");
    if(text){
      box=document.createElement("div");
      box.id="bulkPreview";
      box.className="bulk-preview";
      const parent=text.closest(".card")||text.parentElement;
      parent.appendChild(box);
    }
  }
  return box;
}

function tnGet(id){
  return document.getElementById(id);
}

function tnToast(msg){
  if(typeof toast==="function")toast(msg);
  else console.log(msg);
}

function tnUid(){
  if(typeof uid==="function")return uid();
  return "w_"+Date.now()+"_"+Math.random().toString(16).slice(2);
}

function tnAddDays(n){
  if(typeof addDays==="function")return addDays(n);
  const d=new Date();
  d.setDate(d.getDate()+n);
  return d.toISOString();
}

function cleanBulkValue(v){
  return String(v ?? "").trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,"").trim();
}

function splitBulkLine(line){
  const raw=String(line||"").trim();
  if(!raw)return [];
  if(raw.includes("\t"))return raw.split("\t").map(cleanBulkValue);
  if(raw.includes(","))return raw.split(",").map(cleanBulkValue);
  const multi=raw.split(/\s{2,}/).map(cleanBulkValue).filter(Boolean);
  if(multi.length>=2)return multi;
  return raw.split(/\s+/).map(cleanBulkValue).filter(Boolean);
}

function parseBulk(text){
  return String(text||"")
    .split(/\r?\n/)
    .map((line,i)=>({line:String(line||"").trim(),row:i+1}))
    .filter(x=>x.line)
    .map(({line,row})=>{
      let example="";
      let before=line;
      if(line.includes("|")){
        const pieces=line.split("|");
        before=pieces.shift().trim();
        example=pieces.join("|").trim();
      }

      const parts=splitBulkLine(before);
      let front="",back="",pos="",gender="",memo="";

      if(parts.length>=5){
        front=parts[0]; back=parts[1]; pos=parts[2]; gender=parts[3]; memo=parts.slice(4).join(" ");
      }else if(parts.length===4){
        front=parts[0]; back=parts[1]; pos=parts[2]; gender=parts[3];
      }else if(parts.length===3){
        front=parts[0]; back=parts[1]; pos=parts[2];
      }else if(parts.length===2){
        front=parts[0]; back=parts[1];
      }else{
        front=parts[0]||"";
      }

      if(example)memo=memo?`${memo} | ${example}`:example;

      return {
        row,
        front:cleanBulkValue(front),
        back:cleanBulkValue(back),
        pos:cleanBulkValue(pos),
        gender:cleanBulkValue(gender),
        memo:cleanBulkValue(memo)
      };
    })
    .filter(r=>r.front&&r.back);
}

function duplicateMatch(row,listId){
  const key=(x)=>String(x||"").trim().toLowerCase();
  return (db.words||[]).find(w=>
    w.listId===listId &&
    key(w.front)===key(row.front) &&
    key(w.back)===key(row.back) &&
    key(w.pos)===key(row.pos)
  );
}

function softDuplicateMatch(row,listId){
  const key=(x)=>String(x||"").trim().toLowerCase();
  return (db.words||[]).find(w=>
    w.listId===listId &&
    key(w.front)===key(row.front)
  );
}

function bulkRows(){
  const text=tnGet("bulkText")?.value||"";
  const listId=tnGet("bulkList")?.value || (db.lists?.[0]?.id || "starter");
  const rows=parseBulk(text);
  const seenFront=new Set();
  const seenExact=new Set();

  return rows.map(r=>{
    const frontKey=String(r.front||"").trim().toLowerCase();
    const exactKey=[r.front,r.back,r.pos].map(x=>String(x||"").trim().toLowerCase()).join("||");
    const existingExact=duplicateMatch(r,listId);
    const existingFront=softDuplicateMatch(r,listId);
    const pastedFront=seenFront.has(frontKey);
    const pastedExact=seenExact.has(exactKey);
    seenFront.add(frontKey);
    seenExact.add(exactKey);
    return {
      ...r,
      duplicate:!!existingExact || pastedExact,
      frontDuplicate:!!existingFront || pastedFront,
      duplicateReason: existingExact ? "Already exists" : pastedExact ? "Duplicate in pasted text" : existingFront ? "Same front already exists" : pastedFront ? "Same front in pasted text" : ""
    };
  });
}

function previewBulk(){
  const box=tnBulkPreviewBox();
  if(!box)return;
  const rows=bulkRows();
  box.style.display="block";
  if(!rows.length){
    box.innerHTML='<div class="bulk-empty">No readable rows. Use: Front / Back / POS / Gender / Example</div>';
    return;
  }

  const frontDupCount=rows.filter(r=>r.frontDuplicate).length;
  const exactDupCount=rows.filter(r=>r.duplicate).length;
  const warning=frontDupCount?`
    <div class="bulk-warning">
      <b>${frontDupCount} possible duplicate${frontDupCount>1?"s":""}</b>
      <span>Choose how to import them below.</span>
    </div>`:"";

  const actions=frontDupCount?`
    <div class="bulk-review-actions">
      <button class="btn primary small" onclick="bulkImport('addBoth')">Import all</button>
      <button class="btn small" onclick="bulkImport('skip')">Skip duplicates</button>
      <button class="btn small" onclick="bulkImport('replace')">Replace same front</button>
    </div>`:"";

  box.innerHTML=`
    ${warning}
    <div class="bulk-summary">
      <span>${rows.length} readable rows</span>
      <span>${frontDupCount} possible duplicates</span>
      <span>${exactDupCount} exact duplicates</span>
    </div>
    <div class="bulk-table-wrap">
      <table class="bulk-table">
        <thead>
          <tr><th>#</th><th>Front</th><th>Back</th><th>POS</th><th>Gender</th><th>Memo / Example</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${rows.map(r=>`
            <tr class="${r.frontDuplicate?'dup-row':''}">
              <td>${r.row}</td>
              <td><b>${tnEsc(r.front)}</b></td>
              <td>${tnEsc(r.back)}</td>
              <td>${tnEsc(r.pos||"—")}</td>
              <td>${tnEsc(r.gender||"—")}</td>
              <td>${tnEsc(r.memo||"")}</td>
              <td>${r.frontDuplicate?`<span class="badge yellow">${tnEsc(r.duplicateReason||"Possible duplicate")}</span>`:`<span class="badge green">Ready</span>`}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    ${actions}
  `;
}

function clearBulkPreview(){
  const box=tnBulkPreviewBox();
  if(box){
    box.style.display="none";
    box.innerHTML="";
  }
}

function bulkImport(mode){
  const box=tnBulkPreviewBox();
  try{
    let rows=bulkRows();
    const listId=tnGet("bulkList")?.value || (db.lists?.[0]?.id || "starter");
    const frontLang=tnGet("bulkFrontLang")?.value || "en-US";
    const backLang=tnGet("bulkBackLang")?.value || "ja-JP";

    if(!rows.length){
      if(box){box.style.display="block";box.innerHTML='<div class="bulk-empty">No readable rows. Use: Front / Back / POS / Gender / Example</div>';}
      tnToast("No readable words");
      return;
    }

    const hasFrontDup=rows.some(r=>r.frontDuplicate);
    if(hasFrontDup&&!mode){
      previewBulk();
      tnToast("Duplicate check needs your choice");
      return;
    }

    if(mode==="skip"){
      rows=rows.filter(r=>!r.frontDuplicate&&!r.duplicate);
    }

    if(mode==="replace"){
      let replaced=0;
      let added=0;
      rows.forEach(r=>{
        const ex=softDuplicateMatch(r,listId);
        if(ex){
          Object.assign(ex,{front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,frontLang,backLang,listId});
          replaced++;
        }else{
          (db.words ||= []).push({
            id:tnUid(),front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,
            frontLang,backLang,listId,tags:"",saved:false,status:"new",seen:0,level:1,
            nextReview:tnAddDays(1),createdAt:new Date().toISOString()
          });
          added++;
        }
      });
      tnGet("bulkText").value="";
      clearBulkPreview();
      if(typeof save==="function")save();
      if(typeof render==="function")render();
      tnToast(`${added} added, ${replaced} replaced`);
      return;
    }

    // addBoth or no duplicates mode: remove exact duplicate within paste only, allow same-front different-back.
    const seenExact=new Set();
    rows=rows.filter(r=>{
      const k=[r.front,r.back,r.pos].map(x=>String(x||"").trim().toLowerCase()).join("||");
      if(seenExact.has(k))return false;
      seenExact.add(k);
      return true;
    });

    const newWords=rows.map(r=>({
      id:tnUid(),front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,
      frontLang,backLang,listId,tags:"",saved:false,status:"new",seen:0,level:1,
      nextReview:tnAddDays(1),createdAt:new Date().toISOString()
    }));

    db.words=[...(db.words||[]),...newWords];
    tnGet("bulkText").value="";
    clearBulkPreview();
    if(typeof save==="function")save();
    if(typeof render==="function")render();
    tnToast(`${newWords.length} added`);
  }catch(e){
    console.error(e);
    if(box){
      box.style.display="block";
      box.innerHTML=`<div class="bulk-empty">Bulk Add error: ${tnEsc(e.message||e)}</div>`;
    }
    tnToast("Bulk Add error");
  }
}

function attachBulkButtonsStable(){
  const addPage=document.getElementById("pageAdd")||document;
  [...addPage.querySelectorAll("button")].forEach(btn=>{
    const txt=(btn.textContent||"").trim().toLowerCase();
    if(txt==="preview"&&!btn.dataset.tnBulkStable){
      btn.dataset.tnBulkStable="1";
      btn.onclick=(e)=>{e.preventDefault();previewBulk();return false;};
    }
    if(txt==="bulk register"&&!btn.dataset.tnBulkStable){
      btn.dataset.tnBulkStable="1";
      btn.onclick=(e)=>{e.preventDefault();bulkImport();return false;};
    }
  });
}
setTimeout(attachBulkButtonsStable,100);
setTimeout(attachBulkButtonsStable,800);
setTimeout(attachBulkButtonsStable,1800);



/* =========================================================
   Beta56 Render + Bulk Final Safety Patch
   Root cause fixed:
   old renderHome/update functions referenced IDs that no longer exist
   in the current TangoNest HTML. This patch safely updates both
   old and new IDs and prevents Bulk Register from failing after save().
========================================================= */

function tnSafeEl(id){
  return document.getElementById(id);
}

function tnSetText(id,value){
  const el=tnSafeEl(id);
  if(el)el.textContent=value;
}

function tnSetHTML(id,value){
  const el=tnSafeEl(id);
  if(el)el.innerHTML=value;
}

function tnSafeToast(message){
  const t=tnSafeEl("toast");
  if(t){
    t.textContent=message;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),1700);
  }else{
    console.log("[TangoNest]",message);
  }
}

// Override unsafe toast globally
toast = tnSafeToast;

// Safe renderHome replacement. Updates current header IDs and old hidden compat IDs.
renderHome = function(){
  const words=db.words||[];
  const lists=db.lists||[];
  const learned=words.filter(w=>w.status==="learned").length;
  const hard=words.filter(w=>w.status==="hard").length;
  const due=(typeof dueWords==="function"?dueWords():[]).length;

  // New header IDs
  tnSetText("wc",words.length);
  tnSetText("listCount",lists.length);
  tnSetText("lc",learned);
  tnSetText("hc",hard);

  // Old IDs retained for compatibility
  tnSetText("totalWords",words.length);
  tnSetText("totalLists",lists.length);
  tnSetText("totalLearned",learned);
  tnSetText("totalHard",hard);
  tnSetText("dashTotal",words.length);
  tnSetText("dashLearned",Math.round((learned/Math.max(1,words.length))*100)+"%");
  tnSetText("dashDue",due);
  tnSetText("dashHard",hard);
  tnSetText("heroWords",words.length);
  tnSetText("heroLists",lists.length);
  tnSetText("heroLearned",learned);

  const activeId=typeof activeListId==="function"?activeListId():(lists[0]?.id);
  const list=lists.find(l=>l.id===activeId)||lists[0]||{id:"starter",name:"New Playlist"};
  const ws=typeof listWords==="function"?listWords(list.id):words.filter(w=>w.listId===list.id);
  const meta=typeof playlistLangMeta==="function"?playlistLangMeta(list.id):"Language space";

  tnSetText("heroPlaylistName",list.name);
  tnSetText("heroPlaylistMeta",`${meta} · ${ws.length} words`);
  tnSetText("contextPlaylistName",list.name);
  tnSetText("contextPlaylistMeta",`${meta} · ${ws.length} words`);
  tnSetText("heroPhoneDeck",list.name);
  tnSetText("heroPhoneMeta",`${meta} · ${ws.length} words`);

  const homeLists=tnSafeEl("homeLists");
  if(homeLists){
    homeLists.innerHTML=lists.map(l=>{
      const lws=typeof listWords==="function"?listWords(l.id):words.filter(w=>w.listId===l.id);
      const lmeta=typeof playlistLangMeta==="function"?playlistLangMeta(l.id):"Language space";
      const llearned=lws.filter(w=>w.status==="learned").length;
      const lhard=lws.filter(w=>w.status==="hard").length;
      return `<div class="playlist-card">
        <div class="playlist-main">
          <div class="playlist-icon">${tnEsc(l.name.slice(0,1).toUpperCase())}</div>
          <div>
            <b>${tnEsc(l.name)}</b>
            <span>${tnEsc(lmeta)} · ${lws.length} words · ${llearned} learned · ${lhard} hard</span>
          </div>
        </div>
        <div class="playlist-actions">
          <button class="btn small" onclick="setActiveList('${l.id}','quiz')">Quiz</button>
          <button class="btn small" onclick="setActiveList('${l.id}','study')">Cards</button>
          <button class="btn small" onclick="setActiveList('${l.id}','audio')">Listen</button>
        </div>
      </div>`;
    }).join("");
  }
};

// Safe render wrapper
if(typeof render==="function" && !render.__beta56SafeWrapped){
  const originalRenderBeta56=render;
  render=function(){
    try{
      originalRenderBeta56();
    }catch(e){
      console.warn("Render recovered:",e);
      try{
        if(typeof fillLangSelects==="function")fillLangSelects();
        ["addList","bulkList","studyList","quizList","audioList","renameListSelect","editList"].forEach(id=>{
          try{ if(typeof renderSelect==="function")renderSelect(id,false); }catch(_){}
        });
        try{ if(typeof renderSelect==="function")renderSelect("wordListSelect",true); }catch(_){}
        renderHome();
        try{ if(typeof renderWords==="function")renderWords(); }catch(_){}
        try{ if(typeof renderManage==="function")renderManage(); }catch(_){}
        try{ if(typeof updateStudyStar==="function")updateStudyStar(); }catch(_){}
      }catch(inner){
        console.error("Safe render failed:",inner);
      }
    }
  };
  render.__beta56SafeWrapped=true;
}

// Final Bulk Import override: use persist + safe render to avoid post-save crashes.
bulkImport = function(mode){
  const box=tnBulkPreviewBox();
  try{
    let rows=bulkRows();
    const listId=tnGet("bulkList")?.value || (db.lists?.[0]?.id || "starter");
    const frontLang=tnGet("bulkFrontLang")?.value || "en-US";
    const backLang=tnGet("bulkBackLang")?.value || "ja-JP";

    if(!rows.length){
      if(box){
        box.style.display="block";
        box.innerHTML='<div class="bulk-empty">No readable rows. Use: Front / Back / POS / Gender / Example</div>';
      }
      tnSafeToast("No readable words");
      return;
    }

    const hasFrontDup=rows.some(r=>r.frontDuplicate);
    if(hasFrontDup&&!mode){
      previewBulk();
      tnSafeToast("Duplicate check needs your choice");
      return;
    }

    if(mode==="skip"){
      rows=rows.filter(r=>!r.frontDuplicate&&!r.duplicate);
    }

    let added=0;
    let replaced=0;

    if(mode==="replace"){
      rows.forEach(r=>{
        const ex=softDuplicateMatch(r,listId);
        if(ex){
          Object.assign(ex,{front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,frontLang,backLang,listId});
          replaced++;
        }else{
          (db.words ||= []).push({
            id:tnUid(),front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,
            frontLang,backLang,listId,tags:"",saved:false,status:"new",seen:0,level:1,
            nextReview:tnAddDays(1),createdAt:new Date().toISOString()
          });
          added++;
        }
      });
    }else{
      const seenExact=new Set();
      rows=rows.filter(r=>{
        const k=[r.front,r.back,r.pos].map(x=>String(x||"").trim().toLowerCase()).join("||");
        if(seenExact.has(k))return false;
        seenExact.add(k);
        return true;
      });

      rows.forEach(r=>{
        (db.words ||= []).push({
          id:tnUid(),front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,
          frontLang,backLang,listId,tags:"",saved:false,status:"new",seen:0,level:1,
          nextReview:tnAddDays(1),createdAt:new Date().toISOString()
        });
        added++;
      });
    }

    const textBox=tnGet("bulkText");
    if(textBox)textBox.value="";
    clearBulkPreview();

    if(typeof persist==="function")persist();
    else localStorage.setItem(KEY,JSON.stringify(db));

    render();
    tnSafeToast(replaced?`${added} added, ${replaced} replaced`:`${added} added`);
  }catch(e){
    console.error("Bulk Add final error:",e);
    if(box){
      box.style.display="block";
      box.innerHTML=`<div class="bulk-empty">Bulk Add error: ${tnEsc(e.message||e)}</div>`;
    }
    tnSafeToast("Bulk Add error");
  }
};

// Rebind buttons after all scripts
function attachBulkButtonsBeta56(){
  const addPage=document.getElementById("pageAdd")||document;
  [...addPage.querySelectorAll("button")].forEach(btn=>{
    const txt=(btn.textContent||"").trim().toLowerCase();
    if(txt==="preview"){
      btn.onclick=(e)=>{e.preventDefault();previewBulk();return false;};
    }
    if(txt==="bulk register"){
      btn.onclick=(e)=>{e.preventDefault();bulkImport();return false;};
    }
  });
}
setTimeout(attachBulkButtonsBeta56,50);
setTimeout(attachBulkButtonsBeta56,500);
setTimeout(attachBulkButtonsBeta56,1500);



/* =========================================================
   Beta57 Preflight Safety Check
========================================================= */
function tnPreflightCheck(){
  const requiredIds=[
    "bulkText","bulkPreview","bulkList","bulkFrontLang","bulkBackLang",
    "quizList","quizCount","quizDirection","quizOrder",
    "wc","listCount","lc","hc","toast"
  ];
  const missing=requiredIds.filter(id=>!document.getElementById(id));
  if(missing.length){
    console.warn("TangoNest preflight missing IDs:",missing);
  }

  const requiredFns=[
    "parseBulk","bulkRows","previewBulk","bulkImport",
    "renderHome","render","save"
  ];
  const missingFns=requiredFns.filter(name=>typeof window[name]!=="function" && typeof globalThis[name]!=="function");
  if(missingFns.length){
    console.warn("TangoNest preflight missing functions:",missingFns);
  }
  return {missing,missingFns};
}

// Make Add/Bulk default English -> Japanese on first clean use.
// This does not stop the user from changing language manually after loading.
function tnApplyDefaultLanguageIfEmpty(){
  const front=document.getElementById("frontLang");
  const back=document.getElementById("backLang");
  const bulkFront=document.getElementById("bulkFrontLang");
  const bulkBack=document.getElementById("bulkBackLang");
  const set=(el,val)=>{
    if(!el)return;
    if([...el.options].some(o=>o.value===val)){
      // If default is still Chinese because of old app default, correct it.
      if(el.value==="zh-CN" || el.value==="fr-FR" || !el.value) el.value=val;
    }
  };
  set(front,"en-US");
  set(back,"ja-JP");
  set(bulkFront,"en-US");
  set(bulkBack,"ja-JP");
}

setTimeout(()=>{tnPreflightCheck();tnApplyDefaultLanguageIfEmpty();attachBulkButtonsBeta56?.();},250);
setTimeout(()=>{tnPreflightCheck();tnApplyDefaultLanguageIfEmpty();attachBulkButtonsBeta56?.();},1200);



/* =========================================================
   Beta58 Bulk Import Isolated Final Fix
   Main idea:
   Bulk Add must NOT call save() or render() after import.
   Older render code can still reference legacy DOM and break.
   This version only persists data and updates safe header counters.
========================================================= */

function tnSafePersistOnly(){
  try{
    if(typeof KEY!=="undefined"){
      localStorage.setItem(KEY,JSON.stringify(db));
    }else{
      localStorage.setItem("tangonest_data_backup",JSON.stringify(db));
    }
  }catch(e){
    console.error("Persist failed",e);
    throw e;
  }
}

function tnUpdateHeaderCountsOnly(){
  try{
    const words=db.words||[];
    const lists=db.lists||[];
    const learned=words.filter(w=>w.status==="learned").length;
    const hard=words.filter(w=>w.status==="hard").length;
    const set=(id,val)=>{
      const el=document.getElementById(id);
      if(el)el.textContent=val;
    };
    set("wc",words.length);
    set("listCount",lists.length);
    set("lc",learned);
    set("hc",hard);
    set("totalWords",words.length);
    set("totalLists",lists.length);
    set("totalLearned",learned);
    set("totalHard",hard);
  }catch(e){
    console.warn("Header count update skipped",e);
  }
}

function tnStableToast(msg){
  const t=document.getElementById("toast");
  if(t){
    t.textContent=msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),1600);
  }else{
    console.log("[TangoNest]",msg);
  }
}

function tnFinalBulkPreviewBox(){
  let box=document.getElementById("bulkPreview");
  if(!box){
    const text=document.getElementById("bulkText");
    box=document.createElement("div");
    box.id="bulkPreview";
    box.className="bulk-preview";
    (text?.closest(".card")||document.body).appendChild(box);
  }
  return box;
}

function tnFinalEsc(v){
  return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m]));
}

function tnFinalUid(){
  return "w_"+Date.now()+"_"+Math.random().toString(16).slice(2);
}

function tnFinalAddDays(n){
  const d=new Date();
  d.setDate(d.getDate()+n);
  return d.toISOString();
}

function tnFinalClean(v){
  return String(v??"").trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g,"").trim();
}

function tnFinalSplitLine(line){
  const raw=String(line||"").trim();
  if(!raw)return [];
  if(raw.includes("\t"))return raw.split("\t").map(tnFinalClean);
  if(raw.includes(","))return raw.split(",").map(tnFinalClean);
  const multi=raw.split(/\s{2,}/).map(tnFinalClean).filter(Boolean);
  if(multi.length>=2)return multi;
  return raw.split(/\s+/).map(tnFinalClean).filter(Boolean);
}

function parseBulk(text){
  return String(text||"")
    .split(/\r?\n/)
    .map((line,i)=>({line:String(line||"").trim(),row:i+1}))
    .filter(x=>x.line)
    .map(({line,row})=>{
      let before=line;
      let example="";
      if(line.includes("|")){
        const pieces=line.split("|");
        before=pieces.shift().trim();
        example=pieces.join("|").trim();
      }
      const parts=tnFinalSplitLine(before);
      let front="",back="",pos="",gender="",memo="";
      if(parts.length>=5){
        front=parts[0];back=parts[1];pos=parts[2];gender=parts[3];memo=parts.slice(4).join(" ");
      }else if(parts.length===4){
        front=parts[0];back=parts[1];pos=parts[2];gender=parts[3];
      }else if(parts.length===3){
        front=parts[0];back=parts[1];pos=parts[2];
      }else if(parts.length===2){
        front=parts[0];back=parts[1];
      }
      if(example)memo=memo?`${memo} | ${example}`:example;
      return {row,front:tnFinalClean(front),back:tnFinalClean(back),pos:tnFinalClean(pos),gender:tnFinalClean(gender),memo:tnFinalClean(memo)};
    })
    .filter(r=>r.front&&r.back);
}

function tnFinalKey(v){
  return String(v||"").trim().toLowerCase();
}

function duplicateMatch(row,listId){
  return (db.words||[]).find(w=>
    w.listId===listId &&
    tnFinalKey(w.front)===tnFinalKey(row.front) &&
    tnFinalKey(w.back)===tnFinalKey(row.back) &&
    tnFinalKey(w.pos)===tnFinalKey(row.pos)
  );
}

function softDuplicateMatch(row,listId){
  return (db.words||[]).find(w=>
    w.listId===listId &&
    tnFinalKey(w.front)===tnFinalKey(row.front)
  );
}

function bulkRows(){
  const text=document.getElementById("bulkText")?.value||"";
  const listId=document.getElementById("bulkList")?.value || (db.lists?.[0]?.id || "starter");
  const rows=parseBulk(text);
  const seenFront=new Set();
  const seenExact=new Set();
  return rows.map(r=>{
    const frontKey=tnFinalKey(r.front);
    const exactKey=[r.front,r.back,r.pos].map(tnFinalKey).join("||");
    const existingExact=duplicateMatch(r,listId);
    const existingFront=softDuplicateMatch(r,listId);
    const pastedFront=seenFront.has(frontKey);
    const pastedExact=seenExact.has(exactKey);
    seenFront.add(frontKey);
    seenExact.add(exactKey);
    return {
      ...r,
      duplicate:!!existingExact||pastedExact,
      frontDuplicate:!!existingFront||pastedFront,
      duplicateReason:existingExact?"Already exists":pastedExact?"Duplicate in pasted text":existingFront?"Same front already exists":pastedFront?"Same front in pasted text":""
    };
  });
}

function previewBulk(){
  const box=tnFinalBulkPreviewBox();
  const rows=bulkRows();
  box.style.display="block";
  if(!rows.length){
    box.innerHTML='<div class="bulk-empty">No readable rows. Use: Front / Back / POS / Gender / Example</div>';
    return;
  }
  const frontDupCount=rows.filter(r=>r.frontDuplicate).length;
  const exactDupCount=rows.filter(r=>r.duplicate).length;
  box.innerHTML=`
    ${frontDupCount?`<div class="bulk-warning"><b>${frontDupCount} possible duplicate${frontDupCount>1?"s":""}</b><span>Choose how to import them below.</span></div>`:""}
    <div class="bulk-summary">
      <span>${rows.length} readable rows</span>
      <span>${frontDupCount} possible duplicates</span>
      <span>${exactDupCount} exact duplicates</span>
    </div>
    <div class="bulk-table-wrap">
      <table class="bulk-table">
        <thead><tr><th>#</th><th>Front</th><th>Back</th><th>POS</th><th>Gender</th><th>Memo / Example</th><th>Status</th></tr></thead>
        <tbody>
          ${rows.map(r=>`
            <tr class="${r.frontDuplicate?'dup-row':''}">
              <td>${r.row}</td>
              <td><b>${tnFinalEsc(r.front)}</b></td>
              <td>${tnFinalEsc(r.back)}</td>
              <td>${tnFinalEsc(r.pos||"—")}</td>
              <td>${tnFinalEsc(r.gender||"—")}</td>
              <td>${tnFinalEsc(r.memo||"")}</td>
              <td>${r.frontDuplicate?`<span class="badge yellow">${tnFinalEsc(r.duplicateReason||"Possible duplicate")}</span>`:`<span class="badge green">Ready</span>`}</td>
            </tr>`).join("")}
        </tbody>
      </table>
    </div>
    ${frontDupCount?`
      <div class="bulk-review-actions">
        <button class="btn primary small" onclick="bulkImport('addBoth')">Import all</button>
        <button class="btn small" onclick="bulkImport('skip')">Skip duplicates</button>
        <button class="btn small" onclick="bulkImport('replace')">Replace same front</button>
      </div>`:""}
  `;
}

function clearBulkPreview(){
  const box=tnFinalBulkPreviewBox();
  box.style.display="none";
  box.innerHTML="";
}

function bulkImport(mode){
  const box=tnFinalBulkPreviewBox();
  try{
    let rows=bulkRows();
    const listId=document.getElementById("bulkList")?.value || (db.lists?.[0]?.id || "starter");
    const frontLang=document.getElementById("bulkFrontLang")?.value || "en-US";
    const backLang=document.getElementById("bulkBackLang")?.value || "ja-JP";

    if(!rows.length){
      box.style.display="block";
      box.innerHTML='<div class="bulk-empty">No readable rows. Use: Front / Back / POS / Gender / Example</div>';
      tnStableToast("No readable words");
      return;
    }

    const hasFrontDup=rows.some(r=>r.frontDuplicate);
    if(hasFrontDup && !mode){
      previewBulk();
      tnStableToast("Duplicate check needs your choice");
      return;
    }

    if(mode==="skip"){
      rows=rows.filter(r=>!r.frontDuplicate&&!r.duplicate);
    }

    let added=0;
    let replaced=0;

    if(mode==="replace"){
      rows.forEach(r=>{
        const ex=softDuplicateMatch(r,listId);
        if(ex){
          Object.assign(ex,{front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,frontLang,backLang,listId});
          replaced++;
        }else{
          (db.words ||= []).push({
            id:tnFinalUid(),front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,
            frontLang,backLang,listId,tags:"",saved:false,status:"new",seen:0,level:1,
            nextReview:tnFinalAddDays(1),createdAt:new Date().toISOString()
          });
          added++;
        }
      });
    }else{
      const seenExact=new Set();
      rows=rows.filter(r=>{
        const k=[r.front,r.back,r.pos].map(tnFinalKey).join("||");
        if(seenExact.has(k))return false;
        seenExact.add(k);
        return true;
      });
      rows.forEach(r=>{
        (db.words ||= []).push({
          id:tnFinalUid(),front:r.front,back:r.back,pos:r.pos,gender:r.gender,memo:r.memo,
          frontLang,backLang,listId,tags:"",saved:false,status:"new",seen:0,level:1,
          nextReview:tnFinalAddDays(1),createdAt:new Date().toISOString()
        });
        added++;
      });
    }

    const text=document.getElementById("bulkText");
    if(text)text.value="";
    clearBulkPreview();

    // Critical: do NOT call save() or render() here.
    tnSafePersistOnly();
    tnUpdateHeaderCountsOnly();

    // Try to refresh the library only if its render function is safe.
    try{ if(typeof renderWords==="function")renderWords(); }catch(e){ console.warn("renderWords skipped",e); }

    tnStableToast(replaced?`${added} added, ${replaced} replaced`:`${added} added`);
  }catch(e){
    console.error("Bulk import isolated error:",e);
    box.style.display="block";
    box.innerHTML=`<div class="bulk-empty">Bulk Add error: ${tnFinalEsc(e.message||e)}</div>`;
    tnStableToast("Bulk Add error");
  }
}

function tnBindBulkButtonsFinal(){
  const addPage=document.getElementById("pageAdd")||document;
  [...addPage.querySelectorAll("button")].forEach(btn=>{
    const txt=(btn.textContent||"").trim().toLowerCase();
    if(txt==="preview"){
      btn.onclick=(e)=>{e.preventDefault();previewBulk();return false;};
    }
    if(txt==="bulk register"){
      btn.onclick=(e)=>{e.preventDefault();bulkImport();return false;};
    }
  });
}
setTimeout(tnBindBulkButtonsFinal,50);
setTimeout(tnBindBulkButtonsFinal,500);
setTimeout(tnBindBulkButtonsFinal,1500);



/* =========================================================
   Beta59 Session Persistence + Cloud Sync Fix
   Goals:
   1. Do not show login screen after reload if Supabase session exists.
   2. Auto-load cloud data after login / existing session.
   3. Auto-save cloud after Add Word / Bulk Add / save().
   4. Keep Bulk Import isolated from full render().
========================================================= */

window.__tnCloudLoadedOnce = window.__tnCloudLoadedOnce || false;
window.__tnBootChecked = window.__tnBootChecked || false;

function tnLog(...args){
  console.log("[TangoNest]",...args);
}

function tnShowApp(){
  const gate=document.getElementById("loginGate");
  if(gate)gate.classList.add("hidden");
  document.body.classList.add("tn-logged-in");
}

function tnShowLogin(){
  const gate=document.getElementById("loginGate");
  if(gate)gate.classList.remove("hidden");
  document.body.classList.remove("tn-logged-in");
}

function tnHasGuestMode(){
  return localStorage.getItem("tangonest_guest_mode")==="1";
}

function tnSetGuestMode(on){
  if(on)localStorage.setItem("tangonest_guest_mode","1");
  else localStorage.removeItem("tangonest_guest_mode");
}

async function tnGetSessionUser(){
  ensureTangoNestSupabaseReady();
  const {data,error}=await tnSupabase.auth.getSession();
  if(error)throw error;
  const session=data?.session||null;
  if(session?.user){
    tnUser=session.user;
    return tnUser;
  }
  const userRes=await tnSupabase.auth.getUser();
  if(userRes?.data?.user){
    tnUser=userRes.data.user;
    return tnUser;
  }
  tnUser=null;
  return null;
}

function tnLocalDbIsMostlyEmpty(){
  return !(db?.words?.length) && !(db?.lists?.length>1);
}

async function tnLoadCloudSilently(){
  if(!tnUser || !tnSupabase)return false;
  try{
    const {data,error}=await tnSupabase
      .from("tangonest_data")
      .select("data, updated_at")
      .eq("user_id", tnUser.id)
      .order("updated_at", {ascending:false})
      .limit(1)
      .maybeSingle();

    if(error)throw error;
    if(!data?.data?.data)return false;

    const cloudDb=data.data.data;
    if(!cloudDb.words || !cloudDb.lists)return false;

    // If cloud has data, trust it on login/session restore.
    db=cloudDb;

    // Persist locally without calling old save()/render() chain.
    if(typeof KEY!=="undefined")localStorage.setItem(KEY,JSON.stringify(db));

    try{ render(); }catch(e){ console.warn("render after cloud load recovered",e); try{renderHome?.();renderWords?.();}catch(_){} }
    tnUpdateHeaderCountsOnly?.();
    window.__tnCloudLoadedOnce=true;
    tnStableToast?.("Cloud data loaded");
    return true;
  }catch(e){
    console.warn("Cloud load skipped:",e);
    return false;
  }
}

async function tnCloudSaveSilently(){
  if(!tnUser || !tnSupabase)return false;
  try{
    const payload={
      version:"tangonest-cloud-v1",
      savedAt:new Date().toISOString(),
      data:db
    };

    const {data,error}=await tnSupabase
      .from("tangonest_data")
      .select("id")
      .eq("user_id", tnUser.id)
      .maybeSingle();

    if(error)throw error;

    if(data?.id){
      const {error:updateError}=await tnSupabase
        .from("tangonest_data")
        .update({data:payload, updated_at:new Date().toISOString()})
        .eq("id",data.id)
        .eq("user_id",tnUser.id);
      if(updateError)throw updateError;
    }else{
      const {error:insertError}=await tnSupabase
        .from("tangonest_data")
        .insert({user_id:tnUser.id,data:payload});
      if(insertError)throw insertError;
    }
    return true;
  }catch(e){
    console.warn("Cloud save failed:",e);
    return false;
  }
}

// Override old refresh session behavior
refreshTangoNestSession = async function(){
  try{
    const user=await tnGetSessionUser();
    if(user){
      tnShowApp();
      updateAuthUI?.();
      if(!window.__tnCloudLoadedOnce){
        await tnLoadCloudSilently();
      }
    }else{
      if(tnHasGuestMode())tnShowApp();
      else tnShowLogin();
      updateAuthUI?.();
    }
  }catch(e){
    console.warn("Session refresh failed:",e);
    if(tnHasGuestMode())tnShowApp();
    else tnShowLogin();
  }
};

// Override login/signup so login loads cloud immediately.
gateLogin = async function(){
  const email=document.getElementById("gateEmail")?.value?.trim()||"";
  const password=document.getElementById("gatePassword")?.value||"";
  showResendButton?.(false);
  if(!email||!password){
    setGateMessage?.("Email and password are required.","error");
    return;
  }
  setGateMessage?.("Logging in...","info");
  try{
    ensureTangoNestSupabaseReady();
    const {data,error}=await tnSupabase.auth.signInWithPassword({email,password});
    if(error){
      if(typeof isEmailNotConfirmedError==="function" && isEmailNotConfirmedError(error.message)){
        setGateMessage?.("Email not confirmed. For development, turn off email confirmation in Supabase or use a confirmed account.","error");
        showResendButton?.(true);
      }else{
        setGateMessage?.(error.message,"error");
      }
      return;
    }
    tnUser=data.user;
    tnSetGuestMode(false);
    updateAuthUI?.();
    tnShowApp();
    setGateMessage?.("Logged in. Loading cloud data...","success");
    await tnLoadCloudSilently();
    tnStableToast?.("Logged in");
  }catch(e){
    setGateMessage?.(e.message||String(e),"error");
  }
};

gateSignUp = async function(){
  const email=document.getElementById("gateEmail")?.value?.trim()||"";
  const password=document.getElementById("gatePassword")?.value||"";
  showResendButton?.(false);
  if(!email||!password){
    setGateMessage?.("Email and password are required.","error");
    return;
  }
  if(password.length<6){
    setGateMessage?.("Password must be at least 6 characters.","error");
    return;
  }
  setGateMessage?.("Creating account...","info");
  try{
    ensureTangoNestSupabaseReady();
    const {data,error}=await tnSupabase.auth.signUp({email,password});
    if(error){
      setGateMessage?.(error.message,"error");
      return;
    }

    // If email confirmation is OFF, session should exist.
    tnUser=data.user||data.session?.user||null;
    if(data.session || tnUser){
      tnSetGuestMode(false);
      updateAuthUI?.();
      tnShowApp();
      await tnCloudSaveSilently();
      setGateMessage?.("Account created.","success");
      tnStableToast?.("Account created");
    }else{
      setGateMessage?.("Account created, but Supabase still requires email confirmation. Turn off email confirmation or confirm the email.","error");
      showResendButton?.(true);
    }
  }catch(e){
    setGateMessage?.(e.message||String(e),"error");
  }
};

continueAsGuest = function(){
  tnSetGuestMode(true);
  tnShowApp();
};

// Override logout: logout should show login page.
logoutTangoNest = async function(){
  try{
    ensureTangoNestSupabaseReady();
    await tnSupabase.auth.signOut();
  }catch(e){
    console.warn(e);
  }
  tnUser=null;
  window.__tnCloudLoadedOnce=false;
  tnSetGuestMode(false);
  updateAuthUI?.();
  tnShowLogin();
  tnStableToast?.("Logged out");
};

// Make updateAuthUI safe and consistent.
updateAuthUI = function(){
  const form=document.getElementById("authForm");
  const actions=document.getElementById("authActions");
  const status=document.getElementById("authStatus");
  const sub=document.getElementById("authSub");

  if(tnUser){
    if(status)status.textContent="Logged in";
    if(sub)sub.textContent=tnUser.email||"TangoNest account";
    if(form)form.style.display="none";
    if(actions)actions.style.display="flex";
  }else{
    if(status)status.textContent=tnHasGuestMode()?"Guest mode":"Not logged in";
    if(sub)sub.textContent=tnHasGuestMode()?"Local-only mode. Cloud sync is off.":"Login to sync across PC and phone.";
    if(form)form.style.display="flex";
    if(actions)actions.style.display="none";
  }
};

// Wrap save: local save + cloud save if logged in.
if(typeof save==="function" && !save.__beta59CloudWrapped){
  const oldSaveBeta59=save;
  save=function(){
    oldSaveBeta59();
    if(tnUser)tnCloudSaveSilently();
  };
  save.__beta59CloudWrapped=true;
}

// Wrap direct persist too, if available.
if(typeof persist==="function" && !persist.__beta59CloudWrapped){
  const oldPersistBeta59=persist;
  persist=function(){
    oldPersistBeta59();
    if(tnUser)tnCloudSaveSilently();
  };
  persist.__beta59CloudWrapped=true;
}

// Override Bulk Import again to include cloud save after local isolated persist.
if(typeof bulkImport==="function" && !bulkImport.__beta59CloudWrapped){
  const oldBulkImportBeta59=bulkImport;
  bulkImport=function(mode){
    oldBulkImportBeta59(mode);
    if(tnUser){
      // wait for oldBulkImport to mutate db/persist, then cloud save
      setTimeout(()=>tnCloudSaveSilently().then(ok=>{if(ok)tnStableToast?.("Saved to cloud");}),100);
    }
  };
  bulkImport.__beta59CloudWrapped=true;
}

// Better boot: check session before forcing login.
async function tnBootSession(){
  if(window.__tnBootChecked)return;
  window.__tnBootChecked=true;

  // If guest mode, do not bother user.
  if(tnHasGuestMode()){
    tnShowApp();
    return;
  }

  try{
    const user=await tnGetSessionUser();
    if(user){
      tnShowApp();
      updateAuthUI?.();
      await tnLoadCloudSilently();
    }else{
      tnShowLogin();
    }
  }catch(e){
    console.warn("Boot session check failed:",e);
    tnShowLogin();
  }
}

setTimeout(tnBootSession,100);
setTimeout(refreshTangoNestSession,900);
setTimeout(refreshTangoNestSession,2200);

// Listen to auth changes from Supabase.
setTimeout(()=>{
  try{
    ensureTangoNestSupabaseReady();
    if(!window.__tnAuthListenerSet){
      window.__tnAuthListenerSet=true;
      tnSupabase.auth.onAuthStateChange(async(_event,session)=>{
        tnUser=session?.user||null;
        if(tnUser){
          tnShowApp();
          updateAuthUI?.();
          await tnLoadCloudSilently();
        }else if(!tnHasGuestMode()){
          tnShowLogin();
          updateAuthUI?.();
        }
      });
    }
  }catch(e){
    console.warn(e);
  }
},500);



/* =========================================================
   Beta60 No-Email Sync Account
   Supabase Auth is NOT used.
   No email confirmation. No email OTP. No localhost redirect.
   Sync uses RPC functions:
   - tn_signup
   - tn_login
   - tn_save
========================================================= */

const TN_ACCOUNT_EMAIL_KEY = "tangonest_sync_email_v1";
const TN_ACCOUNT_HASH_KEY = "tangonest_sync_hash_v1";
const TN_ACCOUNT_MODE_KEY = "tangonest_sync_mode_v1";
let tnSyncEmail = localStorage.getItem(TN_ACCOUNT_EMAIL_KEY) || "";
let tnSyncHash = localStorage.getItem(TN_ACCOUNT_HASH_KEY) || "";
let tnCloudSaveTimer = null;
let tnBootDone = false;

function tnNoEmailShowApp(){
  const gate=document.getElementById("loginGate");
  if(gate)gate.classList.add("hidden");
  document.body.classList.add("tn-logged-in");
}

function tnNoEmailShowLogin(){
  const gate=document.getElementById("loginGate");
  if(gate)gate.classList.remove("hidden");
  document.body.classList.remove("tn-logged-in");
}

function tnNoEmailSetMessage(msg,type="info"){
  if(typeof setGateMessage==="function")setGateMessage(msg,type);
  else{
    const box=document.getElementById("gateMessage");
    if(box){box.textContent=msg;box.className="gate-message "+type;}
  }
}

function tnNoEmailToast(msg){
  const t=document.getElementById("toast");
  if(t){
    t.textContent=msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),1700);
  }else{
    console.log("[TangoNest]",msg);
  }
}

async function tnSha256(text){
  const bytes=new TextEncoder().encode(text);
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
}

async function tnPasswordHash(email,password){
  return await tnSha256("TangoNest::"+String(email).toLowerCase().trim()+"::"+password);
}

function tnGetGateCredentials(){
  return {
    email:(document.getElementById("gateEmail")?.value||"").trim().toLowerCase(),
    password:document.getElementById("gatePassword")?.value||""
  };
}

function tnRememberAccount(email,hash){
  tnSyncEmail=email;
  tnSyncHash=hash;
  localStorage.setItem(TN_ACCOUNT_EMAIL_KEY,email);
  localStorage.setItem(TN_ACCOUNT_HASH_KEY,hash);
  localStorage.setItem(TN_ACCOUNT_MODE_KEY,"sync");
  // Keep old auth listener from showing login.
  localStorage.setItem("tangonest_guest_mode","1");
}

function tnForgetAccount(){
  tnSyncEmail="";
  tnSyncHash="";
  localStorage.removeItem(TN_ACCOUNT_EMAIL_KEY);
  localStorage.removeItem(TN_ACCOUNT_HASH_KEY);
  localStorage.removeItem(TN_ACCOUNT_MODE_KEY);
  localStorage.removeItem("tangonest_guest_mode");
}

function tnIsRemembered(){
  return !!(localStorage.getItem(TN_ACCOUNT_EMAIL_KEY) && localStorage.getItem(TN_ACCOUNT_HASH_KEY));
}

function tnCloudPayload(){
  return {
    version:"tangonest-cloud-v2-no-email",
    savedAt:new Date().toISOString(),
    data:db
  };
}

function tnApplyCloudPayload(payload){
  const cloudDb=payload?.data || payload;
  if(!cloudDb || !cloudDb.words || !cloudDb.lists){
    return false;
  }
  db=cloudDb;
  try{
    if(typeof KEY!=="undefined")localStorage.setItem(KEY,JSON.stringify(db));
  }catch(e){console.warn(e)}
  try{render();}catch(e){
    console.warn("render recovered after cloud load",e);
    try{renderHome?.();renderWords?.();tnUpdateHeaderCountsOnly?.();}catch(_){}
  }
  return true;
}

async function tnRpcLogin(email,hash){
  ensureTangoNestSupabaseReady();
  const {data,error}=await tnSupabase.rpc("tn_login",{
    p_email:email,
    p_password_hash:hash
  });
  if(error)throw error;
  return data;
}

async function tnRpcSignup(email,hash){
  ensureTangoNestSupabaseReady();
  const {data,error}=await tnSupabase.rpc("tn_signup",{
    p_email:email,
    p_password_hash:hash,
    p_data:tnCloudPayload()
  });
  if(error)throw error;
  return data;
}

async function tnRpcSave(email=tnSyncEmail,hash=tnSyncHash){
  if(!email||!hash)return false;
  ensureTangoNestSupabaseReady();
  const {data,error}=await tnSupabase.rpc("tn_save",{
    p_email:email,
    p_password_hash:hash,
    p_data:tnCloudPayload()
  });
  if(error)throw error;
  if(data && data.ok===false)throw new Error(data.error||"Cloud save failed");
  return true;
}

async function tnNoEmailLoadCloud(){
  if(!tnSyncEmail||!tnSyncHash)return false;
  try{
    const result=await tnRpcLogin(tnSyncEmail,tnSyncHash);
    if(result?.ok===false)throw new Error(result.error||"Login failed");
    tnRememberAccount(tnSyncEmail,tnSyncHash);
    tnNoEmailShowApp();
    updateAuthUI?.();
    if(result?.data){
      tnApplyCloudPayload(result.data);
    }
    tnNoEmailToast("Cloud data loaded");
    return true;
  }catch(e){
    console.warn("No-email cloud load failed:",e);
    tnNoEmailSetMessage(
      String(e.message||e).includes("function") || String(e.message||e).includes("schema cache")
      ? "Cloud sync table is not ready. Run SUPABASE_SQL_RUN_ONCE.sql in Supabase SQL Editor."
      : e.message||String(e),
      "error"
    );
    return false;
  }
}

async function tnNoEmailSaveCloud(){
  if(!tnSyncEmail||!tnSyncHash)return false;
  try{
    await tnRpcSave(tnSyncEmail,tnSyncHash);
    return true;
  }catch(e){
    console.warn("No-email cloud save failed:",e);
    return false;
  }
}

function tnScheduleCloudSave(){
  if(!tnSyncEmail||!tnSyncHash)return;
  clearTimeout(tnCloudSaveTimer);
  tnCloudSaveTimer=setTimeout(async()=>{
    const ok=await tnNoEmailSaveCloud();
    if(ok)tnNoEmailToast("Saved to cloud");
  },650);
}

// Override visible auth UI
updateAuthUI = function(){
  const status=document.getElementById("authStatus");
  const sub=document.getElementById("authSub");
  const form=document.getElementById("authForm");
  const actions=document.getElementById("authActions");
  if(tnIsRemembered()){
    if(status)status.textContent="Logged in";
    if(sub)sub.textContent=localStorage.getItem(TN_ACCOUNT_EMAIL_KEY)||"TangoNest account";
    if(form)form.style.display="none";
    if(actions)actions.style.display="flex";
  }else{
    if(status)status.textContent="Not logged in";
    if(sub)sub.textContent="Login to sync across PC and phone.";
    if(form)form.style.display="flex";
    if(actions)actions.style.display="none";
  }
};

// Override login / signup
gateLogin = async function(){
  const {email,password}=tnGetGateCredentials();
  if(!email||!password){
    tnNoEmailSetMessage("Email and password are required.","error");
    return;
  }
  tnNoEmailSetMessage("Logging in...","info");
  try{
    const hash=await tnPasswordHash(email,password);
    const result=await tnRpcLogin(email,hash);
    if(result?.ok===false)throw new Error(result.error||"Login failed");
    tnRememberAccount(email,hash);
    tnNoEmailShowApp();
    if(result?.data)tnApplyCloudPayload(result.data);
    updateAuthUI?.();
    tnNoEmailSetMessage("Logged in.","success");
    tnNoEmailToast("Logged in");
  }catch(e){
    tnNoEmailSetMessage(
      String(e.message||e).includes("Could not find the function") || String(e.message||e).includes("schema cache")
      ? "Cloud sync is not ready. Run SUPABASE_SQL_RUN_ONCE.sql once in Supabase."
      : e.message||String(e),
      "error"
    );
  }
};

gateSignUp = async function(){
  const {email,password}=tnGetGateCredentials();
  if(!email||!password){
    tnNoEmailSetMessage("Email and password are required.","error");
    return;
  }
  if(password.length<6){
    tnNoEmailSetMessage("Password must be at least 6 characters.","error");
    return;
  }
  tnNoEmailSetMessage("Creating sync account...","info");
  try{
    const hash=await tnPasswordHash(email,password);
    const result=await tnRpcSignup(email,hash);
    if(result?.ok===false)throw new Error(result.error||"Create account failed");
    tnRememberAccount(email,hash);
    tnNoEmailShowApp();
    updateAuthUI?.();
    tnNoEmailSetMessage("Account created.","success");
    tnNoEmailToast("Account created and saved to cloud");
  }catch(e){
    tnNoEmailSetMessage(
      String(e.message||e).includes("Could not find the function") || String(e.message||e).includes("schema cache")
      ? "Cloud sync is not ready. Run SUPABASE_SQL_RUN_ONCE.sql once in Supabase."
      : e.message||String(e),
      "error"
    );
  }
};

continueAsGuest = function(){
  localStorage.setItem("tangonest_guest_mode","1");
  tnNoEmailShowApp();
};

logoutTangoNest = async function(){
  tnForgetAccount();
  updateAuthUI?.();
  tnNoEmailShowLogin();
  tnNoEmailToast("Logged out");
};

syncNowToCloud = async function(){
  if(!tnIsRemembered()){
    tnNoEmailToast("Login first");
    tnNoEmailShowLogin();
    return;
  }
  const ok=await tnNoEmailSaveCloud();
  tnNoEmailToast(ok?"Saved to cloud":"Cloud save failed");
};

loadFromCloud = async function(){
  if(!tnIsRemembered()){
    tnNoEmailToast("Login first");
    tnNoEmailShowLogin();
    return;
  }
  await tnNoEmailLoadCloud();
};

// Keep old email confirmation UI hidden forever in no-email mode.
function showResendButton(){const b=document.getElementById("resendEmailBtn");if(b)b.style.display="none";}
function resendConfirmEmail(){tnNoEmailSetMessage("Email confirmation is not used in this version.","info");}

// Save wrappers
if(typeof save==="function"&&!save.__beta60NoEmailWrapped){
  const oldSaveBeta60=save;
  save=function(renderUI=true){
    oldSaveBeta60(renderUI);
    tnScheduleCloudSave();
  };
  save.__beta60NoEmailWrapped=true;
}

if(typeof persist==="function"&&!persist.__beta60NoEmailWrapped){
  const oldPersistBeta60=persist;
  persist=function(){
    oldPersistBeta60();
    tnScheduleCloudSave();
  };
  persist.__beta60NoEmailWrapped=true;
}

// Ensure Bulk Add cloud-saves after isolated import.
if(typeof bulkImport==="function"&&!bulkImport.__beta60NoEmailWrapped){
  const oldBulkImportBeta60=bulkImport;
  bulkImport=function(mode){
    oldBulkImportBeta60(mode);
    tnScheduleCloudSave();
  };
  bulkImport.__beta60NoEmailWrapped=true;
}

// Auto hide login on reload if account remembered.
async function tnNoEmailBoot(){
  if(tnBootDone)return;
  tnBootDone=true;

  if(tnIsRemembered()){
    tnNoEmailShowApp();
    updateAuthUI?.();
    await tnNoEmailLoadCloud();
    return;
  }

  if(localStorage.getItem("tangonest_guest_mode")==="1"){
    tnNoEmailShowApp();
    return;
  }

  tnNoEmailShowLogin();
}

// Maintain gate state to defeat old Supabase Auth listeners.
function tnMaintainNoEmailGate(){
  if(tnIsRemembered() || localStorage.getItem("tangonest_guest_mode")==="1"){
    tnNoEmailShowApp();
  }
}

setTimeout(tnNoEmailBoot,20);
setTimeout(tnNoEmailBoot,250);
setTimeout(tnMaintainNoEmailGate,600);
setInterval(tnMaintainNoEmailGate,1200);



/* =========================================================
   Beta61 Add Word Stable Register Fix
   Add Word must not depend on old save()/render() chain.
========================================================= */

function tnVal(id){
  return (document.getElementById(id)?.value ?? "").trim();
}

function tnSelected(id,fallback=""){
  const el=document.getElementById(id);
  return el?.value || fallback;
}

function tnStableId(){
  return "w_"+Date.now()+"_"+Math.random().toString(16).slice(2);
}

function tnStableAddDays(n){
  const d=new Date();
  d.setDate(d.getDate()+n);
  return d.toISOString();
}

function tnStablePersist(){
  if(typeof KEY!=="undefined"){
    localStorage.setItem(KEY,JSON.stringify(db));
  }else{
    localStorage.setItem("tangonest_local_data_v1",JSON.stringify(db));
  }
}

function tnStableUpdateCounts(){
  const words=db.words||[];
  const lists=db.lists||[];
  const learned=words.filter(w=>w.status==="learned").length;
  const hard=words.filter(w=>w.status==="hard").length;
  const set=(id,val)=>{
    const el=document.getElementById(id);
    if(el)el.textContent=val;
  };
  ["wc","totalWords","dashTotal","heroWords"].forEach(id=>set(id,words.length));
  ["listCount","totalLists","heroLists"].forEach(id=>set(id,lists.length));
  ["lc","totalLearned","heroLearned"].forEach(id=>set(id,learned));
  ["hc","totalHard","dashHard"].forEach(id=>set(id,hard));
}

function tnStableNotify(msg){
  const t=document.getElementById("toast");
  if(t){
    t.textContent=msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),1600);
  }else{
    console.log("[TangoNest]",msg);
  }
}

function tnClearAddForm(){
  ["front","back","memo","tags"].forEach(id=>{
    const el=document.getElementById(id);
    if(el)el.value="";
  });
  const pos=document.getElementById("pos");
  if(pos)pos.value="";
  const gender=document.getElementById("gender");
  if(gender)gender.value="";
}

function tnMakeWordFromAddForm(){
  const front=tnVal("front");
  const back=tnVal("back");
  if(!front || !back){
    throw new Error("Front and Back are required.");
  }
  const word={
    id:tnStableId(),
    front,
    back,
    frontLang:tnSelected("frontLang","en-US"),
    backLang:tnSelected("backLang","ja-JP"),
    listId:tnSelected("addList", db.lists?.[0]?.id || "starter"),
    pos:tnSelected("pos",""),
    gender:tnSelected("gender",""),
    tags:tnVal("tags"),
    memo:tnVal("memo"),
    saved:false,
    status:"new",
    seen:0,
    level:1,
    nextReview:tnStableAddDays(1),
    createdAt:new Date().toISOString()
  };
  return word;
}

async function tnRegisterWordStable(){
  try{
    const word=tnMakeWordFromAddForm();
    db.words = db.words || [];
    db.words.push(word);

    // Local save first. No old save()/render() dependency.
    tnStablePersist();
    tnStableUpdateCounts();

    // Refresh visible list only if safe.
    try{ if(typeof renderWords==="function")renderWords(); }catch(e){console.warn("renderWords skipped",e);}
    try{ if(typeof renderHome==="function")renderHome(); }catch(e){console.warn("renderHome skipped",e);tnStableUpdateCounts();}

    tnClearAddForm();
    tnStableNotify("1 word added");

    // Cloud save, no blocking.
    if(typeof tnScheduleCloudSave==="function"){
      tnScheduleCloudSave();
    }else if(typeof tnNoEmailSaveCloud==="function"){
      tnNoEmailSaveCloud().then(ok=>{if(ok)tnStableNotify("Saved to cloud");});
    }
  }catch(e){
    console.error("Add Word error:",e);
    tnStableNotify(e.message || "Add Word error");
    let box=document.getElementById("addWordError");
    if(!box){
      const btn=document.getElementById("addWordBtn");
      box=document.createElement("div");
      box.id="addWordError";
      box.className="gate-message error add-error";
      btn?.parentElement?.appendChild(box);
    }
    if(box)box.textContent=e.message || "Add Word error";
  }
}

// Override old functions if buttons or old code call them.
addWord = tnRegisterWordStable;
registerWord = tnRegisterWordStable;

function tnBindAddWordButtonStable(){
  const btn=document.getElementById("addWordBtn") || [...document.querySelectorAll("button")].find(b=>(b.textContent||"").trim()==="+ Register");
  if(btn){
    btn.id="addWordBtn";
    btn.onclick=(e)=>{e.preventDefault();tnRegisterWordStable();return false;};
  }
}
setTimeout(tnBindAddWordButtonStable,50);
setTimeout(tnBindAddWordButtonStable,500);
setTimeout(tnBindAddWordButtonStable,1500);



/* =========================================================
   Beta62 True Login Gate
   Login screen is not a normal layer anymore.
   It appears only when there is no remembered sync account / guest mode.
========================================================= */

function tnHasSavedSession(){
  try{
    return !!(
      localStorage.getItem("tangonest_sync_email_v1") &&
      localStorage.getItem("tangonest_sync_hash_v1")
    );
  }catch(e){return false;}
}

function tnIsGuestMode(){
  try{return localStorage.getItem("tangonest_guest_mode")==="1";}catch(e){return false;}
}

function tnGateApplyState(){
  const has=tnHasSavedSession() || tnIsGuestMode();
  document.documentElement.classList.toggle("tn-has-session",has);
  document.documentElement.classList.toggle("tn-needs-auth",!has);
  document.body?.classList.toggle("tn-logged-in",has);
  const gate=document.getElementById("loginGate");
  if(gate){
    gate.classList.toggle("hidden",has);
    gate.setAttribute("aria-hidden",has?"true":"false");
  }
}

function tnShowApp(){
  document.documentElement.classList.add("tn-has-session");
  document.documentElement.classList.remove("tn-needs-auth");
  document.body?.classList.add("tn-logged-in");
  const gate=document.getElementById("loginGate");
  if(gate){
    gate.classList.add("hidden");
    gate.setAttribute("aria-hidden","true");
  }
}

function tnShowLogin(){
  document.documentElement.classList.remove("tn-has-session");
  document.documentElement.classList.add("tn-needs-auth");
  document.body?.classList.remove("tn-logged-in");
  const gate=document.getElementById("loginGate");
  if(gate){
    gate.classList.remove("hidden");
    gate.setAttribute("aria-hidden","false");
  }
}

function tnNoEmailShowApp(){tnShowApp();}
function tnNoEmailShowLogin(){tnShowLogin();}

// Override the maintenance function from older builds.
function tnMaintainNoEmailGate(){
  if(tnHasSavedSession() || tnIsGuestMode()) tnShowApp();
  else tnShowLogin();
}

// Strong boot behavior.
function tnBootGateOnly(){
  tnGateApplyState();
}
setTimeout(tnBootGateOnly,0);
setTimeout(tnBootGateOnly,100);
setTimeout(tnBootGateOnly,600);

// After login/signup, old functions call tnRememberAccount. Ensure it hides login immediately.
if(typeof tnRememberAccount==="function" && !tnRememberAccount.__beta62Wrapped){
  const oldRememberBeta62=tnRememberAccount;
  tnRememberAccount=function(email,hash){
    oldRememberBeta62(email,hash);
    tnShowApp();
  };
  tnRememberAccount.__beta62Wrapped=true;
}

// After logout, force login page.
if(typeof logoutTangoNest==="function" && !logoutTangoNest.__beta62Wrapped){
  const oldLogoutBeta62=logoutTangoNest;
  logoutTangoNest=async function(){
    try{await oldLogoutBeta62();}catch(e){console.warn(e);}
    tnShowLogin();
  };
  logoutTangoNest.__beta62Wrapped=true;
}

// If the user is remembered, do not let older Supabase Auth listeners bring the login gate back.
setInterval(()=>{
  if(tnHasSavedSession() || tnIsGuestMode()) tnShowApp();
},1000);



/* =========================================================
   Beta64 CRITICAL Add Word + Default Language Fix
   This is the final Add Word path. It does not depend on old addWord/save/render.
========================================================= */

function tn64$(id){ return document.getElementById(id); }
function tn64Val(id){ return (tn64$(id)?.value ?? "").trim(); }
function tn64SetValue(id,val){
  const el=tn64$(id);
  if(!el)return;
  if(el.tagName==="SELECT"){
    const opt=[...el.options].find(o=>o.value===val);
    if(opt)el.value=val;
  }else{
    el.value=val;
  }
}
function tn64Toast(msg){
  const t=tn64$("toast");
  if(t){
    t.textContent=msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"),1700);
  }else{
    console.log("[TangoNest]",msg);
  }
}
function tn64Id(){ return "w_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2); }
function tn64TodayPlus(n){
  const d=new Date();
  d.setDate(d.getDate()+n);
  return d.toISOString().slice(0,10);
}
function tn64Persist(){
  try{
    if(typeof KEY!=="undefined") localStorage.setItem(KEY, JSON.stringify(db));
    else localStorage.setItem("tangonest_data", JSON.stringify(db));
  }catch(e){
    console.error("localStorage save failed",e);
    throw new Error("Local save failed");
  }
}
function tn64UpdateCounts(){
  const words=db.words||[];
  const lists=db.lists||[];
  const learned=words.filter(w=>w.status==="learned").length;
  const hard=words.filter(w=>w.status==="hard").length;
  const set=(id,val)=>{ const el=tn64$(id); if(el)el.textContent=val; };
  ["wc","totalWords","dashTotal","heroWords"].forEach(id=>set(id,words.length));
  ["listCount","totalLists","heroLists"].forEach(id=>set(id,lists.length));
  ["lc","totalLearned","heroLearned"].forEach(id=>set(id,learned));
  ["hc","totalHard","dashHard"].forEach(id=>set(id,hard));
}
function tn64EnsureEnglishJapaneseDefaults(){
  // Only default form selectors. Existing words/playlists are not touched.
  if(db){
    db.prefs=db.prefs||{};
    db.prefs.frontLang="en-US";
    db.prefs.backLang="ja-JP";
  }
  tn64SetValue("frontLang","en-US");
  tn64SetValue("backLang","ja-JP");
  tn64SetValue("bulkFrontLang","en-US");
  tn64SetValue("bulkBackLang","ja-JP");
  const front=tn64$("front"); if(front)front.placeholder="apple";
  const back=tn64$("back"); if(back)back.placeholder="りんご";
  const memo=tn64$("memo"); if(memo)memo.placeholder="I eat an apple.";
  const bulk=tn64$("bulkText");
  if(bulk)bulk.placeholder="apple\tりんご\tnoun\tnone\tI eat an apple.\nteacher\t先生\tnoun\tnone\tI am a teacher.";
  try{ tn64Persist(); }catch(e){}
}
function tn64ClearAddFields(){
  ["front","back","memo","tags"].forEach(id=>{ const el=tn64$(id); if(el)el.value=""; });
  const pos=tn64$("pos"); if(pos)pos.value="";
  const gender=tn64$("gender"); if(gender)gender.value="";
  tn64EnsureEnglishJapaneseDefaults();
}
function tn64MakeWord(){
  const front=tn64Val("front");
  const back=tn64Val("back");
  if(!front || !back){
    throw new Error("Front and Back are required.");
  }
  let listId=tn64$("addList")?.value;
  if(!listId){
    listId=(db.lists&&db.lists[0]&&db.lists[0].id) || "starter";
  }
  if(!db.lists || !db.lists.length){
    db.lists=[{id:"starter",name:"New Playlist"}];
    listId="starter";
  }
  return {
    id:tn64Id(),
    front,
    back,
    frontLang:"en-US",
    backLang:"ja-JP",
    listId,
    pos:tn64$("pos")?.value || "",
    gender:tn64$("gender")?.value || "",
    tags:tn64Val("tags"),
    memo:tn64Val("memo"),
    saved:false,
    status:"new",
    seen:0,
    level:1,
    nextReview:tn64TodayPlus(1),
    createdAt:new Date().toISOString()
  };
}
async function tn64CloudSaveNonBlocking(){
  try{
    if(typeof tnScheduleCloudSave==="function"){
      tnScheduleCloudSave();
      return;
    }
    if(typeof tnNoEmailSaveCloud==="function"){
      const ok=await tnNoEmailSaveCloud();
      if(ok)tn64Toast("Saved to cloud");
      return;
    }
  }catch(e){
    console.warn("cloud save skipped",e);
  }
}
function tnRegisterWordCritical(ev){
  if(ev && ev.preventDefault)ev.preventDefault();
  try{
    if(!db)throw new Error("Data is not ready");
    db.words=db.words||[];
    db.lists=db.lists&&db.lists.length?db.lists:[{id:"starter",name:"New Playlist"}];

    const word=tn64MakeWord();
    db.words.push(word);

    // Direct local save first. This is the critical part.
    tn64Persist();
    tn64UpdateCounts();

    // Try safe visual refresh, but do not depend on it.
    try{ if(typeof renderSelect==="function")renderSelect("wordListSelect",true); }catch(e){}
    try{ if(typeof renderWords==="function")renderWords(); }catch(e){ console.warn("renderWords skipped",e); }
    try{ if(typeof renderHome==="function")renderHome(); }catch(e){ console.warn("renderHome skipped",e); tn64UpdateCounts(); }

    tn64ClearAddFields();
    tn64Toast("1 word added");
    tn64CloudSaveNonBlocking();
    return false;
  }catch(e){
    console.error("CRITICAL Add Word error:",e);
    tn64Toast(e.message || "Add Word error");
    let box=tn64$("addWordError");
    if(!box){
      box=document.createElement("div");
      box.id="addWordError";
      box.className="gate-message error add-error";
      const btn=tn64$("addWordBtn") || [...document.querySelectorAll("button")].find(b=>(b.textContent||"").includes("Register"));
      (btn?.parentElement || document.body).appendChild(box);
    }
    box.textContent=e.message || "Add Word error";
    return false;
  }
}

// Force old function names and inline handlers to the critical path.
window.tnRegisterWordCritical=tnRegisterWordCritical;
window.addWord=tnRegisterWordCritical;
window.registerWord=tnRegisterWordCritical;

function tn64BindCriticalAddButton(){
  const btn=tn64$("addWordBtn") || [...document.querySelectorAll("button")].find(b=>(b.textContent||"").trim()==="＋ Register" || (b.textContent||"").trim()==="+ Register");
  if(btn){
    btn.id="addWordBtn";
    btn.type="button";
    btn.onclick=tnRegisterWordCritical;
  }
}
function tn64BootDefaultsAndButtons(){
  tn64EnsureEnglishJapaneseDefaults();
  tn64BindCriticalAddButton();
}
setTimeout(tn64BootDefaultsAndButtons,0);
setTimeout(tn64BootDefaultsAndButtons,200);
setTimeout(tn64BootDefaultsAndButtons,900);
setTimeout(tn64BootDefaultsAndButtons,1800);

// If render/fillLangSelects resets the selectors, put them back to English/Japanese.
if(typeof fillLangSelects==="function" && !fillLangSelects.__beta64Wrapped){
  const oldFillLangSelects64=fillLangSelects;
  fillLangSelects=function(){
    oldFillLangSelects64();
    tn64EnsureEnglishJapaneseDefaults();
  };
  fillLangSelects.__beta64Wrapped=true;
}
if(typeof render==="function" && !render.__beta64DefaultWrapped){
  const oldRender64=render;
  render=function(){
    oldRender64();
    tn64EnsureEnglishJapaneseDefaults();
    tn64BindCriticalAddButton();
  };
  render.__beta64DefaultWrapped=true;
}


/* Beta73 Emergency Click Fix loaded inline in index.html */
