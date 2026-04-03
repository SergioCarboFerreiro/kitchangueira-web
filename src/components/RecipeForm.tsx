import { useState } from 'react';
import { api } from '../lib/api';
import type { RecipeResponse } from '../lib/api';

interface Props {
  recipe?: RecipeResponse;
  onSave: () => void;
  onCancel: () => void;
}

const CATEGORIES = ['Entrantes', 'Principales', 'Postres', 'Bebidas', 'Guarniciones', 'Salsas'];
const UNITS = ['g', 'kg', 'ml', 'L', 'ud', 'cucharada', 'cucharadita', 'pizca', 'diente', 'hoja', 'rebanada'];

interface Ingredient { name: string; quantity: string; unit: string }
interface Step { description: string }

export function RecipeForm({ recipe, onSave, onCancel }: Props) {
  const [name, setName] = useState(recipe?.name ?? '');
  const [category, setCategory] = useState(recipe?.category ?? CATEGORIES[0]);
  const [portions, setPortions] = useState(recipe?.portions?.toString() ?? '4');
  const [prepTime, setPrepTime] = useState(recipe?.prepTimeMinutes?.toString() ?? '');
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients.map((i) => ({ name: i.name, quantity: i.quantity.toString(), unit: i.unit }))
    ?? [{ name: '', quantity: '', unit: 'g' }]
  );
  const [steps, setSteps] = useState<Step[]>(
    recipe?.steps.map((s) => ({ description: s.description }))
    ?? [{ description: '' }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => prev.map((ing, i) => i === index ? { ...ing, [field]: value } : ing));
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: '', quantity: '', unit: 'g' }]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateStep(index: number, value: string) {
    setSteps((prev) => prev.map((s, i) => i === index ? { description: value } : s));
  }

  function addStep() {
    setSteps((prev) => [...prev, { description: '' }]);
  }

  function removeStep(index: number) {
    setSteps((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const validIngredients = ingredients.filter((i) => i.name && i.quantity);
    const validSteps = steps.filter((s) => s.description);

    const data = {
      name,
      category,
      portions: parseInt(portions) || 1,
      prepTimeMinutes: prepTime ? parseInt(prepTime) : undefined,
      ingredients: validIngredients.map((i) => ({
        name: i.name,
        quantity: parseFloat(i.quantity),
        unit: i.unit,
      })),
      steps: validSteps.map((s, i) => ({
        stepNumber: i + 1,
        description: s.description,
      })),
    };

    try {
      if (recipe) {
        await api.updateRecipe(recipe.id, data);
      } else {
        await api.createRecipe(data);
      }
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  const inputClass = "w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text)] focus:outline-none focus:border-[var(--accent)]";

  return (
    <div className="max-w-2xl">
      <button onClick={onCancel} className="text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-4">
        ← Cancelar
      </button>

      <h2 className="text-xl font-semibold mb-6">{recipe ? 'Editar receta' : 'Nueva receta'}</h2>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-sm text-[var(--danger)]">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="text-xs text-[var(--text-muted)] block mb-1">Nombre</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Risotto de Setas" className={inputClass} required />
          </div>
          <div>
            <label className="text-xs text-[var(--text-muted)] block mb-1">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Raciones</label>
              <input type="number" value={portions} onChange={(e) => setPortions(e.target.value)} min="1" className={inputClass} />
            </div>
            <div className="flex-1">
              <label className="text-xs text-[var(--text-muted)] block mb-1">Tiempo (min)</label>
              <input type="number" value={prepTime} onChange={(e) => setPrepTime(e.target.value)} placeholder="35" className={inputClass} />
            </div>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">Ingredientes</h3>
            <button type="button" onClick={addIngredient} className="text-xs text-[var(--accent)] hover:underline">+ Añadir</button>
          </div>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input type="text" value={ing.name} onChange={(e) => updateIngredient(i, 'name', e.target.value)} placeholder="Ingrediente" className={`flex-1 ${inputClass}`} />
                <input type="number" value={ing.quantity} onChange={(e) => updateIngredient(i, 'quantity', e.target.value)} placeholder="Cant." step="0.01" className={`w-20 ${inputClass}`} />
                <select value={ing.unit} onChange={(e) => updateIngredient(i, 'unit', e.target.value)} className={`w-28 ${inputClass}`}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
                {ingredients.length > 1 && (
                  <button type="button" onClick={() => removeIngredient(i)} className="text-[var(--danger)] text-sm hover:bg-[var(--danger)]/10 w-7 h-7 rounded-lg flex items-center justify-center">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-[var(--text-muted)]">Pasos de elaboración</h3>
            <button type="button" onClick={addStep} className="text-xs text-[var(--accent)] hover:underline">+ Añadir paso</button>
          </div>
          <div className="space-y-2">
            {steps.map((step, i) => (
              <div key={i} className="flex gap-2 items-start">
                <div className="w-6 h-6 rounded-full bg-[var(--accent)]/20 text-[var(--accent)] text-xs font-bold flex items-center justify-center shrink-0 mt-2">
                  {i + 1}
                </div>
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(i, e.target.value)}
                  placeholder={`Paso ${i + 1}...`}
                  rows={2}
                  className={`flex-1 ${inputClass} resize-none`}
                />
                {steps.length > 1 && (
                  <button type="button" onClick={() => removeStep(i)} className="text-[var(--danger)] text-sm hover:bg-[var(--danger)]/10 w-7 h-7 rounded-lg flex items-center justify-center mt-1">×</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 text-sm rounded-lg border border-[var(--border)] text-[var(--text-muted)]">
            Cancelar
          </button>
          <button type="submit" disabled={saving || !name} className="flex-1 py-2.5 text-sm font-semibold rounded-lg bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50">
            {saving ? 'Guardando...' : recipe ? 'Guardar cambios' : 'Crear receta'}
          </button>
        </div>
      </form>
    </div>
  );
}
