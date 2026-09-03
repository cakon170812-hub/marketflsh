/* =========================================================
   MARKET FLASH
   CONEXIÓN CON SUPABASE
   ========================================================= */

const SUPABASE_URL = "https://osxuhmgnpgbxfopqdhqr.supabase.co";

/*
   IMPORTANTE:
   Aquí debes colocar tu Publishable Key de Supabase.
   NO coloques la Secret Key.
*/
const SUPABASE_PUBLISHABLE_KEY = "PEGA_AQUI_TU_PUBLISHABLE_KEY";


/* =========================================================
   CLIENTE SUPABASE
   ========================================================= */

let supabaseClient = null;

function initializeSupabase() {

    if (typeof window.supabase === "undefined") {

        console.error(
            "Supabase JS todavía no está cargado."
        );

        return null;
    }

    if (
        !SUPABASE_URL ||
        !SUPABASE_PUBLISHABLE_KEY ||
        SUPABASE_PUBLISHABLE_KEY === "PEGA_AQUI_TU_PUBLISHABLE_KEY"
    ) {

        console.error(
            "Falta configurar la Publishable Key de Supabase."
        );

        return null;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    return supabaseClient;
}


/* =========================================================
   INICIALIZAR
   ========================================================= */

window.addEventListener("DOMContentLoaded", function () {

    initializeSupabase();

});
