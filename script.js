/* =========================================================
   MARKET FLASH
   script.js
   ========================================================= */

'use strict';

/* =========================================================
   ALMACENAMIENTO
   ========================================================= */

const STORAGE = {
  user: 'mf_user',
  users: 'mf_users',
  products: 'mf_products',
  ads: 'mf_ads',
  chats: 'mf_chats',
  complaints: 'mf_complaints',
  sanctions: 'mf_sanctions',
  notifications: 'mf_notifications',
  config: 'mf_config',
  stats: 'mf_stats',
  admin: 'mf_admin',
  settings: 'mf_settings'
};


/* =========================================================
   ESTADO
   ========================================================= */

let currentUser = readJSON(STORAGE.user, null);
let products = readJSON(STORAGE.products, null) || [];
let ads = readJSON(STORAGE.ads, []);
let chats = readJSON(STORAGE.chats, []);
let complaints = readJSON(STORAGE.complaints, []);
let sanctions = readJSON(STORAGE.sanctions, []);
let notificationsData = readJSON(STORAGE.notifications, []);
let config = readJSON(STORAGE.config, null) || defaultConfig();
let adminData = readJSON(STORAGE.admin, null) || defaultAdmin();
let userSettings = readJSON(STORAGE.settings, null) || defaultUserSettings();

let currentCategory = 'Todos';
let currentProductId = null;
let currentChatId = null;
let selectedMedia = null;
let selectedProof = null;
let flashTimer = null;


/* =========================================================
   CONFIGURACIÓN POR DEFECTO
   ========================================================= */

function defaultConfig() {

  return {
    appName: 'Market Flash',

    postingEnabled: true,

    advertisingEnabled: true,

    flashTitle: 'Publicación Flash del Día',

    flashDescription:
      'Publicidad destacada que aparece de forma rotativa.',

    paymentMethods: {
      popular: {
        enabled: true,
        name: 'Banco Popular',
        account: '',
        prices: {
          basic: 500,
          standard: 1000,
          premium: 2000
        }
      },

      reservas: {
        enabled: true,
        name: 'Banco de Reservas',
        account: '',
        prices: {
          basic: 500,
          standard: 1000,
          premium: 2000
        }
      },

      paypal: {
        enabled: true,
        name: 'PayPal',
        account: '',
        prices: {
          basic: 12,
          standard: 24,
          premium: 48
        }
      },

      binance: {
        enabled: true,
        name: 'Binance',
        account: '',
        prices: {
          basic: 10,
          standard: 20,
          premium: 40
        }
      }
    },

    plans: {
      basic: {
        name: 'Básico',
        duration: 3,
        rotations: 1
      },

      standard: {
        name: 'Estándar',
        duration: 7,
        rotations: 2
      },

      premium: {
        name: 'Premium',
        duration: 15,
        rotations: 4
      }
    },

    contact: {
      internalChat: true,
      whatsapp: true,
      messenger: true
    }
  };
}


function defaultAdmin() {

  return {
    password: '123456',
    loggedIn: false,
    notificationsEnabled: true
  };
}


function defaultUserSettings() {

  return {
    darkMode: false,
    notifications: true,
    chatWallpaper: 'default',
    language: 'es'
  };
}


/* =========================================================
   PRODUCTOS INICIALES
   ========================================================= */

if (!products.length) {

  products = [

    {
      id: createId(),
      name: 'iPhone 15 Pro',
      category: 'Celulares',
      price: 45000,
      location: 'Santo Domingo',
      seller: 'Market Flash',
      sellerId: 'demo-1',
      description:
        'iPhone 15 Pro en excelente estado.',
      image:
        'https://images.unsplash.com/photo-1696446702183-cbd13d5f2e88?auto=format&fit=crop&w=900&q=80',
      views: 1284,
      likes: 86,
      saves: 34,
      status: 'available',
      createdAt: Date.now()
    },

    {
      id: createId(),
      name: 'Samsung Galaxy S24',
      category: 'Celulares',
      price: 38000,
      location: 'Santiago',
      seller: 'Tecnología RD',
      sellerId: 'demo-2',
      description:
        'Samsung Galaxy S24 listo para entregar.',
      image:
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80',
      views: 743,
      likes: 51,
      saves: 18,
      status: 'available',
      createdAt: Date.now()
    },

    {
      id: createId(),
      name: 'Laptop profesional',
      category: 'Computadoras',
      price: 52000,
      location: 'Santo Domingo',
      seller: 'Tech Store',
      sellerId: 'demo-3',
      description:
        'Laptop profesional para trabajo y estudios.',
      image:
        'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
      views: 491,
      likes: 29,
      saves: 11,
      status: 'available',
      createdAt: Date.now()
    },

    {
      id: createId(),
      name: 'PlayStation 5',
      category: 'Videojuegos',
      price: 32000,
      location: 'Santo Domingo Este',
      seller: 'Gaming RD',
      sellerId: 'demo-4',
      description:
        'PlayStation 5 en excelente condición.',
      image:
        'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80',
      views: 952,
      likes: 73,
      saves: 42,
      status: 'available',
      createdAt: Date.now()
    }

  ];

  save(STORAGE.products, products);
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function readJSON(key, fallback) {

  try {

    const value = localStorage.getItem(key);

    return value
      ? JSON.parse(value)
      : fallback;

  } catch (error) {

    console.error(error);

    return fallback;
  }
}


function save(key, value) {

  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}


function createId() {

  return Date.now().toString(36) +
    Math.random().toString(36).slice(2, 9);
}


function escapeHTML(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function money(value) {

  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}


function dateText(date) {

  return new Intl.DateTimeFormat(
    'es-DO',
    {
      dateStyle: 'short',
      timeStyle: 'short'
    }
  ).format(new Date(date));
}


function showToast(message) {

  const toast =
    document.getElementById('toast');

  if (!toast) return;

  toast.textContent = message;

  toast.classList.remove('hidden');

  clearTimeout(window.toastTimer);

  window.toastTimer =
    setTimeout(() => {

      toast.classList.add('hidden');

    }, 2800);
}


function showModal(html) {

  const modal =
    document.getElementById('modal');

  const card =
    document.getElementById('modalCard');

  if (!modal || !card) return;

  card.innerHTML = html;

  modal.classList.remove('hidden');

  document.body.classList.add('modal-open');
}


function closeModal() {

  const modal =
    document.getElementById('modal');

  if (!modal) return;

  modal.classList.add('hidden');

  document.body.classList.remove('modal-open');

  currentProductId = null;
  currentChatId = null;
  selectedMedia = null;
  selectedProof = null;
}


function fileToDataURL(file) {

  return new Promise((resolve, reject) => {

    const reader = new FileReader();

    reader.onload =
      () => resolve(reader.result);

    reader.onerror = reject;

    reader.readAsDataURL(file);

  });
}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function setActiveNav(page) {

  document
    .querySelectorAll('.nav-item')
    .forEach(button => {

      button.classList.toggle(
        'active',
        button.dataset.page === page
      );

    });
}


function goHome() {

  setActiveNav('home');

  renderHome();

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


function renderHome() {

  const content =
    document.getElementById('mainContent');

  if (!content) return;

  content.style.display = '';

  renderCategories();
  renderProducts();
  renderFlashPreview();
}


/* =========================================================
   CATEGORÍAS
   ========================================================= */

function renderCategories() {

  const box =
    document.getElementById('categoryRow');

  if (!box) return;

  const categories = [
    ['Todos', '✨'],
    ['Celulares', '📱'],
    ['Computadoras', '💻'],
    ['Videojuegos', '🎮'],
    ['Ropa', '👕'],
    ['Hogar', '🏠'],
    ['Vehículos', '🚗'],
    ['Otros', '📦']
  ];

  box.innerHTML =
    categories.map(item => `

      <button
        class="chip ${
          currentCategory === item[0]
            ? 'active'
            : ''
        }"
        onclick="selectCategory('${item[0]}')"
      >
        ${item[1]} ${item[0]}
      </button>

    `).join('');
}


function selectCategory(category) {

  currentCategory = category;

  renderCategories();
  renderProducts();
}


/* =========================================================
   PRODUCTOS
   ========================================================= */

function renderProducts() {

  const box =
    document.getElementById('productsGrid');

  const count =
    document.getElementById('productCount');

  if (!box) return;

  const search =
    (
      document.getElementById('searchInput')
        ?.value || ''
    )
      .trim()
      .toLowerCase();

  let list =
    products.filter(product => {

      const categoryOK =
        currentCategory === 'Todos' ||
        product.category === currentCategory;

      const searchOK =
        !search ||
        product.name
          .toLowerCase()
          .includes(search) ||
        product.category
          .toLowerCase()
          .includes(search) ||
        product.location
          .toLowerCase()
          .includes(search);

      return categoryOK && searchOK;
    });


  list =
    list.filter(product =>
      product.status !== 'archived'
    );


  if (count) {

    count.textContent =
      `${list.length} ${
        list.length === 1
          ? 'publicación'
          : 'publicaciones'
      }`;

  }


  if (!list.length) {

    box.innerHTML = `

      <div class="empty-state">

        <div class="empty-icon">
          🔎
        </div>

        <h3>
          No encontramos publicaciones
        </h3>

        <p>
          Prueba con otra búsqueda o categoría.
        </p>

      </div>

    `;

    return;
  }


  box.innerHTML =
    list.map(product => `

      <article
        class="product-card"
        onclick="openProduct('${product.id}')"
      >

        <div class="product-image-wrap">

          <img
            class="product-image"
            src="${escapeHTML(product.image || '')}"
            alt="${escapeHTML(product.name)}"
            onerror="this.style.display='none'"
          >

          ${
            product.status === 'sold'
              ? `
                <span class="sold-badge">
                  VENDIDO
                </span>
              `
              : ''
          }

        </div>


        <div class="product-info">

          <h3>
            ${escapeHTML(product.name)}
          </h3>

          <strong class="product-price">
            ${money(product.price)}
          </strong>

          <small>
            📍 ${escapeHTML(product.location || '')}
          </small>

          <small>
            👤 ${escapeHTML(product.seller || '')}
          </small>

        </div>

      </article>

    `).join('');
}


/* =========================================================
   DETALLE DEL PRODUCTO
   ========================================================= */

function openProduct(id) {

  const product =
    products.find(item => item.id === id);

  if (!product) return;

  currentProductId = id;

  product.views =
    Number(product.views || 0) + 1;

  save(STORAGE.products, products);

  const seller =
    product.sellerId || '';

  showModal(`

    <div class="modal-head">

      <button
        class="back-btn"
        onclick="closeModal()"
      >
        ←
      </button>

      <h2>
        Publicación
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="detail">

      <div class="detail-image-wrap">

        <img
          class="detail-image"
          src="${escapeHTML(product.image || '')}"
          alt="${escapeHTML(product.name)}"
        >

        ${
          product.status === 'sold'
            ? `
              <div class="sold-overlay">
                VENDIDO
              </div>
            `
            : ''
        }

      </div>


      <h1>
        ${escapeHTML(product.name)}
      </h1>

      <div class="detail-price">
        ${money(product.price)}
      </div>

      <p class="muted">
        📍 ${escapeHTML(product.location || '')}
      </p>


      <div class="stats-row">

        <span>
          👁️ ${product.views || 0} vistas
        </span>

        <span>
          ❤️ ${product.likes || 0} me gusta
        </span>

        <span>
          ⭐ ${getSellerRanking(product.sellerId)}
        </span>

      </div>


      <div class="detail-description">

        <h3>
          Descripción
        </h3>

        <p>
          ${escapeHTML(
            product.description ||
            'Sin descripción.'
          )}
        </p>

      </div>


      <div class="seller-card">

        <strong>
          Publicado por
        </strong>

        <span>
          ${escapeHTML(product.seller || '')}
        </span>

        <small>
          Ranking de ventas:
          ${getSellerRanking(product.sellerId)}
        </small>

      </div>


      ${
        product.status !== 'sold'
          ? `

            <div class="contact-buttons">

              ${
                config.contact.internalChat
                  ? `
                    <button
                      class="primary-btn"
                      onclick="startChat('${escapeJS(product.sellerId)}')"
                    >
                      💬 Chat
                    </button>
                  `
                  : ''
              }


              ${
                config.contact.whatsapp
                  ? `
                    <button
                      class="contact-btn whatsapp-btn"
                      onclick="contactWhatsApp('${escapeJS(product.seller)}')"
                    >
                      🟢 WhatsApp
                    </button>
                  `
                  : ''
              }


              ${
                config.contact.messenger
                  ? `
                    <button
                      class="contact-btn messenger-btn"
                      onclick="contactMessenger()"
                    >
                      🔵 Messenger
                    </button>
                  `
                  : ''
              }

            </div>


            <div class="transaction-actions">

              <button
                class="secondary-btn"
                onclick="markAsPurchased('${product.id}')"
              >
                🛒 Comprado
              </button>

              <button
                class="danger-outline"
                onclick="openComplaint('${product.id}')"
              >
                ⚠️ Reclamo
              </button>

            </div>

          `
          : `
            <div class="sold-notice">
              ✅ Esta publicación fue marcada como vendida.
            </div>
          `
      }

    </div>

  `);
}


function escapeJS(value) {

  return String(value ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}


/* =========================================================
   FLASH DEL DÍA
   ========================================================= */

function renderFlashPreview() {

  const old =
    document.getElementById('flashLivePreview');

  if (old) old.remove();

  const activeAds =
    ads.filter(ad =>
      ad.status === 'approved' &&
      isAdActive(ad)
    );

  if (!activeAds.length) return;

  const first = activeAds[0];

  const button =
    document.getElementById('flashDayBtn');

  if (!button) return;

  button.onclick =
    () => openFlashDay();

  button.dataset.hasAds = 'true';
}


function openFlashDay() {

  const activeAds =
    ads.filter(ad =>
      ad.status === 'approved' &&
      isAdActive(ad)
    );

  if (!activeAds.length) {

    showModal(`

      <div class="modal-head">

        <h2>
          ⚡ Flash del Día
        </h2>

        <button
          class="close-btn"
          onclick="closeModal()"
        >
          ×
        </button>

      </div>

      <div class="empty-state">

        <div class="empty-icon">
          📢
        </div>

        <h3>
          Aún no hay anuncios activos
        </h3>

        <p>
          Sé el primero en publicar tu anuncio.
        </p>

        <button
          class="primary-btn"
          onclick="closeModal();openAdvertising()"
        >
          Publicar anuncio
        </button>

      </div>

    `);

    return;
  }


  let index = 0;


  function showAd() {

    const ad =
      activeAds[index % activeAds.length];

    showModal(`

      <div class="modal-head">

        <div>

          <small>
            PUBLICIDAD
          </small>

          <h2>
            ⚡ Flash del Día
          </h2>

        </div>

        <button
          class="close-btn"
          onclick="closeModal()"
        >
          ×
        </button>

      </div>


      <div class="flash-ad">

        ${
          ad.mediaType === 'video'
            ? `
              <video
                class="flash-media"
                src="${escapeHTML(ad.media)}"
                controls
                autoplay
                muted
                playsinline
              ></video>
            `
            : `
              <img
                class="flash-media"
                src="${escapeHTML(ad.media)}"
                alt="${escapeHTML(ad.title)}"
              >
            `
        }


        <h2>
          ${escapeHTML(ad.title)}
        </h2>

        <p>
          ${escapeHTML(ad.description || '')}
        </p>

        <small>
          Publicidad de:
          ${escapeHTML(ad.ownerName || '')}
        </small>

      </div>


      <button
        class="primary-btn"
        onclick="contactAdvertiser('${escapeJS(ad.ownerId || '')}')"
      >
        💬 Contactar anunciante
      </button>

    `);

  }


  showAd();


  clearInterval(flashTimer);

  flashTimer =
    setInterval(() => {

      index++;

      if (
        !document
          .getElementById('modal')
          ?.classList.contains('hidden')
      ) {

        showAd();

      } else {

        clearInterval(flashTimer);

      }

    }, 7000);
}


function isAdActive(ad) {

  if (!ad.approvedAt) return true;

  const days =
    Number(
      config.plans?.[ad.plan]?.duration || 3
    );

  const expiration =
    Number(ad.approvedAt) +
    days * 86400000;

  return Date.now() < expiration;
}


/* =========================================================
   PUBLICAR PRODUCTO NORMAL
   ========================================================= */

function openPublish() {

  setActiveNav('home');

  if (!config.postingEnabled) {

    showToast(
      'Las publicaciones están temporalmente desactivadas.'
    );

    return;
  }


  if (!currentUser) {

    showModal(`

      <div class="modal-head">

        <h2>
          Crear publicación
        </h2>

        <button
          class="close-btn"
          onclick="closeModal()"
        >
          ×
        </button>

      </div>

      <div class="notice">
        Necesitas crear una cuenta para publicar.
      </div>

      <button
        class="primary-btn"
        onclick="closeModal();openProfile()"
      >
        👤 Crear cuenta
      </button>

    `);

    return;
  }


  showModal(`

    <div class="modal-head">

      <button
        class="back-btn"
        onclick="closeModal()"
      >
        ←
      </button>

      <h2>
        Publicar
      </h2>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <form
      id="publishForm"
      class="form"
      onsubmit="submitProduct(event)"
    >

      <div class="media-choice">

        <button
          type="button"
          class="media-choice-btn"
          onclick="document.getElementById('cameraInput').click()"
        >
          📷
          <span>Cámara</span>
        </button>

        <button
          type="button"
          class="media-choice-btn"
          onclick="document.getElementById('galleryInput').click()"
        >
          🖼️
          <span>Galería</span>
        </button>

      </div>


      <input
        id="cameraInput"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onchange="handleProductMedia(this)"
      >


      <input
        id="galleryInput"
        type="file"
        accept="image/*,video/*"
        hidden
        onchange="handleProductMedia(this)"
      >


      <div id="mediaPreview"></div>


      <label>
        Nombre
        <input
          id="productName"
          required
          maxlength="80"
          placeholder="Ej.: iPhone 15 Pro"
        >
      </label>


      <label>
        Categoría

        <select id="productCategory" required>

          <option value="Celulares">
            Celulares
          </option>

          <option value="Computadoras">
            Computadoras
          </option>

          <option value="Videojuegos">
            Videojuegos
          </option>

          <option value="Ropa">
            Ropa
          </option>

          <option value="Hogar">
            Hogar
          </option>

          <option value="Vehículos">
            Vehículos
          </option>

          <option value="Otros">
            Otros
          </option>

        </select>

      </label>


      <label>
        Precio
        <input
          id="productPrice"
          type="number"
          min="0"
          required
          placeholder="Precio"
        >
      </label>


      <label>
        Ubicación
        <input
          id="productLocation"
          required
          placeholder="Ciudad o sector"
        >
      </label>


      <label>
        Descripción

        <textarea
          id="productDescription"
          maxlength="1000"
          required
          placeholder="Describe tu producto..."
        ></textarea>

      </label>


      <button
        class="primary-btn"
        type="submit"
      >
        🚀 Publicar ahora
      </button>

    </form>

  `);
}


async function handleProductMedia(input) {

  const file =
    input.files?.[0];

  if (!file) return;


  if (
    !file.type.startsWith('image/') &&
    !file.type.startsWith('video/')
  ) {

    showToast(
      'Selecciona una imagen o un video válido.'
    );

    return;
  }


  try {

    selectedMedia = {

      type:
        file.type.startsWith('video/')
          ? 'video'
          : 'image',

      data:
        await fileToDataURL(file)

    };


    const preview =
      document.getElementById('mediaPreview');

    if (!preview) return;


    preview.innerHTML =
      selectedMedia.type === 'video'
        ? `
          <video
            class="upload-preview"
            src="${selectedMedia.data}"
            controls
          ></video>
        `
        : `
          <img
            class="upload-preview"
            src="${selectedMedia.data}"
            alt="Vista previa"
          >
        `;

  } catch (error) {

    console.error(error);

    showToast(
      'No se pudo cargar el archivo.'
    );
  }
}


function submitProduct(event) {

  event.preventDefault();


  if (!currentUser) {

    showToast(
      'Debes iniciar sesión.'
    );

    return;
  }


  if (!selectedMedia) {

    showToast(
      'Agrega una foto o video.'
    );

    return;
  }


  const product = {

    id: createId(),

    name:
      document
        .getElementById('productName')
        .value
        .trim(),

    category:
      document
        .getElementById('productCategory')
        .value,

    price:
      Number(
        document
          .getElementById('productPrice')
          .value
      ),

    location:
      document
        .getElementById('productLocation')
        .value
        .trim(),

    description:
      document
        .getElementById('productDescription')
        .value
        .trim(),

    image:
      selectedMedia.type === 'image'
        ? selectedMedia.data
        : '',

    media:
      selectedMedia.data,

    mediaType:
      selectedMedia.type,

    seller:
      currentUser.name,

    sellerId:
      currentUser.id,

    views: 0,
    likes: 0,
    saves: 0,

    status: 'available',

    buyerConfirmed: false,
    sellerConfirmed: false,

    createdAt: Date.now()

  };


  products.unshift(product);

  save(
    STORAGE.products,
    products
  );


  incrementRegisteredActivity();


  closeModal();

  renderProducts();

  showToast(
    '✅ Publicación creada correctamente.'
  );
}


/* =========================================================
   PUBLICIDAD PAGADA
   ========================================================= */

function openAdvertising() {

  if (!currentUser) {

    showToast(
      'Crea una cuenta para publicar publicidad.'
    );

    openProfile();

    return;
  }


  if (!config.advertisingEnabled) {

    showToast(
      'La publicidad está temporalmente desactivada.'
    );

    return;
  }


  showModal(`

    <div class="modal-head">

      <button
        class="back-btn"
        onclick="closeModal()"
      >
        ←
      </button>

      <div>
        <small>
          MARKET FLASH
        </small>

        <h2>
          📣 Publicar anuncio
        </h2>
      </div>

      <button
        class="close-btn"
        onclick="closeModal()"
      >
        ×
      </button>

    </div>


    <div class="notice">
      Selecciona un plan, crea tu anuncio y envía el comprobante de pago. Tu anuncio aparecerá en Flash del Día después de ser aprobado por el administrador.
    </div>


    <form
      id="advertisingForm"
      class="form"
      onsubmit="submitAdvertising(event)"
    >

      <div>

        <strong>
          1. Selecciona tu plan
        </strong>

      </div>


      <div class="plans-grid">

        ${renderPlan('basic')}

        ${renderPlan('standard')}

        ${render
