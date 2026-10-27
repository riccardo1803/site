/* PAiNe diary UI; public events are maintained in assets/paine-events.json.
   Run scripts/build_events.py after editing that JSON file. */
(function(){
  'use strict';
  const EVENTS=window.PAiNeEventData || [];
  const START_YEAR = 2024;
  const END_YEAR = 2033; // Calendar may be expanded without changing event records.
  const NUMBER_MONTHS = (END_YEAR-START_YEAR)*12;
  const START_UTC = Date.UTC(START_YEAR,0,1);
  const MIN_ZOOM = 3;
  const MAX_ZOOM = 18;
  const DEFAULT_ZOOM = 12;
  const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const CAT_NAMES = {research:'Research & Outputs',exchange:'Scientific Exchange',outreach:'Outreach & Impact'};
  const viewport = document.getElementById('timeline-scroll');
  if(!viewport) return;
  const track = document.getElementById('timeline-track');
  const months = document.getElementById('timeline-months');
  const slider = document.getElementById('timeline-zoom');
  const output = document.getElementById('timeline-zoom-value');
  const pastShade = document.getElementById('tl-past-shade');
  const nowMarker = document.getElementById('timeline-now');
  const dialog = document.getElementById('timeline-detail');
  const list = document.getElementById('timeline-event-list');
  const listToggle = document.getElementById('timeline-event-list-toggle');
  const lanes = {research:document.getElementById('tl-research'),exchange:document.getElementById('tl-exchange'),outreach:document.getElementById('tl-outreach')};
  Object.keys(lanes).forEach(key=>{lanes[key].dataset.type=key;});
  let zoom=DEFAULT_ZOOM,monthWidth=100, initialized=false,lastViewportWidth=0;
  function indexOfDate(date){let d=new Date(date+'T12:00:00Z');return (d.getUTCFullYear()-START_YEAR)*12+d.getUTCMonth()+(d.getUTCDate()-1)/new Date(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,0)).getUTCDate();}
  function currentMonthPosition(){const now=new Date();return (now.getFullYear()-START_YEAR)*12+now.getMonth()+(now.getDate()-1)/new Date(now.getFullYear(),now.getMonth()+1,0).getDate();}
  function clamp(n,min,max){return Math.max(min,Math.min(max,n));}
  function getFocalMonth(){return (viewport.scrollLeft+viewport.clientWidth/2)/monthWidth;}
  function centerOn(monthPosition){viewport.scrollLeft=clamp(monthPosition*monthWidth-viewport.clientWidth/2,0,Math.max(0,track.offsetWidth-viewport.clientWidth));}
  function isCompleted(evt){const end =new Date((evt.end||evt.date)+'T23:59:59');return new Date().getTime()>end.getTime();}
  function displayDate(evt){const start=new Date(evt.date+'T12:00:00Z'),end=new Date((evt.end||evt.date)+'T12:00:00Z');const fmt=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'});return evt.date===(evt.end||evt.date)?fmt.format(start):fmt.format(start)+' – '+fmt.format(end);}
  function showEvent(evt){
    dialog.dataset.lane=evt.special?'special':evt.lane;
    document.getElementById('tl-dialog-category').textContent=evt.special?'PROJECT MILESTONE':CAT_NAMES[evt.lane];
    document.getElementById('tl-dialog-title').textContent=evt.title;
    document.getElementById('tl-dialog-date').textContent=displayDate(evt);
    document.getElementById('tl-dialog-description').textContent=evt.description;
    document.getElementById('tl-dialog-location').textContent=evt.location;
    if(typeof dialog.showModal==='function')dialog.showModal(); else dialog.setAttribute('open','');
  }
  document.getElementById('timeline-detail-close').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
  function renderMonths(){
    let count=0;
    const minLabelSpacing=60;const labelEvery=Math.max(1,Math.ceil(minLabelSpacing/monthWidth));
    const frag=document.createDocumentFragment();
    for(let i=0;i<NUMBER_MONTHS;i++){
      const year=START_YEAR+Math.floor(i/12),month=i%12;
      const d=document.createElement('div');d.className='tl-month';
      const now=new Date();if(year===now.getFullYear()&&month===now.getMonth())d.classList.add('current');
      if(month===0||i%labelEvery===0){const label=document.createElement('span');label.className='tl-month-label';label.textContent=MONTH_NAMES[month];d.append(label);}
      if(month===0){const y=document.createElement('span');y.className='tl-month-year';y.textContent=year;d.append(y);}
      frag.append(d);count++;
    }
    months.replaceChildren(frag);
  }
  function renderEvents(){
    Object.values(lanes).forEach(lane=>lane.replaceChildren());
    track.querySelectorAll('.tl-event-special').forEach(el=>el.remove());
    for(let i=0;i<EVENTS.length;i++){
      const evt=EVENTS[i];const lane=lanes[evt.lane];if(!lane)continue;
      const b=document.createElement('button');b.type='button';b.className=(evt.special?'tl-event-special':'tl-event')+(isCompleted(evt)?'':' is-upcoming');
      b.style.left=(indexOfDate(evt.date)*monthWidth)+'px';
      // Alternating vertical position prevents overlap between two close events at 18-month zoom.
      const sameMonth=EVENTS.filter(e=>!e.special&&e.lane===evt.lane&&e.date.slice(0,7)===evt.date.slice(0,7));
      const rank=sameMonth.findIndex(e=>e.id===evt.id);if(!evt.special)b.style.top=(rank%2===0?10:32)+'px';
      b.setAttribute('aria-label',displayDate(evt)+': '+evt.title+(isCompleted(evt)?' (completed)':' (upcoming)'));
      b.title=evt.title;
      b.addEventListener('click',()=>showEvent(evt));if(evt.special)track.append(b);else lane.append(b);
    }
    nowMarker.style.left=(currentMonthPosition()*monthWidth)+'px';
    if(pastShade)pastShade.style.width = (currentMonthPosition()*monthWidth)+'px';
  }
  function refresh(keepFocus){
    const focal=(initialized && keepFocus) ? getFocalMonth() : currentMonthPosition();
    monthWidth=viewport.clientWidth/zoom;
    track.style.width=NUMBER_MONTHS*monthWidth+'px';
    track.style.setProperty('--month-width',monthWidth+'px');
    renderMonths();renderEvents();
    centerOn(focal);initialized=true;
    output.textContent=zoom+' months';slider.setAttribute('aria-valuetext',zoom+' months');
    lastViewportWidth=viewport.clientWidth;
  }
  slider.addEventListener('input',()=>{zoom=clamp(Number(slider.value)||DEFAULT_ZOOM,MIN_ZOOM,MAX_ZOOM);refresh(true);});
  document.getElementById('timeline-today').addEventListener('click',()=>centerOn(currentMonthPosition()));
  // Mouse dragging. Touch and trackpad use native horizontal scrolling for responsive mobile behavior.
  let dragging=false,startX=0,startScroll=0,moved=false;
  viewport.addEventListener('pointerdown',event=>{
    if(event.pointerType!=='mouse'||event.button!==0||event.target.closest('button'))return;
    dragging=true;moved=false;startX=event.clientX;startScroll=viewport.scrollLeft;
    viewport.setPointerCapture(event.pointerId);viewport.classList.add('is-dragging');
  });
  viewport.addEventListener('pointermove',event=>{
    if(!dragging)return;
    const diff=event.clientX-startX;if(Math.abs(diff)>3)moved=true;
    viewport.scrollLeft=startScroll-diff;
  });
  function endDrag(){dragging=false;viewport.classList.remove('is-dragging');}
  viewport.addEventListener('pointerup',endDrag);viewport.addEventListener('pointercancel',endDrag);viewport.addEventListener('lostpointercapture',endDrag);
  listToggle.addEventListener('click',()=>{
    const opening=list.hidden;list.hidden=!opening;listToggle.setAttribute('aria-expanded',String(opening));
    listToggle.innerHTML=opening?'Hide event list <span aria-hidden="true">↑</span>':'View events as a list <span aria-hidden="true">↓</span>';
  });
  for(const evt of EVENTS){const b=document.createElement('button');b.type='button';b.className='tl-event-list-row'+(evt.special?' is-special':'');b.dataset.lane=evt.lane;const when=document.createElement('span');when.className='tl-event-date';when.textContent=displayDate(evt);const title=document.createElement('strong');title.textContent=evt.title;b.append(when,title);b.addEventListener('click',()=>showEvent(evt));list.append(b);}
  if('ResizeObserver' in window){new ResizeObserver(()=>{if(viewport.clientWidth>0&&Math.abs(viewport.clientWidth-lastViewportWidth)>1)refresh(true);}).observe(viewport);}
  else window.addEventListener('resize',()=>{if(viewport.clientWidth>0&&Math.abs(viewport.clientWidth-lastViewportWidth)>1)refresh(true);});
  refresh(false);
})();
