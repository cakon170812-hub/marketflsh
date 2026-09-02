/* =========================================================
   MARKET FLASH
   APP DATA
   Configuración general de la aplicación
   ========================================================= */

const APP_DATA = {

    /* =====================================================
       INFORMACIÓN DE LA APLICACIÓN
       ===================================================== */

    app: {
        name: "Market Flash",
        version: "1.0.0",
        language: "es",
        country: "DO"
    },


    /* =====================================================
       MARCA
       ===================================================== */

    brand: {
        name: "MARKET FLASH",
        slogan: "Tu mercado. Tu espacio.",
        lightning: true
    },


    /* =====================================================
       PANTALLAS PRINCIPALES
       ===================================================== */

    screens: {
        welcome: "welcome-screen",
        login: "login-screen",
        register: "register-screen",
        dashboard: "dashboard-screen"
    },


    /* =====================================================
       CONFIGURACIÓN VISUAL
       ===================================================== */

    theme: {
        style: "digital-elegant",
        darkMode: true,
        animations: true,
        softGlow: true,
        responsive: true
    },


    /* =====================================================
       CONFIGURACIÓN DE CUENTA
       ===================================================== */

    account: {
        requireCedula: true,
        requirePhone: true,
        requirePassword: true,
        automaticLoginAfterRegister: true
    },


    /* =====================================================
       CONFIGURACIÓN DEL PANEL
       ===================================================== */

    dashboard: {

        showSettings: true,

        options: [
            "Configuración de la app",
            "Cerrar sesión"
        ]

    },


    /* =====================================================
       FUNCIONES QUE AGREGAREMOS MÁS ADELANTE
       ===================================================== */

    features: {

        inventory: false,

        sales: false,

        receipts: false,

        promotions: false,

        products: false,

        customers: false,

        notifications: false

    },


    /* =====================================================
       CONFIGURACIÓN FUTURA
       ===================================================== */

    future: {

        onlineAccounts: false,

        secureAuthentication: false,

        database: false,

        cloudStorage: false,

        payments: false

    }

};


/* =========================================================
   HACER DISPONIBLE LA CONFIGURACIÓN
   ========================================================= */

window.MARKET_FLASH_APP = APP_DATA;
