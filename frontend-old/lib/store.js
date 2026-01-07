import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      userType: null,
      token: null,

      login: (userData, type, authToken) => {
        set({
          user: userData,
          userType: type,
          token: authToken
        });
      },

      logout: () => {
        set({
          user: null,
          userType: null,
          token: null
        });
      },

      updateUser: (userData) => {
        set({ user: userData });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
