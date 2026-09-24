import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const tokenKey = 'designify_chat_token';
const conversationKey = 'designify_chat_conversation';
const token = sessionStorage.getItem(tokenKey) || crypto.randomUUID().replaceAll('-', '') + crypto.randomUUID().replaceAll('-', '');
sessionStorage.setItem(tokenKey, token);
const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { global: { headers: { 'x-chat-token': token } } });

const launcher = document.createElement('button');
launcher.className = 'designify-chat-launcher';
launcher.type = 'button';
launcher.setAttribute('aria-label', 'Open Designify chat');
launcher.innerHTML = '<i class="fa-solid fa-comment-dots" aria-hidden="true"></i>';

const panel = document.createElement('section');
panel.className = 'designify-chat-panel';
panel.hidden = true;
panel.innerHTML = `<div class="designify-chat-head"><strong>Chat with Designify</strong><small>Have a question? Send a message and I’ll get back to you.</small></div><div class="designify-chat-body" id="designifyChatMessages"><p class="designify-chat-note">Messages sent here go directly to Designify.</p></div><form class="designify-chat-form" id="designifyChatForm"><input name="name" placeholder="Your name" autocomplete="name"><input name="email" type="email" placeholder="Email (optional)" autocomplete="email"><textarea name="body" required placeholder="How can I help?"></textarea><button type="submit">Send message</button></form>`;
document.body.append(launcher, panel);

const messagesBox = panel.querySelector('#designifyChatMessages');
const form = panel.querySelector('#designifyChatForm');
let conversationId = sessionStorage.getItem(conversationKey);
let channel;

function addMessage(message) {
  const note = messagesBox.querySelector('.designify-chat-note');
  note?.remove();
  if (messagesBox.querySelector(`[data-chat-message="${message.id}"]`)) return;
  const item = document.createElement('div');
  item.dataset.chatMessage = message.id;
  item.className = `designify-chat-message ${message.sender_type === 'visitor' ? 'visitor' : ''}`;
  item.textContent = message.body;
  messagesBox.appendChild(item);
  messagesBox.scrollTop = messagesBox.scrollHeight;
}

async function loadMessages() {
  if (!conversationId) return;
  const { data } = await supabase.from('chat_messages').select('id,sender_type,body,created_at').eq('conversation_id', conversationId).order('created_at');
  (data || []).forEach(addMessage);
}

function subscribe() {
  if (!conversationId || channel) return;
  channel = supabase.channel(`designify-chat-${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` }, payload => addMessage(payload.new)).subscribe();
}

launcher.addEventListener('click', async () => { panel.hidden = !panel.hidden; if (!panel.hidden) { await loadMessages(); subscribe(); } });

form.addEventListener('submit', async event => {
  event.preventDefault();
  const data = new FormData(form);
  const body = data.get('body')?.toString().trim();
  if (!body) return;
  const button = form.querySelector('button');
  button.disabled = true;
  button.textContent = 'Sending…';
  try {
    if (!conversationId) {
      const conversation = { visitor_name: data.get('name') || null, visitor_email: data.get('email') || null, visitor_token: token, status: 'open' };
      const result = await supabase.from('chat_conversations').insert(conversation).select('id').single();
      if (result.error) throw result.error;
      conversationId = result.data.id;
      sessionStorage.setItem(conversationKey, conversationId);
      subscribe();
    }
    const result = await supabase.from('chat_messages').insert({ conversation_id: conversationId, sender_type: 'visitor', body }).select('id,sender_type,body,created_at').single();
    if (result.error) throw result.error;
    addMessage(result.data);
    form.querySelector('textarea').value = '';
  } catch (error) {
    const note = document.createElement('p');
    note.className = 'designify-chat-note';
    note.textContent = 'The message could not be sent. Please use the WhatsApp button instead.';
    messagesBox.appendChild(note);
  } finally {
    button.disabled = false;
    button.textContent = 'Send message';
  }
});
