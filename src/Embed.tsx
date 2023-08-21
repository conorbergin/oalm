// any non yjs content

import { Component, createSignal, Show } from 'solid-js'
import * as Y from 'yjs'

import {ContentContainer, EditorState } from './Editor'
import { yDeleteSelfFromArray } from './utils'


export const Embed: Component<{ node: Y.Map<any>, state: EditorState, collapsed: boolean }> = (props) => {

    const [content, setContent] = createSignal()
    const [failed, setFailed] = createSignal(false)
    const f = () => setContent(props.node.get('embed'))
    f()
    props.node.observe(f)
    // onCleanup(() => props.node.unobserve(f))

    const commands = [
        {name: 'delete', run : () => yDeleteSelfFromArray(props.node)}
    ]


    return (
        <ContentContainer node={props.node} state={props.state} commands={commands}>
            <div contenteditable={false}>

                <Show when={!failed()} fallback={
                    <input class="border" placeholder="content url" onInput={(e) => props.node.set('embed', e.currentTarget.value)} />
                }>
                    <img class="rounded" src={content()} onError={() => setFailed(true)} />
                </Show>
            </div>
        </ContentContainer>
    )
}