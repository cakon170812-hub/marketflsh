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
input.type = input.type === 'password' ? 'text' : 'password';/* ========================================
MARKET FLASH ⚡ - SCRIPT.JS PARTE 2/4
Registro + Seguridad + Recuperación
======================================== */

// ========================================
// REGISTRO CON PREGUNTAS DE SEGURIDAD
// ========================================

async function registrarUsuario() {
const nombre = document.getElementById('reg-nombre').value;
const whatsapp = document.getElementById('reg-whatsapp').value;
const email = document.getElementById('reg-email').value;
const password = document.getElementById('reg-password').value;
const confirm = document.getElementById('reg-confirm').value;
const terminos = document.getElementById('reg-terminos').checked;

// Validaciones
if (!nombre || !whatsapp || !email || !password) {
alert('Completa todos los campos obligatorios');
return;
}
if (password !== confirm) {
alert('Las contraseñas no coinciden');
return;
}
if (!terminos) {
alert('Debes aceptar los términos y privacidad');
return;
}

// Obtener preguntas de seguridad
const preguntas = [
{ pregunta: document.getElementById('preg1').value, respuesta: document.getElementById('resp1').value },
{ pregunta: document.getElementById('preg2').value, respuesta: document.getElementById('resp2').value },
{ pregunta: document.getElementById('preg3').value, respuesta: document.getElementById('resp3').value }
];

if (preguntas.some(p => !p.pregunta || !p.respuesta)) {
alert('Completa las 3 preguntas de seguridad');
return;
}

// 1. Crear usuario en Auth
const { data: authData, error: authError } = await supabase.auth.signUp({
email, password
});

if (authError) {
alert('Error: ' + authError.message);
return;
}

// 2. Guardar perfil + preguntas hasheadas en tabla perfiles
const respuestasHasheadas = await Promise.all(
preguntas.map(async p => {
const hash = await hashRespuesta(p.respuesta);
return { pregunta: p.pregunta, respuesta_hash: hash };
})
);

const { error: perfilError } = await supabase.from('perfiles').insert([{
id: authData.user.id,
nombre_completo: nombre,
correo: email,
whatsapp: whatsapp,
tipo_usuario: 'USUARIO',
preguntas_seguridad: respuestasHasheadas,
estado: 'ACTIVO'
}]);

if (perfilError) {
alert('Error guardando perfil: ' + perfilError.message);
} else {
alert('Registro exitoso. Revisa tu correo para confirmar.');
irA('menu.html');
}
}

// Hashear respuestas de seguridad - NO guardar en texto plano
async function hashRespuesta(texto) {
const encoder = new TextEncoder();
const data = encoder.encode(texto.toLowerCase().trim());
const hashBuffer = await crypto.subtle.digest('SHA-256', data);
const hashArray = Array.from(new Uint8Array(hashBuffer));
return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ========================================
// RECUPERACIÓN DE CONTRASEÑA POR PREGUNTAS
// ========================================

let intentosRecuperacion = 0;
const MAX_INTENTOS = 3;
let usuarioRecuperacion = null;

async function iniciarRecuperacion() {
const email = document.getElementById('rec-email').value;
if (!email) return alert('Ingresa tu correo');

const { data, error } = await supabase.from('perfiles').select('*').eq('correo', email).single();
if (error || !data) return alert('Correo no encontrado');

usuarioRecuperacion = data;
intentosRecuperacion = 0;

// Mostrar preguntas
document.getElementById('preguntas-rec').innerHTML = `
<div class="form-group">
<label>${data.preguntas_seguridad[0].pregunta}</label>
<input type="text" id="rec-resp1">
</div>
<div class="form-group">
<label>${data.preguntas_seguridad[1].pregunta}</label>
<input type="text" id="rec-resp2">
</div>
<div class="form-group">
<label>${data.preguntas_seguridad[2].pregunta}</label>
<input type="text" id="rec-resp3">
</div>
<button class="btn-primary" onclick="validarRespuestas()">Validar respuestas</button>
`;
}

async function validarRespuestas() {
if (intentosRecuperacion >= MAX_INTENTOS) {
return alert('Máximo de intentos alcanzado. Intenta más tarde.');
}

const respuestas = [
document.getElementById('rec-resp1').value,
document.getElementById('rec-resp2').value,
document.getElementById('rec-resp3').value
];

const validaciones = await Promise.all(
respuestas.map((r, i) => hashRespuesta(r) === usuarioRecuperacion.preguntas_seguridad[i].respuesta_hash)
);

if (validaciones.every(v => v)) {
// Mostrar formulario nueva contraseña
document.getElementById('preguntas-rec').innerHTML = `
<div class="form-group">
<label>Nueva contraseña</label>
<input type="password" id="new-pass">
</div>
<div class="form-group">
<label>Confirmar contraseña</label>
<input type="password" id="new-pass-confirm">
</div>
<button class="btn-primary" onclick="cambiarPassword()">Cambiar contraseña</button>
`;
} else {
intentosRecuperacion++;
alert(`Respuestas incorrectas. Intentos restantes: ${MAX_INTENTOS - intentosRecuperacion}`);
}
}

async function cambiarPassword() {
const newPass = document.getElementById('new-pass').value;
const confirm = document.getElementById('new-pass-confirm').value;

if (newPass !== confirm) return alert('Las contraseñas no coinciden');

const { error } = await supabase.auth.updateUser({ password: newPass });
if (error) alert('Error: ' + error.message);
else {
alert('Contraseña actualizada. Ya puedes iniciar sesión.');
irA('auth.html?tab=login');
}
}/* ========================================
MARKET FLASH ⚡ - SCRIPT.JS PARTE 3/4
Productos, Fotos, Likes, Guardados
======================================== */

// ========================================
// PUBLICAR PRODUCTO
// ========================================

async function publicarProducto() {
if (!usuarioActual) return alert('Debes iniciar sesión');

const formData = {
vendedor: usuarioActual.id,
nombre: document.getElementById('prod-nombre').value,
precio: parseFloat(document.getElementById('prod-precio').value),
cantidad: parseInt(document.getElementById('prod-cantidad').value),
categoria: document.getElementById('prod-categoria').value,
subcategoria: document.getElementById('prod-subcategoria').value,
descripcion: document.getElementById('prod-descripcion').value,
ubicacion: document.getElementById('prod-ubicacion').value,
whatsapp: document.getElementById('prod-whatsapp').value,
estado: 'PENDIENTE' // para moderación
