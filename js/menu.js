// ==========================================
// SISTEMA POS GASTRONÓMICO - CATÁLOGO DE PRODUCTOS
// ==========================================

class MenuManager {
  constructor() {
    this.currentCategory = "todos";
    this.editingProductId = null;
    this.searchTerm = "";
  }

  init() {
    this.renderMenuGrid();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const searchInput = document.getElementById("menu-catalog-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderMenuGrid();
      });
    }

    const catFilter = document.getElementById("menu-catalog-cat-filter");
    if (catFilter) {
      catFilter.addEventListener("change", (e) => {
        this.currentCategory = e.target.value;
        this.renderMenuGrid();
      });
    }
  }

  renderMenuGrid() {
    const container = document.getElementById("menu-items-grid");
    if (!container) return;

    let products = window.db.getProducts();

    if (this.currentCategory !== "todos") {
      products = products.filter(p => p.category === this.currentCategory);
    }

    if (this.searchTerm) {
      products = products.filter(p => 
        p.name.toLowerCase().includes(this.searchTerm) || 
        (p.description && p.description.toLowerCase().includes(this.searchTerm))
      );
    }

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-span-full py-16 text-center text-slate-400">
          <i class="fas fa-utensils text-4xl mb-2 opacity-40"></i>
          <p class="font-bold text-sm">No se encontraron productos en el catálogo</p>
        </div>
      `;
      return;
    }

    const catLabels = {
      "platos-fuertes": "Platos Fuertes",
      "postres-dulces": "Postres & Dulces",
      "bebidas-calientes": "Bebidas Calientes",
      "bebidas-frias": "Bebidas Frías",
      "adiciones-toppings": "Adiciones & Extras"
    };

    container.innerHTML = products.map(prod => `
      <div class="bg-white rounded-2xl p-4 border border-amber-100 shadow-sm flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all">
        <div>
          <div class="flex items-start justify-between mb-2">
            <span class="text-3xl">${prod.emoji || '🍽️'}</span>
            <span class="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 font-extrabold text-sm rounded-xl">
              ${window.app.formatMoney(prod.price)}
            </span>
          </div>
          <span class="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold text-[10px] uppercase tracking-wider mb-1">
            ${catLabels[prod.category] || prod.category}
          </span>
          <h4 class="font-extrabold text-slate-800 text-sm leading-tight">${prod.name}</h4>
          <p class="text-xs text-slate-500 mt-1 leading-normal line-clamp-3">${prod.description || 'Sin descripción'}</p>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <span class="text-[11px] text-slate-400 font-mono">ID: ${prod.id}</span>
          <div class="flex items-center gap-1">
            <button onclick="window.menu.openEditProductModal('${prod.id}')" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1">
              <i class="fas fa-edit text-[10px]"></i> Editar
            </button>
            <button onclick="window.menu.deleteProduct('${prod.id}')" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold">
              <i class="fas fa-trash-alt text-[10px]"></i>
            </button>
          </div>
        </div>
      </div>
    `).join("");
  }

  openProductModal(productId = null) {
    this.editingProductId = productId;
    const modal = document.getElementById("product-modal");
    const title = document.getElementById("product-modal-title");

    if (productId) {
      const products = window.db.getProducts();
      const prod = products.find(p => p.id === productId);
      if (!prod) return;

      title.textContent = "Editar Producto del Menú";
      document.getElementById("prod-form-name").value = prod.name;
      document.getElementById("prod-form-category").value = prod.category;
      document.getElementById("prod-form-price").value = prod.price;
      document.getElementById("prod-form-emoji").value = prod.emoji || "🍽️";
      document.getElementById("prod-form-desc").value = prod.description || "";
    } else {
      title.textContent = "Nuevo Producto del Menú";
      document.getElementById("prod-form-name").value = "";
      document.getElementById("prod-form-category").value = "platos-fuertes";
      document.getElementById("prod-form-price").value = "20000";
      document.getElementById("prod-form-emoji").value = "🍽️";
      document.getElementById("prod-form-desc").value = "";
    }

    modal.classList.remove("modal-hidden");
  }

  openEditProductModal(productId) {
    this.openProductModal(productId);
  }

  closeProductModal() {
    const modal = document.getElementById("product-modal");
    modal.classList.add("modal-hidden");
    this.editingProductId = null;
  }

  saveProduct() {
    const name = document.getElementById("prod-form-name").value.trim();
    const category = document.getElementById("prod-form-category").value;
    const price = parseFloat(document.getElementById("prod-form-price").value) || 0;
    const emoji = document.getElementById("prod-form-emoji").value.trim() || "🍽️";
    const description = document.getElementById("prod-form-desc").value.trim();

    if (!name || price <= 0) {
      window.app.showToast("Por favor ingresa un nombre y un precio válido", "warning");
      return;
    }

    const products = window.db.getProducts();

    if (this.editingProductId) {
      const prod = products.find(p => p.id === this.editingProductId);
      if (prod) {
        prod.name = name;
        prod.category = category;
        prod.price = price;
        prod.emoji = emoji;
        prod.description = description;
      }
      window.app.showToast("Producto actualizado", "success");
    } else {
      const newId = `prod-${Date.now().toString().slice(-4)}`;
      products.push({
        id: newId,
        name,
        category,
        price,
        cost: Math.round(price * 0.35),
        emoji,
        description,
        ingredients: [{ id: "inv-masa", qty: 1 }]
      });
      window.app.showToast("Nuevo producto agregado al menú", "success");
    }

    window.db.saveProducts(products);
    this.renderMenuGrid();
    if (window.pos) window.pos.renderMenuCatalog();
    this.closeProductModal();
  }

  deleteProduct(productId) {
    const products = window.db.getProducts();
    const prod = products.find(p => p.id === productId);
    if (!prod) return;

    if (!confirm(`¿Eliminar "${prod.name}" del menú?`)) return;

    const filtered = products.filter(p => p.id !== productId);
    window.db.saveProducts(filtered);
    this.renderMenuGrid();
    if (window.pos) window.pos.renderMenuCatalog();
    window.app.showToast("Producto eliminado del menú", "info");
  }
}

window.menu = new MenuManager();
