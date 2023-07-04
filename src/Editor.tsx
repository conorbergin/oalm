import * as Y from 'yjs';
import { Component, onCleanup, createSignal, For, Setter, Show, Switch, Match, onMount, on, createEffect, Accessor } from 'solid-js';
import { TEXT, CONTENT, CHILDREN, HEADER, ITEMS, beforeinputHandler, keydownHandler } from './input';
import { dragSection } from './dnd';
import { Sel, selectionFromDom, selectionToDom } from './selection';

export const [lock, setLock] = createSignal(false)

import { archiveView } from './App'

const PARAGRAPH_HANDLE = '◦'
const HEADING_HANDLE = '#'
const TABLE_HANDLE = '⸬'


export interface EditorState {
    root: Y.Map<any>

    domFromDoc: Map<any, HTMLElement>
    docFromDom: Map<HTMLElement, any>

}

export class EditorState {
    constructor(root: Y.Map<any>) {
        this.root = root
        this.domFromDoc = new Map()
        this.docFromDom = new Map()
    }
}


export const EditorView: Component<{ selection: Sel, root: Y.Map<any> }> = (props) => {


    let state = new EditorState(props.root)


    return (
        <>
            <div class="editor" contenteditable={!lock()} spellcheck={false} onBeforeInput={(e) => {
                selectionFromDom(props.selection, state.docFromDom)
                beforeinputHandler(e, props.selection)
                selectionToDom(props.selection, state.domFromDoc)
            }} onKeyDown={(e) => {
                selectionFromDom(props.selection, state.docFromDom)
                keydownHandler(e, props.selection)
                selectionToDom(props.selection, state.domFromDoc)
            }} onPointerDown={() => { selectionFromDom(props.selection, state.docFromDom) }}>
                <SectionView node={props.root} state={state} depth={0} />
            </div>
        </>
    )
}

export const SectionView: Component<{ node: Y.Map<any>, state: EditorState, depth: number }> = (props) => {
    let state = props.state
    let node = props.node
    let s: HTMLElement

    onMount(() => {
        state.docFromDom.set(s, node)
        state.domFromDoc.set(node, s)
    })

    let [done, setDone] = createSignal(node.has('done'))
    let [due, setDue] = createSignal<String | null>(node.get('~')?.toString() ?? null)
    let [archive, setArchive] = createSignal(node.has('r'))


    let [hidden, setHidden] = createSignal(false)

    let f = () => setDone(node.has('done'))
    let g = () => setDue(node.get('~')?.toString() ?? null)
    let h = () => setArchive(node.has('r'))


    node.observe(f)
    node.observe(g)
    node.observe(h)

    onCleanup(() => {
        node.unobserve(f)
        node.unobserve(g)
        node.unobserve(h)
    })

    return (
        <Show when={!archive() || archiveView()}>
            <div ref={s} class="p-2 flex flex-col gap-2" classList={{ border: props.depth > 0, done: done(), archive: archive() }}>
                <Show when={due()}>
                    <ScheduleView s={due()} />
                </Show>
                <div class="flex gap-1">
                    <button class="block-button" style={props.depth === 0 ? "color: lightgrey" : ""} contentEditable={false} onpointerdown={(e) => dragSection(e, props.node, props.state)} >#</button>
                    <TextView node={props.node.get(TEXT)} state={props.state} tag={`h${props.depth + 1}`} />
                </div>
                <Show when={!hidden()}>
                    <Show when={props.node.has(CONTENT)}>
                        <ContentView node={props.node.get(CONTENT)} state={props.state} />
                    </Show>
                    <ArrayView node={props.node.get(CHILDREN)} state={props.state} depth={props.depth + 1} />
                </Show>
            </div>
        </Show>
    )
}

export const ArrayView: Component<{ node: Y.Array<any>, state: EditorState, depth: number }> = (props) => {
    let node = props.node
    let [arr, setArr] = createSignal(node.toArray())

    let f = () => { setArr(node.toArray()) }
    node.observe(f)
    onCleanup(() => { node.unobserve(f) })

    return (
        <>
            <For each={arr()}>
                {(item) => <SectionView node={item} state={props.state} depth={props.depth} />}
            </For>
        </>
    )
}

export const ContentView: Component<{ node: Y.Array<any>, state: EditorState }> = (props) => {
    let node = props.node
    let [arr, setArr] = createSignal(node.toArray())

    let f = () => { setArr(node.toArray()) }
    node.observe(f)
    onCleanup(() => { node.unobserve(f) })

    return (
        <>
            <For each={arr()}>
                {(item) =>
                    <Switch>
                        <Match when={item.has(TEXT)}>
                            <ParagraphView node={item} state={props.state} />
                        </Match>
                        <Match when={item.has(HEADER)}>
                            <TableView node={item} state={props.state} />
                        </Match>
                    </Switch>
                }
            </For>
        </>
    )
}




export const ParagraphView: Component<{ node: Y.Map<any>, state: EditorState }> = (props) => {
    let node = props.node
    let [hasContent, setHasContent] = createSignal(node.get(CONTENT).length > 0)
    console.log(hasContent())

    let f = () => setHasContent(node.get(CONTENT).length > 0)
    node.observe(f)


    let [done, setDone] = createSignal(node.has('done'))

    let g = () => setDone(node.has('done'))

    node.observe(g)


    onCleanup(() => {
        node.unobserve(g)
        node.unobserve(f)
    })

    return (
        <div class="flex flex-col gap-1" classList={{ done: done() }}>

            <div class="flex gap-1">
                <button class="block-button" contentEditable={false} onpointerdown={(e: PointerEvent) => { dragSection(e, props.node, props.state) }}>{PARAGRAPH_HANDLE}</button>
                <TextView node={props.node.get(TEXT)} state={props.state} tag="p" />

            </div>

            <Show when={hasContent()}>
                <div style={{ 'display': 'flex', gap: '0.3rem', 'align-items': 'start' }}>
                    <div class="pl-3">
                        <ContentView node={node.get(CONTENT)} state={props.state} />
                    </div>
                </div>
            </Show>
        </div>
    )
}

export function highlight(str: string) {
    const regex = /(?<!\S)(\*\S.*?\S\*)(?!\S)/g;
    const htmlString = str.replace(regex, '<strong>$1</strong>');
    const regex2 = /(?<!\S)(_\S.*?\S_)(?!\S)/g;
    const htmlString2 = htmlString.replace(regex2, '<em>$1</em>');
    return htmlString2;
}

export const TextView: Component<{ node: Y.Text | Y.XmlText, state: EditorState, tag: string }> = (props) => {

    let node = props.node
    let { docFromDom, domFromDoc } = props.state


    let s = node.toString()

    let el = document.createElement(props.tag)
    el.innerHTML = highlight(s) || '<br>'

    docFromDom.set(el, props.node)
    domFromDoc.set(props.node, el)

    let update = () => { el.innerHTML = highlight(node.toString()) || '<br>' }

    node.observe(update)
    onCleanup(() => {
        node.unobserve(update)
    })
    return el
}

export const TableView: Component<{ node: Y.Map<any>, state: EditorState }> = (props) => {
    let node = props.node

    let [header, setHeader] = createSignal(node.get(HEADER).toArray())
    let [rows, setRows] = createSignal(node.get(ITEMS).toArray())

    let f = () => { setHeader(node.get(HEADER).toArray()) }
    let g = () => { setRows(node.get(ITEMS).toArray()) }

    node.get(HEADER).observe(f)
    node.get(ITEMS).observe(g)

    onCleanup(() => {
        node.get(HEADER).unobserve(f)
        node.get(ITEMS).unobserve(g)
    })

    return (
        <div class="block-container">
            <button class="block-button" contentEditable={false} onpointerdown={(e: PointerEvent) => { dragSection(e, props.node, props.state) }}>{TABLE_HANDLE}</button>
            <div style={{
                'font-size': 'smaller',
                'border-left': '1px solid lightgrey',
                'border-top': '1px solid lightgrey',
                'display': 'grid',
                "grid-template-columns": `repeat(${header().length}, fit-content(100%))`,
            }}>
                <For each={header()}>
                    {(item) =>
                        <div class="p-1 border-b border-r">
                            <TextView node={item.get('name') as Y.Text} state={props.state} tag="strong" />
                        </div>}
                </For>
                <For each={rows()}>
                    {(item) => <For each={header()}>{(header) =>
                        <div class="p-4 border-t border-l">
                            <TextView node={item.get(header.get('id')) as Y.Text} state={props.state} tag="span" />
                        </div>}
                    </For>}
                </For>
            </div>
        </div>
    )
}

const ScheduleView: Component<{ s: string }> = (props) => {


    return (
        <div contenteditable={false} style={{
            'font-size': 'x-small',
            'height': '0.5rem',
            'margin-left': '1.22rem',
            'align-content': 'middle'
        }}>
            {props.s}

        </div>
    )
}