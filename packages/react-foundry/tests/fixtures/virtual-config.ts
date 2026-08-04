import type { NavItem } from '@react-foundry/core'

// Stands in for `virtual:react-foundry-config`, which the CLI writes into the user's
// cache dir at dev time. Aliased in vitest.config.ts so the app tree can be imported
// under test at all.
export const foundryTitle = 'Fixture Foundry'

export const foundryNav: NavItem[] = [{ label: 'Forms', children: [{ label: 'Button' }] }]
