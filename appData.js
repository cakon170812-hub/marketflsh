/* =========================================================
   MARKET FLASH
   app-data.js
   Datos, configuración y valores iniciales de la aplicación
   ========================================================= */

"use strict";


/* =========================================================
   INFORMACIÓN PRINCIPAL
   ========================================================= */

const MARKET_FLASH = {

    name: "Market Flash",

    version: "1.0.0",

    owner: "Julio Alcántara Gómez",

    currency: "DOP",

    country: "DO",

    defaultLanguage: "es",

    defaultTheme: "default"

};


/* =========================================================
   CLAVES DE ALMACENAMIENTO
   ========================================================= */

const STORAGE_KEYS = {

    USER: "mf_user",

    PRODUCTS: "mf_products",

    CONFIG: "mf_config",

    NOTIFICATIONS: "mf_notifications",

    MESSAGES: "mf_messages",

    STATISTICS: "mf_statistics",

    ADMIN: "mf_admin",

    THEME: "mf_theme"

};


/* =========================================================
   CATEGORÍAS
   ========================================================= */

const MARKET_FLASH_CATEGORIES = [

    {
        id: "all",
        name: "Todos",
        icon: "🔥"
    },

    {
        id: "phones",
        name: "Celulares",
        icon: "📱"
    },

    {
        id: "computers",
        name: "Computadoras",
        icon: "💻"
    },

    {
        id: "electronics",
        name: "Electrónica",
        icon: "🎧"
    },

    {
        id: "vehicles",
        name: "Vehículos",
        icon: "🚗"
    },

    {
        id: "motorcycles",
        name: "Motocicletas",
        icon: "🏍️"
    },

    {
        id: "home",
        name: "Hogar",
        icon: "🏠"
    },

    {
        id: "fashion",
        name: "Ropa",
        icon: "👕"
    },

    {
        id: "shoes",
        name: "Calzados",
        icon: "👟"
    },

    {
        id: "gaming",
        name: "Videojuegos",
        icon: "🎮"
    },

    {
        id: "tools",
        name: "Herramientas",
        icon: "🔧"
    },

    {
        id: "services",
        name: "Servicios",
        icon: "🛠️"
    },

    {
        id: "other",
        name: "Otros",
        icon: "📦"
    }

];


/* =========================================================
   CONFIGURACIÓN INICIAL
   ========================================================= */

const DEFAULT_CONFIG = {

    theme: "default",

    language: "es",

    notifications: true,

    soundNotifications: true,

    chatEnabled: true,

    whatsappEnabled: true,

    locationEnabled: true,

    darkMode: false,

    compactMode: false,

    animations: true,

    showOnlineStatus: true

};


/* =========================================================
   PLANES DE PROMOCIÓN
   ========================================================= */

const AD_PLANS = [

    {
        id: "cheap",
        name: "Básico",
        description: "Promoción económica para destacar tu producto.",
        price: 100,
        durationDays: 3,
        priority: 1,
        active: true
    },

    {
        id: "normal",
        name: "Normal",
        description: "Mayor visibilidad durante varios días.",
        price: 250,
        durationDays: 7,
        priority: 2,
        active: true
    },

    {
        id: "pro",
        name: "Pro",
        description: "Máxima visibilidad para tu publicación.",
        price: 500,
        durationDays: 15,
        priority: 3,
        active: true
    }

];


/* =========================================================
   MÉTODOS DE PAGO
   ========================================================= */

const PAYMENT_METHODS = [

    {
        id: "bank",
        name: "Transferencia bancaria",
        icon: "🏦",
        active: true
    },

    {
        id: "paypal",
        name: "PayPal",
        icon: "💳",
        active: true
    },

    {
        id: "binance",
        name: "Binance",
        icon: "₿",
        active: true
    }

];


/* =========================================================
   PRODUCTOS DE PRUEBA
   ========================================================= */

const SEED_PRODUCTS = [

    {
        id: "demo-iphone-15-pro",

        name: "iPhone 15 Pro",

        price: 55000,

        quantity: 1,

        category: "phones",

        description:
            "iPhone 15 Pro en excelente condición. Producto de demostración para Market Flash.",

        location: "Santo Domingo",

        images: [],

        video: null,

        seller: {

            id: "demo-seller-1",

            name: "Vendedor Demo",

            avatar: null,

            whatsapp: "",

            online: true

        },

        allowWhatsapp: true,

        allowInternalChat: true,

        promoted: true,

        approved: true,

        status: "active",

        views: 125,

        likes: 18,

        saves: 7,

        comments: 4,

        profileVisits: 12,

        createdAt: new Date().toISOString()

    },


    {
        id: "demo-samsung-s24",

        name: "Samsung Galaxy S24",

        price: 42000,

        quantity: 1,

        category: "phones",

        description:
            "Samsung Galaxy S24. Publicación de demostración.",

        location: "Santo Domingo Este",

        images: [],

        video: null,

        seller: {

            id: "demo-seller-2",

            name: "Market Flash Demo",

            avatar: null,

            whatsapp: "",

            online: false

        },

        allowWhatsapp: true,

        allowInternalChat: true,

        promoted: false,

        approved: true,

        status: "active",

        views: 87,

        likes: 11,

        saves: 5,

        comments: 2,

        profileVisits: 8,

        createdAt: new Date(
            Date.now() - 3600000
        ).toISOString()

    },


    {
        id: "demo-laptop",

        name: "Laptop",

        price: 35000,

        quantity: 1,

        category: "computers",

        description:
            "Laptop para trabajo, estudios y uso diario.",

        location: "Santo Domingo",

        images: [],

        video: null,

        seller: {

            id: "demo-seller-3",

            name: "Tecnología Demo",

            avatar: null,

            whatsapp: "",

            online: true

        },

        allowWhatsapp: true,

        allowInternalChat: true,

        promoted: false,

        approved: true,

        status: "active",

        views: 64,

        likes: 9,

        saves: 4,

        comments: 3,

        profileVisits: 6,

        createdAt: new Date(
            Date.now() - 7200000
        ).toISOString()

    },


    {
        id: "demo-ps5",

        name: "PlayStation 5",

        price: 32000,

        quantity: 1,

        category: "gaming",

        description:
            "PlayStation 5 para videojuegos. Producto de demostración.",

        location: "Santo Domingo",

        images: [],

        video: null,

        seller: {

            id: "demo-seller-4",

            name: "Gaming Demo",

            avatar: null,

            whatsapp: "",

            online: true

        },

        allowWhatsapp: true,

        allowInternalChat: true,

        promoted: true,

        approved: true,

        status: "active",

        views: 143,

        likes: 25,

        saves: 13,

        comments: 6,

        profileVisits: 18,

        createdAt: new Date(
            Date.now() - 10800000
        ).toISOString()

    }

];


/* =========================================================
   ESTADÍSTICAS INICIALES DEL USUARIO
   ========================================================= */

const DEFAULT_STATISTICS = {

    sales: 0,

    views: 0,

    likes: 0,

    comments: 0,

    saved: 0,

    profileVisits: 0,

    productsPublished: 0,

    messagesReceived: 0,

    totalIncome: 0

};


/* =========================================================
   DATOS DEL ADMINISTRADOR
   ========================================================= */

const DEFAULT_ADMIN_CONFIG = {

    isAdmin: false,

    advertisingEnabled: true,

    promotionsEnabled: true,

    paymentsEnabled: true,

    userManagementEnabled: true,

    productModerationEnabled: true,

    statisticsEnabled: true

};


/* =========================================================
   ESTADO INICIAL DE NOTIFICACIONES
   ========================================================= */

const DEFAULT_NOTIFICATIONS = [];


/* =========================================================
   ESTADO INICIAL DE MENSAJES
   ========================================================= */

const DEFAULT_MESSAGES = [];


/* =========================================================
   UTILIDADES
   ========================================================= */

function mfGetStorage(key, fallback = null) {

    try {

        const value = localStorage.getItem(key);

        if (value === null) {
            return fallback;
        }

        return JSON.parse(value);

    } catch (error) {

        console.error(
            "Market Flash: error leyendo almacenamiento:",
            error
        );

        return fallback;

    }

}


function mfSetStorage(key, value) {

    try {

        localStorage.setItem(
            key,
            JSON.stringify(value)
        );

        return true;

    } catch (error) {

        console.error(
            "Market Flash: error guardando almacenamiento:",
            error
        );

        return false;

    }

}


/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

function mfGetConfig() {

    const savedConfig = mfGetStorage(
        STORAGE_KEYS.CONFIG,
        {}
    );

    return {
        ...DEFAULT_CONFIG,
        ...savedConfig
    };

}


function mfSaveConfig(config) {

    const currentConfig = mfGetConfig();

    const newConfig = {
        ...currentConfig,
        ...config
    };

    return mfSetStorage(
        STORAGE_KEYS.CONFIG,
        newConfig
    );

}


/* =========================================================
   PRODUCTOS
   ========================================================= */

function mfGetProducts() {

    const savedProducts = mfGetStorage(
        STORAGE_KEYS.PRODUCTS,
        null
    );

    if (
        !Array.isArray(savedProducts) ||
        savedProducts.length === 0
    ) {

        mfSetStorage(
            STORAGE_KEYS.PRODUCTS,
            SEED_PRODUCTS
        );

        return [...SEED_PRODUCTS];

    }

    return savedProducts;

}


function mfSaveProducts(products) {

    return mfSetStorage(
        STORAGE_KEYS.PRODUCTS,
        products
    );

}


/* =========================================================
   USUARIO
   ========================================================= */

function mfGetUser() {

    return mfGetStorage(
        STORAGE_KEYS.USER,
        null
    );

}


function mfSaveUser(user) {

    return mfSetStorage(
        STORAGE_KEYS.USER,
        user
    );

}


function mfClearUser() {

    localStorage.removeItem(
        STORAGE_KEYS.USER
    );

}


/* =========================================================
   ESTADÍSTICAS
   ========================================================= */

function mfGetStatistics() {

    const savedStatistics = mfGetStorage(
        STORAGE_KEYS.STATISTICS,
        {}
    );

    return {
        ...DEFAULT_STATISTICS,
        ...savedStatistics
    };

}


function mfSaveStatistics(statistics) {

    const currentStatistics =
        mfGetStatistics();

    return mfSetStorage(
        STORAGE_KEYS.STATISTICS,
        {
            ...currentStatistics,
            ...statistics
        }
    );

}


/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function mfGetNotifications() {

    return mfGetStorage(
        STORAGE_KEYS.NOTIFICATIONS,
        DEFAULT_NOTIFICATIONS
    );

}


function mfSaveNotifications(notifications) {

    return mfSetStorage(
        STORAGE_KEYS.NOTIFICATIONS,
        notifications
    );

}


/* =========================================================
   MENSAJES
   ========================================================= */

function mfGetMessages() {

    return mfGetStorage(
        STORAGE_KEYS.MESSAGES,
        DEFAULT_MESSAGES
    );

}


function mfSaveMessages(messages) {

    return mfSetStorage(
        STORAGE_KEYS.MESSAGES,
        messages
    );

}


/* =========================================================
   ADMINISTRACIÓN
   ========================================================= */

function mfGetAdminConfig() {

    const savedAdminConfig = mfGetStorage(
        STORAGE_KEYS.ADMIN,
        {}
    );

    return {
        ...DEFAULT_ADMIN_CONFIG,
        ...savedAdminConfig
    };

}


function mfSaveAdminConfig(config) {

    const currentConfig =
        mfGetAdminConfig();

    return mfSetStorage(
        STORAGE_KEYS.ADMIN,
        {
            ...currentConfig,
            ...config
        }
    );

}


/* =========================================================
   FORMATO DE DINERO
   ========================================================= */

function mfFormatMoney(value) {

    const number = Number(value) || 0;

    return new Intl.NumberFormat(
        "es-DO",
        {
            style: "currency",
            currency: "DOP",
            minimumFractionDigits: 2
        }
    ).format(number);

}


/* =========================================================
   GENERADOR DE ID
   ========================================================= */

function mfGenerateId(prefix = "mf") {

    return (

        prefix +
        "-" +
        Date.now() +
        "-" +
        Math.random()
            .toString(36)
            .substring(2, 9)

    );

}


/* =========================================================
   FECHA
   ========================================================= */

function mfFormatDate(date) {

    try {

        return new Intl.DateTimeFormat(
            "es-DO",
            {
                dateStyle: "medium",
                timeStyle: "short"
            }
        ).format(
            new Date(date)
        );

    } catch (error) {

        return "";

    }

}


/* =========================================================
   BUSCAR CATEGORÍA
   ========================================================= */

function mfGetCategoryById(categoryId) {

    return MARKET_FLASH_CATEGORIES.find(
        category =>
            category.id === categoryId
    ) || MARKET_FLASH_CATEGORIES[
        MARKET_FLASH_CATEGORIES.length - 1
    ];

}


/* =========================================================
   PREPARAR DATOS INICIALES
   ========================================================= */

function mfInitializeData() {

    if (
        !localStorage.getItem(
            STORAGE_KEYS.PRODUCTS
        )
    ) {

        mfSetStorage(
            STORAGE_KEYS.PRODUCTS,
            SEED_PRODUCTS
        );

    }


    if (
        !localStorage.getItem(
            STORAGE_KEYS.CONFIG
        )
    ) {

        mfSetStorage(
            STORAGE_KEYS.CONFIG,
            DEFAULT_CONFIG
        );

    }


    if (
        !localStorage.getItem(
            STORAGE_KEYS.STATISTICS
        )
    ) {

        mfSetStorage(
            STORAGE_KEYS.STATISTICS,
            DEFAULT_STATISTICS
        );

    }


    if (
        !localStorage.getItem(
            STORAGE_KEYS.NOTIFICATIONS
        )
    ) {

        mfSetStorage(
            STORAGE_KEYS.NOTIFICATIONS,
            DEFAULT_NOTIFICATIONS
        );

    }


    if (
        !localStorage.getItem(
            STORAGE_KEYS.MESSAGES
        )
    ) {

        mfSetStorage(
            STORAGE_KEYS.MESSAGES,
            DEFAULT_MESSAGES
        );

    }


    if (
        !localStorage.getItem(
            STORAGE_KEYS.ADMIN
        )
    ) {

        mfSetStorage(
            STORAGE_KEYS.ADMIN,
            DEFAULT_ADMIN_CONFIG
        );

    }

}


/* =========================================================
   INICIALIZACIÓN AUTOMÁTICA
   ========================================================= */

mfInitializeData();


/* =========================================================
   DISPONIBILIDAD GLOBAL
   ========================================================= */

window.MarketFlashData = {

    app: MARKET_FLASH,

    categories: MARKET_FLASH_CATEGORIES,

    config: DEFAULT_CONFIG,

    adPlans: AD_PLANS,

    paymentMethods: PAYMENT_METHODS,

    seedProducts: SEED_PRODUCTS,

    defaultStatistics: DEFAULT_STATISTICS,

    adminConfig: DEFAULT_ADMIN_CONFIG,

    storageKeys: STORAGE_KEYS,

    getStorage: mfGetStorage,

    setStorage: mfSetStorage,

    getConfig: mfGetConfig,

    saveConfig: mfSaveConfig,

    getProducts: mfGetProducts,

    saveProducts: mfSaveProducts,

    getUser: mfGetUser,

    saveUser: mfSaveUser,

    clearUser: mfClearUser,

    getStatistics: mfGetStatistics,

    saveStatistics: mfSaveStatistics,

    getNotifications: mfGetNotifications,

    saveNotifications: mfSaveNotifications,

    getMessages: mfGetMessages,

    saveMessages: mfSaveMessages,

    getAdminConfig: mfGetAdminConfig,

    saveAdminConfig: mfSaveAdminConfig,

    formatMoney: mfFormatMoney,

    generateId: mfGenerateId,

    formatDate: mfFormatDate,

    getCategoryById: mfGetCategoryById

};


console.log(
    "Market Flash: app-data.js cargado correctamente."
);
