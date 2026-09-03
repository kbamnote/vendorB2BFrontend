import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/**
 * Fetches a paginated list endpoint.
 *
 * `params` is almost always an object literal written inline at the call site,
 * which would be a new reference on every render. The effect therefore keys off
 * a serialized copy of the params instead of the object itself - otherwise the
 * fetch would re-run forever.
 */
export default function usePaginatedQuery(fetcher, params = {}, options = {}) {
  const { enabled = true } = options;

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);

  const paramsKey = JSON.stringify(params ?? {});
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const response = await fetcherRef.current(JSON.parse(paramsKey));
        if (cancelled) return;
        const data = response?.data || {};
        setItems(data.items || []);
        setPagination(
          data.pagination || { page: 1, limit: 10, total: (data.items || []).length, totalPages: 1 }
        );
      } catch (err) {
        if (!cancelled) {
          setError(err);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [paramsKey, enabled, reloadToken]);

  const reload = useCallback(() => setReloadToken((n) => n + 1), []);

  return useMemo(
    () => ({ items, pagination, loading, error, reload, setItems }),
    [items, pagination, loading, error, reload]
  );
}
