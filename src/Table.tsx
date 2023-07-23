import { Component, createSignal, For, onCleanup, Show } from 'solid-js'
import * as Y from 'yjs'
import { EditorState } from './Editor'
import { dragSection } from './dnd'
import { TextView } from './Editor'
import { ChartChooser } from './Charts'
import { Codemirror } from './Codemirror'


let HEADER = 'header'
let ITEMS = 'items'


export const TableView: Component<{ node: Y.Map<any>, state: EditorState }> = (props) => {
    let node = props.node

    let [header, setHeader] = createSignal(node.get(HEADER).toArray())
    let [rows, setRows] = createSignal(node.get(ITEMS).toArray())

    const [graph, setGraph] = createSignal(false)

    let f = () => { setHeader(node.get(HEADER).toArray()) }
    let g = () => { setRows(node.get(ITEMS).toArray()) }

    node.get(HEADER).observe(f)
    node.get(ITEMS).observe(g)

    onCleanup(() => {
        node.get(HEADER).unobserve(f)
        node.get(ITEMS).unobserve(g)
    })

    return (
        <div class="flex flex-col">
            <div >
                <button onclick={() => {setGraph(g => !g) }}>graph</button>

            </div>
                <Show when={!graph()}>
                <div class="border-t border-l grid w-fit" style={{ "grid-template-columns": `repeat(${header().length}, fit-content(100%))`, }}>
                    <For each={header()}>
                        {(item) =>
                            <div class="p-1 border-b border-r">
                                <Codemirror ytext={item.get('name') as Y.Text}/>
                            </div>}
                    </For>
                    <For each={rows()}>
                        {(item) => <For each={header()}>{(header) =>
                            <div class="p-1 border-b border-r">
                                <Codemirror ytext={item.get(header.get('id')) as Y.Text} />
                            </div>}
                        </For>}
                    </For>
                </div>
                </Show>
                <Show when={graph()}>
                    <ChartChooser x={node.get(ITEMS).map(i => i.get(node.get(HEADER).get(0).get('id')).toString())} y={node.get(ITEMS).map(i => i.get(node.get(HEADER).get(1).get('id')).toString())} />
                </Show>           
        </div>
    )
}