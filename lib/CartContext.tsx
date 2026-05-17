import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Product } from './products';
import { api, CartApiItem, tokenStore } from './api';
import { useAuth } from './AuthContext';

export interface CartItem {
  product: Product;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

interface CartState { items: CartItem[] }

type CartAction =
  | { type: 'ADD'; item: CartItem }
  | { type: 'REMOVE'; productId: string; selectedSize: string; selectedColor: string }
  | { type: 'UPDATE_QTY'; productId: string; selectedSize: string; selectedColor: string; quantity: number }
  | { type: 'SET'; items: CartItem[] }
  | { type: 'CLEAR' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET': return { items: action.items };
    case 'ADD': {
      const idx = state.items.findIndex(
        (i) => i.product.id === action.item.product.id && i.selectedSize === action.item.selectedSize && i.selectedColor === action.item.selectedColor
      );
      if (idx >= 0) {
        const items = [...state.items];
        items[idx] = { ...items[idx], quantity: items[idx].quantity + action.item.quantity };
        return { items };
      }
      return { items: [...state.items, action.item] };
    }
    case 'REMOVE':
      return { items: state.items.filter((i) => !(i.product.id === action.productId && i.selectedSize === action.selectedSize && i.selectedColor === action.selectedColor)) };
    case 'UPDATE_QTY':
      return { items: state.items.map((i) => i.product.id === action.productId && i.selectedSize === action.selectedSize && i.selectedColor === action.selectedColor ? { ...i, quantity: action.quantity } : i) };
    case 'CLEAR': return { items: [] };
    default: return state;
  }
}

function toApiItems(items: CartItem[]): CartApiItem[] {
  return items.map((i) => ({
    productId: i.product.id,
    name: i.product.name,
    price: i.product.price,
    image: typeof i.product.image === 'string'
      ? i.product.image
      : (i.product.image as { uri?: string })?.uri ?? '',
    quantity: i.quantity,
    selectedSize: i.selectedSize,
    selectedColor: i.selectedColor,
  }));
}

function fromApiItems(items: CartApiItem[]): CartItem[] {
  return items.map((i) => ({
    product: {
      id: i.productId, name: i.name, price: i.price,
      image: i.image, images: [i.image],
      gender: '', category: '', description: '',
      sizes: [], colors: [], rating: 0, reviewCount: 0,
      isNew: false, isSale: false, isFeatured: false, inStock: true,
    } as unknown as Product,
    quantity: i.quantity,
    selectedSize: i.selectedSize,
    selectedColor: i.selectedColor,
  }));
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQty: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  loadFromServer: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadFromServer = useCallback(async () => {
    const token = await tokenStore.getSession();
    if (!token) return;
    try {
      const { items } = await api.cart.get();
      dispatch({ type: 'SET', items: fromApiItems(items) });
    } catch { /* offline — keep current state */ }
  }, []);

  // Sync with server whenever auth state changes (login/logout)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      dispatch({ type: 'CLEAR' });
      return;
    }
    loadFromServer();
  }, [user, authLoading, loadFromServer]);

  const syncToApi = (items: CartItem[]) => {
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(async () => {
      const token = await tokenStore.getSession();
      if (!token) return;
      try { await api.cart.save(toApiItems(items)); } catch { /* ignore sync errors */ }
    }, 800);
  };

  const addItem = (item: CartItem) => {
    const next = (() => {
      const idx = state.items.findIndex(
        (i) => i.product.id === item.product.id && i.selectedSize === item.selectedSize && i.selectedColor === item.selectedColor
      );
      if (idx >= 0) {
        const items = [...state.items];
        items[idx] = { ...items[idx], quantity: items[idx].quantity + item.quantity };
        return items;
      }
      return [...state.items, item];
    })();
    dispatch({ type: 'ADD', item });
    syncToApi(next);
  };

  const removeItem = (productId: string, size: string, color: string) => {
    const next = state.items.filter((i) => !(i.product.id === productId && i.selectedSize === size && i.selectedColor === color));
    dispatch({ type: 'REMOVE', productId, selectedSize: size, selectedColor: color });
    syncToApi(next);
  };

  const updateQty = (productId: string, size: string, color: string, quantity: number) => {
    const next = state.items.map((i) => i.product.id === productId && i.selectedSize === size && i.selectedColor === color ? { ...i, quantity } : i);
    dispatch({ type: 'UPDATE_QTY', productId, selectedSize: size, selectedColor: color, quantity });
    syncToApi(next);
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR' });
    syncToApi([]);
  };

  return (
    <CartContext.Provider value={{
      items: state.items,
      totalItems: state.items.reduce((s, i) => s + i.quantity, 0),
      totalPrice: state.items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      addItem, removeItem, updateQty, clearCart, loadFromServer,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be within CartProvider');
  return ctx;
}
