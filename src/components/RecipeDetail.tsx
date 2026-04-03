import type { RecipeResponse } from '../lib/api';

const CATEGORY_EMOJI: Record<string, string> = {
  Entrantes: '🥗', Principales: '🍽️', Postres: '🍰', Bebidas: '🥤',
  Guarniciones: '🥬', Salsas: '🫙',
};
const CATEGORY_COLOR: Record<string, string> = {
  Entrantes: '#1a3a2a', Principales: '#2a1a1a', Postres: '#2a1a3a',
  Bebidas: '#1a2a3a', Guarniciones: '#1a3a1a', Salsas: '#3a2a1a',
};

interface Props {
  recipe: RecipeResponse;
  isManager: boolean;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function RecipeDetail({ recipe, isManager, onBack, onEdit, onDelete }: Props) {
  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4">
        ← Volver a recetas
      </button>

      {/* Recipe image or placeholder */}
      <div className="mb-6">
        {recipe.imageUrl ? (
          <img src={recipe.imageUrl} alt={recipe.name} className="w-full h-48 rounded-xl object-cover" />
        ) : (
          <div className="w-full h-36 rounded-xl flex items-center justify-center text-5xl" style={{ background: CATEGORY_COLOR[recipe.category] || '#1a1a2a' }}>
            {CATEGORY_EMOJI[recipe.category] || '🍳'}
          </div>
        )}
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{recipe.name}</h2>
          <div className="text-sm text-[var(--text-muted)] mt-1">
            {recipe.category} · {recipe.portions} raciones
            {recipe.prepTimeMinutes && ` · ${recipe.prepTimeMinutes} min`}
          </div>
        </div>
        {isManager && (
          <div className="flex gap-2">
            <button onClick={onEdit} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]">
              Editar
            </button>
            <button onClick={onDelete} className="px-3 py-1.5 text-xs rounded-lg border border-[var(--danger)]/30 text-[var(--danger)] hover:bg-[var(--danger)]/10">
              Eliminar
            </button>
          </div>
        )}
      </div>

      {/* Ingredients */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5 mb-4">
        <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Ingredientes</h3>
        <div className="space-y-2">
          {recipe.ingredients.map((ing) => (
            <div key={ing.id} className="flex justify-between text-sm">
              <span>{ing.name}</span>
              <span className="text-[var(--text-muted)]">{ing.quantity} {ing.unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-3">Elaboración</h3>
        <div className="space-y-4">
          {recipe.steps.map((step) => (
            <div key={step.id} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step.stepNumber}
              </div>
              <p className="text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
