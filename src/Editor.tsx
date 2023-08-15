import * as Y from 'yjs';
import { Component, onCleanup, createSignal, For, Setter, Show, Switch, Match, onMount, on, createEffect, Accessor, ErrorBoundary, createRenderEffect } from 'solid-js';
import { TEXT, CONTENT, CHILDREN, HEADER, ITEMS, beforeinputHandler, addSection } from './input';
import { Sel, selectionFromDom, selectionToDom } from './selection';
import { StepSequencer, newPiece } from './StepSequencer';
import { TableView } from './Table';

import { Embed } from './Embed';

import { Paint } from './Paint';


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

// export const menu = (node: Y.Map<any>, x: number, y: number) => {

//     const m = document.createElement('div')

//     m.classList.add('absolute', 'z-50', 'bg-white', 'border', 'border-gray-300', 'rounded', 'shadow-lg', 'p-2', 'menu')
//     m.style.left = x + 'px'
//     m.style.top = y + 'px'


//     const contentMenu = (
//         <div>
//             <button>delete</button>
//             <button></button>
//             <button></button>
//             <button></button>

//         </div>
//     )

//     const nodeMenu = (
//         <div>
//             <button>delete</button>
//             <button></button>
//             <button></button>
//         </div>
//     )

//     m.appendChild(items)
//     const handleClick = (e) => {
//         if (!e.target.closest('.menu')) {

//             m.remove()
//             document.removeEventListener('click', handleClick)
//         }
//     }
//     document.appendChild(m)
//     solid.createRoot(m).render(() => contentMenu)
//     document.addEventListener('click', handleClick)


// }

export const drag = (event: PointerEvent, node: any, editor: EditorState, klass: string) => {
    const zoneHeight = 20
    event.target.releasePointerCapture(event.pointerId)
    event.preventDefault()

    let targetElement = (event.target as Element).closest(`.${klass}`) as HTMLElement

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
            if (Math.abs(e.clientY - event.clientY) < 10) {
                return
            } else {
                moved = true
                targetElement.style.display = 'none'
                targetElement.insertAdjacentElement('afterend', dragShadow)
                dragElement.classList.add('absolute', 'z-50')
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
                newIndex = index + (tnode.parent === newParent ? 1 : 0)
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

        if (newParent !== node.parent || newIndex !== oldIndex) {
            console.log('move')
            Y.transact(node.doc!, () => {
                let n = node.clone();
                (node.parent as Y.Array<any>).delete(oldIndex);
                (newParent as Y.Array<any>).insert(newIndex, [n]);
            })
            return
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





    const [palette, setPalette] = createSignal(null)

    const keydownHandler = (e: KeyboardEvent, s: Sel) => {
        switch (true) {

            case e.key === ' ' && s.offset === 0 && s.node.length === 0:
                e.preventDefault()
                let r = state.domFromDoc.get(s.node).getBoundingClientRect()
                setPalette({ x: r.left, y: r.top })
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
            // case e.key === '3' && e.ctrlKey:
            //     insertSS(s)
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

            <div class=" font-body editor h-full overflow-y-auto border-t border-black flex justify-center pb-40 border-b-8" contenteditable={!lock()} spellcheck={false} onBeforeInput={(e) => {
                selectionFromDom(selection, state.docFromDom)
                beforeinputHandler(e, selection)
                selectionToDom(selection, state.domFromDoc)
            }} onKeyDown={(e) => {
                selectionFromDom(selection, state.docFromDom)
                keydownHandler(e, selection)
                selectionToDom(selection, state.domFromDoc)
            }} onPointerDown={() => { selectionFromDom(selection, state.docFromDom) }}>
                <div class="max-w-2xl w-full flex flex-col">
                    <div class="section flex flex-col pl-2" >
                        <div class="font-bold">
                            <TextView node={props.node} state={state} tag={`span`} />
                            <div contentEditable={false} class="inline-block ml-4" >
                                <MaybeDT node={props.node} />
                            </div>
                        </div>
                        <div class="flex flex-col" >
                            <div class="pl-2">
                                <Show when={props.node.has(CONTENT)}>

                                    <ContentView node={props.node.get(CONTENT)} state={state} />
                                </Show>
                            </div>

                            <AddSection node={yarr} index={0} />
                            <For each={arr()}>
                                {(item, index) => <>

                                    <SectionView node={item} state={state} depth={1} setPath={props.setPath} />
                                    <AddSection node={yarr} index={index() + 1} />
                                </>
                                }
                            </For>
                        </div>
                        <div contenteditable={false} class="h-40" />

                    </div>

                    <Show when={palette()}>
                        <Dialog pos={palette()!} setShow={setPalette} >
                            <div>
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
                        </Dialog>
                    </Show>
                </div>
            </div >
        </>
    )
}

export const SectionView: Component<{ node: Y.Map<any>, state: EditorState, depth: number, setPath: Setter<Array<Y.Map<any>>> }> = (props) => {

    let s: HTMLElement


    const [showDialog, setShowDialog] = createSignal<{ x: number, y: number } | null>(null)

    onMount(() => {
        props.state.docFromDom.set(s, props.node)
        props.state.domFromDoc.set(props.node, s)
    })




    let [hidden, setHidden] = createSignal(false)

    let yarr = props.node.get(CHILDREN)
    let [arr, setArr] = createSignal(yarr.toArray())

    let f = () => { setArr(yarr.toArray()) }
    yarr.observe(f)
    // onCleanup(() => { props.node.unobserve(f) })


    return (
        <div ref={s} class="section flex flex-col pl-2" >
            <div class="font-bold" classList={{ 'text-xl': props.depth === 0 }}>

                <button class="text-gray-500" contentEditable={false} onpointerdown={(e) => drag(e, props.node, props.state, 'section')} onClick={(e) => setShowDialog({ x: e.clientX, y: e.clientY })} >#</button>
                <TextView node={props.node} state={props.state} tag={`span`} />
                <div contentEditable={false} class="inline-block ml-4" >
                    <MaybeDT node={props.node} />
                </div>
            </div>
            <Show when={!hidden()}>
                <div class="flex flex-col" classList={{ 'ml-2': props.depth > 0 }}>
                    <div class="pl-2">
                        <Show when={props.node.has(CONTENT)}>

                            <ContentView node={props.node.get(CONTENT)} state={props.state} />
                        </Show>
                    </div>
                    <AddSection node={yarr} index={0} />
                    <For each={arr()}>
                        {(item, index) => <>

                            <SectionView node={item} state={props.state} depth={props.depth + 1} setPath={props.setPath} />
                            <AddSection node={yarr} index={index() + 1} />
                        </>
                        }
                    </For>

                </div>
            </Show>
            <Show when={showDialog()}>
                <Dialog pos={showDialog()} setShow={setShowDialog} >
                    <div class="flex flex-col gap-1">
                        <button onClick={() => props.node.parent.delete(props.node.parent.toArray().indexOf(props.node))}>delete</button>
                        <button onClick={() => props.setPath(p => [...p, props.node])}>Open</button>
                        <button onClick={() => { props.node.set('done', true); setShowDialog(null) }}>done</button>
                    </div>
                </Dialog>
            </Show>
        </div>
    )
}

const AddSection: Component<{ node: Y.Array<any>, index: number }> = (props) => (
    <div style='line-height:0;' class='text-gray-400 text-sm pt-2' contenteditable={false} >
        <button onClick={() => props.node.insert(props.index, [newSection()])}>+</button>
    </div>
)



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
                                <StepSequencer node={item} state={props.state} collapsed={false} />
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


export const ListView: Component<{ node: Y.Map<any>, state: EditorState }> = (props) => {
    const [showDialog, setShowDialog] = createSignal(null)
    const [array, setArray] = createSignal([])
    const f = () => setArray(props.node.get('list').toArray())
    f()
    props.node.observe(f)
    // onCleanup(() => props.node.unobserve(f))

    let s
    onMount(() => {
        props.state.docFromDom.set(s, props.node)
        props.state.domFromDoc.set(props.node, s)
    })
    return (
        <div ref={s} class="flex gap-1">
            <div>
                <button onPointerDown={(e) => drag(e, props.node, props.state, 'content')} onClick={() => setShowDialog({ x: e.clientX, y: e.clientY })}>~</button>
            </div>
            <div class="flex flex-col gap-1">
                <For each={array()}>
                    {(item, index) =>
                        <ParagraphView node={item} state={props.state} index={index()} />
                    }
                </For>
            </div>
            <Show when={showDialog()}>
                <Dialog pos={showDialog()} setShow={setShowDialog} >
                    <div class="flex flex-col gap-1">
                        <button onClick={() => props.node.parent.delete(props.node.parent.toArray().indexOf(props.node))}>delete</button>
                        <button onClick={() => { props.node.set('done', true); setShowDialog(null) }}>done</button>
                    </div>
                </Dialog>
            </Show>
        </div>
    )
}

export const ParagraphView: Component<{ node: Y.Map<any>, state: EditorState, index: null | number }> = (props) => {
    let s

    let [showContent, setShowContent] = createSignal(true)
    let [showDialog, setShowDialog] = createSignal(null)
    let [hasContent, setHasContent] = createSignal(props.node.has(CONTENT) && props.node.get(CONTENT).length > 0)
    console.log(hasContent())

    let f = () => setHasContent(props.node.has(CONTENT) && props.node.get(CONTENT).length > 0)
    props.node.observe(f)


    let [done, setDone] = createSignal(props.node.has('done'))

    let g = () => setDone(props.node.has('done'))

    props.node.observe(g)


    // onCleanup(() => {
    //     props.node.unobserve(g)
    //     props.node.unobserve(f)
    // })

    onMount(() => {
        props.state.docFromDom.set(s, props.node)
        props.state.domFromDoc.set(props.node, s)
    })

    return (
        <div ref={s} class="flex flex-col gap-1 draggable content" classList={{ 'text-green-700 line-through': done() }} onKeyDown={(e) => {
            // e.stopPropagation()
            console.log(e.key)
        }}>

            <div classList={{ 'font-bold': hasContent() }} class="flex gap-1">
                <button class=" bg-gray-200 touch-none" contentEditable={false} onpointerdown={(e: PointerEvent) => { drag(e, props.node, props.state, 'content') }} onClick={(e) => setShowDialog({ x: e.clientX, y: e.clientY })}>{props.index ?? '~'}</button>
                <TextView node={props.node} state={props.state} tag="p" />
                <Show when={hasContent() && !showContent()}>
                    <button contentEditable={false} class="bg-gray-200" onClick={() => setShowContent(true)}>...</button>
                </Show>
            </div>

            <Show when={hasContent() && showContent()}>
                <div class="flex">
                    <button onClick={() => setShowContent(false)}>.</button>
                    <div class="pl-3">
                        <ContentView node={props.node.get(CONTENT)} state={props.state} />
                    </div>
                </div>
            </Show>
            <Show when={showDialog()}>
                <Dialog pos={showDialog()} setShow={setShowDialog} >
                    <div class="flex flex-col gap-1">
                        <button onClick={() => props.node.parent.delete(props.node.parent.toArray().indexOf(props.node))}>delete</button>
                        <button onClick={() => { props.node.set('done', true); setShowDialog(null) }}>done</button>
                    </div>
                </Dialog>
            </Show>

        </div>
    )
}

export function highlight(str: string) {

    // Bold and italic
    const boldRegex = /(?<!\S)(\*\S.*?\S\*)(?!\S)/g;
    const boldHighlighted = str.replace(boldRegex, '<span class="font-bold">$1</span>');

    const italicRegex = /(?<!\S)(_\S.*?\S_)(?!\S)/g;
    const italicHighlighted = boldHighlighted.replace(italicRegex, '<span class="font-italic">$1</span>');

    // Links
    const linkRegex = /\[[^\]]+\]\[^\s]+/g;
    const linkedHighlighted = italicHighlighted.replace(linkRegex, '<span class="text-blue-800">$1</span>');

    // Headings
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    const headingHighlighted = linkedHighlighted.replace(headingRegex, (match, level, content) => {
        const headingLevel = level.length;
        return `<span class="text-red-800">${level} ${content}</span>`;
    });

    return headingHighlighted;



}

export const TextView: Component<{ node: Y.Text | Y.XmlText, state: EditorState, tag: string }> = (props) => {

    let s
    let el = document.createElement(props.tag)

    let { docFromDom, domFromDoc } = props.state

    let node = props.node.get(TEXT)
    s = node.toString()
    docFromDom.set(el, node)
    domFromDoc.set(node, el)
    el.innerHTML = highlight(s) || '<br>'
    let update = () => { el.innerHTML = highlight(node.toString()) || '<br>' }
    node.observe(update)







    // onCleanup(() => {
    //     node.unobserve(update)
    // })
    return el
}
