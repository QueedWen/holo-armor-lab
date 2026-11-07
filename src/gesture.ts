/** Camera-independent hand gesture state machine. */
export type Landmark = { x: number; y: number; z?: number };
export type Hand = Landmark[];
export type Mode = 'IDLE' | 'PINCH_ROTATE' | 'TWO_HAND_ZOOM';
export type GestureResult = { mode: Mode; hands: number; rotateX: number; rotateY: number; scaleFactor: number; pinchRatio: number | null };
const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x-b.x, a.y-b.y);
const clamp = (n: number, min: number, max: number) => Math.max(min,Math.min(max,n));
function palm(h: Hand): Landmark {
  return { x:(h[0].x+h[5].x+h[9].x+h[17].x)/4, y:(h[0].y+h[5].y+h[9].y+h[17].y)/4 };
}
export class GestureEngine {
  private mode: Mode = 'IDLE';
  private previous: Landmark | null = null;
  private previousDistance = 0;
  private velocityX = 0;
  private velocityY = 0;
  reset(): void { this.mode='IDLE'; this.previous=null; this.previousDistance=0; this.velocityX=0; this.velocityY=0; }
  process(input: Hand[]): GestureResult {
    const hands = input.filter(h=>h.length>=21 && h.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.y))).slice(0,2);
    const output: GestureResult={mode:'IDLE',hands:hands.length,rotateX:0,rotateY:0,scaleFactor:1,pinchRatio:null};
    if(hands.length===2){
      const d=dist(palm(hands[0]),palm(hands[1]));
      if(this.mode==='TWO_HAND_ZOOM' && this.previousDistance>0.04){
        const change=(d-this.previousDistance)/this.previousDistance;
        if(Math.abs(change)>0.008) output.scaleFactor=clamp(1+change*1.1,0.90,1.10);
      }
      this.previousDistance=d; this.previous=null;
      this.velocityX=0;this.velocityY=0;
      this.mode=output.mode='TWO_HAND_ZOOM';return output;
    }
    if(this.mode==='TWO_HAND_ZOOM'){this.reset();return output;}
    if(hands.length===0){this.reset();return output;}
    const h=hands[0];
    const width=Math.max(dist(h[5],h[17]),0.001);
    const ratio=dist(h[4],h[8])/width;
    output.pinchRatio=ratio;
    const active=this.mode==='PINCH_ROTATE';
    if((!active&&ratio>=0.38)||(active&&ratio>0.52)){this.reset();output.pinchRatio=ratio;return output;}
    const point={x:1-(h[4].x+h[8].x)/2,y:(h[4].y+h[8].y)/2};
    if(active&&this.previous){
      const dx=point.x-this.previous.x,dy=point.y-this.previous.y;
      if(Math.abs(dx)<0.25&&Math.abs(dy)<0.25){
        this.velocityX=this.velocityX*0.68+dx*0.32;
        this.velocityY=this.velocityY*0.68+dy*0.32;
        output.rotateY=clamp(this.velocityX*4.5,-0.12,0.12);
        output.rotateX=clamp(this.velocityY*4.5,-0.12,0.12);
      }
    }
    this.previous=point;this.mode=output.mode='PINCH_ROTATE';
    return output;
  }
}
