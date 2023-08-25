import * as Y from "yjs";

import { IndexeddbPersistence } from "y-indexeddb";
import { WebrtcProvider } from "y-webrtc";

import { Component, For, Show, Match, Switch, createSignal, onCleanup, createEffect, ErrorBoundary, on, Setter } from "solid-js";
import { StepSequencer, newPiece } from "./StepSequencer";
import { Codemirror } from "./Codemirror";
import { TableView } from "./Table";
import { Paint } from "./Paint";
import { fixer } from "./fixer";
import { TextNode } from "./Codemirror"
import { NodeBar } from "./Toolbars";
import { createTable } from "./table";
import { Field } from "./Field";


import { EditorView } from './Editor'
import { GridView } from './GridView'

import {
    createElementSize,
    createWindowSize,
} from '@solid-primitives/resize-observer'


import * as Icons from "./Icons";
import { Portal } from "solid-js/web";
import { DTNode, DTPicker, MaybeDT } from "./DatePicker";
import { CalendarView } from "./Calendar";
import { getNotebook, User, putNotebook } from "./service";
import { genId } from "./utils";
import { Sel } from "./selection";



export const Pernot: Component<{ doc: { id: string, secret: ArrayBuffer | null }, user: User, setLogin: Setter<boolean> }> = (props) => {

    const [synced, setSynced] = createSignal(false)
    const [calendar, setCalendar] = createSignal(false)
    const [path, setPath] = createSignal([])
    const viewStates = ['Outline', 'Table', 'Timeline']
    const [view, setView] = createSignal(0)

    let ydoc = new Y.Doc()

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
            setSynced(true)
        })
    })

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
                <div style='display:grid;grid-template-rows: 2rem 1fr' class='w-screen h-screen fixed'>
                    <div class='border-b flex'>
                        <button onClick={() => props.setLogin(false)}>Sign out</button>
                        <button class="ml-2 text-red-800 font-bold" onClick={() => setView(vs => (vs + 1) % viewStates.length)}>{viewStates[view()]}</button>
                        <For each={path()}>
                            {(item, index) => <Show when={index() !== path().length - 1}><button class="font-bold m-1" onClick={() => { console.log(index()); setPath(p => [...p.slice(0, index() + 1)]) }}>{item.get('!').toString()}</button></Show>}
                        </For>
                    </div>
                    <For each={path()}>
                        {(item, index) => <Show when={index() === path().length - 1}>
                            <Switch>
                                <Match when={view() === 0}>
                                    <EditorView node={item} setPath={setPath} />
                                </Match>
                                <Match when={view() === 1}>
                                    <GridView node={item} />
                                </Match>
                                <Match when={view() === 2}>
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

