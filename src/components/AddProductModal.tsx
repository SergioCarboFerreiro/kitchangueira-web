import { useState } from 'react';
import { api } from '../lib/api';

interface Props {
  localId: string;
  onSave: () => void;
  onClose: () => void;
}

const CATEGORIES = ['Carnes', 'Verduras', 'Lácteos', 'Cereales', 'Bebidas', 'Aceites', 'Otros'];
const UNITS = ['kg', 'g', 'L', 'ml', 'ud'];

export function AddProductModal({ localId, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [unit, setUnit] = useState(UNITS[0]);
  const [minQuantity, setMinQuantity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Create product
      const product = await api.createProduct({ name, category, unit });

      // Set minimum if provided
      if (minQuantity) {
        await api.submitStockCount(localId, [{ productId: product.id, quantity: 0 }]);
        // Set min via config endpoint
        const API_BASE = import.meta.env.VITE_API_URL || '';
        const token = localStorage.getItem('kitchangueira_token');
        await fetch(`${API_BASE}/api/stock/${localId}/config`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ productId: product.id, minQuantity: parseFloat(minQuantity) }),
        });
      }

      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-[90vw] max-w-[380px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Añadir producto</h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre del producto</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Tomate natural"
              autoFocus
              required
              className={inputClass}
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Categoría</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Unidad</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Stock mínimo (alerta cuando baje de aquí)</label>
            <input
              type="number"
              step="0.1"
              value={minQuantity}
              onChange={(e) => setMinQuantity(e.target.value)}
              placeholder="Ej: 2.0"
              className={inputClass}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !name} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
