import * as Y from 'yjs';
import { Component, onCleanup, createSignal, For, Setter, Show, Switch, Match, onMount, on, createEffect, Accessor, ErrorBoundary, createRenderEffect } from 'solid-js';
import { TEXT, CONTENT, CHILDREN, ROOT_TEXT, ROOT_CHILDREN, ROOT_CONTENT, beforeinputHandler, createSection } from './input';
import { Sel, selectionFromDom, selectionToDom } from './selection';
// import { Sequencer, newPiece } from './Sequencer';
import { TableView, newTable } from './Table';
import { Embed, createEmbed } from './Embed';
import { ParagraphView, TextView } from './Text';
import { drag } from './drag'

import { Paint, createPaint } from './Paint';

import { yDeleteFromArray, yArraySignal, yReplaceInArray, ySignal } from './utils';


export const [lock, setLock] = createSignal(false)

import { TASKEVENT, MaybeDT, TaskEventPicker, TaskEventString } from './TaskEvent';
import { Dialog, Modal, ModalFull } from './Dialog';
import { CalendarView } from './Calendar';

export interface EditorState {
  drag: Map<HTMLElement, Y.AbstractType<any>>
  domFromDoc: Map<any, HTMLElement>
  docFromDom: Map<HTMLElement, any>

}

export class EditorState {
  constructor() {
    this.drag = new Map()
    this.domFromDoc = new Map()
    this.docFromDom = new Map()
  }
}

export const EditorView: Component<{ node: Y.Doc | Y.Map<any>, path: Array<Y.Doc | Y.Map<any>>, setPath: Setter<Array<Y.Doc | Y.Map<any>>>, setAccountView: Setter<boolean> }> = (props) => {

  console.log(props.node instanceof Y.Doc)
  let state = new EditorState()

  let selection = {
    root: props.node,
    node: props.node instanceof Y.Doc ? props.node.getText(ROOT_TEXT) : props.node.get(TEXT),
    offset: 0,
    focus: null
  }

  const taskEvent = props.node instanceof Y.Doc ? () => null : ySignal(props.node, TASKEVENT)
  const children = yArraySignal(props.node instanceof Y.Doc ? props.node.getArray(ROOT_CHILDREN) : props.node.get(CHILDREN))
  const content = yArraySignal(props.node instanceof Y.Doc ? props.node.getArray(ROOT_CONTENT) : props.node.get(CONTENT))

  console.log(children())


  const [path, setPath] = createSignal([props.node])
  const [calendar, setCalendar] = createSignal(false)

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
      default:
        break
    }
  }

  const handleBeforeInput = (e) => {
    beforeinputHandler(e, selection)
    selectionToDom(selection, state.domFromDoc)
    console.log(state.domFromDoc.get(selection.node))
    state.domFromDoc.get(selection.node)?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }

  const handleKeyDown = (e) => {
    selectionFromDom(selection, state.docFromDom)

    keydownHandler(e, selection)
    // selectionToDom(selection, state.domFromDoc)
  }

  return (
    <Show when={calendar()} fallback={
      <>
        <div class='flex'>
          <For each={props.path}>
            {(item, index) => <Show when={index() < props.path.length - 1}><button onClick={() => {props.setPath(p => [...p.slice(0, index() + 1)]); console.log(props.path)}}>{item instanceof Y.Doc ? item.getText(ROOT_TEXT).toString() : item.get(TEXT).toString()}</button></Show>}
          </For>
        </div>
        <div class=" editor grid grid-cols-[1fr_min(100%,70ch)_1fr] p-1" contenteditable={!lock()} spellcheck={true} onKeyDown={handleKeyDown} onBeforeInput={handleBeforeInput} onPointerUp={() => { selectionFromDom(selection, state.docFromDom) }}>
          <div class='col-span-2 flex flex-col'>
            <div class='flex sticky top-0 bg-white border-b'>
              <button onClick={() => props.node instanceof Y.Doc ? props.node.getArray(ROOT_CHILDREN).unshift([createSection('heading')[0]]) : props.node.get(CHILDREN).unshift([createSection('heading')[0]])}>+</button>
              <div class='font-bold '>
                <TextView node={props.node instanceof Y.Doc ? props.node.getText(ROOT_TEXT) : props.node.get(TEXT)} state={state} tag={`h1`} />
              </div>
            </div>
            <Show when={children().length > 0 || content().length > 0}>
              <div class="flex flex-col gap-2 pt-2" style=''>
                <For each={content()}>
                  {(item) => <ContentContainer node={item} state={state} />}
                </For>
                <For each={children()}>
                  {(item, index) => <SectionView node={item} state={state} depth={1} setPath={props.setPath} setCalendar={setCalendar} />}
                </For>
              </div>
            </Show>
          </div>
        </div >
        <Modal show={palette()} setShow={setPalette}>
          <div class='flex flex-col'>
            <button onClick={() => { yReplaceInArray(selection.node, createPaint()) }}>Paint</button>
            <button onClick={() => { yReplaceInArray(selection.node, createEmbed()) }}>Embed</button>
            <button onClick={() => { yReplaceInArray(selection.node, newTable('')[0]) }}>Table</button>
          </div>
        </Modal>
      </>
    }>
      <CalendarView doc={props.node instanceof Y.Doc ? props.node : props.node.doc!} />
    </Show>
  )
}

export const SectionView: Component<{ node: Y.Map<any>, state: EditorState, depth: number, setPath: Setter<Array<Y.Map<any>>>, setCalendar: Setter<boolean> }> = (props) => {

  let s: HTMLElement

  const [menu, setMenu] = createSignal(false)
  const [date, setDate] = createSignal(false)
  const [coords, setCoords] = createSignal({ x: 0, y: 0 })

  const taskEvent = ySignal(props.node, TASKEVENT)

  onMount(() => {
    props.state.drag.set(s, props.node)
  })

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

    <div ref={s} class=' section  flex flex-col pt-1'>
      <Modal show={date()} setShow={setDate}>
        <TaskEventPicker date={taskEvent()} node={props.node} />
        <button onClick={() => props.setCalendar(true)}>Open Calendar</button>
      </Modal>
      <Modal show={menu()} setShow={setMenu}>
        <div class='flex flex-col'>
          <button onClick={() => yDeleteFromArray(props.node)}>delete</button>
          <button onClick={() => addSection(s)} >+ sibling</button>
          <button onClick={() => props.node.get(CHILDREN).unshift([createSection('')[0]])} >+ child</button>
          <button onClick={() => props.setPath(p => [...p, props.node])}>Open</button>
          <button onClick={() => { setDate(true); setMenu(false) }}>date</button>
        </div>
      </Modal>
      <div class=' flex gap-1'>
        <div contentEditable={false} class='flex '>
          <div class=" flex touch-none bg-white w-4 border" onpointerdown={handleDrag} >
            {/* <HandleIcon2 last={props.last} section={true} sprogs={!(children().length === 0 && content().length === 0)} /> */}
          </div>
        </div>
        <div class='flex flex-col gap-1 pb-1 pt-1 w-full'>
          <Show when={taskEvent()}>
            <button contentEditable={false} class='self-start  text-sm' onClick={() => setDate(true)}><TaskEventString taskEvent={taskEvent()} /></button>
          </Show>
          <div class='font-bold'>
            <TextView node={props.node.get(TEXT)} state={props.state} tag={`h${props.depth + 1}`} />
          </div>
          <Show when={children().length > 0 || content().length > 0}>
            <div class="flex flex-col gap-2 pt-2" style='margin-left: -10px'>
              <For each={content()}>
                {(item) => <ContentContainer node={item} state={props.state} />}
              </For>
              <For each={children()}>
                {(item, index) => <SectionView node={item} state={props.state} depth={props.depth + 1} setPath={props.setPath} setCalendar={props.setCalendar} />}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}


export const ContentContainer: Component<{ node: Y.Map<any> | Y.Text, state: EditorState }> = (props) => {
  let r
  const [menu, setMenu] = createSignal(false)

  const handleDrag = (e: PointerEvent) => drag(e, props.node, props.state, 'content', () => setMenu(true))


  onMount(() => {
    props.state.drag.set(r, props.node)
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
          <button onClick={() => props.node.parent.delete(props.node.parent.toArray().indexOf(props.node))}>delete</button>
        </div>
      </Modal>
      <div ref={r} class="flex gap-1 content">
        <div contentEditable={false} class='bg-white border rounded'>
          <div class="font-bold text-gray-400 touch-none  h-full flex w-3" onpointerdown={handleDrag}>
            {/* <HandleIcon2 last={false} section={false} sprogs={false} /> */}
          </div>
        </div>
        <div class='flex-1'>
          <ErrorBoundary fallback={() => <div class='bg-red-400'>error</div>}>
            <Switch>
              <Match when={props.node instanceof Y.Text}>
                <TextView node={props.node as Y.Text} state={props.state} tag='p' />
              </Match>
              <Match when={props.node.has('embed')}>
                <Embed node={props.node} state={props.state} />
              </Match>
              <Match when={props.node.has('paint')}>
                <Paint state={props.state} node={props.node} undoManager={props.undoManager} />
              </Match>
              <Match when={props.node.has('header')}>
                <TableView node={props.node} state={props.state} />
              </Match>
            </Switch>
          </ErrorBoundary>
        </div>
      </div>

    </>
  )
}

