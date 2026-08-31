"use strict";

/* =========================================================
   MARKET FLASH
   SCRIPT.JS — AUTENTICACIÓN Y NAVEGACIÓN
   ========================================================= */


/* =========================================================
   1. CONFIGURACIÓN SUPABASE
   ========================================================= */

const SUPABASE_URL =
    "https://osxuhmgnpgbxfopqdhqr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_6qLmRFGHrwGq_CKqsIH7jA_Oz8TTlQZ";


/*
 * En index.html ya cargamos:
 *
 * https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2
 *
 * Por eso utilizamos window.supabase directamente
 * y NO declaramos otra variable llamada supabase.
 */

if (
    !window.supabase ||
    typeof window.supabase.createClient !== "function"
) {

    console.error(
        "La librería de Supabase no se ha cargado."
    );

} else {

    window.marketFlashClient =
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


/* =========================================================
   2. ESTADO DE LA APLICACIÓN
   ========================================================= */

const MARKET_FLASH = {

    user: null,

    profile: null,

    isAdmin: false,

    currentSection: "inicio"

};


/* =========================================================
   3. UTILIDADES
   ========================================================= */

function getElement(selector) {

    return document.querySelector(selector);

}


function getElements(selector) {

    return Array.from(
        document.querySelectorAll(selector)
    );

}


/* =========================================================
   4. MENSAJES
   ========================================================= */

function showMessage(
    text,
    type = "info"
) {

    const element =
        getElement("#app-message");


    if (!element) {

        console.log(text);

        return;

    }


    element.textContent =
        text;


    element.className =
        "app-message show";


    if (
        type === "success"
    ) {

        element.classList.add(
            "success"
        );

    }


    if (
        type === "error"
    ) {

        element.classList.add(
            "error"
        );

    }


    if (
        type === "warning"
    ) {

        element.classList.add(
            "warning"
        );

    }


    clearTimeout(
        element._marketFlashTimer
    );


    element._marketFlashTimer =
        setTimeout(
            () => {

                element.classList.remove(
                    "show"
                );

            },
            4000
        );

}


/* =========================================================
   5. MOSTRAR SECCIÓN
   ========================================================= */

const MARKET_FLASH_SECTIONS = [

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

    if (
        !MARKET_FLASH_SECTIONS.includes(
            sectionId
        )
    ) {

        return;

    }


    MARKET_FLASH_SECTIONS.forEach(
        id => {

            const section =
                document.getElementById(id);


            if (!section) {
                return;
            }


            section.classList.toggle(
                "active",
                id === sectionId
            );

        }
    );


    getElements(
        "[data-section]"
    )
    .forEach(
        button => {

            button.classList.toggle(
                "active",
                button.dataset.section ===
                sectionId
            );

        }
    );


    MARKET_FLASH.currentSection =
        sectionId;


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });


    if (
        sectionId === "perfil"
    ) {

        if (
            !MARKET_FLASH.user
        ) {

            showSection(
                "inicio-sesion"
            );

            showMessage(
                "Debes iniciar sesión para entrar a tu perfil.",
                "warning"
            );

            return;

        }

        renderProfile();

    }


    if (
        sectionId === "administrador"
    ) {

        if (
            !MARKET_FLASH.isAdmin
        ) {

            showSection(
                "inicio"
            );

            showMessage(
                "No tienes permisos de administrador.",
                "error"
            );

        }

    }

}


/* =========================================================
   6. NAVEGACIÓN
   ========================================================= */

function setupNavigation() {

    getElements(
        "[data-section]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const target =
                        button.dataset.section;


                    if (
                        target ===
                        "publicar"
                    ) {

                        if (
                            !MARKET_FLASH.user
                        ) {

                            showMessage(
                                "Inicia sesión para publicar.",
                                "warning"
                            );

                            showSection(
                                "inicio-sesion"
                            );

                            return;

                        }

                    }


                    if (
                        target ===
                        "perfil"
                    ) {

                        if (
                            !MARKET_FLASH.user
                        ) {

                            showMessage(
                                "Inicia sesión para entrar a tu perfil.",
                                "warning"
                            );

                            showSection(
                                "inicio-sesion"
                            );

                            return;

                        }

                    }


                    if (
                        target ===
                        "administrador"
                    ) {

                        if (
                            !MARKET_FLASH.isAdmin
                        ) {

                            showMessage(
                                "No tienes permisos de administrador.",
                                "error"
                            );

                            return;

                        }

                    }


                    showSection(
                        target
                    );

                }
            );

        }
    );

}


/* =========================================================
   7. BOTONES DEL HEADER
   ========================================================= */

function setupHeaderButtons() {

    getElement(
        "#btn-registrarse"
    )?.addEventListener(
        "click",
        () => {

            showSection(
                "registro"
            );

        }
    );


    getElement(
        "#btn-iniciar-sesion"
    )?.addEventListener(
        "click",
        () => {

            showSection(
                "inicio-sesion"
            );

        }
    );


    getElement(
        "#btn-perfil"
    )?.addEventListener(
        "click",
        () => {

            if (
                !MARKET_FLASH.user
            ) {

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
   8. REGISTRO
   ========================================================= */

async function handleRegister(
    event
) {

    event.preventDefault();


    if (
        !window.marketFlashClient
    ) {

        showMessage(
            "Supabase no está disponible.",
            "error"
        );

        return;

    }


    const form =
        event.currentTarget;


    const name =
        getElement(
            "#registro-nombre"
        )?.value.trim();


    const email =
        getElement(
            "#registro-correo"
        )?.value.trim();


    const documentNumber =
        getElement(
            "#registro-documento"
        )?.value.trim();


    const phone =
        getElement(
            "#registro-telefono"
        )?.value.trim();


    const whatsapp =
        getElement(
            "#registro-whatsapp"
        )?.value.trim();


    const messenger =
        getElement(
            "#registro-messenger"
        )?.value.trim();


    const password =
        getElement(
            "#registro-password"
        )?.value;


    if (
        !name ||
        !email ||
        !documentNumber ||
        !phone ||
        !password
    ) {

        showMessage(
            "Completa todos los campos obligatorios.",
            "warning"
        );

        return;

    }


    if (
        password.length < 6
    ) {

        showMessage(
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

        const {
            data,
            error
        } =
            await window.marketFlashClient.auth.signUp({

                email,

                password,

                options: {

                    data: {

                        full_name:
                            name,

                        documento:
                            documentNumber,

                        phone,

                        whatsapp,

                        messenger

                    }

                }

            });


        if (error) {
            throw error;
        }


        form.reset();


        /*
         * Si Supabase tiene desactivada la confirmación
         * de correo, tendremos una sesión inmediatamente.
         */

        if (
            data.session
        ) {

            MARKET_FLASH.user =
                data.user;


            await loadProfile();

            updateInterface();


            showMessage(
                "Cuenta creada correctamente.",
                "success"
            );


            showSection(
                "inicio"
            );

        } else {

            /*
             * Si la confirmación por correo está activa,
             * Supabase crea el usuario pero todavía no
             * entrega una sesión.
             */

            showMessage(
                "La cuenta fue creada. Revisa tu correo para confirmar la cuenta.",
                "success"
            );


            showSection(
                "inicio-sesion"
            );

        }

    } catch (error) {

        console.error(
            "Error de registro:",
            error
        );


        showMessage(
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
   9. INICIO DE SESIÓN
   ========================================================= */

async function handleLogin(
    event
) {

    event.preventDefault();


    if (
        !window.marketFlashClient
    ) {

        showMessage(
            "Supabase no está disponible.",
            "error"
        );

        return;

    }


    const form =
        event.currentTarget;


    const email =
        getElement(
            "#login-correo"
        )?.value.trim();


    const password =
        getElement(
            "#login-password"
        )?.value;


    if (
        !email ||
        !password
    ) {

        showMessage(
            "Escribe tu correo y contraseña.",
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

        const {
            data,
            error
        } =
            await window.marketFlashClient.auth
                .signInWithPassword({

                    email,

                    password

                });


        if (error) {
            throw error;
        }


        MARKET_FLASH.user =
            data.user;


        await loadProfile();

        updateInterface();


        form.reset();


        showMessage(
            "Has iniciado sesión correctamente.",
            "success"
        );


        showSection(
            "perfil"
        );

    } catch (error) {

        console.error(
            "Error de inicio de sesión:",
            error
        );


        showMessage(
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
   10. CARGAR SESIÓN ACTUAL
   ========================================================= */

async function restoreSession() {

    if (
        !window.marketFlashClient
    ) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await window.marketFlashClient.auth
                .getSession();


        if (error) {
            throw error;
        }


        MARKET_FLASH.user =
            data.session?.user ||
            null;


        if (
            MARKET_FLASH.user
        ) {

            await loadProfile();

        }


        updateInterface();

    } catch (error) {

        console.error(
            "Error restaurando sesión:",
            error
        );

    }

}


/* =========================================================
   11. ESCUCHAR CAMBIOS DE SESIÓN
   ========================================================= */

function setupAuthListener() {

    if (
        !window.marketFlashClient
    ) {

        return;

    }


    window.marketFlashClient.auth
        .onAuthStateChange(
            (
                event,
                session
            ) => {

                setTimeout(
                    async () => {

                        MARKET_FLASH.user =
                            session?.user ||
                            null;


                        if (
                            MARKET_FLASH.user
                        ) {

                            await loadProfile();

                        } else {

                            MARKET_FLASH.profile =
                                null;

                            MARKET_FLASH.isAdmin =
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
   12. PERFIL
   ========================================================= */

async function loadProfile() {

    if (
        !MARKET_FLASH.user ||
        !window.marketFlashClient
    ) {

        MARKET_FLASH.profile =
            null;

        MARKET_FLASH.isAdmin =
            false;

        return;

    }


    try {

        const {
            data,
            error
        } =
            await window.marketFlashClient
                .from("profiles")
                .select(
                    "id,full_name,documento,phone,whatsapp,messenger,role"
                )
                .eq(
                    "id",
                    MARKET_FLASH.user.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "Error leyendo perfil:",
                error
            );

            MARKET_FLASH.profile =
                null;

            MARKET_FLASH.isAdmin =
                false;

            return;

        }


        MARKET_FLASH.profile =
            data;


        MARKET_FLASH.isAdmin =
            data?.role ===
            "admin";

    } catch (error) {

        console.error(
            "Error cargando perfil:",
            error
        );

    }

}


/* =========================================================
   13. ACTUALIZAR INTERFAZ
   ========================================================= */

function updateInterface() {

    const registerButton =
        getElement(
            "#btn-registrarse"
        );


    const loginButton =
        getElement(
            "#btn-iniciar-sesion"
        );


    const profileButton =
        getElement(
            "#btn-perfil"
        );


    if (
        MARKET_FLASH.user
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
   14. MOSTRAR PERFIL
   ========================================================= */

function renderProfile() {

    const profile =
        MARKET_FLASH.profile;


    if (!profile) {
        return;
    }


    const user =
        MARKET_FLASH.user;


    const fields = {

        "#perfil-nombre":
            profile.full_name ||
            "Usuario",

        "#perfil-correo":
            user?.email ||
            "-",

        "#perfil-telefono":
            profile.phone ||
            "-",

        "#perfil-whatsapp":
            profile.whatsapp ||
            "-",

        "#perfil-messenger":
            profile.messenger ||
            "-",

        "#perfil-documento":
            profile.documento ||
            "-"

    };


    Object.entries(
        fields
    )
    .forEach(
        ([selector, value]) => {

            const element =
                getElement(selector);


            if (element) {

                element.textContent =
                    value;

            }

        }
    );

}


/* =========================================================
   15. EDITAR PERFIL
   ========================================================= */

async function editProfile() {

    if (
        !MARKET_FLASH.user
    ) {

        showSection(
            "inicio-sesion"
        );

        return;

    }


    const profile =
        MARKET_FLASH.profile ||
        {};


    const name =
        prompt(
            "Nombre completo:",
            profile.full_name ||
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
            profile.phone ||
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
            profile.whatsapp ||
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
            profile.messenger ||
            ""
        );


    if (
        messenger === null
    ) {
        return;
    }


    const {
        data,
        error
    } =
        await window.marketFlashClient
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
                MARKET_FLASH.user.id
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


    MARKET_FLASH.profile =
        data;


    renderProfile();


    showMessage(
        "Perfil actualizado correctamente.",
        "success"
    );

}


/* =========================================================
   16. CERRAR SESIÓN
   ========================================================= */

async function logout() {

    if (
        !window.marketFlashClient
    ) {
        return;
    }


    const {
        error
    } =
        await window.marketFlashClient.auth
            .signOut();


    if (error) {

        showMessage(
            error.message,
            "error"
        );

        return;

    }


    MARKET_FLASH.user =
        null;

    MARKET_FLASH.profile =
        null;

    MARKET_FLASH.isAdmin =
        false;


    updateInterface();


    showSection(
        "inicio"
    );


    showMessage(
        "Sesión cerrada correctamente.",
        "success"
    );

}


/* =========================================================
   17. RECUPERAR CONTRASEÑA
   ========================================================= */

async function recoverPassword() {

    const email =
        prompt(
            "Escribe tu correo electrónico:"
        );


    if (!email) {
        return;
    }


    const redirectUrl =
        window.location.origin +
        window.location.pathname;


    const {
        error
    } =
        await window.marketFlashClient.auth
            .resetPasswordForEmail(
                email.trim(),
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
        "Revisa tu correo para recuperar la contraseña.",
        "success"
    );

}


/* =========================================================
   18. CONFIGURAR FORMULARIOS
   ========================================================= */

function setupForms() {

    getElement(
        "#formulario-registro"
    )
    ?.addEventListener(
        "submit",
        handleRegister
    );


    getElement(
        "#formulario-login"
    )
    ?.addEventListener(
        "submit",
        handleLogin
    );


    getElement(
        "#btn-ir-login"
    )
    ?.addEventListener(
        "click",
        () => {

            showSection(
                "inicio-sesion"
            );

        }
    );


    getElement(
        "#btn-ir-registro"
    )
    ?.addEventListener(
        "click",
        () => {

            showSection(
                "registro"
            );

        }
    );


    getElement(
        "#btn-recuperar-password"
    )
    ?.addEventListener(
        "click",
        recoverPassword
    );


    getElement(
        "#btn-editar-perfil"
    )
    ?.addEventListener(
        "click",
        editProfile
    );


    getElement(
        "#btn-cerrar-sesion"
    )
    ?.addEventListener(
        "click",
        logout
    );

}


/* =========================================================
   19. CATEGORÍAS
   ========================================================= */

function setupCategoryButtons() {

    getElements(
        ".category-card"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    const category =
                        button.dataset.category;


                    getElements(
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


                    showMessage(
                        `Categoría seleccionada: ${category}`,
                        "info"
                    );

                }
            );

        }
    );

}


/* =========================================================
   20. PUBLICIDAD
   ========================================================= */

function setupAdvertisement() {

    const slider =
        getElement(
            "#contenedor-publicidad"
        );


    if (!slider) {
        return;
    }


    const cards =
        Array.from(
            slider.children
        );


    let current =
        0;


    function move(
        direction
    ) {

        if (
            !cards.length
        ) {
            return;
        }


        current =
            (
                current +
                direction +
                cards.length
            ) %
            cards.length;


        cards[current]
            .scrollIntoView({
                behavior:
                    "smooth",
                block:
                    "nearest",
                inline:
                    "center"
            });

    }


    getElement(
        "#publicidad-anterior"
    )
    ?.addEventListener(
        "click",
        () =>
            move(-1)
    );


    getElement(
        "#publicidad-siguiente"
    )
    ?.addEventListener(
        "click",
        () =>
            move(1)
    );


    getElements(
        "[data-ad-id]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    showMessage(
                        "Este espacio está reservado para publicidad patrocinada.",
                        "info"
                    );

                }
            );

        }
    );

}


/* =========================================================
   21. BÚSQUEDA
   ========================================================= */

function setupSearch() {

    getElement(
        "#form-busqueda"
    )
    ?.addEventListener(
        "submit",
        event => {

            event.preventDefault();


            const value =
                getElement(
                    "#buscar"
                )?.value.trim();


            if (!value) {

                showMessage(
                    "Escribe algo para buscar.",
                    "warning"
                );

                return;

            }


            showMessage(
                `Buscando: ${value}`,
                "info"
            );

        }
    );


    getElement(
        "#btn-limpiar-busqueda"
    )
    ?.addEventListener(
        "click",
        () => {

            const input =
                getElement(
                    "#buscar"
                );


            if (input) {
                input.value =
                    "";
            }

        }
    );

}


/* =========================================================
   22. SOPORTE
   ========================================================= */

function setupSupport() {

    getElement(
        "#soporte-ayuda"
    )
    ?.addEventListener(
        "click",
        () => {

            showMessage(
                "Market Flash permite comprar, vender, promocionar y contactar con vendedores.",
                "info"
            );

        }
    );


    getElement(
        "#soporte-whatsapp"
    )
    ?.addEventListener(
        "click",
        () => {

            showMessage(
                "El WhatsApp de soporte todavía no está configurado.",
                "warning"
            );

        }
    );


    getElement(
        "#soporte-messenger"
    )
    ?.addEventListener(
        "click",
        () => {

            showMessage(
                "Messenger de soporte todavía no está configurado.",
                "warning"
            );

        }
    );


    getElement(
        "#footer-whatsapp"
    )
    ?.addEventListener(
        "click",
        () => {

            showMessage(
                "El WhatsApp de soporte todavía no está configurado.",
                "warning"
            );

        }
    );


    getElement(
        "#footer-messenger"
    )
    ?.addEventListener(
        "click",
        () => {

            showMessage(
                "Messenger de soporte todavía no está configurado.",
                "warning"
            );

        }
    );

}


/* =========================================================
   23. PROMOCIONES
   ========================================================= */

function setupPromotionButtons() {

    getElements(
        "[data-promotion]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        !MARKET_FLASH.user
                    ) {

                        showMessage(
                            "Inicia sesión para solicitar una promoción.",
                            "warning"
                        );

                        showSection(
                            "inicio-sesion"
                        );

                        return;

                    }


                    showMessage(
                        "La solicitud de promoción estará disponible cuando activemos el módulo de promociones.",
                        "info"
                    );

                }
            );

        }
    );

}


/* =========================================================
   24. INICIALIZACIÓN
   ========================================================= */

async function initializeMarketFlash() {

    console.log(
        "Market Flash iniciando..."
    );


    if (
        !window.marketFlashClient
    ) {

        console.error(
            "No se pudo crear el cliente de Supabase."
        );

        showMessage(
            "No se pudo conectar con Supabase.",
            "error"
        );

        return;

    }


    setupNavigation();

    setupHeaderButtons();

    setupForms();

    setupCategoryButtons();

    setupAdvertisement();

    setupSearch();

    setupSupport();

    setupPromotionButtons();


    await restoreSession();


    /*
     * Siempre empezamos mostrando Inicio.
     * Si ya existe sesión, el botón Mi perfil
     * aparecerá automáticamente.
     */

    showSection(
        "inicio"
    );


    console.log(
        "Market Flash listo."
    );

}


/* =========================================================
   25. INICIO
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    initializeMarketFlash
);
