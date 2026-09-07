// ==========================================
// SISTEMA POS GASTRONÓMICO - CONTROL DE MESAS Y POS
// ==========================================

class POSManager {
  constructor() {
    this.activeTableId = null;
    this.currentOrderItems = [];
    this.currentCategory = "todos";
    this.searchTerm = "";
    this.selectedPaymentMethod = "Efectivo";
    this.tipPercent = 10;
  }

  init() {
    this.renderTablesGrid();
    this.setupEventListeners();
  }

  setupEventListeners() {
    const productSearchInput = document.getElementById("pos-product-search");
    if (productSearchInput) {
      productSearchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderMenuCatalog();
      });
    }

    const amountReceivedInput = document.getElementById("pay-amount-received");
    if (amountReceivedInput) {
      amountReceivedInput.addEventListener("input", () => {
        this.calculateChange();
      });
    }

    window.addEventListener("resize", () => {
      const modal = document.getElementById("table-order-modal");
      if (modal && modal.classList.contains("modal-active")) {
        this.showMobileOrderTab("catalog");
      }
    });
  }

  renderTablesGrid() {
    const container = document.getElementById("tables-grid");
    if (!container) return;

    const tables = window.db.getTables();
    let occupiedCount = 0;
    let billCount = 0;
    let freeCount = 0;

    container.innerHTML = tables.map(table => {
      let statusBadge = "";
      let statusClass = `status-${table.status}`;
      let orderSummaryHtml = "";

      if (table.status === "libre") {
        freeCount++;
        statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><span class="w-2 h-2 mr-1.5 bg-emerald-500 rounded-full"></span>Libre</span>`;
        orderSummaryHtml = `
          <div class="py-4 text-center text-slate-400">
            <i class="fas fa-utensils text-2xl mb-1 opacity-40"></i>
            <p class="text-xs font-medium">Mesa disponible</p>
          </div>
        `;
      } else if (table.status === "ocupada") {
        occupiedCount++;
        const itemCount = table.order ? table.order.items.reduce((acc, i) => acc + i.qty, 0) : 0;
        const total = table.order ? table.order.total : 0;
        statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><span class="w-2 h-2 mr-1.5 bg-amber-500 rounded-full animate-ping"></span>Ocupada</span>`;
        orderSummaryHtml = `
          <div class="space-y-1.5 py-2">
            <div class="flex justify-between text-xs text-slate-600 font-medium">
              <span>${itemCount} ${itemCount === 1 ? 'producto' : 'productos'}</span>
              <span class="font-bold text-amber-900">${window.app.formatMoney(total)}</span>
            </div>
            <div class="text-[11px] text-slate-500 truncate">
              Atiende: <span class="font-semibold text-slate-700">${table.waiter || 'Mesero'}</span>
            </div>
          </div>
        `;
      } else if (table.status === "cuenta") {
        billCount++;
        const total = table.order ? table.order.total : 0;
        statusBadge = `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><span class="w-2 h-2 mr-1.5 bg-rose-500 rounded-full"></span>Pidió Cuenta</span>`;
        orderSummaryHtml = `
          <div class="space-y-1.5 py-2">
            <div class="flex justify-between text-xs text-rose-700 font-bold">
              <span>Total a cobrar:</span>
              <span class="text-sm font-extrabold">${window.app.formatMoney(total)}</span>
            </div>
            <div class="text-[11px] text-rose-600 font-medium truncate">
              ⚠️ Esperando cobro en caja
            </div>
          </div>
        `;
      }

      const isDelivery = table.location.includes("Rappi") || table.location.includes("Mostrador") || table.location.includes("Domicilio");
      const icon = isDelivery ? "fa-motorcycle" : "fa-chair";

      const isAdmin = window.app && window.app.currentRole === "admin";

      return `
        <div onclick="window.pos.openTableModal(${table.id})" 
             class="table-card ${statusClass} bg-white rounded-2xl p-4 shadow-sm border border-amber-100/80 cursor-pointer flex flex-col justify-between hover:border-amber-400 transition-all">
          <div>
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700">
                  <i class="fas ${icon}"></i>
                </div>
                <div>
                  <h4 class="font-bold text-slate-800 text-base leading-tight">${table.name}</h4>
                  <span class="text-[11px] text-slate-400 font-medium">${table.location}</span>
                </div>
              </div>
              ${statusBadge}
            </div>
            ${orderSummaryHtml}
          </div>

          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
            <span class="text-amber-700 hover:text-amber-800 flex items-center gap-1">
              <span>${table.status === 'libre' ? 'Tomar Pedido' : 'Ver / Editar Pedido'}</span>
              <i class="fas fa-arrow-right text-[10px]"></i>
            </span>
            ${(table.status !== 'libre' && isAdmin) ? `
              <button onclick="event.stopPropagation(); window.pos.openCheckoutModal(${table.id})" 
                      class="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center gap-1 transition-colors">
                <i class="fas fa-cash-register text-[10px]"></i> Cobrar
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join("");

    const freeEl = document.getElementById("stat-free-tables");
    const occupiedEl = document.getElementById("stat-occupied-tables");
    const billEl = document.getElementById("stat-bill-tables");
    if (freeEl) freeEl.textContent = freeCount;
    if (occupiedEl) occupiedEl.textContent = occupiedCount;
    if (billEl) billEl.textContent = billCount;
  }

  openTableModal(tableId) {
    this.activeTableId = tableId;
    const tables = window.db.getTables();
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    if (table.order && table.order.items) {
      this.currentOrderItems = JSON.parse(JSON.stringify(table.order.items));
      this.tipPercent = table.order.tipPercentage !== undefined ? table.order.tipPercentage : 10;
    } else {
      this.currentOrderItems = [];
      this.tipPercent = 10;
    }

    const defaultWaiter = (window.app && window.app.currentUser && window.app.currentRole === "waiter") 
      ? window.app.currentUser 
      : (table.waiter || (window.app && window.app.currentUser) || "Mesero");
    const waiterInput = document.getElementById("modal-waiter-input");
    if (waiterInput) waiterInput.value = defaultWaiter;

    const titleEl = document.getElementById("order-modal-title");
    const subtitleEl = document.getElementById("order-modal-subtitle");
    if (titleEl) titleEl.textContent = `${table.name}`;
    if (subtitleEl) subtitleEl.textContent = `${table.location} • Estado: ${table.status.toUpperCase()}`;

    // Configurar botones de acción según el rol
    const isAdmin = window.app && window.app.currentRole === "admin";
    const actionsAdmin = document.getElementById("order-actions-admin");
    const actionsWaiter = document.getElementById("order-actions-waiter");
    if (actionsAdmin && actionsWaiter) {
      if (isAdmin) {
        actionsAdmin.classList.remove("hidden");
        actionsWaiter.classList.add("hidden");
      } else {
        actionsAdmin.classList.add("hidden");
        actionsWaiter.classList.remove("hidden");
      }
    }

    this.renderCategoryPills();
    this.renderMenuCatalog();
    this.renderOrderList();
    this.showMobileOrderTab('catalog');

    const modal = document.getElementById("table-order-modal");
    if (modal) {
      modal.classList.remove("modal-hidden", "hidden");
      modal.classList.add("modal-active");
    }
    document.body.style.overflow = "hidden";
  }

  closeTableModal() {
    const modal = document.getElementById("table-order-modal");
    if (modal) {
      modal.classList.remove("modal-active");
      modal.classList.add("modal-hidden", "hidden");
    }
    document.body.style.overflow = "auto";
    this.activeTableId = null;
    this.currentOrderItems = [];
  }

  closeOrderModal() {
    this.closeTableModal();
  }

  setCategory(category) {
    this.currentCategory = category;
    this.renderCategoryPills();
    this.renderMenuCatalog();
  }

  renderCategoryPills() {
    const categories = [
      { id: "todos", label: "🌟 Todos" },
      { id: "platos-fuertes", label: "🍔 Platos Fuertes" },
      { id: "postres-dulces", label: "🍰 Postres & Dulces" },
      { id: "bebidas-calientes", label: "☕ Bebidas Calientes" },
      { id: "bebidas-frias", label: "🥤 Bebidas Frías" },
      { id: "adiciones-toppings", label: "🍨 Adiciones & Extras" }
    ];

    const container = document.getElementById("pos-category-pills");
    if (!container) return;

    container.innerHTML = categories.map(cat => `
      <button onclick="window.pos.setCategory('${cat.id}')" 
              class="px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                this.currentCategory === cat.id 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' 
                  : 'bg-amber-100/60 text-amber-900 hover:bg-amber-200/70'
              }">
        ${cat.label}
      </button>
    `).join("");
  }

  renderMenuCatalog() {
    const container = document.getElementById("pos-products-grid");
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
        <div class="col-span-full py-12 text-center text-slate-400">
          <i class="fas fa-search text-3xl mb-2 opacity-40"></i>
          <p class="text-sm font-semibold">No se encontraron productos en esta categoría</p>
        </div>
      `;
      return;
    }

    container.innerHTML = products.map(prod => `
      <div onclick="window.pos.addItemToOrder('${prod.id}')" 
           class="product-menu-item bg-white p-3 rounded-xl border border-amber-100 shadow-sm cursor-pointer flex flex-col justify-between relative group hover:border-amber-400 transition-all">
        <div>
          <div class="flex items-start justify-between mb-1.5">
            <span class="text-2xl">${prod.emoji || '🍽️'}</span>
            <span class="text-xs font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/60">
              ${window.app.formatMoney(prod.price)}
            </span>
          </div>
          <h5 class="font-bold text-slate-800 text-xs leading-snug group-hover:text-amber-700">${prod.name}</h5>
          <p class="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-tight">${prod.description || ''}</p>
        </div>
        <div class="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-700">
          <span>Agregar</span>
          <div class="w-5 h-5 rounded-full bg-amber-100 group-hover:bg-amber-600 group-hover:text-white flex items-center justify-center transition-colors">
            <i class="fas fa-plus text-[9px]"></i>
          </div>
        </div>
      </div>
    `).join("");
  }

  addItemToOrder(productId) {
    const products = window.db.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = this.currentOrderItems.findIndex(i => i.id === productId && (!i.notes || i.notes === ""));
    if (existingIndex >= 0) {
      this.currentOrderItems[existingIndex].qty += 1;
    } else {
      this.currentOrderItems.push({
        id: product.id,
        name: product.name,
        category: product.category,
        price: product.price,
        qty: 1,
        notes: "",
        emoji: product.emoji || "🍽️"
      });
    }

    window.app.playSound("pop");
    this.renderOrderList();
  }

  updateItemQty(index, delta) {
    if (!this.currentOrderItems[index]) return;
    this.currentOrderItems[index].qty += delta;
    if (this.currentOrderItems[index].qty <= 0) {
      this.currentOrderItems.splice(index, 1);
    }
    this.renderOrderList();
  }

  updateItemNote(index, note) {
    if (!this.currentOrderItems[index]) return;
    this.currentOrderItems[index].notes = note;
  }

  setTipPercent(percent) {
    this.tipPercent = percent;
    this.renderOrderList();
  }

  setTipPercentage(percent) {
    this.setTipPercent(percent);
  }

  renderOrderList() {
    const container = document.getElementById("pos-order-items-list");
    if (!container) return;

    if (this.currentOrderItems.length === 0) {
      container.innerHTML = `
        <div class="py-16 text-center text-slate-400">
          <div class="w-14 h-14 mx-auto mb-2 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 text-2xl">
            🍽️
          </div>
          <p class="font-bold text-slate-700 text-sm">Comanda vacía</p>
          <p class="text-xs text-slate-400 mt-1 max-w-[200px] mx-auto">Selecciona los platos o bebidas del catálogo para agregarlos</p>
        </div>
      `;
      this.updateOrderSummary(0, 0, 0);
      return;
    }

    container.innerHTML = this.currentOrderItems.map((item, idx) => `
      <div class="bg-amber-50/50 p-3 rounded-xl border border-amber-200/50 flex flex-col gap-2">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg">${item.emoji}</span>
            <div>
              <h6 class="font-bold text-xs text-slate-800 leading-tight">${item.name}</h6>
              <span class="text-[11px] text-amber-800 font-semibold">${window.app.formatMoney(item.price)} c/u</span>
            </div>
          </div>
          <div class="text-right">
            <span class="font-extrabold text-xs text-slate-900">${window.app.formatMoney(item.price * item.qty)}</span>
          </div>
        </div>

        <div class="flex items-center justify-between pt-1">
          <div class="flex items-center bg-white rounded-lg border border-amber-200 overflow-hidden shadow-xs">
            <button onclick="window.pos.updateItemQty(${idx}, -1)" class="w-7 h-7 flex items-center justify-center text-amber-800 hover:bg-amber-100 font-bold">
              <i class="fas fa-minus text-[10px]"></i>
            </button>
            <span class="w-8 text-center text-xs font-extrabold text-slate-800">${item.qty}</span>
            <button onclick="window.pos.updateItemQty(${idx}, 1)" class="w-7 h-7 flex items-center justify-center text-amber-800 hover:bg-amber-100 font-bold">
              <i class="fas fa-plus text-[10px]"></i>
            </button>
          </div>

          <div class="flex-1 ml-2">
            <input type="text" 
                   value="${item.notes || ''}" 
                   onchange="window.pos.updateItemNote(${idx}, this.value)" 
                   placeholder="Instrucción (ej. Sin cebolla)..." 
                   class="w-full text-[11px] px-2.5 py-1 bg-white rounded-lg border border-amber-200/70 focus:border-amber-500 focus:outline-none placeholder-slate-400">
          </div>

          <button onclick="window.pos.updateItemQty(${idx}, -${item.qty})" class="ml-1.5 text-rose-500 hover:text-rose-700 p-1.5">
            <i class="fas fa-trash-alt text-xs"></i>
          </button>
        </div>
      </div>
    `).join("");

    const subtotal = this.currentOrderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const tipAmount = Math.round(subtotal * (this.tipPercent / 100));
    const total = subtotal + tipAmount;

    this.updateOrderSummary(subtotal, tipAmount, total);
  }

  showMobileOrderTab(tab) {
    const isMobile = window.innerWidth < 768;
    const catalogCol = document.getElementById("pos-modal-catalog-col");
    const orderCol = document.getElementById("pos-modal-order-col");
    const tabBtnCatalog = document.getElementById("modal-tab-btn-catalog");
    const tabBtnOrder = document.getElementById("modal-tab-btn-order");

    if (!catalogCol || !orderCol) return;

    if (!isMobile) {
      // On desktop, ensure BOTH columns are always visible side-by-side
      catalogCol.classList.remove("hidden");
      catalogCol.style.display = "flex";
      orderCol.classList.remove("hidden");
      orderCol.style.display = "flex";
      return;
    }

    // On mobile screens (< 768px):
    if (tab === "catalog") {
      catalogCol.classList.remove("hidden");
      catalogCol.style.display = "flex";
      orderCol.classList.add("hidden");
      orderCol.style.display = "none";
      if (tabBtnCatalog) tabBtnCatalog.className = "flex-1 py-2 text-center text-xs font-black rounded-xl bg-amber-600 text-white shadow-xs";
      if (tabBtnOrder) tabBtnOrder.className = "flex-1 py-2 text-center text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100";
    } else {
      catalogCol.classList.add("hidden");
      catalogCol.style.display = "none";
      orderCol.classList.remove("hidden");
      orderCol.style.display = "flex";
      if (tabBtnOrder) tabBtnOrder.className = "flex-1 py-2 text-center text-xs font-black rounded-xl bg-amber-600 text-white shadow-xs";
      if (tabBtnCatalog) tabBtnCatalog.className = "flex-1 py-2 text-center text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100";
    }
  }

  updateOrderSummary(subtotal, tipAmount, total) {
    const subtotalEl = document.getElementById("pos-summary-subtotal");
    const tipEl = document.getElementById("pos-summary-tip");
    const totalEl = document.getElementById("pos-summary-total");

    if (subtotalEl) subtotalEl.textContent = window.app.formatMoney(subtotal);
    if (tipEl) tipEl.textContent = window.app.formatMoney(tipAmount);
    if (totalEl) totalEl.textContent = window.app.formatMoney(total);

    const mobileFloatBar = document.getElementById("pos-mobile-floating-cart");
    const mobileFloatCount = document.getElementById("pos-mobile-cart-count");
    const mobileFloatTotal = document.getElementById("pos-mobile-cart-total");

    const totalQty = this.currentOrderItems.reduce((acc, i) => acc + i.qty, 0);

    if (mobileFloatBar) {
      if (totalQty > 0 && window.innerWidth < 768) {
        mobileFloatBar.classList.remove("hidden");
        if (mobileFloatCount) mobileFloatCount.textContent = `${totalQty} ${totalQty === 1 ? 'ítem' : 'ítems'}`;
        if (mobileFloatTotal) mobileFloatTotal.textContent = window.app.formatMoney(total);
      } else {
        mobileFloatBar.classList.add("hidden");
      }
    }

    const modalTabOrderCount = document.getElementById("modal-tab-order-badge");
    if (modalTabOrderCount) {
      modalTabOrderCount.textContent = totalQty;
    }

    [0, 5, 10, 15].forEach(p => {
      const btn = document.getElementById(`tip-btn-${p}`);
      if (btn) {
        if (this.tipPercent === p) {
          btn.className = "flex-1 py-1 rounded-lg bg-amber-600 text-white shadow-xs font-bold text-xs";
        } else {
          btn.className = "flex-1 py-1 rounded-lg text-slate-600 font-bold text-xs hover:bg-slate-200";
        }
      }
    });
  }

  saveOrder(close = true) {
    this.saveOrderToTable(close);
  }

  saveOrderToTable(close = true) {
    if (!this.activeTableId) {
      window.app.showToast("No hay una mesa seleccionada", "warning");
      return;
    }

    const tables = window.db.getTables();
    const tableIndex = tables.findIndex(t => t.id === this.activeTableId);
    if (tableIndex === -1) return;

    const waiterInput = document.getElementById("modal-waiter-input");
    const waiter = waiterInput ? waiterInput.value.trim() || "Mesero" : (tables[tableIndex].waiter || "Mesero");

    if (this.currentOrderItems.length === 0) {
      tables[tableIndex].status = "libre";
      tables[tableIndex].order = null;
      tables[tableIndex].waiter = null;
      tables[tableIndex].openedAt = null;
      window.app.showToast("Mesa liberada (sin pedido)", "info");
    } else {
      const subtotal = this.currentOrderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
      const tipAmount = Math.round(subtotal * (this.tipPercent / 100));
      const total = subtotal + tipAmount;

      tables[tableIndex].status = "ocupada";
      tables[tableIndex].waiter = waiter;
      if (!tables[tableIndex].openedAt) {
        tables[tableIndex].openedAt = new Date().toISOString();
      }
      tables[tableIndex].order = {
        items: JSON.parse(JSON.stringify(this.currentOrderItems)),
        subtotal: subtotal,
        tipPercentage: this.tipPercent,
        tipAmount: tipAmount,
        tax: 0,
        total: total
      };

      window.app.showToast(`Pedido guardado en ${tables[tableIndex].name}`, "success");
      window.app.playSound("success");
    }

    window.db.saveTables(tables);
    this.renderTablesGrid();
    if (close) {
      this.closeTableModal();
    }
  }

  printBillPre() {
    this.requestBillFromModal();
  }

  requestBillFromModal() {
    if (!this.activeTableId) {
      window.app.showToast("No hay una mesa seleccionada", "warning");
      return;
    }

    if (this.currentOrderItems.length === 0) {
      window.app.showToast("Agrega productos antes de pedir la cuenta", "warning");
      return;
    }

    this.saveOrderToTable(false);
    const tables = window.db.getTables();
    const table = tables.find(t => t.id === this.activeTableId);
    if (table) {
      table.status = "cuenta";
      window.db.saveTables(tables);
      this.renderTablesGrid();
      window.app.showToast(`${table.name} marcada para cobro (pidió cuenta)`, "warning");
    }
  }

  clearTableOrder() {
    this.clearActiveTable();
  }

  clearActiveTable() {
    if (!this.activeTableId) return;
    if (!confirm("¿Estás seguro de cancelar el pedido y liberar esta mesa?")) return;

    const tables = window.db.getTables();
    const table = tables.find(t => t.id === this.activeTableId);
    if (table) {
      table.status = "libre";
      table.order = null;
      table.waiter = null;
      table.openedAt = null;
      window.db.saveTables(tables);
      this.renderTablesGrid();
      this.closeTableModal();
      window.app.showToast("Mesa liberada", "info");
    }
  }

  // ==========================================
  // MÓDULO DE COBRO Y FACTURACIÓN
  // ==========================================

  openCheckoutModal(tableId = null) {
    if (window.app && window.app.currentRole === "waiter") {
      window.app.showToast("Acceso restringido: Solo la administradora puede realizar cobros y facturación.", "warning");
      return;
    }

    const targetTableId = (tableId !== null && tableId !== undefined) ? tableId : this.activeTableId;
    if (!targetTableId) {
      window.app.showToast("No hay una mesa seleccionada para cobrar", "warning");
      return;
    }

    this.activeTableId = targetTableId;
    const tables = window.db.getTables();
    const table = tables.find(t => t.id === targetTableId);
    if (!table) return;

    // Si hay productos en la comanda actual pero no se habían guardado, guardarlos automáticamente
    if (this.currentOrderItems && this.currentOrderItems.length > 0) {
      const waiterInput = document.getElementById("modal-waiter-input");
      const waiter = (waiterInput && waiterInput.value.trim()) ? waiterInput.value.trim() : (table.waiter || "Mesero");
      const subtotal = this.currentOrderItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
      const tipAmount = Math.round(subtotal * (this.tipPercent / 100));
      const total = subtotal + tipAmount;

      table.status = "cuenta";
      table.waiter = waiter;
      if (!table.openedAt) table.openedAt = new Date().toISOString();
      table.order = {
        items: JSON.parse(JSON.stringify(this.currentOrderItems)),
        subtotal: subtotal,
        tipPercentage: this.tipPercent,
        tipAmount: tipAmount,
        tax: 0,
        total: total
      };
      window.db.saveTables(tables);
      this.renderTablesGrid();
    }

    if (!table.order || !table.order.items || table.order.items.length === 0) {
      window.app.showToast("La mesa no tiene productos para cobrar", "warning");
      return;
    }

    const order = table.order;

    // Cerrar el modal de pedido sin borrar activeTableId
    const orderModal = document.getElementById("table-order-modal");
    if (orderModal) {
      orderModal.classList.remove("modal-active");
      orderModal.classList.add("modal-hidden", "hidden");
    }

    const titleEl = document.getElementById("pay-modal-title");
    const subEl = document.getElementById("pay-modal-subtitle");
    if (titleEl) titleEl.textContent = `Cobrar Cuenta - ${table.name}`;
    if (subEl) subEl.textContent = `Atendido por: ${table.waiter || 'Mesero'} • ${order.items.length} ítems`;

    const breakdownContainer = document.getElementById("pay-order-breakdown");
    if (breakdownContainer) {
      breakdownContainer.innerHTML = order.items.map(i => `
        <div class="flex justify-between items-center text-xs py-1.5 border-b border-amber-100/60">
          <span class="text-slate-700"><b class="text-amber-800">${i.qty}x</b> ${i.name}</span>
          <span class="font-bold text-slate-800">${window.app.formatMoney(i.price * i.qty)}</span>
        </div>
      `).join("");
    }

    const subtotalEl = document.getElementById("pay-subtotal-val");
    const tipEl = document.getElementById("pay-tip-val");
    const totalEl = document.getElementById("pay-total-val");

    if (subtotalEl) subtotalEl.textContent = window.app.formatMoney(order.subtotal);
    if (tipEl) tipEl.textContent = window.app.formatMoney(order.tipAmount || 0);
    if (totalEl) totalEl.textContent = window.app.formatMoney(order.total);

    this.selectPaymentMethod("efectivo");

    const receivedInput = document.getElementById("pay-amount-received");
    if (receivedInput) {
      receivedInput.value = order.total;
    }
    this.calculateChange();

    const modal = document.getElementById("checkout-modal");
    if (modal) {
      modal.classList.remove("modal-hidden", "hidden");
      modal.classList.add("modal-active");
    }
    document.body.style.overflow = "hidden";
  }

  closeCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    if (modal) {
      modal.classList.remove("modal-active");
      modal.classList.add("modal-hidden", "hidden");
    }
    document.body.style.overflow = "auto";
  }

  setPaymentMethod(method) {
    this.selectPaymentMethod(method);
  }

  selectPaymentMethod(method) {
    const mLower = (method || "efectivo").toLowerCase();
    this.selectedPaymentMethod = mLower.charAt(0).toUpperCase() + mLower.slice(1);

    const methods = ["efectivo", "tarjeta", "transferencia"];
    
    methods.forEach(m => {
      const btn = document.getElementById(`pay-method-${m}`);
      if (btn) {
        if (m === mLower) {
          btn.className = "py-2 px-1 rounded-xl text-xs font-black bg-emerald-600 text-white shadow-sm flex flex-col items-center gap-1 transition-all";
        } else {
          btn.className = "py-2 px-1 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 flex flex-col items-center gap-1 transition-all";
        }
      }
    });

    const cashCalcBox = document.getElementById("pay-cash-calculator");
    if (cashCalcBox) {
      cashCalcBox.style.display = (mLower === "efectivo") ? "block" : "none";
    }
  }

  calculateChange() {
    const tables = window.db.getTables();
    const table = tables.find(t => t.id === this.activeTableId);
    if (!table || !table.order) return;

    const total = table.order.total;
    const receivedInput = document.getElementById("pay-amount-received");
    const changeVal = document.getElementById("pay-change-val");
    if (!receivedInput || !changeVal) return;

    const received = parseFloat(receivedInput.value) || 0;
    const change = received - total;

    if (change >= 0) {
      changeVal.textContent = window.app.formatMoney(change);
      changeVal.className = "text-sm font-extrabold text-emerald-700";
    } else {
      changeVal.textContent = `Faltan ${window.app.formatMoney(Math.abs(change))}`;
      changeVal.className = "text-xs font-bold text-rose-600";
    }
  }

  finalizePayment() {
    this.processPayment(false);
  }

  processPayment(andPrint = false) {
    const tables = window.db.getTables();
    const table = tables.find(t => t.id === this.activeTableId);
    if (!table || !table.order) {
      window.app.showToast("No se encontró el pedido de la mesa", "error");
      return;
    }

    const nameInput = document.getElementById("pay-customer-name");
    const docInput = document.getElementById("pay-customer-doc");
    const customerName = nameInput && nameInput.value.trim() ? nameInput.value.trim() : "Cliente Ocasional";
    const customerDoc = docInput && docInput.value.trim() ? docInput.value.trim() : "222222222222";

    const saleRecord = {
      id: `FAC-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      tableId: table.id,
      tableName: table.name,
      waiter: table.waiter || "Mesero General",
      items: JSON.parse(JSON.stringify(table.order.items)),
      totalItemsCount: table.order.items.reduce((acc, i) => acc + i.qty, 0),
      subtotal: table.order.subtotal,
      tipPercentage: table.order.tipPercentage || 0,
      tipAmount: table.order.tipAmount || 0,
      tax: 0,
      total: table.order.total,
      paymentMethod: this.selectedPaymentMethod,
      customerName: customerName,
      customerDoc: customerDoc
    };

    window.db.addSale(saleRecord);

    table.status = "libre";
    table.order = null;
    table.waiter = null;
    table.openedAt = null;
    window.db.saveTables(tables);

    window.app.playSound("cash");
    window.app.confetti();
    window.app.showToast(`¡Venta cobrada con éxito! ${window.app.formatMoney(saleRecord.total)}`, "success");

    this.renderTablesGrid();
    this.closeCheckoutModal();
    this.closeTableModal();

    if (window.reports) window.reports.refreshData();
    if (window.waitstaff) window.waitstaff.refreshData();
    if (window.inventory) window.inventory.renderInventoryTable();
    window.app.updateHeaderStats();

    this.showReceiptModal(saleRecord, andPrint);
  }

  showReceiptModal(saleRecord, autoPrint = false) {
    const settings = window.db.getSettings();
    const modal = document.getElementById("receipt-modal");
    const container = document.getElementById("printable-receipt");

    const formattedDate = new Date(saleRecord.date).toLocaleString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });

    container.innerHTML = `
      <div class="text-center pb-3 border-b border-dashed border-slate-400">
        <div class="w-10 h-10 mx-auto mb-1 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-lg font-bold">
          🍽️
        </div>
        <h3 class="font-extrabold text-base tracking-tight">${(settings.restaurantName || 'MI RESTAURANTE').toUpperCase()}</h3>
        <p class="text-[11px] text-slate-600">NIT: ${settings.nit || '900.123.456-7'}</p>
        <p class="text-[11px] text-slate-600">${settings.address || 'Av. Principal # 45-12'}</p>
        <p class="text-[11px] text-slate-600">Tel: ${settings.phone || '+57 (300) 123-4567'}</p>
        ${settings.social ? `<p class="text-[11px] font-semibold text-amber-800">${settings.social}</p>` : ''}
      </div>

      <div class="py-2.5 text-[11px] border-b border-dashed border-slate-400 space-y-0.5">
        <div class="flex justify-between"><span>Factura / Ticket:</span><b>${saleRecord.id}</b></div>
        <div class="flex justify-between"><span>Fecha y Hora:</span><span>${formattedDate}</span></div>
        <div class="flex justify-between"><span>Ubicación:</span><b>${saleRecord.tableName}</b></div>
        <div class="flex justify-between"><span>Atendió:</span><span>${saleRecord.waiter}</span></div>
        <div class="flex justify-between"><span>Cliente:</span><span>${saleRecord.customerName}</span></div>
        <div class="flex justify-between"><span>Doc / NIT:</span><span>${saleRecord.customerDoc}</span></div>
      </div>

      <div class="py-3 border-b border-dashed border-slate-400">
        <table class="w-full text-[11px]">
          <thead>
            <tr class="border-b border-slate-300 text-slate-500 font-bold text-left">
              <th class="pb-1">Cant</th>
              <th class="pb-1">Descripción</th>
              <th class="pb-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            ${saleRecord.items.map(item => `
              <tr>
                <td class="py-1 font-bold text-amber-900 align-top">${item.qty}x</td>
                <td class="py-1 text-slate-800 align-top">
                  <div>${item.name}</div>
                  ${item.notes ? `<div class="text-[9px] text-slate-500 italic">(${item.notes})</div>` : ''}
                </td>
                <td class="py-1 text-right font-bold text-slate-900 align-top">${window.app.formatMoney(item.price * item.qty)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="py-2.5 text-xs space-y-1 border-b border-dashed border-slate-400">
        <div class="flex justify-between text-slate-600"><span>Subtotal:</span><span>${window.app.formatMoney(saleRecord.subtotal)}</span></div>
        <div class="flex justify-between text-slate-600"><span>Propina voluntaria (${saleRecord.tipPercentage}%):</span><span>${window.app.formatMoney(saleRecord.tipAmount)}</span></div>
        <div class="flex justify-between text-slate-900 font-extrabold text-sm pt-1 border-t border-slate-200">
          <span>TOTAL A PAGAR:</span>
          <span class="text-amber-800">${window.app.formatMoney(saleRecord.total)}</span>
        </div>
        <div class="flex justify-between text-[11px] text-slate-500 pt-0.5">
          <span>Método de Pago:</span>
          <b class="text-slate-700">${saleRecord.paymentMethod}</b>
        </div>
      </div>

      <div class="pt-3 text-center text-[10px] text-slate-500 space-y-1">
        <p class="font-bold text-amber-900">¡Gracias por su visita y preferencia! ✨</p>
        <p>Software POS Gastro v2.0</p>
      </div>
    `;

    if (modal) {
      modal.classList.remove("modal-hidden", "hidden");
      modal.classList.add("modal-active");
    }

    if (autoPrint) {
      setTimeout(() => {
        window.print();
      }, 300);
    }
  }

  closeReceiptModal() {
    const modal = document.getElementById("receipt-modal");
    if (modal) {
      modal.classList.remove("modal-active");
      modal.classList.add("modal-hidden", "hidden");
    }
  }
}

window.pos = new POSManager();
