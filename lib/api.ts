import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const SESSION_KEY = 'ziva_session_token';
const ADMIN_KEY = 'ziva_admin_token';

// ─── Token storage ───────────────────────────────────────────────────────────
export const tokenStore = {
  getSession: () => AsyncStorage.getItem(SESSION_KEY),
  setSession: (t: string) => AsyncStorage.setItem(SESSION_KEY, t),
  clearSession: () => AsyncStorage.removeItem(SESSION_KEY),
  getAdmin: () => AsyncStorage.getItem(ADMIN_KEY),
  setAdmin: (t: string) => AsyncStorage.setItem(ADMIN_KEY, t),
  clearAdmin: () => AsyncStorage.removeItem(ADMIN_KEY),
};

// ─── Core fetch wrapper ──────────────────────────────────────────────────────
type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function request<T = unknown>(
  path: string,
  method: Method = 'GET',
  body?: unknown,
  useAdmin = false,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (useAdmin) {
    const adminToken = await tokenStore.getAdmin();
    if (adminToken) headers['x-admin-token'] = adminToken;
  } else {
    const sessionToken = await tokenStore.getSession();
    if (sessionToken) headers['Authorization'] = `Bearer ${sessionToken}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    sendOtp: (email: string) =>
      request('/api/auth/send-otp', 'POST', { email }),
    signup: (name: string, email: string, password: string, code: string) =>
      request<{ user: ApiUser; token: string }>('/api/auth/signup', 'POST', { name, email, password, code }),
    login: (email: string, password: string) =>
      request<{ user: ApiUser; token: string }>('/api/auth/login', 'POST', { email, password }),
    me: () =>
      request<{ user: ApiUser }>('/api/auth/me'),
    logout: () =>
      request('/api/auth/me', 'DELETE'),
    updateProfile: (name: string) =>
      request<{ user: ApiUser }>('/api/auth/me', 'PATCH', { name }),
    changePassword: (currentPassword: string, newPassword: string) =>
      request<{ ok: boolean }>('/api/auth/me', 'PATCH', { currentPassword, newPassword }),
    deleteAccount: () =>
      request<{ ok: boolean }>('/api/auth/account', 'DELETE'),
  },
  admin: {
    login: (password: string) =>
      request<{ ok: boolean; token: string }>('/api/admin/auth', 'POST', { password }),
    logout: () =>
      request('/api/admin/auth', 'DELETE', undefined, true),
    getProducts: () =>
      request<{ products: ApiProduct[] }>('/api/admin/products', 'GET', undefined, true),
    addProduct: (data: Partial<ApiProduct>) =>
      request<{ product: ApiProduct }>('/api/admin/products', 'POST', data, true),
    updateProduct: (id: string, data: Partial<ApiProduct>) =>
      request('/api/admin/products/' + id, 'PATCH', data, true),
    deleteProduct: (id: string) =>
      request('/api/admin/products/' + id, 'DELETE', undefined, true),
    getOrders: () =>
      request<{ orders: ApiOrder[]; stats: AdminStats }>('/api/admin/orders', 'GET', undefined, true),
    updateOrderStatus: (id: string, status: string) =>
      request('/api/admin/orders', 'PATCH', { id, status }, true),
    getCustomers: () =>
      request<{ customers: ApiCustomer[] }>('/api/admin/customers', 'GET', undefined, true),
    getDeviceStats: () =>
      request<{ totals: { mobile: number; tablet: number; desktop: number } }>('/api/admin/device-stats', 'GET', undefined, true),
    getChats: () =>
      request<{ chats: ApiChat[] }>('/api/admin/chats', 'GET', undefined, true),
    getChat: (id: string) =>
      request<{ chat: ApiChat }>(`/api/admin/chats/${id}`, 'GET', undefined, true),
    replyToChat: (id: string, text: string) =>
      request<{ ok: boolean; message: ApiChatMessage }>(`/api/admin/chats/${id}`, 'POST', { text }, true),
    patchChat: (id: string, data: Partial<ApiChat>) =>
      request(`/api/admin/chats/${id}`, 'PATCH', data, true),
    getInvoiceUrl: async (orderId: string): Promise<string> => {
      const token = await tokenStore.getAdmin();
      return `${API_BASE_URL}/api/user/orders/${orderId}/invoice${token ? `?adminToken=${encodeURIComponent(token)}` : ''}`;
    },
  },
  products: {
    list: () =>
      request<ApiProduct[]>('/api/products'),
  },
  cart: {
    get: () =>
      request<{ items: CartApiItem[] }>('/api/user/cart'),
    save: (items: CartApiItem[]) =>
      request('/api/user/cart', 'PUT', { items }),
  },
  wishlist: {
    get: () =>
      request<{ ids: string[] }>('/api/user/wishlist'),
    save: (ids: string[]) =>
      request('/api/user/wishlist', 'PUT', { ids }),
  },
  orders: {
    list: () =>
      request<{ orders: ApiOrder[] }>('/api/user/orders'),
    place: (data: PlaceOrderData) =>
      request<{ order: ApiOrder }>('/api/user/orders', 'POST', data),
  },
  measurements: {
    get: () =>
      request<{ measurements: Record<string, string> | null }>('/api/user/measurements'),
    save: (measurements: Record<string, string>) =>
      request('/api/user/measurements', 'PUT', { measurements }),
  },
  chats: {
    start: (customerName: string, customerEmail: string, text: string) =>
      request<{ chatId: string; customerName: string }>('/api/chats', 'POST', { customerName, customerEmail, text }),
    get: (chatId: string, markRead = false) =>
      request<{ chat: ApiChat }>(`/api/chats?chatId=${encodeURIComponent(chatId)}&markRead=${markRead ? '1' : '0'}`),
    sendMessage: (chatId: string, text: string) =>
      request<{ ok: boolean; message: ApiChatMessage }>(`/api/chats/${encodeURIComponent(chatId)}/messages`, 'POST', { text }),
  },
  payment: {
    initialize: (data: { email: string; amount: number; reference: string; callbackUrl: string }) =>
      request<{ authorization_url: string; access_code: string; reference: string }>(
        '/api/checkout/initialize',
        'POST',
        data,
      ),
  },
  addresses: {
    list: () =>
      request<{ addresses: ApiAddress[] }>('/api/user/addresses'),
    add: (address: Omit<ApiAddress, 'id'>) =>
      request<{ address: ApiAddress }>('/api/user/addresses', 'POST', address),
    update: (id: string, updates: Partial<ApiAddress>) =>
      request('/api/user/addresses', 'PATCH', { id, ...updates }),
    remove: (id: string) =>
      request(`/api/user/addresses?id=${id}`, 'DELETE'),
  },
};

// ─── Shared types ─────────────────────────────────────────────────────────────
export interface ApiUser {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  isAdmin?: boolean;
}

export interface ApiProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images: string[];
  gender: string;
  category: string;
  description: string;
  sizes: string[];
  colors: string[];
  fabrics?: string[];
  isNew: boolean;
  isSale: boolean;
  isFeatured: boolean;
  inStock: boolean;
  rating: number;
  reviewCount: number;
}

export interface CartApiItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  selectedSize: string;
  selectedColor: string;
}

export interface ApiOrder {
  id: string;
  createdAt: string;
  status: string;
  items: CartApiItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer?: { name: string; email: string; phone?: string };
  delivery?: { address: string; city: string; state: string };
}

export interface PlaceOrderData {
  reference: string;
  items: CartApiItem[];
  subtotal: number;
  shipping: number;
  total: number;
  customer: { name: string; email: string; phone?: string };
  delivery: { address: string; city: string; state: string };
}

export interface ApiAddress {
  id: string;
  nickname: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  landmark: string;
  isDefault: boolean;
}

export interface AdminStats {
  total: number;
  todayCount: number;
  todayRevenue: number;
  allRevenue: number;
  byStatus: Record<string, number>;
}

export interface ApiCustomer {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface ApiChatMessage {
  from: 'customer' | 'admin';
  text: string;
  timestamp: string;
}

export interface ApiChat {
  id: string;
  customerName: string;
  customerEmail: string;
  status: 'open' | 'closed';
  messages: ApiChatMessage[];
  unreadAdmin: number;
  unreadCustomer: number;
  createdAt: string;
  updatedAt: string;
}
