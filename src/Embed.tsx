// any non yjs content

import { Component, createSignal, Show } from 'solid-js'
import * as Y from 'yjs'

import { drag,menu, EditorState } from './Editor'


export const Embed: Component<{ node: Y.Map<any>, state: EditorState, collapsed: boolean }> = (props) => {

    const [content, setContent] = createSignal()
    const [failed, setFailed] = createSignal(false)
    const f = () => setContent(props.node.get('embed'))
    f()
    props.node.observe(f)
    // onCleanup(() => props.node.unobserve(f))


    const handleDrag = (e) => {
        drag(e, props.node, props.state, 'content')
    }

    const handleClick = (e) => {
        menu(
            e,
            props.node,
            {
                'delete': () => props.node.parent.delete(props.node.parent.toArray().indexOf(props.node), 1)
            }
        )
    }

    return (
        <div contenteditable={false} class="flex gap-1 content">
            <div>
                <button onPointerDown={handleDrag} onClick={handleClick}>~</button>
            </div>

            <Show when={!failed()} fallback={
                <input class="border" placeholder="content url" onInput={(e) => props.node.set('embed', e.currentTarget.value)} />
            }>
                <img class="rounded" src={content()} onError={() => setFailed(true)} />
            </Show>
        </div>
    )
}