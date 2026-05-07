import { create } from 'zustand';
import type { CartState } from '@/types';

interface CartStore extends CartState {
  updateBreadCount: (id: number, delta: number) => void;
  updateSoupCount: (id: number, delta: number) => void;
}

export const useCartStore = create<CartStore>((set) => ({
  // 初期データ（本来はAPIから取得）
  breads: [
    { id: 1, name: 'クロワッサン', price: 200, count: 0 },
    { id: 2, name: '食パン', price: 350, count: 0 },
  ],
  soups: [
    { id: 101, name: 'コーンポタージュ', price: 400, count: 0 },
    { id: 102, name: 'ミネストローネ', price: 400, count: 0 },
  ],

  updateBreadCount: (id, delta) =>
    set((state) => ({
      breads: state.breads.map((item) =>
        item.id === id
          ? { ...item, count: Math.max(0, item.count + delta) }
          : item,
      ),
    })),

  updateSoupCount: (id, delta) =>
    set((state) => ({
      soups: state.soups.map((item) =>
        item.id === id
          ? { ...item, count: Math.max(0, item.count + delta) }
          : item,
      ),
    })),
}));
