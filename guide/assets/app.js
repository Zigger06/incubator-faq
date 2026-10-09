(() => {
  'use strict';

  const one = (selector) => document.querySelector(selector);
  const normalize = (value) => String(value).normalize('NFKC').toLocaleLowerCase('tg').replaceAll('а', 'a').trim();

  async function copyLink(url, status) {
    if (!status) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(url);
      status.textContent = 'Пайванд нусхабардорӣ шуд';
    } catch {
      const link = document.createElement('a');
      link.href = url;
      link.textContent = url;
      status.replaceChildren(document.createTextNode('Пайванд барои нусхабардорӣ: '), link);
    }
  }

  const dataNode = one('#model-data');
  if (dataNode) {
    const models = JSON.parse(dataNode.textContent);
    const byCode = new Map(models.map((model) => [normalize(model.code), model]));
    const grid = one('#model-grid');
    const cards = [...grid.querySelectorAll('[data-code]')];
    const search = one('#model-search');
    const clear = one('#clear-search');
    const capacity = one('#capacity-filter');
    const filters = [...document.querySelectorAll('[data-filter]')];
    const count = one('#results-count');
    const empty = one('#empty-state');
    const dialog = one('#model-dialog');
    let activeFilter = 'all';
    let selectedModel = null;

    const applyFilters = () => {
      const terms = normalize(search.value).split(/\s+/).filter(Boolean);
      const selectedCapacity = capacity.value;
      let visible = 0;
      for (const card of cards) {
        const model = byCode.get(normalize(card.dataset.code));
        const matches = terms.every((term) => normalize(`${model.code} ${model.name}`).includes(term)) &&
          (activeFilter !== 'video' || model.hasVideo) &&
          (selectedCapacity === 'all' || String(model.capacity) === selectedCapacity);
        card.hidden = !matches;
        if (matches) visible++;
      }
      count.textContent = `${visible} модел`;
      empty.hidden = visible !== 0;
      clear.hidden = !search.value;
      for (const button of filters) {
        const active = button.dataset.filter === activeFilter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      }
    };

    search.addEventListener('input', applyFilters);
    search.addEventListener('search', applyFilters);
    search.closest('form')?.addEventListener('submit', (event) => event.preventDefault());
    capacity.addEventListener('change', applyFilters);
    clear.addEventListener('click', () => {
      search.value = '';
      applyFilters();
      search.focus();
    });
    filters.forEach((button) => button.addEventListener('click', () => {
      activeFilter = button.dataset.filter;
      applyFilters();
    }));
    one('#reset-filters').addEventListener('click', () => {
      search.value = '';
      capacity.value = 'all';
      activeFilter = 'all';
      applyFilters();
      search.focus();
    });

    const openModel = (model) => {
      selectedModel = model;
      one('#dialog-title').textContent = `Модели ${model.code}`;
      one('#dialog-name').textContent = model.name;
      one('#dialog-code').textContent = model.code;
      const image = one('#dialog-image');
      image.src = model.image;
      image.alt = `${model.name}, коди ${model.code}`;
      const videoContainer = one('#dialog-video');
      videoContainer.replaceChildren();
      if (model.hasVideo) {
        const link = document.createElement('a');
        link.className = 'button button--primary';
        link.href = `models/${model.code.toLowerCase()}/`;
        link.textContent = 'Кушодани видео';
        videoContainer.append(link);
      } else {
        const note = document.createElement('p');
        note.textContent = 'Барои ин модел ҳоло видео илова нашудааст.';
        videoContainer.append(note);
      }
      const status = one('#dialog-share-status');
      if (status) status.textContent = '';
      dialog.showModal();
    };
    grid.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-code]');
      if (button) openModel(byCode.get(normalize(button.dataset.code)));
    });
    one('#dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
    });
    one('#dialog-share')?.addEventListener('click', () => {
      if (!selectedModel) return;
      const url = new URL(location.href);
      url.search = '';
      url.hash = '';
      url.searchParams.set('model', selectedModel.code);
      copyLink(url.href, one('#dialog-share-status'));
    });
    document.addEventListener('keydown', (event) => {
      if (event.key !== '/' || dialog.open || event.ctrlKey || event.metaKey || event.altKey ||
          event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      search.focus();
    });

    applyFilters();
    const requested = new URLSearchParams(location.search).get('model');
    if (requested) {
      const canonical = normalize(requested) === '3251' ? '3251a' : normalize(requested);
      const model = byCode.get(canonical);
      if (model?.hasVideo) location.replace(new URL(`models/${model.code.toLowerCase()}/`, location.href));
      else if (model) openModel(model);
    }
  }

  const play = one('#video-facade');
  if (play) {
    play.addEventListener('click', () => {
      const id = play.dataset.videoId;
      if (!/^[a-zA-Z0-9_-]{11}$/.test(id)) return;
      const player = document.createElement('iframe');
      player.id = 'youtube-player';
      player.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
      player.title = `Видео барои инкубатори ${play.dataset.modelCode}`;
      player.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      player.referrerPolicy = 'strict-origin-when-cross-origin';
      player.allowFullscreen = true;
      one('#video-shell').replaceChildren(player);
      player.focus({ preventScroll: true });
      const status = one('#video-status');
      if (status) status.textContent = 'Агар видео кушода нашавад, пайванди «Тамошо дар YouTube»-ро истифода баред.';
    }, { once: true });
  }
  one('#share-page')?.addEventListener('click', () => copyLink(location.href.split('#')[0], one('#share-status')));
})();
