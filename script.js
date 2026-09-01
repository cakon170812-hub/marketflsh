/* =========================================================
   MARKET FLASH — script.js
   JavaScript principal de la aplicación
   ========================================================= */

'use strict';

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const STORAGE_USER = 'mf_user';
const STORAGE_PRODUCTS = 'mf_products';
const STORAGE_CONFIG = 'mf_config';
const STORAGE_ADS = 'mf_ads';
const STORAGE_NOTIFICATIONS = 'mf_notifications';

let category = 'Todos';
let user = loadJSON(STORAGE_USER, null);
let products = loadJSON(STORAGE_PRODUCTS, null);
let ads = loadJSON(STORAGE_ADS, []);
let config = loadJSON(STORAGE_CONFIG, null);

let navigationStack = [];
let currentScreen = 'home';

if (!Array.isArray(ads)) ads = [];

if (!Array.isArray(products)) {
    products = [
        {
            id: 1,
            name: 'iPhone 15 Pro',
            category: 'Celulares',
            price: 45000,
            location: 'Santo Domingo',
            seller: 'Market Flash',
            whatsapp: '',
            contactType: 'whatsapp',
            contactValue: '',
            image: 'https://images.unsplash.com/photo-1696446702183-cbd13d5f2e88?auto=format&fit=crop&w=800&q=80',
            description: 'iPhone 15 Pro en excelente condición.',
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
            contactType: 'whatsapp',
            contactValue: '',
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
            contactType: 'whatsapp',
            contactValue: '',
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
            contactType: 'whatsapp',
            contactValue: '',
            image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80',
            description: 'PlayStation 5.',
            views: 952,
            likes: 73,
            saves: 42,
            profileVisits: 25
        }
    ];

    saveProducts();
}

if (!config) {
    config = {
        paid: false,

        normal: {
            bank: 1500,
            binance: 30,
            paypal: 32
        },

        pro: {
            bank: 2500,
            binance: 45,
            paypal: 48
        },

        cheap: {
            bank: 800,
            binance: 18,
            paypal: 20
        },

        bankName: 'BanReservas',
        bankAccount: '',
        bankName2: 'BHD',
        bankAccount2: '',

        binanceAddress: '',
        paypalLink: ''
    };

    saveConfig();
}


/* =========================================================
   UTILIDADES
   ========================================================= */

function loadJSON(key, fallback) {
    try {
        const value = localStorage.getItem(key);

        if (!value) return fallback;

        return JSON.parse(value);
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


function saveConfig() {
    saveJSON(STORAGE_CONFIG, config);
}


function saveAds() {
    saveJSON(STORAGE_ADS, ads);
}


function money(value) {
    return new Intl.NumberFormat('es-DO', {
        style: 'currency',
        currency: 'DOP',
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}


function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function(char) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char];
    });
}


function normalizePhone(phone) {
    return String(phone || '').replace(/[^\d+]/g, '');
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

    window.marketFlashToast = setTimeout(function() {
        element.classList.add('hidden');
    }, 2500);
}


/* =========================================================
   SISTEMA DE PANTALLAS / ATRÁS
   ========================================================= */

/*
   Importante:
   Todas las ventanas se abren mediante showScreen().
   Esto permite que el botón atrás funcione correctamente.
*/

function getSheet() {
    return document.getElementById('sheet');
}


function getOverlay() {
    return document.getElementById('overlay');
}


function showScreen(html, options = {}) {
    const sheet = getSheet();
    const overlay = getOverlay();

    if (!sheet || !overlay) return;

    const {
        push = true,
        screen = 'modal',
        title = ''
    } = options;

    if (push && currentScreen !== screen) {
        navigationStack.push(currentScreen);
    }

    currentScreen = screen;

    sheet.innerHTML = html;
    overlay.classList.remove('hidden');

    if (title) {
        document.title = title + ' - Market Flash';
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}


function show(html) {
    showScreen(html, {
        push: true,
        screen: 'modal'
    });
}


/*
   Cierra completamente la ventana.
*/
function close() {
    const overlay = getOverlay();

    if (!overlay) return;

    overlay.classList.add('hidden');

    const sheet = getSheet();

    if (sheet) {
        sheet.innerHTML = '';
    }

    navigationStack = [];
    currentScreen = 'home';

    document.title = 'Market Flash';
}


/*
   Retrocede a la pantalla anterior.
*/
function goBack() {

    if (navigationStack.length === 0) {
        close();
        return;
    }

    const previous = navigationStack.pop();

    if (previous === 'home') {
        close();
        home();
        return;
    }

    /*
       Si existiera una pantalla almacenada,
       la reconstruimos.
    */

    if (previous === 'profile') {
        openProfile(false);
        return;
    }

    if (previous === 'activity') {
        openActivity(false);
        return;
    }

    if (previous === 'admin') {
        admin(false);
        return;
    }

    close();
}


/*
   Botón visual de atrás.
*/
function backButton() {
    return `
        <button
            class="close"
            type="button"
            onclick="goBack()"
            aria-label="Atrás"
            title="Atrás">
            ←
        </button>
    `;
}


/*
   Botón X que cierra correctamente.
*/
function closeButton() {
    return `
        <button
            class="close"
            type="button"
            onclick="close()"
            aria-label="Cerrar"
            title="Cerrar">
            ×
        </button>
    `;
}


/*
   Si se toca fuera de la ventana se cierra.
*/
document.addEventListener('DOMContentLoaded', function() {

    const overlay = document.getElementById('overlay');

    if (overlay) {
        overlay.addEventListener('click', function(event) {

            if (event.target === overlay) {
                close();
            }

        });
    }

});


/* =========================================================
   INICIO
   ========================================================= */

function render() {

    const search = document.getElementById('search');

    const query = search
        ? search.value.trim().toLowerCase()
        : '';

    let list = products.filter(function(product) {

        const matchesCategory =
            category === 'Todos' ||
            product.category === category;

        const matchesSearch =
            !query ||
            String(product.name).toLowerCase().includes(query) ||
            String(product.category).toLowerCase().includes(query) ||
            String(product.location).toLowerCase().includes(query);

        return matchesCategory && matchesSearch;
    });

    const count = document.getElementById('count');
    const box = document.getElementById('products');

    if (count) {
        count.textContent =
            list.length +
            ' ' +
            (list.length === 1 ? 'producto' : 'productos');
    }

    if (!box) return;

    if (!list.length) {

        box.innerHTML = `
            <div class="empty">
                <div style="font-size:44px">🔎</div>
                <h3>No encontramos productos</h3>
                <p>Prueba otra búsqueda o categoría.</p>
            </div>
        `;

        return;
    }

    box.innerHTML = list.map(function(product) {

        return `
            <article
                class="product"
                onclick="openProduct(${Number(product.id)})">

                <img
                    src="${escapeHtml(product.image)}"
                    alt="${escapeHtml(product.name)}"
                    onerror="this.style.objectFit='contain';this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22600%22%3E%3Crect width=%22100%25%22 height=%22100%25%22 fill=%22%23e2e8f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-size=%2260%22%3E📦%3C/text%3E%3C/svg%3E'">

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
}


function home() {

    close();

    category = 'Todos';

    document.querySelectorAll('.chip').forEach(function(button) {
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

    currentScreen = 'home';
    navigationStack = [];

    render();
}


function setCategory(selectedCategory, button) {

    category = selectedCategory;

    document.querySelectorAll('.chip').forEach(function(chip) {
        chip.classList.remove('active');
    });

    if (button) {
        button.classList.add('active');
    }

    render();
}


/* =========================================================
   BÚSQUEDA
   ========================================================= */

document.addEventListener('DOMContentLoaded', function() {

    const search = document.getElementById('search');

    if (search) {
        search.addEventListener('input', render);
    }

    render();
});


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function notifications() {

    const notificationsList =
        loadJSON(STORAGE_NOTIFICATIONS, []);

    showScreen(`
        <div class="modal-head">
            <h2>🔔 Notificaciones</h2>
            ${closeButton()}
        </div>

        ${
            notificationsList.length
            ?
            notificationsList.map(function(item) {
                return `
                    <div class="card" style="margin-bottom:10px">
                        <strong>${escapeHtml(item.title || 'Notificación')}</strong>
                        <div class="muted" style="margin-top:6px">
                            ${escapeHtml(item.message || '')}
                        </div>
                    </div>
                `;
            }).join('')
            :
            `
                <div class="notice">
                    No tienes notificaciones nuevas.
                </div>
            `
        }

        <button
            type="button"
            class="secondary"
            onclick="close()">
            Cerrar
        </button>
    `, {
        screen: 'notifications'
    });
}


/* =========================================================
   PRODUCTO
   ========================================================= */

function openProduct(id) {

    const product = products.find(function(item) {
        return Number(item.id) === Number(id);
    });

    if (!product) return;

    product.views = Number(product.views || 0) + 1;

    saveProducts();

    const contactButton = createContactButton(product);

    showScreen(`
        <div class="modal-head">

            <h2>
                ${escapeHtml(product.name)}
            </h2>

            ${closeButton()}

        </div>

        <div class="product-detail">

            <img
                src="${escapeHtml(product.image)}"
                alt="${escapeHtml(product.name)}">

            <div style="margin-top:14px">

                <div
                    class="price"
                    style="font-size:27px">

                    ${money(product.price)}

                </div>

                <div class="muted">
                    📍 ${escapeHtml(product.location)}
                </div>

            </div>

            <div
                class="card"
                style="margin-top:14px">

                <strong>👤 Vendedor</strong>

                <div
                    class="muted"
                    style="margin-top:4px">

                    ${escapeHtml(product.seller)}

                </div>

            </div>

            ${
                product.description
                ?
                `
                    <div
                        class="card"
                        style="margin-top:10px">

                        <strong>📝 Descripción</strong>

                        <div
                            class="muted"
                            style="margin-top:7px">

                            ${escapeHtml(product.description)}

                        </div>

                    </div>
                `
                : ''
            }

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
                type="button"
                class="primary"
                style="margin-top:14px"
                onclick="like(${Number(product.id)})">

                ❤️ Me interesa

            </button>

            ${contactButton}

        </div>
    `, {
        screen: 'product'
    });
}


/* =========================================================
   CONTACTO DEL VENDEDOR
   ========================================================= */

function createContactButton(product) {

    const type = product.contactType || 'whatsapp';

    if (type === 'whatsapp' && product.whatsapp) {

        return `
            <button
                type="button"
                class="primary"
                style="margin-top:8px;background:#25D366"
                onclick="contactWhatsApp('${escapeJs(product.whatsapp)}')">

                <span style="font-size:19px">💬</span>
                WhatsApp del vendedor

            </button>
        `;
    }

    if (type === 'messenger' && product.contactValue) {

        return `
            <button
                type="button"
                class="primary"
                style="margin-top:8px;background:#1877F2"
                onclick="openExternal('${escapeJs(product.contactValue)}')">

                💬 Messenger

            </button>
        `;
    }

    if (type === 'url' && product.contactValue) {

        return `
            <button
                type="button"
                class="primary"
                style="margin-top:8px"
                onclick="openExternal('${escapeJs(product.contactValue)}')">

                🔗 Visitar enlace

            </button>
        `;
    }

    return `
        <button
            type="button"
            class="secondary"
            style="margin-top:8px"
            onclick="contact('${escapeJs(product.seller)}')">

            📞 Contactar vendedor

        </button>
    `;
}


function escapeJs(value) {

    return String(value ?? '')
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'")
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r');
}


function like(id) {

    const product = products.find(function(item) {
        return Number(item.id) === Number(id);
    });

    if (!product) return;

    product.likes =
        Number(product.likes || 0) + 1;

    saveProducts();

    toast('❤️ Interés registrado');

    setTimeout(function() {
        openProduct(id);
    }, 100);
}


function contact(seller) {

    toast(
        'El contacto de ' +
        seller +
        ' estará disponible según la configuración del vendedor.'
    );
}


function contactWhatsApp(phone) {

    const cleanPhone = normalizePhone(phone);

    if (!cleanPhone) {
        toast('El vendedor no tiene WhatsApp configurado.');
        return;
    }

    const url =
        'https://wa.me/' +
        cleanPhone.replace('+', '');

    openExternal(url);
}


function openExternal(url) {

    if (!url) {
        toast('Enlace no disponible.');
        return;
    }

    if (!/^https?:\/\//i.test(url)) {
        url = 'https://' + url;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
}


/* =========================================================
   PUBLICAR PRODUCTO
   ========================================================= */

function openPublish() {

    showScreen(`
        <div class="modal-head">

            <h2>➕ Publicar producto</h2>

            ${closeButton()}

        </div>

        <form
            class="form"
            id="publishForm">

            <div class="field">
                <label>📸 Imagen</label>

                <input
                    id="pImage"
                    type="url"
                    placeholder="URL de la imagen">
            </div>

            <div class="field">
                <label>🏷️ Nombre</label>

                <input
                    id="pName"
                    required
                    placeholder="Ej. iPhone 15 Pro">
            </div>

            <div class="field">

                <label>📂 Categoría</label>

                <select
                    id="pCat"
                    required>

                    <option value="">
                        Seleccionar
                    </option>

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
                    required>

            </div>

            <div class="field">

                <label>📍 Ubicación</label>

                <input
                    id="pLoc"
                    required
                    placeholder="Ciudad o provincia">

            </div>

            <div class="field">

                <label>📝 Descripción</label>

                <textarea
                    id="pDesc"
                    placeholder="Describe el producto"></textarea>

            </div>

            <button
                type="submit"
                class="primary">

                🚀 Publicar

            </button>

        </form>
    `, {
        screen: 'publish'
    });

    const form = document.getElementById('publishForm');

    if (!form) return;

    form.addEventListener('submit', function(event) {

        event.preventDefault();

        if (!user) {

            toast(
                'Debes crear una cuenta o iniciar sesión.'
            );

            setTimeout(register, 400);

            return;
        }

        const image =
            document.getElementById('pImage').value.trim();

        const name =
            document.getElementById('pName').value.trim();

        const cat =
            document.getElementById('pCat').value;

        const price =
            Number(document.getElementById('pPrice').value);

        const loc =
            document.getElementById('pLoc').value.trim();

        const desc =
            document.getElementById('pDesc').value.trim();

        products.unshift({
            id: Date.now(),
            name: name,
            category: cat,
            price: price,
            location: loc,
            seller: user.name,
            whatsapp: user.whatsapp || '',
            contactType: 'whatsapp',
            contactValue: '',
            image: image,
            description: desc,
            views: 0,
            likes: 0,
            saves: 0,
            profileVisits: 0
        });

        saveProducts();

        close();

        render();

        toast('✅ Producto publicado correctamente.');
    });
}


/* =========================================================
   PERFIL
   ========================================================= */

function openProfile(push = true) {

    if (!user) {

        showScreen(`
            <div class="modal-head">

                <h2>👤 Mi cuenta</h2>

                ${closeButton()}

            </div>

            <div class="profile">

                <div class="avatar">
                    👤
                </div>

                <h3>
                    Bienvenido a Market Flash
                </h3>

                <p
                    class="muted"
                    style="margin:6px 0 16px">

                    Crea tu cuenta o inicia sesión.

                </p>

                <button
                    type="button"
                    class="primary"
                    onclick="register()">

                    📝 Crear cuenta

                </button>

                <button
                    type="button"
                    class="secondary"
                    style="margin-top:8px"
                    onclick="login()">

                    🔐 Iniciar sesión

                </button>

            </div>
        `, {
            screen: 'profile',
            push: push
        });

        return;
    }


    showScreen(`
        <div class="modal-head">

            <h2>👤 Mi perfil</h2>

            ${closeButton()}

        </div>

        <div class="profile">

            <div class="avatar">
                👤
            </div>

            <h2>
                ${escapeHtml(user.name)}
            </h2>

            <p class="muted">
                Cédula registrada
            </p>

            ${
                user.whatsapp
                ?
                `
                    <p
                        class="muted"
                        style="margin-top:6px">

                        💬 ${escapeHtml(user.whatsapp)}

                    </p>
                `
                : ''
            }

        </div>

        <div class="menu">

            <button
                type="button"
                class="menu-item"
                onclick="openActivity()">

                <div class="menu-icon">
                    📦
                </div>

                <div class="menu-copy">

                    <strong>
                        Mi actividad
                    </strong>

                    <small>
                        Publicaciones, productos, ventas y recibos
                    </small>

                </div>

                <b>›</b>

            </button>


            <button
                type="button"
                class="menu-item"
                onclick="settings()">

                <div class="menu-icon">
                    ⚙️
                </div>

                <div class="menu-copy">

                    <strong>
                        Configuración
                    </strong>

                    <small>
                        Cuenta y seguridad
                    </small>

                </div>

                <b>›</b>

            </button>


            <button
                type="button"
                class="menu-item"
                onclick="admin()">

                <div class="menu-icon">
                    👑
                </div>

                <div class="menu-copy">

                    <strong>
                        Administración
                    </strong>

                    <small>
                        Panel exclusivo del administrador
                    </small>

                </div>

                <b>›</b>

            </button>


            <button
                type="button"
                class="menu-item"
                onclick="logout()">

                <div class="menu-icon">
                    🚪
                </div>

                <div class="menu-copy">

                    <strong>
                        Cerrar sesión
                    </strong>

                    <small>
                        Salir de la cuenta
                    </small>

                </div>

                <b>›</b>

            </button>

        </div>
    `, {
        screen: 'profile',
        push: push
    });
}


/* =========================================================
   REGISTRO
   ========================================================= */

function register() {

    showScreen(`
        <div class="modal-head">

            <h2>📝 Crear cuenta</h2>

            ${backButton()}

        </div>

        <div class="notice">

            La cédula y el número de WhatsApp serán
            utilizados para identificar tu cuenta y
            facilitar tus publicaciones.

        </div>

        <form
            class="form"
            id="regForm">

            <div class="field">

                <label>
                    👤 Nombre real completo
                </label>

                <input
                    id="rName"
                    required
                    placeholder="Igual que en la cédula">

            </div>

            <div class="field">

                <label>
                    🪪 Número de cédula
                </label>

                <input
                    id="rCed"
                    required
                    placeholder="Número de cédula">

            </div>

            <div class="field">

                <label>
                    💬 Número de WhatsApp
                </label>

                <input
                    id="rWhatsapp"
                    type="tel"
                    required
                    placeholder="+18091234567">

            </div>

            <div class="field">

                <label>
                    🔐 Contraseña
                </label>

                <input
                    id="rPass"
                    type="password"
                    minlength="6"
                    required>

            </div>

            <div class="field">

                <label>
                    🛡️ Pregunta de recuperación
                </label>

                <select
                    id="rQ"
                    required>

                    <option value="">
                        Seleccionar
                    </option>

                    <option>
                        ¿Cuál era tu apodo de infancia?
                    </option>

                    <option>
                        ¿Cuál fue tu primer trabajo?
                    </option>

                    <option>
                        ¿Cuál es tu comida favorita?
                    </option>

                    <option>
                        ¿Cuál era el nombre de tu primera mascota?
                    </option>

                </select>

            </div>

            <div class="field">

                <label>
                    🛡️ Respuesta de recuperación
                </label>

                <input
                    id="rA"
                    required>

            </div>

            <div class="field">

                <label>
                    📧 Correo electrónico (opcional)
                </label>

                <input
                    id="rEmail"
                    type="email">

            </div>

            <button
                type="submit"
                class="primary">

                Crear cuenta

            </button>

        </form>
    `, {
        screen: 'register'
    });


    const form =
        document.getElementById('regForm');

    if (!form) return;


    form.addEventListener('submit', function(event) {

        event.preventDefault();

        const name =
            document.getElementById('rName').value.trim();

        const cedula =
            document.getElementById('rCed').value.trim();

        const whatsapp =
            document.getElementById('rWhatsapp').value.trim();

        const password =
            document.getElementById('rPass').value;

        const question =
            document.getElementById('rQ').value;

        const answer =
            document.getElementById('rA').value
                .trim()
                .toLowerCase();

        const email =
            document.getElementById('rEmail').value.trim();


        user = {
            name: name,
            cedula: cedula,
            whatsapp: whatsapp,
            password: password,
            question: question,
            answer: answer,
            email: email,
            blocked: false
        };


        saveJSON(STORAGE_USER, user);

        close();

        toast(
            '✅ Cuenta creada correctamente.'
        );
    });
}


/* =========================================================
   LOGIN
   ========================================================= */

function login() {

    showScreen(`
        <div class="modal-head">

            <h2>🔐 Iniciar sesión</h2>

            ${backButton()}

        </div>

        <form
            class="form"
            id="loginForm">

            <div class="field">

                <label>
                    🪪 Cédula
                </label>

                <input
                    id="lCed"
                    required>

            </div>

            <div class="field">

                <label>
                    🔐 Contraseña
                </label>

                <input
                    id="lPass"
                    type="password"
                    required>

            </div>

            <button
                type="submit"
                class="primary">

                Entrar

            </button>

        </form>

        <button
            type="button"
            class="secondary"
            style="margin-top:8px"
            onclick="recovery()">

            🔑 Recuperar contraseña

        </button>
    `, {
        screen: 'login'
    });


    const form =
        document.getElementById('loginForm');

    if (!form) return;


    form.addEventListener('submit', function(event) {

        event.preventDefault();

        const saved =
            loadJSON(STORAGE_USER, null);

        if (!saved) {

            toast(
                'No existe una cuenta.'
            );

            return;
        }

        if (saved.blocked) {

            toast(
                '🚫 Cuenta bloqueada por administración.'
            );

            return;
        }


        const cedula =
            document.getElementById('lCed')
                .value
                .trim();

        const password =
            document.getElementById('lPass')
                .value;


        if (
            saved.cedula === cedula &&
            saved.password === password
        ) {

            user = saved;

            close();

            toast(
                '✅ Sesión iniciada correctamente.'
            );

        } else {

            toast(
                '❌ Cédula o contraseña incorrecta.'
            );
        }
    });
}


/* =========================================================
   RECUPERACIÓN
   ========================================================= */

function recovery() {

    const saved =
        loadJSON(STORAGE_USER, null);

    if (!saved) {

        toast(
            'No existe una cuenta.'
        );

        return;
    }


    showScreen(`
        <div class="modal-head">

            <h2>
                🔑 Recuperar contraseña
            </h2>

            ${backButton()}

        </div>

        <div class="notice">

            ${escapeHtml(saved.question)}

        </div>

        <div class="field">

            <label>
                Respuesta
            </label>

            <input id="recA">

        </div>

        <button
            type="button"
            class="primary"
            style="margin-top:12px"
            onclick="verifyRecovery()">

            Verificar

        </button>
    `, {
        screen: 'recovery'
    });
}


function verifyRecovery() {

    const saved =
        loadJSON(STORAGE_USER, null);

    if (!saved) return;

    const input =
        document.getElementById('recA');

    if (!input) return;


    if (
        input.value
            .trim()
            .toLowerCase() === saved.answer
    ) {

        toast(
            '✅ Identidad verificada. La recuperación segura se conectará al backend.'
        );

    } else {

        toast(
            '❌ Respuesta incorrecta.'
        );
    }
}


/* =========================================================
   ACTIVIDAD
   ========================================================= */

function openActivity(push = true) {

    if (!user) {

        openProfile();

        return;
    }


    const navActivity =
        document.getElementById('navActivity');

    const navHome =
        document.getElementById('navHome');

    if (navActivity)
        navActivity.classList.add('active');

    if (navHome)
        navHome.classList.remove('active');


    const mine =
        products.filter(function(product) {
            return product.seller === user.name;
        });


    showScreen(`
        <div class="modal-head">

            <h2>
                📦 Mi actividad
            </h2>

            ${closeButton()}

        </div>

        <div class="grid">

            <button
                type="button"
                class="card"
                onclick="myPublications()">

                <div class="big">
                    📢
                </div>

                <strong>
                    Mis publicaciones
                </strong>

                <small>
                    Ver estadísticas y administrar
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="myProducts()">

                <div class="big">
                    📦
                </div>

                <strong>
                    Mis productos
                </strong>

                <small>
                    ${mine.length} productos
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="mySales()">

                <div class="big">
                    💰
                </div>

                <strong>
                    Mis ventas
                </strong>

                <small>
                    Registro de ventas
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="receipts()">

                <div class="big">
                    🧾
                </div>

                <strong>
                    Mis recibos
                </strong>

                <small>
                    Comprobantes
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="favorites()">

                <div class="big">
                    ❤️
                </div>

                <strong>
                    Favoritos
                </strong>

                <small>
                    Productos guardados
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="historyPage()">

                <div class="big">
                    📋
                </div>

                <strong>
                    Historial
                </strong>

                <small>
                    Actividad reciente
                </small>

            </button>

        </div>
    `, {
        screen: 'activity',
        push: push
    });
}


/* =========================================================
   MIS PUBLICACIONES
   ========================================================= */

function myPublications() {

    const mine =
        products.filter(function(product) {
            return user &&
                product.seller === user.name;
        });


    showScreen(`
        <div class="modal-head">

            <h2>
                📢 Mis publicaciones
            </h2>

            ${backButton()}

        </div>

        ${
            mine.length
            ?
            mine.map(function(product) {

                return `
                    <div
                        class="card"
                        style="margin-bottom:10px">

                        <strong>
                            ${escapeHtml(product.name)}
                        </strong>

                        <div
                            class="muted"
                            style="margin-top:6px">

                            👁️ ${product.views || 0}
                            ·
                            ❤️ ${product.likes || 0}
                            ·
                            🔖 ${product.saves || 0}
                            ·
                            👤 ${product.profileVisits || 0}

                        </div>

                        <button
                            type="button"
                            class="primary"
                            style="margin-top:10px"
                            onclick="statistics(${Number(product.id)})">

                            📊 Ver estadísticas

                        </button>

                        <button
                            type="button"
                            class="danger"
                            style="margin-top:8px"
                            onclick="deleteProduct(${Number(product.id)})">

                            🗑️ Eliminar publicación

                        </button>

                    </div>
                `;

            }).join('')
            :
            `
                <div class="empty">

                    📢

                    <br><br>

                    No tienes publicaciones.

                </div>
            `
        }
    `, {
        screen: 'myPublications'
    });
}


/* =========================================================
   ELIMINAR PUBLICACIÓN
   ========================================================= */

function deleteProduct(id) {

    const product =
        products.find(function(item) {
            return Number(item.id) === Number(id);
        });

    if (!product) return;


    const confirmed =
        window.confirm(
            '¿Seguro que deseas eliminar esta publicación?'
        );


    if (!confirmed) return;


    products =
        products.filter(function(item) {
            return Number(item.id) !== Number(id);
        });


    saveProducts();

    toast(
        '🗑️ Publicación eliminada.'
    );


    setTimeout(function() {
        myPublications();
    }, 150);
}


/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function statistics(id) {

    const product =
        products.find(function(item) {
            return Number(item.id) === Number(id);
        });

    if (!product) return;


    showScreen(`
        <div class="modal-head">

            <h2>
                📊 Estadísticas
            </h2>

            ${backButton()}

        </div>

        <h3>
            ${escapeHtml(product.name)}
        </h3>

        <div class="stats">

            <div class="stat">
                <b>${product.views || 0}</b>
                <span>
                    👁️ Visualizaciones
                </span>
            </div>

            <div class="stat">
                <b>${product.likes || 0}</b>
                <span>
                    ❤️ Reacciones
                </span>
            </div>

            <div class="stat">
                <b>${product.saves || 0}</b>
                <span>
                    🔖 Guardados
                </span>
            </div>

            <div class="stat">
                <b>${product.profileVisits || 0}</b>
                <span>
                    👤 Visitas al perfil
                </span>
            </div>

        </div>
    `, {
        screen: 'statistics'
    });
}


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

    showScreen(`
        <div class="modal-head">

            <h2>
                ${title}
            </h2>

            ${backButton()}

        </div>

        <div class="empty">

            ${escapeHtml(text)}

        </div>
    `, {
        screen: 'simple'
    });
}


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function settings() {

    showScreen(`
        <div class="modal-head">

            <h2>
                ⚙️ Configuración
            </h2>

            ${backButton()}

        </div>

        <div class="menu">

            <button
                type="button"
                class="menu-item"
                onclick="editProfile()">

                <div class="menu-icon">
                    👤
                </div>

                <div class="menu-copy">

                    <strong>
                        Editar perfil
                    </strong>

                    <small>
                        Modificar información personal
                    </small>

                </div>

                <b>›</b>

            </button>


            <button
                type="button"
                class="menu-item"
                onclick="changePass()">

                <div class="menu-icon">
                    🔐
                </div>

                <div class="menu-copy">

                    <strong>
                        Cambiar contraseña
                    </strong>

                    <small>
                        Actualizar contraseña
                    </small>

                </div>

                <b>›</b>

            </button>


            <button
                type="button"
                class="menu-item"
                onclick="securityPage()">

                <div class="menu-icon">
                    🛡️
                </div>

                <div class="menu-copy">

                    <strong>
                        Seguridad y recuperación
                    </strong>

                    <small>
                        Datos para recuperar la cuenta
                    </small>

                </div>

                <b>›</b>

            </button>


            <button
                type="button"
                class="menu-item"
                onclick="toast('📧 El correo es opcional')">

                <div class="menu-icon">
                    📧
                </div>

                <div class="menu-copy">

                    <strong>
                        Correo electrónico
                    </strong>

                    <small>
                        Opcional
                    </small>

                </div>

                <b>›</b>

            </button>

        </div>
    `, {
        screen: 'settings'
    });
}


function editProfile() {

    if (!user) return;

    showScreen(`
        <div class="modal-head">

            <h2>
                👤 Editar perfil
            </h2>

            ${backButton()}

        </div>

        <form
            class="form"
            id="editProfileForm">

            <div class="field">

                <label>
                    Nombre
                </label>

                <input
                    id="editName"
                    value="${escapeHtml(user.name)}"
                    required>

            </div>

            <div class="field">

                <label>
                    💬 WhatsApp
                </label>

                <input
                    id="editWhatsapp"
                    type="tel"
                    value="${escapeHtml(user.whatsapp || '')}"
                    required>

            </div>

            <div class="field">

                <label>
                    📧 Correo electrónico
                </label>

                <input
                    id="editEmail"
                    type="email"
                    value="${escapeHtml(user.email || '')}">

            </div>

            <button
                type="submit"
                class="primary">

                💾 Guardar cambios

            </button>

        </form>
    `, {
        screen: 'editProfile'
    });


    const form =
        document.getElementById(
            'editProfileForm'
        );

    if (!form) return;


    form.addEventListener('submit', function(event) {

        event.preventDefault();

        user.name =
            document.getElementById(
                'editName'
            ).value.trim();

        user.whatsapp =
            document.getElementById(
                'editWhatsapp'
            ).value.trim();

        user.email =
            document.getElementById(
                'editEmail'
            ).value.trim();


        saveJSON(
            STORAGE_USER,
            user
        );


        products.forEach(function(product) {

            if (
                product.seller === user.name
            ) {

                product.whatsapp =
                    user.whatsapp;
            }

        });

        saveProducts();

        toast(
            '✅ Perfil actualizado.'
        );

        setTimeout(function() {
            openProfile(false);
        }, 200);
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

function admin(push = true) {

    showScreen(`
        <div class="modal-head">

            <h2>
                👑 Administración
            </h2>

            ${closeButton()}

        </div>

        <div class="notice">

            Panel preparado para uso exclusivo del
            administrador. En la versión con backend
            se validará el rol real del administrador.

        </div>

        <div class="grid">

            <button
                type="button"
                class="card"
                onclick="adminUsers()">

                <div class="big">
                    👥
                </div>

                <strong>
                    Usuarios
                </strong>

                <small>
                    Gestionar cuentas
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="adminBlocked()">

                <div class="big">
                    🚫
                </div>

                <strong>
                    Bloqueos
                </strong>

                <small>
                    Bloquear usuarios
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="adminPosts()">

                <div class="big">
                    📢
                </div>

                <strong>
                    Publicaciones
                </strong>

                <small>
                    Moderación
                </small>

            </button>


            <!-- BOTÓN PUBLICITARIO -->

            <button
                type="button"
                class="card"
                onclick="adminAdvertising()">

                <div class="big">
                    📣
                </div>

                <strong>
                    Publicitario
                </strong>

                <small>
                    Crear, pagar y administrar anuncios
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="adminPayments()">

                <div class="big">
                    💳
                </div>

                <strong>
                    Pagos y membresías
                </strong>

                <small>
                    Métodos, precios y duración
                </small>

            </button>


            <button
                type="button"
                class="card"
                onclick="simple('📦 Inventario','Aquí se administrará el inventario.')">

                <div class="big">
                    📦
                </div>

                <strong>
                    Inventario
                </strong>

                <small>
                    Control de productos
                </small>

            </button>

        </div>
    `, {
        screen: 'admin',
        push: push
    });
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
        'Aquí el administrador podrá bloquear y mantener bloqueada una cuenta hasta autorizar su desbloqueo.'
    );
}


function adminPosts() {

    simple(
        '📢 Moderación',
        'Aquí se revisarán publicaciones, infracciones y reportes.'
    );
}


/* =========================================================
   PUBLICIDAD
   ========================================================= */

/*
   El administrador controla si la publicidad es:

   GRATIS
   o
   DE PAGO

   Y existen tres categorías:

   - Económico / Barato
   - Normal
   - Pro

   Cada categoría tiene precio diferente
   según el método de pago:
   - Banco
   - Binance
   - PayPal
*/


function adminAdvertising() {

    config =
        loadJSON(
            STORAGE_CONFIG,
            config
        );


    showScreen(`
        <div class="modal-head">

            <h2>
                📣 Publicidad
            </h2>

            ${closeButton()}

        </div>


        <div class="notice">

            Aquí puedes activar o desactivar el cobro
            por publicidad.

        </div>


        <div class="row">

            <div>

                <strong>
                    Cobrar por publicidad
                </strong>

                <div class="muted">
                    ${
                        config.paid
                        ?
                        'La publicidad está por pago.'
                        :
                        'La publicidad está gratuita.'
                    }
                </div>

            </div>


            <button
                id="adToggle"
                type="button"
                class="toggle ${config.paid ? 'on' : ''}"
                onclick="toggleAd()">

            </button>

        </div>


        <h3 style="margin:20px 0 10px">
            💰 Precio de publicidad
        </h3>


        <!-- BARATO -->

        <div class="card">

            <strong>
                🟢 Anuncio económico
            </strong>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    🏦 Banco
                </label>

                <input
                    id="cheapBank"
                    type="number"
                    value="${Number(config.cheap.bank)}">

            </div>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    ₿ Binance
                </label>

                <input
                    id="cheapBinance"
                    type="number"
                    value="${Number(config.cheap.binance)}">

            </div>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    🅿️ PayPal
                </label>

                <input
                    id="cheapPaypal"
                    type="number"
                    value="${Number(config.cheap.paypal)}">

            </div>

        </div>


        <!-- NORMAL -->

        <div
            class="card"
            style="margin-top:10px">

            <strong>
                🔵 Anuncio normal
            </strong>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    🏦 Banco
                </label>

                <input
                    id="normalBank"
                    type="number"
                    value="${Number(config.normal.bank)}">

            </div>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    ₿ Binance
                </label>

                <input
                    id="normalBinance"
                    type="number"
                    value="${Number(config.normal.binance)}">

            </div>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    🅿️ PayPal
                </label>

                <input
                    id="normalPaypal"
                    type="number"
                    value="${Number(config.normal.paypal)}">

            </div>

        </div>


        <!-- PRO -->

        <div
            class="card"
            style="margin-top:10px">

            <strong>
                🟣 Anuncio PRO
            </strong>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    🏦 Banco
                </label>

                <input
                    id="proBank"
                    type="number"
                    value="${Number(config.pro.bank)}">

            </div>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    ₿ Binance
                </label>

                <input
                    id="proBinance"
                    type="number"
                    value="${Number(config.pro.binance)}">

            </div>

            <div
                class="field"
                style="margin-top:10px">

                <label>
                    🅿️ PayPal
                </label>

                <input
                    id="proPaypal"
                    type="number"
                    value="${Number(config.pro.paypal)}">

            </div>

        </div>


        <h3 style="margin:20px 0 10px">
            🏦 Datos de pago
        </h3>


        <div class="field">

            <label>
                🏦 BanReservas
            </label>

            <input
                id="bankAccount"
                value="${escapeHtml(config.bankAccount || '')}"
                placeholder="Número de cuenta">

        </div>


        <div
            class="field"
            style="margin-top:10px">

            <label>
                🏦 BHD
            </label>

            <input
                id="bankAccount2"
                value="${escapeHtml(config.bankAccount2 || '')}"
                placeholder="Número de cuenta">

        </div>


        <div
            class="field"
            style="margin-top:10px">

            <label>
                ₿ Binance
            </label>

            <input
                id="binanceAddress"
                value="${escapeHtml(config.binanceAddress || '')}"
                placeholder="Dirección o enlace">

        </div>


        <div
            class="field"
            style="margin-top:10px">

            <label>
                🅿️ PayPal
            </label>

            <input
                id="paypalLink"
                value="${escapeHtml(config.paypalLink || '')}"
                placeholder="Enlace de pago">

        </div>


        <button
            type="button"
            class="primary"
            style="margin-top:14px"
            onclick="saveAdConfig()">

            💾 Guardar configuración

        </button>
    `, {
        screen: 'adminAdvertising'
    });
}


function toggleAd() {

    config =
        loadJSON(
            STORAGE_CONFIG,
            config
        );

    config.paid =
        !Boolean(config.paid);

    saveConfig();

    const toggle =
        document.getElementById('adToggle');

    if (toggle) {
        toggle.classList.toggle(
            'on',
            config.paid
        );
    }

    toast(
        config.paid
        ?
        '💰 Publicidad de pago activada.'
        :
        '🆓 Publicidad gratuita activada.'
    );
}


function saveAdConfig() {

    const getNumber = function(id, fallback) {

        const element =
            document.getElementById(id);

        if (!element) return fallback;

        const value =
            Number(element.value);

        return Number.isFinite(value)
            ? value
            : fallback;
    };


    config.cheap.bank =
        getNumber(
            'cheapBank',
            config.cheap.bank
        );

    config.cheap.binance =
        getNumber(
            'cheapBinance',
            config.cheap.binance
        );

    config.cheap.paypal =
        getNumber(
            'cheapPaypal',
            config.cheap.paypal
        );


    config.normal.bank =
        getNumber(
            'normalBank',
            config.normal.bank
        );

    config.normal.binance =
        getNumber(
            'normalBinance',
            config.normal.binance
        );

    config.normal.paypal =
        getNumber(
            'normalPaypal',
            config.normal.paypal
        );


    config.pro.bank =
        getNumber(
            'proBank',
            config.pro.bank
        );

    config.pro.binance =
        getNumber(
            'proBinance',
            config.pro.binance
        );

    config.pro.paypal =
        getNumber(
            'proPaypal',
            config.pro.paypal
        );


    const bankAccount =
        document.getElementById(
            'bankAccount'
        );

    const bankAccount2 =
        document.getElementById(
            'bankAccount2'
        );

    const binanceAddress =
        document.getElementById(
            'binanceAddress'
        );

    const paypalLink =
        document.getElementById(
            'paypalLink'
        );


    if (bankAccount)
        config.bankAccount =
            bankAccount.value.trim();

    if (bankAccount2)
        config.bankAccount2 =
            bankAccount2.value.trim();

    if (binanceAddress)
        config.binanceAddress =
            binanceAddress.value.trim();

    if (paypalLink)
        config.paypalLink =
            paypalLink.value.trim();


    saveConfig();

    toast(
        '✅ Configuración de publicidad guardada.'
    );
}


/* =========================================================
   PUBLICAR ANUNCIO PUBLICITARIO
   ========================================================= */

function openAdvertising() {

    if (!user) {

        toast(
            'Debes iniciar sesión para publicar publicidad.'
        );

        setTimeout(function() {
            login();
        }, 400);

        return;
    }


    config =
        loadJSON(
            STORAGE_CONFIG,
            config
        );


    showScreen(`
        <div class="modal-head">

            <h2>
                📣 Crear publicidad
            </h2>

            ${closeButton()}

        </div>


        <div class="notice">

            ${
                config.paid
                ?
                'La publicidad está actualmente por pago.'
                :
                'La publicidad está actualmente gratuita.'
            }

        </div>


        <form
            class="form"
            id="advertisingForm">


            <div class="field">

                <label>
                    🎬 Video del anuncio
                </label>

                <input
                    id="adVideo"
                    type="url"
                    required
                    placeholder="URL del video">

            </div>


            <div class="field">

                <label>
                    📝 Título del anuncio
                </label>

                <input
                    id="adTitle"
                    required
                    placeholder="Nombre de tu publicidad">

            </div>


            <div class="field">

                <label>
                    📄 Descripción
                </label>

                <textarea
                    id="adDescription"
                    placeholder="Describe tu publicidad"></textarea>

            </div>


            <div class="field">

                <label>
                    ⭐ Categoría de publicidad
                </label>

                <select
                    id="adPlan"
                    required>

                    <option value="">
                        Seleccionar
                    </option>

                    <option value="cheap">
                        🟢 Anuncio económico
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

                <label>
                    📲 ¿Dónde quieres recibir al cliente?
                </label>

                <select
                    id="adContactType"
                    required
                    onchange="updateAdvertisingContactField()">

                    <option value="whatsapp">
                        💚 WhatsApp
                    </option>

                    <option value="messenger">
                        💙 Messenger
                    </option>

                    <option value="url">
                        🔗 Página / URL
                    </option>

                </select>

            </div>


            <div
                class="field"
                id="advertisingContactField">

                <label>
                    💚 Número de WhatsApp
                </label>

                <input
                    id="adContactValue"
                    type="tel"
                    value="${escapeHtml(user.whatsapp || '')}"
                    placeholder="+18091234567">

            </div>


            <button
                type="submit"
                class="primary">

                🚀 Continuar

            </button>

        </form>
    `, {
        screen: 'createAdvertising'
    });


    const form =
        document.getElementById(
            'advertisingForm'
        );

    if (!form) return;


    form.addEventListener('submit', function(event) {

        event.preventDefault();

        createAdvertisingPayment();
    });
}


function updateAdvertisingContactField() {

    const type =
        document.getElementById(
            'adContactType'
        );

    const input =
        document.getElementById(
            'adContactValue'
        );

    const label =
        document.querySelector(
            '#advertisingContactField label'
        );


    if (!type || !input || !label) return;


    if (type.value === 'whatsapp') {

        label.textContent =
            '💚 Número de WhatsApp';

        input.type = 'tel';

        input.placeholder =
            '+18091234567';

        input.value =
            user?.whatsapp || '';

    }


    if (type.value === 'messenger') {

        label.textContent =
            '💙 URL de Messenger';

        input.type = 'url';

        input.placeholder =
            'https://m.me/tuPagina';

        input.value = '';

    }


    if (type.value === 'url') {

        label.textContent =
            '🔗 URL donde quieres enviar al cliente';

        input.type = 'url';

        input.placeholder =
            'https://tusitio.com';

        input.value = '';

    }
}


/* =========================================================
   PROCESO DE PAGO DEL ANUNCIO
   ========================================================= */

function createAdvertisingPayment() {

    const video =
        document.getElementById(
            'adVideo'
        ).value.trim();

    const title =
        document.getElementById(
            'adTitle'
        ).value.trim();

    const description =
        document.getElementById(
            'adDescription'
        ).value.trim();

    const plan =
        document.getElementById(
            'adPlan'
        ).value;

    const contactType =
        document.getElementById(
            'adContactType'
        ).value;

    const contactValue =
        document.getElementById(
            'adContactValue'
        ).value.trim();


    if (!video || !title || !plan) {

        toast(
            'Completa todos los campos obligatorios.'
        );

        return;
    }


    if (
        contactType === 'whatsapp' &&
        !contactValue
    ) {

        toast(
            'Debes colocar tu número de WhatsApp.'
        );

        return;
    }


    if (
        contactType !== 'whatsapp' &&
        !contactValue
    ) {

        toast(
            'Debes colocar el enlace de contacto.'
        );

        return;
    }


    const newAd = {

        id: Date.now(),

        owner: user.name,

        whatsapp: user.whatsapp || '',

        video: video,

        title: title,

        description: description,

        plan: plan,

        contactType: contactType,

        contactValue: contactValue,

        status:
            config.paid
            ?
            'pending_payment'
            :
            'pending_approval',

        paymentMethod: '',

        paymentAmount: 0,

        paymentProof: '',

        createdAt:
            new Date().toISOString()
    };


    ads.unshift(newAd);

    saveAds();


    if (!config.paid) {

        toast(
            '✅ Publicidad enviada para aprobación.'
        );

        setTimeout(function() {

            close();

        }, 700);

        return;
    }


    advertisingPaymentScreen(newAd.id);
}


/* =========================================================
   PANTALLA DE PAGO DE PUBLICIDAD
   ========================================================= */

function advertisingPaymentScreen(adId) {

    const ad =
        ads.find(function(item) {
            return Number(item.id) === Number(adId);
        });

    if (!ad) return;


    const prices =
        config[ad.plan];


    showScreen(`
        <div class="modal-head">

            <h2>
                💳 Pago de publicidad
            </h2>

            ${backButton()}

        </div>


        <div class="notice">

            Selecciona el método de pago.
            Cada método tiene su propio precio.

        </div>


        <div class="card">

            <strong>
                🟢 Banco
            </strong>

            <div
                style="font-size:22px;font-weight:900;margin-top:6px">

                ${money(prices.bank)}

            </div>

            <small class="muted">

                ${
                    escapeHtml(
                        config.bankName ||
                        'Cuenta bancaria'
                    )
                }

            </small>

        </div>


        <div
            class="card"
            style="margin-top:10px">

            <strong>
                ₿ Binance
            </strong>

            <div
                style="font-size:22px;font-weight:900;margin-top:6px">

                US$ ${Number(prices.binance).toFixed(2)}

            </div>

        </div>


        <div
            class="card"
            style="margin-top:10px">

            <strong>
                🅿️ PayPal
            </strong>

            <div
                style="font-size:22px;font-weight:900;margin-top:6px">

                US$ ${Number(prices.paypal).toFixed(2)}

            </div>

        </div>


        <h3 style="margin:20px 0 10px">
            Método de pago
        </h3>


        <select
            id="advertisingPaymentMethod"
            class="field input"
            style="width:100%;padding:12px;border:1px solid #dbe1e8;border-radius:12px">

            <option value="">
                Seleccionar método
            </option>

            <option value="bank">
                🏦 Cuenta bancaria
            </option>

            <option value="binance">
                ₿ Binance
            </option>

            <option value="paypal">
                🅿️ PayPal
            </option>

        </select>


        <div
            class="field"
            style="margin-top:12px">

            <label>
                📸 Captura / comprobante de pago
            </label>

            <input
                id="advertisingProof"
                type="file"
                accept="image/*">

        </div>


        <button
            type="button"
            class="primary"
            style="margin-top:14px"
            onclick="submitAdvertisingPayment(${Number(adId)})">

            📤 Enviar comprobante

        </button>
    `, {
        screen: 'advertisingPayment'
    });
}


/* =========================================================
   ENVIAR COMPROBANTE
   ========================================================= */

function submitAdvertisingPayment(adId) {

    const ad =
        ads.find(function(item) {
            return Number(item.id) === Number(adId);
        });

    if (!ad) return;


    const method =
        document.getElementById(
            'advertisingPaymentMethod'
        ).value;


    if (!method) {

        toast(
            'Selecciona un método de pago.'
        );

        return;
    }


    const prices =
        config[ad.plan];


    let amount = 0;


    if (method === 'bank') {
        amount = prices.bank;
    }

    if (method === 'binance') {
        amount = prices.binance;
    }

    if (method === 'paypal') {
        amount = prices.paypal;
    }


    const proof =
        document.getElementById(
            'advertisingProof'
        );


    ad.paymentMethod = method;

    ad.paymentAmount = amount;

    /*
       El archivo real se conectará al backend/storage.
       Guardamos por ahora el nombre del archivo.
    */

    if (
        proof &&
        proof.files &&
        proof.files.length
    ) {

        ad.paymentProof =
            proof.files[0].name;
    }


    ad.status =
        'pending_approval';


    saveAds();


    toast(
        '✅ Comprobante enviado al panel del administrador.'
    );


    setTimeout(function() {

        close();

    }, 800);
}


/* =========================================================
   PANEL DE ANUNCIOS DEL ADMINISTRADOR
   ========================================================= */

function adminAdvertisingRequests() {

    const pending =
        ads.filter(function(ad) {

            return (
                ad.status ===
                'pending_approval'
            );

        });


    showScreen(`
        <div class="modal-head">

            <h2>
                📋 Publicidades recibidas
            </h2>

            ${backButton()}

        </div>


        ${
            pending.length
            ?
            pending.map(function(ad) {

                return `
                    <div
                        class="card"
                        style="margin-bottom:10px">

                        <strong>
                            ${escapeHtml(ad.title)}
                        </strong>

                        <div
                            class="muted"
                            style="margin-top:6px">

                            👤 ${escapeHtml(ad.owner)}

                            <br>

                            ⭐ Plan:
                            ${escapeHtml(ad.plan)}

                            <br>

                            💳 Método:
                            ${escapeHtml(ad.paymentMethod || 'N/A')}

                            <br>

                            💰 Monto:
                            ${ad.paymentAmount || 0}

                            <br>

                            📎 Comprobante:
                            ${escapeHtml(ad.paymentProof || 'No indicado')}

                        </div>


                        <button
                            type="button"
                            class="primary"
                            style="margin-top:10px"
                            onclick="approveAdvertising(${Number(ad.id)})">

                            ✅ Aprobar publicidad

                        </button>


                        <button
                            type="button"
                            class="danger"
                            style="margin-top:8px"
                            onclick="rejectAdvertising(${Number(ad.id)})">

                            ❌ Rechazar

                        </button>

                    </div>
                `;

            }).join('')
            :
            `
                <div class="empty">

                    📣

                    <br><br>

                    No hay publicidades pendientes.

                </div>
            `
        }
    `, {
        screen: 'adminAdvertisingRequests'
    });
}


function approveAdvertising(adId) {

    const ad =
        ads.find(function(item) {
            return Number(item.id) === Number(adId);
        });

    if (!ad) return;


    ad.status =
        'approved';


    saveAds();


    toast(
        '✅ Publicidad aprobada.'
    );


    setTimeout(
        adminAdvertisingRequests,
        300
    );
}


function rejectAdvertising(adId) {

    const ad =
        ads.find(function(item) {
            return Number(item.id) === Number(adId);
        });

    if (!ad) return;


    ad.status =
        'rejected';


    saveAds();


    toast(
        '❌ Publicidad rechazada.'
    );


    setTimeout(
        adminAdvertisingRequests,
        300
    );
}


/* =========================================================
   PUBLICIDADES ACTIVAS EN EL INICIO
   ========================================================= */

function getApprovedAds() {

    return ads.filter(function(ad) {

        return ad.status === 'approved';

    });
}


function renderAdvertisingArea() {

    const area =
        document.querySelector('.ad');

    if (!area) return;


    const approved =
        getApprovedAds();


    /*
       Si no hay anuncios pagados/aprobados,
       se mantiene el espacio publicitario.
    */

    if (!approved.length) {

        area.innerHTML = `
            <div>

                <small>
                    ESPACIO PUBLICITARIO
                </small>

                <h3>
                    📣 Publicidad Market Flash
                </h3>

                <p>
                    Aquí aparecerán los anuncios comerciales.
                </p>

            </div>
        `;

        /*
           Convertimos el espacio publicitario
           en botón para publicar.
        */

        area.style.cursor = 'pointer';

        area.onclick =
            openAdvertising;

        return;
    }


    const ad =
        approved[0];


    area.innerHTML = `
        <div
            style="width:100%">

            <small>
                PUBLICIDAD
            </small>

            <h3>
                ${escapeHtml(ad.title)}
            </h3>

            <p>
                ${escapeHtml(ad.description || '')}
            </p>

            <button
                type="button"
                class="primary"
                style="margin-top:10px"
                onclick="event.stopPropagation();openAdvertisement(${Number(ad.id)})">

                Ver publicidad

            </button>

        </div>
    `;


    area.style.cursor =
        'pointer';


    area.onclick =
        function() {
            openAdvertisement(ad.id);
        };
}


/* =========================================================
   ABRIR PUBLICIDAD
   ========================================================= */

function openAdvertisement(adId) {

    const ad =
        ads.find(function(item) {
            return Number(item.id) === Number(adId);
        });


    if (!ad) return;


    showScreen(`
        <div class="modal-head">

            <h2>
                📣 ${escapeHtml(ad.title)}
            </h2>

            ${closeButton()}

        </div>


        <div class="product-detail">

            <div
                style="
                    background:#111827;
                    border-radius:18px;
                    padding:20px;
                    color:white;
                    text-align:center;
                ">

                🎬

                <div
                    style="margin-top:10px;font-weight:800">

                    Video publicitario

                </div>

                <button
                    type="button"
                    class="primary"
                    style="margin-top:12px"
                    onclick="openExternal('${escapeJs(ad.video)}')">

                    ▶️ Ver video

                </button>

            </div>


            ${
                ad.description
                ?
                `
                    <div
                        class="card"
                        style="margin-top:12px">

                        ${escapeHtml(ad.description)}

                    </div>
                `
                : ''
            }


            <button
                type="button"
                class="primary"
                style="margin-top:14px;background:#25D366"
                onclick="advertisementContact(${Number(ad.id)})">

                💚 Contactar anunciante

            </button>

        </div>
    `, {
        screen: 'advertisement'
    });
}


/* =========================================================
   CONTACTAR AL ANUNCIANTE
   ========================================================= */

function advertisementContact(adId) {

    const ad =
        ads.find(function(item) {
            return Number(item.id) === Number(adId);
        });


    if (!ad) return;


    if (
        ad.contactType ===
        'whatsapp'
    ) {

        contactWhatsApp(
            ad.contactValue ||
            ad.whatsapp
        );

        return;
    }


    if (
        ad.contactType ===
        'messenger'
    ) {

        openExternal(
            ad.contactValue
        );

        return;
    }


    if (
        ad.contactType ===
        'url'
    ) {

        openExternal(
            ad.contactValue
        );

        return;
    }


    toast(
        'El anunciante no tiene un medio de contacto configurado.'
    );
}


/* =========================================================
   PAGOS Y MEMBRESÍAS
   ========================================================= */

function adminPayments() {

    showScreen(`
        <div class="modal-head">

            <h2>
                💳 Pagos y membresías
            </h2>

            ${backButton()}

        </div>


        <div class="notice">

            Aquí puedes configurar los métodos
            de pago de la plataforma.

        </div>


        <div class="field">

            <label>
                🏦 BanReservas — número de cuenta
            </label>

            <input
                id="membershipBank"
                value="${escapeHtml(config.bankAccount || '')}"
                placeholder="Número de cuenta">

        </div>


        <div
            class="field"
            style="margin-top:12px">

            <label>
                🏦 BHD — número de cuenta
            </label>

            <input
                id="membershipBank2"
                value="${escapeHtml(config.bankAccount2 || '')}"
                placeholder="Número de cuenta">

        </div>


        <div
            class="field"
            style="margin-top:12px">

            <label>
                ₿ Binance
            </label>

            <input
                id="membershipBinance"
                value="${escapeHtml(config.binanceAddress || '')}"
                placeholder="Dirección o enlace">

        </div>


        <div
            class="field"
            style="margin-top:12px">

            <label>
                🅿️ PayPal
            </label>

            <input
                id="membershipPaypal"
                value="${escapeHtml(config.paypalLink || '')}"
                placeholder="Enlace">

        </div>


        <button
            type="button"
            class="primary"
            style="margin-top:14px"
            onclick="saveMembershipConfig()">

            💾 Guardar

        </button>
    `, {
        screen: 'adminPayments'
    });
}


function saveMembershipConfig() {

    const bank =
        document.getElementById(
            'membershipBank'
        );

    const bank2 =
        document.getElementById(
            'membershipBank2'
        );

    const binance =
        document.getElementById(
            'membershipBinance'
        );

    const paypal =
        document.getElementById(
            'membershipPaypal'
        );


    if (bank)
        config.bankAccount =
            bank.value.trim();

    if (bank2)
        config.bankAccount2 =
            bank2.value.trim();

    if (binance)
        config.binanceAddress =
            binance.value.trim();

    if (paypal)
        config.paypalLink =
            paypal.value.trim();


    saveConfig();

    toast(
        '✅ Configuración de pagos guardada.'
    );
}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

function logout() {

    user = null;

    localStorage.removeItem(
        STORAGE_USER
    );

    close();

    toast(
        'Sesión cerrada correctamente.'
    );
}


/* =========================================================
   BOTÓN PUBLICITARIO DESDE EL ESPACIO DE PUBLICIDAD
   ========================================================= */

function setupAdvertisingButton() {

    const adArea =
        document.querySelector('.ad');

    if (!adArea) return;


    adArea.setAttribute(
        'role',
        'button'
    );

    adArea.setAttribute(
        'tabindex',
        '0'
    );


    adArea.addEventListener(
        'keydown',
        function(event) {

            if (
                event.key ===
                'Enter' ||
                event.key ===
                ' '
            ) {

                event.preventDefault();

                openAdvertising();
            }
        }
    );
}


/* =========================================================
   INICIALIZACIÓN
   ========================================================= */

document.addEventListener(
    'DOMContentLoaded',
    function() {

        render();

        setupAdvertisingButton();

        renderAdvertisingArea();

    }
);


/*
   También ejecutamos por si el script se carga
   después de que el HTML ya esté disponible.
*/

if (
    document.readyState ===
    'complete' ||
    document.readyState ===
    'interactive'
) {

    setTimeout(function() {

        render();

        setupAdvertisingButton();

        renderAdvertisingArea();

    }, 50);
}


/* =========================================================
   EXPORTACIÓN GLOBAL
   =========================================================

   Esto garantiza que los onclick="" que ya existen
   en tu HTML puedan encontrar las funciones.

   ========================================================= */

window.home = home;
window.close = close;
window.goBack = goBack;
window.notifications = notifications;
window.openProfile = openProfile;
window.openPublish = openPublish;
window.openActivity = openActivity;
window.openProduct = openProduct;
window.setCategory = setCategory;
window.like = like;
window.contact = contact;
window.contactWhatsApp = contactWhatsApp;
window.openExternal = openExternal;

window.register = register;
window.login = login;
window.recovery = recovery;
window.verifyRecovery = verifyRecovery;

window.myPublications = myPublications;
window.myProducts = myProducts;
window.mySales = mySales;
window.receipts = receipts;
window.favorites = favorites;
window.historyPage = historyPage;
window.statistics = statistics;
window.deleteProduct = deleteProduct;

window.settings = settings;
window.editProfile = editProfile;
window.changePass = changePass;
window.securityPage = securityPage;

window.admin = admin;
window.adminUsers = adminUsers;
window.adminBlocked = adminBlocked;
window.adminPosts = adminPosts;
window.adminAdvertising = adminAdvertising;
window.adminPayments = adminPayments;

window.toggleAd = toggleAd;
window.saveAdConfig = saveAdConfig;

window.openAdvertising = openAdvertising;
window.updateAdvertisingContactField =
    updateAdvertisingContactField;

window.createAdvertisingPayment =
    createAdvertisingPayment;

window.advertisingPaymentScreen =
    advertisingPaymentScreen;

window.submitAdvertisingPayment =
    submitAdvertisingPayment;

window.adminAdvertisingRequests =
    adminAdvertisingRequests;

window.approveAdvertising =
    approveAdvertising;

window.rejectAdvertising =
    rejectAdvertising;

window.openAdvertisement =
    openAdvertisement;

window.advertisementContact =
    advertisementContact;

window.saveMembershipConfig =
    saveMembershipConfig;

window.logout = logout;
