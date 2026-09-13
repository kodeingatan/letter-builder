import { Node, mergeAttributes } from '@tiptap/core'

/**
 * Custom Tiptap nodes for the persuratan editors (Task 07).
 * Serialized 1:1 with the server converter (`docBinding`/`docRepeater`/`docCondition`).
 */

export const DocBinding = Node.create({
  name: 'docBinding',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  addAttributes() {
    return {
      name: { default: '' },
      target: { default: '' },
      view: { default: 'text' },
      component: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-doc-binding]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const view = (HTMLAttributes as Record<string, string>).view || 'text'
    const name = (HTMLAttributes as Record<string, string>).name || (HTMLAttributes as Record<string, string>).target
    return ['span', mergeAttributes(HTMLAttributes, { 'data-doc-binding': view, class: 'doc-binding', contenteditable: 'false' }), `{{${name}}}`]
  },
})

export const DocRepeater = Node.create({
  name: 'docRepeater',
  group: 'block',
  content: 'block+',
  addAttributes() {
    return {
      source: { default: '' },
      item: { default: 'item' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-doc-repeater]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-doc-repeater': 'true', class: 'doc-repeater-block' }), 0]
  },
})

export const DocCondition = Node.create({
  name: 'docCondition',
  group: 'block',
  content: 'block+',
  addAttributes() {
    return {
      field: { default: '' },
      operator: { default: 'eq' },
      value: { default: '' },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-doc-condition]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-doc-condition': 'true', class: 'doc-condition-block' }), 0]
  },
})
