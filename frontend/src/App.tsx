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
  customerEmail?: string;
  guestCount: number;
  reservationTime: string;
  status: 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED';
  tableId?: string;
  tableNumber?: number;
  zone?: string;
}

const MENU_API = 'http://localhost:8081/api/menu';
const ROOM_API = 'http://localhost:8081/api/room';

export default function App() {
  const [activeTab, setActiveTab] = useState<'menu' | 'room'>('room');

  // --- État Carte / Menu ---
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceExclVat, setPriceExclVat] = useState('');
  const [vatRate, setVatRate] = useState('12.00');
  const [categoryId, setCategoryId] = useState('');

  // --- État Plan de salle & Réservations ---
  const [tables, setTables] = useState<TableResto[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [guestCount, setGuestCount] = useState(2);
  const [reservationTime, setReservationTime] = useState(() => {
    const now = new Date();
    now.setHours(19, 30, 0, 0);
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [preferredTableId, setPreferredTableId] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

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
        setTables(await tabRes.json());
        setReservations(await resRes.json());
      }
    } catch {
      setFeedbackError('Impossible de joindre restaurant-service (port 8081).');
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
    const res = await fetch(`${ROOM_API}/reservations/${id}/status?status=${status}`, {
      method: 'PATCH',
    });
    if (res.ok) fetchAllData();
  };

  const seatedTableIds = new Set(
    reservations.filter((r) => r.status === 'SEATED' && r.tableId).map((r) => r.tableId!)
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white px-6 py-4 shadow">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight">RestoManager Pro</h1>
            <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-full">
              Port 8081
            </span>
          </div>

          <nav className="flex gap-2">
            <button
              onClick={() => setActiveTab('room')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'room'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Salle & Réservations
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'menu'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Carte & Menu
            </button>
          </nav>
        </div>
      </header>

      {feedbackError && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex justify-between">
            <span>{feedbackError}</span>
            <button onClick={() => setFeedbackError(null)} className="font-bold cursor-pointer">✕</button>
          </div>
        </div>
      )}

      {activeTab === 'room' ? (
        <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Formulaire de réservation */}
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
                  placeholder="Ex: Famille Dupont"
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
                  placeholder="0470 12 34 56"
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
                        Table {t.tableNumber} ({t.capacity} pers. - {t.zone})
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

          {/* Plan de salle & Liste des réservations */}
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4">Plan de salle en direct</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {tables.map((table) => {
                  const isOccupied = seatedTableIds.has(table.id);
                  return (
                    <div
                      key={table.id}
                      className={`p-4 rounded-xl border-2 transition ${
                        isOccupied
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-emerald-400 bg-emerald-50/60'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-base">Table {table.tableNumber}</span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isOccupied
                              ? 'bg-rose-200 text-rose-900'
                              : 'bg-emerald-200 text-emerald-900'
                          }`}
                        >
                          {isOccupied ? 'Occupée' : 'Libre'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{table.zone}</p>
                      <p className="text-xs font-medium text-slate-700 mt-1">
                        Capacité : {table.capacity} pers.
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                <h3 className="font-semibold text-slate-800">Réservations enregistrées</h3>
                <span className="text-xs text-slate-500">{reservations.length} réservation(s)</span>
              </div>

              {reservations.length === 0 ? (
                <p className="p-5 text-sm text-slate-400 italic">Aucune réservation pour le moment.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {reservations.map((r) => (
                    <li key={r.id} className="p-5 flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{r.customerName}</span>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {r.guestCount} pers. • Table {r.tableNumber ?? '?'}
                          </span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              r.status === 'CONFIRMED'
                                ? 'bg-blue-100 text-blue-800'
                                : r.status === 'SEATED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : r.status === 'CANCELLED'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {r.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          {new Date(r.reservationTime).toLocaleString('fr-BE')} • Tél : {r.customerPhone}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {r.status === 'CONFIRMED' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(r.id, 'SEATED')}
                              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-medium cursor-pointer"
                            >
                              Installer à table
                            </button>
                            <button
                              onClick={() => handleStatusChange(r.id, 'CANCELLED')}
                              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                            >
                              Annuler
                            </button>
                          </>
                        )}
                        {r.status === 'SEATED' && (
                          <button
                            onClick={() => handleStatusChange(r.id, 'COMPLETED')}
                            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-white hover:bg-slate-700 font-medium cursor-pointer"
                          >
                            Libérer la table
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </main>
      ) : (
        <main className="max-w-6xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-fit">
            <h2 className="text-lg font-semibold mb-4">Ajouter un article</h2>
            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nom du plat / boisson</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prix HTVA (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={priceExclVat}
                    onChange={(e) => setPriceExclVat(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Taux TVA</label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                  >
                    <option value="12.00">12% (Nourriture)</option>
                    <option value="21.00">21% (Boissons)</option>
                    <option value="6.00">6% (À emporter)</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-lg text-sm transition cursor-pointer"
              >
                Enregistrer à la carte
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 space-y-6">
            {categories.map((category) => {
              const catProducts = products.filter((p) => p.categoryId === category.id);
              return (
                <div key={category.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="font-semibold text-slate-800">{category.name}</h3>
                    <span className="text-xs text-slate-500">{catProducts.length} article(s)</span>
                  </div>
                  <ul className="divide-y divide-slate-100">
                    {catProducts.map((product) => (
                      <li key={product.id} className="p-5 flex items-center justify-between gap-4">
                        <div>
                          <span className={`font-medium ${!product.isAvailable ? 'line-through text-slate-400' : ''}`}>
                            {product.name}
                          </span>
                          {product.description && (
                            <p className="text-sm text-slate-500 mt-0.5">{product.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            HTVA : {product.priceExclVat.toFixed(2)} € • TVA : {product.vatRate}%
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-bold text-slate-900">{product.priceInclVat.toFixed(2)} €</span>
                          <button
                            onClick={() => handleToggleAvailability(product.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 cursor-pointer"
                          >
                            {product.isAvailable ? 'Marquer épuisé' : 'Remettre en stock'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </section>
        </main>
      )}
    </div>
  );
}