/* ========================================
   MARKET FLASH ⚡ - SCRIPT.JS
   Propietario: Julio Alcántara Gómera
   ======================================== */

// 1. CONFIGURACION GLOBAL
const APP_NAME = "MARKET FLASH ⚡";
const VERSION = "1.0.0";

// 2. NAVEGACION Y TRANSICIONES
function irA(pagina) {
  document.body.classList.add('fade-out');
  setTimeout(() => {
    window.location.href = pagina;
  }, 300);
}

function volver() {
  window.history.back();
}

// 3. MOSTRAR/OCULTAR CONTRASEÑA
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(inputId + '-icon');
  
  if (input.type === 'password') {
    input.type = 'text';
    if(icon) icon.textContent = '🙈';
  } else {
    input.type = 'password';
    if(icon) icon.textContent = '👁️';
  }
}

// 4. VALIDACIONES BASICAS
function validarEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

function validarWhatsApp(whatsapp) {
  // Acepta formato DO: 809-XXX-XXXX
  const re = /^[0-9]{10}$/;
  return re.test(whatsapp.replace(/[^0-9]/g, ''));
}

function mostrarError(mensaje) {
  alert('⚠️ ' + mensaje);
}

function mostrarExito(mensaje) {
  alert('✅ ' + mensaje);
}

// 5. LOGIN SOCIAL - PLACEHOLDERS FASE 4
async function loginGoogle() {
  console.log('Login Google - Conectar con Supabase Auth');
  mostrarError('Login con Google se activará en Fase 4 con Supabase');
}

async function loginApple() {
  console.log('Login Apple - Conectar con Supabase Auth');
  mostrarError('Login con Apple se activará en Fase 4 con Supabase');
}

// 6. GESTION DE SESION LOCAL TEMPORAL
function guardarSesion(usuario) {
  localStorage.setItem('mf_usuario', JSON.stringify(usuario));
}

function obtenerSesion() {
  const data = localStorage.getItem('mf_usuario');
  return data ? JSON.parse(data) : null;
}

function cerrarSesion() {
  localStorage.removeItem('mf_usuario');
  irA('index.html');
}

// 7. DETECTAR DISPOSITIVO
function esMovil() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

// 8. INICIALIZACION AL CARGAR
document.addEventListener('DOMContentLoaded', () => {
  console.log(`${APP_NAME} v${VERSION} Iniciado`);
  
  // Animacion logo si existe
  const logo = document.querySelector('.logo-flash');
  if(logo) {
    setTimeout(() => logo.classList.add('animate-flash'), 100);
  }
});// 9. FUNCIONES PARA PRODUCTOS - PLACEHOLDERS FASE 6
function publicarProducto() {
  console.log('Abrir formulario de publicación');
  irA('publicar.html');
}

function verProducto(id) {
  console.log('Ver producto:', id);
  irA(`producto.html?id=${id}`);
}

// 10. LIKES Y GUARDADOS - PLACEHOLDERS FASE 7
function toggleLike(productoId) {
  const btn = document.getElementById(`like-${productoId}`);
  if(btn) {
    btn.classList.toggle('liked');
    console.log('Like toggle:', productoId);
  }
}

function toggleGuardar(productoId) {
  const btn = document.getElementById(`save-${productoId}`);
  if(btn) {
    btn.classList.toggle('saved');
    console.log('Guardar toggle:', productoId);
  }
}

// 11. NOTIFICACIONES - PLACEHOLDERS FASE 7
function actualizarContadorNotificaciones(cantidad) {
  const badge = document.getElementById('notif-badge');
  if(badge) {
    badge.textContent = cantidad;
    badge.style.display = cantidad > 0 ? 'block' : 'none';
  }
}

// 12. NAVEGACION INFERIOR
function navegar(seccion) {
  const secciones = ['inicio', 'buscar', 'publicar', 'notificaciones', 'perfil'];
  
  if(seccion === 'publicar') {
    publicarProducto();
    return;
  }
  
  // Quitar active de todos
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Agregar active al actual
  const activo = document.getElementById(`nav-${seccion}`);
  if(activo) activo.classList.add('active');
  
  console.log('Navegando a:', seccion);
}

// 13. BUSQUEDA Y FILTROS - PLACEHOLDERS FASE 6
function buscar(query) {
  console.log('Buscar:', query);
  irA(`buscar.html?q=${encodeURIComponent(query)}`);
}

function limpiarFiltros() {
  console.log('Limpiar filtros');
}

// 14. UTILIDADES UI
function mostrarLoader() {
  document.getElementById('loader')?.classList.remove('hidden');
}

function ocultarLoader() {
  document.getElementById('loader')?.classList.add('hidden');
}

// 15. PROXIMAS FASES
// FASE 4: Integración Supabase Auth
// FASE 5: Sesiones reales
// FASE 6: CRUD Productos + Storage
// FASE 7: Likes, Guardados, Notificaciones reales
// FASE 8: Publicidad y Pagos

console.log('Market Flash ⚡ Script cargado correctamente');
