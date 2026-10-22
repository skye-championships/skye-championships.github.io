// منطق الموقع. ما تحتاج تعدل هنا لبطولة جديدة، كل شي في config.js
(function(){
"use strict";
const C=window.TOURNAMENT||{};
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const safeUrl=u=>/^https?:\/\//i.test(u||"")?u:null;
const LS={get(k,d){try{const v=localStorage.getItem(k);return v?JSON.parse(v):d}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const TID=String(C.id||"tournament");
const MAXP=+C.maxPlayers||128;
const FBV="10.12.2";
const arr=x=>Array.isArray(x)?x:[];

// ---------- branding from config
function brand(){
  document.title=C.pageTitle||"البطولة";
  const lg=C.logo||{};const logoHtml=`${esc(lg.main||"")}<i>${esc(lg.accent||"")}</i>`;
  $("logo").innerHTML=logoHtml;$("w-logo").innerHTML=`<span>${logoHtml}</span>`;
  $("game").textContent=C.game||"";$("w-game").textContent=C.game||"";
  const md=C.mode||{};
  $("mode").innerHTML=`<span class="bf">${esc(md.main||"")}</span> <span class="v">${esc(md.tag||"")}</span>`;
  $("w-box").innerHTML=`${esc(md.main||"")} <span>${esc(md.tag||"")}</span>`;
  $("wm").textContent=C.watermark||"";
  const w=C.welcome||{};const big=w.big||[];
  const sub=[...String(w.sub||"")].map((ch,i)=>i%2?`<i>${esc(ch)}</i>`:esc(ch)).join("");
  $("w-type").innerHTML=(big[0]?`<span class="t1">${esc(big[0])}</span>`:"")+(big[1]?`<span class="t2">${esc(big[1])}</span>`:"")+(sub?`<span class="t3">${sub}</span>`:"");
  $("enter").innerHTML=`${esc(w.button||"Enter")}${w.buttonAr?`<span>${esc(w.buttonAr)}</span>`:""}`;
  const links=arr(C.links).filter(l=>safeUrl(l.url));
  const facts=arr(C.facts).map(f=>`<div class="fact"><div><small>${esc(f.label)}</small><b>${f.num?`<span class="num">${esc(f.value)}</span>`:esc(f.value)}${f.unit?" "+esc(f.unit):""}</b></div></div>`).join("");
  const linkFacts=links.map(l=>`<a class="fact" href="${esc(l.url)}" target="_blank" rel="noopener"><div><small>رابط</small><b>${esc(l.label)} ↗</b></div></a>`).join("");
  $("facts").innerHTML=facts+linkFacts;
  $("w-links").hidden=!links.length;
  $("w-links").innerHTML=links.map(l=>`<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)}</a>`).join("");
}
function welcomeInfo(n){
  const parts=arr(C.facts).map(f=>`<div><small>${esc(f.label)}</small><b>${f.num?`<span class="num">${esc(f.value)}</span>`:esc(f.value)}${f.unit?" "+esc(f.unit):""}</b></div>`);
  parts.push(`<div><small>اللاعبين</small><b class="num">${n}</b></div>`);
  $("w-info").innerHTML=parts.join("<hr>");
}

// ---------- skins from config
const SK=C.skins||{};const skinIds=Object.keys(SK);
const allVars=[...new Set(skinIds.flatMap(id=>Object.keys(SK[id].colors||{})))];
function setSkin(id){
  if(!SK[id])id=SK[C.defaultSkin]?C.defaultSkin:skinIds[0];if(!id)return;
  const root=document.documentElement,s=SK[id];
  allVars.forEach(k=>root.style.removeProperty("--"+k));
  Object.entries(s.colors||{}).forEach(([k,v])=>root.style.setProperty("--"+k,v));
  root.style.colorScheme=s.light?"light":"dark";
  document.querySelectorAll(".sk").forEach(b=>b.setAttribute("aria-pressed",b.dataset.skin===id));
  const n=document.getElementById("skn");if(n)n.textContent=s.name||id;
  LS.set("skin:"+TID,id);
  if(typeof artColors==="function"&&window.THREE)artColors();
}
function skins(){
  const box=$("skins");if(skinIds.length<2){box.hidden=true;setSkin(skinIds[0]);return}
  box.innerHTML=`<span id="skn"></span>`+skinIds.map(id=>{const s=SK[id],sw=s.swatch||["#888","#222"];
    return`<button class="sk" data-skin="${esc(id)}" title="${esc(s.name||id)}" aria-label="ثيم ${esc(s.name||id)}"><i style="background:linear-gradient(135deg,${esc(sw[0])} 50%,${esc(sw[1])} 50%)"></i></button>`}).join("");
  box.querySelectorAll(".sk").forEach(b=>b.onclick=()=>window.Motion?Motion.theme(()=>setSkin(b.dataset.skin),b):setSkin(b.dataset.skin));
  setSkin(LS.get("skin:"+TID,C.defaultSkin));
}

// ---------- bracket logic (pure, from data D)
const K=(r,m)=>`r${r}m${m}`;
const roundName=p=>p===2?"النهائي":p===4?"نصف النهائي":p===8?"ربع النهائي":"دور الـ"+p;
function logic(D){
  const size=(()=>{let n=2;while(n<D.players.length)n*=2;return n})();
  const nRounds=Math.log2(size);
  const mCount=r=>size/2**(r+1);
  const playersLeft=r=>size/2**r;
  const isBo3=r=>playersLeft(r)<=+D.bo3From;
  const need=r=>isBo3(r)?2:1;
  const memo=new Map();
  function slot(r,m,k){if(r===0){const i=k?m+size/2:m;return D.players[i]??null}return winner(r-1,m*2+k)}
  function wins(r,m){const g=D.res[K(r,m)]||[];return[g.filter(x=>x===0).length,g.filter(x=>x===1).length]}
  function winner(r,m){const key=K(r,m);if(memo.has(key))return memo.get(key);
    const a=slot(r,m,0),b=slot(r,m,1);let w=null;
    if(r===0&&a&&!b)w=a;else if(r===0&&!a&&b)w=b;else if(a&&b){const s=wins(r,m),n=need(r);w=s[0]>=n?a:s[1]>=n?b:null}
    memo.set(key,w);return w}
  const isBye=(r,m)=>r===0&&(!slot(r,m,0)||!slot(r,m,1));
  const isLive=(r,m)=>{const a=slot(r,m,0),b=slot(r,m,1),s=wins(r,m);return!!(a&&b&&!winner(r,m)&&s[0]+s[1]>0)};
  function laterKeys(r,m){const out=[];for(let rr=r+1,mm=m;rr<nRounds;rr++){mm=Math.floor(mm/2);out.push(K(rr,mm))}return out}
  function curRound(){for(let r=0;r<nRounds;r++)for(let m=0;m<mCount(r);m++)if(!winner(r,m))return r;return nRounds-1}
  const RN=r=>roundName(playersLeft(r));
  const champ=()=>winner(nRounds-1,0);
  const matchNo=(r,m)=>{let b=0;for(let rr=0;rr<r;rr++)b+=mCount(rr);return b+m+1};
  // every player's run through the tournament
  function runs(){
    const P=new Map(D.players.map(p=>[p,{name:p,best:0,out:false,gw:0,gl:0,mw:0,matches:[]}]));
    for(let r=0;r<nRounds;r++)for(let m=0;m<mCount(r);m++){
      const a=slot(r,m,0),b=slot(r,m,1),w=winner(r,m),s=wins(r,m),bye=isBye(r,m);
      [a,b].forEach((p,k)=>{if(!p||!P.has(p))return;const o=P.get(p),opp=k?a:b;
        o.best=Math.max(o.best,r);
        const st=bye?"bye":w?(w===p?"w":"l"):isLive(r,m)?"live":opp?"next":"wait";
        if(!bye){o.gw+=s[k];o.gl+=s[1-k]}
        if(st==="w"||st==="bye")o.mw+=st==="w"?1:0;if(st==="l")o.out=true;
        o.matches.push({r,m,opp,st,score:bye?null:[s[k],s[1-k]]})})}
    return P;
  }
  return{size,nRounds,mCount,playersLeft,isBo3,need,slot,wins,winner,isBye,isLive,laterKeys,curRound,RN,champ,matchNo,runs};
}
function normalize(d){d=d||{};return{players:Array.isArray(d.players)?d.players.map(String):[],res:(d.res&&typeof d.res==="object")?d.res:{},bo3From:+d.bo3From||+C.bo3From||16}}

// ---------- state
const FB=C.firebase||{};const CLOUD=!!(FB.apiKey&&FB.projectId);
let D=null,G=null,RUNS=null,loaded=false;
let user=null,role=CLOUD?"":"local";       // local | owner | admin | ""
let localEdit=!!LS.get("edit:"+TID,false);   // local mode: editing is a toggle so the default view is the public one
let admins=[],adminsUnsub=null;
let db=null,auth=null,ref=null;
const UI={round:null};
let Q="",askReset=false,dirty=false;
const canEdit=()=>(role==="local"&&localEdit)||role==="admin"||role==="owner";
const isOwner=()=>role==="owner";

function toast(msg){if(window.Motion)return Motion.toast(msg);const t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2600)}
function fail(e){console.error(e);toast(e&&e.code==="permission-denied"?"ما عندك صلاحية لهذا التعديل":"صار خطأ، حاول مرة ثانية")}
let PREV=null;   // آخر نتائج شفناها، عشان نلمّع البطاقة اللي تغيرت
function dataChanged(){G=D&&D.players.length>=2?logic(D):null;RUNS=G?G.runs():null;loaded=true;render();
  const prev=PREV;PREV=D?{p:D.players.join("\n"),res:Object.fromEntries(Object.entries(D.res).map(([k,v])=>[k,v.slice()]))}:null;
  if(!window.Motion||!prev||!PREV||prev.p!==PREV.p)return;
  const ch=[];for(const k of new Set([...Object.keys(prev.res),...Object.keys(PREV.res)])){const a=prev.res[k]||[],b=PREV.res[k]||[];if(a.join()!==b.join())ch.push({key:k,grew:b.length>a.length,k:b[b.length-1]})}
  if(ch.length)Motion.results(ch)}

// ---------- local mode (no Firebase): demo data saved in this browser only
const SAMPLE=(()=>{const a=["Shadow","Viper","Nova","Blaze","Ghost","Rynz","Zed","Kai","Frost","Hex","Ace","Raptor","Clix","Lynx","Bolt","Echo","Mako","Jinx","Onyx","Pulse","Sly","Toxic","Vex","Wolf"],b=["","SA","x","7","99","FN","KSA","_","1"],c=["فهد","سعود","راكان","تركي","نواف","ريان","عبدالله","يزن","مشعل","بندر","ماجد","خالد"];
 const out=[];let i=0;while(out.length<96){const n=i%5===4?c[i%c.length]+"_"+(i%9+1):a[i%a.length]+b[(i*7)%b.length]+(i>a.length*2?i:"");if(!out.includes(n))out.push(n);i++}return out})();
function demoData(){const d={players:SAMPLE.slice(),res:{},bo3From:+C.bo3From||16};const h=s=>{let x=3;for(const c of s)x=(x*29+c.charCodeAt(0))%997;return x};
  for(let r=0;r<2;r++){const c=logic(d).mCount(r);for(let m=0;m<(r===0?c:Math.floor(c*.6));m++){const g=logic(d);if(g.isBye(r,m))continue;const a=g.slot(r,m,0),b=g.slot(r,m,1);if(!a||!b)continue;const k=h(a+b)%2;d.res[K(r,m)]=g.need(r)===1?[k]:h(b+a)%3===0?[k,1-k,k]:[k,k]}}
  return d}
const saveLocal=()=>LS.set("data:"+TID,D);

// ---------- writes (local or cloud). Cloud writes are checked again by firestore.rules
const SV=()=>firebase.firestore.FieldValue.serverTimestamp();
const DEL=()=>firebase.firestore.FieldValue.delete();
const Act={
  async addWin(r,m,k){
    if(!CLOUD){if(G.winner(r,m))return;const key=K(r,m);(D.res[key]=D.res[key]||[]).push(k);saveLocal();return dataChanged()}
    try{await db.runTransaction(async t=>{const s=await t.get(ref);if(!s.exists)return;const d=normalize(s.data()),g=logic(d);
      if(g.winner(r,m)||!g.slot(r,m,0)||!g.slot(r,m,1))return;
      t.update(ref,{["res."+K(r,m)]:[...(d.res[K(r,m)]||[]),k],updatedAt:SV()})})}catch(e){fail(e)}
  },
  async undo(r,m){
    const keys=[K(r,m),...G.laterKeys(r,m)];
    if(!CLOUD){keys.forEach(k=>delete D.res[k]);saveLocal();return dataChanged()}
    const u={updatedAt:SV()};keys.forEach(k=>u["res."+k]=DEL());
    try{await ref.update(u)}catch(e){fail(e)}
  },
  async setPlayers(players){
    let size=2;while(size<players.length)size*=2;
    const bo=Math.min(D?+D.bo3From:+C.bo3From||16,size);
    if(!CLOUD){D={players,res:{},bo3From:bo};saveLocal();return dataChanged()}
    try{await ref.set({players,res:{},bo3From:bo,updatedAt:SV(),updatedBy:user.email})}catch(e){fail(e)}
  },
  async setBo3(v){
    if(!CLOUD){D.bo3From=v;D.res={};saveLocal();return dataChanged()}
    try{await ref.update({bo3From:v,res:{},updatedAt:SV()})}catch(e){fail(e)}
  },
  async reset(){
    if(!CLOUD){D.res={};saveLocal();return dataChanged()}
    try{await ref.update({res:{},updatedAt:SV()})}catch(e){fail(e)}
  },
  async addAdmin(email,r){
    try{await db.collection("admins").doc(email).set({role:r,addedBy:user.email.toLowerCase(),addedAt:SV()});toast("تمت الإضافة")}catch(e){fail(e)}
  },
  async removeAdmin(email){try{await db.collection("admins").doc(email).delete()}catch(e){fail(e)}},
};

// ---------- pages
// hidden: page leaves the menu when its config content is empty
const PAGES={
  home:    {nav:"الرئيسية",view:viewHome},
  matches: {nav:"المباريات",title:"المباريات",sub:"كل مباريات البطولة دور بدور.",view:viewRounds,search:true},
  bracket: {nav:"البراكت",title:"البراكت كامل",sub:"طريق كل لاعب للنهائي. اسحب للتنقل، والعجلة للتكبير.",view:viewBracket,search:true},
  players: {nav:"اللاعبين",title:"اللاعبين",sub:"ابحث عن اسمك عشان تشوف مبارياتك وخصمك الجاي.",view:viewPlayers,search:true},
  player:  {title:"",view:viewPlayer},
  schedule:{nav:"المواعيد",title:"مواعيد الأدوار",sub:"المواعيد تقريبية وممكن تتقدم أو تتأخر حسب سير المباريات.",view:viewSchedule,hidden:()=>!arr(C.schedule).length},
  rules:   {nav:"القوانين",title:"القوانين",sub:"المشاركة في البطولة تعني موافقتك على هذي القوانين.",view:viewRules,hidden:()=>!arr(C.rules).length},
  prizes:  {nav:"الجوائز",title:"الجوائز",sub:"",view:viewPrizes,hidden:()=>!arr(C.prizes).length},
  faq:     {nav:"الأسئلة",title:"الأسئلة الشائعة",sub:"",view:viewFaq,hidden:()=>!arr(C.faq).length},
  hall:    {nav:"الأبطال",title:"قاعة الأبطال",sub:"أبطال البطولات.",view:viewHall,hidden:()=>!arr(C.champions).length&&!(G&&G.champ())},
  register:{nav:"التسجيل",title:"التسجيل",sub:"",view:viewRegister,hidden:()=>!(C.registration&&C.registration.open)},
  settings:{title:"لوحة التحكم",sub:"أضف اللاعبين وسجّل النتائج من صفحة المباريات.",view:viewSettings,edit:true},
  admins:  {title:"المشرفين",sub:"",view:viewAdmins,owner:true},
};
function route(){
  let h=(location.hash||"").replace(/^#\/?/,"");try{h=decodeURIComponent(h)}catch(e){}
  const i=h.indexOf("/");const page=i<0?h:h.slice(0,i),arg=i<0?"":h.slice(i+1);
  let p=PAGES[page]?page:"home";
  if(PAGES[p].edit&&!canEdit())p="home";
  if(PAGES[p].owner&&!isOwner())p="home";
  return{page:p,arg};
}
const go=(page,arg)=>{location.hash="#/"+page+(arg?"/"+encodeURIComponent(arg):"")};
const link=(page,arg)=>"#/"+page+(arg?"/"+encodeURIComponent(arg):"");
let lastPage=null,lastKey=null,wasLoaded=false;

// kind: "round" | "search" | غيرها = تحديث بيانات. دخول صفحة جديدة ينحسب تلقائي
function render(kind){
  const R=route(),P=PAGES[R.page];
  const navItems=Object.entries(PAGES).filter(([k,p])=>p.nav&&!(p.hidden&&p.hidden()));
  const nav=$("nav"),sig=navItems.map(([k])=>k).join(),cur="#/"+(R.page==="player"?"players":R.page);
  if(nav.dataset.sig!==sig){nav.innerHTML=navItems.map(([k,p])=>`<a href="#/${k}">${p.nav}</a>`).join("");nav.dataset.sig=sig}   // نبنيها بس إذا تغيرت الأقسام، عشان المؤشر ينزلق
  nav.querySelectorAll("a").forEach(a=>a.getAttribute("href")===cur?a.setAttribute("aria-current","page"):a.removeAttribute("aria-current"));
  $("fnav").innerHTML=navItems.map(([k,p])=>`<a href="#/${k}">${p.nav}</a>`).join("")+(canEdit()?`<a href="#/settings">لوحة التحكم</a>`:"")+(isOwner()?`<a href="#/admins">المشرفين</a>`:"");
  $("hero").hidden=R.page!=="home";
  $("ph").hidden=R.page==="home"||R.page==="player";
  $("ph-t").textContent=P.title||"";$("ph-s").textContent=P.sub||"";
  $("tools").hidden=!P.search;
  const n=D?D.players.length:0;welcomeInfo(n);stats();banner();account();
  const key=R.page+"/"+R.arg,entered=key!==lastKey||(loaded&&!wasLoaded);
  if(R.page!==lastPage){lastPage=R.page;artPlace()}
  if(key!==lastKey){lastKey=key;window.scrollTo(0,0)}   // من لاعب للاعب ثاني نرجع لفوق بعد
  wasLoaded=loaded;
  if(R.page==="settings"&&dirty&&document.activeElement&&document.activeElement.id==="pl")return; // لا تمسح كتابة المشرف
  if(!loaded&&!["rules","faq","prizes","schedule","register"].includes(R.page)){$("main").innerHTML=`<div class="ske" role="status" aria-busy="true"><span class="vh">جاري التحميل…</span><div class="ske-b"></div><div class="ske-g">${'<div class="ske-b"></div>'.repeat(4)}</div></div>`;return}
  P.view(R.arg);
  if(window.Motion)Motion.rendered(entered?"page":typeof kind==="string"?kind:"data",{page:R.page});
}
function stats(){
  const n=D?D.players.length:0;
  if(G){const cr=G.curRound(),ch=G.champ();
    let alive=0;for(let m=0;m<G.mCount(cr);m++){alive+=G.winner(cr,m)?1:(G.slot(cr,m,0)?1:0)+(G.slot(cr,m,1)?1:0)}
    $("stats").innerHTML=`<div class="chip"><b>${n}</b><span>لاعب</span></div><div class="chip"><b>${ch?1:alive}</b><span>باقين</span></div><div class="chip"><b class="t">${ch?"انتهت":G.RN(cr)}</b><span>الدور الحالي</span></div>`;
  }else $("stats").innerHTML=`<div class="chip"><b>${n}</b><span>لاعب</span></div>`;
}
function banner(){
  const b=$("banner");
  if(!CLOUD&&canEdit()&&["settings","matches"].includes(route().page)){b.hidden=false;b.textContent="وضع تجريبي محلي: أي تعديل ينحفظ في جهازك فقط ولا يشوفه أحد غيرك.";return}
  if(CLOUD&&user&&!canEdit()){b.hidden=false;b.textContent=`حسابك ${user.email} ما عنده صلاحية تعديل. اطلب من مالك البطولة يضيفه.`;return}
  b.hidden=true;
}
function account(){
  const a=$("acct"),s=$("sync");
  s.textContent=CLOUD?"النتائج تتحدث مباشرة":"";
  if(!CLOUD){a.innerHTML=`<button class="linkbtn" id="ledit">${localEdit?"قفل وضع التعديل":"وضع التعديل"}</button>`;$("ledit").onclick=()=>{localEdit=!localEdit;LS.set("edit:"+TID,localEdit);toast(localEdit?"وضع التعديل مفتوح":"رجعت لعرض الجمهور");render()};return}
  if(!user){a.innerHTML=`<button class="linkbtn" id="login">دخول المشرفين</button>`;$("login").onclick=login;return}
  const rl=role==="owner"?"مالك":role==="admin"?"مشرف":"زائر";
  a.innerHTML=`<code>${esc(user.email)}</code><span class="role ${role}">${rl}</span><button class="linkbtn" id="logout">خروج</button>`;
  $("logout").onclick=()=>auth.signOut();
}
const match=t=>Q&&t&&t.toLowerCase().includes(Q.toLowerCase());
const stLabel=o=>{if(G&&G.champ()===o.name)return["ch","🏆 البطل"];if(o.out)return["","خرج في "+G.RN(o.best)];return["in","باقي · "+G.RN(o.best)]};

function notStarted(){
  $("main").innerHTML=`<div class="panel empty"><b>البطولة ما بدأت للحين</b><span class="note">القائمة والمباريات تنزل هنا أول ما تجهز.</span>${canEdit()?`<p><a class="btn" href="#/settings" style="display:inline-block;text-decoration:none">أضف اللاعبين</a></p>`:""}</div>`;
}

// ---- home
let cdTimer=null;
function countdownHtml(){
  const t=Date.parse(C.startDate||"");if(!t)return null;let d=t-Date.now();if(d<=0)return null;
  const days=Math.floor(d/864e5),hrs=Math.floor(d/36e5)%24,min=Math.floor(d/6e4)%60,sec=Math.floor(d/1e3)%60;
  const p=(v,l)=>`<div><b>${String(v).padStart(2,"0")}</b><span>${l}</span></div>`;
  return p(days,"يوم")+p(hrs,"ساعة")+p(min,"دقيقة")+p(sec,"ثانية");
}
function startDateText(){const t=Date.parse(C.startDate||"");if(!t)return"";
  try{return new Date(t).toLocaleString("ar-SA-u-ca-gregory-nu-latn",{weekday:"long",day:"numeric",month:"long",hour:"numeric",minute:"2-digit",timeZone:"Asia/Riyadh"})}catch(e){return""}}
const LIVE='<span class="livepill"><i class="ldot" aria-hidden="true"></i>جارية</span>';
function miniCard(r,m){
  const a=G.slot(r,m,0),b=G.slot(r,m,1),w=G.winner(r,m),ws=G.wins(r,m),live=G.isLive(r,m);
  const row=(p,k)=>`<a class="pl ${w?(w===p?"w":"l"):""}" href="${link("player",p)}" style="text-decoration:none"><span class="nm">${esc(p)}</span>${G.need(r)>1?`<span class="sc">${ws[k]}</span>`:""}</a>`;
  return`<div class="mt${live?" live":""}" data-key="${K(r,m)}"><header><span><span class="no">#${G.matchNo(r,m)}</span><span class="tag ${G.isBo3(r)?"bo3":"bo1"}">${G.isBo3(r)?"BO3":"BO1"}</span></span>${live?LIVE:`<span>${G.RN(r)}</span>`}</header>${row(a,0)}${row(b,1)}</div>`;
}
function viewHome(){
  clearInterval(cdTimer);
  const ch=G&&G.champ(),cd=countdownHtml();
  let status;
  if(ch)status=`<div class="champ on" style="margin:0"><div>🏆 بطل البطولة</div><b>${esc(ch)}</b></div>`;
  else if(cd&&!(D&&Object.keys(D.res).length))status=`<div class="panel status"><div class="cd" id="cd">${cd}</div><div><h4>باقي على البداية</h4><p>${esc(startDateText())}</p></div></div>`;
  else if(G)status=`<div class="panel status"><div class="cd"><div><b>${G.curRound()+1}</b><span>من ${G.nRounds}</span></div></div><div><h4>البطولة جارية · ${G.RN(G.curRound())}</h4><p>النتائج تنزل أول بأول في صفحة المباريات.</p></div></div>`;
  else status=`<div class="panel status"><div><h4>البطولة ما بدأت للحين</h4><p>${esc(startDateText())||"الموعد يُعلن قريب"}</p></div></div>`;
  // live first, then next unplayed matches of the current round
  let feed="",feedTitle="";
  if(G&&!ch){const cr=G.curRound(),live=[],next=[];
    for(let r=cr;r<G.nRounds&&live.length+next.length<16;r++)for(let m=0;m<G.mCount(r);m++){if(G.isBye(r,m)||G.winner(r,m)||!G.slot(r,m,0)||!G.slot(r,m,1))continue;(G.isLive(r,m)?live:next).push([r,m])}
    const list=[...live,...next].slice(0,4);feedTitle=live.length?"مباريات جارية الحين":"المباريات الجاية";
    feed=list.map(([r,m])=>miniCard(r,m)).join("")}
  const reg=C.registration&&C.registration.open&&!G?`<div class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h3 style="margin:0">التسجيل مفتوح</h3><span class="note">${esc(C.registration.note||"")}</span></div><a class="btn" href="#/register" style="text-decoration:none">سجّل الحين</a></div>`:"";
  const ql=[["matches","المباريات","كل مباراة ونتيجتها"],["bracket","البراكت","الطريق كامل للنهائي"],["players","اللاعبين","ابحث عن مبارياتك"],["rules","القوانين","اقراها قبل تلعب"],["prizes","الجوائز","وش يفوز فيه الأوائل"],["schedule","المواعيد","متى يلعب كل دور"]]
    .filter(([k])=>!(PAGES[k].hidden&&PAGES[k].hidden())).map(([k,t,s])=>`<a class="ql" href="#/${k}"><b>${t}</b><span>${s}</span></a>`).join("");
  $("main").innerHTML=`
   <div class="sec">${status}</div>
   ${reg?`<div class="sec">${reg}</div>`:""}
   ${feed?`<div class="sec"><h3>${feedTitle}<a href="#/matches">كل المباريات</a></h3><div class="grid">${feed}</div></div>`:""}
   ${C.about?`<div class="sec"><h3>عن البطولة</h3><p class="about">${esc(C.about)}</p></div>`:""}
   <div class="sec"><h3>تصفح</h3><div class="qlinks">${ql}</div></div>`;
  if(cd)cdTimer=setInterval(()=>{const el=$("cd");if(!el){clearInterval(cdTimer);return}const h=countdownHtml();if(!h){clearInterval(cdTimer);render();return}window.Motion?Motion.count(el,h):el.innerHTML=h},1000);
}

// ---- matches
function matchCard(r,m){
  const a=G.slot(r,m,0),b=G.slot(r,m,1),w=G.winner(r,m),bo=G.need(r),ws=G.wins(r,m),bye=G.isBye(r,m),ce=canEdit();
  const live=G.isLive(r,m);const hl=match(a)||match(b);
  const row=(p,k)=>{if(!p)return`<button class="pl bye" disabled><span class="nm">${r===0?"تأهل مباشر":"بانتظار الفايز"}</span></button>`;
    const cls=w?(w===p?"w":"l"):"";const right=bye?"":bo===1?(w===p?'<span class="sc">✓</span>':""):`<span class="dots">${[0,1].map(i=>`<i class="${i<ws[k]?'on':''}"></i>`).join("")}</span>`;
    if(!ce)return`<a class="pl ${cls}" href="${link("player",p)}" style="text-decoration:none"><span class="nm">${esc(p)}</span>${right}</a>`;
    const off=!a||!b||w;
    return`<button class="pl ${cls}" data-r="${r}" data-m="${m}" data-k="${k}" ${off?"disabled":""} aria-label="فوز ${esc(p)}"><span class="nm">${esc(p)}</span>${right}</button>`};
  const hasRes=(D.res[K(r,m)]||[]).length;
  return`<div class="mt${live?" live":""}${hl?" hl":""}" data-key="${K(r,m)}"><header><span><span class="no">#${G.matchNo(r,m)}</span>${bye?"":`<span class="tag ${bo===1?'bo1':'bo3'}">${bo===1?"BO1":"BO3"}</span>`}</span>${live?LIVE:""}${ce&&hasRes?`<button class="undo" data-u="${r}-${m}">تراجع</button>`:""}</header>${row(a,0)}${row(b,1)}</div>`}
function viewRounds(){
  if(!G)return notStarted();
  const R=G.nRounds;if(UI.round===null||UI.round>=R)UI.round=G.curRound();
  let pills="";for(let r=0;r<R;r++){let done=0,tot=0;for(let m=0;m<G.mCount(r);m++){if(G.isBye(r,m))continue;tot++;if(G.winner(r,m))done++}
    pills+=`<button class="rp" data-round="${r}" aria-pressed="${r===UI.round}">${G.RN(r)}<span class="tag ${G.isBo3(r)?'bo3':'bo1'}">${G.isBo3(r)?"BO3":"BO1"}</span><small>${done}/${tot} مباراة</small><div class="pg"><i style="width:${tot?done/tot*100:0}%"></i></div></button>`}
  const r=UI.round;let cards="";
  const order=[...Array(G.mCount(r)).keys()].sort((x,y)=>G.isBye(r,x)-G.isBye(r,y));
  for(const m of order)cards+=matchCard(r,m);
  const hint=canEdit()?"اضغط على اسم اللاعب لتسجيل فوزه بالقيم. في BO3 أول من يكسب قيمين يتأهل.":"اضغط على أي لاعب عشان تشوف مشواره في البطولة. في BO3 أول من يكسب قيمين يتأهل.";
  $("main").innerHTML=`<div class="rounds">${pills}</div><p class="hint">${hint}</p><div class="grid${canEdit()?" can":""}">${cards}</div>`;
  document.querySelectorAll(".rp").forEach(b=>b.onclick=()=>{UI.round=+b.dataset.round;render("round")});
  if(canEdit()){
    document.querySelectorAll(".pl[data-r]").forEach(b=>b.onclick=()=>{b.disabled=true;Act.addWin(+b.dataset.r,+b.dataset.m,+b.dataset.k)});
    document.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>{const[r,m]=b.dataset.u.split("-").map(Number);Act.undo(r,m)});
  }
  if(Q)document.querySelector(".mt.hl")?.scrollIntoView({block:"center",behavior:"smooth"});
}

// ---- bracket
let Z={z:.55,x:10,y:10};
function viewBracket(){
  if(!G)return notStarted();
  const R=G.nRounds,W=150,H=44,Gp=40,V=8;const pos=[];let s="";
  for(let r=0;r<R;r++){pos[r]=[];for(let m=0;m<G.mCount(r);m++){const y=r===0?10+m*(H+V):(pos[r-1][m*2]+pos[r-1][m*2+1])/2;const x=10+r*(W+Gp);pos[r][m]=y;
    if(r>0)[0,1].forEach(k=>{const cy=pos[r-1][m*2+k],cw=G.winner(r-1,m*2+k);const hl=match(cw)?" hl":cw?" w":"";s+=`<path class="ln${hl}" d="M${x-Gp} ${cy+H/2}H${x-Gp/2}V${y+H/2}H${x}"/>`});
    const a=G.slot(r,m,0),b=G.slot(r,m,1),w=G.winner(r,m),ws=G.wins(r,m);
    s+=`<g class="${match(a)||match(b)?"hlg":""}" data-key="${K(r,m)}"><rect class="bx" x="${x}" y="${y}" width="${W}" height="${H}" rx="5"/>`;
    [a,b].forEach((p,k)=>{const c=!p?"l":w?(w===p?"w":"l"):"";s+=`<text class="tx ${c}" x="${x+W-8}" y="${y+16+k*19}" text-anchor="end">${p?esc(p.length>16?p.slice(0,15)+"…":p):(r===0?"تأهل مباشر":"—")}</text>`;
      if(p&&G.isBo3(r)&&!G.isBye(r,m))s+=`<text class="tx ${c}" x="${x+10}" y="${y+16+k*19}">${ws[k]}</text>`});s+=`</g>`}}
  const width=20+R*(W+Gp),height=20+G.mCount(0)*(H+V);
  $("main").innerHTML=`<div class="bar"><button class="btn g" id="zi">+ تكبير</button><button class="btn g" id="zo">− تصغير</button><button class="btn g" id="zr">ملاءمة</button></div>
   <div class="vp" id="vp" dir="ltr"><svg id="sv" width="${width}" height="${height}">${s}</svg></div>`;
  const sv=$("sv"),vp=$("vp");
  const ap=()=>sv.style.transform=`translate(${Z.x}px,${Z.y}px) scale(${Z.z})`;
  const fit=()=>{Z.z=Math.min(vp.clientWidth/width,1);Z.x=0;Z.y=10;ap()};
  if(Q){const r0=pos[0].findIndex((y,m)=>match(G.slot(0,m,0))||match(G.slot(0,m,1)));if(r0>=0){Z.z=.9;Z.y=-pos[0][r0]*Z.z+vp.clientHeight/2;Z.x=10}}
  ap();
  const za=f=>()=>{window.Motion&&Motion.zoom(sv);f()};   // أزرار التكبير تنزلق، السحب والعجلة تبقى فورية
  $("zi").onclick=za(()=>{Z.z=Math.min(2,Z.z*1.25);ap()});$("zo").onclick=za(()=>{Z.z=Math.max(.12,Z.z/1.25);ap()});$("zr").onclick=za(fit);
  vp.onwheel=e=>{e.preventDefault();sv.classList.remove("za");const rc=vp.getBoundingClientRect(),mx=e.clientX-rc.left,my=e.clientY-rc.top,f=e.deltaY<0?1.12:.89,nz=Math.min(2,Math.max(.12,Z.z*f));Z.x=mx-(mx-Z.x)*nz/Z.z;Z.y=my-(my-Z.y)*nz/Z.z;Z.z=nz;ap()};
  let d=null;vp.onpointerdown=e=>{sv.classList.remove("za");d=[e.clientX-Z.x,e.clientY-Z.y];vp.setPointerCapture(e.pointerId);vp.style.cursor="grabbing"};
  vp.onpointermove=e=>{if(d){Z.x=e.clientX-d[0];Z.y=e.clientY-d[1];ap()}};vp.onpointerup=()=>{d=null;vp.style.cursor="grab"};
}

// ---- players
function viewPlayers(){
  if(!G)return notStarted();
  const ch=G.champ();
  const list=[...RUNS.values()].sort((a,b)=>(b.name===ch)-(a.name===ch)||(a.out-b.out)||(b.best-a.best)||(b.mw-a.mw)||a.name.localeCompare(b.name));
  const shown=Q?list.filter(o=>match(o.name)):list;
  const alive=list.filter(o=>!o.out).length;
  $("main").innerHTML=`<p class="hint">${list.length} لاعب، باقي منهم ${ch?1:alive}.${Q?` نتائج البحث: ${shown.length}`:""}</p>
   ${shown.length?`<div class="plist">${shown.map(o=>{const[c,t]=stLabel(o);return`<a class="pr${o.out?" out":""}" href="${link("player",o.name)}"><span class="nm">${esc(o.name)}</span><span class="st ${c}">${t}</span></a>`}).join("")}</div>`:`<div class="panel empty"><b>ما لقينا لاعب بهالاسم</b><span class="note">تأكد من الكتابة، الحروف الكبيرة والصغيرة ما تفرق.</span></div>`}`;
}
function viewPlayer(name){
  if(!G)return notStarted();
  const o=RUNS.get(name);
  if(!o){$("main").innerHTML=`<div class="panel empty"><b>اللاعب مو موجود في البطولة</b><p><a class="btn g" href="#/players" style="display:inline-block;text-decoration:none">كل اللاعبين</a></p></div>`;return}
  const[c,t]=stLabel(o);
  const label={w:["w","فاز"],l:["l","خسر"],live:["","جارية"],next:["","الجاية"],wait:["","بانتظار خصمه"],bye:["w","تأهل مباشر"]};
  const rows=o.matches.map(x=>{const[lc,lt]=label[x.st];
    const opp=x.opp?`<a href="${link("player",x.opp)}">${esc(x.opp)}</a>`:(x.st==="bye"?"بدون خصم":"بانتظار الفايز");
    const sc=x.score&&G.need(x.r)>1&&x.score[0]+x.score[1]>0?` ${x.score[0]}-${x.score[1]}`:"";
    return`<div class="pm ${x.st==="w"||x.st==="bye"?"w":x.st==="l"?"l":""}"><span class="rn">${G.RN(x.r)} · #${G.matchNo(x.r,x.m)}</span><span class="vs">ضد ${opp}</span><span class="res ${lc}">${lt}${sc}</span></div>`}).join("");
  $("main").innerHTML=`<div class="sec"><div class="panel prof"><div class="av">${esc([...name][0]||"?")}</div><div style="min-width:0"><h3>${esc(name)}</h3><div class="k"><span class="st ${c}">${t}</span><span class="st">مباريات فاز فيها: ${o.mw}</span><span class="st">قيمات: ${o.gw} فوز · ${o.gl} خسارة</span></div></div></div></div>
   <div class="sec"><h3>مشواره في البطولة<a href="#/players">كل اللاعبين</a></h3><div class="path">${rows}</div></div>`;
}

// ---- static pages from config
function viewSchedule(){
  const cr=G?G.curRound():-1,curName=G&&!G.champ()?G.RN(cr):"";
  $("main").innerHTML=`${C.startDate?`<p class="hint">يوم البطولة: ${esc(startDateText())}</p>`:""}<div class="tl">${arr(C.schedule).map(s=>`<div class="it${curName&&String(s.title).split(" و").map(x=>x.trim()).includes(curName)?" now":""}"><time>${esc(s.time)}</time><div><b>${esc(s.title)}</b>${s.note?`<small>${esc(s.note)}</small>`:""}</div></div>`).join("")}</div>`;
}
function viewRules(){
  $("main").innerHTML=`<div class="prose">${arr(C.rules).map((s,i)=>`<div class="panel"><h3><i>${i+1}</i>${esc(s.title)}</h3><ul>${arr(s.items).map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>`).join("")}</div>`;
}
function viewPrizes(){
  let who=[];if(G){const f=G.nRounds-1,ch=G.champ();if(ch){const a=G.slot(f,0,0),b=G.slot(f,0,1);who=[ch,a===ch?b:a]}}
  $("main").innerHTML=`<div class="podium">${arr(C.prizes).map((p,i)=>`<div class="pd${i===0?" p1":""}"><span class="pl-no">${i+1}</span><small>${esc(p.place)}</small><b><span class="num">${esc(p.value)}</span> ${esc(p.unit||"")}</b>${who[i]?`<span class="who">${esc(who[i])}</span>`:""}</div>`).join("")}</div>`;
}
function viewFaq(){
  $("main").innerHTML=arr(C.faq).map(f=>`<details class="fq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("");
}
function viewHall(){
  const ch=G&&G.champ();
  const cur=ch?`<div class="hc cur"><small>البطولة الحالية</small><b>🏆 ${esc(ch)}</b></div>`:"";
  $("main").innerHTML=`<div class="hall">${cur}${arr(C.champions).map(c=>`<div class="hc"><small>${esc(c.edition)}${c.date?" · "+esc(c.date):""}</small><b>${esc(c.name)}</b></div>`).join("")}</div>`;
}
function viewRegister(){
  const r=C.registration||{},u=safeUrl(r.url);
  $("main").innerHTML=`<div class="panel reg"><p>${esc(r.note||"")}</p>${u?`<a class="btn" href="${esc(u)}" target="_blank" rel="noopener" style="text-decoration:none">افتح نموذج التسجيل ↗</a>`:`<span class="note">رابط التسجيل ينزل هنا قريب.</span>`}</div>`;
}

// ---- admin pages
function viewSettings(){
  const players=D?D.players:[];
  let size=2;while(size<Math.max(players.length,2))size*=2;
  const bo=D?+D.bo3From:+C.bo3From||16;
  const opts=[2,4,8,16,32,64,128].filter(n=>n<=size);
  dirty=false;
  $("main").innerHTML=`<div class="two">
   <div class="panel"><h3>اللاعبين (${players.length})</h3><p class="note" style="margin:0 0 8px">كل لاعب بسطر. من ٢ لين ${MAXP} لاعب، واللي يحتاج يطلع له تأهل مباشر تلقائي. الحفظ يبدأ البطولة من جديد ويمسح النتائج.</p>
    <textarea id="pl" spellcheck="false" aria-label="أسماء اللاعبين">${esc(players.join("\n"))}</textarea>
    <div class="bar" style="margin-top:10px"><button class="btn" id="apply">احفظ وابدأ من جديد</button><button class="btn g" id="shuf">🎲 قرعة عشوائية</button></div>
    <p class="note" id="msg"></p></div>
   <div class="panel" style="display:grid;gap:16px;align-content:start">
    ${D?`<label>بست أوف ٣ يبدأ من:<select id="bo">${opts.map(n=>`<option value="${n}" ${bo===n?"selected":""}>${roundName(n)}</option>`).join("")}</select></label>
    <p class="note" style="margin:0">الأدوار قبله تكون قيم واحد (BO1). تغييره يمسح النتائج.</p>
    <div><h3>مسح النتائج</h3>${askReset?`<div class="confirm"><span>متأكد؟ تنمسح كل النتائج</span><button class="btn r" id="yes">إيه امسح</button><button class="btn g" id="no">لا</button></div>`:`<button class="btn r" id="reset">مسح كل النتائج</button>`}</div>`:""}
    ${CLOUD?"":`<div><h3>نموذج تجريبي</h3><button class="btn g" id="demo">رجّع البيانات التجريبية</button></div>`}
    ${C.welcome&&C.welcome.show!==false?`<div><h3>الواجهة الترحيبية</h3><button class="btn g" id="showW">اعرضها الحين</button></div>`:""}
   </div></div>`;
  const ta=$("pl");ta.oninput=()=>dirty=true;
  const get=()=>[...new Set(ta.value.split("\n").map(s=>s.trim()).filter(Boolean))];
  $("apply").onclick=()=>{const p=get(),msg=$("msg");if(p.length<2){msg.textContent="اكتب لاعبين اثنين على الأقل";return}if(p.length>MAXP){msg.textContent=`الحد ${MAXP} لاعب`;return}
    dirty=false;UI.round=0;Act.setPlayers(p).then(()=>go("matches"))};
  $("shuf").onclick=()=>{const p=get();for(let i=p.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[p[i],p[j]]=[p[j],p[i]]}ta.value=p.join("\n");dirty=true};
  const bs=$("bo");if(bs)bs.onchange=e=>Act.setBo3(+e.target.value);
  const rs=$("reset");if(rs)rs.onclick=()=>{askReset=true;render()};
  const y=$("yes");if(y){y.onclick=()=>{askReset=false;Act.reset()};$("no").onclick=()=>{askReset=false;render()}}
  const dm=$("demo");if(dm)dm.onclick=()=>{D=demoData();saveLocal();dataChanged();toast("رجعت البيانات التجريبية")};
  const sw=$("showW");if(sw)sw.onclick=openWelcome;
}
function viewAdmins(){
  const me=user.email.toLowerCase();
  const rows=admins.slice().sort((a,b)=>(a.role==="owner"?0:1)-(b.role==="owner"?0:1)||a.email.localeCompare(b.email)).map(a=>`<div class="adm"><div style="min-width:0;display:flex;align-items:center"><code>${esc(a.email)}</code><span class="role ${a.role==="owner"?"owner":""}">${a.role==="owner"?"مالك":"مشرف"}</span></div>${a.email===me?`<span class="note">أنت</span>`:`<button class="btn r sm" data-rm="${esc(a.email)}">إزالة</button>`}</div>`).join("");
  $("main").innerHTML=`<div class="two">
   <div class="panel"><h3>إضافة مشرف</h3><p class="note" style="margin:0 0 10px">اكتب إيميل Google حق الشخص. المشرف يقدر يسجل النتائج ويعدل اللاعبين. المالك يقدر كمان يضيف ويشيل المشرفين.</p>
    <div style="display:grid;gap:10px"><input id="em" type="email" dir="ltr" placeholder="name@gmail.com" aria-label="الإيميل"><select id="rl" aria-label="الرتبة"><option value="admin">مشرف</option><option value="owner">مالك</option></select><button class="btn" id="add">إضافة</button></div>
    <p class="note" id="amsg"></p></div>
   <div class="panel"><h3>أصحاب الصلاحية (${admins.length})</h3>${rows||`<p class="note">ما فيه أحد للحين</p>`}</div></div>`;
  $("add").onclick=()=>{const e=$("em").value.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){$("amsg").textContent="الإيميل مو صحيح";return}Act.addAdmin(e,$("rl").value);$("em").value=""};
  let pend=null;
  document.querySelectorAll("[data-rm]").forEach(b=>b.onclick=()=>{if(pend!==b){if(pend)pend.textContent="إزالة";pend=b;b.textContent="متأكد؟ اضغط مرة ثانية";return}Act.removeAdmin(b.dataset.rm)});
}


// ---------- 3D rifle art (welcome screen only): line-drawn parts that come apart and back together
// coordinates are a side profile in SVG style (y down); each part is extruded into 3D
const THREE_URL="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const RIFLE=[
  {pts:[[-170,-35],[-262,-30],[-398,-12],[-420,-12],[-420,68],[-396,74],[-330,30],[-262,20],[-170,15]],holes:[[[-392,0],[-300,-14],[-300,10],[-360,36],[-392,44]]],depth:22,ex:[-130,10,-30]},
  {pts:[[-170,-40],[160,-40],[200,-30],[200,5],[160,10],[-170,10]],holes:[-60,-20,20,60,100].map(x=>[[x,-28],[x+26,-28],[x+26,-22],[x,-22]]).concat([[[-140,-24],[-90,-24],[-90,-10],[-140,-10]]]),depth:36,ex:[0,0,0]},
  {pts:(()=>{const p=[[-150,-40]];for(let x=-150;x<180;x+=12)p.push([x,-50],[x+6,-50],[x+6,-56],[x+12,-56]);p.push([180,-40]);return p})(),depth:26,ex:[0,-80,0]},
  {pts:[[-158,-56],[-158,-70],[-138,-70],[-134,-78],[-126,-78],[-126,-56]],depth:12,ex:[-10,-135,0]},
  {pts:[[162,-56],[162,-64],[170,-84],[178,-84],[184,-64],[184,-56]],depth:10,ex:[30,-135,0]},
  {pts:[[60,-44],[82,-44],[82,-54],[90,-54],[90,-40],[60,-40]],depth:8,ex:[40,-60,90]},
  {cyl:[200,400,-15,6,12],ex:[125,0,0]},
  {cyl:[400,444,-15,12,8],ex:[200,0,0],acc:true},
  {pts:[[-170,10],[70,10],[60,40],[-170,40]],depth:30,ex:[0,55,0]},
  {pts:[[-60,40],[-64,58],[-86,64],[-108,56],[-112,40],[-106,40],[-102,52],[-86,58],[-68,54],[-66,40]],depth:8,ex:[-20,100,0]},
  {pts:[[-84,40],[-86,52],[-90,56],[-92,40]],depth:4,ex:[-20,140,30]},
  {pts:[[-112,40],[-146,118],[-140,126],[-116,128],[-108,124],[-80,40]],depth:26,ex:[-50,130,20]},
  {pts:[[-26,40],[26,40],[48,146],[6,154]],depth:24,ex:[45,165,-20],acc:true},
];
const ART={T:null,host:null,raf:0,t0:0,built:false};
function artTarget(){
  if(C.backgroundArt===false)return null;
  return W.hidden?null:$("wfx");
}
function artColors(){
  if(!ART.built)return;const cs=getComputedStyle(document.documentElement),g=n=>cs.getPropertyValue(n).trim()||"#ffffff";
  ART.line.color.set(g("--on-bg"));ART.acc.color.set(g("--acc"));ART.fill.color.set(g("--bg"));artFrame();
}
function artBuild(){
  const T=window.THREE;if(!T)return;
  const r=new T.WebGLRenderer({antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio||1,2));
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(30,1,10,6000),root=new T.Group();scene.add(root);
  const line=new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.9});
  const acc=new T.LineBasicMaterial({color:0xff3344});
  const fill=new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.6,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1});
  const V=([x,y])=>new T.Vector2(x-12,-y);
  ART.parts=RIFLE.map(p=>{let geo;
    if(p.cyl){const[x0,x1,y,rad,seg]=p.cyl;geo=new T.CylinderGeometry(rad,rad,x1-x0,seg,1);geo.rotateZ(Math.PI/2);geo.translate((x0+x1)/2-12,-y,0)}
    else{const s=new T.Shape(p.pts.map(V));(p.holes||[]).forEach(h=>s.holes.push(new T.Path(h.map(V))));
      geo=new T.ExtrudeGeometry(s,{depth:p.depth,bevelEnabled:false});geo.translate(0,0,-p.depth/2)}
    const g=new T.Group();g.add(new T.Mesh(geo,fill));g.add(new T.LineSegments(new T.EdgesGeometry(geo,20),p.acc?acc:line));
    g.userData.ex=p.ex;root.add(g);return g});
  Object.assign(ART,{T,r,scene,cam,root,line,acc,fill,built:true,mx:0,my:0});
  r.domElement.setAttribute("aria-hidden","true");
  addEventListener("pointermove",e=>{ART.mx=e.clientX/innerWidth-.5;ART.my=e.clientY/innerHeight-.5});
  addEventListener("resize",()=>{artSize();artFrame()});
  document.addEventListener("visibilitychange",artPlace);
  artColors();artPlace();
}
function artSize(){
  const h=ART.host;if(!h)return;const w=h.clientWidth||innerWidth,ht=h.clientHeight||innerHeight;
  ART.r.setSize(w,ht,false);ART.cam.aspect=w/ht;
  const tan=Math.tan(ART.cam.fov*Math.PI/360);
  ART.cam.position.z=Math.max((ART.cam.aspect<1?820:1180)/2/(tan*ART.cam.aspect),600/2/tan);ART.cam.updateProjectionMatrix();
}
const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;
function artFrame(now){
  if(!ART.built||!ART.host)return;
  const still=matchMedia("(prefers-reduced-motion: reduce)").matches;
  const t=still?4:((now||performance.now())-ART.t0)/1000,ph=(t%14)/14;
  const e=still?1:ph<.1?0:ph<.38?ease((ph-.1)/.28):ph<.72?1:ease(1-(ph-.72)/.28);
  ART.parts.forEach(g=>{const[x,y,z]=g.userData.ex;g.position.set(x*e,-y*e,z*e)});
  ART.root.rotation.set(.22+ART.my*.15,-.55+Math.sin(t*.22)*.5+ART.mx*.3,.1);
  ART.r.render(ART.scene,ART.cam);
}
function artLoop(now){artFrame(now);ART.raf=requestAnimationFrame(artLoop)}
function artPlace(){
  const host=artTarget();
  if(host&&!ART.built){if(!ART.loading){ART.loading=true;loadScript(THREE_URL).then(artBuild).catch(()=>{})}return}
  if(!ART.built)return;
  cancelAnimationFrame(ART.raf);ART.raf=0;
  if(!host||document.hidden){if(!host&&ART.r.domElement.parentNode)ART.r.domElement.remove();ART.host=null;return}
  if(ART.r.domElement.parentNode!==host)host.appendChild(ART.r.domElement);
  ART.host=host;if(!ART.t0)ART.t0=performance.now();artSize();
  if(matchMedia("(prefers-reduced-motion: reduce)").matches)artFrame();else artLoop(performance.now());
}

// ---------- welcome
const W=$("welcome");
function closeWelcome(){if(W.hidden||W.classList.contains("out"))return;W.classList.add("out");window.Motion&&Motion.welcomeOut();setTimeout(()=>{W.hidden=true;W.classList.remove("out");artPlace()},matchMedia("(prefers-reduced-motion: reduce)").matches?0:340)}
function openWelcome(){W.hidden=false;window.scrollTo(0,0);$("enter").focus();artPlace()}
$("enter").onclick=closeWelcome;
addEventListener("keydown",e=>{if(e.key==="Escape")closeWelcome()});

// ---------- search (shared by matches, bracket and players)
let qt;$("q").oninput=e=>{clearTimeout(qt);qt=setTimeout(()=>{Q=e.target.value.trim();
  if(Q&&G&&route().page==="matches"){for(let r=G.nRounds-1;r>=0;r--){let f=false;for(let m=0;m<G.mCount(r);m++)if(match(G.slot(r,m,0))||match(G.slot(r,m,1))){f=true;break}if(f){UI.round=r;break}}}render("search")},200)};

// ---------- cloud (Firebase)
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement("script");s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function login(){try{await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider())}catch(e){if(e.code!=="auth/popup-closed-by-user")toast("ما قدرنا نسجل دخولك")}}
async function initCloud(){
  for(const f of["app","auth","firestore"])await loadScript(`https://www.gstatic.com/firebasejs/${FBV}/firebase-${f}-compat.js`);
  firebase.initializeApp(FB);db=firebase.firestore();auth=firebase.auth();
  ref=db.collection("tournaments").doc(TID);
  ref.onSnapshot(s=>{D=s.exists?normalize(s.data()):null;dataChanged()},e=>{console.error(e);$("main").innerHTML=`<div class="panel empty"><b>ما قدرنا نجيب البيانات</b><span class="note">تأكد من إعدادات Firebase في config.js</span></div>`});
  auth.onAuthStateChanged(async u=>{
    user=u;role="";if(adminsUnsub){adminsUnsub();adminsUnsub=null}admins=[];
    if(u&&u.email){try{const d=await db.collection("admins").doc(u.email.toLowerCase()).get();role=d.exists?(d.data().role==="owner"?"owner":"admin"):""}catch(e){role=""}}
    if(role==="owner")adminsUnsub=db.collection("admins").onSnapshot(s=>{admins=s.docs.map(d=>({email:d.id,role:d.data().role}));if(route().page==="admins")render()},()=>{});
    render();
  });
}

// ---------- boot
brand();skins();
addEventListener("hashchange",()=>window.Motion?Motion.page(render):render());
const landing=route().page==="home"&&!/^#\/./.test(location.hash);
if(C.welcome&&C.welcome.show!==false&&landing)openWelcome();
artPlace();
if(CLOUD){render();initCloud().catch(e=>{console.error(e);$("main").innerHTML=`<div class="panel empty"><b>ما قدرنا نتصل بقاعدة البيانات</b><span class="note">تأكد من الإنترنت ومن إعدادات Firebase</span></div>`})}
else{D=LS.get("data:"+TID,null);if(!D||!Array.isArray(D.players)){D=demoData();saveLocal()}D=normalize(D);dataChanged()}
})();
