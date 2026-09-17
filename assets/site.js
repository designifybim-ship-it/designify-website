
// EDIT THESE LINKS ONCE and every social button across the site updates.
const DESIGNIFY_LINKS={
  instagram:'https://www.instagram.com/designify.bb/', // paste full Instagram URL
  facebook:'https://www.facebook.com/profile.php?id=61593702683373',
  behance:'',   // paste full Behance URL
  whatsapp:'https://wa.me/12462301679',
  primaryAd:'', // homepage large ad destination
  secondaryAd:'' // homepage small ad destination
};
document.querySelectorAll('[data-social]').forEach(a=>{const u=DESIGNIFY_LINKS[a.dataset.social];if(u){a.href=u;a.target='_blank';a.rel='noopener'}else{a.hidden=true}});
document.querySelectorAll('[data-ad-link]').forEach(a=>{const u=a.dataset.adLink==='primary'?DESIGNIFY_LINKS.primaryAd:DESIGNIFY_LINKS.secondaryAd;if(u){a.href=u;a.target='_blank';a.rel='noopener'}else{a.addEventListener('click',e=>e.preventDefault())}});

const menu=document.querySelector('.menu');const nav=document.querySelector('.navlinks');if(menu&&nav){menu.addEventListener('click',()=>nav.classList.toggle('open'));nav.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>nav.classList.remove('open')))}
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.1});document.querySelectorAll('.reveal,.stagger').forEach(el=>io.observe(el));
window.addEventListener('scroll',()=>{const d=document.documentElement;const p=document.getElementById('progress');if(p)p.style.width=((d.scrollTop/Math.max(1,d.scrollHeight-d.clientHeight))*100)+'%'});
window.addEventListener('load',()=>setTimeout(()=>document.querySelector('.loader')?.classList.add('hide'),420));
const lb=document.querySelector('.lightbox'),lbi=document.querySelector('.lightbox img');document.querySelectorAll('[data-lightbox]').forEach(el=>el.addEventListener('click',()=>{if(lb&&lbi){lbi.src=el.dataset.lightbox;lb.classList.add('open');document.body.style.overflow='hidden'}}));function closeLB(){if(lb){lb.classList.remove('open');document.body.style.overflow='';if(lbi)lbi.src=''}}document.querySelector('.lightbox-close')?.addEventListener('click',closeLB);lb?.addEventListener('click',e=>{if(e.target===lb)closeLB()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeLB()});

// Rotating hero phrase
const rotating=document.querySelector('.rotating-word');if(rotating){const words=rotating.dataset.words.split('|');let wi=0;setInterval(()=>{rotating.classList.add('swap');setTimeout(()=>{wi=(wi+1)%words.length;rotating.textContent=words[wi];rotating.classList.remove('swap')},220)},2800)}
// Real counters use counts derived from the portfolio currently included in this build.
const counters=document.querySelectorAll('.counter[data-count]');if(counters.length){const cio=new IntersectionObserver(es=>es.forEach(e=>{if(!e.isIntersecting||e.target.dataset.done)return;e.target.dataset.done='1';const end=+e.target.dataset.count,start=performance.now(),dur=900;function tick(t){const p=Math.min(1,(t-start)/dur);e.target.textContent=Math.round(end*(1-Math.pow(1-p,3)))+(e.target.dataset.suffix||'');if(p<1)requestAnimationFrame(tick)}requestAnimationFrame(tick)}),{threshold:.5});counters.forEach(c=>cio.observe(c))}
// Contact project builder
const builder=document.querySelector('.project-builder');if(builder){const monthly=builder.querySelector('.monthly-options'),summary=document.getElementById('projectSummary');function updateBuilder(){const work=builder.querySelector('input[name="work_type"]:checked')?.value||'';monthly?.classList.toggle('show',work==='Monthly Design Support');const services=[...builder.querySelectorAll('input[name="services"]:checked')].map(x=>x.value);const pkg=builder.querySelector('input[name="monthly_package"]:checked')?.value||'';const date=builder.querySelector('input[name="start_date"]')?.value||'';const budget=builder.querySelector('select[name="budget"]')?.value||'';const parts=[];if(services.length)parts.push(services.join(' + '));if(work)parts.push(work+(pkg?' · '+pkg:''));if(date)parts.push('Start: '+date);if(budget)parts.push('Budget: '+budget);summary.textContent=parts.length?parts.join('  •  '):'Your selected services, work type and other choices will appear here before you send your request.'}builder.addEventListener('change',updateBuilder);updateBuilder()}




// Carry a custom-package estimate into the Contact form instead of losing it on navigation.
(()=>{
  const form=document.querySelector('.project-builder');
  if(!form) return;
  const params=new URLSearchParams(window.location.search);
  const customServices=params.get('custom_services')||'';
  const estimate=params.get('estimate_bbd')||'';
  const revisionRounds=params.get('revision_rounds')||'';
  const requestedWork=params.get('work_type')||'';
  if(!customServices && !estimate && requestedWork!=='Custom Package') return;

  const workRadio=[...form.querySelectorAll('input[name="work_type"]')].find(x=>x.value==='Custom Package');
  if(workRadio) workRadio.checked=true;

  const serviceMap=[
    ['brand identity','Brand Identity'],
    ['flyer & marketing','Marketing Design'],
    ['marketing design','Marketing Design'],
    ['social media posts','Social Media Graphics'],
    ['social media','Social Media Graphics'],
    ['business collateral','Business Collateral'],
    ['website / digital','Digital Content'],
    ['website content','Digital Content'],
    ['digital business','Digital Business Setup'],
    ['mockup','Packaging & Mockups'],
    ['motion graphics','Motion & Animated Graphics'],
    ['content calendar','Content Calendar Planning'],
    ['page management','Page Management & Support'],
    ['campaign planning','Campaign Planning']
  ];
  const lower=customServices.toLowerCase();
  serviceMap.forEach(([needle,value])=>{
    if(!lower.includes(needle)) return;
    const box=[...form.querySelectorAll('input[name="services"]')].find(x=>x.value===value);
    if(box) box.checked=true;
  });

  const detailsField=document.getElementById('customPackageDetailsField');
  const estimateField=document.getElementById('customPackageEstimateField');
  const revisionsField=document.getElementById('customPackageRevisionsField');
  if(detailsField) detailsField.value=customServices+(revisionRounds?` | Revision Rounds: ${revisionRounds}`:'');
  if(estimateField) estimateField.value=estimate;
  if(revisionsField) revisionsField.value=revisionRounds;

  const panel=document.getElementById('customPackageImport');
  const list=document.getElementById('customPackageImportList');
  const total=document.getElementById('customPackageImportTotal');
  if(panel){
    panel.hidden=false;
    if(list) list.textContent=customServices||'Custom package estimate selected.';
    if(total) total.textContent=estimate?`Estimated monthly total: $${Number(estimate).toLocaleString()} BBD`:'Estimate to be confirmed.';
  }

  const summary=document.getElementById('projectSummary');
  if(summary){
    const imported=[];
    if(customServices) imported.push(customServices);
    if(estimate) imported.push(`Estimated monthly total: $${Number(estimate).toLocaleString()} BBD`);
    if(imported.length) summary.textContent='Custom Package • '+imported.join(' • ');
  }
})();

// Price display currency selector. BBD remains the source-of-truth price.
(()=>{
  const selectors=[...document.querySelectorAll('[data-currency-select]')];
  const buttons=[...document.querySelectorAll('[data-currency-option]')];
  const priceNodes=[...document.querySelectorAll('[data-bbd]')];
  if((!selectors.length && !buttons.length) || !priceNodes.length) return;

  const STORAGE_KEY='designifyDisplayCurrency';
  const symbols={BBD:'$',USD:'US$',CAD:'CA$',GBP:'£',EUR:'€'};
  const fallback={BBD:1,USD:0.5,CAD:0.69,GBP:0.37,EUR:0.43};
  let rates={...fallback};
  let selected=localStorage.getItem(STORAGE_KEY)||'BBD';
  if(!rates[selected]) selected='BBD';

  function format(amount,currency){
    const converted=amount*rates[currency];
    const rounded=Math.round(converted);
    if(currency==='BBD') return `$${rounded.toLocaleString()} BBD`;
    return `${symbols[currency]}${rounded.toLocaleString()} ${currency}`;
  }
  function paint(){
    priceNodes.forEach(node=>{
      const base=Number(node.dataset.bbd);
      if(Number.isFinite(base)){
        node.classList.add('price-converted');
        node.textContent=format(base,selected);
      }
    });
    selectors.forEach(s=>s.value=selected);
    buttons.forEach(b=>{const on=b.dataset.currencyOption===selected;b.classList.toggle('active',on);b.setAttribute('aria-pressed',on?'true':'false')});
  }
  selectors.forEach(s=>s.addEventListener('change',()=>{
    selected=s.value;
    localStorage.setItem(STORAGE_KEY,selected);
    paint();
  }));
  buttons.forEach(b=>b.addEventListener('click',()=>{
    selected=b.dataset.currencyOption;
    localStorage.setItem(STORAGE_KEY,selected);
    paint();
  }));
  document.addEventListener('designify:pricechange',paint);
  paint();

  // BBD is pegged at BBD 2 = USD 1. Other display currencies use daily reference rates.
  fetch('https://api.frankfurter.dev/v2/rates?base=usd&quotes=cad,gbp,eur')
    .then(r=>{if(!r.ok) throw new Error('FX request failed');return r.json()})
    .then(rows=>{
      rates.BBD=1; rates.USD=.5;
      rows.forEach(row=>{
        const code=String(row.quote||'').toUpperCase();
        if(['CAD','GBP','EUR'].includes(code) && Number(row.rate)) rates[code]=.5*Number(row.rate);
      });
      paint();
    })
    .catch(()=>{ /* fallback rates keep the selector usable if the rate service is unavailable */ });
})();

// Let visitors see the page first, then gently introduce the WhatsApp prompt.
const whatsappContact=document.querySelector('.whatsapp-contact');if(whatsappContact){setTimeout(()=>whatsappContact.classList.add('bubble-ready'),3200);setTimeout(()=>whatsappContact.classList.add('bubble-dismissed'),9800);whatsappContact.addEventListener('mouseenter',()=>whatsappContact.classList.remove('bubble-dismissed'));whatsappContact.addEventListener('focusin',()=>whatsappContact.classList.remove('bubble-dismissed'));whatsappContact.addEventListener('mouseleave',()=>whatsappContact.classList.add('bubble-dismissed'));}


// Build Your Own Custom Package calculator. Estimates are BBD source prices.
(()=>{
  const grid=document.getElementById('customServiceGrid');
  const total=document.getElementById('customMonthlyTotal');
  const count=document.getElementById('customSelectedCount');
  const list=document.getElementById('customSelectedServices');
  const cta=document.getElementById('customPackageCTA');
  const revisionCount=document.getElementById('customRevisionCount');
  const subtotalNode=document.getElementById('customSubtotal');
  const savingAmountNode=document.getElementById('customSavingAmount');
  if(!grid||!total||!count||!list) return;
  const checks=[...grid.querySelectorAll('input[type="checkbox"][data-monthly-price]')];
  const MAX_BILLABLE_UNITS=12;
  const qtyFor=check=>{
    if(check.dataset.quantityService!=='true') return 1;
    const option=check.closest('.custom-service-option');
    const value=option?.querySelector('.qty-value');
    return Math.max(1,Number(value?.dataset.qtyValue||value?.textContent||1));
  };
  const currentBillableUnits=()=>checks
    .filter(x=>x.checked)
    .reduce((n,x)=>n+qtyFor(x),0);

  const showLimitMessage=()=>{
    let note=document.getElementById('customLimitMessage');
    if(!note){
      note=document.createElement('div');
      note.id='customLimitMessage';
      note.className='custom-limit-message';
      const host=document.querySelector('#custom-package-builder .custom-options-master');
      host?.prepend(note);
    }
    if(note){
      note.innerHTML='<i class="fa-solid fa-circle-exclamation"></i><span>You have reached the 12-item monthly limit. If you need more support, submit this package and I can quote a larger monthly scope separately.</span>';
      note.classList.add('show');
      clearTimeout(note._hideTimer);
      note._hideTimer=setTimeout(()=>note.classList.remove('show'),4500);
    }
  };
  function update(){
    const selected=checks.filter(x=>x.checked);
    const subtotal=selected.reduce((n,x)=>n+(Number(x.dataset.monthlyPrice||0)*qtyFor(x)),0);
    const billableUnits=selected.reduce((n,x)=>n+qtyFor(x),0);
    const discountRate=billableUnits>=5?0.10:0;
    const saving=Math.round(subtotal*discountRate);
    const sum=subtotal-saving;
    total.dataset.bbd=String(sum);
    total.textContent=`$${sum.toLocaleString()} BBD`;
    if(subtotalNode){ subtotalNode.dataset.bbd=String(subtotal); subtotalNode.textContent=`$${subtotal.toLocaleString()} BBD`; }
    if(savingAmountNode){ savingAmountNode.dataset.bbd=String(saving); savingAmountNode.textContent=saving?`−$${saving.toLocaleString()} BBD`:'$0 BBD'; }
    const savingNode=document.getElementById('customBundleSaving');
    const progressBar=document.getElementById('customBundleProgressBar');
    if(progressBar) progressBar.style.width=`${Math.min(100,(billableUnits/5)*100)}%`;
    if(savingNode){
      const remaining=Math.max(0,5-billableUnits);
      savingNode.textContent=discountRate?`Bundle saving unlocked. You save $${saving.toLocaleString()} BBD on this estimate.`:`${billableUnits} of 5 monthly units selected. Add ${remaining} more to unlock 10% off.`;
    }
    count.textContent=`${selected.length} service${selected.length===1?'':'s'} selected`;
    const labels=selected.map(x=>{
      const qty=qtyFor(x);
      const unit=x.dataset.unit||'item';
      return x.dataset.quantityService==='true'?`${x.value} × ${qty} ${unit}${qty===1?'':'s'}`:x.value;
    });
    const revisions=Math.max(1,Math.min(6,Number(revisionCount?.dataset.revisionValue||revisionCount?.textContent||2)));
    const summaryLabels=[...labels,`Revision Rounds × ${revisions}`];
    list.textContent=labels.length?summaryLabels.join(' · '):`Start by selecting the services you expect to use in a typical month. Preferred revision rounds: ${revisions}.`;
    if(cta){
      const qs=new URLSearchParams();
      qs.set('work_type','Custom Package');
      qs.set('custom_services',labels.join(', '));
      qs.set('revision_rounds',String(revisions));
      qs.set('estimate_bbd',String(sum));
      cta.href='contact.html?'+qs.toString();
      cta.classList.toggle('is-empty',selected.length===0);
    }
    document.dispatchEvent(new CustomEvent('designify:pricechange'));
  }
  grid.addEventListener('change',e=>{
    const check=e.target.closest('input[type="checkbox"][data-monthly-price]');
    if(check && check.checked){
      const totalUnits=currentBillableUnits();
      if(totalUnits>MAX_BILLABLE_UNITS){
        check.checked=false;
        showLimitMessage();
      }
    }
    update();
  });
  document.getElementById('custom-package-builder')?.addEventListener('click',e=>{
    const rbtn=e.target.closest('.revision-qty-btn');
    if(!rbtn||!revisionCount) return;
    e.preventDefault();
    e.stopPropagation();
    let value=Math.max(1,Math.min(6,Number(revisionCount.dataset.revisionValue||revisionCount.textContent||2)));
    value=rbtn.dataset.revisionAction==='plus'?Math.min(6,value+1):Math.max(1,value-1);
    revisionCount.dataset.revisionValue=String(value);
    revisionCount.textContent=String(value);
    update();
  });
  grid.addEventListener('click',e=>{
    const btn=e.target.closest('.qty-btn');
    if(!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const option=btn.closest('.custom-service-option');
    const check=option?.querySelector('input[type="checkbox"]');
    const value=option?.querySelector('.qty-value');
    if(!check||!value) return;
    let qty=Math.max(1,Number(value.dataset.qtyValue||value.textContent||1));
    const isPlus=btn.dataset.qtyAction==='plus';

    if(!check.checked){
      if(currentBillableUnits()+1>MAX_BILLABLE_UNITS){
        showLimitMessage();
        return;
      }
      check.checked=true;
    }

    if(isPlus){
      if(currentBillableUnits()>=MAX_BILLABLE_UNITS){
        showLimitMessage();
        return;
      }
      qty=Math.min(MAX_BILLABLE_UNITS,qty+1);
    }else{
      qty=Math.max(1,qty-1);
    }

    value.dataset.qtyValue=String(qty);
    value.textContent=String(qty);
    update();
  });
  update();
})();

// Keep one FAQ open at a time for a cleaner page.
document.querySelectorAll('.faq-list').forEach(list=>{
  list.addEventListener('toggle',e=>{
    const item=e.target;
    if(item.tagName!=='DETAILS'||!item.open)return;
    list.querySelectorAll('details[open]').forEach(other=>{if(other!==item)other.open=false});
  },true);
});


// Client quiz: package direction + recommended services.
(()=>{
 const form=document.getElementById('clientQuizForm');
 const title=document.getElementById('quizResultTitle');
 const text=document.getElementById('quizResultText');
 const tags=document.getElementById('quizServiceTags');
 const cta=document.getElementById('quizResultCTA');
 if(!form||!title||!text||!tags||!cta)return;
 const packageCopy={
  spark:['Spark Essentials','A lighter monthly option for keeping your brand polished without committing to a high volume of requests.'],
  elevate:['Elevate Plus','A strong fit for a growing business that needs consistent design support and regular marketing content.'],
  signature:['Signature Elite','Best suited to a business that needs frequent creative support, faster turnaround and more active requests.'],
  custom:['Build Your Own','Your needs are more mixed, so a custom monthly estimate is likely the better fit. Choose the exact services and quantities you need.']
 };
 const serviceMap={
  branding:['Logo & Brand Identity','Business Collateral','Menus & Price Lists'],
  social:['Social Media Graphics','Marketing Design','Motion Graphics'],
  web:['Website Content & Updates','Digital Business Support','Website Graphics'],
  mixed:['Brand Identity Support','Social Media Graphics','Website Content & Updates','Mockup Design']
 };
 function updateQuiz(){
  const scores={spark:0,elevate:0,signature:0,custom:0};
  ['goal','pace','priority','stage'].forEach(name=>{const el=form.querySelector(`input[name="${name}"]:checked`);if(el)scores[el.value]++;});
  const winner=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
  const focus=form.querySelector('input[name="service_focus"]:checked')?.value||'branding';
  title.textContent=packageCopy[winner][0];text.textContent=packageCopy[winner][1];
  tags.innerHTML='';(serviceMap[focus]||[]).forEach(label=>{const s=document.createElement('span');s.textContent=label;tags.appendChild(s)});
  cta.textContent=winner==='custom'?'Build Your Estimate':'See Your Options';cta.href='#custom-package-builder';
 }
 form.addEventListener('change',updateQuiz);updateQuiz();
})();

// Submit the Designify project form through FormSubmit without sending visitors to FormSubmit's confirmation page.
(()=>{
  const form=document.getElementById('designifyProjectForm');
  if(!form) return;
  const success=document.getElementById('formSuccessCard');
  const error=document.getElementById('formErrorCard');
  const submit=form.querySelector('.builder-submit');
  const originalLabel=submit?.textContent||'Send Project Request';
  success?.querySelector('.form-success-close')?.addEventListener('click',()=>{success.hidden=true});

  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const serviceChoices=[...form.querySelectorAll('input[name="services"]')];
    if(serviceChoices.length && !serviceChoices.some(x=>x.checked)){
      const first=serviceChoices[0];
      first.setCustomValidity('Please select at least one service.');
      first.reportValidity();
      first.setCustomValidity('');
      first.closest('.builder-step')?.scrollIntoView({behavior:'smooth',block:'center'});
      return;
    }
    if(!form.reportValidity()) return;
    if(success) success.hidden=true;
    if(error) error.hidden=true;
    if(submit){submit.classList.add('is-sending');submit.disabled=true;submit.textContent='Sending…';}

    try{
      const response=await fetch('https://formsubmit.co/ajax/designifybim@gmail.com',{
        method:'POST',
        headers:{'Accept':'application/json'},
        body:new FormData(form)
      });
      const result=await response.json().catch(()=>({}));
      if(!response.ok || result.success===false) throw new Error(result.message||'Submission failed');

      if(success){success.hidden=false;success.scrollIntoView({behavior:'smooth',block:'center'});}
      form.reset();
      const imported=document.getElementById('customPackageImport');
      if(imported) imported.hidden=true;
      const summary=document.getElementById('projectSummary');
      if(summary) summary.textContent='Your selected services, work type and other choices will appear here before you send your request.';
    }catch(err){
      if(error){error.hidden=false;error.scrollIntoView({behavior:'smooth',block:'center'});}
    }finally{
      if(submit){submit.classList.remove('is-sending');submit.disabled=false;submit.textContent=originalLabel;}
    }
  });
})();
