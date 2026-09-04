/* =========================================================
   MARKET FLASH ⚡
   script.js
   Versión local funcional - preparada para Supabase
   ========================================================= */

"use strict";

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const STORAGE_USER = "mf_user";
const STORAGE_USERS = "mf_users";
const STORAGE_PRODUCTS = "mf_products";
const STORAGE_CONFIG = "mf_config";
const STORAGE_NOTIFICATIONS = "mf_notifications";
const STORAGE_CHATS = "mf_chats";
const STORAGE_FLASH = "mf_flash_requests";

let currentUser = null;
let selectedImages = [];
let selectedVideo = null;
let currentCategory = "Todos";
let currentFilters = {
    category: "Todos",
    minPrice: "",
    maxPrice: "",
    order: "recent"
};

let currentChatUserId = null;

/* =========================================================
   UTILIDADES
   ========================================================= */

function $(id) {
    return document.getElementById(id);
}

function $all(selector) {
    return [...document.querySelectorAll(selector)];
}

function getStorage(key, fallback) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : fallback;
    } catch (error) {
        console.error("Error leyendo localStorage:", error);
        return fallback;
    }
}

function setStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error("Error guardando localStorage:", error);
        showToast("No hay suficiente espacio en el dispositivo.", "error");
        return false;
    }
}

function uid(prefix = "mf") {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeText(value) {
    return String(value || "")
        .trim()
        .toLowerCase();
}

function normalizeCedula(value) {
    return String(value || "")
        .replace(/\D/g, "");
}

function normalizePhone(value) {
    return String(value || "")
        .replace(/\D/g, "");
}

function formatMoney(value) {
    const number = Number(value) || 0;

    return new Intl.NumberFormat("es-DO", {
        style: "currency",
        currency: "DOP",
        maximumFractionDigits: 0
    }).format(number);
}

function formatDate(date) {
    return new Intl.DateTimeFormat("es-DO", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(new Date(date));
}

function escapeHTML(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function getUserFullName(user) {
    if (!user) return "Usuario";
    return `${user.firstName || ""} ${user.lastName || ""}`.trim() ||
        user.nickname ||
        "Usuario";
}

function getUserInitials(user) {
    if (!user) return "MF";

    const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    if (!name) {
        return (user.nickname || "MF").slice(0, 2).toUpperCase();
    }

    return name
        .split(/\s+/)
        .slice(0, 2)
        .map(part => part[0])
        .join("")
        .toUpperCase();
}

function placeholderImage(text = "MARKET FLASH") {
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="800" height="600">
            <rect width="100%" height="100%" fill="#087cff"/>
            <text x="50%" y="47%" text-anchor="middle"
                font-family="Arial"
                font-size="46"
                font-weight="bold"
                fill="white">⚡</text>
            <text x="50%" y="60%" text-anchor="middle"
                font-family="Arial"
                font-size="26"
                font-weight="bold"
                fill="white">${text}</text>
        </svg>
    `)}`;
}

/* =========================================================
   TOAST
   ========================================================= */

function showToast(message, type = "success") {
    const container = $("toastContainer");

    if (!container) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;

    toast.innerHTML = `
        <span>${type === "success" ? "✓" : type === "error" ? "!" : "⚡"}</span>
        <span>${escapeHTML(message)}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("toast-hide");

        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

/* =========================================================
   MODALES
   ========================================================= */

function openModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.add("active");
    modal.setAttribute("aria-hidden", "false");
}

function closeModal(id) {
    const modal = $(id);

    if (!modal) return;

    modal.classList.remove("active");
    modal.setAttribute("aria-hidden", "true");
}

function closeAllModals() {
    $all(".modal").forEach(modal => {
        modal.classList.remove("active");
        modal.setAttribute("aria-hidden", "true");
    });
}

/* =========================================================
   NAVEGACIÓN
   ========================================================= */

function showScreen(screenId) {
    $all(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const target = $(screenId);

    if (target) {
        target.classList.add("active");
    }
}

function showPage(pageId) {
    $all(".page").forEach(page => {
        page.classList.remove("active");
    });

    const page = $(pageId);

    if (page) {
        page.classList.add("active");
    }

    $all(".bottom-nav button[data-page]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.page === pageId
        );
    });

    if (pageId === "homePage") {
        renderHome();
    }

    if (pageId === "searchPage") {
        renderSearchResults();
    }

    if (pageId === "notificationsPage") {
        renderNotifications();
    }

    if (pageId === "chatPage") {
        renderChats();
    }

    if (pageId === "friendsPage") {
        renderFriends();
    }

    if (pageId === "profilePage") {
        renderProfile();
    }
}

function enterApplication() {
    currentUser = getStorage(STORAGE_USER, null);

    if (!currentUser) {
        showScreen("welcomeScreen");
        return;
    }

    if (currentUser.blocked) {
        localStorage.removeItem(STORAGE_USER);
        currentUser = null;
        showToast("Esta cuenta está bloqueada.", "error");
        showScreen("welcomeScreen");
        return;
    }

    showScreen("mainApp");

    updateHeader();

    renderHome();

    updateNotificationBadge();

    ensureAdminUI();
}

/* =========================================================
   DATOS INICIALES
   ========================================================= */

function initializeStorage() {
    let users = getStorage(STORAGE_USERS, []);

    if (!Array.isArray(users)) {
        users = [];
    }

    setStorage(STORAGE_USERS, users);

    let products = getStorage(STORAGE_PRODUCTS, []);

    if (!Array.isArray(products) || products.length === 0) {
        products = [
            {
                id: uid("product"),
                ownerId: "demo",
                name: "iPhone 15 Pro",
                category: "Electrónica",
                price: 75000,
                description: "iPhone 15 Pro en excelentes condiciones.",
                address: "Santo Domingo",
                phone: "8090000000",
                whatsapp: true,
                privateChat: true,
                images: [placeholderImage("iPhone 15 Pro")],
                video: null,
                views: 12,
                likes: 3,
                likedBy: [],
                createdAt: new Date().toISOString(),
                status: "approved"
            },
            {
                id: uid("product"),
                ownerId: "demo",
                name: "Samsung Galaxy S24",
                category: "Electrónica",
                price: 55000,
                description: "Samsung Galaxy S24, totalmente funcional.",
                address: "Santo Domingo Este",
                phone: "8090000001",
                whatsapp: true,
                privateChat: true,
                images: [placeholderImage("Galaxy S24")],
                video: null,
                views: 8,
                likes: 2,
                likedBy: [],
                createdAt: new Date(Date.now() - 3600000).toISOString(),
                status: "approved"
            },
            {
                id: uid("product"),
                ownerId: "demo",
                name: "Laptop",
                category: "Electrónica",
                price: 38000,
                description: "Laptop ideal para trabajo y estudios.",
                address: "Distrito Nacional",
                phone: "8090000002",
                whatsapp: false,
                privateChat: true,
                images: [placeholderImage("LAPTOP")],
                video: null,
                views: 20,
                likes: 5,
                likedBy: [],
                createdAt: new Date(Date.now() - 7200000).toISOString(),
                status: "approved"
            },
            {
                id: uid("product"),
                ownerId: "demo",
                name: "PlayStation 5",
                category: "Electrónica",
                price: 42000,
                description: "PS5 en buen estado.",
                address: "Santo Domingo",
                phone: "8090000003",
                whatsapp: true,
                privateChat: true,
                images: [placeholderImage("PLAYSTATION 5")],
                video: null,
                views: 15,
                likes: 4,
                likedBy: [],
                createdAt: new Date(Date.now() - 10800000).toISOString(),
                status: "approved"
            }
        ];

        setStorage(STORAGE_PRODUCTS, products);
    }

    let config = getStorage(STORAGE_CONFIG, null);

    if (!config) {
        config = {
            flashEnabled: true,
            plans: [
                {
                    id: "cheap",
                    name: "Económico",
                    price: 500,
                    durationHours: 12,
                    rotationSeconds: 5
                },
                {
                    id: "normal",
                    name: "Normal",
                    price: 1000,
                    durationHours: 24,
                    rotationSeconds: 7
                },
                {
                    id: "pro",
                    name: "PRO",
                    price: 2000,
                    durationHours: 72,
                    rotationSeconds: 10
                }
            ],
            paymentMethods: [
                "Transferencia bancaria",
                "PayPal",
                "Binance"
            ]
        };

        setStorage(STORAGE_CONFIG, config);
    }

    if (!Array.isArray(getStorage(STORAGE_NOTIFICATIONS, null))) {
        setStorage(STORAGE_NOTIFICATIONS, []);
    }

    if (!Array.isArray(getStorage(STORAGE_CHATS, null))) {
        setStorage(STORAGE_CHATS, []);
    }

    if (!Array.isArray(getStorage(STORAGE_FLASH, null))) {
        setStorage(STORAGE_FLASH, []);
    }
}

/* =========================================================
   HEADER
   ========================================================= */

function updateHeader() {
    if (!currentUser) return;

    const welcomeName = $("welcomeUserName");

    if (welcomeName) {
        welcomeName.textContent =
            currentUser.nickname ||
            currentUser.firstName ||
            "Usuario";
    }

    const profileName = $("profileName");

    if (profileName) {
        profileName.textContent = getUserFullName(currentUser);
    }

    const profileNickname = $("profileNickname");

    if (profileNickname) {
        profileNickname.textContent =
            currentUser.nickname
                ? `@${currentUser.nickname}`
                : "";
    }

    const avatar = $("profileAvatar");

    if (avatar) {
        if (currentUser.photo) {
            avatar.innerHTML = `<img src="${currentUser.photo}" alt="Perfil">`;
        } else {
            avatar.textContent = getUserInitials(currentUser);
        }
    }
}

/* =========================================================
   REGISTRO
   ========================================================= */

function registerUser(event) {
    event.preventDefault();

    const firstName = $("registerFirstName")?.value.trim();
    const lastName = $("registerLastName")?.value.trim();
    const nickname = $("registerNickname")?.value.trim();
    const address = $("registerAddress")?.value.trim();
    const email = normalizeText($("registerEmail")?.value);
    const cedula = normalizeCedula($("registerCedula")?.value);
    const password = $("registerPassword")?.value;
    const confirmPassword = $("registerConfirmPassword")?.value;
    const whatsapp = normalizePhone($("registerWhatsapp")?.value);
    const terms = $("registerTerms")?.checked;

    if (
        !firstName ||
        !lastName ||
        !nickname ||
        !address ||
        !email ||
        !cedula ||
        !password ||
        !confirmPassword ||
        !whatsapp
    ) {
        showToast("Completa todos los campos.", "error");
        return;
    }

    if (!terms) {
        showToast("Debes aceptar los términos.", "error");
        return;
    }

    if (password.length < 6) {
        showToast("La contraseña debe tener al menos 6 caracteres.", "error");
        return;
    }

    if (password !== confirmPassword) {
        showToast("Las contraseñas no coinciden.", "error");
        return;
    }

    const users = getStorage(STORAGE_USERS, []);

    const emailExists = users.some(
        user => normalizeText(user.email) === email
    );

    if (emailExists) {
        showToast("Ese correo ya está registrado.", "error");
        return;
    }

    const cedulaExists = users.some(
        user => normalizeCedula(user.cedula) === cedula
    );

    if (cedulaExists) {
        showToast("Esa cédula ya está registrada.", "error");
        return;
    }

    const newUser = {
        id: uid("user"),
        firstName,
        lastName,
        nickname,
        address,
        email,
        cedula,
        password,
        whatsapp,
        phone: whatsapp,
        photo: null,
        role: "user",
        blocked: false,
        warned: false,
        sanctioned: false,
        friends: [],
        friendRequests: [],
        sentFriendRequests: [],
        createdAt: new Date().toISOString()
    };

    users.push(newUser);

    if (!setStorage(STORAGE_USERS, users)) {
        return;
    }

    currentUser = newUser;

    setStorage(STORAGE_USER, currentUser);

    addNotification(
        currentUser.id,
        "¡Bienvenido a Market Flash ⚡!",
        "Tu cuenta fue creada correctamente."
    );

    $("registerForm")?.reset();

    enterApplication();

    showToast("Cuenta creada correctamente.");
}

/* =========================================================
   LOGIN
   ========================================================= */

function loginUser(event) {
    event.preventDefault();

    const identifier = normalizeText(
        $("loginIdentifier")?.value
    );

    const password = $("loginPassword")?.value;

    if (!identifier || !password) {
        showToast("Escribe tus datos de acceso.", "error");
        return;
    }

    const users = getStorage(STORAGE_USERS, []);

    const user = users.find(item =>
        normalizeText(item.email) === identifier ||
        normalizeCedula(item.cedula) === normalizeCedula(identifier)
    );

    if (!user) {
        showToast("Usuario no encontrado.", "error");
        return;
    }

    if (user.blocked) {
        showToast("Esta cuenta está bloqueada.", "error");
        return;
    }

    if (user.password !== password) {
        showToast("Contraseña incorrecta.", "error");
        return;
    }

    currentUser = user;

    setStorage(STORAGE_USER, currentUser);

    $("loginForm")?.reset();

    enterApplication();

    showToast("Bienvenido a Market Flash ⚡");
}

/* =========================================================
   RECUPERAR CONTRASEÑA
   ========================================================= */

function recoverPassword(event) {
    event.preventDefault();

    const email = normalizeText($("forgotEmail")?.value);

    if (!email) {
        showToast("Escribe tu correo.", "error");
        return;
    }

    const users = getStorage(STORAGE_USERS, []);

    const index = users.findIndex(
        user => normalizeText(user.email) === email
    );

    if (index === -1) {
        showToast("No encontramos ese correo.", "error");
        return;
    }

    const newPassword = window.prompt(
        "Escribe tu nueva contraseña (mínimo 6 caracteres):"
    );

    if (!newPassword || newPassword.length < 6) {
        showToast("Contraseña no válida.", "error");
        return;
    }

    users[index].password = newPassword;

    setStorage(STORAGE_USERS, users);

    closeModal("forgotPasswordModal");

    $("forgotPasswordForm")?.reset();

    showToast("Contraseña actualizada correctamente.");
}

/* =========================================================
   PUBLICACIONES
   ========================================================= */

async function handleImageFiles(files) {
    const fileArray = [...files];

    if (!fileArray.length) return;

    if (selectedImages.length + fileArray.length > 6) {
        showToast("Puedes publicar hasta 6 imágenes.", "error");
        return;
    }

    for (const file of fileArray) {
        if (!file.type.startsWith("image/")) {
            continue;
        }

        try {
            const dataUrl = await compressImage(file);

            selectedImages.push(dataUrl);
        } catch (error) {
            console.error(error);
            showToast("No se pudo cargar una imagen.", "error");
        }
    }

    renderImagePreview();
}

function compressImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = event => {
            const image = new Image();

            image.onload = () => {
                const maxWidth = 1200;
                const maxHeight = 1200;

                let width = image.width;
                let height = image.height;

                if (width > maxWidth) {
                    height = Math.round(height * maxWidth / width);
                    width = maxWidth;
                }

                if (height > maxHeight) {
                    width = Math.round(width * maxHeight / height);
                    height = maxHeight;
                }

                const canvas = document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context = canvas.getContext("2d");

                context.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );

                resolve(
                    canvas.toDataURL("image/jpeg", 0.75)
                );
            };

            image.onerror = reject;

            image.src = event.target.result;
        };

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

function renderImagePreview() {
    const container = $("imagePreview");

    if (!container) return;

    container.innerHTML = "";

    selectedImages.forEach((image, index) => {
        const item = document.createElement("div");

        item.className = "preview-item";

        item.innerHTML = `
            <img src="${image}" alt="Imagen ${index + 1}">
            <button type="button" class="preview-remove" data-image-index="${index}">
                ×
            </button>
        `;

        container.appendChild(item);
    });

    $all("[data-image-index]").forEach(button => {
        button.addEventListener("click", () => {
            const index = Number(button.dataset.imageIndex);

            selectedImages.splice(index, 1);

            renderImagePreview();
        });
    });
}

function handleVideoFile(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
        showToast("Selecciona un video válido.", "error");
        return;
    }

    selectedVideo = {
        name: file.name,
        type: file.type,
        size: file.size
    };

    const publishVideo = $("publishVideo");

    if (publishVideo) {
        publishVideo.dataset.selected = "true";
    }

    showToast(`Video seleccionado: ${file.name}`);
}

function publishProduct(event) {
    event.preventDefault();

    if (!currentUser) {
        showToast("Debes iniciar sesión.", "error");
        return;
    }

    const type = $("publishType")?.value || "Producto";
    const category = $("publishCategory")?.value || "Otros";
    const name = $("publishName")?.value.trim();
    const price = Number($("publishPrice")?.value || 0);
    const description = $("publishDescription")?.value.trim();
    const address = $("publishAddress")?.value.trim();
    const phone = normalizePhone($("publishPhone")?.value);
    const whatsapp = $("publishWhatsapp")?.checked;
    const privateChat = $("publishPrivateChat")?.checked;

    if (!name || !description || !address || !phone) {
        showToast("Completa los datos de la publicación.", "error");
        return;
    }

    if (price < 0) {
        showToast("El precio no es válido.", "error");
        return;
    }

    const products = getStorage(STORAGE_PRODUCTS, []);

    const product = {
        id: uid("product"),
        ownerId: currentUser.id,
        type,
        category,
        name,
        price,
        description,
        address,
        phone,
        whatsapp,
        privateChat,
        images: selectedImages.length
            ? [...selectedImages]
            : [placeholderImage(name)],
        video: selectedVideo,
        views: 0,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
        status: "approved"
    };

    products.unshift(product);

    if (!setStorage(STORAGE_PRODUCTS, products)) {
        return;
    }

    addNotification(
        currentUser.id,
        "Publicación creada",
        `Tu publicación "${name}" está activa.`
    );

    selectedImages = [];
    selectedVideo = null;

    $("publishForm")?.reset();

    renderImagePreview();

    closeModal("publishModal");

    renderHome();

    showToast("Publicación publicada correctamente ⚡");
}

/* =========================================================
   PRODUCTOS
   ========================================================= */

function getVisibleProducts() {
    const products = getStorage(STORAGE_PRODUCTS, []);

    return products.filter(product => {
        return product.status !== "removed" &&
            product.status !== "rejected";
    });
}

function renderHome() {
    if (!currentUser) return;

    updateHeader();

    renderFlashDay();

    renderCategories();

    renderProducts();
}

function renderCategories() {
    $all("[data-category]").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.category === currentCategory
        );
    });
}

function renderProducts() {
    const grid = $("productsGrid");
    const empty = $("emptyProducts");

    if (!grid) return;

    let products = getVisibleProducts();

    const category =
        currentFilters.category !== "Todos"
            ? currentFilters.category
            : currentCategory;

    if (category && category !== "Todos") {
        products = products.filter(
            product => product.category === category
        );
    }

    if (currentFilters.minPrice !== "") {
        products = products.filter(
            product => Number(product.price) >= Number(currentFilters.minPrice)
        );
    }

    if (currentFilters.maxPrice !== "") {
        products = products.filter(
            product => Number(product.price) <= Number(currentFilters.maxPrice)
        );
    }

    switch (currentFilters.order) {
        case "price-low":
            products.sort((a, b) => Number(a.price) - Number(b.price));
            break;

        case "price-high":
            products.sort((a, b) => Number(b.price) - Number(a.price));
            break;

        case "popular":
            products.sort((a, b) => Number(b.views) - Number(a.views));
            break;

        default:
            products.sort(
                (a, b) =>
                    new Date(b.createdAt) -
                    new Date(a.createdAt)
            );
    }

    grid.innerHTML = "";

    if (!products.length) {
        if (empty) empty.style.display = "block";
        return;
    }

    if (empty) empty.style.display = "none";

    products.forEach(product => {
        const card = createProductCard(product);

        grid.appendChild(card);
    });
}

function createProductCard(product) {
    const card = document.createElement("article");

    card.className = "product-card";

    const image =
        product.images?.[0] ||
        placeholderImage(product.name);

    const liked =
        currentUser &&
        Array.isArray(product.likedBy) &&
        product.likedBy.includes(currentUser.id);

    card.innerHTML = `
        <div class="product-image-wrap">
            <img
                class="product-image"
                src="${image}"
                alt="${escapeHTML(product.name)}"
            >

            <button
                type="button"
                class="card-like ${liked ? "liked" : ""}"
                data-like-product="${product.id}"
            >
                ♥
            </button>
        </div>

        <div class="product-card-body">
            <div class="product-category">
                ${escapeHTML(product.category || "Otros")}
            </div>

            <h3>${escapeHTML(product.name)}</h3>

            <div class="product-price">
                ${formatMoney(product.price)}
            </div>

            <p>
                ${escapeHTML(
                    String(product.description || "").slice(0, 80)
                )}
            </p>

            <div class="product-meta">
                <span>👁 ${product.views || 0}</span>
                <span>♥ ${product.likes || 0}</span>
            </div>
        </div>
    `;

    card.addEventListener("click", event => {
        if (event.target.closest("[data-like-product]")) {
            return;
        }

        openProduct(product.id);
    });

    const likeButton =
        card.querySelector("[data-like-product]");

    likeButton?.addEventListener("click", event => {
        event.stopPropagation();

        toggleLike(product.id);
    });

    return card;
}

function openProduct(productId) {
    const products = getStorage(STORAGE_PRODUCTS, []);

    const index = products.findIndex(
        product => product.id === productId
    );

    if (index === -1) return;

    products[index].views =
        Number(products[index].views || 0) + 1;

    setStorage(STORAGE_PRODUCTS, products);

    const product = products[index];

    const image =
        product.images?.[0] ||
        placeholderImage(product.name);

    if ($("productDetailImage")) {
        $("productDetailImage").src = image;
    }

    if ($("productDetailCategory")) {
        $("productDetailCategory").textContent =
            product.category || "Otros";
    }

    if ($("productModalTitle")) {
        $("productModalTitle").textContent = product.name;
    }

    if ($("productDetailPrice")) {
        $("productDetailPrice").textContent =
            formatMoney(product.price);
    }

    if ($("productDetailDescription")) {
        $("productDetailDescription").textContent =
            product.description || "";
    }

    if ($("productDetailAddress")) {
        $("productDetailAddress").textContent =
            product.address || "";
    }

    if ($("productDetailPhone")) {
        $("productDetailPhone").textContent =
            product.phone || "";
    }

    if ($("productDetailViews")) {
        $("productDetailViews").textContent =
            product.views || 0;
    }

    if ($("productDetailLikes")) {
        $("productDetailLikes").textContent =
            product.likes || 0;
    }

    const likeButton = $("productLikeBtn");

    if (likeButton) {
        const liked =
            product.likedBy?.includes(currentUser?.id);

        likeButton.classList.toggle("liked", !!liked);

        likeButton.dataset.productId = product.id;
    }

    const whatsappButton = $("productWhatsappBtn");

    if (whatsappButton) {
        whatsappButton.dataset.productId = product.id;

        whatsappButton.style.display =
            product.whatsapp && product.phone
                ? ""
                : "none";
    }

    const chatButton = $("productChatBtn");

    if (chatButton) {
        chatButton.dataset.productId = product.id;

        chatButton.style.display =
            product.privateChat &&
            product.ownerId !== currentUser?.id
                ? ""
                : "none";
    }

    openModal("productModal");
}

function toggleLike(productId) {
    if (!currentUser) return;

    const products = getStorage(STORAGE_PRODUCTS, []);

    const product = products.find(
        item => item.id === productId
    );

    if (!product) return;

    if (!Array.isArray(product.likedBy)) {
        product.likedBy = [];
    }

    const index = product.likedBy.indexOf(currentUser.id);

    if (index >= 0) {
        product.likedBy.splice(index, 1);
        product.likes = Math.max(
            0,
            Number(product.likes || 0) - 1
        );
    } else {
        product.likedBy.push(currentUser.id);
        product.likes = Number(product.likes || 0) + 1;

        if (product.ownerId !== currentUser.id) {
            addNotification(
                product.ownerId,
                "Nueva interacción ❤️",
                `${getUserFullName(currentUser)} indicó que le gusta tu publicación.`
            );
        }
    }

    setStorage(STORAGE_PRODUCTS, products);

    renderProducts();

    openProduct(productId);
}

/* =========================================================
   BÚSQUEDA
   ========================================================= */

function executeSearch() {
    const input = $("searchInput");

    if (!input) return;

    const query = normalizeText(input.value);

    renderSearchResults(query);

    showPage("searchPage");
}

function renderSearchResults(query = "") {
    const container = $("searchResults");

    if (!container) return;

    const searchQuery =
        normalizeText(
            query || $("searchInput")?.value || ""
        );

    let products = getVisibleProducts();

    if (searchQuery) {
        products = products.filter(product => {
            const text = normalizeText(`
                ${product.name}
                ${product.description}
                ${product.category}
                ${product.address}
            `);

            return text.includes(searchQuery);
        });
    }

    container.innerHTML = "";

    if (!products.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔎</div>
                <h3>No encontramos resultados</h3>
                <p>Prueba con otra palabra.</p>
            </div>
        `;

        return;
    }

    products.forEach(product => {
        container.appendChild(
            createProductCard(product)
        );
    });
}

/* =========================================================
   FILTROS
   ========================================================= */

function applyFilters() {
    currentFilters = {
        category:
            $("filterCategory")?.value ||
            "Todos",

        minPrice:
            $("filterMinPrice")?.value || "",

        maxPrice:
            $("filterMaxPrice")?.value || "",

        order:
            $("filterOrder")?.value ||
            "recent"
    };

    currentCategory = currentFilters.category;

    closeModal("filterModal");

    renderHome();

    showToast("Filtros aplicados.");
}

/* =========================================================
   FLASH DEL DÍA ⚡
   ========================================================= */

function renderFlashDay() {
    const container = $("flashDayList");

    if (!container) return;

    const config = getStorage(STORAGE_CONFIG, {});

    if (config.flashEnabled === false) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Flash del Día está temporalmente cerrado</h3>
            </div>
        `;

        return;
    }

    const requests = getStorage(STORAGE_FLASH, []);

    const now = Date.now();

    const approved = requests.filter(request => {
        if (request.status !== "approved") return false;

        if (!request.expiresAt) return true;

        return new Date(request.expiresAt).getTime() > now;
    });

    container.innerHTML = "";

    if (!approved.length) {
        container.innerHTML = `
            <div class="flash-empty">
                <strong>⚡ Flash del Día</strong>
                <span>Promociona tu publicación aquí.</span>
                <button type="button" id="openFlashRequestBtn">
                    Anunciar
                </button>
            </div>
        `;

        $("openFlashRequestBtn")?.addEventListener(
            "click",
            openFlashRequest
        );

        return;
    }

    approved.forEach(request => {
        const card = document.createElement("article");

        card.className = "flash-card";

        const image =
            request.images?.[0] ||
            placeholderImage("FLASH DEL DÍA");

        card.innerHTML = `
            <img src="${image}" alt="${escapeHTML(request.name)}">

            <div class="flash-card-content">
                <span>⚡ ${escapeHTML(request.planName || "FLASH")}</span>
                <h3>${escapeHTML(request.name)}</h3>
                <p>${escapeHTML(request.description || "")}</p>
                <small>${escapeHTML(request.address || "")}</small>
            </div>
        `;

        card.addEventListener("click", () => {
            if (request.productId) {
                openProduct(request.productId);
            }
        });

        container.appendChild(card);
    });
}

function openFlashRequest() {
    if (!currentUser) {
        showToast("Debes iniciar sesión.", "error");
        return;
    }

    const config = getStorage(STORAGE_CONFIG, {});

    const modal = document.createElement("div");

    modal.className = "modal active dynamic-modal";

    modal.id = "dynamicFlashModal";

    modal.innerHTML = `
        <div class="modal-overlay"></div>

        <div class="modal-content">
            <button type="button"
                class="modal-close"
                id="closeDynamicFlash">
                ×
            </button>

            <h2>⚡ Flash del Día</h2>

            <form id="flashRequestForm">

                <label>Plan</label>

                <select id="flashPlan" required>
                    ${(config.plans || []).map(plan => `
                        <option value="${plan.id}">
                            ${escapeHTML(plan.name)}
                            - ${formatMoney(plan.price)}
                        </option>
                    `).join("")}
                </select>

                <label>Nombre del anuncio</label>

                <input id="flashName" required>

                <label>Descripción</label>

                <textarea id="flashDescription" required></textarea>

                <label>Dirección</label>

                <input id="flashAddress" required>

                <label>Método de pago</label>

                <select id="flashPaymentMethod" required>
                    ${(config.paymentMethods || []).map(method => `
                        <option value="${escapeHTML(method)}">
                            ${escapeHTML(method)}
                        </option>
                    `).join("")}
                </select>

                <label>Comprobante de pago</label>

                <input
                    type="file"
                    id="flashReceipt"
                    accept="image/*"
                    required
                >

                <label>Imagen del anuncio</label>

                <input
                    type="file"
                    id="flashImage"
                    accept="image/*"
                >

                <button class="primary-btn" type="submit">
                    Enviar para aprobación
                </button>

            </form>
        </div>
    `;

    document.body.appendChild(modal);

    $("closeDynamicFlash")?.addEventListener(
        "click",
        () => modal.remove()
    );

    $("flashRequestForm")?.addEventListener(
        "submit",
        submitFlashRequest
    );
}

async function submitFlashRequest(event) {
    event.preventDefault();

    const planId = $("flashPlan")?.value;
    const name = $("flashName")?.value.trim();
    const description = $("flashDescription")?.value.trim();
    const address = $("flashAddress")?.value.trim();
    const paymentMethod = $("flashPaymentMethod")?.value;
    const receiptFile = $("flashReceipt")?.files?.[0];
    const imageFile = $("flashImage")?.files?.[0];

    if (
        !planId ||
        !name ||
        !description ||
        !address ||
        !paymentMethod ||
        !receiptFile
    ) {
        showToast("Completa todos los datos.", "error");
        return;
    }

    try {
        const config = getStorage(STORAGE_CONFIG, {});

        const plan =
            (config.plans || []).find(
                item => item.id === planId
            ) || config.plans?.[0];

        const receipt = await fileToDataURL(receiptFile);

        let image = null;

        if (imageFile) {
            image = await compressImage(imageFile);
        }

        const requests = getStorage(STORAGE_FLASH, []);

        requests.push({
            id: uid("flash"),
            userId: currentUser.id,
            name,
            description,
            address,
            paymentMethod,
            receipt,
            images: image ? [image] : [],
            planId,
            planName: plan?.name || "Flash",
            price: plan?.price || 0,
            durationHours: plan?.durationHours || 24,
            status: "pending",
            createdAt: new Date().toISOString()
        });

        setStorage(STORAGE_FLASH, requests);

        addNotification(
            currentUser.id,
            "Flash enviado ⚡",
            "Tu anuncio fue enviado para revisión."
        );

        $("dynamicFlashModal")?.remove();

        showToast("Solicitud enviada al administrador.");
    } catch (error) {
        console.error(error);
        showToast("No se pudo guardar el comprobante.", "error");
    }
}

function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = event =>
            resolve(event.target.result);

        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function addNotification(userId, title, message) {
    const notifications =
        getStorage(STORAGE_NOTIFICATIONS, []);

    notifications.unshift({
        id: uid("notification"),
        userId,
        title,
        message,
        read: false,
        createdAt: new Date().toISOString()
    });

    setStorage(
        STORAGE_NOTIFICATIONS,
        notifications.slice(0, 200)
    );

    if (currentUser?.id === userId) {
        updateNotificationBadge();
    }
}

function getMyNotifications() {
    return getStorage(STORAGE_NOTIFICATIONS, [])
        .filter(item => item.userId === currentUser?.id)
        .sort(
            (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
        );
}

function renderNotifications() {
    const container = $("notificationsList");

    if (!container || !currentUser) return;

    const notifications = getMyNotifications();

    container.innerHTML = "";

    if (!notifications.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h3>No tienes notificaciones</h3>
                <p>Aquí aparecerán tus novedades.</p>
            </div>
        `;

        return;
    }

    notifications.forEach(notification => {
        const item = document.createElement("div");

        item.className =
            `notification-item ${
                notification.read ? "" : "unread"
            }`;

        item.innerHTML = `
            <div class="notification-icon">🔔</div>

            <div>
                <strong>${escapeHTML(notification.title)}</strong>
                <p>${escapeHTML(notification.message)}</p>
                <small>${formatDate(notification.createdAt)}</small>
            </div>
        `;

        container.appendChild(item);
    });
}

function markNotificationsRead() {
    const notifications =
        getStorage(STORAGE_NOTIFICATIONS, []);

    notifications.forEach(item => {
        if (item.userId === currentUser?.id) {
            item.read = true;
        }
    });

    setStorage(
        STORAGE_NOTIFICATIONS,
        notifications
    );

    renderNotifications();

    updateNotificationBadge();

    showToast("Notificaciones marcadas como leídas.");
}

function updateNotificationBadge() {
    const badge = $("notificationBadge");

    if (!badge || !currentUser) return;

    const unread = getMyNotifications()
        .filter(item => !item.read)
        .length;

    badge.textContent = unread > 99
        ? "99+"
        : unread;

    badge.style.display =
        unread > 0 ? "flex" : "none";
}

/* =========================================================
   PERFIL
   ========================================================= */

function renderProfile() {
    if (!currentUser) return;

    updateHeader();

    const products = getVisibleProducts()
        .filter(
            product =>
                product.ownerId === currentUser.id
        );

    const myGrid = $("myProductsGrid");

    if (myGrid) {
        myGrid.innerHTML = "";

        products.forEach(product => {
            myGrid.appendChild(
                createProductCard(product)
            );
        });
    }

    const statProducts = $("profileProducts");

    if (statProducts) {
        statProducts.textContent = products.length;
    }

    const statViews = $("profileViews");

    if (statViews) {
        statViews.textContent = products.reduce(
            (total, product) =>
                total + Number(product.views || 0),
            0
        );
    }

    const statLikes = $("profileLikes");

    if (statLikes) {
        statLikes.textContent = products.reduce(
            (total, product) =>
                total + Number(product.likes || 0),
            0
        );
    }
}

function openEditProfile() {
    if (!currentUser) return;

    if ($("editFirstName")) {
        $("editFirstName").value =
            currentUser.firstName || "";
    }

    if ($("editLastName")) {
        $("editLastName").value =
            currentUser.lastName || "";
    }

    if ($("editNickname")) {
        $("editNickname").value =
            currentUser.nickname || "";
    }

    if ($("editAddress")) {
        $("editAddress").value =
            currentUser.address || "";
    }

    if ($("editPhone")) {
        $("editPhone").value =
            currentUser.phone ||
            currentUser.whatsapp ||
            "";
    }

    openModal("profileEditModal");
}

function saveProfile(event) {
    event.preventDefault();

    if (!currentUser) return;

    const users = getStorage(STORAGE_USERS, []);

    const index = users.findIndex(
        user => user.id === currentUser.id
    );

    if (index === -1) return;

    users[index].firstName =
        $("editFirstName")?.value.trim() || "";

    users[index].lastName =
        $("editLastName")?.value.trim() || "";

    users[index].nickname =
        $("editNickname")?.value.trim() || "";

    users[index].address =
        $("editAddress")?.value.trim() || "";

    users[index].phone =
        normalizePhone(
            $("editPhone")?.value
        );

    users[index].whatsapp =
        users[index].phone;

    currentUser = users[index];

    setStorage(STORAGE_USERS, users);

    setStorage(STORAGE_USER, currentUser);

    updateHeader();

    renderProfile();

    closeModal("profileEditModal");

    showToast("Perfil actualizado.");
}

/* =========================================================
   AMIGOS
   ========================================================= */

function getUsersExceptMe() {
    return getStorage(STORAGE_USERS, [])
        .filter(user => user.id !== currentUser?.id);
}

function findFriends() {
    if (!currentUser) return;

    const query = window.prompt(
        "Busca por nombre, apodo, correo, cédula o teléfono:"
    );

    if (!query) return;

    const text = normalizeText(query);

    const users = getUsersExceptMe().filter(user => {
        const content = normalizeText(`
            ${user.firstName}
            ${user.lastName}
            ${user.nickname}
            ${user.email}
            ${user.cedula}
            ${user.phone}
        `);

        return content.includes(text);
    });

    if (!users.length) {
        showToast("No encontramos usuarios.", "error");
        return;
    }

    const target = users[0];

    const usersAll = getStorage(STORAGE_USERS, []);

    const meIndex = usersAll.findIndex(
        user => user.id === currentUser.id
    );

    if (currentUser.friends?.includes(target.id)) {
        showToast("Ya son amigos.");
        return;
    }

    if (!Array.isArray(target.friendRequests)) {
        target.friendRequests = [];
    }

    if (!target.friendRequests.includes(currentUser.id)) {
        target.friendRequests.push(currentUser.id);
    }

    usersAll[meIndex] = {
        ...usersAll[meIndex],
        sentFriendRequests: [
            ...(usersAll[meIndex].sentFriendRequests || []),
            target.id
        ]
    };

    setStorage(STORAGE_USERS, usersAll);

    addNotification(
        target.id,
        "Nueva solicitud de amistad 👥",
        `${getUserFullName(currentUser)} quiere ser tu amigo.`
    );

    showToast(
        `Solicitud enviada a ${getUserFullName(target)}.`
    );
}

function renderFriends(tab = "friends") {
    const container = $("friendsList");

    if (!container || !currentUser) return;

    const users = getStorage(STORAGE_USERS, []);

    if (tab === "requests") {
        const requests =
            currentUser.friendRequests || [];

        const requestUsers = users.filter(
            user => requests.includes(user.id)
        );

        container.innerHTML = "";

        if (!requestUsers.length) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No tienes solicitudes</h3>
                </div>
            `;

            return;
        }

        requestUsers.forEach(user => {
            container.appendChild(
                createFriendRequestCard(user)
            );
        });

        return;
    }

    const friends =
        currentUser.friends || [];

    const friendUsers = users.filter(
        user => friends.includes(user.id)
    );

    container.innerHTML = "";

    if (!friendUsers.length) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>Aún no tienes amigos</h3>
                <p>Usa "Buscar amigos" para comenzar.</p>
            </div>
        `;

        return;
    }

    friendUsers.forEach(user => {
        container.appendChild(
            createFriendCard(user)
        );
    });
}

function createFriendCard(user) {
    const card = document.createElement("div");

    card.className = "friend-card";

    card.innerHTML = `
        <div class="friend-avatar">
            ${
                user.photo
                    ? `<img src="${user.photo}" alt="Perfil">`
                    : getUserInitials(user)
            }
        </div>

        <div class="friend-info">
            <strong>${escapeHTML(getUserFullName(user))}</strong>
            <span>
                ${user.nickname
                    ? "@" + escapeHTML(user.nickname)
                    : ""}
            </span>
        </div>

        <button type="button" class="secondary-btn">
            💬
        </button>
    `;

    card.querySelector("button")
        ?.addEventListener(
            "click",
            () => openChatWith(user.id)
        );

    return card;
}

function createFriendRequestCard(user) {
    const card = document.createElement("div");

    card.className = "friend-card";

    card.innerHTML = `
        <div class="friend-avatar">
            ${getUserInitials(user)}
        </div>

        <div class="friend-info">
            <strong>${escapeHTML(getUserFullName(user))}</strong>
            <span>Solicitud de amistad</span>
        </div>

        <div class="friend-actions">
            <button
                type="button"
                class="primary-btn accept-friend"
            >
                ✓
            </button>

            <button
                type="button"
                class="secondary-btn reject-friend"
            >
                ×
            </button>
        </div>
    `;

    card.querySelector(".accept-friend")
        ?.addEventListener(
            "click",
            () => acceptFriendRequest(user.id)
        );

    card.querySelector(".reject-friend")
        ?.addEventListener(
            "click",
            () => rejectFriendRequest(user.id)
        );

    return card;
}

function acceptFriendRequest(userId) {
    const users = getStorage(STORAGE_USERS, []);

    const me = users.find(
        user => user.id === currentUser.id
    );

    const other = users.find(
        user => user.id === userId
    );

    if (!me || !other) return;

    if (!Array.isArray(me.friends)) {
        me.friends = [];
    }

    if (!Array.isArray(other.friends)) {
        other.friends = [];
    }

    if (!me.friends.includes(other.id)) {
        me.friends.push(other.id);
    }

    if (!other.friends.includes(me.id)) {
        other.friends.push(me.id);
    }

    me.friendRequests =
        (me.friendRequests || [])
            .filter(id => id !== other.id);

    other.sentFriendRequests =
        (other.sentFriendRequests || [])
            .filter(id => id !== me.id);

    setStorage(STORAGE_USERS, users);

    currentUser = me;

    setStorage(STORAGE_USER, currentUser);

    addNotification(
        other.id,
        "Solicitud aceptada 👥",
        `${getUserFullName(me)} aceptó tu solicitud.`
    );

    renderFriends();

    showToast("Ahora son amigos.");
}

function rejectFriendRequest(userId) {
    const users = getStorage(STORAGE_USERS, []);

    const me = users.find(
        user => user.id === currentUser.id
    );

    if (!me) return;

    me.friendRequests =
        (me.friendRequests || [])
            .filter(id => id !== userId);

    setStorage(STORAGE_USERS, users);

    currentUser = me;

    setStorage(STORAGE_USER, currentUser);

    renderFriends("requests");

    showToast("Solicitud rechazada.");
}

/* =========================================================
   CHAT
   ========================================================= */

function getChats() {
    return getStorage(STORAGE_CHATS, []);
}

function openChatWith(userId) {
    if (!currentUser) return;

    const users = getStorage(STORAGE_USERS, []);

    const otherUser = users.find(
        user => user.id === userId
    );

    if (!otherUser) {
        showToast("Usuario no encontrado.", "error");
        return;
    }

    currentChatUserId = userId;

    showPage("chatPage");

    renderChatWindow(otherUser);
}

function getConversation(userId) {
    const chats = getChats();

    let conversation = chats.find(chat =>
        chat.participants.includes(currentUser.id) &&
        chat.participants.includes(userId)
    );

    if (!conversation) {
        conversation = {
            id: uid("chat"),
            participants: [
                currentUser.id,
                userId
            ],
            messages: [],
            updatedAt: new Date().toISOString()
        };

        chats.push(conversation);

        setStorage(STORAGE_CHATS, chats);
    }

    return conversation;
}

function renderChats() {
    const list = $("chatList");

    if (!list || !currentUser) return;

    const chats = getChats();

    const users = getStorage(STORAGE_USERS, []);

    const myChats = chats
        .filter(chat =>
            chat.participants.includes(currentUser.id)
        )
        .sort(
            (a, b) =>
                new Date(b.updatedAt) -
                new Date(a.updatedAt)
        );

    list.innerHTML = "";

    if (!myChats.length) {
        if ($("chatEmpty")) {
            $("chatEmpty").style.display = "block";
        }

        return;
    }

    if ($("chatEmpty")) {
        $("chatEmpty").style.display = "none";
    }

    myChats.forEach(chat => {
        const otherId =
            chat.participants.find(
                id => id !== currentUser.id
            );

        const otherUser =
            users.find(user => user.id === otherId);

        if (!otherUser) return;

        const lastMessage =
            chat.messages?.[chat.messages.length - 1];

        const item = document.createElement("div");

        item.className = "chat-item";

        item.innerHTML = `
            <div class="friend-avatar">
                ${getUserInitials(otherUser)}
            </div>

            <div>
                <strong>${escapeHTML(
                    getUserFullName(otherUser)
                )}</strong>

                <p>
                    ${escapeHTML(
                        lastMessage?.text ||
                        "Nueva conversación"
                    )}
                </p>
            </div>
        `;

        item.addEventListener(
            "click",
            () => openChatWith(otherUser.id)
        );

        list.appendChild(item);
    });
}

function renderChatWindow(otherUser) {
    const page = $("chatPage");

    if (!page) return;

    let windowElement =
        $("chatWindow");

    if (!windowElement) {
        windowElement =
            document.createElement("div");

        windowElement.id = "chatWindow";

        windowElement.className =
            "chat-window";

        page.appendChild(windowElement);
    }

    const conversation =
        getConversation(otherUser.id);

    windowElement.innerHTML = `
        <div class="chat-window-header">
            <button
                type="button"
                id="closeChatWindow"
            >
                ←
            </button>

            <strong>
                ${escapeHTML(
                    getUserFullName(otherUser)
                )}
            </strong>
        </div>

        <div class="chat-messages" id="chatMessages">
            ${
                (conversation.messages || [])
                    .map(message => `
                        <div class="
                            chat-message
                            ${
                                message.senderId === currentUser.id
                                    ? "mine"
                                    : "theirs"
                            }
                        ">
                            ${escapeHTML(message.text)}
                            <small>
                                ${formatDate(message.createdAt)}
                            </small>
                        </div>
                    `)
                    .join("")
            }
        </div>

        <form id="chatForm" class="chat-composer">
            <input
                id="chatInput"
                type="text"
                placeholder="Escribe un mensaje..."
                autocomplete="off"
                required
            >

            <button type="submit">
                ➤
            </button>
        </form>
    `;

    $("closeChatWindow")
        ?.addEventListener(
            "click",
            () => {
                currentChatUserId = null;
                windowElement.remove();
                renderChats();
            }
        );

    $("chatForm")
        ?.addEventListener(
            "submit",
            sendChatMessage
        );

    const messages =
        $("chatMessages");

    if (messages) {
        messages.scrollTop =
            messages.scrollHeight;
    }
}

function sendChatMessage(event) {
    event.preventDefault();

    const input = $("chatInput");

    const text =
        input?.value.trim();

    if (!text || !currentChatUserId) {
        return;
    }

    const chats = getChats();

    const conversation = chats.find(chat =>
        chat.participants.includes(currentUser.id) &&
        chat.participants.includes(currentChatUserId)
    );

    if (!conversation) return;

    conversation.messages.push({
        id: uid("message"),
        senderId: currentUser.id,
        text,
        createdAt: new Date().toISOString()
    });

    conversation.updatedAt =
        new Date().toISOString();

    setStorage(STORAGE_CHATS, chats);

    addNotification(
        currentChatUserId,
        "Nuevo mensaje 💬",
        `${getUserFullName(currentUser)} te envió un mensaje.`
    );

    const users =
        getStorage(STORAGE_USERS, []);

    const other =
        users.find(
            user => user.id === currentChatUserId
        );

    if (other) {
        renderChatWindow(other);
    }
}

/* =========================================================
   WHATSAPP
   ========================================================= */

function openWhatsApp(productId) {
    const products =
        getStorage(STORAGE_PRODUCTS, []);

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product || !product.phone) {
        showToast("No hay WhatsApp disponible.", "error");
        return;
    }

    let phone =
        normalizePhone(product.phone);

    if (phone.length === 10) {
        phone = `1${phone}`;
    }

    const text = encodeURIComponent(
        `Hola, vi tu publicación "${product.name}" en Market Flash ⚡ y estoy interesado.`
    );

    window.open(
        `https://wa.me/${phone}?text=${text}`,
        "_blank"
    );
}

/* =========================================================
   ADMINISTRADOR
   ========================================================= */

function isAdmin() {
    return currentUser?.role === "admin";
}

function ensureAdminUI() {
    if (!isAdmin()) return;

    const settingsPage =
        $("settingsPage");

    if (!settingsPage) return;

    if ($("adminPanelBtn")) return;

    const button =
        document.createElement("button");

    button.id = "adminPanelBtn";

    button.className =
        "settings-item admin-setting";

    button.innerHTML =
        "🛡️ Panel de administrador";

    button.addEventListener(
        "click",
        openAdminPanel
    );

    settingsPage
        .querySelector(".settings-list")
        ?.prepend(button);
}

function openAdminPanel() {
    if (!isAdmin()) {
        showToast("Acceso no autorizado.", "error");
        return;
    }

    const existing =
        $("adminDynamicPage");

    if (existing) {
        existing.remove();
    }

    const page =
        document.createElement("section");

    page.id =
        "adminDynamicPage";

    page.className =
        "page active dynamic-admin-page";

    page.innerHTML = `
        <div class="page-header">
            <button
                type="button"
                id="closeAdminPage"
            >
                ←
            </button>

            <h2>🛡️ Administración</h2>
        </div>

        <div class="admin-dashboard">

            <div class="admin-stat">
                <strong id="adminUsersCount">0</strong>
                <span>Usuarios</span>
            </div>

            <div class="admin-stat">
                <strong id="adminProductsCount">0</strong>
                <span>Publicaciones</span>
            </div>

            <div class="admin-stat">
                <strong id="adminFlashCount">0</strong>
                <span>Flash pendientes</span>
            </div>

        </div>

        <div class="admin-section">
            <h3>Usuarios</h3>
            <div id="adminUsersList"></div>
        </div>

        <div class="admin-section">
            <h3>Publicaciones</h3>
            <div id="adminProductsList"></div>
        </div>

        <div class="admin-section">
            <h3>Flash del Día</h3>
            <div id="adminFlashList"></div>
        </div>

        <div class="admin-section">
            <h3>Configuración Flash</h3>

            <label>
                <input
                    type="checkbox"
                    id="adminFlashEnabled"
                >
                Activar Flash del Día
            </label>

            <button
                type="button"
                class="primary-btn"
                id="saveAdminConfig"
            >
                Guardar configuración
            </button>
        </div>
    `;

    $("mainContent")?.appendChild(page);

    $all(".page").forEach(item => {
        if (item !== page) {
            item.classList.remove("active");
        }
    });

    $("closeAdminPage")
        ?.addEventListener(
            "click",
            () => {
                page.remove();
                showPage("homePage");
            }
        );

    renderAdminPanel();
}

function renderAdminPanel() {
    const users =
        getStorage(STORAGE_USERS, []);

    const products =
        getStorage(STORAGE_PRODUCTS, []);

    const flashes =
        getStorage(STORAGE_FLASH, []);

    const config =
        getStorage(STORAGE_CONFIG, {});

    if ($("adminUsersCount")) {
        $("adminUsersCount").textContent =
            users.length;
    }

    if ($("adminProductsCount")) {
        $("adminProductsCount").textContent =
            products.length;
    }

    if ($("adminFlashCount")) {
        $("adminFlashCount").textContent =
            flashes.filter(
                item => item.status === "pending"
            ).length;
    }

    if ($("adminFlashEnabled")) {
        $("adminFlashEnabled").checked =
            config.flashEnabled !== false;
    }

    renderAdminUsers(users);

    renderAdminProducts(products);

    renderAdminFlash(flashes);
}

function renderAdminUsers(users) {
    const container =
        $("adminUsersList");

    if (!container) return;

    container.innerHTML = "";

    users.forEach(user => {
        const item =
            document.createElement("div");

        item.className =
            "admin-item";

        item.innerHTML = `
            <div>
                <strong>
                    ${escapeHTML(
                        getUserFullName(user)
                    )}
                </strong>

                <small>
                    ${escapeHTML(
                        user.email || ""
                    )}
                </small>
            </div>

            <button
                type="button"
                class="secondary-btn"
                data-block-user="${user.id}"
            >
                ${user.blocked ? "Desbloquear" : "Bloquear"}
            </button>
        `;

        item.querySelector(
            "[data-block-user]"
        )?.addEventListener(
            "click",
            () => toggleBlockUser(user.id)
        );

        container.appendChild(item);
    });
}

function toggleBlockUser(userId) {
    if (userId === currentUser.id) {
        showToast("No puedes bloquear tu propia cuenta.", "error");
        return;
    }

    const users =
        getStorage(STORAGE_USERS, []);

    const user =
        users.find(
            item => item.id === userId
        );

    if (!user) return;

    user.blocked = !user.blocked;

    setStorage(STORAGE_USERS, users);

    renderAdminPanel();

    showToast(
        user.blocked
            ? "Usuario bloqueado."
            : "Usuario desbloqueado."
    );
}

function renderAdminProducts(products) {
    const container =
        $("adminProductsList");

    if (!container) return;

    container.innerHTML = "";

    products.forEach(product => {
        const item =
            document.createElement("div");

        item.className =
            "admin-item";

        item.innerHTML = `
            <div>
                <strong>
                    ${escapeHTML(product.name)}
                </strong>

                <small>
                    ${escapeHTML(product.category)}
                    · ${formatMoney(product.price)}
                </small>
            </div>

            <button
                type="button"
                class="secondary-btn"
                data-remove-product="${product.id}"
            >
                Eliminar
            </button>
        `;

        item.querySelector(
            "[data-remove-product]"
        )?.addEventListener(
            "click",
            () => removeProductAdmin(product.id)
        );

        container.appendChild(item);
    });
}

function removeProductAdmin(productId) {
    const products =
        getStorage(STORAGE_PRODUCTS, []);

    const product =
        products.find(
            item => item.id === productId
        );

    if (!product) return;

    product.status = "removed";

    setStorage(STORAGE_PRODUCTS, products);

    renderAdminPanel();

    renderHome();

    showToast("Publicación eliminada.");
}

function renderAdminFlash(requests) {
    const container =
        $("adminFlashList");

    if (!container) return;

    container.innerHTML = "";

    const pending =
        requests.filter(
            request => request.status === "pending"
        );

    if (!pending.length) {
        container.innerHTML =
            "<p>No hay solicitudes pendientes.</p>";

        return;
    }

    pending.forEach(request => {
        const item =
            document.createElement("div");

        item.className =
            "admin-item";

        item.innerHTML = `
            <div>
                <strong>
                    ${escapeHTML(request.name)}
                </strong>

                <small>
                    ${escapeHTML(request.planName)}
                    · ${formatMoney(request.price)}
                    · ${escapeHTML(request.paymentMethod)}
                </small>
            </div>

            <div class="admin-actions">
                <button
                    type="button"
                    class="primary-btn"
                    data-approve-flash="${request.id}"
                >
                    Aprobar
                </button>

                <button
                    type="button"
                    class="secondary-btn"
                    data-reject-flash="${request.id}"
                >
                    Rechazar
                </button>
            </div>
        `;

        item.querySelector(
            "[data-approve-flash]"
        )?.addEventListener(
            "click",
            () => approveFlash(request.id)
        );

        item.querySelector(
            "[data-reject-flash]"
        )?.addEventListener(
            "click",
            () => rejectFlash(request.id)
        );

        container.appendChild(item);
    });
}

function approveFlash(requestId) {
    const requests =
        getStorage(STORAGE_FLASH, []);

    const request =
        requests.find(
            item => item.id === requestId
        );

    if (!request) return;

    request.status = "approved";

    request.approvedAt =
        new Date().toISOString();

    request.expiresAt =
        new Date(
            Date.now() +
            Number(request.durationHours || 24) *
            60 *
            60 *
            1000
        ).toISOString();

    setStorage(STORAGE_FLASH, requests);

    addNotification(
        request.userId,
        "Flash aprobado ⚡",
        `Tu anuncio "${request.name}" fue aprobado.`
    );

    renderAdminPanel();

    renderFlashDay();

    showToast("Flash aprobado.");
}

function rejectFlash(requestId) {
    const requests =
        getStorage(STORAGE_FLASH, []);

    const request =
        requests.find(
            item => item.id === requestId
        );

    if (!request) return;

    request.status = "rejected";

    setStorage(STORAGE_FLASH, requests);

    addNotification(
        request.userId,
        "Flash rechazado",
        `Tu anuncio "${request.name}" fue rechazado.`
    );

    renderAdminPanel();

    showToast("Flash rechazado.");
}

function saveAdminConfig() {
    if (!isAdmin()) return;

    const config =
        getStorage(STORAGE_CONFIG, {});

    config.flashEnabled =
        $("adminFlashEnabled")?.checked !== false;

    setStorage(STORAGE_CONFIG, config);

    renderFlashDay();

    showToast("Configuración guardada.");
}

/* =========================================================
   LOGOUT
   ========================================================= */

function logout() {
    currentUser = null;
    currentChatUserId = null;

    localStorage.removeItem(STORAGE_USER);

    closeAllModals();

    showScreen("welcomeScreen");

    showToast("Sesión cerrada.");
}

/* =========================================================
   BOTONES DE PASSWORD
   ========================================================= */

function setupPasswordToggles() {
    $all("[data-toggle-password]").forEach(button => {
        button.addEventListener("click", () => {
            const targetId =
                button.dataset.togglePassword;

            const input = $(targetId);

            if (!input) return;

            input.type =
                input.type === "password"
                    ? "text"
                    : "password";

            button.textContent =
                input.type === "password"
                    ? "👁"
                    : "🙈";
        });
    });
}

/* =========================================================
   EVENTOS GENERALES
   ========================================================= */

function setupNavigation() {
    $("showLoginBtn")
        ?.addEventListener(
            "click",
            () => showScreen("loginScreen")
        );

    $("showRegisterBtn")
        ?.addEventListener(
            "click",
            () => showScreen("registerScreen")
        );

    $("backFromLoginBtn")
        ?.addEventListener(
            "click",
            () => showScreen("welcomeScreen")
        );

    $("backFromRegisterBtn")
        ?.addEventListener(
            "click",
            () => showScreen("welcomeScreen")
        );

    $("goRegisterFromLoginBtn")
        ?.addEventListener(
            "click",
            () => showScreen("registerScreen")
        );

    $("goLoginFromRegisterBtn")
        ?.addEventListener(
            "click",
            () => showScreen("loginScreen")
        );

    $("searchBtn")
        ?.addEventListener(
            "click",
            () => showPage("searchPage")
        );

    $("homeSearchBtn")
        ?.addEventListener(
            "click",
            () => showPage("searchPage")
        );

    $("notificationsBtn")
        ?.addEventListener(
            "click",
            () => showPage("notificationsPage")
        );

    $("settingsBtn")
        ?.addEventListener(
            "click",
            () => showPage("settingsPage")
        );

    $all(".bottom-nav button[data-page]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => showPage(button.dataset.page)
            );
        });
}

function setupForms() {
    $("loginForm")
        ?.addEventListener(
            "submit",
            loginUser
        );

    $("registerForm")
        ?.addEventListener(
            "submit",
            registerUser
        );

    $("forgotPasswordForm")
        ?.addEventListener(
            "submit",
            recoverPassword
        );

    $("publishForm")
        ?.addEventListener(
            "submit",
            publishProduct
        );

    $("profileEditForm")
        ?.addEventListener(
            "submit",
            saveProfile
        );
}

function setupPublish() {
    $("publishButton")
        ?.addEventListener(
            "click",
            () => openModal("publishModal")
        );

    $("emptyPublishBtn")
        ?.addEventListener(
            "click",
            () => openModal("publishModal")
        );

    $("galleryBtn")
        ?.addEventListener(
            "click",
            () => {
                const input =
                    $("publishImages");

                input?.click();
            }
        );

    $("takePhotoBtn")
        ?.addEventListener(
            "click",
            () => {
                $("cameraInput")?.click();
            }
        );

    $("publishImages")
        ?.addEventListener(
            "change",
            event =>
                handleImageFiles(
                    event.target.files
                )
        );

    $("cameraInput")
        ?.addEventListener(
            "change",
            event =>
                handleImageFiles(
                    event.target.files
                )
        );

    $("publishVideo")
        ?.addEventListener(
            "change",
            handleVideoFile
        );
}

function setupSearch() {
    $("executeSearchBtn")
        ?.addEventListener(
            "click",
            executeSearch
        );

    $("searchInput")
        ?.addEventListener(
            "keydown",
            event => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    executeSearch();
                }
            }
        );

    $all("[data-category]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const category =
                        button.dataset.category;

                    if (!category) return;

                    currentCategory = category;

                    currentFilters.category =
                        category;

                    renderHome();
                }
            );
        });

    $("allCategoriesBtn")
        ?.addEventListener(
            "click",
            () => {
                currentCategory = "Todos";

                currentFilters.category =
                    "Todos";

                renderHome();
            }
        );

    $("filterBtn")
        ?.addEventListener(
            "click",
            () => openModal("filterModal")
        );

    $("applyFiltersBtn")
        ?.addEventListener(
            "click",
            applyFilters
        );
}

function setupNotifications() {
    $("markNotificationsReadBtn")
        ?.addEventListener(
            "click",
            markNotificationsRead
        );
}

function setupFriends() {
    $("findFriendsBtn")
        ?.addEventListener(
            "click",
            findFriends
        );

    $all("[data-friend-tab]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    $all("[data-friend-tab]")
                        .forEach(item =>
                            item.classList.remove("active")
                        );

                    button.classList.add("active");

                    renderFriends(
                        button.dataset.friendTab
                    );
                }
            );
        });
}

function setupProfile() {
    $("editProfileBtn")
        ?.addEventListener(
            "click",
            openEditProfile
        );
}

function setupSettings() {
    $("logoutBtn")
        ?.addEventListener(
            "click",
            () => {
                if (
                    window.confirm(
                        "¿Quieres cerrar sesión?"
                    )
                ) {
                    logout();
                }
            }
        );

    $("accountSettingsBtn")
        ?.addEventListener(
            "click",
            () => {
                showToast(
                    "La configuración de cuenta está preparada para Supabase."
                );
            }
        );

    $("privacySettingsBtn")
        ?.addEventListener(
            "click",
            () => {
                showToast(
                    "Las opciones de privacidad estarán conectadas a Supabase."
                );
            }
        );

    $("notificationSettingsBtn")
        ?.addEventListener(
            "click",
            () => {
                showToast(
                    "Configuración de notificaciones disponible."
                );
            }
        );

    $("aboutBtn")
        ?.addEventListener(
            "click",
            () => {
                window.alert(
                    "MARKET FLASH ⚡\nMarketplace digital.\nPropietario: Julio Alcántara Gómez."
                );
            }
        );

    $("saveAdminConfig")
        ?.addEventListener(
            "click",
            saveAdminConfig
        );
}

function setupProductModal() {
    $("productLikeBtn")
        ?.addEventListener(
            "click",
            () => {
                const id =
                    $("productLikeBtn").dataset.productId;

                if (id) {
                    toggleLike(id);
                }
            }
        );

    $("productWhatsappBtn")
        ?.addEventListener(
            "click",
            () => {
                const id =
                    $("productWhatsappBtn").dataset.productId;

                if (id) {
                    openWhatsApp(id);
                }
            }
        );

    $("productChatBtn")
        ?.addEventListener(
            "click",
            () => {
                const productId =
                    $("productChatBtn").dataset.productId;

                const products =
                    getStorage(STORAGE_PRODUCTS, []);

                const product =
                    products.find(
                        item => item.id === productId
                    );

                if (!product) return;

                closeModal("productModal");

                openChatWith(product.ownerId);
            }
        );
}

function setupModalClosing() {
    $all("[data-close-modal]")
        .forEach(button => {
            button.addEventListener(
                "click",
                () => {
                    const modalId =
                        button.dataset.closeModal;

                    if (modalId) {
                        closeModal(modalId);
                    }
                }
            );
        });

    $all(".modal")
        .forEach(modal => {
            const overlay =
                modal.querySelector(".modal-overlay");

            overlay?.addEventListener(
                "click",
                () => closeModal(modal.id)
            );
        });

    document.addEventListener(
        "keydown",
        event => {
            if (event.key === "Escape") {
                closeAllModals();
            }
        }
    );
}

function setupForgotPassword() {
    $("forgotPasswordBtn")
        ?.addEventListener(
            "click",
            () => openModal("forgotPasswordModal")
        );
}

/* =========================================================
   INICIO
   ========================================================= */

function init() {
    initializeStorage();

    setupNavigation();

    setupForms();

    setupPublish();

    setupSearch();

    setupNotifications();

    setupFriends();

    setupProfile();

    setupSettings();

    setupProductModal();

    setupModalClosing();

    setupForgotPassword();

    setupPasswordToggles();

    enterApplication();

    setTimeout(() => {
        const loading =
            $("loadingScreen");

        if (loading) {
            loading.classList.add("hidden");
        }
    }, 700);
}

document.addEventListener(
    "DOMContentLoaded",
    init
);
