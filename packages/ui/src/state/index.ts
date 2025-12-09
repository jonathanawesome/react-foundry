import { create } from 'zustand'

import { createSelectors } from './create-selectors'

type UIStore = {
  // accessibility
  isAccessibilityEnabled: boolean
  toggleAccessibility: () => void

  // shelf
  isShelfOpen: boolean
  isShelfPinned: boolean
  toggleShelf: () => void
  setIsShelfPinned: (val: boolean) => void
}

const uiStore = create<UIStore>()((set, get) => ({
  isAccessibilityEnabled: false,
  isShelfOpen: true,
  isShelfPinned: true,

  toggleAccessibility: () => {
    const isAccessibilityEnabled = get().isAccessibilityEnabled
    return set({ isAccessibilityEnabled: !isAccessibilityEnabled })
  },

  setIsShelfPinned: bool => {
    return set({ isShelfPinned: bool })
  },

  toggleShelf: () => {
    const isShelfOpen = get().isShelfOpen
    return set({ isShelfOpen: !isShelfOpen })
  },
}))

export const useUIStore = createSelectors(uiStore)
