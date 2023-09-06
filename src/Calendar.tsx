import { Component, For, createSignal, onCleanup, Show, Switch, Match, createEffect } from "solid-js"

import * as Y from 'yjs'

import { Temporal } from '@js-temporal/polyfill';
import { Dialog } from "./Dialog";
import { Codemirror } from "./Codemirror";
import { ySignal } from "./utils";
import { DateSelector, TaskEventPicker, TaskEvent } from "./DatePicker";
import { CHILDREN, TEXT } from "./input";

const TASKEVENT = '10'

const pack = (a: Array<{ start: Temporal.PlainDate, end: Temporal.PlainDate, col: number }>) => {
    let b: number[] = []
    a.sort((x, y) => Temporal.PlainDate.compare(x.start, y.start))
    let last = 0
    a.forEach((d, i) => {
        for (let j = 0; j < b.length; j++) {
            if (b[j] === 0) {
                d.col = j
                last = d.start.dayOfYear
                b[j]
            }
        }
        last = d.start.dayOfYear
        // d.col = 
    })
}
const extractDate = (node: Y.Map<any>) => {
    let n = node.get('~')
    return { type: n.type, start: Temporal.PlainDate.from(n.begin), end: Temporal.PlainDate.from(n.end), parent: node }
}


export const CalendarView: Component<{ root: Y.Map<any> }> = (props) => {
    const currentYear = Temporal.Now.plainDateISO().year

    const [dates, setDates] = createSignal([])
    const [events, setEvents] = createSignal([])

    const f = (node: Y.Map<any>) => [...(node.has(TASKEVENT) && node.get(TASKEVENT).end?.date ? [node] : []), ...(node.has(CHILDREN) ? node.get(CHILDREN).toArray().flatMap((n) => f(n)) : [])]

    const g = () => {
        let d = f(props.root)
        setDates(d)
    }

    g()

    // props.root.observeDeep(g)
    // onCleanup(() => props.root.unobserveDeep(g))

    const now = Temporal.Now.plainDateISO()

    return (
        <div class='grid grid-cols-7'>
            <For each={[...Array.from({length:now.daysInYear},(_,index) => Temporal.PlainDate())]}>
                {(item, index) =>
                    <div class="p-1 border-b border-r" style={`grid-column: ${item/7} / ${}; grid-row: ${} / ${}`} classList={{ 'border-l': item % 7 === 0 }}>
                        <div >{item}</div>
                    </div>
                }
            </For>
            <For each={dates()}>
                {item => <CalendarItem node={item} />}
            </For>
        </div>
    )
}

const CalendarItem: Component<{ node: Y.Map<any> }> = (props) => {
    let r = {} as HTMLDialogElement
    const date = ySignal(props.node, TASKEVENT)

    return (
        <>
            <Switch>
                <Match when={date().begin?.date && date().end?.date}>
                    <Event node={props.node} date={date()} />
                </Match>
            </Switch>
        </>
    )
}

const getCalendarCoords = (date: TaskEvent) => {
    const b = Temporal.PlainDate.from(date.begin!.date!)
    const e = Temporal.PlainDate.from(date.end!.date!)
    const startX = b.dayOfYear % 7
    const startY = Math.floor(b.dayOfYear / 7)
    const endX = e.dayOfYear % 7
    const endY = Math.floor(e.dayOfYear / 7)
    if (startY === endY) {
        return [[startX+1, startY, endX, startY + 1]]
    } else if (endY === startY+1) {
        return [[startX + 1, startY, 8, startY + 1],[1,endY,endX,endY+1]]
    } else {
        return [[startX +1, startY, 8, startY + 1],...Array.from({length:endY-startY-1},(_,index)=> [1,index+startY+1,7,index+startY+2]),[1,endY,endX,endY+1]]
    }

}

const Event: Component<{ node: Y.Map<any>, date: TaskEvent }> = (props) => {
    let r
    return (
        <>
            <For each={getCalendarCoords(props.date)}>
                {item => <>
                    <button onClick={() => r.showModal()} class='border z-10 border-red-700 bg-red-700/25' style={`grid-column: ${item[0]} / ${item[2]};grid-row: ${item[1]} / ${item[3]}`} />
                    <dialog ref={r} onClick={() => r.close()}>
                        <div onClick={e => e.stopImmediatePropagation()}>
                            <div>{props.node.get(TEXT).toString()}</div>
                            <TaskEventPicker node={props.node} date={props.date} />
                        </div>
                    </dialog>
                </>}
            </For >
        </>
    )

}