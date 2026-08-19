import { useMemo, useState } from 'react';
import JsonValueRenderer from '../../components/renderer/JsonValueRenderer.jsx';
import SearchInput from '../../components/shared/SearchInput.jsx';
import Pagination from '../../components/shared/Pagination.jsx';
import AiInsightPanel from '../../components/shared/AiInsightPanel.jsx';
import ReportPanel from '../../components/shared/ReportPanel.jsx';
import DistributionChart from '../../components/charts/DistributionChart.jsx';
import TimeSeriesChart from '../../components/charts/TimeSeriesChart.jsx';
import { buildBucketedDistribution, buildValueDistribution, buildTimeSeries } from '../../components/charts/chartUtils.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { normalizeEcommerceData } from './ecommerceMapper.js';

const sections = [
  { key: 'overview', label: 'Overview' },
  { key: 'products', label: 'Products' },
  { key: 'orders', label: 'Orders' },
  { key: 'customers', label: 'Customers' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'sales', label: 'Sales' },
  { key: 'categories', label: 'Categories' },
];

const summaryCard = (label, value) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-5">
    <div className="text-sm uppercase tracking-[0.24em] text-slate-400">{label}</div>
    <div className="mt-3 text-3xl font-semibold text-white">{value}</div>
  </div>
);

const formatLabel = (key) => {
  if (!key) return '';
  return String(key)
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (chr) => chr.toUpperCase());
};

const renderFallback = (value) => {
  if (value === null || value === undefined) {
    return '—';
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? '—' : `${value.length} item${value.length === 1 ? '' : 's'}`;
  }
  if (typeof value === 'object') {
    return <JsonValueRenderer value={value} />;
  }
  return String(value);
};

function getNestedCount(value) {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/,/g, ''));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export default function EcommerceTemplate({ data, classification, analysis, remoteInsight, remoteAiAvailable, onRequestRemoteInsight, isRequestingRemoteInsight, remoteError, readme, onGenerateReadme, onDownloadReadme }) {
  const normalized = normalizeEcommerceData(data);
  const [activeSection, setActiveSection] = useState('overview');
  const [productSelection, setProductSelection] = useState(null);
  const [orderSelection, setOrderSelection] = useState(null);
  const [productQuery, setProductQuery] = useState('');
  const [orderQuery, setOrderQuery] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const pageSize = 25;
  const debouncedProductQuery = useDebouncedValue(productQuery);
  const debouncedOrderQuery = useDebouncedValue(orderQuery);

  const orderStatusChartData = useMemo(
    () =>
      buildBucketedDistribution(normalized.orders, ['status', 'order_status'], [
        { label: 'Pending', pattern: /pending|processing/i },
        { label: 'Shipped', pattern: /shipped|in[_\s-]?transit/i },
        { label: 'Delivered', pattern: /delivered|completed/i },
        { label: 'Cancelled', pattern: /cancel/i },
      ]),
    [normalized.orders]
  );

  const categoryRevenueChartData = useMemo(
    () => buildValueDistribution(normalized.sales.byCategory, ['category', 'name'], ['revenue']),
    [normalized.sales.byCategory]
  );

  const salesTimeSeriesData = useMemo(
    () => buildTimeSeries(normalized.sales.daily, ['date', 'day'], ['revenue']),
    [normalized.sales.daily]
  );

  const filteredProducts = useMemo(() => {
    if (!debouncedProductQuery.trim()) {
      return normalized.products;
    }
    const query = debouncedProductQuery.toLowerCase();
    return normalized.products.filter((product) => {
      return [product.id, product.name, product.category, product.brand]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [normalized.products, debouncedProductQuery]);

  const filteredOrders = useMemo(() => {
    if (!debouncedOrderQuery.trim()) {
      return normalized.orders;
    }
    const query = debouncedOrderQuery.toLowerCase();
    return normalized.orders.filter((order) => {
      const orderId = order.order_id || order.id || order.orderId || order.reference;
      const customer = order.customer && (order.customer.name || order.customer.customer_id || order.customer.email);
      return [orderId, customer]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query));
    });
  }, [normalized.orders, debouncedOrderQuery]);

  const productPageCount = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const orderPageCount = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const visibleProducts = filteredProducts.slice((productPage - 1) * pageSize, productPage * pageSize);
  const visibleOrders = filteredOrders.slice((orderPage - 1) * pageSize, orderPage * pageSize);

  const productColumns = useMemo(() => {
    const keys = ['id', 'name', 'category', 'brand', 'price', 'original_price', 'discount_percentage', 'stock', 'rating'];
    const present = new Set();

    normalized.products.forEach((item) => {
      Object.keys(item || {}).forEach((key) => {
        if (keys.includes(key) || ['id', 'name', 'category', 'brand', 'price', 'original_price', 'discount_percentage', 'stock', 'rating', 'tags', 'colors', 'sizes'].includes(key)) {
          present.add(key);
        }
      });
    });

    return Array.from(present).slice(0, 9);
  }, [normalized.products]);

  const orderColumns = useMemo(() => {
    return ['order_id', 'customer', 'total', 'payment', 'shipping', 'status'];
  }, []);

  const renderSection = () => {
    switch (activeSection) {
      case 'products':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Products</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Product catalog</h2>
                  <p className="mt-2 text-sm text-slate-400">Showing {filteredProducts.length} products.</p>
                </div>
                <SearchInput
                  value={productQuery}
                  onChange={(value) => {
                    setProductQuery(value);
                    setProductPage(1);
                  }}
                  placeholder="Search by name, ID, category, brand"
                />
              </div>

              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                  <thead className="bg-slate-900/90">
                    <tr>
                      {productColumns.map((column) => (
                        <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {visibleProducts.map((product, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className={rowIndex % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}
                        onClick={() => setProductSelection(product)}
                        style={{ cursor: 'pointer' }}
                      >
                        {productColumns.map((column) => (
                          <td key={column} className="px-4 py-3 align-top text-slate-100">
                            {column === 'stock' ? <JsonValueRenderer value={product.stock} /> : <JsonValueRenderer value={product[column]} context={column === 'price' || column === 'original_price' ? 'currency' : undefined} />}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <Pagination
                  currentPage={productPage}
                  pageCount={productPageCount}
                  onPrevious={() => setProductPage((value) => Math.max(1, value - 1))}
                  onNext={() => setProductPage((value) => Math.min(productPageCount, value + 1))}
                />
              </div>
            </div>

            {productSelection ? (
              <div className="rounded-3xl border border-cyan-500/60 bg-slate-950/90 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Product details</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{productSelection.name || productSelection.id || 'Untitled product'}</h3>
                  </div>
                  <button
                    onClick={() => setProductSelection(null)}
                    className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {Object.entries(productSelection).map(([key, value]) => (
                    <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
                      <div className="mt-2 text-sm text-slate-100">
                        <JsonValueRenderer value={value} context={key === 'price' || key === 'original_price' ? 'currency' : undefined} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );

      case 'orders':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Orders</p>
                  <h2 className="mt-2 text-3xl font-semibold text-white">Recent orders</h2>
                  <p className="mt-2 text-sm text-slate-400">{filteredOrders.length} orders available.</p>
                </div>
                <SearchInput
                  value={orderQuery}
                  onChange={(value) => {
                    setOrderQuery(value);
                    setOrderPage(1);
                  }}
                  placeholder="Search by order ID or customer"
                />
              </div>

              <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                  <thead className="bg-slate-900/90">
                    <tr>
                      {orderColumns.map((column) => (
                        <th key={column} className="px-4 py-3 font-semibold text-slate-200">{formatLabel(column)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {visibleOrders.map((order, rowIndex) => {
                      const customerName = order.customer?.name || order.customer?.customer_id || order.customer?.email || '—';
                      const paymentSummary = order.payment ? `${order.payment.method || 'Payment'} • ${order.payment.status || ''}` : '—';
                      const shippingSummary = order.shipping ? `${order.shipping.method || 'Shipping'} • ${order.shipping.status || ''}` : '—';
                      const orderId = order.order_id || order.id || order.orderId || order.reference || '—';
                      const total = order.total || order.amount || order.order_total || null;
                      const status = order.status || order.order_status || '—';

                      return (
                        <tr
                          key={rowIndex}
                          className={rowIndex % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}
                          onClick={() => setOrderSelection(order)}
                          style={{ cursor: 'pointer' }}
                        >
                          <td className="px-4 py-3 align-top text-slate-100">{orderId}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{customerName}</td>
                          <td className="px-4 py-3 align-top text-slate-100"><JsonValueRenderer value={total} context="currency" /></td>
                          <td className="px-4 py-3 align-top text-slate-100"><JsonValueRenderer value={order.payment} /></td>
                          <td className="px-4 py-3 align-top text-slate-100"><JsonValueRenderer value={order.shipping} /></td>
                          <td className="px-4 py-3 align-top text-slate-100"><JsonValueRenderer value={status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4">
                <Pagination
                  currentPage={orderPage}
                  pageCount={orderPageCount}
                  onPrevious={() => setOrderPage((value) => Math.max(1, value - 1))}
                  onNext={() => setOrderPage((value) => Math.min(orderPageCount, value + 1))}
                />
              </div>
            </div>

            {orderSelection ? (
              <div className="rounded-3xl border border-cyan-500/60 bg-slate-950/90 p-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Order details</p>
                    <h3 className="mt-2 text-2xl font-semibold text-white">{orderSelection.order_id || orderSelection.id || 'Order details'}</h3>
                  </div>
                  <button
                    onClick={() => setOrderSelection(null)}
                    className="rounded-full border border-slate-700 bg-slate-950/80 px-4 py-2 text-sm text-slate-100"
                  >
                    Close
                  </button>
                </div>
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {Object.entries(orderSelection).map(([key, value]) => (
                    <div key={key} className="rounded-3xl border border-slate-800 bg-slate-900/90 p-4">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-500">{formatLabel(key)}</div>
                      <div className="mt-2 text-sm text-slate-100"><JsonValueRenderer value={value} context={key === 'total' || key === 'amount' ? 'currency' : undefined} /></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        );

      case 'customers':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-4">
              {summaryCard('Customers', normalized.customers.count ?? '—')}
              {summaryCard('Top customers', normalized.customers.topCustomers.length ? normalized.customers.topCustomers.length : '—')}
              {summaryCard('Orders', normalized.dashboard.totalOrders ?? '—')}
              {summaryCard('Revenue', normalized.dashboard.totalRevenue ? `₹${normalized.dashboard.totalRevenue.toLocaleString('en-IN')}` : '—')}
            </div>

            {normalized.customers.topCustomers.length ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Top customers</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Customer leaderboard</h2>
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                  <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                    <thead className="bg-slate-900/90">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-200">Customer</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Orders</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Total Spent</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Last Order</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {normalized.customers.topCustomers.map((customer, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                          <td className="px-4 py-3 align-top text-slate-100">{customer.name || customer.customer_id || customer.email || '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{customer.orders ?? '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100"><JsonValueRenderer value={customer.total_spent ?? customer.spent ?? customer.total} context="currency" /></td>
                          <td className="px-4 py-3 align-top text-slate-100">{customer.last_order || customer.lastPurchase || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 text-sm text-slate-400">No top customers data available.</p>
            )}
          </div>
        );

      case 'inventory':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-4">
              {summaryCard('Total products', normalized.inventory.totalProducts ?? '—')}
              {summaryCard('In stock', normalized.inventory.inStock ?? '—')}
              {summaryCard('Low stock', normalized.inventory.lowStock ?? '—')}
              {summaryCard('Out of stock', normalized.inventory.outOfStock ?? '—')}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Inventory alerts</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Alerts & thresholds</h2>
              {normalized.inventory.alerts.length ? (
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                  <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                    <thead className="bg-slate-900/90">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-200">Product</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Available</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Threshold</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {normalized.inventory.alerts.map((alert, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                          <td className="px-4 py-3 align-top text-slate-100">{alert.product || alert.name || '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{alert.available ?? alert.quantity ?? '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{alert.threshold ?? '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{alert.status ? <JsonValueRenderer value={alert.status} /> : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-400">No inventory alerts available.</p>
              )}
            </div>
          </div>
        );

      case 'sales':
        return (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-3">
              {summaryCard('Revenue', normalized.dashboard.totalRevenue ? `₹${normalized.dashboard.totalRevenue.toLocaleString('en-IN')}` : '—')}
              {summaryCard('Average order value', normalized.dashboard.averageOrderValue ? `₹${normalized.dashboard.averageOrderValue.toLocaleString('en-IN')}` : '—')}
              {summaryCard('Today’s revenue', normalized.dashboard.revenueToday ? `₹${normalized.dashboard.revenueToday.toLocaleString('en-IN')}` : '—')}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Sales overview</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Daily sales</h2>
              {normalized.sales.daily.length ? (
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                  <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                    <thead className="bg-slate-900/90">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-200">Date</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Orders</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {normalized.sales.daily.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                          <td className="px-4 py-3 align-top text-slate-100">{item.date || item.day || '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{item.orders ?? item.count ?? '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{item.revenue ? `₹${item.revenue.toLocaleString('en-IN')}` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-400">No daily sales data available.</p>
              )}
            </div>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Category sales</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Sales by category</h2>
              {normalized.sales.byCategory.length ? (
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                  <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                    <thead className="bg-slate-900/90">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-200">Category</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Orders</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Revenue</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Share</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {normalized.sales.byCategory.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                          <td className="px-4 py-3 align-top text-slate-100">{item.category || item.name || '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{item.orders ?? item.order_count ?? '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{item.revenue ? `₹${item.revenue.toLocaleString('en-IN')}` : '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{item.percentage ? `${item.percentage}%` : item.share ? `${item.share}%` : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-400">No category sales data available.</p>
              )}
            </div>
          </div>
        );

      case 'categories':
        return (
          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
              <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Categories</p>
              <h2 className="mt-2 text-3xl font-semibold text-white">Category performance</h2>
              {normalized.categories.length ? (
                <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                  <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                    <thead className="bg-slate-900/90">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-slate-200">Category</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Products</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Revenue</th>
                        <th className="px-4 py-3 font-semibold text-slate-200">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {normalized.categories.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                          <td className="px-4 py-3 align-top text-slate-100">{item.name}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{item.products ?? '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{item.revenue ? `₹${item.revenue.toLocaleString('en-IN')}` : '—'}</td>
                          <td className="px-4 py-3 align-top text-slate-100">{item.status || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-6 text-sm text-slate-400">No categories data available.</p>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-4">
              {summaryCard('Total revenue', normalized.dashboard.totalRevenue ? `₹${normalized.dashboard.totalRevenue.toLocaleString('en-IN')}` : '—')}
              {summaryCard('Orders', normalized.dashboard.totalOrders ?? '—')}
              {summaryCard('Customers', normalized.dashboard.totalCustomers ?? '—')}
              {summaryCard('Products', normalized.dashboard.totalProducts ?? '—')}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {summaryCard('Average order value', normalized.dashboard.averageOrderValue ? `₹${normalized.dashboard.averageOrderValue.toLocaleString('en-IN')}` : '—')}
              {summaryCard('Today’s orders', normalized.dashboard.ordersToday ?? '—')}
              {summaryCard('Today’s revenue', normalized.dashboard.revenueToday ? `₹${normalized.dashboard.revenueToday.toLocaleString('en-IN')}` : '—')}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <DistributionChart title="Order status" data={orderStatusChartData} type="pie" />
              <DistributionChart title="Revenue by category" data={categoryRevenueChartData} />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Sales overview</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Daily summary</h2>
                {normalized.sales.daily.length ? (
                  <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/80">
                    <table className="min-w-full divide-y divide-slate-700 text-left text-sm text-slate-100">
                      <thead className="bg-slate-900/90">
                        <tr>
                          <th className="px-4 py-3 font-semibold text-slate-200">Date</th>
                          <th className="px-4 py-3 font-semibold text-slate-200">Orders</th>
                          <th className="px-4 py-3 font-semibold text-slate-200">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {normalized.sales.daily.slice(0, 6).map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-slate-950/70' : 'bg-slate-900'}>
                            <td className="px-4 py-3 align-top text-slate-100">{item.date || item.day || '—'}</td>
                            <td className="px-4 py-3 align-top text-slate-100">{item.orders ?? item.count ?? '—'}</td>
                            <td className="px-4 py-3 align-top text-slate-100">{item.revenue ? `₹${item.revenue.toLocaleString('en-IN')}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-slate-400">No sales daily data available.</p>
                )}
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
                <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Inventory summary</p>
                <h2 className="mt-2 text-3xl font-semibold text-white">Stock overview</h2>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  {summaryCard('In stock', normalized.inventory.inStock ?? '—')}
                  {summaryCard('Low stock', normalized.inventory.lowStock ?? '—')}
                  {summaryCard('Out of stock', normalized.inventory.outOfStock ?? '—')}
                  {summaryCard('Inventory products', normalized.inventory.totalProducts ?? '—')}
                </div>
              </div>
            </div>

            <TimeSeriesChart title="Sales over time" description="Daily revenue" data={salesTimeSeriesData} />

            <AiInsightPanel
              analysis={analysis}
              remoteInsight={remoteInsight}
              remoteAiAvailable={remoteAiAvailable}
              onRequestRemoteInsight={onRequestRemoteInsight}
              isRequestingRemoteInsight={isRequestingRemoteInsight}
              remoteError={remoteError}
            />

            <ReportPanel readme={readme} onGenerateReadme={onGenerateReadme} onDownloadReadme={onDownloadReadme} canGenerate={Boolean(analysis)} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-cyan-400">Ecommerce dashboard</p>
            <h1 className="text-3xl font-semibold text-white">Ecommerce summary</h1>
            <p className="mt-2 text-sm text-slate-400">Domain: {classification.detectedDomain}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`rounded-full px-4 py-2 text-sm ${activeSection === section.key ? 'bg-cyan-500 text-slate-950' : 'bg-slate-950/80 text-slate-200 hover:bg-slate-900'}`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {renderSection()}
    </div>
  );
}
