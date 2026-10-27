(function(){
  'use strict';
  const searchEl = document.getElementById('pub-search');
  const clearSearchEl = document.getElementById('pub-search-clear');
  const sortEl = document.getElementById('pub-sort');
  const typeEl = document.getElementById('pub-type-filter');
  const chipsEl = document.getElementById('pub-filter-chips');
  const listEl = document.getElementById('pub-list');
  const countEl = document.getElementById('pub-result-count');
  const resetEl = document.getElementById('pub-reset');
  const emptyEl = document.getElementById('pub-empty');
  const clearAllEl = document.getElementById('pub-clear-all');
  const selectedTags = new Set();
  const tagDisclosure=document.getElementById('pub-tags-disclosure');
  let records = [];
  let order = 'year';
  let type = 'all';
  const tagClasses = {'Network Geometry':'topic-geometry','Subgraphs & Motifs':'topic-motifs','Scale-Free Networks':'topic-scale-free','Detection & Inference':'topic-inference','Community Structure':'topic-community','Graph Algorithms':'topic-algorithms','Network Modeling':'topic-modeling','Rare Events':'topic-rare-events','Temporal Networks':'topic-temporal'};
  const synonyms = {'motifs':['subgraphs','motif'],'motif':['subgraphs','motifs'],'subgraphs':['motif','motifs'],'cliques':['clique'],'clique':['cliques'],'geometric':['geometry'],'geometry':['geometric']};
  const normalize = s => String(s ?? '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const words = s => normalize(s).split(/\s+/).filter(Boolean);
  function editDistance(a,b, max){
    if(Math.abs(a.length-b.length)>max)return max+1;
    const prev=Array.from({length:b.length+1},(_,i)=>i);
    for(let i=1;i<=a.length;i++){
      const curr=[i];let min=curr[0];
      for(let j=1;j<=b.length;j++){
        const value=Math.min(prev[j]+1,curr[j-1]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));
        curr.push(value);min=Math.min(min,value);
      }
      if(min>max)return max+1;
      for(let k=0;k<curr.length;k++)prev[k]=curr[k];
    }
    return prev[b.length];
  }
  function matchesWord(queryWord, word){
    // Year and other numeric identifiers must never fuzzy-match adjacent numbers.
    if(/^\d+$/.test(queryWord))return word===queryWord;
    if(word===queryWord || word.startsWith(queryWord))return true;
    if(queryWord.length<4)return false;
    const allowed=queryWord.length>=8?2:1;
    return editDistance(queryWord,word,allowed)<=allowed;
  }
  function recordMatches(record, query){
    const parts=words(query).filter(q=>q.length>1 || /^\d$/.test(q));
    if(parts.length===0)return true;
    return parts.every(q=>{
      if(/^\d{4}$/.test(q) && +q>=1900 && +q<=2100) return record.year===Number(q);
      const equivalents=[q,...(synonyms[q]||[])];
      return equivalents.some(qv=> record._tokens.some(word=>matchesWord(qv,word)));
    });
  }
  function create(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
  function makeChip(tag,asFilter){
    const className='topic-chip '+(tagClasses[tag]||'topic-geometry');
    const b=create('button',className,tag);b.type='button';b.setAttribute('aria-pressed',String(selectedTags.has(tag)));
    b.setAttribute('aria-label','Filter: '+tag);
    b.addEventListener('click',()=>{if(selectedTags.has(tag))selectedTags.delete(tag);else selectedTags.add(tag);render();});
    return b;
  }
  function makeRow(r){
    const row=create('article','pub-record');row.id='pub-'+r.id;
    const info=create('div','pub-info');
    const title=create('a','pub-record-title',r.title);
    title.href=r.title_url;title.target='_blank';title.rel='noopener noreferrer';
    const titleLine=create('div','pub-title-line');
    titleLine.appendChild(title);
    if(r.interactive_url){
      const interactive=create('a','pub-ip-badge');interactive.href=r.interactive_url;
      interactive.setAttribute('aria-label','Open interactive version of: '+r.title);
      interactive.title='Open Interactive Paper';
      if(/^https?:/i.test(r.interactive_url)){interactive.target='_blank';interactive.rel='noopener noreferrer';}
      const mark=create('span','ip-brand-icon pub-ip-icon');
      mark.setAttribute('aria-hidden','true');
      interactive.appendChild(mark);
      titleLine.appendChild(interactive);
    }
    info.appendChild(titleLine);
    const authors=create('div','pub-record-authors');
    r.authors.forEach((a,i)=>{
      if(i)authors.appendChild(document.createTextNode(i===r.authors.length-1?' & ':', '));
      const name=create('span',a.is_self?'author-self':'',a.display_name);name.title=a.full_name;authors.appendChild(name);
    });
    info.appendChild(authors);
    const venue=create('div','pub-record-venue',r.venue+(r.type==='Thesis'?' · '+(r.thesis_level||'')+' thesis':''));info.appendChild(venue);
    const tags=create('div','pub-tag-row');r.tags.forEach(tag=>tags.appendChild(makeChip(tag,false)));info.appendChild(tags);
    
    row.appendChild(info);
    row.appendChild(create('div','pub-type',r.type));
    row.appendChild(create('div','pub-year',r.year));
    return row;
  }
  function sortRecords(arr){
    const collator=new Intl.Collator('en',{sensitivity:'base',numeric:true});
    return arr.sort((a,b)=>order==='title'?collator.compare(a.title,b.title):(b.sort_date||String(b.year)).localeCompare(a.sort_date||String(a.year))||collator.compare(a.title,b.title));
  }
  let deepLinkHandled=false;
  function render(){
    const query=searchEl.value.trim();
    const found=sortRecords(records.filter(r=>
      (type==='all'||r.type===type) &&
      (!selectedTags.size||r.tags.some(t=>selectedTags.has(t))) && recordMatches(r,query)));
    const fragment=document.createDocumentFragment();
    found.forEach(r=>fragment.appendChild(makeRow(r)));
    listEl.replaceChildren(fragment);
    countEl.textContent=found.length+' '+(found.length===1?'publication':'publications')+(query?' matching “'+query+'”':'');
    emptyEl.style.display=found.length?'none':'block';
    const any=!!(query||selectedTags.size||type!=='all');
    resetEl.classList.toggle('show',any);
    clearSearchEl.hidden=!query;
    chipsEl.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(selectedTags.has(b.dataset.tag))));
    if(selectedTags.size && tagDisclosure && !tagDisclosure.open) tagDisclosure.open=true;
    if(!deepLinkHandled && location.hash){const id=decodeURIComponent(location.hash.slice(1));const anchor=document.getElementById(id);if(anchor){deepLinkHandled=true;requestAnimationFrame(()=>anchor.scrollIntoView({block:'center',behavior:'instant'}));}}
  }
  function reset(){selectedTags.clear();searchEl.value='';typeEl.value='all';type='all';render();searchEl.focus()}
  searchEl.addEventListener('input',render);
  sortEl.addEventListener('change',()=>{order=sortEl.value;render()});
  typeEl.addEventListener('change',()=>{type=typeEl.value;render()});
  resetEl.addEventListener('click',reset);
  clearAllEl.addEventListener('click',reset);
  clearSearchEl.addEventListener('click',()=>{searchEl.value='';render();searchEl.focus()});
  // JSON is served locally by GitHub Pages. No remote service or tracking.
  fetch('assets/publications.json',{cache:'no-cache'}).then(resp=>{if(!resp.ok)throw new Error('HTTP '+resp.status);return resp.json()}).then(data=>{
    records=data.records.map(r=>{
      const all=[r.title,r.venue,r.year,r.sort_date,r.type,r.thesis_level||'',r.doi||'',...(r.tags||[]),...(r.keywords||[]),...r.authors.flatMap(a=>[a.full_name,a.display_name])].join(' ');
      return {...r,_tokens:words(all)};
    });
    (data.topic_order||[]).forEach(tag=>{
      const chip=makeChip(tag,true);chip.dataset.tag=tag;chipsEl.appendChild(chip);
    });
    render();
  }).catch(err=>{
    console.error('Unable to load publication data',err);
    countEl.textContent='Unable to load the bibliography';
    emptyEl.style.display='block';
    emptyEl.querySelector('h2').textContent='Publications unavailable';
    emptyEl.querySelector('p').textContent='Please open this page through GitHub Pages or a local web server.';
    clearAllEl.style.display='none';
  });
})();