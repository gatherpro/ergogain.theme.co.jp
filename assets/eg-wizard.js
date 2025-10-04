// ErgoGain Wizard - Simplified
class EgWizard{
constructor(el){
this.el=el;
this.step=1;
this.total=6;
this.type=el.dataset.wizardType;
this.base=parseFloat(el.dataset.basePrice)||50000;
this.currency=el.dataset.currency||"¥";
this.pid=el.dataset.productId;
this.photo=null;
this.init();
}
init(){
this.el.querySelector("[data-prev]").onclick=()=>this.prev();
this.el.querySelector("[data-next]").onclick=()=>this.next();
this.el.querySelector("[data-add-to-cart]").onclick=()=>this.add();
if(this.type==="full")this.initPhoto();
this.updateNav();
}
initPhoto(){
const input=this.el.querySelector("[data-hand-photo-input]");
const preview=this.el.querySelector("[data-upload-preview]");
const img=this.el.querySelector("[data-preview-img]");
input.onchange=(e)=>{
const f=e.target.files[0];
if(\!f)return;
this.photo=f;
const r=new FileReader();
r.onload=(e)=>{
img.src=e.target.result;
preview.hidden=false;
this.updateNav();
};
r.readAsDataURL(f);
};
}
prev(){if(this.step>1){this.step--;this.updateNav();this.updateRail();}}
next(){if(this.validate()){this.step++;this.updateNav();this.updateRail();if(this.step===this.total)this.summary();}}
validate(){
if(this.step===1&&this.type==="full"&&\!this.photo){alert("手の写真をアップロードしてください");return false;}
return true;
}
updateRail(){
const off=-(this.step-1)*100;
this.el.querySelector("[data-rail]").style.transform="translateX("+off+"%)";
this.el.querySelector("[data-step-current]").textContent=this.step;
}
updateNav(){
const prev=this.el.querySelector("[data-prev]");
const next=this.el.querySelector("[data-next]");
const cart=this.el.querySelector("[data-add-to-cart]");
prev.disabled=this.step===1;
next.disabled=\!this.validate();
if(this.step===this.total){next.hidden=true;cart.hidden=false;}else{next.hidden=false;cart.hidden=true;}
}
summary(){
const s=this.el.querySelector("[data-summary]");
if(\!s)return;
s.innerHTML="<p>選択内容を確認してください</p>";
}
async add(){
const props={};
if(this.photo)props.hand_photo=this.photo.name;
try{
const res=await fetch("/cart/add.js",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({id:this.pid,quantity:1,properties:props})});
if(res.ok)alert("カートに追加しました");
}catch(e){alert("エラー:"+e.message);}
}
}
document.addEventListener("DOMContentLoaded",()=>{
document.querySelectorAll("[data-eg-wizard]").forEach(el=>new EgWizard(el));
});
