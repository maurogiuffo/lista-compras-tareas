import type { Category, Item, ReorderTarget } from '../domain/item';
import { ApiError, type ItemsApi } from './ItemsApi';

/** Implementación de `ItemsApi` sobre fetch contra la API REST. */
/** Por defecto usa la API bajo la misma ruta donde se publica la app (por ejemplo /lista/api). */
export function createHttpItemsApi(
  baseUrl = `${import.meta.env.BASE_URL}api`,
  fetchFn: typeof fetch = fetch,
): ItemsApi {
  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetchFn(`${baseUrl}${path}`, {
      method,
      ...(body !== undefined && {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    });
    if (!response.ok) {
      const error = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };
      throw new ApiError(
        response.status,
        error.error ?? 'HTTP_ERROR',
        error.message ?? `Error ${response.status}`,
      );
    }
    return (response.status === 204 ? undefined : await response.json()) as T;
  }

  return {
    me: () => request<{ user: string }>('GET', '/me'),
    list: (category?: Category) =>
      request<Item[]>(
        'GET',
        category ? `/items?category=${encodeURIComponent(category)}` : '/items',
      ),
    create: (draft) => request<Item>('POST', '/items', draft),
    update: (id, changes) => request<Item>('PATCH', `/items/${encodeURIComponent(id)}`, changes),
    remove: (id) => request<undefined>('DELETE', `/items/${encodeURIComponent(id)}`),
    markDone: (id) => request<Item>('POST', `/items/${encodeURIComponent(id)}/done`),
    markPending: (id) => request<Item>('POST', `/items/${encodeURIComponent(id)}/pending`),
    reorder: async (id, target: ReorderTarget) => {
      await request('POST', `/items/${encodeURIComponent(id)}/reorder`, target);
    },
  };
}
