import * as Y from 'yjs'

import { yReplace } from './utils'
import { TEXT, CONTENT, CHILDREN, createParagraph } from './input'

export const fixer = (root : Y.Map<any>, id: string) => {

  if (!root.get('id')) {
    console.log('fixer: no id')
    root.set('id', id)
  }

  // if (root.has('~')) {
  //   root.delete('~')
  // }


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

  root.get(CONTENT).forEach((e,index) => {

    if (!(e instanceof Y.Map)) {
      root.get(CONTENT).delete(index,1)
    }
  })

  root.get(CHILDREN).forEach(element => {
    fixer(element)
  })
}