import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { myApi } from '../api/services';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

const CartContext = createContext(null);

const SYNC_DELAY = 700;
const cacheKey = (userId) => `vbp_cart_${userId}`;

/** Local cache only exists to paint instantly; the server is the source of truth. */
function readCache(userId) {
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function writeCache(userId, items) {
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(items));
  } catch {
    // A blocked or full store is not worth interrupting anyone for.
  }
}

const toMap = (lines = []) =>
  lines.reduce((acc, line) => ({ ...acc, [line.productId]: line }), {});

/**
 * The storefront basket.
 *
 * Held per user on the server, so it follows a person between devices and
 * browsers. Edits apply locally at once and are pushed to the API on a short
 * debounce, which keeps the UI instant without a request per keystroke.
 */
export function CartProvider({ children }) {
  const { user, isSuperAdmin } = useAuth();
  const toast = useToast();

  const userId = user?._id || null;
  const enabled = Boolean(userId) && !isSuperAdmin;

  const [items, setItems] = useState({});
  const [loading, setLoading] = useState(false);

  // Guards so hydration never triggers a save, and so a save is not fired
  // before the first load has landed.
  const hydratedFor = useRef(null);
  const timerRef = useRef(null);

  // Load the saved basket whenever the signed-in user changes.
  useEffect(() => {
    if (!enabled) {
      setItems({});
      hydratedFor.current = null;
      return undefined;
    }

    let cancelled = false;
    setItems(readCache(userId));
    setLoading(true);

    (async () => {
      try {
        const response = await myApi.getCart();
        if (cancelled) return;

        setItems(toMap(response.data.items));
        if (response.data.removed > 0) {
          toast.info(
            `${response.data.removed} item(s) left your basket because they are no longer available.`
          );
        }
      } catch {
        // Offline or a failed call: keep whatever the cache painted.
      } finally {
        if (!cancelled) {
          hydratedFor.current = userId;
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, userId, toast]);

  // Push changes up, debounced. Skipped until the first load has completed.
  useEffect(() => {
    if (!enabled || hydratedFor.current !== userId) return undefined;

    writeCache(userId, items);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const payload = Object.values(items).map((line) => ({
        product: line.productId,
        quantity: line.quantity,
      }));
      myApi.saveCart(payload).catch(() => {
        // The basket still works locally; the next edit retries.
      });
    }, SYNC_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [items, enabled, userId]);

  const lineFrom = (row, existing, quantity) => ({
    productId: row.product?._id || row.productId || existing?.productId,
    name: row.product?.name ?? existing?.name,
    sku: row.product?.sku ?? existing?.sku,
    unit: row.product?.unit ?? existing?.unit,
    imageUrl: row.product?.imageUrl ?? existing?.imageUrl,
    currency: row.product?.currency ?? existing?.currency,
    effectivePrice: row.effectivePrice ?? existing?.effectivePrice ?? 0,
    minOrderQty: row.minOrderQty ?? existing?.minOrderQty ?? 1,
    quantity,
  });

  const setQuantity = useCallback((row, rawQuantity) => {
    const quantity = Math.max(0, Math.floor(Number(rawQuantity) || 0));
    const productId = row.product?._id || row.productId;
    if (!productId) return;

    setItems((current) => {
      const next = { ...current };
      if (!quantity) {
        delete next[productId];
        return next;
      }
      next[productId] = lineFrom(row, current[productId], quantity);
      return next;
    });
  }, []);

  const setQuantityById = useCallback((productId, rawQuantity) => {
    const quantity = Math.max(0, Math.floor(Number(rawQuantity) || 0));
    setItems((current) => {
      const next = { ...current };
      if (!quantity) delete next[productId];
      else if (next[productId]) next[productId] = { ...next[productId], quantity };
      return next;
    });
  }, []);

  const add = useCallback((row, quantity = 1) => {
    const productId = row.product?._id || row.productId;
    if (!productId) return;

    setItems((current) => {
      const existing = current[productId];
      const nextQuantity = (existing?.quantity || 0) + Math.max(1, Math.floor(quantity));
      return { ...current, [productId]: lineFrom(row, existing, nextQuantity) };
    });
  }, []);

  const remove = useCallback((productId) => {
    setItems((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems({});
    if (!enabled) return;
    // Clearing is usually followed by a navigation, so send it immediately
    // rather than letting the debounce race the unmount.
    if (timerRef.current) clearTimeout(timerRef.current);
    writeCache(userId, {});
    myApi.clearCart().catch(() => {});
  }, [enabled, userId]);

  const value = useMemo(() => {
    const lines = Object.values(items);
    return {
      items,
      lines,
      loading,
      count: lines.length,
      totalUnits: lines.reduce((sum, line) => sum + line.quantity, 0),
      indicativeTotal: lines.reduce(
        (sum, line) => sum + (line.effectivePrice || 0) * line.quantity,
        0
      ),
      quantityOf: (productId) => items[productId]?.quantity || 0,
      add,
      setQuantity,
      setQuantityById,
      remove,
      clear,
    };
  }, [items, loading, add, setQuantity, setQuantityById, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside a CartProvider');
  return ctx;
}
