/* =========================================================
   MARKET FLASH
   SCRIPT.JS
   VERSION LIMPIA + SUPABASE
   ========================================================= */

"use strict";

/* =========================================================
   1. SUPABASE
   ========================================================= */

const MARKET_FLASH_URL =
    "https://osxuhmgnpgbxfopqdhqr.supabase.co";

const MARKET_FLASH_KEY =
    "sb_publishable_6qLmRFGHrwGq_CKqsIH7jA_Oz8TTlQZ";

const marketFlashClient =
    window.supabase.createClient(
        MARKET_FLASH_URL,
        MARKET_FLASH_KEY
    );


/* =========================================================
   2. CONFIGURACIÓN
   ========================================================= */

const APP = {

    publicationFee: 100,

    publicationMode: "paid",

    promotionsActive: true,

    supportWhatsApp: "",

    supportMessenger: "",

    binanceAddress: "",

    paypalAccount: ""

};


/* =========================================================
   3. ESTADO
   ========================================================= */

const STATE = {

    user: null,

    profile: null,

    isAdmin: false,

    products: [],

    favorites: new Set(),

    selectedProduct: null,

    selectedCategory: "Todos",

    search: "",

    currentPage: "inicio"

};


/* =========================================================
   4. UTILIDADES
   ========================================================= */

function $(selector) {
    return document.querySelector(selector);
}


function $all(selector) {
    return Array.from(
        document.querySelectorAll(selector)
    );
}


function message(
    text,
    type = "info"
) {

    const box =
        $("#app-message");

    if (!box) {

        alert(text);

        return;

    }

    box.textContent =
        text;

    box.className =
        "app-message show";

    if (type === "success") {
        box.classList.add("success");
    }

    if (type === "error") {
        box.classList.add("error");
    }

    if (type === "warning") {
        box.classList.add("warning");
    }

    clearTimeout(
        box._timer
    );

    box._timer =
        setTimeout(
            () => {

                box.classList.remove(
                    "show"
                );

            },
            4000
        );

}


function formatPrice(value) {

    const number =
        Number(value);

    if (
        Number.isNaN(number)
    ) {

        return "0.00";

    }

    return number.toLocaleString(
        "es-DO",
        {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }
    );

}


function formatDate(value) {

    if (!value) {
        return "";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "";

    }

    return date.toLocaleString(
        "es-DO",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );

}


/* =========================================================
   5. NAVEGACIÓN
   ========================================================= */

const PAGES = [
    "inicio",
    "categorias",
    "registro",
    "inicio-sesion",
    "publicar",
    "pago",
    "perfil",
    "promocionar",
    "videos",
    "notificaciones",
    "calificaciones",
    "reclamos",
    "soporte",
    "contactar-vendedor",
    "administrador",
    "politicas"
];


function showPage(
    pageId
) {

    PAGES.forEach(
        id => {

            const page =
                document.getElementById(id);

            if (!page) {
                return;
            }

            page.classList.toggle(
                "active",
                id === pageId
            );

        }
    );


    $all("[data-section]")
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section ===
                    pageId
                );

            }
        );


    STATE.currentPage =
        pageId;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (
        pageId === "perfil"
    ) {

        if (!STATE.user) {

            showPage(
                "inicio-sesion"
            );

            message(
                "Debes iniciar sesión para entrar a tu perfil.",
                "warning"
            );

            return;

        }

        renderProfile();
        renderMyProducts();
        renderFavorites();
        renderSoldProducts();

    }


    if (
        pageId === "administrador"
    ) {

        if (!STATE.isAdmin) {

            showPage("inicio");

            message(
                "No tienes permisos de administrador.",
                "error"
            );

            return;

        }

        loadAdmin();

    }


    if (
        pageId === "notificaciones"
    ) {

        loadNotifications();

    }

}


function setupNavigation() {

    $all("[data-section]")
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    () => {

                        const target =
                            button.dataset.section;


                        if (
                            target ===
                            "publicar" &&
                            !STATE.user
                        ) {

                            message(
                                "Inicia sesión para publicar.",
                                "warning"
                            );

                            showPage(
                                "inicio-sesion"
                            );

                            return;

                        }


                        showPage(
                            target
                        );

                    }
                );

            }
        );

}


/* =========================================================
   6. BOTONES DEL ENCABEZADO
   ========================================================= */

function setupHeader() {

    $("#btn-registrarse")
        ?.addEventListener(
            "click",
            () => {

                showPage(
                    "registro"
                );

            }
        );


    $("#btn-iniciar-sesion")
        ?.addEventListener(
            "click",
            () => {

                showPage(
                    "inicio-sesion"
                );

            }
        );


    $("#btn-perfil")
        ?.addEventListener(
            "click",
            () => {

                if (!STATE.user) {

                    showPage(
                        "inicio-sesion"
                    );

                    return;

                }

                showPage(
                    "perfil"
                );

            }
        );

}


/* =========================================================
   7. REGISTRO
   ========================================================= */

async function register(
    event
) {

    event.preventDefault();


    const form =
        event.currentTarget;


    const name =
        $("#registro-nombre")
            ?.value
            .trim();


    const email =
        $("#registro-correo")
            ?.value
            .trim();


    const documento =
        $("#registro-documento")
            ?.value
            .trim();


    const phone =
        $("#registro-telefono")
            ?.value
            .trim();


    const whatsapp =
        $("#registro-whatsapp")
            ?.value
            .trim();


    const messenger =
        $("#registro-messenger")
            ?.value
            .trim();


    const password =
        $("#registro-password")
            ?.value;


    if (
        !name ||
        !email ||
        !documento ||
        !phone ||
        !password
    ) {

        message(
            "Completa todos los campos obligatorios.",
            "warning"
        );

        return;

    }


    if (
        password.length < 6
    ) {

        message(
            "La contraseña debe tener al menos 6 caracteres.",
            "warning"
        );

        return;

    }


    const button =
        form.querySelector(
            'button[type="submit"]'
        );


    if (button) {
        button.disabled = true;
    }


    try {

        const result =
            await marketFlashClient.auth.signUp({

                email: email,

                password: password,

                options: {

                    data: {

                        full_name:
                            name,

                        documento:
                            documento,

                        phone:
                            phone,

                        whatsapp:
                            whatsapp,

                        messenger:
                            messenger

                    }

                }

            });


        if (
            result.error
        ) {

            throw result.error;

        }


        form.reset();


        if (
            result.data.session
        ) {

            message(
                "Cuenta creada correctamente.",
                "success"
            );

            showPage(
                "inicio"
            );

        } else {

            message(
                "Cuenta creada. Revisa tu correo para confirmar la cuenta.",
                "success"
            );

            showPage(
                "inicio-sesion"
            );

        }

    } catch (error) {

        console.error(
            "Registro:",
            error
        );

        message(
            error.message ||
            "No se pudo crear la cuenta.",
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


/* =========================================================
   8. INICIO DE SESIÓN
   ========================================================= */

async function login(
    event
) {

    event.preventDefault();


    const email =
        $("#login-correo")
            ?.value
            .trim();


    const password =
        $("#login-password")
            ?.value;


    if (
        !email ||
        !password
    ) {

        message(
            "Escribe tu correo y contraseña.",
            "warning"
        );

        return;

    }


    const button =
        event.currentTarget
            .querySelector(
                'button[type="submit"]'
            );


    if (button) {
        button.disabled = true;
    }


    try {

        const result =
            await marketFlashClient.auth
                .signInWithPassword({

                    email:
                        email,

                    password:
                        password

                });


        if (
            result.error
        ) {

            throw result.error;

        }


        STATE.user =
            result.data.user;


        await loadUserData();


        event.currentTarget.reset();


        message(
            "Sesión iniciada correctamente.",
            "success"
        );


        showPage(
            "inicio"
        );


        await updateInterface();

    } catch (error) {

        console.error(
            "Inicio de sesión:",
            error
        );

        message(
            error.message ||
            "No se pudo iniciar sesión.",
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


/* =========================================================
   9. CERRAR SESIÓN
   ========================================================= */

async function logout() {

    const result =
        await marketFlashClient
            .auth
            .signOut();


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    STATE.user =
        null;

    STATE.profile =
        null;

    STATE.isAdmin =
        false;

    STATE.products =
        [];

    STATE.favorites =
        new Set();


    updateInterface();


    showPage(
        "inicio"
    );


    message(
        "Sesión cerrada.",
        "success"
    );

}


/* =========================================================
   10. RECUPERAR CONTRASEÑA
   ========================================================= */

async function recoverPassword() {

    const email =
        prompt(
            "Escribe tu correo electrónico:"
        );


    if (!email) {
        return;
    }


    const redirect =
        window.location.origin +
        window.location.pathname;


    const result =
        await marketFlashClient.auth
            .resetPasswordForEmail(
                email.trim(),
                {
                    redirectTo:
                        redirect
                }
            );


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    message(
        "Revisa tu correo para recuperar la contraseña.",
        "success"
    );

}


/* =========================================================
   11. DATOS DEL USUARIO
   ========================================================= */

async function loadUserData() {

    if (!STATE.user) {

        STATE.profile =
            null;

        STATE.isAdmin =
            false;

        return;

    }


    await loadProfile();

    await loadFavorites();

    STATE.isAdmin =
        STATE.profile?.role ===
        "admin";

}


async function loadProfile() {

    if (!STATE.user) {
        return;
    }


    const result =
        await marketFlashClient
            .from("profiles")
            .select(
                "id,full_name,documento,phone,whatsapp,messenger,role"
            )
            .eq(
                "id",
                STATE.user.id
            )
            .maybeSingle();


    if (
        result.error
    ) {

        console.error(
            "Perfil:",
            result.error
        );

        return;

    }


    STATE.profile =
        result.data;


    /*
     * Si el trigger creó el perfil,
     * aquí ya tendremos los datos.
     */

}


/* =========================================================
   12. INTERFAZ SEGÚN SESIÓN
   ========================================================= */

function updateInterface() {

    const registerButton =
        $("#btn-registrarse");


    const loginButton =
        $("#btn-iniciar-sesion");


    const profileButton =
        $("#btn-perfil");


    if (
        STATE.user
    ) {

        if (registerButton) {
            registerButton.style.display =
                "none";
        }

        if (loginButton) {
            loginButton.style.display =
                "none";
        }

        if (profileButton) {
            profileButton.style.display =
                "inline-flex";
        }

    } else {

        if (registerButton) {
            registerButton.style.display =
                "inline-flex";
        }

        if (loginButton) {
            loginButton.style.display =
                "inline-flex";
        }

        if (profileButton) {
            profileButton.style.display =
                "none";
        }

    }


    renderProfile();

}


/* =========================================================
   13. PERFIL
   ========================================================= */

function renderProfile() {

    if (!STATE.profile) {
        return;
    }


    $("#perfil-nombre")
        ?.replaceChildren(
            document.createTextNode(
                STATE.profile.full_name ||
                "Usuario"
            )
        );


    $("#perfil-correo")
        ?.replaceChildren(
            document.createTextNode(
                STATE.user?.email ||
                "-"
            )
        );


    $("#perfil-telefono")
        ?.replaceChildren(
            document.createTextNode(
                STATE.profile.phone ||
                "-"
            )
        );


    $("#perfil-whatsapp")
        ?.replaceChildren(
            document.createTextNode(
                STATE.profile.whatsapp ||
                "-"
            )
        );


    $("#perfil-messenger")
        ?.replaceChildren(
            document.createTextNode(
                STATE.profile.messenger ||
                "-"
            )
        );


    $("#perfil-documento")
        ?.replaceChildren(
            document.createTextNode(
                STATE.profile.documento ||
                "-"
            )
        );

}


/* =========================================================
   14. EDITAR PERFIL
   ========================================================= */

async function editProfile() {

    if (!STATE.user) {
        return;
    }


    const name =
        prompt(
            "Nombre completo:",
            STATE.profile?.full_name ||
            ""
        );


    if (
        name === null
    ) {
        return;
    }


    const phone =
        prompt(
            "Teléfono:",
            STATE.profile?.phone ||
            ""
        );


    if (
        phone === null
    ) {
        return;
    }


    const whatsapp =
        prompt(
            "WhatsApp:",
            STATE.profile?.whatsapp ||
            ""
        );


    if (
        whatsapp === null
    ) {
        return;
    }


    const messenger =
        prompt(
            "Messenger:",
            STATE.profile?.messenger ||
            ""
        );


    if (
        messenger === null
    ) {
        return;
    }


    const result =
        await marketFlashClient
            .from("profiles")
            .update({

                full_name:
                    name.trim(),

                phone:
                    phone.trim(),

                whatsapp:
                    whatsapp.trim(),

                messenger:
                    messenger.trim()

            })
            .eq(
                "id",
                STATE.user.id
            )
            .select()
            .single();


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    STATE.profile =
        result.data;


    renderProfile();


    message(
        "Perfil actualizado.",
        "success"
    );

}


/* =========================================================
   15. CATEGORÍAS
   ========================================================= */

function setupCategories() {

    $all(
        ".category-card"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    STATE.selectedCategory =
                        button.dataset.category ||
                        "Todos";


                    $all(
                        ".category-card"
                    )
                    .forEach(
                        item => {

                            item.classList.toggle(
                                "active",
                                item === button
                            );

                        }
                    );


                    renderProducts();


                    showPage(
                        "inicio"
                    );

                }
            );

        }
    );

}


/* =========================================================
   16. BÚSQUEDA
   ========================================================= */

function setupSearch() {

    $("#form-busqueda")
        ?.addEventListener(
            "submit",
            event => {

                event.preventDefault();


                STATE.search =
                    $("#buscar")
                        ?.value
                        .trim()
                        .toLowerCase() ||
                    "";


                STATE.selectedCategory =
                    "Todos";


                renderProducts();


                showPage(
                    "inicio"
                );

            }
        );


    $("#btn-limpiar-busqueda")
        ?.addEventListener(
            "click",
            () => {

                $("#buscar").value =
                    "";

                STATE.search =
                    "";

                STATE.selectedCategory =
                    "Todos";


                renderProducts();

            }
        );

}


/* =========================================================
   17. PRODUCTOS
   ========================================================= */

async function loadProducts() {

    const result =
        await marketFlashClient
            .from("products")
            .select(
                `
                id,
                user_id,
                nombre,
                categoria,
                precio,
                cantidad,
                descripcion,
                contacto,
                status,
                image_urls,
                views,
                created_at
                `
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {

        console.error(
            "Productos:",
            result.error
        );

        return;

    }


    STATE.products =
        result.data ||
        [];


    renderProducts();


    if (STATE.user) {

        renderMyProducts();

        renderSoldProducts();

    }

}


/* =========================================================
   18. FILTRO DE PRODUCTOS
   ========================================================= */

function getPublicProducts() {

    let products =
        STATE.products.filter(
            product =>
                product.status ===
                "approved"
        );


    if (
        STATE.selectedCategory !==
        "Todos"
    ) {

        products =
            products.filter(
                product =>
                    String(
                        product.categoria ||
                        ""
                    )
                    .toLowerCase() ===
                    String(
                        STATE.selectedCategory
                    )
                    .toLowerCase()
            );

    }


    if (
        STATE.search
    ) {

        products =
            products.filter(
                product => {

                    const content =
                        [
                            product.nombre,
                            product.categoria,
                            product.descripcion
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    return content.includes(
                        STATE.search
                    );

                }
            );

    }


    return products;

}


/* =========================================================
   19. TARJETA DE PRODUCTO
   ========================================================= */

function createProductCard(
    product,
    options = {}
) {

    const card =
        document.createElement(
            "article"
        );


    card.className =
        "product-card";


    const imageBox =
        document.createElement(
            "div"
        );


    imageBox.className =
        "product-image";


    const urls =
        Array.isArray(
            product.image_urls
        )
            ? product.image_urls
            : [];


    if (
        urls.length > 0
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            urls[0];


        image.alt =
            product.nombre ||
            "Producto";


        image.loading =
            "lazy";


        imageBox.appendChild(
            image
        );

    } else {

        const placeholder =
            document.createElement(
                "span"
            );


        placeholder.className =
            "product-image-placeholder";


        placeholder.textContent =
            "Sin imagen";


        imageBox.appendChild(
            placeholder
        );

    }


    const body =
        document.createElement(
            "div"
        );


    body.className =
        "product-body";


    const category =
        document.createElement(
            "div"
        );


    category.className =
        "product-category";


    category.textContent =
        product.categoria ||
        "Otros";


    const title =
        document.createElement(
            "h3"
        );


    title.className =
        "product-title";


    title.textContent =
        product.nombre ||
        "Producto";


    const description =
        document.createElement(
            "p"
        );


    description.className =
        "product-description";


    description.textContent =
        product.descripcion ||
        "";


    const price =
        document.createElement(
            "div"
        );


    price.className =
        "product-price";


    price.textContent =
        `RD$ ${formatPrice(
            product.precio
        )}`;


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "product-meta";


    const quantity =
        document.createElement(
            "span"
        );


    quantity.textContent =
        `Cantidad: ${
            product.cantidad ??
            0
        }`;


    const views =
        document.createElement(
            "span"
        );


    views.textContent =
        `Vistas: ${
            product.views ??
            0
        }`;


    meta.appendChild(
        quantity
    );

    meta.appendChild(
        views
    );


    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "product-actions";


    const viewButton =
        document.createElement(
            "button"
        );


    viewButton.type =
        "button";


    viewButton.className =
        "secondary-button";


    viewButton.textContent =
        "Ver producto";


    viewButton.addEventListener(
        "click",
        () => {

            selectProduct(
                product
            );

        }
    );


    actions.appendChild(
        viewButton
    );


    if (
        !options.hideFavorite
    ) {

        const favoriteButton =
            document.createElement(
                "button"
            );


        favoriteButton.type =
            "button";


        favoriteButton.className =
            "secondary-button";


        favoriteButton.textContent =
            STATE.favorites.has(
                product.id
            )
                ? "★ Favorito"
                : "☆ Favorito";


        favoriteButton.addEventListener(
            "click",
            async () => {

                await toggleFavorite(
                    product.id
                );

            }
        );


        actions.appendChild(
            favoriteButton
        );

    }


    body.appendChild(
        category
    );

    body.appendChild(
        title
    );

    body.appendChild(
        description
    );

    body.appendChild(
        price
    );

    body.appendChild(
        meta
    );


    const status =
        document.createElement(
            "span"
        );


    status.className =
        "product-status";


    applyStatus(
        status,
        product.status
    );


    body.appendChild(
        status
    );

    body.appendChild(
        actions
    );


    card.appendChild(
        imageBox
    );

    card.appendChild(
        body
    );


    return card;

}


/* =========================================================
   20. ESTADO PRODUCTO
   ========================================================= */

function applyStatus(
    element,
    status
) {

    const labels = {

        pending:
            "Pendiente",

        approved:
            "Aprobado",

        rejected:
            "Rechazado",

        sold:
            "Vendido"

    };


    const classes = {

        pending:
            "pendiente",

        approved:
            "aprobado",

        rejected:
            "rechazado",

        sold:
            "vendido"

    };


    element.textContent =
        labels[status] ||
        "Pendiente";


    element.classList.add(
        classes[status] ||
        "pendiente"
    );

}


/* =========================================================
   21. RENDER PRODUCTOS
   ========================================================= */

function renderProducts() {

    const container =
        $("#lista-productos");


    const empty =
        $("#sin-productos");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const products =
        getPublicProducts();


    if (!products.length) {

        if (empty) {
            empty.style.display =
                "grid";
        }

        return;

    }


    if (empty) {
        empty.style.display =
            "none";
    }


    products.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   22. SELECCIONAR PRODUCTO
   ========================================================= */

async function selectProduct(
    product
) {

    STATE.selectedProduct =
        product;


    if (
        STATE.user?.id !==
        product.user_id
    ) {

        await marketFlashClient
            .from("products")
            .update({

                views:
                    Number(
                        product.views ||
                        0
                    ) + 1

            })
            .eq(
                "id",
                product.id
            );


        product.views =
            Number(
                product.views ||
                0
            ) + 1;

    }


    const name =
        $("#contacto-vendedor-nombre");


    if (name) {

        name.textContent =
            `Producto seleccionado: ${
                product.nombre
            }`;

    }


    showPage(
        "contactar-vendedor"
    );

}


/* =========================================================
   23. FAVORITOS
   ========================================================= */

async function loadFavorites() {

    if (!STATE.user) {
        return;
    }


    const result =
        await marketFlashClient
            .from("favorites")
            .select(
                "product_id"
            )
            .eq(
                "user_id",
                STATE.user.id
            );


    if (
        result.error
    ) {

        console.error(
            "Favoritos:",
            result.error
        );

        return;

    }


    STATE.favorites =
        new Set(
            (result.data || [])
                .map(
                    item =>
                        item.product_id
                )
        );

}


async function toggleFavorite(
    productId
) {

    if (!STATE.user) {

        message(
            "Inicia sesión para guardar favoritos.",
            "warning"
        );

        showPage(
            "inicio-sesion"
        );

        return;

    }


    const exists =
        STATE.favorites.has(
            productId
        );


    if (exists) {

        const result =
            await marketFlashClient
                .from("favorites")
                .delete()
                .eq(
                    "user_id",
                    STATE.user.id
                )
                .eq(
                    "product_id",
                    productId
                );


        if (
            result.error
        ) {

            message(
                result.error.message,
                "error"
            );

            return;

        }


        STATE.favorites.delete(
            productId
        );


        message(
            "Eliminado de favoritos.",
            "success"
        );

    } else {

        const result =
            await marketFlashClient
                .from("favorites")
                .insert({

                    user_id:
                        STATE.user.id,

                    product_id:
                        productId

                });


        if (
            result.error
        ) {

            message(
                result.error.message,
                "error"
            );

            return;

        }


        STATE.favorites.add(
            productId
        );


        message(
            "Añadido a favoritos.",
            "success"
        );

    }


    renderProducts();

    renderFavorites();

}


/* =========================================================
   24. RENDER FAVORITOS
   ========================================================= */

function renderFavorites() {

    const container =
        $("#lista-favoritos");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!STATE.user) {
        return;
    }


    const favorites =
        STATE.products.filter(
            product =>
                STATE.favorites.has(
                    product.id
                )
        );


    if (!favorites.length) {

        renderEmpty(
            container,
            "No tienes productos favoritos."
        );

        return;

    }


    favorites.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product,
                    {
                        hideFavorite:
                            false
                    }
                )
            );

        }
    );

}


/* =========================================================
   25. MIS PUBLICACIONES
   ========================================================= */

function renderMyProducts() {

    const container =
        $("#mis-publicaciones");


    if (
        !container ||
        !STATE.user
    ) {
        return;
    }


    container.innerHTML =
        "";


    const mine =
        STATE.products.filter(
            product =>
                product.user_id ===
                STATE.user.id
        );


    if (!mine.length) {

        renderEmpty(
            container,
            "Todavía no tienes publicaciones."
        );

        return;

    }


    mine.forEach(
        product => {

            const card =
                createProductCard(
                    product,
                    {
                        hideFavorite:
                            true
                    }
                );


            if (
                product.status !==
                "sold"
            ) {

                const actions =
                    card.querySelector(
                        ".product-actions"
                    );


                if (actions) {

                    const soldButton =
                        document.createElement(
                            "button"
                        );


                    soldButton.type =
                        "button";


                    soldButton.className =
                        "secondary-button";


                    soldButton.textContent =
                        "Marcar vendido";


                    soldButton.addEventListener(
                        "click",
                        () =>
                            markSold(
                                product.id
                            )
                    );


                    actions.appendChild(
                        soldButton
                    );

                }

            }


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   26. MARCAR VENDIDO
   ========================================================= */

async function markSold(
    productId
) {

    const result =
        await marketFlashClient
            .from("products")
            .update({
                status:
                    "sold"
            })
            .eq(
                "id",
                productId
            )
            .eq(
                "user_id",
                STATE.user.id
            );


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    message(
        "Producto marcado como vendido.",
        "success"
    );


    await loadProducts();

    renderMyProducts();

    renderSoldProducts();

}


/* =========================================================
   27. PRODUCTOS VENDIDOS
   ========================================================= */

function renderSoldProducts() {

    const container =
        $("#lista-vendidos");


    if (
        !container ||
        !STATE.user
    ) {
        return;
    }


    container.innerHTML =
        "";


    const sold =
        STATE.products.filter(
            product =>
                product.user_id ===
                STATE.user.id &&
                product.status ===
                "sold"
        );


    if (!sold.length) {

        renderEmpty(
            container,
            "No tienes productos vendidos."
        );

        return;

    }


    sold.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product,
                    {
                        hideFavorite:
                            true
                    }
                )
            );

        }
    );

}


/* =========================================================
   28. SUBIR IMÁGENES
   ========================================================= */

async function uploadImages(
    files
) {

    const urls = [];


    for (
        const file of files
    ) {

        if (
            !file.type.startsWith(
                "image/"
            )
        ) {
            continue;
        }


        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const name =
            `${crypto.randomUUID()}.${extension}`;


        const path =
            `${STATE.user.id}/${name}`;


        const result =
            await marketFlashClient
                .storage
                .from(
                    "product-images"
                )
                .upload(
                    path,
                    file,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type
                    }
                );


        if (
            result.error
        ) {

            console.error(
                "Imagen:",
                result.error
            );

            continue;

        }


        const publicUrl =
            marketFlashClient
                .storage
                .from(
                    "product-images"
                )
                .getPublicUrl(
                    path
                );


        if (
            publicUrl.data?.publicUrl
        ) {

            urls.push(
                publicUrl.data.publicUrl
            );

        }

    }


    return urls;

}


/* =========================================================
   29. VISTA PREVIA
   ========================================================= */

function setupImagePreview() {

    const input =
        $("#producto-imagen");


    const preview =
        $("#preview-imagenes");


    if (!input || !preview) {
        return;
    }


    input.addEventListener(
        "change",
        () => {

            preview.innerHTML =
                "";


            Array.from(
                input.files || []
            )
            .forEach(
                file => {

                    if (
                        !file.type.startsWith(
                            "image/"
                        )
                    ) {
                        return;
                    }


                    const wrapper =
                        document.createElement(
                            "div"
                        );


                    wrapper.className =
                        "image-preview-item";


                    const image =
                        document.createElement(
                            "img"
                        );


                    image.src =
                        URL.createObjectURL(
                            file
                        );


                    image.alt =
                        "Vista previa";


                    wrapper.appendChild(
                        image
                    );


                    preview.appendChild(
                        wrapper
                    );

                }
            );

        }
    );

}


/* =========================================================
   30. CREAR PRODUCTO
   ========================================================= */

async function createProduct(
    event
) {

    event.preventDefault();


    if (!STATE.user) {

        message(
            "Debes iniciar sesión.",
            "warning"
        );

        showPage(
            "inicio-sesion"
        );

        return;

    }


    const name =
        $("#producto-nombre")
            ?.value
            .trim();


    const category =
        $("#producto-categoria")
            ?.value;


    const price =
        Number(
            $("#producto-precio")
                ?.value
        );


    const quantity =
        Number(
            $("#producto-cantidad")
                ?.value
        );


    const description =
        $("#producto-descripcion")
            ?.value
            .trim();


    const contact =
        $("#producto-contacto")
            ?.value;


    const input =
        $("#producto-imagen");


    if (
        !name ||
        !category ||
        !price ||
        !quantity ||
        !description ||
        !contact
    ) {

        message(
            "Completa todos los datos del producto.",
            "warning"
        );

        return;

    }


    const button =
        event.currentTarget
            .querySelector(
                'button[type="submit"]'
            );


    if (button) {
        button.disabled = true;
    }


    try {

        const files =
            Array.from(
                input?.files ||
                []
            );


        const imageUrls =
            await uploadImages(
                files
            );


        const result =
            await marketFlashClient
                .from("products")
                .insert({

                    user_id:
                        STATE.user.id,

                    nombre:
                        name,

                    categoria:
                        category,

                    precio:
                        price,

                    cantidad:
                        quantity,

                    descripcion:
                        description,

                    contacto:
                        contact,

                    status:
                        "pending",

                    image_urls:
                        imageUrls,

                    views:
                        0

                })
                .select()
                .single();


        if (
            result.error
        ) {

            throw result.error;

        }


        STATE.selectedProduct =
            result.data;


        event.currentTarget.reset();


        const preview =
            $("#preview-imagenes");


        if (preview) {
            preview.innerHTML =
                "";
        }


        await loadProducts();


        message(
            "Producto creado y enviado para revisión.",
            "success"
        );


        if (
            APP.publicationMode ===
            "paid"
        ) {

            showPage(
                "pago"
            );

        } else {

            showPage(
                "perfil"
            );

        }

    } catch (error) {

        console.error(
            "Producto:",
            error
        );

        message(
            error.message ||
            "No se pudo publicar el producto.",
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


/* =========================================================
   31. PAGO
   ========================================================= */

function setupPayment() {

    $all(
        'input[name="metodo-pago"]'
    )
    .forEach(
        radio => {

            radio.addEventListener(
                "change",
                () => {

                    $("#bloque-binance")
                        ?.classList.toggle(
                            "hidden",
                            radio.value !==
                            "binance"
                        );


                    $("#bloque-paypal")
                        ?.classList.toggle(
                            "hidden",
                            radio.value !==
                            "paypal"
                        );

                }
            );

        }
    );


    $("#btn-copiar-binance")
        ?.addEventListener(
            "click",
            copyBinance
        );


    $("#btn-enviar-comprobante")
        ?.addEventListener(
            "click",
            submitPayment
        );


    $("#comprobante-pago")
        ?.addEventListener(
            "change",
            previewReceipt
        );

}


function copyBinance() {

    if (
        !APP.binanceAddress
    ) {

        message(
            "La dirección de Binance todavía no está configurada.",
            "warning"
        );

        return;

    }


    navigator.clipboard
        .writeText(
            APP.binanceAddress
        )
        .then(
            () => {

                message(
                    "Dirección de Binance copiada.",
                    "success"
                );

            }
        )
        .catch(
            () => {

                message(
                    "No se pudo copiar.",
                    "error"
                );

            }
        );

}


function previewReceipt(
    event
) {

    const file =
        event.currentTarget.files?.[0];


    const preview =
        $("#preview-comprobante");


    if (!preview) {
        return;
    }


    preview.innerHTML =
        "";


    if (!file) {
        return;
    }


    if (
        file.type.startsWith(
            "image/"
        )
    ) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            URL.createObjectURL(
                file
            );


        image.alt =
            "Comprobante";


        preview.appendChild(
            image
        );

    } else {

        preview.textContent =
            `Archivo: ${
                file.name
            }`;

    }

}


/* =========================================================
   32. SUBIR COMPROBANTE
   ========================================================= */

async function uploadReceipt(
    file
) {

    const extension =
        file.name
            .split(".")
            .pop()
            .toLowerCase();


    const name =
        `${crypto.randomUUID()}.${extension}`;


    const path =
        `${STATE.user.id}/${name}`;


    const result =
        await marketFlashClient
            .storage
            .from(
                "payment-receipts"
            )
            .upload(
                path,
                file,
                {

                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type

                }
            );


    if (
        result.error
    ) {

        throw result.error;

    }


    const url =
        marketFlashClient
            .storage
            .from(
                "payment-receipts"
            )
            .getPublicUrl(
                path
            );


    return url.data?.publicUrl ||
        null;

}


/* =========================================================
   33. ENVIAR PAGO
   ========================================================= */

async function submitPayment() {

    if (
        !STATE.user ||
        !STATE.selectedProduct
    ) {

        message(
            "Primero selecciona un producto.",
            "warning"
        );

        return;

    }


    const method =
        document.querySelector(
            'input[name="metodo-pago"]:checked'
        )?.value;


    const file =
        $("#comprobante-pago")
            ?.files?.[0];


    if (!method) {

        message(
            "Selecciona un método de pago.",
            "warning"
        );

        return;

    }


    if (!file) {

        message(
            "Selecciona el comprobante.",
            "warning"
        );

        return;

    }


    const button =
        $("#btn-enviar-comprobante");


    if (button) {
        button.disabled = true;
    }


    try {

        const receiptUrl =
            await uploadReceipt(
                file
            );


        const result =
            await marketFlashClient
                .from("payments")
                .insert({

                    user_id:
                        STATE.user.id,

                    product_id:
                        STATE.selectedProduct.id,

                    method:
                        method,

                    amount:
                        APP.publicationFee,

                    receipt_url:
                        receiptUrl,

                    status:
                        "pending"

                });


        if (
            result.error
        ) {

            throw result.error;

        }


        $("#comprobante-pago").value =
            "";


        $("#preview-comprobante").innerHTML =
            "";


        $("#estado-pago")
            .textContent =
                "Estado: comprobante enviado para revisión.";


        message(
            "Comprobante enviado.",
            "success"
        );


        await loadNotifications();

    } catch (error) {

        console.error(
            "Pago:",
            error
        );

        message(
            error.message ||
            "No se pudo enviar el comprobante.",
            "error"
        );

    } finally {

        if (button) {
            button.disabled = false;
        }

    }

}


/* =========================================================
   34. PROMOCIONES
   ========================================================= */

function setupPromotions() {

    $all(
        "[data-promotion]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    await requestPromotion(
                        button.dataset.promotion
                    );

                }
            );

        }
    );

}


async function requestPromotion(
    type
) {

    if (!STATE.user) {

        message(
            "Inicia sesión para solicitar una promoción.",
            "warning"
        );

        showPage(
            "inicio-sesion"
        );

        return;

    }


    if (
        !APP.promotionsActive
    ) {

        message(
            "Las promociones están temporalmente desactivadas.",
            "warning"
        );

        return;

    }


    const result =
        await marketFlashClient
            .from("promotions")
            .insert({

                user_id:
                    STATE.user.id,

                promotion_type:
                    type,

                status:
                    "pending"

            });


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    message(
        "Solicitud de promoción enviada.",
        "success"
    );


    loadPromotions();

}


async function loadPromotions() {

    if (!STATE.user) {
        return;
    }


    const result =
        await marketFlashClient
            .from("promotions")
            .select(
                "id,promotion_type,status,created_at"
            )
            .eq(
                "user_id",
                STATE.user.id
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {
        return;
    }


    const container =
        $("#lista-promociones");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No tienes solicitudes de promoción."
        );

        return;

    }


    result.data.forEach(
        promotion => {

            const item =
                document.createElement(
                    "div"
                );


            item.className =
                "promotion-list-item";


            item.textContent =
                `${promotion.promotion_type} — ${
                    promotion.status
                }`;


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   35. VÍDEOS
   ========================================================= */

function setupVideos() {

    $("#form-video")
        ?.addEventListener(
            "submit",
            createVideo
        );

}


async function createVideo(
    event
) {

    event.preventDefault();


    if (!STATE.user) {

        message(
            "Inicia sesión para publicar un vídeo.",
            "warning"
        );

        return;

    }


    const title =
        $("#video-titulo")
            ?.value
            .trim();


    const description =
        $("#video-descripcion")
            ?.value
            .trim();


    const file =
        $("#video-archivo")
            ?.files?.[0];


    if (
        !title ||
        !file
    ) {

        message(
            "Escribe un título y selecciona un vídeo.",
            "warning"
        );

        return;

    }


    if (
        !file.type.startsWith(
            "video/"
        )
    ) {

        message(
            "Selecciona un vídeo válido.",
            "warning"
        );

        return;

    }


    try {

        const extension =
            file.name
                .split(".")
                .pop()
                .toLowerCase();


        const name =
            `${crypto.randomUUID()}.${extension}`;


        const path =
            `${STATE.user.id}/${name}`;


        const upload =
            await marketFlashClient
                .storage
                .from(
                    "market-videos"
                )
                .upload(
                    path,
                    file,
                    {
                        cacheControl:
                            "3600",

                        upsert:
                            false,

                        contentType:
                            file.type
                    }
                );


        if (
            upload.error
        ) {

            throw upload.error;

        }


        const publicUrl =
            marketFlashClient
                .storage
                .from(
                    "market-videos"
                )
                .getPublicUrl(
                    path
                );


        const result =
            await marketFlashClient
                .from("videos")
                .insert({

                    user_id:
                        STATE.user.id,

                    title:
                        title,

                    description:
                        description,

                    video_url:
                        publicUrl.data?.publicUrl,

                    status:
                        "pending"

                });


        if (
            result.error
        ) {

            throw result.error;

        }


        event.currentTarget.reset();


        message(
            "Vídeo enviado para revisión.",
            "success"
        );

    } catch (error) {

        console.error(
            "Vídeo:",
            error
        );

        message(
            error.message ||
            "No se pudo enviar el vídeo.",
            "error"
        );

    }

}


/* =========================================================
   36. CARGAR VÍDEOS
   ========================================================= */

async function loadVideos() {

    const result =
        await marketFlashClient
            .from("videos")
            .select(
                "id,user_id,title,description,video_url,status,created_at"
            )
            .eq(
                "status",
                "approved"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {
        return;
    }


    const container =
        $("#lista-videos");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    (result.data || [])
        .forEach(
            video => {

                const card =
                    document.createElement(
                        "article"
                    );


                card.className =
                    "video-card";


                const player =
                    document.createElement(
                        "video"
                    );


                player.controls =
                    true;

                player.preload =
                    "metadata";

                player.src =
                    video.video_url;


                const content =
                    document.createElement(
                        "div"
                    );


                content.className =
                    "video-card-content";


                const title =
                    document.createElement(
                        "h3"
                    );


                title.textContent =
                    video.title;


                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    video.description ||
                    "";


                content.appendChild(
                    title
                );

                content.appendChild(
                    description
                );


                card.appendChild(
                    player
                );

                card.appendChild(
                    content
                );


                container.appendChild(
                    card
                );

            }
        );

}


/* =========================================================
   37. NOTIFICACIONES
   ========================================================= */

async function loadNotifications() {

    if (!STATE.user) {
        return;
    }


    const result =
        await marketFlashClient
            .from("notifications")
            .select(
                "id,title,message,read,created_at"
            )
            .eq(
                "user_id",
                STATE.user.id
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            )
            .limit(
                50
            );


    if (
        result.error
    ) {
        return;
    }


    const container =
        $("#lista-notificaciones");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No tienes notificaciones."
        );

        return;

    }


    result.data.forEach(
        item => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "notification-card";


            if (!item.read) {

                card.classList.add(
                    "unread"
                );

            }


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                item.title;


            const text =
                document.createElement(
                    "p"
                );


            text.textContent =
                item.message;


            const date =
                document.createElement(
                    "span"
                );


            date.className =
                "notification-time";


            date.textContent =
                formatDate(
                    item.created_at
                );


            card.appendChild(
                title
            );

            card.appendChild(
                text
            );

            card.appendChild(
                date
            );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   38. CALIFICACIONES
   ========================================================= */

function setupReviews() {

    $("#form-calificacion")
        ?.addEventListener(
            "submit",
            submitReview
        );

}


async function submitReview(
    event
) {

    event.preventDefault();


    if (
        !STATE.user ||
        !STATE.selectedProduct
    ) {

        message(
            "Selecciona un producto e inicia sesión.",
            "warning"
        );

        return;

    }


    const rating =
        Number(
            $("#calificacion-estrellas")
                ?.value
        );


    const comment =
        $("#calificacion-comentario")
            ?.value
            .trim();


    if (
        rating < 1 ||
        rating > 5
    ) {

        message(
            "Selecciona una calificación válida.",
            "warning"
        );

        return;

    }


    const result =
        await marketFlashClient
            .from("reviews")
            .insert({

                reviewer_id:
                    STATE.user.id,

                product_id:
                    STATE.selectedProduct.id,

                seller_id:
                    STATE.selectedProduct.user_id,

                rating:
                    rating,

                comment:
                    comment ||
                    ""

            });


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    event.currentTarget.reset();


    message(
        "Calificación enviada.",
        "success"
    );

}


/* =========================================================
   39. RECLAMOS
   ========================================================= */

function setupClaims() {

    $("#form-reclamo")
        ?.addEventListener(
            "submit",
            submitClaim
        );

}


async function submitClaim(
    event
) {

    event.preventDefault();


    if (!STATE.user) {

        message(
            "Inicia sesión para enviar un reclamo.",
            "warning"
        );

        showPage(
            "inicio-sesion"
        );

        return;

    }


    const reason =
        $("#reclamo-motivo")
            ?.value;


    const details =
        $("#reclamo-detalle")
            ?.value
            .trim();


    if (
        !reason ||
        !details
    ) {

        message(
            "Completa el motivo y los detalles.",
            "warning"
        );

        return;

    }


    const result =
        await marketFlashClient
            .from("reports")
            .insert({

                user_id:
                    STATE.user.id,

                reason:
                    reason,

                details:
                    details,

                status:
                    "pending"

            });


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    event.currentTarget.reset();


    message(
        "Reclamo enviado correctamente.",
        "success"
    );

}


/* =========================================================
   40. CONTACTO CON VENDEDOR
   ========================================================= */

function setupSellerContact() {

    $("#btn-contactar-whatsapp")
        ?.addEventListener(
            "click",
            () => {

                if (
                    !STATE.selectedProduct
                ) {

                    message(
                        "No hay un producto seleccionado.",
                        "warning"
                    );

                    return;

                }


                const contact =
                    STATE.selectedProduct
                        .contacto;


                if (
                    contact !==
                    "WhatsApp"
                ) {

                    message(
                        "Este vendedor no seleccionó WhatsApp.",
                        "warning"
                    );

                    return;

                }


                const seller =
                    STATE.products
                        .find(
                            product =>
                                product.id ===
                                STATE.selectedProduct.id
                        );


                if (
                    !seller
                ) {
                    return;
                }


                message(
                    "El contacto de WhatsApp se conectará con los datos del vendedor almacenados en su perfil.",
                    "info"
                );

            }
        );


    $("#btn-contactar-messenger")
        ?.addEventListener(
            "click",
            () => {

                if (
                    !STATE.selectedProduct
                ) {

                    message(
                        "No hay un producto seleccionado.",
                        "warning"
                    );

                    return;

                }


                message(
                    "El contacto de Messenger se conectará con el perfil del vendedor.",
                    "info"
                );

            }
        );

}


/* =========================================================
   41. ADMIN
   ========================================================= */

async function loadAdmin() {

    if (
        !STATE.isAdmin
    ) {
        return;
    }


    await loadAdminStats();

    await loadAdminPayments();

    await loadAdminPendingProducts();

    await loadAdminActiveProducts();

    await loadAdminUsers();

    await loadAdminReports();

    await loadAdminSettings();

}


async function loadAdminStats() {

    const [
        users,
        pending,
        payments,
        active
    ] =
        await Promise.all([

            marketFlashClient
                .from("profiles")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true
                    }
                ),

            marketFlashClient
                .from("products")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true
                    }
                )
                .eq(
                    "status",
                    "pending"
                ),

            marketFlashClient
                .from("payments")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true
                    }
                )
                .eq(
                    "status",
                    "pending"
                ),

            marketFlashClient
                .from("products")
                .select(
                    "id",
                    {
                        count:
                            "exact",
                        head:
                            true
                    }
                )
                .eq(
                    "status",
                    "approved"
                )

        ]);


    $("#admin-total-usuarios")
        ?.replaceChildren(
            document.createTextNode(
                String(
                    users.count ??
                    0
                )
            )
        );


    $("#admin-total-pendientes")
        ?.replaceChildren(
            document.createTextNode(
                String(
                    pending.count ??
                    0
                )
            )
        );


    $("#admin-total-pagos")
        ?.replaceChildren(
            document.createTextNode(
                String(
                    payments.count ??
                    0
                )
            )
        );


    $("#admin-total-activas")
        ?.replaceChildren(
            document.createTextNode(
                String(
                    active.count ??
                    0
                )
            )
        );

}


/* =========================================================
   42. ADMIN — PAGOS
   ========================================================= */

async function loadAdminPayments() {

    const container =
        $("#admin-comprobantes");


    if (!container) {
        return;
    }


    const result =
        await marketFlashClient
            .from("payments")
            .select(
                "id,user_id,product_id,method,amount,receipt_url,status,created_at"
            )
            .eq(
                "status",
                "pending"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No hay pagos pendientes."
        );

        return;

    }


    result.data.forEach(
        payment => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "admin-item";


            const title =
                document.createElement(
                    "h4"
                );


            title.textContent =
                "Comprobante pendiente";


            const info =
                document.createElement(
                    "p"
                );


            info.textContent =
                `Método: ${
                    payment.method
                } — RD$ ${
                    formatPrice(
                        payment.amount
                    )
                }`;


            const link =
                document.createElement(
                    "a"
                );


            link.href =
                payment.receipt_url ||
                "#";


            link.target =
                "_blank";


            link.rel =
                "noopener";


            link.textContent =
                "Ver comprobante";


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "admin-item-actions";


            const approve =
                document.createElement(
                    "button"
                );


            approve.type =
                "button";


            approve.className =
                "primary-button";


            approve.textContent =
                "Aprobar pago";


            approve.addEventListener(
                "click",
                () =>
                    reviewPayment(
                        payment.id,
                        "approved"
                    )
            );


            const reject =
                document.createElement(
                    "button"
                );


            reject.type =
                "button";


            reject.className =
                "danger-button";


            reject.textContent =
                "Rechazar";


            reject.addEventListener(
                "click",
                () =>
                    reviewPayment(
                        payment.id,
                        "rejected"
                    )
            );


            actions.appendChild(
                approve
            );

            actions.appendChild(
                reject
            );


            item.appendChild(
                title
            );

            item.appendChild(
                info
            );

            item.appendChild(
                link
            );

            item.appendChild(
                actions
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   43. REVISAR PAGO
   ========================================================= */

async function reviewPayment(
    paymentId,
    newStatus
) {

    if (
        !STATE.isAdmin
    ) {
        return;
    }


    const payment =
        await marketFlashClient
            .from("payments")
            .select(
                "id,product_id,user_id"
            )
            .eq(
                "id",
                paymentId
            )
            .single();


    if (
        payment.error
    ) {

        message(
            payment.error.message,
            "error"
        );

        return;

    }


    const updated =
        await marketFlashClient
            .from("payments")
            .update({

                status:
                    newStatus,

                reviewed_at:
                    new Date().toISOString()

            })
            .eq(
                "id",
                paymentId
            );


    if (
        updated.error
    ) {

        message(
            updated.error.message,
            "error"
        );

        return;

    }


    if (
        newStatus ===
        "approved"
    ) {

        await marketFlashClient
            .from("products")
            .update({

                status:
                    "approved"

            })
            .eq(
                "id",
                payment.data.product_id
            );

    }


    await createNotification(
        payment.data.user_id,
        newStatus === "approved"
            ? "Pago aprobado"
            : "Pago rechazado",
        newStatus === "approved"
            ? "Tu pago fue aprobado y tu publicación puede aparecer en Market Flash."
            : "Tu comprobante fue rechazado."
    );


    message(
        newStatus === "approved"
            ? "Pago aprobado."
            : "Pago rechazado.",
        "success"
    );


    await loadProducts();

    await loadAdmin();

}


/* =========================================================
   44. ADMIN — PRODUCTOS PENDIENTES
   ========================================================= */

async function loadAdminPendingProducts() {

    const container =
        $("#admin-publicaciones-pendientes");


    if (!container) {
        return;
    }


    const result =
        await marketFlashClient
            .from("products")
            .select(
                "id,user_id,nombre,categoria,precio,cantidad,descripcion,status,created_at"
            )
            .eq(
                "status",
                "pending"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No hay publicaciones pendientes."
        );

        return;

    }


    result.data.forEach(
        product => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "admin-item";


            const title =
                document.createElement(
                    "h4"
                );


            title.textContent =
                product.nombre;


            const info =
                document.createElement(
                    "p"
                );


            info.textContent =
                `${product.categoria} — RD$ ${
                    formatPrice(
                        product.precio
                    )
                }`;


            const description =
                document.createElement(
                    "p"
                );


            description.textContent =
                product.descripcion ||
                "";


            const actions =
                document.createElement(
                    "div"
                );


            actions.className =
                "admin-item-actions";


            const approve =
                document.createElement(
                    "button"
                );


            approve.type =
                "button";


            approve.className =
                "primary-button";


            approve.textContent =
                "Aprobar";


            approve.addEventListener(
                "click",
                () =>
                    reviewProduct(
                        product,
                        "approved"
                    )
            );


            const reject =
                document.createElement(
                    "button"
                );


            reject.type =
                "button";


            reject.className =
                "danger-button";


            reject.textContent =
                "Rechazar";


            reject.addEventListener(
                "click",
                () =>
                    reviewProduct(
                        product,
                        "rejected"
                    )
            );


            actions.appendChild(
                approve
            );

            actions.appendChild(
                reject
            );


            item.appendChild(
                title
            );

            item.appendChild(
                info
            );

            item.appendChild(
                description
            );

            item.appendChild(
                actions
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   45. REVISAR PRODUCTO
   ========================================================= */

async function reviewProduct(
    product,
    status
) {

    if (
        !STATE.isAdmin
    ) {
        return;
    }


    const result =
        await marketFlashClient
            .from("products")
            .update({
                status:
                    status
            })
            .eq(
                "id",
                product.id
            );


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    await createNotification(
        product.user_id,
        status === "approved"
            ? "Publicación aprobada"
            : "Publicación rechazada",
        status === "approved"
            ? `Tu publicación "${product.nombre}" fue aprobada.`
            : `Tu publicación "${product.nombre}" fue rechazada.`
    );


    message(
        status === "approved"
            ? "Publicación aprobada."
            : "Publicación rechazada.",
        "success"
    );


    await loadProducts();

    await loadAdmin();

}


/* =========================================================
   46. ADMIN — PRODUCTOS ACTIVOS
   ========================================================= */

async function loadAdminActiveProducts() {

    const container =
        $("#admin-publicaciones-activas");


    if (!container) {
        return;
    }


    const active =
        STATE.products.filter(
            product =>
                product.status ===
                "approved"
        );


    container.innerHTML =
        "";


    if (!active.length) {

        renderEmpty(
            container,
            "No hay publicaciones activas."
        );

        return;

    }


    active.forEach(
        product => {

            container.appendChild(
                createProductCard(
                    product,
                    {
                        hideFavorite:
                            true
                    }
                )
            );

        }
    );

}


/* =========================================================
   47. ADMIN — USUARIOS
   ========================================================= */

async function loadAdminUsers() {

    const container =
        $("#admin-usuarios");


    if (!container) {
        return;
    }


    const result =
        await marketFlashClient
            .from("profiles")
            .select(
                "id,full_name,documento,phone,whatsapp,messenger,role"
            )
            .order(
                "full_name",
                {
                    ascending:
                        true
                }
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No hay usuarios."
        );

        return;

    }


    result.data.forEach(
        user => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "admin-item";


            const name =
                document.createElement(
                    "h4"
                );


            name.textContent =
                user.full_name ||
                "Usuario";


            const phone =
                document.createElement(
                    "p"
                );


            phone.textContent =
                `Teléfono: ${
                    user.phone ||
                    "-"
                }`;


            const role =
                document.createElement(
                    "p"
                );


            role.textContent =
                `Rol: ${
                    user.role ||
                    "user"
                }`;


            item.appendChild(
                name
            );

            item.appendChild(
                phone
            );

            item.appendChild(
                role
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   48. ADMIN — RECLAMOS
   ========================================================= */

async function loadAdminReports() {

    const container =
        $("#admin-reclamos");


    if (!container) {
        return;
    }


    const result =
        await marketFlashClient
            .from("reports")
            .select(
                "id,user_id,reason,details,status,created_at"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        result.error
    ) {
        return;
    }


    container.innerHTML =
        "";


    if (
        !result.data?.length
    ) {

        renderEmpty(
            container,
            "No hay reclamos."
        );

        return;

    }


    result.data.forEach(
        report => {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "admin-item";


            const title =
                document.createElement(
                    "h4"
                );


            title.textContent =
                report.reason;


            const details =
                document.createElement(
                    "p"
                );


            details.textContent =
                report.details;


            const status =
                document.createElement(
                    "p"
                );


            status.textContent =
                `Estado: ${
                    report.status
                }`;


            item.appendChild(
                title
            );

            item.appendChild(
                details
            );

            item.appendChild(
                status
            );


            container.appendChild(
                item
            );

        }
    );

}


/* =========================================================
   49. ADMIN — CONFIGURACIÓN
   ========================================================= */

async function loadAdminSettings() {

    const result =
        await marketFlashClient
            .from("settings")
            .select(
                "key,value"
            );


    if (
        result.error
    ) {
        return;
    }


    const settings =
        Object.fromEntries(
            (result.data || [])
                .map(
                    item => [
                        item.key,
                        item.value
                    ]
                )
        );


    APP.publicationMode =
        settings.publications_mode ||
        "paid";


    APP.promotionsActive =
        settings.promotions_active !==
        "false";


    const publicationText =
        $("#admin-texto-publicaciones");


    const promotionText =
        $("#admin-texto-promociones");


    if (
        publicationText
    ) {

        publicationText.textContent =
            APP.publicationMode ===
            "paid"
                ? "Las publicaciones requieren pago."
                : "Las publicaciones son gratuitas.";

    }


    if (
        promotionText
    ) {

        promotionText.textContent =
            APP.promotionsActive
                ? "Las promociones están activas."
                : "Las promociones están desactivadas.";

    }


    const statusText =
        $("#texto-estado-publicacion");


    if (
        statusText
    ) {

        statusText.textContent =
            APP.publicationMode ===
            "paid"
                ? `La publicación requiere un pago de RD$ ${formatPrice(
                    APP.publicationFee
                )}.`
                : "La publicación es gratuita.";

    }

}


async function togglePublicationMode() {

    if (!STATE.isAdmin) {
        return;
    }


    const next =
        APP.publicationMode ===
        "paid"
            ? "free"
            : "paid";


    const result =
        await marketFlashClient
            .from("settings")
            .upsert({

                key:
                    "publications_mode",

                value:
                    next

            });


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    APP.publicationMode =
        next;


    await loadAdminSettings();


    message(
        next === "paid"
            ? "Publicaciones de pago activadas."
            : "Publicaciones gratuitas activadas.",
        "success"
    );

}


async function togglePromotions() {

    if (!STATE.isAdmin) {
        return;
    }


    const next =
        !APP.promotionsActive;


    const result =
        await marketFlashClient
            .from("settings")
            .upsert({

                key:
                    "promotions_active",

                value:
                    String(next)

            });


    if (
        result.error
    ) {

        message(
            result.error.message,
            "error"
        );

        return;

    }


    APP.promotionsActive =
        next;


    await loadAdminSettings();


    message(
        next
            ? "Promociones activadas."
            : "Promociones desactivadas.",
        "success"
    );

}


/* =========================================================
   50. NOTIFICACIONES INTERNAS
   ========================================================= */

async function createNotification(
    userId,
    title,
    text
) {

    if (
        !STATE.isAdmin
    ) {

        /*
         * Esta función puede ser llamada por el
         * administrador desde la interfaz.
         */

    }


    const result =
        await marketFlashClient
            .from("notifications")
            .insert({

                user_id:
                    userId,

                title:
                    title,

                message:
                    text,

                read:
                    false

            });


    if (
        result.error
    ) {

        console.error(
            "Notificación:",
            result.error
        );

    }

}


/* =========================================================
   51. ADMIN — BOTONES
   ========================================================= */

function setupAdminButtons() {

    $("#admin-toggle-publicaciones")
        ?.addEventListener(
            "click",
            togglePublicationMode
        );


    $("#admin-toggle-promociones")
        ?.addEventListener(
            "click",
            togglePromotions
        );

}


/* =========================================================
   52. PERFIL
   ========================================================= */

function setupProfileButtons() {

    $("#btn-editar-perfil")
        ?.addEventListener(
            "click",
            editProfile
        );


    $("#btn-cerrar-sesion")
        ?.addEventListener(
            "click",
            logout
        );

}


/* =========================================================
   53. SOPORTE
   ========================================================= */

function setupSupport() {

    $("#soporte-ayuda")
        ?.addEventListener(
            "click",
            () => {

                message(
                    "Market Flash permite comprar, vender, publicar, promocionar y contactar con vendedores.",
                    "info"
                );

            }
        );


    $("#soporte-whatsapp")
        ?.addEventListener(
            "click",
            () => {

                if (
                    !APP.supportWhatsApp
                ) {

                    message(
                        "El WhatsApp de soporte todavía no está configurado.",
                        "warning"
                    );

                    return;

                }


                window.open(
                    `https://wa.me/${
                        APP.supportWhatsApp.replace(
                            /\D/g,
                            ""
                        )
                    }`,
                    "_blank"
                );

            }
        );


    $("#soporte-messenger")
        ?.addEventListener(
            "click",
            () => {

                if (
                    !APP.supportMessenger
                ) {

                    message(
                        "Messenger de soporte todavía no está configurado.",
                        "warning"
                    );

                    return;

                }


                window.open(
                    APP.supportMessenger,
                    "_blank"
                );

            }
        );


    $("#footer-whatsapp")
        ?.addEventListener(
            "click",
            () => {

                if (
                    APP.supportWhatsApp
                ) {

                    window.open(
                        `https://wa.me/${
                            APP.supportWhatsApp.replace(
                                /\D/g,
                                ""
                            )
                        }`,
                        "_blank"
                    );

                } else {

                    message(
                        "WhatsApp de soporte no está configurado.",
                        "warning"
                    );

                }

            }
        );


    $("#footer-messenger")
        ?.addEventListener(
            "click",
            () => {

                if (
                    APP.supportMessenger
                ) {

                    window.open(
                        APP.supportMessenger,
                        "_blank"
                    );

                } else {

                    message(
                        "Messenger de soporte no está configurado.",
                        "warning"
                    );

                }

            }
        );

}


/* =========================================================
   54. PERFIL Y CAMBIO DE FORMULARIOS
   ========================================================= */

function setupAuthLinks() {

    $("#btn-ir-login")
        ?.addEventListener(
            "click",
            () => {

                showPage(
                    "inicio-sesion"
                );

            }
        );


    $("#btn-ir-registro")
        ?.addEventListener(
            "click",
            () => {

                showPage(
                    "registro"
                );

            }
        );


    $("#btn-recuperar-password")
        ?.addEventListener(
            "click",
            recoverPassword
        );

}


/* =========================================================
   55. PUBLICIDAD
   ========================================================= */

function setupAdvertisement() {

    const slider =
        $("#contenedor-publicidad");


    if (!slider) {
        return;
    }


    const cards =
        Array.from(
            slider.children
        );


    let index =
        0;


    function goTo(
        value
    ) {

        if (!cards.length) {
            return;
        }


        index =
            (
                value +
                cards.length
            ) %
            cards.length;


        cards[index]
            .scrollIntoView({
                behavior:
                    "smooth",

                block:
                    "nearest",

                inline:
                    "center"
            });

    }


    $("#publicidad-anterior")
        ?.addEventListener(
            "click",
            () =>
                goTo(
                    index - 1
                )
        );


    $("#publicidad-siguiente")
        ?.addEventListener(
            "click",
            () =>
                goTo(
                    index + 1
                )
        );


    $all(
        "[data-ad-id]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    message(
                        "Este espacio está reservado para publicidad patrocinada.",
                        "info"
                    );

                }
            );

        }
    );


    if (cards.length > 1) {

        setInterval(
            () => {

                goTo(
                    index + 1
                );

            },
            6000
        );

    }

}


/* =========================================================
   56. EMPTY STATE
   ========================================================= */

function renderEmpty(
    container,
    text
) {

    const empty =
        document.createElement(
            "div"
        );


    empty.className =
        "empty-state";


    empty.textContent =
        text;


    container.appendChild(
        empty
    );

}


/* =========================================================
   57. SESIÓN INICIAL
   ========================================================= */

async function restoreSession() {

    const result =
        await marketFlashClient
            .auth
            .getSession();


    if (
        result.error
    ) {

        console.error(
            "Sesión:",
            result.error
        );

        return;

    }


    STATE.user =
        result.data.session?.user ||
        null;


    if (STATE.user) {

        await loadUserData();

    }


    updateInterface();

}


/* =========================================================
   58. CAMBIO DE SESIÓN
   ========================================================= */

function setupAuthListener() {

    marketFlashClient.auth
        .onAuthStateChange(
            (
                event,
                session
            ) => {

                setTimeout(
                    async () => {

                        STATE.user =
                            session?.user ||
                            null;


                        if (
                            STATE.user
                        ) {

                            await loadUserData();

                        } else {

                            STATE.profile =
                                null;

                            STATE.isAdmin =
                                false;

                        }


                        updateInterface();

                    },
                    0
                );

            }
        );

}


/* =========================================================
   59. INICIALIZACIÓN
   ========================================================= */

async function initialize() {

    console.log(
        "Market Flash iniciando..."
    );


    if (
        !window.supabase
    ) {

        console.error(
            "La librería de Supabase no está cargada."
        );

        return;

    }


    setupNavigation();

    setupHeader();

    setupAuthLinks();

    setupCategories();

    setupSearch();

    setupImagePreview();

    setupAdvertisement();

    setupAuthListener();

    setupProfileButtons();

    setupProductForm();

    setupPayment();

    setupPromotions();

    setupVideos();

    setupReviews();

    setupClaims();

    setupSellerContact();

    setupAdminButtons();

    setupSupport();


    await restoreSession();

    await loadAdminSettings();

    await loadProducts();

    await loadVideos();


    if (STATE.user) {

        await loadFavorites();

        await loadPromotions();

        await loadNotifications();

        renderMyProducts();

        renderFavorites();

        renderSoldProducts();

    }


    showPage(
        "inicio"
    );


    console.log(
        "Market Flash listo."
    );

}


/* =========================================================
   60. FORMULARIO DE PRODUCTO
   ========================================================= */

function setupProductForm() {

    $("#form-publicacion")
        ?.addEventListener(
            "submit",
            createProduct
        );

}


/* =========================================================
   61. EJECUTAR
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initialize
);
