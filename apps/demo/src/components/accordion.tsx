import { Accordion as BaseAccordion } from '@base-ui/react/accordion'

import { accordion } from './base-ui.css'

export interface AccordionSection {
  /** The heading the section opens from. */
  title: string
  /** What the section shows when open. */
  body: string
}

export interface AccordionProps {
  /** The sections, in order. Each one opens to its body. */
  sections: AccordionSection[]
  /** Whether more than one section may be open at a time. */
  multiple?: boolean
  /** Which sections start open, by index. */
  defaultOpen?: number[]
}

/**
 * Base UI's accordion parts composed into one component with a small, documented
 * surface, so a preview can drive it through `controlsFor` and the props panel can
 * show each prop as declared here.
 */
export const Accordion = ({ sections, multiple = true, defaultOpen }: AccordionProps) => (
  <BaseAccordion.Root
    className={accordion.root}
    multiple={multiple}
    defaultValue={defaultOpen}
  >
    {sections.map((section, index) => (
      <BaseAccordion.Item key={index} value={index} className={accordion.item}>
        <BaseAccordion.Header>
          <BaseAccordion.Trigger className={accordion.trigger}>
            {section.title}
          </BaseAccordion.Trigger>
        </BaseAccordion.Header>
        <BaseAccordion.Panel className={accordion.panel}>
          {section.body}
        </BaseAccordion.Panel>
      </BaseAccordion.Item>
    ))}
  </BaseAccordion.Root>
)
