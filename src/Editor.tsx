import * as Y from 'yjs';
import { Component, onCleanup, createSignal, For, Setter, Show, Switch, Match, onMount, on, createEffect, Accessor, ErrorBoundary, createRenderEffect } from 'solid-js';
import { TEXT, CONTENT, CHILDREN, HEADER, ITEMS, beforeinputHandler, addSection } from './input';
import { Sel, selectionFromDom, selectionToDom } from './selection';
import { Sequencer, newPiece } from './Sequencer';
import { TableView, newTable } from './Table';
import { Embed } from './Embed';
import { ParagraphView, TextView } from './Text';

import { Paint } from './Paint';

import { yDeleteFromArray, yArraySignal, yReplaceInArray, ySignal } from './utils';


export const [lock, setLock] = createSignal(false)

import { TASKEVENT, MaybeDT, TaskEventPicker, TaskEventString } from './TaskEvent';
import { Dialog, Modal, ModalFull } from './Dialog';
import { AgendaView } from './Agenda';
import { setContext } from 'tone';
import { CalendarView } from './Calendar';

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
  m.set(TEXT, new Y.Text('heading'))
  m.set(CONTENT, new Y.Array())
  m.set(CHILDREN, new Y.Array())
  return m
}




const newEmbed = () => {
  const m = new Y.Map()
  m.set('embed', '')
  return m
}

export const drag = (event: PointerEvent, node: any, editor: EditorState, klass: string, func: () => {}) => {
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
      func()
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

export const EditorView: Component<{ node: Y.Map<any>, path: Array<Y.Map<any>>, setPath: Setter<Array<Y.Map<any>>>, undoManager:Y.UndoManager }> = (props) => {

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
      // case e.key === 'Enter' && e.shiftKey:
      //   e.preventDefault()
      //   s.node.insert(s.offset, '\n')
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
    // selectionToDom(selection, state.domFromDoc)
  }




  return (
    <div class='font-serif text-xl p-1'>

      <div class=" editor grid grid-cols-[1fr_min(100%,70ch)_1fr]" contenteditable={!lock()} spellcheck={false} onKeyDown={handleKeyDown} onBeforeInput={handleBeforeInput} onPointerDown={() => { selectionFromDom(selection, state.docFromDom) }}>
        <SectionView node={props.node} depth={0} state={state} setPath={props.setPath} last={true} undoManager={props.undoManager} />
      </div >
      <Modal show={palette()} setShow={setPalette}>
        <div class='flex flex-col'>
          <button onClick={() => { yReplaceInArray(selection.node.parent, newPaint()) }}>Paint</button>
          <button onClick={() => { yReplaceInArray(selection.node.parent, newPiece()) }}>Song</button>
          <button onClick={() => { yReplaceInArray(selection.node.parent, newEmbed()) }}>Embed</button>
          <button onClick={() => { yReplaceInArray(selection.node.parent, newTable('')[0]) }}>Table</button>
        </div>
      </Modal>
    </div>
  )
}

export const SectionView: Component<{ node: Y.Map<any>, state: EditorState, depth: number, setPath: Setter<Array<Y.Map<any>>>, last: boolean, undoManager:Y.UndoManager }> = (props) => {

  let s: HTMLElement

  const [menu, setMenu] = createSignal(false)
  const [date, setDate] = createSignal(false)
  const [coords, setCoords] = createSignal({ x: 0, y: 0 })
  const [calendar,setCalendar] = createSignal(false)

  const taskEvent = ySignal(props.node, TASKEVENT)

  onMount(() => {
    props.state.docFromDom.set(s, props.node)
    props.state.domFromDoc.set(props.node, s)
  })

  let [hidden, setHidden] = createSignal(false)

  const children = yArraySignal(props.node.get(CHILDREN))
  const content = yArraySignal(props.node.get(CONTENT))

  const handleDrag = (e) => {
    if (props.depth > 0) {
      drag(e, props.node, props.state, 'section', () => setMenu(true))
    } else {
      setMenu(true)
    }
  }

  createEffect(() => {
    if (menu()) {
      const rect = s.getBoundingClientRect()
      setCoords({ x: rect.left, y: rect.top })
    }
  })

  return (
    <>
      <div ref={s} class=' section  flex flex-col pt-1' style={props.depth === 0 ? 'grid-column:2/3' : ''}>
        <ModalFull show={calendar()} setShow={setCalendar}>
          <div class='grid grid-cols-[min-content_1fr] h-screen w-screen'>
            <div><button onClick={() => setCalendar(false)}>close</button></div>
            <div class='overflow-y-auto'>
              <CalendarView root={props.node!.doc!.getMap('oalm-root')} />
            </div>
          </div>
        </ModalFull>
        <Modal show={date()} setShow={setDate}>
          <TaskEventPicker date={taskEvent()} node={props.node} />
          <button onClick={() => setCalendar(true)}>Open Calendar</button>
        </Modal>
        <Modal show={menu()} setShow={setMenu}>
          <div class='flex flex-col'>
            <button onClick={() => yDeleteFromArray(props.node)}>delete</button>
            <button onClick={() => props.node.parent.insert(props.node.parent.toArray().indexOf(props.node), [newSection()])} >+ sibling</button>
            <button onClick={() => props.node.get(CHILDREN).unshift([newSection()])} >+ child</button>
            <button onClick={() => props.setPath(p => [...p, props.node])}>Open</button>
            <button onClick={() => { setDate(true); setMenu(false) }}>date</button>
          </div>
        </Modal>
        <div class='leading-none flex gap-1 '>

          <div contentEditable={false} class='flex'>
            <div class=" flex touch-none bg-white w-4 border" onpointerdown={handleDrag} >
              {/* <HandleIcon2 last={props.last} section={true} sprogs={!(children().length === 0 && content().length === 0)} /> */}
            </div>
          </div>
          <div class='flex flex-col pb-1'>
            <Show when={taskEvent()}>
              <button contentEditable={false} class='self-start leading-none text-sm' onClick={() => setDate(true)}><TaskEventString taskEvent={taskEvent()} /></button>
            </Show>
            <div class='font-bold'>
              <TextView node={props.node.get(TEXT)} state={props.state} tag={`p`} />
            </div>
            <Show when={!hidden() && (children().length > 0 || content().length > 0)}>
              <div class="flex flex-col " style='margin-left: -10px'>
                <Show when={content().length > 0}>
                  <div class="flex flex-col gap-1">
                    <For each={content()}>
                      {(item, index) =>
                        <ErrorBoundary fallback={<button contentEditable={false} class="bg-red-700" onClick={() => props.node.get(CONTENT).delete(index())}>delete</button>}>
                          <Switch>
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
                              <Paint state={props.state} node={item} undoManager={props.undoManager} />
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

                    <SectionView node={item} state={props.state} depth={props.depth + 1} setPath={props.setPath} last={index() === children().length - 1} undoManager={props.undoManager}/>
                  </>
                  }
                </For>
              </div>
            </Show>
          </div>


        </div>
      </div>
    </>
  )
}


export const ContentContainer: Component<{ node: Y.Map<any>, state: EditorState, commands: Array<{ name: string, run: () => void }> }> = (props) => {
  let r
  const [menu, setMenu] = createSignal(false)

  const handleDrag = (e: PointerEvent) => drag(e, props.node, props.state, 'content', () => setMenu(true))


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
      <Modal show={menu()} setShow={setMenu}>
        <div class='flex-col'>

          <For each={props.commands}>
            {(command) => <div><button onClick={command.run} >{command.name}</button></div>}
          </For>
        </div>
      </Modal>
      <div ref={r} class="flex gap-1 content">
        <div contentEditable={false} class='bg-white border rounded'>
          <div class="font-bold text-gray-400 touch-none  h-full flex w-3" onpointerdown={handleDrag}>
            {/* <HandleIcon2 last={false} section={false} sprogs={false} /> */}
          </div>
        </div>
        <div class='flex-1'>
          {props.children}
        </div>
      </div>

    </>
  )
}

