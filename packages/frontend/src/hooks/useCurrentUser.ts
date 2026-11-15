import { useEffect, useState } from 'react';
import { useItemsApi } from '../api/ApiContext';

/** Nombre del usuario actual, o `null` mientras carga o si no se pudo obtener. */
export function useCurrentUser(): string | null {
  const api = useItemsApi();
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then(({ user }) => !cancelled && setUser(user))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [api]);

  return user;
}
