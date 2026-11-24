import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from './restrictToVerticalAxis';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import {
  type Item,
  type ItemDraft,
  type ReorderTarget,
  moveItem,
  reorderTarget,
} from '../domain/item';
import { ItemForm } from './ItemForm';
import { ItemRow } from './ItemRow';

interface Props {
  readonly items: readonly Item[];
  readonly today: string;
  readonly onToggle: (item: Item) => void;
  readonly onUpdate: (id: string, changes: ItemDraft) => Promise<boolean>;
  readonly onDelete: (item: Item) => void;
  readonly onReorder: (id: string, target: ReorderTarget) => void;
  readonly emptyMessage?: string;
}

export function ItemList({
  items,
  today,
  onToggle,
  onUpdate,
  onDelete,
  onReorder,
  emptyMessage = 'No hay nada acá. ¡Todo en orden!',
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const ids = items.map((i) => i.id);
    const reordered = moveItem(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    const target = reorderTarget(reordered, String(active.id));
    if (target) onReorder(String(active.id), target);
  };

  if (items.length === 0) {
    return <p className="empty">{emptyMessage}</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      modifiers={[restrictToVerticalAxis]}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className="item-list">
          {items.map((item) =>
            item.id === editingId ? (
              <li key={item.id} className="item editing">
                <ItemForm
                  initial={item}
                  submitLabel="Guardar"
                  onCancel={() => setEditingId(null)}
                  onSubmit={async (draft) => {
                    // Si no se pudo guardar, el formulario queda abierto con el aviso de error.
                    if (await onUpdate(item.id, draft)) setEditingId(null);
                  }}
                />
              </li>
            ) : (
              <ItemRow
                key={item.id}
                item={item}
                today={today}
                onToggle={onToggle}
                onEdit={(i) => setEditingId(i.id)}
                onDelete={onDelete}
              />
            ),
          )}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
