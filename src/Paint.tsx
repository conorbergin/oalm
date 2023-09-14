import * as Y from "yjs"
import { Match, Switch, For, Component, createSignal, Accessor, Setter, untrack, onCleanup, onMount, Show } from "solid-js"
import * as Icons from "./Icons";

import { drag, EditorState, ContentContainer } from './Editor'
import { yDeleteFromArray, yArraySignal, ySignal } from "./utils";



import { getStroke } from 'perfect-freehand'
import { Dialog, Modal, ModalFull } from "./Dialog";
import { UndoRedo } from "./App";



const average = (a, b) => (a + b) / 2

const getSvgPathFromStroke = (points: Array<[number, number]>) => {
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

export const Paint: Component<{ node: Y.Map<any>, state: EditorState, undoManager: Y.UndoManager }> = (props) => {


  let s

  //fixer
  if (!props.node.has('zoom')) props.node.set('zoom', 1)
  if (!props.node.has('aspect')) props.node.set('aspect', 1)

  const undoManager = new Y.UndoManager(props.node)

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
    e.stopPropagation()
    let id = e.pointerId
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

  const commands = [{ name: 'delete', run: () => yDeleteFromArray(props.node) }]

  const [show, setShow] = createSignal(false)
  return (
    <>
      <ContentContainer node={props.node} state={props.state} commands={commands}>
        <div class='flex' contentEditable={false} onClick={e => {e.stopPropagation();setShow(true)}}>
          <svg viewBox={viewBox()} ref={s} class="border w-full bg-white ">
            <For each={data()}>
              {(item, index) => <path id={index().toString()} d={getSvgPathFromStroke(getStroke(item.points, { size: item.size, simulatePressure: item.points[0][2] === 0.5 }))} fill={item.color} />}
            </For>
          </svg>
        </div>
        <ModalFull show={show()} setShow={setShow}>
          <div class='flex flex-col  gap-2 m-auto h-screen w-screen justify-between' onClick={e => e.stopPropagation()} >
            <div class='flex justify-between p-1'>
              <UndoRedo undoManager={undoManager} />
              <input type="number" min="5" max="100" value={strokeWidth()} onInput={(e) => setStrokeWidth(parseInt(e.target.value))} />
              <input type="color" value={color()} onInput={(e) => setColor(e.target.value)} onPointerDown={(e) => e.stopPropagation()} />
              <button classList={{ 'opacity-25': erase() }} onClick={() => setErase(e => !e)}><Icons.Pencil /></button>
              <button classList={{ 'opacity-25': !erase() }} onClick={() => setErase(e => !e)}><Icons.Eraser /></button>
              <button onClick={() => setShow(false)}><Icons.Exit /></button>
            </div>

            <svg viewBox={viewBox()} ref={s} class='h-full touch-none' classList={{ 'border-black': !locked() }} onpointerdown={(e) => erase() ? getObjectUnderCursor(e) : handlePointerDown(e)}>
              <For each={data()}>
                {(item, index) => <path id={index().toString()} d={getSvgPathFromStroke(getStroke(item.points, { size: item.size, simulatePressure: item.points[0][2] === 0.5 }))} fill={item.color} />}
              </For>
              <rect x={viewBox().split(' ')[0]} y={viewBox().split(' ')[1]} width={viewBox().split(' ')[2]} height={viewBox().split(' ')[3]} stroke='green' stroke-width={4*zoom()} fill='none'/>
            </svg>
            <div class='flex justify-center gap-3'>
              Zoom:
              <input class='w-12' type="number" step='0.1' min="0.1" max="10" value={zoom()} onInput={(e) => props.node.set('zoom', e.target.valueAsNumber)} />
              Aspect:
              <input class='w-12' type="number" step='0.01' min="0.65" max="1.5" value={aspect()} onInput={(e) => props.node.set('aspect', e.target.valueAsNumber)} />
            </div>
          </div>
        </ModalFull>
      </ContentContainer>
    </>
  )
}
