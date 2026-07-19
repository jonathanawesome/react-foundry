import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

  // nav tree
  /** Paths of expanded nav nodes. An array rather than a Set so it serializes. */
  expandedNodes: string[]
  toggleNode: (path: string) => void
  expandNodes: (paths: string[]) => void
}

const uiStore = create<UIStore>()(
  persist(
    (set, get) => ({
      isAccessibilityEnabled: false,
      isShelfOpen: true,
      isShelfPinned: true,
      expandedNodes: [],

      toggleAccessibility: () => {
        const isAccessibilityEnabled = get().isAccessibilityEnabled
        return set({ isAccessibilityEnabled: !isAccessibilityEnabled })
      },

      setIsShelfPinned: (bool) => {
        return set({ isShelfPinned: bool })
      },

      toggleShelf: () => {
        const isShelfOpen = get().isShelfOpen
        return set({ isShelfOpen: !isShelfOpen })
      },

      toggleNode: (path) => {
        const expandedNodes = get().expandedNodes

        return set({
          expandedNodes: expandedNodes.includes(path)
            ? expandedNodes.filter((p) => p !== path)
            : [...expandedNodes, path],
        })
      },

      expandNodes: (paths) => {
        const expandedNodes = get().expandedNodes
        const missing = paths.filter((p) => !expandedNodes.includes(p))

        // Skip the write when nothing is new, so auto-expanding on navigation
        // does not trigger a re-render or a storage write on every route change.
        if (missing.length === 0) return

        return set({ expandedNodes: [...expandedNodes, ...missing] })
      },
    }),
    {
      name: 'react-foundry-ui',

      // Editing a preview file reloads the page, so without persistence the
      // shelf would collapse and unpin on every save.
      partialize: (state) => ({
        isAccessibilityEnabled: state.isAccessibilityEnabled,
        isShelfOpen: state.isShelfOpen,
        isShelfPinned: state.isShelfPinned,
        expandedNodes: state.expandedNodes,
      }),
    }
  )
)

export const useUIStore = createSelectors(uiStore)
