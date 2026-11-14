import {
  CATEGORIES,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type Item,
  type ItemFilter,
  SUBCATEGORIES,
  SUBCATEGORY_ICONS,
  SUBCATEGORY_LABELS,
  matchesFilter,
} from '../domain/item';

interface Props {
  readonly value: ItemFilter;
  readonly items: readonly Item[];
  readonly onChange: (filter: ItemFilter) => void;
}

/** Chips de categoría; al elegir Insumos aparece una segunda fila con sus subcategorías. */
export function CategoryFilter({ value, items, onChange }: Props) {
  const count = (filter: ItemFilter) =>
    items.filter((i) => i.status === 'pending' && matchesFilter(i, filter)).length;
  const showSubcategories =
    (value.kind === 'category' && value.category === 'insumos') || value.kind === 'subcategory';

  return (
    <div className="filters">
      <nav className="filter" aria-label="Filtrar por categoría">
        <Chip
          pressed={value.kind === 'all'}
          onClick={() => onChange({ kind: 'all' })}
          label="Todo"
          count={count({ kind: 'all' })}
        />
        {CATEGORIES.map((category) => (
          <Chip
            key={category}
            pressed={
              (value.kind === 'category' && value.category === category) ||
              (value.kind === 'subcategory' && category === 'insumos')
            }
            onClick={() => onChange({ kind: 'category', category })}
            icon={CATEGORY_ICONS[category]}
            label={CATEGORY_LABELS[category]}
            count={count({ kind: 'category', category })}
          />
        ))}
      </nav>
      {showSubcategories && (
        <nav className="filter sub" aria-label="Filtrar por subcategoría">
          {SUBCATEGORIES.map((subcategory) => {
            const pressed = value.kind === 'subcategory' && value.subcategory === subcategory;
            return (
              <Chip
                key={subcategory}
                pressed={pressed}
                onClick={() =>
                  onChange(
                    pressed
                      ? { kind: 'category', category: 'insumos' }
                      : { kind: 'subcategory', subcategory },
                  )
                }
                icon={SUBCATEGORY_ICONS[subcategory]}
                label={SUBCATEGORY_LABELS[subcategory]}
                count={count({ kind: 'subcategory', subcategory })}
              />
            );
          })}
        </nav>
      )}
    </div>
  );
}

interface ChipProps {
  readonly pressed: boolean;
  readonly onClick: () => void;
  readonly label: string;
  readonly count: number;
  readonly icon?: string;
}

function Chip({ pressed, onClick, label, count, icon }: ChipProps) {
  return (
    <button type="button" aria-pressed={pressed} onClick={onClick}>
      {icon && <span aria-hidden="true">{icon} </span>}
      {label} <span className="count">{count}</span>
    </button>
  );
}
