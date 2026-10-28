(function(){
 const viewport=document.getElementById('research-carousel');
 if(!viewport)return;
 const carousel=viewport.closest('.research-carousel')||viewport;
 const cards=[...viewport.querySelectorAll('.interest-card')];
 const total=cards.length;
 if(!total)return;
 const prev=document.getElementById('carousel-prev');
 const next=document.getElementById('carousel-next');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let active=0,timer,visible=false,hovered=false,focused=false;
 viewport.classList.add('is-3d-carousel');
 const modulo=n=>(n%total+total)%total;

 function measure(){
   cards.forEach(card=>{card.style.height='auto'});
   const height=Math.max(...cards.map(card=>Math.ceil(card.scrollHeight)));
   viewport.style.height=height+'px';
   cards.forEach(card=>{card.style.height=height+'px'});
   positionCards();
 }
 function positionCards(){
   const width=cards[active].getBoundingClientRect().width||viewport.clientWidth*.18;
   cards.forEach((card,i)=>{
     let distance=i-active;
     const alternate=distance>0?distance-total:distance+total;
     if(Math.abs(alternate)<Math.abs(distance))distance=alternate;
     const neighbor=Math.abs(distance)===1;
     const shown=Math.abs(distance)<=2;
     card.classList.toggle('is-active',distance===0);
     card.classList.toggle('is-neighbor',neighbor);
     card.classList.toggle('is-distant',!shown);
     card.style.zIndex=String(distance===0?2:neighbor?1:0);
     const x=distance*viewport.clientWidth*.19;
     const angle=distance===0?0:(distance<0?14:-14);
     const transform=distance===0
       ?'translateX(-50%)'
       :`translateX(-50%) translate3d(${x}px,${neighbor?5:10}px,${neighbor?-45:-100}px) rotateY(${angle}deg) scale(${neighbor ? .94 : .88})`;
     card.style.transform=reduced.matches&&distance!==0
       ?`translateX(-50%) translateX(${x}px) scale(.92)`
       :transform;
     card.setAttribute('aria-hidden',String(distance!==0));
     card.inert=distance!==0;
   });
 }
 function render(){
   positionCards();
   carousel.classList.add('is-ready');
 }
 function busy(){return !visible||document.hidden||hovered||focused||reduced.matches}
 function schedule(){
   clearTimeout(timer);
   timer=null;
   if(busy()||total<2)return;
   timer=setTimeout(()=>show(active+1),3000);
 }
 function show(index){
   active=modulo(index);
   render();
   schedule();
 }
 prev.addEventListener('click',()=>show(active-1));
 next.addEventListener('click',()=>show(active+1));
 carousel.addEventListener('mouseenter',()=>{hovered=true;schedule()});
 carousel.addEventListener('mouseleave',()=>{hovered=false;schedule()});
 carousel.addEventListener('focusin',()=>{focused=true;schedule()});
 carousel.addEventListener('focusout',()=>{
   requestAnimationFrame(()=>{focused=carousel.contains(document.activeElement);schedule()});
 });
 carousel.addEventListener('keydown',event=>{
   if(event.target.matches('input,textarea,select'))return;
   if(event.key==='ArrowRight'){event.preventDefault();show(active+1)}
   if(event.key==='ArrowLeft'){event.preventDefault();show(active-1)}
 });
 carousel.addEventListener('wheel',event=>{
   if(Math.abs(event.deltaX)<15||Math.abs(event.deltaX)<Math.abs(event.deltaY))return;
   show(active+(event.deltaX>0?1:-1));
 },{passive:true});
 document.addEventListener('visibilitychange',schedule);
 reduced.addEventListener?.('change',()=>{positionCards();schedule()});
 window.addEventListener('resize',()=>requestAnimationFrame(measure));
 cards.forEach(card=>card.querySelector('img')?.addEventListener('load',measure,{once:true}));
 if('IntersectionObserver' in window){
   new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule()},{threshold:.15}).observe(viewport);
 }else visible=true;
 measure();
 render();
 schedule();
})();
