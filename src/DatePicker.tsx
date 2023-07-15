import { Accessor, Component, createSignal, For, Setter, Show, Switch, Match, onCleanup } from 'solid-js'
import * as Y from 'yjs'

import { DateTime, Duration, Interval } from 'luxon'

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

const isoDurationString = 'PT3H30M'; // Duration
const isoIntervalString = '2023-07-05T12:30:00Z/2023-07-06T12:30:00Z'; // Interval
const isoDateTimeString = '2023-07-05T12:30:00Z'; // DateTime

const luxnParseIso = (iso: string): DateTime | Interval | Duration => {
  if (iso.includes('/')) {
    return Interval.fromISO(iso)
  } else if (iso.includes('P')) {
    return Duration.fromISO(iso)
  } else {
    return DateTime.fromISO(iso)
  }
}

/*
NEXT : a task of high importance with no explitit deadline
SOON--1W a task of medium importance which will take a week to complete
isodate--1M: a task with a deadline which will take about a month
isodate--isodate: an event with a start and end date

explict dates are a result of external requirements, vague dates are a result of internal requirements
maybe we need two separate systems.
A taks can have a vague date and a vague duration, its a todo item
A task can have an explicit date and a vague duration, its a deadline -- the vague duration should be a child of the explicit date
A task can have an explicit date and an explicit duration, its an event or appointment ( how do we represent availability? for these event?)
*/


export const Picker: Component<{ setOpen: Setter<boolean>, node: Y.Map<any> }> = (props) => {

  let node = props.node
  let vagueStates = ['NEXT', 'SOON', 'SOMEDAY']
  let [now, setNow] = createSignal(DateTime.now())



  let [luxn, setLuxn] = createSignal(luxnParseIso(node.get('~').toString()))

  let [vague, setVague] = createSignal(null)

  let [begin, setBegin] = createSignal(DateTime.now())
  let [end, setEnd] = createSignal(null)

  if (node.has('~') && vagueStates.includes(node.get('~').toString())) {
    setVague(node.get('~').toString())
  } else {

  }

  let updateNow = setInterval(() => setNow(DateTime.now()), 30000)
  onCleanup(() => clearInterval(updateNow))


  return (
    <div class="text-gray-600">
      <div class="flex gap-2 text-base items-center">
        <For each={vagueStates}>
          {(state) => (<button classList={{ 'text-black font-bold': vague() === state }} onClick={() => setVague(state)}>{state}</button>)}
        </For>
        <button onClick={() => props.setOpen(false)}>close</button>

      </div>
      <div class="flex gap-2 text-base items-center">
        <div>{begin().toLocaleString({ weekday: 'short', day: 'numeric' })}</div>
        <div class="flex flex-col">
          <button onClick={() => setBegin(begin().plus({ months: 1 }))}>^</button>
          {begin().toLocaleString({ month: 'short' })}
          <button onClick={() => setBegin(begin().minus({ months: 1 }))}>v</button>
        </div>
        <div class="flex flex-col">
          <button onClick={() => setBegin(begin().plus({ years: 1 }))}>^</button>
          {begin().toLocaleString({ year: 'numeric' })}
          <button onClick={() => setBegin(begin().minus({ years: 1 }))}>v</button>
        </div>

        <Show when={end()} fallback={<button onClick={() => setEnd(begin())}>+ end date</button>}>
          --
          <div>{end().toLocaleString({ weekday: 'short', day: 'numeric' })}</div>
          <div class="flex flex-col">
            <button onClick={() => setEnd(end().plus({ months: 1 }))}>^</button>
            {end().toLocaleString({ month: 'short' })}
            <button onClick={() => setEnd(end().minus({ months: 1 }))}>v</button>
          </div>
          <div class="flex flex-col">
            <button onClick={() => setEnd(end().plus({ years: 1 }))}>^</button>
            {end().toLocaleString({ year: 'numeric' })}
            <button onClick={() => setEnd(end().minus({ years: 1 }))}>v</button>
          </div>
          <button onClick={() => setEnd(null)}>x</button>


        </Show>


      </div>
      <div class="flex gap-4 text-base text-black/50">
        <div>
          {/* <div class="grid grid-cols-6 gap-x-1">
            <For each={[...Array(12).keys()]}>
              {(i) => <button onClick={() => {
                setWindow(window().set({ month: i + 1 }))
              }} classList={{
                'border': i + 1 === now().month,
                underline: i + 1 === window().month,
                'font-bold text-black': i + 1 === begin()?.month,
              }}>{DateTime.fromObject({ month: i + 1 }).toLocaleString({ month: 'short' })}</button>}
            </For>
          </div> */}

          <div class="grid grid-cols-7">
            <For each={[...Array(begin().startOf('month').weekday - 1).keys()]}>
              {(i) => <div onClick={() => { }}></div>}
            </For>
            <For each={[...Array(begin().daysInMonth).keys()]}>
              {(i) =>
                <button classList={{
                  'border': (i === now().day - 1) && (begin().month === now().month) && (begin().year === now().year),
                  'font-bold text-black': (i === begin()?.day - 1),
                }} onClick={() => {
                  setBegin(DateTime.fromObject({ day: i + 1, month: begin().month, year: begin().year }))
                }}>{`${i + 1}`.padStart(2, '0')}</button>}
            </For>
          </div>
        </div>
        <div class="grid grid-cols-7 gap-1">
          <For each={clockFaceRotated}>
            {(c, index) =>
              <Switch fallback={<div />}>
                <Match when={clockFaceRotatedMask[index()] === 'h'}>
                  <button classList={{ 'border': (now().hour === parseInt(c)) && (begin().month === now().month) && (begin().day === now().day) && (begin().year === now().year) }} onClick={() => { }}>{c}</button>
                </Match>
                <Match when={clockFaceRotatedMask[index()] === 'm'}>
                  <button classList={{ 'text-red-600': now().minute === c }} onClick={() => { }}>{c}</button>
                </Match>
              </Switch>
            }
          </For>
        </div>
      </div>
    </div>
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
