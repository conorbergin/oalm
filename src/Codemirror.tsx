import * as Y from 'yjs'
// @ts-ignore
import { yCollab } from 'y-codemirror.next'
import { WebrtcProvider } from 'y-webrtc'

import { basicSetup, minimalSetup } from "codemirror";

import { EditorView } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { javascript } from '@codemirror/lang-javascript'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';

import { onMount, onCleanup, Component, Ref, on } from 'solid-js'
import { NodeBar } from './Toolbars';

import { tags } from "@lezer/highlight"
import { HighlightStyle } from "@codemirror/language"
import {syntaxHighlighting} from "@codemirror/language"

import * as Icons from './Icons'

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



export const TextNode: Component<{ ytext: Y.Text, parent: Y.Array<any>, index: number }> = (props) => {

    return (
        <div class="flex items-start gap-1">
            <button onClick={() => {}} >
                <Icons.Drag2 />
            </button>
            <div class="rounded  bg-stone-100 flex-1 overflow-scroll">

            <Codemirror ytext={props.ytext} />
            </div>
        </div>
    )
}


export const Codemirror: Component<{ ytext: Y.Text }> = (props) => {
    let ytext = props.ytext
    let e: HTMLDivElement



    const myHighlightStyle = HighlightStyle.define([
        { tag: tags.heading, color: "#069", fontWeight: "bold" },
        { tag: tags.strong, fontWeight: "bold" },
        { tag: tags.emphasis, fontStyle: "italic" },
        { tag: tags.link, color: "#1c3aff" },
        { tag: tags.strikethrough, color: "#993a00" },
    ])


    let undoManager = new Y.UndoManager(ytext)

    let view: EditorView

    onMount(() => {
        view = new EditorView({
            state: EditorState.create({
                doc: ytext.toString(),
                extensions: [
                    EditorView.lineWrapping,
                    minimalSetup,
                    markdown({
                        base: markdownLanguage,
                    }),
                    yCollab(ytext, null, { undoManager }),
                    syntaxHighlighting(myHighlightStyle)
                ]
            }), parent: e
        })
    })

    onCleanup(() => {
        view && view.destroy()

    })
    return <div  ref={e}></div>
}