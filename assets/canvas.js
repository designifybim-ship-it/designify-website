// Designify canvas interactions. site.js still handles social links, the
// rotating word, counters, forms, the package builder, quiz, currency and
// the WhatsApp bubble; this file adds the "design file" behaviour.
(()=>{
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine=matchMedia('(hover: hover) and (pointer: fine)').matches;
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));

// ---------- Page transition curtain ----------
if(!reduce){
  const cur=document.createElement('div');cur.className='curtain';document.body.appendChild(cur);
  if(sessionStorage.getItem('dfy-curtain')){cur.classList.add('in');sessionStorage.removeItem('dfy-curtain')}
  document.addEventListener('click',e=>{
    const a=e.target.closest('a[href]');if(!a||e.metaKey||e.ctrlKey||e.shiftKey||a.target==='_blank')return;
    const url=new URL(a.href,location.href);
    if(url.origin!==location.origin||url.pathname===location.pathname||!/\.html$|\/$/.test(url.pathname))return;
    e.preventDefault();try{sessionStorage.setItem('dfy-curtain','1')}catch{}
    cur.classList.remove('in');cur.classList.add('out');setTimeout(()=>location.href=a.href,480);
  });
  addEventListener('pageshow',e=>{if(e.persisted)cur.classList.remove('out','in')});
}

// ---------- Toolbar ----------
const top=$('.topbar');
if(top){const f=()=>top.classList.toggle('scrolled',scrollY>10);addEventListener('scroll',f,{passive:true});f()}
const mb=$('.menu-btn'),tools=$('.tools');
if(mb&&tools){
  const set=o=>{tools.classList.toggle('open',o);mb.setAttribute('aria-expanded',o);mb.innerHTML=`<i aria-hidden="true" class="fa-solid fa-${o?'xmark':'bars'}"></i>`};
  mb.addEventListener('click',()=>set(!tools.classList.contains('open')));
  $$('a',tools).forEach(a=>a.addEventListener('click',()=>set(false)));
  document.addEventListener('keydown',e=>{if(e.key==='Escape')set(false)});
}

// ---------- Scroll progress ----------
const prog=$('#progress');
addEventListener('scroll',()=>{if(prog){const d=document.documentElement;prog.style.width=(d.scrollTop/Math.max(1,d.scrollHeight-d.clientHeight)*100)+'%'}},{passive:true});

// ---------- Headline letters drop in ----------
$$('[data-chars]').forEach(h=>{
  if(reduce)return;
  let i=0;
  const walk=node=>{[...node.childNodes].forEach(n=>{
    if(n.nodeType===3){
      const frag=document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(part=>{
        if(!part)return;
        if(/^\s+$/.test(part)){frag.appendChild(document.createTextNode(' '));return}
        const w=document.createElement('span');w.className='word';
        [...part].forEach(ch=>{const s=document.createElement('span');s.className='ch';s.textContent=ch;s.style.transitionDelay=(0.15+i++*0.025)+'s';w.appendChild(s)});
        frag.appendChild(w);
      });
      n.replaceWith(frag);
    }else if(n.nodeType===1&&!n.matches('.rotating-word,.box,.size')){walk(n)}
  })};
  walk(h);h.classList.add('chars');
  requestAnimationFrame(()=>requestAnimationFrame(()=>h.classList.add('in')));
});

// ---------- Reveal on scroll ----------
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in','visible');io.unobserve(e.target)}}),{threshold:0,rootMargin:'0px 0px -8% 0px'});
$$('.rv,.st,.reveal,.stagger').forEach(el=>io.observe(el));

// ---------- Magnetic buttons ----------
if(fine&&!reduce){
  $$('.btn').forEach(b=>{
    b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();b.style.translate=`${(e.clientX-r.left-r.width/2)*.18}px ${(e.clientY-r.top-r.height/2)*.28}px`});
    b.addEventListener('mouseleave',()=>b.style.translate='');
  });
}

// ---------- Service switcher (home) ----------
$$('.layers').forEach(L=>{
  const btns=$$('.layer',L),imgs=$$('.stage-art img',L),copy=$('.stage-copy',L);
  const data=btns.map(b=>JSON.parse(b.dataset.info));
  let idx=0,timer;
  const show=i=>{
    idx=i;btns.forEach((b,k)=>{b.classList.toggle('on',k===i);b.setAttribute('aria-selected',k===i)});
    imgs.forEach((im,k)=>im.classList.toggle('on',k===i));
    const d=data[i];
    copy.innerHTML=`<h3>${d.t}</h3><p>${d.p}</p><div class="price"><small>${d.f}</small><b class="g">${d.v}</b></div><a class="btn btn-primary" href="${d.h}">Explore ${d.t} <i aria-hidden="true" class="fa-solid fa-arrow-right"></i></a>`;
    copy.classList.remove('swap');void copy.offsetWidth;copy.classList.add('swap');
  };
  btns.forEach((b,k)=>{b.addEventListener('click',()=>{show(k);clearInterval(timer)});b.addEventListener('mouseenter',()=>{if(fine){show(k);clearInterval(timer)}})});
  show(0);
  if(!reduce){const vio=new IntersectionObserver(es=>{es.forEach(e=>{clearInterval(timer);if(e.isIntersecting)timer=setInterval(()=>show((idx+1)%btns.length),4200)})});vio.observe(L)}
});

// ---------- Horizontal pan for work ----------
$$('.pan').forEach(p=>{
  const track=$('.pan-track',p),bar=$('.pan-progress span',p);
  const active=()=>fine&&innerWidth>900&&!reduce;
  const size=()=>{if(!active()){p.style.removeProperty('--pan-h');track.style.transform='';return}
    const dist=track.scrollWidth-innerWidth+80;p.style.setProperty('--pan-h',(innerHeight+dist)+'px');p.dataset.dist=dist};
  const tick=()=>{if(!active())return;const r=p.getBoundingClientRect(),dist=+p.dataset.dist||0;
    const t=clamp(-r.top/(r.height-innerHeight),0,1);track.style.transform=`translateX(${-t*dist}px)`;if(bar)bar.style.width=(t*100)+'%'};
  size();tick();addEventListener('resize',()=>{size();tick()});addEventListener('scroll',tick,{passive:true});
  addEventListener('load',()=>{size();tick()});
});

// ---------- Numbers count up ----------
$$('[data-to]').forEach(el=>{
  const end=+el.dataset.to,suf=el.dataset.suf||'';
  if(reduce){el.textContent=end+suf;return}
  el.textContent='0'+suf;
  new IntersectionObserver((es,o)=>es.forEach(e=>{if(!e.isIntersecting)return;o.disconnect();const s=performance.now();
    const t=n=>{const p=Math.min(1,(n-s)/1400);el.textContent=Math.round(end*(1-Math.pow(1-p,4)))+suf;if(p<1)requestAnimationFrame(t)};requestAnimationFrame(t)}),{threshold:.6}).observe(el);
});

// ---------- Ticker duplication ----------
$$('.tick-track').forEach(t=>{[...t.children].forEach(n=>{const c=n.cloneNode(true);c.setAttribute('aria-hidden','true');t.appendChild(c)})});

// ---------- Filters (portfolio + pricing) ----------
$$('[data-filter-group]').forEach(g=>{
  const items=()=>$$(g.dataset.filterGroup);
  g.addEventListener('click',e=>{
    const b=e.target.closest('button[data-filter]');if(!b)return;
    $$('button',g).forEach(x=>{x.classList.toggle('on',x===b);x.setAttribute('aria-pressed',x===b)});
    const f=b.dataset.filter;let n=0;
    items().forEach(it=>{const show=f==='all'||(it.dataset.cat||'').split(' ').includes(f);
      if(it.classList.contains('inf-card')){it.classList.toggle('dim',!show);return}
      it.classList.toggle('hide',!show);it.classList.remove('pop');if(show){void it.offsetWidth;it.style.animationDelay=(n++*.04)+'s';it.classList.add('pop')}});
  });
});

// ---------- Services page: highlight current group tab ----------
const st=$('.sticky-tabs[data-spy]');
if(st){const links=$$('a',st);const sio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-40% 0px -55% 0px'});links.forEach(a=>{const s=$(a.getAttribute('href'));if(s)sio.observe(s)})}
const toc=$('.pol-toc');
if(toc){const links=$$('a',toc);const tio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)links.forEach(a=>a.classList.toggle('on',a.getAttribute('href')==='#'+e.target.id))}),{rootMargin:'-35% 0px -60% 0px'});links.forEach(a=>{const s=$(a.getAttribute('href'));if(s)tio.observe(s)})}

// ---------- Small feedback animations ----------
const qr=$('.quiz-result'),qf=$('#clientQuizForm');
if(qr&&qf)qf.addEventListener('change',()=>{qr.classList.remove('bump');void qr.offsetWidth;qr.classList.add('bump')});
const tot=$('#customMonthlyTotal');
if(tot&&tot.animate)new MutationObserver(()=>tot.animate([{transform:'scale(1.1)'},{transform:'scale(1)'}],{duration:350,easing:'cubic-bezier(.34,1.56,.64,1)'})).observe(tot,{childList:true,characterData:true,subtree:true});
$$('[data-currency-option]').forEach(b=>b.addEventListener('click',()=>$$('[data-bbd]').forEach(n=>n.animate?.([{opacity:.1,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'}))));


// ---------- Portfolio showcase: list drives the fanned preview ----------
$$('.showcase').forEach(sc=>{
  const rows=$$('.sx-row',sc),stages=$$('.sx-stage',sc);
  const show=i=>{rows.forEach(r=>r.classList.toggle('on',r.dataset.i==i));stages.forEach(s=>s.classList.toggle('on',s.dataset.i==i))};
  rows.forEach(r=>{r.addEventListener('mouseenter',()=>show(r.dataset.i));r.addEventListener('focus',()=>show(r.dataset.i))});
  show(rows[0].dataset.i);
  // when a filter hides the active project, jump to the first visible one
  new MutationObserver(()=>{const on=rows.find(r=>r.classList.contains('on'));if(on&&on.classList.contains('hide')){const f=rows.find(r=>!r.classList.contains('hide'));if(f)show(f.dataset.i)}}).observe(sc,{subtree:true,attributes:true,attributeFilter:['class']});
});

// ---------- About manifesto lines light up as you scroll ----------
const lines=$$('[data-scrub]');
if(lines.length){
  if(reduce)lines.forEach(l=>l.classList.add('lit'));
  else{const lit=()=>lines.forEach(l=>{const r=l.getBoundingClientRect();l.classList.toggle('lit',r.top<innerHeight*.72)});addEventListener('scroll',lit,{passive:true});lit()}
}

// ---------- Review switcher (home) ----------
$$('.rcar').forEach(C=>{
  const qs=$$('.rq',C),ns=$$('.rn',C);let i=0,timer;
  const show=k=>{i=k;qs.forEach((q,n)=>q.classList.toggle('on',n===k));ns.forEach((b,n)=>{b.classList.toggle('on',n===k);b.setAttribute('aria-pressed',n===k)})};
  const auto=()=>{clearInterval(timer);if(!reduce)timer=setInterval(()=>show((i+1)%qs.length),6500)};
  ns.forEach((b,k)=>b.addEventListener('click',()=>{show(k);auto()}));
  auto();
});

// ---------- Hero changing word: reserve room for the longest word ----------
// site.js swaps the word every few seconds; without this the line width changes
// and everything below the headline jumps.
$$('.rotating-word[data-words]').forEach(el=>{
  const words=el.dataset.words.split('|');
  const fit=()=>{
    const probe=el.cloneNode(false);
    probe.style.cssText='position:absolute;visibility:hidden;white-space:nowrap;min-width:0;display:inline-block';
    el.parentNode.appendChild(probe);
    let w=0;words.forEach(t=>{probe.textContent=t;w=Math.max(w,probe.getBoundingClientRect().width)});
    probe.remove();
    el.style.display='inline-block';el.style.minWidth=Math.ceil(w)+'px';
  };
  (document.fonts?document.fonts.ready:Promise.resolve()).then(fit);
  addEventListener('resize',fit);
});

// ---------- Cookie notice ----------
// Analytics only sets cookies after "Accept" (see the consent default in each page's <head>).
(()=>{
  const KEY='dfy-cookie-choice';
  let choice=null;try{choice=localStorage.getItem(KEY)}catch{}
  const P=/\/projects\//.test(location.pathname)?'../':'';
  const box=document.createElement('section');
  box.className='cookie';box.setAttribute('aria-label','Cookie notice');
  box.innerHTML=`<h2>Cookies on this site</h2><p>Designify uses cookies for basic analytics, to see which pages are helpful and improve the site. You can accept or decline. <a href="${P}policies.html#privacy">Privacy Policy</a></p><div class="cookie-actions"><button type="button" class="btn btn-primary" data-c="accepted">Accept</button><button type="button" class="btn btn-line" data-c="declined">Decline</button></div>`;
  document.body.appendChild(box);
  const show=()=>{box.hidden=false;requestAnimationFrame(()=>box.classList.add('show'))};
  const hide=()=>{box.classList.remove('show');setTimeout(()=>box.hidden=true,600)};
  box.addEventListener('click',e=>{
    const b=e.target.closest('[data-c]');if(!b)return;
    const c=b.dataset.c;try{localStorage.setItem(KEY,c)}catch{}
    if(typeof gtag==='function')gtag('consent','update',{analytics_storage:c==='accepted'?'granted':'denied'});
    hide();document.dispatchEvent(new CustomEvent('dfy:cookie-answered'));
  });
  $$('[data-cookie-settings]').forEach(l=>l.addEventListener('click',show));
  if(choice)box.hidden=true;else setTimeout(show,1200);
})();

// ---------- Slide-in special (settings in assets/site.js) ----------
const PROMO=typeof DESIGNIFY_PROMO!=='undefined'?DESIGNIFY_PROMO:null;
const promoLive=!!PROMO&&PROMO.enabled&&new Date()<=new Date(PROMO.endDate+'T23:59:59');
const ROOT=/\/projects\//.test(location.pathname)?'../':'';
(()=>{
  if(!promoLive)return;
  if(/contact\.html$|404\.html$/.test(location.pathname)||$('.nf'))return;
  const KEY='dfy-promo-'+PROMO.code;let seen=null;try{seen=localStorage.getItem(KEY)}catch{}
  if(seen)return;
  const remember=v=>{try{localStorage.setItem(KEY,v)}catch{}};
  const card=document.createElement('aside');card.className='promo';card.setAttribute('aria-label','Special offer');card.hidden=true;
  card.innerHTML=`<button type="button" class="promo-x" aria-label="Close"><i aria-hidden="true" class="fa-solid fa-xmark"></i></button>
    <span class="freebie"><i aria-hidden="true" class="fa-solid fa-gift"></i>${PROMO.tag}</span>
    <h2>${PROMO.title}</h2><p>${PROMO.text}</p>
    <a class="btn btn-primary promo-cta" href="${ROOT}contact.html?offer=${PROMO.code}">${PROMO.button} <i aria-hidden="true" class="fa-solid fa-arrow-right"></i></a>
    <small class="promo-terms">${PROMO.terms}</small>`;
  document.body.appendChild(card);
  const close=()=>{card.classList.remove('show');setTimeout(()=>card.hidden=true,500);remember('closed')};
  $('.promo-x',card).addEventListener('click',close);
  $('.promo-cta',card).addEventListener('click',()=>remember('claimed'));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&card.classList.contains('show'))close()});
  let shown=false;
  const show=()=>{if(shown)return;shown=true;card.hidden=false;requestAnimationFrame(()=>requestAnimationFrame(()=>card.classList.add('show')))};
  const arm=()=>{
    const t=setTimeout(show,20000);
    const onScroll=()=>{const d=document.documentElement;if(scrollY>(d.scrollHeight-innerHeight)*.5){show();clearTimeout(t);removeEventListener('scroll',onScroll)}};
    addEventListener('scroll',onScroll,{passive:true});
  };
  let cookie=null;try{cookie=localStorage.getItem('dfy-cookie-choice')}catch{}
  if(cookie)arm();else document.addEventListener('dfy:cookie-answered',arm,{once:true});
})();

// ---------- Offer carried into the Contact form (?offer=holiday15) ----------
(()=>{
  const form=$('#designifyProjectForm');if(!form||!PROMO)return;
  const code=new URLSearchParams(location.search).get('offer');
  if(!code||code!==PROMO.code)return;
  const label=`${PROMO.title} (${PROMO.terms})`;
  if(!promoLive){return}
  const hid=document.createElement('input');hid.type='hidden';hid.name='special_offer';hid.value=label;form.prepend(hid);
  const one=[...form.querySelectorAll('input[name="work_type"]')].find(x=>x.value==='One-Off Project');if(one)one.checked=true;
  const note=document.createElement('div');note.className='offer-applied';
  note.innerHTML=`<i aria-hidden="true" class="fa-solid fa-gift"></i><div><strong>${PROMO.title}: offer noted on your request</strong><span>${PROMO.terms}</span></div>`;
  form.prepend(note);
  form.dispatchEvent(new Event('change',{bubbles:true}));
})();

// ---------- Hide offer mentions once the special has ended ----------
if(!promoLive)$$('[data-promo]').forEach(el=>el.remove());

// ---------- Top strip on tablets & phones: items take turns ----------
(()=>{
  const items=$$('.announce-info>span,.announce-contact>a');if(!items.length)return;
  const mq=matchMedia('(max-width: 1100px)');let i=0,timer;
  const step=()=>{items.forEach((el,k)=>el.classList.toggle('on',k===i));i=(i+1)%items.length};
  const start=()=>{clearInterval(timer);items.forEach(el=>el.classList.remove('on'));if(mq.matches){i=items.length-1;step();if(!reduce)timer=setInterval(step,3500)}};
  mq.addEventListener?mq.addEventListener('change',start):mq.addListener(start);start();
})();
})();
