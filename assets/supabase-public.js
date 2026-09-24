import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from './supabase-config.js';

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const form = document.getElementById('designifyProjectForm');

if (form) {
  form.addEventListener('submit', async event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const serviceChoices = [...form.querySelectorAll('input[name="services"]')];
    if (serviceChoices.length && !serviceChoices.some(input => input.checked)) {
      const first = serviceChoices[0];
      first.setCustomValidity('Please select at least one service.');
      first.reportValidity();
      first.setCustomValidity('');
      first.closest('.builder-step')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (!form.reportValidity()) return;

    const formData = new FormData(form);
    const submit = form.querySelector('.builder-submit');
    const success = document.getElementById('formSuccessCard');
    const error = document.getElementById('formErrorCard');
    const originalLabel = submit?.textContent || 'Send Project Request';
    const value = name => formData.get(name) || null;

    if (success) success.hidden = true;
    if (error) error.hidden = true;
    if (submit) {
      submit.disabled = true;
      submit.textContent = 'Sending…';
    }

    const payload = {
      inquiry_type: 'project_request',
      name: value('name'),
      business: value('business'),
      email: value('email'),
      phone: value('phone'),
      contact_method: value('contact_method'),
      services: formData.getAll('services'),
      work_type: value('work_type'),
      monthly_package: value('monthly_package'),
      start_date: value('start_date'),
      budget: value('budget'),
      details: value('details'),
      inspiration: value('inspiration')
    };

    const { error: insertError } = await supabase.from('enquiries').insert(payload);

    if (insertError) {
      form.action = 'https://formsubmit.co/designifybim@gmail.com';
      form.method = 'POST';
      HTMLFormElement.prototype.submit.call(form);
      return;
    }

    form.reset();
    document.getElementById('customPackageImport')?.setAttribute('hidden', '');
    const summary = document.getElementById('projectSummary');
    if (summary) summary.textContent = 'Your selected services, work type and other choices will appear here before you send your request.';
    if (success) {
      success.hidden = false;
      success.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    if (submit) {
      submit.disabled = false;
      submit.textContent = originalLabel;
    }
  }, true);
}
