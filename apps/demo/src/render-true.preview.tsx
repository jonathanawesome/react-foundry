import { createPreview, type NavPath } from '@react-foundry/core'

export const nav: NavPath = 'Dogfood/Render True'

/**
 * A render-true probe: raw, unstyled HTML that leans entirely on browser defaults.
 * If foundry's chrome reset leaks into the canvas, these lose their defaults —
 * the button goes flat, the lists lose their markers, the input loses its border,
 * the paragraph loses its margin. If the canvas is clean, they look like the
 * browser's own rendering.
 */
export const RawElements = createPreview({
  label: 'Raw Elements',
  render: () => (
    <div style={{ maxWidth: 480 }}>
      <h2>A default heading</h2>
      <p>
        A paragraph that should keep its default margins and inherit nothing
        foundry-specific unless it sets its own styles.
      </p>

      <button type="button">A native, unstyled button</button>

      <ul>
        <li>Unordered item — should show a bullet</li>
        <li>Another bulleted item</li>
      </ul>

      <ol>
        <li>Ordered item — should show a number</li>
        <li>Second numbered item</li>
      </ol>

      <p>
        <input type="text" placeholder="A native text input" />
      </p>

      <p>
        <select>
          <option>A native select</option>
          <option>Second option</option>
        </select>
      </p>

      <p>
        <button type="button" disabled>
          A disabled button (should look natively disabled)
        </button>
      </p>
    </div>
  ),
})
