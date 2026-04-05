import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { WasteResponse, ProductResponse } from '../lib/api';

interface Props { localId: string }

const REASONS = [
  { value: 'preparation', label: 'Preparación' },
  { value: 'staff_food', label: 'Staff food' },
  { value: 'expired', label: 'Caducidad' },
  { value: 'breakage', label: 'Rotura' },
  { value: 'cooking_error', label: 'Error de cocina' },
  { value: 'other', label: 'Otro' },
];

const REASON_COLORS: Record<string, string> = {
  preparation: '#58a6ff', staff_food: '#28c840', expired: '#ff6b6b',
  breakage: '#f7c948', cooking_error: '#bc8cff', other: '#888',
};

export function WasteView({ localId }: Props) {
  const [entries, setEntries] = useState<WasteResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('preparation');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [w, p] = await Promise.all([api.getWaste(localId), api.getProducts()]);
      setEntries(w);
      setProducts(p);
      if (p.length > 0 && !productId) setProductId(p[0].id);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [localId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.registerWaste(localId, { productId, quantity: parseFloat(quantity), reason, notes: notes || undefined });
      setShowForm(false);
      setQuantity('');
      setNotes('');
      load();
    } finally { setSaving(false); }
  }

  const inputClass = "w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Merma</h3>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white">+ Registrar merma</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-4 space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Producto</label>
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className={inputClass}>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
              </select>
            </div>
            <div className="w-24">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Cantidad</label>
              <input type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className={inputClass} />
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Motivo</label>
            <div className="flex gap-2 flex-wrap">
              {REASONS.map((r) => (
                <button key={r.value} type="button" onClick={() => setReason(r.value)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${reason === r.value ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Nota (opcional)</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: Limpieza de cebollas" className={inputClass} />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)]">Cancelar</button>
            <button type="submit" disabled={saving || !quantity} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white disabled:opacity-50">
              {saving ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[var(--text-muted)]">Cargando...</div>
      ) : entries.length === 0 ? (
        <div className="text-center py-10 text-[var(--text-muted)]">No hay registros de merma</div>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
              <div className="w-2 h-8 rounded-full" style={{ background: REASON_COLORS[e.reason] || '#888' }} />
              <div className="flex-1">
                <div className="text-sm font-medium">{e.productName} — {e.quantity} {e.unit}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{e.reasonLabel}{e.notes ? ` · ${e.notes}` : ''} · {e.registeredBy} · {e.registeredAt.split('T')[0]}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
