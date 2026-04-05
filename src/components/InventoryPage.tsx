import { useState } from 'react';
import { StockPage } from './StockPage';
import { WasteView } from './WasteView';
import { TemperatureView } from './TemperatureView';

interface Props {
  localId: string;
  isManager: boolean;
}

type SubView = 'stock' | 'waste' | 'temperature';

export function InventoryPage({ localId, isManager }: Props) {
  const [subView, setSubView] = useState<SubView>('stock');

  const subTabs: { key: SubView; label: string }[] = [
    { key: 'stock', label: 'Stock' },
    { key: 'waste', label: 'Merma' },
    { key: 'temperature', label: 'Temperaturas' },
  ];

  return (
    <div>
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-6">
        {subTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubView(tab.key)}
            className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
              subView === tab.key
                ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 font-semibold'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subView === 'waste' ? (
        <WasteView localId={localId} />
      ) : subView === 'temperature' ? (
        <TemperatureView localId={localId} />
      ) : (
        <StockPage localId={localId} isManager={isManager} onBack={() => {}} />
      )}
    </div>
  );
}
