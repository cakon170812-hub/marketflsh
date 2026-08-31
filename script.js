/* =========================================================
   MARKET FLASH
   SCRIPT.JS COMPLETO
   SUPABASE + AUTENTICACIÓN + PRODUCTOS + PERFIL
   ========================================================= */

"use strict";


/* =========================================================
   1. CONFIGURACIÓN DE SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://osxuhmgnpgbxfopqdhqr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_6qLmRFGHrwGq_CKqsIH7jA_Oz8TTlQZ";


if (
    typeof window.supabase === "undefined" ||
    typeof window.supabase.createClient !== "function"
) {
    console.error(
        "No se pudo cargar la librería de Supabase."
    );
} else {

    window.marketFlashSupabase =
        window.supabase.createClient(
            SUPABASE_URL,
            SUPABASE_PUBLISHABLE_KEY,
            {
                auth: {
                    autoRefreshToken: true,
                    persistSession: true,
                    detectSessionInUrl: true
                }
            }
        );

}


const supabase =
    window.marketFlashSupabase;


/* =========================================================
   2. CONFIGURACIÓN DE MARKET FLASH
   ========================================================= */

const MARKET_FLASH_CONFIG = {

    currency: "RD$",

    publicationFee: 100,

    supportWhatsApp:
        "",

    supportMessenger:
        "",

    paypalAccount:
        "",

    binanceAddress:
        "",

    defaultPublicationMode:
        "paid"

};


/* =========================================================
   3. ESTADO GLOBAL
   ========================================================= */

const state = {

    user: null,

    profile: null,

    products: [],

    favorites: new Set(),

    currentCategory: "Todos",

    currentSearch: "",

    currentProduct: null,

    isAdmin: false,

    publicationMode: "paid"

};


/* =========================================================
   4. SELECTORES
   ========================================================= */

const $ = (selector) =>
    document.querySelector(selector);


const $$ = (selector) =>
    Array.from(document.querySelectorAll(selector));


/* =========================================================
   5. MENSAJES
   ========================================================= */

function showMessage(
    message,
    type = "info"
) {

    const container =
        $("#app-message");

    if (!container) {

        alert(message);

        return;
    }


    container.textContent =
        message;

    container.className =
        "app-message show";


    if (type === "success") {
        container.classList.add("success");
    }

    if (type === "error") {
        container.classList.add("error");
    }

    if (type === "warning") {
        container.classList.add("warning");
    }


    clearTimeout(
        container._timer
    );


    container._timer =
        setTimeout(() => {

            container.classList.remove(
                "show"
            );

        }, 4000);

}


/* =========================================================
   6. NAVEGACIÓN
   ========================================================= */

const SECTION_IDS = [

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


function showSection(
    sectionId
) {

    SECTION_IDS.forEach((id) => {

        const section =
            document.getElementById(id);

        if (!section) {
            return;
        }


        section.classList.toggle(
            "active",
            id === sectionId
        );

    });


    $$("[data-section]").forEach(
        (button) => {

            button.classList.toggle(
                "active",
                button.dataset.section === sectionId
            );

        }
    );


    const section =
        document.getElementById(sectionId);

    if (section) {

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }

}


function setupNavigation() {

    $$("[data-section]")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async () => {

                    const sectionId =
                        button.dataset.section;

                    if (
                        sectionId ===
                        "publicar"
                    ) {

                        if (!state.user) {

                            showMessage(
                                "Debes iniciar sesión para publicar.",
                                "warning"
                            );

                            showSection(
                                "inicio-sesion"
                            );

                            return;
                        }

                    }


                    if (
                        sectionId ===
                        "perfil"
                    ) {

                        if (!state.user) {

                            showMessage(
                                "Inicia sesión para acceder a tu perfil.",
                                "warning"
                            );

                            showSection(
                                "inicio-sesion"
                            );

                            return;
                        }

                    }


                    if (
                        sectionId ===
                        "administrador"
                    ) {

                        if (!state.isAdmin) {

                            showMessage(
                                "No tienes permisos de administrador.",
                                "error"
                            );

                            return;
                        }

                    }


                    showSection(
                        sectionId
                    );

                }
            );

        });

}


/* =========================================================
   7. REGISTRO
   ========================================================= */

async function registerUser(
    event
) {

    event.preventDefault();


    if (!supabase) {

        showMessage(
            "Supabase no está disponible.",
            "error"
        );

        return;
    }


    const form =
        event.currentTarget;


    const formData =
        new FormData(form);


    const nombre =
        String(
            formData.get("nombre") || ""
        ).trim();


    const correo =
        String(
            formData.get("correo") || ""
        ).trim();


    const documento =
        String(
            formData.get("documento") || ""
        ).trim();


    const telefono =
        String(
            formData.get("telefono") || ""
        ).trim();


    const whatsapp =
        String(
            formData.get("whatsapp") || ""
        ).trim();


    const messenger =
        String(
            formData.get("messenger") || ""
        ).trim();


    const password =
        String(
            formData.get("password") || ""
        );


    if (
        !nombre ||
        !correo ||
        !documento ||
        !telefono ||
        !password
    ) {

        showMessage(
            "Completa todos los campos obligatorios.",
            "warning"
        );

        return;
    }


    if (password.length < 6) {

        showMessage(
            "La contraseña debe tener al menos 6 caracteres.",
            "warning"
        );

        return;
    }


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {
        submitButton.disabled = true;
    }


    try {

        const {
            data,
            error
        } =
            await supabase.auth.signUp({

                email:
                    correo,

                password:
                    password,

                options: {

                    data: {

                        full_name:
                            nombre,

                        documento:
                            documento,

                        phone:
                            telefono,

                        whatsapp:
                            whatsapp,

                        messenger:
                            messenger

                    }

                }

            });


        if (error) {
            throw error;
        }


        /*
         * En este punto Supabase puede:
         *
         * 1. Iniciar la sesión inmediatamente,
         * o
         * 2. Pedir confirmación por correo.
         */


        if (data.user) {

            showMessage(
                "Cuenta creada correctamente.",
                "success"
            );

        }


        form.reset();


        /*
         * Si el proyecto tiene confirmación por correo,
         * mostramos un mensaje apropiado.
         */

        if (
            data.user &&
            !data.session
        ) {

            showMessage(
                "Revisa tu correo para confirmar tu cuenta.",
                "success"
            );

            showSection(
                "inicio-sesion"
            );

        }

    } catch (error) {

        console.error(
            "Error durante el registro:",
            error
        );

        showMessage(
            error.message ||
            "No se pudo crear la cuenta.",
            "error"
        );

    } finally {

        if (submitButton) {
            submitButton.disabled = false;
        }

    }

}


/* =========================================================
   8. INICIO DE SESIÓN
   ========================================================= */

async function loginUser(
    event
) {

    event.preventDefault();


    if (!supabase) {

        showMessage(
            "Supabase no está disponible.",
            "error"
        );

        return;
    }


    const form =
        event.currentTarget;


    const correo =
        String(
            form.querySelector(
                "#login-correo"
            )?.value || ""
        ).trim();


    const password =
        form.querySelector(
            "#login-password"
        )?.value || "";


    if (!correo || !password) {

        showMessage(
            "Escribe tu correo y contraseña.",
            "warning"
        );

        return;
    }


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {
        submitButton.disabled = true;
    }


    try {

        const {
            data,
            error
        } =
            await supabase.auth.signInWithPassword({

                email:
                    correo,

                password:
                    password

            });


        if (error) {
            throw error;
        }


        state.user =
            data.user;


        showMessage(
            "Has iniciado sesión correctamente.",
            "success"
        );


        form.reset();


        await loadUserData();


        showSection(
            "inicio"
        );

    } catch (error) {

        console.error(
            "Error al iniciar sesión:",
            error
        );

        showMessage(
            error.message ||
            "No se pudo iniciar sesión.",
            "error"
        );

    } finally {

        if (submitButton) {
            submitButton.disabled = false;
        }

    }

}


/* =========================================================
   9. CERRAR SESIÓN
   ========================================================= */

async function logoutUser() {

    if (!supabase) {
        return;
    }


    const {
        error
    } =
        await supabase.auth.signOut();


    if (error) {

        console.error(
            "Error al cerrar sesión:",
            error
        );

        showMessage(
            "No se pudo cerrar la sesión.",
            "error"
        );

        return;
    }


    state.user =
        null;

    state.profile =
        null;

    state.products =
        [];

    state.favorites =
        new Set();

    state.isAdmin =
        false;


    updateInterface();


    showMessage(
        "Sesión cerrada correctamente.",
        "success"
    );


    showSection(
        "inicio"
    );

}


/* =========================================================
   10. RECUPERAR CONTRASEÑA
   ========================================================= */

async function recoverPassword() {

    if (!supabase) {
        return;
    }


    const correo =
        prompt(
            "Escribe tu correo electrónico:"
        );


    if (!correo) {
        return;
    }


    const redirectUrl =
        `${window.location.origin}${window.location.pathname}`;


    const {
        error
    } =
        await supabase.auth.resetPasswordForEmail(
            correo.trim(),
            {
                redirectTo:
                    redirectUrl
            }
        );


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Revisa tu correo para recuperar tu contraseña.",
        "success"
    );

}


/* =========================================================
   11. CARGAR SESIÓN
   ========================================================= */

async function loadCurrentSession() {

    if (!supabase) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase.auth.getSession();


    if (error) {

        console.error(
            "Error obteniendo sesión:",
            error
        );

        return;
    }


    state.user =
        data.session?.user ||
        null;


    await loadUserData();


    supabase.auth.onAuthStateChange(
        async (
            event,
            session
        ) => {

            state.user =
                session?.user ||
                null;


            /*
             * No usamos operaciones complejas
             * de Supabase dentro del callback.
             */

            setTimeout(
                async () => {

                    await loadUserData();

                    updateInterface();

                },
                0
            );

        }
    );

}


/* =========================================================
   12. PERFIL
   ========================================================= */

async function loadUserData() {

    if (!state.user) {

        state.profile =
            null;

        state.isAdmin =
            false;

        return;

    }


    await loadProfile();

    await loadFavorites();

    await loadProducts();


    state.isAdmin =
        state.profile?.role ===
        "admin";

}


/* =========================================================
   13. CARGAR PERFIL DESDE SUPABASE
   ========================================================= */

async function loadProfile() {

    if (!supabase || !state.user) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("profiles")
                .select(
                    "id,full_name,documento,phone,whatsapp,messenger,role"
                )
                .eq(
                    "id",
                    state.user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Error cargando perfil:",
                error
            );

            return;
        }


        state.profile =
            data ||
            {

                id:
                    state.user.id,

                full_name:
                    state.user.user_metadata?.full_name ||
                    "",

                documento:
                    state.user.user_metadata?.documento ||
                    "",

                phone:
                    state.user.user_metadata?.phone ||
                    "",

                whatsapp:
                    state.user.user_metadata?.whatsapp ||
                    "",

                messenger:
                    state.user.user_metadata?.messenger ||
                    "",

                role:
                    "user"

            };


        if (!data) {

            /*
             * Intentamos crear el perfil si el
             * proyecto tiene la tabla preparada.
             */

            const {
                data:
                    insertedProfile,
                error:
                    insertError
            } =
                await supabase
                    .from("profiles")
                    .insert({

                        id:
                            state.user.id,

                        full_name:
                            state.profile.full_name,

                        documento:
                            state.profile.documento,

                        phone:
                            state.profile.phone,

                        whatsapp:
                            state.profile.whatsapp,

                        messenger:
                            state.profile.messenger,

                        role:
                            "user"

                    })
                    .select()
                    .single();


            if (!insertError) {

                state.profile =
                    insertedProfile;

            }

        }

    } catch (error) {

        console.error(
            "Error inesperado cargando perfil:",
            error
        );

    }

}


/* =========================================================
   14. ACTUALIZAR INTERFAZ DE USUARIO
   ========================================================= */

function updateInterface() {

    const registerButton =
        $("#btn-registrarse");

    const loginButton =
        $("#btn-iniciar-sesion");

    const profileButton =
        $("#btn-perfil");


    if (state.user) {

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

    renderProducts();

    renderFavorites();

    updatePublicationSettings();

}


/* =========================================================
   15. MOSTRAR PERFIL
   ========================================================= */

function renderProfile() {

    if (!state.profile) {
        return;
    }


    const name =
        $("#perfil-nombre");

    const email =
        $("#perfil-correo");

    const phone =
        $("#perfil-telefono");

    const whatsapp =
        $("#perfil-whatsapp");

    const messenger =
        $("#perfil-messenger");

    const documentField =
        $("#perfil-documento");


    if (name) {
        name.textContent =
            state.profile.full_name ||
            "Usuario";
    }


    if (email) {
        email.textContent =
            state.user?.email ||
            "-";
    }


    if (phone) {
        phone.textContent =
            state.profile.phone ||
            "-";
    }


    if (whatsapp) {
        whatsapp.textContent =
            state.profile.whatsapp ||
            "-";
    }


    if (messenger) {
        messenger.textContent =
            state.profile.messenger ||
            "-";
    }


    if (documentField) {
        documentField.textContent =
            state.profile.documento ||
            "-";
    }

}


/* =========================================================
   16. EDITAR PERFIL
   ========================================================= */

async function editProfile() {

    if (!state.user) {

        showMessage(
            "Debes iniciar sesión.",
            "warning"
        );

        showSection(
            "inicio-sesion"
        );

        return;
    }


    const nombre =
        prompt(
            "Nombre completo:",
            state.profile?.full_name ||
            ""
        );


    if (nombre === null) {
        return;
    }


    const telefono =
        prompt(
            "Teléfono:",
            state.profile?.phone ||
            ""
        );


    if (telefono === null) {
        return;
    }


    const whatsapp =
        prompt(
            "WhatsApp:",
            state.profile?.whatsapp ||
            ""
        );


    if (whatsapp === null) {
        return;
    }


    const messenger =
        prompt(
            "Messenger:",
            state.profile?.messenger ||
            ""
        );


    if (messenger === null) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .update({

                full_name:
                    nombre.trim(),

                phone:
                    telefono.trim(),

                whatsapp:
                    whatsapp.trim(),

                messenger:
                    messenger.trim()

            })
            .eq(
                "id",
                state.user.id
            )
            .select()
            .single();


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    state.profile =
        data;


    renderProfile();


    showMessage(
        "Perfil actualizado.",
        "success"
    );

}


/* =========================================================
   17. CATEGORÍAS
   ========================================================= */

function setupCategories() {

    $$(".category-card")
        .forEach((button) => {

            button.addEventListener(
                "click",
                async () => {

                    state.currentCategory =
                        button.dataset.category ||
                        "Todos";


                    $$(".category-card")
                        .forEach(
                            (item) => {

                                item.classList.toggle(
                                    "active",
                                    item === button
                                );

                            }
                        );


                    renderProducts();


                    const results =
                        $("#resultados-categoria");


                    if (results) {

                        results.scrollIntoView({
                            behavior:
                                "smooth",
                            block:
                                "start"
                        });

                    }

                }
            );

        });

}


/* =========================================================
   18. BÚSQUEDA
   ========================================================= */

function setupSearch() {

    const form =
        $("#form-busqueda");


    const input =
        $("#buscar");


    if (!form || !input) {
        return;
    }


    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();


            state.currentSearch =
                input.value
                    .trim()
                    .toLowerCase();


            showSection(
                "inicio"
            );


            renderProducts();

        }
    );


    $("#btn-limpiar-busqueda")
        ?.addEventListener(
            "click",
            () => {

                input.value =
                    "";

                state.currentSearch =
                    "";

                renderProducts();

            }
        );

}


/* =========================================================
   19. CARGAR PRODUCTOS
   ========================================================= */

async function loadProducts() {

    if (!supabase) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabase
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


        if (error) {

            console.error(
                "Error cargando productos:",
                error
            );

            return;
        }


        state.products =
            data ||
            [];


        renderProducts();

        renderMyProducts();

        renderAdminProducts();

    } catch (error) {

        console.error(
            "Error cargando productos:",
            error
        );

    }

}


/* =========================================================
   20. FILTRAR PRODUCTOS
   ========================================================= */

function getFilteredProducts() {

    let products =
        [...state.products];


    /*
     * Solo mostramos productos aprobados
     * en el marketplace público.
     */

    products =
        products.filter(
            (product) =>
                product.status ===
                "approved"
        );


    if (
        state.currentCategory &&
        state.currentCategory !==
        "Todos"
    ) {

        products =
            products.filter(
                (product) =>
                    String(
                        product.categoria ||
                        ""
                    ).toLowerCase() ===
                    String(
                        state.currentCategory
                    ).toLowerCase()
            );

    }


    if (
        state.currentSearch
    ) {

        products =
            products.filter(
                (product) => {

                    const searchable =
                        [
                            product.nombre,
                            product.categoria,
                            product.descripcion
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();


                    return searchable.includes(
                        state.currentSearch
                    );

                }
            );

    }


    return products;

}


/* =========================================================
   21. CREAR TARJETA DE PRODUCTO
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


    const image =
        document.createElement(
            "div"
        );


    image.className =
        "product-image";


    const imageUrls =
        Array.isArray(
            product.image_urls
        )
            ? product.image_urls
            : [];


    if (
        imageUrls.length
    ) {

        const img =
            document.createElement(
                "img"
            );


        img.src =
            imageUrls[0];

        img.alt =
            product.nombre ||
            "Producto";


        image.appendChild(
            img
        );

    } else {

        const placeholder =
            document.createElement(
                "div"
            );


        placeholder.className =
            "product-image-placeholder";


        placeholder.textContent =
            "Sin imagen";


        image.appendChild(
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
        `${MARKET_FLASH_CONFIG.currency} ${formatPrice(
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
            product.cantidad ?? 0
        }`;


    const views =
        document.createElement(
            "span"
        );


    views.textContent =
        `Vistas: ${
            product.views ?? 0
        }`;


    meta.appendChild(
        quantity
    );

    meta.appendChild(
        views
    );


    const status =
        document.createElement(
            "span"
        );


    status.className =
        "product-status";


    applyStatusClass(
        status,
        product.status
    );


    status.textContent =
        getStatusLabel(
            product.status
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
        "Ver";


    viewButton.addEventListener(
        "click",
        () => {

            openProductDetails(
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


        const isFavorite =
            state.favorites.has(
                product.id
            );


        favoriteButton.textContent =
            isFavorite
                ? "★ Favorito"
                : "☆ Favorito";


        favoriteButton.addEventListener(
            "click",
            async () => {

                await toggleFavorite(
                    product,
                    favoriteButton
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

    body.appendChild(
        status
    );

    body.appendChild(
        actions
    );


    card.appendChild(
        image
    );

    card.appendChild(
        body
    );


    return card;

}


/* =========================================================
   22. FORMATEAR PRECIO
   ========================================================= */

function formatPrice(
    value
) {

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
            minimumFractionDigits:
                2,

            maximumFractionDigits:
                2
        }
    );

}


/* =========================================================
   23. ESTADOS DE PRODUCTO
   ========================================================= */

function getStatusLabel(
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


    return labels[
        status
    ] ||
    "Pendiente";

}


function applyStatusClass(
    element,
    status
) {

    element.classList.remove(
        "pendiente",
        "aprobado",
        "rechazado",
        "vendido"
    );


    const className = {

        pending:
            "pendiente",

        approved:
            "aprobado",

        rejected:
            "rechazado",

        sold:
            "vendido"

    }[
        status
    ] ||
    "pendiente";


    element.classList.add(
        className
    );

}


/* =========================================================
   24. MOSTRAR PRODUCTOS
   ========================================================= */

function renderProducts() {

    const container =
        $("#lista-productos");


    const emptyState =
        $("#sin-productos");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    const products =
        getFilteredProducts();


    if (!products.length) {

        if (emptyState) {
            emptyState.style.display =
                "grid";
        }

        return;
    }


    if (emptyState) {
        emptyState.style.display =
            "none";
    }


    products.forEach(
        (product) => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );


    renderCategoryResults(
        products
    );

}


/* =========================================================
   25. RESULTADOS DE CATEGORÍA
   ========================================================= */

function renderCategoryResults(
    products
) {

    const container =
        $("#resultados-categoria");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    products.slice(
        0,
        12
    ).forEach(
        (product) => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   26. DETALLES DE PRODUCTO
   ========================================================= */

async function openProductDetails(
    product
) {

    state.currentProduct =
        product;


    /*
     * Aumentamos vistas si el usuario no es
     * el mismo vendedor.
     */

    if (
        supabase &&
        product.user_id !==
        state.user?.id
    ) {

        await supabase
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

    }


    const contactSection =
        $("#contactar-vendedor");


    if (contactSection) {

        const name =
            $("#contacto-vendedor-nombre");


        if (name) {

            name.textContent =
                `Contacto para: ${
                    product.nombre
                }`;

        }

    }


    showSection(
        "contactar-vendedor"
    );

}


/* =========================================================
   27. FAVORITOS
   ========================================================= */

async function loadFavorites() {

    if (
        !supabase ||
        !state.user
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from("favorites")
            .select(
                "product_id"
            )
            .eq(
                "user_id",
                state.user.id
            );


    if (error) {

        console.error(
            "Error cargando favoritos:",
            error
        );

        return;
    }


    state.favorites =
        new Set(
            (data || []).map(
                item =>
                    item.product_id
            )
        );


    renderFavorites();

}


async function toggleFavorite(
    product,
    button
) {

    if (!state.user) {

        showMessage(
            "Inicia sesión para guardar favoritos.",
            "warning"
        );

        showSection(
            "inicio-sesion"
        );

        return;
    }


    const isFavorite =
        state.favorites.has(
            product.id
        );


    if (isFavorite) {

        const {
            error
        } =
            await supabase
                .from("favorites")
                .delete()
                .eq(
                    "user_id",
                    state.user.id
                )
                .eq(
                    "product_id",
                    product.id
                );


        if (error) {

            showMessage(
                error.message,
                "error"
            );

            return;
        }


        state.favorites.delete(
            product.id
        );


        button.textContent =
            "☆ Favorito";


        showMessage(
            "Producto eliminado de favoritos.",
            "success"
        );


    } else {

        const {
            error
        } =
            await supabase
                .from("favorites")
                .insert({

                    user_id:
                        state.user.id,

                    product_id:
                        product.id

                });


        if (error) {

            showMessage(
                error.message,
                "error"
            );

            return;
        }


        state.favorites.add(
            product.id
        );


        button.textContent =
            "★ Favorito";


        showMessage(
            "Producto añadido a favoritos.",
            "success"
        );

    }


    renderFavorites();

}


/* =========================================================
   28. RENDERIZAR FAVORITOS
   ========================================================= */

function renderFavorites() {

    const container =
        $("#lista-favoritos");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!state.user) {

        return;
    }


    const favorites =
        state.products.filter(
            product =>
                state.favorites.has(
                    product.id
                )
        );


    if (!favorites.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-state";


        empty.textContent =
            "Todavía no tienes favoritos.";


        container.appendChild(
            empty
        );

        return;
    }


    favorites.forEach(
        (product) => {

            container.appendChild(
                createProductCard(
                    product
                )
            );

        }
    );

}


/* =========================================================
   29. VISTA PREVIA DE IMÁGENES
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


            const files =
                Array.from(
                    input.files ||
                    []
                );


            files.forEach(
                (file) => {

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


                    const img =
                        document.createElement(
                            "img"
                        );


                    img.src =
                        URL.createObjectURL(
                            file
                        );


                    img.alt =
                        "Vista previa";


                    wrapper.appendChild(
                        img
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
   30. SUBIR IMÁGENES A SUPABASE STORAGE
   ========================================================= */

async function uploadProductImages(
    files
) {

    if (
        !supabase ||
        !state.user
    ) {
        return [];
    }


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
            getFileExtension(
                file.name
            );


        const fileName =
            `${crypto.randomUUID()}.${extension}`;


        const path =
            `${state.user.id}/${fileName}`;


        const {
            error
        } =
            await supabase
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


        if (error) {

            console.error(
                "Error subiendo imagen:",
                error
            );

            continue;
        }


        const {
            data
        } =
            supabase
                .storage
                .from(
                    "product-images"
                )
                .getPublicUrl(
                    path
                );


        if (
            data?.publicUrl
        ) {

            urls.push(
                data.publicUrl
            );

        }

    }


    return urls;

}


/* =========================================================
   31. EXTENSIÓN
   ========================================================= */

function getFileExtension(
    fileName
) {

    const parts =
        fileName.split(".");


    return (
        parts.pop() ||
        "bin"
    ).toLowerCase();

}


/* =========================================================
   32. CONFIGURACIÓN DE PUBLICACIONES
   ========================================================= */

async function loadPublicationSettings() {

    /*
     * Primero intentamos obtener la configuración
     * desde una tabla settings.
     */

    if (
        !supabase
    ) {
        return;
    }


    try {

        const {
            data,
            error
        } =
            await supabase
                .from("settings")
                .select(
                    "key,value"
                );


        if (
            !error &&
            Array.isArray(data)
        ) {

            const settings =
                Object.fromEntries(
                    data.map(
                        item => [
                            item.key,
                            item.value
                        ]
                    )
                );


            if (
                settings.publications_mode
            ) {

                state.publicationMode =
                    settings.publications_mode;

            }

        }

    } catch (error) {

        console.error(
            "No se pudo cargar settings:",
            error
        );

    }


    updatePublicationSettings();

}


function updatePublicationSettings() {

    const text =
        $("#texto-estado-publicacion");


    const adminText =
        $("#admin-texto-publicaciones");


    let message =
        "Publicaciones de pago.";


    if (
        state.publicationMode ===
        "free"
    ) {

        message =
            "Las publicaciones son gratuitas.";

    }


    if (
        state.publicationMode ===
        "paid"
    ) {

        message =
            `La publicación requiere un pago de RD$ ${formatPrice(
            MARKET_FLASH_CONFIG.publicationFee
        )}.`;

    }


    if (text) {
        text.textContent =
            message;
    }


    if (adminText) {
        adminText.textContent =
            message;
    }

}


/* =========================================================
   33. PUBLICAR PRODUCTO
   ========================================================= */

async function createProduct(
    event
) {

    event.preventDefault();


    if (!state.user) {

        showMessage(
            "Debes iniciar sesión para publicar.",
            "warning"
        );

        showSection(
            "inicio-sesion"
        );

        return;
    }


    const form =
        event.currentTarget;


    const nombre =
        $("#producto-nombre")
            ?.value.trim();


    const categoria =
        $("#producto-categoria")
            ?.value;


    const precio =
        Number(
            $("#producto-precio")
                ?.value
        );


    const cantidad =
        Number(
            $("#producto-cantidad")
                ?.value
        );


    const descripcion =
        $("#producto-descripcion")
            ?.value.trim();


    const contacto =
        $("#producto-contacto")
            ?.value;


    const imageInput =
        $("#producto-imagen");


    if (
        !nombre ||
        !categoria ||
        !precio ||
        cantidad < 1 ||
        !descripcion ||
        !contacto
    ) {

        showMessage(
            "Completa correctamente todos los campos.",
            "warning"
        );

        return;
    }


    const files =
        Array.from(
            imageInput?.files ||
            []
        );


    const submitButton =
        form.querySelector(
            'button[type="submit"]'
        );


    if (submitButton) {
        submitButton.disabled = true;
    }


    try {

        let imageUrls = [];


        if (
            files.length
        ) {

            imageUrls =
                await uploadProductImages(
                    files
                );

        }


        let status =
            "pending";


        /*
         * Si las publicaciones son gratuitas,
         * podrían aprobarse directamente.
         *
         * Para mantener la revisión administrativa,
         * dejamos pending.
         */

        if (
            state.publicationMode ===
            "free"
        ) {

            status =
                "pending";

        }


        const {
            data,
            error
        } =
            await supabase
                .from("products")
                .insert({

                    user_id:
                        state.user.id,

                    nombre:
                        nombre,

                    categoria:
                        categoria,

                    precio:
                        precio,

                    cantidad:
                        cantidad,

                    descripcion:
                        descripcion,

                    contacto:
                        contacto,

                    status:
                        status,

                    image_urls:
                        imageUrls,

                    views:
                        0

                })
                .select()
                .single();


        if (error) {
            throw error;
        }


        if (
            data
        ) {

            state.products.unshift(
                data
            );

        }


        form.reset();


        const preview =
            $("#preview-imagenes");


        if (preview) {
            preview.innerHTML =
                "";
        }


        showMessage(
            state.publicationMode === "paid"
                ? "Publicación creada. Ahora debes enviar el comprobante de pago."
                : "Publicación enviada para revisión.",
            "success"
        );


        await loadProducts();


        if (
            state.publicationMode ===
            "paid"
        ) {

            state.currentProduct =
                data;


            showSection(
                "pago"
            );

        } else {

            showSection(
                "perfil"
            );

        }

    } catch (error) {

        console.error(
            "Error creando producto:",
            error
        );

        showMessage(
            error.message ||
            "No se pudo crear la publicación.",
            "error"
        );

    } finally {

        if (submitButton) {
            submitButton.disabled = false;
        }

    }

}


/* =========================================================
   34. MIS PUBLICACIONES
   ========================================================= */

function renderMyProducts() {

    const container =
        $("#mis-publicaciones");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!state.user) {
        return;
    }


    const myProducts =
        state.products.filter(
            product =>
                product.user_id ===
                state.user.id
        );


    if (!myProducts.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-state";


        empty.textContent =
            "Todavía no tienes publicaciones.";


        container.appendChild(
            empty
        );

        return;
    }


    myProducts.forEach(
        (product) => {

            const card =
                createProductCard(
                    product,
                    {
                        hideFavorite:
                            true
                    }
                );


            const actions =
                card.querySelector(
                    ".product-actions"
                );


            if (
                actions &&
                product.status !==
                "sold"
            ) {

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
                    async () => {

                        await markProductSold(
                            product.id
                        );

                    }
                );


                actions.appendChild(
                    soldButton
                );

            }


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   35. MARCAR VENDIDO
   ========================================================= */

async function markProductSold(
    productId
) {

    if (
        !state.user ||
        !supabase
    ) {
        return;
    }


    const {
        error
    } =
        await supabase
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
                state.user.id
            );


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Producto marcado como vendido.",
        "success"
    );


    await loadProducts();

    renderMyProducts();

    renderProducts();

}


/* =========================================================
   36. PRODUCTOS VENDIDOS
   ========================================================= */

function renderSoldProducts() {

    const container =
        $("#lista-vendidos");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!state.user) {
        return;
    }


    const sold =
        state.products.filter(
            product =>
                product.user_id ===
                state.user.id &&
                product.status ===
                "sold"
        );


    if (!sold.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-state";


        empty.textContent =
            "Todavía no tienes productos vendidos.";


        container.appendChild(
            empty
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
   37. COMPROBANTES
   ========================================================= */

function setupPayment() {

    $$(
        'input[name="metodo-pago"]'
    ).forEach(
        radio => {

            radio.addEventListener(
                "change",
                () => {

                    const binance =
                        $("#bloque-binance");

                    const paypal =
                        $("#bloque-paypal");


                    if (
                        binance
                    ) {

                        binance.classList.toggle(
                            "hidden",
                            radio.value !==
                            "binance"
                        );

                    }


                    if (
                        paypal
                    ) {

                        paypal.classList.toggle(
                            "hidden",
                            radio.value !==
                            "paypal"
                        );

                    }

                }
            );

        }
    );


    updatePaymentInformation();

}


function updatePaymentInformation() {

    const binance =
        $("#direccion-binance");


    const paypal =
        $("#cuenta-paypal");


    if (binance) {

        binance.textContent =
            MARKET_FLASH_CONFIG.binanceAddress ||
            "Pendiente de configuración";

    }


    if (paypal) {

        paypal.textContent =
            MARKET_FLASH_CONFIG.paypalAccount ||
            "Pendiente de configuración";

    }

}


/* =========================================================
   38. COPIAR BINANCE
   ========================================================= */

async function copyBinanceAddress() {

    const address =
        MARKET_FLASH_CONFIG.binanceAddress;


    if (!address) {

        showMessage(
            "La dirección de Binance todavía no está configurada.",
            "warning"
        );

        return;
    }


    try {

        await navigator.clipboard.writeText(
            address
        );


        showMessage(
            "Dirección de Binance copiada.",
            "success"
        );

    } catch (error) {

        console.error(
            "Error copiando dirección:",
            error
        );

        showMessage(
            "No se pudo copiar la dirección.",
            "error"
        );

    }

}


/* =========================================================
   39. PREVISUALIZACIÓN DE COMPROBANTE
   ========================================================= */

function setupReceiptPreview() {

    const input =
        $("#comprobante-pago");


    const preview =
        $("#preview-comprobante");


    if (!input || !preview) {
        return;
    }


    input.addEventListener(
        "change",
        () => {

            preview.innerHTML =
                "";


            const file =
                input.files?.[0];


            if (!file) {
                return;
            }


            if (
                file.type.startsWith(
                    "image/"
                )
            ) {

                const img =
                    document.createElement(
                        "img"
                    );


                img.src =
                    URL.createObjectURL(
                        file
                    );


                img.alt =
                    "Comprobante";


                preview.appendChild(
                    img
                );

            } else {

                preview.textContent =
                    `Archivo seleccionado: ${
                        file.name
                    }`;

            }

        }
    );

}


/* =========================================================
   40. SUBIR COMPROBANTE
   ========================================================= */

async function uploadReceipt(
    file
) {

    if (
        !supabase ||
        !state.user
    ) {
        throw new Error(
            "Usuario no autenticado."
        );
    }


    const extension =
        getFileExtension(
            file.name
        );


    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const path =
        `${state.user.id}/${fileName}`;


    const {
        error
    } =
        await supabase
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


    if (error) {
        throw error;
    }


    const {
        data
    } =
        supabase
            .storage
            .from(
                "payment-receipts"
            )
            .getPublicUrl(
                path
            );


    return data?.publicUrl ||
        null;

}


/* =========================================================
   41. ENVIAR COMPROBANTE
   ========================================================= */

async function submitPaymentReceipt() {

    if (!state.user) {

        showMessage(
            "Debes iniciar sesión.",
            "warning"
        );

        showSection(
            "inicio-sesion"
        );

        return;
    }


    if (!state.currentProduct) {

        showMessage(
            "Primero debes seleccionar una publicación.",
            "warning"
        );

        return;
    }


    const method =
        document.querySelector(
            'input[name="metodo-pago"]:checked'
        )?.value;


    const input =
        $("#comprobante-pago");


    const file =
        input?.files?.[0];


    if (!method) {

        showMessage(
            "Selecciona un método de pago.",
            "warning"
        );

        return;
    }


    if (!file) {

        showMessage(
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


        const {
            error
        } =
            await supabase
                .from(
                    "payments"
                )
                .insert({

                    user_id:
                        state.user.id,

                    product_id:
                        state.currentProduct.id,

                    method:
                        method,

                    amount:
                        MARKET_FLASH_CONFIG.publicationFee,

                    receipt_url:
                        receiptUrl,

                    status:
                        "pending"

                });


        if (error) {
            throw error;
        }


        const statusBox =
            $("#estado-pago");


        if (statusBox) {

            statusBox.textContent =
                "Estado: comprobante enviado y pendiente de revisión.";

        }


        if (input) {
            input.value =
                "";
        }


        const preview =
            $("#preview-comprobante");


        if (preview) {
            preview.innerHTML =
                "";
        }


        showMessage(
            "Comprobante enviado correctamente.",
            "success"
        );


        await loadNotifications();


    } catch (error) {

        console.error(
            "Error enviando comprobante:",
            error
        );


        showMessage(
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
   42. PROMOCIONES
   ========================================================= */

async function requestPromotion(
    type
) {

    if (!state.user) {

        showMessage(
            "Inicia sesión para solicitar una promoción.",
            "warning"
        );

        showSection(
            "inicio-sesion"
        );

        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "promotions"
            )
            .insert({

                user_id:
                    state.user.id,

                promotion_type:
                    type,

                status:
                    "pending"

            });


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    showMessage(
        "Solicitud de promoción enviada.",
        "success"
    );


    await loadPromotions();

}


/* =========================================================
   43. CARGAR PROMOCIONES
   ========================================================= */

async function loadPromotions() {

    if (
        !supabase ||
        !state.user
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "promotions"
            )
            .select(
                "id,promotion_type,status,created_at"
            )
            .eq(
                "user_id",
                state.user.id
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(
            "Error cargando promociones:",
            error
        );

        return;
    }


    renderPromotions(
        data ||
        []
    );

}


/* =========================================================
   44. MOSTRAR PROMOCIONES
   ========================================================= */

function renderPromotions(
    promotions
) {

    const container =
        $("#lista-promociones");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!promotions.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-state";


        empty.textContent =
            "No tienes solicitudes de promoción.";


        container.appendChild(
            empty
        );

        return;
    }


    promotions.forEach(
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
   45. VÍDEOS
   ========================================================= */

async function uploadVideo(
    file
) {

    if (
        !supabase ||
        !state.user
    ) {
        throw new Error(
            "Usuario no autenticado."
        );
    }


    const extension =
        getFileExtension(
            file.name
        );


    const fileName =
        `${crypto.randomUUID()}.${extension}`;


    const path =
        `${state.user.id}/${fileName}`;


    const {
        error
    } =
        await supabase
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


    if (error) {
        throw error;
    }


    const {
        data
    } =
        supabase
            .storage
            .from(
                "market-videos"
            )
            .getPublicUrl(
                path
            );


    return data?.publicUrl ||
        null;

}


/* =========================================================
   46. PUBLICAR VIDEO
   ========================================================= */

async function createVideo(
    event
) {

    event.preventDefault();


    if (!state.user) {

        showMessage(
            "Inicia sesión para publicar un vídeo.",
            "warning"
        );

        return;
    }


    const title =
        $("#video-titulo")
            ?.value.trim();


    const description =
        $("#video-descripcion")
            ?.value.trim();


    const file =
        $("#video-archivo")
            ?.files?.[0];


    if (!title || !file) {

        showMessage(
            "Completa el título y selecciona un vídeo.",
            "warning"
        );

        return;
    }


    if (
        !file.type.startsWith(
            "video/"
        )
    ) {

        showMessage(
            "Selecciona un archivo de vídeo válido.",
            "warning"
        );

        return;
    }


    try {

        const videoUrl =
            await uploadVideo(
                file
            );


        const {
            error
        } =
            await supabase
                .from(
                    "videos"
                )
                .insert({

                    user_id:
                        state.user.id,

                    title:
                        title,

                    description:
                        description,

                    video_url:
                        videoUrl,

                    status:
                        "pending"

                });


        if (error) {
            throw error;
        }


        event.currentTarget.reset();


        showMessage(
            "Vídeo enviado para revisión.",
            "success"
        );


        await loadVideos();

    } catch (error) {

        console.error(
            "Error publicando vídeo:",
            error
        );

        showMessage(
            error.message ||
            "No se pudo publicar el vídeo.",
            "error"
        );

    }

}


/* =========================================================
   47. CARGAR VÍDEOS
   ========================================================= */

async function loadVideos() {

    if (!supabase) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "videos"
            )
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


    if (error) {

        console.error(
            "Error cargando vídeos:",
            error
        );

        return;
    }


    renderVideos(
        data ||
        []
    );

}


/* =========================================================
   48. MOSTRAR VÍDEOS
   ========================================================= */

function renderVideos(
    videos
) {

    const container =
        $("#lista-videos");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    videos.forEach(
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


            player.src =
                video.video_url;


            player.preload =
                "metadata";


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
                video.title ||
                "Vídeo";


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
   49. CALIFICACIONES
   ========================================================= */

async function submitReview(
    event
) {

    event.preventDefault();


    if (!state.user) {

        showMessage(
            "Inicia sesión para calificar.",
            "warning"
        );

        return;
    }


    if (!state.currentProduct) {

        showMessage(
            "Selecciona un producto primero.",
            "warning"
        );

        return;
    }


    const stars =
        Number(
            $("#calificacion-estrellas")
                ?.value
        );


    const comment =
        $("#calificacion-comentario")
            ?.value.trim();


    if (
        !stars ||
        stars < 1 ||
        stars > 5
    ) {

        showMessage(
            "Selecciona una calificación válida.",
            "warning"
        );

        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "reviews"
            )
            .insert({

                reviewer_id:
                    state.user.id,

                product_id:
                    state.currentProduct.id,

                seller_id:
                    state.currentProduct.user_id,

                rating:
                    stars,

                comment:
                    comment ||
                    ""

            });


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    event.currentTarget.reset();


    showMessage(
        "Calificación enviada.",
        "success"
    );

}


/* =========================================================
   50. RECLAMOS
   ========================================================= */

async function submitClaim(
    event
) {

    event.preventDefault();


    if (!state.user) {

        showMessage(
            "Inicia sesión para enviar un reclamo.",
            "warning"
        );

        return;
    }


    const motivo =
        $("#reclamo-motivo")
            ?.value;


    const detalle =
        $("#reclamo-detalle")
            ?.value.trim();


    if (
        !motivo ||
        !detalle
    ) {

        showMessage(
            "Completa el motivo y los detalles.",
            "warning"
        );

        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "reports"
            )
            .insert({

                user_id:
                    state.user.id,

                reason:
                    motivo,

                details:
                    detalle,

                status:
                    "pending"

            });


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    event.currentTarget.reset();


    showMessage(
        "Reclamo enviado correctamente.",
        "success"
    );


    await loadNotifications();

}


/* =========================================================
   51. NOTIFICACIONES
   ========================================================= */

async function loadNotifications() {

    if (
        !supabase ||
        !state.user
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from(
                "notifications"
            )
            .select(
                "id,title,message,read,created_at"
            )
            .eq(
                "user_id",
                state.user.id
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


    if (error) {

        console.error(
            "Error cargando notificaciones:",
            error
        );

        return;
    }


    renderNotifications(
        data ||
        []
    );

}


/* =========================================================
   52. MOSTRAR NOTIFICACIONES
   ========================================================= */

function renderNotifications(
    notifications
) {

    const container =
        $("#lista-notificaciones");


    if (!container) {
        return;
    }


    container.innerHTML =
        "";


    if (!notifications.length) {

        const empty =
            document.createElement(
                "div"
            );


        empty.className =
            "empty-state";


        empty.textContent =
            "No tienes notificaciones.";


        container.appendChild(
            empty
        );

        return;
    }


    notifications.forEach(
        notification => {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "notification-card";


            if (!notification.read) {

                card.classList.add(
                    "unread"
                );

            }


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                notification.title ||
                "Notificación";


            const message =
                document.createElement(
                    "p"
                );


            message.textContent =
                notification.message ||
                "";


            const time =
                document.createElement(
                    "span"
                );


            time.className =
                "notification-time";


            time.textContent =
                formatDate(
                    notification.created_at
                );


            card.appendChild(
                title
            );

            card.appendChild(
                message
            );

            card.appendChild(
                time
            );


            container.appendChild(
                card
            );

        }
    );

}


/* =========================================================
   53. ADMINISTRADOR
   ========================================================= */

async function loadAdminData() {

    if (
        !state.isAdmin ||
        !supabase
    ) {
        return;
    }


    await Promise.all([
        loadAdminStats(),
        loadAdminPayments(),
        loadAdminPendingProducts(),
        loadAdminActiveProducts(),
        loadAdminUsers(),
        loadAdminReports()
    ]);

}


/* =========================================================
   54. ESTADÍSTICAS ADMIN
   ========================================================= */

async function loadAdminStats() {

    /*
     * Se utilizan consultas COUNT.
     */

    const [
        usersResult,
        pendingResult,
        paymentsResult,
        activeResult
    ] =
        await Promise.all([

            supabase
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

            supabase
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

            supabase
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

            supabase
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


    setText(
        "#admin-total-usuarios",
        usersResult.count ??
        0
    );


    setText(
        "#admin-total-pendientes",
        pendingResult.count ??
        0
    );


    setText(
        "#admin-total-pagos",
        paymentsResult.count ??
        0
    );


    setText(
        "#admin-total-activas",
        activeResult.count ??
        0
    );

}


/* =========================================================
   55. ADMIN — PAGOS
   ========================================================= */

async function loadAdminPayments() {

    const container =
        $("#admin-comprobantes");


    if (
        !container ||
        !state.isAdmin
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from("payments")
            .select(
                `
                id,
                user_id,
                product_id,
                method,
                amount,
                receipt_url,
                status,
                created_at
                `
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


    if (error) {

        console.error(
            "Error cargando pagos admin:",
            error
        );

        return;
    }


    container.innerHTML =
        "";


    if (!data?.length) {

        renderAdminEmpty(
            container,
            "No hay comprobantes pendientes."
        );

        return;
    }


    data.forEach(
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
   56. REVISAR PAGO
   ========================================================= */

async function reviewPayment(
    paymentId,
    status
) {

    if (!state.isAdmin) {
        return;
    }


    const {
        data:
            payment,
        error:
            paymentError
    } =
        await supabase
            .from("payments")
            .select(
                "id,product_id,user_id"
            )
            .eq(
                "id",
                paymentId
            )
            .single();


    if (paymentError) {

        showMessage(
            paymentError.message,
            "error"
        );

        return;
    }


    const {
        error:
            updatePaymentError
    } =
        await supabase
            .from("payments")
            .update({
                status:
                    status
            })
            .eq(
                "id",
                paymentId
            );


    if (updatePaymentError) {

        showMessage(
            updatePaymentError.message,
            "error"
        );

        return;
    }


    if (
        status ===
        "approved"
    ) {

        await supabase
            .from("products")
            .update({
                status:
                    "approved"
            })
            .eq(
                "id",
                payment.product_id
            );

    }


    await createNotification(
        payment.user_id,
        status === "approved"
            ? "Pago aprobado"
            : "Pago rechazado",
        status === "approved"
            ? "Tu comprobante fue aprobado y tu publicación puede ser activada."
            : "Tu comprobante fue rechazado. Revisa la información y vuelve a intentarlo."
    );


    showMessage(
        status === "approved"
            ? "Pago aprobado."
            : "Pago rechazado.",
        "success"
    );


    await loadAdminData();

    await loadProducts();

}


/* =========================================================
   57. ADMIN — PRODUCTOS PENDIENTES
   ========================================================= */

async function loadAdminPendingProducts() {

    const container =
        $("#admin-publicaciones-pendientes");


    if (
        !container ||
        !state.isAdmin
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
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
                created_at
                `
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


    if (error) {

        console.error(
            "Error cargando pendientes:",
            error
        );

        return;
    }


    container.innerHTML =
        "";


    if (!data?.length) {

        renderAdminEmpty(
            container,
            "No hay publicaciones pendientes."
        );

        return;
    }


    data.forEach(
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


            const details =
                document.createElement(
                    "p"
                );


            details.textContent =
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
                "Aprobar publicación";


            approve.addEventListener(
                "click",
                () =>
                    reviewProduct(
                        product.id,
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
                        product.id,
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
                details
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
   58. ADMIN — REVISAR PRODUCTO
   ========================================================= */

async function reviewProduct(
    productId,
    status
) {

    if (!state.isAdmin) {
        return;
    }


    const {
        data:
            product,
        error:
            productError
    } =
        await supabase
            .from("products")
            .select(
                "id,user_id,nombre"
            )
            .eq(
                "id",
                productId
            )
            .single();


    if (productError) {

        showMessage(
            productError.message,
            "error"
        );

        return;
    }


    const {
        error
    } =
        await supabase
            .from("products")
            .update({
                status:
                    status
            })
            .eq(
                "id",
                productId
            );


    if (error) {

        showMessage(
            error.message,
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


    showMessage(
        status === "approved"
            ? "Publicación aprobada."
            : "Publicación rechazada.",
        "success"
    );


    await loadProducts();

    await loadAdminData();

}


/* =========================================================
   59. ADMIN — PRODUCTOS ACTIVOS
   ========================================================= */

function renderAdminProducts() {

    const container =
        $("#admin-publicaciones-activas");


    if (
        !container ||
        !state.isAdmin
    ) {
        return;
    }


    container.innerHTML =
        "";


    const active =
        state.products.filter(
            product =>
                product.status ===
                "approved"
        );


    if (!active.length) {

        renderAdminEmpty(
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
   60. ADMIN — USUARIOS
   ========================================================= */

async function loadAdminUsers() {

    const container =
        $("#admin-usuarios");


    if (
        !container ||
        !state.isAdmin
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
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


    if (error) {

        console.error(
            "Error cargando usuarios:",
            error
        );

        return;
    }


    container.innerHTML =
        "";


    if (!data?.length) {

        renderAdminEmpty(
            container,
            "No hay usuarios registrados."
        );

        return;
    }


    data.forEach(
        user => {

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
                user.full_name ||
                "Usuario";


            const info =
                document.createElement(
                    "p"
                );


            info.textContent =
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
                title
            );

            item.appendChild(
                info
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
   61. ADMIN — REPORTES
   ========================================================= */

async function loadAdminReports() {

    const container =
        $("#admin-reclamos");


    if (
        !container ||
        !state.isAdmin
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
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


    if (error) {

        console.error(
            "Error cargando reclamos:",
            error
        );

        return;
    }


    container.innerHTML =
        "";


    if (!data?.length) {

        renderAdminEmpty(
            container,
            "No hay reclamos."
        );

        return;
    }


    data.forEach(
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
   62. CONFIGURACIÓN ADMIN
   ========================================================= */

async function togglePublicationMode() {

    if (!state.isAdmin) {
        return;
    }


    const newMode =
        state.publicationMode ===
        "paid"
            ? "free"
            : "paid";


    const {
        error
    } =
        await supabase
            .from("settings")
            .upsert({

                key:
                    "publications_mode",

                value:
                    newMode

            });


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    state.publicationMode =
        newMode;


    updatePublicationSettings();


    showMessage(
        newMode === "paid"
            ? "Las publicaciones ahora requieren pago."
            : "Las publicaciones ahora son gratuitas.",
        "success"
    );

}


/* =========================================================
   63. CONFIGURACIÓN DE PROMOCIONES
   ========================================================= */

async function togglePromotions() {

    if (!state.isAdmin) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from("settings")
            .select(
                "value"
            )
            .eq(
                "key",
                "promotions_active"
            )
            .maybeSingle();


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;
    }


    const current =
        data?.value ===
        "true";


    const next =
        !current;


    const {
        error:
            updateError
    } =
        await supabase
            .from("settings")
            .upsert({

                key:
                    "promotions_active",

                value:
                    String(next)

            });


    if (updateError) {

        showMessage(
            updateError.message,
            "error"
        );

        return;
    }


    const text =
        $("#admin-texto-promociones");


    if (text) {

        text.textContent =
            next
                ? "Las promociones están activas."
                : "Las promociones están desactivadas.";

    }


    showMessage(
        next
            ? "Promociones activadas."
            : "Promociones desactivadas.",
        "success"
    );

}


/* =========================================================
   64. CREAR NOTIFICACIÓN
   ========================================================= */

async function createNotification(
    userId,
    title,
    message
) {

    if (
        !supabase ||
        !userId
    ) {
        return;
    }


    const {
        error
    } =
        await supabase
            .from(
                "notifications"
            )
            .insert({

                user_id:
                    userId,

                title:
                    title,

                message:
                    message,

                read:
                    false

            });


    if (error) {

        console.error(
            "Error creando notificación:",
            error
        );

    }

}


/* =========================================================
   65. ADMIN EMPTY
   ========================================================= */

function renderAdminEmpty(
    container,
    message
) {

    const empty =
        document.createElement(
            "div"
        );


    empty.className =
        "empty-state";


    empty.textContent =
        message;


    container.appendChild(
        empty
    );

}


/* =========================================================
   66. FECHAS
   ========================================================= */

function formatDate(
    value
) {

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
            dateStyle:
                "medium",

            timeStyle:
                "short"
        }
    );

}


/* =========================================================
   67. TEXTO
   ========================================================= */

function setText(
    selector,
    value
) {

    const element =
        $(selector);


    if (element) {

        element.textContent =
            String(value);

    }

}


/* =========================================================
   68. SOPORTE WHATSAPP
   ========================================================= */

function openWhatsApp(
    phone
) {

    if (!phone) {

        showMessage(
            "El WhatsApp de soporte todavía no está configurado.",
            "warning"
        );

        return;
    }


    const clean =
        phone.replace(
            /\D/g,
            ""
        );


    const url =
        `https://wa.me/${clean}`;


    window.open(
        url,
        "_blank",
        "noopener"
    );

}


/* =========================================================
   69. SOPORTE MESSENGER
   ========================================================= */

function openMessenger(
    username
) {

    if (!username) {

        showMessage(
            "Messenger de soporte todavía no está configurado.",
            "warning"
        );

        return;
    }


    const url =
        username.startsWith(
            "http"
        )
            ? username
            : `https://m.me/${username}`;


    window.open(
        url,
        "_blank",
        "noopener"
    );

}


/* =========================================================
   70. AYUDA
   ========================================================= */

function showHelp() {

    showMessage(
        "Market Flash permite comprar, vender, publicar, promocionar y contactar con otros usuarios.",
        "info"
    );

}


/* =========================================================
   71. BOTONES DEL HEADER
   ========================================================= */

function setupHeaderButtons() {

    $("#btn-registrarse")
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "registro"
                );

            }
        );


    $("#btn-iniciar-sesion")
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "inicio-sesion"
                );

            }
        );


    $("#btn-perfil")
        ?.addEventListener(
            "click",
            () => {

                if (!state.user) {

                    showSection(
                        "inicio-sesion"
                    );

                    return;
                }


                showSection(
                    "perfil"
                );

            }
        );

}


/* =========================================================
   72. REGISTRO / LOGIN
   ========================================================= */

function setupAuthForms() {

    $("#formulario-registro")
        ?.addEventListener(
            "submit",
            registerUser
        );


    $("#formulario-login")
        ?.addEventListener(
            "submit",
            loginUser
        );


    $("#btn-ir-login")
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "inicio-sesion"
                );

            }
        );


    $("#btn-ir-registro")
        ?.addEventListener(
            "click",
            () => {

                showSection(
                    "registro"
                );

            }
        );


    $("#btn-recuperar-password")
        ?.addEventListener(
            "click",
            recoverPassword
        );


    $("#btn-editar-perfil")
        ?.addEventListener(
            "click",
            editProfile
        );


    $("#btn-cerrar-sesion")
        ?.addEventListener(
            "click",
            logoutUser
        );

}


/* =========================================================
   73. FORMULARIO DE PRODUCTOS
   ========================================================= */

function setupProductForm() {

    $("#form-publicacion")
        ?.addEventListener(
            "submit",
            createProduct
        );

}


/* =========================================================
   74. PROMOCIONES
   ========================================================= */

function setupPromotionButtons() {

    $$(
        "[data-promotion]"
    ).forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    requestPromotion(
                        button.dataset.promotion
                    );

                }
            );

        }
    );

}


/* =========================================================
   75. VIDEO
   ========================================================= */

function setupVideoForm() {

    $("#form-video")
        ?.addEventListener(
            "submit",
            createVideo
        );

}


/* =========================================================
   76. CALIFICACIÓN
   ========================================================= */

function setupReviewForm() {

    $("#form-calificacion")
        ?.addEventListener(
            "submit",
            submitReview
        );

}


/* =========================================================
   77. RECLAMOS
   ========================================================= */

function setupClaimForm() {

    $("#form-reclamo")
        ?.addEventListener(
            "submit",
            submitClaim
        );

}


/* =========================================================
   78. PAGO
   ========================================================= */

function setupPaymentButtons() {

    $("#btn-copiar-binance")
        ?.addEventListener(
            "click",
            copyBinanceAddress
        );


    $("#btn-enviar-comprobante")
        ?.addEventListener(
            "click",
            submitPaymentReceipt
        );

}


/* =========================================================
   79. SOPORTE
   ========================================================= */

function setupSupportButtons() {

    $("#soporte-whatsapp")
        ?.addEventListener(
            "click",
            () => {

                openWhatsApp(
                    MARKET_FLASH_CONFIG
                        .supportWhatsApp
                );

            }
        );


    $("#soporte-messenger")
        ?.addEventListener(
            "click",
            () => {

                openMessenger(
                    MARKET_FLASH_CONFIG
                        .supportMessenger
                );

            }
        );


    $("#soporte-ayuda")
        ?.addEventListener(
            "click",
            showHelp
        );


    $("#footer-whatsapp")
        ?.addEventListener(
            "click",
            () => {

                openWhatsApp(
                    MARKET_FLASH_CONFIG
                        .supportWhatsApp
                );

            }
        );


    $("#footer-messenger")
        ?.addEventListener(
            "click",
            () => {

                openMessenger(
                    MARKET_FLASH_CONFIG
                        .supportMessenger
                );

            }
        );

}


/* =========================================================
   80. ADMIN
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
   81. ESTADO DE PROMOCIONES
   ========================================================= */

async function updateAdminPromotionText() {

    const element =
        $("#admin-texto-promociones");


    if (
        !element ||
        !supabase
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await supabase
            .from("settings")
            .select(
                "value"
            )
            .eq(
                "key",
                "promotions_active"
            )
            .maybeSingle();


    if (error) {

        element.textContent =
            "Configuración pendiente.";

        return;
    }


    element.textContent =
        data?.value ===
        "true"
            ? "Las promociones están activas."
            : "Las promociones están desactivadas.";

}


/* =========================================================
   82. INICIO DE LA APLICACIÓN
   ========================================================= */

async function initializeMarketFlash() {

    console.log(
        "Market Flash iniciando..."
    );


    if (!supabase) {

        showMessage(
            "No se pudo conectar con Supabase.",
            "error"
        );

        return;
    }


    setupNavigation();

    setupHeaderButtons();

    setupAuthForms();

    setupCategories();

    setupSearch();

    setupImagePreview();

    setupProductForm();

    setupPayment();

    setupReceiptPreview();

    setupPaymentButtons();

    setupPromotionButtons();

    setupVideoForm();

    setupReviewForm();

    setupClaimForm();

    setupSupportButtons();

    setupAdminButtons();


    await loadCurrentSession();

    await loadPublicationSettings();

    await loadProducts();

    await loadVideos();


    if (state.user) {

        await loadFavorites();

        await loadPromotions();

        await loadNotifications();

        renderMyProducts();

        renderSoldProducts();

    }


    updateInterface();


    if (state.isAdmin) {

        await loadAdminData();

        await updateAdminPromotionText();

    }


    showSection(
        "inicio"
    );


    console.log(
        "Market Flash listo."
    );

}


/* =========================================================
   83. EJECUTAR
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        initializeMarketFlash();

    }
);
