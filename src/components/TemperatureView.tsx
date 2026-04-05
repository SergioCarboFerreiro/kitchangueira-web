import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { TempZoneResponse } from '../lib/api';

interface Props { localId: string }

const ZONE_TYPES = [
  { value: 'fridge', label: 'Nevera', emoji: '🧊', defaultMin: 0, defaultMax: 5 },
  { value: 'freezer', label: 'Congelador', emoji: '❄️', defaultMin: -22, defaultMax: -16 },
];

export function TemperatureView({ localId }: Props) {
  const [zones, setZones] = useState<TempZoneResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [logValues, setLogValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showAddZone, setShowAddZone] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');
  const [newZoneType, setNewZoneType] = useState('fridge');
  const [newMinTemp, setNewMinTemp] = useState('0');
  const [newMaxTemp, setNewMaxTemp] = useState('5');

  async function load() {
    setLoading(true);
    try { setZones(await api.getTempZones(localId)); } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, [localId]);

  function startLogging() {
    const initial: Record<string, string> = {};
    zones.forEach((z) => { initial[z.id] = ''; });
    setLogValues(initial);
    setLogging(true);
  }

  async function submitLogs() {
    setSaving(true);
    try {
      const logs = Object.entries(logValues)
        .filter(([, val]) => val !== '')
        .map(([zoneId, temp]) => ({ zoneId, temperature: parseFloat(temp) }));
      if (logs.length > 0) await api.batchLogTemperature(logs);
      setLogging(false);
      load();
    } finally { setSaving(false); }
  }

  async function handleAddZone(e: React.FormEvent) {
    e.preventDefault();
    await api.createTempZone(localId, {
      name: newZoneName,
      zoneType: newZoneType,
      minTemp: parseFloat(newMinTemp),
      maxTemp: parseFloat(newMaxTemp),
    });
    setShowAddZone(false);
    setNewZoneName('');
    load();
  }

  const inputClass = "w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Temperaturas</h3>
        <div className="flex gap-2">
          {!logging && (
            <>
              <button onClick={() => setShowAddZone(true)} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]">+ Zona</button>
              {zones.length > 0 && (
                <button onClick={startLogging} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white">Tomar temperaturas</button>
              )}
            </>
          )}
          {logging && (
            <>
              <button onClick={() => setLogging(false)} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)]">Cancelar</button>
              <button onClick={submitLogs} disabled={saving} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--accent)] text-white disabled:opacity-50">
                {saving ? '...' : 'Guardar'}
              </button>
            </>
          )}
        </div>
      </div>

      {showAddZone && (
        <form onSubmit={handleAddZone} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 mb-4 space-y-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre de la zona</label>
            <input type="text" value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} placeholder="Ej: Cámara 1" required className={inputClass} />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Tipo</label>
              <select value={newZoneType} onChange={(e) => {
                setNewZoneType(e.target.value);
                const zt = ZONE_TYPES.find((z) => z.value === e.target.value);
                if (zt) { setNewMinTemp(zt.defaultMin.toString()); setNewMaxTemp(zt.defaultMax.toString()); }
              }} className={inputClass}>
                {ZONE_TYPES.map((z) => <option key={z.value} value={z.value}>{z.emoji} {z.label}</option>)}
              </select>
            </div>
            <div className="w-20">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Mín °C</label>
              <input type="number" step="0.5" value={newMinTemp} onChange={(e) => setNewMinTemp(e.target.value)} className={inputClass} />
            </div>
            <div className="w-20">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Máx °C</label>
              <input type="number" step="0.5" value={newMaxTemp} onChange={(e) => setNewMaxTemp(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowAddZone(false)} className="flex-1 py-2 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)]">Cancelar</button>
            <button type="submit" disabled={!newZoneName} className="flex-1 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white disabled:opacity-50">Crear zona</button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="text-center py-10 text-[var(--text-muted)]">Cargando...</div>
      ) : zones.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-3xl mb-2">🌡️</div>
          <p className="text-[var(--text-muted)]">No hay zonas de temperatura. Añade una nevera o congelador.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {zones.map((zone) => {
            const lastTemp = zone.lastLog?.temperature;
            const inRange = zone.lastLog?.inRange ?? true;
            const emoji = zone.zoneType === 'freezer' ? '❄️' : '🧊';

            return (
              <div key={zone.id} className="flex items-center gap-3 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                <div className="text-2xl">{emoji}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{zone.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)]">
                    {zone.zoneTypeLabel} · Rango: {zone.minTemp}°C a {zone.maxTemp}°C
                  </div>
                  {zone.lastLog && (
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Último: {zone.lastLog.registeredBy} · {zone.lastLog.registeredAt.split('T')[0]}
                    </div>
                  )}
                </div>
                {logging ? (
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.5"
                      value={logValues[zone.id] || ''}
                      onChange={(e) => setLogValues({ ...logValues, [zone.id]: e.target.value })}
                      placeholder="°C"
                      className="w-20 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-right text-[var(--text)] focus:outline-none focus:border-[var(--accent)]"
                    />
                    <span className="text-xs text-[var(--text-muted)]">°C</span>
                  </div>
                ) : (
                  <div className="text-right">
                    {lastTemp !== undefined ? (
                      <div className={`text-lg font-bold ${inRange ? 'text-[#28c840]' : 'text-[#ff6b6b]'}`}>
                        {lastTemp}°C
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--text-muted)]">Sin registro</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
