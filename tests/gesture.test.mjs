import test from 'node:test';
import assert from 'node:assert/strict';
import { GestureEngine } from '../.test-build/gesture.js';
function hand(x=0.5,y=0.5,pinch=false) {
  const arr=Array.from({length:21},()=>({x,y}));
  arr[0]={x,y};arr[5]={x:x-0.1,y};arr[9]={x,y:y-0.1};arr[17]={x:x+0.1,y};
  arr[4]={x:x-0.03,y:y-0.05};
  arr[8]={x:x+(pinch?0.01:0.16),y:y-0.05};
  return arr;
}
test('no hands: idle and neutral outputs',()=>{
  const result=new GestureEngine().process([]);
  assert.equal(result.mode,'IDLE');assert.equal(result.scaleFactor,1);
});
test('pinch acquires and drag rotates',()=>{
  const gesture=new GestureEngine();
  assert.equal(gesture.process([hand(0.4,0.5,true)]).mode,'PINCH_ROTATE');
  const next=gesture.process([hand(0.5,0.5,true)]);
  assert.equal(next.mode,'PINCH_ROTATE');
  assert.ok(Math.abs(next.rotateY)>0);
});
test('open hand releases pinch lock',()=>{
  const g=new GestureEngine();g.process([hand(0.5,0.5,true)]);
  assert.equal(g.process([hand(0.5,0.5,false)]).mode,'IDLE');
});
test('two hands control zoom direction',()=>{
  const g=new GestureEngine();
  assert.equal(g.process([hand(0.25),hand(0.75)]).mode,'TWO_HAND_ZOOM');
  assert.ok(g.process([hand(0.16),hand(0.84)]).scaleFactor>1);
  assert.ok(g.process([hand(0.28),hand(0.72)]).scaleFactor<1);
});
test('bad tracking data is ignored',()=>{
  const g=new GestureEngine();
  assert.equal(g.process([[{x:NaN,y:0}]]).mode,'IDLE');
});
