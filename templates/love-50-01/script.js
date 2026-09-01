const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'loveWebsiteData';
const STORAGE_MAP_KEY = 'loveWebsiteDataMap';
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const defaultAvatar = (background, foreground) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="${background}"/><circle cx="100" cy="77" r="36" fill="${foreground}" opacity=".55"/><path d="M31 190c8-46 34-68 69-68s61 22 69 68" fill="${foreground}" opacity=".55"/><text x="100" y="177" fill="white" font-size="28" text-anchor="middle">♥</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const coupleData = {
  slug: 'minh-ngoc',
  template: 'love-50-01',
  name1: 'Minh',
  name2: 'Ngọc',
  startDate: '2025-02-14',
  message: 'Mỗi khoảnh khắc bên nhau đều là một điều đáng nhớ.',
  loveLetter: 'Gửi người anh thương, mỗi ngày bên em là một điều rất đẹp. Cảm ơn em vì đã làm cuộc sống của anh trở nên dịu dàng hơn, trọn vẹn hơn và nhiều niềm vui hơn. Nếu có thể, anh muốn giữ em ở trong mọi ngày tương lai của mình.',
  finalMessage: 'Và nếu được chọn lại, anh vẫn sẽ chọn em. Yêu em hơn mỗi ngày.',
  photo1: defaultAvatar('#f7c8cc', '#c95d70'),
  photo2: defaultAvatar('#ead9ee', '#9d668b'),
  photos: [],
  album: [],
  timeline: [
    { date: '14/02/2025', title: 'Ngày đầu tiên', text: 'Chúng mình bắt đầu hành trình mới ở một ngày mà mọi thứ đều đẹp như một lời hứa.' },
    { date: '27/03/2025', title: 'Nụ cười đầu tiên', text: 'Một khoảnh khắc nhỏ, nhưng đã khiến cả thế giới của hai ta trở nên dịu hơn.' },
    { date: '03/08/2025', title: 'Một lời yêu', text: 'Từ ngày đó, mỗi ngày sau này đều là một phần của câu chuyện mà chúng mình muốn giữ mãi.' }
  ],
  musicMode: 'none',
  musicName: '',
  musicData: '',
  qrEnabled: false,
  qrContent: ''
};

let currentData = { ...coupleData };
let currentLightboxIndex = 0;
let counterTimer;

function normalizeRecord(record = {}) {
  const item = { ...coupleData, ...record };
  item.album = Array.isArray(record.album) ? record.album.filter(Boolean) : Array.isArray(record.photos) ? record.photos.filter(Boolean) : [];
  item.timeline = Array.isArray(record.timeline) && record.timeline.length ? record.timeline : coupleData.timeline;
  item.name1 = record.name1 || record.senderName || coupleData.name1;
  item.name2 = record.name2 || record.receiverName || coupleData.name2;
  item.startDate = record.startDate || record.specialDate || coupleData.startDate;
  item.message = record.message || coupleData.message;
  item.loveLetter = record.loveLetter || record.letter || coupleData.loveLetter;
  item.finalMessage = record.finalMessage || coupleData.finalMessage;
  item.photo1 = record.photo1 || record.senderPhoto || coupleData.photo1;
  item.photo2 = record.photo2 || record.receiverPhoto || coupleData.photo2;
  return item;
}

function loadData() {
  const urlParams = new URLSearchParams(window.location.search);
  const demoMode = urlParams.get('demo') === '1' || window.location.pathname.endsWith('demo.html');
  const slug = urlParams.get('slug');
  const mapRaw = localStorage.getItem(STORAGE_MAP_KEY);
  const mapData = mapRaw ? JSON.parse(mapRaw) : {};

  if (demoMode && !slug) {
    return normalizeRecord(coupleData);
  }

  if (slug && mapData[slug]) {
    return normalizeRecord(mapData[slug]);
  }

  const currentRaw = localStorage.getItem(STORAGE_KEY);
  if (currentRaw) {
    try {
      return normalizeRecord(JSON.parse(currentRaw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  return normalizeRecord(coupleData);
}

function renderCounter() {
  const note = $('#future-note');
  if (!currentData.startDate) {
    $('#counter-days').textContent = '∞';
    $('#counter-hours').textContent = '—';
    $('#counter-minutes').textContent = '—';
    $('#counter-seconds').textContent = '—';
    note.hidden = false;
    note.textContent = 'Ngày đặc biệt của hai bạn sẽ làm khoảnh khắc này thêm ý nghĩa.';
    return;
  }

  const update = () => {
    const start = new Date(`${currentData.startDate}T00:00:00`);
    const difference = Date.now() - start.getTime();
    if (Number.isNaN(start.getTime()) || difference < 0) {
      $('#counter-days').textContent = '0';
      $('#counter-hours').textContent = '0';
      $('#counter-minutes').textContent = '0';
      $('#counter-seconds').textContent = '0';
      note.hidden = false;
      note.textContent = 'Ngày đặc biệt ấy vẫn đang ở phía trước 💗';
      return;
    }

    const seconds = Math.floor(difference / 1000);
    $('#counter-days').textContent = Math.floor(seconds / 86400);
    $('#counter-hours').textContent = Math.floor((seconds % 86400) / 3600);
    $('#counter-minutes').textContent = Math.floor((seconds % 3600) / 60);
    $('#counter-seconds').textContent = seconds % 60;
    note.hidden = true;
  };

  clearInterval(counterTimer);
  update();
  counterTimer = setInterval(update, 1000);
}

function renderTimeline() {
  const timelineList = $('#timeline-list');
  if (!timelineList) return;
  if (!Array.isArray(currentData.timeline) || !currentData.timeline.length) {
    $('#timeline-section').hidden = true;
    return;
  }

  $('#timeline-section').hidden = false;
  timelineList.innerHTML = currentData.timeline.map((item) => `
    <div class="timeline-item">
      <span class="timeline-dot">♥</span>
      <div>
        <small>${item.date || 'Ngày kỷ niệm'}</small>
        <h3>${item.title || 'Khoảnh khắc'}</h3>
        <p>${item.text || ''}</p>
      </div>
    </div>
  `).join('');
}

function renderAlbum() {
  const section = $('#album-section');
  const container = $('#result-album');
  if (!section || !container) return;
  const album = Array.isArray(currentData.album) ? currentData.album : [];
  section.hidden = album.length === 0;
  if (!album.length) return;
  container.innerHTML = album.map((url, index) => `<button type="button" data-album-index="${index}" aria-label="Mở ảnh ${index + 1}"><img src="${url}" alt="Ảnh kỷ niệm ${index + 1}"></button>`).join('');
  $$('#result-album button').forEach((button) => button.addEventListener('click', () => openLightbox(Number(button.dataset.albumIndex))));
}

function renderLetter() {
  const section = $('#letter-section');
  if (!section) return;
  const letter = currentData.loveLetter || '';
  section.hidden = !letter;
  if (!letter) return;
  $('#result-letter').textContent = letter;
}

function renderFinalMessage() {
  const section = $('#final-section');
  if (!section) return;
  const finalMessage = currentData.finalMessage || '';
  section.hidden = !finalMessage;
  if (!finalMessage) return;
  $('#final-message').textContent = finalMessage;
}

function renderMusic() {
  const section = $('#result-music');
  const audio = $('#result-audio');
  if (!audio) return;

  const musicData = currentData.musicData || '';
  if (!musicData || currentData.musicMode !== 'music') {
    audio.pause();
    audio.removeAttribute('src');
    if (section) section.hidden = true;
    return;
  }

  if (section) section.hidden = true;
  audio.src = musicData;
  audio.loop = true;
  audio.autoplay = true;
  audio.play().catch(() => {
    // Bỏ qua nếu trình duyệt chặn autoplay; người dùng có thể tương tác sau.
  });
}

let floatingHeartsTimer = null;

function createFloatingHearts() {
  const container = $('#floating-hearts') || $('#touch-hearts');
  if (!container) return;

  const spawnBurst = window.innerWidth < 480 ? 12 : 18;
  const maxHearts = window.innerWidth < 480 ? 62 : 96;

  const spawnHeart = () => {
    const activeHearts = container.querySelectorAll('.floating-heart');
    if (activeHearts.length >= maxHearts) {
      activeHearts[0].remove();
    }

    const heart = document.createElement('span');
    const symbols = ['♡', '♥', '♡', '♥', '♡'];
    heart.className = 'floating-heart';
    heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];

    const left = Math.random() * 100;
    const driftX = (-180 + Math.random() * 360).toFixed(2);
    const duration = 6 + Math.random() * 7;

    heart.style.left = `${left}%`;
    heart.style.bottom = '-18%';
    heart.style.animationDuration = `${duration}s`;
    heart.style.animationDelay = `${Math.random() * 1.8}s`;
    heart.style.opacity = `${0.8 + Math.random() * 0.2}`;
    heart.style.fontSize = `${24 + Math.random() * 34}px`;
    heart.style.setProperty('--drift-x', `${driftX}px`);

    heart.addEventListener('animationend', () => heart.remove());
    container.appendChild(heart);
  };

  for (let i = 0; i < spawnBurst; i += 1) {
    spawnHeart();
  }

  if (floatingHeartsTimer) {
    clearInterval(floatingHeartsTimer);
  }

  floatingHeartsTimer = setInterval(() => {
    for (let i = 0; i < spawnBurst; i += 1) {
      spawnHeart();
    }
  }, 220);
}

function setupRevealObserver() {
  const items = $$('.reveal');
  if (!items.length || prefersReducedMotion) {
    items.forEach((item) => item.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -20px 0px' });

  items.forEach((item) => observer.observe(item));
}

function renderPage() {
  const data = loadData();
  currentData = normalizeRecord(data);

  document.title = `${currentData.name1} ❤️ ${currentData.name2}`;
  $('#result-sender-name').textContent = currentData.name1;
  $('#result-receiver-name').textContent = currentData.name2;
  $('#result-message').textContent = currentData.message || 'Mỗi khoảnh khắc bên nhau đều là một điều đáng nhớ.';
  $('#result-date').textContent = `✦ ${formatDate(currentData.startDate)} ✦`;

  const senderPhoto = $('#result-sender-photo');
  const receiverPhoto = $('#result-receiver-photo');
  if (senderPhoto) senderPhoto.src = currentData.photo1 || coupleData.photo1;
  if (receiverPhoto) receiverPhoto.src = currentData.photo2 || coupleData.photo2;

  renderCounter();
  renderAlbum();
  renderTimeline();
  renderLetter();
  renderFinalMessage();
  renderMusic();
  setupRevealObserver();

  const button = $('#envelope-button');
  if (button) {
    button.addEventListener('click', () => {
      const open = !button.classList.contains('is-open');
      button.classList.toggle('is-open', open);
      const section = $('#letter-section');
      if (section) section.classList.toggle('is-open', open);
      button.setAttribute('aria-expanded', String(open));
    });
  }

  const musicToggle = $('#music-toggle');
  const audio = $('#result-audio');
  if (musicToggle && audio) {
    musicToggle.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => {
          $('#music-state').textContent = 'Đang phát';
          musicToggle.textContent = '❚❚';
        }).catch(() => {
          $('#music-state').textContent = 'Không thể phát file nhạc';
        });
      } else {
        audio.pause();
        $('#music-state').textContent = 'Tạm dừng';
        musicToggle.textContent = '▶';
      }
    });

    audio.addEventListener('ended', () => {
      $('#music-state').textContent = 'Tạm dừng';
      musicToggle.textContent = '▶';
    });
  }
}

function formatDate(value) {
  if (!value) return 'Một ngày thật đặc biệt của chúng mình';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return 'Một ngày thật đặc biệt của chúng mình';
  return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date);
}

function openLightbox(index) {
  const album = Array.isArray(currentData.album) ? currentData.album : [];
  if (!album.length) return;
  currentLightboxIndex = index;
  const lightbox = $('#lightbox');
  const lightboxImage = $('#lightbox-image');
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = album[currentLightboxIndex];
  lightbox.hidden = false;
  lightbox.setAttribute('aria-hidden', 'false');
}

function closeLightbox() {
  const lightbox = $('#lightbox');
  if (!lightbox) return;
  lightbox.hidden = true;
  lightbox.setAttribute('aria-hidden', 'true');
}

function cycleLightbox(direction) {
  const album = Array.isArray(currentData.album) ? currentData.album : [];
  if (!album.length) return;
  currentLightboxIndex = (currentLightboxIndex + direction + album.length) % album.length;
  $('#lightbox-image').src = album[currentLightboxIndex];
}

const lightboxClose = $('#lightbox-close');
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
const lightboxPrev = $('#lightbox-prev');
if (lightboxPrev) lightboxPrev.addEventListener('click', () => cycleLightbox(-1));
const lightboxNext = $('#lightbox-next');
if (lightboxNext) lightboxNext.addEventListener('click', () => cycleLightbox(1));
const lightbox = $('#lightbox');
if (lightbox) {
  lightbox.addEventListener('click', (event) => {
    const clickTarget = event.target;
    const isBackgroundClick = clickTarget === lightbox || clickTarget === $('#lightbox-image');
    if (isBackgroundClick) closeLightbox();
  });
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeLightbox();
  if (Array.isArray(currentData.album) && currentData.album.length) {
    if (event.key === 'ArrowRight') cycleLightbox(1);
    if (event.key === 'ArrowLeft') cycleLightbox(-1);
  }
});

if (!prefersReducedMotion) {
  document.addEventListener('click', (event) => {
    if (event.target.closest('.lightbox-arrow, .icon-button, .envelope-button')) return;
    const heart = document.createElement('span');
    heart.className = 'touch-heart';
    heart.textContent = ['♥', '♡', '✦'][Math.floor(Math.random() * 3)];
    heart.style.left = `${event.clientX}px`;
    heart.style.top = `${event.clientY}px`;
    heart.style.setProperty('--drift-x', `${-55 + Math.random() * 110}px`);
    heart.style.setProperty('--drift-y', `${-30 - Math.random() * 70}px`);
    document.body.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove());
  });
}

createFloatingHearts();
window.addEventListener('resize', createFloatingHearts);
renderPage();
