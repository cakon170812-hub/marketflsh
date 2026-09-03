/* =========================================================
   MARKET FLASH ⚡
   SCRIPT PRINCIPAL
   Supabase Auth + Base de datos + Storage
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       SUPABASE
       ========================================================= */

    const db = window.supabaseClient;

    if (!db) {
        console.error("Market Flash: Supabase no está disponible.");
        alert("No se pudo conectar con Supabase. Revisa supabaseClient.js.");
        return;
    }

    /* =========================================================
       CONSTANTES
       ========================================================= */

    const TABLE_USERS = "users";
    const TABLE_PUBLICATIONS = "publications";
    const TABLE_PROMOTIONS = "promotions";
    const TABLE_MEMBERSHIPS = "memberships";
    const TABLE_PAYMENT_METHODS = "payment_methods";
    const TABLE_PAYMENT_PROOFS = "payment_proofs";

    const STORAGE_BUCKET = "market-flash-images";

    /* =========================================================
       ESTADO
       ========================================================= */

    let currentUser = null;
    let currentProfile = null;

    let selectedMembership = null;
    let selectedPaymentMethod = null;
    let pendingPromotion = null;
    let selectedProof = null;

    let publicationImageData = null;
    let promotionImageData = null;
    let paymentProofImageData = null;

    /* =========================================================
       ELEMENTOS PRINCIPALES
       ========================================================= */

    const welcomeScreen = document.getElementById("welcome-screen");
    const loginScreen = document.getElementById("login-screen");
    const registerScreen = document.getElementById("register-screen");
    const appScreen = document.getElementById("app-screen");

    const startButton = document.getElementById("start-button");

    const loginBackButton = document.getElementById("login-back-button");
    const registerBackButton = document.getElementById("register-back-button");

    const goRegisterButton = document.getElementById("go-register-button");
    const goLoginButton = document.getElementById("go-login-button");

    const loginForm = document.getElementById("login-form");
    const registerForm = document.getElementById("register-form");

    const loginError = document.getElementById("login-error");
    const registerError = document.getElementById("register-error");

    /* =========================================================
       MENÚ
       ========================================================= */

    const menuButton = document.getElementById("menu-button");
    const closeSideMenu = document.getElementById("close-side-menu");
    const closeMenuButton = document.getElementById("close-menu-button");
    const sideMenu = document.getElementById("side-menu");

    const menuHomeButton = document.getElementById("menu-home-button");
    const menuPublicationsButton =
        document.getElementById("menu-publications-button");
    const menuProfileButton =
        document.getElementById("menu-profile-button");
    const menuAdministrationButton =
        document.getElementById("menu-administration-button");
    const menuSettingsButton =
        document.getElementById("menu-settings-button");
    const menuLogoutButton =
        document.getElementById("menu-logout-button");

    /* =========================================================
       PÁGINAS
       ========================================================= */

    const homeScreen = document.getElementById("home-screen");
    const publicationsScreen =
        document.getElementById("publications-screen");
    const profileScreen =
        document.getElementById("profile-screen");

    /* =========================================================
       HEADER
       ========================================================= */

    const headerProfileButton =
        document.getElementById("header-profile-button");

    const notificationsButton =
        document.getElementById("notifications-button");

    const headerProfileName =
        document.getElementById("header-profile-name");

    /* =========================================================
       HOME
       ========================================================= */

    const homeUserName =
        document.getElementById("home-user-name");

    const homeUserPhone =
        document.getElementById("home-user-phone");

    const viewAllPublications =
        document.getElementById("view-all-publications");

    const publishButton =
        document.getElementById("publish-button");

    const flashPromoteButton =
        document.getElementById("flash-promote-button");

    const publicationsContainer =
        document.getElementById("publications-container");

    const allPublicationsContainer =
        document.getElementById("all-publications-container");

    const flashContainer =
        document.getElementById("flash-container");

    /* =========================================================
       PUBLICACIONES
       ========================================================= */

    const publishPanel =
        document.getElementById("publish-panel");

    const closePublishPanel =
        document.getElementById("close-publish-panel");

    const publishForm =
        document.getElementById("publish-form");

    const publicationTitle =
        document.getElementById("publication-title");

    const publicationDescription =
        document.getElementById("publication-description");

    const publicationPrice =
        document.getElementById("publication-price");

    const publicationContact =
        document.getElementById("publication-contact");

    const publicationImage =
        document.getElementById("publication-image");

    const publicationImagePreview =
        document.getElementById("publication-image-preview");

    /* =========================================================
       FLASH DEL DÍA
       ========================================================= */

    const promotionPanel =
        document.getElementById("promotion-panel");

    const closePromotionPanel =
        document.getElementById("close-promotion-panel");

    const promotionForm =
        document.getElementById("promotion-form");

    const promotionTitle =
        document.getElementById("promotion-title");

    const promotionDescription =
        document.getElementById("promotion-description");

    const promotionPrice =
        document.getElementById("promotion-price");

    const promotionContact =
        document.getElementById("promotion-contact");

    const promotionImageCamera =
        document.getElementById("promotion-image-camera");

    const promotionImageGallery =
        document.getElementById("promotion-image-gallery");

    const promotionImagePreview =
        document.getElementById("promotion-image-preview");

    /* =========================================================
       MEMBRESÍAS
       ========================================================= */

    const membershipPanel =
        document.getElementById("membership-panel");

    const closeMembershipPanel =
        document.getElementById("close-membership-panel");

    const membershipContainer =
        document.getElementById("membership-container");

    /* =========================================================
       MÉTODOS DE PAGO
       ========================================================= */

    const paymentMethodPanel =
        document.getElementById("payment-method-panel");

    const closePaymentMethodPanel =
        document.getElementById("close-payment-method-panel");

    const selectedMembershipInfo =
        document.getElementById("selected-membership-info");

    const paymentMethodSelect =
        document.getElementById("payment-method-select");

    const paymentAmount =
        document.getElementById("payment-amount");

    const continuePaymentButton =
        document.getElementById("continue-payment-button");

    /* =========================================================
       COMPROBANTE
       ========================================================= */

    const paymentProofPanel =
        document.getElementById("payment-proof-panel");

    const closePaymentProofPanel =
        document.getElementById("close-payment-proof-panel");

    const paymentSummary =
        document.getElementById("payment-summary");

    const paymentProofCamera =
        document.getElementById("payment-proof-camera");

    const paymentProofGallery =
        document.getElementById("payment-proof-gallery");

    const paymentProofPreview =
        document.getElementById("payment-proof-preview");

    const sendPaymentProofButton =
        document.getElementById("send-payment-proof-button");

    /* =========================================================
       ADMINISTRACIÓN
       ========================================================= */

    const administrationPanel =
        document.getElementById("administration-panel");

    const closeAdministrationPanel =
        document.getElementById("close-administration-panel");

    const administrationButton =
        document.getElementById("administration-button");

    const saveMembershipsButton =
        document.getElementById("save-memberships-button");

    const addPaymentMethodButton =
        document.getElementById("add-payment-method-button");

    const adminPaymentMethodsContainer =
        document.getElementById("admin-payment-methods-container");

    const adminPaymentProofsContainer =
        document.getElementById("admin-payment-proofs-container");

    /* =========================================================
       DETALLE COMPROBANTE
       ========================================================= */

    const paymentProofDetailPanel =
        document.getElementById("payment-proof-detail-panel");

    const closePaymentProofDetailPanel =
        document.getElementById(
            "close-payment-proof-detail-panel"
        );

    const paymentProofDetail =
        document.getElementById("payment-proof-detail");

    const paymentProofAdminActions =
        document.getElementById("payment-proof-admin-actions");

    const approvePaymentProofButton =
        document.getElementById("approve-payment-proof-button");

    const rejectPaymentProofButton =
        document.getElementById("reject-payment-proof-button");

    const fullscreenPaymentProofButton =
        document.getElementById("fullscreen-payment-proof-button");

    /* =========================================================
       PERFIL
       ========================================================= */

    const profileAvatar =
        document.getElementById("profile-avatar");

    const profileName =
        document.getElementById("profile-name");

    const profilePhone =
        document.getElementById("profile-phone");

    const profileEditButton =
        document.getElementById("profile-edit-button");

    const profilePanel =
        document.getElementById("profile-panel");

    const closeProfilePanel =
        document.getElementById("close-profile-panel");

    const profileForm =
        document.getElementById("profile-form");

    const profileEditName =
        document.getElementById("profile-edit-name");

    const profileEditCedula =
        document.getElementById("profile-edit-cedula");

    const profileEditPhone =
        document.getElementById("profile-edit-phone");

    const logoutButton =
        document.getElementById("logout-button");

    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    const settingsButton =
        document.getElementById("settings-button");

    const settingsPanel =
        document.getElementById("settings-panel");

    const closeSettingsPanel =
        document.getElementById("close-settings-panel");

    const settingsProfileButton =
        document.getElementById("settings-profile-button");

    const settingsLogoutButton =
        document.getElementById("settings-logout-button");

    /* =========================================================
       UTILIDADES
       ========================================================= */

    function showScreen(screen) {

        [
            welcomeScreen,
            loginScreen,
            registerScreen,
            appScreen
        ].forEach(item => {

            if (item) {
                item.classList.remove("active");
            }
        });

        if (screen) {
            screen.classList.add("active");
        }
    }


    function showPage(page) {

        [
            homeScreen,
            publicationsScreen,
            profileScreen
        ].forEach(item => {

            if (item) {
                item.classList.remove("active");
            }
        });

        if (page) {
            page.classList.add("active");
        }

        closeMenu();
    }


    function openPanel(panel) {

        if (!panel) return;

        panel.classList.add("active");
        panel.setAttribute("aria-hidden", "false");
    }


    function closePanel(panel) {

        if (!panel) return;

        panel.classList.remove("active");
        panel.setAttribute("aria-hidden", "true");
    }


    function closeMenu() {

        if (!sideMenu) return;

        sideMenu.classList.remove("active");
        sideMenu.setAttribute("aria-hidden", "true");
    }


    function openMenu() {

        if (!sideMenu) return;

        sideMenu.classList.add("active");
        sideMenu.setAttribute("aria-hidden", "false");
    }


    function closeAllPanels() {

        [
            publishPanel,
            promotionPanel,
            membershipPanel,
            paymentMethodPanel,
            paymentProofPanel,
            administrationPanel,
            paymentProofDetailPanel,
            profilePanel,
            settingsPanel
        ].forEach(closePanel);
    }


    function escapeHTML(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function formatPrice(value) {

        const number = Number(value || 0);

        return new Intl.NumberFormat("es-DO", {
            style: "currency",
            currency: "DOP",
            maximumFractionDigits: 0
        }).format(number);
    }


    function getInitials(name) {

        if (!name) {
            return "MF";
        }

        return String(name)
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part.charAt(0).toUpperCase())
            .join("");
    }


    function showError(element, message) {

        if (!element) return;

        element.textContent = message || "";
    }


    function clearErrors() {

        showError(loginError, "");
        showError(registerError, "");
    }


    function setButtonLoading(
        button,
        loading,
        originalText = "Continuar"
    ) {

        if (!button) return;

        if (loading) {

            if (!button.dataset.originalText) {
                button.dataset.originalText =
                    button.textContent;
            }

            button.disabled = true;
            button.textContent = "Procesando...";

        } else {

            button.disabled = false;

            button.textContent =
                button.dataset.originalText ||
                originalText;

            delete button.dataset.originalText;
        }
    }


    function normalizeCedula(value) {

        return String(value || "")
            .trim()
            .replace(/\s+/g, "");
    }


    /* =========================================================
       IMÁGENES
       ========================================================= */

    function readFileAsDataURL(file) {

        return new Promise((resolve, reject) => {

            if (!file) {
                resolve(null);
                return;
            }

            const reader = new FileReader();

            reader.onload = () => resolve(reader.result);

            reader.onerror = () => reject(reader.error);

            reader.readAsDataURL(file);
        });
    }


    async function uploadImage(file, folder) {

        if (!file) {
            return null;
        }

        try {

            if (!file.type.startsWith("image/")) {

                alert("El archivo seleccionado no es una imagen.");

                return null;
            }

            const extension =
                file.name.includes(".")
                    ? file.name.split(".").pop().toLowerCase()
                    : "jpg";

            const randomName =
                typeof crypto !== "undefined" &&
                crypto.randomUUID
                    ? crypto.randomUUID()
                    : `${Date.now()}-${Math.random()
                        .toString(36)
                        .substring(2)}`;

            const filePath =
                `${folder}/${randomName}.${extension}`;

            const {
                error: uploadError
            } = await db.storage
                .from(STORAGE_BUCKET)
                .upload(filePath, file, {
                    cacheControl: "3600",
                    upsert: false,
                    contentType: file.type
                });

            if (uploadError) {

                console.error(
                    "Error subiendo imagen:",
                    uploadError
                );

                alert(
                    "No se pudo subir la imagen. Revisa el bucket " +
                    STORAGE_BUCKET +
                    " en Supabase."
                );

                return null;
            }

            const {
                data
            } = db.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(filePath);

            return data?.publicUrl || null;

        } catch (error) {

            console.error(
                "Error de Storage:",
                error
            );

            return null;
        }
    }


    function showImagePreview(container, source) {

        if (!container) return;

        if (!source) {

            container.innerHTML = "";

            return;
        }

        container.innerHTML = `
            <img
                src="${escapeHTML(source)}"
                alt="Vista previa"
                class="media-preview-image"
            >
        `;
    }


    /* =========================================================
       PERFIL
       ========================================================= */

    async function loadCurrentUser() {

        try {

            const {
                data,
                error
            } = await db.auth.getSession();

            if (error) {

                console.error(
                    "Error obteniendo sesión:",
                    error
                );

                return null;
            }

            currentUser =
                data?.session?.user || null;

            if (!currentUser) {

                currentProfile = null;

                return null;
            }

            await loadCurrentProfile();

            return currentUser;

        } catch (error) {

            console.error(error);

            return null;
        }
    }


    async function loadCurrentProfile() {

        if (!currentUser) {

            currentProfile = null;

            return null;
        }

        const {
            data,
            error
        } = await db
            .from(TABLE_USERS)
            .select("*")
            .eq("auth_id", currentUser.id)
            .maybeSingle();

        if (error) {

            console.error(
                "Error cargando perfil:",
                error
            );

            currentProfile = null;

            return null;
        }

        currentProfile = data || null;

        updateUserInterface();

        return currentProfile;
    }


    function updateUserInterface() {

        if (!currentProfile) {
            return;
        }

        const firstName =
            currentProfile.nombre || "Usuario";

        const lastName =
            currentProfile.apellido || "";

        const fullName =
            `${firstName} ${lastName}`.trim();

        const phone =
            currentProfile.telefono || "Teléfono no agregado";

        const initials =
            getInitials(fullName);

        if (headerProfileName) {
            headerProfileName.textContent =
                currentProfile.apodo ||
                firstName;
        }

        if (homeUserName) {
            homeUserName.textContent =
                currentProfile.apodo ||
                fullName;
        }

        if (homeUserPhone) {
            homeUserPhone.textContent =
                phone;
        }

        if (profileName) {
            profileName.textContent =
                fullName;
        }

        if (profilePhone) {
            profilePhone.textContent =
                phone;
        }

        if (profileAvatar) {
            profileAvatar.textContent =
                initials;
        }

        if (profileEditName) {
            profileEditName.value =
                fullName;
        }

        if (profileEditCedula) {
            profileEditCedula.value =
                currentProfile.cedula || "";
        }

        if (profileEditPhone) {
            profileEditPhone.value =
                currentProfile.telefono || "";
        }
    }


    /* =========================================================
       REGISTRO
       ========================================================= */

    async function registerUser(event) {

        event.preventDefault();

        clearErrors();

        const name =
            document.getElementById("register-name")
                ?.value.trim();

        const lastName =
            document.getElementById("register-last-name")
                ?.value.trim();

        const nickname =
            document.getElementById("register-nickname")
                ?.value.trim();

        const cedula =
            document.getElementById("register-cedula")
                ?.value.trim();

        const address =
            document.getElementById("register-address")
                ?.value.trim();

        const phone =
            document.getElementById("register-phone")
                ?.value.trim();

        const email =
            document.getElementById("register-email")
                ?.value.trim();

        const password =
            document.getElementById("register-password")
                ?.value;

        const passwordConfirm =
            document.getElementById(
                "register-password-confirm"
            )?.value;

        const terms =
            document.getElementById("register-terms")
                ?.checked;


        /* -----------------------------------------------------
           VALIDACIONES
           ----------------------------------------------------- */

        if (!name) {

            showError(
                registerError,
                "Escribe tu nombre."
            );

            return;
        }


        if (!lastName) {

            showError(
                registerError,
                "Escribe tu apellido."
            );

            return;
        }


        if (!nickname) {

            showError(
                registerError,
                "Escribe un apodo."
            );

            return;
        }


        if (!cedula) {

            showError(
                registerError,
                "La cédula es obligatoria."
            );

            return;
        }


        if (!address) {

            showError(
                registerError,
                "Escribe tu dirección."
            );

            return;
        }


        if (!password) {

            showError(
                registerError,
                "Crea una contraseña."
            );

            return;
        }


        if (password.length < 6) {

            showError(
                registerError,
                "La contraseña debe tener al menos 6 caracteres."
            );

            return;
        }


        if (password !== passwordConfirm) {

            showError(
                registerError,
                "Las contraseñas no coinciden."
            );

            return;
        }


        if (!terms) {

            showError(
                registerError,
                "Debes aceptar los términos y condiciones."
            );

            return;
        }


        if (
            email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {

            showError(
                registerError,
                "El correo electrónico no es válido."
            );

            return;
        }


        try {

            const cleanCedula =
                normalizeCedula(cedula);


            /*
               Correo técnico utilizado únicamente
               para Supabase Auth.

               El correo real del usuario, si lo proporciona,
               se guarda en public.users.
            */

            const internalEmail =
                `${cleanCedula}@marketflash.app`;


            /*
               Verificar cédula antes de crear cuenta.
            */

            const {
                data: existingUser,
                error: existingError
            } = await db
                .from(TABLE_USERS)
                .select("id")
                .eq("cedula", cedula)
                .maybeSingle();


            if (existingError) {

                console.error(existingError);

                showError(
                    registerError,
                    "No se pudo verificar la cédula."
                );

                return;
            }


            if (existingUser) {

                showError(
                    registerError,
                    "Esta cédula ya está registrada."
                );

                return;
            }


            /*
               Crear cuenta en Supabase Auth.
            */

            const {
                data,
                error
            } = await db.auth.signUp({

                email: internalEmail,

                password: password,

                options: {
                    data: {
                        nombre: name,
                        apellido: lastName,
                        apodo: nickname,
                        cedula: cedula,
                        direccion: address,
                        telefono: phone || null,
                        correo_real: email || null
                    }
                }
            });


            if (error) {

                console.error(
                    "Error creando cuenta:",
                    error
                );

                showError(
                    registerError,
                    error.message ||
                    "No se pudo crear la cuenta."
                );

                return;
            }


            if (!data?.user) {

                showError(
                    registerError,
                    "Supabase no devolvió el usuario."
                );

                return;
            }


            /*
               Guardar perfil.

               IMPORTANTE:
               Estas columnas deben existir en Supabase:
               apellido
               apodo
               direccion
               correo
            */

            const {
                error: profileError
            } = await db
                .from(TABLE_USERS)
                .insert({
                    auth_id: data.user.id,
                    nombre: name,
                    apellido: lastName,
                    apodo: nickname,
                    cedula: cedula,
                    direccion: address,
                    telefono: phone || null,
                    correo: email || null,
                    rol: "usuario"
                });


            if (profileError) {

                console.error(
                    "Error creando perfil:",
                    profileError
                );

                showError(
                    registerError,
                    "La cuenta se creó, pero no se pudo guardar el perfil: " +
                    profileError.message
                );

                return;
            }


            /*
               Si no existe sesión inmediatamente,
               normalmente Supabase tiene activa
               la confirmación de correo.
            */

            if (!data.session) {

                showError(
                    registerError,
                    "La cuenta fue creada, pero Supabase está solicitando confirmación de correo. Desactiva la confirmación de correo en Authentication > Providers > Email."
                );

                return;
            }


            currentUser = data.user;

            await loadCurrentProfile();

            showScreen(appScreen);

            showPage(homeScreen);

            await refreshApplication();

        } catch (error) {

            console.error(
                "Error de registro:",
                error
            );

            showError(
                registerError,
                "Ocurrió un error al crear la cuenta."
            );
        }
    }


    /* =========================================================
       LOGIN
       ========================================================= */

    async function loginUser(event) {

        event.preventDefault();

        clearErrors();

        const cedula =
            document.getElementById("login-cedula")
                ?.value.trim();

        const password =
            document.getElementById("login-password")
                ?.value;


        if (!cedula || !password) {

            showError(
                loginError,
                "Ingresa tu cédula y contraseña."
            );

            return;
        }


        try {

            const cleanCedula =
                normalizeCedula(cedula);

            const internalEmail =
                `${cleanCedula}@marketflash.app`;


            const {
                data,
                error
            } = await db.auth.signInWithPassword({

                email: internalEmail,

                password: password
            });


            if (error) {

                console.error(
                    "Error de login:",
                    error
                );

                showError(
                    loginError,
                    "Cédula o contraseña incorrecta."
                );

                return;
            }


            currentUser =
                data?.user || null;


            if (!currentUser) {

                showError(
                    loginError,
                    "No se pudo obtener la sesión."
                );

                return;
            }


            await loadCurrentProfile();


            if (!currentProfile) {

                showError(
                    loginError,
                    "La cuenta existe, pero no tiene perfil."
                );

                return;
            }


            showScreen(appScreen);

            showPage(homeScreen);

            await refreshApplication();

        } catch (error) {

            console.error(error);

            showError(
                loginError,
                "No se pudo iniciar sesión."
            );
        }
    }


    /* =========================================================
       LOGOUT
       ========================================================= */

    async function logout() {

        try {

            await db.auth.signOut();

        } catch (error) {

            console.error(
                "Error cerrando sesión:",
                error
            );
        }


        currentUser = null;
        currentProfile = null;

        selectedMembership = null;
        selectedPaymentMethod = null;
        pendingPromotion = null;
        selectedProof = null;

        publicationImageData = null;
        promotionImageData = null;
        paymentProofImageData = null;

        closeAllPanels();
        closeMenu();

        if (loginForm) {
            loginForm.reset();
        }

        if (registerForm) {
            registerForm.reset();
        }

        clearErrors();

        showScreen(welcomeScreen);
    }


    /* =========================================================
       PUBLICACIONES
       ========================================================= */

    async function createPublication(event) {

        event.preventDefault();

        if (!currentUser || !currentProfile) {

            alert("Debes iniciar sesión para publicar.");

            return;
        }


        const title =
            publicationTitle?.value.trim();

        const description =
            publicationDescription?.value.trim();

        const price =
            Number(publicationPrice?.value || 0);

        const contact =
            publicationContact?.value.trim();


        if (!title) {

            alert("Escribe el título del producto.");

            return;
        }


        if (!description) {

            alert("Escribe una descripción.");

            return;
        }


        try {

            const submitButton =
                publishForm?.querySelector(
                    "button[type='submit']"
                );

            setButtonLoading(
                submitButton,
                true,
                "Publicar"
            );


            let imageUrl = null;

            const file =
                publicationImage?.files?.[0] || null;


            if (file) {

                imageUrl =
                    await uploadImage(
                        file,
                        `publications/${currentUser.id}`
                    );

                if (!imageUrl) {

                    return;
                }
            }


            const {
                error
            } = await db
                .from(TABLE_PUBLICATIONS)
                .insert({
                    user_id: currentProfile.id,
                    titulo: title,
                    descripcion: description,
                    precio: price,
                    contacto:
                        contact ||
                        currentProfile.telefono ||
                        null,
                    imagen_url: imageUrl
                });


            if (error) {

                console.error(error);

                alert(
                    "No se pudo publicar: " +
                    error.message
                );

                return;
            }


            publishForm.reset();

            publicationImageData = null;

            showImagePreview(
                publicationImagePreview,
                null
            );

            closePanel(publishPanel);

            await loadPublications();

            alert(
                "¡Producto publicado correctamente!"
            );

        } catch (error) {

            console.error(error);

            alert(
                "Ocurrió un error al publicar."
            );

        } finally {

            const submitButton =
                publishForm?.querySelector(
                    "button[type='submit']"
                );

            setButtonLoading(
                submitButton,
                false,
                "Publicar"
            );
        }
    }


    async function loadPublications() {

        if (
            !publicationsContainer &&
            !allPublicationsContainer
        ) {
            return;
        }


        const {
            data,
            error
        } = await db
            .from(TABLE_PUBLICATIONS)
            .select(`
                *,
                users (
                    nombre,
                    apellido,
                    apodo,
                    telefono
                )
            `)
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(
                "Error cargando publicaciones:",
                error
            );

            renderEmptyPublications(
                publicationsContainer
            );

            renderEmptyPublications(
                allPublicationsContainer
            );

            return;
        }


        renderPublications(
            publicationsContainer,
            data || []
        );

        renderPublications(
            allPublicationsContainer,
            data || []
        );
    }


    function renderEmptyPublications(container) {

        if (!container) return;

        container.innerHTML = `
            <div class="empty-publications">
                <div class="empty-icon">📦</div>
                <p>No hay publicaciones todavía.</p>
            </div>
        `;
    }


    function renderPublications(
        container,
        publications
    ) {

        if (!container) return;


        if (
            !publications ||
            publications.length === 0
        ) {

            renderEmptyPublications(container);

            return;
        }


        container.innerHTML =
            publications.map(publication => {

                const image =
                    publication.imagen_url
                        ? `
                            <img
                                src="${escapeHTML(
                                    publication.imagen_url
                                )}"
                                alt="${escapeHTML(
                                    publication.titulo
                                )}"
                                class="publication-image"
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="publication-image-placeholder">
                                📦
                            </div>
                        `;


                const owner =
                    publication.users?.apodo ||
                    publication.users?.nombre ||
                    "Usuario";


                const contact =
                    publication.contacto ||
                    publication.users?.telefono ||
                    "";


                return `
                    <article class="publication-card">

                        <div class="publication-card-image">
                            ${image}
                        </div>

                        <div class="publication-card-content">

                            <h3>
                                ${escapeHTML(
                                    publication.titulo
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    publication.descripcion
                                )}
                            </p>

                            <strong class="publication-price">
                                ${formatPrice(
                                    publication.precio
                                )}
                            </strong>

                            <div class="publication-owner">

                                <span>
                                    👤
                                    ${escapeHTML(owner)}
                                </span>

                                ${
                                    contact
                                        ? `
                                            <span>
                                                📞
                                                ${escapeHTML(
                                                    contact
                                                )}
                                            </span>
                                        `
                                        : ""
                                }

                            </div>

                        </div>

                    </article>
                `;

            }).join("");
    }


    /* =========================================================
       FLASH DEL DÍA
       ========================================================= */

    function openPromotionPanel() {

        if (!currentUser) {

            alert(
                "Debes iniciar sesión para crear un Flash del Día."
            );

            return;
        }

        openPanel(promotionPanel);
    }


    async function createPendingPromotion(event) {

        event.preventDefault();

        if (!currentUser || !currentProfile) {

            alert("Debes iniciar sesión.");

            return;
        }


        const title =
            promotionTitle?.value.trim();

        const description =
            promotionDescription?.value.trim();

        const price =
            Number(promotionPrice?.value || 0);

        const contact =
            promotionContact?.value.trim();


        if (!title || !description) {

            alert(
                "Completa el título y la descripción."
            );

            return;
        }


        try {

            const submitButton =
                promotionForm?.querySelector(
                    "button[type='submit']"
                );

            setButtonLoading(
                submitButton,
                true,
                "Continuar con el pago"
            );


            let imageUrl = null;

            const file =
                promotionImageCamera?.files?.[0] ||
                promotionImageGallery?.files?.[0] ||
                null;


            if (file) {

                imageUrl =
                    await uploadImage(
                        file,
                        `promotions/${currentUser.id}`
                    );

                if (!imageUrl) {

                    return;
                }
            }


            const {
                data,
                error
            } = await db
                .from(TABLE_PROMOTIONS)
                .insert({
                    user_id: currentProfile.id,
                    titulo: title,
                    descripcion: description,
                    precio: price,
                    contacto:
                        contact ||
                        currentProfile.telefono ||
                        null,
                    imagen_url: imageUrl,
                    estado: "pendiente"
                })
                .select()
                .single();


            if (error) {

                console.error(error);

                alert(
                    "No se pudo crear la promoción: " +
                    error.message
                );

                return;
            }


            pendingPromotion = data;

            promotionForm.reset();

            promotionImageData = null;

            showImagePreview(
                promotionImagePreview,
                null
            );

            closePanel(promotionPanel);

            await loadMemberships();

            openPanel(membershipPanel);

        } catch (error) {

            console.error(error);

            alert(
                "Ocurrió un error creando la promoción."
            );

        } finally {

            const submitButton =
                promotionForm?.querySelector(
                    "button[type='submit']"
                );

            setButtonLoading(
                submitButton,
                false,
                "Continuar con el pago"
            );
        }
    }


    async function loadPromotions() {

        if (!flashContainer) return;


        const {
            data,
            error
        } = await db
            .from(TABLE_PROMOTIONS)
            .select(`
                *,
                users (
                    nombre,
                    apellido,
                    apodo,
                    telefono
                )
            `)
            .eq("estado", "aprobada")
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(error);

            flashContainer.innerHTML = `
                <div class="empty-flash">
                    <p>No hay promociones todavía.</p>
                </div>
            `;

            return;
        }


        renderPromotions(data || []);
    }


    function renderPromotions(promotions) {

        if (!flashContainer) return;


        if (!promotions.length) {

            flashContainer.innerHTML = `
                <div class="empty-flash">
                    <div class="empty-icon">⚡</div>
                    <p>No hay Flash del Día todavía.</p>
                </div>
            `;

            return;
        }


        flashContainer.innerHTML =
            promotions.map(promotion => {

                const image =
                    promotion.imagen_url
                        ? `
                            <img
                                src="${escapeHTML(
                                    promotion.imagen_url
                                )}"
                                alt="${escapeHTML(
                                    promotion.titulo
                                )}"
                                class="flash-image"
                                loading="lazy"
                            >
                        `
                        : `
                            <div class="flash-image-placeholder">
                                ⚡
                            </div>
                        `;


                const owner =
                    promotion.users?.apodo ||
                    promotion.users?.nombre ||
                    "Usuario";


                return `
                    <article class="flash-card">

                        <div class="flash-card-image">
                            ${image}
                        </div>

                        <div class="flash-card-content">

                            <span class="flash-badge">
                                ⚡ FLASH DEL DÍA
                            </span>

                            <h3>
                                ${escapeHTML(
                                    promotion.titulo
                                )}
                            </h3>

                            <p>
                                ${escapeHTML(
                                    promotion.descripcion
                                )}
                            </p>

                            <strong>
                                ${formatPrice(
                                    promotion.precio
                                )}
                            </strong>

                            <small>
                                👤 ${escapeHTML(owner)}
                            </small>

                        </div>

                    </article>
                `;

            }).join("");
    }


    /* =========================================================
       MEMBRESÍAS
       ========================================================= */

    async function loadMemberships() {

        const {
            data,
            error
        } = await db
            .from(TABLE_MEMBERSHIPS)
            .select("*")
            .eq("activa", true)
            .order("id", {
                ascending: true
            });


        if (error) {

            console.error(
                "Error cargando membresías:",
                error
            );

            return;
        }


        updateMembershipDisplay(
            data || []
        );
    }


    function updateMembershipDisplay(memberships) {

        const codes = [
            "basica",
            "premium",
            "vip"
        ];


        codes.forEach(code => {

            const membership =
                memberships.find(
                    item =>
                        item.codigo === code
                );


            if (!membership) {
                return;
            }


            const descriptionElement =
                document.getElementById(
                    `membership-description-${code}`
                );

            const priceElement =
                document.getElementById(
                    `membership-price-${code}`
                );

            const featuresElement =
                document.getElementById(
                    `membership-features-${code}`
                );


            if (descriptionElement) {

                descriptionElement.textContent =
                    membership.descripcion ||
                    membership.nombre;
            }


            if (priceElement) {

                priceElement.textContent =
                    formatPrice(
                        membership.precio
                    );
            }


            if (featuresElement) {

                const features =
                    Array.isArray(
                        membership.caracteristicas
                    )
                        ? membership.caracteristicas
                        : [];


                featuresElement.innerHTML =
                    features.map(feature => `
                        <li>
                            ${escapeHTML(feature)}
                        </li>
                    `).join("");
            }

        });
    }


    async function selectMembership(code) {

        const {
            data,
            error
        } = await db
            .from(TABLE_MEMBERSHIPS)
            .select("*")
            .eq("codigo", code)
            .eq("activa", true)
            .maybeSingle();


        if (error || !data) {

            console.error(error);

            alert(
                "No se pudo seleccionar la membresía."
            );

            return;
        }


        selectedMembership = data;


        if (selectedMembershipInfo) {

            selectedMembershipInfo.innerHTML = `
                <div class="selected-membership">

                    <strong>
                        ${escapeHTML(data.nombre)}
                    </strong>

                    <span>
                        ${formatPrice(data.precio)}
                    </span>

                    ${
                        data.descripcion
                            ? `
                                <p>
                                    ${escapeHTML(
                                        data.descripcion
                                    )}
                                </p>
                            `
                            : ""
                    }

                </div>
            `;
        }


        if (paymentAmount) {

            paymentAmount.textContent =
                `Monto: ${formatPrice(data.precio)}`;
        }


        await loadPaymentMethods();

        closePanel(membershipPanel);

        openPanel(paymentMethodPanel);
    }


    /* =========================================================
       MÉTODOS DE PAGO
       ========================================================= */

    async function loadPaymentMethods() {

        if (!paymentMethodSelect) return;


        const {
            data,
            error
        } = await db
            .from(TABLE_PAYMENT_METHODS)
            .select("*")
            .eq("activo", true)
            .order("id", {
                ascending: true
            });


        if (error) {

            console.error(
                "Error cargando métodos de pago:",
                error
            );

            paymentMethodSelect.innerHTML = `
                <option value="">
                    Error cargando métodos
                </option>
            `;

            return;
        }


        paymentMethodSelect.innerHTML = `
            <option value="">
                Seleccionar método
            </option>

            ${
                (data || []).map(method => `
                    <option value="${method.id}">
                        ${escapeHTML(method.nombre)}
                    </option>
                `).join("")
            }
        `;


        selectedPaymentMethod = null;


        if (paymentAmount) {

            paymentAmount.textContent =
                selectedMembership
                    ? `Monto: ${formatPrice(
                        selectedMembership.precio
                    )}`
                    : "Selecciona un método de pago";
        }
    }


    async function handlePaymentMethodChange() {

        const id =
            Number(
                paymentMethodSelect?.value || 0
            );


        if (!id) {

            selectedPaymentMethod = null;

            if (paymentAmount) {

                paymentAmount.textContent =
                    selectedMembership
                        ? `Monto: ${formatPrice(
                            selectedMembership.precio
                        )}`
                        : "Selecciona un método de pago";
            }

            return;
        }


        await loadSelectedPaymentMethod(id);
    }


    async function loadSelectedPaymentMethod(id) {

        const {
            data,
            error
        } = await db
            .from(TABLE_PAYMENT_METHODS)
            .select("*")
            .eq("id", id)
            .eq("activo", true)
            .maybeSingle();


        if (error || !data) {

            selectedPaymentMethod = null;

            return;
        }


        selectedPaymentMethod = data;


        if (paymentAmount) {

            paymentAmount.innerHTML = `

                <strong>
                    ${formatPrice(
                        selectedMembership?.precio || 0
                    )}
                </strong>

                <br>

                <span>
                    ${escapeHTML(data.nombre)}
                </span>

                ${
                    data.descripcion
                        ? `
                            <br>
                            <small>
                                ${escapeHTML(
                                    data.descripcion
                                )}
                            </small>
                        `
                        : ""
                }

                ${
                    data.datos_pago
                        ? `
                            <div class="payment-data">
                                ${escapeHTML(
                                    data.datos_pago
                                )}
                            </div>
                        `
                        : ""
                }
            `;
        }
    }


    function continueToPaymentProof() {

        if (!selectedMembership) {

            alert(
                "Primero selecciona una membresía."
            );

            return;
        }


        if (!selectedPaymentMethod) {

            alert(
                "Selecciona un método de pago."
            );

            return;
        }


        if (paymentSummary) {

            paymentSummary.innerHTML = `

                <div>
                    <strong>Membresía</strong>
                    <span>
                        ${escapeHTML(
                            selectedMembership.nombre
                        )}
                    </span>
                </div>

                <div>
                    <strong>Método de pago</strong>
                    <span>
                        ${escapeHTML(
                            selectedPaymentMethod.nombre
                        )}
                    </span>
                </div>

                <div>
                    <strong>Total</strong>
                    <span>
                        ${formatPrice(
                            selectedMembership.precio
                        )}
                    </span>
                </div>

                ${
                    selectedPaymentMethod.datos_pago
                        ? `
                            <div>
                                <strong>
                                    Datos para pagar
                                </strong>

                                <span>
                                    ${escapeHTML(
                                        selectedPaymentMethod.datos_pago
                                    )}
                                </span>
                            </div>
                        `
                        : ""
                }
            `;
        }


        closePanel(paymentMethodPanel);

        openPanel(paymentProofPanel);
    }


    /* =========================================================
       COMPROBANTE DE PAGO
       ========================================================= */

    async function sendPaymentProof() {

        if (!currentUser || !currentProfile) {

            alert(
                "Debes iniciar sesión."
            );

            return;
        }


        if (!selectedMembership) {

            alert(
                "No hay una membresía seleccionada."
            );

            return;
        }


        if (!selectedPaymentMethod) {

            alert(
                "No hay método de pago seleccionado."
            );

            return;
        }


        const file =
            paymentProofCamera?.files?.[0] ||
            paymentProofGallery?.files?.[0] ||
            null;


        if (!file) {

            alert(
                "Debes subir una foto del comprobante."
            );

            return;
        }


        try {

            setButtonLoading(
                sendPaymentProofButton,
                true,
                "Enviar comprobante"
            );


            const imageUrl =
                await uploadImage(
                    file,
                    `payment-proofs/${currentUser.id}`
                );


            if (!imageUrl) {

                return;
            }


            const {
                error
            } = await db
                .from(TABLE_PAYMENT_PROOFS)
                .insert({
                    user_id: currentProfile.id,
                    membership_id: selectedMembership.id,
                    payment_method_id:
                        selectedPaymentMethod.id,
                    promotion_id:
                        pendingPromotion?.id || null,
                    monto:
                        Number(
                            selectedMembership.precio || 0
                        ),
                    imagen_url: imageUrl,
                    estado: "pendiente"
                });


            if (error) {

                console.error(error);

                alert(
                    "No se pudo enviar el comprobante: " +
                    error.message
                );

                return;
            }


            if (pendingPromotion?.id) {

                await db
                    .from(TABLE_PROMOTIONS)
                    .update({
                        estado: "pendiente"
                    })
                    .eq(
                        "id",
                        pendingPromotion.id
                    );
            }


            if (paymentProofCamera) {
                paymentProofCamera.value = "";
            }

            if (paymentProofGallery) {
                paymentProofGallery.value = "";
            }


            paymentProofImageData = null;


            showImagePreview(
                paymentProofPreview,
                null
            );


            alert(
                "Comprobante enviado correctamente. Queda pendiente de revisión."
            );


            selectedMembership = null;
            selectedPaymentMethod = null;
            pendingPromotion = null;


            closePanel(paymentProofPanel);

            await loadPromotions();

        } catch (error) {

            console.error(error);

            alert(
                "Ocurrió un error enviando el comprobante."
            );

        } finally {

            setButtonLoading(
                sendPaymentProofButton,
                false,
                "Enviar comprobante"
            );
        }
    }


    /* =========================================================
       ADMINISTRACIÓN
       ========================================================= */

    function isAdmin() {

        return (
            currentProfile &&
            (
                currentProfile.rol === "admin" ||
                currentProfile.rol === "administrador"
            )
        );
    }


    async function openAdministration() {

        closeMenu();

        if (!currentProfile) {

            alert(
                "Debes iniciar sesión."
            );

            return;
        }


        if (!isAdmin()) {

            alert(
                "No tienes permisos de administrador."
            );

            return;
        }


        await loadAdminMemberships();
        await loadAdminPaymentMethods();
        await loadAdminPaymentProofs();

        openPanel(administrationPanel);
    }


    async function loadAdminMemberships() {

        const {
            data,
            error
        } = await db
            .from(TABLE_MEMBERSHIPS)
            .select("*")
            .order("id", {
                ascending: true
            });


        if (error) {

            console.error(error);

            return;
        }


        (data || []).forEach(membership => {

            const code =
                membership.codigo;


            const name =
                document.getElementById(
                    `admin-membership-${code}-name`
                );

            const price =
                document.getElementById(
                    `admin-membership-${code}-price`
                );

            const description =
                document.getElementById(
                    `admin-membership-${code}-description`
                );

            const features =
                document.getElementById(
                    `admin-membership-${code}-features`
                );


            if (name) {
                name.value =
                    membership.nombre || "";
            }

            if (price) {
                price.value =
                    membership.precio ?? 0;
            }

            if (description) {
                description.value =
                    membership.descripcion || "";
            }

            if (features) {

                features.value =
                    Array.isArray(
                        membership.caracteristicas
                    )
                        ? membership.caracteristicas.join("\n")
                        : "";
            }

        });
    }


    async function saveMemberships() {

        if (!isAdmin()) {

            alert(
                "No tienes permisos."
            );

            return;
        }


        const codes = [
            "basica",
            "premium",
            "vip"
        ];


        try {

            setButtonLoading(
                saveMembershipsButton,
                true,
                "Guardar membresías"
            );


            for (const code of codes) {

                const name =
                    document.getElementById(
                        `admin-membership-${code}-name`
                    )?.value.trim();


                const price =
                    Number(
                        document.getElementById(
                            `admin-membership-${code}-price`
                        )?.value || 0
                    );


                const description =
                    document.getElementById(
                        `admin-membership-${code}-description`
                    )?.value.trim();


                const featuresText =
                    document.getElementById(
                        `admin-membership-${code}-features`
                    )?.value || "";


                const features =
                    featuresText
                        .split("\n")
                        .map(item => item.trim())
                        .filter(Boolean);


                const {
                    error
                } = await db
                    .from(TABLE_MEMBERSHIPS)
                    .update({
                        nombre: name,
                        precio: price,
                        descripcion: description,
                        caracteristicas: features
                    })
                    .eq(
                        "codigo",
                        code
                    );


                if (error) {

                    console.error(error);

                    alert(
                        `No se pudo guardar ${code}: ${error.message}`
                    );

                    return;
                }
            }


            await loadMemberships();

            alert(
                "Membresías guardadas correctamente."
            );

        } catch (error) {

            console.error(error);

            alert(
                "Ocurrió un error guardando las membresías."
            );

        } finally {

            setButtonLoading(
                saveMembershipsButton,
                false,
                "Guardar membresías"
            );
        }
    }


    /* =========================================================
       ADMIN - MÉTODOS DE PAGO
       ========================================================= */

    async function loadAdminPaymentMethods() {

        if (!adminPaymentMethodsContainer) {
            return;
        }


        const {
            data,
            error
        } = await db
            .from(TABLE_PAYMENT_METHODS)
            .select("*")
            .order("id", {
                ascending: true
            });


        if (error) {

            console.error(error);

            adminPaymentMethodsContainer.innerHTML = `
                <p>
                    No se pudieron cargar los métodos de pago.
                </p>
            `;

            return;
        }


        if (!data?.length) {

            adminPaymentMethodsContainer.innerHTML = `
                <p>
                    No hay métodos de pago.
                </p>
            `;

            return;
        }


        adminPaymentMethodsContainer.innerHTML =
            data.map(method => `

                <div
                    class="admin-payment-method-item"
                    data-id="${method.id}"
                >

                    <input
                        type="text"
                        class="admin-payment-name"
                        value="${escapeHTML(
                            method.nombre
                        )}"
                        placeholder="Nombre"
                    >

                    <textarea
                        class="admin-payment-description"
                        placeholder="Descripción"
                    >${escapeHTML(
                        method.descripcion || ""
                    )}</textarea>

                    <textarea
                        class="admin-payment-data"
                        placeholder="Datos para pagar"
                    >${escapeHTML(
                        method.datos_pago || ""
                    )}</textarea>

                    <label>
                        <input
                            type="checkbox"
                            class="admin-payment-active"
                            ${
                                method.activo
                                    ? "checked"
                                    : ""
                            }
                        >
                        Activo
                    </label>

                    <button
                        type="button"
                        class="secondary-button save-payment-method"
                    >
                        Guardar
                    </button>

                    <button
                        type="button"
                        class="danger-button delete-payment-method"
                    >
                        Eliminar
                    </button>

                </div>

            `).join("");
    }


    async function addPaymentMethod() {

        if (!isAdmin()) {

            alert(
                "No tienes permisos."
            );

            return;
        }


        const name =
            prompt(
                "Nombre del método de pago:"
            );


        if (!name) {
            return;
        }


        const description =
            prompt(
                "Descripción del método:"
            ) || "";


        const paymentData =
            prompt(
                "Datos para realizar el pago:"
            ) || "";


        const {
            error
        } = await db
            .from(TABLE_PAYMENT_METHODS)
            .insert({
                nombre: name.trim(),
                descripcion: description.trim(),
                datos_pago: paymentData.trim(),
                activo: true
            });


        if (error) {

            alert(
                "No se pudo agregar: " +
                error.message
            );

            return;
        }


        await loadAdminPaymentMethods();

        await loadPaymentMethods();

        alert(
            "Método de pago agregado."
        );
    }


    async function savePaymentMethod(item) {

        if (!item) return;


        const id =
            Number(item.dataset.id);


        const name =
            item.querySelector(
                ".admin-payment-name"
            )?.value.trim();


        const description =
            item.querySelector(
                ".admin-payment-description"
            )?.value.trim();


        const paymentData =
            item.querySelector(
                ".admin-payment-data"
            )?.value.trim();


        const active =
            item.querySelector(
                ".admin-payment-active"
            )?.checked;


        const {
            error
        } = await db
            .from(TABLE_PAYMENT_METHODS)
            .update({
                nombre: name,
                descripcion: description,
                datos_pago: paymentData,
                activo: active
            })
            .eq("id", id);


        if (error) {

            alert(
                "No se pudo guardar: " +
                error.message
            );

            return;
        }


        await loadAdminPaymentMethods();

        await loadPaymentMethods();

        alert(
            "Método guardado."
        );
    }


    async function deletePaymentMethod(item) {

        if (!item) return;


        const id =
            Number(item.dataset.id);


        if (
            !confirm(
                "¿Eliminar este método de pago?"
            )
        ) {
            return;
        }


        const {
            error
        } = await db
            .from(TABLE_PAYMENT_METHODS)
            .delete()
            .eq("id", id);


        if (error) {

            alert(
                "No se pudo eliminar: " +
                error.message
            );

            return;
        }


        await loadAdminPaymentMethods();

        await loadPaymentMethods();
    }


    /* =========================================================
       ADMIN - COMPROBANTES
       ========================================================= */

    async function loadAdminPaymentProofs() {

        if (!adminPaymentProofsContainer) {
            return;
        }


        const {
            data,
            error
        } = await db
            .from(TABLE_PAYMENT_PROOFS)
            .select(`
                *,
                users (
                    nombre,
                    apellido,
                    apodo,
                    cedula,
                    telefono
                ),
                memberships (
                    nombre
                ),
                payment_methods (
                    nombre
                )
            `)
            .order("created_at", {
                ascending: false
            });


        if (error) {

            console.error(error);

            adminPaymentProofsContainer.innerHTML = `
                <p>
                    No se pudieron cargar los comprobantes.
                </p>
            `;

            return;
        }


        if (!data?.length) {

            adminPaymentProofsContainer.innerHTML = `
                <p>
                    No hay comprobantes.
                </p>
            `;

            return;
        }


        adminPaymentProofsContainer.innerHTML =
            data.map(proof => {

                const status =
                    proof.estado || "pendiente";


                const userName =
                    proof.users?.apodo ||
                    proof.users?.nombre ||
                    "Usuario";


                return `
                    <button
                        type="button"
                        class="admin-proof-item"
                        data-proof-id="${proof.id}"
                    >

                        <strong>
                            ${escapeHTML(userName)}
                        </strong>

                        <span>
                            ${escapeHTML(
                                proof.memberships?.nombre ||
                                "Membresía"
                            )}
                        </span>

                        <span>
                            ${escapeHTML(
                                proof.payment_methods?.nombre ||
                                "Método de pago"
                            )}
                        </span>

                        <span>
                            ${formatPrice(proof.monto)}
                        </span>

                        <span>
                            Estado:
                            ${escapeHTML(status)}
                        </span>

                    </button>
                `;

            }).join("");
    }


    async function openPaymentProofDetail(id) {

        const {
            data,
            error
        } = await db
            .from(TABLE_PAYMENT_PROOFS)
            .select(`
                *,
                users (
                    nombre,
                    apellido,
                    apodo,
                    cedula,
                    telefono
                ),
                memberships (
                    nombre
                ),
                payment_methods (
                    nombre
                )
            `)
            .eq("id", id)
            .maybeSingle();


        if (error || !data) {

            alert(
                "No se pudo cargar el comprobante."
            );

            return;
        }


        selectedProof = data;


        const userName =
            data.users?.apodo ||
            data.users?.nombre ||
            "Usuario";


        if (paymentProofDetail) {

            paymentProofDetail.innerHTML = `

                <div class="proof-detail-content">

                    <h3>
                        ${escapeHTML(userName)}
                    </h3>

                    <p>
                        <strong>Cédula:</strong>
                        ${escapeHTML(
                            data.users?.cedula || ""
                        )}
                    </p>

                    <p>
                        <strong>Teléfono:</strong>
                        ${escapeHTML(
                            data.users?.telefono || ""
                        )}
                    </p>

                    <p>
                        <strong>Membresía:</strong>
                        ${escapeHTML(
                            data.memberships?.nombre || ""
                        )}
                    </p>

                    <p>
                        <strong>Método:</strong>
                        ${escapeHTML(
                            data.payment_methods?.nombre || ""
                        )}
                    </p>

                    <p>
                        <strong>Monto:</strong>
                        ${formatPrice(data.monto)}
                    </p>

                    <p>
                        <strong>Estado:</strong>
                        ${escapeHTML(
                            data.estado || "pendiente"
                        )}
                    </p>

                    ${
                        data.imagen_url
                            ? `
                                <img
                                    src="${escapeHTML(
                                        data.imagen_url
                                    )}"
                                    alt="Comprobante"
                                    class="proof-image"
                                >
                            `
                            : `
                                <p>
                                    No hay imagen del comprobante.
                                </p>
                            `
                    }

                </div>
            `;
        }


        if (paymentProofAdminActions) {

            const pending =
                data.estado === "pendiente";

            paymentProofAdminActions.style.display =
                pending
                    ? "flex"
                    : "none";
        }


        openPanel(paymentProofDetailPanel);
    }


    async function updatePaymentProofStatus(status) {

        if (!selectedProof) {
            return;
        }


        if (!isAdmin()) {

            alert(
                "No tienes permisos."
            );

            return;
        }


        const {
            error
        } = await db
            .from(TABLE_PAYMENT_PROOFS)
            .update({
                estado: status
            })
            .eq(
                "id",
                selectedProof.id
            );


        if (error) {

            alert(
                "No se pudo actualizar el comprobante: " +
                error.message
            );

            return;
        }


        /*
           Aprobar promoción relacionada.
        */

        if (
            status === "aprobado" &&
            selectedProof.promotion_id
        ) {

            const {
                error: promotionError
            } = await db
                .from(TABLE_PROMOTIONS)
                .update({
                    estado: "aprobada"
                })
                .eq(
                    "id",
                    selectedProof.promotion_id
                );

            if (promotionError) {
                console.error(
                    promotionError
                );
            }
        }


        /*
           Rechazar promoción relacionada.
        */

        if (
            status === "rechazado" &&
            selectedProof.promotion_id
        ) {

            const {
                error: promotionError
            } = await db
                .from(TABLE_PROMOTIONS)
                .update({
                    estado: "rechazada"
                })
                .eq(
                    "id",
                    selectedProof.promotion_id
                );

            if (promotionError) {
                console.error(
                    promotionError
                );
            }
        }


        alert(
            status === "aprobado"
                ? "Comprobante aprobado."
                : "Comprobante rechazado."
        );


        selectedProof = null;

        closePanel(
            paymentProofDetailPanel
        );

        await loadAdminPaymentProofs();

        await loadPromotions();
    }


    function openProofFullscreen() {

        if (!selectedProof?.imagen_url) {

            alert(
                "Este comprobante no tiene imagen."
            );

            return;
        }


        window.open(
            selectedProof.imagen_url,
            "_blank"
        );
    }


    /* =========================================================
       PERFIL
       ========================================================= */

    function openProfilePanel() {

        if (!currentProfile) {

            alert(
                "Debes iniciar sesión."
            );

            return;
        }

        updateUserInterface();

        openPanel(profilePanel);
    }


    async function saveProfile(event) {

        event.preventDefault();


        if (!currentProfile) {

            alert(
                "Debes iniciar sesión."
            );

            return;
        }


        const fullName =
            profileEditName?.value.trim();

        const phone =
            profileEditPhone?.value.trim();


        if (!fullName) {

            alert(
                "Escribe tu nombre."
            );

            return;
        }


        /*
           El campo antiguo de perfil solo tiene un nombre.
           Conservamos el nombre completo allí.
        */

        const {
            data,
            error
        } = await db
            .from(TABLE_USERS)
            .update({
                nombre: fullName,
                telefono: phone || null
            })
            .eq(
                "id",
                currentProfile.id
            )
            .select()
            .single();


        if (error) {

            alert(
                "No se pudo actualizar el perfil: " +
                error.message
            );

            return;
        }


        currentProfile = data;

        updateUserInterface();

        closePanel(profilePanel);

        alert(
            "Perfil actualizado correctamente."
        );
    }


    /* =========================================================
       CONFIGURACIÓN
       ========================================================= */

    function openSettings() {

        if (!currentUser) {

            alert(
                "Debes iniciar sesión."
            );

            return;
        }

        closeMenu();

        openPanel(settingsPanel);
    }


    /* =========================================================
       PREVISUALIZACIÓN DE IMÁGENES
       ========================================================= */

    async function handlePublicationImage() {

        const file =
            publicationImage?.files?.[0];


        if (!file) {

            publicationImageData = null;

            showImagePreview(
                publicationImagePreview,
                null
            );

            return;
        }


        publicationImageData =
            await readFileAsDataURL(file);


        showImagePreview(
            publicationImagePreview,
            publicationImageData
        );
    }


    async function handlePromotionImage(input) {

        const file =
            input?.files?.[0];


        if (!file) {
            return;
        }


        promotionImageData =
            await readFileAsDataURL(file);


        showImagePreview(
            promotionImagePreview,
            promotionImageData
        );


        if (
            input === promotionImageCamera &&
            promotionImageGallery
        ) {
            promotionImageGallery.value = "";
        }


        if (
            input === promotionImageGallery &&
            promotionImageCamera
        ) {
            promotionImageCamera.value = "";
        }
    }


    async function handlePaymentProofImage(input) {

        const file =
            input?.files?.[0];


        if (!file) {
            return;
        }


        paymentProofImageData =
            await readFileAsDataURL(file);


        showImagePreview(
            paymentProofPreview,
            paymentProofImageData
        );


        if (
            input === paymentProofCamera &&
            paymentProofGallery
        ) {
            paymentProofGallery.value = "";
        }


        if (
            input === paymentProofGallery &&
            paymentProofCamera
        ) {
            paymentProofCamera.value = "";
        }
    }


    /* =========================================================
       ACTUALIZAR APP
       ========================================================= */

    async function refreshApplication() {

        await loadCurrentUser();

        await Promise.all([
            loadPublications(),
            loadPromotions(),
            loadMemberships()
        ]);
    }


    /* =========================================================
       EVENTOS
       ========================================================= */

    /* ---------- Bienvenida ---------- */

    if (startButton) {

        startButton.addEventListener(
            "click",
            () => showScreen(loginScreen)
        );
    }


    /* ---------- Login ---------- */

    if (loginBackButton) {

        loginBackButton.addEventListener(
            "click",
            () => showScreen(welcomeScreen)
        );
    }


    /* ---------- Registro ---------- */

    if (registerBackButton) {

        registerBackButton.addEventListener(
            "click",
            () => showScreen(welcomeScreen)
        );
    }


    if (goRegisterButton) {

        goRegisterButton.addEventListener(
            "click",
            () => {

                clearErrors();

                showScreen(registerScreen);
            }
        );
    }


    if (goLoginButton) {

        goLoginButton.addEventListener(
            "click",
            () => {

                clearErrors();

                showScreen(loginScreen);
            }
        );
    }


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            loginUser
        );
    }


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            registerUser
        );
    }


    /* ---------- Menú ---------- */

    if (menuButton) {

        menuButton.addEventListener(
            "click",
            openMenu
        );
    }


    if (closeSideMenu) {

        closeSideMenu.addEventListener(
            "click",
            closeMenu
        );
    }


    if (closeMenuButton) {

        closeMenuButton.addEventListener(
            "click",
            closeMenu
        );
    }


    if (menuHomeButton) {

        menuHomeButton.addEventListener(
            "click",
            () => showPage(homeScreen)
        );
    }


    if (menuPublicationsButton) {

        menuPublicationsButton.addEventListener(
            "click",
            async () => {

                showPage(publicationsScreen);

                await loadPublications();
            }
        );
    }


    if (menuProfileButton) {

        menuProfileButton.addEventListener(
            "click",
            () => showPage(profileScreen)
        );
    }


    if (menuAdministrationButton) {

        menuAdministrationButton.addEventListener(
            "click",
            openAdministration
        );
    }


    if (menuSettingsButton) {

        menuSettingsButton.addEventListener(
            "click",
            openSettings
        );
    }


    if (menuLogoutButton) {

        menuLogoutButton.addEventListener(
            "click",
            logout
        );
    }


    /* ---------- Header ---------- */

    if (headerProfileButton) {

        headerProfileButton.addEventListener(
            "click",
            () => {

                showPage(profileScreen);
            }
        );
    }


    if (notificationsButton) {

        notificationsButton.addEventListener(
            "click",
            () => {

                alert(
                    "No tienes nuevas notificaciones."
                );
            }
        );
    }


    if (viewAllPublications) {

        viewAllPublications.addEventListener(
            "click",
            async () => {

                showPage(publicationsScreen);

                await loadPublications();
            }
        );
    }


    /* ---------- Publicar ---------- */

    if (publishButton) {

        publishButton.addEventListener(
            "click",
            () => {

                if (!currentUser) {

                    alert(
                        "Debes iniciar sesión."
                    );

                    return;
                }

                openPanel(publishPanel);
            }
        );
    }


    if (closePublishPanel) {

        closePublishPanel.addEventListener(
            "click",
            () => closePanel(publishPanel)
        );
    }


    if (publishForm) {

        publishForm.addEventListener(
            "submit",
            createPublication
        );
    }


    if (publicationImage) {

        publicationImage.addEventListener(
            "change",
            handlePublicationImage
        );
    }


    /* ---------- Flash ---------- */

    if (flashPromoteButton) {

        flashPromoteButton.addEventListener(
            "click",
            openPromotionPanel
        );
    }


    if (closePromotionPanel) {

        closePromotionPanel.addEventListener(
            "click",
            () => closePanel(promotionPanel)
        );
    }


    if (promotionForm) {

        promotionForm.addEventListener(
            "submit",
            createPendingPromotion
        );
    }


    if (promotionImageCamera) {

        promotionImageCamera.addEventListener(
            "change",
            () => handlePromotionImage(
                promotionImageCamera
            )
        );
    }


    if (promotionImageGallery) {

        promotionImageGallery.addEventListener(
            "change",
            () => handlePromotionImage(
                promotionImageGallery
            )
        );
    }


    /* ---------- Membresías ---------- */

    if (closeMembershipPanel) {

        closeMembershipPanel.addEventListener(
            "click",
            () => closePanel(membershipPanel)
        );
    }


    if (membershipContainer) {

        membershipContainer.addEventListener(
            "click",
            event => {

                const button =
                    event.target.closest(
                        ".membership-select-button"
                    );


                if (!button) {
                    return;
                }


                const code =
                    button.dataset.membership;


                if (code) {

                    selectMembership(code);
                }
            }
        );
    }


    /* ---------- Pago ---------- */

    if (closePaymentMethodPanel) {

        closePaymentMethodPanel.addEventListener(
            "click",
            () => closePanel(paymentMethodPanel)
        );
    }


    if (paymentMethodSelect) {

        paymentMethodSelect.addEventListener(
            "change",
            handlePaymentMethodChange
        );
    }


    if (continuePaymentButton) {

        continuePaymentButton.addEventListener(
            "click",
            continueToPaymentProof
        );
    }


    /* ---------- Comprobante ---------- */

    if (closePaymentProofPanel) {

        closePaymentProofPanel.addEventListener(
            "click",
            () => closePanel(paymentProofPanel)
        );
    }


    if (paymentProofCamera) {

        paymentProofCamera.addEventListener(
            "change",
            () => handlePaymentProofImage(
                paymentProofCamera
            )
        );
    }


    if (paymentProofGallery) {

        paymentProofGallery.addEventListener(
            "change",
            () => handlePaymentProofImage(
                paymentProofGallery
            )
        );
    }


    if (sendPaymentProofButton) {

        sendPaymentProofButton.addEventListener(
            "click",
            sendPaymentProof
        );
    }


    /* ---------- Administración ---------- */

    if (closeAdministrationPanel) {

        closeAdministrationPanel.addEventListener(
            "click",
            () => closePanel(administrationPanel)
        );
    }


    if (administrationButton) {

        administrationButton.addEventListener(
            "click",
            openAdministration
        );
    }


    if (saveMembershipsButton) {

        saveMembershipsButton.addEventListener(
            "click",
            saveMemberships
        );
    }


    if (addPaymentMethodButton) {

        addPaymentMethodButton.addEventListener(
            "click",
            addPaymentMethod
        );
    }


    if (adminPaymentMethodsContainer) {

        adminPaymentMethodsContainer.addEventListener(
            "click",
            event => {

                const item =
                    event.target.closest(
                        ".admin-payment-method-item"
                    );


                if (!item) {
                    return;
                }


                const saveButton =
                    event.target.closest(
                        ".save-payment-method"
                    );


                const deleteButton =
                    event.target.closest(
                        ".delete-payment-method"
                    );


                if (saveButton) {

                    savePaymentMethod(item);
                }


                if (deleteButton) {

                    deletePaymentMethod(item);
                }
            }
        );
    }


    if (adminPaymentProofsContainer) {

        adminPaymentProofsContainer.addEventListener(
            "click",
            event => {

                const item =
                    event.target.closest(
                        ".admin-proof-item"
                    );


                if (!item) {
                    return;
                }


                const id =
                    Number(
                        item.dataset.proofId
                    );


                if (id) {

                    openPaymentProofDetail(id);
                }
            }
        );
    }


    /* ---------- Detalle comprobante ---------- */

    if (closePaymentProofDetailPanel) {

        closePaymentProofDetailPanel.addEventListener(
            "click",
            () => {

                closePanel(
                    paymentProofDetailPanel
                );
            }
        );
    }


    if (approvePaymentProofButton) {

        approvePaymentProofButton.addEventListener(
            "click",
            () => {

                updatePaymentProofStatus(
                    "aprobado"
                );
            }
        );
    }


    if (rejectPaymentProofButton) {

        rejectPaymentProofButton.addEventListener(
            "click",
            () => {

                updatePaymentProofStatus(
                    "rechazado"
                );
            }
        );
    }


    if (fullscreenPaymentProofButton) {

        fullscreenPaymentProofButton.addEventListener(
            "click",
            openProofFullscreen
        );
    }


    /* ---------- Perfil ---------- */

    if (profileEditButton) {

        profileEditButton.addEventListener(
            "click",
            openProfilePanel
        );
    }


    if (closeProfilePanel) {

        closeProfilePanel.addEventListener(
            "click",
            () => closePanel(profilePanel)
        );
    }


    if (profileForm) {

        profileForm.addEventListener(
            "submit",
            saveProfile
        );
    }


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );
    }


    /* ---------- Configuración ---------- */

    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            openSettings
        );
    }


    if (closeSettingsPanel) {

        closeSettingsPanel.addEventListener(
            "click",
            () => closePanel(settingsPanel)
        );
    }


    if (settingsProfileButton) {

        settingsProfileButton.addEventListener(
            "click",
            () => {

                closePanel(settingsPanel);

                openProfilePanel();
            }
        );
    }


    if (settingsLogoutButton) {

        settingsLogoutButton.addEventListener(
            "click",
            logout
        );
    }


    /* =========================================================
       SUPABASE AUTH
       ========================================================= */

    db.auth.onAuthStateChange(
        async (event, session) => {

            console.log(
                "Market Flash Auth:",
                event
            );


            if (session?.user) {

                currentUser =
                    session.user;

            } else {

                currentUser = null;
                currentProfile = null;
            }
        }
    );


    /* =========================================================
       INICIALIZACIÓN
       ========================================================= */

    async function initialize() {

        clearErrors();

        closeAllPanels();

        closeMenu();


        try {

            const {
                data,
                error
            } = await db.auth.getSession();


            if (error) {

                console.error(
                    "Error comprobando sesión:",
                    error
                );

                showScreen(welcomeScreen);

                return;
            }


            if (data?.session?.user) {

                currentUser =
                    data.session.user;

                await loadCurrentProfile();


                if (currentProfile) {

                    showScreen(appScreen);

                    showPage(homeScreen);

                    await refreshApplication();

                } else {

                    await db.auth.signOut();

                    showScreen(welcomeScreen);
                }

            } else {

                showScreen(welcomeScreen);
            }

        } catch (error) {

            console.error(
                "Error inicializando Market Flash:",
                error
            );

            showScreen(welcomeScreen);
        }
    }


    initialize();

});
