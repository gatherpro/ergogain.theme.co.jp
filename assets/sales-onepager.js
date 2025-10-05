/* Sales Onepager JS - 計測モーダル、バリデーション、ライブ計算、dataLayerイベント */
class SalesOnepager{
constructor(){
this.modal=null;
this.calculator=null;
this.stickyCTA=null;
this.basePrice=50000;
this.configData={};
this.init();
}
init(){
this.setupModal();
this.setupCalculator();
this.setupStickyCTA();
this.setupTooltips();
this.setupCounters();
this.setupPictureOptimization();
this.setupWireframeMode();
this.setupDataLayer();
}
setupModal(){
const triggers=document.querySelectorAll('[data-spo-config-trigger]');
const modalEl=document.querySelector('[data-spo-modal]');
if(!modalEl)return;
this.modal=modalEl;
const close=this.modal.querySelector('[data-spo-modal-close]');
const form=this.modal.querySelector('[data-spo-config-form]');
triggers.forEach(t=>{
t.addEventListener('click',()=>{
this.openModal();
this.trackEvent('config_open',{source:t.dataset.spoConfigTrigger});
});
});
if(close){
close.addEventListener('click',()=>this.closeModal());
}
this.modal.addEventListener('click',(e)=>{
if(e.target===this.modal)this.closeModal();
});
if(form){
form.addEventListener('submit',(e)=>{
e.preventDefault();
if(this.validateForm(form)){
this.saveConfig(form);
this.closeModal();
this.showProposal();
this.trackEvent('size_input_complete',this.configData);
}
});
}
}
openModal(){
this.modal.classList.add('is-open');
this.modal.setAttribute('aria-hidden','false');
document.body.style.overflow='hidden';
const firstInput=this.modal.querySelector('input');
if(firstInput)firstInput.focus();
}
closeModal(){
this.modal.classList.remove('is-open');
this.modal.setAttribute('aria-hidden','true');
document.body.style.overflow='';
}
validateForm(form){
const inputs=form.querySelectorAll('input[required]');
let valid=true;
inputs.forEach(input=>{
const val=parseFloat(input.value);
const min=parseFloat(input.min)||0;
const max=parseFloat(input.max)||999;
if(!val||val<min||val>max){
valid=false;
input.classList.add('error');
input.setAttribute('aria-invalid','true');
}else{
input.classList.remove('error');
input.setAttribute('aria-invalid','false');
}
});
return valid;
}
saveConfig(form){
const data=new FormData(form);
this.configData={
hand_width:data.get('hand_width'),
hand_length:data.get('hand_length'),
finger_length:data.get('finger_length'),
usage_hours:data.get('usage_hours')
};
}
showProposal(){
const proposal=document.querySelector('[data-spo-proposal]');
if(!proposal)return;
proposal.classList.add('is-visible');
proposal.scrollIntoView({behavior:'smooth',block:'start'});
this.trackEvent('proposal_view',this.configData);
this.updateRecommendation();
}
updateRecommendation(){
const rec=document.querySelector('[data-spo-recommendation]');
if(!rec)return;
const hw=parseFloat(this.configData.hand_width)||0;
let size='M';
if(hw<80)size='S';
else if(hw>95)size='L';
rec.textContent=`推奨サイズ: ${size}`;
}
setupCalculator(){
const selects=document.querySelectorAll('[data-price-delta]');
const total=document.querySelector('[data-spo-total]');
if(!total)return;
this.calculator={selects,total};
selects.forEach(s=>{
s.addEventListener('change',()=>this.updatePrice());
});
this.updatePrice();
}
updatePrice(){
if(!this.calculator)return;
let price=this.basePrice;
this.calculator.selects.forEach(s=>{
const delta=parseFloat(s.options[s.selectedIndex]?.dataset.priceDelta)||0;
price+=delta;
});
this.calculator.total.textContent=price.toLocaleString('ja-JP');
}
setupStickyCTA(){
const cta=document.querySelector('[data-spo-sticky-cta]');
if(!cta)return;
this.stickyCTA=cta;
const trigger=document.querySelector('[data-spo-sticky-trigger]');
if(!trigger)return;
const obs=new IntersectionObserver((entries)=>{
entries.forEach(e=>{
if(!e.isIntersecting){
this.stickyCTA.classList.add('is-visible');
}else{
this.stickyCTA.classList.remove('is-visible');
}
});
},{threshold:0});
obs.observe(trigger);
}
setupTooltips(){
const tips=document.querySelectorAll('[data-tooltip]');
const tipEl=document.createElement('div');
tipEl.className='spo-tooltip';
tipEl.setAttribute('role','tooltip');
tipEl.setAttribute('aria-hidden','true');
document.body.appendChild(tipEl);
tips.forEach(t=>{
t.addEventListener('mouseenter',(e)=>{
tipEl.textContent=t.dataset.tooltip;
tipEl.classList.add('is-visible');
tipEl.setAttribute('aria-hidden','false');
this.positionTooltip(e.target,tipEl);
});
t.addEventListener('mouseleave',()=>{
tipEl.classList.remove('is-visible');
tipEl.setAttribute('aria-hidden','true');
});
});
}
positionTooltip(el,tip){
const rect=el.getBoundingClientRect();
const tipRect=tip.getBoundingClientRect();
let top=rect.bottom+8;
let left=rect.left+rect.width/2-tipRect.width/2;
if(left+tipRect.width>window.innerWidth-16)left=window.innerWidth-tipRect.width-16;
if(left<16)left=16;
if(top+tipRect.height>window.innerHeight-16)top=rect.top-tipRect.height-8;
tip.style.top=top+'px';
tip.style.left=left+'px';
}
setupCounters(){
const counters=document.querySelectorAll('[data-counter]');
const obs=new IntersectionObserver((entries)=>{
entries.forEach(e=>{
if(e.isIntersecting){
this.animateCounter(e.target);
obs.unobserve(e.target);
}
});
},{threshold:0.5});
counters.forEach(c=>obs.observe(c));
}
animateCounter(el){
const target=parseFloat(el.dataset.counter)||0;
const duration=1500;
const start=performance.now();
const animate=(now)=>{
const elapsed=now-start;
const progress=Math.min(elapsed/duration,1);
const current=Math.floor(target*progress);
el.textContent=current.toLocaleString('ja-JP');
if(progress<1)requestAnimationFrame(animate);
};
requestAnimationFrame(animate);
}
setupPictureOptimization(){
const pictures=document.querySelectorAll('picture');
pictures.forEach(p=>{
const img=p.querySelector('img');
if(!img)return;
const isAboveFold=p.getBoundingClientRect().top<window.innerHeight;
if(isAboveFold){
img.setAttribute('fetchpriority','high');
img.setAttribute('loading','eager');
}else{
img.setAttribute('loading','lazy');
}
});
}
setupWireframeMode(){
const params=new URLSearchParams(window.location.search);
if(params.get('wireframe')==='1'){
document.documentElement.classList.add('wireframe-mode');
}
}
setupDataLayer(){
window.dataLayer=window.dataLayer||[];
const addToCartBtns=document.querySelectorAll('[data-spo-add-to-cart]');
addToCartBtns.forEach(btn=>{
btn.addEventListener('click',()=>{
this.trackEvent('add_to_cart',{
product_id:btn.dataset.productId,
variant_id:btn.dataset.variantId,
price:this.calculator?.total?.textContent||'0'
});
});
});
}
trackEvent(event,data={}){
if(!window.dataLayer)return;
window.dataLayer.push({
event:event,
...data,
timestamp:new Date().toISOString()
});
console.log('📊 Event:',event,data);
}
trackPurchase(orderData){
this.trackEvent('purchase',{
transaction_id:orderData.id,
value:orderData.total,
currency:'JPY',
items:orderData.items
});
}
trackPostFitCheck(passed){
this.trackEvent('post_fit_check_pass',{
passed:passed,
config:this.configData
});
}
}
if(document.readyState==='loading'){
document.addEventListener('DOMContentLoaded',()=>new SalesOnepager());
}else{
new SalesOnepager();
}
