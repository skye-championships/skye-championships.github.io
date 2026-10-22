// الحركات: انتقال الصفحات، مؤشر القائمة، ظهور العناصر، وتفاعلات صغيرة.
// app.js ينادي هذي الدوال لو الملف موجود. لو انحذف أو ما اشتغل، الموقع يشتغل عادي بدون حركة.
// كل شي يوقف إذا الجهاز مفعّل "تقليل الحركة"، والمحتوى ما يبقى مخفي أبدا لو صار خطأ.
(function(){
"use strict";
const doc=document,root=doc.documentElement;
const RM=matchMedia("(prefers-reduced-motion: reduce)");
const FINE=matchMedia("(hover: hover) and (pointer: fine)");
const calm=()=>RM.matches;
const $=s=>doc.querySelector(s),$$=(s,el=doc)=>[...el.querySelectorAll(s)];
const OUT="cubic-bezier(.16,1,.3,1)";
const welcomeOpen=()=>{const w=$("#welcome");return!!w&&!w.hidden&&!w.classList.contains("out")};

// ---------- View Transitions (انتقال الصفحات وتغيير الثيم)
let vtId=0;
function vt(kind,update){
  if(calm()||typeof doc.startViewTransition!=="function"||doc.hidden){update();return null}
  const id=++vtId;root.dataset.vt=kind;let t;
  try{t=doc.startViewTransition(update)}catch(e){delete root.dataset.vt;update();return null}
  const done=()=>{if(vtId===id)delete root.dataset.vt};
  t.finished.then(done,done);t.ready.catch(()=>{});
  return t;
}
const page=update=>{vt("page",update)};
// الثيم الجديد ينفتح كدائرة من زر اللون اللي ضغطته
function theme(update,from){
  const t=vt("skin",update);if(!t)return;
  const r=from&&from.getBoundingClientRect(),x=r?r.left+r.width/2:innerWidth/2,y=r?r.top+r.height/2:0;
  const R=Math.hypot(Math.max(x,innerWidth-x),Math.max(y,innerHeight-y));
  // المساحة المغطاة (مو نصف القطر) هي اللي تمشي بانتظام، عشان ما تنقلب أغلب الشاشة دفعة وحدة في النص
  const N=24,frames=[];
  for(let i=0;i<=N;i++){const p=i/N,a=(1-Math.cos(Math.PI*p))/2;frames.push({offset:p,clipPath:`circle(${(R*Math.sqrt(a)).toFixed(1)}px at ${x}px ${y}px)`})}
  t.ready.then(()=>root.animate(frames,{duration:850,easing:"linear",pseudoElement:"::view-transition-new(root)"})).catch(()=>{});
}

// ---------- مؤشر القائمة (Active-Tab Indicator): ينزلق بين الأقسام بحركة نابض
let navLast=null;
function navSync(instant){
  const n=$("#nav");if(!n)return;
  let ind=n.querySelector(":scope>.nav-ind");const fresh=!ind;
  if(fresh){ind=doc.createElement("span");ind.className="nav-ind";ind.setAttribute("aria-hidden","true");n.prepend(ind);n.classList.add("has-ind")}
  const a=n.querySelector("a[aria-current=page]");
  if(!a){ind.classList.add("off");return}
  const set=p=>{ind.style.setProperty("--x",p.x+"px");ind.style.setProperty("--w",p.w+"px")};
  const snap=p=>{ind.classList.add("snap");set(p);void ind.offsetWidth;ind.classList.remove("snap")};
  const p={x:a.offsetLeft,w:a.offsetWidth};
  if(instant||(fresh&&!navLast))snap(p);
  else{if(fresh)snap(navLast);set(p)}   // القائمة انبنت من جديد: نبدأ من مكان المؤشر القديم
  ind.classList.remove("off");navLast=p;
  if(!instant)keepVisible(n,a);
}
// لو القائمة أعرض من الشاشة تتمرر بالعرض، فنخلي القسم الحالي ظاهر (بعيد عن الأسهم) بدون ما نحرك الصفحة
function keepVisible(box,el){
  if(box.scrollWidth<=box.clientWidth+1)return;
  const b=box.getBoundingClientRect(),r=el.getBoundingClientRect(),pad=box.id==="nav"?52:28;
  const dx=r.left<b.left+pad?r.left-b.left-pad:r.right>b.right-pad?r.right-b.right+pad:0;
  if(dx)box.scrollBy({left:dx,behavior:calm()?"auto":"smooth"});
}

// ---------- القائمة تثبت فوق، تختفي مع النزول وترجع أول ما تطلع (Hide-on-Scroll Header) + زر للأعلى
let totop=null;
function scrollUI(){
  const n=$("#navbar")||$("#nav");if(!n)return;
  const s=doc.createElement("div");s.setAttribute("aria-hidden","true");n.before(s);
  totop=doc.createElement("button");totop.type="button";totop.className="totop";totop.setAttribute("aria-label","ارجع لأعلى الصفحة");
  totop.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  totop.onclick=e=>{scrollTo({top:0,behavior:calm()?"auto":"smooth"});
    if(e.detail===0){const f=$("#nav a[aria-current=page]")||$("#logo");f&&f.focus({preventScroll:true})}};   // لوحة المفاتيح: نرجّع التركيز فوق
  doc.body.appendChild(totop);
  let lastY=scrollY,tick=false;
  const top=()=>parseFloat(getComputedStyle(n).top)||0;
  const run=()=>{tick=false;
    const y=Math.max(0,scrollY),sy=s.getBoundingClientRect().top,stuck=sy<top();
    n.classList.toggle("stuck",stuck);
    if(!stuck||calm()||n.contains(doc.activeElement)){n.classList.remove("away");lastY=y}
    else if(Math.abs(y-lastY)>=10){n.classList.toggle("away",y>lastY&&sy<-160);lastY=y}   // ١٠px سماحية عشان ما ترجف
    totop.classList.toggle("on",y>innerHeight*1.2);
  };
  addEventListener("scroll",()=>{if(!tick){tick=true;requestAnimationFrame(run)}},{passive:true});
  addEventListener("resize",()=>{run();navSync(true)});
  n.addEventListener("focusin",()=>n.classList.remove("away"));
  if("ResizeObserver"in window)new ResizeObserver(()=>navSync(true)).observe($("#nav")||n);
  if(doc.fonts&&doc.fonts.ready)doc.fonts.ready.then(()=>navSync(true));
  run();
}

// ---------- ظهور العناصر (Scroll Reveal): كل عنصر يطلع مرة وحدة لما يدخل الشاشة، بتتابع بسيط
const ENTER=["#hero","#banner","#ph","#tools","#main .panel","#main .champ","#main .sec>h3","#main .about","#main .rounds","#main .hint",
  "#main .grid>.mt","#main .plist>.pr","#main .qlinks>.ql","#main .path>.pm","#main .tl>.it","#main details.fq","#main .podium>.pd","#main .hall>.hc","#main .vp","#main>.bar"].join(",");
const waiting=new Set();let io=null;
function reveal(sel,step){
  if(calm()||!("IntersectionObserver"in window))return;
  if(!io)io=new IntersectionObserver(es=>{
    const vis=es.filter(e=>e.isIntersecting).map(e=>e.target).sort((a,b)=>a.compareDocumentPosition(b)&4?-1:1);
    vis.forEach((el,i)=>{io.unobserve(el);waiting.delete(el);show(el,Math.min(i,12)*(el._step||40))});
  });
  for(const el of waiting)if(!el.isConnected){io.unobserve(el);waiting.delete(el)}
  for(const el of $$(sel)){
    if(el.closest("[hidden]")||el.classList.contains("rv"))continue;
    el._step=step||40;el.classList.add("rv");waiting.add(el);io.observe(el);
  }
}
function show(el,delay){
  let over=false;
  const done=e=>{if(over||(e&&e.target!==el))return;over=true;el.removeEventListener("animationend",done);el.classList.remove("rv","in");el.style.removeProperty("--rv-d")};
  el.style.setProperty("--rv-d",delay+"ms");el.classList.add("in");
  el.addEventListener("animationend",done);setTimeout(done,delay+1000);   // احتياط: ما يبقى شي مخفي
  $$(".chip b:not(.t),.pd .num,.fact .num",el).forEach(countUp);
}
// الأرقام تعد من صفر لقيمتها (عدد اللاعبين، الجوائز)
function countUp(n){
  const txt=n.textContent.trim();if(!/^\d{2,6}$/.test(txt))return;
  const to=+txt,t0=performance.now(),D=750,inl=getComputedStyle(n).display==="inline";
  if(inl){n.style.display="inline-block";n.style.minWidth=n.getBoundingClientRect().width+"px";n.style.textAlign="center"}
  const step=now=>{const p=Math.min(1,(now-t0)/D);n.textContent=p<1?String(Math.round(to*(1-Math.pow(1-p,3)))):txt;
    if(p<1)requestAnimationFrame(step);else if(inl)n.style.display=n.style.minWidth=n.style.textAlign=""};
  requestAnimationFrame(step);
}

// ---------- تفكيك النص (Text Scramble): حروف عشوائية تستقر وحدة وحدة. للنص الإنجليزي فقط
const GL="ABCDEFGHJKLMNPQRSTUVWXYZ0123456789";
function scramble(el){
  if(!el||calm())return;
  const text=el.textContent;if(!text.trim()||!/^[\x20-\x7E]+$/.test(text))return;
  const html=el.innerHTML,cs=getComputedStyle(el),cells=[];
  const ta=cs.textAlign==="start"?(cs.direction==="rtl"?"right":"left"):cs.textAlign==="end"?(cs.direction==="rtl"?"left":"right"):cs.textAlign;
  const wrap=doc.createElement("span");wrap.setAttribute("aria-hidden","true");
  wrap.style.cssText=`display:inline-block;direction:ltr;text-align:${ta};max-width:100%`;
  const fill=(src,dst)=>{for(const node of src.childNodes){
    if(node.nodeType===3){for(const ch of node.textContent){if(ch===" "){dst.append(" ");continue}
      const c=doc.createElement("span");c.textContent=ch;c.style.display="inline-block";dst.append(c);cells.push({c,ch})}}
    else if(node.nodeType===1){const k=node.cloneNode(false);dst.append(k);fill(node,k)}}};
  fill(el,wrap);if(!cells.length)return;
  const sr=doc.createElement("span");sr.className="vh";sr.textContent=text;   // قارئ الشاشة يقرا النص الصحيح مرة وحدة
  el.replaceChildren(sr,wrap);
  cells.forEach(o=>o.w=o.c.getBoundingClientRect().width);
  cells.forEach(o=>{o.c.style.width=o.w+"px";o.c.style.textAlign="center"});   // عرض ثابت لكل حرف = ما يتحرك السطر
  const n=cells.length,D=Math.min(950,450+n*30),t0=performance.now();let last=0;
  cells.forEach((o,i)=>o.end=D*(.3+.7*(i+1)/n));
  const tick=now=>{
    if(!wrap.isConnected)return;
    const t=now-t0,swap=now-last>55;if(swap)last=now;let live=0;
    for(const o of cells){if(t>=o.end){if(o.c.textContent!==o.ch)o.c.textContent=o.ch}else{live++;if(swap)o.c.textContent=GL[Math.random()*GL.length|0]}}
    if(live)requestAnimationFrame(tick);else el.innerHTML=html;
  };
  requestAnimationFrame(tick);
}

// ---------- بعد كل رسم للصفحة
let pendingEnter=null,heroDone=false,firstNav=true;
function rendered(kind,info){
  info=info||{};
  navSync(firstNav);firstNav=false;
  if(kind==="page"){if(welcomeOpen()){pendingEnter=info;return}enter(info);return}
  if(kind==="round"){reveal("#main .grid>.mt",28);const p=$(".rp[aria-pressed=true]");if(p)keepVisible(p.parentElement,p);return}
  if(kind==="search"){
    if(info.page==="players")reveal("#main .plist>.pr",16);
    const h=$("#main .mt.hl");if(h&&!calm()){h.classList.add("ping");h.addEventListener("animationend",()=>h.classList.remove("ping"),{once:true})}
  }
}
function enter(info){
  reveal(ENTER);
  const m=$("#main");
  if(m&&!calm()){m.setAttribute("data-fresh","");clearTimeout(m._fresh);m._fresh=setTimeout(()=>m.removeAttribute("data-fresh"),1400)}
  if(info.page==="home"&&!heroDone){heroDone=true;scramble($("#mode"))}
  if(info.page==="player")scramble($("#main .prof h3"));
}
// الواجهة الترحيبية تطلع: الموقع يطلع تحتها بنفس اللحظة
function welcomeOut(){if(pendingEnter){const i=pendingEnter;pendingEnter=null;enter(i)}}

// ---------- نتيجة جديدة (من المشرف أو تحديث مباشر): البطاقة تلمع والنقطة تنط
function results(list){
  if(calm())return;
  for(const c of list){if(!c.grew)continue;
    for(const el of $$(`[data-key="${c.key}"]`)){
      el.classList.add("flash");
      if(el instanceof SVGElement){setTimeout(()=>el.classList.remove("flash"),1300);continue}
      el.addEventListener("animationend",function f(e){if(e.animationName!=="flash")return;el.classList.remove("flash");el.removeEventListener("animationend",f)});
      const row=el.querySelectorAll(".pl")[c.k];if(!row)continue;
      if(row.classList.contains("w"))row.classList.add("won");
      const dots=row.querySelectorAll(".dots i.on"),mark=dots[dots.length-1]||row.querySelector(".sc");
      if(mark)mark.animate([{scale:0},{scale:1.5,offset:.55},{scale:1}],{duration:500,easing:OUT});
    }
  }
}

// ---------- العداد التنازلي: الخانة اللي تتغير بس تنزل من فوق
function count(el,html){
  if(calm()||!el.children.length){el.innerHTML=html;return}
  const tmp=doc.createElement("div");tmp.innerHTML=html;
  const nb=$$("b",tmp),ob=$$("b",el);
  if(nb.length!==ob.length){el.innerHTML=html;return}
  nb.forEach((b,i)=>{const o=ob[i],nv=b.textContent,ov=o.textContent;if(nv===ov)return;
    const old=[...ov],moved=[];
    o.replaceChildren(...[...nv].map((d,j)=>{const s=doc.createElement("i");s.textContent=d;if(d!==old[j]||old.length!==nv.length)moved.push(s);return s}));
    moved.forEach(s=>s.animate([{transform:"translateY(-75%)",opacity:0},{transform:"none",opacity:1}],{duration:450,easing:OUT}));
  });
}

// ---------- الإشعارات (Toast): تتكدس، تتوقف لما تمرر الماوس عليها، وتختفي بحركة قبل ما تنشال
let tv=null;
function toast(msg,ms){
  if(!tv||!tv.isConnected){tv=doc.createElement("div");tv.className="toasts";tv.setAttribute("role","status");tv.setAttribute("aria-live","polite");doc.body.appendChild(tv)}
  const old=[...tv.children].filter(c=>!c.classList.contains("out"));
  if(old.length>=3)old[0]._close();
  const before=old.map(c=>[c,c.getBoundingClientRect().top]);
  const t=doc.createElement("div");t.className="toast";t.textContent=msg;tv.appendChild(t);
  if(!calm())before.forEach(([c,y])=>{const d=y-c.getBoundingClientRect().top;if(d)c.animate([{translate:`0 ${d}px`},{translate:"0 0"}],{duration:420,easing:OUT})});
  let left=ms||2600,start=0,timer=0;
  const close=t._close=()=>{clearTimeout(timer);if(t.classList.contains("out"))return;
    if(calm())return t.remove();t.classList.add("out");t.addEventListener("animationend",()=>t.remove(),{once:true});setTimeout(()=>t.remove(),400)};
  const run=()=>{start=performance.now();clearTimeout(timer);timer=setTimeout(close,left)};
  t.addEventListener("pointerenter",()=>{clearTimeout(timer);left=Math.max(800,left-(performance.now()-start))});
  t.addEventListener("pointerleave",run);
  run();
}

// ---------- الأسئلة الشائعة (Accordion): تنفتح وتنقفل بانسياب بدل ما تنط
doc.addEventListener("click",e=>{
  const s=e.target.closest&&e.target.closest("details.fq>summary");if(!s||calm())return;
  const d=s.parentElement;e.preventDefault();
  const from=d.getBoundingClientRect().height,opening=!d.open||d.classList.contains("closing");
  if(d._anim)d._anim.cancel();
  let to;
  if(opening){d.classList.remove("closing");d.open=true;to=d.getBoundingClientRect().height}
  else{d.classList.add("closing");to=s.offsetHeight+(d.offsetHeight-d.clientHeight)}
  d.style.overflow="hidden";
  const a=d._anim=d.animate({height:[from+"px",to+"px"]},{duration:Math.min(450,220+Math.abs(to-from)*.5),easing:OUT});
  if(opening){const p=d.querySelector("p");if(p)p.animate([{opacity:0,translate:"0 -6px"},{opacity:1,translate:"0 0"}],{duration:320,delay:60,easing:OUT,fill:"backwards"})}
  a.onfinish=()=>{d._anim=null;d.style.overflow="";if(!opening){d.open=false;d.classList.remove("closing")}};
});

// ---------- توهج يلحق الماوس داخل البطاقات (Cursor Spotlight)
let pe=null,pf=0;
doc.addEventListener("pointermove",e=>{
  if(!FINE.matches||calm())return;pe=e;
  if(!pf)pf=requestAnimationFrame(()=>{pf=0;const c=pe.target.closest&&pe.target.closest(".ql,.pr,.hc,.pd,.mt,.panel.status");if(!c)return;
    const r=c.getBoundingClientRect();c.style.setProperty("--mx",pe.clientX-r.left+"px");c.style.setProperty("--my",pe.clientY-r.top+"px")});
},{passive:true});

// ---------- بطاقة كايدو: تنرمى من مكان الشعار اللي انضغط وتلف لين توقف في النص، وتطير لما تنقفل
function cardIn(el,from){
  if(calm())return;
  const r=from&&from.getBoundingClientRect?from.getBoundingClientRect():null,c=el.getBoundingClientRect();
  const dx=r?r.left+r.width/2-(c.left+c.width/2):0,dy=r?r.top+r.height/2-(c.top+c.height/2):innerHeight*.6;
  el.animate([{translate:`${dx}px ${dy}px`,rotate:"-480deg",scale:.06,opacity:0},{opacity:1,offset:.2},{translate:"0 0",rotate:"0deg",scale:1,opacity:1}],{duration:820,easing:OUT});
  const s=el.querySelector("svg");if(s)s.animate([{scale:.6,rotate:"-12deg"},{scale:1.08,offset:.6},{scale:1,rotate:"0deg"}],{duration:600,delay:520,easing:OUT,fill:"backwards"});
}
function cardOut(el,done){
  if(calm())return done();
  let over=false;const end=()=>{if(!over){over=true;done()}};
  const a=el.animate([{},{translate:"38vw -75vh",rotate:"40deg",scale:.5,opacity:0}],{duration:480,easing:"cubic-bezier(.7,0,.84,0)",fill:"forwards"});
  a.onfinish=end;setTimeout(end,700);
}

// ---------- البراكت: التكبير بالأزرار ينزلق
function zoom(svg){if(!svg||calm())return;svg.classList.add("za");clearTimeout(svg._za);svg._za=setTimeout(()=>svg.classList.remove("za"),450)}

if(doc.readyState==="loading")doc.addEventListener("DOMContentLoaded",scrollUI);else scrollUI();
window.Motion={page,theme,rendered,results,count,toast,zoom,welcomeOut,cardIn,cardOut};
})();
