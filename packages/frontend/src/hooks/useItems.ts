import { useCallback, useEffect, useState } from 'react';
import { useItemsApi } from '../api/ApiContext';
import type { Item, ItemDraft, ReorderTarget } from '../domain/item';

export interface UseItems {
  readonly items: readonly Item[];
  readonly loading: boolean;
  readonly error: string | null;
  readonly dismissError: () => void;
  /** Cada acción devuelve `true` si se guardó; si falla, el motivo queda en `error`. */
  readonly add: (draft: ItemDraft) => Promise<boolean>;
  readonly update: (id: string, changes: Partial<ItemDraft>) => Promise<boolean>;
  readonly remove: (id: string) => Promise<boolean>;
  readonly toggle: (item: Item) => Promise<boolean>;
  readonly reorder: (id: string, target: ReorderTarget) => Promise<boolean>;
}

/** Aplica localmente la misma regla que el backend, para que el arrastre no "salte". */
function applyReorder(items: readonly Item[], id: string, target: ReorderTarget): Item[] {
  const moved = items.find((i) => i.id === id);
  if (!moved) return [...items];
  const rest = items.filter((i) => i.id !== id);
  const anchorId = 'beforeId' in target ? target.beforeId : target.afterId;
  const anchorIndex = rest.findIndex((i) => i.id === anchorId);
  if (anchorIndex === -1) return [...items];
  const index = 'beforeId' in target ? anchorIndex : anchorIndex + 1;
  return [...rest.slice(0, index), moved, ...rest.slice(index)];
}

/**
 * Estado de la lista y acciones sobre ella. El servidor es la fuente de verdad:
 * después de cada cambio se vuelve a pedir la lista para reflejar el orden real.
 */
export function useItems(): UseItems {
  const api = useItemsApi();
  const [items, setItems] = useState<readonly Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setItems(await api.list());
  }, [api]);

  const run = useCallback(
    async (action: () => Promise<unknown>): Promise<boolean> => {
      try {
        await action();
        await refresh();
        setError(null);
        return true;
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado');
        await refresh().catch(() => undefined);
        return false;
      }
    },
    [refresh],
  );

  useEffect(() => {
    let cancelled = false;
    api
      .list()
      .then((loaded) => !cancelled && setItems(loaded))
      .catch(
        (e: unknown) =>
          !cancelled && setError(e instanceof Error ? e.message : 'No se pudo cargar la lista'),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [api]);

  return {
    items,
    loading,
    error,
    dismissError: () => setError(null),
    add: (draft) => run(() => api.create(draft)),
    update: (id, changes) => run(() => api.update(id, changes)),
    remove: (id) => run(() => api.remove(id)),
    toggle: (item) =>
      run(() => (item.status === 'done' ? api.markPending(item.id) : api.markDone(item.id))),
    reorder: (id, target) => {
      setItems((current) => applyReorder(current, id, target));
      return run(() => api.reorder(id, target));
    },
  };
}
