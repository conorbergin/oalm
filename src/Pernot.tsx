import * as Y from "yjs";

import { IndexeddbPersistence } from "y-indexeddb";

import { Component, For, Show, Match, Switch, createSignal, onCleanup, createEffect, ErrorBoundary } from "solid-js";
import { StepSequencer } from "./StepSequencer";
import { Codemirror } from "./Codemirror";
import { TableView } from "./Table";
import { Paint } from "./Paint";
import { fixer } from "./fixer";
import { TextNode } from "./Codemirror"
import { NodeBar } from "./Toolbars";


const newSS = () => {
    let node = new Y.Map()
    node.set('S', new Y.Array())
    return node
}

const newCM = () => {
    let node = new Y.Map()
    node.set('!', new Y.Text())
    return node
}

const newPaint = () => {
    let node = new Y.Map()
    let paint = new Y.Map()
    let data = new Y.Array()
    paint.set('data', data)
    node.set('paint', paint)
    return node
}


export const Pernot: Component<{ doc: { id: string, secret: ArrayBuffer | null } }> = (props) => {

    const [synced, setSynced] = createSignal(false)

    let ydoc = new Y.Doc()

    createEffect(() => {
        setSynced(false)
        ydoc.destroy()
        ydoc = new Y.Doc()
        let indexeddbProvider = new IndexeddbPersistence(props.doc.id, ydoc)
        indexeddbProvider.whenSynced.then(() => {
            fixer(ydoc.getMap('root'))
            console.log(ydoc.get('root').toJSON())
            setSynced(true)
        })
    })




    return (
        <div class="border-t border-black overflow-scroll grid" style="grid-template-columns: 1fr min(70ch,100%) 1fr">
            <Show when={synced()}>
                <div class=""></div>
                <div class="flex flex-col p-1">
                    <FolderView root={ydoc.getMap('root')} />
                </div>
                <div class=""></div>
            </Show>
        </div>
    )
}

export const FolderView: Component = (props) => {

    const [arr, setArr] = createSignal(props.root.get('$').toArray())

    const node = props.root.get('$')

    const f = () => setArr(props.root.get('$').toArray())

    props.root.get('$').observe(f)
    onCleanup(() => props.root.get('$').unobserve(f))


    return (
        <>
            <div class="font-bold text-3xl">
                <Codemirror ytext={props.root.get('!')} />
            </div>
            <div class="flex flex-col gap-8">
                <For each={arr()}>
                    {(item, index) =>


                        <div class="max-w-prose flex-1">
                            <ErrorBoundary fallback={
                                <div class="bg-red-500">
                                    <button onClick={() => { node.delete(index()) }}>- Error!</button>
                                </div>
                            }>
                                <Switch>
                                    <Match when={item.has('S')}>
                                        <StepSequencer node={item} />
                                    </Match>
                                    <Match when={item.has('!')}>
                                        <TextNode ytext={item.get('!')} parent={props.root.get('$')} index={index()} />
                                    </Match>
                                    <Match when={item.has('header')}>
                                        <TableView node={item} />
                                    </Match>
                                    <Match when={item.has('paint')}>
                                        <Paint node={item.get('paint')} parent={props.root.get('$')} index={index()} />
                                    </Match>
                                    <Match when={true}>
                                        <NodeSelector node={item} parent={props.root.get('$')} index={index()} />
                                    </Match>
                                </Switch>
                            </ErrorBoundary>
                        </div>
                    }
                </For>
                <div class="max-w-prose flex gap-1">
                    <button onClick={() => { node.insert(node.length, [newSS()]) }}>StepSequencer</button>
                    <button onClick={() => { node.insert(node.length, [newCM()]) }}>Text</button>
                    <button onClick={() => { node.insert(node.length, [newPaint()]) }}>Paint</button>
                </div>
            </div>
        </>
    )
}

export const NodeSelector: Component<{ node: Y.Map<any>, parent: Y.Array<any>, index: number }> = (props) => {
    return (
        <NodeBar node={props.node} parent={props.parent} index={props.index} >
            <button class="" onClick={() => {
                Y.transact(props.parent.doc!, () => {
                    props.parent.delete(props.index)
                    props.parent.insert(props.index, [newPaint()])
                }
                )
            }}>PAINT</button>
            <button class="" onClick={() => {
                Y.transact(props.parent.doc!, () => {
                    props.parent.delete(props.index)
                    props.parent.insert(props.index, [newSS()])
                }
                )
            }
            }>SS</button>
            <button class="" onClick={() => {
                Y.transact(props.parent.doc!, () => {
                    props.parent.delete(props.index)
                    props.parent.insert(props.index, [newCM()])
                }
                )
            }
            }>Text</button>
        </NodeBar >
    )
}
