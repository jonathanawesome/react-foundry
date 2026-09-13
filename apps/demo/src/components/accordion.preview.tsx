import { controlsFor, createPreview, type NavPath } from 'react-foundry'

import { Accordion } from './accordion'

export const nav: NavPath = 'Demo/Disclosure/Accordion'

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

// The sections as a list control on the array prop, editable row by row from the
// panel, with the rows riding in the URL as JSON. Bound with controlsFor, so each
// control's info mark shows the prop as declared on Accordion, description included.
export const Playground = createPreview({
  controls: controlsFor(Accordion, {
    sections: {
      type: 'list',
      of: { title: { type: 'text', default: 'New section' }, body: { type: 'text' } },
      default: sections,
    },
    multiple: { type: 'boolean', default: true },
  }),
  render: (v) => <Accordion sections={v.sections} multiple={v.multiple} />,
})

export const Default = createPreview(() => <Accordion sections={sections} />)

export const OpenByDefault = createPreview({
  label: 'First Section Open',
  render: () => <Accordion sections={sections} defaultOpen={[0]} />,
})

export const SingleAtATime = createPreview({
  label: 'One Open at a Time',
  render: () => <Accordion sections={sections} multiple={false} />,
})
