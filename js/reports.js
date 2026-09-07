// ==========================================
// SISTEMA POS GASTRONÓMICO - REPORTES Y ANALÍTICAS
// ==========================================

class ReportsManager {
  constructor() {
    this.currentPeriod = "hoy"; // 'hoy' | 'ayer' | 'semana' | 'mes' | 'todo'
    this.metricMode = "both";   // 'dinero' | 'cantidad' | 'both'
    this.selectedDate = new Date();
    this.timelineChart = null;
    this.categoryChart = null;
    this.paymentChart = null;
    this.salesSearchTerm = "";
  }

  init() {
    this.setupDatePickers();
    this.setupEventListeners();
    this.refreshData();
  }

  setupDatePickers() {
    const datePicker = document.getElementById("reports-date-picker");
    if (datePicker) {
      datePicker.value = this.formatDateForInput(this.selectedDate);
    }
  }

  setupEventListeners() {
    const datePicker = document.getElementById("reports-date-picker");
    if (datePicker) {
      datePicker.addEventListener("change", (e) => {
        if (e.target.value) {
          this.setCustomDate(e.target.value);
        }
      });
    }

    const tableSearch = document.getElementById("reports-sales-search");
    if (tableSearch) {
      tableSearch.addEventListener("input", (e) => {
        this.salesSearchTerm = e.target.value.toLowerCase();
        this.renderTransactionsTable();
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
    if (period === "hoy") {
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
      const btn = document.getElementById(`period-btn-${p}`);
      if (btn) {
        if (p === this.currentPeriod) {
          btn.className = "px-2.5 py-1.5 rounded-lg font-bold bg-amber-600 text-white shadow-xs transition-all";
        } else {
          btn.className = "px-2.5 py-1.5 rounded-lg font-bold text-slate-600 hover:bg-slate-200 transition-all";
        }
      }
    });

    const datePicker = document.getElementById("reports-date-picker");
    if (datePicker && this.currentPeriod !== "custom") {
      datePicker.value = this.formatDateForInput(this.selectedDate);
    }
  }

  setMetric(mode) {
    this.setMetricMode(mode);
  }

  setMetricMode(mode) {
    this.metricMode = mode;
    const btnDinero = document.getElementById("metric-btn-dinero");
    const btnCantidad = document.getElementById("metric-btn-cantidad");

    if (btnDinero) {
      if (mode === "dinero" || mode === "money") {
        btnDinero.className = "px-2 py-1 rounded-md bg-amber-600 text-white font-bold";
      } else {
        btnDinero.className = "px-2 py-1 rounded-md text-slate-600 font-bold hover:bg-slate-200";
      }
    }

    if (btnCantidad) {
      if (mode === "cantidad" || mode === "qty") {
        btnCantidad.className = "px-2 py-1 rounded-md bg-amber-600 text-white font-bold";
      } else {
        btnCantidad.className = "px-2 py-1 rounded-md text-slate-600 font-bold hover:bg-slate-200";
      }
    }

    this.renderCharts();
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

    return allSales; // 'todo'
  }

  refreshData() {
    const filteredSales = this.getFilteredSales();
    this.updateKPIs(filteredSales);
    this.renderTopProducts(filteredSales);
    this.renderCharts(filteredSales);
    this.renderTransactionsTable(filteredSales);
    this.updatePeriodDescription();
  }

  updatePeriodDescription() {
    const descEl = document.getElementById("reports-period-description");
    if (!descEl) return;

    const sel = this.selectedDate;
    const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    if (this.currentPeriod === "hoy") {
      descEl.textContent = `Reporte de ventas de hoy (${sel.getDate()} de ${months[sel.getMonth()]})`;
    } else if (this.currentPeriod === "ayer") {
      descEl.textContent = `Reporte de ventas del día de ayer`;
    } else if (this.currentPeriod === "semana") {
      descEl.textContent = `Reporte semanal acumulado`;
    } else if (this.currentPeriod === "mes") {
      descEl.textContent = `Reporte mensual de ${months[sel.getMonth()]} de ${sel.getFullYear()}`;
    } else if (this.currentPeriod === "todo") {
      descEl.textContent = `Reporte histórico consolidado (todas las ventas)`;
    } else {
      descEl.textContent = `Reporte del día ${sel.getDate()} de ${months[sel.getMonth()]} de ${sel.getFullYear()}`;
    }
  }

  updateKPIs(sales) {
    const totalMoney = sales.reduce((acc, s) => acc + (s.total || 0), 0);
    const totalQty = sales.reduce((acc, s) => acc + (s.totalItemsCount || 0), 0);
    const totalOrders = sales.length;
    const avgTicket = totalOrders > 0 ? Math.round(totalMoney / totalOrders) : 0;

    const moneyEl = document.getElementById("rep-kpi-money");
    const qtyEl = document.getElementById("rep-kpi-qty");
    const avgEl = document.getElementById("rep-kpi-avg");
    const ordersEl = document.getElementById("rep-kpi-orders");

    if (moneyEl) moneyEl.textContent = window.app.formatMoney(totalMoney);
    if (qtyEl) qtyEl.textContent = `${totalQty}`;
    if (avgEl) avgEl.textContent = window.app.formatMoney(avgTicket);
    if (ordersEl) ordersEl.textContent = `${totalOrders}`;
  }

  renderTopProducts(sales) {
    const container = document.getElementById("reports-top-products-list");
    if (!container) return;

    const productMap = {};

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productMap[item.name]) {
          productMap[item.name] = {
            name: item.name,
            emoji: item.emoji || "🍽️",
            category: item.category || "General",
            qty: 0,
            revenue: 0
          };
        }
        productMap[item.name].qty += item.qty;
        productMap[item.name].revenue += item.price * item.qty;
      });
    });

    const sorted = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, 5);

    if (sorted.length === 0) {
      container.innerHTML = `
        <div class="py-8 text-center text-slate-400 text-xs font-semibold">
          No hay ventas registradas en este periodo
        </div>
      `;
      return;
    }

    const maxQty = sorted[0].qty || 1;

    container.innerHTML = sorted.map((p, index) => {
      const percent = Math.round((p.qty / maxQty) * 100);
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`;

      return `
        <div class="p-3 bg-amber-50/40 rounded-xl border border-amber-100/80 space-y-1.5">
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2">
              <span class="text-sm font-black w-6 text-center text-amber-800">${medal}</span>
              <span class="text-base">${p.emoji}</span>
              <div>
                <span class="font-bold text-slate-800">${p.name}</span>
              </div>
            </div>
            <div class="text-right">
              <span class="font-extrabold text-amber-900">${p.qty} unids.</span>
              <div class="text-[11px] font-bold text-emerald-700">${window.app.formatMoney(p.revenue)}</div>
            </div>
          </div>
          <div class="w-full bg-amber-100/60 h-2 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
          </div>
        </div>
      `;
    }).join("");
  }

  renderCharts(sales = null) {
    if (!sales) sales = this.getFilteredSales();

    this.renderTimelineChart(sales);
    this.renderCategoryChart(sales);
    this.renderPaymentChart(sales);
  }

  renderTimelineChart(sales) {
    const ctx = document.getElementById("chart-timeline");
    if (!ctx) return;

    if (this.timelineChart) {
      this.timelineChart.destroy();
    }

    let labels = [];
    let moneyData = [];
    let qtyData = [];

    if (this.currentPeriod === "hoy" || this.currentPeriod === "ayer" || this.currentPeriod === "dia" || this.currentPeriod === "custom") {
      const hours = [8, 10, 12, 14, 16, 18, 20, 22];
      labels = ["8-10 AM", "10-12 PM", "12-2 PM", "2-4 PM", "4-6 PM", "6-8 PM", "8-10 PM"];
      moneyData = new Array(labels.length).fill(0);
      qtyData = new Array(labels.length).fill(0);

      sales.forEach(s => {
        const h = new Date(s.date).getHours();
        for (let i = 0; i < hours.length - 1; i++) {
          if (h >= hours[i] && h < hours[i + 1]) {
            moneyData[i] += s.total;
            qtyData[i] += s.totalItemsCount;
            break;
          }
        }
      });
    } 
    else if (this.currentPeriod === "semana") {
      labels = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
      moneyData = new Array(7).fill(0);
      qtyData = new Array(7).fill(0);

      sales.forEach(s => {
        const dayIdx = (new Date(s.date).getDay() + 6) % 7;
        moneyData[dayIdx] += s.total;
        qtyData[dayIdx] += s.totalItemsCount;
      });
    } 
    else if (this.currentPeriod === "mes") {
      labels = ["Semana 1 (Días 1-7)", "Semana 2 (Días 8-14)", "Semana 3 (Días 15-21)", "Semana 4 (Días 22-28)", "Semana 5 (Días 29+)"];
      moneyData = new Array(5).fill(0);
      qtyData = new Array(5).fill(0);

      sales.forEach(s => {
        const dayOfMonth = new Date(s.date).getDate();
        const weekIdx = Math.min(4, Math.floor((dayOfMonth - 1) / 7));
        moneyData[weekIdx] += s.total;
        qtyData[weekIdx] += s.totalItemsCount;
      });
    } else {
      labels = ["Último mes", "Hace 3 sem", "Hace 2 sem", "Semana pasada", "Esta semana"];
      moneyData = new Array(5).fill(0);
      qtyData = new Array(5).fill(0);

      sales.forEach(s => {
        const d = new Date(s.date);
        const daysDiff = Math.floor((new Date() - d) / (1000 * 60 * 60 * 24));
        const idx = Math.min(4, Math.max(0, 4 - Math.floor(daysDiff / 7)));
        moneyData[idx] += s.total;
        qtyData[idx] += s.totalItemsCount;
      });
    }

    const isDineroMode = (this.metricMode === "dinero" || this.metricMode === "money");
    const isCantidadMode = (this.metricMode === "cantidad" || this.metricMode === "qty");

    const datasets = [];

    if (isDineroMode || (!isDineroMode && !isCantidadMode)) {
      datasets.push({
        label: "Ingresos ($ COP)",
        data: moneyData,
        borderColor: "#D97706",
        backgroundColor: "rgba(217, 119, 6, 0.15)",
        borderWidth: 3,
        fill: true,
        tension: 0.35
      });
    }

    if (isCantidadMode || (!isDineroMode && !isCantidadMode)) {
      datasets.push({
        label: "Cantidad (Unidades)",
        data: qtyData,
        borderColor: "#E11D48",
        backgroundColor: "rgba(225, 29, 72, 0.15)",
        borderWidth: 3,
        fill: true,
        tension: 0.35
      });
    }

    this.timelineChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        plugins: {
          legend: {
            position: "top",
            labels: { font: { family: "Quicksand", weight: "bold", size: 11 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                if (label.includes("Ingresos") || label.includes("$")) {
                  return `${label}: ${window.app.formatMoney(value)}`;
                }
                return `${label}: ${value} unidades`;
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: {
              callback: (val) => isCantidadMode ? val : "$" + (val >= 1000 ? (val / 1000) + "k" : val)
            }
          }
        }
      }
    });
  }

  renderCategoryChart(sales) {
    const ctx = document.getElementById("chart-categories");
    if (!ctx) return;

    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    const categoryNames = {
      "platos-fuertes": "Platos Fuertes",
      "postres-dulces": "Postres & Dulces",
      "bebidas-calientes": "Bebidas Calientes",
      "bebidas-frias": "Bebidas Frías",
      "adiciones-toppings": "Adiciones & Extras"
    };

    const catData = {
      "platos-fuertes": { qty: 0, money: 0 },
      "postres-dulces": { qty: 0, money: 0 },
      "bebidas-calientes": { qty: 0, money: 0 },
      "bebidas-frias": { qty: 0, money: 0 },
      "adiciones-toppings": { qty: 0, money: 0 }
    };

    sales.forEach(s => {
      s.items.forEach(i => {
        const cat = i.category || "platos-fuertes";
        if (catData[cat]) {
          catData[cat].qty += i.qty;
          catData[cat].money += i.price * i.qty;
        }
      });
    });

    const isCantidad = (this.metricMode === "cantidad" || this.metricMode === "qty");
    const labels = Object.keys(catData).map(k => categoryNames[k]);
    const values = Object.keys(catData).map(k => isCantidad ? catData[k].qty : catData[k].money);

    this.categoryChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: isCantidad ? "Cantidades (Unds)" : "Ingresos ($)",
          data: values,
          backgroundColor: [
            "#F59E0B",
            "#D97706",
            "#E11D48",
            "#78350F",
            "#0284C7"
          ],
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
              label: (context) => {
                const val = context.parsed.y;
                return isCantidad ? `${val} unidades` : window.app.formatMoney(val);
              }
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: {
              callback: (val) => isCantidad ? val : "$" + (val >= 1000 ? (val / 1000) + "k" : val)
            }
          }
        }
      }
    });
  }

  renderPaymentChart(sales) {
    const ctx = document.getElementById("chart-payments");
    if (!ctx) return;

    if (this.paymentChart) {
      this.paymentChart.destroy();
    }

    const payMap = {};
    sales.forEach(s => {
      const method = s.paymentMethod || "Efectivo";
      payMap[method] = (payMap[method] || 0) + s.total;
    });

    const labels = Object.keys(payMap);
    const data = Object.values(payMap);

    this.paymentChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: [
            "#10B981", // Efectivo
            "#6366F1", // Nequi
            "#E11D48", // Daviplata
            "#F59E0B", // Tarjeta Débito
            "#8B5CF6"  // Tarjeta Crédito
          ],
          borderWidth: 2,
          borderColor: "#FFFFFF"
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: { font: { family: "Quicksand", weight: "bold", size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed;
                return ` ${context.label}: ${window.app.formatMoney(val)}`;
              }
            }
          }
        },
        cutout: "68%"
      }
    });
  }

  renderTransactionsTable(sales = null) {
    const tbody = document.getElementById("reports-sales-tbody");
    if (!tbody) return;

    if (!sales) sales = this.getFilteredSales();

    let list = [...sales];

    if (this.salesSearchTerm) {
      list = list.filter(s => 
        s.id.toLowerCase().includes(this.salesSearchTerm) ||
        s.tableName.toLowerCase().includes(this.salesSearchTerm) ||
        (s.customerName && s.customerName.toLowerCase().includes(this.salesSearchTerm)) ||
        (s.paymentMethod && s.paymentMethod.toLowerCase().includes(this.salesSearchTerm)) ||
        (s.waiter && s.waiter.toLowerCase().includes(this.salesSearchTerm))
      );
    }

    if (list.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="py-10 text-center text-slate-400">
            <i class="fas fa-receipt text-3xl mb-2 opacity-40"></i>
            <p class="text-sm font-semibold">No se encontraron ventas para este criterio</p>
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
          <td class="py-3 px-3 font-mono font-bold text-amber-900">${dateFormatted}</td>
          <td class="py-3 px-3 font-bold text-slate-800">${sale.tableName}</td>
          <td class="py-3 px-3 text-slate-600">${sale.waiter || 'Mesero'}</td>
          <td class="py-3 px-3">
            <span class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
              ${sale.paymentMethod}
            </span>
          </td>
          <td class="py-3 px-3">
            <div class="max-w-xs truncate text-slate-700 font-medium" title="${itemsSummary}">${itemsSummary}</div>
            <div class="text-[10px] text-amber-700 font-bold">${sale.totalItemsCount} productos</div>
          </td>
          <td class="py-3 px-3 font-extrabold text-slate-900 text-sm text-right whitespace-nowrap">
            ${window.app.formatMoney(sale.total)}
          </td>
        </tr>
      `;
    }).join("");
  }

  viewReceipt(saleId) {
    const allSales = window.db.getSales();
    const sale = allSales.find(s => s.id === saleId);
    if (!sale) return;

    window.pos.showReceiptModal(sale, false);
  }

  exportSalesCSV() {
    this.exportSalesToCSV();
  }

  exportSalesToCSV() {
    const sales = this.getFilteredSales();
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Factura,Fecha,Mesa,Mesero,Cliente,Documento,Metodo Pago,Cantidad Productos,Subtotal,Propina,Total\n";

    sales.forEach(s => {
      const row = `"${s.id}","${s.date}","${s.tableName}","${s.waiter}","${s.customerName || ''}","${s.customerDoc || ''}","${s.paymentMethod}",${s.totalItemsCount},${s.subtotal},${s.tipAmount},${s.total}`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Ventas_GastroPOS_${this.currentPeriod}_${this.formatDateForInput(this.selectedDate)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.app.showToast("Reporte de ventas exportado a CSV exitosamente", "success");
  }
}

window.reports = new ReportsManager();
