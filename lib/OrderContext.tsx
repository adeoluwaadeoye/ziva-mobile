import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, ApiOrder, tokenStore } from './api';
import { CartItem } from './CartContext';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from './config';

export type OrderStatus = 'processing' | 'paid' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  address: string;
}

interface OrderContextType {
  orders: Order[];
  loadingOrders: boolean;
  placeOrder: (
    items: CartItem[],
    customer: { name: string; email: string; phone?: string },
    delivery: { address: string; city: string; state: string },
    deliveryFee?: number,
    reference?: string,
  ) => Promise<Order>;
  refreshOrders: () => Promise<void>;
}

const OrderContext = createContext<OrderContextType | null>(null);

function resolveImage(src: string): string {
  if (!src) return '';
  if (src.startsWith('http://') || src.startsWith('https://')) return src;
  return `${API_BASE_URL}${src.startsWith('/') ? '' : '/'}${src}`;
}

function apiToOrder(o: ApiOrder): Order {
  return {
    id: o.id,
    createdAt: o.createdAt,
    status: o.status as OrderStatus,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    items: (o.items ?? []).map((i: any) => ({
      name: i.name ?? i.product?.name ?? '',
      price: Number(i.price ?? i.product?.price ?? 0),
      quantity: Number(i.quantity ?? 1),
      size: i.selectedSize ?? i.size ?? '',
      color: i.selectedColor ?? i.color ?? '',
      image: resolveImage(i.image || (typeof i.product?.image === 'string' ? i.product.image : i.product?.image?.uri ?? '')),
    })),
    subtotal: Number(o.subtotal ?? 0),
    deliveryFee: Number(o.shipping ?? 0),
    total: Number(o.total ?? 0),
    address: o.delivery ? `${o.delivery.address}, ${o.delivery.city}, ${o.delivery.state}` : '',
  };
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const refreshOrders = useCallback(async () => {
    const token = await tokenStore.getSession();
    if (!token) return;
    setLoadingOrders(true);
    try {
      const { orders: raw } = await api.orders.list();
      setOrders(raw.map(apiToOrder));
    } catch {
      // Network/server error — keep existing orders visible, let pull-to-refresh retry
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  // Sync whenever auth state changes (login/logout)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrders([]);
      return;
    }
    refreshOrders();
  }, [user, authLoading, refreshOrders]);

  const placeOrder = async (
    cartItems: CartItem[],
    customer: { name: string; email: string; phone?: string },
    delivery: { address: string; city: string; state: string },
    deliveryFee = 1500,
    reference?: string,
  ): Promise<Order> => {
    const subtotal = cartItems.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const total = subtotal + deliveryFee;
    const { order } = await api.orders.place({
      reference: reference ?? `MOB-${Date.now()}`,
      items: cartItems.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        price: i.product.price,
        image: resolveImage(
          typeof i.product.image === 'string'
            ? i.product.image
            : (i.product.image as { uri?: string })?.uri ?? ''
        ),
        quantity: i.quantity,
        selectedSize: i.selectedSize,
        selectedColor: i.selectedColor,
      })),
      subtotal,
      shipping: deliveryFee,
      total,
      customer,
      delivery,
    });
    const placed = apiToOrder(order);
    setOrders((prev) => [placed, ...prev]);
    return placed;
  };

  return (
    <OrderContext.Provider value={{ orders, loadingOrders, placeOrder, refreshOrders }}>
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error('useOrders must be inside OrderProvider');
  return ctx;
}
