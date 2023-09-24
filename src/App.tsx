import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect, onCleanup, Accessor, Setter, ErrorBoundary } from 'solid-js'

import { deriveUser, syncKeychain, syncDoc, UserData, DocData, authenticate, register, createKeychain, key2string, string2key } from './service'



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
import { local } from 'd3-selection'
import { EncryptedWebsocketProvider } from './provider'

// https://stackoverflow.com/a/9204568
const maybeValidEmail = (e: string) => e.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

const INTERVAL = 1000 * 20

const PASSWORD_TOO_SHORT = 10
const validPassword = (p: string) => p.length > PASSWORD_TOO_SHORT


export const App: Component = () => {
  return (
    <ErrorBoundary fallback={e => <div>Fatal Error: {e}</div>}>
      <AppView />
    </ErrorBoundary>
  )
}

const getLocalUserData = async (): Promise<UserData | null> => {
  const userid = localStorage.getItem('oalm-id')
  const key = localStorage.getItem('oalm-key')
  const masterHash = localStorage.getItem('oalm-hash')
  if (userid && key && masterHash) {
    console.log('got local user data')
    const masterKey = await string2key(key)
    return { userid, masterKey, masterHash }
  } else {
    console.log('failed to get local user data')
    return null
  }
}

const setLocalUserData = async (u: UserData) => {
  localStorage.setItem('oalm-id', u.userid)
  localStorage.setItem('oalm-key', await key2string(u.masterKey))
  localStorage.setItem('oalm-hash', u.masterHash)
}


export const AppView: Component = () => {

  let ydoc = new Y.Doc()
  let kcdoc = new Y.Doc()
  let modified = true
  const counters = new Map()

  const [docData, setDocData] = createSignal<null | DocData>(null)
  const [userData, setUserData] = createSignal<null | UserData>()
  console.log(userData())
  const [accountModal, setAccountModal] = createSignal(false)
  const [docs, setDocs] = createSignal<null | Array<[string, Y.Map<any>]>>(null)
  const [message, setMessage] = createSignal('')
  const [doc, setDoc] = createSignal<null | Y.Doc>(null)

  getLocalUserData().then(u => setUserData(u))
  const lastOpened = localStorage.getItem('oalm-last-opened')
  if (lastOpened) {
    try {
      const jsn = JSON.parse(lastOpened)
      if (jsn) {
        setDocData(jsn)
      }
    } catch {
      localStorage.clear()
    }
  }


  const sync = (force: boolean) => {
    const u = userData()
    const d = docData()
    if (u) { syncKeychain(kcdoc, u, counters, force, modified) }
    if (d && u) { syncDoc(ydoc, d, u, counters, force, modified) }
  }

  // setInterval(() => sync(false), INTERVAL)


  let e: HTMLInputElement
  let p: HTMLInputElement
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
      setLocalUserData(user)
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


  const f = () => {
    const arr = Array.from(kcdoc.getMap('oalm-keychain').entries())
    setDocs(arr)
  }


  createEffect(async () => {
    const user = userData()
    if (user) {
      const indexeddbProvider = new IndexeddbPersistence(user.userid, kcdoc)
      // await indexeddbProvider.whenSynced
      kcdoc.getMap('oalm-keychain').observe(f)
      await syncKeychain(kcdoc, user, counters, true, false)
    }
  })

  createEffect(async () => {
    ydoc.destroy()
    ydoc = new Y.Doc()
    const d = docData()
    if (d) {
      localStorage.setItem('oalm-last-opened', JSON.stringify(d))
      const indexeddbProvider = new IndexeddbPersistence(d.id, ydoc)
      const bProvider = new EncryptedWebsocketProvider('',d.id,ydoc)
      // const webrtcProvider = new WebrtcProvider(d.id,ydoc,{signaling:["ws://151.236.219.203:4444"]})
      await indexeddbProvider.whenSynced
      // syncDoc(ydoc, d, userData()!, counters, true, false)
    } else {
      const indexeddbProvider = new IndexeddbPersistence('default', ydoc)
      await indexeddbProvider.whenSynced
    }
    setDoc(null)
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
                <button onClick={handleSubmit}>Sign In or Register</button>
                <div class='text-orange-700'>{message()}</div>
              </div>
            }>
              <p>{userData()!.userid}</p>
              <button onClick={() => { setUserData(null); setDocData(null); localStorage.clear() }}>Sign Out</button>
              <Show when={docs()} fallback="waiting for keychain ...">
                <div class="flex  flex-col justify-center gap-2">
                  <button onClick={() => sync(true)}>Sync</button>
                  <For each={docs()}>
                    {([id, value]: [string, Y.Map<any>]) => <button onClick={() => setDocData({ id, ...value.toJSON() })}>{id}</button>}
                  </For>
                </div>
              </Show>
            </Show>
          </Modal>
        </>
      }
    </Show>
  )
}