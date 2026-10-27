/* Shared 3D orbit carousel: separate, accessible perspective cards. */
(()=>{
 'use strict';
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 document.querySelectorAll('.orbit-carousel').forEach(root=>{
   const stage=root.querySelector('.orbit-stage'), stack=root.querySelector('.orbit-stack');
   const cards=[...stack.querySelectorAll('.orbit-slide')];
   const tabs=[...root.querySelectorAll('[data-orbit-tab]')];
   const prev=root.querySelector('[data-orbit-prev]'),next=root.querySelector('[data-orbit-next]');
   const counter=root.querySelector('[data-orbit-counter]');
   const wrap=root.dataset.orbitWrap==='true';
   const autoplayMs=Math.max(0,Number(root.dataset.orbitAutoplayMs)||0);
   if(!cards.length||!stage)return;
   let active=Math.max(0,cards.findIndex(c=>location.hash==='#'+c.id));
   let dragX=null,dragY=0,isDragging=false;
   let autoTimer=null,autoVisible=false,autoHovered=false,autoFocused=false;
   const modulo=n=>(n+cards.length)%cards.length;
   function delta(i){const d=i-active;if(!wrap)return d;const other=d>0?d-cards.length:d+cards.length;return Math.abs(other)<Math.abs(d)?other:d;}
   function measure(){
     if(!stage.clientWidth)return;
     const w=cards[active].getBoundingClientRect().width||stage.clientWidth*.77;
     // Measure natural heights. Desktop keeps all cards the same height; narrow screens fit the active panel.
     for(const c of cards)c.style.height='auto';
     const heights=cards.map(c=>Math.ceil(c.scrollHeight));
     const h=window.innerWidth<680?heights[active]:Math.max(...heights);
     const chosen=Math.max(h,window.innerWidth<680?315:365);
     stage.style.setProperty('--orbit-slide-height',chosen+'px');
     stage.style.height=(chosen+(window.innerWidth<680?26:50))+'px';
     cards.forEach(c=>c.style.height=chosen+'px');
     position(w);
   }
   function position(width){
     const cw=width||cards[active].getBoundingClientRect().width||stage.clientWidth*.77;
     cards.forEach((card,i)=>{
       const d=delta(i),neighbor=Math.abs(d)===1,visible=Math.abs(d)<=1;
       card.classList.toggle('orbit-active',d===0);
       card.classList.toggle('orbit-neighbor',neighbor);
       card.classList.toggle('orbit-distant',!visible);
       card.style.zIndex=String(d===0?10:neighbor?5:1);
       const x=d*cw*(window.innerWidth<600?.63:.68);
       const depth=d===0?0:-190;
       const angle=d===0?0:(d<0?25:-25);
       const scale=d===0?1:.84;
       // Reduced-motion users get static 2D cards, not the spatial spin.
       const still = `translateX(-50%) translateX(${x}px) scale(${d===0?1:.92})`;
       const spatial = `translateX(-50%) translate3d(${x}px,${Math.abs(d)*11}px,${depth}px) rotateY(${angle}deg) scale(${scale})`;
       card.style.transform=d===0 ? 'translateX(-50%)' : reduced.matches ? still : spatial;
       card.setAttribute('aria-hidden',String(d!==0));
       card.inert=d!==0;
     });
   }
   function render(){
     tabs.forEach((tab,i)=>tab.setAttribute('aria-pressed',String(i===active)));
     if(prev)prev.disabled=!wrap&&active===0;
     if(next)next.disabled=!wrap&&active===cards.length-1;
     if(counter)counter.textContent=String(active+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
     // Move cards before measuring so an active card is not hidden during transitions.
     root.classList.add('orbit-ready');
     measure();
   }
   function autoBusy(){
     return !autoVisible || document.hidden || reduced.matches || autoHovered || autoFocused || isDragging;
   }
   function scheduleAuto(){
     clearTimeout(autoTimer);autoTimer=null;
     if(!autoplayMs || cards.length<2 || autoBusy())return;
     autoTimer=setTimeout(()=>{
       autoTimer=null;
       if(autoBusy()){scheduleAuto();return;}
       // Non-wrapping PAiNe still cycles back to the opening panel after the last card.
       show(active===cards.length-1?0:active+1);
     },autoplayMs);
   }
   function show(i){
     active=wrap?modulo(i):Math.min(cards.length-1,Math.max(0,i));
     render();
     scheduleAuto();
   }
   tabs.forEach((t,i)=>t.addEventListener('click',()=>show(i)));
   prev?.addEventListener('click',()=>show(active-1));
   next?.addEventListener('click',()=>show(active+1));
   stage.addEventListener('pointerdown',e=>{
     if(e.target.closest('a,button,input,select,textarea'))return;
     dragX=e.clientX;dragY=e.clientY;isDragging=true;
   });
   stage.addEventListener('pointerup',e=>{
     if(!isDragging||dragX===null)return;
     const dx=e.clientX-dragX,dy=e.clientY-dragY;
     isDragging=false;dragX=null;
     if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.15)show(active+(dx<0?1:-1));
   });
   stage.addEventListener('pointercancel',()=>{isDragging=false;dragX=null});
   let lastWheel=0;
   stage.addEventListener('wheel',e=>{
     if(Math.abs(e.deltaX)<15||Math.abs(e.deltaX)<Math.abs(e.deltaY))return;
     const now=Date.now();if(now-lastWheel<500)return;
     lastWheel=now;show(active+(e.deltaX>0?1:-1));
   },{passive:true});
   root.addEventListener('keydown',e=>{
     if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
     if(e.key==='ArrowRight'){e.preventDefault();show(active+1)}
     if(e.key==='ArrowLeft'){e.preventDefault();show(active-1)}
   });
   // Anchor deep-links, including section links from the upper PAiNe subnav.
   for(const card of cards){
     if(!card.id)continue;
     document.querySelectorAll(`a[href="#${card.id}"]`).forEach(a=>a.addEventListener('click',e=>{
       e.preventDefault();show(cards.indexOf(card));
       root.scrollIntoView({block:'start',behavior:reduced.matches?'auto':'smooth'});
       history.replaceState(null,'','#'+card.id);
     }));
   }
   // Autoplay is independently configured for each page. Pause on hover/focus,
   // outside the viewport, with reduced-motion preference, or in a background tab.
   if(autoplayMs){
     root.addEventListener('mouseenter',()=>{autoHovered=true;scheduleAuto();});
     root.addEventListener('mouseleave',()=>{autoHovered=false;scheduleAuto();});
     root.addEventListener('focusin',()=>{autoFocused=true;scheduleAuto();});
     root.addEventListener('focusout',()=>{requestAnimationFrame(()=>{autoFocused=root.contains(document.activeElement);scheduleAuto();});});
     document.addEventListener('visibilitychange',scheduleAuto);
     if(reduced.addEventListener)reduced.addEventListener('change',scheduleAuto);
     if('IntersectionObserver' in window){
       new IntersectionObserver(entries=>{autoVisible=entries[0].isIntersecting;scheduleAuto();},
         {threshold:.18}).observe(root);
     } else {autoVisible=true;}
   }
   window.addEventListener('resize',()=>requestAnimationFrame(measure));
   if(reduced.addEventListener)reduced.addEventListener('change',()=>requestAnimationFrame(measure));
   document.fonts?.ready?.then(measure);
   root.querySelectorAll('img').forEach(img=>img.addEventListener('load',measure,{once:true}));
   render();
   scheduleAuto();
 });
})();
