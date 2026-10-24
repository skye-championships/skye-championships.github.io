// القطعة الرئيسية في الواجهة: بوكس فورتنايت ثلاثي الأبعاد (أرضية + ٤ جدران + سقف) وداخله الكأس، يعني BOX + CUP.
// ينبني قطعة قطعة مثل البناء في اللعبة، يلف لحاله، تسحبه وتلفه، تضربه وتطلع أرقام الضرر، وكل كم ثانية يسوي «إيدت» في الجدار اللي قدامك عشان تشوف الكأس.
// ألوانه من الثيم مباشرة. لو الجهاز طالب تقليل الحركة: يطلع مبني وواقف، والسحب يشتغل عادي.
(function(){
"use strict";
const host=document.getElementById("hbox");if(!host)return;
const RM=matchMedia("(prefers-reduced-motion: reduce)");
const calm=()=>RM.matches;

// الوجوه: الاتجاه (للإضاءة) وترتيب البناء. الأرضية أول، بعدها الجدران، والسقف آخر شي
const FACES=[
  {k:"bot",n:[0,1,0],t:"rotateX(-90deg)",o:0},
  {k:"f",n:[0,0,1],t:"rotateY(0deg)",o:1},
  {k:"r",n:[1,0,0],t:"rotateY(90deg)",o:2},
  {k:"b",n:[0,0,-1],t:"rotateY(180deg)",o:3},
  {k:"l",n:[-1,0,0],t:"rotateY(-90deg)",o:4},
  {k:"top",n:[0,-1,0],t:"rotateX(90deg)",o:5},
];
const SIDES=FACES.filter(f=>f.k.length===1);
const EDITS=[[4],[4,7],[3,4,5],[1,4,7]];   // شباك، باب، فتحة عرضية، فتحة طولية

const cupSvg=`<svg viewBox="0 0 100 112" aria-hidden="true"><path d="M24 8h52v30c0 18-12 30-26 30S24 56 24 38z"/><path d="M24 15H10v12c0 14 9 21 18 21v-7c-6 0-11-5-11-14v-5h7zM76 15h14v12c0 14-9 21-18 21v-7c6 0 11-5 11-14v-5h-7z"/><path d="M45 68h10v14H45zM33 82h34v8H33zM27 92h46v12H27z"/><path class="cs" d="M50 22l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z"/></svg>`;

host.innerHTML=`<div class="bx-sc"><div class="bx-cube" id="bxc">
  <div class="bx-gnd"></div>
  <div class="bx-cup">${cupSvg}</div>
  ${FACES.map((f,i)=>`<div class="bx-f" data-f="${i}" style="--ft:${f.t}">${Array.from({length:9},(_,j)=>`<i style="--row:${2-Math.floor(j/3)};--r:${Math.floor(j/3)};--c:${j%3}"><b></b></i>`).join("")}</div>`).join("")}
</div></div><div class="bx-tip">اسحب لتلفه · اضربه 🔨</div>`;
const cube=host.querySelector(".bx-cube"),cup=host.querySelector(".bx-cup");
const faces=[...host.querySelectorAll(".bx-f")];
const S={ry:-32,rx:-20,vy:0,vx:0,drag:null,last:0,raf:0,vis:false,built:false,edit:null,nextEdit:0,hp:faces.map(()=>3),busy:faces.map(()=>false)};

// ---------- الإضاءة: كل وجه ينور على قد ما يقابل الضوء (من فوق ويمين)
const L=(()=>{const v=[.45,-.65,.62],m=Math.hypot(...v);return v.map(x=>x/m)})();
function rot(n){
  const a=S.ry*Math.PI/180,b=S.rx*Math.PI/180;
  const x=n[0]*Math.cos(a)+n[2]*Math.sin(a),z1=-n[0]*Math.sin(a)+n[2]*Math.cos(a);
  const y=n[1]*Math.cos(b)-z1*Math.sin(b),z=n[1]*Math.sin(b)+z1*Math.cos(b);
  return[x,y,z];
}
function draw(){
  cube.style.transform=`rotateX(${S.rx}deg) rotateY(${S.ry}deg)`;
  cup.style.setProperty("--cr",`rotateY(${-S.ry}deg) rotateX(${-S.rx}deg)`);
  FACES.forEach((f,i)=>{const n=rot(f.n),d=n[0]*L[0]+n[1]*L[1]+n[2]*L[2];faces[i].style.setProperty("--lit",(.5+.5*Math.max(0,d)).toFixed(3))});
}
// الوجه اللي قدامك أكثر شي (عشان الإيدت يصير فيه)
function front(){let best=null,bz=-2;SIDES.forEach(f=>{const z=rot(f.n)[2];if(z>bz){bz=z;best=f}});return FACES.indexOf(best)}

// ---------- البناء: الوجه يطلع شفاف (مخطط) بعدين يتعبى من تحت لفوق
function build(i,delay){
  const f=faces[i];
  f.classList.add("now");f.classList.remove("on","bp","gone");   // يرجع مكانه بدون حركة، بعدين يطلع كمخطط
  f.querySelectorAll("i").forEach(t=>{t.className="";t.style.removeProperty("--g")});
  void f.offsetWidth;if(!calm())f.classList.remove("now");f.classList.add("bp");
  setTimeout(()=>{f.classList.add("on");S.hp[i]=3;f.style.setProperty("--hp",1);S.busy[i]=false},calm()?0:delay);
}
const welcomeOpen=()=>{const w=document.getElementById("welcome");return!!w&&!w.hidden};
function buildAll(){
  if(S.built||(welcomeOpen()&&!calm()))return;S.built=true;
  S.nextEdit=performance.now()+3800;   // أول إيدت بعد ما يكتمل البناء
  if(calm()){faces.forEach((f,i)=>{f.classList.add("bp","on","now")});return}
  FACES.forEach((f,i)=>build(i,120+f.o*170));
}

// ---------- الضرب: رقم ضرر يطير، البلاطة تنضغط، وبعد ٣ ضربات الوجه يتكسر وينبني من جديد
function damage(x,y,big){
  const r=host.getBoundingClientRect(),d=document.createElement("span");
  d.className="bx-dmg"+(big?" big":"");d.textContent=big?"BREAK":String(20+Math.floor(Math.random()*31));
  d.style.left=(x-r.left)+"px";d.style.top=(y-r.top)+"px";host.appendChild(d);
  const dx=(Math.random()-.5)*50;
  if(calm()){setTimeout(()=>d.remove(),700);return}
  d.animate([{transform:"translate(-50%,-50%) scale(.4)",opacity:0},{transform:"translate(-50%,-90%) scale(1.15)",opacity:1,offset:.18},{transform:`translate(calc(-50% + ${dx}px),-260%) scale(.9)`,opacity:0}],{duration:900,easing:"cubic-bezier(.2,.7,.3,1)"}).onfinish=()=>d.remove();
}
function hit(tile,x,y){
  const fe=tile&&tile.closest(".bx-f");if(!fe)return;const i=+fe.dataset.f;
  if(S.busy[i]||!fe.classList.contains("on"))return;
  S.hp[i]--;fe.style.setProperty("--hp",Math.max(S.hp[i],0)/3);
  damage(x,y,S.hp[i]<=0);
  if(!calm()&&tile!==fe)tile.animate([{translate:"0 0 0"},{translate:"0 0 -14px"},{translate:"0 0 0"}],{duration:220,easing:"ease-out"});
  if(S.hp[i]>0)return;
  S.busy[i]=true;
  if(S.edit&&S.edit.f===i)closeEdit();
  fe.querySelectorAll("i").forEach(t=>{const R=(a,b)=>a+Math.random()*(b-a);
    t.style.setProperty("--g",`translate3d(${R(-60,60)}px,${R(-30,90)}px,${R(80,200)}px) rotateX(${R(-120,120)}deg) rotateY(${R(-120,120)}deg)`)});
  fe.classList.add("gone");
  setTimeout(()=>build(i,0),calm()?400:1300);
}

// ---------- الإيدت: كل كم ثانية الجدار اللي قدامك ينفتح فيه شباك أو باب، تشوف الكأس، ويتسكر
function openEdit(){
  const i=front();if(S.busy[i]||!faces[i].classList.contains("on"))return;
  const set=EDITS[Math.floor(Math.random()*EDITS.length)],f=faces[i];
  clearTimeout(f._edm);f.classList.add("edm");   // أول تطلع شبكة الإيدت، بعدين تختفي البلاطات المختارة
  const e=S.edit={f:i,until:performance.now()+2300};
  e.tm=setTimeout(()=>set.forEach(j=>f.children[j].classList.add("ed")),300);
}
function closeEdit(){
  if(!S.edit)return;const f=faces[S.edit.f];clearTimeout(S.edit.tm);S.edit=null;
  f.querySelectorAll("i.ed").forEach(t=>t.classList.remove("ed"));
  f._edm=setTimeout(()=>f.classList.remove("edm"),320);
}

const tip=host.querySelector(".bx-tip");
function tipOff(){if(tip)tip.classList.add("off")}

// ---------- اللف: يلف لحاله ببطء، والسحب ياخذ مكانه، ولما تفلته يكمل بزخم ويهدى
function frame(now){
  S.raf=0;
  if(!S.built)buildAll();   // ينتظر لين تتسكر الواجهة الترحيبية عشان تشوفه وهو ينبني
  const dt=Math.min(50,now-(S.last||now));S.last=now;
  if(!S.drag){
    S.ry+=S.vy*dt;S.rx+=S.vx*dt;
    S.vy+=((calm()?0:.011)-S.vy)*Math.min(1,dt/700);   // يرجع للدوران الهادي
    S.vx*=Math.pow(.9,dt/16);
    S.rx+=(-20-S.rx)*Math.min(1,dt/1400);
  }
  S.rx=Math.max(-50,Math.min(8,S.rx));
  draw();
  if(!calm()){
    if(S.edit&&now>S.edit.until){closeEdit();S.nextEdit=now+5200}
    else if(!S.edit&&!S.drag&&S.built&&now>S.nextEdit){openEdit();if(!S.edit)S.nextEdit=now+1500}
  }
  const moving=S.drag||Math.abs(S.vy)>.0005||Math.abs(S.vx)>.0005||!calm();
  if(S.vis&&!document.hidden&&moving)S.raf=requestAnimationFrame(frame);
}
function wake(){if(!S.raf&&S.vis&&!document.hidden){S.last=0;S.raf=requestAnimationFrame(frame)}}

host.addEventListener("pointerdown",e=>{
  if(e.button)return;tipOff();
  S.drag={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t:performance.now(),id:e.pointerId,moved:false,tile:e.target.closest(".bx-f i")||e.target.closest(".bx-f")};
  S.vy=S.vx=0;wake();
});
host.addEventListener("pointermove",e=>{
  const d=S.drag;
  if(!d){if(e.pointerType==="mouse"){const t=e.target.closest(".bx-f i");host.querySelectorAll("i.sel").forEach(x=>x!==t&&x.classList.remove("sel"));if(t&&t.parentElement.classList.contains("on"))t.classList.add("sel")}return}
  if(e.pointerId!==d.id)return;
  const dx=e.clientX-d.x,dy=e.clientY-d.y,now=performance.now(),dt=Math.max(1,now-d.t);
  if(!d.moved&&Math.hypot(e.clientX-d.x0,e.clientY-d.y0)>6){d.moved=true;host.classList.add("drag");try{host.setPointerCapture(d.id)}catch(_){}}
  if(!d.moved)return;
  S.ry+=dx*.45;S.rx-=dy*.3;
  S.vy=dx*.45/dt;S.vx=-dy*.3/dt;
  d.x=e.clientX;d.y=e.clientY;d.t=now;
});
function up(e){
  const d=S.drag;if(!d||e.pointerId!==d.id)return;S.drag=null;host.classList.remove("drag");
  if(!d.moved&&e.type==="pointerup")hit(d.tile,e.clientX,e.clientY);
  if(performance.now()-d.t>90)S.vy=S.vx=0;   // وقفت قبل ما تفلت = ما فيه زخم
  wake();
}
host.addEventListener("pointerup",up);host.addEventListener("pointercancel",up);
host.addEventListener("pointerleave",()=>host.querySelectorAll("i.sel").forEach(x=>x.classList.remove("sel")));

// يشتغل بس وهو باين على الشاشة
if("IntersectionObserver"in window)new IntersectionObserver(es=>{const v=es[es.length-1].isIntersecting;S.vis=v;if(v){buildAll();wake()}}).observe(host);
else{S.vis=true;buildAll();wake()}
document.addEventListener("visibilitychange",wake);
RM.addEventListener&&RM.addEventListener("change",()=>{faces.forEach(f=>f.classList.toggle("now",calm()));wake()});
draw();
})();
