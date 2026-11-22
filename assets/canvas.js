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
    if(url.origin!==location.origin||url.pathname===location.pathname||!/^(?:\/$|\/(?:projects\/)?[a-z0-9-]+(?:\.html)?)$/.test(url.pathname))return;
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
    }else if(n.nodeType===1&&n.matches('.g')&&!n.matches('.rotating-word')){
      // Gradient words move as whole words: the animation sits on an outer span and the gradient on an inner one, which Safari can paint
      n.classList.add('g-split');
      const txt=n.textContent;n.textContent='';
      txt.split(/(\s+)/).forEach(part=>{
        if(!part)return;
        if(/^\s+$/.test(part)){n.appendChild(document.createTextNode(' '));return}
        const w=document.createElement('span');w.className='word gw';const t=document.createElement('span');t.className='gt';t.textContent=part;w.appendChild(t);w.style.transitionDelay=(0.15+i*0.025)+'s';i+=part.length;n.appendChild(w);
      });
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
if(st){const links=$$('a',st);
  // keep the highlighted tab in view when the row scrolls sideways on phones
  const mark=id=>links.forEach(a=>{const on=a.getAttribute('href')==='#'+id;a.classList.toggle('on',on);if(on&&st.scrollWidth>st.clientWidth)st.scrollTo({left:a.offsetLeft-(st.clientWidth-a.offsetWidth)/2,behavior:'smooth'})});
  const sio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)mark(e.target.id)}),{rootMargin:'-40% 0px -55% 0px'});
  // back above the first section: highlight the first tab again
  const first=$(links[0]&&links[0].getAttribute('href'));
  if(first)addEventListener('scroll',()=>{if(first.getBoundingClientRect().top>innerHeight*.4&&!links[0].classList.contains('on'))mark(first.id)},{passive:true});links.forEach(a=>{const s=$(a.getAttribute('href'));if(s)sio.observe(s)})}
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
  box.innerHTML=`<h2>Cookies on this site</h2><p>Designify uses cookies for basic analytics, to see which pages are helpful and improve the site. You can accept or decline. <a href="${P}/policies#privacy">Privacy Policy</a></p><div class="cookie-actions"><button type="button" class="btn btn-primary" data-c="accepted">Accept</button><button type="button" class="btn btn-line" data-c="declined">Decline</button></div>`;
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
  if(/\/contact(?:\.html)?$|\/404(?:\.html)?$/.test(location.pathname)||$('.nf'))return;
  const KEY='dfy-promo-'+PROMO.code;let seen=null;try{seen=localStorage.getItem(KEY)}catch{}
  if(seen)return;
  const remember=v=>{try{localStorage.setItem(KEY,v)}catch{}};
  const card=document.createElement('aside');card.className='promo';card.setAttribute('aria-label','Special offer');card.hidden=true;
  card.innerHTML=`<button type="button" class="promo-x" aria-label="Close"><i aria-hidden="true" class="fa-solid fa-xmark"></i></button>
    <span class="freebie"><i aria-hidden="true" class="fa-solid fa-gift"></i>${PROMO.tag}</span>
    <h2>${PROMO.title}</h2><p>${PROMO.text}</p>
    <a class="btn btn-primary promo-cta" href="/contact?offer=${PROMO.code}">${PROMO.button} <i aria-hidden="true" class="fa-solid fa-arrow-right"></i></a>
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

// ---------- Services: the process path fills and each step lights up as you scroll ----------
(()=>{
  const s=document.querySelector('#process .steps');if(!s)return;
  s.classList.add('path');
  const head=document.createElement('span');head.className='path-head';head.setAttribute('aria-hidden','true');s.appendChild(head);
  const steps=[...s.querySelectorAll('.step')],n=steps.length;
  if(reduce){s.style.setProperty('--p',1);steps.forEach(x=>x.classList.add('lit'));return}
  const set=p=>{s.style.setProperty('--p',p.toFixed(3));steps.forEach((x,k)=>x.classList.toggle('lit',p>0&&p>=k/(n-1)-.02));s.classList.toggle('done',p>=1)};
  const vertical=matchMedia('(max-width: 900px)');
  // Phones (steps stacked): each step lights as you scroll down to it
  let raf=0;
  const follow=()=>{raf=0;if(!vertical.matches)return;
    const r=s.getBoundingClientRect();set(Math.min(1,Math.max(0,(innerHeight*.7-r.top)/r.height)))};
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(follow)},{passive:true});
  // Computers (steps in a row): once the row is in view, the path plays through on its own
  let played=false;
  const play=()=>{played=true;const t0=performance.now(),dur=2200;
    const tick=now=>{const t=Math.min(1,(now-t0)/dur);set(1-Math.pow(1-t,2));if(t<1)requestAnimationFrame(tick)};requestAnimationFrame(tick)};
  new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!vertical.matches&&!played)play()}),{threshold:.5}).observe(s);
  const mode=()=>{if(vertical.matches)follow();else if(played)set(1)};
  vertical.addEventListener?vertical.addEventListener('change',mode):vertical.addListener(mode);follow();
})();

// ---------- Homepage: 3D phone with a chat that plays on the screen ----------
(()=>{
  const sec=document.querySelector('.chat3d');if(!sec)return;
  const holder=sec.querySelector('.chat3d-phone'),now=sec.querySelector('.chat3d-now b');
  const pops=[...sec.querySelectorAll('.chat-pop')];
  // headline: words rise in, then "one text away." types itself
  const a=sec.querySelector('.ct-a');a.innerHTML=a.textContent.split(' ').map((w,i)=>`<span class="w" style="transition-delay:${i*.07}s">${w}</span>`).join(' ');
  const typed=sec.querySelector('.ct-typed'),full=typed.textContent;
  const type=()=>{if(reduce)return;let i=0;typed.textContent='';const t=setInterval(()=>{typed.textContent=full.slice(0,++i);if(i>=full.length)clearInterval(t)},70)};
  // the chat: each project has 4 screens (ask, typing, design sent, reaction)
  const chats=[['epic-eats','Epic Eats flyer'],['social','Social media management'],['tre-hair','TRE Hair price list'],['website','Website updates'],['crumbles-cookies','Crumbles & Cookies launch']];
  const frames=[];chats.forEach(([slug,name])=>[0,1,2,3].forEach(k=>frames.push({src:`/assets/3d/chat/chat-${slug}-${k}.jpg`,name,k})));
  const hold=[1300,1100,2300,2600];
  const pop=k=>{const el=pops[{0:0,2:2,3:1}[k]];if(!el)return;pops.forEach(p=>p.classList.remove('show'));el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1800)};
  let started=false,visible=false,spinAt=0;
  const start=()=>{if(started)return;started=true;type();
    window.ModelViewerElement=Object.assign(window.ModelViewerElement||{},{meshoptDecoderLocation:'/assets/vendor/meshopt_decoder.js'});
    const s=document.createElement('script');s.type='module';s.src='/assets/vendor/model-viewer.min.js';document.head.appendChild(s);
    const mv=document.createElement('model-viewer');
    Object.entries({src:holder.dataset.model,'camera-controls':'','disable-zoom':'','disable-pan':'','interaction-prompt':'none','camera-orbit':'-14deg 84deg auto','min-camera-orbit':'auto 60deg auto','max-camera-orbit':'auto 110deg auto','field-of-view':'24deg','shadow-intensity':'0.9','shadow-softness':'1','exposure':'1.05','tone-mapping':'neutral','environment-image':'neutral','loading':'eager',alt:holder.getAttribute('aria-label')}).forEach(([k,v])=>mv.setAttribute(k,v));
    const bar=document.createElement('div');bar.slot='progress-bar';mv.appendChild(bar);
    holder.appendChild(mv);
    mv.addEventListener('load',async()=>{
      const mat=mv.model.materials.find(m=>m.name==='COLOUR_Silver_Screen');if(!mat)return;
      // screens load a conversation at a time (the next one is fetched while the current one plays)
      const tex=[],get=k=>tex[k]||(tex[k]=mv.createTexture(frames[k].src));
      const preload=k=>{const c=Math.floor(k/4)*4;for(let j=c;j<c+8&&j<frames.length+4;j++)get(j%frames.length)};
      await Promise.all([0,1,2,3].map(get));preload(0);
      mat.setEmissiveFactor([1,1,1]);
      let i=0,shown=0;const show=async()=>{const f=frames[i];preload(i);mat.emissiveTexture.setTexture(await get(i));
        if(now&&now.textContent!==f.name){now.style.opacity=0;setTimeout(()=>{now.textContent=f.name;now.style.opacity=1},250)}
        pop(f.k);
        // incoming message: the phone buzzes; a new conversation: it does a quick spin
        if(!reduce&&shown++&&(f.k===0||f.k===3)){holder.classList.remove('buzz');void holder.offsetWidth;holder.classList.add('buzz')}
        if(!reduce&&f.k===0&&i>0)spinAt=performance.now()};
      show();holder.classList.add('ready');
      const loop=()=>{setTimeout(()=>{if(visible&&!reduce){i=(i+1)%frames.length;show()}loop()},hold[frames[i].k])};loop();
      // gentle sway; pauses while someone spins the phone
      let user=false,idle=0,t0=performance.now();
      mv.addEventListener('pointerdown',()=>{user=true;clearTimeout(idle)});
      addEventListener('pointerup',()=>{if(user){idle=setTimeout(()=>user=false,2500)}});
      const sway=now=>{if(!user&&visible&&!reduce){const t=(now-t0)/1000;let spin=0;if(spinAt){const u=Math.min(1,(now-spinAt)/900);spin=360*(1-Math.pow(1-u,3));if(u>=1)spinAt=0}mv.cameraOrbit=`${-14+16*Math.sin(t*.6)+spin}deg ${84+3*Math.sin(t*.45)}deg auto`;if(spin)mv.jumpCameraToGoal()}requestAnimationFrame(sway)};requestAnimationFrame(sway);
    });
  };
  new IntersectionObserver(es=>es.forEach(e=>{visible=e.isIntersecting;if(e.isIntersecting){sec.classList.add('in');start()}}),{rootMargin:'200px 0px'}).observe(sec);
})();

// ---------- Spin the wheel giveaway (settings: DESIGNIFY_SPIN in site.js) ----------
(()=>{
  const C=typeof DESIGNIFY_SPIN!=='undefined'?DESIGNIFY_SPIN:null;if(!C||!C.enabled||!C.prizes||!C.prizes.length)return;
  let preview=false;try{if(new URLSearchParams(location.search).get('spin')==='preview')sessionStorage.setItem('dfy-spin-preview','1');preview=sessionStorage.getItem('dfy-spin-preview')==='1'}catch(e){}
  const now=new Date(),live=now>=new Date(C.startDate+'T00:00:00')&&now<=new Date(C.endDate+'T23:59:59');
  const claimDate=new Date(C.claimBy+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const KEY='dfy-spin-'+C.startDate;
  const saved=()=>{if(preview)return null;try{return JSON.parse(localStorage.getItem(KEY)||'null')}catch(e){return null}};

  // Contact form: carry a won prize into the request (?offer=SPIN10)
  const form=document.getElementById('designifyProjectForm');
  const offer=new URLSearchParams(location.search).get('offer');
  const won=offer&&C.prizes.find(p=>p.code===offer);
  if(form&&won&&(preview||now<=new Date(C.claimBy+'T23:59:59'))){
    const label=`${C.title}: ${won.label}, ${won.sub} (code ${won.code}, claim by ${claimDate}). ${C.terms}`;
    const hid=document.createElement('input');hid.type='hidden';hid.name='special_offer';hid.value=label;form.prepend(hid);
    const note=document.createElement('div');note.className='offer-applied';
    note.innerHTML=`<i aria-hidden="true" class="fa-solid fa-gift"></i><div><strong>${C.title} prize noted: ${won.label}, ${won.sub}</strong><span>Code ${won.code}. Claim by ${claimDate}.</span></div>`;
    form.prepend(note);form.dispatchEvent(new Event('change',{bubbles:true}));
  }
  if(!live&&!preview)return;

  // floating button
  const tab=document.createElement('button');tab.type='button';tab.className='spin-tab';
  tab.innerHTML='<span class="spin-tab-ic" aria-hidden="true"><i class="fa-solid fa-gift"></i></span><span class="spin-tab-t">Spin to win</span>';
  tab.setAttribute('aria-haspopup','dialog');document.body.appendChild(tab);

  // the wheel (drawn as SVG)
  const n=C.prizes.length,R=150,cols=['#9D2CFF','#D21CF2','#6B5CFF','#B51FF5'];
  const pt=(a,r)=>[(160+r*Math.sin(a)).toFixed(2),(160-r*Math.cos(a)).toFixed(2)];
  let slices='';C.prizes.forEach((p,i)=>{const a0=i*2*Math.PI/n,a1=(i+1)*2*Math.PI/n,[x0,y0]=pt(a0,R),[x1,y1]=pt(a1,R),mid=(i+.5)*360/n;
    slices+=`<path d="M160 160 L${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1} Z" fill="${p.grand?'url(#swGold)':cols[i%cols.length]}"/>`+
      `<g transform="rotate(${mid-90} 160 160)"><text x="296" y="165" text-anchor="end" class="sw-l${p.grand?' sw-gold':''}">${p.wheel||p.label}</text></g>`});
  let dots='';for(let i=0;i<n*2;i++){const [x,y]=pt(i*Math.PI/n,R+9);dots+=`<circle cx="${x}" cy="${y}" r="3.2" class="sw-dot"/>`}
  const wheel=`<svg viewBox="0 0 320 320" class="sw-svg" aria-hidden="true"><defs><linearGradient id="swGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE48A"/><stop offset=".5" stop-color="#FFC83D"/><stop offset="1" stop-color="#F59E0B"/></linearGradient></defs><circle cx="160" cy="160" r="${R+18}" class="sw-rim"/><g class="sw-rot">${slices}</g>${dots}<circle cx="160" cy="160" r="34" class="sw-hub"/><text x="160" y="166" text-anchor="middle" class="sw-hub-t">SPIN</text></svg>`;

  const ov=document.createElement('div');ov.className='spin-ov';ov.hidden=true;
  ov.innerHTML=`<div class="spin-card" role="dialog" aria-modal="true" aria-labelledby="spinTitle">
    <button type="button" class="spin-x" aria-label="Close"><i aria-hidden="true" class="fa-solid fa-xmark"></i></button>
    <div class="spin-wheel"><span class="sw-ptr" aria-hidden="true"></span>${wheel}<div class="spin-confetti" aria-hidden="true"></div></div>
    <div class="spin-side">
      <span class="spin-tag"><i aria-hidden="true" class="fa-solid fa-gift"></i> ${C.title}${preview&&!live?' · preview':''}</span>
      <h2 id="spinTitle">Spin to win a <span class="g">design treat.</span></h2>
      <form class="spin-form" novalidate>
        <p>Every spin wins something: discounts, freebies and a rare grand prize. Enter your details to spin.</p>
        <label class="spin-f"><span>Email</span><input type="email" name="email" autocomplete="email" required placeholder="you@business.com"/></label>
        <label class="spin-f"><span>WhatsApp <em>(optional)</em></span><input type="tel" name="whatsapp" autocomplete="tel" placeholder="+1 (246) …"/></label>
        <label class="spin-ok"><input type="checkbox" required/> <span>Send me my prize and occasional Designify updates. I can unsubscribe any time.</span></label>
        <button class="btn btn-primary spin-go" type="submit">Spin the Wheel <i aria-hidden="true" class="fa-solid fa-arrow-rotate-right"></i></button>
        <small class="spin-terms">${C.terms}</small>
      </form>
      <div class="spin-res" hidden aria-live="polite"></div>
    </div></div>`;
  document.body.appendChild(ov);
  const rot=ov.querySelector('.sw-rot'),res=ov.querySelector('.spin-res'),f=ov.querySelector('.spin-form'),card=ov.querySelector('.spin-card');
  let lastFocus=null;
  const open=()=>{lastFocus=document.activeElement;ov.hidden=false;requestAnimationFrame(()=>ov.classList.add('on'));const s=saved();if(s)showResult(C.prizes[s.i],false);else setTimeout(()=>f.email.focus(),300)};
  const close=()=>{ov.classList.remove('on');setTimeout(()=>{ov.hidden=true;lastFocus&&lastFocus.focus()},300)};
  tab.addEventListener('click',open);ov.querySelector('.spin-x').addEventListener('click',close);
  ov.addEventListener('click',e=>{if(e.target===ov)close()});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!ov.hidden)close()});
  // after a while on the page the button gives a little wiggle to get noticed
  if(!saved()&&!reduce)setTimeout(()=>tab.classList.add('wiggle'),6000);

  const showResult=(p,fresh)=>{
    f.hidden=true;res.hidden=false;
    const isList=p.code==='SPINLIST';
    res.innerHTML=`<span class="spin-won">${p.grand?'★ Grand prize! ':''}${fresh?'You won!':'Your prize'}</span><h3>${p.label}</h3><p>${p.sub.charAt(0).toUpperCase()+p.sub.slice(1)}.</p>
      <div class="spin-code"><span>Your code</span><b>${p.code}</b></div><small>Claim by ${claimDate}. ${C.terms}</small>
      <div class="hero-actions">${isList?'<a class="btn btn-primary" href="/assets/designify-brand-checklist.pdf" download><i aria-hidden="true" class="fa-solid fa-download"></i> Get the Checklist</a><a class="btn btn-line" href="/contact">Start a Project</a>':`<a class="btn btn-primary" href="/contact?offer=${p.code}">Claim My Prize <i aria-hidden="true" class="fa-solid fa-arrow-right"></i></a>`}</div>
      ${preview?'<small class="spin-prev">Preview mode: entries are not sent and you can spin again after reloading.</small>':''}`;
  };
  const confetti=()=>{if(reduce)return;const box=ov.querySelector('.spin-confetti');box.innerHTML='';
    for(let i=0;i<70;i++){const c=document.createElement('i');const a=Math.random()*Math.PI*2,d=120+Math.random()*190;
      c.style.cssText=`--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d-60}px;--r:${Math.random()*720-360}deg;background:${['#9D2CFF','#D21CF2','#4D8BFF','#FFC83D','#fff'][i%5]};animation-delay:${Math.random()*.15}s`;box.appendChild(c)}
    setTimeout(()=>box.innerHTML='',2200)};

  let spinning=false,turned=0;
  f.addEventListener('submit',e=>{e.preventDefault();if(spinning)return;if(!f.reportValidity())return;spinning=true;
    const total=C.prizes.reduce((a,p)=>a+p.weight,0);let r=Math.random()*total,i=0;for(;i<n;i++){r-=C.prizes[i].weight;if(r<0)break}i=Math.min(i,n-1);
    const p=C.prizes[i];
    if(!preview){
      try{localStorage.setItem(KEY,JSON.stringify({i,code:p.code,t:Date.now()}))}catch(e){}
      const fd=new FormData();fd.append('_subject',`${C.title}: ${p.label} won`);fd.append('_captcha','false');fd.append('_template','table');
      fd.append('email',f.email.value);fd.append('whatsapp',f.whatsapp.value||'Not given');fd.append('prize',`${p.label}, ${p.sub}`);fd.append('code',p.code);fd.append('claim_by',claimDate);
      fetch('https://formsubmit.co/ajax/designifybim@gmail.com',{method:'POST',headers:{'Accept':'application/json'},body:fd}).catch(()=>{});
    }
    ov.querySelector('.spin-go').disabled=true;card.classList.add('spinning');card.scrollTo({top:0,behavior:reduce?'auto':'smooth'});document.activeElement&&document.activeElement.blur();
    const slice=360/n,target=360-(i+.5)*slice+(Math.random()-.5)*slice*.6;
    turned=turned-(turned%360)+360*(reduce?1:6)+target;
    rot.style.transition=`transform ${reduce?1:5}s cubic-bezier(.13,.68,.1,1)`;rot.style.transform=`rotate(${turned}deg)`;
    setTimeout(()=>{card.classList.remove('spinning');card.classList.add('won');confetti();showResult(p,true);spinning=false},reduce?1100:5200);
  });
})();
})();
