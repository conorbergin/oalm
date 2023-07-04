import { Accessor, Component, createSignal, For, Setter, Show, Switch, Match, onCleanup } from 'solid-js'
import * as Y from 'yjs'

import { DateTime } from 'luxon'

const clockFaceRotated = [
    '09', '10', '11', '12', '13', '14', '15',
    '08', '', '', '', '', '', '16',
    '07', '', '50', '00', '10', '', '17',
    '06', '', '45', '', '15', '', '18',
    '05', '', '40', '30', '20', '', '19',
    '04', '', '', '', '', '', '20',
    '03', '02', '01', '00', '23', '22', '21'
]

const clockFaceRotatedMask = [
    'h', 'h', 'h', 'h', 'h', 'h', 'h',
    'h', '', '', '', '', '', 'h',
    'h', '', 'm', 'm', 'm', '', 'h',
    'h', '', 'm', '', 'm', '', 'h',
    'h', '', 'm', 'm', 'm', '', 'h',
    'h', '', '', '', '', '', 'h',
    'h', 'h', 'h', 'h', 'h', 'h', 'h'
]




const Picker: Component<{ node: Y.Map<any> }> = (props) => {


    let [now, setNow] = createSignal(DateTime.now())
    let [window, setWindow] = createSignal(DateTime.now())
    let [begin, setBegin] = createSignal(DateTime.now())
    let [end, setEnd] = createSignal(null)

    let updateNow = setInterval(() => setNow(DateTime.now()), 30000)
    onCleanup(() => clearInterval(updateNow))


    return (
        <>
            <div style={{display:'inline-block'}}>{window().toLocaleString({year:'numeric'})}</div>
            <button>Begin</button>
            <button>End</button>

            <div style={{
                display: 'flex',
                gap: '1rem',
            }}>
                <div>
                    <div style={{
                        'display': 'grid',
                        "grid-template-columns": 'repeat(6, 1fr)',
                        'padding-bottom': '1rem',
                    }}>

                        <For each={[...Array(12).keys()]}>
                            {(i) => <button onClick={() => { setWindow(window().set({ month: i + 1 })) }} classList={{ isCurrentDay: i + 1 === now().month, underline: i + 1 === window().month }}>{DateTime.fromObject({ month: i + 1 }).toLocaleString({ month: 'short' })}</button>}
                        </For>
                    </div>

                    <div style={{
                        'display': 'grid',
                        "grid-template-columns": 'repeat(7, 1fr)',
                    }}>

                        <For each={[...Array(window().startOf('month').weekday - 1).keys()]}>
                            {(i) => <div onClick={() => { }}></div>}
                        </For>
                        <For each={[...Array(window().daysInMonth).keys()]}>
                            {(i) => <button classList={{ isCurrentDay: (i === now().day - 1) && (window().month === now().month) && (window().year === now().year) }} onClick={() => { }}>{`${i + 1}`.padStart(2, '0')}</button>}
                        </For>
                    </div>
                </div>
                <div style={{
                    'display': 'grid',
                    "grid-template-columns": 'repeat(7, 1fr)',
                    width: 'fit-content',
                }}>
                    <For each={clockFaceRotated}>
                        {(c, index) =>
                            <Switch fallback={<div />}>
                                <Match when={clockFaceRotatedMask[index()] === 'h'}>
                                    <button classList={{ isCurrentDay: (now().hour === parseInt(c)) && (window().month === now().month) && (window().day === now().day) && (window().year === now().year) }} onClick={() => { }}>{c}</button>
                                </Match>
                                <Match when={clockFaceRotatedMask[index()] === 'm'}>
                                    <button classList={{ isCurrentDay: now().minute === c }} onClick={() => { }}>{c}</button>
                                </Match>
                            </Switch>
                        }
                    </For>

                </div>
            </div>
        </>

    )
}

export const DTPicker: Component<{ node: Y.Map<any>, setShow: Setter<boolean> }> = (props) => {
    return (
        <div style={{
            position: 'fixed',
            display: 'flex',
            "justify-content": 'center',
            width: '100vw',
            height: '100vh',
            top: 0,
            left: 0,
            'background-color': 'rgba(0,0,0,0.5)',
        }} onClick={() => props.setShow(false)}>
            <div style={{
                height: 'fit-content',
                background: 'white',
                padding: '1rem',
                margin: '4rem',
            }} onClick={(e) => e.stopPropagation()}>
                <Picker node={props.node} />
            </div>
        </div>


    )
}
