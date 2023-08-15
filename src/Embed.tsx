// any non yjs content

import { Component, createSignal,Show } from 'solid-js'
import * as Y from 'yjs'

import { drag } from './Editor'


export const Embed : Component<{ node: Y.Map<any>, collapsed: boolean }> = (props) => {

    const [content, setContent] = createSignal()
    const f = () => setContent(props.node.get('embed'))
    f()
    props.node.observe(f)
    // onCleanup(() => props.node.unobserve(f))

    return (
        <div contenteditable={false} class="relative border flex">
            <button class="absolute">~</button>
            
            <Show when={content() !== ''} fallback={
                <input class="border" placeholder="embed" onInput={(e) => props.node.set('embed', e.currentTarget.value)} />
            }>
                <img src={content()} />
            </Show>
        </div>
    )
}