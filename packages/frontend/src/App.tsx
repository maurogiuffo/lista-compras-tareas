import { useId, useRef, useState } from 'react';
import { CategoryFilter } from './components/CategoryFilter';
import { ItemForm } from './components/ItemForm';
import { ItemList } from './components/ItemList';
import {
  type Item,
  type ItemDraft,
  type ItemFilter,
  findByName,
  localToday,
  matchesFilter,
  matchesSearch,
} from './domain/item';
import { useCurrentUser } from './hooks/useCurrentUser';
import { useItems } from './hooks/useItems';

interface Props {
  /** Permite fijar la fecha en tests. */
  readonly today?: string;
  /** Confirmación antes de borrar; inyectable para tests. */
  readonly confirm?: (message: string) => boolean;
}

export function App({ today = localToday(), confirm = (m) => window.confirm(m) }: Props) {
  const { items, loading, error, dismissError, add, update, remove, toggle, reorder } = useItems();
  const user = useCurrentUser();
  const [filter, setFilter] = useState<ItemFilter>({ kind: 'all' });
  const [adding, setAdding] = useState(false);

  // El buscador siempre está visible: filtra la lista (en todas las categorías) y, al
  // agregar, lo escrito es el nombre del ítem nuevo, así se ve si ya existe antes de duplicarlo.
  const [search, setSearch] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const addFormId = useId();
  const searching = search.trim() !== '';
  const visible = searching
    ? items.filter((i) => matchesSearch(i, search))
    : items.filter((i) => matchesFilter(i, filter));
  const existing = searching ? findByName(items, search) : undefined;
  // Al agregar con un filtro activo, el formulario arranca con esa clasificación.
  const initialDraft: Partial<ItemDraft> =
    filter.kind === 'category'
      ? { category: filter.category }
      : filter.kind === 'subcategory'
        ? { category: 'insumos', subcategory: filter.subcategory }
        : {};
  const pendingCount = visible.filter((i) => i.status === 'pending').length;

  const closeAdd = () => {
    setAdding(false);
    setSearch('');
  };

  const handleDelete = (item: Item) => {
    if (confirm(`¿Borrar "${item.name}"?`)) void remove(item.id);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Lista de compras</h1>
        <span className="summary" aria-live="polite">
          {loading ? 'Cargando…' : `${pendingCount} pendiente${pendingCount === 1 ? '' : 's'}`}
          {user && <span className="user"> · {user}</span>}
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
        <div className="search-bar">
          <input
            ref={searchRef}
            type="search"
            className="search-input"
            placeholder={adding ? '¿Qué falta?' : 'Buscar…'}
            aria-label={adding ? 'Nombre del ítem nuevo' : 'Buscar'}
            value={search}
            maxLength={120}
            // Al agregar, Enter en el buscador envía el formulario de alta.
            {...(adding && { form: addFormId })}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !adding && searching) setAdding(true);
              if (e.key === 'Escape') closeAdd();
            }}
          />
          {!adding && (
            <button
              type="button"
              className="add-inline"
              onClick={() => {
                setAdding(true);
                searchRef.current?.focus();
              }}
            >
              + Agregar
            </button>
          )}
        </div>
        {existing && (
          <p className="form-hint" role="status">
            <ExistingHint item={existing} onMarkPending={toggle} />
          </p>
        )}
        {adding && (
          <ItemForm
            formId={addFormId}
            initial={initialDraft}
            name={search}
            submitLabel="Agregar"
            resetOnSubmit
            onSubmit={add}
            onNameChange={setSearch}
            onCancel={closeAdd}
          />
        )}
      </section>

      {searching ? (
        <p className="search-summary">
          {visible.length > 0
            ? `${visible.length} con “${search.trim()}”`
            : adding
              ? 'No está en la lista: se va a agregar como nuevo.'
              : 'No está en la lista. Tocá “+ Agregar” para sumarlo.'}
        </p>
      ) : (
        <CategoryFilter value={filter} items={items} onChange={setFilter} />
      )}

      {!loading && (
        <ItemList
          items={visible}
          today={today}
          onToggle={(item) => void toggle(item)}
          onUpdate={update}
          onDelete={handleDelete}
          onReorder={(id, target) => void reorder(id, target)}
          {...(searching && { emptyMessage: '' })}
        />
      )}
    </div>
  );
}

function ExistingHint({
  item,
  onMarkPending,
}: {
  readonly item: Item;
  readonly onMarkPending: (item: Item) => Promise<unknown>;
}) {
  if (item.status === 'pending') return <>“{item.name}” ya está en la lista como pendiente.</>;
  return (
    <>
      “{item.name}” ya está en la lista, marcado como comprado.{' '}
      <button type="button" className="link" onClick={() => void onMarkPending(item)}>
        Marcar que falta
      </button>
    </>
  );
}
