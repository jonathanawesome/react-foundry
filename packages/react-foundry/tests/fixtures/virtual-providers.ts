import type { FoundryProviderProps } from '@react-foundry/core'

// Stands in for `virtual:react-foundry-providers`. The real plugin emits a passthrough
// when the consumer has no `foundry.providers.tsx`, which is what this mirrors.
export const Provider = ({ children }: FoundryProviderProps) => children
