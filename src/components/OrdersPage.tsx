import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { OrderListItem, OrderResponse, SupplierResponse, ProductResponse, StockDashboardItem } from '../lib/api';

interface Props {
  localId: string;
  onBack: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Borrador', color: '#f7c948', bg: '#2a2a1a' },
  sent: { label: 'Enviado', color: '#58a6ff', bg: '#1a2a3a' },
  confirmed: { label: 'Confirmado', color: '#28c840', bg: '#1a3a2a' },
  delivered: { label: 'Entregado', color: '#888', bg: '#1a1a1a' },
};

type View = 'list' | 'detail' | 'create';

export function OrdersPage({ localId, onBack }: Props) {
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderResponse | null>(null);
  const [view, setView] = useState<View>('list');
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<SupplierResponse[]>([]);
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [alerts, setAlerts] = useState<StockDashboardItem[]>([]);

  // Create form state
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [orderLines, setOrderLines] = useState<{ productId: string; quantity: string; unit: string }[]>([]);
  const [orderNotes, setOrderNotes] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadOrders() {
    setLoading(true);
    try {
      const data = await api.getOrders(localId);
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadOrders(); }, [localId]);

  async function startCreate() {
    const [s, p, a] = await Promise.all([
      api.getSuppliers(),
      api.getProducts(),
      api.getStockAlerts(localId),
    ]);
    setSuppliers(s);
    setProducts(p);
    setAlerts(a);
    setSelectedSupplier(s[0]?.id || '');
    // Pre-fill with alert products
    setOrderLines(a.map((item) => ({
      productId: item.productId,
      quantity: Math.max(item.minQuantity - item.currentQuantity, 1).toFixed(1),
      unit: item.unit,
    })));
    setOrderNotes('');
    setView('create');
  }

  async function handleCreate() {
    if (!selectedSupplier || orderLines.length === 0) return;
    setSaving(true);
    try {
      const validLines = orderLines.filter((l) => l.productId && parseFloat(l.quantity) > 0);
      await api.createOrder(localId, {
        supplierId: selectedSupplier,
        lines: validLines.map((l) => ({ productId: l.productId, quantity: parseFloat(l.quantity), unit: l.unit })),
        notes: orderNotes || undefined,
      });
      setView('list');
      loadOrders();
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectOrder(id: string) {
    const order = await api.getOrder(id);
    setSelectedOrder(order);
    setView('detail');
  }

  async function handleSend(id: string) {
    await api.sendOrder(id);
    handleSelectOrder(id);
    loadOrders();
  }

  async function handleDeliver(id: string) {
    await api.deliverOrder(id);
    handleSelectOrder(id);
    loadOrders();
  }

  function addLine() {
    const firstProduct = products[0];
    setOrderLines([...orderLines, { productId: firstProduct?.id || '', quantity: '1', unit: firstProduct?.unit || 'kg' }]);
  }

  function updateLine(index: number, field: string, value: string) {
    setOrderLines(orderLines.map((l, i) => {
      if (i !== index) return l;
      const updated = { ...l, [field]: value };
      if (field === 'productId') {
        const prod = products.find((p) => p.id === value);
        if (prod) updated.unit = prod.unit;
      }
      return updated;
    }));
  }

  function removeLine(index: number) {
    setOrderLines(orderLines.filter((_, i) => i !== index));
  }

  const inputClass = "w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]";

  // ─── Create view ──────────────────────────────────────────────
  if (view === 'create') {
    return (
      <div>
        <button onClick={() => setView('list')} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4">← Cancelar</button>
        <h2 className="text-xl font-semibold mb-4">Nuevo pedido</h2>

        {alerts.length > 0 && (
          <div className="mb-4 p-3 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning)]/5 text-xs text-[var(--text-muted)]">
            Se han añadido {alerts.length} productos bajo mínimos automáticamente. Puedes ajustar las cantidades.
          </div>
        )}

        <div className="space-y-4 max-w-2xl">
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Proveedor</label>
            <select value={selectedSupplier} onChange={(e) => setSelectedSupplier(e.target.value)} className={inputClass}>
              {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}{s.email ? ` (${s.email})` : ''}</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[var(--text-muted)] font-semibold">Productos</label>
              <button onClick={addLine} className="text-xs text-[var(--accent)] hover:underline">+ Añadir línea</button>
            </div>
            <div className="space-y-2">
              {orderLines.map((line, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <select value={line.productId} onChange={(e) => updateLine(i, 'productId', e.target.value)} className={`flex-1 ${inputClass}`}>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>)}
                  </select>
                  <input type="number" step="0.1" value={line.quantity} onChange={(e) => updateLine(i, 'quantity', e.target.value)} className={`w-20 ${inputClass}`} />
                  <span className="text-xs text-[var(--text-muted)] w-8">{line.unit}</span>
                  <button onClick={() => removeLine(i)} className="text-[var(--danger)] text-sm w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--danger)]/10">×</button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Notas (opcional)</label>
            <textarea value={orderNotes} onChange={(e) => setOrderNotes(e.target.value)} placeholder="Instrucciones especiales..." rows={2} className={`${inputClass} resize-none`} />
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={() => setView('list')} className="flex-1 py-2.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)]">Cancelar</button>
            <button onClick={handleCreate} disabled={saving || orderLines.length === 0} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
              {saving ? 'Creando...' : 'Crear pedido'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Detail view ──────────────────────────────────────────────
  if (view === 'detail' && selectedOrder) {
    const st = STATUS_LABELS[selectedOrder.status] || STATUS_LABELS.draft;
    return (
      <div className="max-w-2xl">
        <button onClick={() => { setView('list'); setSelectedOrder(null); }} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4">← Volver</button>

        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">{selectedOrder.supplierName}</h2>
            <div className="text-xs text-[var(--text-muted)] mt-1">{selectedOrder.localName} · {selectedOrder.createdBy} · {selectedOrder.createdAt.split('T')[0]}</div>
          </div>
          <span className="px-3 py-1 text-xs rounded-full font-semibold" style={{ color: st.color, background: st.bg }}>{st.label}</span>
        </div>

        {selectedOrder.notes && (
          <div className="text-sm text-[var(--text-muted)] mb-4 p-3 rounded-xl bg-[var(--surface)] border border-[var(--border)]">{selectedOrder.notes}</div>
        )}

        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-4">
          <div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Productos ({selectedOrder.lines.length})</div>
          {selectedOrder.lines.map((line) => (
            <div key={line.id} className="flex justify-between py-2 border-b border-[var(--border)] last:border-0 text-sm">
              <span>{line.productName}</span>
              <span className="text-[var(--text-muted)]">{line.quantity} {line.unit}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {selectedOrder.status === 'draft' && (
            <button onClick={() => handleSend(selectedOrder.id)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--info)] text-white">Marcar como enviado</button>
          )}
          {(selectedOrder.status === 'sent' || selectedOrder.status === 'confirmed') && (
            <button onClick={() => handleDeliver(selectedOrder.id)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--success)] text-white">Marcar como entregado</button>
          )}
        </div>
      </div>
    );
  }

  // ─── List view ────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">← Volver</button>
        <h2 className="text-xl font-semibold">Pedidos</h2>
        <div className="flex-1" />
        <button onClick={startCreate} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]">
          + Nuevo pedido
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--text-muted)]">Cargando...</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🛒</div>
          <p className="text-[var(--text-muted)]">No hay pedidos todavía</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((order) => {
            const st = STATUS_LABELS[order.status] || STATUS_LABELS.draft;
            return (
              <button
                key={order.id}
                onClick={() => handleSelectOrder(order.id)}
                className="w-full text-left bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)] transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{order.supplierName}</div>
                    <div className="text-xs text-[var(--text-muted)] mt-1">
                      {order.lineCount} productos · {order.createdAt.split('T')[0]}
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs rounded-full font-semibold" style={{ color: st.color, background: st.bg }}>
                    {st.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
