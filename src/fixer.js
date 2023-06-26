import * as Y from 'yjs'

import { yReplace } from './utils'

export const fixer = (root) => {

  if (!root.get('role')) {
    console.log('fixer: no role')
    root.set('role', 'section')
  }

  if (!root.get('heading')) {
    console.log('fixer: no heading')
    root.set('heading', new Y.Text("Heading"))
  }


  if (!root.get('content')) {
    console.log('fixer: no content')
    root.set('content', Y.Array.from([new Y.XmlText('Content')]))
  }
  root.get('content').forEach((node,i) => {
    if (node instanceof Y.Map) {
      switch (node.get('role')) {
        default:
          break
      }
    }
    if (node instanceof Y.XmlText) {
      console.log('fixer: text')
      let p = new Y.Map()
      p.set('heading', new Y.Text('Paragraph'))
      root.get('content').insert(i, [p])
      root.get('content').delete(i+1)
    }

    if (node instanceof Y.Text) {
      console.log('fixer: text')
      let p = new Y.Map()
      p.set('heading', new Y.Text('Paragraph'))
      root.get('content').insert(i, [p])
      root.get('content').delete(i+1)
    }

  })


  if (!root.get('children')) {
    console.log('fixer: no children')
    root.set('children', new Y.Array())
  }
  root.get('children').forEach(element => {
    fixer(element)
  })



}