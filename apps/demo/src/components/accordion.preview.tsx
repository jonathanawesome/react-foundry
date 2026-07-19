import { Accordion } from '@base-ui/react/accordion'
import { createPreview, type NavPath } from '@react-foundry/core'

import { accordion } from './base-ui.css'

export const nav: NavPath = 'Components/Disclosure/Accordion'

const sections = [
  {
    title: 'What is a preview?',
    body: 'A React component that fills the canvas. There is no separate concept for one that holds state.',
  },
  {
    title: 'How is the tree ordered?',
    body: 'Sections follow the order declared in your config, and previews follow the order written in the file.',
  },
  {
    title: 'What goes in the URL?',
    body: 'The export name, never the label, so rewording a label cannot break a link.',
  },
]

export const Default = createPreview(() => (
  <Accordion.Root className={accordion.root}>
    {sections.map((section) => (
      <Accordion.Item key={section.title} className={accordion.item}>
        <Accordion.Header>
          <Accordion.Trigger className={accordion.trigger}>
            {section.title}
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className={accordion.panel}>{section.body}</Accordion.Panel>
      </Accordion.Item>
    ))}
  </Accordion.Root>
))

export const OpenByDefault = createPreview({
  label: 'First Section Open',
  render: () => (
    <Accordion.Root className={accordion.root} defaultValue={[0]}>
      {sections.map((section, index) => (
        <Accordion.Item key={section.title} value={index} className={accordion.item}>
          <Accordion.Header>
            <Accordion.Trigger className={accordion.trigger}>
              {section.title}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={accordion.panel}>{section.body}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
})

export const SingleAtATime = createPreview({
  label: 'One Open at a Time',
  render: () => (
    <Accordion.Root className={accordion.root} multiple={false}>
      {sections.map((section) => (
        <Accordion.Item key={section.title} className={accordion.item}>
          <Accordion.Header>
            <Accordion.Trigger className={accordion.trigger}>
              {section.title}
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel className={accordion.panel}>{section.body}</Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  ),
})
