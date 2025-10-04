// Featured Slider v2
class FsV2{
constructor(el){
this.el=el;
this.rail=el.querySelector("[data-rail]");
this.prev=el.querySelector("[data-prev]");
this.next=el.querySelector("[data-next]");
this.init();
}
init(){
this.prev.onclick=()=>this.scroll(-1);
this.next.onclick=()=>this.scroll(1);
this.updateNav();
this.rail.addEventListener("scroll",()=>this.updateNav());
}
scroll(dir){
const w=this.rail.offsetWidth;
this.rail.scrollBy({left:dir*w*0.8,behavior:"smooth"});
}
updateNav(){
const sl=this.rail.scrollLeft;
const sw=this.rail.scrollWidth;
const cw=this.rail.clientWidth;
this.prev.disabled=sl<=0;
this.next.disabled=sl+cw>=sw-1;
}
}
document.addEventListener("DOMContentLoaded",()=>{
document.querySelectorAll("[data-fs-v2]").forEach(el=>new FsV2(el));
});
