// ==========================================
// SISTEMA POS GASTRONÓMICO - RENDIMIENTO DE MESERAS Y PERSONAL
// ==========================================

class WaitstaffManager {
  constructor() {
    this.currentPeriod = "hoy"; // 'hoy' | 'ayer' | 'semana' | 'mes' | 'todo'
    this.selectedDate = new Date();
    this.selectedWaiterFilter = "todos";
    this.salesChart = null;
    this.qtyChart = null;
  }

  init() {
    this.setupDatePickers();
    this.setupEventListeners();
  }

  setupDatePickers() {
    const datePicker = document.getElementById("waitstaff-date-picker");
    if (datePicker) {
      datePicker.value = this.formatDateForInput(this.selectedDate);
    }
  }

  setupEventListeners() {
    const datePicker = document.getElementById("waitstaff-date-picker");
    if (datePicker) {
      datePicker.addEventListener("change", (e) => {
        if (e.target.value) {
          this.setCustomDate(e.target.value);
        }
      });
    }

    const waiterFilter = document.getElementById("waitstaff-table-filter");
    if (waiterFilter) {
      waiterFilter.addEventListener("change", (e) => {
        this.selectedWaiterFilter = e.target.value;
        this.renderDetailTable();
      });
    }
  }

  formatDateForInput(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  setCustomDate(val) {
    if (!val) return;
    const parts = val.split("-");
    this.selectedDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
    this.currentPeriod = "custom";
    this.updatePeriodButtonsUI();
    this.refreshData();
  }

  setPeriod(period) {
    this.currentPeriod = period;
    if (period === "hoy" || period === "dia") {
      this.selectedDate = new Date();
    } else if (period === "ayer") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      this.selectedDate = yesterday;
    }
    this.updatePeriodButtonsUI();
    this.refreshData();
  }

  updatePeriodButtonsUI() {
    const periods = ["hoy", "ayer", "semana", "mes", "todo"];
    periods.forEach(p => {
      const btn = document.getElementById(`ws-period-btn-${p}`);
      if (btn) {
        if (p === this.currentPeriod) {
          btn.className = "px-2.5 py-1.5 rounded-lg font-bold bg-amber-600 text-white shadow-xs transition-all";
        } else {
          btn.className = "px-2.5 py-1.5 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-all";
        }
      }
    });

    const datePicker = document.getElementById("waitstaff-date-picker");
    if (datePicker && this.currentPeriod !== "custom") {
      datePicker.value = this.formatDateForInput(this.selectedDate);
    }
  }

  getFilteredSales() {
    const allSales = window.db.getSales();
    const sel = new Date(this.selectedDate);

    if (this.currentPeriod === "hoy" || this.currentPeriod === "dia" || this.currentPeriod === "custom") {
      const startOfDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 0, 0, 0);
      const endOfDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 23, 59, 59);

      return allSales.filter(s => {
        const d = new Date(s.date);
        return d >= startOfDay && d <= endOfDay;
      });
    } 
    else if (this.currentPeriod === "ayer") {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
      const endOfDay = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);

      return allSales.filter(s => {
        const d = new Date(s.date);
        return d >= startOfDay && d <= endOfDay;
      });
    }
    else if (this.currentPeriod === "semana") {
      const day = sel.getDay();
      const diff = sel.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(sel);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      return allSales.filter(s => {
        const d = new Date(s.date);
        return d >= startOfWeek && d <= endOfWeek;
      });
    } 
    else if (this.currentPeriod === "mes") {
      const startOfMonth = new Date(sel.getFullYear(), sel.getMonth(), 1, 0, 0, 0);
      const endOfMonth = new Date(sel.getFullYear(), sel.getMonth() + 1, 0, 23, 59, 59);

      return allSales.filter(s => {
        const d = new Date(s.date);
        return d >= startOfMonth && d <= endOfMonth;
      });
    }

    return allSales; // 'todo' | 'todos'
  }

  calculateWaitstaffStats(sales) {
    const staffList = window.db.getWaitstaff();
    const statsMap = {};

    staffList.forEach(name => {
      statsMap[name] = {
        name: name,
        totalSales: 0,
        totalItemsCount: 0,
        ordersCount: 0,
        totalTips: 0,
        avgTicket: 0
      };
    });

    sales.forEach(s => {
      const waiter = s.waiter || "Sin Asignar";
      if (!statsMap[waiter]) {
        statsMap[waiter] = {
          name: waiter,
          totalSales: 0,
          totalItemsCount: 0,
          ordersCount: 0,
          totalTips: 0,
          avgTicket: 0
        };
      }

      statsMap[waiter].totalSales += (s.total || 0);
      statsMap[waiter].totalItemsCount += (s.totalItemsCount || 0);
      statsMap[waiter].ordersCount += 1;
      statsMap[waiter].totalTips += (s.tipAmount || 0);
    });

    Object.values(statsMap).forEach(st => {
      st.avgTicket = st.ordersCount > 0 ? Math.round(st.totalSales / st.ordersCount) : 0;
    });

    return Object.values(statsMap).sort((a, b) => b.totalSales - a.totalSales);
  }

  refreshData() {
    const sales = this.getFilteredSales();
    const stats = this.calculateWaitstaffStats(sales);

    this.updatePeriodDescription();
    this.renderKPIs(stats, sales);
    this.renderWaitstaffCards(stats);
    this.renderCharts(stats);
    this.updateFilterDropdown();
    this.renderDetailTable(sales);
  }

  updatePeriodDescription() {
    const descEl = document.getElementById("ws-period-description");
    if (!descEl) return;

    const sel = this.selectedDate;
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    if (this.currentPeriod === "hoy") {
      descEl.textContent = `Rendimiento de meseras de hoy (${sel.getDate()} de ${months[sel.getMonth()]})`;
    } else if (this.currentPeriod === "ayer") {
      descEl.textContent = `Rendimiento de meseras del día de ayer`;
    } else if (this.currentPeriod === "semana") {
      descEl.textContent = `Rendimiento semanal acumulado`;
    } else if (this.currentPeriod === "mes") {
      descEl.textContent = `Rendimiento mensual de ${months[sel.getMonth()]} de ${sel.getFullYear()}`;
    } else if (this.currentPeriod === "todo") {
      descEl.textContent = `Rendimiento histórico consolidado (todas las ventas)`;
    } else {
      descEl.textContent = `Rendimiento del día ${sel.getDate()} de ${months[sel.getMonth()]} de ${sel.getFullYear()}`;
    }
  }

  renderKPIs(stats, sales) {
    const totalMoney = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalQty = sales.reduce((acc, s) => acc + (s.totalItemsCount || 0), 0);
    const totalTips = sales.reduce((acc, s) => acc + (s.tipAmount || 0), 0);
    const topSeller = stats.length > 0 && stats[0].totalSales > 0 ? stats[0] : null;

    const topSellerEl = document.getElementById("ws-kpi-top-seller");
    const totalMoneyEl = document.getElementById("ws-kpi-total-money");
    const totalQtyEl = document.getElementById("ws-kpi-total-qty");
    const totalTipsEl = document.getElementById("ws-kpi-total-tips");

    if (topSellerEl) {
      topSellerEl.textContent = topSeller ? `${topSeller.name}` : "Sin ventas aún";
    }
    if (totalMoneyEl) totalMoneyEl.textContent = window.app.formatMoney(totalMoney);
    if (totalQtyEl) totalQtyEl.textContent = `${totalQty}`;
    if (totalTipsEl) totalTipsEl.textContent = window.app.formatMoney(totalTips);
  }

  renderWaitstaffCards(stats) {
    const container = document.getElementById("waitstaff-cards-grid");
    if (!container) return;

    const maxSales = Math.max(1, ...stats.map(s => s.totalSales));

    container.innerHTML = stats.map((staff, index) => {
      const percent = Math.round((staff.totalSales / maxSales) * 100);
      const medal = index === 0 && staff.totalSales > 0 ? "🥇" : index === 1 && staff.totalSales > 0 ? "🥈" : index === 2 && staff.totalSales > 0 ? "🥉" : `#${index + 1}`;
      
      return `
        <div class="bg-white rounded-2xl p-4 sm:p-5 border border-amber-200/80 shadow-xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2.5">
                <div class="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-lg font-bold border border-amber-200 shadow-xs">
                  👩‍🍳
                </div>
                <div>
                  <h4 class="font-black text-slate-900 text-sm sm:text-base leading-tight">${staff.name}</h4>
                  <span class="text-xs font-bold text-amber-700">Mesera / Personal</span>
                </div>
              </div>
              <span class="text-lg font-black">${medal}</span>
            </div>

            <!-- Main Metrics -->
            <div class="grid grid-cols-2 gap-2 my-2.5">
              <div class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100">
                <span class="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Total Ventas ($)</span>
                <span class="text-sm sm:text-base font-black text-slate-900">${window.app.formatMoney(staff.totalSales)}</span>
              </div>
              <div class="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                <span class="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">Platos Servidos</span>
                <span class="text-sm sm:text-base font-black text-rose-900">${staff.totalItemsCount} unds</span>
              </div>
            </div>

            <!-- Secondary Metrics -->
            <div class="space-y-1 text-xs text-slate-600 pt-1">
              <div class="flex justify-between">
                <span>Comandas cobradas:</span>
                <b class="text-slate-800">${staff.ordersCount}</b>
              </div>
              <div class="flex justify-between">
                <span>Ticket promedio:</span>
                <b class="text-slate-800">${window.app.formatMoney(staff.avgTicket)}</b>
              </div>
              <div class="flex justify-between">
                <span>Propinas acumuladas:</span>
                <b class="text-emerald-700">${window.app.formatMoney(staff.totalTips)}</b>
              </div>
            </div>

            <div class="mt-2.5">
              <div class="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Participación</span>
                <span>${percent}%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
              </div>
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <button onclick="window.waitstaff.filterByWaiter('${staff.name}')" class="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1">
              <span>Ver comandas</span>
              <i class="fas fa-arrow-right text-[10px]"></i>
            </button>
          </div>
        </div>
      `;
    }).join("");
  }

  filterByWaiter(waiterName) {
    this.selectedWaiterFilter = waiterName;
    const select = document.getElementById("waitstaff-table-filter");
    if (select) select.value = waiterName;
    this.renderDetailTable();
    
    const tableSection = document.getElementById("waitstaff-detail-table-card");
    if (tableSection) {
      tableSection.scrollIntoView({ behavior: 'smooth' });
    }
  }

  updateFilterDropdown() {
    const select = document.getElementById("waitstaff-table-filter");
    if (!select) return;

    const list = window.db.getWaitstaff();
    select.innerHTML = `
      <option value="todos">Ver todas las meseras</option>
      ${list.map(name => `<option value="${name}" ${this.selectedWaiterFilter === name ? 'selected' : ''}>${name}</option>`).join("")}
    `;
  }

  renderCharts(stats) {
    const ctxSales = document.getElementById("chart-ws-sales");
    const ctxQty = document.getElementById("chart-ws-qty");

    if (this.salesChart) this.salesChart.destroy();
    if (this.qtyChart) this.qtyChart.destroy();

    const labels = stats.map(s => s.name);
    const salesData = stats.map(s => s.totalSales);
    const qtyData = stats.map(s => s.totalItemsCount);

    if (ctxSales) {
      this.salesChart = new Chart(ctxSales, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Total en Dinero ($ COP)",
            data: salesData,
            backgroundColor: "#D97706",
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` Total ventas: ${window.app.formatMoney(context.parsed.y)}`
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              ticks: {
                callback: (val) => "$" + (val >= 1000 ? (val / 1000) + "k" : val)
              }
            }
          }
        }
      });
    }

    if (ctxQty) {
      this.qtyChart = new Chart(ctxQty, {
        type: "bar",
        data: {
          labels: labels,
          datasets: [{
            label: "Platos y Bebidas Servidas (Unidades)",
            data: qtyData,
            backgroundColor: "#E11D48",
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => ` Total servido: ${context.parsed.y} unidades`
              }
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: {
              ticks: {
                callback: (val) => val + " unds"
              }
            }
          }
        }
      });
    }
  }

  renderWaitstaffTable(sales = null) {
    this.renderDetailTable(sales);
  }

  renderDetailTable(sales = null) {
    const tbody = document.getElementById("waitstaff-sales-tbody");
    if (!tbody) return;

    if (!sales) sales = this.getFilteredSales();

    let list = [...sales];

    if (this.selectedWaiterFilter !== "todos") {
      list = list.filter(s => s.waiter === this.selectedWaiterFilter);
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-12 text-center text-slate-400">
            <i class="fas fa-user-xmark text-3xl mb-2 opacity-40"></i>
            <p class="text-sm font-semibold">No hay ventas registradas para este filtro</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = list.map(sale => {
      const dateFormatted = new Date(sale.date).toLocaleString('es-CO', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
      });

      const itemsSummary = sale.items.map(i => `${i.qty}x ${i.name}`).join(", ");

      return `
        <tr class="hover:bg-amber-50/40 text-xs border-b border-amber-100/60 transition-colors">
          <td class="py-3 px-3 font-mono font-bold text-slate-600 whitespace-nowrap">${dateFormatted}</td>
          <td class="py-3 px-3">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-amber-100/80 text-amber-900 font-extrabold text-xs">
              👩‍🍳 ${sale.waiter || 'Sin asignar'}
            </span>
          </td>
          <td class="py-3 px-3 font-bold text-slate-800">${sale.tableName}</td>
          <td class="py-3 px-3">
            <div class="max-w-xs truncate text-slate-700 font-medium" title="${itemsSummary}">${itemsSummary}</div>
            <div class="text-[10px] text-rose-700 font-bold">${sale.totalItemsCount} productos</div>
          </td>
          <td class="py-3 px-3 text-slate-600 font-semibold">${window.app.formatMoney(sale.subtotal)}</td>
          <td class="py-3 px-3 text-emerald-700 font-semibold">${window.app.formatMoney(sale.tipAmount)}</td>
          <td class="py-3 px-3 font-extrabold text-slate-900 text-sm text-right whitespace-nowrap">
            ${window.app.formatMoney(sale.total)}
          </td>
        </tr>
      `;
    }).join("");
  }

  exportCSV() {
    const sales = this.getFilteredSales();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Factura,Fecha,Mesero,Mesa,Cantidad Productos,Subtotal,Propina,Total\n";

    sales.forEach(s => {
      const row = `"${s.id}","${s.date}","${s.waiter}","${s.tableName}",${s.totalItemsCount},${s.subtotal},${s.tipAmount},${s.total}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rendimiento_Meseras_${this.currentPeriod}_${this.formatDateForInput(this.selectedDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.app.showToast("Reporte de meseras exportado a CSV exitosamente", "success");
  }

  exportWaitstaffCSV() {
    this.exportCSV();
  }
}

window.waitstaff = new WaitstaffManager();
