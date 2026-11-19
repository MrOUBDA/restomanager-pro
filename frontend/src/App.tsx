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

const API_BASE = 'http://localhost:8081/api/menu';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceExclVat, setPriceExclVat] = useState('');
  const [vatRate, setVatRate] = useState('12.00');
  const [categoryId, setCategoryId] = useState('');

  const fetchMenu = async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        fetch(`${API_BASE}/categories`),
        fetch(`${API_BASE}/products`),
      ]);
      if (!catRes.ok || !prodRes.ok) throw new Error('Erreur lors du chargement de la carte');
      const catData: Category[] = await catRes.json();
      const prodData: Product[] = await prodRes.json();
      setCategories(catData);
      setProducts(prodData);
      if (catData.length > 0 && !categoryId) {
        setCategoryId(catData[0].id);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Serveur injoignable');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const handleAddProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!name || !priceExclVat || !categoryId) return;

    const res = await fetch(`${API_BASE}/products`, {
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
      fetchMenu();
    }
  };

  const handleToggleAvailability = async (id: string) => {
    const res = await fetch(`${API_BASE}/products/${id}/availability`, {
      method: 'PATCH',
    });
    if (res.ok) fetchMenu();
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="bg-slate-900 text-white px-6 py-4 shadow">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-tight">RestoManager Pro</h1>
          <span className="text-xs bg-emerald-600 px-2.5 py-1 rounded-full font-medium">
            Gestion de la Carte
          </span>
        </div>
      </header>

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
                placeholder="Ex: Filet américain préparé"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
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
                placeholder="Ingrédients, allergènes..."
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
                  placeholder="15.00"
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
          {loading && <p className="text-slate-500">Chargement de la carte...</p>}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
              {error} — Vérifiez que restaurant-service tourne sur le port 8081.
            </div>
          )}

          {categories.map((category) => {
            const catProducts = products.filter((p) => p.categoryId === category.id);
            return (
              <div key={category.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="bg-slate-100 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                  <h3 className="font-semibold text-slate-800">{category.name}</h3>
                  <span className="text-xs text-slate-500">{catProducts.length} article(s)</span>
                </div>

                {catProducts.length === 0 ? (
                  <p className="p-5 text-sm text-slate-400 italic">Aucun article dans cette catégorie.</p>
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {catProducts.map((product) => (
                      <li key={product.id} className="p-5 flex items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${!product.isAvailable ? 'line-through text-slate-400' : ''}`}>
                              {product.name}
                            </span>
                            {!product.isAvailable && (
                              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-medium">
                                Épuisé
                              </span>
                            )}
                          </div>
                          {product.description && (
                            <p className="text-sm text-slate-500 mt-0.5">{product.description}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            HTVA : {product.priceExclVat.toFixed(2)} € • TVA : {product.vatRate}%
                          </p>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          <span className="font-bold text-slate-900">
                            {product.priceInclVat.toFixed(2)} €
                          </span>
                          <button
                            onClick={() => handleToggleAvailability(product.id)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition cursor-pointer ${
                              product.isAvailable
                                ? 'border-slate-300 text-slate-700 hover:bg-slate-100'
                                : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {product.isAvailable ? 'Marquer épuisé' : 'Remettre en stock'}
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </section>
      </main>
    </div>
  );
}