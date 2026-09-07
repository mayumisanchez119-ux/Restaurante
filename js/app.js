// ==========================================
// SISTEMA POS GASTRONÓMICO - CONTROLADOR PRINCIPAL
// ==========================================

class AppController {
  constructor() {
    this.currentView = "mesas";
    this.audioCtx = null;
    this.currentRole = null; // 'admin' | 'waiter'
    this.currentUser = null;
  }

  init() {
    this.setupNavigation();
    this.setupClock();
    this.setupAuthPortal();

    if (window.pos) window.pos.init();
    if (window.inventory) window.inventory.init();
    if (window.reports) window.reports.init();
    if (window.waitstaff) window.waitstaff.init();
    if (window.menu) window.menu.init();

    this.checkAuth();
  }

  // ==========================================
  // AUTENTICACIÓN Y CONTROL DE ROLES
  // ==========================================
  setupAuthPortal() {
    // Escuchar toggle entre Modo Mesero y Modo Admin en el Login
    const tabWaiter = document.getElementById("login-tab-waiter");
    const tabAdmin = document.getElementById("login-tab-admin");
    const formWaiter = document.getElementById("login-form-waiter");
    const formAdmin = document.getElementById("login-form-admin");

    if (tabWaiter && tabAdmin && formWaiter && formAdmin) {
      tabWaiter.addEventListener("click", () => {
        tabWaiter.className = "flex-1 py-3 text-center text-xs font-black rounded-xl bg-amber-600 text-white shadow-md transition-all";
        tabAdmin.className = "flex-1 py-3 text-center text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition-all";
        formWaiter.classList.remove("hidden");
        formAdmin.classList.add("hidden");
      });

      tabAdmin.addEventListener("click", () => {
        tabAdmin.className = "flex-1 py-3 text-center text-xs font-black rounded-xl bg-slate-900 text-white shadow-md transition-all";
        tabWaiter.className = "flex-1 py-3 text-center text-xs font-bold rounded-xl text-slate-600 hover:bg-slate-100 transition-all";
        formAdmin.classList.remove("hidden");
        formWaiter.classList.add("hidden");
      });
    }

    this.renderWaitstaffChips();
  }

  renderWaitstaffChips() {
    const container = document.getElementById("login-waitstaff-chips");
    if (!container) return;

    const list = window.db.getWaitstaffList();
    container.innerHTML = list.map(staff => `
      <button type="button" onclick="window.app.selectQuickWaiter('${staff.username || staff.name}')" 
              class="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-colors">
        <i class="fas fa-user text-[10px] text-amber-600"></i>
        <span>${staff.name}</span>
        <span class="text-[10px] text-amber-700/70 font-mono">@${staff.username}</span>
      </button>
    `).join("");
  }

  selectQuickWaiter(nameOrUser) {
    const input = document.getElementById("login-waiter-name");
    if (input) {
      input.value = nameOrUser;
      this.loginAsWaiter();
    }
  }

  checkAuth() {
    const session = window.db.getSession();
    const portal = document.getElementById("portal-login");
    const appWrapper = document.getElementById("main-app-wrapper");

    if (!session) {
      this.currentRole = null;
      this.currentUser = null;
      if (portal) {
        portal.classList.remove("hidden");
        portal.classList.remove("modal-hidden");
        portal.classList.add("flex");
      }
      if (appWrapper) {
        appWrapper.classList.add("hidden");
      }
      this.renderWaitstaffChips();
      return false;
    }

    this.currentRole = session.role;
    this.currentUser = session.name;

    if (portal) {
      portal.classList.add("hidden");
      portal.classList.add("modal-hidden");
      portal.classList.remove("flex");
    }
    if (appWrapper) {
      appWrapper.classList.remove("hidden");
      appWrapper.classList.add("flex");
    }

    this.applyRolePermissions(session.role, session.name);
    this.updateHeaderBrand();
    this.updateHeaderStats();
    this.navigateTo("mesas");
    return true;
  }

  loginAsWaiter() {
    const input = document.getElementById("login-waiter-name");
    const term = input ? input.value.trim() : "";

    if (!term) {
      this.showToast("Por favor ingresa tu nombre o usuario de mesero(a)", "warning");
      return;
    }

    const matched = window.db.findWaitstaffByLogin(term);
    const waiterName = matched ? matched.name : term;
    const waiterUsername = matched ? matched.username : term.toLowerCase().replace(/[^a-z0-9]/g, "");

    if (!matched) {
      window.db.addOrUpdateWaitstaff({
        name: waiterName,
        username: waiterUsername,
        role: "Mesero(a)",
        active: true
      });
    }

    const session = {
      role: "waiter",
      name: waiterName,
      username: waiterUsername,
      loggedAt: new Date().toISOString()
    };

    window.db.saveSession(session, true);
    this.playSound("success");
    this.showToast(`¡Bienvenida(o), ${waiterName}! Turno de mesera iniciado.`, "success");
    this.checkAuth();
  }

  loginAsAdmin() {
    const userInput = document.getElementById("login-admin-user");
    const passInput = document.getElementById("login-admin-pass");

    const username = userInput ? userInput.value.trim() : "";
    const password = passInput ? passInput.value.trim() : "";

    const settings = window.db.getSettings();
    const validUser = settings.adminUser || "admin";
    const validPass = settings.adminPass || "admin123";

    if (username === validUser && password === validPass) {
      const session = {
        role: "admin",
        name: "Administrador / Gerencia",
        loggedAt: new Date().toISOString()
      };

      window.db.saveSession(session, true);
      this.playSound("success");
      this.showToast("¡Acceso Administrativo Exitoso! Todas las funciones habilitadas.", "success");
      this.checkAuth();
    } else {
      this.playSound("click");
      this.showToast("Usuario o contraseña de administrador incorrectos", "error");
    }
  }

  logout() {
    if (confirm("¿Deseas cerrar tu sesión o turno de trabajo?")) {
      window.db.clearSession();
      this.showToast("Sesión cerrada. Turno finalizado.", "info");
      this.checkAuth();
    }
  }

  applyRolePermissions(role, name) {
    // 1. Actualizar Badge de usuario en el Header
    const userBadge = document.getElementById("header-user-badge");
    if (userBadge) {
      if (role === "waiter") {
        userBadge.innerHTML = `
          <div class="flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 rounded-xl">
            <div class="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
              👩‍🍳
            </div>
            <div class="text-left">
              <span class="block text-[10px] font-bold text-slate-400 uppercase leading-none">Mesero(a)</span>
              <span class="block text-xs font-black text-amber-900 leading-tight">${name}</span>
            </div>
            <button onclick="window.app.logout()" title="Cambiar de mesero o cerrar turno" class="ml-1 px-2 py-1 bg-amber-200/60 hover:bg-amber-300 text-amber-900 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors">
              <i class="fas fa-arrow-right-from-bracket"></i> Salir
            </button>
          </div>
        `;
      } else {
        userBadge.innerHTML = `
          <div class="flex items-center gap-2 bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-white">
            <div class="w-7 h-7 rounded-lg bg-amber-500 text-slate-900 flex items-center justify-center text-xs font-black shadow-xs">
              🛡️
            </div>
            <div class="text-left">
              <span class="block text-[10px] font-bold text-amber-400 uppercase leading-none">Rol Total</span>
              <span class="block text-xs font-black text-white leading-tight">Administrador</span>
            </div>
            <button onclick="window.app.logout()" title="Cerrar sesión administrativa" class="ml-1 px-2 py-1 bg-slate-800 hover:bg-rose-900 text-slate-200 hover:text-white rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition-colors">
              <i class="fas fa-power-off"></i> Salir
            </button>
          </div>
        `;
      }
    }

    // 2. Control de visibilidad de pestañas de navegación
    const adminTabs = document.querySelectorAll(".admin-only-tab");
    adminTabs.forEach(tab => {
      if (role === "waiter") {
        tab.classList.add("hidden");
      } else {
        tab.classList.remove("hidden");
      }
    });

    // 3. Banner informativo en la vista de mesas
    const waiterBanner = document.getElementById("mesas-waiter-banner");
    const waiterBannerName = document.getElementById("mesas-waiter-name");
    if (waiterBanner) {
      if (role === "waiter") {
        waiterBanner.classList.remove("hidden");
        if (waiterBannerName) waiterBannerName.textContent = name;
      } else {
        waiterBanner.classList.add("hidden");
      }
    }
  }

  // ==========================================
  // NAVEGACIÓN Y VISTAS
  // ==========================================
  setupNavigation() {
    const navButtons = document.querySelectorAll("[data-nav-target]");
    navButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-nav-target");
        this.navigateTo(target);
      });
    });
  }

  navigateTo(viewId) {
    if (this.currentRole === "waiter" && viewId !== "mesas") {
      this.showToast("Acceso restringido solo para administradores", "warning");
      return;
    }

    this.currentView = viewId;

    document.querySelectorAll(".nav-tab").forEach(tab => {
      if (tab.getAttribute("data-nav-target") === viewId) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    document.querySelectorAll(".bottom-nav-btn").forEach(btn => {
      if (btn.getAttribute("data-nav-target") === viewId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });

    const views = ["mesas", "inventario", "reportes", "meseras", "menu", "configuracion"];
    views.forEach(v => {
      const section = document.getElementById(`view-${v}`);
      if (section) {
        if (v === viewId) {
          section.classList.remove("hidden");
        } else {
          section.classList.add("hidden");
        }
      }
    });

    if (viewId === "reportes" && window.reports) {
      setTimeout(() => {
        window.reports.refreshData();
      }, 50);
    }

    if (viewId === "meseras" && window.waitstaff) {
      setTimeout(() => {
        window.waitstaff.refreshData();
      }, 50);
    }

    if (viewId === "inventario" && window.inventory) {
      window.inventory.renderInventoryTable();
    }

    if (viewId === "mesas" && window.pos) {
      window.pos.renderTablesGrid();
    }

    if (viewId === "menu" && window.menu) {
      window.menu.renderMenuGrid();
    }

    if (viewId === "configuracion") {
      this.renderSettingsForm();
    }

    this.updateHeaderStats();
    this.playSound("click");
  }

  setupClock() {
    const updateTime = () => {
      const timeEl = document.getElementById("header-live-time");
      const dateEl = document.getElementById("header-live-date");
      const now = new Date();

      if (timeEl) {
        timeEl.textContent = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
      }
      if (dateEl) {
        dateEl.textContent = now.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' });
      }
    };

    updateTime();
    setInterval(updateTime, 1000);
  }

  updateHeaderBrand() {
    const settings = window.db.getSettings();
    const brandNameEl = document.getElementById("header-brand-title");
    const brandSubEl = document.getElementById("header-brand-subtitle");

    if (brandNameEl) {
      brandNameEl.textContent = settings.restaurantName || "Mi Restaurante";
    }
    if (brandSubEl) {
      brandSubEl.textContent = settings.social || "@mirestaurante";
    }
  }

  updateHeaderStats() {
    const todaySales = this.getTodaySalesTotal();
    const todaySalesEl = document.getElementById("header-today-sales");
    if (todaySalesEl) {
      todaySalesEl.textContent = this.formatMoney(todaySales);
    }

    const tables = window.db.getTables();
    const occupiedCount = tables.filter(t => t.status !== "libre").length;
    const headerActiveTables = document.getElementById("header-active-tables");
    if (headerActiveTables) {
      headerActiveTables.textContent = `${occupiedCount}/${tables.length}`;
    }

    const inventory = window.db.getInventory();
    const lowStockCount = inventory.filter(i => i.currentStock <= i.minStock).length;
    const headerLowStock = document.getElementById("header-low-stock-badge");
    if (headerLowStock) {
      if (lowStockCount > 0 && this.currentRole === "admin") {
        headerLowStock.textContent = `${lowStockCount} alertas`;
        headerLowStock.classList.remove("hidden");
      } else {
        headerLowStock.classList.add("hidden");
      }
    }
  }

  getTodaySalesTotal() {
    const sales = window.db.getSales();
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

    return sales
      .filter(s => new Date(s.date) >= startOfDay)
      .reduce((acc, s) => acc + (s.total || 0), 0);
  }

  formatMoney(amount) {
    if (isNaN(amount) || amount === null || amount === undefined) amount = 0;
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  playSound(type) {
    try {
      const settings = window.db.getSettings();
      if (settings.enableSound === false) return;

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      if (!this.audioCtx) {
        this.audioCtx = new AudioContext();
      }

      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const now = this.audioCtx.currentTime;

      if (type === "click") {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "pop") {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(450, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === "success") {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + (i * 0.07));
          gain.gain.setValueAtTime(0.15, now + (i * 0.07));
          gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.07) + 0.2);
          osc.start(now + (i * 0.07));
          osc.stop(now + (i * 0.07) + 0.2);
        });
      } else if (type === "cash") {
        [987.77, 1318.51, 1567.98].forEach((freq, i) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + (i * 0.08));
          gain.gain.setValueAtTime(0.2, now + (i * 0.08));
          gain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.08) + 0.4);
          osc.start(now + (i * 0.08));
          osc.stop(now + (i * 0.08) + 0.4);
        });
      }
    } catch (e) {}
  }

  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let icon = "fa-info-circle";
    if (type === "success") icon = "fa-check-circle";
    if (type === "warning") icon = "fa-exclamation-triangle";
    if (type === "error") icon = "fa-times-circle";

    toast.innerHTML = `
      <i class="fas ${icon} text-base"></i>
      <span class="flex-1">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(-10px)";
      setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 300);
    }, 3500);
  }

  confetti() {
    if (typeof confetti === 'function') {
      confetti({
        particleCount: 75,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#F59E0B', '#E11D48', '#10B981', '#FDE68A', '#78350F']
      });
    }
  }

  // ==========================================
  // GESTIÓN DE AJUSTES DEL NEGOCIO
  // ==========================================
  renderSettingsForm() {
    const settings = window.db.getSettings();

    const nameEl = document.getElementById("setting-name");
    const nitEl = document.getElementById("setting-nit");
    const addressEl = document.getElementById("setting-address");
    const phoneEl = document.getElementById("setting-phone");
    const socialEl = document.getElementById("setting-social");
    const tipEl = document.getElementById("setting-tip");

    const adminUserEl = document.getElementById("setting-admin-user");
    const adminPassEl = document.getElementById("setting-admin-pass");

    if (nameEl) nameEl.value = settings.restaurantName || "Mi Restaurante & Café";
    if (nitEl) nitEl.value = settings.nit || "900.123.456-7";
    if (addressEl) addressEl.value = settings.address || "Av. Principal # 45-12";
    if (phoneEl) phoneEl.value = settings.phone || "+57 (300) 123-4567";
    if (socialEl) socialEl.value = settings.social || "@mirestaurante";
    if (tipEl) tipEl.value = settings.defaultTip !== undefined ? settings.defaultTip : 10;

    if (adminUserEl) adminUserEl.value = settings.adminUser || "admin";
    if (adminPassEl) adminPassEl.value = settings.adminPass || "admin123";

    this.renderSettingsWaitstaffTable();
  }

  // ==========================================
  // GESTIÓN DE MESEROS DESDE AJUSTES
  // ==========================================
  renderSettingsWaitstaffTable() {
    const tbody = document.getElementById("settings-waitstaff-tbody");
    if (!tbody) return;

    const list = window.db.getWaitstaffList();

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="py-8 text-center text-slate-400 text-xs">
            No hay meseros registrados. Agrega uno con el botón superior.
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(staff => `
      <tr class="hover:bg-amber-50/40 text-xs border-b border-amber-100/60 transition-colors">
        <td class="py-3 px-4">
          <div class="flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shadow-xs">
              👩‍🍳
            </div>
            <div>
              <span class="font-extrabold text-slate-900 block">${staff.name}</span>
              <span class="text-[10px] text-slate-400 font-mono">ID: ${staff.id}</span>
            </div>
          </div>
        </td>
        <td class="py-3 px-4">
          <span class="font-mono font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
            @${staff.username || 'sin_usuario'}
          </span>
        </td>
        <td class="py-3 px-4 font-semibold text-slate-600">
          ${staff.role || 'Mesero(a)'}
        </td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
            <span class="w-1.5 h-1.5 mr-1 bg-emerald-500 rounded-full"></span> Activo
          </span>
        </td>
        <td class="py-3 px-4 text-right whitespace-nowrap">
          <button onclick="window.app.openEditWaitstaffModal('${staff.id}')" title="Editar Mesero" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold rounded-lg border border-amber-200 text-xs mr-1">
            <i class="fas fa-edit text-[10px]"></i> Editar
          </button>
          <button onclick="window.app.deleteWaitstaffFromSettings('${staff.id}')" title="Eliminar Mesero" class="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg text-xs">
            <i class="fas fa-trash-alt text-[10px]"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  openEditWaitstaffModal(id = null) {
    const modal = document.getElementById("staff-manager-modal");
    const title = document.getElementById("staff-modal-title");
    if (!modal) return;

    if (id) {
      const list = window.db.getWaitstaffList();
      const staff = list.find(w => w.id === id);
      if (!staff) return;

      title.textContent = "Editar Mesero(a) / Personal";
      document.getElementById("staff-modal-id").value = staff.id;
      document.getElementById("staff-modal-name").value = staff.name;
      document.getElementById("staff-modal-username").value = staff.username || "";
      document.getElementById("staff-modal-role").value = staff.role || "Mesera de Salón";
    } else {
      title.textContent = "Registrar Nuevo Mesero(a)";
      document.getElementById("staff-modal-id").value = "";
      document.getElementById("staff-modal-name").value = "";
      document.getElementById("staff-modal-username").value = "";
      document.getElementById("staff-modal-role").value = "Mesero(a) de Salón";
    }

    modal.classList.remove("modal-hidden");
    modal.classList.remove("hidden");
    modal.classList.add("modal-active");
  }

  closeEditWaitstaffModal() {
    const modal = document.getElementById("staff-manager-modal");
    if (modal) {
      modal.classList.remove("modal-active");
      modal.classList.add("modal-hidden");
      modal.classList.add("hidden");
    }
  }

  openStaffModal(id = null) {
    this.openEditWaitstaffModal(id);
  }

  closeStaffModal() {
    this.closeEditWaitstaffModal();
  }

  saveStaffMember() {
    this.saveWaitstaffFromSettings();
  }

  saveWaitstaffFromSettings() {
    const id = document.getElementById("staff-modal-id").value;
    const name = document.getElementById("staff-modal-name").value.trim();
    let username = document.getElementById("staff-modal-username").value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const role = document.getElementById("staff-modal-role").value.trim() || "Mesero(a)";

    if (!name) {
      this.showToast("El nombre del mesero(a) es obligatorio", "warning");
      return;
    }

    if (!username) {
      username = name.toLowerCase().replace(/[^a-z0-9]/g, "");
    }

    window.db.addOrUpdateWaitstaff({
      id: id || undefined,
      name: name,
      username: username,
      role: role,
      active: true
    });

    this.showToast(id ? `Mesero(a) "${name}" actualizado con éxito` : `Mesero(a) "${name}" registrado con éxito`, "success");
    this.renderSettingsWaitstaffTable();
    this.renderWaitstaffChips();
    if (window.waitstaff) window.waitstaff.refreshData();
    this.closeEditWaitstaffModal();
  }

  deleteWaitstaffFromSettings(id) {
    const list = window.db.getWaitstaffList();
    const staff = list.find(w => w.id === id);
    if (!staff) return;

    if (confirm(`¿Estás seguro de eliminar a "${staff.name}" del personal?`)) {
      window.db.deleteWaitstaff(id);
      this.showToast(`"${staff.name}" eliminado del personal`, "info");
      this.renderSettingsWaitstaffTable();
      this.renderWaitstaffChips();
      if (window.waitstaff) window.waitstaff.refreshData();
    }
  }

  saveSettingsForm() {
    const name = document.getElementById("setting-name").value.trim() || "Mi Restaurante";
    const nit = document.getElementById("setting-nit").value.trim() || "900.123.456-7";
    const address = document.getElementById("setting-address").value.trim() || "Av. Principal # 45-12";
    const phone = document.getElementById("setting-phone").value.trim() || "+57 (300) 123-4567";
    const social = document.getElementById("setting-social").value.trim() || "@mirestaurante";
    const defaultTip = parseFloat(document.getElementById("setting-tip").value) || 10;

    const adminUser = document.getElementById("setting-admin-user").value.trim() || "admin";
    const adminPass = document.getElementById("setting-admin-pass").value.trim() || "admin123";

    const settings = window.db.getSettings();
    settings.restaurantName = name;
    settings.nit = nit;
    settings.address = address;
    settings.phone = phone;
    settings.social = social;
    settings.defaultTip = defaultTip;
    settings.adminUser = adminUser;
    settings.adminPass = adminPass;

    window.db.saveSettings(settings);
    this.updateHeaderBrand();
    this.showToast("¡Ajustes y clave del establecimiento guardados con éxito!", "success");
    this.playSound("success");
  }

  resetAllData() {
    if (confirm("¿Estás seguro de restablecer todos los datos del sistema a los valores de demostración iniciales?")) {
      window.db.resetToDefaults();
      this.showToast("Sistema restablecido con éxito", "success");
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
  }

  exportBackup() {
    const data = {
      products: window.db.getProducts(),
      inventory: window.db.getInventory(),
      tables: window.db.getTables(),
      sales: window.db.getSales(),
      settings: window.db.getSettings(),
      waitstaff: window.db.getWaitstaff(),
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Respaldo_GastroPOS_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    this.showToast("Respaldo JSON descargado", "success");
  }

  importBackup(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.products) window.db.saveProducts(data.products);
        if (data.inventory) window.db.saveInventory(data.inventory);
        if (data.tables) window.db.saveTables(data.tables);
        if (data.sales) window.db.saveSales(data.sales);
        if (data.settings) window.db.saveSettings(data.settings);
        if (data.waitstaff) localStorage.setItem("wddm_waitstaff", JSON.stringify(data.waitstaff));

        this.showToast("Respaldo importado exitosamente", "success");
        setTimeout(() => window.location.reload(), 600);
      } catch (err) {
        this.showToast("Error al procesar el archivo JSON de respaldo", "error");
      }
    };
    reader.readAsText(file);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.app = new AppController();
  window.app.init();
});
