import { Component, For, Match, Show, Switch, createSignal } from 'solid-js';
import { createStore, reconcile } from "solid-js/store";
import * as Y from 'yjs';
import { Cursor } from './selection';

import { createMediaQuery } from "@solid-primitives/media";


import { IndexeddbPersistence } from 'y-indexeddb';
import { SidePane } from './SplitPane';


import { Date, LexBlock, LexHeading, LexLine, LexList, LexTable, LexText, parse } from './lang';
import { Temporal } from '@js-temporal/polyfill';



const branch = (a: number, b?: number) => b ? `branch-${a}-${b}` : `branch-${a}`
const leaf = (a: number, b?: number) => b ? `leaf-${a}-${b}` : `leaf-${a}`

const textOrBr = (s: string) => s === "" ? <br /> : s




function endOfRowLocation(row: LexText[]) {
  const last = row.at(-1)
  return last ? last.location + last.text.length + 1 : 0
}




export const Editor: Component<{ text: Y.Text }> = (props) => {



  function readDocRange(el: Element) {
    const range = el.getAttribute("data-index")
    if (!range) {
      return null
    }
    const [a, b, c] = range.split("-")
    return { kind: a, location: parseInt(b), len: parseInt(c) }
  }

  const getSel = (): { start: number, end: number | null, code: boolean } => {
    const s = document.getSelection()
    if (!s || s.type === "none" || !s.anchorNode) {
      throw new Error("no selection found")
    }

    function getClosestDataIndex(node: Node) {
      const parent = node instanceof Element ?
        node.closest('[data-index]') :
        node.parentElement!.closest('[data-index]')

      if (parent === null) {
        throw new Error("failed to find [data-index]")
      }
      return parent
    }

    let code = false;
    const range = s.getRangeAt(0);

    const anchorNode = getClosestDataIndex(range.startContainer)

    if (anchorNode.classList.contains("iscode")) { code = true }

    const preAnchorRange = range.cloneRange();
    preAnchorRange.selectNodeContents(anchorNode);
    preAnchorRange.setEnd(range.startContainer, range.startOffset);

    let start = readDocRange(anchorNode)!.location + preAnchorRange.toString().length

    if (s.isCollapsed) {
      return { start, end: null, code }
    }

    const focusNode = getClosestDataIndex(range.endContainer)
    const preFocusRange = range.cloneRange()
    preFocusRange.selectNodeContents(focusNode)
    preFocusRange.setEnd(range.endContainer, range.endOffset)
    const end = readDocRange(focusNode)!.location + preFocusRange.toString().length

    return { start, end, code }
  }

  const putSel = (offset: number, scrollopt?: "start" | "end" | "center" | "nearest") => {
    function _putSel(root: Element, offset: number) {
      let el: Element | null = null
      let kind = "branch"
      let loc = 0
      for (let e of root.children!) {
        const next = readDocRange(e)
        if (!next) {
          continue
        }
        if (next.location > offset) {
          break
        }
        el = e
        kind = next.kind
        loc = next.location
        if (next.len && next.len + loc >= offset) {
          break
        }
      }

      if (!el) {
        throw new Error("[data-index] not found")
      } else if (kind == "branch") {
        _putSel(el, offset)
      } else {
        Cursor.setCurrentCursorPosition(offset - loc, el)
        el.scrollIntoView({ block: scrollopt ?? "nearest", behavior: "instant" })
      }
    }
    _putSel(c!, offset)
    return
  }

  const handleBeforeInput = (e: InputEvent) => {
    try {
      e.preventDefault()
      const { start, end, code } = getSel()

      switch (e.inputType) {
        case "insertText":
          if (end) {
            props.text.delete(start, end - start)
          }
          props.text.insert(start, e.data!)
          putSel(start + e.data!.length)
          break;
        case "deleteContentBackward":
          if (end) {
            props.text.delete(start, end - start)
            putSel(start)
          } else {
            if (start > 0) {
              props.text.delete(start - 1, 1)
              putSel(start - 1)
            }
          }
          break;

        case "deleteContentForward":
          if (end) {
            props.text.delete(start, end - start)
            putSel(start)
          } else {
            if (start < props.text.length - 1) {
              props.text.delete(start, 1)
              putSel(start)
            }
          }
          break;

        case "insertParagraph":
          if (end) {
            props.text.delete(start, end - start)
          }
          if (code) {
            props.text.insert(start, "\n ")
            putSel(start + 2)
          } else {
            props.text.insert(start, "\n")
            putSel(start + 1)
          }
          break;
        case "insertFromPaste":
          const dt = e.dataTransfer
          if (!dt) { break }
          const t = dt.getData('text/plain')
          if (!t) { break }
          if (end) {
            props.text.delete(start, end - start)
          }
          props.text.insert(start, t)
          putSel(start + t.length)
          break;
        default:
          break;
      }
    } catch (e) {
      console.log(e)
    }
  }

  let c: HTMLDivElement | undefined = undefined

  const parse2 = (s: string): LexBlock[] => {
    if (s == "") {
      console.log("none")
      return [{ kind: "line", text: "", location: 0 }]
    }
    let loc = 0
    let lines = []
    for (let line of s.split("\n")) {
      lines.push({ kind: "line", text: "", location: loc } as LexLine)
      loc += line.length + 1
    }
    return lines
  }

  let daterange = Array.from({ length: 7 * 100 }, (_, i) => Temporal.Now.plainDateISO().subtract({ days: 7 * 6 + Temporal.Now.plainDateISO().dayOfWeek - 1 }).add({ days: i }))

  const [store, setStore] = createStore({ values: parse(props.text.toString()) })
  props.text.observe(e => {

    setStore(reconcile({ values: parse(props.text.toString()) }))
    console.log(store.values)
    if (e.transaction.local) {

    }
  })

  const screenBig = createMediaQuery("(min-width: 767px)")

  const [calendar, setCalendar] = createSignal(false)

  let dialogRef : HTMLDialogElement

  return (


    <div class="flex justify-center">
      <dialog class=""  onClick={() => dialogRef.close()} ref={dialogRef}>
        <div class="p-4 border top-7 dark:bg-stone-800 dark:text-white flex flex-col gap-1 max-w-prose">
          <p><i>Org à la mode</i> is an experimental alternative to <a href="https://orgmode.org/">Org mode</a>.</p>
          <p>Here is an example document:</p>
          <Heading h={{kind:"heading",location:0,text:"= Here is a heading",level:1,date:null}}/>
          <Line l={{kind:"line",location:0,text:"Here is some body text."}}/>
          <Heading h={{kind:"heading",location:0,text:"== Here is a sub-heading with a date ",level:2,date:{text:" 2024-04-12"}}}/>
          <Line l={{kind:"line",location:0,text:"At the moment dates must be in the yyyy-mm-dd format."}}/>
          <Heading h={{kind:"heading",location:0,text:"== Tables",level:2,date:null}}/>
          <Line l={{kind:"line",location:0,text:"Tables are made from adjacent lines containing pipe characters."}}/>
          <Table t={{kind:"table",location:0,header:null,body:[[{text:"A"},{text:"B"},{text:"C"}],[{text:"D"},{text:"E"}]]}}/>
          <Line l={{kind:"line",location:0,text:"Tables with headers can be made by placing a line starting with three dashes after the first row."}}/>
          <Table t={{kind:"table",location:0,header:{separator:{text:"--- "},row:[{text:"A"},{text:"B"},{text:"C"}]},body:[[{text:"A"},{text:"B"},{text:"C"}],[{text:"D"},{text:"E"}]]}}/>

        </div>
      </dialog>


      <Show when={screenBig()}>
        <div class="flex flex-col relative">

          <div class="flex flex-col p-4 pt-8 w-24 overflow-hidden sticky top-0">
            <For each={store.values.filter(x => x.kind == "heading") as LexHeading[]}>
              {h => <button onClick={() => putSel(h.location, "center")} classList={{ "text-red-500": h.date !== null }} class="text-sm underline overflow-hidden text-nowrap" style={{ "padding-left": `${h.level * 3}px` }}>{h.text.slice(h.level + 1)}</button>}
            </For>
          </div>
        </div>
      </Show>
      <div class="flex flex-col flex-1 max-w-prose p-2">
        <div class="flex justify-between">
          <button class="underline" onClick={() => setCalendar(c => !c)} >{calendar() ? "Editor" : "Calendar"}</button>
          <button class="underline" onClick={() => dialogRef.showModal()} >help</button>
        </div>
        <Show when={calendar()} fallback={
          <div ref={c} data-index={branch(0, props.text.length)} class="p-2 flex flex-col gap-2 break-words whitespace-pre-wrap  flex-1" contentEditable={true} spellcheck={false} onBeforeInput={handleBeforeInput}>
            <For each={store.values}>{item =>
              <Switch fallback={
                <Line l={item as LexLine} />
              }>
                <Match when={item.kind === "table"}   ><Table t={item as LexTable} /></Match>
                {/* <Match when={item.kind === "list"}    ><List list={item as LexList} /></Match> */}
                <Match when={item.kind === "heading"} ><Heading h={item as LexHeading} /></Match>
              </Switch>
            }</For>
          </div>
        }>
          <Calendar daterange={daterange} dates={store.values.filter(v => v.kind == "heading" && v.date) as LexHeading[]} />
        </Show>
      </div>
    </div>
  )
}


const Calendar: Component<{ daterange: Array<Temporal.PlainDate>, dates: { kind: "heading", level: number, location: number, text: string, date: Date }[] }> = (props) => {

  const startDate = Temporal.Now.plainDateISO().subtract({ days: 30 })

  const nDates = 7 * 100

  return <div class="max-w-prose flex-1 grid grid-cols-7">
    <For each={props.daterange}>{d => <div class="text-gray-500 pl-1" classList={{ " border-l": d.dayOfWeek === 6, "text-stone-500": d.month % 2 === 1, "text-orange-500 italic": d.day === 1 }}>
      <div>{d.day === 1 ? d.toLocaleString("en-US", { month: "short" }) : d.day.toString()}</div>
      <For each={props.dates.filter(dd => dd.date.date.equals(d))}>{dd => <div>{dd.text.slice(dd.level)}</div>}

      </For>
    </div>}</For>
  </div>
}

const Outline: Component<{ h: LexHeading }> = (props) => {

  return <div class="text-sm" style={{ "padding-left": `${props.h.level * 3}px` }}>{props.h.text.slice(props.h.level + 1)}</div>

}

const List: Component<{ list: LexList }> = (props) => "not implemented"
const Line: Component<{ l: LexLine }> = (props) => <div data-index={leaf(props.l.location)} >{textOrBr(props.l.text)}</div>

const Heading: Component<{ h: LexHeading }> = (props) =>
  <div data-index={leaf(props.h.location)} classList={{ "mt-2 pt-2 border-t border-dashed": props.h.level === 1 && props.h.location > 0 }} class="font-bold">
    <span class="text-gray-500">{props.h.text.slice(0, props.h.level)}</span>
    <span>{props.h.text.slice(props.h.level)}</span>
    <Show when={props.h.date}>
      <span class="text-red-500" >#{props.h.date?.text}</span>
    </Show>
  </div>

const Table: Component<{ t: LexTable }> = (props) => {
  const width = () => Math.max(...props.t.body.map(x => x.length), props.t.header?.row.length ?? 0)
  const lastLocation = (row: LexText[]) => row.at(-1)!.location + row.at(-1)!.text.length
  return (
    <div class="grid text-center text-green-500" data-index={branch(props.t.location)} style={{ "grid-template-columns": `repeat(${width()},auto)` }}>
      <Show when={props.t.header}>
        {header => <>
          <div data-index={leaf(header().row[0].location, header().row[0].text.length)} >{textOrBr(header().row[0].text)}</div>
          <For each={header().row.slice(1)}>{cell => <div class="border-l border-green-500 p-1" data-index={leaf(cell.location, cell.text.length)}>{textOrBr(cell.text)}</div>}</For>
          <For each={Array(width() - header().row.length)}>{() => <div data-index={leaf(lastLocation(header().row))} class="border-l p-1"><br /></div>}</For>
          <div class="text-gray-500 text-left" data-index={leaf(header().separator.location)} style={{ "grid-column": "1 / -1" }}>{header().separator.text}</div>
        </>}
      </Show>
      <For each={props.t.body}>
        {row => <>
          <div class="text-green-700" data-index={leaf(row[0].location, row[0].text.length)} >{textOrBr(row[0].text)}</div>
          <For each={row.slice(1)}>{cell => <div data-index={leaf(cell.location, cell.text.length)} class="border-l text-green-700 border-green-700 p-1">{textOrBr(cell.text)}</div>}</For>
          <For each={Array(width() - row.length)}>{() => <div data-index={leaf(lastLocation(row))} class="border-l p-1"><br /></div>}</For>
        </>}
      </For>
    </div>
  )
}



export const EditorView: Component = (props) => {

  let doc = new Y.Doc()
  const idb = new IndexeddbPersistence('default', doc)

  let root = doc.getArray('root')
  const [arr, setArr] = createSignal<Array<Y.Text>>([])
  const f = () => setArr(root.toArray() as Y.Text[])
  f()
  root.observeDeep(() => f())
  const [openNote, setOpenNote] = createSignal<Y.Text | null>(null)
  const [dir, setDir] = createSignal('')

  return (
    <SidePane side={
      <div class="p-2 flex flex-col">
        <div class="font-bold flex gap-1">
          <button class="text-xs bg-red-500 border" onClick={() => console.log(doc.toJSON())}>debug</button>
          <button class="text-xs" onClick={() => root.push([new Y.Text()])}>add</button>
          <button class="text-xs" onClick={() => root.delete(root.toArray().findIndex(x => x === openNote()), 1)}>delete</button>
        </div>
        <For each={arr()}>
          {(item, idx) =>
            <button class="rounded pl-1" classList={{ 'highlight': item === openNote() }}
              onClick={() => { setOpenNote(null); setOpenNote(item) }}
            ><div>Book {idx() + 1}</div></button>
          }
        </For>
      </div>
    } divider={
      <div class="w-1 m-1 bg-slate-400 h-full" />
    }
      main={
        <div class="flex flex-col flex-1 max-w-prose">
          <Show when={openNote()} fallback={
            <div class="text-neutral-500 p-2">Nothing Open</div>
          }>{open =>
            <>
              <Editor text={open()} />
            </>
            }
          </Show>
        </div>
      }
    />
  )
}
