

import { Component, createSignal, For, onCleanup, Show, Switch, Match } from "solid-js";
import * as Y from "yjs";
import { Codemirror } from "./Codemirror";
import { Dialog} from "./Dialog";
import { SwitchNode } from "./Pernot";
import { genId } from "./utils";
import * as Icons from "./Icons";

const alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

export const createOption = (name: string) => {
  let id = genId(8)
  let m = new Y.Map()
  m.set('id', id)
  m.set('name', new Y.Text(name))
  return m
}


const newField = (typ: string) => {
  let id = genId(8)
  let m = new Y.Map()
  m.set('name', new Y.Text(typ))

  m.set('id', id)
  m.set('typ', typ)
  switch (typ) {
    case 'enum':
      m.set('options', Y.Array.from([createOption('Option 1'), createOption('Option 2')]))
      break;
    case 'subtable':
      m.set('subtable', Y.Array.from([createOption('Option 1'), createOption('Option 2')]))
      break;
    case 'function':
      m.set('function', 'x => 2*x')
      m.set('args', new Y.Array())
      m.set('name', new Y.Text('Double'))
      break;
    default:
      break;
  }



  console.log(m.toJSON())
  return m
}


export const OptionList: Component<{ node: Y.Map<any> }> = (props) => {
  let [options, setOptions] = createSignal(props.node.get('options').toArray())
  const f = () => setOptions(props.node.get('options').toArray())
  props.node.get('options').observe(f)
  onCleanup(() => props.node.get('options').unobserve(f))

  return (
    <>
      <For each={options()}>
        {(option, index) => <><button onClick={() => props.node.get('options').delete(index(), 1)}>-</button><Codemirror ytext={option.get('name')} /></>}
      </For>
      <button onClick={() => props.node.get('options').push(createOption('new Option'))}>Add Option</button>
    </>
  )
}

export const FunctionEditor: Component<{ node: Y.Map<any>, fields: Array<Y.Map<any>> }> = (props) => {

  // let [args, setArgs] = createSignal(props.node.get('args').toArray())
  // const f = () => setArgs(props.node.get('args').toArray())
  // props.node.get('args').observe(f)
  // onCleanup(() => props.node.get('args').unobserve(f))

  const validArgs = () => props.fields.filter(f => f.get('typ') === 'number')

  return (
    <>
      <Codemirror ytext={props.node.get('function')} />
      <For each={validArgs()}>
        {(arg, index) => <>{alpha[index()]} : {arg.get('name').toString()}</>}
      </For>
    </>
  )
}


export const Field: Component<{ node: Y.Map<any>, fields: Array<Y.Map<any>> }> = (props) => {


  const [show, setShow] = createSignal(false)

  const [name, setName] = createSignal(props.node.get('name').toString())
  const f = () => setName(props.node.get('name').toString())
  props.node.get('name').observe(f)
  onCleanup(() => props.node.get('name').unobserve(f))
  return (
    <>
      <div>
        <button onClick={() => setShow(true)}>{name()}</button>
      </div>
      <Show when={show()}>
        <Dialog setShow={setShow}>
          <div>
            <Codemirror ytext={props.node.get('name')} />
            <Switch >
              <Match when={props.node.has('type') && props.node.get('type') === 'option'}>
                <OptionList node={props.node} />
              </Match>
              <Match when={props.node.has('type') && props.node.get('type') === 'function'}>
                <FunctionEditor node={props.node} fields={props.fields} />
              </Match>
            </Switch>

            <button onClick={() => setShow(false)}>Close</button>
          </div>
        </Dialog>
      </Show >
    </>
  )
}


export const GridView: Component<{ node: Y.Map<any> }> = (props) => {
  if (!props.node.has("header")) {
    props.node.set("header", new Y.Array())
  }

  const [fields, setFields] = createSignal([])
  const [arr, setArr] = createSignal([])

  let [show, setShow] = createSignal(false)

  let [showGraph, setShowGraph] = createSignal(false)



  const f = () => setFields(props.node.get('header').toArray())
  const g = () => setArr(props.node.get('&').toArray())

  f()
  g()

  props.node.get('header').observe(f)
  props.node.get('$').observe(g)
  onCleanup(() => {
    props.node.get('header').unobserve(f)
    props.node.get('$').unobserve(g)
  })


  return (
    <>
      <div class="flex overflow-auto">
        <div class="self-start grid gap-2" style={`grid-template-columns: repeat(${fields().length + 2}, minmax(auto, max-content)`} >
          <div class="font-bold">
            <Show when={props.node.has('!')}>
              <Codemirror ytext={props.node.get('!')} />
            </Show>
          </div>
          <For each={fields()}>
            {(item, index) => <div class="font-bold">
              <Field node={item} fields={fields()} />
            </div>}
          </For>
          <div>
            Date
          </div>
          <For each={arr()}>
            {(item, index) => <>
              <div>
                <Show when={item.has('!')}>
                  <Codemirror ytext={item.get('!')} />
                </Show>
              </div>
              <For each={fields()}>
                {(field) => <>
                  <Switch>

                    <Match when={field.get('typ') === 'function'}>
                      'todo'
                    </Match>
                    <Match when={field.get('typ') === 'option'}>
                      <MaybeOption node={item} field={field.get('id')} />
                    </Match>
                    <Match when={field.get('typ') === 'number'}>
                      <MaybeNumber node={item} field={field.get('id')} />
                    </Match>
                    <Match when={field.get('typ') === 'text'}>
                      <MaybeText node={item} field={field.get('id')} />
                    </Match>
                  </Switch>
                </>}
              </For>
              <div>
                date
              </div>


            </>}
          </For>
        </div>
        <div>
          <button onClick={() => setShow(true)}>
            <Icons.Plus />
          </button>
        </div>
        <Show when={show()}>
          <Dialog setShow={setShow}>
            <div class="flex flex-col gap-2">
              <div class="flex gap-2">
                <button onClick={() => props.node.get('header').push([newField('text')])}>Text</button>
                <button onClick={() => props.node.get('header').push([newField('number')])}>Number</button>
                <button onClick={() => props.node.get('header').push([newField('option')])}>Option</button>
                <button onClick={() => props.node.get('header').push([newField('function')])}>Function</button>
              </div>
              <div>
                <button onClick={() => setShow(false)}>Close</button>
              </div>
            </div>
          </Dialog>
        </Show>
      </div>
    </>
  )
}

const MaybeOption: Component<{ node: Y.Map<any>, field: string }> = (props) => {
  const [field, setField] = createSignal(props.node.has(props.field))
  const f = () => setField(props.node.has(props.field))
  props.node.observe(f)
  onCleanup(() => props.node.unobserve(f))

  return (
    <>
      <Show when={field()} fallback={
        <div class="bg-gray-100">

          <button onClick={() => props.node.set(props.field, 0)}><Icons.Plus /></button>
        </div>
      }>
        <div class="flex gap-1">
          <select value={props.node.get(props.field)} onChange={(e) => props.node.set(props.field, e.target.value)}>
            <For each={props.node.get('&')}>
              {(item, index) => <option value={index()}>{item}</option>}
            </For>
          </select>
        </div>
      </Show>
    </>
  )
}


const MaybeNumber: Component<{ node: Y.Map<any>, field: string }> = (props) => {
  const [field, setField] = createSignal(props.node.has(props.field))
  const f = () => setField(props.node.has(props.field))
  props.node.observe(f)
  onCleanup(() => props.node.unobserve(f))

  return (
    <>
      <Show when={field()} fallback={
        <div class="bg-gray-100">

          <button onClick={() => props.node.set(props.field, 0)}><Icons.Plus /></button>
        </div>
      }>
        <div class="flex gap-1">
          <input type="number" value={props.node.get(props.field)} onChange={(e) => props.node.set(props.field, parseInt(e.target.value))} />
        </div>
      </Show>
    </>
  )
}


const MaybeText: Component<{ node: Y.Map<any>, field: string }> = (props) => {
  const [field, setField] = createSignal(props.node.has(props.field))
  const f = () => setField(props.node.has(props.field))
  props.node.observe(f)
  onCleanup(() => props.node.unobserve(f))

  return (

    <>

      <Show when={field()} fallback={
        <div class="bg-gray-100">

          <button onClick={() => props.node.set(props.field, new Y.Text())}><Icons.Plus /></button>
        </div>
      }>
        <div class="flex gap-1">
          <Codemirror ytext={props.node.get(props.field)} />

        </div>
      </Show>
    </>
  )
}
