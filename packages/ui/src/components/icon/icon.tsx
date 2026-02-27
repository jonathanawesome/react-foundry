import type { IconProps as PhosphorIconProps } from '@phosphor-icons/react'
import type { RecipeVariants } from '@react-foundry/style'
import { iconClass } from './icon.css'
import { IconMap } from './icon-map'

type IconVariants = NonNullable<RecipeVariants<typeof iconClass>>

export type IconName = keyof typeof IconMap

export type IconProps = Omit<PhosphorIconProps, 'ref' | 'size' | 'color'> & {
  name: IconName
  rotate?: IconVariants['rotate']
  size?: IconVariants['size']
}

export const Icon = ({ name, rotate, size = 'md' }: IconProps) => {
  const IconComponent = IconMap[name]
  return (
    <div className={iconClass({ rotate, size })}>
      <IconComponent size={16} />
    </div>
  )
}
