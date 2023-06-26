import * as Y from 'yjs';
import { Component, onCleanup, createSignal, For, Setter, Show, Switch, Match, onMount, on, createEffect } from 'solid-js';
import { beforeinputHandler, keydownHandler, addSection } from './input';
import { dragSection } from './dnd';
import { Sel, selectionFromDom, selectionToDom } from './selection';

export const [lock, setLock] = createSignal(false)


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


export const EditorView: Component<{ root: Y.Map<any> }> = (props) => {
    

    let state = new EditorState(props.root)
    let selection = { node: props.root.get('content').get(0).get('heading'), offset: 0, focus: null }


    return (
        <>
            <div class="editor" contenteditable={!lock()} spellcheck={false} onBeforeInput={(e) => {
                selectionFromDom(selection, state.docFromDom)
                beforeinputHandler(e, selection)
                selectionToDom(selection, state.domFromDoc)
            }} onKeyDown={(e) => {
                selectionFromDom(selection, state.docFromDom)
                keydownHandler(e, selection)
                selectionToDom(selection, state.domFromDoc)
            }} onPointerDown={() => selectionFromDom(selection, state.docFromDom)}>
                <SectionView node={props.root} state={state} depth={0} />
            </div>
        </>
    )
}

export const ToolBar: Component<{ selection: Sel }> = (props) => {
    return (
        <div>
            <button onClick={() => { addSection(props.selection.node) }}>Add Section</button>
            <button onClick={() => { }}>Add Sibling</button>
            <button onClick={() => { }}>Delete Section</button>
        </div>
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
    return (
        <div ref={s} class="section" classList={{ border: props.depth > 0 }}>
            <Show when={props.node.has('schedule')}>
                <ScheduleView node={props.node.get('schedule')} />
            </Show>
            <div class="block-container">
                <button class="block-button" style={props.depth === 0 ? "color: lightgrey" : ""} contentEditable={false} onpointerdown={(e) => dragSection(e, props.node, props.state)} >#</button>
                <TextView node={props.node.get('heading')} state={props.state} tag={`h${props.depth + 1}`} />
            </div>
            <Show when={props.node.has('content')}>
                <ContentView node={props.node.get('content')} state={props.state} />
            </Show>
            <ArrayView node={props.node.get('children')} state={props.state} depth={props.depth + 1} />
        </div>
    )
}

export const ArrayView: Component<{ node: Y.Array<any>, state: EditorState, depth: number }> = (props) => {
    let [arr, setArr] = createSignal(props.node.toArray())

    let f = () => { setArr(props.node.toArray()) }
    props.node.observe(f)
    // onCleanup(() => { props.node.unobserve(f) })

    return (
        <>
            <For each={arr()}>
                {(item) => <SectionView node={item} state={props.state} depth={props.depth} />}
            </For>
        </>
    )
}

export const ContentView: Component<{ node: Y.Array<any>, state: EditorState }> = (props) => {
    let [arr, setArr] = createSignal(props.node.toArray())

    let f = () => { setArr(props.node.toArray()) }
    props.node.observe(f)
    // onCleanup(() => { props.node.unobserve(f) })

    return (
        <>
            <For each={arr()}>
                {(item) =>
                    <Switch>
                        <Match when={item.has('heading')}>
                            <ParagraphView node={item} state={props.state} />
                        </Match>
                        <Match when={item.has('header')}>
                            <TableView node={item} state={props.state} />
                        </Match>
                    </Switch>
                }
            </For>
        </>
    )
}

export const ParagraphView: Component<{ node: Y.Map<any>, state: EditorState }> = (props) => {
    return (
        <div class="block-container">
            <button class="block-button" contentEditable={false} textContent="~" onpointerdown={(e: PointerEvent) => { dragSection(e, props.node, props.state) }}></button>
            <TextView node={props.node.get('heading')} state={props.state} tag="p" />
        </div>
    )
}

export function highlight(str: string) {
    const regex = /(\s)(\*\S.*?\S\*)(\s)/g;
    const htmlString = str.replace(regex, '$1<strong>$2</strong>$3');
    const regex2 = /(\s)(_\S.*?\S_)(\s)/g;
    const htmlString2 = htmlString.replace(regex2, '$1<em>$2</em>$3');
    return htmlString2;
}

export const TextView: Component<{ node: Y.Text | Y.XmlText, state: EditorState, tag: string }> = (props) => {

    let node = props.node
    let { docFromDom, domFromDoc } = props.state

    let el = document.createElement(props.tag)
    el.innerHTML = highlight(props.node.toString()) || '<br>'

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

    let [header, setHeader] = createSignal(node.get('header').toArray())
    let [rows, setRows] = createSignal(node.get('items').toArray())

    let f = () => { setHeader(node.get('header').toArray()) }
    let g = () => { setRows(node.get('items').toArray()) }

    node.get('header').observe(f)
    node.get('items').observe(g)

    onCleanup(() => {
        node.get('header').unobserve(f)
        node.get('items').unobserve(g)
    })

    return (
        <div class="block-container">
            <button class="block-button" contentEditable={false} textContent="T" onpointerdown={(e: PointerEvent) => { dragSection(e, props.node, props.state) }}></button>
            <div style={{
                'font-size': 'smaller',
                'border-left': '1px solid lightgrey',
                'border-top': '1px solid lightgrey',
                'display': 'grid',
                "grid-template-columns": `repeat(${header().length}, fit-content(100%))`,
            }}>
                <For each={header()}>
                    {(item) =>
                        <div style={{
                            padding: '0.2rem 1rem',
                            'border-bottom': '1px solid lightgrey',
                            'border-right': '1px solid lightgrey',
                        }}>
                            <TextView node={item.get('name') as Y.Text} state={props.state} tag="strong" />
                        </div>}
                </For>
                <For each={rows()}>
                    {(item) => <For each={header()}>{(header) =>
                        <div style={{
                            padding: '0.2rem 1rem',
                            'border-bottom': '1px solid lightgrey',
                            'border-right': '1px solid lightgrey',

                        }}>
                            <TextView node={item.get(header.get('id')) as Y.Text} state={props.state} tag="span" />
                        </div>}
                    </For>}
                </For>
            </div>
        </div>
    )
}

const ScheduleView: Component<{ node: Y.Map<any> }> = (props) => {
    let node = props.node

    let [status, getStatus] = createSignal(node.get('status').toString())
    let [date, getDate] = createSignal(node.get('date').toString())

    let f = () => {
        getStatus(node.get('status').toString())
        getDate(node.get('date').toString())
    }

    node.observeDeep(f)

    // Somethings wrong here, no observer to unobserve

    // onCleanup(() => node.unobserve(f))

    return (
        <div contenteditable={false} style={{
            'font-size': 'small',
            'height': '0.8rem',
            'margin-left': '1.21rem',
            'align-content': 'middle'
        }}>
            <Show when={status()}>
                <span style={{ display: 'inline-block', color: status() === 'due' ? 'green' : 'red', width: '2.6rem' }}>{status()}</span>
            </Show>
            <Show when={date()}>
                <span>{date()}</span>
            </Show>

        </div>
    )
}