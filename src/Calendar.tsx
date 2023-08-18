import { Component, For, createSignal, onCleanup, Show } from "solid-js"

import * as Y from 'yjs'

import { Temporal } from '@js-temporal/polyfill';




export const CalendarView: Component<{ root: Y.Map<any> }> = (props) => {
    const currentYear = Temporal.Now.plainDateISO().year

    const [dates, setDates] = createSignal([])
    const [events, setEvents] = createSignal([])


    const f = (node: Y.Map<any>) => {
        if (node.has('~')) {
            let date = Temporal.PlainDate.from(node.get('~'))
            if (date.year === currentYear) {
                setDates(dates => [...dates, { node, date }])
            }
        }
        if (node.has('&')) {
            node.get('&').forEach((n) => f(n))
        }
    }

    const g = () => {
        setDates([])
        f(props.root)
    }

    g()

    props.root.observeDeep(g)
    onCleanup(() => props.root.unobserveDeep(g))


    const w = 20
    return (
        <div class="w-full h-full">
            2023
            <div class="font-body font-bold relative gap-1 overflow-scroll w-full h-full border-t border-black" >
                <For each={[...Array(365).keys()]}>
                    {(item, index) =>
                        <div class="absolute p-1 border-l" style={{ height: '1000px', left: `${item * w}px` }}>
                        </div>
                    }
                </For>

                <For each={dates()}>
                    {(item, index) => <div class="absolute border p-1 border-black" style={{ top: `${index() * 40}px`, left: `${item.date.dayOfYear*20}px` }}>
                        <button class=" text-black text-sm">{item.node.get('!').toString()}</button>
                    </div>}
                </For>
            </div>
        </div>
    )
}