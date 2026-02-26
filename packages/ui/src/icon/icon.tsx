import type { RecipeVariants } from '@react-foundry/style'
import { iconClass } from './icon.css'
import { IconMap } from './icon-map'

type IconVariants = RecipeVariants<typeof iconClass>

export type IconNames = keyof typeof IconMap

export type IconProps = IconVariants & {
  name: IconNames
}

export const Icon = ({ name, rotate, size = 'small' }: IconProps) => {
  const TheIcon = IconMap[name]
  return (
    <div
      className={iconClass({
        rotate,
        size,
      })}
    >
      <TheIcon />
    </div>
  )
}
