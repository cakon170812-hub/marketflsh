/* ========================================
MARKET FLASH ⚡ - SCRIPT.JS PARTE 1/4
Propietario: Julio Alcántara Gómera
Supabase + Navegación + Auth
======================================== */

// CONFIGURACIÓN SUPABASE - CAMBIAR POR TUS CREDENCIALES
const SUPABASE_URL = 'https://tu-proyecto.supabase.co';
const SUPABASE_ANON_KEY = 'tu-anon-key-aqui';

// Inicializar cliente
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ESTADO GLOBAL
let usuarioActual = null;
let tipoUsuario = 'USUARIO';

// ========================================
// NAVEGACIÓN Y UI
// ========================================

function irA(ruta) {
window.location = ruta;
}

function mostrarTab(tab) {
document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));

document.getElementById(tab)?.classList.add('active');
document.querySelector(`[onclick="mostrarTab('${tab}')"]`)?.classList.add('active');
}

function abrirModal(id) {
document.getElementById(id)?.classList.add('active');
}
function cerrarModal(id) {
document.getElementById(id)?.classList.remove('active');
}

// Toggle mostrar/ocultar contraseña
function togglePassword(inputId) {
const input = document.getElementById(inputId);
input.type = input.type === 'password' ? 'text' : 'password';
