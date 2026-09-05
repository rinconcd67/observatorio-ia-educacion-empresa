(() => {
 const form=document.querySelector('.filters');
 if(!form)return;
 const fields=['search','org','topic','year'].map(id=>document.getElementById(id));
 const cards=[...document.querySelectorAll('.book-card')];
 const normalize=s=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
 const update=()=>{
  const [q,org,topic,year]=fields.map(f=>f.value);let count=0;
  for(const card of cards){const visible=(!q||normalize(card.dataset.search).includes(normalize(q)))&&(!org||card.dataset.org===org)&&(!topic||card.dataset.topic===topic)&&(!year||card.dataset.year===year);card.hidden=!visible;if(visible)count++;}
  for(const shelf of document.querySelectorAll('.shelf'))shelf.hidden=![...shelf.querySelectorAll('.book-card')].some(c=>!c.hidden);
  document.getElementById('results').textContent=count+' '+(document.documentElement.lang==='es'?(count===1?'publicación':'publicaciones'):(count===1?'publication':'publications'));document.getElementById('empty').hidden=count!==0;
 };
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('input',update);form.addEventListener('change',update);form.addEventListener('reset',()=>setTimeout(update,0));
})();
