// --- Catalog / create / preview foundation ---
const templateRegistry = window.LuuButTemplateRegistry || [];
const categories = [{ id: 'all', label: 'Tất cả' }, { id: 'love', label: '❤️ Tình yêu' }, { id: 'birthday', label: '🎂 Sinh nhật' }, { id: 'memory', label: '💌 Kỷ niệm' }, { id: 'proposal', label: '💍 Cầu hôn' }, { id: 'wedding', label: '💐 Đám cưới' }];
const STORAGE_KEY = 'luu-but-draft';
let activeCategory = 'all'; let selectedTemplate; let draft = {};
const $ = (selector) => document.querySelector(selector); const $$ = (selector) => [...document.querySelectorAll(selector)];
const money = (value) => new Intl.NumberFormat('vi-VN').format(value) + 'đ';
function renderCategories() { $('#category-list').innerHTML = categories.map((category) => `<button class="category-button ${category.id === activeCategory ? 'active' : ''}" data-category="${category.id}" type="button" role="tab">${category.label}</button>`).join(''); $$('.category-button').forEach((button) => button.addEventListener('click', () => { activeCategory = button.dataset.category; renderCategories(); renderTemplates(); })); }
function visualFor(template) { return template.thumbnail === 'birthday' ? '<div class="mini-birthday"><strong>Happy<br>birthday</strong></div>' : template.thumbnail === 'wedding' ? '<div class="mini-wedding"><strong>Vow<br>& Bloom</strong></div>' : '<div class="mini-love"><strong>Our<br>little<br>story</strong><small>made with love</small></div>'; }
function renderTemplates() { const items = templateRegistry.filter((template) => template.enabled && (activeCategory === 'all' || template.category === activeCategory)); const coming = templateRegistry.filter((template) => !template.enabled && (activeCategory === 'all' || template.category === activeCategory)); $('#template-grid').innerHTML = [...items, ...coming].map((template) => { const tierLabel = template.tier === 50 ? 'Standard' : template.tier === 150 ? 'Enhanced' : template.tier === 300 ? 'Premium' : 'Flagship'; return `<article class="template-card ${template.enabled ? '' : 'disabled'}" data-tier="${template.tier}"><div class="template-visual">${template.badge ? `<span class="card-badge">${template.badge}</span>` : ''}${visualFor(template)}</div><div class="template-info"><div class="card-tier">${tierLabel}</div><h3>${template.name}</h3><p>${template.description}</p><div class="card-bottom"><span class="card-price">${money(template.price)}</span><div class="card-actions">${template.enabled ? `<button class="small-button" data-preview="${template.id}" type="button">Xem mẫu</button><button class="small-button filled" data-create="${template.id}" type="button">Tạo ngay</button>` : '<span class="small-button">Sắp có</span>'}</div></div></div></article>`; }).join('') || '<p class="empty-state">Mẫu mới đang được viết tiếp.</p>'; $$('[data-preview]').forEach((button) => button.addEventListener('click', () => openPreview(button.dataset.preview))); $$('[data-create]').forEach((button) => button.addEventListener('click', () => openBuilder(button.dataset.create))); }
function slugify(value) { return String(value || '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'love-story'; }
function saveCoupleRecord(record) {
  const next = { ...record };
  const slug = next.slug || slugify(`${next.name1 || 'minh'}-${next.name2 || 'ngoc'}`);
  next.slug = slug;
  const map = JSON.parse(localStorage.getItem('loveWebsiteDataMap') || '{}');
  map[slug] = next;
  localStorage.setItem('loveWebsiteDataMap', JSON.stringify(map));
  localStorage.setItem('loveWebsiteData', JSON.stringify(next));
  return slug;
}
function normalizeCustomerData(template, customerData = {}) {
  const name1 = customerData.name1 || customerData.senderName || 'Minh';
  const name2 = customerData.name2 || customerData.receiverName || 'Ngọc';
  const album = Array.isArray(customerData.album) ? customerData.album.filter(Boolean) : [];
  const timeline = Array.isArray(customerData.timeline) ? customerData.timeline : [];
  const startDate = customerData.startDate || customerData.specialDate || '2025-02-14';
  const shortMessage = customerData.shortMessage || customerData.message || 'Một điều giản dị, nhưng rất đáng nhớ.';
  const loveLetter = customerData.loveLetter || customerData.letter || '';
  const finalMessage = customerData.finalMessage || 'Yêu em hơn mỗi ngày.';
  const avatar1 = customerData.avatar1 || customerData.photo1 || '';
  const avatar2 = customerData.avatar2 || customerData.photo2 || '';

  return {
    templateId: template.id,
    name1,
    name2,
    startDate,
    avatar1,
    avatar2,
    photos: album.length ? album : [avatar1, avatar2].filter(Boolean),
    timeline,
    shortMessage,
    loveLetter,
    finalMessage,
    musicUrl: customerData.musicUrl || customerData.music || '',
    customData: {
      qrContent: customerData.qrContent || '',
      templateId: template.id
    }
  };
}
function buildPreviewUrl(template, customerData = {}) {
  if (!customerData || Object.keys(customerData).length === 0) {
    return `preview.html?demo=1&template=${encodeURIComponent(template.id)}`;
  }
  const previewData = normalizeCustomerData(template, customerData);
  const slug = slugify(`${previewData.name1}-${previewData.name2}`);
  previewData.slug = slug;
  saveCoupleRecord(previewData);

  return `preview.html?slug=${encodeURIComponent(slug)}&template=${encodeURIComponent(template.id)}&data=${encodeURIComponent(JSON.stringify(previewData))}`;
}
function openPreview(id) {
  selectedTemplate = templateRegistry.find((template) => template.id === id);
  if (window.LuubutAnalytics && window.LuubutAnalytics.track) {
    window.LuubutAnalytics.track('view_template', { template_id: selectedTemplate.id, metadata: { source: 'preview_dialog' } });
  }
  $('#preview-category').textContent = selectedTemplate.categoryLabel; $('#preview-name').textContent = selectedTemplate.name; $('#preview-description').textContent = selectedTemplate.description; $('#preview-price').textContent = money(selectedTemplate.price); $('#preview-features').innerHTML = selectedTemplate.features.map((feature) => `<li>${feature}</li>`).join(''); $('#preview-iframe').src = buildPreviewUrl(selectedTemplate); $('#preview-dialog').showModal();
}
function fieldMarkup(field) { const required = field.required ? 'required' : ''; const multiple = field.multiple ? 'multiple' : ''; const accept = field.accept ? `accept="${field.accept}"` : ''; const placeholder = field.placeholder ? `placeholder="${field.placeholder}"` : ''; if (field.type === 'textarea') return `<label class="builder-field full"><span>${field.label}</span><textarea name="${field.id}" ${required} ${placeholder}></textarea></label>`; return `<label class="builder-field ${field.type === 'file' && field.multiple ? 'full' : ''}"><span>${field.label}</span><input name="${field.id}" type="${field.type}" ${required} ${multiple} ${accept} ${placeholder}></label>`; }
function openBuilder(id) {
  selectedTemplate = templateRegistry.find((template) => template.id === id);
  if (window.LuubutAnalytics && window.LuubutAnalytics.track) {
    window.LuubutAnalytics.track('start_create', { template_id: selectedTemplate.id });
  }
  draft = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); $('#builder-title').textContent = `Tạo ${selectedTemplate.name}`; $('#summary-template').textContent = selectedTemplate.name; $('#summary-price').textContent = money(selectedTemplate.price); $('#builder-form').innerHTML = `<div class="builder-form-grid">${selectedTemplate.schema.map(fieldMarkup).join('')}<label class="builder-check full"><input name="consent" type="checkbox" required> Tôi đồng ý dùng thông tin này để tạo preview.</label><p class="builder-message" id="builder-message"></p><div class="builder-actions"><button class="button primary" type="submit">Xem preview <span>→</span></button></div></div>`; Object.entries(draft).forEach(([key, value]) => { const input = $(`[name="${key}"]`); if (input && input.type !== 'file' && input.type !== 'checkbox') input.value = value; }); $('#builder-dialog').showModal(); $('#builder-form').addEventListener('submit', handleBuilderSubmit);
}
/*
async function handleBuilderSubmit(event) { event.preventDefault(); const formData = new FormData(event.currentTarget); const formValues = {}; const albumFiles = []; for (const [key, value] of formData.entries()) { if (key === 'consent') continue; if (key === 'album') { if (value instanceof File && value.size > 0) albumFiles.push(value); continue; } formValues[key] = value; } try { const fileFields = ['photo1', 'photo2', 'music']; for (const field of fileFields) { const file = formValues[field]; if (file instanceof File && file.size > 0) formValues[field] = await readFileAsDataUrl(file); else if (file instanceof File) formValues[field] = ''; } formValues.album = await Promise.all(albumFiles.map(readFileAsDataUrl)); } catch (error) { console.error('Customer media processing failed:', error); $('#builder-message').textContent = 'Không thể đọc ảnh hoặc nhạc. Vui lòng thử lại.'; return; } const requiredMissing = selectedTemplate.schema.filter((field) => field.required && !formValues[field.id]); if (requiredMissing.length) { $('#builder-message').textContent = `Vui lòng điền: ${requiredMissing.map((field) => field.label).join(', ')}.`; return; } draft = { ...draft, ...formValues, templateId: selectedTemplate.id }; if (window.LuubutAnalytics && window.LuubutAnalytics.track) { window.LuubutAnalytics.track('submit_order', { template_id: selectedTemplate.id, metadata: { source: 'builder_form' } }); } $('#builder-message').textContent = 'Đang tạo preview...'; try { const response = await fetch('/api/create-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalizeCustomerData(selectedTemplate, draft)) }); if (!response.ok) { const errorText = await response.text(); throw new Error(`create-draft HTTP ${response.status}: ${errorText}`); } const result = await response.json(); if (!result.success || !result.websiteId || !result.previewToken) throw new Error(result.error || 'Create-draft returned an incomplete response.'); const previewUrl = result.previewUrl || `/preview/${encodeURIComponent(result.previewToken)}`; try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: result.previewToken, template: selectedTemplate.id, updatedAt: Date.now() })); } catch (storageError) { console.warn('[builder] localStorage unavailable/full; continuing without local draft cache', storageError); } if (window.LuubutAnalytics && window.LuubutAnalytics.track) { window.LuubutAnalytics.track('website_created', { template_id: selectedTemplate.id, website_id: result.websiteId || null, metadata: { preview_url: previewUrl } }); } $('#builder-dialog').close(); $('#preview-iframe').src = previewUrl; $('#preview-dialog').dataset.fromBuilder = 'true'; $('#preview-dialog').dataset.websiteId = result.websiteId || ''; $('#preview-dialog').showModal(); } catch (error) { console.error('Create-draft frontend flow failed:', error); const statusMatch = String(error.message || '').match(/^create-draft HTTP (\d+)/); $('#builder-message').textContent = statusMatch ? `Không thể tạo preview (HTTP ${statusMatch[1]}). Vui lòng kiểm tra kích thước ảnh hoặc nhạc.` : 'Không thể tạo preview từ server. Vui lòng thử lại.'; } }
*/
async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `${response.status} ${response.statusText}`);
  }
  return await response.json();
}

async function uploadMediaFile(file, uploadId) {
  const signResponse = await fetchJson('/api/create-upload-url', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ uploadId, fileName: file.name, contentType: file.type, size: file.size }) });
  if (!signResponse.success || !signResponse.uploadUrl || !signResponse.publicUrl) throw new Error(signResponse.error || 'Media upload preparation returned an incomplete response.');
  const uploadResponse = await fetch(signResponse.uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  if (!uploadResponse.ok) { const errorText = await uploadResponse.text(); throw new Error(`media upload HTTP ${uploadResponse.status}: ${errorText}`); }
  return signResponse.publicUrl;
}

async function handleBuilderSubmit(event) {
  event.preventDefault();
  const submitButton = event.currentTarget.querySelector('button[type="submit"]');
  if (submitButton.disabled) return;
  submitButton.disabled = true;
  const formData = new FormData(event.currentTarget);
  const formValues = {};
  const albumFiles = [];
  for (const [key, value] of formData.entries()) {
    if (key === 'consent') continue;
    if (key === 'album') { if (value instanceof File && value.size > 0) albumFiles.push(value); continue; }
    formValues[key] = value;
  }
  try {
    const requiredMissing = selectedTemplate.schema.filter((field) => field.required && !formValues[field.id]);
    if (requiredMissing.length) throw new Error(`Vui lòng điền: ${requiredMissing.map((field) => field.label).join(', ')}.`);
    const uploadId = `${Date.now().toString(36)}-${crypto.randomUUID()}`;
    $('#builder-message').textContent = 'Đang tải ảnh và nhạc lên...';
    const photoFiles = ['photo1', 'photo2'].map((field) => formValues[field] instanceof File && formValues[field].size > 0 ? formValues[field] : null);
    const photoUrls = await Promise.all(photoFiles.map((file) => file ? uploadMediaFile(file, uploadId) : ''));
    const albumUrls = await Promise.all(albumFiles.map((file) => uploadMediaFile(file, uploadId)));
    const musicFile = formValues.music instanceof File && formValues.music.size > 0 ? formValues.music : null;
    const musicUrl = musicFile ? await uploadMediaFile(musicFile, uploadId) : '';
    draft = { ...draft, ...formValues, photo1: photoUrls[0], photo2: photoUrls[1], album: albumUrls, music: musicUrl, templateId: selectedTemplate.id };
    if (window.LuubutAnalytics && window.LuubutAnalytics.track) window.LuubutAnalytics.track('submit_order', { template_id: selectedTemplate.id, metadata: { source: 'builder_form' } });
    $('#builder-message').textContent = 'Đang tạo preview...';
    const result = await fetchJson('/api/create-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalizeCustomerData(selectedTemplate, draft)) });
    if (!result.success || !result.websiteId || !result.previewToken) throw new Error(result.error || 'Create-draft returned an incomplete response.');
    const previewUrl = result.previewUrl || `/preview/${encodeURIComponent(result.previewToken)}`;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: result.previewToken, template: selectedTemplate.id, updatedAt: Date.now() })); } catch (storageError) { console.warn('[builder] localStorage unavailable/full; continuing without local draft cache', storageError); }
    if (window.LuubutAnalytics && window.LuubutAnalytics.track) window.LuubutAnalytics.track('website_created', { template_id: selectedTemplate.id, website_id: result.websiteId || null, metadata: { preview_url: previewUrl } });
    $('#builder-dialog').close(); $('#preview-iframe').src = previewUrl; $('#preview-dialog').dataset.fromBuilder = 'true'; $('#preview-dialog').dataset.websiteId = result.websiteId || ''; $('#preview-dialog').showModal();
  } catch (error) {
    console.error('Builder preview flow failed:', error);
    $('#builder-message').textContent = String(error.message || '').startsWith('media upload') ? 'Không thể tải media lên. Vui lòng thử lại.' : String(error.message || '').startsWith('create-draft HTTP') ? `Không thể tạo preview (${error.message.match(/^create-draft HTTP (\d+)/)?.[1] || 'server error'}). Vui lòng thử lại.` : error.message || 'Không thể tạo preview. Vui lòng thử lại.';
  } finally { submitButton.disabled = false; }
}

$('#preview-create').addEventListener('click', async () => {
  const fromBuilder = $('#preview-dialog').dataset.fromBuilder === 'true';
  const websiteId = $('#preview-dialog').dataset.websiteId || '';
  $('#preview-dialog').close();
  delete $('#preview-dialog').dataset.fromBuilder;
  delete $('#preview-dialog').dataset.websiteId;

  if (fromBuilder) {
    if (!websiteId) {
      alert('Không tìm thấy website draft. Vui lòng tạo preview lại.');
      return;
    }

    try {
      const orderResult = await fetchJson('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ websiteId, templateId: selectedTemplate.id })
      });

      if (!orderResult.success) {
        throw new Error(orderResult.error || 'Không thể tạo đơn hàng.');
      }

      if (window.LuubutAnalytics && window.LuubutAnalytics.track) {
        window.LuubutAnalytics.track('submit_order', {
          template_id: selectedTemplate.id,
          website_id: websiteId,
          metadata: { order_reference: orderResult.orderReference || '', amount: String(orderResult.amount || 0) }
        });
      }

      const params = new URLSearchParams({
        order: orderResult.orderId || '',
        reference: orderResult.orderReference || '',
        template: selectedTemplate.id,
        websiteId
      });

      window.location.href = `/checkout.html?${params.toString()}`;
    } catch (error) {
      console.error('Create-order failed:', error);
      alert('Không thể tạo đơn hàng. Vui lòng thử lại.');
    }
    return;
  }

  openBuilder(selectedTemplate.id);
});

$$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
renderCategories();
renderTemplates();

function initializeRoute() {
  const params = new URLSearchParams(window.location.search);
  const route = params.get('route');
  if (route === 'create') {
    openBuilder('love-50-01');
  }
}

initializeRoute();

function renderTemplate(templateId, customerData = {}) {
  const template = templateRegistry.find((item) => item.id === templateId);
  if (!template) throw new Error(`Template không tồn tại: ${templateId}`);
  return { templateId, customerData, previewUrl: template.preview, schema: template.schema };
}

window.LuuButPlatform = { templateRegistry, renderTemplate };
