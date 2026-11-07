import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from 'gsap';

type Part = { group:THREE.Group; home:THREE.Vector3; offset:THREE.Vector3 };
const dark = new THREE.MeshStandardMaterial({color:0x0b2035,metalness:0.78,roughness:0.3});
const blue = new THREE.MeshStandardMaterial({color:0x1b5276,metalness:0.8,roughness:0.3});
const light = new THREE.MeshStandardMaterial({color:0x398dad,metalness:0.64,roughness:0.27});
const luminous = new THREE.MeshBasicMaterial({color:0x64edff,toneMapped:false});
export class ArmorScene {
  private scene=new THREE.Scene();
  private renderer:THREE.WebGLRenderer;
  private camera:THREE.PerspectiveCamera;
  private controls:OrbitControls;
  private robot=new THREE.Group();
  private parts:Part[]=[];
  private lines:THREE.LineSegments[]=[];
  private rings:THREE.Mesh[]=[];
  private wire=true;private exploded=false;private scale=1;
  private frame=0;private last=performance.now();private counter=0;private fps=0;
  private resizeObserver:ResizeObserver;
  private disposed=false;
  constructor(host:HTMLElement,private onStats:(s:{x:number;y:number;scale:number;fps:number;exploded:boolean})=>void){
    this.renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    this.renderer.setPixelRatio(Math.min(2,devicePixelRatio||1));
    this.renderer.outputColorSpace=THREE.SRGBColorSpace;
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.7;
    host.appendChild(this.renderer.domElement);
    this.camera=new THREE.PerspectiveCamera(42,1,0.1,100);
    this.camera.position.set(0,1.0,10.2);
    this.controls=new OrbitControls(this.camera,this.renderer.domElement);
    this.controls.target.set(0,0,0);
    this.controls.enableDamping=true;this.controls.enablePan=false;
    this.controls.minDistance=5;this.controls.maxDistance=16;
    this.scene.add(new THREE.HemisphereLight(0xb7eaff,0x071021,2.5));
    const key=new THREE.DirectionalLight(0x64e2ff,3);key.position.set(4,6,6);this.scene.add(key);
    const rim=new THREE.PointLight(0x117cff,50,20);rim.position.set(-4,2,-3);this.scene.add(rim);
    this.makeArmor();this.makeStage();this.scene.add(this.robot);
    this.resizeObserver=new ResizeObserver(()=>this.resize(host));this.resizeObserver.observe(host);this.resize(host);
    this.loop=this.loop.bind(this);this.frame=requestAnimationFrame(this.loop);
  }
  private part(name:string,x:number,y:number,z:number,ox:number,oy:number,oz:number):THREE.Group {
    const group=new THREE.Group();group.name=name;group.position.set(x,y,z);this.robot.add(group);
    this.parts.push({group,home:group.position.clone(),offset:new THREE.Vector3(ox,oy,oz)});
    return group;
  }
  private add(group:THREE.Group,geometry:THREE.BufferGeometry,material:THREE.Material,x=0,y=0,z=0):THREE.Mesh {
    const object=new THREE.Mesh(geometry,material);object.position.set(x,y,z);group.add(object);
    if(material!==luminous){
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geometry),new THREE.LineBasicMaterial({color:0x38bde2,transparent:true,opacity:0.26}));
      edges.position.copy(object.position);edges.rotation.copy(object.rotation);group.add(edges);this.lines.push(edges);
    }
    return object;
  }
  private box(g:THREE.Group,w:number,h:number,d:number,x=0,y=0,z=0,m:THREE.Material=blue):THREE.Mesh{
    return this.add(g,new THREE.BoxGeometry(w,h,d),m,x,y,z);
  }
  private orb(g:THREE.Group,r:number,x:number,y:number,z:number,m:THREE.Material=dark):THREE.Mesh{
    return this.add(g,new THREE.IcosahedronGeometry(r,1),m,x,y,z);
  }
  private stripe(g:THREE.Group,w:number,x:number,y:number,z:number):void{
    this.box(g,w,0.036,0.025,x,y,z,luminous);
  }
  private makeArmor():void{
    const head=this.part('HEAD',0,2.05,0,0,0.9,0);
    const helm=this.add(head,new THREE.CylinderGeometry(0.36,0.28,0.68,8),blue);
    helm.rotation.y=Math.PI/8;
    this.box(head,0.58,0.16,0.09,0,-0.07,0.32,dark);
    this.stripe(head,0.21,-0.15,0.02,0.368);this.stripe(head,0.21,0.15,0.02,0.368);
    this.box(head,0.28,0.14,0.12,0,-0.26,0.25,light);
    const neck=this.part('NECK',0,1.65,0,0,0.45,-0.18);
    this.add(neck,new THREE.CylinderGeometry(0.17,0.21,0.26,9),dark);
    const chest=this.part('TORSO',0,1.03,0,0,0,0.2);
    this.box(chest,1.52,1.14,0.65,0,0,0,blue);
    this.box(chest,1.30,0.36,0.12,0,0.38,0.39,light);
    this.box(chest,0.92,0.36,0.66,0,-0.7,0,dark);
    this.stripe(chest,0.35,-0.44,-0.26,0.355);this.stripe(chest,0.35,0.44,-0.26,0.355);
    const reactor=new THREE.Group();reactor.position.set(0,0.07,0.36);chest.add(reactor);
    this.add(reactor,new THREE.TorusGeometry(0.27,0.055,10,40),luminous,0,0,0.13);
    this.add(reactor,new THREE.TorusGeometry(0.18,0.022,8,40),luminous,0,0,0.15);
    this.add(reactor,new THREE.CircleGeometry(0.12,32),luminous,0,0,0.17);
    const halo=new THREE.Mesh(new THREE.PlaneGeometry(0.88,0.88),new THREE.MeshBasicMaterial({color:0x2be3ff,transparent:true,opacity:0.13,depthWrite:false}));
    halo.position.z=0.10;reactor.add(halo);this.robot.userData.halo=halo;
    const waist=this.part('WAIST',0,0.23,0,0,-0.15,0);
    this.box(waist,0.95,0.43,0.57,0,0,0,dark);
    for(const s of [-1,1]){
      const shoulder=this.part('SHOULDER',s*0.95,1.48,0,s*0.75,0.35,0);
      const shell=this.orb(shoulder,0.40,s*0.06,0,0,light);shell.scale.set(1.22,0.74,1.0);
      this.stripe(shoulder,0.25,0,-0.04,0.37);
      const upper=this.part('UPPER ARM',s*1.08,0.89,0,s*1.08,0.1,0);
      this.box(upper,0.40,0.68,0.42,0,0,0,blue);this.stripe(upper,0.16,0,0.05,0.24);
      const forearm=this.part('FOREARM',s*1.10,0.16,0,s*1.35,-0.25,0.14);
      this.box(forearm,0.46,0.72,0.47,0,0,0,light);this.stripe(forearm,0.24,0,0.10,0.26);
      const palm=this.part('HAND',s*1.10,-0.43,0,s*1.55,-0.65,0.2);
      this.box(palm,0.31,0.36,0.32,0,0,0,dark);this.add(palm,new THREE.CircleGeometry(0.075,24),luminous,0,-0.04,0.18);
      const thigh=this.part('THIGH',s*0.42,-0.56,0,s*0.5,-0.2,0);
      this.box(thigh,0.54,0.91,0.57,0,0,0,blue);this.box(thigh,0.35,0.48,0.12,0,0,0.35,light);
      const knee=this.part('KNEE',s*0.43,-1.15,0.08,s*0.55,-0.3,0.25);
      this.orb(knee,0.23,0,0,0,dark);this.box(knee,0.37,0.21,0.16,0,0,0.23,light);
      const shin=this.part('SHIN',s*0.44,-1.76,0,s*0.56,-0.65,0.1);
      this.box(shin,0.48,0.83,0.52,0,0,0,blue);this.box(shin,0.32,0.58,0.13,0,0.02,0.33,light);this.stripe(shin,0.22,0,-0.10,0.405);
      const foot=this.part('FOOT',s*0.44,-2.30,0.16,s*0.65,-0.85,0.45);
      this.box(foot,0.56,0.26,0.90,0,0,0.23,dark);this.box(foot,0.44,0.13,0.60,0,0.10,0.33,light);
    }
  }
  private makeStage():void{
    const grid=new THREE.GridHelper(60,54,0x154a70,0x0a354a);grid.position.y=-2.65;this.scene.add(grid);
    this.scene.add(new THREE.Mesh(new THREE.CylinderGeometry(2.1,2.24,0.12,72),dark));
    const disk=this.scene.children[this.scene.children.length-1];disk.position.y=-2.67;
    for(const r of [1.25,1.70,2.02,2.25]){
      const ring=new THREE.Mesh(new THREE.TorusGeometry(r,0.018,8,100),new THREE.MeshBasicMaterial({color:0x41dcff,transparent:true,opacity:r>2?0.35:0.75}));
      ring.rotation.x=Math.PI/2;ring.position.y=-2.58;this.scene.add(ring);this.rings.push(ring);
    }
    const coords:number[]=[];for(let i=0;i<170;i++)coords.push((Math.random()-0.5)*11,(Math.random()-0.5)*8,(Math.random()-0.5)*9);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
    this.scene.add(new THREE.Points(geometry,new THREE.PointsMaterial({color:0x56dfff,size:0.026,transparent:true,opacity:0.55})));
  }
  rotate(x:number,y:number):void{this.robot.rotation.x=THREE.MathUtils.clamp(this.robot.rotation.x+x,-0.8,0.8);this.robot.rotation.y+=y;}
  scaleBy(f:number):void{this.scale=THREE.MathUtils.clamp(this.scale*f,0.58,1.85);}
  setGestureActive(active:boolean):void{this.controls.enabled=!active;}
  toggleExplode():boolean{
    this.exploded=!this.exploded;
    for(const part of this.parts){
      gsap.killTweensOf(part.group.position);
      const target=part.home.clone().add(this.exploded?part.offset:new THREE.Vector3());
      gsap.to(part.group.position,{x:target.x,y:target.y,z:target.z,duration:0.9,ease:'power3.inOut'});
    }
    return this.exploded;
  }
  toggleWireframe():boolean{this.wire=!this.wire;for(const line of this.lines)line.visible=this.wire;return this.wire;}
  reset():void{
    if(this.exploded)this.toggleExplode();
    gsap.to(this.robot.rotation,{x:0,y:0,z:0,duration:0.5});this.scale=1;this.controls.reset();
  }
  private resize(host:HTMLElement):void{
    const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
    this.renderer.setSize(w,h,false);this.camera.aspect=w/h;this.camera.updateProjectionMatrix();
  }
  private loop(time:number):void{
    if(this.disposed)return;
    const dt=Math.min(100,time-this.last);this.last=time;this.counter++;
    if(this.counter>=30){this.fps=Math.round(1000/dt);this.counter=0;this.onStats({x:this.robot.rotation.x,y:this.robot.rotation.y,scale:this.scale,fps:this.fps,exploded:this.exploded});}
    this.robot.position.y=Math.sin(time*0.0013)*0.04;
    this.robot.scale.setScalar(THREE.MathUtils.lerp(this.robot.scale.x,this.scale,0.12));
    this.rings.forEach((r,i)=>r.rotation.z+=i%2?0.0004:-0.00025);
    const halo=this.robot.userData.halo as THREE.Mesh;
    (halo.material as THREE.MeshBasicMaterial).opacity=0.09+0.05*Math.sin(time*0.003);
    this.controls.update();this.renderer.render(this.scene,this.camera);
    this.frame=requestAnimationFrame(this.loop);
  }
  dispose():void{
    this.disposed=true;cancelAnimationFrame(this.frame);this.resizeObserver.disconnect();this.controls.dispose();
    this.scene.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();});
    this.renderer.dispose();this.renderer.domElement.remove();
  }
}
