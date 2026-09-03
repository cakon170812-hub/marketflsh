document.addEventListener("DOMContentLoaded", () => {

    // =====================================================
    // PANTALLAS
    // =====================================================

    const welcomeScreen = document.getElementById("welcome-screen");
    const loginScreen = document.getElementById("login-screen");
    const registerScreen = document.getElementById("register-screen");
    const dashboardScreen = document.getElementById("dashboard-screen");


    function showScreen(screen) {

        if (!screen) return;

        [
            welcomeScreen,
            loginScreen,
            registerScreen,
            dashboardScreen
        ].forEach((item) => {

            if (item) {
                item.classList.remove("active");
            }

        });

        screen.classList.add("active");
    }


    // =====================================================
    // PANELES PRINCIPALES
    // =====================================================

    const profilePanel =
        document.getElementById("profile-panel");

    const settingsPanel =
        document.getElementById("settings-panel");

    const administrationPanel =
        document.getElementById("administration-panel");


    function closeAllPanels() {

        const panels =
            document.querySelectorAll(".modal-panel");

        panels.forEach((panel) => {
            panel.classList.remove("open");
        });

        if (settingsPanel) {
            settingsPanel.classList.remove("open");
        }

    }


    // =====================================================
    // USUARIO Y SESIÓN
    // =====================================================

    function getSavedUser() {

        const savedUser =
            localStorage.getItem("marketFlashUser");

        if (!savedUser) return null;

        try {

            return JSON.parse(savedUser);

        } catch (error) {

            console.error(
                "Error leyendo usuario:",
                error
            );

            return null;
        }
    }


    function updateUserInformation() {

        const user = getSavedUser();

        if (!user) return;


        const dashboardUserName =
            document.getElementById("dashboard-user-name");

        const userNameDisplay =
            document.getElementById("user-name-display");

        const profileName =
            document.getElementById("profile-user-name");

        const profileCedula =
            document.getElementById("profile-user-cedula");

        const profilePhone =
            document.getElementById("profile-user-phone");


        if (dashboardUserName) {

            dashboardUserName.textContent =
                user.name || "Usuario";

        }


        if (userNameDisplay) {

            userNameDisplay.textContent =
                user.name || "Usuario";

        }


        if (profileName) {

            profileName.textContent =
                user.name || "Usuario";

        }


        if (profileCedula) {

            profileCedula.textContent =
                user.cedula || "—";

        }


        if (profilePhone) {

            profilePhone.textContent =
                user.phone || "—";

        }

    }


    function logout() {

        localStorage.removeItem(
            "marketFlashLoggedIn"
        );

        closeAllPanels();

        showScreen(welcomeScreen);
    }


    // =====================================================
    // BOTONES INICIO / CREAR CUENTA
    // =====================================================

    const loginButton =
        document.getElementById("login-button");

    const registerButton =
        document.getElementById("register-button");

    const backFromLogin =
        document.getElementById("back-from-login");

    const backFromRegister =
        document.getElementById("back-from-register");


    if (loginButton) {

        loginButton.addEventListener(
            "click",
            () => {
                showScreen(loginScreen);
            }
        );

    }


    if (registerButton) {

        registerButton.addEventListener(
            "click",
            () => {
                showScreen(registerScreen);
            }
        );

    }


    if (backFromLogin) {

        backFromLogin.addEventListener(
            "click",
            () => {
                showScreen(welcomeScreen);
            }
        );

    }


    if (backFromRegister) {

        backFromRegister.addEventListener(
            "click",
            () => {
                showScreen(welcomeScreen);
            }
        );

    }


    // =====================================================
    // CREAR CUENTA
    // =====================================================

    const registerForm =
        document.getElementById("register-form");


    if (registerForm) {

        registerForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const name =
                    document
                        .getElementById("register-name")
                        .value
                        .trim();


                const cedula =
                    document
                        .getElementById("register-cedula")
                        .value
                        .trim();


                const phone =
                    document
                        .getElementById("register-phone")
                        .value
                        .trim();


                const password =
                    document
                        .getElementById("register-password")
                        .value;


                const passwordConfirm =
                    document
                        .getElementById("register-password-confirm")
                        .value;


                if (
                    !name ||
                    !cedula ||
                    !phone ||
                    !password ||
                    !passwordConfirm
                ) {

                    alert(
                        "Completa todos los campos."
                    );

                    return;
                }


                if (password !== passwordConfirm) {

                    alert(
                        "Las contraseñas no coinciden."
                    );

                    return;
                }


                if (password.length < 6) {

                    alert(
                        "La contraseña debe tener al menos 6 caracteres."
                    );

                    return;
                }


                const user = {

                    name,

                    cedula,

                    phone,

                    password

                };


                localStorage.setItem(
                    "marketFlashUser",
                    JSON.stringify(user)
                );


                localStorage.setItem(
                    "marketFlashLoggedIn",
                    "true"
                );


                if (
                    typeof window.addMarketFlashUser ===
                    "function"
                ) {

                    window.addMarketFlashUser(user);

                }


                registerForm.reset();

                updateUserInformation();

                showScreen(dashboardScreen);


                alert(
                    "¡Cuenta creada correctamente! Bienvenido a Market Flash."
                );

            }
        );

    }


    // =====================================================
    // INICIAR SESIÓN
    // =====================================================

    const loginForm =
        document.getElementById("login-form");


    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const cedula =
                    document
                        .getElementById("login-cedula")
                        .value
                        .trim();


                const password =
                    document
                        .getElementById("login-password")
                        .value;


                const user =
                    getSavedUser();


                if (!user) {

                    alert(
                        "No existe una cuenta registrada. Primero crea una cuenta."
                    );

                    return;
                }


                if (
                    cedula === user.cedula &&
                    password === user.password
                ) {

                    localStorage.setItem(
                        "marketFlashLoggedIn",
                        "true"
                    );


                    loginForm.reset();

                    updateUserInformation();

                    showScreen(dashboardScreen);

                } else {

                    alert(
                        "La cédula o la contraseña son incorrectas."
                    );

                }

            }
        );

    }


    // =====================================================
    // CONFIGURACIÓN DE MEMBRESÍAS
    // =====================================================

    const FALLBACK_MEMBERSHIPS = {

        basica: {

            id: "basica",

            name: "Básica",

            description:
                "Una promoción sencilla para comenzar a destacar tu publicación.",

            price: null,

            features: [
                "Publicación promocionada",
                "Mayor visibilidad",
                "Presencia en Flash del Día"
            ]

        },


        premium: {

            id: "premium",

            name: "Premium",

            description:
                "Más visibilidad y prioridad para que tu publicación llegue a más personas.",

            price: null,

            features: [
                "Mayor prioridad",
                "Mayor visibilidad",
                "Posición destacada",
                "Presencia en Flash del Día"
            ]

        },


        vip: {

            id: "vip",

            name: "VIP",

            description:
                "La máxima opción de promoción para conseguir la mayor exposición.",

            price: null,

            features: [
                "Máxima prioridad",
                "Máxima visibilidad",
                "Posición especial",
                "Promoción destacada",
                "Mayor exposición"
            ]

        }

    };


    const FALLBACK_PAYMENT_METHODS = [

        {
            id: "banreservas",

            name: "BanReservas",

            prices: {
                basica: null,
                premium: null,
                vip: null
            }

        },


        {
            id: "bhd",

            name: "BHD",

            prices: {
                basica: null,
                premium: null,
                vip: null
            }

        },


        {
            id: "popular",

            name: "Banco Popular",

            prices: {
                basica: null,
                premium: null,
                vip: null
            }

        }

    ];


    function cloneObject(object) {

        return JSON.parse(
            JSON.stringify(object)
        );

    }


    // =====================================================
    // MEMBRESÍAS DESDE DATA.JS + LOCALSTORAGE
    // =====================================================

    function getBaseMemberships() {

        if (
            window.MARKET_FLASH_DATA &&
            window.MARKET_FLASH_DATA.memberships
        ) {

            return cloneObject(
                window.MARKET_FLASH_DATA.memberships
            );

        }

        return cloneObject(
            FALLBACK_MEMBERSHIPS
        );

    }


    function getMembershipSettings() {

        const base =
            getBaseMemberships();


        const saved =
            localStorage.getItem(
                "marketFlashMembershipSettings"
            );


        if (!saved) {

            localStorage.setItem(
                "marketFlashMembershipSettings",
                JSON.stringify(base)
            );

            return base;
        }


        try {

            const parsed =
                JSON.parse(saved);


            if (
                !parsed ||
                typeof parsed !== "object"
            ) {

                return base;

            }


            ["basica", "premium", "vip"].forEach(
                (id) => {

                    if (!base[id]) {
                        return;
                    }


                    if (
                        !parsed[id] ||
                        typeof parsed[id] !== "object"
                    ) {

                        parsed[id] =
                            cloneObject(base[id]);

                        return;

                    }


                    parsed[id] = {

                        ...base[id],

                        ...parsed[id],

                        features:
                            Array.isArray(
                                parsed[id].features
                            )
                                ? parsed[id].features
                                : cloneObject(
                                    base[id].features || []
                                )

                    };

                }
            );


            return parsed;

        } catch (error) {

            console.error(
                "Error leyendo membresías:",
                error
            );


            return base;
        }

    }


    function saveMembershipSettings(settings) {

        localStorage.setItem(
            "marketFlashMembershipSettings",
            JSON.stringify(settings)
        );


        if (
            window.MARKET_FLASH_DATA
        ) {

            window.MARKET_FLASH_DATA.memberships =
                cloneObject(settings);

        }

    }


    // =====================================================
    // MÉTODOS DE PAGO DESDE DATA.JS + LOCALSTORAGE
    // =====================================================

    function getBasePaymentMethods() {

        if (
            window.MARKET_FLASH_DATA &&
            Array.isArray(
                window.MARKET_FLASH_DATA.paymentMethods
            )
        ) {

            return cloneObject(
                window.MARKET_FLASH_DATA.paymentMethods
            );

        }

        return cloneObject(
            FALLBACK_PAYMENT_METHODS
        );

    }


    function normalizePaymentMethods(methods) {

        if (!Array.isArray(methods)) {
            return [];
        }


        return methods.map(
            (method, index) => {

                return {

                    id:
                        method.id ||
                        "metodo-" +
                        Date.now() +
                        "-" +
                        index,

                    name:
                        method.name ||
                        "Método de pago",

                    prices: {

                        basica:
                            method.prices?.basica ??
                            null,

                        premium:
                            method.prices?.premium ??
                            null,

                        vip:
                            method.prices?.vip ??
                            null

                    }

                };

            }
        );

    }


    function getPaymentMethods() {

        const base =
            getBasePaymentMethods();


        const saved =
            localStorage.getItem(
                "marketFlashPaymentMethods"
            );


        if (!saved) {

            const defaults =
                normalizePaymentMethods(base);


            localStorage.setItem(
                "marketFlashPaymentMethods",
                JSON.stringify(defaults)
            );


            return defaults;

        }


        try {

            const parsed =
                JSON.parse(saved);


            if (!Array.isArray(parsed)) {

                return normalizePaymentMethods(base);

            }


            return normalizePaymentMethods(parsed);

        } catch (error) {

            console.error(
                "Error leyendo métodos de pago:",
                error
            );


            return normalizePaymentMethods(base);

        }

    }


    function savePaymentMethods(methods) {

        const normalized =
            normalizePaymentMethods(methods);


        localStorage.setItem(
            "marketFlashPaymentMethods",
            JSON.stringify(normalized)
        );


        if (
            window.MARKET_FLASH_DATA
        ) {

            window.MARKET_FLASH_DATA.paymentMethods =
                cloneObject(normalized);

        }

    }


    // =====================================================
    // FORMATO DE PRECIO
    // =====================================================

    function formatPrice(price) {

        if (
            price === null ||
            price === undefined ||
            price === "" ||
            Number.isNaN(Number(price))
        ) {

            return "POR DEFINIR";

        }


        return (
            "RD$ " +
            Number(price).toLocaleString(
                "es-DO",
                {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }
            )
        );

    }


    // =====================================================
    // ACTUALIZAR TARJETAS DE MEMBRESÍAS
    // =====================================================

    function renderMembershipCards() {

        const settings =
            getMembershipSettings();


        ["basica", "premium", "vip"].forEach(
            (id) => {

                const plan =
                    settings[id];


                if (!plan) return;


                const priceElement =
                    document.getElementById(
                        `membership-price-${id}`
                    );


                const descriptionElement =
                    document.getElementById(
                        `membership-description-${id}`
                    );


                const featuresElement =
                    document.getElementById(
                        `membership-features-${id}`
                    );


                if (priceElement) {

                    priceElement.textContent =
                        formatPrice(plan.price);

                }


                if (descriptionElement) {

                    descriptionElement.textContent =
                        plan.description || "";

                }


                if (featuresElement) {

                    featuresElement.innerHTML = "";


                    const features =
                        Array.isArray(plan.features)
                            ? plan.features
                            : [];


                    features.forEach(
                        (feature) => {

                            const li =
                                document.createElement("li");


                            li.textContent =
                                feature;


                            featuresElement.appendChild(
                                li
                            );

                        }
                    );

                }

            }
        );

    }


    // =====================================================
    // FLASH DEL DÍA
    // =====================================================

    const promoteButton =
        document.getElementById("promote-button");

    const promotionPanel =
        document.getElementById("promotion-panel");

    const closePromotionPanel =
        document.getElementById(
            "close-promotion-panel"
        );


    if (promoteButton) {

        promoteButton.addEventListener(
            "click",
            () => {

                if (promotionPanel) {

                    promotionPanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    if (closePromotionPanel) {

        closePromotionPanel.addEventListener(
            "click",
            () => {

                if (promotionPanel) {

                    promotionPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // PANEL DE MEMBRESÍAS
    // =====================================================

    const membershipPanel =
        document.getElementById(
            "membership-panel"
        );


    const closeMembershipPanel =
        document.getElementById(
            "close-membership-panel"
        );


    if (closeMembershipPanel) {

        closeMembershipPanel.addEventListener(
            "click",
            () => {

                if (membershipPanel) {

                    membershipPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // VARIABLES DE PROMOCIÓN
    // =====================================================

    let promotionFiles = [];

    let pendingPromotion = null;


    // =====================================================
    // RECUPERAR PROMOCIÓN PENDIENTE
    // =====================================================

    function restorePendingPromotion() {

        const saved =
            localStorage.getItem(
                "marketFlashPendingPromotion"
            );


        if (!saved) return null;


        try {

            return JSON.parse(saved);

        } catch (error) {

            console.error(
                "Error recuperando promoción:",
                error
            );


            return null;
        }

    }


    pendingPromotion =
        restorePendingPromotion();


    // =====================================================
    // CÁMARA / GALERÍA DE PROMOCIÓN
    // =====================================================

    const promotionCameraButton =
        document.getElementById(
            "promotion-camera-button"
        );


    const promotionGalleryButton =
        document.getElementById(
            "promotion-gallery-button"
        );


    const promotionCameraPhotoInput =
        document.getElementById(
            "promotion-camera-photo-input"
        );


    const promotionCameraVideoInput =
        document.getElementById(
            "promotion-camera-video-input"
        );


    const promotionGalleryInput =
        document.getElementById(
            "promotion-gallery-input"
        );


    const promotionMediaPreview =
        document.getElementById(
            "promotion-media-preview"
        );


    // =====================================================
    // BOTÓN CÁMARA
    // =====================================================

    if (promotionCameraButton) {

        promotionCameraButton.addEventListener(
            "click",
            () => {

                const choice =
                    confirm(
                        "Pulsa ACEPTAR para tomar una FOTO.\n\n" +
                        "Pulsa CANCELAR para grabar un VIDEO."
                    );


                if (choice) {

                    if (promotionCameraPhotoInput) {

                        promotionCameraPhotoInput.value =
                            "";

                        promotionCameraPhotoInput.click();

                    }

                } else {

                    if (promotionCameraVideoInput) {

                        promotionCameraVideoInput.value =
                            "";

                        promotionCameraVideoInput.click();

                    }

                }

            }
        );

    }


    // =====================================================
    // BOTÓN GALERÍA
    // =====================================================

    if (promotionGalleryButton) {

        promotionGalleryButton.addEventListener(
            "click",
            () => {

                if (promotionGalleryInput) {

                    promotionGalleryInput.value =
                        "";

                    promotionGalleryInput.click();

                }

            }
        );

    }


    // =====================================================
    // AGREGAR ARCHIVOS
    // =====================================================

    function addPromotionFiles(files) {

        if (!files || !files.length) {
            return;
        }


        const newFiles =
            Array.from(files);


        promotionFiles = [
            ...promotionFiles,
            ...newFiles
        ];


        renderPromotionPreview();

    }


    // =====================================================
    // MOSTRAR PREVISUALIZACIÓN
    // =====================================================

    function renderPromotionPreview() {

        if (!promotionMediaPreview) {
            return;
        }


        promotionMediaPreview.innerHTML =
            "";


        if (!promotionFiles.length) {
            return;
        }


        const counter =
            document.createElement("div");


        counter.className =
            "media-count";


        counter.textContent =
            `${promotionFiles.length} archivo(s) seleccionado(s)`;


        promotionMediaPreview.appendChild(
            counter
        );


        promotionFiles.forEach(
            (file, index) => {

                const mediaItem =
                    document.createElement("div");


                mediaItem.className =
                    "promotion-media-item";


                const url =
                    URL.createObjectURL(file);


                if (
                    file.type.startsWith("image/")
                ) {

                    const image =
                        document.createElement("img");


                    image.src =
                        url;


                    image.alt =
                        "Material de promoción";


                    mediaItem.appendChild(
                        image
                    );


                } else if (
                    file.type.startsWith("video/")
                ) {

                    const video =
                        document.createElement("video");


                    video.src =
                        url;


                    video.controls =
                        true;


                    video.playsInline =
                        true;


                    mediaItem.appendChild(
                        video
                    );

                }


                const number =
                    document.createElement("span");


                number.className =
                    "media-number";


                number.textContent =
                    index + 1;


                mediaItem.appendChild(
                    number
                );


                promotionMediaPreview.appendChild(
                    mediaItem
                );

            }
        );

    }


    // =====================================================
    // CÁMARA FOTO
    // =====================================================

    if (promotionCameraPhotoInput) {

        promotionCameraPhotoInput.addEventListener(
            "change",
            (event) => {

                addPromotionFiles(
                    event.target.files
                );

            }
        );

    }


    // =====================================================
    // CÁMARA VIDEO
    // =====================================================

    if (promotionCameraVideoInput) {

        promotionCameraVideoInput.addEventListener(
            "change",
            (event) => {

                addPromotionFiles(
                    event.target.files
                );

            }
        );

    }


    // =====================================================
    // GALERÍA MÚLTIPLE
    // =====================================================

    if (promotionGalleryInput) {

        promotionGalleryInput.addEventListener(
            "change",
            (event) => {

                addPromotionFiles(
                    event.target.files
                );

            }
        );

    }


    // =====================================================
    // ENVIAR PROMOCIÓN
    // =====================================================

    const promotionForm =
        document.getElementById(
            "promotion-form"
        );


    if (promotionForm) {

        promotionForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const title =
                    document
                        .getElementById("promotion-title")
                        .value
                        .trim();


                const description =
                    document
                        .getElementById("promotion-description")
                        .value
                        .trim();


                const price =
                    document
                        .getElementById("promotion-price")
                        .value
                        .trim();


                const contact =
                    document
                        .getElementById("promotion-contact")
                        .value
                        .trim();


                if (!promotionFiles.length) {

                    alert(
                        "Debes agregar al menos una foto o un video para la promoción."
                    );

                    return;
                }


                if (
                    !title ||
                    !description ||
                    !contact
                ) {

                    alert(
                        "Completa la información de la promoción."
                    );

                    return;
                }


                pendingPromotion = {

                    id:
                        Date.now(),

                    user:
                        getSavedUser(),

                    title,

                    description,

                    price,

                    contact,

                    mediaCount:
                        promotionFiles.length,

                    mediaFiles:
                        [...promotionFiles],

                    status:
                        "Esperando membresía",

                    createdAt:
                        new Date().toISOString()

                };


                if (promotionPanel) {

                    promotionPanel.classList.remove(
                        "open"
                    );

                }


                renderMembershipCards();


                if (membershipPanel) {

                    membershipPanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // VARIABLES DE PAGO
    // =====================================================

    let selectedMembershipId = null;

    let selectedPaymentMethodId = null;


    // =====================================================
    // PANEL DE MÉTODO DE PAGO
    // =====================================================

    const paymentMethodPanel =
        document.getElementById(
            "payment-method-panel"
        );


    const selectedMembershipName =
        document.getElementById(
            "selected-membership-name"
        );


    const selectedMembershipPrice =
        document.getElementById(
            "selected-membership-price"
        );


    const paymentMethodsList =
        document.getElementById(
            "payment-methods-list"
        );


    const selectedPaymentMethod =
        document.getElementById(
            "selected-payment-method"
        );


    const selectedPaymentPrice =
        document.getElementById(
            "selected-payment-price"
        );


    const continueToProofButton =
        document.getElementById(
            "continue-to-proof-button"
        );


    // =====================================================
    // MOSTRAR MÉTODOS DE PAGO
    // =====================================================

    function renderPaymentMethods() {

        if (!paymentMethodsList) return;


        paymentMethodsList.innerHTML =
            "";


        const methods =
            getPaymentMethods();


        if (!methods.length) {

            paymentMethodsList.innerHTML =
                "<p>No hay métodos de pago disponibles.</p>";

            return;
        }


        methods.forEach(
            (method) => {

                const button =
                    document.createElement("button");


                button.type =
                    "button";


                button.className =
                    "payment-method-option";


                button.dataset.methodId =
                    method.id;


                const price =
                    selectedMembershipId &&
                    method.prices
                        ? method.prices[
                            selectedMembershipId
                        ]
                        : null;


                button.innerHTML = `
                    <strong>${escapeHtml(method.name)}</strong>
                    <span>${formatPrice(price)}</span>
                `;


                button.addEventListener(
                    "click",
                    () => {

                        selectedPaymentMethodId =
                            method.id;


                        document
                            .querySelectorAll(
                                ".payment-method-option"
                            )
                            .forEach(
                                (item) => {

                                    item.classList.remove(
                                        "selected"
                                    );

                                }
                            );


                        button.classList.add(
                            "selected"
                        );


                        if (selectedPaymentMethod) {

                            selectedPaymentMethod.textContent =
                                method.name;

                        }


                        if (selectedPaymentPrice) {

                            selectedPaymentPrice.textContent =
                                formatPrice(price);

                        }


                        if (selectedMembershipPrice) {

                            selectedMembershipPrice.textContent =
                                formatPrice(price);

                        }

                    }
                );


                paymentMethodsList.appendChild(
                    button
                );

            }
        );

    }


    // =====================================================
    // ESCAPAR HTML
    // =====================================================

    function escapeHtml(value) {

        if (
            value === null ||
            value === undefined
        ) {

            return "";

        }


        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    }


    // =====================================================
    // SELECCIONAR MEMBRESÍA
    // =====================================================

    const membershipCards =
        document.querySelectorAll(
            ".membership-card"
        );


    membershipCards.forEach(
        (card) => {

            card.addEventListener(
                "click",
                () => {

                    const membershipId =
                        card.dataset.membership;


                    const settings =
                        getMembershipSettings();


                    const selectedPlan =
                        settings[membershipId];


                    if (!selectedPlan) {

                        alert(
                            "No se pudo encontrar esta membresía."
                        );

                        return;
                    }


                    if (!pendingPromotion) {

                        alert(
                            "No hay una promoción pendiente."
                        );

                        return;
                    }


                    selectedMembershipId =
                        membershipId;


                    selectedPaymentMethodId =
                        null;


                    pendingPromotion.membership = {

                        id:
                            selectedPlan.id,

                        name:
                            selectedPlan.name,

                        description:
                            selectedPlan.description

                    };


                    pendingPromotion.status =
                        "Membresía seleccionada";


                    pendingPromotion.updatedAt =
                        new Date().toISOString();


                    savePendingPromotion();


                    if (selectedMembershipName) {

                        selectedMembershipName.textContent =
                            selectedPlan.name;

                    }


                    if (selectedMembershipPrice) {

                        selectedMembershipPrice.textContent =
                            "Selecciona un método de pago";

                    }


                    if (selectedPaymentMethod) {

                        selectedPaymentMethod.textContent =
                            "—";

                    }


                    if (selectedPaymentPrice) {

                        selectedPaymentPrice.textContent =
                            "—";

                    }


                    renderPaymentMethods();


                    if (membershipPanel) {

                        membershipPanel.classList.remove(
                            "open"
                        );

                    }


                    if (paymentMethodPanel) {

                        paymentMethodPanel.classList.add(
                            "open"
                        );

                    }

                }
            );

        }
    );


    // =====================================================
    // GUARDAR PROMOCIÓN PENDIENTE
    // =====================================================

    function savePendingPromotion() {

        if (!pendingPromotion) return;


        const data = {

            id:
                pendingPromotion.id,

            user:
                pendingPromotion.user,

            title:
                pendingPromotion.title,

            description:
                pendingPromotion.description,

            price:
                pendingPromotion.price,

            contact:
                pendingPromotion.contact,

            mediaCount:
                pendingPromotion.mediaCount,

            membership:
                pendingPromotion.membership ||
                null,

            payment:
                pendingPromotion.payment ||
                null,

            status:
                pendingPromotion.status,

            createdAt:
                pendingPromotion.createdAt,

            updatedAt:
                pendingPromotion.updatedAt ||
                null

        };


        localStorage.setItem(
            "marketFlashPendingPromotion",
            JSON.stringify(data)
        );

    }


    // =====================================================
    // CERRAR PANEL DE PAGO
    // =====================================================

    const closePaymentMethodPanel =
        document.getElementById(
            "close-payment-method-panel"
        );


    if (closePaymentMethodPanel) {

        closePaymentMethodPanel.addEventListener(
            "click",
            () => {

                if (paymentMethodPanel) {

                    paymentMethodPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // PANEL DE COMPROBANTE
    // =====================================================

    const paymentProofPanel =
        document.getElementById(
            "payment-proof-panel"
        );


    const closePaymentProofPanel =
        document.getElementById(
            "close-payment-proof-panel"
        );


    if (closePaymentProofPanel) {

        closePaymentProofPanel.addEventListener(
            "click",
            () => {

                if (paymentProofPanel) {

                    paymentProofPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // INFORMACIÓN DEL COMPROBANTE
    // =====================================================

    function updateProofInformation() {

        if (!pendingPromotion) return;


        const membershipName =
            document.getElementById(
                "proof-membership-name"
            );


        const paymentMethod =
            document.getElementById(
                "proof-payment-method"
            );


        const paymentAmount =
            document.getElementById(
                "proof-payment-amount"
            );


        if (membershipName) {

            membershipName.textContent =
                pendingPromotion.membership?.name ||
                "—";

        }


        if (paymentMethod) {

            paymentMethod.textContent =
                pendingPromotion.payment?.methodName ||
                "—";

        }


        if (paymentAmount) {

            paymentAmount.textContent =
                formatPrice(
                    pendingPromotion.payment?.amount
                );

        }

    }


    // =====================================================
    // CONTINUAR AL COMPROBANTE
    // =====================================================

    if (continueToProofButton) {

        continueToProofButton.addEventListener(
            "click",
            () => {

                if (!selectedMembershipId) {

                    alert(
                        "Selecciona una membresía."
                    );

                    return;
                }


                if (!selectedPaymentMethodId) {

                    alert(
                        "Selecciona un método de pago."
                    );

                    return;
                }


                const methods =
                    getPaymentMethods();


                const method =
                    methods.find(
                        (item) =>
                            item.id ===
                            selectedPaymentMethodId
                    );


                if (!method) {

                    alert(
                        "No se encontró el método de pago."
                    );

                    return;
                }


                const amount =
                    method.prices
                        ? method.prices[
                            selectedMembershipId
                        ]
                        : null;


                if (
                    amount === null ||
                    amount === undefined ||
                    amount === ""
                ) {

                    alert(
                        "El precio de esta membresía todavía no ha sido configurado para este método de pago. El administrador debe establecerlo primero."
                    );

                    return;
                }


                if (!pendingPromotion) {

                    alert(
                        "No hay una promoción pendiente."
                    );

                    return;
                }


                pendingPromotion.payment = {

                    methodId:
                        method.id,

                    methodName:
                        method.name,

                    amount:
                        Number(amount)

                };


                pendingPromotion.status =
                    "Esperando comprobante";


                pendingPromotion.updatedAt =
                    new Date().toISOString();


                savePendingPromotion();


                updateProofInformation();


                if (paymentMethodPanel) {

                    paymentMethodPanel.classList.remove(
                        "open"
                    );

                }


                if (paymentProofPanel) {

                    paymentProofPanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // FOTO DEL COMPROBANTE
    // =====================================================

    const proofCameraButton =
        document.getElementById(
            "proof-camera-button"
        );


    const proofGalleryButton =
        document.getElementById(
            "proof-gallery-button"
        );


    const proofCameraInput =
        document.getElementById(
            "proof-camera-input"
        );


    const proofGalleryInput =
        document.getElementById(
            "proof-gallery-input"
        );


    const paymentProofPreview =
        document.getElementById(
            "payment-proof-preview"
        );


    let paymentProofFile = null;

    let paymentProofDataUrl = null;


    if (proofCameraButton) {

        proofCameraButton.addEventListener(
            "click",
            () => {

                if (proofCameraInput) {

                    proofCameraInput.value =
                        "";

                    proofCameraInput.click();

                }

            }
        );

    }


    if (proofGalleryButton) {

        proofGalleryButton.addEventListener(
            "click",
            () => {

                if (proofGalleryInput) {

                    proofGalleryInput.value =
                        "";

                    proofGalleryInput.click();

                }

            }
        );

    }


    function showProofPreview(file) {

        if (!paymentProofPreview) {
            return;
        }


        paymentProofPreview.innerHTML =
            "";


        if (!file) {
            return;
        }


        const url =
            URL.createObjectURL(file);


        const image =
            document.createElement("img");


        image.src =
            url;


        image.alt =
            "Comprobante de pago";


        paymentProofPreview.appendChild(
            image
        );

    }


    if (proofCameraInput) {

        proofCameraInput.addEventListener(
            "change",
            (event) => {

                const file =
                    event.target.files?.[0];


                if (!file) return;


                if (!file.type.startsWith("image/")) {

                    alert(
                        "El comprobante debe ser una imagen."
                    );

                    return;
                }


                paymentProofFile =
                    file;


                showProofPreview(file);

            }
        );

    }


    if (proofGalleryInput) {

        proofGalleryInput.addEventListener(
            "change",
            (event) => {

                const file =
                    event.target.files?.[0];


                if (!file) return;


                if (!file.type.startsWith("image/")) {

                    alert(
                        "El comprobante debe ser una imagen."
                    );

                    return;
                }


                paymentProofFile =
                    file;


                showProofPreview(file);

            }
        );

    }


    // =====================================================
    // CONVERTIR IMAGEN A DATA URL
    // =====================================================

    function fileToDataURL(file) {

        return new Promise(
            (resolve, reject) => {

                const reader =
                    new FileReader();


                reader.onload = () => {

                    resolve(
                        reader.result
                    );

                };


                reader.onerror = () => {

                    reject(
                        reader.error
                    );

                };


                reader.readAsDataURL(file);

            }
        );

    }


    // =====================================================
    // ENVIAR COMPROBANTE
    // =====================================================

    const sendPaymentProofButton =
        document.getElementById(
            "send-payment-proof-button"
        );


    if (sendPaymentProofButton) {

        sendPaymentProofButton.addEventListener(
            "click",
            async () => {

                if (!pendingPromotion) {

                    alert(
                        "No hay una promoción pendiente."
                    );

                    return;
                }


                if (!paymentProofFile) {

                    alert(
                        "Debes tomar una foto o seleccionar una imagen del comprobante."
                    );

                    return;
                }


                try {

                    paymentProofDataUrl =
                        await fileToDataURL(
                            paymentProofFile
                        );


                    const now =
                        new Date();


                    const proof = {

                        id:
                            Date.now(),

                        promotionId:
                            pendingPromotion.id,

                        user:
                            pendingPromotion.user,

                        membership:
                            pendingPromotion.membership,

                        payment:
                            pendingPromotion.payment,

                        amount:
                            pendingPromotion.payment?.amount,

                        proofImage:
                            paymentProofDataUrl,

                        status:
                            "PENDIENTE",

                        createdAt:
                            now.toISOString(),

                        updatedAt:
                            now.toISOString()

                    };


                    const proofs =
                        getPaymentProofs();


                    proofs.unshift(
                        proof
                    );


                    savePaymentProofs(
                        proofs
                    );


                    if (
                        typeof window.addMarketFlashPaymentProof ===
                        "function"
                    ) {

                        window.addMarketFlashPaymentProof(
                            proof
                        );

                    }


                    pendingPromotion.status =
                        "PAGO PENDIENTE DE APROBACIÓN";


                    pendingPromotion.updatedAt =
                        now.toISOString();


                    savePendingPromotion();


                    paymentProofFile =
                        null;


                    paymentProofDataUrl =
                        null;


                    if (paymentProofPreview) {

                        paymentProofPreview.innerHTML =
                            "";

                    }


                    if (paymentProofPanel) {

                        paymentProofPanel.classList.remove(
                            "open"
                        );

                    }


                    renderAdminPaymentProofs();


                    alert(
                        "¡Comprobante enviado correctamente!\n\n" +
                        "Tu comprobante quedó PENDIENTE de aprobación."
                    );

                } catch (error) {

                    console.error(
                        "Error guardando comprobante:",
                        error
                    );


                    alert(
                        "No fue posible guardar el comprobante."
                    );

                }

            }
        );

    }


    // =====================================================
    // COMPROBANTES
    // =====================================================

    function getPaymentProofs() {

        const saved =
            localStorage.getItem(
                "marketFlashPaymentProofs"
            );


        if (!saved) {

            return [];

        }


        try {

            const proofs =
                JSON.parse(saved);


            return Array.isArray(proofs)
                ? proofs
                : [];

        } catch (error) {

            console.error(
                "Error leyendo comprobantes:",
                error
            );


            return [];

        }

    }


    function savePaymentProofs(proofs) {

        localStorage.setItem(
            "marketFlashPaymentProofs",
            JSON.stringify(proofs)
        );


        if (
            window.MARKET_FLASH_DATA
        ) {

            window.MARKET_FLASH_DATA.paymentProofs =
                cloneObject(proofs);

        }

    }


    // =====================================================
    // ADMINISTRACIÓN
    // =====================================================

    const administrationButton =
        document.getElementById(
            "administration-button"
        );


    const closeAdministrationPanel =
        document.getElementById(
            "close-administration-panel"
        );


    if (administrationButton) {

        administrationButton.addEventListener(
            "click",
            () => {

                if (profilePanel) {

                    profilePanel.classList.remove(
                        "open"
                    );

                }


                renderAdministrationPanel();


                if (administrationPanel) {

                    administrationPanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    if (closeAdministrationPanel) {

        closeAdministrationPanel.addEventListener(
            "click",
            () => {

                if (administrationPanel) {

                    administrationPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // CARGAR DATOS EN ADMINISTRACIÓN
    // =====================================================

    function renderAdministrationPanel() {

        renderAdminMembershipSettings();

        renderAdminPaymentMethods();

        renderAdminPaymentProofs();

    }


    // =====================================================
    // MEMBRESÍAS EN ADMINISTRACIÓN
    // =====================================================

    function renderAdminMembershipSettings() {

        const settings =
            getMembershipSettings();


        ["basica", "premium", "vip"].forEach(
            (id) => {

                const plan =
                    settings[id];


                if (!plan) return;


                const nameInput =
                    document.getElementById(
                        `admin-${id}-name`
                    );


                const descriptionInput =
                    document.getElementById(
                        `admin-${id}-description`
                    );


                const priceInput =
                    document.getElementById(
                        `admin-${id}-price`
                    );


                const featuresInput =
                    document.getElementById(
                        `admin-${id}-features`
                    );


                if (nameInput) {

                    nameInput.value =
                        plan.name || "";

                }


                if (descriptionInput) {

                    descriptionInput.value =
                        plan.description || "";

                }


                if (priceInput) {

                    priceInput.value =
                        plan.price ?? "";

                }


                if (featuresInput) {

                    featuresInput.value =
                        Array.isArray(plan.features)
                            ? plan.features.join("\n")
                            : "";

                }

            }
        );

    }


    // =====================================================
    // GUARDAR MEMBRESÍAS
    // =====================================================

    const saveMembershipSettingsButton =
        document.getElementById(
            "save-membership-settings"
        );


    if (saveMembershipSettingsButton) {

        saveMembershipSettingsButton.addEventListener(
            "click",
            () => {

                const settings =
                    getMembershipSettings();


                let valid =
                    true;


                ["basica", "premium", "vip"].forEach(
                    (id) => {

                        if (!valid) return;


                        const nameInput =
                            document.getElementById(
                                `admin-${id}-name`
                            );


                        const descriptionInput =
                            document.getElementById(
                                `admin-${id}-description`
                            );


                        const priceInput =
                            document.getElementById(
                                `admin-${id}-price`
                            );


                        const featuresInput =
                            document.getElementById(
                                `admin-${id}-features`
                            );


                        let price =
                            null;


                        if (
                            priceInput &&
                            priceInput.value.trim() !== ""
                        ) {

                            const numericPrice =
                                Number(
                                    priceInput.value
                                );


                            if (
                                Number.isNaN(
                                    numericPrice
                                ) ||
                                numericPrice < 0
                            ) {

                                alert(
                                    `El precio de ${id} no es válido.`
                                );


                                valid =
                                    false;


                                return;

                            }


                            price =
                                numericPrice;

                        }


                        settings[id] = {

                            id,

                            name:
                                nameInput
                                    ? nameInput.value.trim()
                                    : settings[id].name,

                            description:
                                descriptionInput
                                    ? descriptionInput.value.trim()
                                    : settings[id].description,

                            price,

                            features:
                                featuresInput
                                    ? featuresInput.value
                                        .split("\n")
                                        .map(
                                            (item) =>
                                                item.trim()
                                        )
                                        .filter(Boolean)
                                    : settings[id].features

                        };

                    }
                );


                if (!valid) {
                    return;
                }


                saveMembershipSettings(
                    settings
                );


                renderMembershipCards();


                renderPaymentMethods();


                alert(
                    "Configuración de membresías guardada correctamente."
                );

            }
        );

    }


    // =====================================================
    // MÉTODOS DE PAGO EN ADMINISTRACIÓN
    // =====================================================

    function renderAdminPaymentMethods() {

        const container =
            document.getElementById(
                "admin-payment-methods-list"
            );


        if (!container) return;


        container.innerHTML =
            "";


        const methods =
            getPaymentMethods();


        if (!methods.length) {

            container.innerHTML =
                "<p>No hay métodos de pago configurados.</p>";

            return;

        }


        methods.forEach(
            (method, index) => {

                const wrapper =
                    document.createElement("div");


                wrapper.className =
                    "admin-payment-method";


                wrapper.dataset.index =
                    index;


                wrapper.innerHTML = `

                    <div class="admin-payment-method-header">

                        <strong>
                            Método de pago ${index + 1}
                        </strong>

                        <button
                            type="button"
                            class="delete-payment-method"
                            data-index="${index}"
                        >
                            Eliminar
                        </button>

                    </div>

                    <label>
                        Nombre del método
                    </label>

                    <input
                        type="text"
                        class="admin-payment-method-name"
                        value="${escapeHtml(method.name || "")}"
                    >

                    <div class="admin-payment-prices">

                        <label>
                            Básica
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            class="admin-payment-price"
                            data-membership="basica"
                            value="${method.prices?.basica ?? ""}"
                            placeholder="Precio"
                        >

                        <label>
                            Premium
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            class="admin-payment-price"
                            data-membership="premium"
                            value="${method.prices?.premium ?? ""}"
                            placeholder="Precio"
                        >

                        <label>
                            VIP
                        </label>

                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            class="admin-payment-price"
                            data-membership="vip"
                            value="${method.prices?.vip ?? ""}"
                            placeholder="Precio"
                        >

                    </div>

                `;


                const deleteButton =
                    wrapper.querySelector(
                        ".delete-payment-method"
                    );


                if (deleteButton) {

                    deleteButton.addEventListener(
                        "click",
                        () => {

                            const currentMethods =
                                getPaymentMethods();


                            currentMethods.splice(
                                index,
                                1
                            );


                            savePaymentMethods(
                                currentMethods
                            );


                            renderAdminPaymentMethods();

                            renderPaymentMethods();

                        }
                    );

                }


                container.appendChild(
                    wrapper
                );

            }
        );

    }


    // =====================================================
    // AGREGAR MÉTODO DE PAGO
    // =====================================================

    const addPaymentMethodButton =
        document.getElementById(
            "add-payment-method-button"
        );


    if (addPaymentMethodButton) {

        addPaymentMethodButton.addEventListener(
            "click",
            () => {

                const methods =
                    getPaymentMethods();


                methods.push({

                    id:
                        "metodo-" +
                        Date.now(),

                    name:
                        "Nuevo método de pago",

                    prices: {

                        basica:
                            null,

                        premium:
                            null,

                        vip:
                            null

                    }

                });


                savePaymentMethods(
                    methods
                );


                renderAdminPaymentMethods();

            }
        );

    }


    // =====================================================
    // GUARDAR MÉTODOS DE PAGO
    // =====================================================

    const savePaymentMethodsButton =
        document.getElementById(
            "save-payment-methods-button"
        );


    if (savePaymentMethodsButton) {

        savePaymentMethodsButton.addEventListener(
            "click",
            () => {

                const container =
                    document.getElementById(
                        "admin-payment-methods-list"
                    );


                if (!container) return;


                const existingMethods =
                    getPaymentMethods();


                const rows =
                    container.querySelectorAll(
                        ".admin-payment-method"
                    );


                const methods =
                    [];


                let valid =
                    true;


                rows.forEach(
                    (row, index) => {

                        if (!valid) return;


                        const nameInput =
                            row.querySelector(
                                ".admin-payment-method-name"
                            );


                        const priceInputs =
                            row.querySelectorAll(
                                ".admin-payment-price"
                            );


                        const prices = {

                            basica:
                                null,

                            premium:
                                null,

                            vip:
                                null

                        };


                        priceInputs.forEach(
                            (input) => {

                                if (!valid) return;


                                const membership =
                                    input.dataset.membership;


                                if (
                                    input.value.trim() !== ""
                                ) {

                                    const value =
                                        Number(
                                            input.value
                                        );


                                    if (
                                        Number.isNaN(
                                            value
                                        ) ||
                                        value < 0
                                    ) {

                                        alert(
                                            "Uno de los precios de los métodos de pago no es válido."
                                        );


                                        valid =
                                            false;


                                        return;

                                    }


                                    prices[
                                        membership
                                    ] =
                                        value;

                                }

                            }
                        );


                        if (!valid) return;


                        methods.push({

                            id:
                                existingMethods[
                                    index
                                ]?.id ||
                                "metodo-" +
                                Date.now() +
                                "-" +
                                index,

                            name:
                                nameInput
                                    ? nameInput.value.trim() ||
                                      "Método de pago"
                                    : "Método de pago",

                            prices

                        });

                    }
                );


                if (!valid) {
                    return;
                }


                savePaymentMethods(
                    methods
                );


                renderPaymentMethods();


                alert(
                    "Métodos de pago y precios guardados correctamente."
                );

            }
        );

    }


    // =====================================================
    // COMPROBANTES EN ADMINISTRACIÓN
    // =====================================================

    function renderAdminPaymentProofs() {

        const container =
            document.getElementById(
                "admin-payment-proofs-list"
            );


        if (!container) return;


        container.innerHTML =
            "";


        const proofs =
            getPaymentProofs();


        const pendingCount =
            proofs.filter(
                (proof) =>
                    proof.status ===
                    "PENDIENTE"
            ).length;


        const pendingCountElement =
            document.getElementById(
                "pending-proof-count"
            );


        if (pendingCountElement) {

            pendingCountElement.textContent =
                pendingCount;

        }


        if (!proofs.length) {

            container.innerHTML =
                "<p>No hay comprobantes enviados.</p>";

            return;

        }


        proofs.forEach(
            (proof) => {

                const item =
                    document.createElement("div");


                item.className =
                    "admin-proof-item";


                item.innerHTML = `

                    <div>

                        <strong>
                            ${escapeHtml(
                                proof.user?.name ||
                                "Usuario"
                            )}
                        </strong>

                        <div>
                            ${escapeHtml(
                                proof.membership?.name ||
                                "Membresía"
                            )}
                        </div>

                        <div>
                            ${escapeHtml(
                                proof.payment?.methodName ||
                                "Método de pago"
                            )}
                        </div>

                        <div>
                            ${formatPrice(
                                proof.amount
                            )}
                        </div>

                        <div>
                            ${formatProofDate(
                                proof.createdAt
                            )}
                        </div>

                    </div>

                    <div>

                        <span class="proof-status proof-${String(
                            proof.status
                        ).toLowerCase()}">
                            ${escapeHtml(
                                proof.status
                            )}
                        </span>

                        <button
                            type="button"
                            class="view-proof-button"
                            data-proof-id="${proof.id}"
                        >
                            Ver comprobante
                        </button>

                    </div>

                `;


                const viewButton =
                    item.querySelector(
                        ".view-proof-button"
                    );


                if (viewButton) {

                    viewButton.addEventListener(
                        "click",
                        () => {

                            openAdminProofDetail(
                                proof.id
                            );

                        }
                    );

                }


                container.appendChild(
                    item
                );

            }
        );

    }


    // =====================================================
    // FECHA DEL COMPROBANTE
    // =====================================================

    function formatProofDate(date) {

        if (!date) {
            return "—";
        }


        try {

            return new Date(
                date
            ).toLocaleString(
                "es-DO",
                {
                    dateStyle: "short",
                    timeStyle: "short"
                }
            );

        } catch (error) {

            return "—";

        }

    }


    // =====================================================
    // DETALLE DEL COMPROBANTE
    // =====================================================

    const adminProofDetailPanel =
        document.getElementById(
            "admin-proof-detail-panel"
        );


    const closeAdminProofDetailPanel =
        document.getElementById(
            "close-admin-proof-detail-panel"
        );


    if (closeAdminProofDetailPanel) {

        closeAdminProofDetailPanel.addEventListener(
            "click",
            () => {

                if (adminProofDetailPanel) {

                    adminProofDetailPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    let selectedAdminProofId =
        null;


    function openAdminProofDetail(proofId) {

        const proofs =
            getPaymentProofs();


        const proof =
            proofs.find(
                (item) =>
                    String(item.id) ===
                    String(proofId)
            );


        if (!proof) {

            alert(
                "No se encontró el comprobante."
            );

            return;
        }


        selectedAdminProofId =
            proof.id;


        const userElement =
            document.getElementById(
                "admin-proof-user"
            );


        const membershipElement =
            document.getElementById(
                "admin-proof-membership"
            );


        const methodElement =
            document.getElementById(
                "admin-proof-method"
            );


        const amountElement =
            document.getElementById(
                "admin-proof-amount"
            );


        const dateElement =
            document.getElementById(
                "admin-proof-date"
            );


        const statusElement =
            document.getElementById(
                "admin-proof-status"
            );


        const imageElement =
            document.getElementById(
                "admin-proof-image"
            );


        if (userElement) {

            userElement.textContent =
                proof.user?.name ||
                "Usuario";

        }


        if (membershipElement) {

            membershipElement.textContent =
                proof.membership?.name ||
                "—";

        }


        if (methodElement) {

            methodElement.textContent =
                proof.payment?.methodName ||
                "—";

        }


        if (amountElement) {

            amountElement.textContent =
                formatPrice(
                    proof.amount
                );

        }


        if (dateElement) {

            dateElement.textContent =
                formatProofDate(
                    proof.createdAt
                );

        }


        if (statusElement) {

            statusElement.textContent =
                proof.status;

        }


        if (imageElement) {

            if (proof.proofImage) {

                imageElement.src =
                    proof.proofImage;

                imageElement.style.display =
                    "block";

            } else {

                imageElement.removeAttribute(
                    "src"
                );

                imageElement.style.display =
                    "none";

            }

        }


        const approveButton =
            document.getElementById(
                "approve-proof-button"
            );


        const rejectButton =
            document.getElementById(
                "reject-proof-button"
            );


        if (approveButton) {

            approveButton.disabled =
                proof.status !==
                "PENDIENTE";

        }


        if (rejectButton) {

            rejectButton.disabled =
                proof.status !==
                "PENDIENTE";

        }


        if (adminProofDetailPanel) {

            adminProofDetailPanel.classList.add(
                "open"
            );

        }

    }


    // =====================================================
    // PANTALLA COMPLETA DEL COMPROBANTE
    // =====================================================

    const fullscreenViewer =
        document.getElementById(
            "proof-fullscreen-viewer"
        );


    const fullscreenImage =
        document.getElementById(
            "proof-fullscreen-image"
        );


    const closeFullscreen =
        document.getElementById(
            "close-proof-fullscreen"
        );


    const viewFullscreenButton =
        document.getElementById(
            "view-proof-fullscreen-button"
        );


    if (viewFullscreenButton) {

        viewFullscreenButton.addEventListener(
            "click",
            () => {

                if (!selectedAdminProofId) {
                    return;
                }


                const proof =
                    getPaymentProofs().find(
                        (item) =>
                            String(item.id) ===
                            String(selectedAdminProofId)
                    );


                if (
                    !proof ||
                    !proof.proofImage
                ) {

                    alert(
                        "No hay una imagen disponible."
                    );

                    return;
                }


                if (fullscreenImage) {

                    fullscreenImage.src =
                        proof.proofImage;

                }


                if (fullscreenViewer) {

                    fullscreenViewer.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    if (closeFullscreen) {

        closeFullscreen.addEventListener(
            "click",
            () => {

                if (fullscreenViewer) {

                    fullscreenViewer.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // APROBAR COMPROBANTE
    // =====================================================

    const approveProofButton =
        document.getElementById(
            "approve-proof-button"
        );


    if (approveProofButton) {

        approveProofButton.addEventListener(
            "click",
            () => {

                updateProofStatus(
                    "APROBADO"
                );

            }
        );

    }


    // =====================================================
    // RECHAZAR COMPROBANTE
    // =====================================================

    const rejectProofButton =
        document.getElementById(
            "reject-proof-button"
        );


    if (rejectProofButton) {

        rejectProofButton.addEventListener(
            "click",
            () => {

                const confirmation =
                    confirm(
                        "¿Quieres rechazar este comprobante?"
                    );


                if (!confirmation) {
                    return;
                }


                updateProofStatus(
                    "RECHAZADO"
                );

            }
        );

    }


    // =====================================================
    // CAMBIAR ESTADO DEL COMPROBANTE
    // =====================================================

    function updateProofStatus(status) {

        if (!selectedAdminProofId) {
            return;
        }


        const proofs =
            getPaymentProofs();


        const index =
            proofs.findIndex(
                (proof) =>
                    String(proof.id) ===
                    String(selectedAdminProofId)
            );


        if (index === -1) {

            alert(
                "No se encontró el comprobante."
            );

            return;
        }


        proofs[index].status =
            status;


        proofs[index].updatedAt =
            new Date().toISOString();


        savePaymentProofs(
            proofs
        );


        const proof =
            proofs[index];


        const pending =
            restorePendingPromotion();


        if (
            pending &&
            String(pending.id) ===
            String(proof.promotionId)
        ) {

            if (status === "APROBADO") {

                pending.status =
                    "PROMOCIÓN APROBADA";

            } else if (
                status === "RECHAZADO"
            ) {

                pending.status =
                    "COMPROBANTE RECHAZADO";

            }


            pending.updatedAt =
                new Date().toISOString();


            localStorage.setItem(
                "marketFlashPendingPromotion",
                JSON.stringify(pending)
            );

        }


        openAdminProofDetail(
            selectedAdminProofId
        );


        renderAdminPaymentProofs();


        alert(
            status === "APROBADO"
                ? "Comprobante aprobado correctamente."
                : "Comprobante rechazado."
        );

    }


    // =====================================================
    // PUBLICACIÓN NORMAL — GRATIS
    // =====================================================

    const createPublicationButton =
        document.getElementById(
            "create-publication-button"
        );


    const publicationPanel =
        document.getElementById(
            "publication-panel"
        );


    const closePublicationPanel =
        document.getElementById(
            "close-publication-panel"
        );


    if (createPublicationButton) {

        createPublicationButton.addEventListener(
            "click",
            () => {

                if (publicationPanel) {

                    publicationPanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    if (closePublicationPanel) {

        closePublicationPanel.addEventListener(
            "click",
            () => {

                if (publicationPanel) {

                    publicationPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // MEDIA DE PUBLICACIÓN NORMAL
    // =====================================================

    const publicationCameraButton =
        document.getElementById(
            "publication-camera-button"
        );


    const publicationGalleryButton =
        document.getElementById(
            "publication-gallery-button"
        );


    const publicationCameraInput =
        document.getElementById(
            "publication-camera-input"
        );


    const publicationGalleryInput =
        document.getElementById(
            "publication-gallery-input"
        );


    const publicationMediaPreview =
        document.getElementById(
            "publication-media-preview"
        );


    let publicationFiles =
        [];


    if (publicationCameraButton) {

        publicationCameraButton.addEventListener(
            "click",
            () => {

                if (publicationCameraInput) {

                    publicationCameraInput.value =
                        "";

                    publicationCameraInput.click();

                }

            }
        );

    }


    if (publicationGalleryButton) {

        publicationGalleryButton.addEventListener(
            "click",
            () => {

                if (publicationGalleryInput) {

                    publicationGalleryInput.value =
                        "";

                    publicationGalleryInput.click();

                }

            }
        );

    }


    function addPublicationFiles(files) {

        if (!files || !files.length) {
            return;
        }


        publicationFiles = [

            ...publicationFiles,

            ...Array.from(files)

        ];


        renderPublicationPreview();

    }


    function renderPublicationPreview() {

        if (!publicationMediaPreview) {
            return;
        }


        publicationMediaPreview.innerHTML =
            "";


        publicationFiles.forEach(
            (file) => {

                const url =
                    URL.createObjectURL(file);


                if (
                    file.type.startsWith("image/")
                ) {

                    const image =
                        document.createElement("img");


                    image.src =
                        url;


                    image.alt =
                        "Imagen de publicación";


                    publicationMediaPreview.appendChild(
                        image
                    );


                } else if (
                    file.type.startsWith("video/")
                ) {

                    const video =
                        document.createElement("video");


                    video.src =
                        url;


                    video.controls =
                        true;


                    video.playsInline =
                        true;


                    publicationMediaPreview.appendChild(
                        video
                    );

                }

            }
        );

    }


    if (publicationCameraInput) {

        publicationCameraInput.addEventListener(
            "change",
            (event) => {

                addPublicationFiles(
                    event.target.files
                );

            }
        );

    }


    if (publicationGalleryInput) {

        publicationGalleryInput.addEventListener(
            "change",
            (event) => {

                addPublicationFiles(
                    event.target.files
                );

            }
        );

    }


    // =====================================================
    // PUBLICAR GRATIS
    // =====================================================

    const publicationForm =
        document.getElementById(
            "publication-form"
        );


    if (publicationForm) {

        publicationForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                const title =
                    document
                        .getElementById("publication-title")
                        .value
                        .trim();


                const description =
                    document
                        .getElementById("publication-description")
                        .value
                        .trim();


                const price =
                    document
                        .getElementById("publication-price")
                        .value
                        .trim();


                const contact =
                    document
                        .getElementById("publication-contact")
                        .value
                        .trim();


                if (
                    !title ||
                    !description
                ) {

                    alert(
                        "Completa el título y la descripción."
                    );

                    return;
                }


                const publication = {

                    id:
                        Date.now(),

                    user:
                        getSavedUser(),

                    title,

                    description,

                    price,

                    contact,

                    mediaCount:
                        publicationFiles.length,

                    createdAt:
                        new Date().toISOString()

                };


                if (
                    window.MARKET_FLASH_DATA
                ) {

                    window.MARKET_FLASH_DATA.products.push(
                        publication
                    );

                }


                console.log(
                    "PUBLICACIÓN GRATIS:",
                    publication
                );


                alert(
                    "¡Publicación creada gratis!"
                );


                publicationForm.reset();

                publicationFiles =
                    [];


                if (publicationMediaPreview) {

                    publicationMediaPreview.innerHTML =
                        "";

                }


                if (publicationPanel) {

                    publicationPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // PERFIL
    // =====================================================

    const profileNavButton =
        document.getElementById(
            "profile-nav-button"
        );


    const closeProfilePanel =
        document.getElementById(
            "close-profile-panel"
        );


    if (profileNavButton) {

        profileNavButton.addEventListener(
            "click",
            () => {

                updateUserInformation();


                if (profilePanel) {

                    profilePanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    if (closeProfilePanel) {

        closeProfilePanel.addEventListener(
            "click",
            () => {

                if (profilePanel) {

                    profilePanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // CONFIGURACIÓN
    // =====================================================

    const settingsButton =
        document.getElementById(
            "settings-button"
        );


    const closeSettings =
        document.getElementById(
            "close-settings"
        );


    if (settingsButton) {

        settingsButton.addEventListener(
            "click",
            () => {

                if (settingsPanel) {

                    settingsPanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    if (closeSettings) {

        closeSettings.addEventListener(
            "click",
            () => {

                if (settingsPanel) {

                    settingsPanel.classList.remove(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // IR AL PERFIL DESDE CONFIGURACIÓN
    // =====================================================

    const settingsProfileButton =
        document.getElementById(
            "settings-profile-button"
        );


    if (settingsProfileButton) {

        settingsProfileButton.addEventListener(
            "click",
            () => {

                if (settingsPanel) {

                    settingsPanel.classList.remove(
                        "open"
                    );

                }


                updateUserInformation();


                if (profilePanel) {

                    profilePanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // CONFIGURACIÓN DESDE PERFIL
    // =====================================================

    const profileSettingsButton =
        document.getElementById(
            "profile-settings-button"
        );


    if (profileSettingsButton) {

        profileSettingsButton.addEventListener(
            "click",
            () => {

                if (profilePanel) {

                    profilePanel.classList.remove(
                        "open"
                    );

                }


                if (settingsPanel) {

                    settingsPanel.classList.add(
                        "open"
                    );

                }

            }
        );

    }


    // =====================================================
    // EDITAR PERFIL
    // =====================================================

    const editProfileButton =
        document.getElementById(
            "edit-profile-button"
        );


    if (editProfileButton) {

        editProfileButton.addEventListener(
            "click",
            () => {

                alert(
                    "La edición del perfil se habilitará próximamente."
                );

            }
        );

    }


    // =====================================================
    // ELIMINAR CUENTA
    // =====================================================

    const deleteAccountButton =
        document.getElementById(
            "delete-account-button"
        );


    if (deleteAccountButton) {

        deleteAccountButton.addEventListener(
            "click",
            () => {

                const confirmation =
                    confirm(
                        "¿Estás seguro de que deseas eliminar tu cuenta?"
                    );


                if (!confirmation) {
                    return;
                }


                localStorage.removeItem(
                    "marketFlashUser"
                );


                localStorage.removeItem(
                    "marketFlashLoggedIn"
                );


                localStorage.removeItem(
                    "marketFlashPendingPromotion"
                );


                closeAllPanels();

                showScreen(
                    welcomeScreen
                );


                alert(
                    "Tu cuenta fue eliminada de este dispositivo."
                );

            }
        );

    }


    // =====================================================
    // CERRAR SESIÓN
    // =====================================================

    const logoutButton =
        document.getElementById(
            "logout-button"
        );


    const logoutProfileButton =
        document.getElementById(
            "logout-profile-button"
        );


    if (logoutButton) {

        logoutButton.addEventListener(
            "click",
            logout
        );

    }


    if (logoutProfileButton) {

        logoutProfileButton.addEventListener(
            "click",
            logout
        );

    }


    // =====================================================
    // INICIO
    // =====================================================

    const homeNavButton =
        document.getElementById(
            "home-nav-button"
        );


    if (homeNavButton) {

        homeNavButton.addEventListener(
            "click",
            () => {

                closeAllPanels();


                window.scrollTo({

                    top: 0,

                    behavior: "smooth"

                });

            }
        );

    }


    // =====================================================
    // CONFIGURACIÓN DE APP
    // =====================================================

    const appSettingsButton =
        document.getElementById(
            "app-settings-button"
        );


    if (appSettingsButton) {

        appSettingsButton.addEventListener(
            "click",
            () => {

                alert(
                    "Configuración de Market Flash."
                );

            }
        );

    }


    // =====================================================
    // ACTUALIZACIÓN INICIAL
    // =====================================================

    renderMembershipCards();

    renderAdminPaymentProofs();


    // =====================================================
    // RECUPERAR SESIÓN
    // =====================================================

    const loggedIn =
        localStorage.getItem(
            "marketFlashLoggedIn"
        );


    const savedUser =
        getSavedUser();


    if (
        loggedIn === "true" &&
        savedUser
    ) {

        updateUserInformation();

        showScreen(
            dashboardScreen
        );

    } else {

        showScreen(
            welcomeScreen
        );

    }

});
