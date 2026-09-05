// CONFIG SUPABASE - PEGA TUS CLAVES AQUI CUANDO LAS TENGAS
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_KEY = 'TU_CLAVE_PUBLICA_ANON_KEY_AQUI';

// INICIALIZAR SUPABASE 1 SOLA VEZ
let supabaseClient = null;
try {
  if (SUPABASE_URL.includes('TU-PROYECTO')) throw new Error('Modo Demo');
  supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  console.log('Supabase Conectado');
} catch (e) {
  console.log('Modo DEMO con localStorage');
}

// DATOS DEMO
const CATEGORIAS = ['Todos','Tecnologia','Celulares','Computadoras','Vehiculos','Hogar','Ropa','Servicios','Electronica','Otros'];
const PRODUCTOS_DEMO = [
  {id:1, nombre:'iPhone 15 Pro', precio:85000, categoria:'Celulares', ubicacion:'Santo Domingo', imagen:'https://via.placeholder.com/300/FF6B00', destacado:true, vistas:120, likes:15, whatsapp:'18091234567'},
  {id:2, nombre:'Samsung S24 Ultra', precio:95000, categoria:'Celulares', ubicacion:'Santiago', imagen:'https://via.placeholder.com/300/00A3FF', destacado:true, vistas:200, likes:32, whatsapp:'18097654321'},
  {id:3, nombre:'Laptop Gamer', precio:65000, categoria:'Computadoras', ubicacion:'La Vega', imagen:'https://via.placeholder.com/300', destacado:false, vistas:80, likes:8, whatsapp:'18091112233'},
  {id:4, nombre:'PS5', precio:45000, categoria:'Electronica', ubicacion:'Santo Domingo', imagen:'https://via.placeholder.com/300', destacado:false, vistas:150, likes:25, whatsapp:'18094445566'}
];

// ESTADO
let productos = [];
let categoriaActiva = 'Todos';

// INICIALIZAR
document.addEventListener('DOMContentLoaded', () => {
  cargarCategorias();
  cargarProductos();
  setupEventos();
});

function cargarCategorias() {
  const cont = document.getElementById('contenedor-categorias');
  const select = document.getElementById('prod-categoria');
  cont.innerHTML = CATEGORIAS.map(cat => 
    `<div class="categoria-chip ${cat==='Todos'?'active':''}" data-cat="${cat}">${cat}</div>`
  ).join('');
  select.innerHTML = CATEGORIAS.filter(c=>c!=='Todos').map(c=>`<option value="${c}">${c}</option>`).join('');
}

function cargarProductos() {
  productos = JSON.parse(localStorage.getItem('mf_products')) || PRODUCTOS_DEMO;
  renderizarProductos();
}

function renderizarProductos(filtro='') {
  let filtrados = productos.filter(p => 
    (categoriaActiva === 'Todos' || p.categoria === categoriaActiva) &&
    p.nombre.toLowerCase().includes(filtro.toLowerCase())
  );
  
  const destacados = filtrados.filter(p => p.destacado);
  const normales = filtrados.filter(p => !p.destacado);

  document.getElementById('contenedor-destacados').innerHTML = destacados.map(cardHTML).join('');
  document.getElementById('contenedor-productos').innerHTML = normales.map(cardHTML).join('');
}

function cardHTML(p) {
  return `
    <div class="card-producto ${p.destacado?'flash':''}" onclick="abrirDetalle(${p.id})">
      <img src="${p.imagen}">
      <h3>${p.nombre}</h3>
      <div class="precio">RD$ ${p.precio.toLocaleString('es-DO')}</div>
      <div style="font-size:11px; color:var(--text-gray)">📍 ${p.ubicacion} | 👁️ ${p.vistas}</div>
    </div>
  `;
}

function abrirDetalle(id) {
  const p = productos.find(x => x.id === id);
  document.getElementById('detalle-producto').innerHTML = `
    <img src="${p.imagen}" style="width:100%; border-radius:12px;">
    <h2>${p.nombre}</h2>
    <h3 style="color:var(--naranja)">RD$ ${p.precio.toLocaleString('es-DO')}</h3>
    <p>${p.ubicacion}</p>
    <button class="btn btn-naranja" onclick="contactarWhatsApp('${p.whatsapp}')">💬 WhatsApp</button>
    <button class="btn btn-azul" onclick="compartirProducto(${p.id})">📤 Compartir</button>
  `;
  document.getElementById('modal-detalle').style.display = 'block';
}

function contactarWhatsApp(num) {
  window.open(`https://wa.me/1${num}?text=Hola, vi tu producto en MARKET FLASH`);
}

// EVENTOS
function setupEventos() {
  document.getElementById('contenedor-categorias').addEventListener('click', e => {
    if(e.target.classList.contains('categoria-chip')) {
      document.querySelectorAll('.categoria-chip').forEach(c=>c.classList.remove('active'));
      e.target.classList.add('active');
      categoriaActiva = e.target.dataset.cat;
      renderizarProductos();
    }
  });

  document.getElementById('input-busqueda').addEventListener('input', e => renderizarProductos(e.target.value));
  
  document.getElementById('btn-publicar-nav').onclick = () => document.getElementById('modal-publicar').style.display = 'block';
  document.getElementById('btn-filtros').onclick = () => document.getElementById('modal-filtros').style.display = 'block';
  document.querySelectorAll('.close-modal').forEach(btn => btn.onclick = () => btn.closest('.modal').style.display = 'none');

  // PUBLICAR
  document.getElementById('form-publicar').onsubmit = e => {
    e.preventDefault();
    const nuevo = {
      id: Date.now(),
      nombre: document.getElementById('prod-nombre').value,
      precio: Number(document.getElementById('prod-precio').value),
      categoria: document.getElementById('prod-categoria').value,
      descripcion: document.getElementById('prod-descripcion').value,
      ubicacion: document.getElementById('prod-ubicacion').value,
      imagen: 'https://via.placeholder.com/300',
      destacado: false,
      vistas: 0,
      likes: 0,
      whatsapp: '18090000000'
    };
    productos.unshift(nuevo);
    localStorage.setItem('mf_products', JSON.stringify(productos));
    renderizarProductos();
    document.getElementById('modal-publicar').style.display = 'none';
    alert('Producto publicado en DEMO ⚡');
  };
}

function compartirProducto(id) {
  if(navigator.share) navigator.share({title:'MARKET FLASH', url: window.location.href});
  else { navigator.clipboard.writeText(window.location.href); alert('Enlace copiado'); }
}
