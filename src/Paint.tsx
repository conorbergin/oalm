import * as Y from "yjs"
import { Match, Switch, For, Component, createSignal, Accessor, Setter, untrack, onCleanup, onMount, Show } from "solid-js"
import * as Icons from "./Icons";

import { drag, EditorState } from './Editor'



import { getStroke } from 'perfect-freehand'
import { Dialog } from "./Dialog";
const average = (a, b) => (a + b) / 2

function getSvgPathFromStroke(points: Array<[number, number]>) {
    const len = points.length

    if (!len) {
        return ''
    }

    const first = points[0]
    let result = `M${first[0].toFixed(3)},${first[1].toFixed(3)}Q`

    for (let i = 0, max = len - 1; i < max; i++) {
        const a = points[i]
        const b = points[i + 1]
        result += `${a[0].toFixed(3)},${a[1].toFixed(3)} ${average(
            a[0],
            b[0]
        ).toFixed(3)},${average(a[1], b[1]).toFixed(3)} `
    }

    result += 'Z'

    return result
}

const useObservedArray = () => {}

export const Paint: Component<{ node: Y.Map<any>, state: EditorState, collapsed: boolean }> = (props) => {


    let s

    const [allowTouch, setAllowTouch] = createSignal(false)
    const [color, setColor] = createSignal('black')
    const [fill, setFill] = createSignal(false)
    const [strokeWidth, setStrokeWidth] = createSignal(10)
    const [erase, setErase] = createSignal(false)
    const [locked, setLocked] = createSignal(true)

    const [showDialog, setShowDialog] = createSignal(null)


    let [data, setData] = createSignal([])

    const f = () => setData(props.node.get('paint').toArray())

    f()
    props.node.observeDeep(f)
    // onCleanup(() =>  props.node.get('paint').unobserve(f))



    const handlePointerDown = (e: PointerEvent) => {

        let id = e.pointerId
        if (!allowTouch() && e.pointerType === 'touch') return
        let pressure = e.pressure ? true : false

        let t = s.getScreenCTM()?.inverse()

        let pt = s.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        pt = pt.matrixTransform(t)
        let candidate = { points: [[pt.x, pt.y, e.pressure]], color: color(), size: strokeWidth() }
        props.node.get('paint').push([candidate])

        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerId !== id) return
            pt.x = e.clientX
            pt.y = e.clientY
            pt = pt.matrixTransform(t)
            candidate.points.push([pt.x, pt.y, e.pressure])
            Y.transact(props.node.get('paint'), () => {
                props.node.get('paint').delete(props.node.get('paint').toArray().indexOf(candidate))
                props.node.get('paint').push([candidate])
            }
            )
        }

        const handlePointerUp = (e: PointerEvent) => {
            if (e.pointerId !== id) return
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }

        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)
    }

    function getObjectUnderCursor(event: PointerEvent) {
        let result = []
        let t = document.elementFromPoint(event.clientX, event.clientY)
        if (t) {
            let n = parseInt(t.id)
            if (!isNaN(n) && props.node.get('paint').get(n)) {
                props.node.get('paint').delete(n)
            }

        }

        const handlePointerMove = (e: PointerEvent) => {
            t = document.elementFromPoint(e.clientX, e.clientY)
            if (t) {
                let n = parseInt(t.id)
                if (!isNaN(n) && props.node.get('paint').get(n)) {
                    props.node.get('paint').delete(n)
                }
            }
        }

        const handlePointerUp = (e: PointerEvent) => {
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }
        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)
    }

    // onMount(() => {
    //     props.node.forEach((elem) => {
    //         let el = svgLine(elem)
    //         s.insertAdjacentElement('beforeend', el)
    //         dom2doc.set(el, elem)
    //     })
    //     props.node.observe((e) => {
    //         let arr = Array.from(s.children)
    //         let counter = 0
    //         e.changes.delta.forEach((change) => {
    //             if (change.retain) {
    //                 counter += change.retain
    //             } else if (change.delete) {
    //                 for (let i = 0; i < change.delete; i++) {
    //                     let el = arr[counter + i]
    //                     dom2doc.delete(el)
    //                     el.remove()
    //                 }
    //             } else if (change.insert) {
    //                 for (let i = 0; i < change.insert.length; i++) {
    //                     if (counter === 0) {
    //                         let el = svgLine(e.target.get(0))
    //                         s.insertAdjacentElement('afterbegin', el)
    //                         dom2doc.set(el, e.target.get(0))
    //                     } else {
    //                         let el = svgLine(e.target.get(counter))
    //                         arr[counter - 1].insertAdjacentElement('afterend', el)
    //                         dom2doc.set(el, e.target.get(counter))
    //                     }
    //                     counter += 1
    //                 }
    //             }
    //         })
    //     })
    // })

    const handleCanvasResize = (e: PointerEvent) => {
        let initialY = e.clientY
        let initialHeight = s.getBoundingClientRect().height
        const handlePointerMove = (e: PointerEvent) => {
            let dy = e.clientY - initialY
            if (initialHeight + dy < 100) return
            if (initialHeight + dy > 1000) return
            s.style.height = `${initialHeight + dy}px`
        }
        const handlePointerUp = (e: PointerEvent) => {
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }
        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)
    }

    let d

    onMount(() => {
        props.state.docFromDom.set(d, props.node)
        props.state.domFromDoc.set(props.node, d)
    })

    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            e.stopPropagation()
            let p = new Y.Map()
            p.set('!', new Y.Text(''))
            props.node.parent.insert(props.node.parent.toArray().indexOf(props.node) + 1, [p])
        }
    }


    return (
        <>
            <div ref={d} onKeyDown={handleKeyDown} tabIndex={0} onFocus={() => setLocked(false)} onBlur={() => setLocked(true)} contentEditable={false} class="content flex" onClick={() => setLocked(false)}>

                <div class="relative w-full">
                    <div class="absolute top-0 left-0">
                        <button onPointerDown={(e) => drag(e, props.node, props.state, 'content')} onClick={(e) => setShowDialog({ x: e.clientX, y: e.clientY })}>:</button>
                    </div>
                    <Show when={!locked()}>
                        <div class="absolute top-0 right-0 flex gap-1">
                            <input type="range" min="4" max="32" value={strokeWidth()} onInput={(e) => setStrokeWidth(parseInt(e.target.value))} />
                            <input type="color" value={color()} onInput={(e) => setColor(e.target.value)} onPointerDown={(e) => e.stopPropagation()}/>
                            <div classList={{ 'opacity-25': !allowTouch() }} onClick={() => setAllowTouch(a => !a)}><Icons.Finger /></div>
                            <div classList={{ 'opacity-25': erase() }} onClick={() => setErase(e => !e)}><Icons.Pencil /></div>
                            <div classList={{ 'opacity-25': !erase() }} onClick={() => setErase(e => !e)}><Icons.Eraser /></div>
                        </div>

                        <div class="absolute bottom-0 right-0">
                            <button onPointerDown={handleCanvasResize}>/</button>
                        </div>
                    </Show>
                    <svg ref={s} class="cursor-crosshair border border-dashed bg-white" classList={{ 'touch-none': allowTouch(), 'border-black': !locked() }} height='400px' width='100%' onpointerdown={(e) => !locked() && (erase() ? getObjectUnderCursor(e) : handlePointerDown(e))}>
                        <For each={data()}>
                            {(item, index) => <path id={index().toString()} d={getSvgPathFromStroke(getStroke(item.points, { size: item.size, simulatePressure: item.points[0][2] === 0.5 }))} fill={item.color} />}
                        </For>
                    </svg>
                </div>
            </div>
            <Show when={showDialog()}>
                <Dialog pos={showDialog()} setShow={setShowDialog}>
                    <div class="flex flex-col gap-1">
                        <button onClick={() => props.node.parent.delete(props.node.parent.toArray().indexOf(props.node))}>Delete</button>
                    </div>
                </Dialog>
            </Show>
        </>
    )
}