import * as Y from 'yjs'
import { Sel, selectionFromDom } from './selection'
import { yIndex } from './utils'

import { createTable } from './table'



export const insertText = (s: Sel, text: string) => {
    if (s.focus) return null
    if (s.node instanceof Y.Text) {
        s.offset += text.length
        s.node.insert(s.offset - text.length, text)
        return
    }
    throw new Error('selection is not in a text node')
}

export const createParagraph = (text: string): [Y.Text, Y.Map<any>] => {
    let ytext = new Y.Text(text)
    let m = new Y.Map()
    m.set('heading', ytext)
    return [ytext, m]
}

export const createSection = () => {
    let m = new Y.Map()

    m.set('heading', new Y.Text(''))
    m.set('content', Y.Array.from([createParagraph('')[1]]))
    m.set('children', new Y.Array())
    m.set('role', 'section')
    return m
}

export const getSection = (node: Y.AbstractType<any>): Y.Map<any> => {
    console.log(node.toJSON())
    if (node instanceof Y.Map && node.has('children')) {
        return node
    } else if (node.parent) {
        console.log('has parent')
        return getSection(node.parent)
    } else {
        throw new Error('No section found')
    }
}

export const addSection = (node) => {
    node = getSection(node)
    node.get('children').unshift([createSection()])
}

export const addSibling = (node) => {
    node = getSection(node) || null
    if (!node.parent) return
    node.parent.insert(node.parent.toArray().indexOf(node.parent), [createSection()])
}

export const deleteSection = (node) => {
    node = getSection(node)
    if (!node.parent) return
    node.parent.delete(node.parent.toArray().indexOf(node))
}

export const deleteNode = (node) => {
    if (node.parent instanceof Y.Array) {
        let index = node.parent.toArray().indexOf(node)
        if (index !== -1) {
            node.parent.delete(index)
        }
    }
}


const replaceContent = (s: Sel, nodeBuilder: (s: string) => [Y.Text, Y.Map<any> | Y.Text]) => {
    if (s.focus) return null
    if (s.node.parent.has('children') || s.node.parent.has('header')) return 

    let [firstCaretLocation, node] = nodeBuilder('')

    let p = s.node.parent
    let i = p.parent.toArray().indexOf(p)

    s.node = firstCaretLocation
    s.offset = 0

    p.doc!.transact(() => {
        p.parent.delete(i, 1)
        p.parent.insert(i, [node])
    })
}

const insertContent = (s: Sel, nodeBuilder: (s: string) => [Y.Text, Y.Map<any> | Y.Text], movetext = false) => {
    if (s.focus) return null

    
    let o = s.offset
    let n = s.node
    let p = s.node.parent
    
    let [cl, nn] = nodeBuilder(movetext ? s.node.toString().slice(s.offset) : '')
    
    s.node = cl
    s.offset = 0

    if (p.has('children')) {
        p.doc!.transact(() => {
            movetext && n.delete(o,n.length - o)
            p.get('content').unshift([nn]) 
        })
    } else if (p.parent instanceof Y.Array) {
        let index = p.parent.toArray().indexOf(p)
        p.doc!.transact(() => {
            movetext && n.delete(o,n.length - o)
            p.parent.insert(index+1, [nn])
        })
    }

}



export const insertParagraph = (s: Sel) => {
    if (s.focus) return null
    insertContent(s,createParagraph,true)
}


export const deleteContent = (s: Sel) => {
    if (s.focus) return null
    if (s.offset === s.node.length) {
        let p = s.node.parent!

        switch (true) {
            case p.has('heading') && !p.has('content') && !p.has('children') && p.parent instanceof Y.Array:
                let index = p.parent.toArray().indexOf(p)
                let next = p.parent.get(index + 1)
                if (next.has('heading') && !next.has('content')) {
                    let text = next.get('heading').toString()
                    p.doc.transact(() => {
                        s.node.insert(s.node.length-1,text)
                        p.parent.delete(index+1,1)
                    })
                }
                return
            default:
                return
        }

    } else {
        s.node.delete(s.offset, 1)
    }
}

// const getPrevSection = (node: Y.Map<any>) => {
//     if (node.get('role') !== 'section') return null
//     let p = node.parent!
//     let index = p.toArray().indexOf(node)
//     if (index === 0) {
//         return p.parent
//     } else {
//         let s = p.get(index - 1)
//         while (s.get('children').length > 0) {
//             s = s.get('children').get(s.get('children').length - 1)
//         }
//         return s
//     }
// }

const getLastContent = (node: Y.Map<any>): Y.Text => {
    switch (true) {
        case node.has('heading'):
            if (node.get('children') && node.get('children').length > 0) {
                return getLastContent(node.get('children').get(node.get('children').length - 1))
            } else if (node.get('content') && node.get('content').length > 0) {
                return getLastContent(node.get('content').get(node.get('content').length - 1))
            } else {
                return node.get('heading')
            }
        case node.has('header'):
            let lastRow = node.get('items').get(node.get('items').length - 1)
            let lastCell = node.get('header').get(node.get('header').length - 1)
            return lastRow.get(lastCell.get('id'))
        default:
            throw new Error('invalid node', node.toJSON())
    }
}

const moveSelBackward = (s: Sel) => {
    if (s.offset === 0) {
        let arr = s.node.parent!.parent!.toArray()
        let index = arr.indexOf(s.node.parent!)
        if (index === 0) {
            s.node = s.node.parent!.parent!.parent.get('heading')
            s.offset = s.node.length
        } else {
            s.node = getLastContent(arr[index - 1])
            s.offset = s.node.length
        }
    } else {
        s.offset--
    }
}

const moveSelForward = (s: Sel) => {
    if (s.offset === s.node.length) {
        let arr = s.node.parent!.parent!.toArray()
        let index = arr.indexOf(s.node.parent!)
        if (index === arr.length - 1) {
            s.node = s.node.parent!.parent!.parent.get('heading')
            s.offset = 0
        } else {
            s.node = getLastContent(arr[index + 1])
            s.offset = 0
        }
    } else {
        s.offset++
    }
}

const deleteContentBackward = (s: Sel) => {
    if (s.focus) {
        deleteContent(s)
    } else {
        moveSelBackward(s)
        deleteContent(s)
    }
}


/* INPUT HANDLERS */

export const beforeinputHandler = (e: InputEvent, s: Sel) => {
    e.preventDefault()
    switch (e.inputType) {
        case 'insertText':
            if (s.node.length === 0) {
                switch (e.data) {
                    case '|':
                        replaceContent(s, createTable)
                        break
                    case '#':
                        addSection(s.node)
                        break
                    default:
                        insertText(s, e.data!)
                        break
                }
            } else {
                insertText(s, e.data!)
            }
            break

        case 'deleteContentBackward':
            deleteContentBackward(s)
            break

        case 'deleteContentForward':
            deleteContent(s)
            break

        case 'insertParagraph':
            insertParagraph(s)
            break
        // case 'insertReplacementText':
        //     console.log('replaceText', e)
        //     insertText(s, e.data!)
        //     break
        default:
            break
    }
}

export const keydownHandler = (e: KeyboardEvent, s: Sel) => {
    switch (true) {

        case e.key === 'Enter' && e.shiftKey && e.ctrlKey:
            e.preventDefault()
            addSection(s.node)
            break
        case e.key === 'Enter' && e.ctrlKey:
            e.preventDefault()
            addSection(s.node)
            break
        case e.key === 'Enter' && e.shiftKey:
            e.preventDefault()
        case e.key === 'Backspace' && e.ctrlKey && e.shiftKey:
            e.preventDefault()
            deleteSection(getSection(s.node))
            break
        case e.key === 'l' && e.ctrlKey:
            e.preventDefault()
            insertContent(s, createItem)
            break
        case e.key === '1' && e.ctrlKey:
            e.preventDefault()
            console.log('inset table')
            insertContent(s, createTable)
            break
        case e.key === 'b' && e.ctrlKey:
            e.preventDefault()
            break
        case e.key === 'i' && e.ctrlKey:
            e.preventDefault()
            break
        default:
            break
    }
}
