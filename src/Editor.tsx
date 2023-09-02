import * as Y from 'yjs';
import { Component, onCleanup, createSignal, For, Setter, Show, Switch, Match, onMount, on, createEffect, Accessor, ErrorBoundary, createRenderEffect } from 'solid-js';
import { TEXT, CONTENT, CHILDREN, HEADER, ITEMS, beforeinputHandler, addSection } from './input';
import { Sel, selectionFromDom, selectionToDom } from './selection';
import { Sequencer, newPiece } from './Sequencer';
import { TableView, newTable } from './Table';
import { Embed } from './Embed';
import { ParagraphView, TextView } from './Text';

import { Paint } from './Paint';

import { yDeleteFromArray, yArraySignal, yReplaceInArray } from './utils';


export const [lock, setLock] = createSignal(false)

import { DTNode, MaybeDT } from './DatePicker';
import { Dialog } from './Dialog';
import { AgendaView } from './Agenda';
import { setContext } from 'tone';

const PARAGRAPH_HANDLE = ':'
const HEADING_HANDLE = '#'
const TABLE_HANDLE = ':'
const BULLET = '•'


const newPaint = () => {
    let node = new Y.Map()
    node.set('paint', new Y.Array())
    return node
}


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

const newSection = () => {
    const m = new Y.Map()
    m.set('!', new Y.Text('heading'))
    m.set('$', new Y.Array())
    m.set('&', new Y.Array())
    return m
}




const newEmbed = () => {
    const m = new Y.Map()
    m.set('embed', '')
    return m
}

export const drag = (event: PointerEvent, node: any, editor: EditorState, klass: string) => {
    const zoneHeight = 20
    if (!(event.target instanceof Element)) return
    event.target.releasePointerCapture(event.pointerId)
    event.preventDefault()

    let targetElement = event.target.closest(`.${klass}`) as HTMLElement

    let moved = false


    let newParent = node.parent
    let oldIndex = (node.parent! as Y.Array<any>).toArray().indexOf(node)
    let newIndex = oldIndex

    let rect = targetElement.getBoundingClientRect()
    let dragElement = targetElement.cloneNode(true) as HTMLElement
    let dragShadow = Object.assign(document.createElement('div'), { className: 'border bg-gray-100' })
    dragShadow.style.height = rect.height + 'px'

    let initialX = event.clientX - rect.left
    let initialY = event.clientY - rect.top

    const handlePointerMove = (e: PointerEvent) => {
        if (!moved) {
            if (Math.abs(e.clientY - event.clientY) < 5 || Math.abs(e.clientX - event.clientX) < 5) {
                return
            } else {
                moved = true
                targetElement.style.display = 'none'
                targetElement.insertAdjacentElement('afterend', dragShadow)
                dragElement.classList.add('absolute', 'z-50', 'font-body')
                dragElement.style.width = rect.width - 20 + 'px'
                dragElement.style.top = '0px'
                dragElement.style.left = '0px'
                dragElement.style.pointerEvents = 'none'
                dragElement.style.transform = `translate(${event.clientX - initialX}px, ${event.clientY + window.scrollY - initialY}px)`
                document.body.appendChild(dragElement)
            }
        }
        moved = true
        if (e.pointerId !== event.pointerId) return
        event.preventDefault()

        if (e.clientY > window.innerHeight - 100) {
            window.scrollBy(0, 10)
        } else if (e.clientY < 100) {
            window.scrollBy(0, -10)
        }

        dragElement.style.transform = `translate(${e.clientX - initialX}px, ${e.clientY + window.scrollY - initialY}px)`

        if (e.target === dragShadow) return

        let t = null
        if (e.target instanceof Element) {
            t = e.target.closest(`.${klass}`)
        }
        let tnode = editor.docFromDom.get(t)
        if (tnode) {
            console.log('hello')
            let r = t.getBoundingClientRect()
            let index = (tnode.parent as Y.Array<any>).toArray().indexOf(tnode)
            if (e.clientY < r.top + zoneHeight) {
                // console.log('before')
                newIndex = index
                newParent = tnode.parent
                t.before(dragShadow)
            } else if (e.clientY > r.bottom - zoneHeight) {
                // console.log('after')
                newIndex = index + 1
                newParent = tnode.parent
                t.after(dragShadow)
            }
        }
    }

    const handlePointerUp = (e: PointerEvent) => {
        e.preventDefault()
        dragElement.remove()
        dragShadow.remove()
        targetElement.style.display = ''

        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)

        if (!moved) {
            return
        }

        if (newParent !== node.parent) {
            console.log('move')
            Y.transact(node.doc!, () => {
                let n = node.clone();
                (node.parent as Y.Array<any>).delete(oldIndex);
                (newParent as Y.Array<any>).insert(newIndex, [n]);
            })
            return
        } else if (newIndex !== oldIndex) {
            Y.transact(node.doc!, () => {
                let n = node.clone()
                let adj = newIndex > oldIndex ? 1 : 0;
                (node.parent as Y.Array<any>).delete(oldIndex);
                (newParent as Y.Array<any>).insert(newIndex - adj, [n]);


            })
        } else {
            console.log('no change')
            return
        }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
}



export const EditorView: Component<{ node: Y.Map<any>, setPath: Setter<Array<Y.Map<any>>> }> = (props) => {

    let state = new EditorState(props.node)

    let selection = {
        root: props.node,
        node: props.node.get(TEXT),
        offset: 0,
        focus: null
    }

    const [palette, setPalette] = createSignal(false)
    const [paletteCoords, setPaletteCoords] = createSignal({ x: 0, y: 0 })

    const keydownHandler = (e: KeyboardEvent, s: Sel) => {
        switch (true) {

            case e.key === ' ' && s.offset === 0 && s.node.length === 0:
                e.preventDefault()
                let r = state.domFromDoc.get(s.node).getBoundingClientRect()
                setPaletteCoords({ x: r.left, y: r.top })
                setPalette(true)
                break
            case e.key === 'Enter' && e.shiftKey && e.ctrlKey:
                e.preventDefault()
                addSection(s)
                break
            case e.key === 'Enter' && e.ctrlKey:
                e.preventDefault()
                addSection(s)
                break
            case e.key === 'Enter' && e.shiftKey:
                e.preventDefault()
                s.node.insert(s.offset, '\n')
            case e.key === 'Backspace' && e.ctrlKey && e.shiftKey:
                e.preventDefault()
                // deleteSection(getSection(s.node))
                break
            // case e.key === 'l' && e.ctrlKey:
            //     e.preventDefault()
            //     insertList(s)
            //     break
            // case e.key === '1' && e.ctrlKey:
            //     e.preventDefault()
            //     insertContent(s, ...createTable(''),true)
            //     break
            // case e.key === '2' && e.ctrlKey:
            //     toggleDone(s)
            //     break
            // case e.key === 'b' && e.ctrlKey:
            //     e.preventDefault()
            //     break
            // case e.key === 'i' && e.ctrlKey:
            //     e.preventDefault()
            //     break
            default:
                break
        }
    }

    const handleBeforeInput = (e) => {
        selectionFromDom(selection, state.docFromDom)
        beforeinputHandler(e, selection)
        selectionToDom(selection, state.domFromDoc)
        state.domFromDoc.get(selection.node)?.scrollIntoView({ block: 'nearest', inline: 'start' })
    }

    const handleKeyDown = (e) => {
        selectionFromDom(selection, state.docFromDom)
        console.log(selection)

        keydownHandler(e, selection)
        selectionToDom(selection, state.domFromDoc)
    }




    return (
        <div class='overflow-y-scroll'>
            <div class="font-body editor flex" style='display:grid;grid-template-columns:1fr min(100%,70ch) 1fr' contenteditable={!lock()} spellcheck={false} onBeforeInput={handleBeforeInput} onPointerDown={() => { selectionFromDom(selection, state.docFromDom) }}>

                <SectionView node={props.node} depth={0} state={state} setPath={props.setPath} last={true} />
            </div >
            <Show when={palette()}>
                <div class="fixed top-0 left-0 w-screen h-screen bg-gray-400/25" onClick={() => setPalette(false)} >
                    <div class='absolute bg-white flex border rounded gap-1' style={`top:${paletteCoords().y}px;left:${paletteCoords().x}px`}>
                        <button onClick={() => { yReplaceInArray(selection.node.parent, newPaint()) }}>Paint</button>
                        <button onClick={() => { yReplaceInArray(selection.node.parent, newPiece()) }}>Song</button>
                        <button onClick={() => { yReplaceInArray(selection.node.parent, newEmbed()) }}>Embed</button>
                        <button onClick={() => { yReplaceInArray(selection.node.parent, newTable('')[0]) }}>Table</button>
                    </div>
                </div>
            </Show>
        </div>
    )
}

const HandleIcon: Component<{ last: boolean, section: boolean, sprogs: boolean }> = (props) => {
    return (
        <svg style='shape-rendering:crisp-edges' width={props.last ? '17px' : '16px'} viewBox={`0 0 ${props.last ? '17' : '16'} 16`}>
            <Show when={props.last}>
                <line x1={0.5} y1={0} x2={0.5} y2={8} stroke-width={1} stroke='black' />
            </Show>
            <line x1={0} y1={8.5} x2={3} y2={8.5} stroke-width={1} stroke='black' />
            <Show when={props.section} fallback={<circle cx={8.5} cy={8.5} r={3} fill='none' stroke='black' />}>

                <rect x={3.5} y={3.5} width={12} height={12} fill='none' stroke='black' stroke-width={1} shape-rendering='crispEdges' />
            </Show>
        </svg>
    )
}

const HandleIcon2: Component<{ last: boolean, section: boolean, sprogs: boolean }> = (props) => {
    return (
        <div style='display:grid; grid-template-columns: 3px 5px 5px 3px; grid-template-rows: 9px 5px 5px 1fr;height:100%'>
            <div style='grid-column-start:1; grid-row-start:1; grid-row-end:3' classList={{ 'border-l': props.last }} class='border-b' />

            <div style='grid-column-start:2;grid-row-start:2;grid-column-end:4;grid-row-end:4' class='border' classList={{ 'rounded-full': !props.section }} />

            <div style='grid-column-start:3;grid-row-start:4' classList={{ 'border-l': props.sprogs }} />

        </div>
    )
}

export const SectionView: Component<{ node: Y.Map<any>, state: EditorState, depth: number, setPath: Setter<Array<Y.Map<any>>>, last: boolean }> = (props) => {

    let s: HTMLElement

    const [menu, setMenu] = createSignal(false)
    const [coords, setCoords] = createSignal({ x: 0, y: 0 })

    onMount(() => {
        props.state.docFromDom.set(s, props.node)
        props.state.domFromDoc.set(props.node, s)
    })

    let [hidden, setHidden] = createSignal(false)

    const [done, setDone] = createSignal(false)
    const children = yArraySignal(props.node.get(CHILDREN))
    const content = yArraySignal(props.node.get(CONTENT))

    const handleDrag = (e) => {
        drag(e, props.node, props.state, 'section')
    }

    createEffect(() => {
        if (menu()) {
            const rect = s.getBoundingClientRect()
            setCoords({ x: rect.left, y: rect.top })
        }
    })

    return (
        <>
            <Show when={menu()}>
                <div contentEditable={props.depth !== 0} class='fixed top-0 left-0 w-screen h-screen bg-gray-400/25' onClick={() => setMenu(false)}>
                    <div class='absolute bg-white p-1 rounded border flex flex-col' style={`left:${coords().x}px;top:${coords().y}px`}>
                        <button onClick={() => yDeleteFromArray(props.node)} >delete</button>
                        <button onClick={() => props.node.set('done', !props.node.get('done') ?? true)} >mark done</button>
                        <button onClick={() => props.node.parent.insert(props.node.parent.toArray().indexOf(props.node), [newSection()])} >+ sibling</button>
                        <button onClick={() => props.node.get('&').unshift([newSection()])} >+ child</button>
                        <button onClick={() => props.setPath(p => [...p, props.node])}>Open</button>
                    </div>
                </div>
            </Show>
            <div ref={s} class=' flex flex-col' classList={{ 'border-l': !props.last, 'section':props.depth === 0 }} style={ props.depth === 0 ? 'grid-column:2/3' : ''}>
                <div class='leading-none text-sm font-bold pl-5 pr-5 pt-1' classList={{ 'border-l': props.last }} contentEditable={false}><MaybeDT node={props.node} /></div>
                <div class='leading-none flex gap-1 font-bold text-lg'>

                    <div contentEditable={false} class='flex'>
                        <button class="text-gray-500 font-bold flex" onpointerdown={handleDrag} onClick={() => setMenu(true)} >
                            <HandleIcon2 last={props.last} section={true} sprogs={!(children().length === 0 && content().length === 0)} />
                        </button>
                    </div>


                    <TextView node={props.node.get(TEXT)} state={props.state} tag={`p`} />

                </div>
                <Show when={!hidden() && (children().length > 0 || content().length > 0)}>
                    <div class="flex flex-col pl-2">
                        <Show when={content().length > 0}>
                            <div class="flex flex-col">
                                <For each={content()}>
                                    {(item, index) =>
                                        <ErrorBoundary fallback={<button contentEditable={false} class="bg-red-700" onClick={() => props.node.get(CONTENT).delete(index())}>delete</button>}>
                                            <Switch>
                                                <Match when={item.has('list')}>
                                                    <ListView node={item} state={props.state} />
                                                </Match>
                                                <Match when={item.has('embed')}>
                                                    <Embed node={item} state={props.state} />
                                                </Match>
                                                <Match when={item.has('bpm')}>
                                                    <Sequencer node={item} state={props.state} />
                                                </Match>
                                                <Match when={item.has(TEXT)}>
                                                    <ParagraphView node={item} state={props.state} />
                                                </Match>
                                                <Match when={item.has('paint')}>
                                                    <Paint state={props.state} node={item} />
                                                </Match>
                                                <Match when={item.has('header')}>
                                                    <TableView node={item} state={props.state} />
                                                </Match>
                                            </Switch>
                                        </ErrorBoundary>

                                    }
                                </For>
                            </div>
                        </Show>
                        <For each={children()}>
                            {(item, index) => <>

                                <SectionView node={item} state={props.state} depth={props.depth + 1} setPath={props.setPath} last={index() === children().length - 1} />
                            </>
                            }
                        </For>
                    </div>
                </Show>
            </div>
        </>
    )
}


export const ContentContainer: Component<{ node: Y.Map<any>, state: EditorState, commands: Array<{ name: string, run: () => void }> }> = (props) => {
    let r
    const [menu, setMenu] = createSignal(false)

    const handleDrag = (e: PointerEvent) => drag(e, props.node, props.state, 'content')


    onMount(() => {
        props.state.docFromDom.set(r, props.node)
        props.state.domFromDoc.set(props.node, r)
    })

    const [coords, setCoords] = createSignal({ x: 0, y: 0 })

    createEffect(() => {
        if (menu()) {
            let rect = r.getBoundingClientRect()
            setCoords({ x: rect.left, y: rect.top })

        }
    })
    return (
        <>
            <Show when={menu()}>
                <div contentEditable={false} class='fixed top-0 left-0 w-screen h-screen bg-gray-400/25 z-10' onClick={() => setMenu(false)}>
                    <div class='absolute p-1 bg-white border rounded' style={`left:${coords().x}px;top:${coords().y}px`}>
                        <div class='flex-col'>

                            <For each={props.commands}>
                                {(command) => <div><button onClick={command.run} >{command.name}</button></div>}
                            </For>
                        </div>
                    </div>
                </div>
            </Show>
            <div ref={r} class="flex gap-1 content">
                <div contentEditable={false}>
                    <button class="font-bold text-gray-400 touch-none border-l h-full flex" onpointerdown={handleDrag} onClick={() => setMenu(true)}>
                        <HandleIcon2 last={false} section={false} sprogs={false} />
                    </button>
                </div>
                <div class='flex-1'>
                    {props.children}
                </div>
            </div>

        </>
    )
}

