// القطعة الرئيسية في الواجهة: كأس البطولة ثلاثي الأبعاد (three.js). ذهب عاكس على قاعدة سوداء لامعة، تحت إضاءة مسرح وغبار ذهبي.
// يطلع من تحت أول ما تدخل، يلف لحاله، تسحبه وتلفه، والضغطة عليه تطلع قصاصات احتفال. ألوان الإضاءة من الثيم.
// لو الجهاز ما يدعم WebGL أو ما تحمّلت المكتبة يطلع كأس مرسوم بدلها. ولو طالب تقليل الحركة: يطلع واقف بدون حركة.
(function(){
"use strict";
const host=document.getElementById("hbox");if(!host)return;
const C=window.TOURNAMENT||{};
const THREE_URL="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
const RM=matchMedia("(prefers-reduced-motion: reduce)");
const calm=()=>RM.matches;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const welcomeOpen=()=>{const w=document.getElementById("welcome");return!!w&&!w.hidden};

const FALLBACK=`<svg class="tr-fb" viewBox="0 0 100 112" aria-hidden="true"><path d="M24 8h52v30c0 18-12 30-26 30S24 56 24 38z"/><path d="M24 15H10v12c0 14 9 21 18 21v-7c-6 0-11-5-11-14v-5h7zM76 15h14v12c0 14-9 21-18 21v-7c6 0 11-5 11-14v-5h-7z"/><path d="M45 68h10v14H45zM33 82h34v8H33zM27 92h46v12H27z"/></svg>`;
function fallback(){host.classList.add("fb");host.innerHTML=FALLBACK}

// المكتبة نفسها اللي تستخدمها الواجهة الترحيبية، فلو انحملت هناك ما تنحمل مرة ثانية
function loadThree(){
  if(window.THREE)return Promise.resolve();
  return new Promise((ok,no)=>{
    let s=[...document.scripts].find(x=>x.src===THREE_URL);
    if(!s){s=document.createElement("script");s.src=THREE_URL;document.head.appendChild(s)}
    s.addEventListener("load",ok);s.addEventListener("error",no);
    setTimeout(()=>window.THREE?ok():0,50);
  });
}
function webgl(){try{const c=document.createElement("canvas");return!!(c.getContext("webgl2")||c.getContext("webgl"))}catch(e){return false}}

if(!webgl()){fallback();return}
host.innerHTML=`<div class="tr-tip">اسحب لتلفه · اضغطه 🎉</div>`;
let started=false;
const io="IntersectionObserver"in window?new IntersectionObserver(es=>{if(es[es.length-1].isIntersecting&&!started){started=true;loadThree().then(init).catch(fallback)}},{rootMargin:"200px"}):null;
if(io)io.observe(host);else{started=true;loadThree().then(init).catch(fallback)}

function init(){
const T=window.THREE;if(!T){fallback();return}
let R;try{R=new T.WebGLRenderer({antialias:true,alpha:true,powerPreference:"high-performance"})}catch(e){fallback();return}
R.setPixelRatio(Math.min(devicePixelRatio||1,2));
R.outputEncoding=T.sRGBEncoding;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.15;R.physicallyCorrectLights=true;
R.domElement.setAttribute("aria-hidden","true");host.prepend(R.domElement);

const scene=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.1,100);
cam.position.set(0,2.05,10.2);cam.lookAt(0,1.55,0);
const S={rot:-.3,vel:0,tilt:0,tx:0,ty:0,drag:null,t0:0,intro:0,last:0,vis:true,raf:0};

// ---------- انعكاسات المعدن: غرفة وهمية فيها لوحات إضاءة، تنطبع على الذهب
const pm=new T.PMREMGenerator(R);
function envFor(acc){
  const es=new T.Scene();
  es.add(new T.Mesh(new T.BoxGeometry(20,20,20),new T.MeshBasicMaterial({color:0x07070a,side:T.BackSide})));
  const panel=(w,h,c,x,y,z,ry,rx)=>{const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));m.position.set(x,y,z);m.rotation.set(rx||0,ry||0,0);es.add(m)};
  panel(12,5,new T.Color(6,5.6,5),0,9.5,0,0,Math.PI/2);           // سوفت بوكس من فوق
  panel(4,12,new T.Color(5,4.7,4.3),-9.5,1,2,Math.PI/2);           // شريط يسار
  panel(3,12,new T.Color(4,3.8,3.5),9.5,1,-1,-Math.PI/2);          // شريط يمين
  panel(10,4,new T.Color(2.4,2.2,2),0,3,9.5,Math.PI);              // من قدام: يخلي وجه الكوب ذهبي مو غامق
  panel(14,6,new T.Color(.9,.75,.55),0,-9.5,0,0,-Math.PI/2);        // أرضية دافية
  panel(4,2.5,acc.clone().multiplyScalar(2.2),0,-1,-9.5,0);         // لون الثيم من ورا
  const rt=pm.fromScene(es,.035);es.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose()});return rt.texture;
}

// ---------- الكأس: ملف جانبي يندار حول المحور (Lathe)
const P=[];const v=(r,y)=>P.push(new T.Vector2(r,y));
v(0,0);v(.6,0);v(.62,.03);v(.62,.09);v(.58,.12);
for(let i=0;i<=10;i++){const t=i/10;v(.56-.42*Math.pow(t,.7),.12+.3*t)}            // قدم تضيق
v(.13,.5);v(.12,.62);
for(let i=0;i<=12;i++){const a=Math.PI*i/12;v(.12+.1*Math.sin(a),.72+.26*i/12)}    // العقدة
v(.12,1.06);v(.13,1.12);
for(let i=0;i<=40;i++){const t=i/40;v(.14+.8*Math.pow(Math.sin(t*Math.PI/2),.85)+.04*t*t,1.14+1.42*t)}   // الكوب
v(1.0,2.6);v(1.02,2.64);v(.99,2.68);v(.95,2.66);                                       // الحافة
for(let i=40;i>=0;i--){const t=i/40;if(t<.08)break;v(.1+.8*Math.pow(Math.sin(t*Math.PI/2),.85)+.04*t*t,1.22+1.42*t)}  // من داخل
v(0,1.3);
const gold=new T.MeshStandardMaterial({color:new T.Color(1,.74,.32),metalness:1,roughness:.2});
const accM=new T.MeshStandardMaterial({color:0xffffff,metalness:.85,roughness:.22,emissive:0x000000,emissiveIntensity:.35});
const trophy=new T.Group();
const cupGeo=new T.LatheGeometry(P,128);
const cup=new T.Mesh(cupGeo,gold);trophy.add(cup);
// شريط بلون الثيم حول الكوب
const bandY=1.98,bandR=.14+.8*Math.pow(Math.sin(((bandY-1.14)/1.42)*Math.PI/2),.85)+.04*Math.pow((bandY-1.14)/1.42,2);
const band=new T.Mesh(new T.CylinderGeometry(bandR+.014,bandR-.03,.15,128,1,true),accM);band.position.y=bandY;trophy.add(band);
// المقابض
function handle(s){
  const c=new T.CatmullRomCurve3([[.86,2.4],[1.22,2.46],[1.48,2.24],[1.42,1.86],[1.12,1.6],[.7,1.5]].map(([x,y])=>new T.Vector3(x*s,y,0)));
  const m=new T.Mesh(new T.TubeGeometry(c,64,.065,20,false),gold);trophy.add(m);
  [c.getPoint(0),c.getPoint(1)].forEach(p=>{const k=new T.Mesh(new T.SphereGeometry(.085,24,16),gold);k.position.copy(p);trophy.add(k)});
}
handle(1);handle(-1);
// نجمة على وجه الكوب
const star=new T.Shape();for(let i=0;i<10;i++){const a=Math.PI/2+i*Math.PI/5,r=i%2?.11:.26;i?star.lineTo(Math.cos(a)*r,Math.sin(a)*r):star.moveTo(Math.cos(a)*r,Math.sin(a)*r)}
const starM=new T.Mesh(new T.ExtrudeGeometry(star,{depth:.05,bevelEnabled:true,bevelThickness:.025,bevelSize:.02,bevelSegments:3}),accM);
const sy=2.32,st=(sy-1.14)/1.42,sr=.14+.8*Math.pow(Math.sin(st*Math.PI/2),.85)+.04*st*st;
starM.position.set(0,sy,sr-.01);starM.rotation.x=-.2;trophy.add(starM);
trophy.position.y=.62;

// ---------- القاعدة: درجتين سوداء لامعة، وبينهم إطار ذهبي، وقدامها لوحة محفور فيها اسم البطولة
const lacq=new T.MeshPhysicalMaterial({color:0x030305,metalness:.1,roughness:.42,clearcoat:1,clearcoatRoughness:.12,envMapIntensity:.6});
const base=new T.Group();
const b1=new T.Mesh(new T.BoxGeometry(1.9,.36,1.9),lacq);b1.position.y=.18;base.add(b1);
const trim=new T.Mesh(new T.BoxGeometry(1.62,.05,1.62),gold);trim.position.y=.385;base.add(trim);
const b2=new T.Mesh(new T.BoxGeometry(1.5,.22,1.5),lacq);b2.position.y=.52;base.add(b2);
const plateTex=(()=>{const cv=document.createElement("canvas");cv.width=1024;cv.height=200;return new T.CanvasTexture(cv)})();
plateTex.encoding=T.sRGBEncoding;plateTex.anisotropy=4;
function drawPlate(){
  const cv=plateTex.image,g=cv.getContext("2d");
  const gr=g.createLinearGradient(0,0,0,200);gr.addColorStop(0,"#ffe3a0");gr.addColorStop(.5,"#e2a94a");gr.addColorStop(1,"#b77d2a");
  g.fillStyle=gr;g.fillRect(0,0,1024,200);
  g.strokeStyle="#7a4f12";g.lineWidth=6;g.strokeRect(14,14,996,172);
  const md=C.mode||{};const t1=`${md.main||"BOX FIGHT"} ${md.tag||""}`.trim().toUpperCase();
  g.textAlign="center";g.textBaseline="middle";g.fillStyle="#4a2e06";
  g.font="400 92px Anton, Impact, sans-serif";g.fillText(t1,512,92);
  g.fillStyle="#fff3d0";g.globalAlpha=.35;g.fillText(t1,512,95);g.globalAlpha=1;   // حفر: ظل فاتح تحت النص
  g.font="400 34px Anton, Impact, sans-serif";g.fillStyle="#5a3a0c";g.fillText("C H A M P I O N",512,158);
  plateTex.needsUpdate=true;
}
drawPlate();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{drawPlate();frameOnce()});
const plate=new T.Mesh(new T.PlaneGeometry(1.62,.3168),new T.MeshStandardMaterial({map:plateTex,metalness:.9,roughness:.3}));
plate.position.set(0,.18,.951);base.add(plate);

const stand=new T.Group();stand.add(base);stand.add(trophy);scene.add(stand);

// ---------- الإضاءة: رئيسية دافية من فوق، وإضاءتين خلفية بلون الثيم ترسم حواف الكأس
const key=new T.SpotLight(0xfff1dc,520,30,.42,.55,2);key.position.set(1.6,9,4.2);key.target.position.set(0,1.6,0);scene.add(key,key.target);
const rimL=new T.PointLight(0xffffff,90,14,2);rimL.position.set(-3.2,3.4,-2.6);scene.add(rimL);
const rimR=new T.PointLight(0xffffff,90,14,2);rimR.position.set(3.4,2.4,-2.8);scene.add(rimR);
const fill=new T.HemisphereLight(0xfff6ea,0x1a1220,.9);scene.add(fill);

// ---------- عمود ضوء المسرح من فوق، وتوهج ورا الكأس، وظل تحت القاعدة
const beamMat=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,
  uniforms:{uC:{value:new T.Color(1,1,1)},uA:{value:0}},
  vertexShader:`varying float vY;varying vec3 vN;varying vec3 vV;void main(){vY=uv.y;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform vec3 uC;uniform float uA;varying float vY;varying vec3 vN;varying vec3 vV;void main(){float e=pow(abs(dot(vN,vV)),2.2);float f=smoothstep(0.,.75,vY)*smoothstep(1.,.55,vY);gl_FragColor=vec4(uC,e*f*uA*.32);}`});
const beam=new T.Mesh(new T.CylinderGeometry(.35,2.2,8.5,64,1,true),beamMat);beam.position.y=4.4;scene.add(beam);
const glowTex=(()=>{const cv=document.createElement("canvas");cv.width=cv.height=256;const g=cv.getContext("2d");const gr=g.createRadialGradient(128,128,0,128,128,128);gr.addColorStop(0,"rgba(255,255,255,.9)");gr.addColorStop(.35,"rgba(255,255,255,.28)");gr.addColorStop(1,"rgba(255,255,255,0)");g.fillStyle=gr;g.fillRect(0,0,256,256);return new T.CanvasTexture(cv)})();
const glow=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0xffffff,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:0}));
glow.scale.set(6,6,1);glow.position.set(0,2.4,-1.6);scene.add(glow);
const shadow=new T.Mesh(new T.PlaneGeometry(4.2,4.2),new T.MeshBasicMaterial({map:glowTex,color:0x000000,transparent:true,depthWrite:false,opacity:.75}));
shadow.rotation.x=-Math.PI/2;shadow.position.y=.002;scene.add(shadow);   // نفس التدرج بلون أسود = ظل ناعم

// ---------- غبار ذهبي يطلع ببطء داخل الضوء
const NP=140,pPos=new Float32Array(NP*3),pSeed=new Float32Array(NP);
for(let i=0;i<NP;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*1.9;pPos[i*3]=Math.cos(a)*r;pPos[i*3+1]=Math.random()*5.2;pPos[i*3+2]=Math.sin(a)*r;pSeed[i]=Math.random()}
const pGeo=new T.BufferGeometry();pGeo.setAttribute("position",new T.BufferAttribute(pPos,3));
const dust=new T.Points(pGeo,new T.PointsMaterial({size:.05,map:glowTex,color:0xffd88a,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,sizeAttenuation:true}));
scene.add(dust);

// ---------- قصاصات الاحتفال
const NC=160,conf=new T.InstancedMesh(new T.PlaneGeometry(.085,.15),new T.MeshStandardMaterial({metalness:.6,roughness:.35,side:T.DoubleSide}),NC);
conf.instanceMatrix.setUsage(T.DynamicDrawUsage);conf.visible=false;scene.add(conf);
const CF=[];for(let i=0;i<NC;i++)CF.push({p:new T.Vector3(),v:new T.Vector3(),r:new T.Euler(),w:new T.Vector3(),c:new T.Color()});
let confT=-1;
const dummy=new T.Object3D();
function burst(){
  if(calm())return;
  const pal=[new T.Color(0xffd36b),new T.Color(0xfff2c4),new T.Color(css("--acc")||"#e3122f"),new T.Color(0xffffff)];
  CF.forEach((o,i)=>{const a=Math.random()*Math.PI*2,s=1.1+Math.random()*3;
    o.p.set((Math.random()-.5)*.6,3.1,(Math.random()-.5)*.6);o.v.set(Math.cos(a)*s,2.2+Math.random()*2.6,Math.sin(a)*s*.6+.6);
    o.r.set(Math.random()*6,Math.random()*6,Math.random()*6);o.w.set((Math.random()-.5)*14,(Math.random()-.5)*14,(Math.random()-.5)*14);
    o.c.copy(pal[i%pal.length]).convertSRGBToLinear();conf.setColorAt(i,o.c)});
  conf.instanceColor.needsUpdate=true;conf.visible=true;confT=0;
}

// ---------- ألوان الثيم
function themeColors(){
  const acc=new T.Color(css("--acc")||"#e3122f").convertSRGBToLinear();
  scene.environment&&scene.environment.dispose();scene.environment=envFor(acc);
  accM.color.copy(acc);accM.emissive.copy(acc);
  const rim=acc.clone().lerp(new T.Color(0xffffff),.15);rimL.color.copy(rim);rimR.color.copy(rim);
  glow.material.color.copy(acc).multiplyScalar(.8);
  beamMat.uniforms.uC.value.copy(new T.Color(0xfff4e0).lerp(acc,.25));
  const light=document.documentElement.style.colorScheme==="light";
  shadow.material.opacity=light?.35:.75;R.toneMappingExposure=light?1.0:1.15;
  frameOnce();
}
themeColors();
new MutationObserver(()=>themeColors()).observe(document.documentElement,{attributes:true,attributeFilter:["style"]});

// ---------- الحجم
function size(){
  const w=host.clientWidth||1,h=host.clientHeight||1;R.setSize(w,h,false);cam.aspect=w/h;
  // نبعد الكاميرا لين يدخل الكأس والقاعدة كاملين، سواء الإطار عريض أو طويل
  const tn=Math.tan(cam.fov*Math.PI/360);
  cam.position.set(0,2.05,Math.max(2.5/tn,1.85/tn/cam.aspect));cam.lookAt(0,1.62,0);cam.updateProjectionMatrix();
}
size();if("ResizeObserver"in window)new ResizeObserver(()=>{size();frameOnce()}).observe(host);

// ---------- التحكم: يلف لحاله، تسحبه، والضغطة احتفال
const ease=t=>1-Math.pow(1-t,3),back=t=>{const c=1.5;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)};
host.addEventListener("pointerdown",e=>{if(e.button)return;S.drag={x:e.clientX,y:e.clientY,x0:e.clientX,y0:e.clientY,t:performance.now(),id:e.pointerId,moved:false};S.vel=0;tipOff();wake()});
host.addEventListener("pointermove",e=>{
  const r=host.getBoundingClientRect();S.tx=((e.clientX-r.left)/r.width-.5);S.ty=((e.clientY-r.top)/r.height-.5);
  const d=S.drag;if(!d||e.pointerId!==d.id){wake();return}
  if(!d.moved&&Math.hypot(e.clientX-d.x0,e.clientY-d.y0)>6){d.moved=true;host.classList.add("drag");try{host.setPointerCapture(d.id)}catch(_){}}
  if(!d.moved)return;
  const now=performance.now(),dt=Math.max(1,now-d.t),dx=e.clientX-d.x;
  S.rot+=dx*.011;S.vel=dx*.011/dt;d.x=e.clientX;d.t=now;wake();
});
function up(e){const d=S.drag;if(!d||e.pointerId!==d.id)return;S.drag=null;host.classList.remove("drag");
  if(performance.now()-d.t>90)S.vel=0;
  if(!d.moved&&e.type==="pointerup"){burst();if(!calm())S.vel=.03}   // ضغطة = احتفال ولفة كاملة
  wake()}
host.addEventListener("pointerup",up);host.addEventListener("pointercancel",up);
host.addEventListener("pointerleave",()=>{S.tx=S.ty=0;wake()});
const tip=host.querySelector(".tr-tip");function tipOff(){tip&&tip.classList.add("off")}

function frame(now){
  S.raf=0;
  const dt=Math.min(.05,(now-(S.last||now))/1000);S.last=now;
  const still=calm();
  // الدخول: ينتظر لين تتسكر الواجهة الترحيبية
  if(!S.t0&&!welcomeOpen())S.t0=now;
  const k=still?1:S.t0?Math.min(1,(now-S.t0)/1600):0;
  S.intro=k;
  const kb=back(Math.min(1,k*1.15)),ke=ease(k);
  stand.position.y=(1-kb)*-3.2;
  if(!S.drag&&!still){
    S.rot+=S.vel*dt*1000+dt*.32;   // دوران هادي + زخم السحب
    S.vel*=Math.pow(.92,dt*60);
  }
  S.tilt+=((S.drag?0:S.ty*.18)-S.tilt)*Math.min(1,dt*4);
  stand.rotation.set(S.tilt,S.rot+(still?0:(1-ke)*-2.4),0);
  trophy.position.y=.62+(still?0:Math.sin(now/900)*.03*ke);
  // الإضاءة تشتغل مع الدخول
  key.intensity=520*ke;beamMat.uniforms.uA.value=ke;glow.material.opacity=.55*ke;dust.material.opacity=.85*ke;
  cam.position.x+=((still?0:-S.tx*.6)-cam.position.x)*Math.min(1,dt*3);cam.lookAt(0,1.62,0);
  // الغبار يطلع ويرجع من تحت
  if(!still){const a=pGeo.attributes.position.array;for(let i=0;i<NP;i++){a[i*3+1]+=dt*(.18+pSeed[i]*.3);a[i*3]+=Math.sin(now/1300+pSeed[i]*20)*dt*.06;if(a[i*3+1]>5.4)a[i*3+1]=.1}pGeo.attributes.position.needsUpdate=true}
  // القصاصات: جاذبية ومقاومة هوا وتلف
  if(confT>=0){confT+=dt;
    CF.forEach((o,i)=>{o.v.y-=9.8*dt*.5;o.v.multiplyScalar(Math.pow(.975,dt*60));if(o.v.y<-1.6)o.v.y=-1.6;   // تنزل ببطء مثل الورق
      o.p.x+=Math.sin(confT*3+i)*dt*.25;o.p.addScaledVector(o.v,dt);
      o.r.x+=o.w.x*dt;o.r.y+=o.w.y*dt;o.r.z+=o.w.z*dt;
      dummy.position.copy(o.p);dummy.rotation.copy(o.r);const sc=Math.max(0,1-Math.max(0,confT-2.4)/1);dummy.scale.setScalar(sc);dummy.updateMatrix();conf.setMatrixAt(i,dummy.matrix)});
    conf.instanceMatrix.needsUpdate=true;if(confT>3.4){confT=-1;conf.visible=false}}
  R.render(scene,cam);
  const busy=!still||S.drag||Math.abs(S.vel)>1e-4||confT>=0||k<1;
  if(S.vis&&!document.hidden&&busy)S.raf=requestAnimationFrame(frame);
}
function wake(){if(!S.raf&&S.vis&&!document.hidden){S.last=0;S.raf=requestAnimationFrame(frame)}}
function frameOnce(){if(!S.raf)requestAnimationFrame(t=>{if(!S.raf)frame(t)})}
if(io)new IntersectionObserver(es=>{S.vis=es[es.length-1].isIntersecting;if(S.vis)wake()}).observe(host);
document.addEventListener("visibilitychange",wake);
RM.addEventListener&&RM.addEventListener("change",wake);
wake();
}
})();
