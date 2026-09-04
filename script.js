/* =========================================================
   MARKET FLASH — JAVASCRIPT
   PARTE 1 DE 3
   ========================================================= */

const SUPABASE_URL = "TU_SUPABASE_URL";
const SUPABASE_ANON_KEY = "TU_SUPABASE_ANON_KEY";

let mfSupabase = null;

if (
  typeof window.supabase !== "undefined" &&
  SUPABASE_URL !== "TU_SUPABASE_URL" &&
  SUPABASE_ANON_KEY !== "TU_SUPABASE_ANON_KEY"
) {
  mfSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
}

/* =========================================================
   CONFIGURACIÓN LOCAL
   ========================================================= */

const STORAGE_USER = "mf_user";
const STORAGE_PRODUCTS = "mf_products";
const STORAGE_CONFIG = "mf_config";
const STORAGE_FLASH = "mf_flash";
const STORAGE_NOTIFICATIONS = "mf_notifications";

let currentUser = null;
let selectedPaymentMethod = null;
let selectedPlan = null;
let currentFlashDraft = null;

/* =========================================================
   CONFIGURACIÓN INICIAL
   ========================================================= */

const defaultConfig = {
  plans: {
    cheap: {
      name: "FLASH ECONÓMICO",
      price: 299,
      description: "Publicidad destacada básica"
    },
    normal: {
      name: "FLASH NORMAL",
      price: 599,
      description: "Mayor visibilidad para tu publicidad"
    },
    pro: {
      name: "FLASH PRO",
      price: 999,
      description: "Máxima exposición en Market Flash"
    }
  },
  payments: {
    bank: true,
    paypal: true,
    binance: true
  }
};

function getConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_CONFIG);

    if (!saved) {
      localStorage.setItem(
        STORAGE_CONFIG,
        JSON.stringify(defaultConfig)
      );

      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...JSON.parse(saved)
    };
  } catch (error) {
    console.error("Error leyendo configuración:", error);
    return defaultConfig;
  }
}

function saveConfig(config) {
  localStorage.setItem(
    STORAGE_CONFIG,
    JSON.stringify(config)
  );
}

/* =========================================================
   PRODUCTOS DE EJEMPLO
   ========================================================= */

const defaultProducts = [
  {
    id: "demo-1",
    name: "iPhone 15 Pro",
    description: "iPhone 15 Pro en excelente condición.",
    address: "Santo Domingo",
    price: 55000,
    category: "technology",
    emoji: "📱",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-2",
    name: "Samsung Galaxy S24",
    description: "Samsung Galaxy S24 listo para entregar.",
    address: "Santo Domingo Este",
    price: 42000,
    category: "technology",
    emoji: "📱",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-3",
    name: "Laptop",
    description: "Laptop para trabajo y estudios.",
    address: "Santo Domingo",
    price: 35000,
    category: "technology",
    emoji: "💻",
    created_at: new Date().toISOString()
  },
  {
    id: "demo-4",
    name: "PlayStation 5",
    description: "PS5 en excelente estado.",
    address: "Santo Domingo",
    price: 32000,
    category: "technology",
    emoji: "🎮",
    created_at: new Date().toISOString()
  }
];

function getProducts() {
  try {
    const saved = localStorage.getItem(STORAGE_PRODUCTS);

    if (!saved) {
      localStorage.setItem(
        STORAGE_PRODUCTS,
        JSON.stringify(defaultProducts)
      );

      return defaultProducts;
    }

    return JSON.parse(saved);
  } catch (error) {
    return defaultProducts;
  }
}

function saveProducts(products) {
  localStorage.setItem(
    STORAGE_PRODUCTS,
    JSON.stringify(products)
  );
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function getNotifications() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_NOTIFICATIONS) || "[]"
    );
  } catch {
    return [];
  }
}

function saveNotifications(notifications) {
  localStorage.setItem(
    STORAGE_NOTIFICATIONS,
    JSON.stringify(notifications)
  );
}

function addNotification(title, message, type = "info") {
  const notifications = getNotifications();

  notifications.unshift({
    id: Date.now(),
    title,
    message,
    type,
    read: false,
    created_at: new Date().toISOString()
  });

  saveNotifications(notifications);
  updateNotificationBadge();
}

function updateNotificationBadge() {
  const badge = document.getElementById(
    "notificationBadge"
  );

  if (!badge) return;

  const unread = getNotifications().filter(
    notification => !notification.read
  ).length;

  badge.textContent = unread > 99 ? "99+" : unread;
  badge.style.display = unread ? "flex" : "none";
}

/* =========================================================
   UTILIDADES
   ========================================================= */

function formatMoney(value) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function showToast(message) {
  const toast = document.getElementById("toast");

  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(window.mfToastTimer);

  window.mfToastTimer = setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach(screen => {
    screen.classList.remove("active");
    screen.classList.add("hidden");
  });

  const screen = document.getElementById(screenId);

  if (screen) {
    screen.classList.remove("hidden");
    screen.classList.add("active");
  }
}

function openModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.remove("hidden");
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.add("hidden");
  }
}

/* =========================================================
   NAVEGACIÓN PRINCIPAL
   ========================================================= */

function openPage(pageId) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active-page");
    page.classList.add("hidden");
  });

  const page = document.getElementById(pageId);

  if (page) {
    page.classList.remove("hidden");
    page.classList.add("active-page");
  }

  document.querySelectorAll(".nav-item").forEach(item => {
    item.classList.toggle(
      "active",
      item.dataset.page === pageId
    );
  });

  if (pageId === "homePage") {
    renderProducts();
  }

  if (pageId === "flashPage") {
    renderFlashList();
  }

  if (pageId === "profilePage") {
    updateProfileUI();
  }
}

/* =========================================================
   ACTUALIZAR PERFIL
   ========================================================= */

function updateProfileUI() {
  if (!currentUser) return;

  const profileName =
    document.getElementById("profileName");

  const profileEmail =
    document.getElementById("profileEmail");

  if (profileName) {
    profileName.textContent =
      `${currentUser.name || ""} ${
        currentUser.lastName || ""
      }`.trim() ||
      currentUser.nickname ||
      "Usuario Market Flash";
  }

  if (profileEmail) {
    profileEmail.textContent =
      currentUser.email || "Sin correo";
  }
}

/* =========================================================
   GUARDAR USUARIO LOCAL
   ========================================================= */

function saveCurrentUser(user) {
  currentUser = user;

  localStorage.setItem(
    STORAGE_USER,
    JSON.stringify(user)
  );
}

function loadCurrentUser() {
  try {
    const saved =
      localStorage.getItem(STORAGE_USER);

    if (!saved) {
      currentUser = null;
      return null;
    }

    currentUser = JSON.parse(saved);
    return currentUser;
  } catch {
    currentUser = null;
    return null;
  }
}

/* =========================================================
   REGISTRO
   ========================================================= */

async function registerUser(event) {
  event.preventDefault();

  const name =
    document.getElementById("registerName").value.trim();

  const lastName =
    document.getElementById("registerLastName").value.trim();

  const nickname =
    document.getElementById("registerNickname").value.trim();

  const cedula =
    document.getElementById("registerCedula").value.trim();

  const email =
    document.getElementById("registerEmail").value.trim();

  const phone =
    document.getElementById("registerPhone").value.trim();

  const password =
    document.getElementById("registerPassword").value;

  const passwordConfirm =
    document.getElementById(
      "registerPasswordConfirm"
    ).value;

  const address =
    document.getElementById(
      "registerAddress"
    ).value.trim();

  const age =
    Number(
      document.getElementById("registerAge").value
    );

  const message =
    document.getElementById("registerMessage");

  if (password !== passwordConfirm) {
    message.textContent =
      "Las contraseñas no coinciden.";
    return;
  }

  if (password.length < 6) {
    message.textContent =
      "La contraseña debe tener al menos 6 caracteres.";
    return;
  }

  if (!age || age < 13) {
    message.textContent =
      "La edad introducida no es válida.";
    return;
  }

  message.textContent = "Creando tu cuenta...";

  /* -------------------------------------------------------
     REGISTRO REAL CON SUPABASE
     ------------------------------------------------------- */

  if (mfSupabase) {
    try {
      const {
        data,
        error
      } = await mfSupabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            last_name: lastName,
            nickname,
            cedula,
            phone,
            address,
            age
          }
        }
      });

      if (error) {
        message.textContent =
          error.message;
        return;
      }

      const user = {
        id: data.user?.id || Date.now(),
        name,
        lastName,
        nickname,
        cedula,
        email,
        phone,
        address,
        age
      };

      saveCurrentUser(user);

      await saveProfileToSupabase(user);

      message.textContent =
        "Cuenta creada correctamente.";

      setTimeout(() => {
        showScreen("mainScreen");
        openPage("homePage");
        renderProducts();
      }, 700);

      return;

    } catch (error) {
      console.error(error);

      message.textContent =
        "No se pudo completar el registro.";
      return;
    }
  }

  /* -------------------------------------------------------
     MODO DEMOSTRACIÓN LOCAL
     ------------------------------------------------------- */

  const user = {
    id: `local-${Date.now()}`,
    name,
    lastName,
    nickname,
    cedula,
    email,
    phone,
    address,
    age
  };

  saveCurrentUser(user);

  message.textContent =
    "Cuenta creada correctamente.";

  addNotification(
    "Bienvenido a Market Flash",
    "Tu cuenta fue creada correctamente."
  );

  setTimeout(() => {
    showScreen("mainScreen");
    openPage("homePage");
    renderProducts();
  }, 700);
}

/* =========================================================
   GUARDAR PERFIL EN SUPABASE
   ========================================================= */

async function saveProfileToSupabase(user) {
  if (!mfSupabase || !user?.id) return;

  try {
    const {
      error
    } = await mfSupabase
      .from("profiles")
      .upsert({
        id: user.id,
        name: user.name,
        last_name: user.lastName,
        nickname: user.nickname,
        cedula: user.cedula,
        email: user.email,
        phone: user.phone,
        address: user.address,
        age: user.age
      });

    if (error) {
      console.warn(
        "No se pudo guardar profiles:",
        error.message
      );
    }
  } catch (error) {
    console.warn(error);
  }
}

/* =========================================================
   INICIO DE SESIÓN
   ========================================================= */

async function loginUser(event) {
  event.preventDefault();

  const identifier =
    document.getElementById(
      "loginIdentifier"
    ).value.trim();

  const password =
    document.getElementById(
      "loginPassword"
    ).value;

  const message =
    document.getElementById(
      "loginMessage"
    );

  if (!identifier || !password) {
    message.textContent =
      "Completa todos los campos.";
    return;
  }

  message.textContent =
    "Iniciando sesión...";

  /* -------------------------------------------------------
     LOGIN SUPABASE POR CORREO
     ------------------------------------------------------- */

  if (mfSupabase && identifier.includes("@")) {
    try {
      const {
        data,
        error
      } = await mfSupabase.auth.signInWithPassword({
        email: identifier,
        password
      });

      if (error) {
        message.textContent =
          error.message;
        return;
      }

      const authUser = data.user;

      let profile = null;

      try {
        const {
          data: profileData
        } = await mfSupabase
          .from("profiles")
          .select("*")
          .eq("id", authUser.id)
          .maybeSingle();

        profile = profileData;
      } catch {}

      saveCurrentUser({
        id: authUser.id,
        name:
          profile?.name ||
          authUser.user_metadata?.name ||
          "",
        lastName:
          profile?.last_name ||
          authUser.user_metadata?.last_name ||
          "",
        nickname:
          profile?.nickname ||
          authUser.user_metadata?.nickname ||
          "",
        cedula:
          profile?.cedula ||
          authUser.user_metadata?.cedula ||
          "",
        email:
          authUser.email ||
          identifier,
        phone:
          profile?.phone ||
          authUser.user_metadata?.phone ||
          "",
        address:
          profile?.address ||
          authUser.user_metadata?.address ||
          "",
        age:
          profile?.age ||
          authUser.user_metadata?.age ||
          ""
      });

      showScreen("mainScreen");
      openPage("homePage");
      renderProducts();

      return;

    } catch (error) {
      console.error(error);

      message.textContent =
        "Error al iniciar sesión.";
      return;
    }
  }

  /* -------------------------------------------------------
     LOGIN LOCAL / CÉDULA
     ------------------------------------------------------- */

  const savedUser = loadCurrentUser();

  if (
    savedUser &&
    (
      savedUser.cedula === identifier ||
      savedUser.email === identifier
    )
  ) {
    saveCurrentUser(savedUser);

    showScreen("mainScreen");
    openPage("homePage");
    renderProducts();

    return;
  }

  message.textContent =
    "Usuario o contraseña incorrectos.";
}

/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

async function logoutUser() {
  if (mfSupabase) {
    try {
      await mfSupabase.auth.signOut();
    } catch (error) {
      console.warn(error);
    }
  }

  currentUser = null;
  localStorage.removeItem(STORAGE_USER);

  showScreen("welcomeScreen");

  document
    .getElementById("loginForm")
    ?.reset();

  showToast("Sesión cerrada.");
}

/* =========================================================
   RECUPERAR CONTRASEÑA
   ========================================================= */

async function recoverPassword() {
  const identifier =
    document.getElementById(
      "loginIdentifier"
    ).value.trim();

  const message =
    document.getElementById(
      "loginMessage"
    );

  if (!identifier || !identifier.includes("@")) {
    message.textContent =
      "Escribe primero tu correo.";
    return;
  }

  if (!mfSupabase) {
    message.textContent =
      "La recuperación estará disponible al conectar Supabase.";
    return;
  }

  try {
    const {
      error
    } = await mfSupabase.auth.resetPasswordForEmail(
      identifier
    );

    if (error) {
      message.textContent =
        error.message;
      return;
    }

    message.textContent =
      "Te enviamos un enlace para recuperar tu contraseña.";

  } catch (error) {
    message.textContent =
      "No se pudo enviar el enlace.";
  }
}

/* =========================================================
   RENDERIZAR PRODUCTOS
   ========================================================= */

function renderProducts() {
  const grid =
    document.getElementById(
      "productGrid"
    );

  if (!grid) return;

  const search =
    document.getElementById(
      "searchInput"
    )?.value
      .trim()
      .toLowerCase() || "";

  const activeCategory =
    document.querySelector(
      ".category-chip.active"
    )?.dataset.category || "all";

  let products = getProducts();

  if (search) {
    products = products.filter(product =>
      `${product.name} ${
        product.description || ""
      } ${product.address || ""}`
        .toLowerCase()
        .includes(search)
    );
  }

  if (activeCategory !== "all") {
    products = products.filter(
      product =>
        product.category === activeCategory
    );
  }

  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;padding:45px 10px">
        <div class="empty-icon">🔎</div>
        <h3>No encontramos publicaciones</h3>
        <p>Prueba con otra búsqueda o categoría.</p>
      </div>
    `;

    return;
  }

  grid.innerHTML = products
    .map(product => {
      const image =
        product.image ||
        product.images?.[0] ||
        "";

      return `
        <article class="product-card" data-id="${product.id}">
          <div class="product-image">
            ${
              image
                ? `<img src="${image}" alt="${escapeHTML(
                    product.name
                  )}">`
                : `<span>${
                    product.emoji || "⚡"
                  }</span>`
            }
          </div>

          <div class="product-info">
            <h3>${escapeHTML(
              product.name
            )}</h3>

            <p>${escapeHTML(
              product.description || ""
            )}</p>

            <div class="product-price">
              ${
                product.price
                  ? formatMoney(product.price)
                  : "Consultar precio"
              }
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

/* =========================================================
   SEGURIDAD BÁSICA PARA TEXTO HTML
   ========================================================= */

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================================================
   PUBLICACIÓN NORMAL
   ========================================================= */

async function publishProduct(event) {
  event.preventDefault();

  if (!currentUser) {
    showToast(
      "Debes iniciar sesión para publicar."
    );
    return;
  }

  const name =
    document.getElementById(
      "productName"
    ).value.trim();

  const description =
    document.getElementById(
      "productDescription"
    ).value.trim();

  const address =
    document.getElementById(
      "productAddress"
    ).value.trim();

  const imageInput =
    document.getElementById(
      "productImages"
    );

  const cameraInput =
    document.getElementById(
      "productCamera"
    );

  const files = [
    ...(imageInput?.files || []),
    ...(cameraInput?.files || [])
  ];

  if (!name || !description || !address) {
    showToast(
      "Completa los datos de la publicación."
    );
    return;
  }

  const images =
    await filesToDataURLs(files);

  const product = {
    id: `product-${Date.now()}`,
    user_id: currentUser.id,
    name,
    description,
    address,
    images,
    image: images[0] || "",
    category: "other",
    created_at:
      new Date().toISOString()
  };

  const products = getProducts();

  products.unshift(product);

  saveProducts(products);

  /* Guardado en Supabase */
  if (mfSupabase) {
    try {
      await mfSupabase
        .from("product")
        .insert({
          name,
          description,
          image:
            images[0] || "",
          quantity: 1
        });
    } catch (error) {
      console.warn(
        "No se pudo guardar producto en Supabase:",
        error
      );
    }
  }

  addNotification(
    "Publicación creada",
    `${name} fue publicada correctamente.`
  );

  document
    .getElementById("publishForm")
    ?.reset();

  closeModal("publishModal");

  renderProducts();

  showToast(
    "⚡ ¡Tu anuncio fue publicado!"
  );
}

/* =========================================================
   CONVERTIR ARCHIVOS A DATA URL
   ========================================================= */

function filesToDataURLs(files) {
  return Promise.all(
    files.map(
      file =>
        new Promise(resolve => {
          const reader =
            new FileReader();

          reader.onload = () =>
            resolve(reader.result);

          reader.onerror = () =>
            resolve("");

          reader.readAsDataURL(file);
        })
    )
  );
}

/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

function initializeMarketFlash() {
  loadCurrentUser();

  getProducts();
  getConfig();

  updateNotificationBadge();

  if (currentUser) {
    showScreen("mainScreen");
    openPage("homePage");
    updateProfileUI();
    renderProducts();
  } else {
    showScreen("welcomeScreen");
  }
}

/* =========================================================
   EVENTOS
   ========================================================= */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    /* Bienvenida */

    document
      .getElementById("loginButton")
      ?.addEventListener(
        "click",
        () => showScreen("loginScreen")
      );

    document
      .getElementById("registerButton")
      ?.addEventListener(
        "click",
        () => showScreen("registerScreen")
      );

    /* Formularios */

    document
      .getElementById("loginForm")
      ?.addEventListener(
        "submit",
        loginUser
      );

    document
      .getElementById("registerForm")
      ?.addEventListener(
        "submit",
        registerUser
      );

    document
      .getElementById("forgotPasswordButton")
      ?.addEventListener(
        "click",
        recoverPassword
      );

    document
      .getElementById("publishForm")
      ?.addEventListener(
        "submit",
        publishProduct
      );

    /* Volver */

    document
      .querySelectorAll(
        ".back-button"
      )
      .forEach(button => {
        button.addEventListener(
          "click",
          () => {
            showScreen(
              button.dataset.back ||
                "welcomeScreen"
            );
          }
        );
      });

    /* Navegación inferior */

    document
      .querySelectorAll(".nav-item")
      .forEach(item => {
        item.addEventListener(
          "click",
          () => {
            openPage(
              item.dataset.page
            );
          }
        );
      });

    /* Botón publicar */

    document
      .getElementById("publishButton")
      ?.addEventListener(
        "click",
        () => openModal("publishModal")
      );

    /* Configuración */

    document
      .getElementById("settingsButton")
      ?.addEventListener(
        "click",
        () => openModal("settingsModal")
      );

    /* Flash del día */

    document
      .getElementById("dailyFlashButton")
      ?.addEventListener(
        "click",
        () => openModal("dailyFlashModal")
      );

    /* Notificaciones */

    document
      .getElementById("notificationsButton")
      ?.addEventListener(
        "click",
        () => {
          const notifications =
            getNotifications();

          notifications.forEach(
            notification =>
              notification.read = true
          );

          saveNotifications(
            notifications
          );

          updateNotificationBadge();

          showToast(
            notifications.length
              ? "No tienes notificaciones nuevas."
              : "No tienes notificaciones."
          );
        }
      );

    /* Cerrar sesión */

    document
      .getElementById("logoutButton")
      ?.addEventListener(
        "click",
        logoutUser
      );

    /* Buscar */

    document
      .getElementById("searchInput")
      ?.addEventListener(
        "input",
        renderProducts
      );

    /* Categorías */

    document
      .querySelectorAll(
        ".category-chip"
      )
      .forEach(chip => {
        chip.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".category-chip"
              )
              .forEach(item =>
                item.classList.remove(
                  "active"
                )
              );

            chip.classList.add("active");

            renderProducts();
          }
        );
      });

    /* Cerrar modales */

    document
      .querySelectorAll(
        ".close-modal,.modal-backdrop"
      )
      .forEach(element => {
        element.addEventListener(
          "click",
          event => {

            const modal =
              event.target.closest(
                ".modal"
              );

            if (modal) {
              modal.classList.add(
                "hidden"
              );
            }
          }
        );
      });

    /* WhatsApp Flash */

    document
      .getElementById(
        "flashWhatsappEnabled"
      )
      ?.addEventListener(
        "change",
        event => {

          const field =
            document.getElementById(
              "flashWhatsappField"
            );

          if (event.target.checked) {
            field?.classList.remove(
              "hidden-field"
            );
          } else {
            field?.classList.add(
              "hidden-field"
            );
          }
        }
      );

    /* Inicializar */

    initializeMarketFlash();
  }
);
