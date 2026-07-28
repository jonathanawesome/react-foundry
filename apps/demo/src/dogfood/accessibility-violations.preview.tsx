import type { ReactNode } from 'react'
import { createPreview, type NavPath } from 'react-foundry'

export const nav: NavPath = 'Dogfood/Accessibility Violations'

/** A viewport-tall band, so consecutive violations cannot be on screen together. */
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section
      style={{
        minHeight: '70vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: 12,
      }}
    >
      <h2>{title}</h2>
      {children}
    </section>
  )
}

/**
 * Deliberately broken markup, for exercising the accessibility checker against something
 * that actually fails. The rest of the demo is clean enough to report nothing, which
 * makes the checker awkward to try out.
 *
 * The sections are spread over several viewports on purpose: locating a violation has to
 * scroll it into view, and the overlay has to keep tracking the element while the pane
 * scrolls. Every target is given real dimensions for the same reason, since an outline
 * drawn around a zero-height element proves nothing.
 */
export const ScatteredViolations = createPreview({
  label: 'Scattered Violations',
  render: () => (
    <div style={{ maxWidth: 560 }}>
      <Section title="Image without alt text">
        {/* biome-ignore lint/a11y/useAltText: failing this rule is the whole point */}
        <img src="/does-not-exist.png" width={120} height={80} />
      </Section>

      <Section title="Button with no accessible name">
        <button type="button" style={{ width: 44, height: 44 }} />
      </Section>

      <Section title="Link with no accessible name">
        {/* biome-ignore lint/a11y/useAnchorContent: failing this rule is the whole point */}
        <a
          href="https://example.com"
          style={{ display: 'inline-block', width: 160, height: 32, background: '#ddd' }}
        />
      </Section>

      <Section title="Input with no label">
        <input type="text" placeholder="Placeholder is not a label" />
      </Section>

      {/* The background is deliberately left to the theme rather than pinned. Grey this
          light fails against a light canvas and passes against a dark one, so it is a
          violation that appears in one mode and not the other, which is the case the
          dual-mode check exists to find. Pinning a white background here would make the
          contrast identical in both modes and quietly defeat that. */}
      <Section title="Text with theme-dependent contrast">
        <p style={{ color: '#a0a0a0', padding: 24 }}>
          This grey is around 2.5:1 on a light background, well under the 4.5:1 WCAG AA
          asks for body text, but comfortably clear of it on a dark one. Contrast is the
          only rule family that depends on the rendered theme.
        </p>
      </Section>
    </div>
  ),
})
