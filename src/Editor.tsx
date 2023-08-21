import * as Y from 'yjs';
import { Component, onCleanup, createSignal, For, Setter, Show, Switch, Match, onMount, on, createEffect, Accessor, ErrorBoundary, createRenderEffect } from 'solid-js';
import { TEXT, CONTENT, CHILDREN, HEADER, ITEMS, beforeinputHandler, addSection } from './input';
import { Sel, selectionFromDom, selectionToDom } from './selection';
import { StepSequencer, newPiece } from './StepSequencer';
import { TableView } from './Table';

import { Embed } from './Embed';

import { Paint } from './Paint';

import { yDeleteSelfFromArray } from './utils';


export const [lock, setLock] = createSignal(false)

import { DTNode, MaybeDT } from './DatePicker';
import { Dialog } from './Dialog';
import { AgendaView } from './Agenda';
import { setContext } from 'tone';

const PARAGRAPH_HANDLE = ':'
const HEADING_HANDLE = '#'
const TABLE_HANDLE = ':'


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
                dragElement.classList.add('absolute', 'z-50','font-body')
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
        node: props.node.get('!'),
        offset: 0,
        focus: null
    }

    let yarr = props.node.get(CHILDREN)
    let [arr, setArr] = createSignal([])


    let f = () => { setArr(yarr.toArray()) }
    f()
    yarr.observe(f)
    // onCleanup(() => { props.node.unobserve(f) })





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




    return (
        <>

            <div class="font-body editor overflow-auto flex" contenteditable={!lock()} spellcheck={false} onBeforeInput={(e) => {
                selectionFromDom(selection, state.docFromDom)
                beforeinputHandler(e, selection)
                selectionToDom(selection, state.domFromDoc)
            }} onKeyDown={(e) => {
                selectionFromDom(selection, state.docFromDom)
                keydownHandler(e, selection)
                selectionToDom(selection, state.domFromDoc)
            }} onPointerDown={() => { selectionFromDom(selection, state.docFromDom) }}>
                <div class="flex flex-col border">
                    <div class="section flex flex-col" >
                        <div class="font-bold text-xl p-1 pb-2">
                            <TextView node={props.node} state={state} tag={`span`} />
                            <div contentEditable={false} class="inline-block ml-4" >
                                <MaybeDT node={props.node} />
                            </div>
                        </div>
                        <div class="flex flex-col" >
                            <div class="pl-1">
                                <Show when={props.node.has(CONTENT)}>

                                    <ContentView node={props.node.get(CONTENT)} state={state} />
                                </Show>
                            </div>

                            <For each={arr()}>
                                {(item, index) => <>

                                    <SectionView node={item} state={state} depth={1} setPath={props.setPath} />
                                </>
                                }
                            </For>
                        </div>

                    </div>

                </div>
            </div >
            <Show when={palette()}>
                <div class="fixed top-0 left-0 w-screen h-screen bg-gray-400/25" onClick={() => setPalette(false)} >
                    <div class='absolute bg-white p-1 flex border rounded' style={`top:${paletteCoords().y}px;left:${paletteCoords().x}px`}>
                        <button onClick={() => {
                            const index = selection.node.parent.parent.toArray().indexOf(selection.node.parent)
                            Y.transact(props.node.doc!, () => {
                                selection.node.parent.parent.delete(index)
                                selection.node.parent.parent.insert(index, [newPaint()])
                            })
                        }}>Paint</button>
                        <button onClick={() => {
                            const index = selection.node.parent.parent.toArray().indexOf(selection.node.parent)
                            Y.transact(props.node.doc!, () => {
                                selection.node.parent.parent.delete(index)
                                selection.node.parent.parent.insert(index, [newPiece()])
                            })
                        }}>Song</button>
                        <button onClick={() => {
                            const index = selection.node.parent.parent.toArray().indexOf(selection.node.parent)
                            Y.transact(props.node.doc!, () => {
                                selection.node.parent.parent.delete(index)
                                selection.node.parent.parent.insert(index, [newEmbed()])
                            })
                        }}>Embed</button>
                    </div>
                </div>
            </Show>
        </>
    )
}

export const SectionView: Component<{ node: Y.Map<any>, state: EditorState, depth: number, setPath: Setter<Array<Y.Map<any>>> }> = (props) => {

    let s: HTMLElement

    const [menu, setMenu] = createSignal(false)
    const [coords, setCoords] = createSignal({ x: 0, y: 0 })

    onMount(() => {
        props.state.docFromDom.set(s, props.node)
        props.state.domFromDoc.set(props.node, s)
    })

    let [hidden, setHidden] = createSignal(false)

    const [done, setDone] = createSignal(false)
    let yarr = props.node.get(CHILDREN)
    let [arr, setArr] = createSignal(yarr.toArray())

    let f = () => { setArr(yarr.toArray()) }
    yarr.observe(f)
    // onCleanup(() => { props.node.unobserve(f) })

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
                <div contentEditable={false} class='fixed top-0 left-0 w-screen h-screen bg-gray-400/25' onClick={() => setMenu(false)}>
                    <div class='absolute bg-white p-1 rounded border flex flex-col' style={`left:${coords().x}px;top:${coords().y}px`}>
                        <button onClick={() => yDeleteSelfFromArray(props.node)} >delete</button>
                        <button onClick={() => props.node.set('done', !props.node.get('done') ?? true)} >mark done</button>
                        <button onClick={() => props.node.parent.insert(props.node.parent.toArray().indexOf(props.node), [newSection()])} >+ sibling</button>
                        <button onClick={() => props.node.get('&').unshift([newSection()])} >+ child</button>
                        <button onClick={() => props.setPath(p => [...p, props.node])}>Open</button>
                    </div>
                </div>
            </Show>
            <div ref={s} class="section flex" >
                <div contentEditable={false} class='flex flex-col'>
                    <button class="mt-1 text-gray-500 font-bold" onpointerdown={handleDrag} onClick={() => setMenu(true)} >*</button>
                    <button class="m-1 mt-0 bg-gray-400/25 flex-1 rounded"></button>
                </div>
                <div>
                    <div class="font-bold text-lg flex">

                        <TextView classList={{ 'text-gray-500': done() }} node={props.node} state={props.state} tag={`span`} />
                        <div contentEditable={false} class="inline-block ml-4" >
                            <MaybeDT node={props.node} />
                        </div>
                    </div>
                    <Show when={!hidden()}>
                        <div class="flex flex-col">
                            <div class="pl-2">
                                <Show when={props.node.has(CONTENT)}>

                                    <ContentView node={props.node.get(CONTENT)} state={props.state} />
                                </Show>
                            </div>
                            <For each={arr()}>
                                {(item, index) => <>

                                    <SectionView node={item} state={props.state} depth={props.depth + 1} setPath={props.setPath} />
                                </>
                                }
                            </For>
                        </div>
                    </Show>
                </div>
            </div>
        </>
    )
}

export const ContentView: Component<{ node: Y.Array<any>, state: EditorState }> = (props) => {
    let [arr, setArr] = createSignal([])
    let f = () => setArr(props.node.toArray())
    f()
    props.node.observe(f)
    // onCleanup(() => props.node.unobserve(f))

    return (
        <div class="flex flex-col gap-1">
            <For each={arr()}>
                {(item, index) =>
                    <ErrorBoundary fallback={<button class="bg-red-700" onClick={() => props.node.delete(index())}>delete</button>}>
                        <Switch>
                            <Match when={item.has('list')}>
                                <ListView node={item} state={props.state} />
                            </Match>
                            <Match when={item.has('embed')}>
                                <Embed node={item} state={props.state} />
                            </Match>
                            <Match when={item.has('bpm')}>
                                <StepSequencer node={item} state={props.state} />
                            </Match>
                            <Match when={item.has(TEXT)}>
                                <ParagraphView node={item} state={props.state} />
                            </Match>
                            <Match when={item.has('paint')}>
                                <Paint state={props.state} node={item} />
                            </Match>
                        </Switch>
                    </ErrorBoundary>

                }
            </For>
        </div>
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
                        <For each={props.commands}>
                            {(command) => <button onClick={command.run} >{command.name}</button>}
                        </For>
                    </div>
                </div>
            </Show>
            <div ref={r} class="flex gap-1 content">
                <div contentEditable={false}>
                    <button class="font-bold text-gray-400 touch-none" onpointerdown={handleDrag} onClick={() => setMenu(true)}>~</button>
                </div>
                <div class='flex-1'>
                    {props.children}
                </div>
            </div>

        </>
    )
}

export const ParagraphView = (props) => {

    const commands = [
        { name: 'delete', run: () => yDeleteSelfFromArray(props.node) }
    ]

    return (
        <ContentContainer commands={commands} state={props.state} node={props.node}>
            <TextView node={props.node} state={props.state} tag='p' />
        </ContentContainer>
    )
}

export function highlight(str: string) {

    if (str === '') {
        return '<br>'
    }
    let r = str

    // Bold and italic
    const boldRegex = /(?<!\S)(\*\S.*?\S\*)(?!\S)/g;
    r = r.replace(boldRegex, '<span class="font-bold">$1</span>');

    const italicRegex = /(?<!\S)(_\S.*?\S_)(?!\S)/g;
    r = r.replace(italicRegex, '<span class="font-italic">$1</span>');

    // Links
    const linkRegex = /\[[^\]]+\]\[^\s]+/g;
    r = r.replace(linkRegex, '<span data-link="" class="text-blue-800">$1</span>');

    // Headings
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    r = r.replace(headingRegex, (match, level, content) => {
        const headingLevel = level.length;
        return `<span class="text-red-800">${level} ${content}</span>`;
    });

    return r;



}

export const TextView: Component<{ node: Y.Map<any>, state: EditorState, tag: string }> = (props) => {

    let s
    let el = document.createElement(props.tag)

    let { docFromDom, domFromDoc } = props.state

    let node = props.node.get(TEXT)
    s = node.toString()
    docFromDom.set(el, node)
    domFromDoc.set(node, el)
    el.innerHTML = highlight(s)
    let update = () => { el.innerHTML = highlight(node.toString()) }
    node.observe(update)

    // onCleanup(() => {
    //     node.unobserve(update)
    // })
    return el
}
