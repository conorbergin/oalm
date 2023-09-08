import * as Y from "yjs";

import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";

import { onMount, Component, For, Show, Match, Switch, createSignal, onCleanup, createEffect, ErrorBoundary, on, Setter } from "solid-js";

import { fixer } from "./fixer";

import { CalendarView } from "./Calendar";
import { EditorView } from "./Editor";
import { GridView } from "./GridView";
import { getNotebook, User, putNotebook } from "./service";
import { undo } from "y-codemirror.next/dist/src/y-undomanager";
import * as Icons from './Icons'




export const Pernot: Component<{ doc: { id: string, secret: ArrayBuffer | null }, user: User, setLogin: Setter<boolean> }> = (props) => {

    const [synced, setSynced] = createSignal(false)
    const [calendar, setCalendar] = createSignal(false)
    const [canUndo, setCanUndo] = createSignal(false)
    const [canRedo, setCanRedo] = createSignal(false)
    const [path, setPath] = createSignal([])
    const viewStates = ['Outline', 'Calendar']
    const [view, setView] = createSignal(0)

    let ydoc = new Y.Doc()
    let undoManager: Y.UndoManager

    createEffect(() => {
        setSynced(false)
        ydoc.destroy()
        ydoc = new Y.Doc()
        let indexeddbProvider = new IndexeddbPersistence(props.doc.id, ydoc)
        let webrtcProvider = new WebrtcProvider(props.doc.id, ydoc)
        indexeddbProvider.whenSynced.then(() => {
            fixer(ydoc.getMap('root'), props.doc.id)
            console.log(ydoc.get('root').toJSON())
            setPath([ydoc.get('root')])
            undoManager = new Y.UndoManager(ydoc.get('root'))
            undoManager.on('stack-item-added', () => {setCanUndo(undoManager.canUndo()); setCanRedo(undoManager.canRedo())} )
            undoManager.on('stack-item-popped', () => {setCanUndo(undoManager.canUndo()); setCanRedo(undoManager.canRedo())} )
            setSynced(true)
        })
    })


    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'z' && e.ctrlKey) {
            e.preventDefault()
            console.log('undo')
            undoManager.undo()
        } else if (e.key === 'y' && e.ctrlKey) {
            e.preventDefault()
            undoManager.redo()
        }
    }

    const handleSync = async () => {
        if (synced()) {
            let nb = await getNotebook(props.user, props.doc.id)
            if (nb) {
                Y.applyUpdate(ydoc, new Uint8Array(nb))
                let u = Y.encodeStateAsUpdate(ydoc)
                await putNotebook(props.user, ydoc)
            } else {
                await putNotebook(props.user, ydoc)
            }
        }
    }

    // let r: HTMLDivElement
    // let pending = false
    // const viewHandler = (e) => {
    //     if (pending) return
    //     pending = true
    //     requestAnimationFrame(() => {
    //         pending = false
    //         console.log(e.target)
    //         r.style.transform = `translate(0,${e.target.offsetTop}px)`
    //     })

    // }

    // onMount(() => {
    //     window.visualViewport?.addEventListener('resize', viewHandler)
    //     window.visualViewport?.addEventListener('scroll', viewHandler)
    // })

    return (
        <div class='touch-pan-y grid w-full grid-rows-[min-content_1fr]' >
            <Show when={synced()}>
                <div class='sticky top-0 border-b text-gray-700 z-10 bg-white flex gap-1 p-1'>
                    <button classList={{ 'text-gray-400': !canUndo() }} onClick={() => undoManager.undo()}><Icons.Undo/></button>
                    <button classList={{ 'text-gray-400': !canRedo() }} onClick={() => undoManager.redo()}><Icons.Redo/></button>
                    <button class="text-red-800 font-bold" onClick={() => setView(vs => (vs + 1) % viewStates.length)}>{viewStates[view()]}</button>

                    <For each={path()}>
                        {(item, index) => <Show when={index() !== path().length - 1}><button class="font-bold" onClick={() => { console.log(index()); setPath(p => [...p.slice(0, index() + 1)]) }}>{item.get('01').toString()} &gt;</button></Show>}
                    </For>
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
        </div>
    )
}

{/* <div class='fixed w-full h-full' style='display:grid; grid-template-rows: min-content 1fr;'>
                    <div class='flex gap-2  border-b z-10 bg-white'>
                        <button onClick={() => path().length > 1 && setPath(p => [...p.slice(0, -1)])}>⮤</button>
                        <button class="text-red-800 font-bold" onClick={() => setView(vs => (vs + 1) % viewStates.length)}>{viewStates[view()]}</button>
                        <button onClick={() => props.setLogin(false)}>Sign out</button>
    </div>*/}