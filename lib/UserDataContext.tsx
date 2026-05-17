import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, ApiAddress, tokenStore } from './api';

export interface Measurements {
  chest: string;
  waist: string;
  hips: string;
  shoulder: string;
  armLength: string;
  bodyLength: string;
  inseam: string;
}

export type Address = ApiAddress;

export interface NotificationPrefs {
  orderUpdates: boolean;
  promotions: boolean;
  newArrivals: boolean;
  restock: boolean;
  priceDrop: boolean;
}

interface UserDataContextType {
  measurements: Measurements;
  saveMeasurements: (m: Measurements) => Promise<void>;
  addresses: Address[];
  addAddress: (a: Omit<Address, 'id'>) => Promise<void>;
  updateAddress: (id: string, updates: Partial<Omit<Address, 'id'>>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  notificationPrefs: NotificationPrefs;
  setNotificationPref: (key: keyof NotificationPrefs, value: boolean) => void;
}

const emptyMeasurements: Measurements = {
  chest: '', waist: '', hips: '', shoulder: '', armLength: '', bodyLength: '', inseam: '',
};

const UserDataContext = createContext<UserDataContextType | null>(null);

export function UserDataProvider({ children }: { children: ReactNode }) {
  const [measurements, setMeasurements] = useState<Measurements>(emptyMeasurements);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>({
    orderUpdates: true, promotions: true, newArrivals: true, restock: false, priceDrop: true,
  });

  useEffect(() => {
    (async () => {
      const token = await tokenStore.getSession();
      if (!token) return;
      try {
        const [mRes, aRes] = await Promise.all([api.measurements.get(), api.addresses.list()]);
        if (mRes.measurements) setMeasurements(mRes.measurements as unknown as Measurements);
        setAddresses(aRes.addresses);
      } catch { /* offline — use defaults */ }
    })();
  }, []);

  const saveMeasurements = async (m: Measurements) => {
    setMeasurements(m);
    try { await api.measurements.save(m as Record<string, string>); } catch { /* ignore */ }
  };

  const addAddress = async (a: Omit<Address, 'id'>) => {
    try {
      const { address } = await api.addresses.add(a);
      setAddresses((prev) => {
        const updated = a.isDefault ? prev.map((x) => ({ ...x, isDefault: false })) : prev;
        return [...updated, address];
      });
    } catch (err) { throw err; }
  };

  const updateAddress = async (id: string, updates: Partial<Omit<Address, 'id'>>) => {
    await api.addresses.update(id, updates);
    setAddresses((prev) =>
      prev.map((a) => {
        if (updates.isDefault && a.id !== id) return { ...a, isDefault: false };
        return a.id === id ? { ...a, ...updates } : a;
      })
    );
  };

  const deleteAddress = async (id: string) => {
    await api.addresses.remove(id);
    setAddresses((prev) => prev.filter((a) => a.id !== id));
  };

  const setDefaultAddress = async (id: string) => {
    await api.addresses.update(id, { isDefault: true });
    setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })));
  };

  const setNotificationPref = (key: keyof NotificationPrefs, value: boolean) =>
    setNotificationPrefs((prev) => ({ ...prev, [key]: value }));

  return (
    <UserDataContext.Provider value={{
      measurements, saveMeasurements,
      addresses, addAddress, updateAddress, deleteAddress, setDefaultAddress,
      notificationPrefs, setNotificationPref,
    }}>
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const ctx = useContext(UserDataContext);
  if (!ctx) throw new Error('useUserData must be inside UserDataProvider');
  return ctx;
}
