import { Component, For, createSignal, Show, Switch, Match } from "solid-js";
import * as Y from 'yjs';

import * as Icons from './Icons'

const newText = () => {
    let m = new Y.Map()
    m.set('!', new Y.Text(''))
    return m
}

const newPaint = () => {
    let m = new Y.Map()
    let p = new Y.Map()
    p.set('data', new Y.Array())
    m.set('paint', p)
    return m
}




export const NodeBar: Component<{ parent: Y.Array<any>, index: number }> = (props) => {
    const [todo, setTodo] = createSignal<Y.Map<any> | null>(null)

    return (
        <div class="grid grid-cols-3">
            <div class="flex gap-2 opacity-25">
                <button onClick={() => props.parent.insert(props.index, [new Y.Map()])}>
                    <Icons.Plus />
                </button>
                <button onClick={() => props.parent.delete(props.index)}>
                    <Icons.Minus />
                </button>
                <button>
                    <Icons.Circle />
                </button>
            </div>
            <div class="flex gap-2 justify-center">
                {props.children}
            </div>
            <div class="flex justify-end">
                <Show when={todo()}>
                    <TODO node={todo()} />
                </Show>
            </div>
        </div>
    )
}

export const TODO: Component<{ node: Y.Map<any> }> = (props) => {
    return (
        <button>
            <Switch>
                <Match when={props.node.has('!')}/>
            </Switch>
        </button>
    )
}