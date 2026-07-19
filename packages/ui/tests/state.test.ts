import { beforeEach, describe, expect, it } from 'vitest'

import { useUIStore } from '../src/state'

const initialState = {
  isAccessibilityEnabled: false,
  isShelfOpen: true,
  isShelfPinned: true,
  expandedNodes: [],
}

describe('useUIStore', () => {
  beforeEach(() => {
    useUIStore.setState(initialState)
  })

  it('starts with the shelf open and pinned and accessibility off', () => {
    const state = useUIStore.getState()

    expect(state.isShelfOpen).toBe(true)
    expect(state.isShelfPinned).toBe(true)
    expect(state.isAccessibilityEnabled).toBe(false)
  })

  it('toggles accessibility in both directions', () => {
    useUIStore.getState().toggleAccessibility()
    expect(useUIStore.getState().isAccessibilityEnabled).toBe(true)

    useUIStore.getState().toggleAccessibility()
    expect(useUIStore.getState().isAccessibilityEnabled).toBe(false)
  })

  it('toggles the shelf in both directions', () => {
    useUIStore.getState().toggleShelf()
    expect(useUIStore.getState().isShelfOpen).toBe(false)

    useUIStore.getState().toggleShelf()
    expect(useUIStore.getState().isShelfOpen).toBe(true)
  })

  it('sets the pinned state to exactly the value given', () => {
    useUIStore.getState().setIsShelfPinned(false)
    expect(useUIStore.getState().isShelfPinned).toBe(false)

    useUIStore.getState().setIsShelfPinned(false)
    expect(useUIStore.getState().isShelfPinned).toBe(false)

    useUIStore.getState().setIsShelfPinned(true)
    expect(useUIStore.getState().isShelfPinned).toBe(true)
  })

  it('exposes a selector hook for every state key, including actions', () => {
    expect(Object.keys(useUIStore.use).sort()).toEqual(
      Object.keys(useUIStore.getState()).sort()
    )
  })

  // Editing a preview file reloads the page, so this is what stops the shelf
  // collapsing on every save.
  describe('expanded nodes', () => {
    it('starts with nothing expanded', () => {
      expect(useUIStore.getState().expandedNodes).toEqual([])
    })

    it('toggles a node in both directions', () => {
      useUIStore.getState().toggleNode('Forms')
      expect(useUIStore.getState().expandedNodes).toEqual(['Forms'])

      useUIStore.getState().toggleNode('Forms')
      expect(useUIStore.getState().expandedNodes).toEqual([])
    })

    it('keeps other nodes untouched when toggling one', () => {
      useUIStore.getState().toggleNode('Forms')
      useUIStore.getState().toggleNode('Layout')
      useUIStore.getState().toggleNode('Forms')

      expect(useUIStore.getState().expandedNodes).toEqual(['Layout'])
    })

    it('expands several ancestors at once', () => {
      useUIStore.getState().expandNodes(['a', 'a/b', 'a/b/c'])

      expect(useUIStore.getState().expandedNodes).toEqual(['a', 'a/b', 'a/b/c'])
    })

    it('does not duplicate an already expanded node', () => {
      useUIStore.getState().toggleNode('a')
      useUIStore.getState().expandNodes(['a', 'a/b'])

      expect(useUIStore.getState().expandedNodes).toEqual(['a', 'a/b'])
    })

    // Auto-expanding runs on every navigation, so a no-op must not write. A new
    // array reference would re-render the shelf and hit storage each time.
    it('keeps the same array reference when nothing is new', () => {
      useUIStore.getState().expandNodes(['a'])
      const before = useUIStore.getState().expandedNodes

      useUIStore.getState().expandNodes(['a'])

      expect(useUIStore.getState().expandedNodes).toBe(before)
    })
  })
})
