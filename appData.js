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
       MEMBRESÍAS
       ===================================================== */

    memberships: {

        editableFromAdministration: true,

        plans: {

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

        }

    },


    /* =====================================================
       MÉTODOS DE PAGO
       ===================================================== */

    payments: {

        editableFromAdministration: true,

        allowDifferentPriceByMethod: true,

        methods: [

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

        ]

    },


    /* =====================================================
       COMPROBANTES DE PAGO
       ===================================================== */

    paymentProofs: {

        enabled: true,

        allowCamera: true,

        allowGallery: true,

        statuses: [
            "PENDIENTE",
            "APROBADO",
            "RECHAZADO"
        ],

        administrationActions: [
            "Ver comprobante",
            "Ver pantalla completa",
            "Aprobar",
            "Rechazar"
        ]

    },


    /* =====================================================
       PROMOCIONES
       ===================================================== */

    promotions: {

        enabled: true,

        requireMembership: true,

        requirePaymentProof: true,

        approvalRequired: true,

        statuses: [
            "Esperando membresía",
            "Membresía seleccionada",
            "Esperando comprobante",
            "PAGO PENDIENTE DE APROBACIÓN",
            "PROMOCIÓN APROBADA",
            "COMPROBANTE RECHAZADO"
        ]

    },


    /* =====================================================
       ADMINISTRACIÓN
       ===================================================== */

    administration: {

        enabled: true,

        path: "Perfil → Administración",

        canEditMemberships: true,

        canEditMembershipPrices: true,

        canEditPaymentMethods: true,

        canEditPaymentPrices: true,

        canAddPaymentMethods: true,

        canDeletePaymentMethods: true,

        canViewPaymentProofs: true,

        canApprovePaymentProofs: true,

        canRejectPaymentProofs: true

    },


    /* =====================================================
       PUBLICACIONES
       ===================================================== */

    publications: {

        normal: {

            enabled: true,

            free: true

        },


        flashDelDia: {

            enabled: true,

            paid: true,

            requiresMembership: true,

            requiresApproval: true

        }

    },


    /* =====================================================
       FUNCIONES
       ===================================================== */

    features: {

        inventory: false,

        sales: false,

        receipts: false,

        promotions: true,

        products: false,

        customers: false,

        notifications: false,

        paymentProofs: true,

        administration: true

    },


    /* =====================================================
       CONFIGURACIÓN FUTURA
       ===================================================== */

    future: {

        onlineAccounts: false,

        secureAuthentication: false,

        database: false,

        cloudStorage: false,

        payments: true

    }

};


/* =========================================================
   HACER DISPONIBLE LA CONFIGURACIÓN
   ========================================================= */

window.MARKET_FLASH_APP = APP_DATA;
