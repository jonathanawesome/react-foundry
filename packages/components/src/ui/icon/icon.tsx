import { icons } from 'lucide-react'

export type IconName = keyof typeof icons

type IconProps = {
  name: IconName
  rotate?: '90' | '180' | '270'
  size?: number
}

export const Icon = ({ name, rotate, size = 16 }: IconProps) => {
  const LucideIcon = icons[name]
  return (
    <LucideIcon
      size={size}
      style={rotate ? { transform: `rotate(${rotate}deg)` } : undefined}
    />
  )
}
