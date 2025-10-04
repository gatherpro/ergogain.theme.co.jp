// ErgoList Grid
class EgGrid{
constructor(el){
this.el=el;
this.filters=el.querySelectorAll("[data-filter]");
this.sort=el.querySelector("[data-sort]");
this.products=el.querySelector("[data-products]");
this.init();
}
init(){
this.filters.forEach(f=>f.addEventListener("change",()=>this.filter()));
if(this.sort)this.sort.addEventListener("change",()=>this.sortProducts());
}
filter(){
const cards=this.products.querySelectorAll("[data-product]");
const vals={};
this.filters.forEach(f=>{
const k=f.dataset.filter;
vals[k]=f.value;
});
cards.forEach(c=>{
let show=true;
Object.keys(vals).forEach(k=>{
if(vals[k]&&\!c.dataset[k]?.includes(vals[k]))show=false;
});
c.style.display=show?"block":"none";
});
}
sortProducts(){
const v=this.sort.value;
const cards=Array.from(this.products.querySelectorAll("[data-product]"));
cards.sort((a,b)=>{
if(v==="price-asc")return this.getPrice(a)-this.getPrice(b);
if(v==="price-desc")return this.getPrice(b)-this.getPrice(a);
return 0;
});
cards.forEach(c=>this.products.appendChild(c));
}
getPrice(card){
const txt=card.querySelector(".eg-grid__card-price-current")?.textContent||"0";
return parseFloat(txt.replace(/[^0-9]/g,""))||0;
}
}
document.addEventListener("DOMContentLoaded",()=>{
document.querySelectorAll("[data-eg-grid]").forEach(el=>new EgGrid(el));
});
