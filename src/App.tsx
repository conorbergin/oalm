import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect } from 'solid-js'
import { createStore } from 'solid-js/store'

import { Sel } from './selection'


import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { WebrtcProvider } from 'y-webrtc'

import { fixer } from './fixer'
import { EditorState } from './editorstate'

import { EditorView } from './Editor'
import { addSection, toggleDone, toggleArchive } from './input'

import { ToolBar } from './ToolBar'
import { AgendaView } from './Agenda'
import { DTPicker } from './DatePicker'
import { Portal } from 'solid-js/web'
import { CalendarView } from './Calendar'
import { StepSequencer } from './StepSequencer'
import { Pernot } from './Pernot'


const myDoc = new Y.Doc()
const indexeddbProvider = new IndexeddbPersistence('my-room-name2', myDoc)
const webrtcProvider = new WebrtcProvider('my-room-name2', myDoc)


// const hexKey = () => Array.from(crypto.getRandomValues(new Uint8Array(16))).map(byte => byte.toString(16).padStart(2, '0')).join('')
// console.log(hexKey())
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

const AccountView: Component = () => {
    return (
        <div>
            <button onClick={() => { }}>Sign out</button>
        </div>
    )
}

export const App: Component = () => {

    const [synced, setSynced] = createSignal(false)
    const [agenda, setAgenda] = createSignal(false)
    const [screen, setScreen] = createSignal(0)
    const [scroll, setScroll] = createSignal(0)
    const [showDTPicker, setShowDTPicker] = createSignal(false)

    const [accountView, setAccountView] = createSignal(false)



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
                <div class="flex flex-col fixed w-full h-full">
                    <div class="p-1 pb-0">
                        <div class="flex gap-4 text-sm">
                            <button onClick={() => { setScreen(screen() === 1 ? 0 : 1) }}>Calendar</button>
                            <button onClick={() => { setAccountView(!accountView()) }}>Account</button>
                        </div>
                        <Show when={accountView()}>
                            <AccountView />
                        </Show>
                    </div>
                    <Switch>
                        <Match when={screen() === 0}>
                            <Pernot root={myroot()} />

                        </Match>
                        <Match when={screen() === 1}>
                            <CalendarView />
                        </Match>
                        <Match when={screen() === 2}>
                            <Pernot root={myroot()} />
                        </Match>
                    </Switch>
                </div>
            </Show>
        </>
    )
}