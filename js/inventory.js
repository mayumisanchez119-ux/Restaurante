// ==========================================
// SISTEMA POS GASTRONÓMICO - CONTROL DE INVENTARIO
// ==========================================

class InventoryManager {
  constructor() {
    this.currentCategory = "todos";
    this.currentStatusFilter = "todos";
    this.searchTerm = "";
    this.editingItemId = null;
  }

  init() {
    this.renderInventoryTable();
    this.setupEventListeners();
    this.checkStockAlerts();
  }

  setupEventListeners() {
    const searchInput = document.getElementById("inv-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.renderInventoryTable();
      });
    }

    const categorySelect = document.getElementById("inv-category-filter");
    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        this.currentCategory = e.target.value;
        this.renderInventoryTable();
      });
    }

    const statusSelect = document.getElementById("inv-status-filter");
    if (statusSelect) {
      statusSelect.addEventListener("change", (e) => {
        this.currentStatusFilter = e.target.value;
        this.renderInventoryTable();
      });
    }
  }

  checkStockAlerts() {
    const inventory = window.db.getInventory();
    const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
    const banner = document.getElementById("inv-low-stock-alert");
    const countEl = document.getElementById("inv-alert-count");
    const listEl = document.getElementById("inv-alert-items-list");

    if (!banner) return;

    if (lowStockItems.length > 0) {
      banner.classList.remove("hidden");
      if (countEl) countEl.textContent = `${lowStockItems.length} insumo(s) requieren compra urgente`;
      if (listEl) {
        listEl.innerHTML = lowStockItems.map(item => `
          <span class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            ⚠️ ${item.name}: <b>${item.currentStock} ${item.unit}</b> (Mín: ${item.minStock} ${item.unit})
          </span>
        `).join("");
      }
    } else {
      banner.classList.add("hidden");
    }
  }

  renderInventoryTable() {
    const tbody = document.getElementById("inventory-table-body");
    if (!tbody) return;

    let inventory = window.db.getInventory();

    if (this.searchTerm) {
      inventory = inventory.filter(i => 
        i.name.toLowerCase().includes(this.searchTerm) || 
        i.category.toLowerCase().includes(this.searchTerm) || 
        (i.supplier && i.supplier.toLowerCase().includes(this.searchTerm))
      );
    }

    if (this.currentCategory !== "todos") {
      inventory = inventory.filter(i => i.category === this.currentCategory);
    }

    if (this.currentStatusFilter === "bajo") {
      inventory = inventory.filter(i => i.currentStock <= i.minStock && i.currentStock > 0);
    } else if (this.currentStatusFilter === "agotado") {
      inventory = inventory.filter(i => i.currentStock <= 0);
    } else if (this.currentStatusFilter === "optimo") {
      inventory = inventory.filter(i => i.currentStock > i.minStock);
    }

    this.updateInventoryKPIs();

    if (inventory.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="9" class="py-12 text-center text-slate-400">
            <i class="fas fa-boxes text-3xl mb-2 opacity-40"></i>
            <p class="text-sm font-semibold">No se encontraron insumos que coincidan con los filtros</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = inventory.map(item => {
      let statusBadge = "";
      let stockColorClass = "text-emerald-700 font-extrabold";
      let progressPercent = Math.min(100, Math.round((item.currentStock / (item.minStock * 2.5)) * 100));

      if (item.currentStock <= 0) {
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800"><span class="w-1.5 h-1.5 mr-1 bg-rose-600 rounded-full"></span>Agotado</span>`;
        stockColorClass = "text-rose-600 font-extrabold";
      } else if (item.currentStock <= item.minStock) {
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800"><span class="w-1.5 h-1.5 mr-1 bg-amber-600 rounded-full animate-ping"></span>Stock Bajo</span>`;
        stockColorClass = "text-amber-700 font-extrabold";
      } else {
        statusBadge = `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800"><span class="w-1.5 h-1.5 mr-1 bg-emerald-600 rounded-full"></span>Óptimo</span>`;
      }

      const totalValuation = item.currentStock * (item.costPerUnit || 0);

      return `
        <tr class="hover:bg-amber-50/40 transition-colors text-xs border-b border-amber-100/60">
          <td class="py-3 px-4 font-mono font-bold text-slate-500">${item.id}</td>
          <td class="py-3 px-4">
            <div class="font-bold text-slate-800 text-sm">${item.name}</div>
            <div class="text-[11px] text-slate-400">Prov: ${item.supplier || 'Sin especificar'}</div>
          </td>
          <td class="py-3 px-4">
            <span class="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold text-[11px]">
              ${item.category}
            </span>
          </td>
          <td class="py-3 px-4">
            <div class="flex items-center gap-2">
              <span class="${stockColorClass} text-sm">${item.currentStock}</span>
              <span class="text-[11px] text-slate-500 font-medium">${item.unit}</span>
            </div>
            <div class="w-24 bg-slate-100 h-1.5 rounded-full mt-1 overflow-hidden">
              <div class="h-full ${item.currentStock <= item.minStock ? 'bg-rose-500' : 'bg-emerald-500'}" style="width: ${progressPercent}%"></div>
            </div>
          </td>
          <td class="py-3 px-4 text-slate-600 font-medium">
            ${item.minStock} ${item.unit}
          </td>
          <td class="py-3 px-4 text-slate-700 font-semibold">
            ${window.app.formatMoney(item.costPerUnit)} / ${item.unit}
          </td>
          <td class="py-3 px-4 font-bold text-slate-900">
            ${window.app.formatMoney(totalValuation)}
          </td>
          <td class="py-3 px-4">
            ${statusBadge}
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <div class="flex items-center justify-end gap-1">
              <button onclick="window.inventory.quickStockAdjust('${item.id}', -1)" title="Restar 1" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-rose-100 hover:text-rose-700 text-slate-600 flex items-center justify-center font-bold">
                <i class="fas fa-minus text-[10px]"></i>
              </button>
              <button onclick="window.inventory.quickStockAdjust('${item.id}', 1)" title="Sumar 1" class="w-7 h-7 rounded-lg bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 text-slate-600 flex items-center justify-center font-bold">
                <i class="fas fa-plus text-[10px]"></i>
              </button>
              <button onclick="window.inventory.openEditModal('${item.id}')" title="Editar Insumo" class="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-200 text-amber-800 flex items-center justify-center ml-1">
                <i class="fas fa-edit text-[11px]"></i>
              </button>
              <button onclick="window.inventory.deleteItem('${item.id}')" title="Eliminar Insumo" class="w-7 h-7 rounded-lg bg-rose-50 hover:bg-rose-200 text-rose-700 flex items-center justify-center">
                <i class="fas fa-trash text-[11px]"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join("");
  }

  updateInventoryKPIs() {
    const inventory = window.db.getInventory();
    const totalItems = inventory.length;
    const lowStock = inventory.filter(i => i.currentStock <= i.minStock && i.currentStock > 0).length;
    const outOfStock = inventory.filter(i => i.currentStock <= 0).length;
    const totalValuation = inventory.reduce((acc, i) => acc + (i.currentStock * (i.costPerUnit || 0)), 0);

    const totalEl = document.getElementById("inv-kpi-total-items");
    const lowEl = document.getElementById("inv-kpi-low-stock");
    const outEl = document.getElementById("inv-kpi-out-stock");
    const valEl = document.getElementById("inv-kpi-total-val");

    if (totalEl) totalEl.textContent = totalItems;
    if (lowEl) lowEl.textContent = lowStock;
    if (outEl) outEl.textContent = outOfStock;
    if (valEl) valEl.textContent = window.app.formatMoney(totalValuation);
  }

  quickStockAdjust(itemId, delta) {
    const inventory = window.db.getInventory();
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    item.currentStock = Math.max(0, Math.round((item.currentStock + delta) * 100) / 100);
    window.db.saveInventory(inventory);
    this.renderInventoryTable();
    this.checkStockAlerts();
    window.app.showToast(`Stock de "${item.name}" actualizado a ${item.currentStock} ${item.unit}`, "info");
  }

  openRestockModal() {
    const inventory = window.db.getInventory();
    const select = document.getElementById("restock-item-select");
    if (!select) return;

    select.innerHTML = inventory.map(i => `
      <option value="${i.id}">${i.name} (Actual: ${i.currentStock} ${i.unit})</option>
    `).join("");

    document.getElementById("restock-qty").value = "10";
    document.getElementById("restock-cost").value = "";
    document.getElementById("restock-supplier").value = "";
    document.getElementById("restock-notes").value = "";

    const modal = document.getElementById("restock-modal");
    if (modal) {
      modal.classList.remove("modal-hidden");
      modal.classList.remove("hidden");
      modal.classList.add("modal-active");
    }
  }

  closeRestockModal() {
    const modal = document.getElementById("restock-modal");
    if (modal) {
      modal.classList.remove("modal-active");
      modal.classList.add("modal-hidden");
      modal.classList.add("hidden");
    }
  }

  saveRestock() {
    const itemId = document.getElementById("restock-item-select").value;
    const qty = parseFloat(document.getElementById("restock-qty").value) || 0;
    const cost = parseFloat(document.getElementById("restock-cost").value) || 0;
    const supplier = document.getElementById("restock-supplier").value.trim();

    if (qty <= 0) {
      window.app.showToast("Ingresa una cantidad válida mayor a 0", "warning");
      return;
    }

    const inventory = window.db.getInventory();
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    item.currentStock += qty;
    if (cost > 0) {
      item.costPerUnit = Math.round(cost / qty);
    }
    if (supplier) {
      item.supplier = supplier;
    }

    window.db.saveInventory(inventory);
    this.renderInventoryTable();
    this.checkStockAlerts();
    this.closeRestockModal();

    window.app.playSound("success");
    window.app.showToast(`¡Se agregaron ${qty} ${item.unit} de ${item.name}!`, "success");
  }

  openItemModal(itemId = null) {
    this.editingItemId = itemId;
    const modal = document.getElementById("item-modal");
    const title = document.getElementById("item-modal-title");

    if (itemId) {
      const inventory = window.db.getInventory();
      const item = inventory.find(i => i.id === itemId);
      if (!item) return;

      title.textContent = "Editar Insumo";
      document.getElementById("inv-form-name").value = item.name;
      document.getElementById("inv-form-category").value = item.category;
      document.getElementById("inv-form-unit").value = item.unit;
      document.getElementById("inv-form-stock").value = item.currentStock;
      document.getElementById("inv-form-min-stock").value = item.minStock;
      document.getElementById("inv-form-cost").value = item.costPerUnit;
      document.getElementById("inv-form-supplier").value = item.supplier || "";
    } else {
      title.textContent = "Nuevo Insumo de Cocina";
      document.getElementById("inv-form-name").value = "";
      document.getElementById("inv-form-category").value = "Bases y Masas";
      document.getElementById("inv-form-unit").value = "g";
      document.getElementById("inv-form-stock").value = "100";
      document.getElementById("inv-form-min-stock").value = "30";
      document.getElementById("inv-form-cost").value = "1000";
      document.getElementById("inv-form-supplier").value = "";
    }

    if (modal) {
      modal.classList.remove("modal-hidden");
      modal.classList.remove("hidden");
      modal.classList.add("modal-active");
    }
  }

  openEditModal(itemId) {
    this.openItemModal(itemId);
  }

  closeItemModal() {
    const modal = document.getElementById("item-modal");
    if (modal) {
      modal.classList.remove("modal-active");
      modal.classList.add("modal-hidden");
      modal.classList.add("hidden");
    }
    this.editingItemId = null;
  }

  saveItem() {
    const name = document.getElementById("inv-form-name").value.trim();
    const category = document.getElementById("inv-form-category").value;
    const unit = document.getElementById("inv-form-unit").value.trim();
    const currentStock = parseFloat(document.getElementById("inv-form-stock").value) || 0;
    const minStock = parseFloat(document.getElementById("inv-form-min-stock").value) || 0;
    const costPerUnit = parseFloat(document.getElementById("inv-form-cost").value) || 0;
    const supplier = document.getElementById("inv-form-supplier").value.trim();

    if (!name) {
      window.app.showToast("El nombre del insumo es obligatorio", "warning");
      return;
    }

    const inventory = window.db.getInventory();

    if (this.editingItemId) {
      const item = inventory.find(i => i.id === this.editingItemId);
      if (item) {
        item.name = name;
        item.category = category;
        item.unit = unit;
        item.currentStock = currentStock;
        item.minStock = minStock;
        item.costPerUnit = costPerUnit;
        item.supplier = supplier;
      }
      window.app.showToast("Insumo actualizado con éxito", "success");
    } else {
      const newId = `inv-${Date.now().toString().slice(-4)}`;
      inventory.push({
        id: newId,
        name,
        category,
        unit,
        currentStock,
        minStock,
        costPerUnit,
        supplier
      });
      window.app.showToast("Nuevo insumo agregado al inventario", "success");
    }

    window.db.saveInventory(inventory);
    this.renderInventoryTable();
    this.checkStockAlerts();
    this.closeItemModal();
  }

  deleteItem(itemId) {
    const inventory = window.db.getInventory();
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    if (!confirm(`¿Estás seguro de eliminar el insumo "${item.name}"?`)) return;

    const filtered = inventory.filter(i => i.id !== itemId);
    window.db.saveInventory(filtered);
    this.renderInventoryTable();
    this.checkStockAlerts();
    window.app.showToast(`Insumo eliminado`, "info");
  }

  exportToCSV() {
    const inventory = window.db.getInventory();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Nombre,Categoria,Stock Actual,Unidad,Stock Minimo,Costo Unitario,Valoracion Total,Proveedor,Estado\n";

    inventory.forEach(item => {
      const status = item.currentStock <= 0 ? "Agotado" : item.currentStock <= item.minStock ? "Stock Bajo" : "Optimo";
      const totalVal = item.currentStock * item.costPerUnit;
      const row = `"${item.id}","${item.name}","${item.category}",${item.currentStock},"${item.unit}",${item.minStock},${item.costPerUnit},${totalVal},"${item.supplier || ''}","${status}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Inventario_GastroPOS_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.app.showToast("Inventario exportado a CSV exitosamente", "success");
  }
}

window.inventory = new InventoryManager();
