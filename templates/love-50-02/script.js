const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function createAvatar(background, foreground) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 420"><rect width="320" height="420" fill="${background}"/><circle cx="160" cy="136" r="62" fill="${foreground}" opacity="0.6"/><path d="M60 338c18-72 68-102 100-102s82 30 100 102" fill="${foreground}" opacity="0.6"/><text x="160" y="390" fill="white" font-size="34" text-anchor="middle">♥</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const fallbackRecord = {
  templateId: 'love-50-02',
  name1: 'Minh',
  name2: 'Ngọc',
  startDate: '2025-02-14',
  avatar1: createAvatar('#f6dfe7', '#d97b90'),
  avatar2: createAvatar('#ead8f0', '#8a6db3'),
  photos: [],
  timeline: [
    { date: '14/02/2025', title: 'Ngày đầu tiên', text: 'Câu chuyện của chúng mình bắt đầu với một ngày rất bình thường nhưng cũng rất đặc biệt.' },
    { date: '27/03/2025', title: 'Khoảnh khắc mới', text: 'Từ ngày đó, mọi điều trong cuộc sống đều có thêm một chút dịu dàng và bền bỉ.' },
    { date: '03/08/2025', title: 'Một lời hứa', text: 'Mỗi ngày sau đó lại thêm một lời yêu nhỏ, một niềm vui nhỏ, và một ký ức đẹp.' }
  ],
  shortMessage: 'Anh yêu em, và mỗi ngày bên em lại đẹp như một điều rất đáng nhớ.',
  loveLetter: 'Em ơi, cảm ơn em vì đã làm cuộc sống của anh dịu hơn, ngọt hơn và trọn vẹn hơn. Anh mong mỗi ngày sau này đều có em ở bên cạnh.',
  finalMessage: 'Anh vẫn sẽ chọn em, mãi mãi như ngày đầu tiên.',
  musicUrl: '',
  customData: {
    theme: 'soft-pink',
    introText: 'Một câu chuyện nhỏ, được viết cho người mình yêu.',
    specialEffect: 'heart-rain'
  }
};

function normalizeRecord(record = {}) {
  const safeRecord = record || {};
  const normalized = {
    ...fallbackRecord,
    ...safeRecord,
    templateId: safeRecord.templateId || 'love-50-02',
    name1: safeRecord.name1 || safeRecord.senderName || fallbackRecord.name1,
    name2: safeRecord.name2 || safeRecord.receiverName || fallbackRecord.name2,
    startDate: safeRecord.startDate || safeRecord.specialDate || fallbackRecord.startDate,
    avatar1: safeRecord.avatar1 || safeRecord.photo1 || safeRecord.coverPhoto || fallbackRecord.avatar1,
    avatar2: safeRecord.avatar2 || safeRecord.photo2 || fallbackRecord.avatar2,
    photos: Array.isArray(safeRecord.photos) ? safeRecord.photos.filter(Boolean) : Array.isArray(safeRecord.album) ? safeRecord.album.filter(Boolean) : [],
    timeline: Array.isArray(safeRecord.timeline) && safeRecord.timeline.length ? safeRecord.timeline : fallbackRecord.timeline,
    shortMessage: safeRecord.shortMessage || safeRecord.message || fallbackRecord.shortMessage,
    loveLetter: safeRecord.loveLetter || safeRecord.letter || fallbackRecord.loveLetter,
    finalMessage: safeRecord.finalMessage || fallbackRecord.finalMessage,
    musicUrl: safeRecord.musicUrl || safeRecord.musicData || '',
    customData: { ...(fallbackRecord.customData || {}), ...(safeRecord.customData || {}) }
  };

  if (Array.isArray(normalized.photos) && normalized.photos.length === 0 && normalized.avatar1) normalized.photos = [normalized.avatar1, normalized.avatar2].filter(Boolean);
  return normalized;
}

function getPreviewDataFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encodedData = params.get('data');
  const slug = params.get('slug');

  if (encodedData) {
    try {
      return normalizeRecord(JSON.parse(decodeURIComponent(encodedData)));
    } catch {
      return null;
    }
  }

  if (slug) {
    const saved = localStorage.getItem('loveWebsiteDataMap');
    if (saved) {
      try {
        const map = JSON.parse(saved);
        if (map && map[slug]) return normalizeRecord(map[slug]);
      } catch {
        // ignore malformed local data and continue
      }
    }
  }

  return null;
}

function loadData() {
  const params = new URLSearchParams(window.location.search);
  const previewData = getPreviewDataFromUrl();
  if (previewData) return previewData;

  if (params.get('demo') === 'true' || window.location.pathname.endsWith('demo.html')) {
    return normalizeRecord(fallbackRecord);
  }

  return { ...normalizeRecord(fallbackRecord), __missingData: true };
}

function renderStory(story) {
  const lines = story
    ? story.split(/\n+/).filter((line) => line.trim()).slice(0, 5)
    : [
      'Hai người bắt đầu từ một buổi chiều rất bình thường, rồi mỗi ngày trôi qua lại dần đẹp hơn.',
      'Có những ngày chỉ cần ngồi cạnh nhau là đủ để thấy cả thế giới dịu lại.',
      'Và rồi, những điều nhỏ bé ấy trở thành một câu chuyện đẹp mà cả hai muốn giữ mãi.'
    ];

  $('#story-lines').innerHTML = lines.map((line) => `<p>${line.trim()}</p>`).join('');
}

function renderMemoryGrid() {
  const photos = Array.isArray(currentData.photos) && currentData.photos.length ? currentData.photos : [currentData.avatar1, currentData.avatar2].filter(Boolean);
  const container = $('#memories-grid');
  if (!container) return;
  if (!photos.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = photos.slice(0, 6).map((url, index) => `<figure><img src="${url}" alt="Khoảnh khắc ${index + 1}" /></figure>`).join('');
}

function renderQR() {
  const section = $('#qr-section');
  const qrBox = $('#qrcode');
  if (!section || !qrBox) return;

  const content = currentData.customData && currentData.customData.qrContent ? currentData.customData.qrContent : '';
  qrBox.innerHTML = '';

  if (!content) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  if (window.QRCode) {
    new QRCode(qrBox, { text: content, width: 150, height: 150, colorDark: '#4a2b34', colorLight: '#ffffff' });
  } else {
    qrBox.innerHTML = '<p>QR code đang được tạo...</p>';
  }
}

function renderMusic() {
  const section = $('#music-section');
  const audio = $('#result-audio');
  if (!section || !audio) return;

  if (!currentData.musicUrl) {
    section.hidden = true;
    audio.pause();
    audio.removeAttribute('src');
    return;
  }

  section.hidden = false;
  $('#music-name-display').textContent = currentData.customData?.musicName || 'Bài hát của hai ta';
  audio.src = currentData.musicUrl;
  $('#music-state').textContent = 'Tạm dừng';
  $('#music-toggle').textContent = '▶';
}

function initHeartRain() {
  if (prefersReducedMotion) return;
  const container = $('#floating-hearts');
  if (!container) return;

  for (let i = 0; i < 18; i += 1) {
    const heart = document.createElement('span');
    heart.className = 'heart-particle';
    heart.textContent = ['❤', '♥', '♡', '💗'][Math.floor(Math.random() * 4)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.top = `${Math.random() * 100}%`;
    heart.style.setProperty('--drift-x', `${-60 + Math.random() * 120}px`);
    heart.style.animationDelay = `${Math.random() * 3}s`;
    container.appendChild(heart);
    setTimeout(() => heart.remove(), 7000);
  }
}

let currentData = fallbackRecord;

function renderResult() {
  const sender = currentData.name1 || 'Anh';
  const receiver = currentData.name2 || 'Em';
  const cover = currentData.avatar1 || currentData.avatar2 || createAvatar('#f6dfe7', '#d97b90');

  $('#hero-recipient').textContent = receiver;
  $('#result-sender-name').textContent = sender;
  $('#result-receiver-name').textContent = receiver;
  $('#signature-name').textContent = sender;
  $('#signature-partner').textContent = receiver;
  $('#result-message').textContent = currentData.shortMessage || 'Một nhịp tim nhỏ, được dành cho người mình thương nhất.';
  $('#opening-title').textContent = `Tặng ${receiver}`;
  $('#opening-copy').textContent = currentData.customData?.introText || 'Câu chuyện của chúng ta bắt đầu từ một ngày rất bình thường, nhưng lại khiến cả thế giới đổi màu.';
  $('#result-date').textContent = currentData.startDate
    ? `Ngày đặc biệt • ${new Date(`${currentData.startDate}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
    : 'Mỗi ngày bên nhau đều là một ngày đặc biệt';
  $('#final-message').textContent = currentData.finalMessage || 'Anh vẫn sẽ chọn em.';
  $('#result-letter').textContent = currentData.loveLetter || 'Em ơi, cảm ơn em vì đã khiến mọi điều trở nên đẹp hơn.';
  $('#cover-photo-display').src = cover;

  renderStory(currentData.customData?.story || '');
  renderMemoryGrid();
  renderQR();
  renderMusic();

  const errorState = Boolean(currentData.__missingData);
  if (errorState) {
    $('#result-message').textContent = 'Preview chưa có dữ liệu để hiển thị.';
    $('#opening-copy').textContent = 'Trang render chỉ hiển thị khi có preview data. Dùng preview URL hoặc ?demo=true để test local.';
  }
}

window.addEventListener('load', () => {
  currentData = normalizeRecord(loadData());
  renderResult();
  initHeartRain();

  $('#music-toggle').addEventListener('click', () => {
    const audio = $('#result-audio');
    if (!audio || !currentData.musicUrl) return;
    if (audio.paused) {
      audio.play().catch(() => undefined);
      $('#music-toggle').textContent = '❚❚';
      $('#music-state').textContent = 'Đang phát';
    } else {
      audio.pause();
      $('#music-toggle').textContent = '▶';
      $('#music-state').textContent = 'Tạm dừng';
    }
  });
});
