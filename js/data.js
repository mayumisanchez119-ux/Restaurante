// ==========================================
// SISTEMA POS GASTRONÓMICO - BASE DE DATOS Y ESTADO
// ==========================================

const DEFAULT_PRODUCTS = [
  // Platos Fuertes y Especialidades
  {
    id: "pf-01",
    name: "Burger Gourmet Artesanal",
    category: "platos-fuertes",
    price: 28000,
    cost: 9800,
    emoji: "🍔",
    description: "Carne de res 180g madurada, queso cheddar fundido, tocineta crujiente, cebolla caramelizada y papas rústicas.",
    ingredients: [
      { id: "inv-carne", qty: 180 },
      { id: "inv-queso-cheddar", qty: 45 },
      { id: "inv-tocineta", qty: 40 },
      { id: "inv-pan-artesanal", qty: 1 }
    ]
  },
  {
    id: "pf-02",
    name: "Waffle Especial de la Casa",
    category: "platos-fuertes",
    price: 22000,
    cost: 7500,
    emoji: "🧇",
    description: "Waffle dorado crujiente con fresas frescas, chocolate artesanal, banano y helado cremoso de vainilla.",
    ingredients: [
      { id: "inv-masa", qty: 1 },
      { id: "inv-nutella", qty: 40 },
      { id: "inv-fresas", qty: 60 },
      { id: "inv-helado-vainilla", qty: 1 }
    ]
  },
  {
    id: "pf-03",
    name: "Sándwich Campestre de Pollo & Queso",
    category: "platos-fuertes",
    price: 24500,
    cost: 8200,
    emoji: "🥪",
    description: "Pechuga de pollo desmechada en salsa de champiñones, queso mozzarella gratinado y pan focaccia.",
    ingredients: [
      { id: "inv-pollo", qty: 120 },
      { id: "inv-queso-mozz", qty: 50 },
      { id: "inv-champinones", qty: 40 }
    ]
  },
  {
    id: "pf-04",
    name: "Waffle Campesino Tocineta & Huevos",
    category: "platos-fuertes",
    price: 25000,
    cost: 8900,
    emoji: "🥓",
    description: "Base de waffle salado, tocineta ahumada crujiente, huevos al gusto y queso derretido.",
    ingredients: [
      { id: "inv-masa", qty: 1 },
      { id: "inv-tocineta", qty: 50 },
      { id: "inv-huevos", qty: 2 },
      { id: "inv-queso-mozz", qty: 40 }
    ]
  },

  // Postres y Dulces
  {
    id: "ps-01",
    name: "Waffle Arequipe & Queso Dulce",
    category: "postres-dulces",
    price: 19500,
    cost: 6200,
    emoji: "🍯",
    description: "Arequipe artesanal tradicional, queso campesino rallado, chantilly y toque de canela.",
    ingredients: [
      { id: "inv-masa", qty: 1 },
      { id: "inv-arequipe", qty: 50 },
      { id: "inv-queso-mozz", qty: 40 },
      { id: "inv-chantilly", qty: 25 }
    ]
  },
  {
    id: "ps-02",
    name: "Bubble Waffle Tentación Helada",
    category: "postres-dulces",
    price: 23500,
    cost: 7900,
    emoji: "🍦",
    description: "Cono bubble waffle con 2 bolas de helado, masmelos, barquillos, fresas y sirope de chocolate.",
    ingredients: [
      { id: "inv-masa", qty: 1 },
      { id: "inv-helado-vainilla", qty: 2 },
      { id: "inv-fresas", qty: 40 },
      { id: "inv-salsa-choco", qty: 25 }
    ]
  },
  {
    id: "ps-03",
    name: "Postre Cheesecake de Frutos Rojos",
    category: "postres-dulces",
    price: 16500,
    cost: 5400,
    emoji: "🍰",
    description: "Base crocante de galleta con crema de queso suave y reducción artesanal de moras y arándanos.",
    ingredients: [
      { id: "inv-arandanos", qty: 30 },
      { id: "inv-fresas", qty: 30 }
    ]
  },
  {
    id: "ps-04",
    name: "Mini Waffles para Compartir x8",
    category: "postres-dulces",
    price: 21000,
    cost: 6500,
    emoji: "🥞",
    description: "8 mini waffles esponjosos acompañados con 3 salsas de la casa para compartir.",
    ingredients: [
      { id: "inv-masa", qty: 1 },
      { id: "inv-nutella", qty: 25 },
      { id: "inv-arequipe", qty: 25 }
    ]
  },

  // Bebidas Calientes
  {
    id: "bc-01",
    name: "Café Latte Especial de Origen",
    category: "bebidas-calientes",
    price: 8500,
    cost: 2200,
    emoji: "☕",
    description: "Café 100% colombiano de origen, leche texturizada sedosa y arte latte.",
    ingredients: [
      { id: "inv-cafe", qty: 18 },
      { id: "inv-leche", qty: 200 }
    ]
  },
  {
    id: "bc-02",
    name: "Capuchino Vainilla o Caramelo",
    category: "bebidas-calientes",
    price: 9800,
    cost: 2600,
    emoji: "☕",
    description: "Espresso doble, espuma cremosa de leche y sirope dulce con canela.",
    ingredients: [
      { id: "inv-cafe", qty: 18 },
      { id: "inv-leche", qty: 180 }
    ]
  },
  {
    id: "bc-03",
    name: "Chocolate Caliente Corona",
    category: "bebidas-calientes",
    price: 8900,
    cost: 2400,
    emoji: "🍫",
    description: "Chocolate de mesa tradicional espumoso, leche entera y mini masmelos.",
    ingredients: [
      { id: "inv-leche", qty: 250 }
    ]
  },

  // Bebidas Frías
  {
    id: "bf-01",
    name: "Malteada Artesanal Cremosa",
    category: "bebidas-frias",
    price: 15500,
    cost: 4800,
    emoji: "🥤",
    description: "Helado cremoso premium, salsa de chocolate/nutella, leche y corona de crema batida.",
    ingredients: [
      { id: "inv-helado-vainilla", qty: 2 },
      { id: "inv-nutella", qty: 35 },
      { id: "inv-leche", qty: 150 },
      { id: "inv-chantilly", qty: 25 }
    ]
  },
  {
    id: "bf-02",
    name: "Limonada Natural / Coco Frappé",
    category: "bebidas-frias",
    price: 12500,
    cost: 3500,
    emoji: "🥥",
    description: "Zumo de limón fresco, hielo frappé y opción de crema de coco.",
    ingredients: []
  },
  {
    id: "bf-03",
    name: "Soda Saborizada Frutos Rojos",
    category: "bebidas-frias",
    price: 11000,
    cost: 3100,
    emoji: "🍹",
    description: "Agua mineral con gas, infusión de frutos silvestres y rodajas de limón con menta.",
    ingredients: [
      { id: "inv-arandanos", qty: 25 }
    ]
  },

  // Toppings & Adiciones
  {
    id: "top-01",
    name: "Porción de Helado Extra",
    category: "adiciones-toppings",
    price: 4500,
    cost: 1500,
    emoji: "🍨",
    description: "Bola adicional de helado de vainilla, chocolate o frutos rojos.",
    ingredients: [{ id: "inv-helado-vainilla", qty: 1 }]
  },
  {
    id: "top-02",
    name: "Porción de Tocineta Crocante",
    category: "adiciones-toppings",
    price: 5500,
    cost: 2100,
    emoji: "🥓",
    description: "Porción extra de tocineta ahumada crujiente.",
    ingredients: [{ id: "inv-tocineta", qty: 40 }]
  },
  {
    id: "top-03",
    name: "Salsa o Adición Especial",
    category: "adiciones-toppings",
    price: 4000,
    cost: 1300,
    emoji: "🍫",
    description: "Porción adicional de Nutella, Arequipe o Frutos Rojos.",
    ingredients: [{ id: "inv-nutella", qty: 35 }]
  }
];

const DEFAULT_INVENTORY = [
  { id: "inv-masa", name: "Mezcla Base de Harina Especial", category: "Bases y Masas", unit: "porción", currentStock: 150, minStock: 35, costPerUnit: 1800, supplier: "Molino Central" },
  { id: "inv-pan-artesanal", name: "Pan Brioche / Focaccia Artesanal", category: "Bases y Masas", unit: "und", currentStock: 45, minStock: 15, costPerUnit: 1600, supplier: "Panadería Gourmet" },
  { id: "inv-carne", name: "Carne de Res Madurada 180g", category: "Carnes y Proteínas", unit: "g", currentStock: 4200, minStock: 1500, costPerUnit: 40, supplier: "Carnes La Sabana" },
  { id: "inv-pollo", name: "Pechuga de Pollo Desmechada", category: "Carnes y Proteínas", unit: "g", currentStock: 3100, minStock: 1000, costPerUnit: 28, supplier: "Distribuidora Avícola" },
  { id: "inv-tocineta", name: "Tocineta Ahumada Premium", category: "Carnes y Proteínas", unit: "g", currentStock: 1800, minStock: 600, costPerUnit: 48, supplier: "Carnes La Sabana" },
  { id: "inv-queso-mozz", name: "Queso Mozzarella Tajado", category: "Lácteos y Quesos", unit: "g", currentStock: 2500, minStock: 800, costPerUnit: 32, supplier: "Lácteos del Campo" },
  { id: "inv-queso-cheddar", name: "Queso Cheddar Americano", category: "Lácteos y Quesos", unit: "g", currentStock: 1400, minStock: 500, costPerUnit: 36, supplier: "Lácteos del Campo" },
  { id: "inv-helado-vainilla", name: "Helado de Vainilla Francesa (Bolas)", category: "Lácteos y Quesos", unit: "bola", currentStock: 90, minStock: 30, costPerUnit: 1400, supplier: "Helados Artesanales" },
  { id: "inv-chantilly", name: "Crema Batida Chantilly", category: "Lácteos y Quesos", unit: "g", currentStock: 1200, minStock: 400, costPerUnit: 22, supplier: "Lácteos del Campo" },
  { id: "inv-leche", name: "Leche Entera Pasteurizada", category: "Lácteos y Quesos", unit: "ml", currentStock: 9500, minStock: 3000, costPerUnit: 4, supplier: "Distribuidora Láctea" },
  { id: "inv-fresas", name: "Fresas Frescas Seleccionadas", category: "Frutas y Verduras", unit: "g", currentStock: 2200, minStock: 1000, costPerUnit: 16, supplier: "Huerta Verde" },
  { id: "inv-arandanos", name: "Arándanos Azules Frescos", category: "Frutas y Verduras", unit: "g", currentStock: 450, minStock: 500, costPerUnit: 38, supplier: "Huerta Verde" },
  { id: "inv-champinones", name: "Champiñones Frescos Tajados", category: "Frutas y Verduras", unit: "g", currentStock: 550, minStock: 600, costPerUnit: 22, supplier: "Huerta Verde" },
  { id: "inv-huevos", name: "Huevos AA Campesinos", category: "Proteínas e Insumos", unit: "und", currentStock: 80, minStock: 30, costPerUnit: 650, supplier: "Avícola Santa Rita" },
  { id: "inv-nutella", name: "Crema de Chocolate y Avellana", category: "Salsas y Dulces", unit: "g", currentStock: 3000, minStock: 700, costPerUnit: 42, supplier: "Insumos Pasteleros" },
  { id: "inv-arequipe", name: "Arequipe Dulce de Leche", category: "Salsas y Dulces", unit: "g", currentStock: 3400, minStock: 800, costPerUnit: 25, supplier: "Insumos Pasteleros" },
  { id: "inv-salsa-choco", name: "Sirope de Chocolate Semiamargo", category: "Salsas y Dulces", unit: "ml", currentStock: 2100, minStock: 500, costPerUnit: 18, supplier: "Insumos Pasteleros" },
  { id: "inv-cafe", name: "Café en Grano Especial de Origen", category: "Bebidas y Café", unit: "g", currentStock: 3500, minStock: 1000, costPerUnit: 55, supplier: "Café Don Pedro" },
  { id: "inv-cajas-llevar", name: "Empaques Térmicos Biodegradables", category: "Empaques", unit: "und", currentStock: 220, minStock: 60, costPerUnit: 850, supplier: "Empaques EcoPack" },
  { id: "inv-vasos-12oz", name: "Vasos Térmicos para Bebidas 12oz", category: "Empaques", unit: "und", currentStock: 190, minStock: 50, costPerUnit: 450, supplier: "Empaques EcoPack" }
];

const DEFAULT_TABLES = [
  { id: 1, name: "Mesa 1", capacity: 4, location: "Salón Principal", status: "libre", order: null },
  { 
    id: 2, 
    name: "Mesa 2", 
    capacity: 2, 
    location: "Ventanal", 
    status: "ocupada", 
    waiter: "Valentina M.", 
    openedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    order: {
      items: [
        { id: "pf-02", name: "Waffle Especial de la Casa", price: 22000, qty: 1, notes: "Extra fresas", emoji: "🧇" },
        { id: "bc-01", name: "Café Latte Especial de Origen", price: 8500, qty: 2, notes: "Azúcar morena aparte", emoji: "☕" }
      ],
      subtotal: 39000,
      tipPercentage: 10,
      tipAmount: 3900,
      tax: 0,
      total: 42900
    }
  },
  { 
    id: 3, 
    name: "Mesa 3", 
    capacity: 4, 
    location: "Terraza", 
    status: "cuenta", 
    waiter: "Andrés G.", 
    openedAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    order: {
      items: [
        { id: "pf-01", name: "Burger Gourmet Artesanal", price: 28000, qty: 2, notes: "Término 3/4", emoji: "🍔" },
        { id: "ps-01", name: "Waffle Arequipe & Queso Dulce", price: 19500, qty: 1, notes: "", emoji: "🍯" },
        { id: "bf-01", name: "Malteada Artesanal Cremosa", price: 15500, qty: 2, notes: "", emoji: "🥤" }
      ],
      subtotal: 106500,
      tipPercentage: 10,
      tipAmount: 10650,
      tax: 0,
      total: 117150
    }
  },
  { id: 4, name: "Mesa 4", capacity: 6, location: "Salón Principal", status: "libre", order: null },
  { id: 5, name: "Mesa 5", capacity: 2, location: "Ventanal", status: "libre", order: null },
  { id: 6, name: "Mesa 6", capacity: 4, location: "Terraza", status: "libre", order: null },
  { id: 7, name: "Mesa 7", capacity: 4, location: "Salón Principal", status: "libre", order: null },
  { id: 8, name: "Mesa 8", capacity: 8, location: "Zona Reservas", status: "libre", order: null },
  { id: 9, name: "Barra 1", capacity: 1, location: "Barra de Café / Bar", status: "libre", order: null },
  { id: 10, name: "Barra 2", capacity: 1, location: "Barra de Café / Bar", status: "libre", order: null },
  { 
    id: 11, 
    name: "Domicilio #01", 
    capacity: 0, 
    location: "Rappi / Domicilios", 
    status: "ocupada", 
    waiter: "Sistema Domicilios", 
    openedAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    order: {
      items: [
        { id: "pf-01", name: "Burger Gourmet Artesanal", price: 28000, qty: 1, notes: "Para llevar bien empacado", emoji: "🍔" },
        { id: "ps-04", name: "Mini Waffles para Compartir x8", price: 21000, qty: 1, notes: "Salsas selladas aparte", emoji: "🥞" }
      ],
      subtotal: 49000,
      tipPercentage: 0,
      tipAmount: 0,
      tax: 0,
      total: 49000
    }
  },
  { id: 12, name: "Para Llevar #02", capacity: 0, location: "Mostrador", status: "libre", order: null }
];

const DEFAULT_WAITSTAFF = [
  { id: "ws-1", name: "Valentina M.", username: "valentina", role: "Mesera Principal", active: true },
  { id: "ws-2", name: "Andrés G.", username: "andres", role: "Mesero de Terraza", active: true },
  { id: "ws-3", name: "Camila R.", username: "camila", role: "Mesera de Salón", active: true },
  { id: "ws-4", name: "David S.", username: "david", role: "Barista / Barra", active: true }
];

function generateSampleSalesHistory() {
  const sales = [];
  const paymentMethods = ["Efectivo", "Nequi", "Daviplata", "Tarjeta Débito", "Tarjeta Crédito"];
  const waiters = DEFAULT_WAITSTAFF;
  const now = new Date();
  let saleCounter = 1001;

  for (let d = 34; d >= 0; d--) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() - d);
    
    const dayOfWeek = targetDate.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5);
    const numSalesToday = isWeekend ? Math.floor(Math.random() * 8) + 14 : Math.floor(Math.random() * 6) + 8;

    for (let s = 0; s < numSalesToday; s++) {
      const saleHour = Math.floor(Math.random() * 12) + 9;
      const saleMinute = Math.floor(Math.random() * 60);
      const saleDateTime = new Date(targetDate);
      saleDateTime.setHours(saleHour, saleMinute, 0, 0);

      if (d === 0 && saleDateTime > now) continue;

      const numItems = Math.floor(Math.random() * 3) + 1;
      const saleItems = [];
      let subtotal = 0;
      let totalQty = 0;

      for (let i = 0; i < numItems; i++) {
        const prod = DEFAULT_PRODUCTS[Math.floor(Math.random() * DEFAULT_PRODUCTS.length)];
        const qty = Math.floor(Math.random() * 2) + 1;
        saleItems.push({
          id: prod.id,
          name: prod.name,
          category: prod.category,
          price: prod.price,
          qty: qty,
          subtotal: prod.price * qty,
          emoji: prod.emoji
        });
        subtotal += prod.price * qty;
        totalQty += qty;
      }

      const tipPercentage = Math.random() > 0.3 ? 10 : 0;
      const tipAmount = Math.round(subtotal * (tipPercentage / 100));
      const total = subtotal + tipAmount;
      const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const waiter = waiters[Math.floor(Math.random() * waiters.length)];
      const tableNum = Math.floor(Math.random() * 10) + 1;

      sales.push({
        id: `FAC-${saleCounter++}`,
        date: saleDateTime.toISOString(),
        tableId: tableNum,
        tableName: `Mesa ${tableNum}`,
        waiter: waiter,
        items: saleItems,
        totalItemsCount: totalQty,
        subtotal: subtotal,
        tipPercentage: tipPercentage,
        tipAmount: tipAmount,
        tax: 0,
        total: total,
        paymentMethod: paymentMethod,
        customerName: Math.random() > 0.6 ? ["Carlos Pérez", "María Gómez", "Laura Ruiz", "Andrés Cepeda", "Sofia Castro", "Mateo Ríos"][Math.floor(Math.random() * 6)] : "Cliente Ocasional",
        customerDoc: Math.random() > 0.6 ? `CC ${Math.floor(Math.random() * 90000000) + 10000000}` : "222222222222"
      });
    }
  }

  return sales;
}

class DataStore {
  constructor() {
    this.init();
  }

  init() {
    const existingSettings = localStorage.getItem("wddm_settings");
    if (!existingSettings) {
      localStorage.setItem("wddm_settings", JSON.stringify({
        restaurantName: "Mi Restaurante & Café",
        businessType: "Restaurante / Cafetería / Bar",
        nit: "900.123.456-7",
        address: "Av. Principal # 45-12, Bogotá",
        phone: "+57 (300) 123-4567",
        social: "@mirestaurante",
        currency: "COP",
        currencySymbol: "$",
        defaultTip: 10,
        enableSound: true,
        adminUser: "admin",
        adminPass: "admin123"
      }));
    } else {
      // Asegurar que existan campos de credenciales
      const parsed = JSON.parse(existingSettings);
      if (!parsed.adminUser || !parsed.adminPass) {
        parsed.adminUser = parsed.adminUser || "admin";
        parsed.adminPass = parsed.adminPass || "admin123";
        localStorage.setItem("wddm_settings", JSON.stringify(parsed));
      }
    }

    if (!localStorage.getItem("wddm_products")) {
      localStorage.setItem("wddm_products", JSON.stringify(DEFAULT_PRODUCTS));
    }
    if (!localStorage.getItem("wddm_inventory")) {
      localStorage.setItem("wddm_inventory", JSON.stringify(DEFAULT_INVENTORY));
    }
    if (!localStorage.getItem("wddm_tables")) {
      localStorage.setItem("wddm_tables", JSON.stringify(DEFAULT_TABLES));
    }
    if (!localStorage.getItem("wddm_waitstaff")) {
      localStorage.setItem("wddm_waitstaff", JSON.stringify(DEFAULT_WAITSTAFF));
    }
    if (!localStorage.getItem("wddm_sales")) {
      const generatedSales = generateSampleSalesHistory();
      localStorage.setItem("wddm_sales", JSON.stringify(generatedSales));
    }
  }

  // ==================== SESIONES Y ACCESO ====================
  getSession() {
    return JSON.parse(sessionStorage.getItem("gastropos_session") || localStorage.getItem("gastropos_session") || "null");
  }

  saveSession(sessionData, remember = false) {
    sessionStorage.setItem("gastropos_session", JSON.stringify(sessionData));
    if (remember) {
      localStorage.setItem("gastropos_session", JSON.stringify(sessionData));
    }
  }

  clearSession() {
    sessionStorage.removeItem("gastropos_session");
    localStorage.removeItem("gastropos_session");
  }

  // ==================== PERSONAL Y MESEROS ====================
  getWaitstaffList() {
    const raw = localStorage.getItem("wddm_waitstaff");
    let list = raw ? JSON.parse(raw) : DEFAULT_WAITSTAFF;
    
    // Migrar strings antiguos si existieran
    if (Array.isArray(list) && list.length > 0 && typeof list[0] === "string") {
      list = list.map((name, idx) => ({
        id: `ws-${idx + 1}`,
        name: name,
        username: name.toLowerCase().replace(/[^a-z0-9]/g, ""),
        role: "Mesero(a)",
        active: true
      }));
      this.saveWaitstaffList(list);
    }
    return list;
  }

  getWaitstaff() {
    return this.getWaitstaffList().map(w => w.name);
  }

  saveWaitstaffList(list) {
    localStorage.setItem("wddm_waitstaff", JSON.stringify(list));
  }

  addOrUpdateWaitstaff(staff) {
    const list = this.getWaitstaffList();
    if (staff.id) {
      const idx = list.findIndex(w => w.id === staff.id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...staff };
      } else {
        list.push(staff);
      }
    } else {
      staff.id = `ws-${Date.now()}`;
      list.push(staff);
    }
    this.saveWaitstaffList(list);
    return staff;
  }

  deleteWaitstaff(id) {
    let list = this.getWaitstaffList();
    list = list.filter(w => w.id !== id);
    this.saveWaitstaffList(list);
    return list;
  }

  findWaitstaffByLogin(input) {
    if (!input) return null;
    const term = input.trim().toLowerCase();
    const list = this.getWaitstaffList();
    return list.find(w => 
      w.username.toLowerCase() === term || 
      w.name.toLowerCase() === term
    );
  }

  getProducts() {
    return JSON.parse(localStorage.getItem("wddm_products") || "[]");
  }

  saveProducts(products) {
    localStorage.setItem("wddm_products", JSON.stringify(products));
  }

  getInventory() {
    return JSON.parse(localStorage.getItem("wddm_inventory") || "[]");
  }

  saveInventory(inventory) {
    localStorage.setItem("wddm_inventory", JSON.stringify(inventory));
  }

  getTables() {
    return JSON.parse(localStorage.getItem("wddm_tables") || "[]");
  }

  saveTables(tables) {
    localStorage.setItem("wddm_tables", JSON.stringify(tables));
  }

  getSales() {
    return JSON.parse(localStorage.getItem("wddm_sales") || "[]");
  }

  saveSales(sales) {
    localStorage.setItem("wddm_sales", JSON.stringify(sales));
  }

  getSettings() {
    return JSON.parse(localStorage.getItem("wddm_settings") || "{}");
  }

  saveSettings(settings) {
    localStorage.setItem("wddm_settings", JSON.stringify(settings));
  }

  addSale(saleData) {
    const sales = this.getSales();
    sales.unshift(saleData);
    this.saveSales(sales);
    this.deductInventoryFromOrder(saleData.items);
    return saleData;
  }

  deductInventoryFromOrder(orderItems) {
    const products = this.getProducts();
    const inventory = this.getInventory();
    let changed = false;

    orderItems.forEach(item => {
      const prod = products.find(p => p.id === item.id);
      if (prod && prod.ingredients && prod.ingredients.length > 0) {
        prod.ingredients.forEach(ing => {
          const invItem = inventory.find(i => i.id === ing.id);
          if (invItem) {
            const deductQty = ing.qty * (item.qty || 1);
            invItem.currentStock = Math.max(0, Math.round((invItem.currentStock - deductQty) * 100) / 100);
            changed = true;
          }
        });
      }
    });

    if (changed) {
      this.saveInventory(inventory);
    }
  }

  resetToDefaults() {
    localStorage.removeItem("wddm_products");
    localStorage.removeItem("wddm_inventory");
    localStorage.removeItem("wddm_tables");
    localStorage.removeItem("wddm_sales");
    localStorage.removeItem("wddm_settings");
    localStorage.removeItem("wddm_waitstaff");
    this.clearSession();
    this.init();
  }
}

window.db = new DataStore();
