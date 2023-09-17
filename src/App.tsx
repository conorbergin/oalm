import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect, onCleanup, Accessor, Setter, ErrorBoundary } from 'solid-js'

import { deriveUser, syncKeychain, syncDoc, UserData, DocData, authenticate, register, createKeychain } from './service'



import { Portal } from 'solid-js/web'
import { CalendarView } from './Calendar'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'

import { fixer } from "./fixer";
import { Modal } from './Dialog'

import { EditorView } from "./Editor";
import * as Icons from './Icons'
import { ROOT_TEXT, ROOT_CHILDREN, ROOT_CONTENT, TEXT } from './input'

// https://stackoverflow.com/a/9204568
const maybeValidEmail = (e: string) => e.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

const INTERVAL = 1000 * 20

const PASSWORD_TOO_SHORT = 10
const validPassword = (p: string) => p.length > PASSWORD_TOO_SHORT

export const App: Component = () => {
  return (
    <ErrorBoundary fallback={e => <div>Fatal Error: + {e}</div>}>
      <AppView />
    </ErrorBoundary>
  )
}

export const AppView: Component = () => {

  let ydoc = new Y.Doc()
  let kcdoc = new Y.Doc()
  let persist = false
  let modified = false
  const counters = new Map()

  const [docData, setDocData] = createSignal<null | DocData>(null)
  const [userData, setUserData] = createSignal<null | UserData>(null)
  const [accountModal, setAccountModal] = createSignal(false)
  const [docs, setDocs] = createSignal<null | Array<[string, Y.Map<any>]>>(null)
  const [message, setMessage] = createSignal('')
  const [doc, setDoc] = createSignal<null | Y.Doc>(null)

  const sync = () => {
    const u = userData()
    const d = docData()
    if (u) { syncKeychain(kcdoc, u, counters, modified) }
    if (d && u) { syncDoc(ydoc, d, u, counters, modified) }
    modified = false
  }

  setInterval(sync, INTERVAL)

  // let idbprov = new IndexeddbPersistence(user()!.id, kcdoc)


  let f = () => {
    setDocs(Array.from(kcdoc.getMap('oalm-keychain').entries()))
    modified = true
  }


  let e: HTMLInputElement
  let p: HTMLInputElement
  let c: HTMLInputElement
  const handleSubmit = async () => {
    if (!maybeValidEmail(e.value)) {
      setMessage('Invalid Email')
      return
    }
    const user = await deriveUser(e.value, p.value)
    console.log(user)
    const resp = await authenticate(user)
    if (resp.status === 200) {
      setUserData(user)
      syncKeychain(kcdoc, user, counters, false)
      // console.log(kcdoc.getMap('oalm-keychain').toJSON())
      setDocs(Array.from(kcdoc.getMap('oalm-keychain').entries()))
      kcdoc.getMap('oalm-keychain').observe(f)
    } else if (resp.status === 404) {
      setMessage('Registering Account')
      let [kc, pub] = await createKeychain(user)
      let r = await register(user, pub, kc)
      setMessage(await r.text())
    } else {
      let t = await resp.text()
      setMessage(t)
    }

  }

  createEffect(async () => {
    setDoc(null)
    ydoc.destroy()
    ydoc = new Y.Doc()
    const d = docData()
    if (d) {
      if (persist) {
        const indexeddbProvider = new IndexeddbPersistence(d.id, ydoc)
        await indexeddbProvider.whenSynced
        syncDoc(ydoc, d, userData()!, counters, false)
      } else {
        await syncDoc(ydoc, d, userData()!, counters, false)
      }
      ydoc.getMap('01').observeDeep(() => modified = true)
      ydoc.getMap('02').observeDeep(() => modified = true)
      ydoc.getMap('03').observeDeep(() => modified = true)
    } else {
      const indexeddbProvider = new IndexeddbPersistence('default', ydoc)
      await indexeddbProvider.whenSynced
    }
    console.log(ydoc.toJSON())
    console.log(ydoc.getText(ROOT_TEXT).toJSON())
    console.log(ydoc.getArray(ROOT_CONTENT).toJSON())
    console.log(ydoc.getArray(ROOT_CHILDREN).toJSON())
    setDoc(ydoc)
  })

  return (
    <Show when={doc()} fallback={<p>loading ...</p>}>
      {d =>
        <>
          <EditorView doc={d()} setAccountView={setAccountModal} />
          <Modal show={accountModal()} setShow={setAccountModal}>
            <Show when={userData()} fallback={
              <div class='flex flex-col gap-2 p-1 pt-2'>
                <input class="p-1 border" ref={e} type="email" placeholder="email" />
                <input class="p-1 border" ref={p} type="password" placeholder="password" />
                <div class="flex gap-2"><input ref={c} type="checkbox" />Save details locally (I own this computer)</div>
                <button onClick={handleSubmit}>Sign In or Register</button>
                <div class='text-orange-700'>{message()}</div>
              </div>
            }>
              <p>{userData()!.userid}</p>
              <button onClick={() => setUserData(null)}>Sign Out</button>
              <Show when={docs()} fallback="waiting for keychain ...">
                <div class="flex  flex-col justify-center gap-2">
                  <button onClick={() => sync()}>Sync</button>
                  <For each={docs()}>
                    {([id, value]: [string, Y.Map<any>]) => <button onClick={() => setDocData({ id, ...value.toJSON() })}>{id}</button>}
                  </For>
                  <button onClick={() => { }}>New Notebook</button>
                </div>
              </Show>
            </Show>
          </Modal>
        </>
      }
    </Show>

  )
}



// const handleKeyDown = (e: KeyboardEvent) => {
//     if (e.key === 'z' && e.ctrlKey) {
//         e.preventDefault()
//         console.log('undo')
//         undoManager.undo()
//     } else if (e.key === 'y' && e.ctrlKey) {
//         e.preventDefault()
//         undoManager.redo()
//     }
// }


// <div class='touch-pan-y grid w-full grid-rows-[min-content_1fr]' >
//     <Show when={synced()}>
//         <div class='sticky top-0 border-b z-10 bg-white p-1 gap-1 grid grid-cols-[min-content_1fr_min-content]'>
//             <div class='flex gap-1'>
//                 <UndoRedo undoManager={undoManager!} />
//             </div>
//             <div class='flex overflow-auto gap-1 whitespace-nowrap '>
//                 <For each={path()}>
//                     {(item, index) => <Show when={index() !== path().length - 1}><button class="font-bold" onClick={() => { console.log(index()); setPath(p => [...p.slice(0, index() + 1)]) }}>{(item instanceof Y.Doc ? item.get(ROOT_TEXT).toString() : item.get(TEXT).toString()) + ' >'}</button></Show>}
//                 </For>
//             </div>
//             <button onClick={() => setAccountModal(true)}><Icons.Sync color={'black'} /></button>
//         </div>
//         <div class=''>
//             <For each={path()}>
//                 {(item, index) =>
//                     <Show when={index() === path().length - 1}>
//                         <EditorView node={item} setPath={setPath} path={path()} undoManager={undoManager} />
//                     </Show>}
//             </For>
//         </div>
//     </Show >