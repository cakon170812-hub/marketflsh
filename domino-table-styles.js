(() => {
  'use strict';

  const styles = [
    ['navy-gold', 'Estilo original'],
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
    ? './images2/mesa-azul-marino-dorada.webp'
    : './images2/estilos-mesa/' + key + '.webp';
  const leader = () => typeof me !== 'undefined' && me?.role === 'leader';
  const stage = document.getElementById('dominoStage');
  const surface = document.getElementById('dfcTableStyleSurface');

  window.dfcTableStyles = {
    paint(key) {
      const style = labels.has(key) ? key : original;
      if (!stage || !surface || stage.dataset.tableStyle === style) return;
      stage.dataset.tableStyle = style;
      if (style === original) surface.style.removeProperty('--dfc-felt-image');
      else surface.style.setProperty('--dfc-felt-image', 'url("./images2/estilos-mesa/' + style + '-tapete.webp")');
    }
  };

  const launcher = document.createElement('button');
  launcher.type = 'button';
  launcher.className = 'mf-admin-card';
  launcher.dataset.dfcOpenTableStyles = '';
  launcher.setAttribute('aria-haspopup', 'dialog');
  launcher.textContent = 'Cambiar estilo de mesa';
  const adminHome = document.querySelector('#leaderPanel .dfc-admin-primary')
    || document.querySelector('#leaderPanel .mf-admin-grid');
  adminHome?.append(launcher);

  const dialog = document.createElement('dialog');
  dialog.id = 'dfcTableStylesDialog';
  dialog.setAttribute('aria-labelledby', 'dfcTableStylesHeading');
  dialog.innerHTML = `
    <header>
      <h2 id="dfcTableStylesHeading">Cambiar estilo de mesa</h2>
      <button type="button" aria-label="Cerrar">×</button>
    </header>
    <form class="dfc-table-style-search">
      <label for="dfcTableStyleId">ID de la mesa</label>
      <input id="dfcTableStyleId" type="text" inputmode="numeric" maxlength="19" required>
      <button type="button" data-paste>Pegar</button>
      <button type="submit">Buscar</button>
    </form>
    <div class="dfc-table-style-editor" hidden>
      <div class="dfc-table-style-preview">
        <figure><img alt=""><figcaption></figcaption></figure>
        <div class="dfc-table-style-details">
          <strong data-table-label></strong>
          <div data-current></div>
          <div data-pending></div>
          <button type="button" data-save disabled>Guardar estilo</button>
        </div>
      </div>
      <fieldset><legend>Modernas</legend><div data-gallery="modern"></div></fieldset>
      <fieldset><legend>Clásicas</legend><div data-gallery="classic"></div></fieldset>
      <fieldset><legend>Restaurar</legend><div data-gallery="original"></div></fieldset>
    </div>
    <p role="status" aria-live="polite"></p>`;
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const input = form.querySelector('input');
  const editor = dialog.querySelector('.dfc-table-style-editor');
  const status = dialog.querySelector('[role="status"]');
  const save = dialog.querySelector('[data-save]');
  const preview = dialog.querySelector('figure img');
  const caption = dialog.querySelector('figcaption');
  let table = null;
  let selected = original;
  let request = 0;
  let saving = false;
  let opener;
  const radioInputs = new Map();

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

  function showSelection(key) {
    selected = labels.has(key) ? key : original;
    radioInputs.get(selected).checked = true;
    preview.src = image(selected);
    caption.textContent = labels.get(selected);
    save.disabled = saving || !table || selected === table.selected_style;
  }

  function showTable(data) {
    table = data;
    editor.hidden = false;
    const modes = {normal:'Por gane', classic:'Por gane', paid_pass:'Pintintín', pintintin:'Pintintín', points:'Por puntos', tournament:'Torneo'};
    const mode = /torneo/i.test(data.name) ? 'Torneo' : modes[data.mode] || data.mode;
    dialog.querySelector('[data-table-label]').textContent = 'Mesa #' + data.number + ' · ID ' + data.id + ' · ' + data.name + ' · ' + mode;
    dialog.querySelector('[data-current]').textContent = 'En pantalla: ' + labels.get(data.visible_style);
    dialog.querySelector('[data-pending]').textContent = data.pending
      ? 'Próxima mano: ' + labels.get(data.selected_style)
      : '';
    showSelection(data.selected_style);
  }

  function resetSearch() {
    request++;
    table = null;
    editor.hidden = true;
    status.textContent = '';
  }

  async function call(tableId, key) {
    const args = {p_table_id:tableId};
    if (key !== undefined) args.p_style_key = key;
    const {data, error} = await sb.rpc('dfc_domino_admin_table_style', args);
    if (error) throw error;
    return data;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!leader() || saving) return;
    resetSearch();
    const id = input.value.trim();
    if (!/^[0-9]{1,19}$/.test(id) || BigInt(id) < 1n || BigInt(id) > 9223372036854775807n) {
      status.textContent = 'Escribe un ID de mesa válido.';
      return;
    }
    const lookup = request;
    status.textContent = 'Buscando mesa…';
    try {
      const data = await call(id);
      if (lookup !== request || !dialog.open) return;
      showTable(data);
      status.textContent = '';
    } catch (error) {
      if (lookup === request) status.textContent = error.message || 'No se pudo buscar la mesa.';
    }
  });

  input.addEventListener('input', resetSearch);
  form.querySelector('[data-paste]').addEventListener('click', async () => {
    if (!leader() || saving) return;
    try {
      const value = (await navigator.clipboard.readText()).trim();
      if (!dialog.open || saving) return;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    } catch {
      status.textContent = 'Mantén pulsado el campo ID y elige Pegar.';
    }
    input.focus();
  });

  editor.addEventListener('change', event => {
    if (!saving && radioInputs.has(event.target.value)) showSelection(event.target.value);
  });

  save.addEventListener('click', async () => {
    if (!leader() || !table || saving || save.disabled) return;
    saving = true;
    save.disabled = true;
    input.disabled = true;
    for (const radio of radioInputs.values()) radio.disabled = true;
    status.textContent = 'Guardando estilo…';
    try {
      const data = await call(table.id, selected);
      showTable(data);
      status.textContent = data.pending
        ? 'Guardado. Se aplicará al comenzar la próxima mano.'
        : 'Estilo guardado para la mesa ' + data.id + '.';
    } catch (error) {
      status.textContent = error.message || 'No se pudo guardar el estilo.';
    } finally {
      saving = false;
      input.disabled = false;
      for (const radio of radioInputs.values()) radio.disabled = false;
      save.disabled = selected === table?.selected_style;
    }
  });

  dialog.querySelector('header button').addEventListener('click', () => {
    if (!saving) dialog.close();
  });
  dialog.addEventListener('cancel', event => {
    if (saving) event.preventDefault();
  });
  dialog.addEventListener('close', () => {
    resetSearch();
    opener?.focus();
  });

  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-dfc-open-table-styles]');
    if (!trigger || !leader() || dialog.open) return;
    opener = trigger;
    resetSearch();
    input.value = trigger.dataset.dfcOpenTableStyles === 'bots'
      ? document.getElementById('mf19TableFind')?.value.trim() || ''
      : '';
    dialog.showModal();
    input.focus();
    if (input.value) form.requestSubmit();
  });
})();
