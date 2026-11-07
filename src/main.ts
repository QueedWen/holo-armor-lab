import './style.css';
import { ArmorScene } from './scene';
import { GestureEngine } from './gesture';
import { CameraTracker, type CameraStatus } from './camera';

const byId=<T extends HTMLElement=HTMLElement>(id:string):T=>{
  const el=document.getElementById(id);
  if(!el)throw new Error('Missing element: '+id);
  return el as T;
};
const viewport=byId<HTMLDivElement>('viewport');
const cameraButton=byId<HTMLButtonElement>('cameraButton');
const cameraPanelButton=byId<HTMLButtonElement>('cameraPanelButton');
const explodeButton=byId<HTMLButtonElement>('explodeButton');
const wireButton=byId<HTMLButtonElement>('wireButton');
const gestureLabel=byId('gestureLabel');
const hint=byId('gestureHint');
const toast=byId('toast');
let toastTimer=0;
function notify(text:string):void{
  toast.textContent=text;toast.classList.add('visible');
  clearTimeout(toastTimer);toastTimer=window.setTimeout(()=>toast.classList.remove('visible'),3500);
}
const scene=new ArmorScene(viewport,(s)=>{
  byId('rotationX').textContent=(s.x*180/Math.PI).toFixed(0)+'°';
  byId('rotationY').textContent=(s.y*180/Math.PI).toFixed(0)+'°';
  byId('scaleValue').textContent=Math.round(s.scale*100)+'%';
  byId('fps').textContent=s.fps+' FPS';
  byId('assemblyStatus').textContent=s.exploded?'EXPLODED':'ASSEMBLED';
  byId('power').textContent=(98.2+Math.sin(performance.now()/900)*0.5).toFixed(1)+'%';
});
const gesture=new GestureEngine();
const tracker=new CameraTracker(
  byId<HTMLVideoElement>('webcam'),byId<HTMLCanvasElement>('handCanvas'),
  (hands)=>{
    const result=gesture.process(hands);
    byId('handCount').textContent=String(result.hands);
    byId('pinchValue').textContent=result.pinchRatio===null?'—':result.pinchRatio.toFixed(2);
    scene.setGestureActive(result.mode!=='IDLE');
    if(result.rotateX||result.rotateY)scene.rotate(result.rotateX,result.rotateY);
    if(result.scaleFactor!==1)scene.scaleBy(result.scaleFactor);
    if(result.mode==='PINCH_ROTATE'){
      gestureLabel.textContent='PINCH / ROTATE';
      hint.textContent='捏合锁定中：移动手指可旋转装甲，松开停止。';
    }else if(result.mode==='TWO_HAND_ZOOM'){
      gestureLabel.textContent='DUAL HAND / ZOOM';
      hint.textContent='双手相互远离放大，靠近缩小。';
    }else{
      gestureLabel.textContent=hands.length?'HAND DETECTED':'AWAITING HAND';
      hint.textContent=hands.length?'捏合拇指和食指，或把双手放入画面。':'请将手伸入摄像头画面。';
    }
  },
  (state:CameraStatus,message:string)=>{
    byId('trackingState').textContent=state.toUpperCase();
    byId('cameraBadge').textContent=state==='tracking'?'● LIVE':state.toUpperCase();
    const live=state==='tracking';
    byId('cameraFeed').classList.toggle('connected',live);
    cameraButton.disabled=cameraPanelButton.disabled=state==='permission'||state==='loading';
    byId('cameraButtonText').textContent=live?'◉ CAMERA OFF':'◉ CAMERA ON';
    cameraPanelButton.textContent=live?'关闭摄像头 / DISABLE TRACKING':'◉ 启动摄像头 / ENABLE TRACKING';
    const vid=byId<HTMLVideoElement>('webcam');
    byId('cameraResolution').textContent=live?vid.videoWidth+' × '+vid.videoHeight:'NO SIGNAL';
    if(state==='off'||state==='error'){
      gesture.reset();scene.setGestureActive(false);
      byId('handCount').textContent='0';byId('pinchValue').textContent='—';
      gestureLabel.textContent='MOUSE / TOUCH';hint.textContent='拖拽旋转，滚轮缩放。启用摄像头可进行手势控制。';
    }
    if(state==='tracking'||state==='error')notify(message);
  }
);
function toggleCamera():void {if(tracker.active)tracker.stop();else void tracker.start();}
cameraButton.addEventListener('click',toggleCamera);
cameraPanelButton.addEventListener('click',toggleCamera);
byId('resetButton').addEventListener('click',()=>{
  scene.reset();gesture.reset();explodeButton.textContent='⫶ EXPLODE';explodeButton.classList.remove('active');notify('装甲已重置');
});
explodeButton.addEventListener('click',()=>{
  const exploded=scene.toggleExplode();
  explodeButton.textContent=exploded?'⫶ ASSEMBLE':'⫶ EXPLODE';
  explodeButton.classList.toggle('active',exploded);
  notify(exploded?'装甲拆解动画已启动':'装甲组装中');
});
wireButton.addEventListener('click',()=>{
  const on=scene.toggleWireframe();wireButton.classList.toggle('active',on);
  wireButton.setAttribute('aria-pressed',String(on));
  notify(on?'全息线框开启':'全息线框关闭');
});
function clock():void{byId('clock').textContent=new Date().toLocaleTimeString('en-GB',{hour12:false});}
clock();const interval=window.setInterval(clock,1000);
window.addEventListener('beforeunload',()=>{tracker.stop();scene.dispose();clearInterval(interval);});
notify('HOLO ARMOR LAB READY · 拖拽 3D 装甲开始体验');
