import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const storageKey = (vendorId) => `vbp_cart_${vendorId || 'none'}`;

/** localStorage can throw in private windows, so every access is guarded. */
function readCart(vendorId) {
  try {
    const raw = localStorage.getItem(storageKey(vendorId));
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * The storefront basket.
 *
 * Keyed by vendor so switching accounts on a shared machine never mixes two
 * organisations' baskets. It survives reloads but is deliberately local: the
 * server only hears about it when the vendor submits a purchase request.
 */
export function CartProvider({ children }) {
  const { user, vendor } = useAuth();
  const vendorId = vendor?._id || user?.vendor?._id || null;

  const [items, setItems] = useState({});

  // Load (and reload when the signed-in vendor changes).
  useEffect(() => {
    setItems(vendorId ? readCart(vendorId) : {});
  }, [vendorId]);

  // Persist on every change.
  useEffect(() => {
    if (!vendorId) return;
    try {
      localStorage.setItem(storageKey(vendorId), JSON.stringify(items));
    } catch {
      // A full or blocked store is not worth interrupting the user for.
    }
  }, [items, vendorId]);

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
      next[productId] = {
        productId,
        name: row.product?.name ?? next[productId]?.name,
        sku: row.product?.sku ?? next[productId]?.sku,
        unit: row.product?.unit ?? next[productId]?.unit,
        imageUrl: row.product?.imageUrl ?? next[productId]?.imageUrl,
        effectivePrice: row.effectivePrice ?? next[productId]?.effectivePrice ?? 0,
        minOrderQty: row.minOrderQty ?? next[productId]?.minOrderQty ?? 1,
        quantity,
      };
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

  const add = useCallback(
    (row, quantity = 1) => {
      const productId = row.product?._id || row.productId;
      setItems((current) => {
        const existing = current[productId];
        const nextQuantity = (existing?.quantity || 0) + Math.max(1, Math.floor(quantity));
        return {
          ...current,
          [productId]: {
            productId,
            name: row.product?.name ?? existing?.name,
            sku: row.product?.sku ?? existing?.sku,
            unit: row.product?.unit ?? existing?.unit,
            imageUrl: row.product?.imageUrl ?? existing?.imageUrl,
            effectivePrice: row.effectivePrice ?? existing?.effectivePrice ?? 0,
            minOrderQty: row.minOrderQty ?? existing?.minOrderQty ?? 1,
            quantity: nextQuantity,
          },
        };
      });
    },
    []
  );

  const remove = useCallback((productId) => {
    setItems((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });
  }, []);

  const clear = useCallback(() => setItems({}), []);

  const value = useMemo(() => {
    const lines = Object.values(items);
    return {
      items,
      lines,
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
  }, [items, add, setQuantity, setQuantityById, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside a CartProvider');
  return ctx;
}
