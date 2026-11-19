import { useEffect, useState, FormEvent } from 'react';

interface Category {
  id: string;
  name: string;
  displayOrder: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  priceExclVat: number;
  vatRate: number;
  priceInclVat: number;
  isAvailable: boolean;
  categoryId: string;
  categoryName: string;
}

interface TableResto {
  id: string;
  tableNumber: number;
  capacity: number;
  zone: string;
  isActive: boolean;
}

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationTime: string;
  status: 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';
  tableId?: string;
  tableNumber?: number;
}

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPriceExclVat: number;
  vatRate: number;
  quantity: number;
  notes?: string;
  lineTotalInclVat: number;
}

interface Order {
  id: string;
  tableId: string;
  tableNumber: number;
  status: 'SENT_TO_KITCHEN' | 'IN_PREPARATION' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';
  discountAmount: number;
  totalExclVat: number;
  totalInclVat: number;
  createdAt: string;
  closedAt?: string;
  items: OrderItem[];
}

interface CartItem {
  product: Product;
  quantity: number;
  notes: string;
}

interface SalesReport {
  paidOrdersCount: number;
  totalExclVat: number;
  totalVat: number;
  totalInclVat: number;
  totalDiscounts: number;
  vatBreakdownByRate: Record<string, number>;
}

const MENU_API = 'http://localhost:8081/api/menu';
const ROOM_API = 'http://localhost:8081/api/room';
const ORDER_API = 'http://localhost:8082/api/orders';
const REPORT_API = 'http://localhost:8082/api/reports';

export default function App() {
  const [activeTab, setActiveTab] = useState<'orders' | 'room' | 'menu' | 'reports'>('orders');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<TableResto[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [report, setReport] = useState<SalesReport | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceExclVat, setPriceExclVat] = useState('');
  const [vatRate, setVatRate] = useState('12.00');
  const [categoryId, setCategoryId] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [reservationTime, setReservationTime] = useState(() => {
    const now = new Date();
    now.setHours(19, 30, 0, 0);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [preferredTableId, setPreferredTableId] = useState('');

  const [selectedTableId, setSelectedTableId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState('0');

  const fetchAllData = async () => {
    try {
      const [catRes, prodRes, tabRes, resRes] = await Promise.all([
        fetch(`${MENU_API}/categories`),
        fetch(`${MENU_API}/products`),
        fetch(`${ROOM_API}/tables`),
        fetch(`${ROOM_API}/reservations`),
      ]);
      if (catRes.ok && prodRes.ok) {
        const catData: Category[] = await catRes.json();
        setCategories(catData);
        setProducts(await prodRes.json());
        if (catData.length > 0 && !categoryId) setCategoryId(catData[0].id);
      }
      if (tabRes.ok && resRes.ok) {
        const tabData: TableResto[] = await tabRes.json();
        setTables(tabData);
        setReservations(await resRes.json());
        if (tabData.length > 0 && !selectedTableId) setSelectedTableId(tabData[0].id);
      }
    } catch {
      setFeedbackError('Impossible de joindre restaurant-service (port 8081).');
    }

    try {
      const [ordRes, repRes] = await Promise.all([
        fetch(ORDER_API),
        fetch(`${REPORT_API}/summary`),
      ]);
      if (ordRes.ok) setOrders(await ordRes.json());
      if (repRes.ok) setReport(await repRes.json());
    } catch {
      // order-service peut redémarrer
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${MENU_API}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        priceExclVat: parseFloat(priceExclVat),
        vatRate: parseFloat(vatRate),
        categoryId,
      }),
    });
    if (res.ok) {
      setName('');
      setDescription('');
      setPriceExclVat('');
      fetchAllData();
    }
  };

  const handleToggleAvailability = async (id: string) => {
    const res = await fetch(`${MENU_API}/products/${id}/availability`, { method: 'PATCH' });
    if (res.ok) fetchAllData();
  };

  const handleCreateReservation = async (e: FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    const res = await fetch(`${ROOM_API}/reservations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName,
        customerPhone,
        guestCount,
        reservationTime,
        preferredTableId: preferredTableId || null,
      }),
    });
    if (res.ok) {
      setCustomerName('');
      setCustomerPhone('');
      setPreferredTableId('');
      fetchAllData();
    } else {
      const data = await res.json().catch(() => ({ error: 'Erreur lors de la réservation' }));
      setFeedbackError(data.error || 'Créneau indisponible');
    }
  };

  const handleStatusChange = async (id: string, status: Reservation['status']) => {
    const res = await fetch(`${ROOM_API}/reservations/${id}/status?status=${status}`, { method: 'PATCH' });
    if (res.ok) fetchAllData();
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, notes: '' }];
    });
  };

  const updateCartNotes = (productId: string, notes: string) => {
    setCart((prev) => prev.map((i) => (i.product.id === productId ? { ...i, notes } : i)));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleSendOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedTableId || cart.length === 0) return;
    setFeedbackError(null);

    try {
      const res = await fetch(ORDER_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableId: selectedTableId,
          discountAmount: parseFloat(discountAmount) || 0,
          items: cart.map((c) => ({
            productId: c.product.id,
            quantity: c.quantity,
            notes: c.notes || null,
          })),
        }),
      });
      if (res.ok) {
        setCart([]);
        setDiscountAmount('0');
        fetchAllData();
      } else {
        const data = await res.json().catch(() => ({ error: 'Erreur commande' }));
        setFeedbackError(data.error || 'Impossible d’envoyer la commande');
      }
    } catch {
      setFeedbackError('order-service (port 8082) est injoignable.');
    }
  };

  const handleOrderStatus = async (orderId: string, status: Order['status']) => {
    const res = await fetch(`${ORDER_API}/${orderId}/status?status=${status}`, { method: 'PATCH' });
    if (res.ok) fetchAllData();
  };

  const seatedTableIds = new Set(
    reservations.filter((r) => r.status === 'SEATED' && r.tableId).map((r) => r.tableId!)
  );

  const cartTotalInclVat = cart.reduce(
    (sum, item) => sum + item.product.priceInclVat * item.quantity,
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white px-6 py-4 shadow">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">RestoManager Pro</h1>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
              Microservices 8081 • 8082
            </span>
          </div>

          <nav className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Commandes & Cuisine (KDS)
            </button>
            <button
              onClick={() => setActiveTab('room')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'room' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Salle & Réservations
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'menu' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Carte & Menu
            </button>
            <button
              onClick={() => {
                setActiveTab('reports');
                fetchAllData();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Rapports & Export CSV
            </button>
          </nav>
        </div>
      </header>

      {feedbackError && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between">
            <span>{feedbackError}</span>
            <button onClick={() => setFeedbackError(null)} className="font-bold cursor-pointer">✕</button>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          <section className="lg:col-span-5 bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit space-y-5">
            <h2 className="text-lg font-semibold">Nouvelle commande (Salle)</h2>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Table</label>
              <select
                value={selectedTableId}
                onChange={(e) => setSelectedTableId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Table {t.tableNumber} ({t.zone} - {t.capacity} pers.)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700 mb-2">Ajouter des articles disponibles :</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {products
                  .filter((p) => p.isAvailable)
                  .map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className="text-left p-2.5 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition cursor-pointer"
                    >
                      <div className="font-medium text-xs truncate">{p.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{p.priceInclVat.toFixed(2)} € TTC</div>
                    </button>
                  ))}
              </div>
            </div>

            <form onSubmit={handleSendOrder} className="border-t border-slate-200 pt-4 space-y-3">
              <h3 className="text-sm font-semibold">Ticket en cours ({cart.length})</h3>
              {cart.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Cliquez sur un plat ci-dessus pour l’ajouter.</p>
              ) : (
                <ul className="space-y-2.5">
                  {cart.map((item) => (
                    <li key={item.product.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">
                          {item.quantity}x {item.product.name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            {(item.product.priceInclVat * item.quantity).toFixed(2)} €
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-xs text-rose-600 hover:underline cursor-pointer"
                          >
                            Retirer
                          </button>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Note cuisine (ex: cuisson bleue, sans oignons...)"
                        value={item.notes}
                        onChange={(e) => updateCartNotes(item.product.id, e.target.value)}
                        className="mt-1.5 w-full text-xs bg-white border border-slate-200 rounded px-2 py-1"
                      />
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex items-center justify-between pt-2">
                <label className="text-xs text-slate-600">Remise commerciale (€) :</label>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-24 rounded border border-slate-300 px-2 py-1 text-xs text-right"
                />
              </div>

              <div className="flex justify-between items-center font-bold text-base pt-2 border-t border-slate-200">
                <span>Total estimé TTC</span>
                <span>{Math.max(0, cartTotalInclVat - (parseFloat(discountAmount) || 0)).toFixed(2)} €</span>
              </div>

              <button
                type="submit"
                disabled={cart.length === 0}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-medium py-2.5 rounded-lg text-sm transition cursor-pointer"
              >
                Envoyer en cuisine (KDS)
              </button>
            </form>
          </section>

          <section className="lg:col-span-7 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Écran Cuisine (KDS) & Suivi des tickets</h2>
              <button
                onClick={fetchAllData}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
              >
                Rafraîchir
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-400">
                Aucune commande enregistrée. Créez un ticket à gauche pour l’envoyer en cuisine.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-white rounded-xl shadow-sm border-2 p-5 flex flex-col justify-between ${
                      order.status === 'SENT_TO_KITCHEN'
                        ? 'border-amber-400'
                        : order.status === 'IN_PREPARATION'
                        ? 'border-blue-400'
                        : order.status === 'READY'
                        ? 'border-emerald-500'
                        : 'border-slate-200 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-base">Table {order.tableNumber}</span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-800">
                          {order.status}
                        </span>
                      </div>

                      <ul className="divide-y divide-slate-100 text-sm mb-4">
                        {order.items.map((item) => (
                          <li key={item.id} className="py-2">
                            <div className="flex justify-between">
                              <span className="font-medium">
                                {item.quantity}x {item.productName}
                              </span>
                              <span className="text-slate-600">{item.lineTotalInclVat.toFixed(2)} €</span>
                            </div>
                            {item.notes && (
                              <p className="text-xs text-amber-700 font-medium mt-0.5">Note : {item.notes}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-3">
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>HTVA : {order.totalExclVat.toFixed(2)} €</span>
                        <span className="font-bold text-slate-900 text-sm">
                          TTC : {order.totalInclVat.toFixed(2)} €
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {order.status === 'SENT_TO_KITCHEN' && (
                          <button
                            onClick={() => handleOrderStatus(order.id, 'IN_PREPARATION')}
                            className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer"
                          >
                            Démarrer préparation
                          </button>
                        )}
                        {order.status === 'IN_PREPARATION' && (
                          <button
                            onClick={() => handleOrderStatus(order.id, 'READY')}
                            className="flex-1 text-xs py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 cursor-pointer"
                          >
                            Plat prêt (Sonnerie)
                          </button>
                        )}
                        {order.status === 'READY' && (
                          <button
                            onClick={() => handleOrderStatus(order.id, 'SERVED')}
                            className="flex-1 text-xs py-2 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 cursor-pointer"
                          >
                            Marquer servi
                          </button>
                        )}
                        {order.status === 'SERVED' && (
                          <button
                            onClick={() => handleOrderStatus(order.id, 'PAID')}
                            className="flex-1 text-xs py-2 rounded-lg bg-emerald-700 text-white font-medium hover:bg-emerald-800 cursor-pointer"
                          >
                            Encaisser ({order.totalInclVat.toFixed(2)} €)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}

      {activeTab === 'room' && (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg font-semibold mb-4">Nouvelle réservation</h2>
            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du client</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Couverts</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={guestCount}
                    onChange={(e) => setGuestCount(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Table souhaitée</label>
                  <select
                    value={preferredTableId}
                    onChange={(e) => setPreferredTableId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Attribution auto</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        Table {t.tableNumber} ({t.capacity} pers.)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date et heure</label>
                <input
                  type="datetime-local"
                  required
                  value={reservationTime}
                  onChange={(e) => setReservationTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-sm transition cursor-pointer"
              >
                Confirmer la réservation
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4">Plan de salle en direct</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tables.map((table) => {
                  const isOccupied = seatedTableIds.has(table.id);
                  return (
                    <div
                      key={table.id}
                      className={`p-4 rounded-xl border-2 ${
                        isOccupied ? 'border-rose-400 bg-rose-50' : 'border-emerald-400 bg-emerald-50/60'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold">Table {table.tableNumber}</span>
                        <span className="text-xs font-medium">{isOccupied ? 'Occupée' : 'Libre'}</span>
                      </div>
                      <p className="text-xs text-slate-600">{table.zone} • {table.capacity} pers.</p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-5 py-3 border-b border-slate-200">
                <h3 className="font-semibold text-slate-800">Réservations ({reservations.length})</h3>
              </div>
              <ul className="divide-y divide-slate-100">
                {reservations.map((r) => (
                  <li key={r.id} className="p-5 flex justify-between items-center">
                    <div>
                      <span className="font-semibold">{r.customerName}</span> — Table {r.tableNumber} ({r.guestCount} pers.)
                      <p className="text-xs text-slate-500">{new Date(r.reservationTime).toLocaleString('fr-BE')} • {r.status}</p>
                    </div>
                    <div className="flex gap-2">
                      {r.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleStatusChange(r.id, 'SEATED')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer"
                        >
                          Installer
                        </button>
                      )}
                      {r.status === 'SEATED' && (
                        <button
                          onClick={() => handleStatusChange(r.id, 'COMPLETED')}
                          className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-white cursor-pointer"
                        >
                          Libérer
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </main>
      )}

      {activeTab === 'menu' && (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg font-semibold mb-4">Ajouter un article</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <input
                type="text"
                required
                placeholder="Nom du plat"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <textarea
                rows={2}
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="Prix HTVA"
                  value={priceExclVat}
                  onChange={(e) => setPriceExclVat(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  value={vatRate}
                  onChange={(e) => setVatRate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  <option value="12.00">12% (Nourriture)</option>
                  <option value="21.00">21% (Boissons)</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg text-sm cursor-pointer"
              >
                Enregistrer
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 space-y-6">
            {categories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 font-semibold">{cat.name}</div>
                <ul className="divide-y divide-slate-100">
                  {products
                    .filter((p) => p.categoryId === cat.id)
                    .map((p) => (
                      <li key={p.id} className="p-5 flex justify-between items-center">
                        <div>
                          <span className={`font-medium ${!p.isAvailable ? 'line-through text-slate-400' : ''}`}>
                            {p.name}
                          </span>
                          <p className="text-xs text-slate-400">
                            HTVA : {p.priceExclVat.toFixed(2)} € • TVA : {p.vatRate}%
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">{p.priceInclVat.toFixed(2)} €</span>
                          <button
                            onClick={() => handleToggleAvailability(p.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer"
                          >
                            {p.isAvailable ? 'Marquer épuisé' : 'Remettre en stock'}
                          </button>
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </section>
        </main>
      )}

      {activeTab === 'reports' && (
        <main className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">Synthèse Financière & Journal de Caisse</h2>
              <p className="text-sm text-slate-500">Chiffre d’affaires calculé sur les commandes encaissées (PAID)</p>
            </div>
            <a
              href={`${REPORT_API}/export.csv`}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition"
            >
              Télécharger le journal comptable (.CSV)
            </a>
          </div>

          {report && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Tickets encaissés</p>
                  <p className="text-2xl font-bold mt-1">{report.paidOrdersCount}</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">Chiffre d’affaires HTVA</p>
                  <p className="text-2xl font-bold mt-1">{report.totalExclVat.toFixed(2)} €</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <p className="text-xs text-slate-500 uppercase font-semibold">TVA Collectée</p>
                  <p className="text-2xl font-bold mt-1">{report.totalVat.toFixed(2)} €</p>
                </div>
                <div className="bg-emerald-50 p-5 rounded-xl border border-emerald-200 shadow-sm">
                  <p className="text-xs text-emerald-700 uppercase font-semibold">Total Encaissé TTC</p>
                  <p className="text-2xl font-bold text-emerald-900 mt-1">{report.totalInclVat.toFixed(2)} €</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <h3 className="font-semibold mb-3">Ventilation légale de la TVA (Belgique)</h3>
                {Object.keys(report.vatBreakdownByRate).length === 0 ? (
                  <p className="text-sm text-slate-400 italic">Aucune vente encaissée pour le moment.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(report.vatBreakdownByRate).map(([rate, amount]) => (
                      <div key={rate} className="p-4 rounded-lg bg-slate-50 border border-slate-200 flex justify-between items-center">
                        <span className="font-medium text-sm">Taux TVA {rate}</span>
                        <span className="font-bold">{amount.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </main>
      )}
    </div>
  );
}