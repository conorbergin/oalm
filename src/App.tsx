import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'

import {Sel } from './selection'


import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'

import { fixer } from './fixer'
import { EditorState } from './editorstate'

import { EditorView } from './Editor'
import { addSection, toggleDone, toggleArchive} from './input'

import { ToolBar } from './ToolBar'
import { AgendaView } from './Agenda'
import { DTPicker } from './DatePicker'
import { Portal } from 'solid-js/web'


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

export const [archiveView, setArchiveView] = createSignal(false)
export const [collapsed, setCollapsed] = createSignal([])




const myroot = () => path().at(-1)

export const BreadCrumbs: Component = () => {
    return (
        <div>
            <For each={path().slice(0, -1)}>
                {(item, index) =>
                    <>
                        {index() > 0 ? null : '/'}
                        <button onClick={() => { setPath(path => path.slice(0, index() + 1)); setHack(h => !h) }}>{item.get('heading').toString()}</button>
                        /
                    </>
                }
            </For>
        </div>
    )
}

export const App: Component = () => {

    const [synced, setSynced] = createSignal(false)
    const [screen, setScreen] = createSignal(0)
    const [scroll, setScroll] = createSignal(0)
    const [showDTPicker, setShowDTPicker] = createSignal(false)



    createEffect(() => console.log(scroll()))

    indexeddbProvider.on('synced', () => {
        console.log(root.toJSON())

        fixer(root)
        setSynced(true)
    })

    let selection: Sel = { node: root.get('!') as Y.Text, offset: 0, focus: null }

    return (
        <>
            <Show when={synced()}>
                <Portal mount={document.body}>
                    <Show when={showDTPicker()}>
                        <DTPicker node={selection.node} setShow={setShowDTPicker} />
                    </Show>
                </Portal>
                <div style={{ display: 'flex', 'flex-direction': 'column', 'position': 'fixed', width: '100%', height: '100%' }}>
                    <div style={{
                        'z-index': '10',
                        'padding': '0.5rem',
                        'padding-bottom': '0',
                        'background-color': 'white',
                        'border-bottom': '1px solid lightgrey',
                        'box-shadow': `0px 0px ${10}px lightgrey`
                    }}>
                        <button onClick={() => undoManager.undo()}>⮢</button>
                        <button onClick={() => undoManager.redo()}>⮣</button>
                        <button onClick={() => {setShowDTPicker(true)}}>datetime</button>
                        <button onClick={() => {addSection(selection)}}>add section</button>
                        <button onClick={() => {toggleArchive(selection)}}>archive</button>
                        |
                        <button onClick={() => { screen() ? setScreen(0) : setScreen(1) }}>agenda view</button>
                        <button onClick={() => { setArchiveView(!archiveView())}}>archive view</button>
                        <BreadCrumbs />
                        <Show when={screen() === 1}>
                            <AgendaView path={path} />
                        </Show>

                    </div>
                    <div style={{
                        'overflow': 'scroll'
                    }} onScroll={() => {
                        scroll() > 20 ? null : setScroll(Math.min(scrollY, 15))
                    }}>

                        <Show when={hack()} fallback={<EditorView selection={selection} root={myroot()}/>}>
                            <EditorView selection={selection} root={myroot()} />
                        </Show>
                    </div>
                </div>
            </Show>
        </>
    )
}