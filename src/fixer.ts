import * as Y from 'yjs'

import { yReplace } from './utils'
import { TEXT, CONTENT, CHILDREN, createParagraph } from './input'

export const fixer = (root : Y.Map<any>) => {

  if (!root.get('id')) {
    console.log('fixer: no id')
    root.set('id', crypto.randomUUID())
  }


  if (!root.get(TEXT)) {
    console.log('fixer: no heading')
    root.set(TEXT, new Y.Text("Heading"))
  }


  if (!root.get(CONTENT)) {
    console.log('fixer: no content')
    root.set(CONTENT, Y.Array.from([createParagraph('')[0]]))
  }

  if (!root.get(CHILDREN)) {
    console.log('fixer: no children')
    root.set(CHILDREN, new Y.Array())
  }
  root.get(CHILDREN).forEach(element => {
    fixer(element)
  })
}