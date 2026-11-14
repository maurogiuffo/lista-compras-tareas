import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  type Item,
  URGENCY_LABELS,
  classification,
  dueState,
  formatShortDate,
} from '../domain/item';

interface Props {
  readonly item: Item;
  readonly today: string;
  readonly onToggle: (item: Item) => void;
  readonly onEdit: (item: Item) => void;
  readonly onDelete: (item: Item) => void;
}

export function ItemRow({ item, today, onToggle, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });
  const done = item.status === 'done';
  const { label, icon } = classification(item);
  const actionLabel = item.category === 'tarea' ? 'hecho' : 'comprado';

  return (
    <li
      ref={setNodeRef}
      className={`item urgency-${item.urgency}${done ? ' done' : ''}${isDragging ? ' dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        className="handle"
        aria-label={`Arrastrar ${item.name}`}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <input
        type="checkbox"
        className="check"
        checked={done}
        aria-label={
          done ? `Marcar que falta ${item.name}` : `Marcar ${item.name} como ${actionLabel}`
        }
        onChange={() => onToggle(item)}
      />
      <div className="item-body">
        <span className="item-name">{item.name}</span>
        <span className="item-meta">
          <span>
            {icon} {label}
          </span>
          {item.urgency !== 'media' && (
            <span className={`badge urgency urgency-${item.urgency}`}>
              {URGENCY_LABELS[item.urgency]}
            </span>
          )}
          {item.dueDate && (
            <span className={`badge due due-${done ? 'later' : dueState(item.dueDate, today)}`}>
              📅 {formatShortDate(item.dueDate)}
            </span>
          )}
        </span>
        {item.notes && <span className="item-notes">{item.notes}</span>}
      </div>
      <div className="item-actions">
        <button
          type="button"
          className="icon"
          aria-label={`Editar ${item.name}`}
          onClick={() => onEdit(item)}
        >
          ✎
        </button>
        <button
          type="button"
          className="icon danger"
          aria-label={`Borrar ${item.name}`}
          onClick={() => onDelete(item)}
        >
          🗑
        </button>
      </div>
    </li>
  );
}
