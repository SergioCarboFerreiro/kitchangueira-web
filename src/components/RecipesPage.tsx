import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import type { RecipeListItem, RecipeResponse } from '../lib/api';

const CATEGORY_EMOJI: Record<string, string> = {
  Entrantes: '🥗', Principales: '🍽️', Postres: '🍰', Bebidas: '🥤',
  Guarniciones: '🥬', Salsas: '🫙',
};
const CATEGORY_COLOR: Record<string, string> = {
  Entrantes: '#1a3a2a', Principales: '#2a1a1a', Postres: '#2a1a3a',
  Bebidas: '#1a2a3a', Guarniciones: '#1a3a1a', Salsas: '#3a2a1a',
};
import { RecipeDetail } from './RecipeDetail';
import { RecipeForm } from './RecipeForm';

interface Props {
  isManager: boolean;
  onBack: () => void;
}

export function RecipesPage({ isManager, onBack }: Props) {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeResponse | null>(null);
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadRecipes() {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        api.getRecipes(selectedCategory || undefined),
        api.getCategories(),
      ]);
      setRecipes(r);
      setCategories(c);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRecipes(); }, [selectedCategory]);

  async function handleSelectRecipe(id: string) {
    const recipe = await api.getRecipe(id);
    setSelectedRecipe(recipe);
    setEditing(false);
  }

  async function handleDelete(id: string) {
    await api.deleteRecipe(id);
    setSelectedRecipe(null);
    loadRecipes();
  }

  function handleSaved() {
    setSelectedRecipe(null);
    setEditing(false);
    setCreating(false);
    loadRecipes();
  }

  // Show form (create or edit)
  if (creating) {
    return <RecipeForm onSave={handleSaved} onCancel={() => setCreating(false)} />;
  }
  if (editing && selectedRecipe) {
    return <RecipeForm recipe={selectedRecipe} onSave={handleSaved} onCancel={() => setEditing(false)} />;
  }

  // Show recipe detail
  if (selectedRecipe) {
    return (
      <RecipeDetail
        recipe={selectedRecipe}
        isManager={isManager}
        onBack={() => setSelectedRecipe(null)}
        onEdit={() => setEditing(true)}
        onDelete={() => handleDelete(selectedRecipe.id)}
      />
    );
  }

  // Recipe list
  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)]">← Volver</button>
        <h2 className="text-xl font-semibold">Recetas</h2>
        <div className="flex-1" />
        {isManager && (
          <button
            onClick={() => setCreating(true)}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
          >
            + Nueva receta
          </button>
        )}
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedCategory('')}
          className={`px-3 py-1 text-xs rounded-full border transition-colors ${!selectedCategory ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
        >
          Todas
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${selectedCategory === cat ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10' : 'border-[var(--border)] text-[var(--text-muted)]'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-[var(--text-muted)]">Cargando...</div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-4xl mb-3">🍳</div>
          <p className="text-[var(--text-muted)]">No hay recetas todavía</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {recipes.map((r) => (
            <button
              key={r.id}
              onClick={() => handleSelectRecipe(r.id)}
              className="text-left bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 hover:border-[var(--accent)] transition-colors"
            >
              <div className="flex items-center gap-4">
                {r.imageUrl ? (
                  <img src={r.imageUrl} alt={r.name} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: CATEGORY_COLOR[r.category] || '#1a1a2a' }}>
                    {CATEGORY_EMOJI[r.category] || '🍳'}
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-semibold">{r.name}</div>
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    {r.category} · {r.portions} rac. · {r.prepTimeMinutes ? `${r.prepTimeMinutes} min` : 'Sin tiempo'}
                  </div>
                </div>
                <div className="text-right text-xs text-[var(--text-muted)]">
                  <div>{r.ingredientCount} ingredientes</div>
                  <div>{r.stepCount} pasos</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
