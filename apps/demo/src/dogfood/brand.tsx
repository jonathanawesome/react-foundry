import { createContext, type ReactNode, useContext } from 'react'

interface Brand {
  name: string
  /** Accent color, chosen per foundry's resolved theme so previews track its toggle. */
  accent: string
}

const BrandContext = createContext<Brand | null>(null)

/**
 * Reads the brand a consumer's `foundry.providers.tsx` supplies. Throws without it,
 * exactly like a real design-system hook, which is the point: the component below cannot
 * render outside its provider, yet foundry previews it because the provider wraps it.
 */
export function useBrand(): Brand {
  const brand = useContext(BrandContext)
  if (!brand) {
    throw new Error('useBrand must be used inside the BrandProvider')
  }
  return brand
}

export function BrandProvider({
  accent,
  children,
}: {
  accent: string
  children: ReactNode
}) {
  return (
    <BrandContext.Provider value={{ name: 'Acme', accent }}>
      {children}
    </BrandContext.Provider>
  )
}
