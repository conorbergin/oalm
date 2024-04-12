import { Accessor, Component, createSignal, For, Setter, Show, Switch, Match, onCleanup, createEffect, on, JSXElement, ErrorBoundary } from 'solid-js'
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



/*

*/

export type TaskEvent = {
  begin?: {
    date?: string,
    datetime?: string,
    duration?: string
  },
  end?: {
    date?: string,
    datetime?: string,
    vague?: string
  }
}
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Dec']

export const TASKEVENT = 'task-event'

const durationString = (t: string) => Temporal.Duration.from(t).toString().slice(1).toLowerCase()

const dateTimeString = (t: string, u?: string) => {
  if (u) {
    const b = Temporal.PlainDateTime.from(t)
    const e = Temporal.PlainDateTime.from(u)
    if (b.year !== e.year) return b.toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'short', year: '2-digit' }) + ' - ' + e.toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'short', year: '2-digit' })
    if (b.month !== e.month) return b.toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'short' }) + ' - ' + e.toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'short', year: '2-digit' })
    if (b.day !== e.day) return b.toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric', day: 'numeric' }) + ' - ' + e.toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'short', year: '2-digit' })
    return b.toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric' }) + ' - ' + e.toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'short', year: '2-digit' })
  } else {
    return Temporal.PlainDateTime.from(t).toLocaleString('en-GB', { minute: 'numeric', hour: 'numeric', day: 'numeric', month: 'short', year: '2-digit' })
  }
}

const dateString = (t: string, u?: string) => {
  if (u) {
    const b = Temporal.PlainDate.from(t)
    const e = Temporal.PlainDate.from(u)
    if (b.year !== e.year) return b.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) + ' - ' + e.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
    if (b.month !== e.month) return b.toLocaleString('en-GB', { day: 'numeric', month: 'short' }) + ' - ' + e.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
    if (b.day !== e.day) return b.toLocaleString('en-GB', { day: 'numeric' }) + ' - ' + e.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' })
    return 'Invalid date interval'
  } else {
    console.log(t)
    return Temporal.PlainDate.from(t).toLocaleString('en-GB', {day: 'numeric', month: 'short', year: '2-digit' })
  }
}


export const TaskEventString: Component<{ taskEvent: TaskEvent }> = (props) => {
  return (
    <Switch>
      <Match when={props.taskEvent.end?.date && props.taskEvent.begin?.date}><span class='text-green-600'>{dateString(props.taskEvent.begin!.date!, props.taskEvent.end!.date!)}</span></Match>
      <Match when={true}>
        <Show when={props.taskEvent.begin?.duration}><span class='text-orange-600'>{durationString(props.taskEvent.begin!.duration!)} </span></Show>
        <Show when={props.taskEvent.end?.date}>{dateString(props.taskEvent.end!.date!)}</Show>
        <Show when={props.taskEvent.end?.vague}><span class='text-blue-600'>{props.taskEvent.end!.vague!.toUpperCase()}</span></Show>
      </Match>
    </Switch>
  )
}

const durationOptions = ['P1D', 'P2D', 'P4D', 'P7D', 'P15D', 'P20D', 'P1M', 'P2M', 'P3M', 'P4M', 'P6M', 'P9M']
const vagueOptions = ['urgent', 'next', 'soon', 'someday']
const kindOptions = ['none', 'vague', 'date', 'duration']

const DATEDATE = 'dd'
const DATE = 'd'
const TASK = 't'



export const MaybeDT: Component<{ node: Y.Map<any> }> = (props) => {


  const date = ySignal(props.node, TASKEVENT)
  // if (date()?.begin?.duration) props.node.delete(TASKEVENT)
  console.log(date())
  let r
  return (
    <>
      <button contentEditable={false} class="text-gray-400 " classList={{
        'text-green-700': date(),
      }} onClick={() => r.showModal()}>
        <Show when={date()} fallback={'set task/event'} ><TaskEventString taskEvent={date()} /></Show>
        <Show when={false}>
          <span class="text-gray-500">
            <DepTracker node={props.node} />
          </span>
        </Show>
      </button>
      <dialog class='text-sm font-normal' ref={r} onClick={() => r.close()}>
        <div onClick={e => e.stopImmediatePropagation()}>
          <TaskEventPicker date={date()} node={props.node} />
        </div>
      </dialog>
    </>
  )
}


export const DateSelector: Component<{ date: any, node: Y.Map<any> }> = (props) => {
  const [screen, setScreen] = createSignal(0)

  return (
    <div class='flex-col gap-1 p-2 '>
      <div class='flex gap-2 justify-center'>
        <button classList={{ 'text-gray-500': screen() !== 0 }} onClick={() => setScreen(0)}>event</button>
        <button classList={{ 'text-gray-500': screen() !== 1 }} onClick={() => setScreen(1)}>task</button>
        <button classList={{ 'text-gray-500': screen() !== 1 }} onClick={() => props.node.delete(TASKEVENT)}>clear</button>
      </div>
      <Switch>
        <Match when={screen() === 0}>
          <div class='grid gap-1 items-center' style='grid-template-columns: 5rem 12rem 5rem'>
            <div class='text-end'>Begin: </div>
            <input disabled={!props.date?.end} max={(props.date?.end) ? props.date.end : ''} type='date' value={(props.date?.begin) ? props.date.begin : ''} onChange={(e) => props.node.set(TASKEVENT, { begin: e.target.value, end: props.date.end })} />
            <button onClick={() => props.node.set(TASKEVENT, { end: props.date.end })}>clear</button>
            <div class='text-end'>End: </div>
            <input type='date' value={(props.date?.end) ? props.date.end : ''} min={(props.date?.begin) ? props.date.begin : ''} onChange={(e) => props.node.set(TASKEVENT, { ...(props.date && props.date.begin && { begin: props.date.begin }), end: e.target.value })} />
          </div>
        </Match>
        <Match when={screen() === 1}>
          <div>
            Duration: TODO
          </div>
        </Match>
      </Switch>
    </div>
  )
}


const cleverDateSetter = (node: Y.Map<any>, taskEvent: TaskEvent | null, date: string) => {

  if (taskEvent?.begin?.date && taskEvent?.end?.date) {
    const midpoint = Temporal.PlainDate.from(taskEvent.begin.date).add({ days: Math.round(Temporal.PlainDate.from(taskEvent.end.date).since(Temporal.PlainDate.from(taskEvent.begin.date)).days / 2) }).toString()
    if (date === taskEvent.begin.date) {
      node.set(TASKEVENT, { end: taskEvent.end })
    } else if (date === taskEvent.end.date) {
      node.set(TASKEVENT, { begin: taskEvent.begin })
    } else if (date > midpoint) {
      node.set(TASKEVENT, { begin: taskEvent.begin, end: { date: date } })
    } else {
      node.set(TASKEVENT, { begin: { date: date }, end: taskEvent.end })
    }
  } else if (taskEvent?.end?.date) {
    if (date > taskEvent.end.date) {
      node.set(TASKEVENT, { begin: taskEvent.end, end: { date: date } })
    } else if (date === taskEvent.end.date) {
      node.delete(TASKEVENT)
    } else {
      node.set(TASKEVENT, { begin: { date: date }, end: taskEvent.end })
    }
  } else {
    node.set(TASKEVENT, { end: { date: date } })
  }
}

const cleverDurationSetter = (node: Y.Map<any>, taskEvent: TaskEvent | null, duration: string) => {
  if (taskEvent?.begin?.duration === duration) {
    taskEvent.end ? node.set(TASKEVENT, { end: taskEvent.end }) : node.delete(TASKEVENT)
  } else {
    node.set(TASKEVENT, { begin: { duration: duration }, ...(taskEvent?.end && { end: taskEvent.end }) })
  }
}

const cleverVagueSetter = (node: Y.Map<any>, taskEvent: TaskEvent | null, vague: string) => {
  if (taskEvent?.end?.vague === vague) {
    taskEvent.begin ? node.set(TASKEVENT, { begin: taskEvent.begin }) : node.delete(TASKEVENT)
  } else {
    node.set(TASKEVENT, { end: { vague: vague }, ...(taskEvent?.begin && { begin: taskEvent.begin }) })
  }
}

const getLastDaysOfLastMonth = (date: Temporal.PlainDate) => {
  const lastDayOfLastMonth = date.with({ day: 1 }).subtract({ days: 1 })
  const lastMondayOfLastMonth = lastDayOfLastMonth.subtract({ days: lastDayOfLastMonth.dayOfWeek })
  return Array.from({ length: date.subtract({ months: 1 }).daysInMonth - lastMondayOfLastMonth.day }, (_, index) => lastMondayOfLastMonth.day + index + 1)
}

const getDaysOfCurrentMonth = (date: Temporal.PlainDate) => Array.from({ length: date.daysInMonth }, (_, index) => index + 1)

const getFirstDaysOfNextMonth = (date: Temporal.PlainDate) => {
  const firstDayOfNextMonth = date.add({ months: 1 }).with({ day: 1 })
  const firstSundayOfNextMonth = firstDayOfNextMonth.add({ days: 7 - firstDayOfNextMonth.dayOfWeek })
  return Array.from({ length: firstSundayOfNextMonth.day }, (_, index) => index + 1)
}

export const TaskEventPicker: Component<{ date: TaskEvent, node: Y.Map<any> }> = (props) => {
  const now = Temporal.Now.plainDateISO()
  const [monthWindow, setMonthWindow] = createSignal(now)

  const [beginDate, setBeginDate] = createSignal<null | Temporal.PlainDate>(null)
  const [endDate, setEndDate] = createSignal<null | Temporal.PlainDate>(null)

  createEffect(() => {
    setBeginDate(props.date?.begin?.date ? Temporal.PlainDate.from(props.date.begin.date) : null)
    setEndDate(props.date?.end?.date ? Temporal.PlainDate.from(props.date.end.date) : null)
  })

  return (
    <div class='flex flex-col gap-1 text-gray-500 font-bold'>
      <div class='grid grid-cols-6 gap-1'>
        <For each={durationOptions}>
          {item => <button onClick={() => cleverDurationSetter(props.node, props.date, item)} classList={{ 'text-black': props.date?.begin?.duration === item }} >{item.slice(1).toLowerCase()}</button>}
        </For>
      </div>
      <div class='flex gap-1'>
        <For each={vagueOptions}>
          {item => <button onClick={() => cleverVagueSetter(props.node, props.date, item)} classList={{ 'text-black': props.date?.end?.vague === item }} >{item}</button>}
        </For>
      </div>
      <hr />
      <div class='flex gap-1 justify-between'>
        <button onClick={() => setMonthWindow(d => d.subtract({ months: 1 }))}>&lt;</button>
        <div>{monthWindow().toLocaleString('en-GB', { month: 'long', year: 'numeric' })}</div>
        <button onClick={() => setMonthWindow(d => d.add({ months: 1 }))}>&gt;</button>
      </div>
      <div class='grid gap-1 grid-cols-7'>
        <For each={getLastDaysOfLastMonth(monthWindow())}  >{item => <button classList={{ 'text-black': beginDate()?.equals(monthWindow().subtract({ months: 1 }).with({ day: item })) || endDate()?.equals(monthWindow().subtract({ months: 1 }).with({ day: item })) }} onClick={() => cleverDateSetter(props.node, props.date, monthWindow().subtract({ months: 1 }).with({ day: item }).toString())}>{item}</button>}</For>
        <For each={getDaysOfCurrentMonth(monthWindow())}   >{item => <button classList={{ 'text-black': beginDate()?.equals(monthWindow().with({ day: item })) || endDate()?.equals(monthWindow().with({ day: item })) }} onClick={() => cleverDateSetter(props.node, props.date, monthWindow().with({ day: item }).toString())}>{item}</button>}</For>
        <For each={getFirstDaysOfNextMonth(monthWindow())} >{item => <button classList={{ 'text-black': beginDate()?.equals(monthWindow().add({ months: 1 }).with({ day: item })) || endDate()?.equals(monthWindow().add({ months: 1 }).with({ day: item })) }} onClick={() => cleverDateSetter(props.node, props.date, monthWindow().add({ months: 1 }).with({ day: item }).toString())}>{item}</button>}</For>
      </div>
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