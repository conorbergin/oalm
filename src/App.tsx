import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect, onCleanup, Accessor, Setter, ErrorBoundary } from 'solid-js'

import { deriveUser, getKeychain, putKeychain, User, authenticate, createNotebook, register, createKeychain, getDoc, putDoc } from './service'



import { Portal } from 'solid-js/web'
import { CalendarView } from './Calendar'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'

import { fixer } from "./fixer";
import { Modal } from './Dialog'

import { EditorView } from "./Editor";
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

    const [doc, setDoc] = createSignal({ id: 'default', private: null, read: '', write: '' })
    const [user, setUser] = createSignal<null | User>(null)
    const [accountModal, setAccountModal] = createSignal(false)

    const [message, setMessage] = createSignal('')

    const [synced, setSynced] = createSignal(false)
    const [path, setPath] = createSignal([])
    const viewStates = ['Outline', 'Calendar']
    const [view, setView] = createSignal(0)

    let ydoc = new Y.Doc()
    let undoManager: Y.UndoManager
    let kcdoc = new Y.Doc()
    // let idbprov = new IndexeddbPersistence(user()!.id, kcdoc)
    let [keychain, setKeychain] = createSignal<null | Array<[string, Y.Map<any>]>>(null)

    const syncDoc = async () => {
        if (!doc()) {return}

        let update = await getDoc(user()!,doc().id,doc().read)
        if (update) {
            Y.applyUpdate(ydoc,new Uint8Array(update))
        } else {
            console.log('not found')
        }

        putDoc(user()!,ydoc,doc().id,doc().read,doc().write)
    } 


    let f = () => {
        setKeychain(Array.from(kcdoc.getMap('oalm-keychain').entries()))
        putKeychain(user()!, kcdoc)
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
            setUser(user)
            let k = await getKeychain(user)
            if (k === undefined) throw new Error('Keychain not found')
            Y.applyUpdate(kcdoc, new Uint8Array(k))
            console.log(kcdoc.getMap('oalm-keychain').toJSON())
            setKeychain(Array.from(kcdoc.getMap('oalm-keychain').entries()))

            kcdoc.getMap('oalm-keychain').observe(f)
        } else if (resp.status === 404) {
            console.log('registering')
            let [kc, pub] = await createKeychain(user)
            let r = await register(user, pub, kc)
            setMessage(await r.text())
        } else {
            let t = await resp.text()
            setMessage(t)
        }

    }

    createEffect(() => {
        setSynced(false)
        ydoc.destroy()
        ydoc = new Y.Doc()
        let indexeddbProvider = new IndexeddbPersistence(doc().id, ydoc)
        // let webrtcProvider = new WebrtcProvider(doc().id, ydoc)
        indexeddbProvider.whenSynced.then(async () => {
            if (user()) {
                let update = await getDoc(user()!,doc().id,doc().read)
                if (update) Y.applyUpdate(ydoc,new Uint8Array(update))
                fixer(ydoc.getMap('oalm-root'))
                console.log(ydoc.get('oalm-root').toJSON())
                // putDoc(user()!,ydoc,doc().id,doc().read,doc().write)
            } else {
                fixer(ydoc.getMap('oalm-root'))
                console.log(ydoc.get('oalm-root').toJSON())
            }
            setPath([ydoc.get('oalm-root')])
            undoManager = new Y.UndoManager(ydoc.get('oalm-root'))
            setSynced(true)
        })
    })

    return (
        <div class='touch-pan-y grid w-full grid-rows-[min-content_1fr]' >
            <Show when={synced()}>
                <div class='sticky top-0 border-b z-10 bg-white p-1 gap-1 grid grid-cols-[min-content_1fr_min-content]'>
                    <div class='flex gap-1'>
                        <UndoRedo undoManager={undoManager} />
                    </div>
                    <div class='flex overflow-auto gap-1 whitespace-nowrap '>
                        <For each={path()}>
                            {(item, index) => <Show when={index() !== path().length - 1}><button class="font-bold" onClick={() => { console.log(index()); setPath(p => [...p.slice(0, index() + 1)]) }}>{item.get('01').toString() + ' >'}</button></Show>}
                        </For>
                    </div>
                    <button onClick={() => setAccountModal(true)}><Icons.Sync color={'black'} /></button>
                </div>
                <div class=''>
                    <For each={path()}>
                        {(item, index) =>
                            <Show when={index() === path().length - 1}>
                                <EditorView node={item} setPath={setPath} path={path()} undoManager={undoManager} />
                            </Show>}
                    </For>
                </div>
            </Show >
            <Modal show={accountModal()} setShow={setAccountModal}>
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
                        <div class="flex  flex-col justify-center gap-2">
                            <button onClick={syncDoc}>Sync</button>
                            <For each={keychain()}>
                                {([id, value]: [string, Y.Map<any>]) => <button onClick={() => setDoc({ id, ...value.toJSON() }) }>{id}</button>}
                            </For>
                            <button onClick={() => createNotebook()}>New Notebook</button>
                        </div>
                    </Show>
                </Show>
            </Modal>
        </div>

    )
}

export const UndoRedo: Component<{ undoManager: Y.UndoManager }> = (props) => {
    const [canUndo, setCanUndo] = createSignal(props.undoManager.canUndo())
    const [canRedo, setCanRedo] = createSignal(props.undoManager.canRedo())
    props.undoManager.on('stack-item-added', () => { setCanUndo(props.undoManager.canUndo()); setCanRedo(props.undoManager.canRedo()) })
    props.undoManager.on('stack-item-popped', () => { setCanUndo(props.undoManager.canUndo()); setCanRedo(props.undoManager.canRedo()) })
    return (
        <>
            <button classList={{ 'text-gray-400': !canUndo() }} onClick={() => props.undoManager.undo()}><Icons.Undo /></button>
            <button classList={{ 'text-gray-400': !canRedo() }} onClick={() => props.undoManager.redo()}><Icons.Redo /></button>
        </>
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
