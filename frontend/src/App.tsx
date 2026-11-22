import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';

interface AuthSession {
  token: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'WAITER' | 'KITCHEN';
}

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
  posX: number;
  posY: number;
}

interface Reservation {
  id: string;
  customerName: string;
  customerPhone: string;
  guestCount: number;
  reservationTime: string;
  status: 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';
  isDelayed?: boolean;
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

const AUTH_API = 'http://localhost:8081/api/auth';
const MENU_API = 'http://localhost:8081/api/menu';
const ROOM_API = 'http://localhost:8081/api/room';
const ORDER_API = 'http://localhost:8082/api/orders';
const REPORT_API = 'http://localhost:8082/api/reports';

export default function App() {
  const [session, setSession] = useState<AuthSession | null>(() => {
    const saved = localStorage.getItem('restomanager_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginEmail, setLoginEmail] = useState('admin@restomanager.be');
  const [loginPassword, setLoginPassword] = useState('password123');
  const [loginError, setLoginError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'orders' | 'room' | 'menu' | 'sales-stats' | 'reports'>('orders');

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
  const [newTableNumber, setNewTableNumber] = useState('');
  const [newTableCapacity, setNewTableCapacity] = useState(4);
  const [newTableZone, setNewTableZone] = useState('Salle principale');
  const [floorZoneFilter, setFloorZoneFilter] = useState<'Salle principale' | 'Terrasse'>('Salle principale');
  const [reservationCategoryFilter, setReservationCategoryFilter] = useState<'ACTIVE' | 'DELAYED' | 'HISTORY' | 'ALL'>('ACTIVE');
  const [orderStatsScope, setOrderStatsScope] = useState<'TODAY' | 'ALL'>('ALL');
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);

  const [selectedTableId, setSelectedTableId] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState('0');
  const [directService, setDirectService] = useState(false);

  const authHeaders = () => ({
    'Content-Type': 'application/json',
    ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
  });

  const performLogin = async (email: string, password: string) => {
    setLoginError(null);
    try {
      const res = await fetch(`${AUTH_API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        setLoginError('Email ou mot de passe incorrect.');
        return;
      }
      const data: AuthSession = await res.json();
      localStorage.setItem('restomanager_session', JSON.stringify(data));
      setSession(data);
    } catch {
      setLoginError('Impossible de joindre restaurant-service (port 8081).');
    }
  };

  const handleLoginSubmit = (e: FormEvent) => {
    e.preventDefault();
    performLogin(loginEmail, loginPassword);
  };

  const handleLogout = () => {
    localStorage.removeItem('restomanager_session');
    setSession(null);
  };

  const fetchAllData = async () => {
    if (!session) return;
    try {
      const [catRes, prodRes, tabRes, resRes] = await Promise.all([
        fetch(`${MENU_API}/categories`, { headers: authHeaders() }),
        fetch(`${MENU_API}/products`, { headers: authHeaders() }),
        fetch(`${ROOM_API}/tables`, { headers: authHeaders() }),
        fetch(`${ROOM_API}/reservations`, { headers: authHeaders() }),
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
      const ordRes = await fetch(ORDER_API, { headers: authHeaders() });
      if (ordRes.ok) setOrders(await ordRes.json());

      if (session.role === 'ADMIN') {
        const repRes = await fetch(`${REPORT_API}/summary`, { headers: authHeaders() });
        if (repRes.ok) setReport(await repRes.json());
      }
    } catch {
      // order-service peut redémarrer
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">RestoManager Pro</h1>
            <p className="text-sm text-slate-500 mt-1">Connexion sécurisée JWT — Personnel Horeca</p>
          </div>

          {loginError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email professionnel</label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg text-sm transition cursor-pointer"
            >
              Se connecter
            </button>
          </form>

          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs text-slate-500 text-center mb-2">Connexion rapide par rôle (Démo) :</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => performLogin('admin@restomanager.be', 'password123')}
                className="text-xs py-2 px-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium cursor-pointer"
              >
                Gérant (ADMIN)
              </button>
              <button
                type="button"
                onClick={() => performLogin('serveur@restomanager.be', 'password123')}
                className="text-xs py-2 px-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium cursor-pointer"
              >
                Salle (WAITER)
              </button>
              <button
                type="button"
                onClick={() => performLogin('cuisine@restomanager.be', 'password123')}
                className="text-xs py-2 px-2 rounded-lg border border-slate-300 hover:bg-slate-100 font-medium cursor-pointer"
              >
                Chef (KITCHEN)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${MENU_API}/products`, {
      method: 'POST',
      headers: authHeaders(),
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
    } else {
      setFeedbackError('Action réservée au rôle ADMIN.');
    }
  };

  const handleToggleAvailability = async (id: string) => {
    const res = await fetch(`${MENU_API}/products/${id}/availability`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (res.ok) fetchAllData();
    else setFeedbackError('Action réservée aux rôles ADMIN ou KITCHEN.');
  };

  const handleCreateReservation = async (e: FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    const res = await fetch(`${ROOM_API}/reservations`, {
      method: 'POST',
      headers: authHeaders(),
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
      const data = await res.json().catch(() => ({ error: 'Créneau indisponible ou accès refusé' }));
      setFeedbackError(data.error || 'Créneau indisponible');
    }
  };

  const handleCreateTable = async (e: FormEvent) => {
    e.preventDefault();
    setFeedbackError(null);
    const res = await fetch(`${ROOM_API}/tables`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({
        tableNumber: parseInt(newTableNumber, 10),
        capacity: newTableCapacity,
        zone: newTableZone,
      }),
    });
    if (res.ok) {
      setNewTableNumber('');
      fetchAllData();
    } else {
      const data = await res.json().catch(() => ({ error: 'Erreur ajout table' }));
      setFeedbackError(data.error || 'Impossible d’ajouter la table');
    }
  };

  const handleSaveTablePosition = async (tableId: string, posX: number, posY: number) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, posX, posY } : t))
    );
    await fetch(`${ROOM_API}/tables/${tableId}/position`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ posX, posY }),
    });
  };

  const handleDeleteTable = async (id: string, tableNumber: number) => {
    setFeedbackError(null);
    const res = await fetch(`${ROOM_API}/tables/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (res.ok) {
      fetchAllData();
    } else {
      const data = await res.json().catch(() => ({ error: `Impossible de supprimer la table ${tableNumber}` }));
      setFeedbackError(data.error || 'Table liée à une réservation active');
    }
  };

  const handlePostponeReservation = async (resItem: Reservation, minutesToAdd = 20) => {
    const baseDate = new Date(resItem.reservationTime);
    baseDate.setMinutes(baseDate.getMinutes() + minutesToAdd);
    const pad = (n: number) => String(n).padStart(2, '0');
    const formatted = `${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}T${pad(baseDate.getHours())}:${pad(baseDate.getMinutes())}:00`;

    const res = await fetch(`${ROOM_API}/reservations/${resItem.id}/postpone`, {
      method: 'PATCH',
      headers: authHeaders(),
      body: JSON.stringify({ newReservationTime: formatted }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Impossible de repousser la réservation' }));
      setFeedbackError(err.error || err.message || 'Impossible de repousser la réservation');
      return;
    }
    setFeedbackError(null);
    fetchAllData();
  };

  const handleStatusChange = async (id: string, status: Reservation['status']) => {
    const res = await fetch(`${ROOM_API}/reservations/${id}/status?status=${status}`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
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
        headers: authHeaders(),
        body: JSON.stringify({
          tableId: selectedTableId,
          discountAmount: parseFloat(discountAmount) || 0,
          directService,
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
        setDirectService(false);
        fetchAllData();
      } else {
        setFeedbackError('Accès refusé ou produit épuisé.');
      }
    } catch {
      setFeedbackError('order-service (port 8082) est injoignable.');
    }
  };

  const handleOrderStatus = async (orderId: string, status: Order['status']) => {
    const res = await fetch(`${ORDER_API}/${orderId}/status?status=${status}`, {
      method: 'PATCH',
      headers: authHeaders(),
    });
    if (res.ok) fetchAllData();
  };

  const handleDownloadCsv = async () => {
    const res = await fetch(`${REPORT_API}/export.csv`, { headers: authHeaders() });
    if (!res.ok) {
      setFeedbackError('Export CSV réservé au rôle ADMIN.');
      return;
    }
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'journal-ventes.csv';
    a.click();
    window.URL.revokeObjectURL(url);
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
            <span className="text-xs bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              {session.fullName} • {session.role}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'orders' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Commandes & KDS
              </button>
              {true && (
                <button
                  onClick={() => setActiveTab('room')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    activeTab === 'room' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Salle & Réservations
                </button>
              )}
              <button
                onClick={() => setActiveTab('menu')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'menu' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Carte & Menu
              </button>
              <button
                onClick={() => setActiveTab('sales-stats')}
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                  activeTab === 'sales-stats' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Statistique des ventes
              </button>
              {session.role === 'ADMIN' && (
                <button
                  onClick={() => {
                    setActiveTab('reports');
                    fetchAllData();
                  }}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                    activeTab === 'reports' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Rapports & CSV
                </button>
              )}
            </nav>

            <button
              onClick={handleLogout}
              className="ml-2 px-3 py-2 rounded-lg text-xs font-medium bg-rose-600/20 text-rose-300 hover:bg-rose-600/30 border border-rose-500/30 cursor-pointer"
            >
              Déconnexion
            </button>
          </div>
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
          {session.role !== 'KITCHEN' && (
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
                          placeholder="Note cuisine (ex: cuisson bleue...)"
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
          )}

          <section className={`${session.role === 'KITCHEN' ? 'lg:col-span-12' : 'lg:col-span-7'} space-y-6`}>
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="text-lg font-semibold">Écran Cuisine (KDS) & Suivi des tickets</h2>
              <button
                type="button"
                onClick={fetchAllData}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
              >
                Rafraîchir
              </button>
            </div>


            {orders.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-sm text-slate-400">
                Aucune commande enregistrée.
              </div>
            ) : (() => {
              const sortedOrders = orders
                .slice()
                .sort(
                  (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

              const ordersByDay = sortedOrders.reduce<Record<string, Order[]>>((acc, order) => {
                const d = new Date(order.createdAt);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                  d.getDate()
                ).padStart(2, '0')}`;
                if (!acc[key]) acc[key] = [];
                acc[key].push(order);
                return acc;
              }, {});

              const formatOrderDayLabel = (dayKey: string) => {
                const [y, m, d] = dayKey.split('-').map(Number);
                const target = new Date(y, m - 1, d);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.round(
                  (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
                );
                const fullLabel = target.toLocaleDateString('fr-BE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });
                if (diffDays === 0) return `Aujourd'hui — ${fullLabel}`;
                if (diffDays === -1) return `Hier — ${fullLabel}`;
                return fullLabel.charAt(0).toUpperCase() + fullLabel.slice(1);
              };

              return (
                <div className="space-y-6">
                  {Object.entries(ordersByDay).map(([dayKey, dayOrders]) => {
                    const dayRevenueInclVat = dayOrders
                      .filter((o) => o.status !== 'CANCELLED')
                      .reduce((sum, o) => sum + o.totalInclVat, 0);

                    return (
                      <div key={dayKey} className="space-y-3">
                        <div className="bg-slate-800 text-white px-4 py-2.5 rounded-xl flex flex-wrap justify-between items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wide">
                            {formatOrderDayLabel(dayKey)}
                          </span>
                          <span className="text-xs text-slate-200 font-medium">
                            {dayOrders.length} commande{dayOrders.length > 1 ? 's' : ''} • Total TTC :{' '}
                            <strong className="text-emerald-400">
                              {dayRevenueInclVat.toFixed(2)} €
                            </strong>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dayOrders.map((order) => (
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
                                  <div>
                                    <span className="font-bold text-base">
                                      Table {order.tableNumber}
                                    </span>
                                    <span className="text-xs text-slate-400 ml-2">
                                      {new Date(order.createdAt).toLocaleTimeString('fr-BE', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
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
                                        <span className="text-slate-600">
                                          {item.lineTotalInclVat.toFixed(2)} €
                                        </span>
                                      </div>
                                      {item.notes && (
                                        <p className="text-xs text-amber-700 font-medium mt-0.5">
                                          Note : {item.notes}
                                        </p>
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
                                      onClick={() =>
                                        handleOrderStatus(order.id, 'IN_PREPARATION')
                                      }
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
                                  {order.status === 'READY' && session.role !== 'KITCHEN' && (
                                    <button
                                      onClick={() => handleOrderStatus(order.id, 'SERVED')}
                                      className="flex-1 text-xs py-2 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 cursor-pointer"
                                    >
                                      Marquer servi
                                    </button>
                                  )}
                                  {order.status === 'SERVED' && session.role !== 'KITCHEN' && (
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
                      </div>
                    );
                  })}
                </div>
              );
            })()}
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

            {session.role === 'ADMIN' && (
              <div className="border-t border-slate-200 mt-6 pt-6">
                <h3 className="text-base font-semibold mb-3">Configuration des tables (Admin)</h3>
                <form onSubmit={handleCreateTable} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">N° de table</label>
                      <input
                        type="number"
                        min={1}
                        required
                        placeholder="Ex: 7"
                        value={newTableNumber}
                        onChange={(e) => setNewTableNumber(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Places</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        required
                        value={newTableCapacity}
                        onChange={(e) => setNewTableCapacity(parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Zone</label>
                    <select
                      value={newTableZone}
                      onChange={(e) => setNewTableZone(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="Salle principale">Salle principale</option>
                      <option value="Terrasse">Terrasse</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition cursor-pointer"
                  >
                    Ajouter la table
                  </button>
                </form>
              </div>
            )}
          </section>

          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-wrap justify-between items-center gap-3">
                <div>
                  <h2 className="text-lg font-semibold">Plan architectural des tables</h2>
                  <p className="text-xs text-slate-500">
                    {session.role === 'ADMIN'
                      ? 'Mode édition : glissez-déposez les tables pour reproduire la disposition du restaurant.'
                      : 'Vue temps réel synchronisée avec la disposition définie par la direction.'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                      Occupée
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                      À régler
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-sky-500 inline-block"></span>
                      Réservée
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
                      Retard résa
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 rounded-full bg-slate-300 border border-slate-400 inline-block"></span>
                      Libre
                    </span>
                  </div>

                  <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-slate-100">
                    {(['Salle principale', 'Terrasse'] as const).map((zone) => (
                      <button
                        key={zone}
                        type="button"
                        onClick={() => setFloorZoneFilter(zone)}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition cursor-pointer ${
                          floorZoneFilter === zone
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {zone}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div
                onPointerMove={(e) => {
                  if (!draggingTableId || session.role !== 'ADMIN') return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const rawX = Math.round(((e.clientX - rect.left) / rect.width) * 100) - 6;
                  const rawY = Math.round(((e.clientY - rect.top) / rect.height) * 100) - 8;
                  const clampedX = Math.max(2, Math.min(82, rawX));
                  const clampedY = Math.max(4, Math.min(78, rawY));
                  setTables((prev) =>
                    prev.map((t) =>
                      t.id === draggingTableId ? { ...t, posX: clampedX, posY: clampedY } : t
                    )
                  );
                }}
                onPointerUp={() => {
                  if (!draggingTableId || session.role !== 'ADMIN') return;
                  const moved = tables.find((t) => t.id === draggingTableId);
                  setDraggingTableId(null);
                  if (moved) {
                    handleSaveTablePosition(moved.id, moved.posX ?? 15, moved.posY ?? 20);
                  }
                }}
                className={`relative w-full h-96 rounded-xl border-2 border-dashed overflow-hidden select-none ${
                  floorZoneFilter === 'Terrasse'
                    ? 'bg-amber-50/40 border-amber-300'
                    : 'bg-slate-100/80 border-slate-300'
                }`}
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(148,163,184,0.35) 1px, transparent 1px)',
                  backgroundSize: '24px 24px',
                }}
              >
                <div className="absolute top-2 left-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 pointer-events-none">
                  {floorZoneFilter === 'Salle principale' ? 'Entrée & Comptoir Bar' : 'Espace Extérieur — Terrasse'}
                </div>

                {tables
                  .filter((t) => t.zone === floorZoneFilter)
                  .map((table) => {
                    const now = Date.now();
                    const tableOrders = orders.filter(
                      (o) =>
                        o.tableId === table.id &&
                        o.status !== 'PAID' &&
                        o.status !== 'CANCELLED'
                    );
                    const needsPayment = tableOrders.some((o) => o.status === 'SERVED');
                    const isOccupied = seatedTableIds.has(table.id) || tableOrders.length > 0;

                    const confirmedRes = reservations
                      .filter((r) => r.tableId === table.id && r.status === 'CONFIRMED')
                      .sort(
                        (a, b) =>
                          new Date(a.reservationTime).getTime() -
                          new Date(b.reservationTime).getTime()
                      )[0];

                    const resTime = confirmedRes
                      ? new Date(confirmedRes.reservationTime).getTime()
                      : null;
                    const isLateReservation =
                      !isOccupied &&
                      resTime !== null &&
                      (Boolean(confirmedRes?.isDelayed) || now - resTime > 10 * 60 * 1000);
                    const isReserved =
                      !isOccupied &&
                      !isLateReservation &&
                      resTime !== null &&
                      resTime - now <= 2 * 60 * 60 * 1000;

                    let statusLabel = 'Libre';
                    let cardStyle = 'bg-slate-200 border-slate-400 text-slate-800';
                    let badgeStyle = 'bg-slate-300 text-slate-700';
                    let hasDarkBg = false;

                    if (needsPayment) {
                      statusLabel = 'À régler';
                      cardStyle = 'bg-amber-500 border-amber-700 text-white';
                      badgeStyle = 'bg-amber-700/60 text-white';
                      hasDarkBg = true;
                    } else if (isOccupied) {
                      statusLabel = 'Occupée';
                      cardStyle = 'bg-emerald-500 border-emerald-700 text-white';
                      badgeStyle = 'bg-emerald-700/60 text-white';
                      hasDarkBg = true;
                    } else if (isLateReservation) {
                      statusLabel = 'Retard résa';
                      cardStyle = 'bg-rose-600 border-rose-800 text-white';
                      badgeStyle = 'bg-rose-800/70 text-white';
                      hasDarkBg = true;
                    } else if (isReserved) {
                      statusLabel = 'Réservée';
                      cardStyle = 'bg-sky-500 border-sky-700 text-white';
                      badgeStyle = 'bg-sky-700/60 text-white';
                      hasDarkBg = true;
                    }

                    return (
                      <div
                        key={table.id}
                        onPointerDown={(e) => {
                          if (session.role === 'ADMIN') {
                            e.currentTarget.setPointerCapture(e.pointerId);
                            setDraggingTableId(table.id);
                          }
                        }}
                        style={{
                          left: `${table.posX ?? 15}%`,
                          top: `${table.posY ?? 20}%`,
                        }}
                        className={`absolute w-32 p-2.5 rounded-xl border-2 shadow-sm transition-colors ${
                          session.role === 'ADMIN' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
                        } ${cardStyle}`}
                      >
                        <div className="flex justify-between items-center gap-1">
                          <span className="font-bold text-sm">T{table.tableNumber}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded whitespace-nowrap ${badgeStyle}`}
                          >
                            {statusLabel}
                          </span>
                        </div>
                        <div className="flex justify-between items-center mt-1.5 text-[11px]">
                          <span>{table.capacity} pers.</span>
                          {session.role === 'ADMIN' && (
                            <button
                              type="button"
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => handleDeleteTable(table.id, table.tableNumber)}
                              className={`underline font-medium cursor-pointer ${
                                hasDarkBg ? 'text-white/90 hover:text-white' : 'text-rose-700 hover:text-rose-900'
                              }`}
                            >
                              Suppr.
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {(() => {
              const nowMs = Date.now();
              const isLate = (r: Reservation) =>
                r.status === 'CONFIRMED' &&
                (Boolean(r.isDelayed) || nowMs - new Date(r.reservationTime).getTime() > 10 * 60 * 1000);

              const activeReservations = reservations.filter(
                (r) => r.status === 'CONFIRMED' || r.status === 'SEATED'
              );
              const delayedReservations = reservations.filter(isLate);
              const historyReservations = reservations.filter(
                (r) => r.status === 'COMPLETED' || r.status === 'CANCELLED'
              );

              const filteredReservations = (
                reservationCategoryFilter === 'ACTIVE'
                  ? activeReservations
                  : reservationCategoryFilter === 'DELAYED'
                  ? delayedReservations
                  : reservationCategoryFilter === 'HISTORY'
                  ? historyReservations
                  : reservations
              )
                .slice()
                .sort((a, b) => {
                  const diff =
                    new Date(a.reservationTime).getTime() - new Date(b.reservationTime).getTime();
                  return reservationCategoryFilter === 'HISTORY' ? -diff : diff;
                });

              const groupedByDay = filteredReservations.reduce<Record<string, Reservation[]>>(
                (acc, item) => {
                  const d = new Date(item.reservationTime);
                  const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                    d.getDate()
                  ).padStart(2, '0')}`;
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(item);
                  return acc;
                },
                {}
              );

              const formatDayHeading = (dayKey: string) => {
                const [y, m, d] = dayKey.split('-').map(Number);
                const target = new Date(y, m - 1, d);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.round(
                  (target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)
                );
                const fullLabel = target.toLocaleDateString('fr-BE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });
                if (diffDays === 0) return `Aujourd'hui — ${fullLabel}`;
                if (diffDays === 1) return `Demain — ${fullLabel}`;
                if (diffDays === -1) return `Hier — ${fullLabel}`;
                return fullLabel.charAt(0).toUpperCase() + fullLabel.slice(1);
              };

              const statusBadge = (r: Reservation) => {
                if (r.status === 'SEATED') {
                  return (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Installé
                    </span>
                  );
                }
                if (isLate(r)) {
                  return (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-rose-100 text-rose-700">
                      {r.isDelayed ? 'Retard (repoussée)' : 'En retard'}
                    </span>
                  );
                }
                if (r.status === 'CONFIRMED') {
                  return (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                      Confirmée
                    </span>
                  );
                }
                if (r.status === 'COMPLETED') {
                  return (
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      Terminée
                    </span>
                  );
                }
                return (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Annulée
                  </span>
                );
              };

              return (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                    <h3 className="font-semibold text-slate-800">
                      Réservations ({filteredReservations.length})
                    </h3>

                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: 'ACTIVE', label: `En cours / À venir (${activeReservations.length})` },
                        { id: 'DELAYED', label: `Retards (${delayedReservations.length})` },
                        { id: 'HISTORY', label: `Historique (${historyReservations.length})` },
                        { id: 'ALL', label: `Toutes (${reservations.length})` },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() =>
                            setReservationCategoryFilter(
                              tab.id as 'ACTIVE' | 'DELAYED' | 'HISTORY' | 'ALL'
                            )
                          }
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                            reservationCategoryFilter === tab.id
                              ? 'bg-slate-900 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {Object.keys(groupedByDay).length === 0 ? (
                    <p className="p-6 text-sm text-slate-500 text-center">
                      Aucune réservation dans cette catégorie.
                    </p>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {Object.entries(groupedByDay).map(([dayKey, dayItems]) => {
                        const totalGuests = dayItems.reduce((sum, item) => sum + item.guestCount, 0);
                        return (
                          <div key={dayKey}>
                            <div className="bg-slate-50 px-5 py-2.5 border-b border-slate-200 flex justify-between items-center">
                              <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                                {formatDayHeading(dayKey)}
                              </span>
                              <span className="text-xs font-medium text-slate-500">
                                {dayItems.length} résa{dayItems.length > 1 ? 's' : ''} • {totalGuests} couvert{totalGuests > 1 ? 's' : ''}
                              </span>
                            </div>

                            <ul className="divide-y divide-slate-100">
                              {dayItems.map((r) => (
                                <li
                                  key={r.id}
                                  className="p-4 px-5 flex flex-wrap justify-between items-center gap-4 hover:bg-slate-50/70"
                                >
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-bold text-slate-900">
                                        {new Date(r.reservationTime).toLocaleTimeString('fr-BE', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                      <span className="font-semibold text-slate-800">
                                        {r.customerName}
                                      </span>
                                      <span className="text-sm text-slate-600">
                                        — Table {r.tableNumber} ({r.guestCount} pers.)
                                      </span>
                                      {statusBadge(r)}
                                    </div>
                                    {r.customerPhone && (
                                      <p className="text-xs text-slate-500 mt-0.5">
                                        Tél. : {r.customerPhone}
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex gap-2">
                                    {r.status === 'CONFIRMED' && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handlePostponeReservation(r, 20)}
                                          className="text-xs px-3 py-1.5 rounded-lg bg-rose-600 text-white cursor-pointer hover:bg-rose-700"
                                        >
                                          +20 min (Retard)
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleStatusChange(r.id, 'SEATED')}
                                          className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer hover:bg-emerald-700"
                                        >
                                          Installer
                                        </button>
                                      </>
                                    )}
                                    {r.status === 'SEATED' && (
                                      <button
                                        type="button"
                                        onClick={() => handleStatusChange(r.id, 'COMPLETED')}
                                        className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-white cursor-pointer hover:bg-slate-900"
                                      >
                                        Libérer
                                      </button>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
          </section>
        </main>
      )}

      {activeTab === 'menu' && (
        <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {session.role === 'ADMIN' && (
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
          )}

          <section className={`${session.role === 'ADMIN' ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
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
                          {session.role !== 'WAITER' && (
                            <button
                              onClick={() => handleToggleAvailability(p.id)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 cursor-pointer"
                            >
                              {p.isAvailable ? 'Marquer épuisé' : 'Remettre en stock'}
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </section>
        </main>
      )}

      {activeTab === 'sales-stats' && (
        <main className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Statistique des ventes</h2>
              <p className="text-xs text-slate-500">
                Analyse détaillée des produits commandés regroupés par catégorie (hors commandes annulées).
              </p>
            </div>
            <button
              type="button"
              onClick={fetchAllData}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 cursor-pointer"
            >
              Rafraîchir les données
            </button>
          </div>

          {(() => {
            const todayStr = new Date().toDateString();
            const scopedOrders = orders.filter(
              (o) =>
                o.status !== 'CANCELLED' &&
                (orderStatsScope === 'ALL' ||
                  new Date(o.createdAt).toDateString() === todayStr)
            );

            const categoryByProductName = new Map<string, string>();
            products.forEach((p) => categoryByProductName.set(p.name, p.categoryName || 'Autres'));

            type ProductStat = {
              productName: string;
              category: string;
              quantity: number;
              revenueInclVat: number;
            };

            const productStatsMap = new Map<string, ProductStat>();
            scopedOrders.forEach((order) => {
              order.items.forEach((item) => {
                const category = categoryByProductName.get(item.productName) || 'Autres';
                const key = `${category}::${item.productName}`;
                const existing = productStatsMap.get(key);
                if (existing) {
                  existing.quantity += item.quantity;
                  existing.revenueInclVat += item.lineTotalInclVat;
                } else {
                  productStatsMap.set(key, {
                    productName: item.productName,
                    category,
                    quantity: item.quantity,
                    revenueInclVat: item.lineTotalInclVat,
                  });
                }
              });
            });

            const allProductStats = Array.from(productStatsMap.values()).sort((a, b) =>
              a.category === b.category
                ? b.quantity - a.quantity
                : a.category.localeCompare(b.category, 'fr')
            );

            const totalUnitsSold = allProductStats.reduce((s, p) => s + p.quantity, 0);
            const totalCategoryRevenue = allProductStats.reduce(
              (s, p) => s + p.revenueInclVat,
              0
            );

            const categoryTotals = allProductStats.reduce<
              Record<string, { quantity: number; revenueInclVat: number }>
            >((acc, row) => {
              if (!acc[row.category]) acc[row.category] = { quantity: 0, revenueInclVat: 0 };
              acc[row.category].quantity += row.quantity;
              acc[row.category].revenueInclVat += row.revenueInclVat;
              return acc;
            }, {});

            return (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-5 py-3.5 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
                  <div>
                    <h3 className="font-semibold text-slate-800 text-sm">
                      Produits commandés par catégorie
                    </h3>
                    <p className="text-xs text-slate-500">
                      {totalUnitsSold} article{totalUnitsSold > 1 ? 's' : ''} commandé
                      {totalUnitsSold > 1 ? 's' : ''} • CA TTC : {totalCategoryRevenue.toFixed(2)} €
                    </p>
                  </div>

                  <div className="inline-flex rounded-lg border border-slate-300 p-0.5 bg-white">
                    <button
                      type="button"
                      onClick={() => setOrderStatsScope('TODAY')}
                      className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                        orderStatsScope === 'TODAY'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Aujourd'hui
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderStatsScope('ALL')}
                      className={`px-3 py-1 rounded-md text-xs font-medium cursor-pointer ${
                        orderStatsScope === 'ALL'
                          ? 'bg-emerald-600 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Toutes les journées
                    </button>
                  </div>
                </div>

                {allProductStats.length === 0 ? (
                  <p className="p-8 text-sm text-slate-500 text-center">
                    Aucun produit commandé sur cette période.
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase">
                          <th className="py-3 px-5 font-semibold">Catégorie</th>
                          <th className="py-3 px-5 font-semibold">Produit</th>
                          <th className="py-3 px-5 font-semibold text-right">Qté</th>
                          <th className="py-3 px-5 font-semibold text-right">Part (%)</th>
                          <th className="py-3 px-5 font-semibold text-right">Total TTC</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {allProductStats.map((row) => {
                          const share =
                            totalUnitsSold > 0
                              ? Math.round((row.quantity / totalUnitsSold) * 100)
                              : 0;
                          return (
                            <tr
                              key={`${row.category}-${row.productName}`}
                              className="hover:bg-slate-50/80"
                            >
                              <td className="py-2.5 px-5">
                                <span className="px-2.5 py-0.5 rounded text-xs bg-slate-100 text-slate-700 font-medium">
                                  {row.category}
                                </span>
                              </td>
                              <td className="py-2.5 px-5 font-medium text-slate-900">
                                {row.productName}
                              </td>
                              <td className="py-2.5 px-5 text-right font-semibold text-slate-800">
                                {row.quantity}
                              </td>
                              <td className="py-2.5 px-5 text-right text-slate-500">{share}%</td>
                              <td className="py-2.5 px-5 text-right font-semibold text-emerald-700">
                                {row.revenueInclVat.toFixed(2)} €
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="bg-slate-50 border-t border-slate-200 text-xs">
                        {Object.entries(categoryTotals).map(([cat, stats]) => (
                          <tr key={`subtotal-${cat}`} className="text-slate-700">
                            <td className="py-2 px-5 font-semibold" colSpan={2}>
                              Sous-total — {cat}
                            </td>
                            <td className="py-2 px-5 text-right font-bold">{stats.quantity}</td>
                            <td className="py-2 px-5 text-right text-slate-500">
                              {totalUnitsSold > 0
                                ? Math.round((stats.quantity / totalUnitsSold) * 100)
                                : 0}
                              %
                            </td>
                            <td className="py-2 px-5 text-right font-bold text-slate-900">
                              {stats.revenueInclVat.toFixed(2)} €
                            </td>
                          </tr>
                        ))}
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </main>
      )}

      {activeTab === 'reports' && session.role === 'ADMIN' && (
        <main className="max-w-5xl mx-auto p-6 space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">Synthèse Financière & Journal de Caisse</h2>
              <p className="text-sm text-slate-500">Chiffre d’affaires calculé sur les commandes encaissées (PAID)</p>
            </div>
            <button
              onClick={handleDownloadCsv}
              className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              Télécharger le journal comptable (.CSV)
            </button>
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
