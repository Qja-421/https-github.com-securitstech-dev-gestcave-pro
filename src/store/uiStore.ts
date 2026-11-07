import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  titre: string;
  message: string;
  date: Date;
  lue: boolean;
  action?: { label: string; path: string };
}

interface UIState {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  ajouterNotification: (n: Omit<Notification, 'id' | 'date' | 'lue'>) => void;
  marquerLue: (id: string) => void;
  marquerToutesLues: () => void;
  supprimerNotification: (id: string) => void;
  notificationsNonLues: () => number;
}

export const useUIStore = create<UIState>((set, get) => ({
  darkMode: localStorage.getItem('gestcave_dark') === 'true',
  sidebarCollapsed: localStorage.getItem('gestcave_sidebar_collapsed') === 'true',
  notifications: [],

  toggleDarkMode: () => {
    const next = !get().darkMode;
    localStorage.setItem('gestcave_dark', String(next));
    set({ darkMode: next });
    if (next) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  },

  toggleSidebar: () => {
    const next = !get().sidebarCollapsed;
    localStorage.setItem('gestcave_sidebar_collapsed', String(next));
    set({ sidebarCollapsed: next });
  },

  ajouterNotification: (n) => {
    const notif: Notification = {
      ...n,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date(),
      lue: false
    };
    set(state => ({ notifications: [notif, ...state.notifications].slice(0, 50) }));
  },

  marquerLue: (id) => {
    set(state => ({
      notifications: state.notifications.map(n => n.id === id ? { ...n, lue: true } : n)
    }));
  },

  marquerToutesLues: () => {
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, lue: true }))
    }));
  },

  supprimerNotification: (id) => {
    set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
  },

  notificationsNonLues: () => get().notifications.filter(n => !n.lue).length,
}));
