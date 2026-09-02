/* =========================================================
   MARKET FLASH — SCRIPT.JS
   ========================================================= */

const STORAGE_USER = 'mf_user';
const STORAGE_PRODUCTS = 'mf_products_v2';
const STORAGE_ADS = 'mf_ads_v2';
const STORAGE_CONFIG = 'mf_config_v2';
const STORAGE_MESSAGES = 'mf_messages_v2';
const STORAGE_STATS = 'mf_stats_v2';
const STORAGE_CLAIMS = 'mf_claims_v2';
const STORAGE_SANCTIONS = 'mf_sanctions_v2';

let user = JSON.parse(localStorage.getItem(STORAGE_USER) || 'null');
let products = JSON.parse(localStorage.getItem(STORAGE_PRODUCTS) || 'null');
let ads = JSON.parse(localStorage.getItem(STORAGE_ADS) || '[]');
let messages = JSON.parse(localStorage.getItem(STORAGE_MESSAGES) || '[]');
let claims = JSON.parse(localStorage.getItem(STORAGE_CLAIMS) || '[]');
let sanctions = JSON.parse(localStorage.getItem(STORAGE_SANCTIONS) || '[]');

let currentCategory = 'Todos';
let flashIndex = 0;
let flashTimer = null;


/* =========================================================
   PRODUCTOS INICIALES
   ========================================================= */

const seedProducts = [
  {
    id: 1,
    name: 'iPhone 15 Pro',
    category: 'Celulares',
    price: 45000,
    location: 'Santo Domingo',
    seller: 'Market Flash',
    description: 'iPhone 15 Pro en excelente condición.',
    image: 'https://images.unsplash.com/photo-1696446702183-cbd13d5f2e88?auto=format&fit=crop&w=900&q=80',
    views: 1284,
    likes: 86,
    ranking: 5,
    sold: false,
    sellerConfirmed: false,
    buyerConfirmed: false
  },
  {
    id: 2,
    name: 'Samsung Galaxy S24',
    category: 'Celulares',
    price: 38000,
    location: 'Santiago',
    seller: 'Tecnología RD',
    description: 'Samsung Galaxy S24 totalmente funcional.',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=900&q=80',
    views: 743,
    likes: 51,
    ranking: 5,
    sold: false,
    sellerConfirmed: false,
    buyerConfirmed: false
  },
  {
    id: 3,
    name: 'Laptop profesional',
    category: 'Computadoras',
    price: 52000,
    location: 'Santo Domingo',
    seller: 'Tech Store',
    description: 'Laptop profesional para trabajo y estudio.',
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80',
    views: 491,
    likes: 29,
    ranking: 4,
    sold: false,
    sellerConfirmed: false,
    buyerConfirmed: false
  },
  {
    id: 4,
    name: 'PlayStation 5',
    category: 'Videojuegos',
    price: 32000,
    location: 'Santo Domingo Este',
    seller: 'Gaming RD',
    description: 'PlayStation 5 en buen estado.',
    image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80',
    views: 952,
    likes: 73,
    ranking: 5,
    sold: false,
    sellerConfirmed: false,
    buyerConfirmed: false
  }
];

if (!products) {
  products = seedProducts;
  saveProducts();
}


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function getConfig() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_CONFIG) || 'null');

  if (saved) {
    return saved;
  }

  const config = {
    adminPassword: 'MarketFlash2026!',

    panel: {
      compact: false,
      notifications: true,
      animations: true,
      darkMode: false
    },

    advertising: {
      enabled: true
    },

    plans: {
      cheap: {
        name: 'Económico',
        description: 'Publicidad básica',
        price: 500
      },
      normal: {
        name: 'Normal',
        description: 'Más visibilidad',
        price: 1000
      },
      pro: {
        name: 'PRO',
        description: 'Máxima visibilidad',
        price: 2000
      }
    },

    paymentMethods: {
      popular: {
        name: 'Banco Popular',
        enabled: true,
        account: ''
      },

      banreservas: {
        name: 'Banreservas',
        enabled: true,
        account: ''
      },

      binance: {
        name: 'Binance',
        enabled: true,
        account: ''
      },

      paypal: {
        name: 'PayPal',
        enabled: true,
        account: ''
      }
    }
  };

  localStorage.setItem(STORAGE_CONFIG, JSON.stringify(config));

  return config;
}

function saveConfig(config) {
  localStorage.setItem(STORAGE_CONFIG, JSON.stringify(config));
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function saveProducts() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
}

function saveAds() {
  try {
    localStorage.setItem(STORAGE_ADS, JSON.stringify(ads));
  } catch (error) {
    console.error(error);
    toast('No se pudo guardar el archivo. Puede ser demasiado grande.');
  }
}

function saveMessages() {
  localStorage.setItem(STORAGE_MESSAGES, JSON.stringify(messages));
}

function saveClaims() {
  localStorage.setItem(STORAGE_CLAIMS, JSON.stringify(claims));
}

function saveSanctions() {
  localStorage.setItem(STORAGE_SANCTIONS, JSON.stringify(sanctions));
}

function getStats() {
  const saved = JSON.parse(localStorage.getItem(STORAGE_STATS) || 'null');

  if (saved) return saved;

  const stats = {
    registeredTotal: user ? 1 : 0,
    deletedTotal: 0
  };

  localStorage.setItem(STORAGE_STATS, JSON.stringify(stats));

  return stats;
}

function saveStats(stats) {
  localStorage.setItem(STORAGE_STATS, JSON.stringify(stats));
}

function money(value) {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: 'DOP',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, function (char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    }[char];
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;

    reader.readAsDataURL(file);
  });
}

function toast(message) {
  const element = document.getElementById('toast');

  if (!element) {
    alert(message);
    return;
  }

  element.textContent = message;
  element.classList.remove('hidden');

  clearTimeout(window.marketFlashToast);

  window.marketFlashToast = setTimeout(() => {
    element.classList.add('hidden');
  }, 2800);
}

function showModal(html) {
  const modal = document.getElementById('modal');
  const card = document.getElementById('modalCard');

  if (!modal || !card) return;

  card.innerHTML = html;
  modal.classList.remove('hidden');
}

function closeModal() {
  const modal = document.getElementById('modal');
  const card = document.getElementById('modalCard');

  if (modal) modal.classList.add('hidden');
  if (card) card.innerHTML = '';
}

function getLoggedUserName() {
  return user ? user.name : '';
}


/* =========================================================
   INICIO
   ========================================================= */

function renderCategories() {
  const row = document.getElementById('categoryRow');

  if (!row) return;

  const categories = [
    ['Todos', 'Todos'],
    ['Celulares', '📱 Celulares'],
    ['Computadoras', '💻 Computadoras'],
    ['Videojuegos', '🎮 Videojuegos'],
    ['Ropa', '👕 Ropa'],
    ['Hogar', '🏠 Hogar'],
    ['Vehículos', '🚗 Vehículos']
  ];

  row.innerHTML = categories.map(([value, label]) => `
    <button
      class="chip ${currentCategory === value ? 'active' : ''}"
      onclick="setCategory('${value}')">
      ${label}
    </button>
  `).join('');
}

function setCategory(category) {
  currentCategory = category;

  renderCategories();
  renderProducts();
}

function renderProducts() {
  const grid = document.getElementById('productsGrid');

  if (!grid) return;

  const searchElement = document.getElementById('searchInput');

  const search = searchElement
    ? searchElement.value.trim().toLowerCase()
    : '';

  const visibleProducts = products.filter(product => {
    const categoryMatch =
      currentCategory === 'Todos' ||
      product.category === currentCategory;

    const searchMatch =
      !search ||
      String(product.name).toLowerCase().includes(search) ||
      String(product.category).toLowerCase().includes(search) ||
      String(product.location).toLowerCase().includes(search);

    return categoryMatch && searchMatch && !product.sold;
  });

  const count = document.getElementById('productCount');

  if (count) {
    count.textContent =
      `${visibleProducts.length} ${visibleProducts.length === 1 ? 'producto' : 'productos'}`;
  }

  if (!visibleProducts.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <div style="font-size:45px">🔎</div>
        <h3>No encontramos productos</h3>
        <p>Prueba con otra búsqueda o categoría.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = visibleProducts.map(product => `
    <article class="product-card" onclick="openProduct(${product.id})">

      <div class="product-image-wrap">
        <img
          src="${escapeHtml(product.image)}"
          alt="${escapeHtml(product.name)}"
          class="product-image"
        >
      </div>

      <div class="product-body">

        <div class="product-category">
          ${escapeHtml(product.category)}
        </div>

        <h3>${escapeHtml(product.name)}</h3>

        <strong class="product-price">
          ${money(product.price)}
        </strong>

        <div class="product-location">
          📍 ${escapeHtml(product.location)}
        </div>

        <div class="product-stats">
          <span>👁️ ${product.views || 0}</span>
          <span>❤️ ${product.likes || 0}</span>
          <span>⭐ ${product.ranking || 0}</span>
        </div>

      </div>

    </article>
  `).join('');
}


/* =========================================================
   PRODUCTO
   ========================================================= */

function openProduct(id) {
  const product = products.find(item => item.id === id);

  if (!product) return;

  product.views = Number(product.views || 0) + 1;

  saveProducts();

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="closeModal()">←</button>
      <h2>${escapeHtml(product.name)}</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="product-detail">

      <img
        src="${escapeHtml(product.image)}"
        alt="${escapeHtml(product.name)}"
        class="detail-image"
      >

      <div class="detail-category">
        ${escapeHtml(product.category)}
      </div>

      <h1>${escapeHtml(product.name)}</h1>

      <div class="detail-price">
        ${money(product.price)}
      </div>

      <p class="detail-description">
        ${escapeHtml(product.description || 'Sin descripción.')}
      </p>

      <div class="detail-info">
        <div>📍 ${escapeHtml(product.location)}</div>
        <div>👤 ${escapeHtml(product.seller)}</div>
        <div>👁️ ${product.views || 0} vistas</div>
        <div>❤️ ${product.likes || 0} me gusta</div>
        <div>⭐ Ranking del vendedor: ${product.ranking || 0}/5</div>
      </div>

      <div class="action-grid">

        <button class="primary" onclick="startChat('${escapeHtml(product.seller)}', ${product.id})">
          💬 Chat
        </button>

        <button class="primary whatsapp" onclick="contactWhatsApp(${product.id})">
          🟢 WhatsApp
        </button>

        <button class="primary messenger" onclick="contactMessenger(${product.id})">
          🔵 Messenger
        </button>

        <button class="secondary" onclick="likeProduct(${product.id})">
          ❤️ Me gusta
        </button>

        <button class="danger" onclick="openClaim(${product.id})">
          🚨 Reclamar
        </button>

      </div>

      ${
        product.buyerConfirmed
          ? `<div class="notice success">✅ El comprador marcó este producto como comprado.</div>`
          : ''
      }

      ${
        product.sellerConfirmed
          ? `<div class="notice success">✅ El vendedor marcó este producto como vendido.</div>`
          : ''
      }

    </div>
  `);
}

function likeProduct(id) {
  const product = products.find(item => item.id === id);

  if (!product) return;

  product.likes = Number(product.likes || 0) + 1;

  saveProducts();
  renderProducts();

  toast('❤️ Me gusta registrado');
}

function contactWhatsApp(id) {
  const product = products.find(item => item.id === id);

  if (!product) return;

  const seller = product.whatsapp || '';

  if (!seller) {
    toast('El vendedor todavía no tiene WhatsApp configurado.');
    return;
  }

  const number = String(seller).replace(/\D/g, '');

  window.open(
    `https://wa.me/${number}?text=${encodeURIComponent(
      `Hola, vi "${product.name}" en Market Flash.`
    )}`,
    '_blank'
  );
}

function contactMessenger(id) {
  const product = products.find(item => item.id === id);

  if (!product) return;

  if (product.messenger) {
    window.open(product.messenger, '_blank');
    return;
  }

  toast('El vendedor todavía no tiene Messenger configurado.');
}


/* =========================================================
   PUBLICAR PRODUCTO
   ========================================================= */

function openPublish() {
  if (!user) {
    loginRequired('Para publicar necesitas crear una cuenta.');
    return;
  }

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="closeModal()">←</button>
      <h2>➕ Publicar</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <form id="publishForm" class="form">

      <div class="field">
        <label>📦 Nombre del producto</label>
        <input id="publishName" required placeholder="Ej. iPhone 15 Pro">
      </div>

      <div class="field">
        <label>🏷️ Categoría</label>
        <select id="publishCategory" required>
          <option value="Celulares">Celulares</option>
          <option value="Computadoras">Computadoras</option>
          <option value="Videojuegos">Videojuegos</option>
          <option value="Ropa">Ropa</option>
          <option value="Hogar">Hogar</option>
          <option value="Vehículos">Vehículos</option>
          <option value="Otros">Otros</option>
        </select>
      </div>

      <div class="field">
        <label>💰 Precio</label>
        <input id="publishPrice" type="number" min="0" required>
      </div>

      <div class="field">
        <label>📍 Ubicación</label>
        <input id="publishLocation" required placeholder="Santo Domingo">
      </div>

      <div class="field">
        <label>📝 Descripción</label>
        <textarea id="publishDescription" rows="4" required></textarea>
      </div>

      <div class="field">
        <label>🖼️ Foto</label>
        <input id="publishImage" type="file" accept="image/*" required>
      </div>

      <button class="primary" type="submit">
        🚀 Publicar producto
      </button>

    </form>
  `);

  document.getElementById('publishForm').addEventListener('submit', publishProduct);
}

async function publishProduct(event) {
  event.preventDefault();

  const file = document.getElementById('publishImage').files[0];

  if (!file) {
    toast('Selecciona una foto.');
    return;
  }

  try {
    const image = await fileToDataUrl(file);

    const product = {
      id: Date.now(),
      name: document.getElementById('publishName').value.trim(),
      category: document.getElementById('publishCategory').value,
      price: Number(document.getElementById('publishPrice').value),
      location: document.getElementById('publishLocation').value.trim(),
      description: document.getElementById('publishDescription').value.trim(),
      image,
      seller: user.name,
      whatsapp: user.whatsapp || '',
      messenger: user.messenger || '',
      views: 0,
      likes: 0,
      ranking: 5,
      sold: false,
      sellerConfirmed: false,
      buyerConfirmed: false,
      createdAt: new Date().toISOString()
    };

    products.unshift(product);

    saveProducts();
    closeModal();
    renderProducts();

    toast('✅ Producto publicado correctamente');

  } catch (error) {
    console.error(error);
    toast('No se pudo publicar el producto.');
  }
}


/* =========================================================
   LOGIN / REGISTRO
   ========================================================= */

function loginRequired(message) {
  showModal(`
    <div class="modal-header">
      <h2>🔐 Cuenta necesaria</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="notice">
      ${escapeHtml(message)}
    </div>

    <button class="primary" onclick="register()">
      📝 Crear cuenta
    </button>

    <button class="secondary" onclick="login()">
      🔑 Iniciar sesión
    </button>
  `);
}

function register() {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="closeModal()">←</button>
      <h2>📝 Crear cuenta</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <form id="registerForm" class="form">

      <div class="field">
        <label>👤 Nombre completo</label>
        <input id="registerName" required>
      </div>

      <div class="field">
        <label>🪪 Número de cédula</label>
        <input id="registerCedula" required>
      </div>

      <div class="field">
        <label>📱 WhatsApp</label>
        <input id="registerWhatsapp" type="tel" required>
      </div>

      <div class="field">
        <label>📧 Correo</label>
        <input id="registerEmail" type="email">
      </div>

      <div class="field">
        <label>🔐 Contraseña</label>
        <input id="registerPassword" type="password" minlength="6" required>
      </div>

      <button class="primary">
        Crear cuenta
      </button>

    </form>
  `);

  document.getElementById('registerForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const newUser = {
      id: Date.now(),
      name: document.getElementById('registerName').value.trim(),
      cedula: document.getElementById('registerCedula').value.trim(),
      whatsapp: document.getElementById('registerWhatsapp').value.trim(),
      email: document.getElementById('registerEmail').value.trim(),
      password: document.getElementById('registerPassword').value,
      createdAt: new Date().toISOString(),
      ranking: 5,
      photo: ''
    };

    user = newUser;

    localStorage.setItem(STORAGE_USER, JSON.stringify(user));

    const stats = getStats();
    stats.registeredTotal = Number(stats.registeredTotal || 0) + 1;
    saveStats(stats);

    closeModal();

    toast('✅ Cuenta creada correctamente');

    updateBadges();
  });
}

function login() {
  showModal(`
    <div class="modal-header">
      <h2>🔑 Iniciar sesión</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <form id="loginForm" class="form">

      <div class="field">
        <label>📱 WhatsApp</label>
        <input id="loginWhatsapp" required>
      </div>

      <div class="field">
        <label>🔐 Contraseña</label>
        <input id="loginPassword" type="password" required>
      </div>

      <button class="primary">
        Entrar
      </button>

    </form>
  `);

  document.getElementById('loginForm').addEventListener('submit', function (event) {
    event.preventDefault();

    const whatsapp = document.getElementById('loginWhatsapp').value.trim();
    const password = document.getElementById('loginPassword').value;

    const savedUser = JSON.parse(localStorage.getItem(STORAGE_USER) || 'null');

    if (
      savedUser &&
      savedUser.whatsapp === whatsapp &&
      savedUser.password === password
    ) {
      user = savedUser;

      closeModal();

      toast('✅ Bienvenido a Market Flash');

      updateBadges();

    } else {
      toast('❌ Datos incorrectos');
    }
  });
}


/* =========================================================
   PERFIL
   ========================================================= */

function openProfile() {
  if (!user) {
    loginRequired('Inicia sesión para acceder a tu perfil.');
    return;
  }

  showModal(`
    <div class="modal-header">
      <h2>👤 Mi perfil</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="profile">

      ${
        user.photo
          ? `<img src="${user.photo}" class="profile-photo" alt="Foto">`
          : `<div class="avatar">👤</div>`
      }

      <h2>${escapeHtml(user.name)}</h2>

      <p class="muted">
        ⭐ Ranking ${user.ranking || 5}/5
      </p>

      <div class="profile-menu">

        <button class="menu-button" onclick="editProfile()">
          ✏️ Editar perfil
        </button>

        <button class="menu-button" onclick="editProfilePhoto()">
          📷 Foto de perfil
        </button>

        <button class="menu-button" onclick="openActivity()">
          📊 Mi actividad
        </button>

        <button class="menu-button" onclick="settings()">
          ⚙️ Configuración
        </button>

        <button class="menu-button" onclick="logout()">
          🚪 Cerrar sesión
        </button>

      </div>

    </div>
  `);
}

function editProfile() {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="openProfile()">←</button>
      <h2>✏️ Editar perfil</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <form id="editProfileForm" class="form">

      <div class="field">
        <label>👤 Nombre</label>
        <input id="editName" value="${escapeHtml(user.name)}" required>
      </div>

      <div class="field">
        <label>📱 WhatsApp</label>
        <input id="editWhatsapp" value="${escapeHtml(user.whatsapp || '')}" required>
      </div>

      <div class="field">
        <label>📧 Correo</label>
        <input id="editEmail" type="email" value="${escapeHtml(user.email || '')}">
      </div>

      <button class="primary">
        💾 Guardar cambios
      </button>

    </form>
  `);

  document.getElementById('editProfileForm').addEventListener('submit', function (event) {
    event.preventDefault();

    user.name = document.getElementById('editName').value.trim();
    user.whatsapp = document.getElementById('editWhatsapp').value.trim();
    user.email = document.getElementById('editEmail').value.trim();

    localStorage.setItem(STORAGE_USER, JSON.stringify(user));

    products.forEach(product => {
      if (product.seller === user.name) {
        product.whatsapp = user.whatsapp;
      }
    });

    saveProducts();

    openProfile();

    toast('✅ Perfil actualizado');
  });
}

function editProfilePhoto() {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="openProfile()">←</button>
      <h2>📷 Foto de perfil</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="profile">

      ${
        user.photo
          ? `<img id="profilePreview" src="${user.photo}" class="profile-photo" alt="Foto">`
          : `<div id="profilePreview" class="avatar">👤</div>`
      }

      <p class="muted">
        Toma una foto o selecciona una de tu galería.
      </p>

      <div class="action-grid">

        <button
          class="secondary"
          onclick="document.getElementById('profileCamera').click()">
          📷 Cámara
        </button>

        <button
          class="secondary"
          onclick="document.getElementById('profileGallery').click()">
          🖼️ Galería
        </button>

      </div>

      <input
        id="profileCamera"
        type="file"
        accept="image/*"
        capture="user"
        hidden
      >

      <input
        id="profileGallery"
        type="file"
        accept="image/*"
        hidden
      >

    </div>
  `);

  document.getElementById('profileCamera')
    .addEventListener('change', handleProfilePhoto);

  document.getElementById('profileGallery')
    .addEventListener('change', handleProfilePhoto);
}

async function handleProfilePhoto(event) {
  const file = event.target.files?.[0];

  if (!file) return;

  if (!file.type.startsWith('image/')) {
    toast('Selecciona una imagen válida.');
    return;
  }

  try {
    user.photo = await fileToDataUrl(file);

    localStorage.setItem(STORAGE_USER, JSON.stringify(user));

    toast('✅ Foto actualizada');

    openProfile();

  } catch (error) {
    console.error(error);
    toast('No se pudo guardar la foto.');
  }
}

function logout() {
  user = null;
  localStorage.removeItem(STORAGE_USER);

  closeModal();

  toast('👋 Sesión cerrada');
}


/* =========================================================
   CONFIGURACIÓN DE USUARIO
   ========================================================= */

function settings() {
  if (!user) return;

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="openProfile()">←</button>
      <h2>⚙️ Configuración</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="profile-menu">

      <button class="menu-button" onclick="changePassword()">
        🔐 Cambiar contraseña
      </button>

      <button class="menu-button" onclick="securityPage()">
        🛡️ Seguridad
      </button>

      <button class="menu-button danger" onclick="deleteAccount()">
        🗑️ Eliminar cuenta
      </button>

    </div>
  `);
}

function changePassword() {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="settings()">←</button>
      <h2>🔐 Cambiar contraseña</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <form id="changePasswordForm" class="form">

      <div class="field">
        <label>Contraseña actual</label>
        <input id="oldPassword" type="password" required>
      </div>

      <div class="field">
        <label>Nueva contraseña</label>
        <input id="newPassword" type="password" minlength="6" required>
      </div>

      <button class="primary">
        Cambiar contraseña
      </button>

    </form>
  `);

  document.getElementById('changePasswordForm')
    .addEventListener('submit', function (event) {
      event.preventDefault();

      const oldPassword =
        document.getElementById('oldPassword').value;

      const newPassword =
        document.getElementById('newPassword').value;

      if (oldPassword !== user.password) {
        toast('❌ La contraseña actual es incorrecta.');
        return;
      }

      user.password = newPassword;

      localStorage.setItem(STORAGE_USER, JSON.stringify(user));

      settings();

      toast('✅ Contraseña actualizada');
    });
}

function securityPage() {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="settings()">←</button>
      <h2>🛡️ Seguridad</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="notice">
      Market Flash protege las funciones principales de tu cuenta.
    </div>

    <div class="card">
      <strong>📱 WhatsApp</strong>
      <p>${escapeHtml(user.whatsapp || 'No configurado')}</p>
    </div>

    <div class="card">
      <strong>📧 Correo</strong>
      <p>${escapeHtml(user.email || 'No configurado')}</p>
    </div>

    <div class="card">
      <strong>🪪 Cédula</strong>
      <p>${escapeHtml(user.cedula || 'No registrada')}</p>
    </div>
  `);
}

function deleteAccount() {
  if (!user) return;

  const confirmation = confirm(
    '¿Seguro que deseas eliminar tu cuenta?'
  );

  if (!confirmation) return;

  const stats = getStats();

  stats.deletedTotal =
    Number(stats.deletedTotal || 0) + 1;

  saveStats(stats);

  localStorage.removeItem(STORAGE_USER);

  user = null;

  closeModal();

  toast('🗑️ Cuenta eliminada');
}


/* =========================================================
   ACTIVIDAD
   ========================================================= */

function openActivity() {
  if (!user) {
    loginRequired('Inicia sesión para ver tu actividad.');
    return;
  }

  const mine = products.filter(
    product => product.seller === user.name
  );

  showModal(`
    <div class="modal-header">
      <h2>📊 Actividad</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="stats-grid">

      <div class="stat-card">
        <strong>${mine.length}</strong>
        <span>Publicaciones</span>
      </div>

      <div class="stat-card">
        <strong>
          ${mine.reduce((sum, p) => sum + Number(p.views || 0), 0)}
        </strong>
        <span>Vistas</span>
      </div>

      <div class="stat-card">
        <strong>
          ${mine.reduce((sum, p) => sum + Number(p.likes || 0), 0)}
        </strong>
        <span>Me gusta</span>
      </div>

      <div class="stat-card">
        <strong>${user.ranking || 5}/5</strong>
        <span>Ranking</span>
      </div>

    </div>

    <h3 style="margin-top:20px">Mis publicaciones</h3>

    ${
      mine.length
        ? mine.map(product => `
          <div class="card" style="margin-top:10px">

            <strong>${escapeHtml(product.name)}</strong>

            <p>${money(product.price)}</p>

            <p class="muted">
              👁️ ${product.views || 0}
              · ❤️ ${product.likes || 0}
            </p>

            ${
              product.sold
                ? `<div class="notice success">✅ Vendido</div>`
                : `
                  <button
                    class="primary"
                    style="margin-top:8px"
                    onclick="markSold(${product.id})">
                    🏷️ Marcar como vendido
                  </button>
                `
            }

          </div>
        `).join('')
        : `<div class="empty-state">Todavía no tienes publicaciones.</div>`
    }
  `);
}

function markSold(id) {
  const product = products.find(item => item.id === id);

  if (!product) return;

  product.sellerConfirmed = true;

  checkSaleConfirmation(product);

  saveProducts();

  openActivity();

  toast(
    product.sold
      ? '✅ Venta confirmada por ambas partes'
      : '🕐 Esperando confirmación del comprador'
  );
}

function markBought(id) {
  const product = products.find(item => item.id === id);

  if (!product) return;

  product.buyerConfirmed = true;

  checkSaleConfirmation(product);

  saveProducts();

  closeModal();

  toast(
    product.sold
      ? '✅ Compra confirmada por ambas partes'
      : '🕐 Esperando confirmación del vendedor'
  );
}

function checkSaleConfirmation(product) {
  if (product.sellerConfirmed && product.buyerConfirmed) {
    product.sold = true;
  }
}


/* =========================================================
   CHAT
   ========================================================= */

function startChat(seller, productId) {
  if (!user) {
    loginRequired('Inicia sesión para usar el chat.');
    return;
  }

  openChat(seller, productId);
}

function openChat(seller, productId) {
  const conversation = messages.filter(message =>
    (
      message.from === user.name &&
      message.to === seller
    ) ||
    (
      message.from === seller &&
      message.to === user.name
    )
  );

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="openProduct(${productId})">←</button>
      <h2>💬 Chat con ${escapeHtml(seller)}</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="chat-window">

      <div class="chat-messages">

        ${
          conversation.length
            ? conversation.map(message => `
              <div class="chat-message ${
                message.from === user.name
                  ? 'mine'
                  : 'theirs'
              }">
                <div>${escapeHtml(message.text)}</div>
                <small>${escapeHtml(message.from)}</small>
              </div>
            `).join('')
            : `
              <div class="chat-empty">
                💬<br>
                Comienza la conversación.
              </div>
            `
        }

      </div>

      <form id="chatForm" class="chat-form">

        <input
          id="chatText"
          placeholder="Escribe un mensaje..."
          required
        >

        <button class="primary">
          ➤
        </button>

      </form>

      <button
        class="danger"
        style="margin-top:10px"
        onclick="openClaim(${productId}, '${escapeHtml(seller)}')">
        🚨 Reclamar
      </button>

      <button
        class="secondary"
        style="margin-top:8px"
        onclick="markBought(${productId})">
        🛒 Marcar como comprado
      </button>

    </div>
  `);

  document.getElementById('chatForm').addEventListener(
    'submit',
    function (event) {
      event.preventDefault();

      const text =
        document.getElementById('chatText').value.trim();

      if (!text) return;

      messages.push({
        id: Date.now(),
        from: user.name,
        to: seller,
        productId,
        text,
        read: false,
        createdAt: new Date().toISOString()
      });

      saveMessages();

      openChat(seller, productId);
    }
  );
}


/* =========================================================
   RECLAMOS
   ========================================================= */

function openClaim(productId, seller) {
  if (!user) {
    loginRequired('Inicia sesión para presentar una reclamación.');
    return;
  }

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="openChat('${escapeHtml(seller)}', ${productId})">←</button>
      <h2>🚨 Reclamar</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <form id="claimForm" class="form">

      <div class="notice">
        Tu reclamación será enviada al administrador.
      </div>

      <div class="field">
        <label>Motivo</label>
        <textarea
          id="claimReason"
          rows="5"
          required
          placeholder="Explica lo ocurrido..."
        ></textarea>
      </div>

      <div class="field">
        <label>📸 Evidencia</label>
        <input
          id="claimEvidence"
          type="file"
          accept="image/*"
        >
      </div>

      <button class="danger">
        🚨 Enviar reclamación
      </button>

    </form>
  `);

  document.getElementById('claimForm')
    .addEventListener('submit', async function (event) {
      event.preventDefault();

      const reason =
        document.getElementById('claimReason').value.trim();

      const file =
        document.getElementById('claimEvidence').files[0];

      let evidence = '';

      if (file) {
        evidence = await fileToDataUrl(file);
      }

      claims.push({
        id: Date.now(),
        user: user.name,
        productId,
        seller,
        reason,
        evidence,
        status: 'pendiente',
        createdAt: new Date().toISOString()
      });

      saveClaims();

      closeModal();

      toast('🚨 Reclamo enviado al administrador');
    });
}


/* =========================================================
   PUBLICIDAD — FLASH DEL DÍA
   ========================================================= */

function openAdvertising() {
  if (!user) {
    loginRequired(
      'Para publicar publicidad necesitas una cuenta.'
    );
    return;
  }

  const config = getConfig();

  const plans = config.plans;

  const methods =
    Object.entries(config.paymentMethods)
      .filter(([, method]) => method.enabled);

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="closeModal()">←</button>
      <h2>⚡ Flash del Día</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <form id="advertisingForm" class="form">

      <div class="notice">
        Publica tu negocio en la zona destacada de Market Flash.
      </div>

      <div class="field">
        <label>📸 Foto o vídeo</label>

        <input
          id="adMedia"
          type="file"
          accept="image/*,video/*"
          capture
          required
        >
      </div>

      <div id="adMediaPreview" class="ad-preview">
        Selecciona una foto o vídeo
      </div>

      <div class="field">
        <label>🏷️ Título</label>
        <input id="adTitle" required placeholder="Nombre de tu negocio">
      </div>

      <div class="field">
        <label>📝 Descripción</label>
        <textarea
          id="adDescription"
          rows="4"
          required
          placeholder="Describe tu promoción..."
        ></textarea>
      </div>

      <h3>💎 Selecciona tu plan</h3>

      <div class="plan-grid">

        <label class="plan-card">
          <input
            type="radio"
            name="adPlan"
            value="cheap"
            checked
          >
          <strong>${escapeHtml(plans.cheap.name)}</strong>
          <span>${escapeHtml(plans.cheap.description)}</span>
          <b>${money(plans.cheap.price)}</b>
        </label>

        <label class="plan-card">
          <input
            type="radio"
            name="adPlan"
            value="normal"
          >
          <strong>${escapeHtml(plans.normal.name)}</strong>
          <span>${escapeHtml(plans.normal.description)}</span>
          <b>${money(plans.normal.price)}</b>
        </label>

        <label class="plan-card">
          <input
            type="radio"
            name="adPlan"
            value="pro"
          >
          <strong>${escapeHtml(plans.pro.name)}</strong>
          <span>${escapeHtml(plans.pro.description)}</span>
          <b>${money(plans.pro.price)}</b>
        </label>

      </div>

      <h3>💳 Método de pago</h3>

      <div class="payment-options">

        ${
          methods.length
            ? methods.map(([key, method], index) => `
              <label class="payment-option">

                <input
                  type="radio"
                  name="paymentMethod"
                  value="${key}"
                  ${index === 0 ? 'checked' : ''}
                >

                <strong>
                  ${escapeHtml(method.name)}
                </strong>

                <small>
                  ${escapeHtml(method.account || 'Cuenta no configurada')}
                </small>

              </label>
            `).join('')
            : `<div class="notice">No hay métodos de pago habilitados.</div>`
        }

      </div>

      <div class="field">
        <label>🧾 Comprobante de pago</label>
        <input
          id="adProof"
          type="file"
          accept="image/*"
        >
      </div>

      <button class="primary" type="submit">
        🚀 Enviar publicidad
      </button>

    </form>
  `);

  const mediaInput = document.getElementById('adMedia');

  mediaInput.addEventListener('change', function () {
    const file = mediaInput.files[0];
    const preview = document.getElementById('adMediaPreview');

    if (!file) return;

    const url = URL.createObjectURL(file);

    if (file.type.startsWith('video/')) {
      preview.innerHTML = `
        <video
          src="${url}"
          controls
          muted
          playsinline
          style="width:100%;max-height:360px">
        </video>
      `;
    } else {
      preview.innerHTML = `
        <img
          src="${url}"
          alt="Vista previa"
          style="width:100%;max-height:360px;object-fit:cover">
      `;
    }
  });

  document.getElementById('advertisingForm')
    .addEventListener('submit', submitAdvertising);
}

async function submitAdvertising(event) {
  event.preventDefault();

  const mediaFile =
    document.getElementById('adMedia').files[0];

  if (!mediaFile) {
    toast('Selecciona una foto o vídeo.');
    return;
  }

  const plan =
    document.querySelector(
      'input[name="adPlan"]:checked'
    )?.value || 'cheap';

  const payment =
    document.querySelector(
      'input[name="paymentMethod"]:checked'
    )?.value || '';

  const proofFile =
    document.getElementById('adProof').files[0];

  try {
    const media = await fileToDataUrl(mediaFile);

    let proof = '';

    if (proofFile) {
      proof = await fileToDataUrl(proofFile);
    }

    const config = getConfig();

    const ad = {
      id: Date.now(),
      user: user.name,
      userId: user.id,
      title: document.getElementById('adTitle').value.trim(),
      description: document.getElementById('adDescription').value.trim(),
      media,
      mediaType: mediaFile.type.startsWith('video/')
        ? 'video'
        : 'image',
      plan,
      paymentMethod: payment,
      paymentProof: proof,
      price: config.plans[plan].price,
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };

    ads.unshift(ad);

    saveAds();

    closeModal();

    toast(
      '✅ Publicidad enviada. Esperando aprobación del administrador.'
    );

    updateBadges();

  } catch (error) {
    console.error(error);
    toast('No se pudo enviar la publicidad.');
  }
}


/* =========================================================
   MOSTRAR FLASH DEL DÍA
   ========================================================= */

function getApprovedAds() {
  return ads
    .filter(ad => ad.status === 'aprobado')
    .sort(
      (a, b) =>
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
    );
}

function renderFlashDay() {
  const button = document.getElementById('flashDayBtn');

  if (!button) return;

  const approved = getApprovedAds();

  if (!approved.length) {
    button.innerHTML = `
      <div class="flash-icon">⚡</div>

      <div class="flash-copy">
        <span>PUBLICIDAD</span>
        <strong>Publicación Flash del Día</strong>
        <small>
          Descubre anuncios destacados y oportunidades.
        </small>
      </div>

      <div class="arrow">›</div>
    `;

    return;
  }

  const ad =
    approved[flashIndex % approved.length];

  button.innerHTML = `
    <div class="flash-icon">⚡</div>

    <div class="flash-copy">
      <span>PUBLICIDAD</span>
      <strong>${escapeHtml(ad.title)}</strong>
      <small>${escapeHtml(ad.description || '')}</small>
    </div>

    <div class="arrow">›</div>
  `;

  button.onclick = function () {
    openFlashAd(ad.id);
  };

  clearTimeout(flashTimer);

  if (approved.length > 1) {
    flashTimer = setTimeout(() => {
      flashIndex++;

      renderFlashDay();
    }, 5000);
  }
}

function openFlashAd(id) {
  const ad = ads.find(item => item.id === id);

  if (!ad) return;

  showModal(`
    <div class="modal-header">
      <h2>⚡ Flash del Día</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <div class="flash-ad-detail">

      <span class="badge-ad">PUBLICIDAD</span>

      <h2>${escapeHtml(ad.title)}</h2>

      ${
        ad.mediaType === 'video'
          ? `
            <video
              src="${ad.media}"
              controls
              autoplay
              muted
              playsinline
              class="ad-live-media">
            </video>
          `
          : `
            <img
              src="${ad.media}"
              class="ad-live-media"
              alt="${escapeHtml(ad.title)}">
          `
      }

      <p>${escapeHtml(ad.description || '')}</p>

      <div class="notice">
        Plan: ${escapeHtml(ad.plan)}
      </div>

    </div>
  `);
}


/* =========================================================
   ADMIN
   ========================================================= */

function openAdmin() {
  const config = getConfig();

  showModal(`
    <div class="modal-header">
      <h2>🛡️ Panel de administrador</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    <form id="adminLoginForm" class="form">

      <div class="notice">
        Área exclusiva del administrador.
      </div>

      <div class="field">
        <label>🔐 Contraseña</label>
        <input id="adminPassword" type="password" required>
      </div>

      <button class="primary">
        Entrar al panel
      </button>

    </form>
  `);

  document.getElementById('adminLoginForm')
    .addEventListener('submit', function (event) {
      event.preventDefault();

      const password =
        document.getElementById('adminPassword').value;

      if (password !== config.adminPassword) {
        toast('❌ Contraseña incorrecta');
        return;
      }

      adminPanel();
    });
}

function adminPanel() {
  const stats = getStats();

  const pendingAds =
    ads.filter(ad => ad.status === 'pendiente').length;

  const pendingClaims =
    claims.filter(claim => claim.status === 'pendiente').length;

  const unreadMessages =
    messages.filter(message => !message.read).length;

  showModal(`
    <div class="modal-header">
      <h2>🛡️ Administrador</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    ${
      pendingAds > 0
        ? `
          <button
            class="admin-alert"
            onclick="adminAdvertising()">
            🚨 ${pendingAds}
            nueva${pendingAds === 1 ? '' : 's'}
            solicitud${pendingAds === 1 ? '' : 'es'}
            de publicidad
          </button>
        `
        : ''
    }

    <div class="admin-grid">

      <div class="admin-counter">
        <b>${stats.registeredTotal || 0}</b>
        <span>Usuarios registrados</span>
      </div>

      <div class="admin-counter">
        <b>${stats.deletedTotal || 0}</b>
        <span>Cuentas eliminadas</span>
      </div>

      <div class="admin-counter">
        <b>${ads.length}</b>
        <span>Publicidades</span>
      </div>

      <div class="admin-counter">
        <b>${pendingClaims}</b>
        <span>Reclamos pendientes</span>
      </div>

    </div>

    <div class="admin-menu">

      <button class="menu-button" onclick="adminAdvertising()">
        📣 Publicidad
        ${
          pendingAds
            ? `<span class="red-count">${pendingAds}</span>`
            : ''
        }
      </button>

      <button class="menu-button" onclick="adminPayments()">
        💳 Pagos
      </button>

      <button class="menu-button" onclick="adminUsers()">
        👥 Usuarios
      </button>

      <button class="menu-button" onclick="adminClaims()">
        🚨 Reclamos
        ${
          pendingClaims
            ? `<span class="red-count">${pendingClaims}</span>`
            : ''
        }
      </button>

      <button class="menu-button" onclick="adminChat()">
        💬 Chat administrativo
        ${
          unreadMessages
            ? `<span class="red-count">${unreadMessages}</span>`
            : ''
        }
      </button>

      <button class="menu-button" onclick="adminSanctions()">
        ⚖️ Sanciones y multas
      </button>

      <button class="menu-button" onclick="adminPanelSettings()">
        ⚙️ Configuración del panel
      </button>

      <button class="menu-button" onclick="changeAdminPassword()">
        🔐 Cambiar contraseña del administrador
      </button>

    </div>
  `);
}


/* =========================================================
   ADMIN — PUBLICIDAD
   ========================================================= */

function adminAdvertising() {
  const config = getConfig();

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminPanel()">←</button>
      <h2>📣 Publicidad</h2>
      <button class="close-btn" onclick="adminPanel()">×</button>
    </div>

    <div class="card">

      <h3>Estado de publicidad</h3>

      <label class="switch-row">

        <span>
          Publicidad habilitada
        </span>

        <input
          type="checkbox"
          id="advertisingEnabled"
          ${config.advertising.enabled ? 'checked' : ''}
        >

      </label>

    </div>

    <h3 style="margin-top:18px">
      💎 Planes
    </h3>

    <form id="plansForm" class="form">

      <div class="field">
        <label>Plan Económico</label>
        <input
          id="cheapPrice"
          type="number"
          value="${config.plans.cheap.price}">
      </div>

      <div class="field">
        <label>Plan Normal</label>
        <input
          id="normalPrice"
          type="number"
          value="${config.plans.normal.price}">
      </div>

      <div class="field">
        <label>Plan PRO</label>
        <input
          id="proPrice"
          type="number"
          value="${config.plans.pro.price}">
      </div>

      <button class="primary">
        💾 Guardar precios
      </button>

    </form>

    <h3 style="margin-top:18px">
      💳 Métodos de pago
    </h3>

    <div class="payment-admin-list">

      ${Object.entries(config.paymentMethods).map(
        ([key, method]) => `
          <div class="card" style="margin-top:10px">

            <strong>${escapeHtml(method.name)}</strong>

            <label class="switch-row">

              <span>Habilitado</span>

              <input
                type="checkbox"
                id="method_${key}"
                ${method.enabled ? 'checked' : ''}
              >

            </label>

            <div class="field">
              <label>Cuenta / información</label>

              <input
                id="account_${key}"
                value="${escapeHtml(method.account || '')}"
              >
            </div>

          </div>
        `
      ).join('')}

    </div>

    <button
      class="primary"
      style="margin-top:14px"
      onclick="saveAdvertisingConfig()">
      💾 Guardar configuración
    </button>

    <h3 style="margin-top:22px">
      📥 Solicitudes recibidas
    </h3>

    <div id="adminAdsList">
      ${renderAdminAds()}
    </div>
  `);

  document.getElementById('plansForm')
    .addEventListener('submit', function (event) {
      event.preventDefault();

      config.plans.cheap.price =
        Number(document.getElementById('cheapPrice').value) || 0;

      config.plans.normal.price =
        Number(document.getElementById('normalPrice').value) || 0;

      config.plans.pro.price =
        Number(document.getElementById('proPrice').value) || 0;

      saveConfig(config);

      toast('✅ Precios guardados');
    });
}

function saveAdvertisingConfig() {
  const config = getConfig();

  config.advertising.enabled =
    document.getElementById('advertisingEnabled').checked;

  Object.keys(config.paymentMethods).forEach(key => {
    const method = config.paymentMethods[key];

    const toggle =
      document.getElementById(`method_${key}`);

    const account =
      document.getElementById(`account_${key}`);

    if (toggle) method.enabled = toggle.checked;
    if (account) method.account = account.value.trim();
  });

  saveConfig(config);

  toast('✅ Configuración guardada');

  setTimeout(() => {
    adminAdvertising();
  }, 400);
}

function renderAdminAds() {
  if (!ads.length) {
    return `
      <div class="empty-state">
        📣<br><br>
        No hay publicidades recibidas.
      </div>
    `;
  }

  return ads.map(ad => `
    <div class="card" style="margin-top:10px">

      <strong>
        ${escapeHtml(ad.title)}
      </strong>

      <p class="muted">
        👤 ${escapeHtml(ad.user)}
      </p>

      <p>
        💎 Plan:
        ${escapeHtml(ad.plan)}
      </p>

      <p>
        💳 Método:
        ${escapeHtml(ad.paymentMethod || 'No especificado')}
      </p>

      ${
        ad.mediaType === 'video'
          ? `
            <video
              src="${ad.media}"
              controls
              class="ad-live-media">
            </video>
          `
          : `
            <img
              src="${ad.media}"
              class="ad-live-media"
              alt="${escapeHtml(ad.title)}">
          `
      }

      ${
        ad.paymentProof
          ? `
            <p style="margin-top:10px">
              🧾 Comprobante:
            </p>

            <img
              src="${ad.paymentProof}"
              class="proof-image"
              alt="Comprobante">
          `
          : `
            <div class="notice">
              No hay comprobante guardado.
            </div>
          `
      }

      <div class="ad-status ${
        ad.status === 'aprobado'
          ? 'approved'
          : ad.status === 'rechazado'
            ? 'rejected'
            : 'pending'
      }">

        ${
          ad.status === 'aprobado'
            ? '✅ Aprobada'
            : ad.status === 'rechazado'
              ? '❌ Rechazada'
              : '⏳ Pendiente'
        }

      </div>

      ${
        ad.status === 'pendiente'
          ? `
            <button
              class="primary"
              style="margin-top:10px"
              onclick="approveAd(${ad.id})">
              ✅ Aprobar publicidad
            </button>

            <button
              class="danger"
              style="margin-top:8px"
              onclick="rejectAd(${ad.id})">
              ❌ Rechazar
            </button>
          `
          : ''
      }

    </div>
  `).join('');
}

function approveAd(id) {
  const ad = ads.find(item => item.id === id);

  if (!ad) return;

  ad.status = 'aprobado';
  ad.approvedAt = new Date().toISOString();

  saveAds();

  renderFlashDay();

  adminAdvertising();

  toast('✅ Publicidad aprobada y publicada');
}

function rejectAd(id) {
  const ad = ads.find(item => item.id === id);

  if (!ad) return;

  ad.status = 'rechazado';
  ad.rejectedAt = new Date().toISOString();

  saveAds();

  adminAdvertising();

  toast('❌ Publicidad rechazada');
}


/* =========================================================
   ADMIN — PAGOS
   ========================================================= */

function adminPayments() {
  const config = getConfig();

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminPanel()">←</button>
      <h2>💳 Pagos</h2>
      <button class="close-btn" onclick="adminPanel()">×</button>
    </div>

    <div class="notice">
      Aquí puedes revisar la información de los métodos de pago
      configurados para la publicidad.
    </div>

    ${Object.values(config.paymentMethods).map(method => `
      <div class="card" style="margin-top:10px">

        <strong>
          ${escapeHtml(method.name)}
        </strong>

        <p class="muted">
          ${escapeHtml(method.account || 'No configurado')}
        </p>

        <span class="ad-status ${
          method.enabled
            ? 'approved'
            : 'rejected'
        }">

          ${method.enabled ? '✅ Activo' : '⛔ Desactivado'}

        </span>

      </div>
    `).join('')}

    <button
      class="primary"
      style="margin-top:14px"
      onclick="adminAdvertising()">
      ⚙️ Configurar pagos
    </button>
  `);
}


/* =========================================================
   ADMIN — USUARIOS
   ========================================================= */

function adminUsers() {
  const stats = getStats();

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminPanel()">←</button>
      <h2>👥 Usuarios</h2>
      <button class="close-btn" onclick="adminPanel()">×</button>
    </div>

    <div class="stats-grid">

      <div class="stat-card">
        <strong>${stats.registeredTotal || 0}</strong>
        <span>Registrados</span>
      </div>

      <div class="stat-card">
        <strong>${stats.deletedTotal || 0}</strong>
        <span>Eliminados</span>
      </div>

    </div>

    ${
      user
        ? `
          <div class="card" style="margin-top:14px">

            <strong>Usuario actual</strong>

            <p>
              👤 ${escapeHtml(user.name)}
            </p>

            <p>
              📱 ${escapeHtml(user.whatsapp)}
            </p>

            <p>
              🪪 ${escapeHtml(user.cedula)}
            </p>

          </div>
        `
        : `
          <div class="notice">
            No hay un usuario conectado en este navegador.
          </div>
        `
    }
  `);
}


/* =========================================================
   ADMIN — RECLAMOS
   ========================================================= */

function adminClaims() {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminPanel()">←</button>
      <h2>🚨 Reclamos</h2>
      <button class="close-btn" onclick="adminPanel()">×</button>
    </div>

    ${
      claims.length
        ? claims.map(claim => `
          <div class="card" style="margin-top:10px">

            <strong>
              🚨 Reclamo #${claim.id}
            </strong>

            <p>
              👤 Usuario:
              ${escapeHtml(claim.user)}
            </p>

            <p>
              👤 Contra:
              ${escapeHtml(claim.seller || '')}
            </p>

            <p>
              📝 ${escapeHtml(claim.reason)}
            </p>

            ${
              claim.evidence
                ? `
                  <img
                    src="${claim.evidence}"
                    class="proof-image"
                    alt="Evidencia">
                `
                : ''
            }

            <span class="ad-status ${
              claim.status === 'resuelto'
                ? 'approved'
                : 'pending'
            }">

              ${
                claim.status === 'resuelto'
                  ? '✅ Resuelto'
                  : '⏳ Pendiente'
              }

            </span>

            ${
              claim.status !== 'resuelto'
                ? `
                  <button
                    class="primary"
                    style="margin-top:10px"
                    onclick="resolveClaim(${claim.id})">
                    ✅ Marcar como resuelto
                  </button>

                  <button
                    class="danger"
                    style="margin-top:8px"
                    onclick="sanctionFromClaim(${claim.id})">
                    ⚖️ Aplicar sanción
                  </button>
                `
                : ''
            }

          </div>
        `).join('')
        : `
          <div class="empty-state">
            No hay reclamaciones.
          </div>
        `
    }
  `);
}

function resolveClaim(id) {
  const claim = claims.find(item => item.id === id);

  if (!claim) return;

  claim.status = 'resuelto';
  claim.resolvedAt = new Date().toISOString();

  saveClaims();

  adminClaims();

  toast('✅ Reclamo resuelto');
}

function sanctionFromClaim(id) {
  const claim = claims.find(item => item.id === id);

  if (!claim) return;

  openSanctionForm(claim.user, id);
}


/* =========================================================
   ADMIN — SANCIONES Y MULTAS
   ========================================================= */

function adminSanctions() {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminPanel()">←</button>
      <h2>⚖️ Sanciones</h2>
      <button class="close-btn" onclick="adminPanel()">×</button>
    </div>

    ${
      sanctions.length
        ? sanctions.map(sanction => `
          <div class="card" style="margin-top:10px">

            <strong>
              ⚖️ ${escapeHtml(sanction.user)}
            </strong>

            <p>
              Tipo:
              ${escapeHtml(sanction.type)}
            </p>

            <p>
              Motivo:
              ${escapeHtml(sanction.reason)}
            </p>

            ${
              sanction.amount
                ? `
                  <p>
                    💰 Multa:
                    ${money(sanction.amount)}
                  </p>
                `
                : ''
            }

            <span class="ad-status ${
              sanction.status === 'pagada'
                ? 'approved'
                : 'pending'
            }">

              ${
                sanction.status === 'pagada'
                  ? '✅ Pagada'
                  : '⏳ Pendiente'
              }

            </span>

          </div>
        `).join('')
        : `
          <div class="empty-state">
            No hay sanciones registradas.
          </div>
        `
    }

    <button
      class="primary"
      style="margin-top:14px"
      onclick="openSanctionForm('')">
      ➕ Crear sanción
    </button>
  `);
}

function openSanctionForm(targetUser, claimId) {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminSanctions()">←</button>
      <h2>⚖️ Nueva sanción</h2>
      <button class="close-btn" onclick="adminSanctions()">×</button>
    </div>

    <form id="sanctionForm" class="form">

      <div class="field">
        <label>👤 Usuario</label>
        <input
          id="sanctionUser"
          value="${escapeHtml(targetUser || '')}"
          required>
      </div>

      <div class="field">
        <label>Tipo de sanción</label>

        <select id="sanctionType">
          <option value="advertencia">Advertencia</option>
          <option value="bloqueo">Bloqueo temporal</option>
          <option value="eliminacion">Eliminar cuenta</option>
          <option value="multa">Multa</option>
        </select>

      </div>

      <div class="field">
        <label>💰 Monto de multa</label>
        <input
          id="sanctionAmount"
          type="number"
          min="0"
          value="0">
      </div>

      <div class="field">
        <label>📝 Motivo</label>

        <textarea
          id="sanctionReason"
          rows="5"
          required></textarea>

      </div>

      <button class="danger">
        ⚖️ Aplicar sanción
      </button>

    </form>
  `);

  document.getElementById('sanctionForm')
    .addEventListener('submit', function (event) {
      event.preventDefault();

      sanctions.unshift({
        id: Date.now(),
        user:
          document.getElementById('sanctionUser').value.trim(),
        type:
          document.getElementById('sanctionType').value,
        amount:
          Number(document.getElementById('sanctionAmount').value) || 0,
        reason:
          document.getElementById('sanctionReason').value.trim(),
        claimId: claimId || null,
        status: 'pendiente',
        createdAt: new Date().toISOString()
      });

      saveSanctions();

      if (claimId) {
        const claim = claims.find(item => item.id === claimId);

        if (claim) {
          claim.status = 'resuelto';
          saveClaims();
        }
      }

      adminSanctions();

      toast('⚖️ Sanción registrada');
    });
}


/* =========================================================
   ADMIN — CHAT
   ========================================================= */

function adminChat() {
  messages.forEach(message => {
    message.read = true;
  });

  saveMessages();

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminPanel()">←</button>
      <h2>💬 Chat administrativo</h2>
      <button class="close-btn" onclick="adminPanel()">×</button>
    </div>

    ${
      messages.length
        ? messages.map(message => `
          <div class="card" style="margin-top:10px">

            <strong>
              ${escapeHtml(message.from)}
              →
              ${escapeHtml(message.to)}
            </strong>

            <p>
              ${escapeHtml(message.text)}
            </p>

            <small class="muted">
              ${new Date(message.createdAt).toLocaleString('es-DO')}
            </small>

          </div>
        `).join('')
        : `
          <div class="empty-state">
            No hay mensajes.
          </div>
        `
    }
  `);

  updateBadges();
}


/* =========================================================
   ADMIN — CONFIGURACIÓN DEL PANEL
   ========================================================= */

function adminPanelSettings() {
  const config = getConfig();

  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminPanel()">←</button>
      <h2>⚙️ Configuración</h2>
      <button class="close-btn" onclick="adminPanel()">×</button>
    </div>

    <form id="panelSettingsForm" class="form">

      <label class="switch-row">
        <span>Panel compacto</span>

        <input
          id="panelCompact"
          type="checkbox"
          ${config.panel.compact ? 'checked' : ''}>
      </label>

      <label class="switch-row">
        <span>Notificaciones</span>

        <input
          id="panelNotifications"
          type="checkbox"
          ${config.panel.notifications ? 'checked' : ''}>
      </label>

      <label class="switch-row">
        <span>Animaciones</span>

        <input
          id="panelAnimations"
          type="checkbox"
          ${config.panel.animations ? 'checked' : ''}>
      </label>

      <label class="switch-row">
        <span>Modo oscuro</span>

        <input
          id="panelDarkMode"
          type="checkbox"
          ${config.panel.darkMode ? 'checked' : ''}>
      </label>

      <button class="primary">
        💾 Guardar configuración
      </button>

    </form>
  `);

  document.getElementById('panelSettingsForm')
    .addEventListener('submit', function (event) {
      event.preventDefault();

      config.panel.compact =
        document.getElementById('panelCompact').checked;

      config.panel.notifications =
        document.getElementById('panelNotifications').checked;

      config.panel.animations =
        document.getElementById('panelAnimations').checked;

      config.panel.darkMode =
        document.getElementById('panelDarkMode').checked;

      saveConfig(config);

      applyPanelSettings();

      adminPanel();

      toast('✅ Configuración del panel guardada');
    });
}

function applyPanelSettings() {
  const config = getConfig();

  document.body.classList.toggle(
    'admin-compact',
    !!config.panel.compact
  );

  document.body.classList.toggle(
    'dark-mode',
    !!config.panel.darkMode
  );

  document.body.classList.toggle(
    'no-animations',
    !config.panel.animations
  );
}


/* =========================================================
   CAMBIAR CONTRASEÑA DEL ADMINISTRADOR
   ========================================================= */

function changeAdminPassword() {
  showModal(`
    <div class="modal-header">
      <button class="back-btn" onclick="adminPanel()">←</button>
      <h2>🔐 Contraseña del administrador</h2>
      <button class="close-btn" onclick="adminPanel()">×</button>
    </div>

    <form id="adminPasswordForm" class="form">

      <div class="field">
        <label>Contraseña actual</label>
        <input id="currentAdminPassword" type="password" required>
      </div>

      <div class="field">
        <label>Nueva contraseña</label>
        <input id="newAdminPassword" type="password" minlength="6" required>
      </div>

      <button class="primary">
        💾 Cambiar contraseña
      </button>

    </form>
  `);

  document.getElementById('adminPasswordForm')
    .addEventListener('submit', function (event) {
      event.preventDefault();

      const config = getConfig();

      const current =
        document.getElementById('currentAdminPassword').value;

      const next =
        document.getElementById('newAdminPassword').value;

      if (current !== config.adminPassword) {
        toast('❌ Contraseña actual incorrecta');
        return;
      }

      config.adminPassword = next;

      saveConfig(config);

      adminPanel();

      toast('✅ Contraseña del administrador cambiada');
    });
}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function updateBadges() {
  const pendingAds =
    ads.filter(ad => ad.status === 'pendiente').length;

  const unreadMessages =
    messages.filter(message => !message.read).length;

  const notifyBadge =
    document.getElementById('notifyBadge');

  const chatBadge =
    document.getElementById('chatBadge');

  if (notifyBadge) {
    notifyBadge.textContent = pendingAds;

    notifyBadge.classList.toggle(
      'hidden',
      pendingAds === 0
    );
  }

  if (chatBadge) {
    chatBadge.textContent = unreadMessages;

    chatBadge.classList.toggle(
      'hidden',
      unreadMessages === 0
    );
  }
}

function notifications() {
  const pendingAds =
    ads.filter(ad => ad.status === 'pendiente').length;

  const unread =
    messages.filter(message => !message.read).length;

  showModal(`
    <div class="modal-header">
      <h2>🔔 Notificaciones</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    ${
      pendingAds
        ? `
          <div class="notice warning">
            📣 Tienes ${pendingAds}
            solicitud${pendingAds === 1 ? '' : 'es'}
            de publicidad pendiente${pendingAds === 1 ? '' : 's'}.
          </div>
        `
        : ''
    }

    ${
      unread
        ? `
          <div class="notice">
            💬 Tienes ${unread}
            mensaje${unread === 1 ? '' : 's'} nuevo${unread === 1 ? '' : 's'}.
          </div>
        `
        : ''
    }

    ${
      !pendingAds && !unread
        ? `
          <div class="empty-state">
            🎉 No tienes notificaciones nuevas.
          </div>
        `
        : ''
    }
  `);
}


/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function goHome() {
  closeModal();

  currentCategory = 'Todos';

  renderCategories();
  renderProducts();
  renderFlashDay();

  document.querySelectorAll('.nav-item')
    .forEach(button => {
      button.classList.remove('active');
    });

  document
    .querySelector('.nav-item[data-page="home"]')
    ?.classList.add('active');
}

function handleNavigation(page) {
  if (page === 'home') {
    goHome();
    return;
  }

  if (page === 'chat') {
    if (!user) {
      loginRequired('Inicia sesión para usar el chat.');
      return;
    }

    openChatHome();
    return;
  }

  if (page === 'activity') {
    openActivity();
    return;
  }

  if (page === 'profile') {
    openProfile();
    return;
  }
}

function openChatHome() {
  const chats = [];

  messages.forEach(message => {
    const other =
      message.from === user.name
        ? message.to
        : message.from;

    if (!chats.includes(other)) {
      chats.push(other);
    }
  });

  showModal(`
    <div class="modal-header">
      <h2>💬 Chat</h2>
      <button class="close-btn" onclick="closeModal()">×</button>
    </div>

    ${
      chats.length
        ? chats.map(name => `
          <button
            class="menu-button"
            onclick="openChat('${escapeHtml(name)}', 0)">
            💬 ${escapeHtml(name)}
          </button>
        `).join('')
        : `
          <div class="empty-state">
            💬 Todavía no tienes conversaciones.
          </div>
        `
    }
  `);
}


/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  const searchInput =
    document.getElementById('searchInput');

  if (searchInput) {
    searchInput.addEventListener(
      'input',
      renderProducts
    );
  }

  document.querySelectorAll('.nav-item')
    .forEach(button => {

      button.addEventListener('click', function () {

        const page =
          button.dataset.page;

        handleNavigation(page);

      });

    });

  const publishButton =
    document.getElementById('publishBtn');

  if (publishButton) {
    publishButton.addEventListener(
      'click',
      openPublish
    );
  }

  const flashButton =
    document.getElementById('flashDayBtn');

  if (flashButton) {
    flashButton.addEventListener(
      'click',
      openAdvertising
    );
  }

  const notificationButton =
    document.getElementById('notifyBtn');

  if (notificationButton) {
    notificationButton.addEventListener(
      'click',
      notifications
    );
  }

  const modal =
    document.getElementById('modal');

  if (modal) {
    modal.addEventListener(
      'click',
      function (event) {

        if (event.target === modal) {
          closeModal();
        }

      }
    );
  }

  renderCategories();
  renderProducts();
  renderFlashDay();
  applyPanelSettings();
  updateBadges();

});


/* =========================================================
   FUNCIONES GLOBALES
   ========================================================= */

window.openPublish = openPublish;
window.openAdvertising = openAdvertising;
window.openProduct = openProduct;
window.openProfile = openProfile;
window.openActivity = openActivity;
window.notifications = notifications;
window.openAdmin = openAdmin;

window.register = register;
window.login = login;
window.logout = logout;

window.settings = settings;
window.changePassword = changePassword;
window.securityPage = securityPage;
window.deleteAccount = deleteAccount;

window.editProfile = editProfile;
window.editProfilePhoto = editProfilePhoto;

window.setCategory = setCategory;

window.likeProduct = likeProduct;
window.contactWhatsApp = contactWhatsApp;
window.contactMessenger = contactMessenger;

window.startChat = startChat;
window.openChat = openChat;
window.markBought = markBought;

window.openClaim = openClaim;

window.approveAd = approveAd;
window.rejectAd = rejectAd;

window.adminPanel = adminPanel;
window.adminAdvertising = adminAdvertising;
window.adminPayments = adminPayments;
window.adminUsers = adminUsers;
window.adminClaims = adminClaims;
window.adminChat = adminChat;
window.adminSanctions = adminSanctions;
window.adminPanelSettings = adminPanelSettings;
window.changeAdminPassword = changeAdminPassword;

window.resolveClaim = resolveClaim;
window.sanctionFromClaim = sanctionFromClaim;
window.openSanctionForm = openSanctionForm;

window.saveAdvertisingConfig = saveAdvertisingConfig;

window.closeModal = closeModal;
window.goHome = goHome;


/* =========================================================
   ATAJO PARA ADMINISTRADOR
   ========================================================= */

document.addEventListener('keydown', function (event) {

  if (
    event.ctrlKey &&
    event.shiftKey &&
    event.key.toLowerCase() === 'a'
  ) {
    openAdmin();
  }

});


/* =========================================================
   FIN DE SCRIPT
   ========================================================= */
