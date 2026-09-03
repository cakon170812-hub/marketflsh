/* =========================================================
   MARKET FLASH
   supabase-client.js
   Conexión con Supabase
   ========================================================= */

"use strict";


/* =========================================================
   CONFIGURACIÓN DE SUPABASE
   =========================================================
   
   IMPORTANTE:
   Aquí colocaremos la URL y la clave pública de tu proyecto
   de Supabase.

   NO coloques aquí una Service Role Key.

   Cuando lleguemos a conectar tu proyecto real, sustituiremos
   estos valores por los datos de tu proyecto.
   ========================================================= */

const SUPABASE_CONFIG = {

    url: "",

    publishableKey: ""

};


/* =========================================================
   ESTADO DE CONEXIÓN
   ========================================================= */

let marketFlashSupabase = null;

let supabaseConnected = false;


/* =========================================================
   INICIALIZAR SUPABASE
   ========================================================= */

function initializeSupabase() {

    try {

        /* Comprobar que la librería de Supabase existe */

        if (
            typeof window.supabase === "undefined"
        ) {

            console.warn(
                "Market Flash: la librería de Supabase no está disponible."
            );

            return null;

        }


        /* Comprobar que existen las credenciales */

        if (
            !SUPABASE_CONFIG.url ||
            !SUPABASE_CONFIG.publishableKey
        ) {

            console.warn(
                "Market Flash: todavía no se han configurado las credenciales de Supabase."
            );

            supabaseConnected = false;

            return null;

        }


        /* Crear cliente */

        marketFlashSupabase =
            window.supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.publishableKey
            );


        supabaseConnected = true;


        console.log(
            "Market Flash: Supabase conectado correctamente."
        );


        return marketFlashSupabase;

    } catch (error) {

        supabaseConnected = false;

        console.error(
            "Market Flash: error inicializando Supabase:",
            error
        );

        return null;

    }

}


/* =========================================================
   OBTENER CLIENTE
   ========================================================= */

function getSupabaseClient() {

    if (!marketFlashSupabase) {

        initializeSupabase();

    }

    return marketFlashSupabase;

}


/* =========================================================
   COMPROBAR CONEXIÓN
   ========================================================= */

function isSupabaseConnected() {

    return supabaseConnected;

}


/* =========================================================
   AUTENTICACIÓN
   ========================================================= */

async function supabaseRegister(
    email,
    password,
    userData = {}
) {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const {
            data,
            error
        } = await client.auth.signUp({

            email: email,

            password: password,

            options: {

                data: {

                    name:
                        userData.name || "",

                    whatsapp:
                        userData.whatsapp || ""

                }

            }

        });


        if (error) {

            return {

                success: false,

                error: error.message

            };

        }


        return {

            success: true,

            data: data

        };

    } catch (error) {

        return {

            success: false,

            error:
                error.message ||
                "No se pudo crear la cuenta."

        };

    }

}


/* =========================================================
   INICIAR SESIÓN
   ========================================================= */

async function supabaseLogin(
    email,
    password
) {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const {
            data,
            error
        } = await client.auth.signInWithPassword({

            email: email,

            password: password

        });


        if (error) {

            return {

                success: false,

                error: error.message

            };

        }


        return {

            success: true,

            data: data

        };

    } catch (error) {

        return {

            success: false,

            error:
                error.message ||
                "No se pudo iniciar sesión."

        };

    }

}


/* =========================================================
   CERRAR SESIÓN
   ========================================================= */

async function supabaseLogout() {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const {
            error
        } = await client.auth.signOut();


        if (error) {

            return {

                success: false,

                error: error.message

            };

        }


        return {

            success: true

        };

    } catch (error) {

        return {

            success: false,

            error:
                error.message ||
                "No se pudo cerrar sesión."

        };

    }

}


/* =========================================================
   OBTENER USUARIO ACTUAL
   ========================================================= */

async function supabaseGetCurrentUser() {

    const client = getSupabaseClient();

    if (!client) {

        return null;

    }


    try {

        const {
            data,
            error
        } = await client.auth.getUser();


        if (error) {

            return null;

        }


        return data?.user || null;

    } catch (error) {

        console.error(
            "Market Flash: error obteniendo usuario:",
            error
        );

        return null;

    }

}


/* =========================================================
   RECUPERACIÓN DE CONTRASEÑA
   ========================================================= */

async function supabaseResetPassword(
    email
) {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const redirectUrl =
            window.location.origin +
            window.location.pathname;


        const {
            error
        } = await client.auth.resetPasswordForEmail(
            email,
            {

                redirectTo: redirectUrl

            }
        );


        if (error) {

            return {

                success: false,

                error: error.message

            };

        }


        return {

            success: true

        };

    } catch (error) {

        return {

            success: false,

            error:
                error.message ||
                "No se pudo enviar el correo de recuperación."

        };

    }

}


/* =========================================================
   ACTUALIZAR CONTRASEÑA
   ========================================================= */

async function supabaseUpdatePassword(
    newPassword
) {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const {
            data,
            error
        } = await client.auth.updateUser({

            password: newPassword

        });


        if (error) {

            return {

                success: false,

                error: error.message

            };

        }


        return {

            success: true,

            data: data

        };

    } catch (error) {

        return {

            success: false,

            error:
                error.message ||
                "No se pudo actualizar la contraseña."

        };

    }

}


/* =========================================================
   OBTENER SESIÓN
   ========================================================= */

async function supabaseGetSession() {

    const client = getSupabaseClient();

    if (!client) {

        return null;

    }


    try {

        const {
            data,
            error
        } = await client.auth.getSession();


        if (error) {

            return null;

        }


        return data?.session || null;

    } catch (error) {

        return null;

    }

}


/* =========================================================
   ESCUCHAR CAMBIOS DE AUTENTICACIÓN
   ========================================================= */

function supabaseOnAuthChange(
    callback
) {

    const client = getSupabaseClient();

    if (!client) {

        return null;

    }


    return client.auth.onAuthStateChange(
        (event, session) => {

            if (
                typeof callback === "function"
            ) {

                callback(
                    event,
                    session
                );

            }

        }
    );

}


/* =========================================================
   CONSULTAR PRODUCTOS
   ========================================================= */

async function supabaseGetProducts() {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            data: [],

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const {
            data,
            error
        } = await client
            .from("product")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


        if (error) {

            return {

                success: false,

                data: [],

                error: error.message

            };

        }


        return {

            success: true,

            data: data || []

        };

    } catch (error) {

        return {

            success: false,

            data: [],

            error:
                error.message ||
                "No se pudieron cargar los productos."

        };

    }

}


/* =========================================================
   INSERTAR PRODUCTO
   ========================================================= */

async function supabaseCreateProduct(
    product
) {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            data: null,

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const {
            data,
            error
        } = await client
            .from("product")
            .insert([product])
            .select();


        if (error) {

            return {

                success: false,

                data: null,

                error: error.message

            };

        }


        return {

            success: true,

            data:
                data?.[0] || null

        };

    } catch (error) {

        return {

            success: false,

            data: null,

            error:
                error.message ||
                "No se pudo publicar el producto."

        };

    }

}


/* =========================================================
   ACTUALIZAR PRODUCTO
   ========================================================= */

async function supabaseUpdateProduct(
    productId,
    changes
) {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            data: null,

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const {
            data,
            error
        } = await client
            .from("product")
            .update(changes)
            .eq("id", productId)
            .select();


        if (error) {

            return {

                success: false,

                data: null,

                error: error.message

            };

        }


        return {

            success: true,

            data:
                data?.[0] || null

        };

    } catch (error) {

        return {

            success: false,

            data: null,

            error:
                error.message ||
                "No se pudo actualizar el producto."

        };

    }

}


/* =========================================================
   ELIMINAR PRODUCTO
   ========================================================= */

async function supabaseDeleteProduct(
    productId
) {

    const client = getSupabaseClient();

    if (!client) {

        return {

            success: false,

            error:
                "Supabase todavía no está configurado."

        };

    }


    try {

        const {
            error
        } = await client
            .from("product")
            .delete()
            .eq("id", productId);


        if (error) {

            return {

                success: false,

                error: error.message

            };

        }


        return {

            success: true

        };

    } catch (error) {

        return {

            success: false,

            error:
                error.message ||
                "No se pudo eliminar el producto."

        };

    }

}


/* =========================================================
   EXPORTAR CLIENTE GLOBAL
   ========================================================= */

window.MarketFlashSupabase = {

    config: SUPABASE_CONFIG,

    initialize: initializeSupabase,

    getClient: getSupabaseClient,

    isConnected: isSupabaseConnected,

    register: supabaseRegister,

    login: supabaseLogin,

    logout: supabaseLogout,

    getCurrentUser: supabaseGetCurrentUser,

    resetPassword: supabaseResetPassword,

    updatePassword: supabaseUpdatePassword,

    getSession: supabaseGetSession,

    onAuthChange: supabaseOnAuthChange,

    getProducts: supabaseGetProducts,

    createProduct: supabaseCreateProduct,

    updateProduct: supabaseUpdateProduct,

    deleteProduct: supabaseDeleteProduct

};


/* =========================================================
   INICIALIZAR
   ========================================================= */

initializeSupabase();


console.log(
    "Market Flash: supabase-client.js cargado correctamente."
);
