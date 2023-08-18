import { Accessor, Component, createSignal, For, Setter, Show, Switch, Match, onCleanup, createEffect, on, JSXElement } from 'solid-js'
import { Portal } from 'solid-js/web'
import * as Y from 'yjs'


import { Temporal } from '@js-temporal/polyfill'

import { Dialog } from './Dialog'




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
*/

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Nov', 'Dec']



export const MaybeDT: Component<{ node: Y.Map<any> }> = (props) => {
  const [hasDT, setHasDT] = createSignal(props.node.has('~'))

  const f = () => setHasDT(props.node.has('~'))
  props.node.observe(f)
  onCleanup(() => props.node.unobserve(f))
  return (
    <Show when={hasDT()} fallback={
      <button class="text-gray-300" onClick={() => {
        props.node.set('~', Temporal.Now.plainDateISO().toString())
      }}>set</button>
    }>
      <DTNode node={props.node} />
    </Show>
  )
}





export const DTNode: Component<{ node: Y.Map<any> }> = (props) => {

  const [show, setShow] = createSignal(false)
  const [done, setDone] = createSignal(false)
  const [hasChildren, setHasChildren] = createSignal(props.node.has('$'))

  const [dt, setDT] = createSignal(null)


  const f = () => {
    setDT(props.node.get('~'))
    setDone(props.node.get('done').toString() === 'true')
    setHasChildren(props.node.has('&'))
  }


  props.node.observe(f)
  onCleanup(() => props.node.unobserve(f))

  return (
    <div class="font-mono italic flex gap-2 align-top">
      <button class="text-green-700 italic" classList={{
        'line-through text-gray-500': done(),
      }} onClick={() => setShow(true)}>
        {'Toime'}
        <Show when={!done() && hasChildren()}>
          <span class="text-gray-500">

            <DepTracker node={props.node} />
          </span>
        </Show>
      </button>
      <Show when={show()}>
        <Dialog setShow={setShow}>
          <div>the Toime</div>
          <Switch>
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
                        'font-bold text-black': i + 1 === props.date.month,
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
                          'font-bold text-black': (i === props.date.day - 1),
                        }} onClick={() => {
                          props.node.set('~', Temporal.PlainDate.from({ day: i + 1, month: window().month, year: window().year }).toString())
                        }}>{`${i + 1}`.padStart(2, '0')}</button>}
                    </For>
                  </div>
                </div>
              </div>
            </Match>
          </Switch>

        </Dialog>
      </Show>
    </div>
  )
}

export const DepTracker: Component<{ node: Y.Map<any> }> = (props) => {

  const [children, setChildren] = createSignal(props.node.get('&').toArray())

  const [numerator, setNumerator] = createSignal(0)
  const [denominator, setDenominator] = createSignal(0)

  const f = () => {
    setChildren(props.node.get('$').toArray())
    let n = 0, d = 0
    props.node.get('$').forEach((dep) => {
      if (dep.has('~')) {
        d += 1
        if (dep.has('done')) {
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

