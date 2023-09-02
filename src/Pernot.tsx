import * as Y from "yjs";

import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";

import { Component, For, Show, Match, Switch, createSignal, onCleanup, createEffect, ErrorBoundary, on, Setter } from "solid-js";

import { fixer } from "./fixer";

import { CalendarView } from "./Calendar";
import { EditorView } from "./Editor";
import { GridView } from "./GridView";
import { getNotebook, User, putNotebook } from "./service";
import { undo } from "y-codemirror.next/dist/src/y-undomanager";




export const Pernot: Component<{ doc: { id: string, secret: ArrayBuffer | null }, user: User, setLogin: Setter<boolean> }> = (props) => {

    const [synced, setSynced] = createSignal(false)
    const [calendar, setCalendar] = createSignal(false)
    const [path, setPath] = createSignal([])
    const viewStates = ['Outline', 'Timeline']
    const [view, setView] = createSignal(0)

    let ydoc = new Y.Doc()
    let undoManager

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

    return (
        <>
            <Show when={synced()}>
                <div onKeyDown={handleKeyDown} class='grid w-full h-full fixed' style='grid-template-rows: min-content 1fr'>
                    <div class='flex-col gap-2 p-1'>
                        <div class='flex gap-2  border-b'>
                            <button onClick={() => path().length > 1 && setPath(p => [...p.slice(0, -1)])}>⮤</button>
                            <button class="text-red-800 font-bold" onClick={() => setView(vs => (vs + 1) % viewStates.length)}>{viewStates[view()]}</button>
                            <button onClick={() => props.setLogin(false)}>Sign out</button>
                        </div>
                        {/* <div>

                            <For each={path()}>
                                {(item, index) => <Show when={index() !== path().length - 1}><button class="font-bold" onClick={() => { console.log(index()); setPath(p => [...p.slice(0, index() + 1)]) }}>{item.get('!').toString()}</button></Show>}
                            </For>
                        </div> */}
                    </div>
                    <For each={path()}>
                        {(item, index) => <Show when={index() === path().length - 1}>
                            <Switch>
                                <Match when={view() === 0}>
                                    <EditorView node={item} setPath={setPath} />
                                </Match>
                                <Match when={view() === 1}>
                                    <CalendarView root={item} />
                                </Match>
                            </Switch>
                        </Show>}
                    </For>
                </div>
            </Show >
        </>
    )
}

