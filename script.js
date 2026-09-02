// ==========================================
// MARKET FLASH
// script.js
// Registro e inicio de sesión
// ==========================================

document.addEventListener("DOMContentLoaded", () => {

  const registerForm = document.getElementById("registerForm");
  const showLoginButton = document.getElementById("showLogin");

  // ------------------------------------------
  // REGISTRO
  // ------------------------------------------

  if (registerForm) {
    registerForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const nombre = document.getElementById("nombre").value.trim();
      const apellido = document.getElementById("apellido").value.trim();
      const apodo = document.getElementById("apodo").value.trim();
      const cedula = document.getElementById("cedula").value.trim();
      const direccion = document.getElementById("direccion").value.trim();
      const telefono = document.getElementById("telefono").value.trim();
      const correo = document.getElementById("correo").value.trim();
      const password = document.getElementById("password").value;
      const confirmPassword =
        document.getElementById("confirmPassword").value;
      const terms = document.getElementById("terms").checked;

      // Comprobar campos principales
      if (
        !nombre ||
        !apellido ||
        !apodo ||
        !cedula ||
        !direccion ||
        !password ||
        !confirmPassword
      ) {
        alert("Completa todos los campos obligatorios.");
        return;
      }

      // Confirmar contraseña
      if (password !== confirmPassword) {
        alert("Las contraseñas no coinciden.");
        return;
      }

      // Términos
      if (!terms) {
        alert("Debes aceptar los términos y condiciones.");
        return;
      }

      // Comprobar si ya existe una cuenta con esa cédula
      const usuarios =
        JSON.parse(localStorage.getItem("marketFlashUsuarios")) || [];

      const usuarioExistente = usuarios.find(
        (usuario) => usuario.cedula === cedula
      );

      if (usuarioExistente) {
        alert("Ya existe una cuenta registrada con esa cédula.");
        return;
      }

      // Crear usuario
      const nuevoUsuario = {
        id: Date.now(),
        nombre,
        apellido,
        apodo,
        cedula,
        direccion,
        telefono,
        correo,
        password
      };

      // Guardar usuario
      usuarios.push(nuevoUsuario);

      localStorage.setItem(
        "marketFlashUsuarios",
        JSON.stringify(usuarios)
      );

      // Guardar sesión
      localStorage.setItem(
        "marketFlashSesion",
        JSON.stringify(nuevoUsuario)
      );

      alert("¡Cuenta creada correctamente! Bienvenido a Market Flash.");

      registerForm.reset();

      console.log("Usuario registrado:", nuevoUsuario);
    });
  }

  // ------------------------------------------
  // BOTÓN INICIAR SESIÓN
  // ------------------------------------------

  if (showLoginButton) {
    showLoginButton.addEventListener("click", () => {

      const cedula = prompt("Introduce tu número de cédula:");

      if (!cedula) {
        return;
      }

      const password = prompt("Introduce tu contraseña:");

      if (!password) {
        return;
      }

      const usuarios =
        JSON.parse(localStorage.getItem("marketFlashUsuarios")) || [];

      const usuario = usuarios.find(
        (item) =>
          item.cedula === cedula &&
          item.password === password
      );

      if (!usuario) {
        alert("Cédula o contraseña incorrecta.");
        return;
      }

      // Guardar sesión
      localStorage.setItem(
        "marketFlashSesion",
        JSON.stringify(usuario)
      );

      alert(
        `¡Bienvenido, ${usuario.apodo}! ⚡\nHas iniciado sesión en Market Flash.`
      );

      console.log("Sesión iniciada:", usuario);
    });
  }

});
