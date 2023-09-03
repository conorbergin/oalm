import { Accessor, Component, createSignal, For, Setter, Show, Switch, Match, onCleanup, createEffect, on, JSXElement } from 'solid-js'
import { Portal } from 'solid-js/web'
import * as Y from 'yjs'


import { Temporal } from '@js-temporal/polyfill'
import { ySignal } from './utils'
import { CHILDREN, CONTENT } from './input'

// const clockFaceRotated = [
//   '09', '10', '11', '12', '13', '14', '15',
//   '08', '', '', '', '', '', '16',
//   '07', '', '50', '00', '10', '', '17',
//   '06', '', '45', '', '15', '', '18',
//   '05', '', '40', '30', '20', '', '19',
//   '04', '', '', '', '', '', '20',
//   '03', '02', '01', '00', '23', '22', '21'
// ]

// const clockFaceRotatedMask = [
//   'h', 'h', 'h', 'h', 'h', 'h', 'h',
//   'h', '', '', '', '', '', 'h',
//   'h', '', 'm', 'm', 'm', '', 'h',
//   'h', '', 'm', '', 'm', '', 'h',
//   'h', '', 'm', 'm', 'm', '', 'h',
//   'h', '', '', '', '', '', 'h',
//   'h', 'h', 'h', 'h', 'h', 'h', 'h'
// ]

// const isoDurationString = 'PT3H30M'; // Duration
// const isoIntervalString = '2023-07-05T12:30:00Z/2023-07-06T12:30:00Z'; // Interval
// const isoDateTimeString = '2023-07-05T12:30:00Z'; // DateTime


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

Assignment:
{
  due: 28th,
  dependancies: [
    deliverable_A: {
      due: 20th,
      dependancies: [
        Finish research 1wk,
        clean up formatting 5hrs,
        write conclusion 10hrs,
    }
}


{ event
  begin : 20th,
  end: 28th,
  dependancies: [


}


type : begin | end | duration | begin&end | begin&duration | duration&end

begin [x] [date] next soon someday
duration [] [yr] [month] [week] [day] [hr] []
end [x]

*/
type TaskEvent = {
  type: string;
  begin?: string;
  end?: string;
  duration?:string;
}
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Dec']

const TASKEVENT = '10'

export const MaybeDT: Component<{ node: Y.Map<any> }> = (props) => {
  const [hasDT, setHasDT] = createSignal(props.node.has(TASKEVENT))

  const f = () => setHasDT(props.node.has(TASKEVENT))
  props.node.observe(f)
  onCleanup(() => props.node.unobserve(f))
  return (
    <Show when={hasDT()} fallback={
      <button class="text-gray-300" onClick={() => {
        props.node.set(TASKEVENT, { begin: { kind: 'none' }, end: { kind: 'none' } })
      }}>set task/event</button>
    }>
      <DTNode node={props.node} />
    </Show>
  )
}


const taskEventString = (t:TaskEvent) => {
  switch (t.type) {
    case DATEDATE: {
      const b = Temporal.PlainDate.from(t.begin!)
      const e = Temporal.PlainDate.from(t.end!)
      if (b.year !== e.year) return b.toLocaleString('en-GB',{day:'numeric',month:'short',year:'2-digit'}) + ' - ' + e.toLocaleString('en-GB',{day:'numeric',month:'short',year:'2-digit'})
      if (b.month !== e.month) return b.toLocaleString('en-GB',{day:'numeric',month:'short'}) + ' - ' + e.toLocaleString('en-GB',{day:'numeric',month:'short',year:'2-digit'})
      if (b.day !== e.day) return b.toLocaleString('en-GB',{day:'numeric'}) + ' - ' + e.toLocaleString('en-GB',{day:'numeric',month:'short',year:'2-digit'})
      return 'Error: Dates out of order'
    }
    default: return 'Default'
  }
}

const durationOptions = ['1w', '2w', '3w', '1m', '2m', '3m', '6m']
const vagueOptions = ['next', 'soon', 'someday']
const kindOptions = ['none', 'vague', 'date', 'duration']

const DATEDATE = 'dd'
const DATE = 'd'
const TASK = 't'



export const DTNode: Component<{ node: Y.Map<any> }> = (props) => {


  const date = ySignal(props.node, TASKEVENT)



  let r
  return (
    <>
      <button contentEditable={false} class="text-green-700 " classList={{
        'line-through text-gray-500': date().done,
      }} onClick={() => r.showModal()}>
        {taskEventString(date())}
        <Show when={!date().done}>
          <span class="text-gray-500">
            <DepTracker node={props.node} />
          </span>
        </Show>
      </button>
      <dialog class='text-sm font-normal' ref={r} onClick={() => r.close()}>
        <div onClick={e => e.stopImmediatePropagation()}>
          <DateSelector date={date()} node={props.node} />
        </div>
      </dialog>
    </>
  )
}

const TaskSelector: Component<{ date: any }> = (props) => {
  return (
    <>
      <div class='flex gap-1'>
        <div>Due:</div>
        <For each={vagueOptions}>
          {(item) => <button onClick={() => { }}>{item}</button>}
        </For>
        <input type='date'></input>
      </div>
      <div class='flex gap-1'>
        <div>
          Duration:
        </div>
        <For each={durationOptions}>
          {(item) => <button>{item}</button>}
        </For>
      </div>
    </>
  )
}

export const DateSelector: Component<{ date: any, node: Y.Map<any> }> = (props) => {

  return (
    <div class='flex-col gap-1 p-2'>
      <div class='flex gap-2'>
        <button onClick={() => props.node.set(TASKEVENT, { type: DATEDATE })}>date/date</button>
        <button onClick={() => props.node.set(TASKEVENT, { type: TASK })}>task</button>
      </div>
      <Switch>
        <Match when={props.date.type === TASK}>
          <div>
            Duration:
            <select>

            </select>
          </div>

        </Match>
        <Match when={props.date.type === 'date'}>
          <div>
            <div><input type='date' value={props.date.end} onChange={(e) => props.node.set(TASKEVENT, { type: props.date.type, begin: props.date.begin, end: e.target.value })} /> </div>
          </div>
        </Match>
        <Match when={props.date.type === DATEDATE}>
          <div>
            <div>Begin: <input type='date' value={props.date.begin} onChange={(e) => props.node.set(TASKEVENT, { type: props.date.type, begin: e.target.value, end: props.date.end })} /></div>
            <div>End: <input type='date' value={props.date.end} onChange={(e) => props.node.set(TASKEVENT, { type: props.date.type, begin: props.date.begin, end: e.target.value })} /></div>
          </div>
        </Match>
      </Switch>
    </div>
  )
}

export const DepTracker: Component<{ node: Y.Map<any> }> = (props) => {

  const [children, setChildren] = createSignal(props.node.get(CHILDREN).toArray())

  const [numerator, setNumerator] = createSignal(0)
  const [denominator, setDenominator] = createSignal(0)

  const f = () => {
    setChildren(props.node.get(CHILDREN).toArray())
    let n = 0, d = 0
    props.node.get(CONTENT).forEach((dep) => {
      if (dep.has(TASKEVENT)) {
        d += 1
        if (dep.get(TASKEVENT).status === 'done') {
          n += 1
        }
      }
    })
    setNumerator(n)
    setDenominator(d)
  }

  f()

  props.node.observeDeep(f)
  onCleanup(() => props.node.unobserveDeep(f))

  return denominator() > 0 ? `[${numerator()}/${denominator()}]` : ''
}

/* <Switch>
          <Match when={!isDate()}>
            <div class="grid grid-cols-4">
              <button>1hr</button>
              <button>2hr</button>
              <button>5hr</button>
              <button>1d</button>
              <button>2d</button>
              <button>1w</button>
              <button>2w</button>
              <button>1m</button>
              <button>2m</button>
              <button>3m</button>
            </div>
          </Match>
          <Match when={isDate()}>
            <div class="flex flex-col gap-4 text-base text-black/50">
              <div>
                <div class="grid grid-cols-6 gap-x-1">
                  <For each={[...Array(12).keys()]}>
                    {(i) => <button onClick={() => {
                      setWindow(window().with({ month: i + 1 }))
                    }} classList={{
                      'border': i + 1 === now().month,
                      underline: i + 1 === window().month,
                      'font-bold text-black': i + 1 === dt().month,
                    }}>{months[i]}</button>}
                  </For>
                </div>

                <div class="grid grid-cols-7 gap-1">
                  <For each={[...Array(window().with({ day: 1 }).dayOfWeek - 1).keys()]}>
                    {(i) => <div />}
                  </For>
                  <For each={[...Array(window().daysInMonth).keys()]}>
                    {(i) =>
                      <button classList={{
                        'border': (i === now().day - 1) && (window().month === now().month) && (window().year === now().year),
                        'font-bold text-black': (i === dt().day - 1),
                      }} onClick={() => {
                        props.node.set(TASKEVENT, Temporal.PlainDate.from({ day: i + 1, month: window().month, year: window().year }).toString())
                      }}>{`${i + 1}`.padStart(2, '0')}</button>}
                  </For>
                </div>
              </div>
            </div>
          </Match>
        </Switch> */