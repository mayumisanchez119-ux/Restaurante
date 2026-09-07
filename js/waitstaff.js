// ==========================================
// SISTEMA POS GASTRONÓMICO - RENDIMIENTO DE MESERAS Y PERSONAL
// ==========================================

class WaitstaffManager {
  constructor() {
    this.currentPeriod = "dia"; // 'dia' | 'semana' | 'mes' | 'todos'
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
          const parts = e.target.value.split("-");
          this.selectedDate = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
          this.refreshData();
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

  setPeriod(period) {
    this.currentPeriod = period;

    ["dia", "semana", "mes", "todos"].forEach(p => {
      const btn = document.getElementById(`ws-period-btn-${p}`);
      if (btn) {
        if (p === period) {
          btn.className = "px-4 py-2 text-xs font-bold rounded-xl bg-amber-600 text-white shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all";
        } else {
          btn.className = "px-4 py-2 text-xs font-bold rounded-xl bg-white text-slate-700 hover:bg-amber-50 border border-slate-200 flex items-center gap-1.5 transition-all";
        }
      }
    });

    this.refreshData();
  }

  getFilteredSales() {
    const allSales = window.db.getSales();
    const sel = new Date(this.selectedDate);

    if (this.currentPeriod === "dia") {
      const startOfDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 0, 0, 0);
      const endOfDay = new Date(sel.getFullYear(), sel.getMonth(), sel.getDate(), 23, 59, 59);

      return allSales.filter(s => {
        const d = new Date(s.date);
        return d >= startOfDay && d <= endOfDay;
      });
    } 
    else if (this.currentPeriod === "semana") {
      const day = sel.getDay();
      const diff = sel.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(sel.setDate(diff));
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

    return allSales;
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

    if (this.currentPeriod === "dia") {
      descEl.textContent = `Rendimiento del día ${sel.getDate()} de ${months[sel.getMonth()]} de ${sel.getFullYear()}`;
    } else if (this.currentPeriod === "semana") {
      descEl.textContent = `Rendimiento de la semana del ${sel.getDate()} de ${months[sel.getMonth()]}`;
    } else if (this.currentPeriod === "mes") {
      descEl.textContent = `Rendimiento mensual de ${months[sel.getMonth()]} de ${sel.getFullYear()}`;
    } else {
      descEl.textContent = `Rendimiento histórico acumulado de todas las ventas`;
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
      topSellerEl.textContent = topSeller ? `${topSeller.name} (${window.app.formatMoney(topSeller.totalSales)})` : "Sin ventas aún";
    }
    if (totalMoneyEl) totalMoneyEl.textContent = window.app.formatMoney(totalMoney);
    if (totalQtyEl) totalQtyEl.textContent = `${totalQty} platos/bebidas`;
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
        <div class="bg-white rounded-2xl p-5 border border-amber-200/80 shadow-xs flex flex-col justify-between hover:border-amber-400 hover:shadow-md transition-all">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl font-bold border border-amber-200 shadow-xs">
                  👩‍🍳
                </div>
                <div>
                  <h4 class="font-black text-slate-900 text-base leading-tight">${staff.name}</h4>
                  <span class="text-xs font-bold text-amber-700">Mesera / Personal</span>
                </div>
              </div>
              <span class="text-xl font-black">${medal}</span>
            </div>

            <!-- Main Metrics -->
            <div class="grid grid-cols-2 gap-2 my-3">
              <div class="p-3 rounded-xl bg-amber-50/70 border border-amber-100">
                <span class="text-[10px] font-bold text-amber-900 uppercase tracking-wider block">Dinero Atendido ($)</span>
                <span class="text-base font-black text-slate-900">${window.app.formatMoney(staff.totalSales)}</span>
              </div>
              <div class="p-3 rounded-xl bg-rose-50/70 border border-rose-100">
                <span class="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">Platos / Unidades</span>
                <span class="text-base font-black text-rose-900">${staff.totalItemsCount} unds</span>
              </div>
            </div>

            <!-- Secondary Metrics -->
            <div class="space-y-1.5 text-xs text-slate-600 pt-1">
              <div class="flex justify-between">
                <span>Cuentas / Mesas atendidas:</span>
                <b class="text-slate-800">${staff.ordersCount} mesas</b>
              </div>
              <div class="flex justify-between">
                <span>Ticket promedio por mesa:</span>
                <b class="text-slate-800">${window.app.formatMoney(staff.avgTicket)}</b>
              </div>
              <div class="flex justify-between">
                <span>Propinas generadas:</span>
                <b class="text-emerald-700">${window.app.formatMoney(staff.totalTips)}</b>
              </div>
            </div>

            <div class="mt-3">
              <div class="flex justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Participación en ventas</span>
                <span>${percent}%</span>
              </div>
              <div class="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div class="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
              </div>
            </div>
          </div>

          <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <button onclick="window.waitstaff.filterByWaiter('${staff.name}')" class="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1">
              <span>Ver pedidos detallados</span>
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
    
    // Smooth scroll down to table
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
      <option value="todos">Todos los meseros(as)</option>
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
          <td class="py-3 px-4 font-mono font-bold text-amber-900">${sale.id}</td>
          <td class="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">${dateFormatted}</td>
          <td class="py-3 px-4">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-100/80 text-amber-900 font-extrabold text-xs">
              <i class="fas fa-user-tie text-[10px]"></i> ${sale.waiter || 'Sin asignar'}
            </span>
          </td>
          <td class="py-3 px-4 font-bold text-slate-800">${sale.tableName}</td>
          <td class="py-3 px-4">
            <div class="max-w-xs truncate text-slate-700 font-medium" title="${itemsSummary}">${itemsSummary}</div>
            <div class="text-[10px] text-rose-700 font-bold">${sale.totalItemsCount} productos servidos</div>
          </td>
          <td class="py-3 px-4 font-extrabold text-slate-900 text-sm whitespace-nowrap">
            ${window.app.formatMoney(sale.total)}
          </td>
          <td class="py-3 px-4 text-right whitespace-nowrap">
            <button onclick="window.reports.viewReceipt('${sale.id}')" title="Ver Recibo" class="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold rounded-lg border border-amber-200 text-xs flex items-center gap-1 ml-auto">
              <i class="fas fa-print text-[10px]"></i> Ver Ticket
            </button>
          </td>
        </tr>
      `;
    }).join("");
  }

  openAddStaffModal() {
    const modal = document.getElementById("add-staff-modal");
    if (modal) {
      document.getElementById("new-staff-name").value = "";
      modal.classList.remove("modal-hidden");
    }
  }

  closeAddStaffModal() {
    const modal = document.getElementById("add-staff-modal");
    if (modal) modal.classList.add("modal-hidden");
  }

  saveNewStaff() {
    const nameInput = document.getElementById("new-staff-name");
    const name = nameInput ? nameInput.value.trim() : "";

    if (!name) {
      window.app.showToast("Ingresa el nombre del mesero(a)", "warning");
      return;
    }

    window.db.addWaitstaff(name);
    window.app.showToast(`¡Mesero(a) "${name}" registrado(a) con éxito!`, "success");
    window.app.renderWaitstaffChips();
    this.closeAddStaffModal();
    this.refreshData();
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
}

window.waitstaff = new WaitstaffManager();
