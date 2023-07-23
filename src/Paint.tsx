import * as Y from "yjs"
import { Match, Switch, For, Component, createSignal, Accessor, Setter, untrack, onCleanup, onMount } from "solid-js"
import { NodeBar } from "./Toolbars";
import * as Icons from "./Icons";


function findPointWithDistanceFromPoints(a, b, c, d) {
    // Calculate vectors AB and BC
    const AB = { x: b.x - a.x, y: b.y - a.y };
    const BC = { x: c.x - b.x, y: c.y - b.y };

    // Normalize AB and BC
    const ABNormalized = normalizeVector(AB);
    const BCNormalized = normalizeVector(BC);

    // Calculate the bisector vector
    const bisector = {
        x: ABNormalized.x + BCNormalized.x,
        y: ABNormalized.y + BCNormalized.y,
    };

    // Normalize the bisector
    const bisectorNormalized = normalizeVector(bisector);

    // Calculate the point P on the bisector that is distance d away from B
    const px = b.x + bisectorNormalized.x * d;
    const py = b.y + bisectorNormalized.y * d;

    return { x: px, y: py };
}
function moveMiddlePoint(a, b, c, d) {

    // Calculate the direction vector of the road
    const direction = { x: c.x - a.x, y: c.y - a.y };
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const normalizedDirection = { x: direction.x / length, y: direction.y / length };

    // Calculate the perpendicular vector
    const perpendicular = { x: -normalizedDirection.y, y: normalizedDirection.x };

    // Calculate the displacement
    const displacement = { x: perpendicular.x * d, y: perpendicular.y * d };

    // Move the middle point
    const movedB = { x: b.x + displacement.x, y: b.y + displacement.y };

    // Return the updated points
    return movedB
}

// Helper function to normalize a vector
function normalizeVector(vector) {
    const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    return { x: vector.x / length, y: vector.y / length };
}
const renderPath = (path: { x: number, y: number }[]) => path.length > 1 ? `M ${path.map(({ x, y }) => `${x} ${y}`).join(' L ')}` : `M ${path[0].x} ${path[0].y} L ${path[0].x} ${path[0].y}`

const renderPath2 = (path: { x: number, y: number }[]) => {
    let p = path.concat(path.reverse())
    return p.map((b, index, array) => {
        if (index === 0) return `M ${b.x} ${b.y}`
        if (index === array.length - 1) return 'Z'
        let r = moveMiddlePoint(array[index - 1], b, array[index + 1], 2)
        if (isNaN(r.x) || isNaN(r.y)) return `L ${b.x} ${b.y}`
        return `L ${r.x} ${r.y}`
    }
    ).join(' ')
}



export const Paint: Component<{ node: Y.Map<any>, parent: Y.Array<any>, index: number }> = (props) => {

    let s: SVGSVGElement

    let [allowTouch, setAllowTouch] = createSignal(false)
    let [color, setColor] = createSignal('red')
    let [fill, setFill] = createSignal(false)
    let [strokeWidth, setStrokeWidth] = createSignal(2)
    let [erase, setErase] = createSignal(false)

    let dom2doc = new Map<SVGElement, Y.Map<any>>()




    const handlePointerDown = (e: PointerEvent) => {

        let id = e.pointerId
        if (!allowTouch() && e.pointerType === 'touch') return

        let t = s.getScreenCTM()?.inverse()

        let pt = s.createSVGPoint()
        pt.x = e.clientX
        pt.y = e.clientY
        pt = pt.matrixTransform(t)
        let candidate = [{ x: pt.x, y: pt.y }]
        props.node.get('data').push([candidate])

        const handlePointerMove = (e: PointerEvent) => {
            if (e.pointerId !== id) return
            pt.x = e.clientX
            pt.y = e.clientY
            pt = pt.matrixTransform(t)
            candidate.push({ x: pt.x, y: pt.y })
            Y.transact(props.node.get('data'), () => {
                props.node.get('data').delete(props.node.get('data').toArray().indexOf(candidate))
                props.node.get('data').push([candidate])
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
        if (t instanceof SVGElement && dom2doc.has(t)) {
            let d = dom2doc.get(t)
            props.node.get('data').delete(props.node.get('data').toArray().indexOf(d))

        }

        const handlePointerMove = (e: PointerEvent) => {
            t = document.elementFromPoint(e.clientX, e.clientY)
            if (t instanceof SVGElement && dom2doc.has(t)) {
                let d = dom2doc.get(t)
                props.node.get('data').delete(props.node.get('data').toArray().indexOf(d))
            }
        }

        const handlePointerUp = (e: PointerEvent) => {
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }
        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)
    }

    const svgStroke = (elem) => {
        let el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        el.setAttribute('d', renderPath2(elem))
        el.setAttribute('stroke', 'none')
        el.setAttribute('fill', 'black')
        // el.setAttribute('filter', 'url(#noise2)')
        return el
    }

    const svgLine = (elem) => {
        let el = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        el.setAttribute('d', renderPath(elem))
        el.setAttribute('stroke', 'black')
        el.setAttribute('fill', 'none')
        el.setAttribute('stroke-width', '8')
        el.setAttribute('stroke-linecap', 'round')
        el.setAttribute('stroke-linejoin', 'round')
        return el
    }


    onMount(() => {
        props.node.get('data').forEach((elem) => {
            let el = svgLine(elem)
            s.insertAdjacentElement('beforeend', el)
            dom2doc.set(el, elem)
        })
        props.node.get('data').observe((e) => {
            let arr = Array.from(s.children)
            let counter = 0
            e.changes.delta.forEach((change) => {
                if (change.retain) {
                    counter += change.retain
                } else if (change.delete) {
                    for (let i = 0; i < change.delete; i++) {
                        let el = arr[counter + i]
                        el.remove()
                        dom2doc.delete(el)
                    }
                } else if (change.insert) {
                    for (let i = 0; i < change.insert.length; i++) {
                        if (counter === 0) {
                            let el = svgLine(e.target.get(0))
                            s.insertAdjacentElement('afterbegin', el)
                            dom2doc.set(el, e.target.get(0))
                        } else {
                            let el = svgLine(e.target.get(counter))
                            arr[counter - 1].insertAdjacentElement('afterend', el)
                            dom2doc.set(el, e.target.get(counter))
                        }
                        counter += 1
                    }
                }
            })
        })
    })



    return (
        <div class="flex flex-col gap-2">
            <NodeBar parent={props.parent} index={props.index}>
                <button classList={{'opacity-25': !allowTouch() }} onClick={() => setAllowTouch(a => !a)}><Icons.Finger /></button>
                <button classList={{'opacity-25': erase()}} onClick={() => setErase(e => !e)}><Icons.Pencil /></button>
                <button classList={{'opacity-25': !erase()}} onClick={() => setErase(e => !e)}><Icons.Eraser /></button>
            </NodeBar>
            <svg ref={s} class="cursor-crosshair shadow-inner border" classList={{ 'touch-none': allowTouch() }} height='400px' width='100%' onpointerdown={(e) => erase() ? getObjectUnderCursor(e) : handlePointerDown(e)}>
            </svg>
        </div>
    )
}