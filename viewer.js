/* Educational viewer. Geometry and licenses: ATTRIBUTION-original.md. */
(() => {
'use strict';
const $=id=>document.getElementById(id);
const fail=error=>{$('loading').hidden=false;$('loading-text').textContent='模型未能载入：'+error.message;$('progress').hidden=true;$('model-status').textContent='载入失败，请确认 anatomy-assets 文件夹完整';console.error(error);};
try {
if(!window.AnatomyLib)throw new Error('缺少本地显示组件');
const {THREE:T,GLTFLoader,OrbitControls,mergeGeometries}=window.AnatomyLib;
let data=null,landmarks={left:[[0,0,0],[0,0,0],[0,0,0]],right:[[0,0,0],[0,0,0],[0,0,0]]};
const modelCache=new Map();window.ANATOMY_MODELS=window.ANATOMY_MODELS||{};
const canvas=$('scene'),host=$('viewport');
const renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=T.SRGBColorSpace;
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
const scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,.005,40);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.09;controls.minDistance=.1;controls.maxDistance=7;controls.maxPolarAngle=Math.PI*.94;
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
scene.add(new T.HemisphereLight(0xfff8ec,0xa2ac9d,2));
const key=new T.DirectionalLight(0xfff9ee,2.6);key.position.set(-2,4,4);scene.add(key);
const rim=new T.DirectionalLight(0xf0f5ff,1.5);rim.position.set(2,3,-3);scene.add(rim);
const fill=new T.DirectionalLight(0xffffff,.7);fill.position.set(2,1,4);scene.add(fill);
const pedestal=new T.Mesh(new T.CylinderGeometry(.39,.41,.018,80),new T.MeshStandardMaterial({color:0xdce2d6,roughness:.75}));pedestal.position.y=-.014;scene.add(pedestal);
const ring=new T.Mesh(new T.RingGeometry(.38,.383,80),new T.MeshBasicMaterial({color:0x9faf9c,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.003;scene.add(ring);
const anatomy=new T.Group();scene.add(anatomy);
let systems=new Map();const cutUniform={value:0},cutXUniform={value:-.195};
let ready=false,layer='surface',scenario='standard',focus='full',transition=null,cutTarget=0;
let tourStarted=0,tourIndex=-1,tourTimer=null,lastFrame=0;
const labels=[],markers=[];
const configs={
 standard:{title:'先找到腕部的动脉',text:'腕部脉诊感受的是桡动脉搏动。放大腕部可以查看寸、关、尺的近似示意；临床定位还需结合桡骨茎突等体表标志。',focus:'full'},
 hemiplegia:{title:'示例：左侧活动受限',text:'蓝色光环提示左侧受限腕部。先询问疼痛与活动能力，协助舒适摆位；条件允许时可比较两侧，不能把偏瘫等同于患侧无法取脉。模型未模拟肌张力或脉象。',focus:'left'},
 amputation:{title:'示例：右侧前臂缺失',text:'右前臂采用简化裁切示意，右腕脉位随之隐藏。可以从左腕获取脉诊信息，并结合望、闻、问诊及其他检查；不能把左腕当成右腕所有脉位的直接替代。',focus:'full'},
 restricted:{title:'示例：右腕疼痛或挛缩',text:'蓝色光环标出需要先询问的右腕。征得同意、支撑前臂并调整体位，避免强行掰直。这里展示检查关注位置，未把健康解剖模型变形为真实挛缩。',focus:'right'}
};
function caption(text,point,side,detail=false,index=1){const el=document.createElement('span');el.className='marker-label';el.textContent=text;$('labels').appendChild(el);labels.push({el,point:point.clone(),side,detail,index});}
const pulseGeometry=new T.SphereGeometry(.0055,16,12);
for(const side of ['left','right']){
 const ps=landmarks[side].map(p=>new T.Vector3(...p));
 ps.forEach((point,i)=>{const material=new T.MeshBasicMaterial({color:0xd24632,depthTest:false});const mesh=new T.Mesh(pulseGeometry,material);mesh.position.copy(point);mesh.renderOrder=20;mesh.visible=false;scene.add(mesh);markers.push({mesh,side,index:i});caption(['寸','关','尺'][i],point,side,true,i);});
 caption(side==='left'?'左腕':'右腕',ps[1],side);
}
const focusRing=new T.Mesh(new T.TorusGeometry(.025,.0012,8,48),new T.MeshBasicMaterial({color:0x4f91a4,transparent:true,opacity:.85,depthTest:false}));focusRing.renderOrder=19;scene.add(focusRing);focusRing.visible=false;
function cameraTo(which,instant=false){
 focus=which;
 let target,direction,distance;
 if(which==='full'){const bounds=data?.bounds||[[-.334,0,-.146],[.333,1.73,.147]];const h=bounds[1][1]-bounds[0][1],w=bounds[1][0]-bounds[0][0];target=new T.Vector3(0,h/2,0);direction=new T.Vector3(.13,.015,1).normalize();distance=Math.max(h*1.16,w*1.25/camera.aspect)/(2*Math.tan(T.MathUtils.degToRad(camera.fov/2)));}
 else{target=new T.Vector3(...landmarks[which][1]);direction=new T.Vector3(which==='left'?.18:-.18,.12,1).normalize();distance=.24;}
 const position=target.clone().addScaledVector(direction,distance);
 if(instant||reduced){camera.position.copy(position);controls.target.copy(target);controls.update();transition=null;}
 else transition={start:performance.now(),from:camera.position.clone(),fromTarget:controls.target.clone(),position,target};
}
controls.addEventListener('start',()=>{transition=null;});
function setLayer(value){
 layer=value;
 const female=data?.id==='female';
 const visible={surface:['integumentary','sensory'],anatomy:female?['integumentary','skeletal','muscular','arterial','venous','cardiac','respiratory','digestive','urinary','reproductive','lymphatic','nervous','sensory','connective']:['skeletal','muscular','arterial','cardiac','sensory','connective'],arteries:['integumentary','skeletal','arterial','cardiac'],skeleton:female?['integumentary','skeletal','connective']:['skeletal','connective']}[value];
 systems.forEach((mesh,system)=>{
  mesh.visible=visible.includes(system);
  const transparent=(system==='integumentary'&&(value==='arteries'||female&&value!=='surface'))||(system==='skeletal'&&value==='arteries');
  mesh.material.transparent=transparent;mesh.material.opacity=transparent?(system==='integumentary'?.075:.14):1;mesh.material.depthWrite=!transparent;mesh.material.needsUpdate=true;
  mesh.renderOrder=system==='integumentary'?3:system==='skeletal'?2:0;
 });
 document.querySelectorAll('[data-layer]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.layer===value)));
 const names={surface:'体表',anatomy:female?'器官解剖':'肌肉解剖',arteries:female?'局部动脉':'动脉透视',skeleton:female?'局部骨骼':'骨骼'};
 document.querySelectorAll('[data-layer]').forEach(b=>b.textContent=names[b.dataset.layer]);
 $('view-title').textContent=(female?'女性 · ':'男性 · ')+names[value];
}
function stopTour(){clearInterval(tourTimer);tourTimer=null;tourStarted=0;$('tour').textContent='播放4分钟导览';$('tour').setAttribute('aria-pressed','false');}
function setScenario(value,fromTour=false){
 if(!fromTour)stopTour();scenario=value;const c=configs[value];
 $('scenario-title').textContent=c.title;$('scenario-detail').textContent=c.text+(data?.id==='female'?' 女性版腕部光点是体表近似示意，源模型不含此处动脉。':'');
 document.querySelectorAll('[data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scenario===value)));
 cutTarget=value==='amputation'?(data?.clipY||1.02):0;if(reduced)cutUniform.value=cutTarget;
 focusRing.visible=value==='hemiplegia'||value==='restricted';
 if(focusRing.visible)focusRing.position.set(...landmarks[value==='hemiplegia'?'left':'right'][1]);
 markers.forEach(m=>{m.mesh.visible=!(value==='amputation'&&m.side==='right');m.mesh.material.color.set(value==='hemiplegia'&&m.side==='left'||value==='restricted'&&m.side==='right'?0x4f91a4:0xd24632);});
 const right=document.querySelector('[data-focus="right"]');right.disabled=value==='amputation';
 cameraTo(c.focus);
}
document.querySelectorAll('[data-layer]').forEach(b=>b.addEventListener('click',()=>setLayer(b.dataset.layer)));
document.querySelectorAll('[data-model]').forEach(b=>b.addEventListener('click',()=>loadModel(b.dataset.model)));
document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>setScenario(b.dataset.scenario)));
document.querySelectorAll('[data-focus]').forEach(b=>b.addEventListener('click',()=>{stopTour();cameraTo(b.dataset.focus);}));
$('reset').addEventListener('click',()=>cameraTo('full'));
$('rotate').addEventListener('change',()=>{controls.autoRotate=$('rotate').checked;controls.autoRotateSpeed=.6;});
$('tour').textContent='播放4分钟导览';
$('tour').addEventListener('click',()=>{
 if(tourTimer){stopTour();return;}tourStarted=performance.now();tourIndex=0;setLayer('arteries');setScenario('standard',true);$('tour').setAttribute('aria-pressed','true');
 const tick=()=>{const elapsed=(performance.now()-tourStarted)/1000;if(elapsed>=240){stopTour();return;}const idx=Math.floor(elapsed/60);if(idx!==tourIndex){tourIndex=idx;setScenario(['standard','hemiplegia','amputation','restricted'][idx],true);}const remain=240-Math.floor(elapsed);$('tour').textContent=`停止导览 · ${Math.floor(remain/60)}:${String(remain%60).padStart(2,'0')}`;};tick();tourTimer=setInterval(tick,500);
});
function resize(){camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight,false);cameraTo(focus,true);}
new ResizeObserver(resize).observe(host);resize();
function updateLabels(){
 const rect=canvas.getBoundingClientRect();
 for(const item of labels){
  const hide=!ready||(scenario==='amputation'&&item.side==='right')||(focus==='full'?item.detail:!item.detail||item.side!==focus)||camera.position.z<0;
  item.el.hidden=hide;if(hide)continue;
  const p=item.point.clone().project(camera);
  const x=(p.x+1)*rect.width/2+(item.detail?(item.side==='left'?38:-38):(item.side==='left'?32:-32));
  const y=(1-p.y)*rect.height/2;
  item.el.hidden=p.z< -1||p.z>1||x<24||x>rect.width-24||y<30||y>rect.height-48;
  item.el.style.left=x+'px';item.el.style.top=y+'px';
 }
}
function frame(now){requestAnimationFrame(frame);if(now-lastFrame<28)return;const dt=Math.min((now-lastFrame)/1000,.1);lastFrame=now;
 if(transition){const f=Math.min(1,(now-transition.start)/950),s=f*f*(3-2*f);camera.position.lerpVectors(transition.from,transition.position,s);controls.target.lerpVectors(transition.fromTarget,transition.target,s);if(f===1)transition=null;}
 cutUniform.value=T.MathUtils.damp(cutUniform.value,cutTarget,7,dt);
 if(!reduced)markers.forEach(m=>{const beat=1+.15*Math.pow(Math.max(0,Math.sin(now*.006)),8);m.mesh.scale.setScalar(beat);});
 controls.update();renderer.render(scene,camera);updateLabels();
}requestAnimationFrame(frame);
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stopTour();fail(new Error('显卡会话已暂停，请刷新页面'));});
function loadPayload(id){
 const payload=window.MODEL_CATALOG?.[id];
 if(!payload) return Promise.reject(new Error('找不到模型目录，请确认 model-catalog.js 已上传'));
 return Promise.resolve(payload);
}
async function fetchModelBuffer(payload){
 if(location.protocol==='file:') throw new Error('这是网站发布版，请上传 GitHub Pages 后通过网址打开；本地离线演示请使用原来的文件');
 const parts=new Array(payload.chunks.length);let cursor=0,received=0;
 await Promise.all(Array.from({length:3},async()=>{
  while(cursor<payload.chunks.length){const i=cursor++,chunk=payload.chunks[i];
   const response=await fetch(chunk.url);if(!response.ok)throw new Error('模型文件加载失败：'+chunk.url+'（'+response.status+'）');
   const bytes=new Uint8Array(await response.arrayBuffer());
   if(bytes.length!==chunk.bytes)throw new Error('模型文件不完整：'+chunk.url);
   if(crypto.subtle){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(b=>b.toString(16).padStart(2,'0')).join('');if(hash!==chunk.sha256)throw new Error('模型文件校验失败：'+chunk.url);}
   parts[i]=bytes;received+=bytes.length;$('progress').value=15+Math.round(received/payload.gzipBytes*40);
   $('loading-text').textContent='正在加载'+payload.label+' · '+Math.round(received/payload.gzipBytes*100)+'%';
  }
 }));
 $('loading-text').textContent='正在解压'+payload.label+'…';
 const result=await new Response(new Blob(parts).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 if(result.byteLength!==payload.glbBytes)throw new Error('模型解压长度不匹配');return result;
}
async function prepareModel(id){
 if(modelCache.has(id))return modelCache.get(id);
 const payload=await loadPayload(id);
 if(typeof DecompressionStream==='undefined')throw new Error('此浏览器不支持离线模型解压，请使用新版 Chrome 或 Edge');
 $('progress').value=25;
 await new Promise(resolve=>setTimeout(resolve,30));
 const buffer=await fetchModelBuffer(payload);
 $('loading-text').textContent='正在构建人体、骨骼与血管…';$('progress').value=60;
 const gltf=await new Promise((resolve,reject)=>new GLTFLoader().parse(buffer,'',resolve,reject));
 const grouped=new Map();
 gltf.scene.traverse(node=>{if(node.isMesh){const name=node.material.name;const group=grouped.get(name)||[];group.push(node.geometry);grouped.set(name,group);}});
 const palette={integumentary:0xd6c6ad,skeletal:0xe8ddc3,muscular:0x9f4c42,arterial:0xc63125,venous:0x4e7196,cardiac:0xa94e45,sensory:0xadaf9c,connective:0xb8c2ab,nervous:0xcab79b,respiratory:0xb77c83,digestive:0xb39369,urinary:0xae7762,reproductive:0xba9291,lymphatic:0x8da47c};
 const preparedSystems=new Map();
 grouped.forEach((geometries,system)=>{
  const geometry=mergeGeometries(geometries,false);if(!geometry)throw new Error('结构合并失败：'+system);
  const material=new T.MeshStandardMaterial({color:palette[system]||0xb7a18a,roughness:.59,metalness:0,side:T.DoubleSide});
  material.onBeforeCompile=shader=>{
   shader.uniforms.cutY=cutUniform;
   shader.uniforms.cutX=cutXUniform;
   shader.vertexShader='varying vec3 anatomyPosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nanatomyPosition=position;');
   shader.fragmentShader='varying vec3 anatomyPosition; uniform float cutY; uniform float cutX;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(anatomyPosition.x < cutX && anatomyPosition.y < cutY) discard;');
  };
  const mesh=new T.Mesh(geometry,material);preparedSystems.set(system,mesh);
 });
 gltf.scene.traverse(node=>{if(node.isMesh){node.geometry.dispose();node.material.dispose();}});
 const result={data:payload,systems:preparedSystems};modelCache.set(id,result);return result;
}
async function loadModel(id){
 if(ready&&data?.id===id)return;
 stopTour();ready=false;transition=null;focusRing.visible=false;markers.forEach(m=>m.mesh.visible=false);
 controls.autoRotate=false;$('rotate').checked=false;
 document.querySelectorAll('button,input').forEach(b=>b.disabled=true);
 $('loading').hidden=false;$('progress').hidden=false;$('progress').value=10;$('loading-text').textContent='正在载入'+(id==='female'?'女性':'男性')+'参考人体…';
 try{
  const next=await prepareModel(id);anatomy.clear();data=next.data;landmarks=data.landmarks;systems=next.systems;
  systems.forEach(m=>anatomy.add(m));cutXUniform.value=data.clipX;cutUniform.value=scenario==='amputation'?data.clipY:0;
  markers.forEach(m=>m.mesh.position.set(...landmarks[m.side][m.index]));labels.forEach(l=>l.point.set(...landmarks[l.side][l.index]));
  document.querySelectorAll('button,input').forEach(b=>b.disabled=false);ready=true;
  document.querySelectorAll('[data-model]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.model===id)));
  $('model-source').textContent=data.source+' · '+data.label+' / 在线交互展示';$('coverage-note').textContent=data.coverage;
  canvas.setAttribute('aria-label',data.source+' '+data.label+'参考人体，可旋转缩放');
  setLayer(layer);setScenario(scenario);cameraTo('full',true);
  $('model-status').textContent=data.source+' · '+data.meshCount.toLocaleString()+' 个结构';$('progress').value=100;$('loading').hidden=true;
 }catch(error){fail(error);document.querySelectorAll('[data-model]').forEach(b=>b.disabled=false);}
}
const initial=document.documentElement.dataset.initialModel==='female'?'female':'male';loadModel(initial);
} catch(error){fail(error);}
})();
