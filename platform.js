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

  const previewPath = window.location.protocol === 'file:' ? 'http://localhost:8000/preview.html' : 'preview.html';
  return `${previewPath}?slug=${encodeURIComponent(slug)}&template=${encodeURIComponent(template.id)}&data=${encodeURIComponent(JSON.stringify(previewData))}`;
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
function readFileAsDataUrl(file) { return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '')); reader.onerror = () => reject(reader.error || new Error('Unable to read file.')); reader.readAsDataURL(file); }); }
async function handleBuilderSubmit(event) { event.preventDefault(); const formData = new FormData(event.currentTarget); const formValues = {}; const albumFiles = []; for (const [key, value] of formData.entries()) { if (key === 'consent') continue; if (key === 'album') { if (value instanceof File && value.size > 0) albumFiles.push(value); continue; } formValues[key] = value; } try { const fileFields = ['photo1', 'photo2', 'music']; for (const field of fileFields) { const file = formValues[field]; if (file instanceof File && file.size > 0) formValues[field] = await readFileAsDataUrl(file); else if (file instanceof File) formValues[field] = ''; } formValues.album = await Promise.all(albumFiles.map(readFileAsDataUrl)); } catch (error) { console.error('Customer media processing failed:', error); $('#builder-message').textContent = 'Không thể đọc ảnh hoặc nhạc. Vui lòng thử lại.'; return; } const requiredMissing = selectedTemplate.schema.filter((field) => field.required && !formValues[field.id]); if (requiredMissing.length) { $('#builder-message').textContent = `Vui lòng điền: ${requiredMissing.map((field) => field.label).join(', ')}.`; return; } draft = { ...draft, ...formValues, templateId: selectedTemplate.id }; localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); if (window.LuubutAnalytics && window.LuubutAnalytics.track) { window.LuubutAnalytics.track('submit_order', { template_id: selectedTemplate.id, metadata: { source: 'builder_form' } }); } $('#builder-message').textContent = 'Đang tạo preview...'; try { const response = await fetch('/api/create-draft', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(normalizeCustomerData(selectedTemplate, draft)) }); const result = await response.json(); if (!response.ok || !result.success || !result.websiteId || !result.previewToken) throw new Error(result.error || 'Create-draft returned an incomplete response.'); const previewUrl = result.previewUrl || `/preview/${encodeURIComponent(result.previewToken)}`; if (window.LuubutAnalytics && window.LuubutAnalytics.track) { window.LuubutAnalytics.track('website_created', { template_id: selectedTemplate.id, website_id: result.websiteId || null, metadata: { preview_url: previewUrl } }); } $('#builder-dialog').close(); $('#preview-iframe').src = previewUrl; $('#preview-dialog').dataset.fromBuilder = 'true'; $('#preview-dialog').dataset.websiteId = result.websiteId || ''; $('#preview-dialog').showModal(); } catch (error) { console.error('Create-draft frontend flow failed:', error); $('#builder-message').textContent = 'Không thể tạo preview từ server. Vui lòng thử lại.'; } }
function createOrder() { const orderId = `LB-${Date.now().toString(36).toUpperCase()}`; const slug = Math.random().toString(36).slice(2, 8); const order = { orderId, templateId: selectedTemplate.id, customerData: draft, amount: selectedTemplate.price, paymentStatus: 'PENDING', websiteStatus: 'DRAFT', publicSlug: slug, publicUrl: `${location.origin}/p/${slug}`, createdAt: new Date().toISOString(), paidAt: null }; localStorage.setItem(`luu-but-order-${orderId}`, JSON.stringify(order)); return order; }
function showOrder(mode) { const order = mode === 'preview' ? createOrder() : JSON.parse(localStorage.getItem(mode)); const content = $('#order-content'); if (mode === 'preview') { if (window.LuubutAnalytics && window.LuubutAnalytics.track) { window.LuubutAnalytics.track('click_buy', { template_id: selectedTemplate.id, metadata: { flow: 'preview_order' } }); } content.innerHTML = `<p class="eyebrow">Preview & order</p><h2>Website của bạn đã sẵn sàng để xem.</h2><p>Thông tin đã được lưu dưới dạng draft. Đây là bước kiểm tra trước khi tạo đơn.</p><div class="bank-box"><strong>${selectedTemplate.name} · ${money(order.amount)}</strong><span>Trạng thái website: DRAFT</span><span>Trạng thái thanh toán: PENDING</span></div><div class="order-actions"><button class="button primary" id="confirm-order" type="button">Tạo đơn hàng <span>→</span></button><button class="small-button" id="back-to-builder" type="button">Chỉnh sửa</button></div><p class="mock-warning">Development flow: chưa có payment provider. Không có nút frontend nào được coi là thanh toán thật.</p>`; $('#order-dialog').showModal(); $('#confirm-order').addEventListener('click', () => showOrder(`luu-but-order-${order.orderId}`)); $('#back-to-builder').addEventListener('click', () => { $('#order-dialog').close(); openBuilder(selectedTemplate.id); }); return; } content.innerHTML = `<p class="eyebrow">Order ${order.orderId}</p><h2>Đơn hàng đang chờ thanh toán.</h2><span class="order-status">${order.paymentStatus}</span><p>Trong production, server sẽ xác minh giao dịch qua webhook trước khi chuyển sang PAID.</p><div class="bank-box"><strong>Thông tin chuyển khoản (demo)</strong><span>Ngân hàng: DEMO BANK</span><span>Chủ tài khoản: LUUBUT DEMO</span><span>Nội dung: ${order.orderId}</span><span>Số tiền: ${money(order.amount)}</span></div><div class="order-actions"><button class="button primary" id="dev-paid" type="button">DEV: Mock xác nhận PAID</button></div><p class="mock-warning">Chỉ bật nút này trong development. Không triển khai mock payment ở production.</p>`; $('#order-dialog').showModal(); $('#dev-paid').addEventListener('click', () => publishOrder(order)); }
function publishOrder(order) {
  order.paymentStatus = 'PAID'; order.websiteStatus = 'PUBLISHED'; order.paidAt = new Date().toISOString();
  localStorage.setItem(`luu-but-order-${order.orderId}`, JSON.stringify(order));
  if (window.LuubutAnalytics && window.LuubutAnalytics.track) {
    window.LuubutAnalytics.track('payment_success', { template_id: order.templateId, website_id: null, metadata: { order_id: order.orderId } });
  }
  const publicRecord = { ...draft, slug: order.publicSlug, template: order.templateId, name1: draft.name1 || draft.senderName || 'Minh', name2: draft.name2 || draft.receiverName || 'Ngọc', startDate: draft.startDate || draft.specialDate || '2025-02-14', loveLetter: draft.letter || draft.loveLetter || '', finalMessage: draft.finalMessage || draft.message || '', photo1: draft.photo1 || draft.senderPhoto || '', photo2: draft.photo2 || draft.receiverPhoto || '', album: Array.isArray(draft.album) ? draft.album : [] }; saveCoupleRecord(publicRecord); const finalUrl = `preview.html?slug=${encodeURIComponent(order.publicSlug)}&template=${encodeURIComponent(order.templateId)}`; const content = $('#order-content'); content.innerHTML = `<p class="eyebrow">Published</p><h2>Website của bạn đã sẵn sàng! 🎉</h2><span class="order-status published">PUBLISHED · PAID</span><p>Đây là public URL mô phỏng được tạo sau bước mock payment.</p><div class="published-url">${order.publicUrl}<button class="small-button" id="copy-url" type="button">Sao chép</button></div><div class="qr-result" id="website-qr"></div><p>Quét mã để mở website 💗</p><div class="order-actions"><a class="button primary" href="${finalUrl}" target="_blank" rel="noreferrer">Mở preview <span>↗</span></a></div>`; if (window.QRCode) new QRCode($('#website-qr'), { text: order.publicUrl, width: 160, height: 160, colorDark: '#46363c', colorLight: '#ffffff' }); else $('#website-qr').textContent = order.publicUrl; $('#copy-url').addEventListener('click', async () => { try { await navigator.clipboard.writeText(order.publicUrl); $('#copy-url').textContent = 'Đã chép'; } catch { $('#copy-url').textContent = 'Hãy copy thủ công'; } });
}
$('#preview-create').addEventListener('click', async () => { const fromBuilder = $('#preview-dialog').dataset.fromBuilder === 'true'; const websiteId = $('#preview-dialog').dataset.websiteId || ''; $('#preview-dialog').close(); delete $('#preview-dialog').dataset.fromBuilder; delete $('#preview-dialog').dataset.websiteId; if (fromBuilder) { if (!websiteId) { alert('Không tìm thấy website draft. Vui lòng tạo preview lại.'); return; } try { const orderResponse = await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ websiteId, templateId: selectedTemplate.id }) }); const orderResult = await orderResponse.json(); if (!orderResponse.ok || !orderResult.success) { throw new Error(orderResult.error || 'Không thể tạo đơn hàng.'); } if (window.LuubutAnalytics && window.LuubutAnalytics.track) { window.LuubutAnalytics.track('submit_order', { template_id: selectedTemplate.id, website_id: websiteId, metadata: { order_reference: orderResult.orderReference || '', amount: String(orderResult.amount || 0) } }); } const params = new URLSearchParams({ order: orderResult.orderId || '', reference: orderResult.orderReference || '', template: selectedTemplate.id, websiteId }); window.location.href = `/checkout.html?${params.toString()}`; } catch (error) { console.error('Create-order failed:', error); alert('Không thể tạo đơn hàng. Vui lòng thử lại.'); } return; } openBuilder(selectedTemplate.id); }); $$('[data-close-dialog]').forEach((button) => button.addEventListener('click', () => button.closest('dialog').close()));
renderCategories(); renderTemplates();

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
  return { templateId, customerData, previewUrl: template.demoUrl, schema: template.schema };
}

const paymentProvider = {
  mode: 'development-mock',
  createPaymentIntent(order) { return { provider: 'mock', orderId: order.orderId, status: 'PENDING' }; },
  verifyWebhook() { return { verified: false, reason: 'Chưa cấu hình payment provider server-side.' }; }
};

window.LuuButPlatform = { templateRegistry, renderTemplate, paymentProvider };
