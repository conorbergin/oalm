import * as Y from 'yjs';
import { Component, onCleanup, createSignal, For, Setter, Show, Switch, Match, onMount, on, createEffect, Accessor, ErrorBoundary, createRenderEffect } from 'solid-js';
import { TEXT, CONTENT, CHILDREN, ROOT_TEXT, ROOT_CHILDREN, ROOT_CONTENT, beforeinputHandler, createSection } from './input';
import { Sel, selectionFromDom, selectionToDom } from './selection';
// import { Sequencer, newPiece } from './Sequencer';
import { TableView, newTable } from './Table';
import { Embed, createEmbed } from './Embed';
import { ParagraphView, TextView } from './Text';
import { drag } from './drag'
import * as Icons from './Icons'

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

const buildPath = (m: Y.Map<any> | Y.Doc): (Y.Map<any> | Y.Doc)[] => {
  if (m instanceof Y.Doc) {
    return [m]
  } else {
    const parent = m.parent?.parent as Y.Map<any> ?? m.doc!
    return [...buildPath(parent as Y.Map<any>), m]
  }
}


export const UndoRedo: Component<{ root: Y.Doc | Y.Map<any> }> = (props) => {
  let undoManager: Y.UndoManager
  const [canUndo, setCanUndo] = createSignal(false)
  const [canRedo, setCanRedo] = createSignal(false)

  createEffect(() => {
    setCanRedo(false)
    setCanUndo(false)
    undoManager = new Y.UndoManager(props.root instanceof Y.Doc ? [props.root.getText(ROOT_TEXT), props.root.getArray(ROOT_CONTENT), props.root.getArray(ROOT_CHILDREN)] : [props.root])
    undoManager.on('stack-item-added', () => { setCanUndo(undoManager.canUndo()); setCanRedo(undoManager.canRedo()) })
    undoManager.on('stack-item-popped', () => { setCanUndo(undoManager.canUndo()); setCanRedo(undoManager.canRedo()) })
  })

  return (
    <div class='flex text-xs gap-1 underline'>
      <button classList={{ 'opacity-50': !canUndo() }} onClick={() => undoManager.undo()}>undo</button>
      <button classList={{ 'opacity-50 ': !canRedo() }} onClick={() => undoManager.redo()}>redo</button>
    </div>
  )
}


export const EditorView: Component<{ doc: Y.Doc, setAccountView: Setter<boolean> }> = (props) => {

  const [root, setRoot] = createSignal<Y.Map<any> | Y.Doc>(props.doc)

  const [calendar, setCalendar] = createSignal(false)

  const path = () => buildPath(root())

  console.log(path())

  return (
    <Show when={calendar()} fallback={
      <>

        <For each={path()}>
          {(item, index) => <Show when={index() === path().length - 1}><RootSectionView node={item} setRoot={setRoot} setCalendar={setCalendar} setAccountView={props.setAccountView} /></Show>}
        </For>


      </>
    }>
      <div class='sticky top-0 bg-white border-b'>
        <button onClick={() => setCalendar(false)}>back</button>
      </div>
      <CalendarView doc={props.doc} />
    </Show >
  )
}

export const RootSectionView: Component<{ node: Y.Map<any> | Y.Doc, setRoot: Setter<Y.Doc | Y.Map<any>>, setCalendar: Setter<boolean>, setAccountView: Setter<boolean> }> = (props) => {
  console.log('reload')
  let state = new EditorState()
  let selection = {
    root: props.node,
    node: props.node instanceof Y.Doc ? props.node.getText(ROOT_TEXT) : props.node.get(TEXT),
    offset: 0,
    focus: null
  }


  let taskEvent = props.node instanceof Y.Doc ? () => null : ySignal(props.node, TASKEVENT)
  let children = yArraySignal(props.node instanceof Y.Doc ? props.node.getArray(ROOT_CHILDREN) : props.node.get(CHILDREN))
  let content = yArraySignal(props.node instanceof Y.Doc ? props.node.getArray(ROOT_CONTENT) : props.node.get(CONTENT))

  const [palette, setPalette] = createSignal(false)

  const path = () => buildPath(props.node)

  const handleBeforeInput = (e) => {
    beforeinputHandler(e, selection)
    selectionToDom(selection, state.domFromDoc)
    console.log(state.domFromDoc.get(selection.node))
    state.domFromDoc.get(selection.node)?.scrollIntoView({ block: 'nearest', inline: 'start' })
  }

  const keydownHandler = (e: KeyboardEvent, s: Sel) => {
    switch (true) {

      case e.key === ' ' && s.offset === 0 && s.node.length === 0:
        e.preventDefault()
        setPalette(true)
        break
      default:
        break
    }
  }

  const handleKeyDown = (e) => {
    selectionFromDom(selection, state.docFromDom)

    keydownHandler(e, selection)
    // selectionToDom(selection, state.domFromDoc)
  }

  return (
    <>



      <div class=" editor flex flex-col " contenteditable={!lock()} spellcheck={false} onKeyDown={handleKeyDown} onBeforeInput={handleBeforeInput} onPointerUp={() => { selectionFromDom(selection, state.docFromDom) }}>
        <div class='sticky top-0 w-full bg-white border-b grid grid-cols-[1fr_min(100%,70ch)_1fr]'>

              <div contentEditable={false} class='flex gap-1 col-start-2'>

                <div class=' text-xs flex whitespace-nowrap overflow-x-auto  flex-1' >
                  <For each={path().slice(0, -1)}>
                    {item => <button onClick={() => props.setRoot(item)}><span class='underline'>{item instanceof Y.Doc ? item.getText(ROOT_TEXT).toString() : item.get(TEXT).toString()}</span>{' / '}</button>}
                  </For>
                </div>
                <UndoRedo root={props.node} />
                <button class='text-xs underline' onClick={() => props.setAccountView(true)}>account</button>
              </div>
              <div class='col-start-1 col-end-4 border-b'/>
              <div class='flex col-start-2'>

                <button class='' contentEditable={false} onClick={() => props.node instanceof Y.Doc ? props.node.getArray(ROOT_CHILDREN).unshift([createSection('heading')[0]]) : props.node.get(CHILDREN).unshift([createSection('heading')[0]])}><div class='w-3' >+</div></button>
                <div class='font-bold text-xl '>
                  <TextView node={props.node instanceof Y.Doc ? props.node.getText(ROOT_TEXT) : props.node.get(TEXT)} state={state} tag={`h1`} />
                </div>
          </div>
        </div>
        <div class=' m-auto max-w-[70ch] w-full flex flex-col'>
          <Show when={children().length > 0 || content().length > 0}>
            <div class="flex flex-col" style=''>
              <For each={content()}>
                {(item) => <ContentContainer node={item} state={state} />}
              </For>
              <For each={children()}>
                {(item, index) => <SectionView node={item} state={state} depth={1} setRoot={props.setRoot} setCalendar={props.setCalendar} />}
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

  )
}

export const SectionView: Component<{ node: Y.Map<any>, state: EditorState, depth: number, setRoot: Setter<Y.Map<any>>, setCalendar: Setter<boolean> }> = (props) => {

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

    <div ref={s} class=' section  flex flex-col ' style='margin-top:-1px'>
      <Modal show={date()} setShow={setDate}>
        <TaskEventPicker date={taskEvent()} node={props.node} />
        <button onClick={() => props.setCalendar(true)}>Open Calendar</button>
      </Modal>
      <Modal show={menu()} setShow={setMenu}>
        <div class='flex flex-col'>
          <button onClick={() => yDeleteFromArray(props.node)}>delete</button>
          {/* <button onClick={() => addSection(s)} >+ sibling</button> */}
          <button onClick={() => props.node.get(CHILDREN).unshift([createSection('')[0]])} >+ child</button>
          <button onClick={() => props.setRoot(props.node)}>Open</button>
          <button onClick={() => { setDate(true); setMenu(false) }}>date</button>
        </div>
      </Modal>
      <div class=' flex '>
        <div contentEditable={false} class='flex'>
          <div class=" flex touch-none bg-white w-4 border" onpointerdown={handleDrag} >
            {/* <HandleIcon2 last={props.last} section={true} sprogs={!(children().length === 0 && content().length === 0)} /> */}
          </div>
        </div>
        <div class='flex flex-col  w-full pb-1'>
          <Show when={taskEvent()}>
            <button contentEditable={false} class='self-start  text-sm' onClick={() => setDate(true)}><TaskEventString taskEvent={taskEvent()} /></button>
          </Show>
          <div class='font-bold'>
            <TextView node={props.node.get(TEXT)} state={props.state} tag={`h${props.depth + 1}`} />
          </div>
          <Show when={children().length > 0 || content().length > 0}>
            <div class="flex flex-col  " style='margin-left: -10px'>
              <For each={content()}>
                {(item) => <ContentContainer node={item} state={props.state} />}
              </For>
              <For each={children()}>
                {(item, index) => <SectionView node={item} state={props.state} depth={props.depth + 1} setRoot={props.setRoot} setCalendar={props.setCalendar} />}
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
      <div ref={r} class="flex content" style='margin-top:-1px'>
        <div contentEditable={false} class='bg-white border'>
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

