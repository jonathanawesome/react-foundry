import type { ControlDef, ControlGroup, ListControlDef } from '@react-foundry/core'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ListField, type ListRowValue } from '../src/components/list-field/list-field'

const sectionRow: ControlGroup = {
  title: { type: 'text', default: 'Untitled' },
  open: { type: 'boolean', default: false },
}

const sections: ListControlDef = { type: 'list', of: sectionRow }

const tagRow: ControlDef = { type: 'select', options: ['a', 'b'], default: 'a' }

const tags: ListControlDef = { type: 'list', of: tagRow }

function renderList(def: ListControlDef, rows: ListRowValue[], name = 'sections') {
  const onRowChange = vi.fn()
  const onRowsChange = vi.fn()
  render(
    <ListField
      name={name}
      def={def}
      rows={rows}
      onRowChange={onRowChange}
      onRowsChange={onRowsChange}
    />
  )
  return { onRowChange, onRowsChange }
}

describe('ListField', () => {
  it('draws the list as a section named for the control', () => {
    renderList(sections, [])

    expect(screen.getByRole('group', { name: 'Sections' })).toBeInTheDocument()
  })

  it('names the section by a declared label, and rows by their number regardless', () => {
    renderList({ ...tags, label: 'Labels' }, ['a'], 'tags')
    renderList({ type: 'list', of: { ...tagRow, label: 'Tag' } }, ['b'], 'more')

    expect(screen.getByRole('group', { name: 'Labels' })).toBeInTheDocument()
    expect(screen.getAllByLabelText('Row 1')).toHaveLength(2)
    expect(screen.queryByLabelText('Tag')).not.toBeInTheDocument()
  })

  it('draws a group row as a section per row with a field per member', () => {
    renderList(sections, [
      { title: 'One', open: true },
      { title: 'Two', open: false },
    ])

    const first = screen.getByRole('group', { name: 'Row 1' })
    const second = screen.getByRole('group', { name: 'Row 2' })

    expect(within(first).getByLabelText('Title')).toHaveValue('One')
    expect(within(first).getByLabelText('Open')).toBeChecked()
    expect(within(second).getByLabelText('Title')).toHaveValue('Two')
    expect(within(second).getByLabelText('Open')).not.toBeChecked()
  })

  // A scalar row is its one field, so the row's name labels the field directly.
  it('draws a scalar row as one field labelled as the row', () => {
    renderList(tags, ['b', 'a'], 'tags')

    expect(screen.getByLabelText('Row 1')).toHaveValue('b')
    expect(screen.getByLabelText('Row 2')).toHaveValue('a')
  })

  it('reports a change to a member of a row with its index', async () => {
    const { onRowChange } = renderList(sections, [
      { title: 'One', open: false },
      { title: 'Two', open: false },
    ])

    await userEvent.click(
      within(screen.getByRole('group', { name: 'Row 2' })).getByLabelText('Open')
    )

    expect(onRowChange).toHaveBeenCalledWith(1, 'open', sectionRow.open, true)
  })

  it('reports a change to a scalar row with no member', async () => {
    const { onRowChange } = renderList(tags, ['a'], 'tags')

    await userEvent.selectOptions(screen.getByLabelText('Row 1'), 'b')

    expect(onRowChange).toHaveBeenCalledWith(0, null, tagRow, 'b')
  })

  it('adds a row of the row schema defaults', async () => {
    const { onRowsChange } = renderList(sections, [{ title: 'One', open: true }])

    await userEvent.click(screen.getByRole('button', { name: 'Add row' }))

    expect(onRowsChange).toHaveBeenCalledWith([
      { title: 'One', open: true },
      { title: 'Untitled', open: false },
    ])
  })

  it('removes the row whose button was pressed', async () => {
    const { onRowsChange } = renderList(sections, [
      { title: 'One', open: false },
      { title: 'Two', open: false },
      { title: 'Three', open: false },
    ])

    await userEvent.click(screen.getByRole('button', { name: 'Remove row 2' }))

    expect(onRowsChange).toHaveBeenCalledWith([
      { title: 'One', open: false },
      { title: 'Three', open: false },
    ])
  })

  it('adds and removes scalar rows too', async () => {
    const { onRowsChange } = renderList(tags, ['b'], 'tags')

    await userEvent.click(screen.getByRole('button', { name: 'Add row' }))
    expect(onRowsChange).toHaveBeenLastCalledWith(['b', 'a'])

    await userEvent.click(screen.getByRole('button', { name: 'Remove row 1' }))
    expect(onRowsChange).toHaveBeenLastCalledWith([])
  })
})
