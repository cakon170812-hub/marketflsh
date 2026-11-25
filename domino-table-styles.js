(() => {
  'use strict';

  const styles = [
    ['navy-gold', 'Azul marino y dorado'],
    ['moderna-1', 'Moderna 1 · Grafito y dorado'],
    ['moderna-2', 'Moderna 2 · Azul eléctrico'],
    ['moderna-3', 'Moderna 3 · Titanio champán'],
    ['moderna-4', 'Moderna 4 · Cristal ahumado'],
    ['moderna-5', 'Moderna 5 · Óvalo de grafito'],
    ['moderna-6', 'Moderna 6 · Cerámica negra'],
    ['clasica-1', 'Clásica 1 · Nogal y verde bosque'],
    ['clasica-2', 'Clásica 2 · Metal y azul intenso'],
    ['clasica-3', 'Clásica 3 · Cuero y tapete vino'],
    ['clasica-4', 'Clásica 4 · Roble y verde azulado'],
    ['clasica-5', 'Clásica 5 · Travertino e índigo'],
    ['clasica-6', 'Clásica 6 · Octágono berenjena'],
    ['clasica-7', 'Clásica 7 · Teca y caramelo'],
    ['clasica-8', 'Clásica 8 · Cuero y luz rosada']
  ];
  const labels = new Map(styles);
  const original = 'navy-gold';
  const image = key => key === original
    ? './images2/mesa-azul-salon.webp'
    : './images2/estilos-mesa/' + key + '.webp';
  const leader = () => typeof me !== 'undefined' && me?.role === 'leader';
  const modes = {normal:'Por gane', paid_pass:'Pintintín', points:'Por puntos', tournament:'Torneo'};
  const stage = document.getElementById('dominoStage');
  const surface = document.getElementById('dfcTableStyleSurface');
  surface?.classList.add('dfc-table-surface');

  // Percentages in the gallery artwork. Reuse nearby material from each
  // photograph to cover the illustrated labels, players and example tiles.
  // Each region is [left, top, width, height, source left, source top, source width, source height].
  const modernFirst = [
    [0, 0, 9, 17, 92, 0, 8, 17],
    [45, 2, 10, 20, 32, 2],
    [5, 28, 13, 25, 5, 53],
    [83, 33, 11, 19, 83, 53],
    [22, 31, 56, 21, 25, 52, 49, 12],
    [31, 65, 38, 23, 71, 65, 12, 23]
  ];
  const modernLast = [
    [0, 0, 9, 16, 92, 0, 8, 16],
    [45, 1, 10, 21, 31, 1],
    [2, 31, 12, 23, 2, 54],
    [86, 31, 12, 23, 86, 54],
    [27, 30, 45, 22, 27, 51, 17, 11],
    [44, 54, 12, 20, 33, 54],
    [29, 74, 42, 19, 72, 74, 11, 19]
  ];
  const classicFirst = [
    [0, 0, 10, 17, 11, 0],
    [45, 8, 11, 20, 31, 8],
    [5, 32, 13, 21, 7, 53],
    [83, 32, 13, 21, 81, 53],
    [32, 33, 38, 16, 33, 49, 35, 9],
    [34, 59, 33, 17, 67, 59, 16, 17],
    [44, 73, 13, 20, 62, 73]
  ];
  const classicLast = [
    [0, 0, 10, 18, 11, 0],
    [45, 8, 11, 18, 33, 8],
    [11, 31, 16, 23, 14, 54],
    [74, 31, 17, 23, 74, 54],
    [36, 34, 31, 16, 34, 49, 24, 8],
    [45, 55, 12, 19, 33, 55],
    [36, 72, 28, 16, 65, 72, 13, 16]
  ];
  const regions = {
    'moderna-1': modernFirst,
    'moderna-2': modernFirst,
    'moderna-3': modernFirst,
    'moderna-4': modernLast,
    'moderna-5': modernLast,
    'moderna-6': modernLast,
    'clasica-1': classicFirst,
    'clasica-2': classicFirst,
    'clasica-3': classicFirst,
    'clasica-4': classicFirst,
    'clasica-5': classicLast,
    'clasica-6': classicLast,
    'clasica-7': classicLast,
    'clasica-8': classicLast
  };

  const art = document.getElementById('dfcNavyTableArt');
  const scene = document.createElement('div');
  scene.className = 'dfc-table-scene';
  scene.setAttribute('aria-hidden', 'true');
  stage?.prepend(scene);

  function renderScene(key, artwork) {
    if (!stage || stage.dataset.tableStyle !== key) return;
    if (key === original) {
      const {naturalWidth, naturalHeight} = artwork;
      if (art) Object.assign(art, {src: artwork.src, width: naturalWidth, height: naturalHeight});
    } else {
      const artworkUrl = 'url("' + artwork.src + '")';
      surface?.style.setProperty('--dfc-felt-image', 'url("./images2/estilos-mesa/' + key + '-tapete.webp")');
      scene.style.setProperty('--dfc-scene-image', artworkUrl);
      scene.style.setProperty('--dfc-scene-aspect', artwork.naturalWidth / artwork.naturalHeight);
      stage.style.setProperty('--dfc-scene-image', artworkUrl);
      const patches = regions[key].map(([x, y, width, height, sourceX, sourceY, sourceWidth = width, sourceHeight = height]) => {
        const patch = document.createElement('span');
        Object.assign(patch.style, {
          left: x + '%', top: y + '%', width: width + '%', height: height + '%',
          backgroundSize: (10000 / sourceWidth) + '% ' + (10000 / sourceHeight) + '%',
          backgroundPosition: (100 * sourceX / (100 - sourceWidth)) + '% ' + (100 * sourceY / (100 - sourceHeight)) + '%'
        });
        return patch;
      });
      scene.replaceChildren(...patches);
    }
    stage.toggleAttribute('data-table-room', true);
    stage.toggleAttribute('data-gallery-room', key !== original);
  }

  const artworkByStyle = new Map();
  const artworkRetryAfter = new Map();
  function paintStyle(key) {
    const style = labels.has(key) ? key : original;
    if (!stage) return;
    const changed = stage.dataset.tableStyle !== style;
    if (changed || !stage.hasAttribute('data-table-room')) {
      stage.dataset.tableStyle = style;
      // Keep the shared points-table geometry and CSS fallback active,
      // even on first entry, a slow connection or a missing gallery image.
      stage.setAttribute('data-table-room', '');
      stage.removeAttribute('data-gallery-room');
      stage.style.removeProperty('--dfc-scene-image');
      surface?.style.removeProperty('--dfc-felt-image');
    }
    let artwork = artworkByStyle.get(style);
    if (artwork) {
      if (changed && artwork.complete && artwork.naturalWidth) renderScene(style, artwork);
      return;
    }
    if (Date.now() < (artworkRetryAfter.get(style) || 0)) return;
    artwork = new Image();
    artworkByStyle.set(style, artwork);
    artwork.addEventListener('load', () => {
      artworkRetryAfter.delete(style);
      renderScene(style, artwork);
    }, {once:true});
    artwork.addEventListener('error', () => {
      if (artworkByStyle.get(style) !== artwork) return;
      artworkByStyle.delete(style);
      artworkRetryAfter.set(style, Date.now() + 30000);
      // A failed image cannot disable the shared table or its controls.
      if (stage.dataset.tableStyle === style) {
        stage.removeAttribute('data-gallery-room');
        stage.setAttribute('data-table-room', '');
      }
    }, {once:true});
    artwork.src = image(style);
    if (artwork.complete && artwork.naturalWidth) renderScene(style, artwork);
  }

  window.dfcTableStyles = {paint:paintStyle};
  paintStyle(original);

  const seats = document.getElementById('dominoSeats');
  if (stage && seats) {
    const nearRack = document.createElement('div');
    nearRack.className = 'dfc-real-rack';
    nearRack.dataset.rack = '1';
    nearRack.setAttribute('aria-hidden', 'true');
    nearRack.style.display = 'none';
    stage.append(nearRack);
    let nearCount = 0;
    const updateNearRack = () => {
      const count = seats.querySelector('.domino-seat.s1:not(.empty) .domino-tile-count:not([hidden])');
      const total = window.dominoSpectatorMode && stage.hasAttribute('data-table-room')
        ? count?.querySelectorAll('.domino-seat-back-tile').length || 0 : 0;
      if (total === nearCount) return;
      nearCount = total;
      nearRack.replaceChildren(...Array.from({length:total}, () => {
        const tile = document.createElement('span');
        tile.className = 'dfc-standing-back';
        return tile;
      }));
      nearRack.style.display = total ? 'flex' : 'none';
    };
    new MutationObserver(updateNearRack).observe(seats, {childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
    new MutationObserver(updateNearRack).observe(stage, {attributes:true,attributeFilter:['data-table-room']});
  }

  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const playTile = dominoPlayTile;
  dominoPlayTile = function(index, side, source) {
    if (!source && Number.isInteger(index) && stage?.hasAttribute('data-table-room') && !reducedMotion.matches) {
      source = stage.querySelector('#dominoHand [data-domino-tile="' + index + '"]');
    }
    return playTile.call(this, index, side, source);
  };

  const moveEffects = dominoHandleMoveEffects;
  dominoHandleMoveEffects = function(state) {
    const effects = moveEffects.apply(this, arguments);
    const move = state?.last_move;
    const hand = state?.hand;
    if (!effects?.animate || !stage?.hasAttribute('data-table-room') ||
        !hand || hand.board?.length !== stage.querySelectorAll('#dominoBoard .board-piece').length + 1 ||
        reducedMotion.matches) return effects;
    const seat = [...seats.querySelectorAll('[data-seat-user]')].find(item => item.dataset.seatUser === String(move.user_id));
    const number = seat?.dataset.visualSeat;
    const own = String(move.user_id) === String(state.me);
    if (!number || (own && mfDominoPlayPending)) return effects;
    const rack = own ? document.getElementById('dominoHand') : stage.querySelector('.dfc-real-rack[data-rack="' + number + '"]');
    const from = rack?.getBoundingClientRect();
    if (!from?.width || !from.height) return effects;
    requestAnimationFrame(() => {
      if (!stage.hasAttribute('data-table-room') || dominoState?.hand?.id !== hand.id ||
          dominoState?.last_move?.id !== move.id) return;
      const side = move.side === 'left' ? 'left' : 'right';
      const tile = stage.querySelector('#dominoBoard .domino-end-' + side);
      const to = tile?.getBoundingClientRect();
      if (!to?.width || !to.height) return;
      const scale = to.width / tile.offsetWidth || 1;
      const x = (from.x + from.width / 2 - to.x - to.width / 2) / scale;
      const y = (from.y + from.height / 2 - to.y - to.height / 2) / scale;
      tile.animate([{translate:x + 'px ' + y + 'px'}, {translate:'0px 0px'}], {
        duration:245, easing:'cubic-bezier(.19,.7,.4,1)'
      });
    });
    return effects;
  };

  const launcher = document.querySelector('[data-dfc-open-table-styles="bots"]');
  const title = document.querySelector('#mfAdmin16_domino .mf-admin-subpanel > h2');
  if (!launcher || !title) return;
  launcher.removeAttribute('data-dfc-open-table-styles');
  launcher.id = 'dfcTableStylesLauncher';
  launcher.textContent = 'Imágenes de mesa';
  launcher.setAttribute('aria-haspopup', 'dialog');
  title.after(launcher);

  const dialog = document.createElement('dialog');
  dialog.id = 'dfcTableStylesDialog';
  dialog.className = 'panel';
  dialog.setAttribute('aria-labelledby', 'dfcTableStylesHeading');
  dialog.innerHTML = `
    <header>
      <h2 id="dfcTableStylesHeading">Imágenes de mesa</h2>
      <button type="button" aria-label="Cerrar">×</button>
    </header>
    <fieldset class="dfc-table-style-scope">
      <legend>Aplicar a</legend>
      <label><input name="dfc-table-style-scope" type="radio" value="single" checked> Una mesa específica</label>
      <label><input name="dfc-table-style-scope" type="radio" value="all"> Todas las mesas</label>
    </fieldset>
    <div class="dfc-table-style-search">
      <label for="dfcTableStyleQuery">Buscar por nombre, número o ID</label>
      <input id="dfcTableStyleQuery" type="search" autocomplete="off">
      <label for="dfcTableStyleTable">Mesa</label>
      <select id="dfcTableStyleTable"></select>
    </div>
    <div class="dfc-table-style-editor" hidden>
      <div class="dfc-table-style-preview">
        <figure>
          <img class="dfc-table-preview" alt="">
          <figcaption></figcaption>
        </figure>
        <div class="dfc-table-style-details">
          <strong data-table-label></strong>
          <div data-current></div>
          <div data-pending></div>
          <p>Toca una imagen para aplicar el diseño.</p>
        </div>
      </div>
      <fieldset><legend>Modernas</legend><div data-gallery="modern" tabindex="0" role="group" aria-label="Diseños modernos"></div></fieldset>
      <fieldset><legend>Clásicas</legend><div data-gallery="classic" tabindex="0" role="group" aria-label="Diseños clásicos"></div></fieldset>
      <fieldset><legend>Estilo original</legend><div data-gallery="original"></div></fieldset>
    </div>
    <p role="status" aria-live="polite"></p>`;
  document.body.append(dialog);

  const scope = dialog.querySelector('.dfc-table-style-scope');
  const all = scope.querySelector('[value="all"]');
  const search = dialog.querySelector('.dfc-table-style-search');
  const query = search.querySelector('input');
  const tableSelect = search.querySelector('select');
  const editor = dialog.querySelector('.dfc-table-style-editor');
  const status = dialog.querySelector('[role="status"]');
  const preview = dialog.querySelector('.dfc-table-preview');
  const caption = dialog.querySelector('figcaption');
  const cards = new Map();
  let tables = [];
  let table = null;
  let request = 0;
  let saving = false;

  const pointsImage = './images2/mesa-azul-salon-puntos.webp';
  const galleryImage = (key, points) => points && key === original ? pointsImage : image(key);

  for (const [key, label] of styles) {
    const card = document.createElement('button');
    card.type = 'button';
    card.dataset.style = key;
    card.setAttribute('aria-pressed', 'false');
    const thumbnail = document.createElement('img');
    thumbnail.loading = 'lazy';
    thumbnail.src = image(key);
    thumbnail.alt = '';
    const name = document.createElement('span');
    name.textContent = label;
    card.append(thumbnail, name);
    const group = key === original ? 'original' : key.startsWith('moderna') ? 'modern' : 'classic';
    dialog.querySelector('[data-gallery="' + group + '"]').append(card);
    cards.set(key, card);
  }

  const tableName = item => item.name + ' · Mesa #' + item.number + ' · ID ' + item.id;
  const searchText = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const styleLabels = () => new Set(tables.map(item => item.selected_style));

  function listTables() {
    const id = tableSelect.value;
    const term = searchText(query.value.trim());
    tableSelect.replaceChildren(new Option('Selecciona una mesa', ''));
    for (const [mode, name] of Object.entries(modes)) {
      const group = document.createElement('optgroup');
      group.label = name;
      for (const item of tables) {
        if (item.mode !== mode || !searchText(tableName(item)).includes(term)) continue;
        group.append(new Option(tableName(item), item.id));
      }
      if (group.children.length) tableSelect.append(group);
    }
    if ([...tableSelect.options].some(option => option.value === id)) tableSelect.value = id;
    tableSelect.disabled = tableSelect.options.length === 1;
  }

  function showSelection(key) {
    const points = !all.checked && table?.mode === 'points';
    cards.get(original).querySelector('img').src = galleryImage(original, points);
    for (const [value, card] of cards) card.setAttribute('aria-pressed', String(key === value));
    preview.hidden = !key;
    if (key) preview.src = galleryImage(key, points);
    caption.textContent = key ? labels.get(key) : '';
  }

  function showTarget() {
    editor.hidden = all.checked ? !tables.length : !table;
    if (editor.hidden) return;
    const existing = styleLabels();
    dialog.querySelector('[data-table-label]').textContent = all.checked
      ? 'Todas las mesas · ' + tables.length
      : tableName(table);
    dialog.querySelector('[data-current]').textContent = all.checked
      ? (existing.size === 1 ? 'Estilo guardado: ' + labels.get([...existing][0]) : 'Hay mesas con distintos estilos')
      : 'En pantalla: ' + labels.get(table.visible_style);
    dialog.querySelector('[data-pending]').textContent = !all.checked && table.pending
      ? 'Próxima mano: ' + labels.get(table.selected_style) : '';
    showSelection(all.checked ? (existing.size === 1 ? [...existing][0] : null) : table.selected_style);
  }

  async function call(name, args) {
    const {data, error} = await sb.rpc(name, args);
    if (error) throw error;
    return data;
  }

  async function lookup() {
    const token = ++request;
    table = null;
    status.textContent = '';
    search.hidden = all.checked;
    showTarget();
    if (all.checked || !tableSelect.value) return;
    status.textContent = 'Buscando mesa…';
    try {
      const data = await call('dfc_domino_admin_table_style', {p_table_id:tableSelect.value});
      if (token !== request || !dialog.open) return;
      const item = tables.find(item => item.id === tableSelect.value);
      table = {...item, ...data, mode:item?.mode || data.mode};
      showTarget();
      status.textContent = '';
    } catch (error) {
      if (token === request) status.textContent = error.message || 'No se pudo buscar la mesa.';
    }
  }

  launcher.addEventListener('click', async () => {
    if (!leader() || dialog.open) return;
    const token = ++request;
    table = null;
    tables = [];
    scope.querySelector('[value="single"]').checked = true;
    scope.disabled = true;
    search.hidden = false;
    query.value = '';
    query.disabled = true;
    listTables();
    showTarget();
    dialog.showModal();
    status.textContent = 'Cargando mesas…';
    try {
      const data = await call('dfc_domino_admin_table_styles');
      if (token !== request || !dialog.open) return;
      tables = data.tables;
      listTables();
      scope.disabled = false;
      query.disabled = false;
      query.focus();
      status.textContent = tables.length ? '' : 'No hay mesas disponibles.';
    } catch (error) {
      if (token === request) status.textContent = error.message || 'No se pudo cargar el listado de mesas.';
    }
  });
  scope.addEventListener('change', lookup);
  tableSelect.addEventListener('change', lookup);
  query.addEventListener('input', () => {
    const previous = tableSelect.value;
    listTables();
    if (previous !== tableSelect.value) void lookup();
  });
  async function applyStyle(style) {
    if (!leader() || saving || !cards.has(style)) return;
    const isAll = all.checked;
    const tableId = table?.id;
    if (isAll ? !tables.length || tables.every(item => item.selected_style === style)
      : !tableId || table.selected_style === style) return;

    saving = true;
    scope.disabled = query.disabled = tableSelect.disabled = true;
    editor.setAttribute('aria-busy', 'true');
    for (const card of cards.values()) card.disabled = true;
    status.textContent = 'Aplicando diseño…';
    try {
      if (isAll) {
        const result = await call('dfc_domino_admin_table_styles', {p_style_key:style});
        tables = result.tables;
        listTables();
        status.textContent = 'Diseño guardado para ' + result.applied + (result.applied === 1 ? ' mesa.' : ' mesas.')
          + (result.pending ? ' Mesas que lo verán en la próxima mano: ' + result.pending + '.' : '');
      } else {
        const result = await call('dfc_domino_admin_table_style', {p_table_id:tableId,p_style_key:style});
        table = {...table, ...result, mode:table.mode};
        tables = tables.map(item => item.id === tableId ? {...item,selected_style:table.selected_style} : item);
        status.textContent = table.pending
          ? 'Diseño guardado. Se aplicará al comenzar la próxima mano.'
          : 'Diseño aplicado a la mesa ' + tableId + '.';
      }
      showTarget();
    } catch (error) {
      status.textContent = error.message || 'No se pudo guardar el diseño. Toca la imagen para reintentar.';
    } finally {
      saving = false;
      editor.removeAttribute('aria-busy');
      scope.disabled = query.disabled = false;
      tableSelect.disabled = tableSelect.options.length === 1;
      for (const card of cards.values()) card.disabled = false;
      cards.get(style).focus({preventScroll:true});
    }
  }

  editor.addEventListener('click', event => {
    const card = event.target.closest('button[data-style]');
    if (card) void applyStyle(card.dataset.style);
  });

  dialog.querySelector('header button').addEventListener('click', () => {
    if (!saving) dialog.close();
  });
  dialog.addEventListener('cancel', event => {
    if (saving) event.preventDefault();
  });
  dialog.addEventListener('close', () => {
    request++;
    launcher.focus();
  });
})();

(() => {
  'use strict';
  const previous = window.dominoTurnRingUpdate;
  if (typeof previous === 'function') {
    // Keep the authoritative timing and the seconds label used by the table.
    window.dominoTurnRingUpdate = function(seat, deadline, totalMs) {
      cancelAnimationFrame(dominoTurnRingFrame);
      if (!seat) return;
      const fullTurn = 360;
      const draw = () => {
        if (!seat.isConnected || !seat.classList.contains('turn')) return;
        const remaining = Math.max(0, deadline - mfDominoNow());
        const angle = Math.min(fullTurn, remaining / totalMs * fullTurn);
        seat.style.setProperty('--turn-angle', angle.toFixed(2) + 'deg');
        const seconds = String(Math.ceil(remaining / 1000));
        const label = seat.querySelector('.domino-turn-seconds');
        if (label && label.textContent !== seconds) label.textContent = seconds;
        if (remaining > 0) dominoTurnRingFrame = requestAnimationFrame(draw);
      };
      draw();
    };
  }

  // Pass notifications already have a server-confirmed sender and recipient.
  // An increase by itself has no source, so it must not start a second flight.
  if (window.DFC_Z161?.flyDiamond) window.DFC_Z161.flyDiamond = () => {};

  if (window.DFC_Z163?.onSync) {
    const syncDiamonds = window.DFC_Z163.onSync;
    window.DFC_Z163.onSync = function(data, tableId) {
      const serverTime = Date.parse(data?.server_time);
      if (Number.isFinite(serverTime) && Array.isArray(data.passes)) {
        const localNow = Date.now();
        const passes = data.passes.map(pass => ({
          ...pass,
          created_at: new Date(localNow - Math.max(0, serverTime - Date.parse(pass.created_at))).toISOString()
        }));
        return syncDiamonds.call(this, {...data, passes}, tableId);
      }
      return syncDiamonds.call(this, data, tableId);
    };
  }

  const chat = document.createElement('script');
  chat.src = './domino-table-chat.js?v=20261124-1';
  document.head.append(chat);
})();
