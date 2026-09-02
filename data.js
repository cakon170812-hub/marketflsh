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


/* =========================================================
   HACER LOS DATOS DISPONIBLES EN TODA LA APLICACIÓN
   ========================================================= */

window.MARKET_FLASH_DATA = MARKET_FLASH_DATA;

window.getMarketFlashData = getMarketFlashData;

window.addMarketFlashUser = addMarketFlashUser;

window.addMarketFlashProduct = addMarketFlashProduct;

window.addMarketFlashSale = addMarketFlashSale;

window.addMarketFlashReceipt = addMarketFlashReceipt;
