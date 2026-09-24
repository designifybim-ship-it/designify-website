import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const state = { user: null, profile: null, editingProjectId: null, editingContentId: null };
const ADMIN_REDIRECT_URL = 'https://designifybim-ship-it.github.io/designify-website/admin/';

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
const showMessage = (text, type = '') => { const box = $('#authMessage'); if (box) { box.textContent = text; box.className = `message ${type}`; } };
const showToast = (text, type = '') => { const box = $('#toast'); if (box) { box.textContent = text; box.className = `toast ${type}`; box.hidden = false; setTimeout(() => { box.hidden = true; }, 3600); } };
const formatDate = date => date ? new Intl.DateTimeFormat('en-BB', { dateStyle: 'medium' }).format(new Date(date)) : '—';

function switchView(view) {
  $$('.view').forEach(section => { section.hidden = section.dataset.view !== view; });
  $$('.side-nav button').forEach(button => button.classList.toggle('active', button.dataset.view === view));
}

async function loadProfile(user) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (error) throw error;
  state.profile = data;
  $('#accountName').textContent = data.full_name || data.email || user.email;
  $('#accountRole').textContent = `${data.role} access`;
  return data;
}

async function showSession(session) {
  state.user = session?.user || null;
  if (!state.user) {
    $('#authShell').hidden = false;
    $('#appShell').hidden = true;
    return;
  }

  try {
    const profile = await loadProfile(state.user);
    $('#authShell').hidden = true;
    $('#appShell').hidden = false;
    const isAdmin = profile.role === 'owner' || profile.role === 'admin';
    $$('.admin-only').forEach(element => { element.hidden = !isAdmin; });
    $$('.view').forEach(section => { section.hidden = isAdmin ? section.dataset.view !== 'overview' : section.dataset.view !== 'client'; });
    $('#clientPortal').hidden = isAdmin;
    if (isAdmin) {
      switchView('overview');
      await Promise.all([loadOverview(), loadEnquiries(), loadProjects(), loadContent(), loadMedia()]);
    } else {
      await loadClientPortal();
    }
  } catch (error) {
    await supabase.auth.signOut();
    showMessage('Your account was created, but it still needs Designify admin or client access.', 'error');
  }
}

async function loadOverview() {
  const [enquiries, newEnquiries, projects, content] = await Promise.all([
    supabase.from('enquiries').select('id', { count: 'exact', head: true }),
    supabase.from('enquiries').select('id', { count: 'exact', head: true }).eq('status', 'new'),
    supabase.from('projects').select('id', { count: 'exact', head: true }),
    supabase.from('site_content').select('id', { count: 'exact', head: true })
  ]);
  $('#statEnquiries').textContent = enquiries.count ?? 0;
  $('#statNew').textContent = newEnquiries.count ?? 0;
  $('#statProjects').textContent = projects.count ?? 0;
  $('#statContent').textContent = content.count ?? 0;
}

async function loadEnquiries() {
  const { data, error } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  const body = $('#enquiriesBody');
  if (!data?.length) { body.innerHTML = '<tr><td colspan="5" class="empty">No enquiries have been received yet.</td></tr>'; return; }
  body.innerHTML = data.map(item => `<tr>
    <td><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.business || item.email)}</small></td>
    <td>${escapeHtml((item.services || []).slice(0, 2).join(', ') || 'General enquiry')}<small>${escapeHtml(item.work_type || '')}</small></td>
    <td>${escapeHtml(item.details || '')}</td>
    <td><select data-enquiry-status="${item.id}"><option value="new" ${item.status === 'new' ? 'selected' : ''}>New</option><option value="contacted" ${item.status === 'contacted' ? 'selected' : ''}>Contacted</option><option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>In progress</option><option value="converted" ${item.status === 'converted' ? 'selected' : ''}>Converted</option><option value="closed" ${item.status === 'closed' ? 'selected' : ''}>Closed</option></select></td>
    <td><small>${formatDate(item.created_at)}</small><a class="table-link" href="mailto:${escapeHtml(item.email)}">Email</a></td>
  </tr>`).join('');
  $$('[data-enquiry-status]').forEach(select => select.addEventListener('change', async event => {
    const { error: updateError } = await supabase.from('enquiries').update({ status: event.target.value }).eq('id', event.target.dataset.enquiryStatus);
    if (updateError) showToast('Could not update enquiry.', 'error'); else { showToast('Enquiry updated.', 'success'); loadOverview(); }
  }));
}

function resetProjectForm() {
  state.editingProjectId = null;
  $('#projectForm').reset();
  $('#projectFormTitle').textContent = 'Add a project';
  $('#projectSaveButton').textContent = 'Save project';
}

async function loadProjects() {
  const { data, error } = await supabase.from('projects').select('*').order('sort_order').order('created_at', { ascending: false });
  if (error) throw error;
  const list = $('#projectList');
  if (!data?.length) { list.innerHTML = '<div class="empty">No projects added yet.</div>'; return; }
  list.innerHTML = data.map(item => `<article class="panel project-row"><div><h4>${escapeHtml(item.title)}</h4><p>${escapeHtml(item.client_name || 'No client name')} · ${escapeHtml(item.category || 'Uncategorised')}</p><span class="tag">${escapeHtml(item.status)}${item.published ? ' · published' : ' · draft'}</span></div><button class="btn btn-soft" data-edit-project="${item.id}">Edit</button></article>`).join('');
  $$('[data-edit-project]').forEach(button => button.addEventListener('click', () => {
    const item = data.find(project => project.id === button.dataset.editProject);
    if (!item) return;
    state.editingProjectId = item.id;
    $('#projectFormTitle').textContent = 'Edit project';
    $('#projectSaveButton').textContent = 'Update project';
    for (const [key, value] of Object.entries({ title: item.title, slug: item.slug, client_name: item.client_name, category: item.category, status: item.status, excerpt: item.excerpt, description: item.description, cover_url: item.cover_url })) {
      const field = $(`#projectForm [name="${key}"]`); if (field) field.value = value || '';
    }
    $('#projectPublished').checked = item.published;
    $('#projectFeatured').checked = item.featured;
    $('#projectForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

async function saveProject(event) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const title = formData.get('title')?.toString().trim();
  const slug = (formData.get('slug')?.toString().trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  const payload = { title, slug, client_name: formData.get('client_name') || null, category: formData.get('category') || null, status: formData.get('status'), excerpt: formData.get('excerpt') || null, description: formData.get('description') || null, cover_url: formData.get('cover_url') || null, published: $('#projectPublished').checked, featured: $('#projectFeatured').checked, updated_by: state.user.id };
  const request = state.editingProjectId ? supabase.from('projects').update(payload).eq('id', state.editingProjectId) : supabase.from('projects').insert({ ...payload, created_by: state.user.id });
  const { error } = await request;
  if (error) { showToast(error.message, 'error'); return; }
  showToast(state.editingProjectId ? 'Project updated.' : 'Project added.', 'success');
  resetProjectForm();
  await Promise.all([loadProjects(), loadOverview()]);
}

async function loadContent() {
  const { data, error } = await supabase.from('site_content').select('*').order('section').order('content_key');
  if (error) throw error;
  const list = $('#contentList');
  if (!data?.length) { list.innerHTML = '<div class="empty">No editable content has been added yet.</div>'; return; }
  list.innerHTML = data.map(item => `<article class="panel content-row"><div><strong>${escapeHtml(item.title || item.content_key)}</strong><small>${escapeHtml(item.section)} · ${item.published ? 'Published' : 'Draft'}</small></div><button class="btn btn-soft" data-edit-content="${item.id}">Edit</button></article>`).join('');
  $$('[data-edit-content]').forEach(button => button.addEventListener('click', () => {
    const item = data.find(content => content.id === button.dataset.editContent);
    if (!item) return;
    state.editingContentId = item.id;
    const content = item.content || {};
    $('#contentTitle').value = item.title || '';
    $('#contentHeadline').value = content.headline || '';
    $('#contentSubtext').value = content.subtext || '';
    $('#contentActive').checked = content.active !== false;
    $('#contentPublished').checked = item.published;
    $('#contentEditor').hidden = false;
    $('#contentEditor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
}

async function saveContent(event) {
  event.preventDefault();
  if (!state.editingContentId) return;
  const payload = { title: $('#contentTitle').value.trim(), published: $('#contentPublished').checked, content: { headline: $('#contentHeadline').value.trim(), subtext: $('#contentSubtext').value.trim(), active: $('#contentActive').checked }, updated_by: state.user.id };
  const { error } = await supabase.from('site_content').update(payload).eq('id', state.editingContentId);
  if (error) { showToast(error.message, 'error'); return; }
  showToast('Site content updated.', 'success');
  $('#contentEditor').hidden = true;
  await loadContent();
}

async function loadMedia() {
  const { data, error } = await supabase.from('media_assets').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const grid = $('#mediaGrid');
  if (!data?.length) { grid.innerHTML = '<div class="empty">No media uploaded yet.</div>'; return; }
  grid.innerHTML = data.map(item => `<article class="panel media-card"><img src="${escapeHtml(item.is_public ? `${SUPABASE_URL}/storage/v1/object/public/designify-public/${item.path}` : '')}" alt="${escapeHtml(item.alt_text || item.file_name)}"/><div class="media-meta"><strong>${escapeHtml(item.file_name)}</strong><small>${item.is_public ? 'Public asset' : 'Private asset'}</small></div></article>`).join('');
}

async function uploadMedia(event) {
  event.preventDefault();
  const file = $('#mediaFile').files[0];
  if (!file) return;
  const safeName = file.name.toLowerCase().replace(/[^a-z0-9.]+/g, '-');
  const path = `${state.user.id}/${Date.now()}-${safeName}`;
  const bucket = $('#mediaPublic').checked ? 'designify-public' : 'designify-private';
  const { error: uploadError } = await supabase.storage.from(bucket).upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (uploadError) { showToast(uploadError.message, 'error'); return; }
  const { error: insertError } = await supabase.from('media_assets').insert({ path, file_name: file.name, mime_type: file.type, size_bytes: file.size, alt_text: $('#mediaAlt').value.trim() || null, is_public: bucket === 'designify-public', uploaded_by: state.user.id });
  if (insertError) { showToast(insertError.message, 'error'); return; }
  event.currentTarget.reset();
  showToast('Media uploaded.', 'success');
  await loadMedia();
}

async function loadClientPortal() {
  $('#clientProjectList').innerHTML = '<div class="empty">Loading your project space…</div>';
  const { data, error } = await supabase.from('project_members').select('member_role, projects(id,title,category,status,description,project_updates(title,status,note,due_date,sort_order))').eq('user_id', state.user.id);
  if (error) { $('#clientProjectList').innerHTML = '<div class="empty">Your client space is ready, but no projects have been assigned yet.</div>'; return; }
  if (!data?.length) { $('#clientProjectList').innerHTML = '<div class="empty">No projects have been assigned to your account yet.</div>'; return; }
  $('#clientProjectList').innerHTML = data.map(item => { const project = item.projects; return `<article class="panel portal-project"><span class="tag">${escapeHtml(project.status)}</span><h3>${escapeHtml(project.title)}</h3><p>${escapeHtml(project.description || 'Project details will appear here as they are added.')}</p><strong>Project updates</strong>${(project.project_updates || []).sort((a, b) => a.sort_order - b.sort_order).map(update => `<p>• ${escapeHtml(update.title)}: ${escapeHtml(update.status)}${update.note ? ` · ${escapeHtml(update.note)}` : ''}</p>`).join('') || '<p>No updates added yet.</p>'}</article>`; }).join('');
}

$('#signInForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  showMessage('Signing in…');
  const { data, error } = await supabase.auth.signInWithPassword({ email: formData.get('email'), password: formData.get('password') });
  if (error) { showMessage(error.message, 'error'); return; }
  showMessage('Signed in.', 'success');
  await showSession(data.session);
});

$('#signUpForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  showMessage('Creating your account…');
  const { data, error } = await supabase.auth.signUp({ email: formData.get('email'), password: formData.get('password'), options: { emailRedirectTo: ADMIN_REDIRECT_URL, data: { full_name: formData.get('full_name') } } });
  if (error) { showMessage(error.message, 'error'); return; }
  if (!data.session) { showMessage('Account created. Check your email to confirm it, then sign in.', 'success'); return; }
  await showSession(data.session);
});

$('#resendForm')?.addEventListener('submit', async event => {
  event.preventDefault();
  const email = new FormData(event.currentTarget).get('email');
  showMessage('Resending the confirmation email…');
  const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: ADMIN_REDIRECT_URL } });
  if (error) { showMessage(error.message, 'error'); return; }
  showMessage('A new confirmation email was requested. Check spam or junk as well.', 'success');
});

$('#signOutButton')?.addEventListener('click', () => supabase.auth.signOut());
$$('[data-view]').forEach(button => button.addEventListener('click', () => switchView(button.dataset.view)));
$('#projectForm')?.addEventListener('submit', saveProject);
$('#newProjectButton')?.addEventListener('click', resetProjectForm);
$('#newProjectButtonBottom')?.addEventListener('click', resetProjectForm);
$('#contentForm')?.addEventListener('submit', saveContent);
$('#closeContentEditor')?.addEventListener('click', () => { $('#contentEditor').hidden = true; });
$('#mediaForm')?.addEventListener('submit', uploadMedia);

supabase.auth.onAuthStateChange((_event, session) => { setTimeout(() => showSession(session), 0); });
const authError = new URLSearchParams(window.location.hash.slice(1));
if (authError.get('error_code') === 'otp_expired') showMessage('That confirmation link expired. Request a new one below.');
showSession(null);
