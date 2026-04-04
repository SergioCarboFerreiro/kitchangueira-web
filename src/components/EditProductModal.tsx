import { useState } from 'react';
import type { StockDashboardItem } from '../lib/api';

interface Props {
  item: StockDashboardItem;
  localId: string;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const CATEGORIES = ['Carnes', 'Verduras', 'Lácteos', 'Cereales', 'Bebidas', 'Aceites', 'Otros'];
const UNITS = ['kg', 'g', 'L', 'ml', 'ud'];

export function EditProductModal({ item, localId, onSave, onDelete, onClose }: Props) {
  const [name, setName] = useState(item.productName);
  const [category, setCategory] = useState(item.category);
  const [unit, setUnit] = useState(item.unit);
  const [minQuantity, setMinQuantity] = useState(item.minQuantity.toString());
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const API_BASE = import.meta.env.VITE_API_URL || '';
      const token = localStorage.getItem('kitchangueira_token');
      const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

      // Update product name/category/unit
      await fetch(`${API_BASE}/api/products/${item.productId}`, {
        method: 'PUT', headers,
        body: JSON.stringify({ name, category, unit }),
      });

      // Update min quantity
      await fetch(`${API_BASE}/api/stock/${localId}/config`, {
        method: 'POST', headers,
        body: JSON.stringify({ productId: item.productId, minQuantity: parseFloat(minQuantity) || 0 }),
      });

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
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 w-[380px]" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">Editar producto</h3>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
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
            <label className="text-xs text-[var(--text-muted)] block mb-1">Stock mínimo (alerta)</label>
            <input type="number" step="0.1" value={minQuantity} onChange={(e) => setMinQuantity(e.target.value)} className={inputClass} />
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
              Cancelar
            </button>
            <button type="submit" disabled={saving || !name} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>

          {/* Delete section */}
          <div className="pt-3 border-t border-[var(--border)]">
            {confirming ? (
              <div className="flex gap-2 items-center">
                <span className="text-xs text-[var(--danger)] flex-1">¿Seguro? Se desactivará el producto</span>
                <button type="button" onClick={() => setConfirming(false)} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)]">No</button>
                <button type="button" onClick={onDelete} className="px-3 py-1.5 text-xs rounded-lg bg-[var(--danger)] text-white">Sí, eliminar</button>
              </div>
            ) : (
              <button type="button" onClick={() => setConfirming(true)} className="text-xs text-[var(--danger)] hover:underline">
                Eliminar producto
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
