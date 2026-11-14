import { useState } from 'react';
import { CategoryFilter } from './components/CategoryFilter';
import { ItemForm } from './components/ItemForm';
import { ItemList } from './components/ItemList';
import {
  type Item,
  type ItemDraft,
  type ItemFilter,
  localToday,
  matchesFilter,
} from './domain/item';
import { useItems } from './hooks/useItems';

interface Props {
  /** Permite fijar la fecha en tests. */
  readonly today?: string;
  /** Confirmación antes de borrar; inyectable para tests. */
  readonly confirm?: (message: string) => boolean;
}

export function App({ today = localToday(), confirm = (m) => window.confirm(m) }: Props) {
  const { items, loading, error, dismissError, add, update, remove, toggle, reorder } = useItems();
  const [filter, setFilter] = useState<ItemFilter>({ kind: 'all' });
  const [adding, setAdding] = useState(false);

  const visible = items.filter((i) => matchesFilter(i, filter));
  // Al agregar con un filtro activo, el formulario arranca con esa clasificación.
  const initialDraft: Partial<ItemDraft> =
    filter.kind === 'category'
      ? { category: filter.category }
      : filter.kind === 'subcategory'
        ? { category: 'insumos', subcategory: filter.subcategory }
        : {};
  const pendingCount = visible.filter((i) => i.status === 'pending').length;

  const handleDelete = (item: Item) => {
    if (confirm(`¿Borrar "${item.name}"?`)) void remove(item.id);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lista de compras</h1>
        <span className="summary" aria-live="polite">
          {loading ? 'Cargando…' : `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}`}
        </span>
      </header>

      {error && (
        <div className="error" role="alert">
          <span>{error}</span>
          <button type="button" className="icon" aria-label="Cerrar aviso" onClick={dismissError}>
            ✕
          </button>
        </div>
      )}

      <section className="add-section">
        {adding ? (
          <ItemForm
            initial={initialDraft}
            submitLabel="Agregar"
            resetOnSubmit
            onSubmit={add}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button type="button" className="add-button" onClick={() => setAdding(true)}>
            + Agregar
          </button>
        )}
      </section>

      <CategoryFilter value={filter} items={items} onChange={setFilter} />

      {!loading && (
        <ItemList
          items={visible}
          today={today}
          onToggle={(item) => void toggle(item)}
          onUpdate={update}
          onDelete={handleDelete}
          onReorder={(id, target) => void reorder(id, target)}
        />
      )}
    </div>
  );
}
