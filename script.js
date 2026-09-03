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
    // CERRAR TODOS LOS PANELES
    // =====================================================

    function closeAllPanels() {

        const panels =
            document.querySelectorAll(".modal-panel");

        panels.forEach((panel) => {

            panel.classList.remove("open");

        });


        const settingsPanel =
            document.getElementById("settings-panel");


        if (settingsPanel) {

            settingsPanel.classList.remove("open");

        }
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
    // FLASH DEL DÍA
    // =====================================================

    const promoteButton =
        document.getElementById("promote-button");

    const promotionPanel =
        document.getElementById("promotion-panel");

    const closePromotionPanel =
        document.getElementById("close-promotion-panel");


    if (promoteButton) {

        promoteButton.addEventListener(
            "click",
            () => {

                if (promotionPanel) {

                    promotionPanel.classList.add("open");

                }

            }
        );

    }


    if (closePromotionPanel) {

        closePromotionPanel.addEventListener(
            "click",
            () => {

                if (promotionPanel) {

                    promotionPanel.classList.remove("open");

                }

            }
        );

    }


    // =====================================================
    // PANEL DE MEMBRESÍAS
    // =====================================================

    const membershipPanel =
        document.getElementById("membership-panel");

    const closeMembershipPanel =
        document.getElementById("close-membership-panel");


    if (closeMembershipPanel) {

        closeMembershipPanel.addEventListener(
            "click",
            () => {

                if (membershipPanel) {

                    membershipPanel.classList.remove("open");

                }

            }
        );

    }


    // =====================================================
    // DATOS DE MEMBRESÍAS
    // =====================================================

    const membershipPlans = {

        basica: {

            id: "basica",

            name: "Básica",

            price: null,

            description:
                "Promoción destacada"

        },


        premium: {

            id: "premium",

            name: "Premium",

            price: null,

            description:
                "Mayor prioridad y visibilidad"

        },


        vip: {

            id: "vip",

            name: "VIP",

            price: null,

            description:
                "Máxima prioridad y visibilidad"

        }

    };


    // =====================================================
    // VARIABLES DE PROMOCIÓN
    // =====================================================

    let promotionFiles = [];

    let pendingPromotion = null;


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

                const choice = confirm(
                    "Pulsa ACEPTAR para tomar una FOTO.\n\n" +
                    "Pulsa CANCELAR para grabar un VIDEO."
                );


                if (choice) {

                    if (promotionCameraPhotoInput) {

                        promotionCameraPhotoInput.value = "";

                        promotionCameraPhotoInput.click();

                    }

                } else {

                    if (promotionCameraVideoInput) {

                        promotionCameraVideoInput.value = "";

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

                    promotionGalleryInput.value = "";

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


        promotionMediaPreview.innerHTML = "";


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


                    image.src = url;

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


                    video.src = url;

                    video.controls = true;

                    video.playsInline = true;


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


                // -----------------------------------------
                // VALIDAR MATERIAL
                // -----------------------------------------

                if (!promotionFiles.length) {

                    alert(
                        "Debes agregar al menos una foto o un video para la promoción."
                    );

                    return;
                }


                // -----------------------------------------
                // VALIDAR INFORMACIÓN
                // -----------------------------------------

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


                // -----------------------------------------
                // GUARDAR PROMOCIÓN PENDIENTE
                // -----------------------------------------

                pendingPromotion = {

                    id: Date.now(),

                    user: getSavedUser(),

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


                // -----------------------------------------
                // CERRAR FORMULARIO
                // -----------------------------------------

                if (promotionPanel) {

                    promotionPanel.classList.remove(
                        "open"
                    );

                }


                // -----------------------------------------
                // ABRIR MEMBRESÍAS
                // -----------------------------------------

                if (membershipPanel) {

                    membershipPanel.classList.add(
                        "open"
                    );

                }

            }
        );

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


                    const selectedPlan =
                        membershipPlans[
                            membershipId
                        ];


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


                    // -------------------------------------
                    // ASIGNAR MEMBRESÍA
                    // -------------------------------------

                    pendingPromotion.membership = {

                        id:
                            selectedPlan.id,

                        name:
                            selectedPlan.name,

                        price:
                            selectedPlan.price,

                        description:
                            selectedPlan.description

                    };


                    pendingPromotion.status =
                        "Membresía seleccionada";


                    pendingPromotion.updatedAt =
                        new Date().toISOString();


                    // -------------------------------------
                    // GUARDAR TEMPORALMENTE
                    // -------------------------------------

                    localStorage.setItem(
                        "marketFlashPendingPromotion",
                        JSON.stringify({
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
                                pendingPromotion.membership,

                            status:
                                pendingPromotion.status,

                            createdAt:
                                pendingPromotion.createdAt,

                            updatedAt:
                                pendingPromotion.updatedAt
                        })
                    );


                    // -------------------------------------
                    // MOSTRAR RESULTADO
                    // -------------------------------------

                    alert(
                        "Membresía seleccionada: " +
                        selectedPlan.name +
                        ".\n\n" +
                        "La siguiente etapa será el proceso de pago."
                    );


                    if (membershipPanel) {

                        membershipPanel.classList.remove(
                            "open"
                        );

                    }


                    // -------------------------------------
                    // MOSTRAR EN CONSOLA
                    // -------------------------------------

                    console.log(
                        "PROMOCIÓN:",
                        pendingPromotion
                    );


                    /*
                     * IMPORTANTE
                     *
                     * En esta etapa los archivos de imagen
                     * y video están disponibles en memoria
                     * para el proceso actual.
                     *
                     * Más adelante conectaremos el proyecto
                     * con almacenamiento/base de datos para
                     * enviar realmente estos archivos al servidor.
                     */

                }
            );

        }
    );


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


    let publicationFiles = [];


    if (publicationCameraButton) {

        publicationCameraButton.addEventListener(
            "click",
            () => {

                if (publicationCameraInput) {

                    publicationCameraInput.value = "";

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

                    publicationGalleryInput.value = "";

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


        publicationMediaPreview.innerHTML = "";


        publicationFiles.forEach(
            (file) => {

                const url =
                    URL.createObjectURL(file);


                if (
                    file.type.startsWith("image/")
                ) {

                    const image =
                        document.createElement("img");


                    image.src = url;

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


                    video.src = url;

                    video.controls = true;

                    video.playsInline = true;


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

                    id: Date.now(),

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


                console.log(
                    "PUBLICACIÓN GRATIS:",
                    publication
                );


                alert(
                    "¡Publicación creada gratis!"
                );


                publicationForm.reset();

                publicationFiles = [];


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


    const profilePanel =
        document.getElementById(
            "profile-panel"
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


    const settingsPanel =
        document.getElementById(
            "settings-panel"
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
    // ADMINISTRACIÓN
    // =====================================================

    const administrationButton =
        document.getElementById(
            "administration-button"
        );


    if (administrationButton) {

        administrationButton.addEventListener(
            "click",
            () => {

                alert(
                    "Panel de Administración.\n\n" +
                    "Esta función se conectará al sistema de " +
                    "aprobación de promociones en la siguiente etapa."
                );

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

                showScreen(welcomeScreen);


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

        showScreen(dashboardScreen);

    } else {

        showScreen(welcomeScreen);

    }

});
