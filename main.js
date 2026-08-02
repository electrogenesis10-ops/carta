document.addEventListener("DOMContentLoaded", () => {
  let idiomaActual = localStorage.getItem("idioma") || "es";
  let productos = [];
  let sugerencias = [];
  let pausado = false;
  let categoriaActual = "Todos";

  const tele = document.getElementById("tele-track");
  const list = document.getElementById("product-list");
  const cats = document.getElementById("category-buttons");
  const searchInput = document.getElementById("search-input");

  function obtenerSaludoAutomatico() {
    const hora = new Date().getHours();
    if (hora >= 6 && hora < 12) return "¡Buenos días!";
    if (hora >= 12 && hora < 20) return "¡Buenas tardes!";
    return "¡Buenas noches!";
  }

  // 1. Cargar productos según idioma seleccionado
  async function cargarProductos() {
    let archivo = "productos.json";
    if (idiomaActual === "en") archivo = "productos-en.json";
    if (idiomaActual === "pt") archivo = "productos-port.json";

    try {
      const res = await fetch(`${archivo}?t=${Date.now()}`);
      if (!res.ok) throw new Error("No se pudo cargar " + archivo);
      productos = await res.json();
      if (!Array.isArray(productos)) productos = [];
    } catch (e) {
      console.warn("Fallback a productos.json...", e);
      try {
        const res2 = await fetch(`productos.json?t=${Date.now()}`);
        productos = await res2.json();
        if (!Array.isArray(productos)) productos = [];
      } catch (err) {
        productos = [];
      }
    }

    renderizarCategorias();
    renderizarProductos();
    iniciarTeleprompter();
  }

  // 2. Generar botones de categorías
  function renderizarCategorias() {
    if (!cats) return;
    cats.innerHTML = "";

    const categoriasUnicas = ["Todos", ...new Set(productos.map(p => p.categoria || p.category || "General").filter(Boolean))];

    categoriasUnicas.forEach(cat => {
      const btn = document.createElement("button");
      btn.textContent = cat;
      if (cat === categoriaActual) btn.classList.add("active-cat");
      btn.onclick = () => {
        categoriaActual = cat;
        document.querySelectorAll("#category-buttons button").forEach(b => b.classList.remove("active-cat"));
        btn.classList.add("active-cat");
        renderizarProductos();
      };
      cats.appendChild(btn);
    });
  }

  // 3. Renderizar cuadrícula de productos
  function renderizarProductos() {
    if (!list) return;
    list.innerHTML = "";

    const query = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const filtrados = productos.filter(p => {
      const nombre = (p.nombre || p.name || p.nome || "").toLowerCase();
      const desc = (p.descripcion || p.description || p.descricao || "").toLowerCase();
      const cat = p.categoria || p.category || "General";

      const coincideCategoria = (categoriaActual === "Todos" || cat === categoriaActual);
      const coincideBusqueda = !query || nombre.includes(query) || desc.includes(query);

      return coincideCategoria && coincideBusqueda;
    });

    if (filtrados.length === 0) {
      list.innerHTML = `<div style="grid-column: 1/-1; padding: 40px; color: #777;">No hay productos disponibles en esta categoría.</div>`;
      return;
    }

    filtrados.forEach(p => {
      const item = document.createElement("div");
      item.className = "item";

      const nombre = p.nombre || p.name || p.nome || "Sin nombre";
      const desc = p.descripcion || p.description || p.descricao || "";
      const precio = p.precio || p.price || p.preco || "0";
      const img = p.imagen || p.image || p.imagem || "https://via.placeholder.com/200?text=Sin+Foto";

      item.innerHTML = `
        <img src="${img}" alt="${nombre}" onerror="this.src='https://via.placeholder.com/200?text=Sin+Foto'">
        <div class="item-info">
          <h3 style="margin: 0 0 6px 0; font-size: 16px; color:#45270a;">${nombre}</h3>
          <p style="margin: 0 0 8px 0; font-size: 13px; color: #666; flex:1;">${desc}</p>
          <div style="font-weight: bold; color: #806250; font-size: 18px;">$${precio}</div>
        </div>
      `;
      list.appendChild(item);
    });
  }

  // 4. Teleprompter de Sugerencias del Mozo Digital
  function iniciarTeleprompter() {
    if (!tele) return;

    const saludo = obtenerSaludoAutomatico();
    sugerencias = [
      `${saludo} Bienvenidos a nuestra Cartilla Digital.`,
      `👨‍🍳 Consultá a nuestro mozo por los platos recomendados.`,
      ...productos.slice(0, 5).map(p => `🌟 Recomendación: ${p.nombre || p.name || p.nome} - $${p.precio || p.price || p.preco}`)
    ];

    const separador = "     ✦     ";
    const textoCompleto = sugerencias.join(separador) + separador;

    tele.textContent = textoCompleto + textoCompleto;

    tele.onclick = () => {
      pausado = !pausado;
      tele.style.animationPlayState = pausado ? "paused" : "running";
    };
  }

  // Buscador
  if (searchInput) {
    searchInput.addEventListener("input", renderizarProductos);
  }

  // Cambiar idioma
  window.cambiarIdioma = (lang) => {
    idiomaActual = lang;
    localStorage.setItem("idioma", lang);
    document.querySelectorAll(".lang-btn").forEach(b => b.classList.remove("active"));
    const activeBtn = document.getElementById(`btn-${lang}`);
    if (activeBtn) activeBtn.classList.add("active");
    cargarProductos();
  };

  cargarProductos();
});
