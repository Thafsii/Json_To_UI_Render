const safeObject = (value) => (value && typeof value === 'object' && !Array.isArray(value) ? value : {});
const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeNumber = (value) => (typeof value === 'number' && !Number.isNaN(value) ? value : null);
const safeString = (value) => (typeof value === 'string' ? value : null);

const getFirstMatchingKey = (object, keys) => {
  if (!object || typeof object !== 'object') {
    return null;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(object, key)) {
      return object[key];
    }
  }

  return null;
};

const getNestedValue = (object, path) => {
  if (!object || typeof object !== 'object' || typeof path !== 'string') {
    return null;
  }
  return path.split('.').reduce((current, segment) => {
    if (current && typeof current === 'object') {
      return current[segment];
    }
    return null;
  }, object);
};

export function normalizeEcommerceData(data) {
  const root = safeObject(data);

  const products = safeArray(getFirstMatchingKey(root, ['products', 'items', 'catalog', 'products_list']));
  const orders = safeArray(getFirstMatchingKey(root, ['orders', 'sales', 'transactions', 'order_list']));
  const categories = safeArray(getFirstMatchingKey(root, ['categories', 'category_list', 'category']));
  const inventory = safeObject(getFirstMatchingKey(root, ['inventory', 'stock', 'inventory_summary']));
  const sales = safeObject(getFirstMatchingKey(root, ['sales', 'revenue', 'sales_summary']));
  const customersRoot = getFirstMatchingKey(root, ['customers', 'clients', 'accounts', 'customer_data']);
  const customers = safeObject(customersRoot);
  const dashboard = safeObject(getFirstMatchingKey(root, ['dashboard', 'summary', 'overview']));

  const customersSummary = safeObject(getFirstMatchingKey(customers, ['summary', 'stats', 'totals'])) || customers;
  const customersCount = safeNumber(getNestedValue(customersSummary, 'total')) || safeNumber(getNestedValue(customersSummary, 'customers')) || safeNumber(getNestedValue(customersSummary, 'count')) || null;

  const topCustomers = safeArray(getFirstMatchingKey(customers, ['top_customers', 'topCustomers', 'top_customers_list', 'top_clients']));

  const dashboardSummary = {
    totalRevenue: safeNumber(getNestedValue(dashboard, 'total_revenue')) ?? safeNumber(getNestedValue(dashboard, 'revenue_total')) ?? safeNumber(getNestedValue(dashboard, 'revenue')) ?? null,
    totalOrders: safeNumber(getNestedValue(dashboard, 'total_orders')) ?? safeNumber(getNestedValue(dashboard, 'orders_total')) ?? safeNumber(getNestedValue(dashboard, 'orders')) ?? null,
    totalCustomers: safeNumber(getNestedValue(dashboard, 'total_customers')) ?? customersCount ?? null,
    totalProducts: safeNumber(getNestedValue(dashboard, 'total_products')) ?? safeNumber(getNestedValue(dashboard, 'products_total')) ?? safeNumber(getNestedValue(dashboard, 'products')) ?? safeNumber(products.length) ?? null,
    averageOrderValue: safeNumber(getNestedValue(dashboard, 'average_order_value')) ?? safeNumber(getNestedValue(dashboard, 'avg_order_value')) ?? null,
    ordersToday: safeNumber(getNestedValue(dashboard, 'orders_today')) ?? safeNumber(getNestedValue(dashboard, 'today_orders')) ?? null,
    revenueToday: safeNumber(getNestedValue(dashboard, 'revenue_today')) ?? safeNumber(getNestedValue(dashboard, 'today_revenue')) ?? null,
  };

  const inventorySummary = {
    totalProducts: safeNumber(getNestedValue(inventory, 'total_products')) ?? safeNumber(getNestedValue(inventory, 'products_total')) ?? safeNumber(products.length) ?? null,
    inStock: safeNumber(getNestedValue(inventory, 'in_stock')) ?? safeNumber(getNestedValue(inventory, 'available')) ?? null,
    lowStock: safeNumber(getNestedValue(inventory, 'low_stock')) ?? safeNumber(getNestedValue(inventory, 'low_stock_items')) ?? null,
    outOfStock: safeNumber(getNestedValue(inventory, 'out_of_stock')) ?? safeNumber(getNestedValue(inventory, 'out_of_stock_items')) ?? null,
    alerts: safeArray(getFirstMatchingKey(inventory, ['alerts', 'warnings', 'out_of_stock_alerts']))
      .filter((item) => item && typeof item === 'object'),
  };

  const salesDaily = safeArray(getFirstMatchingKey(sales, ['daily', 'daily_sales', 'day_over_day']));
  const salesByCategory = safeArray(getFirstMatchingKey(sales, ['by_category', 'category_breakdown', 'sales_by_category']));

  const productCategories = categories.map((category) => ({
    name: safeString(category.name) || safeString(category.category) || 'Unknown',
    products: safeNumber(getNestedValue(category, 'products')) || safeNumber(getNestedValue(category, 'product_count')) || null,
    revenue: safeNumber(getNestedValue(category, 'revenue')) || safeNumber(getNestedValue(category, 'sales')) || null,
    status: safeString(getNestedValue(category, 'status')) || safeString(getNestedValue(category, 'state')) || null,
  }));

  return {
    products,
    orders,
    customers: {
      count: customersCount,
      summary: customersSummary,
      topCustomers,
    },
    inventory: inventorySummary,
    sales: {
      daily: salesDaily,
      byCategory: salesByCategory,
    },
    categories: productCategories,
    dashboard: dashboardSummary,
  };
}
