import { CATEGORIES, CATEGORY_ICONS, CATEGORY_LABELS, type Category } from '../domain/item';

interface Props {
  readonly value: Category | null;
  readonly counts: Readonly<Record<Category, number>>;
  readonly onChange: (category: Category | null) => void;
}

export function CategoryFilter({ value, counts, onChange }: Props) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return (
    <nav className="filter" aria-label="Filtrar por categoría">
      <button type="button" aria-pressed={value === null} onClick={() => onChange(null)}>
        Todo <span className="count">{total}</span>
      </button>
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          aria-pressed={value === category}
          onClick={() => onChange(category)}
        >
          <span aria-hidden="true">{CATEGORY_ICONS[category]}</span> {CATEGORY_LABELS[category]}{' '}
          <span className="count">{counts[category]}</span>
        </button>
      ))}
    </nav>
  );
}
