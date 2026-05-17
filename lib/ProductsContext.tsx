import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, ApiProduct } from './api';
import { API_BASE_URL } from './config';
import { products as staticProducts, Product } from './products';

interface ProductsContextType {
  products: Product[];
  loading: boolean;
  getById: (id: string) => Product | undefined;
  getRelated: (product: Product, limit?: number) => Product[];
  refresh: () => Promise<void>;
}

const ProductsContext = createContext<ProductsContextType | null>(null);

function fixImageUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function apiToProduct(p: ApiProduct): Product {
  return {
    ...p,
    image: { uri: fixImageUrl(p.image) },
    images: p.images?.length
      ? p.images.map((img) => ({ uri: fixImageUrl(img) }))
      : [{ uri: fixImageUrl(p.image) }],
  } as unknown as Product;
}

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(staticProducts);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.products.list();
      if (Array.isArray(data) && data.length > 0) {
        // Use API as the single source of truth; static is offline-only fallback
        setProducts(data.map(apiToProduct));
      }
    } catch {
      // API unavailable — keep static products as fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const getById = (id: string) => products.find((p) => p.id === id);

  const getRelated = (product: Product, limit = 6) =>
    products
      .filter((p) => p.id !== product.id && (p.category === product.category || p.gender === product.gender))
      .slice(0, limit);

  return (
    <ProductsContext.Provider value={{ products, loading, getById, getRelated, refresh: load }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) throw new Error('useProducts must be used inside ProductsProvider');
  return ctx;
}
