import * as Y from 'yjs'

import { yReplace } from './utils'
import {createParagraph } from './input'

export const fixer = (root: Y.Map<any>) => {

  if (!root.get('01')) {
    console.log('fixer: no heading')
    root.set('01', new Y.Text("Heading"))
  } 

  if (!root.get('02')) {
    console.log('fixer: no content')
    root.set('02', Y.Array.from([createParagraph('')[0]]))
  }

  if (!root.get('03')) {
    console.log('fixer: no children')
    root.set('03', new Y.Array())
  }

  if (root.has('~')) {
    root.set('10',root.get('~'))
    root.delete('~')
  }
  root.delete('!')
  root.delete('&')
  root.delete('$')
  root.delete('00')

  // root.get('$').forEach((e, index) => {

  //   if (!(e instanceof Y.Map)) {
  //     root.get(CONTENT).delete(index, 1)
  //   }
  // })

  root.get('03').forEach(element => {
    fixer(element)
  })
}