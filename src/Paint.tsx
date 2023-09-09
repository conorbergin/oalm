import * as Y from "yjs"
import { Match, Switch, For, Component, createSignal, Accessor, Setter, untrack, onCleanup, onMount, Show } from "solid-js"
import * as Icons from "./Icons";

import { drag, EditorState, ContentContainer } from './Editor'
import { yDeleteFromArray, yArraySignal, ySignal } from "./utils";



import { getStroke } from 'perfect-freehand'
import { Dialog, Modal, ModalFull } from "./Dialog";
import { NonTextView } from "./Text";
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

const useObservedArray = () => { }

export const Paint: Component<{ node: Y.Map<any>, state: EditorState, collapsed: boolean }> = (props) => {


  let s

  //fixer
  if (!props.node.has('zoom')) props.node.set('zoom', 1)
  if (!props.node.has('aspect')) props.node.set('aspect', 1)

  const [allowTouch, setAllowTouch] = createSignal(false)
  const [color, setColor] = createSignal('black')
  const [fill, setFill] = createSignal(false)
  const [strokeWidth, setStrokeWidth] = createSignal(10)
  const [erase, setErase] = createSignal(false)
  const [locked, setLocked] = createSignal(true)

  const [showDialog, setShowDialog] = createSignal(null)


  const data = yArraySignal(props.node.get('paint'))
  const zoom = ySignal(props.node, 'zoom')
  const aspect = ySignal(props.node, 'aspect')
  const viewBox = () => `-${500 * zoom() * aspect()} -${500 * zoom() / aspect()} ${1000 * zoom() * aspect()} ${1000 * zoom() / aspect()}`




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

  const commands = [{ name: 'delete', run: () => yDeleteFromArray(props.node) }]

  const [show, setShow] = createSignal(false)
  return (
    <>
      <ContentContainer node={props.node} state={props.state} commands={commands}>
        <div class='flex' contentEditable={false} onClick={() => setShow(true)}>
          <svg viewBox={viewBox()} ref={s} class="border  bg-white ">
            <For each={data()}>
              {(item, index) => <path id={index().toString()} d={getSvgPathFromStroke(getStroke(item.points, { size: item.size, simulatePressure: item.points[0][2] === 0.5 }))} fill={item.color} />}
            </For>
          </svg>
        </div>
        <ModalFull show={show()} setShow={setShow}>
          <div class='flex flex-col p-2 m-auto max-h-full' onClick={e => e.stopPropagation()} >
            <div class='flex flex-wrap'>
              <input type="range" min="5" max="100" value={strokeWidth()} onInput={(e) => setStrokeWidth(parseInt(e.target.value))} />
              <input type="color" value={color()} onInput={(e) => setColor(e.target.value)} onPointerDown={(e) => e.stopPropagation()} />
              <button classList={{ 'opacity-25': !allowTouch() }} onClick={() => setAllowTouch(a => !a)}>touch</button>
              <button classList={{ 'opacity-25': erase() }} onClick={() => setErase(e => !e)}><Icons.Pencil /></button>
              <button classList={{ 'opacity-25': !erase() }} onClick={() => setErase(e => !e)}><Icons.Eraser /></button>
              <button onClick={() => setShow(false)}><Icons.Exit /></button>
            </div>

              <svg viewBox={viewBox()} ref={s} class='border self-center' preserveAspectRatio='xMaxYMax meet' classList={{'touch-none': allowTouch(), 'border-black': !locked() }} onpointerdown={(e) => erase() ? getObjectUnderCursor(e) : handlePointerDown(e)}>
                <For each={data()}>
                  {(item, index) => <path id={index().toString()} d={getSvgPathFromStroke(getStroke(item.points, { size: item.size, simulatePressure: item.points[0][2] === 0.5 }))} fill={item.color} />}
                </For>
              </svg>
            <div>
              <input type="range" step='0.1' min="0.1" max="10" value={zoom()} onInput={(e) => props.node.set('zoom', e.target.valueAsNumber)} />
              <input type="range" step='0.01' min="0.65" max="1.5" value={aspect()} onInput={(e) => props.node.set('aspect', e.target.valueAsNumber)} />


            </div>
          </div>
        </ModalFull>
      </ContentContainer>
    </>
  )
}



{/* <Show when={false}>
<div class="absolute top-0 right-0 flex gap-1">

</div>

{/* <div class="absolute bottom-0 right-0">
    <button onPointerDown={handleCanvasResize}>/</button>
</div> */}