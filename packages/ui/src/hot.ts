/// <reference types="vite/client" />

/**
 * Subscribes to an event the dev server sends over its HMR channel, and returns
 * the unsubscribe. Nothing outside the dev server: in the static build
 * `import.meta.hot` is undefined and the subscription is a no-op.
 */
export function onHotEvent(event: string, listener: () => void): () => void {
  const hot = import.meta.hot
  if (!hot) return () => {}

  hot.on(event, listener)
  return () => hot.off(event, listener)
}
