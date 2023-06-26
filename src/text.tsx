import type * as Y from 'yjs'

import { EditorState } from './Editor';

import './style.css'
import { Component, onCleanup } from 'solid-js';



export function highlight(str: string) {
    const regex = /(\s)(\*\S.*?\S\*)(\s)/g;
    const htmlString = str.replace(regex, '$1<strong>$2</strong>$3');
    const regex2 = /(\s)(_\S.*?\S_)(\s)/g;
    const htmlString2 = htmlString.replace(regex2, '$1<em>$2</em>$3');
    return htmlString2;
}

export const TextView: Component<{ node: Y.Text | Y.XmlText, state: EditorState, tag: string }> = (props) => {
    let el = document.createElement(props.tag)
    el.innerHTML = highlight(props.node.toString()) || '<br>'

    props.state.docFromDom.set(el, props.node)
    props.state.domFromDoc.set(props.node, el)

    let update = () => {el.innerHTML = highlight(props.node.toString()) || '<br>'}

    props.node.observe(update)
    onCleanup(() => {
        props.node.unobserve(update)
    })
    return el
}


