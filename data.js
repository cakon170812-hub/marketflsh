/* =========================================================
   MARKET FLASH
   DATA
   Datos de la aplicación
   ========================================================= */

const MARKET_FLASH_DATA = {

    /* =====================================================
       USUARIOS
       ===================================================== */

    users: [],


    /* =====================================================
       PRODUCTOS
       ===================================================== */

    products: [],


    /* =====================================================
       INVENTARIO
       ===================================================== */

    inventory: [],


    /* =====================================================
       VENTAS
       ===================================================== */

    sales: [],


    /* =====================================================
       RECIBOS
       ===================================================== */

    receipts: [],


    /* =====================================================
       CLIENTES
       ===================================================== */

    customers: [],


    /* =====================================================
       PROMOCIONES
       ===================================================== */

    promotions: [],


    /* =====================================================
       NOTIFICACIONES
       ===================================================== */

    notifications: [],


    /* =====================================================
       MEMBRESÍAS
       ===================================================== */

    memberships: {

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

    },


    /* =====================================================
       MÉTODOS DE PAGO
       ===================================================== */

    paymentMethods: [

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

    ],


    /* =====================================================
       COMPROBANTES DE PAGO
       ===================================================== */

    paymentProofs: [],


    /* =====================================================
       CONFIGURACIÓN DEL USUARIO
       ===================================================== */

    userSettings: {

        language: "es",

        darkMode: true,

        notifications: true

    }

};


/* =========================================================
   FUNCIONES BÁSICAS PARA MANEJAR LOS DATOS
   ========================================================= */

function getMarketFlashData() {

    return MARKET_FLASH_DATA;

}


function addMarketFlashUser(user) {

    MARKET_FLASH_DATA.users.push(user);

}


function addMarketFlashProduct(product) {

    MARKET_FLASH_DATA.products.push(product);

}


function addMarketFlashSale(sale) {

    MARKET_FLASH_DATA.sales.push(sale);

}


function addMarketFlashReceipt(receipt) {

    MARKET_FLASH_DATA.receipts.push(receipt);

}


function addMarketFlashPromotion(promotion) {

    MARKET_FLASH_DATA.promotions.push(promotion);

}


function addMarketFlashNotification(notification) {

    MARKET_FLASH_DATA.notifications.push(notification);

}


function addMarketFlashPaymentProof(proof) {

    MARKET_FLASH_DATA.paymentProofs.push(proof);

}


/* =========================================================
   HACER LOS DATOS DISPONIBLES EN TODA LA APLICACIÓN
   ========================================================= */

window.MARKET_FLASH_DATA = MARKET_FLASH_DATA;

window.getMarketFlashData = getMarketFlashData;

window.addMarketFlashUser = addMarketFlashUser;

window.addMarketFlashProduct = addMarketFlashProduct;

window.addMarketFlashSale = addMarketFlashSale;

window.addMarketFlashReceipt = addMarketFlashReceipt;

window.addMarketFlashPromotion = addMarketFlashPromotion;

window.addMarketFlashNotification = addMarketFlashNotification;

window.addMarketFlashPaymentProof = addMarketFlashPaymentProof;
