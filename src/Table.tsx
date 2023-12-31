import { Component, createSignal, For, onCleanup, Show } from 'solid-js'
import * as Y from 'yjs'
import { EditorState, ContentContainer } from './Editor'
import { ChartChooser } from './Charts'
import { Codemirror } from './Codemirror'
import { TextView } from './Text'

import { yArraySignal, yDeleteFromArray } from './utils'


let HEADER = 'header'
let ITEMS = 'items'


import { genId } from './utils'

// the table is a array of items, each item has a map of properties, ie {name: 'foo', price: 10}
// the properties are random ids to avoid conflicts, the actual names are stored in the header
// the header is an array of id name pairs ie {id: 'foo', name: 'Name'}
// the sortby property is the id of the property to sort by


export const createTableItem = (ids: string[]) => {
    let item = new Y.Map()
    ids.forEach(id => {
        item.set(id, new Y.Text(''))
    })
    return item
}


export const newTable = (s: string): [Y.Map<any>, Y.Text] => {
    let ids = [genId(8), genId(8)]
    let ytext = [new Y.Text(''), new Y.Text('')]
    let header = ids.map((id, index) => {
        let h = new Y.Map()
        h.set('id', id)
        h.set('name', ytext[index])
        return h
    })
    let table = new Y.Map()
    table.set('header', Y.Array.from(header))
    table.set('items', Y.Array.from([createTableItem(ids)]))
    return [table, ytext[0]]
}

export const addRow = (table: Y.Map<any>) => {
    console.log('add row')
    let items = table.get('items')
    let ids = table.get('header').map((h: Y.Map<any>) => h.get('id'))
    console.log(ids)
    items.push([createTableItem(ids)])
}

export const addColumn = (table: Y.Map<any>) => {
    console.log('add column')
    let header = table.get('header')
    let items = table.get('items')
    let id = genId(8)
    Y.transact(table.doc!, () => {
        let m = new Y.Map()
        m.set('id', id)
        m.set('name', new Y.Text(''))
        header.push([m])
        items.forEach((item: Y.Map<any>) => {
            item.set(id, new Y.Text(''))
        })
    })
}

export const deleteColumn = (table: Y.Map<any>, index: number) => {
    console.log('delete column')
    let header = table.get('header')
    let items = table.get('items')
    let id = header.get(index).get('id')
    Y.transact(table.doc!, () => {
        header.delete(index, 1)
        items.forEach((item: Y.Map<any>) => {
            item.delete(id)
        })
    })
}

export const deleteRow = (table: Y.Map<any>, index: number) => {
    console.log('delete row')
    let items = table.get('items')
    Y.transact(table.doc!, () => {
        items.delete(index, 1)
    })
}

export const fixTable = (table: Y.Map<any>) => {
    // for each key in the header, make sure there is a corresponding key in each item, if there are any keys in the items that are not in the header, delete them
    let header = table.get('header')
    let items = table.get('items')
    let headerIds = header.map((h: Y.Map<any>) => h.get('id'))
    items.forEach((item: Y.Map<any>) => {
        item.forEach((value: any, key: any) => {
            if (!headerIds.includes(key)) {
                item.delete(key)
            }
        })
        headerIds.forEach(id => {
            if (!item.has(id)) {
                item.set(id, new Y.Text(''))
            }
        })
    }
    )
}

export const TableView: Component<{ node: Y.Map<any>, state: EditorState }> = (props) => {

    let header = yArraySignal(props.node.get('header'))
    let rows = yArraySignal(props.node.get('items'))

    return (
            <div class='overflow-x-auto'>
                <div class="grid w-64 h-fit" style={{ "grid-template-columns": `repeat(${header().length}, minmax(5rem,max-content))`, }}>
                    <For each={header()}>
                        {(item, index) =>
                            <div classList={{ 'border-l': index() === 0 }} class="border-b border-r border-t border-black font-bold p-1">
                                <TextView node={item.get('name')} state={props.state} tag={'p'} />
                            </div>}
                    </For>
                    <For each={rows()}>
                        {(item) =>
                            <For each={header()}>{(header, index) =>
                                <div classList={{ 'border-l': index() === 0 }} class="border-b border-r p-1">
                                    <TextView node={item.get(header.get('id')) as Y.Text} state={props.state} tag={'p'} />
                                </div>}
                            </For>}
                    </For>
                </div>
            </div>
    )
}