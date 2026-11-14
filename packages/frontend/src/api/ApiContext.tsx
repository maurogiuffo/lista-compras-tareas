import { createContext, type ReactNode, useContext } from 'react';
import type { ItemsApi } from './ItemsApi';

const ApiContext = createContext<ItemsApi | null>(null);

/** Inyección de dependencias: la app recibe la implementación de la API desde afuera. */
export function ApiProvider({ api, children }: { api: ItemsApi; children: ReactNode }) {
  return <ApiContext.Provider value={api}>{children}</ApiContext.Provider>;
}

export function useItemsApi(): ItemsApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useItemsApi debe usarse dentro de <ApiProvider>');
  return api;
}
