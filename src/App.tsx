import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect } from 'solid-js'



import './style.css'
import './drag.css'
import './controls.css'
import './fonts.css'

import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'

import { fixer } from './fixer'
import { EditorState } from './editorstate'

import { EditorView } from './Editor'

import { ToolBar } from './ToolBar'
import { AgendaView } from './Agenda'





// let pw = "1299651405"
// let api = "https://54hjnip2ng.execute-api.eu-north-1.amazonaws.com/"

// fetch(api).then((response) => response.blob()).then((blob) => blob.arrayBuffer()).then((buffer) => new Uint8Array(buffer)).then((blob) => { Y.applyUpdate(ydoc, blob) })



const myDoc = new Y.Doc()
const indexeddbProvider = new IndexeddbPersistence('my-room-name2', myDoc)
// const webrtcProvider = new WebrtcProvider('my-room-name2', myDoc)

const root = myDoc.getMap('root')

const undoManager = new Y.UndoManager(root)
export const [path, setPath] = createSignal([root])

export const [hack, setHack] = createSignal(false)

const myroot = () => path().at(-1)

export const BreadCrumbs: Component = () => {
    return (
        <span>
            /
            <For each={path().slice(0, -1)}>
                {(item, index) => <button onClick={() => { setPath(path => path.slice(0, index()+1)); setHack(h => !h) }}>{item.get('heading').toString()}</button>}
            </For>
        </span>
    )
}

export const App: Component = () => {

    const [synced, setSynced] = createSignal(false)
    const [screen, setScreen] = createSignal(0)
    const [scroll, setScroll] = createSignal(0)

    window.onscroll = (e) => scroll() > 20 ? null : setScroll(Math.min(scrollY,15))

    indexeddbProvider.on('synced', () => {
        console.log(root.toJSON())
        fixer(root)
        setSynced(true)
    })

    return (
        <>
            <Show when={synced()}>
                <div style={{
                    'background-color': 'white',
                    position: 'sticky',
                    top: 0,
                    'border-bottom': '1px solid lightgrey',
                    "box-shadow": `0px 0px ${scroll()}px lightgrey`
                }}><span>
                        <button onClick={() => undoManager.undo()}>Undo</button>
                        <button onClick={() => undoManager.redo()}>Redo</button>
                        <button onClick={() => { screen() ? setScreen(0) : setScreen(1) }}>{screen() ? 'Editor View' : 'Agenda View'}</button>
                        <BreadCrumbs />
                    </span>
                </div>
                <div>
                    <Switch fallback={<EditorView root={myroot()} />}>
                        <Match when={screen() === 1}>
                            <AgendaView path={path} />
                        </Match>
                        <Match when={hack()}>
                            <EditorView root={myroot()}/>
                        </Match>
                    </Switch>
                </div>
            </Show>
        </>
    )
}