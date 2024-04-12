import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect, onCleanup, Accessor, Setter, ErrorBoundary } from 'solid-js'

import * as Y from 'yjs'

import { SidePane } from './SplitPane';
import { Editor, EditorView } from "./Editor";
import { IndexeddbPersistence } from 'y-indexeddb';



// export const App: Component = () => {
//   return (
//     <ErrorBoundary fallback={e => <div>Fatal Error: {e}</div>}>
//       <AppView />
//     </ErrorBoundary>
//   )
// }

export const App: Component = () => {
  let d: HTMLDialogElement | undefined = undefined
  let ydoc = new Y.Doc()
  let text = ydoc.getText("text")
  const idb = new IndexeddbPersistence('default', ydoc)
  idb.whenSynced.then(_ => console.log(text.toJSON()))

  const [menu, setMenu] = createSignal(false)

  return <>
    <Editor text={text} />
  </>
}