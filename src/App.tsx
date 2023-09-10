import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect, onCleanup, Accessor, Setter, ErrorBoundary } from 'solid-js'

import { deriveUser, getKeychain, putKeychain, hello, User, authenticate, createNotebook, register, createKeychain } from './service'

const ACCOUNT_NOT_AUTHENTICATED = 490
const ACCOUNT_NOT_VERIFIED = 491
const ACCOUNT_NOT_REGISTERED = 492

const ACCOUNT_ALREADY_REGISTERED = 493
const ACCOUNT_ALREADY_VERIFIED = 494

const MISSING_PARAMETERS = 495
const BAD_TOKEN = 496

import { Portal } from 'solid-js/web'
import { CalendarView } from './Calendar'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'

import { fixer } from "./fixer";
import { Modal } from './Dialog'

import { EditorView } from "./Editor";
import { getNotebook, putNotebook } from "./service";
import * as Icons from './Icons'

// https://stackoverflow.com/a/9204568
const maybeValidEmail = (e: string) => e.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)

const PASSWORD_TOO_SHORT = 10
const validPassword = (p: string) => p.length > PASSWORD_TOO_SHORT

export const App: Component = () => {
    return (
        <ErrorBoundary fallback={err => err}>
            <AppView />
        </ErrorBoundary>
    )
}

export const AppView: Component = () => {

    const [doc, setDoc] = createSignal({ id: 'default', secret: null })
    const [user, setUser] = createSignal<null | User>(null)
    const [accountModal, aetAccountModal] = createSignal(false)

    const [message, setMessage] = createSignal('')

    const [synced, setSynced] = createSignal(false)
    const [canUndo, setCanUndo] = createSignal(false)
    const [canRedo, setCanRedo] = createSignal(false)
    const [path, setPath] = createSignal([])
    const viewStates = ['Outline', 'Calendar']
    const [view, setView] = createSignal(0)

    let ydoc = new Y.Doc()
    let undoManager: Y.UndoManager
    let kcdoc = new Y.Doc()
    // let idbprov = new IndexeddbPersistence(user()!.id, kcdoc)
    let [keychain, setKeychain] = createSignal<any>(null)


    let e: HTMLInputElement
    let p: HTMLInputElement
    let c: HTMLInputElement
    const handleSubmit = async () => {
        if (!maybeValidEmail(e.value)) {
            setMessage('Invalid Email')
        } else if (!validPassword(p.value)) {
            setMessage(`Password must be greater than ${PASSWORD_TOO_SHORT}`)
        } else {
            const user = await deriveUser(e.value, p.value)
            console.log(user)
            const resp = await authenticate(user)
            if (resp.ok) {
                // get the keychain
            } else if (resp.status === ACCOUNT_NOT_AUTHENTICATED) {
                p.value = ''
                setMessage('Wrong password')
            } else if (resp.status === ACCOUNT_NOT_VERIFIED) {
                p.value = ''
                setMessage('Email unverified')
            } else if (resp.status === ACCOUNT_NOT_REGISTERED) {
                let [kc, pub] = await createKeychain(user)
                let r = await register(user, pub, kc)
                setMessage('Email sent')
            }
        }
    }


    let f = () => {
        setKeychain(Array.from(kcdoc.getMap('pernot-keychain').entries()))
        putKeychain(user()!, kcdoc)
    }

    createEffect(() => {
        getKeychain(user()!).then((k) => {
            if (k === undefined) throw new Error('Keychain not found')
            Y.applyUpdate(kcdoc, new Uint8Array(k))
            kcdoc.getMap('pernot-keychain').observe(f)
            f()
        })
        onCleanup(() => {
            kcdoc.getMap('pernot-keychain').unobserve(f)
        })
    })


    createEffect(() => {
        setSynced(false)
        ydoc.destroy()
        ydoc = new Y.Doc()
        let indexeddbProvider = new IndexeddbPersistence(doc().id, ydoc)
        let webrtcProvider = new WebrtcProvider(doc().id, ydoc)
        indexeddbProvider.whenSynced.then(() => {
            fixer(ydoc.getMap('root'))
            console.log(ydoc.get('root').toJSON())
            setPath([ydoc.get('root')])
            undoManager = new Y.UndoManager(ydoc.get('root'))
            undoManager.on('stack-item-added', () => { setCanUndo(undoManager.canUndo()); setCanRedo(undoManager.canRedo()) })
            undoManager.on('stack-item-popped', () => { setCanUndo(undoManager.canUndo()); setCanRedo(undoManager.canRedo()) })
            setSynced(true)
        })
    })

    return (
        <div class='touch-pan-y grid w-full grid-rows-[min-content_1fr]' >
            <Show when={synced()}>
                <div class='sticky top-0 border-b z-10 bg-white p-1 gap-1 grid grid-cols-[min-content_1fr_min-content]'>
                    <div class='flex gap-1'>
                        <button classList={{ 'text-gray-400': !canUndo() }} onClick={() => undoManager.undo()}><Icons.Undo /></button>
                        <button classList={{ 'text-gray-400': !canRedo() }} onClick={() => undoManager.redo()}><Icons.Redo /></button>
                        <button class="text-red-800 font-bold" onClick={() => setView(vs => (vs + 1) % viewStates.length)}>{viewStates[view()]}</button>
                    </div>
                    <div class='flex overflow-auto gap-1 whitespace-nowrap '>
                        <For each={path()}>
                            {(item, index) => <Show when={index() !== path().length - 1}><button class="font-bold" onClick={() => { console.log(index()); setPath(p => [...p.slice(0, index() + 1)]) }}>{item.get('01').toString() + ' >'}</button></Show>}
                        </For>
                    </div>
                    <button onClick={() => aetAccountModal(true)}><Icons.Sync color={'gray'} /></button>
                </div>
                <div class=''>
                    <For each={path()}>
                        {(item, index) => <Show when={index() === path().length - 1}>
                            <Switch>
                                <Match when={view() === 0}>
                                    <EditorView node={item} setPath={setPath} path={path()} />
                                </Match>
                                <Match when={view() === 1}>
                                    <CalendarView root={item} />
                                </Match>
                            </Switch>
                        </Show>}
                    </For>
                </div>
            </Show >
            <Modal show={accountModal()} setShow={aetAccountModal}>
                <Show when={user()} fallback={
                    <div class='flex flex-col gap-2 p-1 pt-2'>
                        <input class="p-1 border" ref={e} type="email" placeholder="email" />
                        <input class="p-1 border" ref={p} type="password" placeholder="password" />
                        <div class="flex gap-2"><input ref={c} type="checkbox" />Save details locally (I own this computer)</div>
                        <button onClick={handleSubmit}>Sign In or Register</button>
                        <div class='text-orange-700'>{message()}</div>
                    </div>
                }>
                    <p>{user()!.userid}</p>
                    <button onClick={() => setUser(null)}>Sign Out</button>
                    <Show when={keychain()} fallback="waiting for keychain ...">
                        <Show when={doc()} fallback={
                            <div class="flex  flex-col justify-center gap-2">
                                <For each={keychain()}>
                                    {([id, secret]: [string, ArrayBuffer]) => <button onClick={() => { setDoc({ id, secret }) }}>{id}</button>}
                                </For>
                            </div>
                        }>
                        </Show>
                    </Show>
                </Show>
            </Modal>
        </div>

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
