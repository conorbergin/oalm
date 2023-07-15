import * as Y from 'yjs'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'
import { WebrtcProvider } from 'y-webrtc'

import { basicSetup,minimalSetup } from "codemirror";

import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from '@codemirror/lang-javascript'

import { onMount, onCleanup, Component,Ref } from 'solid-js'

// import * as random from 'lib0/random'

export const usercolors = [
    { color: '#30bced', light: '#30bced33' },
    { color: '#6eeb83', light: '#6eeb8333' },
    { color: '#ffbc42', light: '#ffbc4233' },
    { color: '#ecd444', light: '#ecd44433' },
    { color: '#ee6352', light: '#ee635233' },
    { color: '#9ac2c9', light: '#9ac2c933' },
    { color: '#8acb88', light: '#8acb8833' },
    { color: '#1be7ff', light: '#1be7ff33' }
]

// select a random color for this user
export const userColor = usercolors[Math.floor(Math.random() * 100) % usercolors.length]



// provider.awareness.setLocalStateField('user', {
//     name: 'Anonymous ' + Math.floor(Math.random() * 100),
//     color: userColor.color,
//     colorLight: userColor.light
// })





export const Codemirror: Component<{ ytext: Y.Text }> = (props) => {
    let ytext = props.ytext
    let e: HTMLDivElement

    const undoManager = new Y.UndoManager(ytext)


    const state = EditorState.create({
        doc: ytext.toString(),
        extensions: [
            minimalSetup,
            javascript(),
            yCollab(ytext, null, {undoManager})
        ]
    })

    onMount(() => {
        const view = new EditorView({ state, parent: e })
    })
    return <div ref={e}></div>
}