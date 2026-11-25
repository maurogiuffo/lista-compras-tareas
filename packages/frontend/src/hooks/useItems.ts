import { useCallback, useEffect, useRef, useState } from 'react';
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

/** Marca o desmarca al instante con la misma regla que el backend: comprado al final, falta arriba. */
function applyToggle(items: readonly Item[], id: string): Item[] {
  const item = items.find((i) => i.id === id);
  if (!item) return [...items];
  const rest = items.filter((i) => i.id !== id);
  if (item.status === 'done') return [{ ...item, status: 'pending' }, ...rest];
  return [...rest, { ...item, status: 'done' }];
}

/**
 * Estado de la lista y acciones sobre ella. El servidor es la fuente de verdad:
 * después de cada cambio se vuelve a pedir la lista para reflejar el orden real.
 * Marcar, borrar y reordenar se ven al instante (actualización optimista); si el
 * servidor falla, se muestra el aviso y la lista vuelve a lo que dice el servidor.
 */
export function useItems(): UseItems {
  const api = useItemsApi();
  const [items, setItems] = useState<readonly Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cada cambio local incrementa la versión; una lista que llega del servidor solo se
  // aplica si no hubo cambios locales mientras viajaba, para no pisarlos.
  const version = useRef(0);
  const inFlight = useRef(0);

  const refresh = useCallback(async () => {
    const requested = version.current;
    const loaded = await api.list();
    if (version.current === requested) setItems(loaded);
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

  const optimistic = useCallback(
    async (
      apply: (current: readonly Item[]) => readonly Item[],
      action: () => Promise<unknown>,
    ): Promise<boolean> => {
      version.current += 1;
      inFlight.current += 1;
      setItems(apply);
      let ok = true;
      try {
        await action();
        setError(null);
      } catch (e) {
        ok = false;
        setError(e instanceof Error ? e.message : 'Error inesperado');
      } finally {
        inFlight.current -= 1;
      }
      // Sincroniza con el servidor sin bloquear, cuando no quedan otros cambios en viaje.
      if (inFlight.current === 0) void refresh().catch(() => undefined);
      return ok;
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
    remove: (id) =>
      optimistic(
        (current) => current.filter((i) => i.id !== id),
        () => api.remove(id),
      ),
    toggle: (item) =>
      optimistic(
        (current) => applyToggle(current, item.id),
        () => (item.status === 'done' ? api.markPending(item.id) : api.markDone(item.id)),
      ),
    reorder: (id, target) =>
      optimistic(
        (current) => applyReorder(current, id, target),
        () => api.reorder(id, target),
      ),
  };
}
