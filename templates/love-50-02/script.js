const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const STORAGE_KEY = 'love-50-02-data';
const MAX_IMAGE_SIZE = 2 * 1024 * 1024;
const MAX_AUDIO_SIZE = 5 * 1024 * 1024;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const form = $('#love-form');
const screens = {
  form: $('#form-screen'),
  welcome: $('#welcome-screen'),
  love: $('#love-screen'),
};

const inputs = {
  senderName: $('#sender-name'),
  receiverName: $('#receiver-name'),
  message: $('#message'),
  specialDate: $('#special-date'),
  story: $('#story'),
  letter: $('#letter'),
  finalNote: $('#final-note'),
  qrContent: $('#qr-content'),
  coverPhoto: $('#cover-photo'),
  albumPhotos: $('#album-photos'),
  musicFile: $('#music-file'),
};

const data = {
  senderName: '',
  receiverName: '',
  message: '',
  specialDate: '',
  story: '',
  letter: '',
  finalNote: '',
  coverPhoto: '',
  album: [],
  musicMode: 'none',
  musicName: '',
  musicData: '',
  qrEnabled: false,
  qrContent: '',
};

let selectedAlbum = [];

function createAvatar(background, foreground) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 420"><rect width="320" height="420" fill="${background}"/><circle cx="160" cy="136" r="62" fill="${foreground}" opacity="0.6"/><path d="M60 338c18-72 68-102 100-102s82 30 100 102" fill="${foreground}" opacity="0.6"/><text x="160" y="390" fill="white" font-size="34" text-anchor="middle">♥</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function defaultCover() {
  return createAvatar('#f6dfe7', '#d97b90');
}

function readFile(file, maxSize, label) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (file.size > maxSize) {
      return reject(new Error(`${label} quá lớn. Chọn file dưới ${Math.round(maxSize / 1024 / 1024)}MB.`));
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Không thể đọc ${label.toLowerCase()}.`));
    reader.readAsDataURL(file);
  });
}

function showStatus(message = '') {
  $('#form-status').textContent = message;
}

function setError(field, message) {
  const error = $(`#${field}-error`);
  const element = $(`#${field}`);
  if (error) error.textContent = message;
  if (element) element.setAttribute('aria-invalid', message ? 'true' : 'false');
}

function syncOptionalSections() {
  $('#music-upload').hidden = $('input[name="musicMode"]:checked').value !== 'music';
  $('#qr-fields').hidden = !$('#qr-enabled').checked;
}

function validate() {
  let isValid = true;
  const sender = inputs.senderName.value.trim();
  const receiver = inputs.receiverName.value.trim();
  setError('senderName', sender ? '' : 'Vui lòng nhập tên người tạo.');
  setError('receiverName', receiver ? '' : 'Vui lòng nhập tên người yêu.');
  if (!sender || !receiver) {
    (sender ? inputs.receiverName : inputs.senderName).focus();
    isValid = false;
  }
  return isValid;
}

function renderAlbumPreview() {
  const container = $('#album-preview');
  container.innerHTML = selectedAlbum
    .map((url, index) => `<img src="${url}" alt="Ảnh kỷ niệm ${index + 1}" />`)
    .join('');
  container.hidden = selectedAlbum.length === 0;
}

function updateCoverPreview(url) {
  const preview = $('#cover-preview');
  preview.innerHTML = url ? `<img src="${url}" alt="Ảnh bìa" />` : '＋';
}

async function handleCoverFile() {
  const [file] = inputs.coverPhoto.files;
  if (!file) return;
  try {
    const url = await readFile(file, MAX_IMAGE_SIZE, 'Ảnh bìa');
    data.coverPhoto = url;
    updateCoverPreview(url);
    showStatus('');
  } catch (error) {
    inputs.coverPhoto.value = '';
    showStatus(error.message);
  }
}

async function handleAlbumFiles() {
  const files = [...inputs.albumPhotos.files].slice(0, 6);
  if (inputs.albumPhotos.files.length > 6) {
    showStatus('Album chỉ nhận tối đa 6 ảnh. Những ảnh đầu tiên đã được chọn.');
  }

  const urls = [];
  for (const file of files) {
    try {
      urls.push(await readFile(file, MAX_IMAGE_SIZE, 'Ảnh album'));
    } catch (error) {
      showStatus(error.message);
    }
  }
  selectedAlbum = urls;
  renderAlbumPreview();
}

async function handleMusicFile() {
  const [file] = $('#music-file').files;
  if (!file) return;
  try {
    data.musicData = await readFile(file, MAX_AUDIO_SIZE, 'File nhạc');
    data.musicName = file.name;
    $('#music-name').textContent = file.name;
    const preview = $('#music-preview');
    preview.src = data.musicData;
    preview.hidden = false;
    showStatus('');
  } catch (error) {
    $('#music-file').value = '';
    showStatus(error.message);
  }
}

function saveData() {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        coverPhoto: data.coverPhoto || defaultCover(),
        album: selectedAlbum,
      })
    );
    return true;
  } catch {
    showStatus('Thiết bị không lưu được ảnh lớn. Bạn vẫn có thể xem trước nhưng có thể mất dữ liệu sau khi tải lại.');
    return false;
  }
}

function readForm() {
  data.senderName = inputs.senderName.value.trim();
  data.receiverName = inputs.receiverName.value.trim();
  data.message = inputs.message.value.trim();
  data.specialDate = inputs.specialDate.value;
  data.story = inputs.story.value.trim();
  data.letter = inputs.letter.value.trim();
  data.finalNote = inputs.finalNote.value.trim();
  data.musicMode = $('input[name="musicMode"]:checked').value;
  data.qrEnabled = $('#qr-enabled').checked;
  data.qrContent = inputs.qrContent.value.trim();
  data.coverPhoto = data.coverPhoto || defaultCover();
  data.album = selectedAlbum;
}

function showScreen(screen) {
  Object.values(screens).forEach((item) => {
    item.hidden = item !== screen;
  });
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

function renderStory(story) {
  const lines = story
    ? story.split(/\n+/).filter((line) => line.trim()).slice(0, 5)
    : [
        'Hai người bắt đầu từ một buổi chiều rất bình thường, rồi mỗi ngày trôi qua lại dần đẹp hơn.',
        'Có những ngày chỉ cần ngồi cạnh nhau là đủ để thấy cả thế giới dịu lại.',
        'Và rồi, những điều nhỏ bé ấy trở thành một câu chuyện đẹp mà cả hai muốn giữ mãi.',
      ];

  $('#story-lines').innerHTML = lines.map((line) => `<p>${line.trim()}</p>`).join('');
}

function renderResult() {
  const sender = data.senderName || 'Anh';
  const receiver = data.receiverName || 'Em';
  const openingMessage = data.message || 'Anh có một điều muốn dành cho em...';
  const finalMessage = data.finalNote || 'Anh vẫn sẽ chọn em ❤️';

  $('#welcome-name').textContent = receiver;
  $('#hero-recipient').textContent = receiver;
  $('#result-sender-name').textContent = sender;
  $('#result-receiver-name').textContent = receiver;
  $('#signature-name').textContent = sender;
  $('#signature-partner').textContent = receiver;
  $('#result-message').textContent = openingMessage;
  $('#opening-title').textContent = `Tặng ${receiver}`;
  $('#opening-copy').textContent = data.story || 'Câu chuyện của chúng ta bắt đầu từ một ngày rất bình thường, nhưng lại khiến cả thế giới đổi màu.';
  $('#result-date').textContent = data.specialDate
    ? `Ngày đặc biệt • ${new Date(`${data.specialDate}T00:00:00`).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}`
    : 'Mỗi ngày bên nhau đều là một ngày đặc biệt';
  $('#final-message').textContent = finalMessage;
  $('#result-letter').textContent = data.letter || 'Em ơi, cảm ơn em vì đã khiến mọi điều trở nên đẹp hơn. Anh mong mỗi ngày sau này đều có em ở bên cạnh.';
  $('#cover-photo-display').src = data.coverPhoto || defaultCover();
  renderStory(data.story);
  renderMemoryGrid();
  renderMusic();
  renderQR();
  showScreen(screens.welcome);
}

function renderMemoryGrid() {
  const album = selectedAlbum.length ? selectedAlbum : Array.from({ length: 4 }, (_, index) => {
    const gradient = ['#fcdfe5', '#fbe5ff', '#dfeaff', '#ffe8d8'][index % 4];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 500"><rect width="500" height="500" fill="${gradient}"/><circle cx="250" cy="170" r="90" fill="rgba(255,255,255,0.45)"/><path d="M170 380c17-68 58-100 80-100s63 32 80 100" fill="rgba(255,255,255,0.45)"/><text x="250" y="440" fill="white" font-size="40" text-anchor="middle">♥</text></svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  });

  $('#memories-grid').innerHTML = album
    .slice(0, 6)
    .map((url, index) => `<figure><img src="${url}" alt="Khoảnh khắc ${index + 1}" /></figure>`)
    .join('');
}

function renderQR() {
  const section = $('#qr-section');
  const content = data.qrContent || 'https://love-story.example.com';
  const qrBox = $('#qrcode');
  qrBox.innerHTML = '';

  if (!data.qrEnabled) {
    section.hidden = true;
    return;
  }

  section.hidden = false;
  if (window.QRCode) {
    new QRCode(qrBox, {
      text: content,
      width: 150,
      height: 150,
      colorDark: '#4a2b34',
      colorLight: '#ffffff',
    });
  } else {
    qrBox.innerHTML = '<p>QR code đang được tạo...</p>';
  }
}

function renderMusic() {
  const section = $('#music-section');
  const audio = $('#result-audio');

  if (data.musicMode !== 'music' || !data.musicData) {
    section.hidden = true;
    audio.pause();
    audio.removeAttribute('src');
    return;
  }

  section.hidden = false;
  $('#music-name-display').textContent = data.musicName || 'Bài hát của hai ta';
  audio.src = data.musicData;
  $('#music-state').textContent = 'Tạm dừng';
  $('#music-toggle').textContent = '▶';
}

function createParticles() {
  if (prefersReducedMotion) return;
  for (let i = 0; i < 18; i += 1) {
    const heart = document.createElement('span');
    heart.className = 'heart-particle';
    heart.textContent = ['❤', '♥', '♡', '💗'][Math.floor(Math.random() * 4)];
    heart.style.left = `${Math.random() * 100}%`;
    heart.style.top = `${Math.random() * 100}%`;
    heart.style.setProperty('--drift-x', `${-60 + Math.random() * 120}px`);
    heart.style.animationDelay = `${Math.random() * 3}s`;
    $('#floating-hearts').appendChild(heart);
    setTimeout(() => heart.remove(), 7000);
  }
}

function openLovePage() {
  createParticles();
  showScreen(screens.love);
  if (data.musicMode === 'music' && data.musicData) {
    const audio = $('#result-audio');
    audio.play().catch(() => undefined);
  }
}

function populateForm(saved) {
  const state = { ...data, ...saved };
  inputs.senderName.value = state.senderName || '';
  inputs.receiverName.value = state.receiverName || '';
  inputs.message.value = state.message || '';
  inputs.specialDate.value = state.specialDate || '';
  inputs.story.value = state.story || '';
  inputs.letter.value = state.letter || '';
  inputs.finalNote.value = state.finalNote || '';
  $('#qr-enabled').checked = Boolean(state.qrEnabled);
  inputs.qrContent.value = state.qrContent || '';
  $('input[name="musicMode"][value="' + (state.musicMode === 'music' ? 'music' : 'none') + '"]').checked = true;
  if (state.coverPhoto) {
    data.coverPhoto = state.coverPhoto;
    updateCoverPreview(state.coverPhoto);
  }
  selectedAlbum = Array.isArray(state.album) ? state.album : [];
  renderAlbumPreview();
  syncOptionalSections();
}

function hydrateFromHash() {
  const params = new URLSearchParams(window.location.hash.slice(1));
  const previewValue = params.get('preview');
  if (!previewValue) return false;

  try {
    const preview = JSON.parse(decodeURIComponent(previewValue));
    data.senderName = preview.senderName || preview.name1 || '';
    data.receiverName = preview.receiverName || preview.name2 || '';
    data.message = preview.message || preview.openingTitle || '';
    data.specialDate = preview.specialDate || '';
    data.story = preview.story || 'Hai người bắt đầu từ một buổi chiều rất bình thường, rồi dần trở thành một phần quan trọng của nhau.';
    data.letter = preview.letter || 'Em ơi, cảm ơn em vì đã làm cuộc sống của anh nhiều màu hơn.';
    data.finalNote = preview.finalNote || 'Anh vẫn sẽ chọn em ❤️';
    data.coverPhoto = preview.coverPhoto || defaultCover();
    data.musicMode = preview.musicMode === 'music' ? 'music' : 'none';
    data.musicName = preview.musicName || '';
    data.musicData = preview.musicData || '';
    data.qrEnabled = Boolean(preview.qrEnabled || preview.qrContent);
    data.qrContent = preview.qrContent || '';
    selectedAlbum = Array.isArray(preview.album) && preview.album.length ? preview.album : [];
    renderResult();
    return true;
  } catch {
    showStatus('Không thể tải bản preview này.');
    return false;
  }
}

function init() {
  syncOptionalSections();
  updateCoverPreview(data.coverPhoto || '');
  const savedRaw = localStorage.getItem(STORAGE_KEY);
  if (savedRaw) {
    try {
      const saved = JSON.parse(savedRaw);
      populateForm(saved);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  if (!hydrateFromHash()) {
    showScreen(screens.form);
  }
}

inputs.coverPhoto.addEventListener('change', handleCoverFile);
inputs.albumPhotos.addEventListener('change', handleAlbumFiles);
$('#music-file').addEventListener('change', handleMusicFile);
$$('input[name="musicMode"]').forEach((input) => input.addEventListener('change', syncOptionalSections));
$('#qr-enabled').addEventListener('change', syncOptionalSections);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  showStatus('');
  if (!validate()) return;
  readForm();
  saveData();
  renderResult();
});

$('#open-button').addEventListener('click', openLovePage);
$('#edit-button').addEventListener('click', () => showScreen(screens.form));
$('#music-toggle').addEventListener('click', () => {
  const audio = $('#result-audio');
  if (!audio.src || !data.musicData) return;
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

document.addEventListener('click', (event) => {
  if (screens.love.hidden) return;
  if (event.target.closest('button')) return;
  createParticles();
});

window.addEventListener('load', init);
