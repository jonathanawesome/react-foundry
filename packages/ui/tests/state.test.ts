import { beforeEach, describe, expect, it } from 'vitest'

import { useUIStore } from '../src/state'

const initialState = {
  isAccessibilityEnabled: false,
  isShelfOpen: true,
  isShelfPinned: true,
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
})
