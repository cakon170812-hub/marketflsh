/* =========================================================
   MARKET FLASH — SCRIPT.JS
   Lógica principal de la aplicación
   Compatible con el index.html actual
   ========================================================= */

(() => {
  'use strict';

  /* =========================================================
     CONFIGURACIÓN
     ========================================================= */

  const STORAGE_USER = 'mf_user';
  const STORAGE_PRODUCTS = 'mf_products';
  const STORAGE_CONFIG = 'mf_config';
  const STORAGE_ADS = 'mf_ads';

  let category = 'Todos';
  let user = loadJSON(STORAGE_USER, null);
  let products = loadJSON(STORAGE_PRODUCTS, null);
  let advertising = loadJSON(STORAGE_ADS, []);
  let navigationStack = [];

  /* =========================================================
     PRODUCTOS DE EJEMPLO
     ========================================================= */

  const seed = [
    {
      id: 1,
      name: 'iPhone 15 Pro',
      category: 'Celulares',
      price: 45000,
      location: 'Santo Domingo',
      seller: 'Market Flash',
      whatsapp: '',
      image: 'https://images.unsplash.com/photo-1696446702183-cbd13d5f2e88?auto=format&fit=crop&w=800&q=80',
      description: 'iPhone 15 Pro en excelentes condiciones.',
      views: 1284,
      likes: 86,
      saves: 34,
      profileVisits: 21
    },
    {
      id: 2,
      name: 'Samsung Galaxy S24',
      category: 'Celulares',
      price: 38000,
      location: 'Santiago',
      seller: 'Tecnología RD',
      whatsapp: '',
      image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80',
      description: 'Samsung Galaxy S24.',
      views: 743,
      likes: 51,
      saves: 18,
      profileVisits: 14
    },
    {
      id: 3,
      name: 'Laptop profesional',
      category: 'Computadoras',
      price: 52000,
      location: 'Santo Domingo',
      seller: 'Tech Store',
      whatsapp: '',
      image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=800&q=80',
      description: 'Laptop profesional.',
      views: 491,
      likes: 29,
      saves: 11,
      profileVisits: 8
    },
    {
      id: 4,
      name: 'PlayStation 5',
      category: 'Videojuegos',
      price: 32000,
      location: 'Santo Domingo Este',
      seller: 'Gaming RD',
      whatsapp: '',
      image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
      description: 'PlayStation 5.',
      views: 952,
      likes: 73,
      saves: 42,
      profileVisits: 25
    }
  ];

  if (!Array.isArray(products)) {
    products = seed;
    saveProducts();
  }

  if (!Array.isArray(advertising)) {
    advertising = [];
    saveAds();
  }

  /* =========================================================
     UTILIDADES
     ========================================================= */

  function loadJSON(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.error('Error leyendo almacenamiento:', error);
      return fallback;
    }
  }

  function saveJSON(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error guardando almacenamiento:', error);
    }
  }

  function saveProducts() {
    saveJSON(STORAGE_PRODUCTS, products);
  }

  function saveAds() {
    saveJSON(STORAGE_ADS, advertising);
  }

  function money(value) {
    return new Intl.NumberFormat('es-DO', {
      style: 'currency',
      currency: 'DOP',
      maximumFractionDigits: 0
    }).format(Number(value) || 0);
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char]));
  }

  function safeUrl(value) {
    const url = String(value || '').trim();

    if (!url) return '';

    if (
      url.startsWith('https://') ||
      url.startsWith('http://')
    ) {
      return url;
    }

    return '';
  }

  function normalizeWhatsapp(number) {
    return String(number || '').replace(/[^\d]/g, '');
  }

  function whatsappUrl(number, message = '') {
    const clean = normalizeWhatsapp(number);

    if (!clean) return '';

    return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
  }

  function toast(message) {
    const element = document.getElementById('toast');

    if (!element) return;

    element.textContent = message;
    element.classList.remove('hidden');

    clearTimeout(window.__marketFlashToast);

    window.__marketFlashToast = setTimeout(() => {
      element.classList.add('hidden');
    }, 2400);
  }

  /* =========================================================
     NAVEGACIÓN INTERNA
     ========================================================= */

  function pushNavigation() {
    navigationStack.push(true);
  }

  function clearNavigation() {
    navigationStack = [];
  }

  function goBack() {
    if (navigationStack.length > 0) {
      navigationStack.pop();

      if (navigationStack.length > 0) {
        const previous = navigationStack.pop();

        if (typeof previous === 'function') {
          previous();
          return;
        }
      }
    }

    home();
  }

  /*
   * Guardamos las pantallas como funciones para poder
   * regresar correctamente.
   */

  function openScreen(screenFunction) {
    navigationStack.push(screenFunction);
    screenFunction();
  }

  /* =========================================================
     OVERLAY / MODALES
     ========================================================= */

  function show(html, options = {}) {
    const overlay = document.getElementById('overlay');
    const sheet = document.getElementById('sheet');

    if (!overlay || !sheet) return;

    sheet.innerHTML = html;
    overlay.classList.remove('hidden');

    if (options.history !== false) {
      navigationStack.push(() => show(html, { history: false }));
    }

    bindDynamicButtons();
  }

  function close() {
    const overlay = document.getElementById('overlay');

    if (!overlay) return;

    overlay.classList.add('hidden');

    const sheet = document.getElementById('sheet');

    if (sheet) {
      sheet.innerHTML = '';
    }

    navigationStack = [];
  }

  function closeWithoutReset() {
    const overlay = document.getElementById('overlay');

    if (!overlay) return;

    overlay.classList.add('hidden');
  }

  /* =========================================================
     EVENTO PARA CERRAR AL TOCAR FUERA
     ========================================================= */

  function setupOverlay() {
    const overlay = document.getElementById('overlay');

    if (!overlay) return;

    overlay.addEventListener('click', event => {
      if (event.target === overlay) {
        close();
      }
    });
  }

  /* =========================================================
     BOTÓN ATRÁS
     ========================================================= */

  function backHeader(title) {
    return `
      <div class="modal-head">
        <div style="display:flex;align-items:center;gap:8px;min-width:0">
          <button
            type="button"
            class="close"
            data-action="back"
            aria-label="Atrás"
            title="Atrás"
          >‹</button>

          <h2>${title}</h2>
        </div>

        <button
          type="button"
          class="close"
          data-action="close"
          aria-label="Cerrar"
          title="Cerrar"
        >×</button>
      </div>
    `;
  }

  /* =========================================================
     INICIO
     ========================================================= */

  function home() {
    closeWithoutReset();

    navigationStack = [];

    category = 'Todos';

    document.querySelectorAll('.chip').forEach(button => {
      button.classList.remove('active');
    });

    const firstChip = document.querySelector('.chip');

    if (firstChip) {
      firstChip.classList.add('active');
    }

    const navHome = document.getElementById('navHome');
    const navActivity = document.getElementById('navActivity');

    if (navHome) navHome.classList.add('active');
    if (navActivity) navActivity.classList.remove('active');

    render();
  }

  /* =========================================================
     CATEGORÍAS
     ========================================================= */

  function setCategory(newCategory, button) {
    category = newCategory;

    document.querySelectorAll('.chip').forEach(item => {
      item.classList.remove('active');
    });

    if (button) {
      button.classList.add('active');
    }

    render();
  }

  /* =========================================================
     RENDER DE PRODUCTOS
     ========================================================= */

  function render() {
    const search = document.getElementById('search');
    const productsBox = document.getElementById('products');
    const count = document.getElementById('count');

    if (!productsBox) return;

    const query = search
      ? search.value.trim().toLowerCase()
      : '';

    const list = products.filter(product => {
      const matchesCategory =
        category === 'Todos' ||
        product.category === category;

      const matchesSearch =
        !query ||
        String(product.name || '').toLowerCase().includes(query) ||
        String(product.category || '').toLowerCase().includes(query) ||
        String(product.location || '').toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });

    if (count) {
      count.textContent =
        `${list.length} ${list.length === 1 ? 'producto' : 'productos'}`;
    }

    if (!list.length) {
      productsBox.innerHTML = `
        <div class="empty">
          <div style="font-size:44px">🔎</div>
          <h3>No encontramos productos</h3>
          <p>Prueba otra búsqueda o categoría.</p>
        </div>
      `;
      return;
    }

    productsBox.innerHTML = list.map(product => {
      const image = safeUrl(product.image) || '';

      return `
        <article
          class="product"
          data-product-id="${product.id}"
          style="cursor:pointer"
        >
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(product.name)}"
            onerror="this.style.objectFit='contain';this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22600%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23e2e8f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-size=%2260%22%3E📦%3C/text%3E%3C/svg%3E'"
          >

          <div class="product-info">
            <div class="product-name">
              ${escapeHtml(product.name)}
            </div>

            <div class="price">
              ${money(product.price)}
            </div>

            <div class="product-meta">
              📍 ${escapeHtml(product.location)}
            </div>
          </div>
        </article>
      `;
    }).join('');

    productsBox.querySelectorAll('.product').forEach(card => {
      card.addEventListener('click', () => {
        const id = Number(card.dataset.productId);
        openProduct(id);
      });
    });
  }

  /* =========================================================
     PRODUCTO
     ========================================================= */

  function openProduct(id) {
    const product = products.find(item => item.id === id);

    if (!product) return;

    product.views = Number(product.views || 0) + 1;
    saveProducts();

    const sellerWhatsapp =
      product.whatsapp ||
      (user && product.seller === user.name ? user.whatsapp : '');

    const image = safeUrl(product.image);

    show(`
      ${backHeader(escapeHtml(product.name))}

      <div class="product-detail">

        ${
          image
            ? `<img src="${escapeHtml(image)}"
                    alt="${escapeHtml(product.name)}">`
            : ''
        }

        <div style="margin-top:14px">

          <div
            class="price"
            style="font-size:27px"
          >
            ${money(product.price)}
          </div>

          <div class="muted">
            📍 ${escapeHtml(product.location)}
          </div>

        </div>

        ${
          product.description
            ? `
              <div
                class="card"
                style="margin-top:14px"
              >
                <strong>📝 Descripción</strong>

                <div
                  class="muted"
                  style="margin-top:6px;line-height:1.5"
                >
                  ${escapeHtml(product.description)}
                </div>
              </div>
            `
            : ''
        }

        <div
          class="card"
          style="margin-top:14px"
        >
          <strong>👤 Vendedor</strong>

          <div
            class="muted"
            style="margin-top:4px"
          >
            ${escapeHtml(product.seller)}
          </div>
        </div>

        <div class="stats">

          <div class="stat">
            <b>${product.views || 0}</b>
            <span>👁️ Visualizaciones</span>
          </div>

          <div class="stat">
            <b>${product.likes || 0}</b>
            <span>❤️ Reacciones</span>
          </div>

          <div class="stat">
            <b>${product.saves || 0}</b>
            <span>🔖 Guardados</span>
          </div>

          <div class="stat">
            <b>${product.profileVisits || 0}</b>
            <span>👤 Visitas al perfil</span>
          </div>

        </div>

        <button
          class="primary"
          style="margin-top:14px"
          data-action="like"
          data-id="${product.id}"
        >
          ❤️ Me interesa
        </button>

        ${
          sellerWhatsapp
            ? `
              <button
                class="primary"
                style="margin-top:8px;background:#16a34a"
                data-action="whatsapp-product"
                data-id="${product.id}"
              >
                <span style="font-size:20px">◉</span>
                WhatsApp
              </button>
            `
            : ''
        }

        <button
          class="secondary"
          style="margin-top:8px"
          data-action="contact"
          data-seller="${escapeHtml(product.seller)}"
        >
          📞 Contactar vendedor
        </button>

      </div>
    `);
  }

  function like(id) {
    const product = products.find(item => item.id === id);

    if (!product) return;

    product.likes = Number(product.likes || 0) + 1;

    saveProducts();

    toast('❤️ Interés registrado');

    openProduct(id);
  }

  function contact(seller) {
    const product = products.find(item => item.seller === seller);

    if (product && product.whatsapp) {
      openWhatsApp(
        product.whatsapp,
        `Hola, estoy interesado/a en tu publicación "${product.name}" en Market Flash.`
      );
      return;
    }

    if (user && product && product.seller === user.name && user.whatsapp) {
      openWhatsApp(
        user.whatsapp,
        'Hola, contacto desde Market Flash.'
      );
      return;
    }

    toast('📞 El vendedor todavía no tiene WhatsApp registrado.');
  }

  function openWhatsApp(number, message) {
    const url = whatsappUrl(number, message);

    if (!url) {
      toast('⚠️ Número de WhatsApp no válido.');
      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /* =========================================================
     PUBLICAR PRODUCTO
     ========================================================= */

  function openPublish() {
    show(`
      ${backHeader('➕ Publicar producto')}

      <form
        class="form"
        id="publishForm"
      >

        <div class="field">
          <label>📸 Imagen</label>

          <div
            style="
              display:grid;
              grid-template-columns:1fr 1fr;
              gap:8px;
            "
          >

            <button
              type="button"
              class="secondary"
              id="cameraButton"
            >
              📷 Cámara
            </button>

            <button
              type="button"
              class="secondary"
              id="galleryButton"
            >
              🖼️ Galería
            </button>

          </div>

          <input
            id="pCamera"
            type="file"
            accept="image/*"
            capture="environment"
            hidden
          >

          <input
            id="pGallery"
            type="file"
            accept="image/*"
            multiple
            hidden
          >

          <input
            id="pImage"
            type="url"
            placeholder="O pega una URL de imagen"
            style="margin-top:8px"
          >

          <div
            id="imagePreview"
            style="
              margin-top:10px;
              display:none;
            "
          ></div>
        </div>

        <div class="field">
          <label>🏷️ Nombre</label>
          <input
            id="pName"
            required
            placeholder="Ej. iPhone 15 Pro"
          >
        </div>

        <div class="field">
          <label>📂 Categoría</label>

          <select id="pCat" required>
            <option value="">Seleccionar</option>
            <option>Celulares</option>
            <option>Computadoras</option>
            <option>Videojuegos</option>
            <option>Ropa</option>
            <option>Hogar</option>
            <option>Vehículos</option>
          </select>
        </div>

        <div class="field">
          <label>💰 Precio</label>
          <input
            id="pPrice"
            type="number"
            min="0"
            required
          >
        </div>

        <div class="field">
          <label>📍 Ubicación</label>
          <input
            id="pLoc"
            required
            placeholder="Ciudad o provincia"
          >
        </div>

        <div class="field">
          <label>📝 Descripción</label>

          <textarea
            id="pDesc"
            placeholder="Describe el producto"
          ></textarea>
        </div>

        <div class="field">
          <label>📱 WhatsApp</label>

          <input
            id="pWhatsapp"
            type="tel"
            value="${escapeHtml(user?.whatsapp || '')}"
            placeholder="Ej. 18091234567"
          >

          <small class="muted">
            Si ya está registrado en tu cuenta, se utilizará automáticamente.
          </small>
        </div>

        <button
          class="primary"
          type="submit"
        >
          🚀 Publicar
        </button>

      </form>
    `);

    setupPublishForm();
  }

  function setupPublishForm() {
    const form = document.getElementById('publishForm');

    if (!form) return;

    const cameraButton = document.getElementById('cameraButton');
    const galleryButton = document.getElementById('galleryButton');
    const cameraInput = document.getElementById('pCamera');
    const galleryInput = document.getElementById('pGallery');
    const imageInput = document.getElementById('pImage');

    if (cameraButton && cameraInput) {
      cameraButton.addEventListener('click', () => {
        cameraInput.click();
      });
    }

    if (galleryButton && galleryInput) {
      galleryButton.addEventListener('click', () => {
        galleryInput.click();
      });
    }

    if (cameraInput) {
      cameraInput.addEventListener('change', event => {
        processImageFile(event.target.files?.[0]);
      });
    }

    if (galleryInput) {
      galleryInput.addEventListener('change', event => {
        processImageFile(event.target.files?.[0]);
      });
    }

    if (imageInput) {
      imageInput.addEventListener('input', () => {
        if (imageInput.value.trim()) {
          showImagePreview(imageInput.value.trim());
        }
      });
    }

    form.addEventListener('submit', event => {
      event.preventDefault();

      if (!user) {
        toast('Debes crear una cuenta o iniciar sesión.');
        return;
      }

      const name = document.getElementById('pName')?.value.trim();
      const cat = document.getElementById('pCat')?.value;
      const price = Number(document.getElementById('pPrice')?.value || 0);
      const loc = document.getElementById('pLoc')?.value.trim();
      const desc = document.getElementById('pDesc')?.value.trim();
      const whatsapp =
        document.getElementById('pWhatsapp')?.value.trim() ||
        user.whatsapp ||
        '';

      const image =
        document.getElementById('pImage')?.value.trim() ||
        '';

      if (!name || !cat || !loc) {
        toast('⚠️ Completa los campos obligatorios.');
        return;
      }

      const product = {
        id: Date.now(),
        name,
        category: cat,
        price,
        location: loc,
        seller: user.name,
        whatsapp,
        image,
        description: desc,
        views: 0,
        likes: 0,
        saves: 0,
        profileVisits: 0
      };

      if (whatsapp) {
        user.whatsapp = whatsapp;
        saveJSON(STORAGE_USER, user);
      }

      products.unshift(product);

      saveProducts();

      close();

      render();

      toast('✅ Producto publicado correctamente.');
    });
  }

  function processImageFile(file) {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast('⚠️ Selecciona una imagen válida.');
      return;
    }

    const reader = new FileReader();

    reader.onload = event => {
      const input = document.getElementById('pImage');

      if (input) {
        input.value = event.target.result;
      }

      showImagePreview(event.target.result);
    };

    reader.readAsDataURL(file);
  }

  function showImagePreview(source) {
    const preview = document.getElementById('imagePreview');

    if (!preview || !source) return;

    preview.style.display = 'block';

    preview.innerHTML = `
      <img
        src="${escapeHtml(source)}"
        style="
          width:100%;
          max-height:250px;
          object-fit:cover;
          border-radius:14px;
          border:1px solid #e5e7eb;
        "
        alt="Vista previa"
      >
    `;
  }

  /* =========================================================
     PERFIL
     ========================================================= */

  function openProfile() {
    if (!user) {
      show(`
        ${backHeader('👤 Mi cuenta')}

        <div class="profile">

          <div class="avatar">👤</div>

          <h3>Bienvenido a Market Flash</h3>

          <p
            class="muted"
            style="margin:6px 0 16px"
          >
            Crea tu cuenta o inicia sesión.
          </p>

          <button
            class="primary"
            data-action="register"
          >
            📝 Crear cuenta
          </button>

          <button
            class="secondary"
            style="margin-top:8px"
            data-action="login"
          >
            🔐 Iniciar sesión
          </button>

        </div>
      `);

      return;
    }

    show(`
      ${backHeader('👤 Mi perfil')}

      <div class="profile">

        <div class="avatar">👤</div>

        <h2>${escapeHtml(user.name)}</h2>

        <p class="muted">
          🪪 Cédula registrada
        </p>

        ${
          user.whatsapp
            ? `
              <p
                class="muted"
                style="margin-top:5px"
              >
                📱 WhatsApp: ${escapeHtml(user.whatsapp)}
              </p>
            `
            : ''
        }

      </div>

      <div class="menu">

        <button
          class="menu-item"
          data-action="activity"
        >
          <div class="menu-icon">📦</div>

          <div class="menu-copy">
            <strong>Mi actividad</strong>
            <small>
              Publicaciones, productos, ventas y recibos
            </small>
          </div>

          <b>›</b>
        </button>

        <button
          class="menu-item"
          data-action="settings"
        >
          <div class="menu-icon">⚙️</div>

          <div class="menu-copy">
            <strong>Configuración</strong>
            <small>Cuenta y seguridad</small>
          </div>

          <b>›</b>
        </button>

        <button
          class="menu-item"
          data-action="admin"
        >
          <div class="menu-icon">👑</div>

          <div class="menu-copy">
            <strong>Administración</strong>
            <small>Panel exclusivo del administrador</small>
          </div>

          <b>›</b>
        </button>

        <button
          class="menu-item"
          data-action="logout"
        >
          <div class="menu-icon">🚪</div>

          <div class="menu-copy">
            <strong>Cerrar sesión</strong>
            <small>Salir de la cuenta</small>
          </div>

          <b>›</b>
        </button>

      </div>
    `);
  }

  /* =========================================================
     REGISTRO
     ========================================================= */

  function register() {
    show(`
      ${backHeader('📝 Crear cuenta')}

      <div class="notice">
        La cédula y el número de WhatsApp son obligatorios.
        El correo electrónico es opcional.
      </div>

      <form
        class="form"
        id="regForm"
      >

        <div class="field">
          <label>👤 Nombre real completo</label>

          <input
            id="rName"
            required
            placeholder="Igual que en la cédula"
          >
        </div>

        <div class="field">
          <label>🪪 Número de cédula</label>

          <input
            id="rCed"
            required
            placeholder="Número de cédula"
          >
        </div>

        <div class="field">
          <label>📱 Número de WhatsApp</label>

          <input
            id="rWhatsapp"
            type="tel"
            required
            placeholder="Ej. 18091234567"
          >
        </div>

        <div class="field">
          <label>🔐 Contraseña</label>

          <input
            id="rPass"
            type="password"
            minlength="6"
            required
          >
        </div>

        <div class="field">
          <label>🛡️ Pregunta de recuperación</label>

          <select id="rQ" required>
            <option value="">Seleccionar</option>
            <option>¿Cuál era tu apodo de infancia?</option>
            <option>¿Cuál fue tu primer trabajo?</option>
            <option>¿Cuál es tu comida favorita?</option>
            <option>¿Cuál era el nombre de tu primera mascota?</option>
          </select>
        </div>

        <div class="field">
          <label>🛡️ Respuesta de recuperación</label>

          <input
            id="rA"
            required
          >
        </div>

        <div class="field">
          <label>📧 Correo electrónico (opcional)</label>

          <input
            id="rEmail"
            type="email"
          >
        </div>

        <button
          class="primary"
          type="submit"
        >
          Crear cuenta
        </button>

      </form>
    `);

    const form = document.getElementById('regForm');

    if (!form) return;

    form.addEventListener('submit', event => {
      event.preventDefault();

      user = {
        name: document.getElementById('rName').value.trim(),
        cedula: document.getElementById('rCed').value.trim(),
        whatsapp: document.getElementById('rWhatsapp').value.trim(),
        password: document.getElementById('rPass').value,
        question: document.getElementById('rQ').value,
        answer: document.getElementById('rA').value.trim().toLowerCase(),
        email: document.getElementById('rEmail').value.trim(),
        blocked: false
      };

      saveJSON(STORAGE_USER, user);

      close();

      toast('✅ Cuenta creada correctamente.');
    });
  }

  /* =========================================================
     LOGIN
     ========================================================= */

  function login() {
    show(`
      ${backHeader('🔐 Iniciar sesión')}

      <form
        class="form"
        id="loginForm"
      >

        <div class="field">
          <label>🪪 Cédula</label>

          <input
            id="lCed"
            required
          >
        </div>

        <div class="field">
          <label>🔐 Contraseña</label>

          <input
            id="lPass"
            type="password"
            required
          >
        </div>

        <button
          class="primary"
          type="submit"
        >
          Entrar
        </button>

      </form>

      <button
        class="secondary"
        style="margin-top:8px"
        data-action="recovery"
      >
        🔑 Recuperar contraseña
      </button>
    `);

    const form = document.getElementById('loginForm');

    if (!form) return;

    form.addEventListener('submit', event => {
      event.preventDefault();

      const saved = loadJSON(STORAGE_USER, null);

      if (!saved) {
        toast('No existe una cuenta.');
        return;
      }

      if (saved.blocked) {
        toast('🚫 Cuenta bloqueada por administración.');
        return;
      }

      const cedula =
        document.getElementById('lCed').value.trim();

      const password =
        document.getElementById('lPass').value;

      if (
        saved.cedula === cedula &&
        saved.password === password
      ) {
        user = saved;

        close();

        toast('✅ Sesión iniciada correctamente.');
      } else {
        toast('❌ Cédula o contraseña incorrecta.');
      }
    });
  }

  /* =========================================================
     RECUPERACIÓN
     ========================================================= */

  function recovery() {
    const saved = loadJSON(STORAGE_USER, null);

    if (!saved) {
      toast('No existe una cuenta.');
      return;
    }

    show(`
      ${backHeader('🔑 Recuperar contraseña')}

      <div class="notice">
        ${escapeHtml(saved.question)}
      </div>

      <div class="field">
        <label>Respuesta</label>

        <input id="recA">
      </div>

      <button
        class="primary"
        style="margin-top:12px"
        data-action="verify-recovery"
      >
        Verificar
      </button>
    `);
  }

  function verifyRecovery() {
    const saved = loadJSON(STORAGE_USER, null);

    if (!saved) {
      toast('No existe una cuenta.');
      return;
    }

    const answer =
      document.getElementById('recA')?.value
        .trim()
        .toLowerCase();

    if (answer === saved.answer) {
      toast(
        '✅ Identidad verificada. La recuperación segura se conectará al backend.'
      );
    } else {
      toast('❌ Respuesta incorrecta.');
    }
  }

  /* =========================================================
     ACTIVIDAD
     ========================================================= */

  function openActivity() {
    if (!user) {
      openProfile();
      return;
    }

    const navActivity =
      document.getElementById('navActivity');

    const navHome =
      document.getElementById('navHome');

    if (navActivity) navActivity.classList.add('active');
    if (navHome) navHome.classList.remove('active');

    const mine =
      products.filter(product => product.seller === user.name);

    show(`
      ${backHeader('📦 Mi actividad')}

      <div class="grid">

        <button
          class="card"
          data-action="my-publications"
        >
          <div class="big">📢</div>
          <strong>Mis publicaciones</strong>
          <small>
            Ver estadísticas y administrar
          </small>
        </button>

        <button
          class="card"
          data-action="my-products"
        >
          <div class="big">📦</div>
          <strong>Mis productos</strong>
          <small>${mine.length} productos</small>
        </button>

        <button
          class="card"
          data-action="my-sales"
        >
          <div class="big">💰</div>
          <strong>Mis ventas</strong>
          <small>Registro de ventas</small>
        </button>

        <button
          class="card"
          data-action="receipts"
        >
          <div class="big">🧾</div>
          <strong>Mis recibos</strong>
          <small>Comprobantes</small>
        </button>

        <button
          class="card"
          data-action="favorites"
        >
          <div class="big">❤️</div>
          <strong>Favoritos</strong>
          <small>Productos guardados</small>
        </button>

        <button
          class="card"
          data-action="history"
        >
          <div class="big">📋</div>
          <strong>Historial</strong>
          <small>Actividad reciente</small>
        </button>

      </div>
    `);
  }

  /* =========================================================
     MIS PUBLICACIONES
     ========================================================= */

  function myPublications() {
    const mine =
      products.filter(product => product.seller === user.name);

    show(`
      ${backHeader('📢 Mis publicaciones')}

      ${
        mine.length
          ? mine.map(product => `
            <div
              class="card"
              style="margin-bottom:10px"
            >

              <strong>
                ${escapeHtml(product.name)}
              </strong>

              <div
                class="muted"
                style="margin-top:6px"
              >
                👁️ ${product.views || 0}
                · ❤️ ${product.likes || 0}
                · 🔖 ${product.saves || 0}
                · 👤 ${product.profileVisits || 0}
              </div>

              <button
                class="primary"
                style="margin-top:10px"
                data-action="statistics"
                data-id="${product.id}"
              >
                📊 Ver estadísticas
              </button>

              <button
                class="secondary"
                style="margin-top:8px"
                data-action="edit-product"
                data-id="${product.id}"
              >
                ✏️ Editar
              </button>

              <button
                class="danger"
                style="margin-top:8px"
                data-action="delete-product"
                data-id="${product.id}"
              >
                🗑️ Eliminar publicación
              </button>

            </div>
          `).join('')
          : `
            <div class="empty">
              📢
              <br><br>
              No tienes publicaciones.
            </div>
          `
      }
    `);
  }

  /* =========================================================
     ESTADÍSTICAS
     ========================================================= */

  function statistics(id) {
    const product =
      products.find(item => item.id === id);

    if (!product) return;

    show(`
      ${backHeader('📊 Estadísticas')}

      <h3>
        ${escapeHtml(product.name)}
      </h3>

      <div class="stats">

        <div class="stat">
          <b>${product.views || 0}</b>
          <span>👁️ Visualizaciones</span>
        </div>

        <div class="stat">
          <b>${product.likes || 0}</b>
          <span>❤️ Reacciones</span>
        </div>

        <div class="stat">
          <b>${product.saves || 0}</b>
          <span>🔖 Guardados</span>
        </div>

        <div class="stat">
          <b>${product.profileVisits || 0}</b>
          <span>👤 Visitas al perfil</span>
        </div>

      </div>
    `);
  }

  /* =========================================================
     EDITAR PRODUCTO
     ========================================================= */

  function editProduct(id) {
    const product =
      products.find(item => item.id === id);

    if (!product) return;

    show(`
      ${backHeader('✏️ Editar publicación')}

      <form
        class="form"
        id="editProductForm"
      >

        <div class="field">
          <label>🏷️ Nombre</label>

          <input
            id="editName"
            value="${escapeHtml(product.name)}"
            required
          >
        </div>

        <div class="field">
          <label>💰 Precio</label>

          <input
            id="editPrice"
            type="number"
            min="0"
            value="${Number(product.price) || 0}"
            required
          >
        </div>

        <div class="field">
          <label>📍 Ubicación</label>

          <input
            id="editLocation"
            value="${escapeHtml(product.location)}"
            required
          >
        </div>

        <div class="field">
          <label>📝 Descripción</label>

          <textarea id="editDescription">${escapeHtml(
            product.description || ''
          )}</textarea>
        </div>

        <button
          class="primary"
          type="submit"
        >
          💾 Guardar cambios
        </button>

      </form>
    `);

    const form =
      document.getElementById('editProductForm');

    if (!form) return;

    form.addEventListener('submit', event => {
      event.preventDefault();

      product.name =
        document.getElementById('editName').value.trim();

      product.price =
        Number(document.getElementById('editPrice').value || 0);

      product.location =
        document.getElementById('editLocation').value.trim();

      product.description =
        document.getElementById('editDescription').value.trim();

      saveProducts();

      toast('✅ Publicación actualizada.');

      myPublications();
    });
  }

  /* =========================================================
     ELIMINAR PRODUCTO
     ========================================================= */

  function deleteProduct(id) {
    const product =
      products.find(item => item.id === id);

    if (!product) return;

    const confirmed =
      window.confirm(
        `¿Seguro que quieres eliminar "${product.name}"?`
      );

    if (!confirmed) return;

    products =
      products.filter(item => item.id !== id);

    saveProducts();

    toast('🗑️ Publicación eliminada.');

    myPublications();

    render();
  }

  /* =========================================================
     OTRAS SECCIONES
     ========================================================= */

  function myProducts() {
    myPublications();
  }

  function mySales() {
    simple(
      '💰 Mis ventas',
      'Aquí se registrarán las ventas realizadas.'
    );
  }

  function receipts() {
    simple(
      '🧾 Mis recibos',
      'Aquí aparecerán los recibos y comprobantes.'
    );
  }

  function favorites() {
    simple(
      '❤️ Favoritos',
      'Aquí aparecerán los productos guardados.'
    );
  }

  function historyPage() {
    simple(
      '📋 Historial',
      'Aquí aparecerá tu actividad reciente.'
    );
  }

  function simple(title, text) {
    show(`
      ${backHeader(title)}

      <div class="empty">
        ${escapeHtml(text)}
      </div>
    `);
  }

  /* =========================================================
     CONFIGURACIÓN
     ========================================================= */

  function settings() {
    show(`
      ${backHeader('⚙️ Configuración')}

      <div class="menu">

        <button
          class="menu-item"
          data-action="edit-profile"
        >
          <div class="menu-icon">👤</div>

          <div class="menu-copy">
            <strong>Editar perfil</strong>
            <small>Modificar información personal</small>
          </div>

          <b>›</b>
        </button>

        <button
          class="menu-item"
          data-action="change-pass"
        >
          <div class="menu-icon">🔐</div>

          <div class="menu-copy">
            <strong>Cambiar contraseña</strong>
            <small>Actualizar contraseña</small>
          </div>

          <b>›</b>
        </button>

        <button
          class="menu-item"
          data-action="security"
        >
          <div class="menu-icon">🛡️</div>

          <div class="menu-copy">
            <strong>Seguridad y recuperación</strong>
            <small>Datos para recuperar la cuenta</small>
          </div>

          <b>›</b>
        </button>

        <button
          class="menu-item"
          data-action="email-info"
        >
          <div class="menu-icon">📧</div>

          <div class="menu-copy">
            <strong>Correo electrónico</strong>
            <small>Opcional</small>
          </div>

          <b>›</b>
        </button>

      </div>
    `);
  }

  function editProfile() {
    if (!user) return;

    show(`
      ${backHeader('👤 Editar perfil')}

      <form
        class="form"
        id="profileForm"
      >

        <div class="field">
          <label>👤 Nombre</label>

          <input
            id="profileName"
            value="${escapeHtml(user.name)}"
            required
          >
        </div>

        <div class="field">
          <label>📱 WhatsApp</label>

          <input
            id="profileWhatsapp"
            type="tel"
            value="${escapeHtml(user.whatsapp || '')}"
            required
          >
        </div>

        <div class="field">
          <label>📧 Correo electrónico</label>

          <input
            id="profileEmail"
            type="email"
            value="${escapeHtml(user.email || '')}"
          >
        </div>

        <button
          class="primary"
          type="submit"
        >
          💾 Guardar cambios
        </button>

      </form>
    `);

    const form =
      document.getElementById('profileForm');

    if (!form) return;

    form.addEventListener('submit', event => {
      event.preventDefault();

      user.name =
        document.getElementById('profileName').value.trim();

      user.whatsapp =
        document.getElementById('profileWhatsapp').value.trim();

      user.email =
        document.getElementById('profileEmail').value.trim();

      saveJSON(STORAGE_USER, user);

      products.forEach(product => {
        if (product.seller === user.name) {
          product.whatsapp = user.whatsapp;
        }
      });

      saveProducts();

      toast('✅ Perfil actualizado.');

      openProfile();
    });
  }

  function changePass() {
    simple(
      '🔐 Cambiar contraseña',
      'La gestión segura de contraseña se conectará al backend.'
    );
  }

  function securityPage() {
    simple(
      '🛡️ Seguridad',
      'La cédula y los datos de recuperación quedarán protegidos mediante el backend.'
    );
  }

  /* =========================================================
     ADMINISTRACIÓN
     ========================================================= */

  function admin() {
    show(`
      ${backHeader('👑 Administración')}

      <div class="notice">
        Panel preparado para uso exclusivo del administrador.
      </div>

      <div class="grid">

        <button
          class="card"
          data-action="admin-users"
        >
          <div class="big">👥</div>
          <strong>Usuarios</strong>
          <small>Gestionar cuentas</small>
        </button>

        <button
          class="card"
          data-action="admin-blocked"
        >
          <div class="big">🚫</div>
          <strong>Bloqueos</strong>
          <small>Bloquear usuarios</small>
        </button>

        <button
          class="card"
          data-action="admin-posts"
        >
          <div class="big">📢</div>
          <strong>Publicaciones</strong>
          <small>Moderación</small>
        </button>

        <button
          class="card"
          data-action="admin-advertising"
        >
          <div class="big">📣</div>
          <strong>Publicidad</strong>
          <small>Control de cobro y anuncios</small>
        </button>

        <button
          class="card"
          data-action="admin-payments"
        >
          <div class="big">💳</div>
          <strong>Pagos y membresías</strong>
          <small>Métodos, precios y duración</small>
        </button>

        <button
          class="card"
          data-action="admin-inventory"
        >
          <div class="big">📦</div>
          <strong>Inventario</strong>
          <small>Control de productos</small>
        </button>

      </div>
    `);
  }

  function adminUsers() {
    simple(
      '👥 Usuarios',
      'Aquí se conectará la lista real de usuarios de la base de datos.'
    );
  }

  function adminBlocked() {
    simple(
      '🚫 Bloqueos',
      'Aquí el administrador podrá bloquear y mantener bloqueada una cuenta.'
    );
  }

  function adminPosts() {
    simple(
      '📢 Moderación',
      'Aquí se revisarán publicaciones, infracciones y reportes.'
    );
  }

  /* =========================================================
     PUBLICIDAD — CONFIGURACIÓN
     ========================================================= */

  function getAdvertisingConfig() {
    return loadJSON(STORAGE_CONFIG, {
      paid: false,

      categories: {
        barato: {
          bank: 500,
          binance: 10,
          paypal: 11
        },

        normal: {
          bank: 1000,
          binance: 20,
          paypal: 22
        },

        pro: {
          bank: 1500,
          binance: 30,
          paypal: 32
        }
      },

      bankAccounts: {
        banreservas: '',
        bhd: ''
      },

      binanceAddress: '',
      paypalUrl: ''
    });
  }

  function saveAdvertisingConfig(config) {
    saveJSON(STORAGE_CONFIG, config);
  }

  /* =========================================================
     PANEL ADMINISTRADOR — PUBLICIDAD
     ========================================================= */

  function adminAdvertising() {
    const config = getAdvertisingConfig();

    show(`
      ${backHeader('📣 Publicidad comercial')}

      <div class="row">

        <div>
          <strong>
            Cobrar por publicidad
          </strong>

          <div class="muted">
            Tú decides cuándo activar esta opción.
          </div>
        </div>

        <button
          id="adToggle"
          class="toggle ${config.paid ? 'on' : ''}"
          data-action="toggle-ad"
          aria-label="Activar o desactivar cobro"
        ></button>

      </div>

      <h3 style="margin:20px 0 10px">
        💎 Categorías de publicidad
      </h3>

      ${advertisingPriceFields(
        'barato',
        '🟢 Anuncio barato',
        config.categories.barato
      )}

      ${advertisingPriceFields(
        'normal',
        '🔵 Anuncio normal',
        config.categories.normal
      )}

      ${advertisingPriceFields(
        'pro',
        '🟣 Anuncio PRO',
        config.categories.pro
      )}

      <h3 style="margin:20px 0 10px">
        🏦 Cuentas para recibir pagos
      </h3>

      <div class="field">
        <label>🏦 BanReservas</label>
        <input
          id="bankBanreservas"
          value="${escapeHtml(config.bankAccounts?.banreservas || '')}"
          placeholder="Número de cuenta"
        >
      </div>

      <div class="field" style="margin-top:10px">
        <label>🏦 BHD</label>
        <input
          id="bankBhd"
          value="${escapeHtml(config.bankAccounts?.bhd || '')}"
          placeholder="Número de cuenta"
        >
      </div>

      <div class="field" style="margin-top:10px">
        <label>₿ Binance</label>
        <input
          id="adminBinance"
          value="${escapeHtml(config.binanceAddress || '')}"
          placeholder="Dirección o enlace"
        >
      </div>

      <div class="field" style="margin-top:10px">
        <label>🅿️ PayPal</label>
        <input
          id="adminPaypal"
          value="${escapeHtml(config.paypalUrl || '')}"
          placeholder="Enlace de pago"
        >
      </div>

      <button
        class="primary"
        style="margin-top:14px"
        data-action="save-ad-config"
      >
        💾 Guardar configuración
      </button>

      <button
        class="secondary"
        style="margin-top:8px"
        data-action="admin-advertisers"
      >
        🧾 Ver solicitudes de publicidad
      </button>
    `);
  }

  function advertisingPriceFields(type, title, data) {
    return `
      <div
        class="card"
        style="margin-bottom:12px"
      >

        <strong>${title}</strong>

        <div
          class="field"
          style="margin-top:10px"
        >
          <label>🏦 Precio Banco</label>

          <input
            id="${type}Bank"
            type="number"
            min="0"
            value="${Number(data?.bank || 0)}"
          >
        </div>

        <div
          class="field"
          style="margin-top:10px"
        >
          <label>₿ Precio Binance</label>

          <input
            id="${type}Binance"
            type="number"
            min="0"
            value="${Number(data?.binance || 0)}"
          >
        </div>

        <div
          class="field"
          style="margin-top:10px"
        >
          <label>🅿️ Precio PayPal</label>

          <input
            id="${type}Paypal"
            type="number"
            min="0"
            value="${Number(data?.paypal || 0)}"
          >
        </div>

      </div>
    `;
  }

  function toggleAd() {
    const config = getAdvertisingConfig();

    config.paid = !config.paid;

    saveAdvertisingConfig(config);

    const toggle =
      document.getElementById('adToggle');

    if (toggle) {
      toggle.classList.toggle('on', config.paid);
    }

    toast(
      config.paid
        ? '💰 Publicidad de pago activada.'
        : '🆓 Publicidad gratuita activada.'
    );
  }

  function saveAdConfig() {
    const config = getAdvertisingConfig();

    config.categories.barato = {
      bank: Number(document.getElementById('baratoBank')?.value || 0),
      binance: Number(document.getElementById('baratoBinance')?.value || 0),
      paypal: Number(document.getElementById('baratoPaypal')?.value || 0)
    };

    config.categories.normal = {
      bank: Number(document.getElementById('normalBank')?.value || 0),
      binance: Number(document.getElementById('normalBinance')?.value || 0),
      paypal: Number(document.getElementById('normalPaypal')?.value || 0)
    };

    config.categories.pro = {
      bank: Number(document.getElementById('proBank')?.value || 0),
      binance: Number(document.getElementById('proBinance')?.value || 0),
      paypal: Number(document.getElementById('proPaypal')?.value || 0)
    };

    config.bankAccounts = {
      banreservas:
        document.getElementById('bankBanreservas')?.value.trim() || '',

      bhd:
        document.getElementById('bankBhd')?.value.trim() || ''
    };

    config.binanceAddress =
      document.getElementById('adminBinance')?.value.trim() || '';

    config.paypalUrl =
      document.getElementById('adminPaypal')?.value.trim() || '';

    saveAdvertisingConfig(config);

    toast('✅ Configuración de publicidad guardada.');
  }

  /* =========================================================
     PUBLICIDAD — BOTÓN PUBLICITARIO
     ========================================================= */

  function createAdvertisingButton() {
    const adBox = document.querySelector('.ad');

    if (!adBox) return;

    if (document.getElementById('publicityButton')) {
      return;
    }

    const button = document.createElement('button');

    button.id = 'publicityButton';
    button.type = 'button';
    button.className = 'primary';
    button.style.marginTop = '12px';
    button.textContent = '📣 Publicitario';

    button.addEventListener('click', openAdvertising);

    const container = adBox.querySelector('div');

    if (container) {
      container.appendChild(button);
    } else {
      adBox.appendChild(button);
    }
  }

  /* =========================================================
     CREAR PUBLICIDAD
     ========================================================= */

  function openAdvertising() {
    if (!user) {
      show(`
        ${backHeader('📣 Publicidad')}

        <div class="notice">
          Para crear una publicidad necesitas tener una cuenta.
        </div>

        <button
          class="primary"
          data-action="register"
        >
          📝 Crear cuenta
        </button>

        <button
          class="secondary"
          style="margin-top:8px"
          data-action="login"
        >
          🔐 Iniciar sesión
        </button>
      `);

      return;
    }

    const config = getAdvertisingConfig();

    show(`
      ${backHeader('📣 Crear publicidad')}

      ${
        config.paid
          ? `
            <div class="notice">
              💰 La publicidad está actualmente
              <strong>por pago</strong>.
            </div>
          `
          : `
            <div class="notice">
              🆓 La publicidad está actualmente
              <strong>gratuita</strong>.
            </div>
          `
      }

      <form
        class="form"
        id="advertisingForm"
      >

        <div class="field">
          <label>🎥 Video del anuncio</label>

          <input
            id="adVideoFile"
            type="file"
            accept="video/*"
            required
          >

          <div
            id="adVideoPreview"
            style="margin-top:10px;display:none"
          ></div>
        </div>

        <div class="field">
          <label>📝 Título del anuncio</label>

          <input
            id="adTitle"
            required
            placeholder="Nombre de tu publicidad"
          >
        </div>

        <div class="field">
          <label>💎 Tipo de anuncio</label>

          <select
            id="adPlan"
            required
          >

            <option value="">
              Seleccionar categoría
            </option>

            <option value="barato">
              🟢 Anuncio barato
            </option>

            <option value="normal">
              🔵 Anuncio normal
            </option>

            <option value="pro">
              🟣 Anuncio PRO
            </option>

          </select>
        </div>

        <div class="field">
          <label>📲 ¿Dónde quieres enviar al cliente?</label>

          <select
            id="adDestination"
            required
          >

            <option value="">
              Seleccionar destino
            </option>

            <option value="whatsapp">
              🟢 WhatsApp
            </option>

            <option value="messenger">
              💬 Messenger
            </option>

            <option value="url">
              🔗 Página web / URL
            </option>

          </select>
        </div>

        <div
          class="field"
          id="adDestinationField"
        >
          <label id="destinationLabel">
            Destino
          </label>

          <input
            id="adDestinationValue"
            placeholder="Selecciona primero el destino"
          >
        </div>

        <div
          id="adPriceBox"
          class="notice"
          style="display:none"
        ></div>

        ${
          config.paid
            ? `
              <div class="notice">
                Después de enviar tu publicidad,
                deberás realizar el pago y enviar
                la captura del comprobante.
              </div>
            `
            : ''
        }

        <button
          class="primary"
          type="submit"
        >
          🚀 Continuar con la publicidad
        </button>

      </form>
    `);

    setupAdvertisingForm();
  }

  function setupAdvertisingForm() {
    const form =
      document.getElementById('advertisingForm');

    if (!form) return;

    const videoInput =
      document.getElementById('adVideoFile');

    const plan =
      document.getElementById('adPlan');

    const destination =
      document.getElementById('adDestination');

    const destinationValue =
      document.getElementById('adDestinationValue');

    if (videoInput) {
      videoInput.addEventListener('change', () => {
        const file = videoInput.files?.[0];

        if (!file) return;

        if (!file.type.startsWith('video/')) {
          toast('⚠️ Selecciona un vídeo válido.');
          videoInput.value = '';
          return;
        }

        const url =
          URL.createObjectURL(file);

        const preview =
          document.getElementById('adVideoPreview');

        if (preview) {
          preview.style.display = 'block';

          preview.innerHTML = `
            <video
              src="${url}"
              controls
              style="
                width:100%;
                max-height:300px;
                border-radius:14px;
              "
            ></video>
          `;
        }
      });
    }

    if (destination) {
      destination.addEventListener('change', () => {
        const value = destination.value;
        const label =
          document.getElementById('destinationLabel');

        if (!label || !destinationValue) return;

        if (value === 'whatsapp') {
          label.textContent = '📱 Número de WhatsApp';
          destinationValue.type = 'tel';
          destinationValue.placeholder = 'Ej. 18091234567';

          if (user?.whatsapp) {
            destinationValue.value = user.whatsapp;
          }
        }

        if (value === 'messenger') {
          label.textContent = '💬 URL de Messenger';
          destinationValue.type = 'url';
          destinationValue.placeholder =
            'https://m.me/tu-pagina';
          destinationValue.value = '';
        }

        if (value === 'url') {
          label.textContent = '🔗 URL de destino';
          destinationValue.type = 'url';
          destinationValue.placeholder =
            'https://tupagina.com';
          destinationValue.value = '';
        }
      });
    }

    if (plan) {
      plan.addEventListener('change', updateAdvertisingPrice);
    }

    form.addEventListener('submit', event => {
      event.preventDefault();

      submitAdvertising();
    });
  }

  function updateAdvertisingPrice() {
    const config = getAdvertisingConfig();

    const plan =
      document.getElementById('adPlan')?.value;

    const box =
      document.getElementById('adPriceBox');

    if (!box || !plan) {
      if (box) box.style.display = 'none';
      return;
    }

    const price =
      config.categories?.[plan];

    if (!price) return;

    box.style.display = 'block';

    if (!config.paid) {
      box.innerHTML = `
        🆓 <strong>Publicidad gratuita</strong><br>
        Este anuncio no requiere pago actualmente.
      `;

      return;
    }

    box.innerHTML = `
      <strong>💰 Precios para ${escapeHtml(plan.toUpperCase())}</strong>
      <br><br>
      🏦 Banco: ${money(price.bank)}
      <br>
      ₿ Binance: US$${Number(price.binance).toFixed(2)}
      <br>
      🅿️ PayPal: US$${Number(price.paypal).toFixed(2)}
    `;
  }

  function submitAdvertising() {
    const config = getAdvertisingConfig();

    const videoInput =
      document.getElementById('adVideoFile');

    const title =
      document.getElementById('adTitle')?.value.trim();

    const plan =
      document.getElementById('adPlan')?.value;

    const destination =
      document.getElementById('adDestination')?.value;

    const destinationValue =
      document.getElementById('adDestinationValue')?.value.trim();

    if (!videoInput?.files?.[0]) {
      toast('⚠️ Selecciona el vídeo de tu publicidad.');
      return;
    }

    if (!title || !plan || !destination || !destinationValue) {
      toast('⚠️ Completa todos los datos de la publicidad.');
      return;
    }

    if (destination === 'whatsapp') {
      if (!normalizeWhatsapp(destinationValue)) {
        toast('⚠️ Número de WhatsApp inválido.');
        return;
      }
    }

    if (
      destination === 'url' ||
      destination === 'messenger'
    ) {
      if (!safeUrl(destinationValue)) {
        toast('⚠️ Introduce una URL válida que comience con https://');
        return;
      }
    }

    const file =
      videoInput.files[0];

    /*
     * Guardamos temporalmente el vídeo como Object URL.
     * En la versión con backend/storage se subirá el archivo
     * realmente al servidor.
     */

    const videoUrl =
      URL.createObjectURL(file);

    const price =
      config.categories?.[plan] || {
        bank: 0,
        binance: 0,
        paypal: 0
      };

    const ad = {
      id: Date.now(),
      user: user.name,
      title,
      plan,
      videoUrl,
      destination,
      destinationValue,
      status: config.paid
        ? 'pendiente_pago'
        : 'pendiente_revision',
      paid: !config.paid,
      paymentMethod: '',
      paymentScreenshot: '',
      prices: price,
      createdAt: new Date().toISOString()
    };

    advertising.unshift(ad);

    saveAds();

    if (config.paid) {
      showPaymentOptions(ad);
    } else {
      showAdvertisingSubmitted(ad);
    }
  }

  /* =========================================================
     PAGOS DE PUBLICIDAD
     ========================================================= */

  function showPaymentOptions(ad) {
    const config = getAdvertisingConfig();

    const price = ad.prices;

    show(`
      ${backHeader('💳 Pago de publicidad')}

      <div class="notice">
        Tu anuncio fue registrado.
        Ahora selecciona cómo quieres pagar.
      </div>

      <div class="card">

        <strong>
          📢 ${escapeHtml(ad.title)}
        </strong>

        <div
          class="muted"
          style="margin-top:6px"
        >
          Categoría:
          ${escapeHtml(ad.plan)}
        </div>

      </div>

      <div
        class="menu"
        style="margin-top:12px"
      >

        <button
          class="menu-item"
          data-action="ad-payment"
          data-method="bank"
          data-id="${ad.id}"
        >
          <div class="menu-icon">🏦</div>

          <div class="menu-copy">
            <strong>Cuenta bancaria</strong>
            <small>
              ${money(price.bank)}
            </small>
          </div>

          <b>›</b>
        </button>

        <button
          class="menu-item"
          data-action="ad-payment"
          data-method="binance"
          data-id="${ad.id}"
        >
          <div class="menu-icon">₿</div>

          <div class="menu-copy">
            <strong>Binance</strong>
            <small>
              US$${Number(price.binance).toFixed(2)}
            </small>
          </div>

          <b>›</b>
        </button>

        <button
          class="menu-item"
          data-action="ad-payment"
          data-method="paypal"
          data-id="${ad.id}"
        >
          <div class="menu-icon">🅿️</div>

          <div class="menu-copy">
            <strong>PayPal</strong>
            <small>
              US$${Number(price.paypal).toFixed(2)}
            </small>
          </div>

          <b>›</b>
        </button>

      </div>
    `);
  }

  function adPayment(method, id) {
    const ad =
      advertising.find(item => item.id === id);

    if (!ad) return;

    ad.paymentMethod = method;

    saveAds();

    const config = getAdvertisingConfig();

    let amount = 0;
    let account = '';

    if (method === 'bank') {
      amount = ad.prices.bank;

      account =
        config.bankAccounts?.banreservas || '';

      show(`
        ${backHeader('🏦 Pago bancario')}

        <div class="notice">
          Realiza el pago por el monto indicado
          y luego envía la captura del comprobante.
        </div>

        <div class="card">
          <strong>Monto: ${money(amount)}</strong>

          <p
            class="muted"
            style="margin-top:8px"
          >
            BanReservas:
            ${escapeHtml(account || 'Cuenta pendiente de configurar')}
          </p>
        </div>

        ${paymentScreenshotForm(ad.id)}
      `);

      return;
    }

    if (method === 'binance') {
      amount = ad.prices.binance;

      account =
        config.binanceAddress || '';

      show(`
        ${backHeader('₿ Pago con Binance')}

        <div class="notice">
          Realiza el pago por el monto indicado
          y luego envía la captura.
        </div>

        <div class="card">
          <strong>
            Monto: US$${Number(amount).toFixed(2)}
          </strong>

          <p
            class="muted"
            style="margin-top:8px"
          >
            Binance:
            ${escapeHtml(account || 'Dirección pendiente de configurar')}
          </p>
        </div>

        ${paymentScreenshotForm(ad.id)}
      `);

      return;
    }

    if (method === 'paypal') {
      amount = ad.prices.paypal;

      account =
        config.paypalUrl || '';

      show(`
        ${backHeader('🅿️ Pago con PayPal')}

        <div class="notice">
          Realiza el pago por el monto indicado
          y luego envía la captura.
        </div>

        <div class="card">
          <strong>
            Monto: US$${Number(amount).toFixed(2)}
          </strong>

          ${
            account
              ? `
                <button
                  class="primary"
                  style="margin-top:10px"
                  data-action="open-url"
                  data-url="${escapeHtml(account)}"
                >
                  🅿️ Abrir PayPal
                </button>
              `
              : `
                <p class="muted" style="margin-top:8px">
                  Enlace de PayPal pendiente de configurar.
                </p>
              `
          }

        </div>

        ${paymentScreenshotForm(ad.id)}
      `);
    }
  }

  function paymentScreenshotForm(id) {
    return `
      <div
        class="field"
        style="margin-top:14px"
      >

        <label>
          📸 Captura del comprobante
        </label>

        <input
          id="paymentScreenshot"
          type="file"
          accept="image/*"
          required
        >

      </div>

      <button
        class="primary"
        style="margin-top:12px"
        data-action="send-payment"
        data-id="${id}"
      >
        📤 Enviar comprobante
      </button>
    `;
  }

  function sendPayment(id) {
    const ad =
      advertising.find(item => item.id === id);

    if (!ad) return;

    const input =
      document.getElementById('paymentScreenshot');

    if (!input?.files?.[0]) {
      toast('⚠️ Selecciona la captura del pago.');
      return;
    }

    /*
     * La imagen real se enviará al backend/storage
     * en la siguiente etapa.
     */

    ad.paymentScreenshot =
      input.files[0].name;

    ad.status =
      'pendiente_aprobacion';

    saveAds();

    showAdvertisingSubmitted(ad);
  }

  function showAdvertisingSubmitted(ad) {
    show(`
      ${backHeader('✅ Publicidad enviada')}

      <div class="notice">
        ${
          ad.paid
            ? 'Tu comprobante fue enviado correctamente. El administrador revisará el pago.'
            : 'Tu publicidad fue enviada correctamente y queda pendiente de revisión.'
        }
      </div>

      <div class="card">

        <strong>
          📢 ${escapeHtml(ad.title)}
        </strong>

        <div
          class="muted"
          style="margin-top:8px"
        >
          Estado:
          ${escapeHtml(ad.status)}
        </div>

      </div>

      <button
        class="primary"
        style="margin-top:14px"
        data-action="my-advertising"
      >
        📢 Ver mis publicidades
      </button>
    `);
  }

  /* =========================================================
     MIS PUBLICIDADES
     ========================================================= */

  function myAdvertising() {
    if (!user) {
      openProfile();
      return;
    }

    const mine =
      advertising.filter(ad => ad.user === user.name);

    show(`
      ${backHeader('📢 Mis publicidades')}

      ${
        mine.length
          ? mine.map(ad => `
            <div
              class="card"
              style="margin-bottom:10px"
            >

              <strong>
                ${escapeHtml(ad.title)}
              </strong>

              <div
                class="muted"
                style="margin-top:6px"
              >
                💎 ${escapeHtml(ad.plan)}
                <br>
                📌 Estado:
                ${escapeHtml(ad.status)}
              </div>

              <button
                class="secondary"
                style="margin-top:10px"
                data-action="delete-ad"
                data-id="${ad.id}"
              >
                🗑️ Eliminar
              </button>

            </div>
          `).join('')
          : `
            <div class="empty">
              📢
              <br><br>
              No tienes publicidades.
            </div>
          `
      }
    `);
  }

  function deleteAdvertising(id) {
    const ad =
      advertising.find(item => item.id === id);

    if (!ad) return;

    const confirmed =
      window.confirm(
        `¿Quieres eliminar la publicidad "${ad.title}"?`
      );

    if (!confirmed) return;

    advertising =
      advertising.filter(item => item.id !== id);

    saveAds();

    toast('🗑️ Publicidad eliminada.');

    myAdvertising();
  }

  /* =========================================================
     SOLICITUDES DE PUBLICIDAD — ADMIN
     ========================================================= */

  function adminAdvertisers() {
    show(`
      ${backHeader('🧾 Solicitudes de publicidad')}

      ${
        advertising.length
          ? advertising.map(ad => `
            <div
              class="card"
              style="margin-bottom:10px"
            >

              <strong>
                ${escapeHtml(ad.title)}
              </strong>

              <div
                class="muted"
                style="margin-top:6px"
              >
                👤 ${escapeHtml(ad.user)}
                <br>
                💎 ${escapeHtml(ad.plan)}
                <br>
                📌 ${escapeHtml(ad.status)}
                <br>
                💳 ${
                  ad.paymentMethod
                    ? escapeHtml(ad.paymentMethod)
                    : 'Sin seleccionar'
                }
              </div>

              ${
                ad.status === 'pendiente_aprobacion'
                  ? `
                    <button
                      class="primary"
                      style="margin-top:10px"
                      data-action="approve-ad"
                      data-id="${ad.id}"
                    >
                      ✅ Aprobar publicidad
                    </button>

                    <button
                      class="danger"
                      style="margin-top:8px"
                      data-action="reject-ad"
                      data-id="${ad.id}"
                    >
                      ❌ Rechazar
                    </button>
                  `
                  : ''
              }

            </div>
          `).join('')
          : `
            <div class="empty">
              🧾
              <br><br>
              No hay solicitudes.
            </div>
          `
      }
    `);
  }

  function approveAdvertising(id) {
    const ad =
      advertising.find(item => item.id === id);

    if (!ad) return;

    ad.status = 'aprobada';

    saveAds();

    toast('✅ Publicidad aprobada.');

    adminAdvertisers();
  }

  function rejectAdvertising(id) {
    const ad =
      advertising.find(item => item.id === id);

    if (!ad) return;

    ad.status = 'rechazada';

    saveAds();

    toast('❌ Publicidad rechazada.');

    adminAdvertisers();
  }

  /* =========================================================
     MOSTRAR PUBLICIDADES EN EL ESPACIO PRINCIPAL
     ========================================================= */

  function renderActiveAdvertising() {
    const adBox =
      document.querySelector('.ad');

    if (!adBox) return;

    const approved =
      advertising
        .filter(ad => ad.status === 'aprobada');

    if (!approved.length) {
      createAdvertisingButton();
      return;
    }

    const ad =
      approved[0];

    const destinationUrl =
      getAdvertisingDestination(ad);

    adBox.innerHTML = `
      <div style="width:100%">

        <small>
          PUBLICIDAD
        </small>

        <h3>
          ${escapeHtml(ad.title)}
        </h3>

        <video
          src="${escapeHtml(ad.videoUrl)}"
          controls
          playsinline
          style="
            width:100%;
            max-height:320px;
            object-fit:cover;
            border-radius:16px;
            margin-top:10px;
          "
        ></video>

        ${
          destinationUrl
            ? `
              <button
                id="activeAdButton"
                class="primary"
                style="margin-top:10px"
              >
                ${
                  ad.destination === 'whatsapp'
                    ? '🟢 WhatsApp'
                    : ad.destination === 'messenger'
                      ? '💬 Messenger'
                      : '🔗 Visitar página'
                }
              </button>
            `
            : ''
        }

        <button
          id="publicityButton"
          class="secondary"
          style="margin-top:8px"
        >
          📣 Crear mi publicidad
        </button>

      </div>
    `;

    const activeButton =
      document.getElementById('activeAdButton');

    if (activeButton && destinationUrl) {
      activeButton.addEventListener('click', () => {
        window.open(
          destinationUrl,
          '_blank',
          'noopener,noreferrer'
        );
      });
    }

    const createButton =
      document.getElementById('publicityButton');

    if (createButton) {
      createButton.addEventListener(
        'click',
        openAdvertising
      );
    }
  }

  function getAdvertisingDestination(ad) {
    if (!ad) return '';

    if (ad.destination === 'whatsapp') {
      return whatsappUrl(
        ad.destinationValue,
        `Hola, vi tu publicidad en Market Flash: ${ad.title}`
      );
    }

    if (
      ad.destination === 'url' ||
      ad.destination === 'messenger'
    ) {
      return safeUrl(ad.destinationValue);
    }

    return '';
  }

  /* =========================================================
     PAGOS Y MEMBRESÍAS
     ========================================================= */

  function adminPayments() {
    show(`
      ${backHeader('💳 Pagos y membresías')}

      <div class="notice">
        El usuario depositará, enviará el comprobante
        y el administrador aprobará manualmente.
      </div>

      <div class="field">
        <label>🏦 BanReservas — número de cuenta</label>

        <input
          placeholder="Número de cuenta"
        >
      </div>

      <div
        class="field"
        style="margin-top:12px"
      >
        <label>🏦 BHD — número de cuenta</label>

        <input
          placeholder="Número de cuenta"
        >
      </div>

      <div
        class="field"
        style="margin-top:12px"
      >
        <label>₿ Binance — dirección</label>

        <input
          placeholder="Dirección"
        >
      </div>

      <div
        class="field"
        style="margin-top:12px"
      >
        <label>🅿️ PayPal — enlace</label>

        <input
          placeholder="Enlace"
        >
      </div>

      <button
        class="primary"
        style="margin-top:14px"
        data-action="save-payments"
      >
        💾 Guardar
      </button>
    `);
  }

  /* =========================================================
     NOTIFICACIONES
     ========================================================= */

  function notifications() {
    show(`
      ${backHeader('🔔 Notificaciones')}

      <div class="notice">
        No tienes notificaciones nuevas.
      </div>

      <button
        class="secondary"
        data-action="close"
      >
        Cerrar
      </button>
    `);
  }

  /* =========================================================
     LOGOUT
     ========================================================= */

  function logout() {
    user = null;

    localStorage.removeItem(STORAGE_USER);

    close();

    toast('👋 Sesión cerrada.');
  }

  /* =========================================================
     EVENTOS DINÁMICOS
     ========================================================= */

  function bindDynamicButtons() {
    const sheet =
      document.getElementById('sheet');

    if (!sheet) return;

    sheet.onclick = event => {
      const button =
        event.target.closest('[data-action]');

      if (!button) return;

      const action =
        button.dataset.action;

      const id =
        button.dataset.id
          ? Number(button.dataset.id)
          : null;

      switch (action) {

        case 'back':
          goBack();
          break;

        case 'close':
          close();
          break;

        case 'like':
          like(id);
          break;

        case 'whatsapp-product': {
          const product =
            products.find(item => item.id === id);

          if (product) {
            openWhatsApp(
              product.whatsapp ||
              user?.whatsapp ||
              '',
              `Hola, estoy interesado/a en "${product.name}" en Market Flash.`
            );
          }

          break;
        }

        case 'contact':
          contact(button.dataset.seller || '');
          break;

        case 'register':
          register();
          break;

        case 'login':
          login();
          break;

        case 'recovery':
          recovery();
          break;

        case 'verify-recovery':
          verifyRecovery();
          break;

        case 'activity':
          openActivity();
          break;

        case 'settings':
          settings();
          break;

        case 'admin':
          admin();
          break;

        case 'logout':
          logout();
          break;

        case 'my-publications':
          myPublications();
          break;

        case 'my-products':
          myProducts();
          break;

        case 'my-sales':
          mySales();
          break;

        case 'receipts':
          receipts();
          break;

        case 'favorites':
          favorites();
          break;

        case 'history':
          historyPage();
          break;

        case 'statistics':
          statistics(id);
          break;

        case 'edit-product':
          editProduct(id);
          break;

        case 'delete-product':
          deleteProduct(id);
          break;

        case 'edit-profile':
          editProfile();
          break;

        case 'change-pass':
          changePass();
          break;

        case 'security':
          securityPage();
          break;

        case 'email-info':
          toast('📧 El correo electrónico es opcional.');
          break;

        case 'admin-users':
          adminUsers();
          break;

        case 'admin-blocked':
          adminBlocked();
          break;

        case 'admin-posts':
          adminPosts();
          break;

        case 'admin-advertising':
          adminAdvertising();
          break;

        case 'admin-payments':
          adminPayments();
          break;

        case 'admin-inventory':
          simple(
            '📦 Inventario',
            'Aquí se administrará el inventario.'
          );
          break;

        case 'toggle-ad':
          toggleAd();
          break;

        case 'save-ad-config':
          saveAdConfig();
          break;

        case 'admin-advertisers':
          adminAdvertisers();
          break;

        case 'ad-payment':
          adPayment(
            button.dataset.method,
            id
          );
          break;

        case 'send-payment':
          sendPayment(id);
          break;

        case 'my-advertising':
          myAdvertising();
          break;

        case 'delete-ad':
          deleteAdvertising(id);
          break;

        case 'approve-ad':
          approveAdvertising(id);
          break;

        case 'reject-ad':
          rejectAdvertising(id);
          break;

        case 'open-url': {
          const url =
            safeUrl(button.dataset.url);

          if (url) {
            window.open(
              url,
              '_blank',
              'noopener,noreferrer'
            );
          }

          break;
        }

        case 'close':
          close();
          break;

        default:
          console.warn(
            'Acción no reconocida:',
            action
          );
      }
    };
  }

  /* =========================================================
     EVENTOS PRINCIPALES DEL HTML
     ========================================================= */

  function setupMainEvents() {

    const search =
      document.getElementById('search');

    if (search) {
      search.addEventListener(
        'input',
        render
      );
    }

    /*
     * Botón de inicio
     */
    const navHome =
      document.getElementById('navHome');

    if (navHome) {
      navHome.onclick = home;
    }

    /*
     * Botón de actividad
     */
    const navActivity =
      document.getElementById('navActivity');

    if (navActivity) {
      navActivity.onclick = openActivity;
    }

    /*
     * Botón +
     */
    const plus =
      document.querySelector('.plus');

    if (plus) {
      plus.onclick = openPublish;
    }

    /*
     * Notificaciones
     */
    const notificationButtons =
      document.querySelectorAll(
        '[aria-label="Notificaciones"]'
      );

    notificationButtons.forEach(button => {
      button.onclick = notifications;
    });

    /*
     * Perfil
     */
    const profileButtons =
      document.querySelectorAll(
        '[aria-label="Perfil"]'
      );

    profileButtons.forEach(button => {
      button.onclick = openProfile;
    });

    /*
     * Categorías existentes en HTML
     */
    document.querySelectorAll('.chip').forEach(button => {
      const text =
        button.textContent
          .replace(/[^\p{L}\p{N}\s]/gu, '')
          .trim();

      let categoryName = text;

      if (text.toLowerCase().includes('todos')) {
        categoryName = 'Todos';
      } else if (
        text.toLowerCase().includes('celulares')
      ) {
        categoryName = 'Celulares';
      } else if (
        text.toLowerCase().includes('computadoras')
      ) {
        categoryName = 'Computadoras';
      } else if (
        text.toLowerCase().includes('videojuegos')
      ) {
        categoryName = 'Videojuegos';
      } else if (
        text.toLowerCase().includes('ropa')
      ) {
        categoryName = 'Ropa';
      } else if (
        text.toLowerCase().includes('hogar')
      ) {
        categoryName = 'Hogar';
      } else if (
        text.toLowerCase().includes('vehículos') ||
        text.toLowerCase().includes('vehiculos')
      ) {
        categoryName = 'Vehículos';
      }

      button.onclick = () => {
        setCategory(
          categoryName,
          button
        );
      };
    });
  }

  /* =========================================================
     BOTÓN ATRÁS DEL NAVEGADOR
     ========================================================= */

  function setupBrowserBack() {
    window.addEventListener('popstate', () => {
      if (
        document.getElementById('overlay') &&
        !document.getElementById('overlay').classList.contains('hidden')
      ) {
        goBack();
      }
    });
  }

  /* =========================================================
     INICIALIZACIÓN
     ========================================================= */

  function init() {
    setupOverlay();

    setupMainEvents();

    setupBrowserBack();

    bindDynamicButtons();

    createAdvertisingButton();

    renderActiveAdvertising();

    render();
  }

  /* =========================================================
     EXPONER FUNCIONES PARA COMPATIBILIDAD
     ========================================================= */

  window.home = home;
  window.close = close;
  window.openPublish = openPublish;
  window.openProfile = openProfile;
  window.openActivity = openActivity;
  window.notifications = notifications;
  window.register = register;
  window.login = login;
  window.recovery = recovery;
  window.admin = admin;
  window.adminAdvertising = adminAdvertising;
  window.adminPayments = adminPayments;
  window.openAdvertising = openAdvertising;
  window.setCategory = setCategory;
  window.render = render;
  window.goBack = goBack;
  window.logout = logout;

  /* =========================================================
     ARRANQUE
     ========================================================= */

  if (
    document.readyState === 'loading'
  ) {
    document.addEventListener(
      'DOMContentLoaded',
      init
    );
  } else {
    init();
  }

})();
