import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const pageKey = (() => {
  const path = window.location.pathname.replace(/\/+$/, '');
  const relative = path.split('/designify-website/')[1] || path.split('/').pop() || 'index.html';
  return relative.replace(/\.html$/, '') || 'index';
})();

const editableSelector = 'h1,h2,h3,h4,h5,p,span,strong,small,li,a,button,label';
const ignoredTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'INPUT', 'TEXTAREA', 'SELECT']);
const state = { overrides: {}, seo: {}, originals: {}, editor: new URLSearchParams(window.location.search).has('cms_edit') };

function domPath(element) {
  const parts = [];
  let current = element;
  while (current && current.nodeType === 1 && current !== document.body) {
    let index = 1;
    let sibling = current.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === current.tagName) index += 1;
      sibling = sibling.previousElementSibling;
    }
    parts.unshift(`${current.tagName.toLowerCase()}:nth-of-type(${index})`);
    current = current.parentElement;
  }
  return parts.join('>');
}

function cleanHtml(value) {
  const template = document.createElement('template');
  template.innerHTML = value;
  template.content.querySelectorAll('script,style,iframe,object,embed,form,input,textarea,select').forEach(node => node.remove());
  template.content.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attribute => {
      if (attribute.name.toLowerCase().startsWith('on')) node.removeAttribute(attribute.name);
      if ((attribute.name === 'href' || attribute.name === 'src') && /^javascript:/i.test(attribute.value)) node.removeAttribute(attribute.name);
    });
  });
  return template.innerHTML;
}

function markElements() {
  document.querySelectorAll(editableSelector).forEach(element => {
    if (ignoredTags.has(element.tagName) || !element.textContent.trim()) return;
    const path = domPath(element);
    element.dataset.cmsPath = path;
    state.originals[path] = element.innerHTML;
    if (state.overrides[path]?.kind === 'html') element.innerHTML = cleanHtml(state.overrides[path].value);
  });
  document.querySelectorAll('img').forEach(element => {
    const path = domPath(element);
    element.dataset.cmsPath = path;
    state.originals[path] = { src: element.getAttribute('src') || '', alt: element.getAttribute('alt') || '' };
    const override = state.overrides[path];
    if (override?.kind === 'attributes') {
      if (override.value.src !== undefined) element.setAttribute('src', override.value.src);
      if (override.value.alt !== undefined) element.setAttribute('alt', override.value.alt);
    }
  });
  document.querySelectorAll('a').forEach(element => {
    const path = domPath(element);
    element.dataset.cmsPath = path;
    const override = state.overrides[path];
    if (override?.kind === 'attributes' && override.value.href !== undefined) element.setAttribute('href', override.value.href);
  });
}

function applySeo() {
  const seo = state.seo || {};
  if (seo.title) document.title = seo.title;
  const setMeta = (selector, attribute, value) => {
    if (!value) return;
    let meta = document.querySelector(selector);
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute(attribute, selector.includes('property=') ? selector.match(/property="([^"]+)/)?.[1] || '' : selector.match(/name="([^"]+)/)?.[1] || ''); document.head.appendChild(meta); }
    meta.setAttribute('content', value);
  };
  setMeta('meta[name="description"]', 'name', seo.description);
  setMeta('meta[property="og:title"]', 'property', seo.title);
  setMeta('meta[property="og:description"]', 'property', seo.description);
  setMeta('meta[property="og:image"]', 'property', seo.og_image);
  setMeta('meta[name="twitter:title"]', 'name', seo.title);
  setMeta('meta[name="twitter:description"]', 'name', seo.description);
  setMeta('meta[name="twitter:image"]', 'name', seo.og_image);
  if (seo.canonical) {
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
    link.href = seo.canonical;
  }
}

function currentState() {
  return { pageKey, overrides: state.overrides, seo: state.seo };
}

function enableEditor() {
  document.body.classList.add('designify-cms-editing');
  document.querySelectorAll('[data-cms-path]').forEach(element => {
    if (element.matches(editableSelector) && element.textContent.trim()) {
      element.contentEditable = 'true';
      element.addEventListener('input', () => {
        state.overrides[element.dataset.cmsPath] = { kind: 'html', value: element.innerHTML };
      });
      element.addEventListener('click', event => {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({ type: 'designify-cms-select', pageKey, path: element.dataset.cmsPath, kind: 'text', value: element.innerHTML }, '*');
      });
    }
  });
  document.querySelectorAll('img').forEach(element => {
    element.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      window.parent.postMessage({ type: 'designify-cms-select', pageKey, path: element.dataset.cmsPath, kind: 'image', value: { src: element.getAttribute('src') || '', alt: element.getAttribute('alt') || '' } }, '*');
    });
  });
  document.querySelectorAll('a').forEach(element => {
    element.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); });
  });
  window.parent.postMessage({ type: 'designify-cms-ready', ...currentState() }, '*');
}

window.addEventListener('message', event => {
  if (!event.data || !event.data.type) return;
  if (event.data.type === 'designify-cms-request-state') window.parent.postMessage({ type: 'designify-cms-state', ...currentState() }, '*');
  if (event.data.type === 'designify-cms-set-attribute') {
    const element = document.querySelector(`[data-cms-path="${CSS.escape(event.data.path)}"]`);
    if (!element) return;
    element.setAttribute(event.data.attribute, event.data.value || '');
    state.overrides[event.data.path] = { kind: 'attributes', value: { ...(state.overrides[event.data.path]?.value || {}), [event.data.attribute]: event.data.value || '' } };
    window.parent.postMessage({ type: 'designify-cms-state', ...currentState() }, '*');
  }
});

async function loadPage() {
  const { data } = await supabase.from('site_content').select('content,published').eq('content_key', `page:${pageKey}`).eq('published', true).maybeSingle();
  state.overrides = data?.content?.overrides || {};
  state.seo = data?.content?.seo || {};
  markElements();
  applySeo();
  if (state.editor) enableEditor();
}

loadPage();
