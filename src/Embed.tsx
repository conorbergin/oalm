// any non yjs content

import { Component, createSignal, Show } from 'solid-js'
import * as Y from 'yjs'

import {ContentContainer, EditorState } from './Editor'
import { yDeleteFromArray, ySignal } from './utils'


export const Embed: Component<{ node: Y.Map<any>, state: EditorState, collapsed: boolean }> = (props) => {

    const [content, setContent] = createSignal()
    const [failed, setFailed] = createSignal(false)
    const val = ySignal(props.node,'embed')

    const commands = [
        {name: 'delete', run : () => yDeleteFromArray(props.node)}
    ]

    const handleBeforeInput = (e:InputEvent) => e.stopImmediatePropagation()
    const handleInput = (e:InputEvent) => {
        console.log('hey')
        console.log(e.target.value)
        props.node.set('embed', e.target.value)
    }

    return (
        <ContentContainer node={props.node} state={props.state} commands={commands}>
            <div contenteditable={false}>

                <Show when={!failed()} fallback={
                    <input  class="border" onBeforeInput={handleBeforeInput} placeholder="content url" onInput={handleInput} value={val()} />
                }>
                    <img class="rounded" src={content()} onError={() => setFailed(true)} />
                </Show>
            </div>
        </ContentContainer>
    )
}