import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Product } from './products';
import { api, tokenStore } from './api';
import { useAuth } from './AuthContext';
import { useProducts } from './ProductsContext';

interface WishlistContextType {
  items: Product[];
  ids: string[];
  isWishlisted: (id: string) => boolean;
  toggle: (product: Product) => void;
  loadFromServer: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { products } = useProducts();
  const [ids, setIds] = useState<string[]>([]);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive items from ids + products list so it stays fresh as products load
  const items = ids
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean) as Product[];

  const loadFromServer = useCallback(async () => {
    const token = await tokenStore.getSession();
    if (!token) return;
    try {
      const { ids: saved } = await api.wishlist.get();
      setIds(saved);
    } catch { /* offline — keep current state */ }
  }, []);

  // Sync whenever auth state changes (login/logout)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIds([]);
      return;
    }
    loadFromServer();
  }, [user, authLoading, loadFromServer]);

  const syncToApi = (nextIds: string[]) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const token = await tokenStore.getSession();
      if (!token) return;
      try { await api.wishlist.save(nextIds); } catch { /* ignore */ }
    }, 800);
  };

  const isWishlisted = (id: string) => ids.includes(id);

  const toggle = (product: Product) => {
    const alreadyIn = ids.includes(product.id);
    const nextIds = alreadyIn ? ids.filter((i) => i !== product.id) : [...ids, product.id];
    setIds(nextIds);
    syncToApi(nextIds);
  };

  return (
    <WishlistContext.Provider value={{ items, ids, isWishlisted, toggle, loadFromServer }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be inside WishlistProvider');
  return ctx;
}
