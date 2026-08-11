'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import { unwrap } from './api-response';

export { unwrap } from './api-response';

export function useApiResource<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState('');
  const [requestKey, setRequestKey] = useState(0);

  useEffect(() => {
    if (!path) {
      setData(null);
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError('');
    api
      .get<unknown>(path)
      .then((result) => {
        if (active) setData(unwrap<T>(result));
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : 'The request failed.',
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [path, requestKey]);

  const reload = useCallback(() => setRequestKey((value) => value + 1), []);
  return { data, loading, error, reload, setData };
}

export type DataRow = Record<string, unknown>;
