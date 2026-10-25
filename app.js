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
  $("hero").insertAdjacentHTML("beforeend",eggHtml("hero"));
  document.querySelector(".foot").insertAdjacentHTML("beforeend",eggHtml("foot"));
}
function welcomeInfo(n){
  const parts=arr(C.facts).map(f=>`<div><small>${esc(f.label)}</small><b>${f.num?`<span class="num">${esc(f.value)}</span>`:esc(f.value)}${f.unit?" "+esc(f.unit):""}</b></div>`);
  parts.push(`<div><small>اللاعبين</small><b class="num">${n}</b></div>`);
  $("w-info").innerHTML=parts.join("<hr>");
}

// ---------- skins from config
// الثيمات في قائمة تنفتح من زر فوق، عشان تكفي أي عدد. الثيم السري (secret) ما يطلع إلا بعد ما تنفتح أسرار كايدو
const SK=C.skins||{};const skinIds=Object.keys(SK);
const allVars=[...new Set(skinIds.flatMap(id=>Object.keys(SK[id].colors||{})))];
const swatch=s=>{const sw=s.swatch||["#888","#222"];return`background:linear-gradient(135deg,${esc(sw[0])} 50%,${esc(sw[1])} 50%)`};
let curSkin=null;
function setSkin(id){
  if(!SK[id]||(SK[id].secret&&!kidOpen()))id=SK[C.defaultSkin]?C.defaultSkin:skinIds[0];if(!id)return;
  const root=document.documentElement,s=SK[id];curSkin=id;
  allVars.forEach(k=>root.style.removeProperty("--"+k));
  Object.entries(s.colors||{}).forEach(([k,v])=>root.style.setProperty("--"+k,v));
  root.style.colorScheme=s.light?"light":"dark";
  document.querySelectorAll(".sk").forEach(b=>b.setAttribute("aria-pressed",b.dataset.skin===id));
  const n=$("skn");if(n)n.textContent=s.name||id;
  const b=$("skb");if(b){b.querySelector("i").style.cssText=swatch(s);b.setAttribute("aria-label","الثيم: "+(s.name||id))}
  const tc=document.querySelector('meta[name="theme-color"]');if(tc)tc.content=getComputedStyle(root).getPropertyValue("--bg").trim()||"#0a0a0c";   // لون شريط المتصفح في الجوال
  LS.set("skin:"+TID,id);
  if(typeof artColors==="function"&&window.THREE)artColors();
}
const pickSkin=(id,from)=>window.Motion?Motion.theme(()=>setSkin(id),from):setSkin(id);
function skinGrid(){
  const ids=skinIds.filter(id=>!SK[id].secret||kidOpen());
  $("skin-pop").innerHTML=`<h4>اختر الثيم</h4><div class="skg">${ids.map(id=>{const s=SK[id];
    return`<button class="sk" data-skin="${esc(id)}" aria-pressed="${id===curSkin}"><i style="${swatch(s)}"></i><span>${esc(s.name||id)}${s.secret?" 🎩":""}</span></button>`}).join("")}</div>`;
  $("skin-pop").querySelectorAll(".sk").forEach(b=>b.onclick=()=>pickSkin(b.dataset.skin,b));
}
function skins(){
  const box=$("skins");if(skinIds.length<2){box.hidden=true;setSkin(skinIds[0]);return}
  box.innerHTML=`<button class="skb" id="skb" aria-haspopup="dialog" aria-expanded="false" aria-controls="skin-pop"><i></i><span id="skn"></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button>`;
  skinGrid();popup($("skb"),$("skin-pop"));
  setSkin(LS.get("skin:"+TID,C.defaultSkin));
}

// ---------- قوائم منبثقة صغيرة (الثيمات والمؤسسين): تنقفل بالضغط برا أو بزر Esc
const POPS=[];
function popup(btn,pop){
  const set=open=>{if(open)POPS.forEach(p=>p.pop!==pop&&p.set(false));pop.hidden=!open;btn.setAttribute("aria-expanded",open)};
  POPS.push({btn,pop,set});
  btn.onclick=e=>{const open=pop.hidden;set(open);
    if(open&&e.detail===0){const f=pop.querySelector("[aria-pressed=true]")||pop.querySelector("button,a");f&&f.focus()}};   // من لوحة المفاتيح: التركيز يدخل القائمة
}
// وقت انتقال الثيم المتصفح يحط صورة فوق الصفحة وكل ضغطة تروح لـ html بدل الزر، فكانت القائمة تنقفل والاختيار يضيع.
// فنحسب مكان الإصبع بنفسنا: نخلي القائمة مفتوحة، ولو ضغطت على ثيم ثاني يتطبق على طول
const vtHit=e=>document.documentElement.dataset.vt&&e.target===document.documentElement;
const at=(el,e)=>{const r=el.getBoundingClientRect();return e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom};
document.addEventListener("pointerdown",e=>POPS.forEach(p=>{if(p.pop.hidden)return;
  const inside=vtHit(e)?at(p.pop,e)||at(p.btn,e):p.pop.contains(e.target)||p.btn.contains(e.target);if(!inside)p.set(false)}));
document.addEventListener("click",e=>{const pop=$("skin-pop");if(!vtHit(e)||!pop||pop.hidden)return;
  const b=[...pop.querySelectorAll(".sk")].find(b=>at(b,e));if(b)pickSkin(b.dataset.skin,b)});
addEventListener("keydown",e=>{if(e.key==="Escape")POPS.forEach(p=>{if(!p.pop.hidden){p.set(false);p.btn.focus()}})});

// ---------- مؤسسين الموقع: خانة فوق يسار، وتنفتح بصورهم كبيرة
function founders(){
  const F=arr(C.founders).filter(f=>f&&f.name);if(!F.length)return;
  const av=(f,tag)=>f.photo?`<img src="${esc(f.photo)}" alt="" width="64" height="64" decoding="async">`:`<${tag}>${esc([...String(f.name)][0])}</${tag}>`;
  $("founders").hidden=false;
  $("founders").innerHTML=`<button class="fnd" id="fnd" aria-haspopup="dialog" aria-expanded="false" aria-controls="fnd-pop"><span class="fnd-av">${F.map(f=>av(f,"b")).join("")}</span><span class="fnd-t"><small>المؤسسين</small><b>${F.map(f=>esc(f.name)).join(" - ")}</b></span></button>`;
  $("fnd-pop").innerHTML=`<h4>مؤسسين الموقع</h4><div class="fpl">${F.map(f=>`<div class="fp">${av(f,"i")}<b>${esc(f.name)}</b></div>`).join("")}</div>`;
  popup($("fnd"),$("fnd-pop"));
}

// ---------- شريط التحكم بالقائمة: لما الأقسام أعرض من الشاشة تطلع أسهم على الأطراف وشريط تسحبه تحتها، وعجلة الماوس تحركها بالعرض
let navStripSync=()=>{};
function navStrip(){
  const bar=$("navbar"),n=$("nav"),tr=$("nav-track");if(!bar||!tr)return;
  const th=tr.firstElementChild,rtl=getComputedStyle(n).direction==="rtl";
  const max=()=>Math.max(0,n.scrollWidth-n.clientWidth);
  const hidL=()=>rtl?max()+n.scrollLeft:n.scrollLeft;   // كم بكسل من الأقسام مخفي على اليسار
  const sync=()=>{const m=max(),ovf=m>1;bar.classList.toggle("ovf",ovf);
    if(!ovf){bar.classList.remove("more-l","more-r");return}
    const l=Math.min(m,Math.max(0,hidL()));bar.classList.toggle("more-l",l>2);bar.classList.toggle("more-r",l<m-2);
    const tw=tr.clientWidth,w=Math.max(28,tw*n.clientWidth/n.scrollWidth);
    th.style.setProperty("--tw",w+"px");th.style.setProperty("--tx",(tw-w)*l/m+"px")};
  let raf=0;const req=()=>{if(!raf)raf=requestAnimationFrame(()=>{raf=0;sync()})};
  n.addEventListener("scroll",req,{passive:true});
  if("ResizeObserver"in window)new ResizeObserver(req).observe(n);else addEventListener("resize",req);
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(req);
  const step=dir=>n.scrollBy({left:dir*n.clientWidth*.7,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  $("nav-l").onclick=()=>step(-1);$("nav-r").onclick=()=>step(1);
  n.addEventListener("wheel",e=>{const m=max();if(!m||e.ctrlKey||Math.abs(e.deltaX)>=Math.abs(e.deltaY))return;
    const d=(e.deltaMode===1?16:e.deltaMode===2?n.clientWidth:1)*e.deltaY*(rtl?-1:1),l=hidL();
    if((d<0&&l<=0)||(d>0&&l>=m))return;   // وصلت الطرف: الصفحة تنزل عادي
    e.preventDefault();n.scrollLeft+=d},{passive:false});
  let grab=null;
  const move=e=>{if(grab===null)return;const r=tr.getBoundingClientRect(),room=r.width-th.offsetWidth;if(room<=0)return;
    n.scrollLeft+=Math.min(room,Math.max(0,e.clientX-r.left-grab))/room*max()-hidL()};
  tr.addEventListener("pointerdown",e=>{if(!max())return;e.preventDefault();tr.setPointerCapture(e.pointerId);tr.classList.add("drag");
    const px=e.clientX-tr.getBoundingClientRect().left,x=parseFloat(th.style.getPropertyValue("--tx"))||0,w=th.offsetWidth;
    grab=px>=x&&px<=x+w?px-x:w/2;move(e)});   // ضغطة على الشريط تنقل المؤشر لمكانها، والسحب يحركه
  tr.addEventListener("pointermove",move);
  const end=()=>{grab=null;tr.classList.remove("drag")};tr.addEventListener("pointerup",end);tr.addEventListener("pointercancel",end);
  navStripSync=req;sync();
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
let Q="",QN="",askReset=false,dirty=false;   // QN = البحث بعد توحيد الحروف
const canEdit=()=>(role==="local"&&localEdit)||role==="admin"||role==="owner";
const isOwner=()=>role==="owner";

function toast(msg,ms){if(window.Motion)return Motion.toast(msg,ms);const t=document.createElement("div");t.className="toast";t.setAttribute("role","status");t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),ms||2600)}
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
  bracket: {nav:"البراكت",title:"البراكت كامل",sub:"طريق كل لاعب للنهائي. اسحب للتنقل، وكبّر بالعجلة أو بإصبعين، أو انقر مرتين.",view:viewBracket,search:true},
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
  navStripSync();
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
  // أزرار سريعة تحت العنوان: قبل البطولة التسجيل، وبعدها المباريات والبراكت
  const pre=!G&&!PAGES.register.hidden(),btn=(k,t,g)=>`<a class="btn${g?" g":""}" href="#/${k}">${t}</a>`;
  const cta=pre?btn("register","سجّل الحين")+(PAGES.rules.hidden()?"":btn("rules","القوانين",1)):btn("matches",G&&G.champ()?"النتائج":"شوف المباريات")+btn("bracket","البراكت",1);
  if($("h-cta").innerHTML!==cta)$("h-cta").innerHTML=cta;
  heroClock();
}

// ---------- القطعة الرئيسية: عداد مثل لوحات المطارات. قبل البطولة يعد للبداية، وقت البطولة يعرض اللاعبين الباقين، وبعدها اسم البطل
const pad2=v=>String(v).padStart(2,"0");
const flapHalves=(top,bot)=>`<i class="h t"><span>${esc(top)}</span></i><i class="h b"><span>${esc(bot)}</span></i>`;
function flapSet(box,str){
  const ch=[...str],tiles=[...box.children];
  if(tiles.length!==ch.length){box.innerHTML=ch.map(c=>`<b class="fl" data-v="${esc(c)}">${flapHalves(c,c)}</b>`).join("");return}
  const still=matchMedia("(prefers-reduced-motion: reduce)").matches||document.hidden;
  tiles.forEach((t,i)=>{const n=ch[i],o=t.dataset.v;if(n===o)return;t.dataset.v=n;clearTimeout(t._t);
    if(still){t.innerHTML=flapHalves(n,n);return}
    // النص الفوق الجديد ثابت ورا، والقديم يطيح لتحت، بعدين النص التحت الجديد ينزل مكانه
    t.innerHTML=flapHalves(n,o)+`<i class="h t ft"><span>${esc(o)}</span></i><i class="h b fb"><span>${esc(n)}</span></i>`;
    t._t=setTimeout(()=>{t.innerHTML=flapHalves(n,n)},560)});
}
let hcTimer=null;
function heroClock(){
  const el=$("hclock");if(!el)return;
  const t=Date.parse(C.startDate||""),left=t?t-Date.now():0,ch=G&&G.champ(),n=D?D.players.length:0;
  let mode,k,label,line,groups=[];
  if(ch){mode="champ";k="CHAMPION";label="🏆 بطل البطولة";line=C.mode?`${C.mode.main||""} ${C.mode.tag||""}`.trim():""}
  else if(left>0){mode="cd";k="KICKOFF IN";label="باقي على البداية";line=startDateText();
    const s=Math.floor(left/1e3);groups=[[pad2(Math.floor(s/86400)),"يوم"],[pad2(Math.floor(s/3600)%24),"ساعة"],[pad2(Math.floor(s/60)%60),"دقيقة"],[pad2(s%60),"ثانية"]]}
  else if(G){mode="live";k="LIVE NOW";label="البطولة جارية";const cr=G.curRound();
    let alive=0;for(let m=0;m<G.mCount(cr);m++){alive+=G.winner(cr,m)?1:(G.slot(cr,m,0)?1:0)+(G.slot(cr,m,1)?1:0)}
    groups=[[pad2(alive),"لاعب باقي"]];line=`${G.RN(cr)} · الدور ${cr+1} من ${G.nRounds}`}
  else{mode="wait";k="COMING SOON";label="البطولة ما بدأت للحين";line=startDateText()||"الموعد يُعلن قريب";groups=[[pad2(n),"لاعب مسجل"]]}
  const sig=mode+groups.map(g=>g[0].length+g[1]).join();
  if(el.dataset.sig!==sig){el.dataset.sig=sig;
    el.innerHTML=`<div class="hc-k"><small>${k}</small><b id="hc-l"></b></div>`+(mode==="champ"?`<div class="hc-name" id="hc-name"></div>`:
      `<div class="flaps${groups.length===1?" one":""}" aria-hidden="true">${groups.map((g,i)=>`${i?'<span class="sep">:</span>':""}<div class="fgp"><div class="ts"></div><small>${esc(g[1])}</small></div>`).join("")}</div><span class="vh" id="hc-sr"></span>`)+`<p class="hc-line" id="hc-line"></p>`}
  $("hc-l").textContent=label;$("hc-line").textContent=line||"";
  if(mode==="champ")$("hc-name").textContent=ch;
  else{el.querySelectorAll(".ts").forEach((b,i)=>flapSet(b,groups[i][0]));const sr=groups.map(g=>`${+g[0]} ${g[1]}`).join("، ");if($("hc-sr").textContent!==sr)$("hc-sr").textContent=sr}
  clearInterval(hcTimer);hcTimer=null;
  if(mode==="cd")hcTimer=setInterval(()=>{if(!$("hero").hidden&&!document.hidden&&!document.documentElement.dataset.vt)heroClock()},1000);   // ما نقلب الأرقام وسط انتقال الثيم، تلحق بالثانية اللي بعدها
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
// البحث ما يفرق بين أ وإ وآ وا، ولا ة وه، ولا ى وي، ويتجاهل التشكيل والتطويل والمسافات و _ - والحروف الكبيرة والصغيرة
const norm=s=>String(s??"").normalize("NFKC").toLowerCase().replace(/[\u064B-\u065F\u0670\u0640]/g,"").replace(/[أإآٱ]/g,"ا").replace(/ة/g,"ه").replace(/ى/g,"ي").replace(/ؤ/g,"و").replace(/ئ/g,"ي")
  .replace(/[\u0660-\u0669]/g,d=>d.charCodeAt(0)-0x660).replace(/[\u06F0-\u06F9]/g,d=>d.charCodeAt(0)-0x6F0).replace(/[\s_\-.·]+/g,"");
const NC=new Map();
const nm=t=>{let v=NC.get(t);if(v===undefined){if(NC.size>5000)NC.clear();v=norm(t);NC.set(t,v)}return v};
const match=t=>!!QN&&!!t&&nm(t).includes(QN);
const SEARCH_TIP="البحث ما يفرق بين أ وا، ولا ة وه، ولا الحروف الكبيرة والصغيرة.";
const notFound=where=>`<div class="panel empty nf"><b>ما لقينا «${esc(Q)}» ${where}</b><span class="note">جرّب جزء من الاسم. ${SEARCH_TIP}</span><p><button class="btn g" type="button" data-clrq>امسح البحث</button></p></div>`;
function clearSearch(){clearTimeout(qt);$("q").value="";Q="";QN="";render("search");$("q").focus()}
const stLabel=o=>{if(G&&G.champ()===o.name)return["ch","🏆 البطل"];if(o.out)return["","خرج في "+G.RN(o.best)];return["in","باقي · "+G.RN(o.best)]};

function notStarted(){
  $("main").innerHTML=`<div class="panel empty"><b>البطولة ما بدأت للحين</b><span class="note">القائمة والمباريات تنزل هنا أول ما تجهز.</span>${canEdit()?`<p><a class="btn" href="#/settings" style="display:inline-block;text-decoration:none">أضف اللاعبين</a></p>`:""}</div>`;
}

// ---- home
function startDateText(){const t=Date.parse(C.startDate||"");if(!t)return"";
  try{return new Date(t).toLocaleString("ar-SA-u-ca-gregory-nu-latn",{weekday:"long",day:"numeric",month:"long",hour:"numeric",minute:"2-digit",timeZone:"Asia/Riyadh"})}catch(e){return""}}
const LIVE='<span class="livepill"><i class="ldot" aria-hidden="true"></i>جارية</span>';
function miniCard(r,m){
  const a=G.slot(r,m,0),b=G.slot(r,m,1),w=G.winner(r,m),ws=G.wins(r,m),live=G.isLive(r,m);
  const row=(p,k)=>`<a class="pl ${w?(w===p?"w":"l"):""}" href="${link("player",p)}" style="text-decoration:none"><span class="nm">${esc(p)}</span>${G.need(r)>1?`<span class="sc">${ws[k]}</span>`:""}</a>`;
  return`<div class="mt${live?" live":""}" data-key="${K(r,m)}"><header><span><span class="no">#${G.matchNo(r,m)}</span><span class="tag ${G.isBo3(r)?"bo3":"bo1"}">${G.isBo3(r)?"BO3":"BO1"}</span></span>${live?LIVE:`<span>${G.RN(r)}</span>`}</header>${row(a,0)}${row(b,1)}</div>`;
}
function viewHome(){
  const ch=G&&G.champ();
  // live first, then next unplayed matches of the current round
  let feed="",feedTitle="";
  if(G&&!ch){const cr=G.curRound(),live=[],next=[];
    for(let r=cr;r<G.nRounds&&live.length+next.length<16;r++)for(let m=0;m<G.mCount(r);m++){if(G.isBye(r,m)||G.winner(r,m)||!G.slot(r,m,0)||!G.slot(r,m,1))continue;(G.isLive(r,m)?live:next).push([r,m])}
    const list=[...live,...next].slice(0,4);feedTitle=live.length?"مباريات جارية الحين":"المباريات الجاية";
    feed=list.map(([r,m])=>miniCard(r,m)).join("")}
  const reg=C.registration&&C.registration.open&&!G?`<div class="panel" style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap"><div><h3 style="margin:0">التسجيل مفتوح</h3><span class="note">${esc(C.registration.note||"")}</span></div><a class="btn" href="#/register" style="text-decoration:none">سجّل الحين</a></div>`:"";
  const ql=[["matches","المباريات","كل مباراة ونتيجتها"],["bracket","البراكت","الطريق كامل للنهائي"],["players","اللاعبين","ابحث عن مبارياتك"],["rules","القوانين","اقراها قبل تلعب"],["prizes","الجوائز","وش يفوز فيه الأوائل"],["schedule","المواعيد","متى يلعب كل دور"]]
    .filter(([k])=>!(PAGES[k].hidden&&PAGES[k].hidden())).map(([k,t,s])=>`<a class="ql" href="#/${k}"><b>${t}</b><span>${s}</span></a>`).join("")
    +(MANIFEST?`<button class="ql" id="qinst" type="button"${canInstall()?"":" hidden"}><b>ثبّت الموقع</b><span>افتحه من شاشتك كتطبيق</span></button>`:"");
  $("main").innerHTML=`
   ${reg?`<div class="sec">${reg}</div>`:""}
   ${feed?`<div class="sec"><h3>${feedTitle}<a href="#/matches">كل المباريات</a></h3><div class="grid">${feed}</div></div>`:""}
   ${C.about?`<div class="sec"><h3>عن البطولة</h3><p class="about">${esc(C.about)}</p></div>`:""}
   <div class="sec"><h3>تصفح</h3><div class="qlinks">${ql}</div></div>`;
  const qi=$("qinst");if(qi)qi.onclick=install;
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
  let found=!QN;for(let rr=0;rr<R&&!found;rr++)for(let m=0;m<G.mCount(rr);m++)if(match(G.slot(rr,m,0))||match(G.slot(rr,m,1))){found=true;break}
  $("main").innerHTML=`<div class="rounds">${pills}</div>${found?`<p class="hint">${hint}</p>`:notFound("في المباريات")}<div class="grid${canEdit()?" can":""}">${cards}</div>`;
  document.querySelectorAll(".rp").forEach(b=>b.onclick=()=>{UI.round=+b.dataset.round;render("round")});
  if(canEdit()){
    document.querySelectorAll(".pl[data-r]").forEach(b=>b.onclick=()=>{b.disabled=true;Act.addWin(+b.dataset.r,+b.dataset.m,+b.dataset.k)});
    document.querySelectorAll("[data-u]").forEach(b=>b.onclick=()=>{const[r,m]=b.dataset.u.split("-").map(Number);Act.undo(r,m)});
  }
  if(QN)document.querySelector(".mt.hl")?.scrollIntoView({block:"center",behavior:"smooth"});
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
  if(SECRETS){const fx=10+(R-1)*(W+Gp)+W+12,fy=pos[R-1][0]+H/2-15;s+=`<g class="egg" data-egg="bracket" transform="translate(${fx} ${fy}) scale(.078)"><rect x="-120" y="-100" width="567" height="585" fill="transparent"/><path fill-rule="evenodd" d="${KID_D}"/></g>`}
  const width=20+R*(W+Gp),height=20+G.mCount(0)*(H+V);
  const r0=QN?pos[0].findIndex((y,m)=>match(G.slot(0,m,0))||match(G.slot(0,m,1))):-1;
  $("main").innerHTML=`<div class="bar"><button class="btn g" id="zi">+ تكبير</button><button class="btn g" id="zo">− تصغير</button><button class="btn g" id="zr">ملاءمة</button>${QN&&r0<0?`<span class="note">ما لقينا «${esc(Q)}» في البراكت. <button class="linkbtn" type="button" data-clrq>امسح البحث</button></span>`:""}</div>
   <div class="vp" id="vp" dir="ltr"><svg id="sv" width="${width}" height="${height}">${s}</svg></div>`;
  const sv=$("sv"),vp=$("vp");
  const ap=()=>sv.style.transform=`translate(${Z.x}px,${Z.y}px) scale(${Z.z})`;
  const fit=()=>{Z.z=Math.min(vp.clientWidth/width,1);Z.x=0;Z.y=10;ap()};
  if(r0>=0){Z.z=.9;Z.y=-pos[0][r0]*Z.z+vp.clientHeight/2;Z.x=10}
  ap();
  const za=f=>()=>{window.Motion&&Motion.zoom(sv);f()};   // أزرار التكبير تنزلق، السحب والعجلة تبقى فورية
  const clamp=z=>Math.min(2,Math.max(.12,z));
  const local=(x,y)=>{const rc=vp.getBoundingClientRect();return[x-rc.left,y-rc.top]};
  const zoomAt=([mx,my],nz)=>{nz=clamp(nz);Z.x=mx-(mx-Z.x)*nz/Z.z;Z.y=my-(my-Z.y)*nz/Z.z;Z.z=nz;ap()};
  $("zi").onclick=za(()=>{Z.z=Math.min(2,Z.z*1.25);ap()});$("zo").onclick=za(()=>{Z.z=Math.max(.12,Z.z/1.25);ap()});$("zr").onclick=za(fit);
  vp.onwheel=e=>{e.preventDefault();sv.classList.remove("za");zoomAt(local(e.clientX,e.clientY),Z.z*(e.deltaY<0?1.12:.89))};
  // النقر مرتين يقرّب على المكان، ومرة ثانية يرجع للملاءمة
  const dbl=(x,y)=>{window.Motion&&Motion.zoom(sv);if(Z.z<.95)zoomAt(local(x,y),Math.max(1,Z.z*2));else fit()};
  // إصبع واحد يسحب، وإصبعين يكبّرون ويحركون مع بعض
  const pts=new Map();let d=null,pinch=null,tap=null,ptype="mouse";
  const two=()=>{const[a,b]=[...pts.values()];return{dist:Math.hypot(a[0]-b[0],a[1]-b[1])||1,mid:local((a[0]+b[0])/2,(a[1]+b[1])/2)}};
  vp.onpointerdown=e=>{
    const eg=e.target.closest&&e.target.closest("[data-egg]");if(eg&&!pts.size){kidFind(eg.dataset.egg,eg);return}
    sv.classList.remove("za");ptype=e.pointerType;vp.setPointerCapture(e.pointerId);pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pts.size===2){const t=two();pinch={dist:t.dist,z:Z.z,cx:(t.mid[0]-Z.x)/Z.z,cy:(t.mid[1]-Z.y)/Z.z};d=null;tap=null;return}
    if(pts.size>2)return;
    if(e.pointerType!=="mouse"){if(tap&&e.timeStamp-tap.t<320&&Math.hypot(e.clientX-tap.x,e.clientY-tap.y)<30){tap=null;d=null;dbl(e.clientX,e.clientY);return}
      tap={t:e.timeStamp,x:e.clientX,y:e.clientY}}
    d=[e.clientX-Z.x,e.clientY-Z.y];vp.style.cursor="grabbing"};
  vp.onpointermove=e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);
    if(pinch&&pts.size>=2){const t=two(),nz=clamp(pinch.z*t.dist/pinch.dist);Z.z=nz;Z.x=t.mid[0]-pinch.cx*nz;Z.y=t.mid[1]-pinch.cy*nz;ap();return}
    if(d){Z.x=e.clientX-d[0];Z.y=e.clientY-d[1];ap()}};
  vp.onpointerup=vp.onpointercancel=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;
    if(pts.size===1){const[p]=pts.values();d=[p[0]-Z.x,p[1]-Z.y]}else if(!pts.size){d=null;vp.style.cursor="grab"}};
  vp.ondblclick=e=>{if(ptype==="mouse")dbl(e.clientX,e.clientY)};   // اللمس له حسبته فوق، والمتصفح يرسل dblclick بعدها
}

// ---- players
function viewPlayers(){
  if(!G)return notStarted();
  const ch=G.champ();
  const list=[...RUNS.values()].sort((a,b)=>(b.name===ch)-(a.name===ch)||(a.out-b.out)||(b.best-a.best)||(b.mw-a.mw)||a.name.localeCompare(b.name));
  const shown=QN?list.filter(o=>match(o.name)):list;
  const alive=list.filter(o=>!o.out).length;
  $("main").innerHTML=`<p class="hint">${list.length} لاعب، باقي منهم ${ch?1:alive}.${QN?` نتائج البحث: ${shown.length}`:""}</p>
   ${shown.length?`<div class="plist">${shown.map(o=>{const[c,t]=stLabel(o);return`<a class="pr${o.out?" out":""}" href="${link("player",o.name)}"><span class="nm">${esc(o.name)}</span><span class="st ${c}">${t}</span></a>`}).join("")}</div>`:notFound("بين اللاعبين")}`;
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
  $("main").innerHTML=`<div class="podium">${arr(C.prizes).map((p,i)=>`<div class="pd${i===0?" p1":""}">${i===0?eggHtml("prize"):""}<span class="pl-no">${i+1}</span><small>${esc(p.place)}</small><b><span class="num">${esc(p.value)}</span> ${esc(p.unit||"")}</b>${who[i]?`<span class="who">${esc(who[i])}</span>`:""}</div>`).join("")}</div>`;
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
let qt;$("q").oninput=e=>{clearTimeout(qt);qt=setTimeout(()=>{Q=e.target.value.trim();QN=norm(Q);
  if(KID_WORDS.has(QN))kidFind("code",$("q"));
  kidSolve(QN);
  if(QN&&G&&route().page==="matches"){for(let r=G.nRounds-1;r>=0;r--){let f=false;for(let m=0;m<G.mCount(r);m++)if(match(G.slot(r,m,0))||match(G.slot(r,m,1))){f=true;break}if(f){UI.round=r;break}}}render("search")},200)};

// ---------- أسرار كايدو كيد: شعاره مخفي في ٥ أماكن (البطاقة العلوية، تحت الصفحة، جنب النهائي في البراكت،
// بطاقة المركز الأول، وكود 1412 بالكيبورد أو في البحث). كل سر تلقاه ينحفظ في جهازك، واللي يجمعها كلها ينفتح له الثيم السري
const SECRETS=C.secrets!==false;
const KID_D="M5 379C4 376 7 371 17 357C34 334 33 338 35 314C37 303 38 288 39 281C40 274 40 267 41 265L41 262L30 262C24 262 18 261 17 260C13 259 12 253 16 252C17 251 30 250 44 250C76 248 84 247 85 246C85 245 86 232 88 216C90 201 93 184 94 178C94 171 96 161 96 154C100 123 107 63 108 51C113 12 113 13 115 11C126 2 239 2 294 11C306 13 310 14 311 18C313 24 312 65 308 98C306 126 305 132 300 166C295 202 293 217 295 220C295 222 296 222 309 222L323 221L323 225C323 229 322 230 321 232C318 233 298 237 292 237C290 237 290 235 287 258C284 288 276 315 269 327C254 350 214 369 172 373C149 375 129 372 106 361C88 352 82 345 80 326C79 319 78 315 70 305C64 296 62 282 66 264L66 261L58 261C54 262 50 262 49 262C48 263 44 300 43 316L42 332L46 338C50 346 51 348 61 361C69 372 70 375 66 377C62 378 45 380 25 381C6 381 5 381 5 379ZM178 364C187 362 187 362 186 347C185 338 184 337 175 339C154 343 141 346 140 347C139 348 139 350 139 356C140 364 141 366 145 366C152 367 171 366 178 364ZM136 356C136 352 136 348 135 348C134 347 109 350 108 351C107 352 108 352 110 354C113 356 133 364 135 364C136 364 136 362 136 356ZM209 356C216 354 222 351 223 350C224 349 224 345 224 336L224 324L220 325C217 325 193 334 190 336C188 338 188 338 189 348C190 353 190 358 191 359C192 361 195 360 209 356ZM238 343L244 338L245 329C245 314 245 314 233 319L227 321L227 332C227 344 228 348 229 348C230 348 234 346 238 343ZM132 344C146 342 159 339 182 333C195 330 228 318 247 308C249 308 254 306 258 304C272 298 274 295 274 284C274 276 273 274 263 269C248 262 205 251 188 249C180 249 181 247 179 270C178 292 175 298 164 310C148 326 124 331 93 324L90 324L90 330C91 338 92 341 98 345C102 348 107 348 132 344ZM252 332C256 330 269 309 269 305C269 303 264 304 256 308L248 312L248 323C248 333 248 334 252 332ZM133 315C146 312 159 303 164 292C170 281 173 254 169 252C168 251 166 250 166 250C166 251 154 252 141 253C128 254 113 256 110 256C106 256 98 257 93 258C80 260 78 260 76 265C74 271 73 288 75 294C78 303 89 313 98 315C103 316 127 316 133 315ZM134 242C168 239 181 238 195 236C203 236 217 234 227 233C264 229 275 228 277 226C280 224 288 194 287 186L286 182L258 183C210 183 120 188 105 191C103 191 102 192 102 193C101 196 97 226 96 236L96 245L108 245C114 244 126 243 134 242ZM129 177C151 175 233 171 280 170C285 170 289 169 290 169C290 168 294 145 298 104C301 72 303 25 301 24C298 22 274 18 260 16C250 16 236 14 228 14C211 12 160 13 144 16C123 18 122 19 120 30C116 46 110 103 107 147C106 161 105 174 105 175C104 179 105 179 110 179C113 178 122 178 129 177Z";
const kidSvg=()=>`<svg viewBox="0 0 327 385" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${KID_D}"/></svg>`;
const EGGS=["hero","foot","bracket","prize","code"];
const KID_WORDS=new Set(SECRETS?["1412","kaitokid","كايدوكيد","kid1412"]:[]);
const eggHtml=id=>SECRETS?`<span class="egg" data-egg="${id}" aria-hidden="true">${kidSvg()}</span>`:"";
const kidFound=()=>arr(LS.get("kid:"+TID,[])).filter(x=>EGGS.includes(x));
function kidOpen(){return SECRETS&&kidFound().length>=EGGS.length}
// بطاقة كايدو: تطلع فوق الصفحة وتنقفل بالضغط أو Esc. بطاقة اللغز والرسالة ما تنقفل لحالها
function kidCard(html,from,{cls="",auto=0,done}={}){
  const w=document.createElement("div");w.className="kwrap";
  w.innerHTML=`<div class="kcard ${cls}" role="status" aria-live="polite">${html}</div>`;
  document.body.appendChild(w);
  const card=w.firstElementChild;if(window.Motion)Motion.cardIn(card,from);
  let shut=false,tm=0;
  const close=()=>{if(shut)return;shut=true;clearTimeout(tm);removeEventListener("keydown",onKey,true);w.classList.add("out");
    const fin=()=>{w.remove();done&&done()};window.Motion?Motion.cardOut(card,fin):fin()};
  const onKey=e=>{if(e.key==="Escape"||(!cls&&(e.key==="Enter"||e.key===" "))){e.preventDefault();e.stopPropagation();close()}};
  w.onclick=e=>{if(!cls||!card.contains(e.target)||e.target.closest("[data-kclose]"))close()};addEventListener("keydown",onKey,true);
  if(auto)tm=setTimeout(close,auto);
  w._close=close;
}
function kidFind(id,from){
  if(!SECRETS||!EGGS.includes(id)||document.querySelector(".kwrap"))return;
  const had=kidFound(),fresh=!had.includes(id),got=fresh?[...had,id]:had,left=EGGS.length-got.length;
  if(!fresh&&!left){kidRiddle(from);return}   // جمعتها كلها: أي شعار تضغطه يرجع لك اللغز
  if(fresh)LS.set("kid:"+TID,got);
  const unlock=fresh&&!left,secret=skinIds.find(k=>SK[k].secret);
  const msg=unlock?`<p>لقيت كل الأسرار!</p><small>${secret?`فتحت لك ثيم «${esc(SK[secret].name||secret)}» السري، تلقاه في الثيمات`:"محقق من الطراز الأول"}<br>وكايدو ترك لك لغز…</small>`
    :fresh?`<p>لقيت شعاري 🎩</p><small>باقي ${left}. دوّر زين…</small>`
    :`<p>هذا لقيته من قبل</p><small>باقي ${left}</small>`;
  kidCard(`${kidSvg()}<b>KAITO KID</b>${msg}<div class="kdots" aria-label="${got.length} من ${EGGS.length}">${EGGS.map((x,i)=>`<i class="${i<got.length?"on":""}"></i>`).join("")}</div>`,from,
    {auto:unlock?7000:4500,done:unlock?()=>{if(secret){skinGrid();pickSkin(secret,null)}setTimeout(()=>kidRiddle(null),700)}:null});
}

// ---------- لغز كايدو: يطلع بعد ما تجمع الكروت الخمسة. الجواب يُكتب في البحث، والرسالة اللي وراه مشفرة بالجواب نفسه
// (ما هي مكتوبة في الموقع، وما تنفتح إلا بالجواب الصح). لتغيير الجواب أو الرسالة: tournament-site-tools/riddle.mjs
const KID_RIDDLE=[["⚡","الرعد","صوت السما بعد البرق، واسم واحد من اللي بنوا هالموقع"],["🌊","البحر","أكبر من يسكن البحر"],
  ["🌕","القمر","وش يصير للقمر في الليلة اللي أطلع فيها؟"],["🌙","الليل","اللي يطوّل الليل وما ينام"],
  ["🪞","الانعكاس","خذ أول حرف من كل جواب، واقرأها مثل ما تشوفها في المرآة"]];
const KID_NOTE={s:"q45BYXoLUEEoei78K2PPRg==",i:"qaNSCkDwzI/UHh4M",n:200000,c:"gT+C92nFx4zrOrXk2uAB2dd7th4PwzgOFsCRKeLZrXYZ0kYmoHSx3Ou+2o6IC5tSMyHEBFN0M80zhBpMV0wSeyKFnTkT0XQIEPqu8eLEH1WTNd7uW2BM34i1bHitMupzSSzqUXLm1mJ42PnhufuDCxzbr2dyI8LWOUkpgHgabL8uQNex0pbXnne943g2F5AeaZ76BD/s7fvQgsnilrhPJdSkF13xrHFhoVAGPz+LoUmHZrUFZVo21gLvPkpUetE1qxO5i4JpIeDawIWW1KGGDW1yZXr6QsGcPhpr+vPFG1B9Xt16FuHpRp3fVWAcQBJowtIPoMYEsmFskHZKOBD1u9o7wyXm3G6Gq+guUDBg352yLYQNf7DZOcwc4aIpTwLba+ab3QAGAa0Z2yDHKmuk0UoDYCrYgJAeHMLDOjaYYbAEbG4+3xzlNRXePb+N/WqCttM3djXUR8DFzR7QkzHQXumogsqgLjxwG3MxCqJhNSOuPQI+InNf0ojIdvchjeSolraJmKgGrfV3UXFf4DEHFdNqrzcU8RPinpVhO3+fYr7JzzTb8V7vHFwjzCnPmAx6FA=="};
function kidRiddle(from){
  if(document.querySelector(".kwrap"))return;
  const solved=LS.get("kidnote:"+TID,null);
  kidCard(`${kidSvg()}<b>KAITO KID</b><p>لغز من كايدو</p><ol class="kr">${KID_RIDDLE.map(([i,t,q])=>`<li><span>${i}</span><div><em>${t}</em>${esc(q)}</div></li>`).join("")}</ol>
    <small>اكتب الجواب في خانة البحث (صفحة اللاعبين) 🔍</small><div class="kbtns">${solved?`<button class="btn" data-knote>افتح رسالتي</button>`:""}<button class="btn g" data-kclose>تمام</button></div>`,from,{cls:"wide"});
  const b=document.querySelector("[data-knote]");if(b)b.onclick=()=>{b.closest(".kwrap")._close();kidNote(solved)};
}
const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
let kidTry="";
async function kidSolve(qn){
  const a=qn.replace(/^ال/,"");if(!SECRETS||!crypto.subtle||a.length<3||a.length>12||a===kidTry)return;kidTry=a;
  try{const base=await crypto.subtle.importKey("raw",new TextEncoder().encode(a),"PBKDF2",false,["deriveKey"]);
    const k=await crypto.subtle.deriveKey({name:"PBKDF2",salt:b64(KID_NOTE.s),iterations:KID_NOTE.n,hash:"SHA-256"},base,{name:"AES-GCM",length:256},false,["decrypt"]);
    const html=new TextDecoder().decode(await crypto.subtle.decrypt({name:"AES-GCM",iv:b64(KID_NOTE.i)},k,b64(KID_NOTE.c)));
    const prev=LS.get("kidnote:"+TID,null),rec=prev||{html,no:String(1000+Math.floor(Math.random()*9000)),at:Date.now()};
    if(!prev)LS.set("kidnote:"+TID,rec);
    document.querySelectorAll(".kwrap").forEach(w=>w._close&&w._close());kidNote(rec);
  }catch(e){}   // جواب غلط: ولا شي يصير
}
function kidNote(rec){
  const d=new Date(rec.at).toLocaleString("ar-SA-u-nu-latn",{dateStyle:"medium",timeStyle:"short"});
  kidCard(`${kidSvg()}<div class="knote">${rec.html}</div><div class="kn-id"><span>رقم المحقق <b>#${esc(rec.no)}</b></span><span>${esc(d)}</span></div><div class="kbtns"><button class="btn g" data-kclose>قفل</button></div>`,null,{cls:"wide note"});
}
let kb="";
addEventListener("keydown",e=>{if(!SECRETS||e.ctrlKey||e.metaKey||e.altKey||e.key.length!==1)return;
  if(e.target.closest&&e.target.closest("input,textarea,select,[contenteditable]"))return;
  kb=(kb+e.key.replace(/[\u0660-\u0669]/,d=>d.charCodeAt(0)-0x660)).slice(-4);if(kb==="1412"){kb="";kidFind("code",null)}});
document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("[data-egg],[data-clrq]");if(!t)return;
  if(t.hasAttribute("data-clrq"))clearSearch();else if(!t.closest(".vp"))kidFind(t.dataset.egg,t)});
if(SECRETS)console.log("%c🎩 KAITO KID","font:900 16px sans-serif","\nفيه ٥ أسرار مخفية في الموقع. 1412");

// ---------- تثبيت الموقع كتطبيق (PWA): زر يطلع بس إذا الجهاز يقدر يثبته
const MANIFEST=!!document.querySelector('link[rel="manifest"]');   // الملف الواحد tournament-site.html ما فيه تثبيت
if(MANIFEST&&"serviceWorker"in navigator&&window.isSecureContext)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
let bip=null;
const standalone=()=>matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
const iOS=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1);
function canInstall(){return MANIFEST&&!standalone()&&(!!bip||iOS)}
function installUI(){const on=canInstall();$("inst").hidden=!on;const q=$("qinst");if(q)q.hidden=!on}
addEventListener("beforeinstallprompt",e=>{bip=e;installUI()});
addEventListener("appinstalled",()=>{bip=null;installUI();toast("انضاف الموقع لجهازك 🎉")});
async function install(){
  if(bip){const p=bip;bip=null;installUI();try{await p.prompt();await p.userChoice}catch(e){}return}
  toast("في سفاري: اضغط زر المشاركة، بعدها «إضافة إلى الشاشة الرئيسية»",6000);
}
$("inst").onclick=install;

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
brand();skins();founders();navStrip();installUI();
addEventListener("hashchange",()=>window.Motion?Motion.page(render):render());
const landing=route().page==="home"&&!/^#\/./.test(location.hash);
if(C.welcome&&C.welcome.show!==false&&landing)openWelcome();
artPlace();
if(CLOUD){render();initCloud().catch(e=>{console.error(e);$("main").innerHTML=`<div class="panel empty"><b>ما قدرنا نتصل بقاعدة البيانات</b><span class="note">تأكد من الإنترنت ومن إعدادات Firebase</span></div>`})}
else{D=LS.get("data:"+TID,null);if(!D||!Array.isArray(D.players)){D=demoData();saveLocal()}D=normalize(D);dataChanged()}
})();
