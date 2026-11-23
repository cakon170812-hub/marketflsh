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

  function paint(target, targetSurface, key) {
    const style = labels.has(key) ? key : original;
    if (!target || !targetSurface || target.dataset.tableStyle === style) return;
    target.dataset.tableStyle = style;
    if (style === original) targetSurface.style.removeProperty('--dfc-felt-image');
    else targetSurface.style.setProperty('--dfc-felt-image', 'url("./images2/estilos-mesa/' + style + '-tapete.webp")');
  }

  const art = document.getElementById('dfcNavyTableArt');
  const room = new Image();
  let roomLoaded = false;
  function syncRoom() {
    stage?.toggleAttribute('data-table-room', roomLoaded && (stage.dataset.tableStyle || original) === original);
  }
  if (art && stage) {
    room.onload = () => {
      art.src = room.src;
      art.width = room.naturalWidth;
      art.height = room.naturalHeight;
      roomLoaded = true;
      syncRoom();
    };
    room.src = image(original);
  }

  window.dfcTableStyles = {
    paint(key) {
      paint(stage, surface, key);
      syncRoom();
    }
  };

  const seats = document.getElementById('dominoSeats');
  if (stage && seats) {
    const nearRack = document.createElement('div');
    nearRack.className = 'dfc-real-rack';
    nearRack.dataset.rack = '1';
    nearRack.setAttribute('aria-hidden', 'true');
    nearRack.style.display = 'none';
    stage.append(nearRack);
    let nearCount = 0;
    new MutationObserver(() => {
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
    }).observe(seats, {childList:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});
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
  launcher.setAttribute('aria-haspopup', 'dialog');
  title.after(launcher);

  const dialog = document.createElement('dialog');
  dialog.id = 'dfcTableStylesDialog';
  dialog.className = 'panel';
  dialog.setAttribute('aria-labelledby', 'dfcTableStylesHeading');
  dialog.innerHTML = `
    <header>
      <h2 id="dfcTableStylesHeading">Cambiar estilo de mesa</h2>
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
          <div class="dfc-table-preview-stage" aria-hidden="true">
            <div class="dfc-table-surface"><span></span></div>
            <div class="dfc-table-preview-board"></div>
            <div class="dfc-table-preview-hand"></div>
          </div>
          <figcaption></figcaption>
        </figure>
        <div class="dfc-table-style-details">
          <strong data-table-label></strong>
          <div data-current></div>
          <div data-pending></div>
          <button type="button" data-save disabled>Guardar estilo</button>
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
  const save = dialog.querySelector('[data-save]');
  const preview = dialog.querySelector('.dfc-table-preview-stage');
  const previewSurface = preview.querySelector('.dfc-table-surface');
  const caption = dialog.querySelector('figcaption');
  const radioInputs = new Map();
  let tables = [];
  let table = null;
  let selected = null;
  let request = 0;
  let saving = false;

  preview.querySelector('.dfc-table-preview-board').innerHTML = [[6,6],[6,5],[5,3],[3,4]]
    .map((tile, index) => dominoPiece(tile, index, false, true)).join('');
  preview.querySelector('.dfc-table-preview-hand').innerHTML = [[6,3],[1,2],[1,4],[3,3],[1,5],[6,4],[2,2]]
    .map((tile, index) => dominoPiece(tile, index, false, true)).join('');

  for (const [key, label] of styles) {
    const card = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'dfc-table-style';
    radio.value = key;
    const thumbnail = document.createElement('img');
    thumbnail.loading = 'lazy';
    thumbnail.src = image(key);
    thumbnail.alt = '';
    const name = document.createElement('span');
    name.textContent = label;
    card.append(radio, thumbnail, name);
    const group = key === original ? 'original' : key.startsWith('moderna') ? 'modern' : 'classic';
    dialog.querySelector('[data-gallery="' + group + '"]').append(card);
    radioInputs.set(key, radio);
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
    selected = labels.has(key) ? key : null;
    for (const [value, radio] of radioInputs) radio.checked = value === selected;
    paint(preview, previewSurface, selected || original);
    caption.textContent = selected ? labels.get(selected) : 'Elige un estilo para ver la vista previa';
    save.disabled = saving || !selected || (all.checked
      ? !tables.length || tables.every(item => item.selected_style === selected)
      : !table || table.selected_style === selected);
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
      table = data;
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
  editor.addEventListener('change', event => {
    if (!saving && radioInputs.has(event.target.value)) showSelection(event.target.value);
  });

  save.addEventListener('click', async () => {
    if (!leader() || saving || save.disabled) return;
    const isAll = all.checked;
    const style = selected;
    const tableId = table?.id;
    saving = true;
    scope.disabled = query.disabled = tableSelect.disabled = save.disabled = true;
    for (const radio of radioInputs.values()) radio.disabled = true;
    status.textContent = 'Guardando estilo…';
    try {
      if (isAll) {
        const result = await call('dfc_domino_admin_table_styles', {p_style_key:style});
        tables = result.tables;
        listTables();
        showTarget();
        status.textContent = 'Estilo guardado para ' + result.applied + (result.applied === 1 ? ' mesa.' : ' mesas.')
          + (result.pending ? ' Mesas que lo verán en la próxima mano: ' + result.pending + '.' : '');
      } else {
        table = await call('dfc_domino_admin_table_style', {p_table_id:tableId,p_style_key:style});
        tables = tables.map(item => item.id === tableId ? {...item,selected_style:table.selected_style} : item);
        showTarget();
        status.textContent = table.pending
          ? 'Guardado. Se aplicará al comenzar la próxima mano.'
          : 'Estilo guardado para la mesa ' + tableId + '.';
      }
    } catch (error) {
      status.textContent = error.message || 'No se pudo guardar el estilo.';
    } finally {
      saving = false;
      scope.disabled = query.disabled = false;
      tableSelect.disabled = tableSelect.options.length === 1;
      for (const radio of radioInputs.values()) radio.disabled = false;
      showSelection(selected);
    }
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
