import * as Y from 'yjs'
import { genId } from './utils'

// the table is a array of items, each item has a map of properties, ie {name: 'foo', price: 10}
// the properties are random ids to avoid conflicts, the actual names are stored in the header
// the header is an array of id name pairs ie {id: 'foo', name: 'Name'}
// the sortby property is the id of the property to sort by


export const createTableItem = (ids : string[]) => {
    let item = new Y.Map()
    ids.forEach(id => {
        item.set(id, new Y.Text(''))
    })
    return item
}


export const createTable = (s : string): [Y.Map<any>,Y.Text] => {
    let ids = [genId(8), genId(8)]
    let ytext = [new Y.Text(''), new Y.Text('')]
    let header = ids.map((id,index) => {
        let h = new Y.Map()
        h.set('id', id)
        h.set('name', ytext[index])
        return h
    })
    let table = new Y.Map()
    table.set('role', 'table')
    table.set('header', Y.Array.from(header))
    table.set('items', Y.Array.from([createTableItem(ids)]))
    return [table,ytext[0]]
}

