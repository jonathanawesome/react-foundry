import { RecipeVariants } from '@react-foundry/style'

import { IconMap } from './icon-map'
import { iconClass } from './icon.css'

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
