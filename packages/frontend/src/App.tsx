import { useMemo, useState } from 'react';
import { CategoryFilter } from './components/CategoryFilter';
import { ItemForm } from './components/ItemForm';
import { ItemList } from './components/ItemList';
import { CATEGORIES, type Category, type Item, localToday } from './domain/item';
import { useItems } from './hooks/useItems';

interface Props {
  /** Permite fijar la fecha en tests. */
  readonly today?: string;
  /** Confirmación antes de borrar; inyectable para tests. */
  readonly confirm?: (message: string) => boolean;
}

export function App({ today = localToday(), confirm = (m) => window.confirm(m) }: Props) {
  const { items, loading, error, dismissError, add, update, remove, toggle, reorder } = useItems();
  const [filter, setFilter] = useState<Category | null>(null);
  const [adding, setAdding] = useState(false);

  const counts = useMemo(() => {
    const result = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
    for (const item of items) if (item.status === 'pending') result[item.category] += 1;
    return result;
  }, [items]);

  const visible = filter ? items.filter((i) => i.category === filter) : items;
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
            initial={filter ? { category: filter } : {}}
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

      <CategoryFilter value={filter} counts={counts} onChange={setFilter} />

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
