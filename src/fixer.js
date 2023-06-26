import * as Y from 'yjs'

import { yReplace } from './utils'
import { createParagraph } from './input'

export const fixer = (root) => {


  if (!root.get('heading')) {
    console.log('fixer: no heading')
    root.set('heading', new Y.Text("Heading"))
  }


  if (!root.get('content')) {
    console.log('fixer: no content')
    root.set('content', Y.Array.from([createParagraph()[1]]))
  }

  if (!root.get('children')) {
    console.log('fixer: no children')
    root.set('children', new Y.Array())
  }
  root.get('children').forEach(element => {
    fixer(element)
  })
}