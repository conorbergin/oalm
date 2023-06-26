import * as Y from 'yjs'
import { genId } from './utils'
import { Editor } from './editorstate'

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


export const createTable = (s : string): [Y.Text, Y.Map<any>] => {
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
    return [ytext[0],table]
}


export const createTableView = (table : Y.Map<any>, editor: Editor) => {
    let t = document.createElement('table')
    let thead = document.createElement('thead')
    let order : string[]  = []
    table.get('header').forEach((h : Y.Map<any>) => {
        let th = document.createElement('th')
        th.appendChild(createTextView(h.get('name'), editor, 'p'))
        thead.appendChild(th)

        order.push(h.get('id').toString())
    })
    let tbody = document.createElement('tbody')
    table.get('items').forEach((item : Y.Map<any>) => {
        let tr = document.createElement('tr')
        order.forEach((id : string) => {
            let td = document.createElement('td')
            td.appendChild(createTextView(item.get(id), editor, 'p'))
            tr.appendChild(td)
        })
        tbody.appendChild(tr)
    })
    t.append(thead,tbody)
    

    let container = Object.assign(document.createElement('div'), { className: 'block-container' })
    let button = Object.assign(document.createElement('button'), { className: 'block-button', contentEditable: "false", textContent: '#', onpointerdown: (e: PointerEvent) => {} })
    container.append(button, t)
    return container

}

export const createTableView2 = (table : Y.Map<any>, editor: Editor) => {
    let t = document.createElement('div')
    t.className = 'table'
    let order : string[]  = []
    table.get('header').forEach((h : Y.Map<any>) => {
        let p = createTextView(h.get('name'), editor, 'p')
        p.classList.add('table-header')
        t.appendChild(p)

        order.push(h.get('id').toString())
    })
    table.get('items').forEach((item : Y.Map<any>) => {
        order.forEach((id : string) => {
            t.appendChild(createTextView(item.get(id), editor, 'p'))
        })
    })
    

    let container = Object.assign(document.createElement('div'), { className: 'block-container' })
    let button = Object.assign(document.createElement('button'), { className: 'block-button', contentEditable: "false", textContent: 't', onpointerdown: (e: PointerEvent) => {} })
    container.append(button, t)
    return container

}
