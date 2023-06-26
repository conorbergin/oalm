import './style.css'
import './drag.css'
import './controls.css'

import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'

import { fixer } from './fixer'
import { Editor } from './editorstate'



const myDoc = new Y.Doc()
const indexeddbProvider = new IndexeddbPersistence('my-room-name2', myDoc)
// const webrtcProvider = new WebrtcProvider('my-room-name2', myDoc)
const root = myDoc.getMap('root')

let path = [root]

const editorContainer = document.querySelector('#editor')
if (!editorContainer || !(editorContainer instanceof HTMLDivElement)) throw new Error('No editor div found')


indexeddbProvider.on('synced', () => {
  // fixer(root)

  // if (root.get('children').length > 1) {
  //   let s = new Y.Map()
  //   s.set('date', new Date().toISOString())
  //   s.set('status', 'DUE')
  //   s.set('location', 'Dublin')
  //   s.set('description', 'this is a description')
  //   root.get('children').get(1).set('schedule',s)
  // }

  console.log('synced')
  console.log(root.toJSON())
  let editor = new Editor(root, null, editorContainer)
})

