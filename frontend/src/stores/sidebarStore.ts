import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SidebarState {
  isExpanded: boolean;
  expandedMenus: Record<string, boolean>;
  toggle: () => void;
  setExpanded: (expanded: boolean) => void;
  toggleMenu: (menuKey: string) => void;
  setMenuExpanded: (menuKey: string, expanded: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isExpanded: false,
      expandedMenus: {},
      toggle: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
      toggleMenu: (menuKey: string) =>
        set((state) => ({
          expandedMenus: {
            ...state.expandedMenus,
            [menuKey]: !state.expandedMenus[menuKey],
          },
        })),
      setMenuExpanded: (menuKey: string, expanded: boolean) =>
        set((state) => ({
          expandedMenus: {
            ...state.expandedMenus,
            [menuKey]: expanded,
          },
        })),
    }),
    {
      name: "sidebar-storage",
    },
  ),
);
