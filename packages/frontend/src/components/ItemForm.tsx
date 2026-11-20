import { type FormEvent, type ReactNode, useId, useState } from 'react';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
  type ItemDraft,
  SUBCATEGORIES,
  SUBCATEGORY_LABELS,
  type Subcategory,
  URGENCIES,
  hasSubcategories,
  URGENCY_LABELS,
  type Urgency,
} from '../domain/item';

interface Props {
  readonly initial?: Partial<ItemDraft>;
  readonly submitLabel: string;
  readonly onSubmit: (draft: ItemDraft) => void | Promise<void>;
  readonly onCancel?: () => void;
  /** Limpia el formulario después de guardar (para cargar varios seguidos). */
  readonly resetOnSubmit?: boolean;
  /** Avisa cada cambio del nombre (por ejemplo, para buscar duplicados mientras se escribe). */
  readonly onNameChange?: (name: string) => void;
  /** Aviso que se muestra debajo del nombre. */
  readonly hint?: ReactNode;
}

const EMPTY: ItemDraft = {
  name: '',
  category: 'insumos',
  subcategory: null,
  urgency: 'media',
  dueDate: null,
  notes: null,
};

/** Formulario reutilizado para agregar y editar. */
export function ItemForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
  resetOnSubmit = false,
  onNameChange,
  hint,
}: Props) {
  const id = useId();
  const [draft, setDraft] = useState<ItemDraft>({ ...EMPTY, ...initial });
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof ItemDraft>(key: K, value: ItemDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) return;
    setSubmitting(true);
    try {
      await onSubmit({ ...draft, name, notes: draft.notes?.trim() || null });
      if (resetOnSubmit) {
        setDraft((d) => ({ ...EMPTY, category: d.category, subcategory: d.subcategory }));
        onNameChange?.('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor={`${id}-name`}>
        Nombre
      </label>
      <input
        id={`${id}-name`}
        className="name-input"
        placeholder="¿Qué falta?"
        value={draft.name}
        maxLength={120}
        autoFocus
        onChange={(e) => {
          set('name', e.target.value);
          onNameChange?.(e.target.value);
        }}
      />
      {hint && (
        <p className="form-hint" role="status">
          {hint}
        </p>
      )}
      <div className="form-row">
        <label>
          <span>Categoría</span>
          <select
            value={draft.category}
            onChange={(e) => {
              const category = e.target.value as Category;
              setDraft((d) => ({
                ...d,
                category,
                subcategory: hasSubcategories(category) ? d.subcategory : null,
              }));
            }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </label>
        {hasSubcategories(draft.category) && (
          <label>
            <span>Subcategoría</span>
            <select
              value={draft.subcategory ?? ''}
              onChange={(e) => set('subcategory', (e.target.value || null) as Subcategory | null)}
            >
              <option value="">Sin subcategoría</option>
              {SUBCATEGORIES.map((s) => (
                <option key={s} value={s}>
                  {SUBCATEGORY_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <span>Urgencia</span>
          <select value={draft.urgency} onChange={(e) => set('urgency', e.target.value as Urgency)}>
            {URGENCIES.map((u) => (
              <option key={u} value={u}>
                {URGENCY_LABELS[u]}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Fecha</span>
          <input
            type="date"
            value={draft.dueDate ?? ''}
            onChange={(e) => set('dueDate', e.target.value || null)}
          />
        </label>
      </div>
      <label className="sr-only" htmlFor={`${id}-notes`}>
        Notas
      </label>
      <input
        id={`${id}-notes`}
        placeholder="Notas (opcional)"
        value={draft.notes ?? ''}
        maxLength={500}
        onChange={(e) => set('notes', e.target.value)}
      />
      <div className="form-actions">
        {onCancel && (
          <button type="button" className="secondary" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit" disabled={submitting || !draft.name.trim()}>
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
