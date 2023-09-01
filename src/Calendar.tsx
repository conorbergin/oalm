import { Component, For, createSignal, onCleanup, Show } from "solid-js"

import * as Y from 'yjs'

import { Temporal } from '@js-temporal/polyfill';
import { Dialog } from "./Dialog";
import { Codemirror } from "./Codemirror";
import { ySignal } from "./utils";
import { DateSelector } from "./DatePicker";

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

    const f = (node: Y.Map<any>) => [...(node.has('~') && node.get('~').type === 'dd' ? [node] : []), ...(node.has('&') ? node.get('&').toArray().flatMap((n) => f(n)) : [])]

    const g = () => {
        let d = f(props.root)
        setDates(d)
    }

    g()

    // props.root.observeDeep(g)
    // onCleanup(() => props.root.unobserveDeep(g))


    return (
        <div class='overflow-y-scroll grid' style='grid-template-rows:repeat(365,min-content); grid-template-columns: 1fr min(100%,80ch) 1fr'>
            <For each={[...Array(365).keys()]}>
                {(item, index) =>
                    <div class="p-1 border-b " style={`grid-column: 1 /4;grid-row:${index()}`}>
                        <div class='z-10' >{item}</div>
                    </div>
                }
            </For>
            <div class='grid gap-x-2 p-2' style='justify-items:center;grid-column:2/3;grid-row:1/365;grid-template-rows:subgrid; grid-template-columns: auto'>
                <For each={dates()}>
                    {(item) =><CalendarItem node={item}/>}
                </For>

                {/* <div style='grid-row: 1 / 2' class='border border-red-700' />
                <div style='grid-row: 36 / 42' class='border border-red-700' />
                <div style=' grid-row: 37 / 52' class='border border-red-700' />
                <div style=' grid-row: 47 / 52' class='border border-red-700' />
                <div style=' grid-row: 51 / 62' class='border border-red-700' />
                <div style=' grid-row: 43 / 52' class='border border-red-700' /> */}
            </div>
        </div>
    )
}

const CalendarItem:Component<{node:Y.Map<any>}> = (props) => {
    let r = {} as HTMLDialogElement
    const [show, setShow] = createSignal(false)
    const d = props.node.get('~')
    const date = ySignal(props.node, '~')
    return (
        <>
        <button onClick={() => r.showModal()} class='border border-red-700 bg-red-700/25' style={`width: min(20ch,100%); grid-row: ${Temporal.PlainDate.from(date().begin).dayOfYear} / ${Temporal.PlainDate.from(date().end).dayOfYear}`}/>
        <dialog ref={r} onClick={() => r.close()}>
            <div onClick={e => e.stopImmediatePropagation()}>
                <Codemirror ytext={props.node.get('!')}/>
                <DateSelector node={props.node} date={date()}/>
            </div>
        </dialog>
        </>
    )
}