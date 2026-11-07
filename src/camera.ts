import { FilesetResolver, HandLandmarker, type HandLandmarkerResult } from '@mediapipe/tasks-vision';
import type { Hand } from './gesture';
const WASM='https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm';
const MODEL='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';
const BONES:[number,number][]=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],[9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
export type CameraStatus='off'|'permission'|'loading'|'tracking'|'error';
export class CameraTracker {
  private detector:HandLandmarker|null=null;
  private stream:MediaStream|null=null;
  private raf=0;private lastVideoTime=-1;private lastCheck=0;
  private generation=0;private state:CameraStatus='off';
  private ctx:CanvasRenderingContext2D;
  constructor(private video:HTMLVideoElement,private canvas:HTMLCanvasElement,private onHands:(h:Hand[])=>void,private onState:(s:CameraStatus,message:string)=>void){
    const ctx=canvas.getContext('2d');if(!ctx)throw new Error('2D canvas unavailable');this.ctx=ctx;
  }
  get active():boolean{return this.state!=='off'&&this.state!=='error';}
  private emit(s:CameraStatus,message:string){this.state=s;this.onState(s,message);}
  async start():Promise<void>{
    if(this.active)return;
    const token=++this.generation;
    if(!window.isSecureContext||!navigator.mediaDevices?.getUserMedia){this.emit('error','摄像头需要 HTTPS 或 localhost 环境');return;}
    this.emit('permission','请求摄像头授权…');
    try {
      const stream=await navigator.mediaDevices.getUserMedia({audio:false,video:{width:{ideal:640},height:{ideal:480},facingMode:'user'}});
      if(token!==this.generation){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;this.video.srcObject=stream;
      this.video.muted=true;this.video.playsInline=true;await this.video.play();
      if(token!==this.generation)return;
      this.canvas.width=this.video.videoWidth||640;this.canvas.height=this.video.videoHeight||480;
      this.emit('loading','正在初始化 MediaPipe 模型（需要联网）…');
      const files=await FilesetResolver.forVisionTasks(WASM);
      if(token!==this.generation)return;
      let detector:HandLandmarker;
      try {
        detector=await HandLandmarker.createFromOptions(files,{
          baseOptions:{modelAssetPath:MODEL,delegate:'GPU'},
          runningMode:'VIDEO',numHands:2,minHandDetectionConfidence:0.55,
          minHandPresenceConfidence:0.50,minTrackingConfidence:0.50
        });
      }catch(e){
        console.warn('GPU hand tracking unavailable, using CPU',e);
        detector=await HandLandmarker.createFromOptions(files,{
          baseOptions:{modelAssetPath:MODEL,delegate:'CPU'},runningMode:'VIDEO',numHands:2
        });
      }
      if(token!==this.generation){detector.close();return;}
      this.detector=detector;this.emit('tracking','摄像头已连接');
      this.lastVideoTime=-1;this.lastCheck=0;this.loop=this.loop.bind(this);this.raf=requestAnimationFrame(this.loop);
    }catch(e){
      if(token!==this.generation)return;
      const name=e instanceof DOMException?e.name:'';
      const message=name==='NotAllowedError'?'摄像头权限被拒绝，请检查浏览器权限':name==='NotFoundError'?'未找到摄像头':name==='NotReadableError'?'摄像头可能已被占用':'摄像头启动失败：'+String(e);
      this.stop();this.emit('error',message);
    }
  }
  stop():void{
    ++this.generation;cancelAnimationFrame(this.raf);this.raf=0;
    this.detector?.close();this.detector=null;
    this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;
    this.video.pause();this.video.srcObject=null;
    this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    this.lastVideoTime=-1;this.onHands([]);this.emit('off','摄像头已关闭');
  }
  private loop(now:number):void{
    if(this.state!=='tracking'||!this.detector)return;
    if(this.video.readyState>=HTMLMediaElement.HAVE_CURRENT_DATA&&this.video.currentTime!==this.lastVideoTime&&now-this.lastCheck>46){
      this.lastVideoTime=this.video.currentTime;this.lastCheck=now;
      try {
        const result=this.detector.detectForVideo(this.video,now);
        this.draw(result);this.onHands(result.landmarks as Hand[]);
      }catch(e){
        console.error('Tracking frame failed',e);this.stop();this.emit('error','手势检测中断，请重新启动摄像头');return;
      }
    }
    this.raf=requestAnimationFrame(this.loop);
  }
  private draw(result:HandLandmarkerResult):void {
    const ctx=this.ctx,w=this.canvas.width,h=this.canvas.height;
    ctx.clearRect(0,0,w,h);ctx.lineWidth=2.8;ctx.strokeStyle='#5be5ff';
    for(const hand of result.landmarks){
      ctx.beginPath();
      for(const [a,b] of BONES){ctx.moveTo(hand[a].x*w,hand[a].y*h);ctx.lineTo(hand[b].x*w,hand[b].y*h);}
      ctx.stroke();
      hand.forEach((p,i)=>{ctx.beginPath();ctx.arc(p.x*w,p.y*h,(i===4||i===8)?5:3,0,Math.PI*2);ctx.fillStyle=(i===4||i===8)?'#ffcf7b':'#83fff2';ctx.fill();});
    }
  }
}
