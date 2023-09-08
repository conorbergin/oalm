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
    const N_WEEKS = 40
    const N_WEEKS_PAST = 10
    const currentYear = Temporal.Now.plainDateISO().year

    const [dates, setDates] = createSignal([])
    const [events, setEvents] = createSignal([])
    const now = Temporal.Now.plainDateISO()
    const startDate = now.subtract({ days:(now.dayOfWeek - 1),weeks:N_WEEKS_PAST})
    const endDate = startDate.add({weeks:N_WEEKS})
    
    const inRange = (t:TaskEvent) => t.end?.date && (t.begin?.date ? t.begin.date < endDate.toString() : t.end.date < endDate.toString())

    const f = (node: Y.Map<any>) => [...(node.has(TASKEVENT) && inRange(node.get(TASKEVENT)) ? [node] : []), ...(node.has(CHILDREN) ? node.get(CHILDREN).toArray().flatMap((n) => f(n)) : [])]

    const g = () => {
        let d = f(props.root)
        setDates(d)
    }

    g()

    // props.root.observeDeep(g)
    // onCleanup(() => props.root.unobserveDeep(g))


    return (
        <div class='grid grid-cols-7 overflow-x-hidden'>
            <For each={[...Array.from({ length: 7 * 40 }, (_, index) => startDate.add({ days: index }))]}>
                {(item, index) =>
                    <div class="p-1 border-b border-r" style={`grid-area:${Math.floor(index()/7) + 1} / ${index()%7 +1}` } classList={{ 'border-l': item.dayOfWeek === 1, 'bg-slate-100': item.month % 2, 'font-bold': item.day === 1 }}>
                        <Show when={item.day === 1} fallback={item.toLocaleString('en-GB', { day: 'numeric' })}>{item.toLocaleString('en-GB', { month: 'short' })}</Show>
                    </div>
                }
            </For>
            <For each={dates()}>
                {item => <CalendarItem node={item} startDate={startDate} endDate={endDate}/>}
            </For>
        </div>
    )
}

const CalendarItem: Component<{ node: Y.Map<any>,startDate:Temporal.PlainDate, endDate:Temporal.PlainDate }> = (props) => {
    let r = {} as HTMLDialogElement
    const date = ySignal(props.node, TASKEVENT)

    return (
        <>
            <Switch>
                <Match when={date().begin?.date && date().end?.date}>
                    <Event node={props.node} date={date()} startDate={props.startDate} endDate={props.endDate} />
                </Match>
            </Switch>
        </>
    )
}

const getCalendarCoords = (date: TaskEvent, startDate:Temporal.PlainDate, endDate:Temporal.PlainDate) => {
    const b = Temporal.PlainDate.from(date.begin!.date!).since(startDate).days
    const e = Math.min(Temporal.PlainDate.from(date.end!.date!).since(startDate).days,endDate.since(startDate).days)
    const startX = b % 7 + 1
    const startY = Math.floor(b / 7) + 1
    const endX = e % 7 + 2
    const endY = Math.floor(e / 7) + 2
    const length = endY - startY
    return Array.from({length},(_,index) => {
        if (index === 0) {
            if (length === 1) {
                return {startX, startY, endX, endY}
            } else {
                return {startX ,startY, endX : 8, endY:startY+1}
            }
        } else if (index === length - 1) {
            return {startX:1, startY:index+startY, endX, endY:startY+index+1}
        } else {
            return {startX : 1,endX:8, startY:startY+index, endY:startY+index+1}
        }
    })
}

const Event: Component<{ node: Y.Map<any>, date: TaskEvent, startDate:Temporal.PlainDate, endDate:Temporal.PlainDate}> = (props) => {
    let r
    return (
        <>
            <For each={getCalendarCoords(props.date,props.startDate, props.endDate)}>
                {(item,index) =>
                    <>
                        <button onClick={() => r.showModal()} class=' border-red-700 text-4xl bg-red-700/50 text-white font-bold text-left' style={`grid-area: ${item.startY}/ ${item.startX}/ ${item.endY}/ ${item.endX}`}>
                            <Show when={index() === 0}>{props.node.get(TEXT).toString()}</Show>
                        </button>
                        <dialog ref={r} onClick={(e) => {r.close()}}>
                            <div onClick={e => e.stopPropagation()}>
                                <div>{props.node.get(TEXT).toString()}</div>
                                <TaskEventPicker node={props.node} date={props.date} />
                            </div>
                        </dialog>
                    </>}
            </For >
        </>
    )

}