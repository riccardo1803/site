(function(){
 const viewport=document.getElementById('research-carousel');
 if(!viewport)return;
 const track=viewport.querySelector('.carousel-track');
 const originals=[...track.querySelectorAll('.interest-card')];
 const total=originals.length;
 if(!total)return;
 for(const card of originals){const clone=card.cloneNode(true);clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;clone.querySelectorAll('a,button,input,[tabindex]').forEach(x=>x.tabIndex=-1);track.appendChild(clone)}
 const items=[...track.querySelectorAll('.interest-card')];
 const scrubber=document.getElementById('carousel-scrubber');
 const label=document.getElementById('carousel-count');
 const prev=document.getElementById('carousel-prev');
 const next=document.getElementById('carousel-next');
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
 let position=0, timer, scrollTimer, loopTimer, visible=false, focused=false, dragging=false, moving=false;
 const interval=4000;
 const leftAt=(i)=>items[i].offsetLeft-items[0].offsetLeft;
 function leftFraction(value){const a=Math.floor(value),b=Math.min(total,a+1),t=value-a;return leftAt(a)*(1-t)+leftAt(b)*t}
 function display(value){const v=Math.max(0,Math.min(total-1,value));scrubber.value=String(v);scrubber.style.setProperty('--fill',String(v/(total-1)*100)+'%');label.textContent=String(Math.round(v)+1).padStart(2,'0')+' / '+String(total).padStart(2,'0')}
 function moveTo(n,smooth=true){
   clearTimeout(loopTimer);moving=true;position=n;
   viewport.scrollTo({left:leftAt(n),behavior:smooth&&!reduced.matches?'smooth':'instant'});
   display(n>=total?0:n);
   setTimeout(()=>{moving=false},smooth?790:100);
   if(n===total){loopTimer=setTimeout(()=>{position=0;viewport.scrollTo({left:0,behavior:'instant'});display(0);moving=false},930)}
 }
 function busy(){return !visible||document.hidden||focused||dragging}
 function schedule(){clearInterval(timer);timer=null;if(busy())return;timer=setInterval(()=>{if(busy()){schedule();return}moveTo(position===total-1?total:position+1,true)},interval)}
 // Autoplay runs every four seconds while visible, including with the cursor hovering.
 // Reduced-motion users get an instant step instead of a sliding animation.
 // Restart the normal four-second clock after an interaction, without stacking an extra pause.
 function manual(){schedule()}
 prev.addEventListener('click',()=>{manual();moveTo(position===0?total-1:position-1,true)});
 next.addEventListener('click',()=>{manual();moveTo(position>=total-1?total:position+1,true)});
 scrubber.addEventListener('pointerdown',()=>{dragging=true;viewport.classList.add('is-scrubbing');manual()});
 scrubber.addEventListener('input',()=>{dragging=true;viewport.classList.add('is-scrubbing');manual();const val=Number(scrubber.value);viewport.scrollTo({left:leftFraction(val),behavior:'instant'});display(val)});
 function settle(){if(!dragging)return;dragging=false;viewport.classList.remove('is-scrubbing');const n=Math.round(Number(scrubber.value));moveTo(n,true);manual();}
 scrubber.addEventListener('change',settle);scrubber.addEventListener('pointerup',settle);scrubber.addEventListener('pointercancel',settle);scrubber.addEventListener('keyup',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key))settle()});
 viewport.addEventListener('focusin',()=>{focused=true;schedule()});
 viewport.addEventListener('focusout',()=>{setTimeout(()=>{focused=viewport.contains(document.activeElement);schedule()},0)});
 viewport.addEventListener('pointerdown',()=>manual(),{passive:true});
 viewport.addEventListener('wheel',e=>{if(Math.abs(e.deltaX)>1)manual()},{passive:true});
 viewport.addEventListener('scroll',()=>{
   clearTimeout(scrollTimer);scrollTimer=setTimeout(()=>{
      if(moving||dragging)return;
      let closest=0,distance=Infinity;
      for(let i=0;i<items.length;i++){let d=Math.abs(viewport.scrollLeft-leftAt(i));if(d<distance){distance=d;closest=i}}
      if(closest>=total){position=closest-total;viewport.scrollTo({left:leftAt(position),behavior:'instant'})}else position=closest;
      display(position);manual();
   },150)
 },{passive:true});
 reduced.addEventListener?.('change',schedule);
 document.addEventListener('visibilitychange',schedule);
 if('IntersectionObserver' in window){new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule()},{threshold:.15}).observe(viewport)}else{visible=true;schedule()}
 display(0);
})();