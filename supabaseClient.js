const SUPABASE_URL = "https://osxuhmgnpgbxfopqdhqr.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_6qLmRFGHrwGq_CKqsIH7jA_Oz8TTlQZ";

let supabaseClient = null;

function initializeSupabase() {
    if (typeof window.supabase === "undefined") {
        console.error("Supabase JS no está cargado.");
        return null;
    }

    supabaseClient = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    // Hacer disponible la conexión para script.js
    window.supabaseClient = supabaseClient;

    console.log("Supabase conectado correctamente.");

    return supabaseClient;
}

window.addEventListener("DOMContentLoaded", function () {
    initializeSupabase();
});
