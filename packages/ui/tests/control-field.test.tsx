import type { ControlDef } from '@react-foundry/core'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ControlField } from '../src/components/control-field'

function renderField(
  def: ControlDef,
  value: string | number | boolean,
  name = 'control'
) {
  const onChange = vi.fn()
  render(<ControlField name={name} def={def} value={value} onChange={onChange} />)
  return onChange
}

describe('ControlField', () => {
  it('de-camelCases the control name into a label', () => {
    renderField({ type: 'text' }, 'x', 'buttonLabel')

    expect(screen.getByText('Button Label')).toBeInTheDocument()
  })

  describe('text', () => {
    it('renders the value and reports typing', async () => {
      const onChange = renderField({ type: 'text' }, 'hi')
      const input = screen.getByRole('textbox')

      expect(input).toHaveValue('hi')
      await userEvent.type(input, '!')

      expect(onChange).toHaveBeenLastCalledWith('hi!')
    })
  })

  describe('boolean', () => {
    it('renders a checkbox reflecting the value', () => {
      renderField({ type: 'boolean' }, true)

      expect(screen.getByRole('checkbox')).toBeChecked()
    })

    it('reports the toggled value', async () => {
      const onChange = renderField({ type: 'boolean' }, false)
      await userEvent.click(screen.getByRole('checkbox'))

      expect(onChange).toHaveBeenCalledWith(true)
    })
  })

  describe('select', () => {
    it('renders an option per choice and the current value', () => {
      renderField({ type: 'select', options: ['a', 'b', 'c'] }, 'b')

      expect(screen.getByRole('combobox')).toHaveValue('b')
      expect(screen.getAllByRole('option')).toHaveLength(3)
    })

    it('reports the chosen option', async () => {
      const onChange = renderField({ type: 'select', options: ['a', 'b'] }, 'a')
      await userEvent.selectOptions(screen.getByRole('combobox'), 'b')

      expect(onChange).toHaveBeenCalledWith('b')
    })
  })

  describe('radio', () => {
    it('renders a radio per option with the current one checked', () => {
      renderField({ type: 'radio', options: ['sm', 'lg'] }, 'lg')

      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(2)
      expect(screen.getByRole('radio', { name: 'lg' })).toBeChecked()
    })

    it('reports the picked option', async () => {
      const onChange = renderField({ type: 'radio', options: ['sm', 'lg'] }, 'sm')
      await userEvent.click(screen.getByRole('radio', { name: 'lg' }))

      expect(onChange).toHaveBeenCalledWith('lg')
    })
  })

  describe('number', () => {
    it('renders a spinbutton with min/max/step', () => {
      renderField({ type: 'number', min: 0, max: 9, step: 3 }, 6)
      const input = screen.getByRole('spinbutton')

      expect(input).toHaveValue(6)
      expect(input).toHaveAttribute('min', '0')
      expect(input).toHaveAttribute('step', '3')
    })

    // The field is controlled, so its value never leaves 5 during typing; a
    // single change event is the deterministic way to assert the reported type.
    it('reports a numeric value, not a string', () => {
      const onChange = renderField({ type: 'number' }, 5)

      fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '8' } })

      expect(onChange).toHaveBeenLastCalledWith(8)
    })
  })

  describe('range', () => {
    it('renders a slider showing its value', () => {
      renderField({ type: 'range', min: 0, max: 10 }, 4)

      expect(screen.getByRole('slider')).toHaveValue('4')
      expect(screen.getByText('4')).toBeInTheDocument()
    })
  })

  describe('color', () => {
    it('renders a color input reflecting the value', () => {
      renderField({ type: 'color' }, '#ff0000')

      // jsdom exposes color inputs without an ARIA role, so query by type.
      const input = document.querySelector('input[type="color"]')
      expect(input).toHaveValue('#ff0000')
    })
  })
})
