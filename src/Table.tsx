import { Component, createSignal, For, onCleanup, Show } from 'solid-js'
import * as Y from 'yjs'
import { EditorState } from './Editor'
import { dragSection } from './dnd'
import { ChartChooser } from './Charts'
import { Codemirror } from './Codemirror'
import { NodeBar } from './Toolbars'


import { createTable, addColumn, addRow, deleteColumn, deleteRow } from './table'

import * as Icons from './Icons'


let HEADER = 'header'
let ITEMS = 'items'



export const TextView: Component<{ node: Y.Text | Y.XmlText, state: EditorState, tag: string }> = (props) => {

    let node = props.node
    let { docFromDom, domFromDoc } = props.state


    let s = node.toString()

    let el = document.createElement(props.tag)
    s.length > 0 ? el.textContent = s : el.innerHTML = '<br>'

    let update = () => { s.length > 0 ? el.textContent = s : el.innerHTML = '<br>' }

    node.observe(update)
    onCleanup(() => {
        node.unobserve(update)
    })
    return el
}

export const TableView: Component<{ node: Y.Map<any>, parent: Y.Array<any>, index: number }> = (props) => {

    let [header, setHeader] = createSignal(props.node.get(HEADER).toArray())
    let [rows, setRows] = createSignal(props.node.get(ITEMS).toArray())

    const [graph, setGraph] = createSignal(false)

    let f = () => { setHeader(props.node.get(HEADER).toArray()) }
    let g = () => { setRows(props.node.get(ITEMS).toArray()) }

    props.node.get(HEADER).observe(f)
    props.node.get(ITEMS).observe(g)

    onCleanup(() => {
        props.node.get(HEADER).unobserve(f)
        props.node.get(ITEMS).unobserve(g)
    })

    return (
        <div class="flex gap-1">
            <div>
                <button>
                    <Icons.Drag2/>
                </button>
            </div>
            <div class="grid overflow-x-scroll h-fit" style={{ "grid-template-columns": `repeat(${header().length }, minmax(5rem,max-content))`, }}>
                <For each={header()}>
                    {(item, index) =>
                        <div classList={{ 'border-l': index() === 0 }} class="border-b border-r border-t border-black">
                            <Codemirror ytext={item.get('name') as Y.Text}/>
                        </div>}
                </For>
                <For each={rows()}>
                    {(item) =>
                        <For each={header()}>{(header,index) =>
                            <div classList={{ 'border-l': index() === 0 }} class="border-b border-r">
                                <Codemirror ytext={item.get(header.get('id')) as Y.Text}/>
                            </div>}
                        </For>}
                </For>
                <button onClick={() => addRow(props.node)}>+</button>

            </div>
            <button onClick={() => addColumn(props.node)}>+</button>
        </div>
    )
}