(function () {
  const EMPTY = '';
  const copy = Object.freeze({
    memory: 'Một kỷ niệm của chúng mình',
    timelineMemory: 'Kỷ niệm trong hành trình',
    typingConnecting: 'đang kết nối...',
    typingFound: 'đã tìm thấy ký ức',
    typingDecoding: 'đang mở lá thư...',
    typingComplete: 'đã hoàn tất',
    calendarStarted: 'Đây là nơi câu chuyện của chúng mình bắt đầu.',
    unlockHint: 'Chưa đúng. Ngày bắt đầu câu chuyện đang giữ chiếc chìa khóa.',
    unlockGranted: 'Đã mở khóa.',
    orbitMemory: 'Hành tinh kỷ niệm',
    orbitDescription: 'Một khoảnh khắc được giữ lại trong quỹ đạo của chúng mình.',
    orbitBeginning: 'Ngày chúng mình bắt đầu'
  });
  const validMediaProtocols = ['http:', 'https:', 'blob:', 'data:'];

  function text(value) {
    return value == null ? EMPTY : String(value);
  }

  function array(value) {
    return Array.isArray(value) ? value : [];
  }

  function firstValue() {
    for (const value of arguments) {
      if (value !== undefined && value !== null && String(value).trim()) return value;
    }
    return EMPTY;
  }

  function normalizeDate(value) {
    const candidate = text(value).trim();
    if (!candidate) return EMPTY;
    const date = new Date(`${candidate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? EMPTY : candidate;
  }

  function normalizeLoveData(rawData) {
    const raw = rawData && typeof rawData === 'object' ? rawData : {};
    const names = raw.names && typeof raw.names === 'object' ? raw.names : {};
    const avatar = raw.avatar && typeof raw.avatar === 'object' ? raw.avatar : {};
    const music = raw.music && typeof raw.music === 'object' ? raw.music : {};
    const photos = array(raw.photos || raw.album).map(text).map((value) => value.trim()).filter(Boolean);
    const timeline = array(raw.timeline).filter((item) => item && typeof item === 'object').map((item) => {
      const image = text(firstValue(item.image, item.imageUrl, item.image_url)).trim();
      const description = text(firstValue(item.description, item.text)).trim();
      return {
        date: text(firstValue(item.date, item.eventDate, item.event_date)).trim(),
        title: text(item.title).trim(),
        description,
        text: description,
        image,
        imageUrl: image
      };
    });
    const person1 = text(firstValue(names.person1, raw.name1, raw.senderName, 'Minh')).trim();
    const person2 = text(firstValue(names.person2, raw.name2, raw.receiverName, 'Ngọc')).trim();
    const message = text(firstValue(raw.message, raw.shortMessage, 'Một điều giản dị, nhưng rất đáng nhớ.')).trim();
    const letter = text(firstValue(raw.letter, raw.loveLetter)).trim();
    const finalMessage = text(firstValue(raw.finalMessage, 'Yêu em hơn mỗi ngày.')).trim();
    const avatar1 = text(firstValue(avatar.person1, raw.avatar1, raw.photo1)).trim();
    const avatar2 = text(firstValue(avatar.person2, raw.avatar2, raw.photo2)).trim();
    const musicUrl = text(firstValue(music.url, raw.musicUrl, raw.music)).trim();
    const musicTitle = text(firstValue(music.title, raw.musicTitle)).trim();
    const startDate = normalizeDate(firstValue(raw.startDate, raw.specialDate));
    const customData = raw.customData && typeof raw.customData === 'object' ? raw.customData : {};

    return {
      templateId: text(raw.templateId || raw.template_id).trim() || 'love-50-01',
      names: { person1, person2 },
      name1: person1,
      name2: person2,
      message,
      shortMessage: message,
      letter,
      loveLetter: letter,
      startDate,
      photos,
      timeline,
      avatar: { person1: avatar1, person2: avatar2 },
      avatar1,
      avatar2,
      music: { url: musicUrl, title: musicTitle },
      musicUrl,
      musicTitle,
      finalMessage,
      customData
    };
  }

  function resolveElement(elementOrSelector) {
    return typeof elementOrSelector === 'string' ? document.querySelector(elementOrSelector) : elementOrSelector;
  }

  function setText(elementOrSelector, value) {
    const element = resolveElement(elementOrSelector);
    if (element) element.textContent = value == null ? EMPTY : String(value);
    return element;
  }

  function safeMediaUrl(value) {
    const candidate = text(value).trim();
    if (!candidate) return EMPTY;
    try {
      const url = new URL(candidate, window.location.href);
      if (!validMediaProtocols.includes(url.protocol)) return EMPTY;
      if (url.protocol === 'data:' && !/^data:image\/(gif|jpe?g|png|webp|avif);base64,/i.test(candidate)) return EMPTY;
      return url.href;
    } catch {
      return EMPTY;
    }
  }

  function setSafeImage(elementOrSelector, url, alt, options = {}) {
    const element = resolveElement(elementOrSelector);
    if (!element || element.tagName !== 'IMG') return null;
    const safeUrl = safeMediaUrl(url);
    element.alt = text(alt);
    if (options.loading) element.loading = options.loading;
    if (!safeUrl) {
      element.removeAttribute('src');
      return element;
    }
    element.src = safeUrl;
    element.onerror = () => {
      element.removeAttribute('src');
      if (typeof options.onError === 'function') options.onError(element);
    };
    return element;
  }

  function renderGallery(containerOrSelector, photos, options = {}) {
    const container = resolveElement(containerOrSelector);
    if (!container) return [];
    container.replaceChildren();
    const validPhotos = array(photos).map(safeMediaUrl).filter(Boolean);
    if (!validPhotos.length) {
      if (options.emptyMessage) setupEmptyState(container, options.emptyMessage);
      return [];
    }
    return validPhotos.map((url, index) => {
      const image = document.createElement('img');
      setSafeImage(image, url, options.alt ? `${options.alt} ${index + 1}` : `Memory ${index + 1}`, { loading: 'lazy' });
      container.appendChild(image);
      return image;
    });
  }

  function renderTimeline(containerOrSelector, timeline, options = {}) {
    const container = resolveElement(containerOrSelector);
    if (!container) return [];
    container.replaceChildren();
    const entries = array(timeline).filter((item) => item && (item.date || item.title || item.description || item.text || item.image));
    if (!entries.length) {
      if (options.emptyMessage) setupEmptyState(container, options.emptyMessage);
      return [];
    }
    return entries.map((item) => {
      const article = document.createElement('article');
      const date = document.createElement('strong');
      const title = document.createElement('h3');
      const description = document.createElement('p');
      date.textContent = text(item.date);
      title.textContent = text(item.title);
      description.textContent = text(item.description || item.text);
      article.append(date, title, description);
      if (item.image || item.imageUrl) {
        const image = document.createElement('img');
        setSafeImage(image, item.image || item.imageUrl, text(item.title) || 'Timeline memory', { loading: 'lazy' });
        article.appendChild(image);
      }
      container.appendChild(article);
      return article;
    });
  }

  function renderAvatar(elementOrSelector, avatarUrl, alt) {
    return setSafeImage(elementOrSelector, avatarUrl, alt || 'Avatar');
  }

  function setupCountdown(elements, dateValue, options = {}) {
    const selectors = typeof elements === 'string' ? { days: elements } : (elements || {});
    const targets = Object.fromEntries(Object.entries(selectors).map(([key, value]) => [key, resolveElement(value)]));
    const date = normalizeDate(dateValue);
    const start = date ? new Date(`${date}T00:00:00`) : null;
    const update = () => {
      let totalSeconds = 0;
      if (start && !Number.isNaN(start.getTime())) totalSeconds = Math.max(0, Math.floor((Date.now() - start.getTime()) / 1000));
      const values = {
        days: Math.floor(totalSeconds / 86400),
        hours: Math.floor((totalSeconds % 86400) / 3600),
        minutes: Math.floor((totalSeconds % 3600) / 60),
        seconds: totalSeconds % 60
      };
      for (const [key, element] of Object.entries(targets)) if (element) element.textContent = String(values[key] ?? 0);
      if (options.invalidMessage && !date && options.invalidTarget) setText(options.invalidTarget, options.invalidMessage);
    };
    update();
    const interval = window.setInterval(update, options.interval || 1000);
    return () => window.clearInterval(interval);
  }

  function setupMusic(config, elements = {}) {
    const audio = resolveElement(elements.audio || 'audio[data-love-music]');
    const control = resolveElement(elements.control || '[data-love-music-toggle]');
    const url = safeMediaUrl(config && (config.url || config.musicUrl));
    if (!audio || !url) {
      if (control) control.hidden = true;
      return () => {};
    }
    audio.src = url;
    if (config.title) audio.setAttribute('aria-label', text(config.title));
    if (!control) return () => { audio.pause(); audio.removeAttribute('src'); };
    control.hidden = false;
    const toggle = async () => {
      if (audio.paused) await audio.play().catch(() => {});
      else audio.pause();
    };
    control.addEventListener('click', toggle);
    return () => { control.removeEventListener('click', toggle); audio.pause(); audio.removeAttribute('src'); };
  }

  function setupReducedMotion(callback) {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => callback(Boolean(query.matches));
    update();
    query.addEventListener?.('change', update);
    return () => query.removeEventListener?.('change', update);
  }

  function setupEmptyState(elementOrSelector, message) {
    const element = resolveElement(elementOrSelector);
    if (!element) return null;
    element.dataset.empty = 'true';
    if (message) element.textContent = text(message);
    return element;
  }

  function createLifecycle() {
    const cleanups = [];
    return {
      add(cleanup) { if (typeof cleanup === 'function') cleanups.push(cleanup); return cleanup; },
      cleanup() { while (cleanups.length) cleanups.pop()(); }
    };
  }

  function bindCommon(data, lifecycle) {
    const textBindings = {
      '#result-sender-name': data.name1,
      '#result-receiver-name': data.name2,
      '#letter-signature': data.name1,
      '#result-message': data.shortMessage,
      '#result-letter': data.loveLetter,
      '#result-date': data.startDate,
      '#final-message': data.finalMessage
    };
    for (const [selector, value] of Object.entries(textBindings)) setText(selector, value);

    const photoContainer = resolveElement('#result-album');
    const albumSection = resolveElement('#album-section');
    if (photoContainer && data.photos.length) {
      renderGallery(photoContainer, data.photos, { alt: 'Kỷ niệm' });
      if (albumSection) albumSection.hidden = false;
    } else if (albumSection) {
      albumSection.hidden = true;
    }

    const timelineContainer = resolveElement('#timeline-list');
    const timelineSection = resolveElement('#timeline-section');
    if (timelineContainer && data.timeline.length) {
      renderTimeline(timelineContainer, data.timeline, { alt: 'Kỷ niệm trong hành trình' });
      if (timelineSection) timelineSection.hidden = false;
    } else if (timelineSection) {
      timelineSection.hidden = true;
    }

    const letterSection = resolveElement('#letter-section');
    if (letterSection && !data.loveLetter) letterSection.hidden = true;
    renderAvatar('#result-sender-photo', data.avatar1, `${data.name1} avatar`);
    renderAvatar('#result-receiver-photo', data.avatar2, `${data.name2} avatar`);

    const countdownSelectors = {};
    for (const key of ['days', 'hours', 'minutes', 'seconds']) if (resolveElement(`#counter-${key}`)) countdownSelectors[key] = `#counter-${key}`;
    if (Object.keys(countdownSelectors).length) lifecycle.add(setupCountdown(countdownSelectors, data.startDate));
    lifecycle.add(setupReducedMotion((reduced) => document.documentElement.classList.toggle('reduce-motion', reduced)));
    lifecycle.add(setupMusic(data.music));
  }

  function bindVariant(data, variant, lifecycle) {
    if (variant === 'letter') {
      const openButton = resolveElement('#open-letter, #open-letter-button');
      const sheet = resolveElement('#letter-sheet');
      if (openButton && sheet) {
        const open = () => { sheet.classList.add('is-open'); openButton.setAttribute('aria-expanded', 'true'); sheet.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
        openButton.addEventListener('click', open);
        lifecycle.add(() => openButton.removeEventListener('click', open));
      }
    }

    if (variant === 'starry') {
      const reveal = () => document.querySelectorAll('.reveal').forEach((element) => { if (element.getBoundingClientRect().top < window.innerHeight * 0.9) element.classList.add('is-visible'); });
      window.addEventListener('scroll', reveal, { passive: true });
      reveal();
      lifecycle.add(() => window.removeEventListener('scroll', reveal));
      document.querySelectorAll('[data-memory]').forEach((button) => {
        const revealMemory = () => {
          const item = data.timeline[Number(button.dataset.memory)] || { title: copy.memory, text: data.shortMessage };
          setText('#memory-note', [item.date, item.title, item.description].filter(Boolean).join(' · '));
        };
        button.addEventListener('click', revealMemory);
        lifecycle.add(() => button.removeEventListener('click', revealMemory));
      });
      const opening = resolveElement('#opening');
      const world = resolveElement('#story-world');
      const openStory = resolveElement('#open-story');
      if (opening && world && openStory) {
        const open = () => { opening.hidden = true; world.hidden = false; document.querySelectorAll('.reveal').forEach((element) => element.classList.add('is-visible')); };
        openStory.addEventListener('click', open);
        lifecycle.add(() => openStory.removeEventListener('click', open));
      }
    }

    if (variant === 'typing') {
      const fields = [resolveElement('#typed-names'), resolveElement('#typed-message'), resolveElement('#typed-letter')];
      const values = [data.name1 && data.name2 ? `${data.name1} + ${data.name2}` : '', data.shortMessage, data.loveLetter];
      let runId = 0;
      const type = (element, value, delay, id) => new Promise((resolve) => {
        if (!element) { resolve(); return; }
        let index = 0;
        element.textContent = '';
        const next = () => { if (id !== runId) { resolve(); return; } element.textContent = value.slice(0, index += 1); if (index < value.length) window.setTimeout(next, delay); else resolve(); };
        next();
      });
      const run = async () => { const id = ++runId; setText('#typing-status', copy.typingConnecting); await type(fields[0], values[0], 65, id); setText('#typing-status', copy.typingFound); await type(fields[1], values[1], 28, id); setText('#typing-status', copy.typingDecoding); await type(fields[2], values[2], 18, id); if (id === runId) setText('#typing-status', copy.typingComplete); };
      const replay = resolveElement('#replay');
      if (replay) { replay.addEventListener('click', run); lifecycle.add(() => { ++runId; replay.removeEventListener('click', run); }); }
      run();
    }

    if (variant === 'calendar') {
      const anniversary = data.startDate ? new Date(`${data.startDate}T00:00:00`) : null;
      const month = anniversary && !Number.isNaN(anniversary.getTime()) ? new Date(anniversary) : new Date();
      const grid = resolveElement('#calendar-grid');
      const label = resolveElement('#month-label');
      const render = () => {
        if (!grid || !label) return;
        const year = month.getFullYear(); const monthIndex = month.getMonth(); const first = (new Date(year, monthIndex, 1).getDay() + 6) % 7; const total = new Date(year, monthIndex + 1, 0).getDate();
        label.textContent = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(month); grid.replaceChildren();
        for (let index = 0; index < 42; index += 1) { const number = index - first + 1; const day = number < 1 ? new Date(year, monthIndex, 0).getDate() + number : number > total ? number - total : number; const cell = document.createElement('button'); cell.type = 'button'; cell.className = `calendar-day${number < 1 || number > total ? ' muted' : ''}`; cell.textContent = String(day); if (anniversary && number >= 1 && number <= total && day === anniversary.getDate() && monthIndex === anniversary.getMonth()) cell.classList.add('anniversary-day'); cell.addEventListener('click', () => { if (cell.classList.contains('anniversary-day')) setText('#calendar-hint', copy.calendarStarted); }); grid.appendChild(cell); }
      };
      const previous = resolveElement('#previous-month'); const next = resolveElement('#next-month');
      const shift = (amount) => { month.setMonth(month.getMonth() + amount); render(); };
      previous?.addEventListener('click', () => shift(-1)); next?.addEventListener('click', () => shift(1)); lifecycle.add(() => { previous?.replaceWith(previous.cloneNode(true)); next?.replaceWith(next.cloneNode(true)); }); render();
    }

    if (variant === 'balloons') {
      const field = resolveElement('#balloon-field');
      if (field) data.timeline.slice(0, 10).concat(data.timeline.length ? [] : [{}]).forEach((item, index) => { const balloon = document.createElement('button'); balloon.type = 'button'; balloon.className = 'balloon'; balloon.style.left = `${12 + (index * 19) % 78}%`; balloon.style.top = `${18 + (index * 23) % 48}%`; balloon.setAttribute('aria-label', 'Mở một kỷ niệm'); balloon.addEventListener('click', () => { const note = document.createElement('span'); note.className = 'balloon-memory'; note.textContent = item.description || item.text || data.shortMessage || 'Một điều thật đáng nhớ.'; note.style.left = balloon.style.left; note.style.top = balloon.style.top; field.querySelectorAll('.balloon-memory').forEach((old) => old.remove()); field.appendChild(note); window.setTimeout(() => note.remove(), 3800); }); field.appendChild(balloon); });
    }

    if (variant === 'vault') {
      const start = data.startDate.split('-'); const key = start.length === 3 ? `${start[2]}${start[1]}` : '';
      const unlock = () => { const input = resolveElement('#secret-code'); const status = resolveElement('#unlock-status'); if (!input || !status) return; if (input.value.replace(/\D/g, '') !== key) { status.textContent = copy.unlockHint; return; } resolveElement('#unlock-panel')?.setAttribute('hidden', 'true'); resolveElement('#secret-letter')?.removeAttribute('hidden'); document.querySelector('.vault-hero')?.classList.add('open'); status.textContent = copy.unlockGranted; };
      const button = resolveElement('#unlock-button'); const input = resolveElement('#secret-code'); button?.addEventListener('click', unlock); input?.addEventListener('keydown', (event) => { if (event.key === 'Enter') unlock(); }); lifecycle.add(() => { button?.removeEventListener('click', unlock); });
    }

    if (variant === 'orbit') {
      const field = resolveElement('#node-field'); const detail = resolveElement('#planet-detail'); const nodes = data.timeline.concat(data.photos.map((photo, index) => ({ title: `${copy.orbitMemory} ${index + 1}`, description: copy.orbitDescription, image: photo }))).slice(0, 8);
      if (field) nodes.concat(nodes.length ? [] : [{ title: copy.orbitBeginning, description: data.shortMessage }]).forEach((item, index) => { const node = document.createElement('button'); node.type = 'button'; node.className = 'node'; node.textContent = String(index + 1).padStart(2, '0'); node.style.left = `${12 + (index * 23) % 76}%`; node.style.top = `${12 + (index * 31) % 68}%`; node.setAttribute('aria-label', `Mở quỹ đạo kỷ niệm ${index + 1}`); node.addEventListener('click', () => { setText('#detail-title', item.title); setText('#detail-date', item.date); setText('#detail-text', item.description || item.text); if (detail) detail.hidden = false; }); field.appendChild(node); });
      const close = resolveElement('#close-detail'); close?.addEventListener('click', () => { if (detail) detail.hidden = true; }); const core = resolveElement('#core-heart'); core?.addEventListener('click', () => { setText('#detail-title', `${data.name1} & ${data.name2}`); setText('#detail-date', data.startDate); setText('#detail-text', data.loveLetter || data.shortMessage); if (detail) detail.hidden = false; });
    }
  }

  function mount(rawData, variant) {
    window.__LuuButTemplateCleanup?.();
    const data = normalizeLoveData(rawData);
    const lifecycle = createLifecycle();
    bindCommon(data, lifecycle);
    bindVariant(data, variant, lifecycle);
    window.__LuuButTemplateCleanup = lifecycle.cleanup;
    return data;
  }

  window.LuuButRuntime = {
    normalizeLoveData,
    setText,
    setSafeImage,
    safeMediaUrl,
    renderGallery,
    renderTimeline,
    renderAvatar,
    setupCountdown,
    setupMusic,
    setupReducedMotion,
    setupEmptyState,
    createLifecycle,
    mount
  };
}());
