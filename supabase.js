/* ========================================
MARKET FLASH ⚡ - SUPABASE.JS
Configuración de conexión
======================================== */

// 1. PEGA AQUI TUS CREDENCIALES DE SUPABASE
const SUPABASE_URL = https://osxuhmgnpgbxfopqdhqr.supabase.co/rest/v1/ // <- Cambia esto
const SUPABASE_ANON_KEY = sb_publishable_6qLmRFGHrwGq_CKqsIH7jA_Oz8TTlQZ// <- Cambia esto

// 2. INICIALIZAR CLIENTE
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 3. VARIABLES GLOBALES
let usuarioActual = null;
let tipoUsuario = 'USUARIO';

// 4. FUNCIONES BASE

// Verificar si hay sesión activa
async function verificarSesion() {
const { data: { session } = await supabase.auth.getSession();
if (session) {
usuarioActual = session.user;

// Cargar tipo de usuario desde tabla perfiles
const { data: perfil } = await supabase
.from('perfiles')
.select('tipo_usuario')
.eq('id', usuarioActual.id)
.single();

if (perfil) tipoUsuario = perfil.tipo_usuario;
}
return usuarioActual;
}

// Ir a otra página
function irA(pagina) {
window.location.href = pagina;
}

// Cerrar sesión
async function cerrarSesion() {
await supabase.auth.signOut();
usuarioActual = null;
irA('index.html');
}

// Abrir/Cerrar Modales
function abrirModal(id) {
document.getElementById(id).style.display = 'flex';
}

function cerrarModal(id) {
document.getElementById(id).style.display = 'none';
}

// Mostrar tabs
function mostrarTab(id) {
document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
document.getElementById(id).classList.add('active');
event.target.classList.add('active');
}

// Toggle switches
function toggleSwitch(id) {
document.getElementById(id).classList.toggle('active');
}

console.log('Supabase conectado ✅');
