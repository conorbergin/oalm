import * as Y from 'yjs'
import { Sel } from './selection'

import { createTable } from './table'

// paragraphs and sections
export const TEXT = '!'
export const CONTENT = '$'
export const CHILDREN = '&'

// schedule
export const BEGIN = 'b'
export const DURATION = 'd'
// should a date have a duration?
export const END = 'e'

// archive
export const ARCHIVE = 'r'

//tables
export const HEADER = 'h'
export const ITEMS = 'i'
export const CAPTION = 'k'

// images or embedded content
export const CONTAINER = 'C' // contains several content things of the same type
export const IMAGE = 'I'
export const VIDEO = 'V'

export const createParagraph = (text: string): [Y.Map<any>, Y.Text] => {
    let f = new Y.Text(text)
    let m = new Y.Map()
    m.set(TEXT, f)
    m.set(CONTENT, new Y.Array())
    return [m, f]
}

export const createSection = (text: string): [Y.Map<any>, Y.Text] => {
    let m = new Y.Map()
    let f = new Y.Text(text)

    m.set(TEXT, f)
    m.set(CONTENT, new Y.Array())
    m.set(CHILDREN, new Y.Array())
    return [m, f]
}

const replaceContent = (s: Sel, m: Y.Map<any>, t: Y.Text) => {
    if (s.focus) return null
    if (s.node.parent.has(CHILDREN) || !s.node.parent.has(HEADING)) return


    let p = s.node.parent
    let i = p.parent.toArray().indexOf(p)

    s.node = t
    s.offset = 0

    p.doc!.transact(() => {
        p.parent.delete(i, 1)
        p.parent.insert(i, [m])
    })
}

const insertContent = (s: Sel, m: Y.Map<any>, t: Y.Text, movetext = false) => {
    if (s.focus) return null


    let o = s.offset
    let n = s.node
    let p = s.node.parent

    s.node = t
    s.offset = 0

    if (p.has(CHILDREN)) {
        p.doc!.transact(() => {
            movetext && n.delete(o, n.length - o)
            p.get(CONTENT).unshift([m])
        })
    } else if (p.has(CONTENT) && p.get(CONTENT).length > 0) {
        p.doc!.transact(() => {
            movetext && n.delete(o, n.length - o)
            p.get(CONTENT).unshift([m])
        })
    } else if (p.parent instanceof Y.Array) {
        let index = p.parent.toArray().indexOf(p)
        p.doc!.transact(() => {
            movetext && n.delete(o, n.length - o)
            p.parent.insert(index + 1, [m])
        })
    }

}



export const insertText = (s: Sel, text: string) => {
    if (s.focus) return null
    if (s.node instanceof Y.Text) {
        s.offset += text.length
        s.node.insert(s.offset - text.length, text)
        return
    }
    throw new Error('selection is not in a text node')
}


export const getSection = (node: Y.AbstractType<any>): Y.Map<any> => {
    console.log(node.toJSON())
    if (node instanceof Y.Map && node.has(CHILDREN)) {
        return node
    } else if (node.parent) {
        return getSection(node.parent)
    } else {
        throw new Error('No section found')
    }
}

export const addSection = (s: Sel) => {
    let p = getSection(s.node)
    let [n, f] = createSection('')
    s.node = f
    s.offset = 0
    p.get(CHILDREN).unshift([n])
}

export const addSibling = (s: Sel) => {
    let p = getSection(s.node)
    let [n, f] = createSection('')
    s.node = f
    s.offset = 0
    p.parent.insert(p.parent.toArray().indexOf(p.parent), [n])
}

export const deleteSection = (s: Sel) => {
    let node = getSection(s.node)
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


const insertList = (s: Sel) => {
    if (s.focus) return
    if (s.node.parent.has(TEXT)) {
        let par = s.node.parent
        let [n, f] = createParagraph('')
        s.node = f
        s.offset = 0
        par.get(CONTENT).unshift([n])
    }
}



export const insertParagraph = (s: Sel) => {
    if (s.focus) return null
    insertContent(s, ...createParagraph(''), true)
}


export const deleteContent = (s: Sel) => {
    if (s.focus) return null
    if (s.offset === s.node.length) {
        let p = s.node.parent!

        switch (true) {
            case p.has(TEXT):
                if (p.get(CONTENT).length > 0 ) {

                    let textafter = p.get(CONTENT).get(0).get(TEXT).toString()
                    let c = p.get(CONTENT).get(0).get(CONTENT).clone().toArray()
                    p.doc.transact(() => {
                        s.node.insert(s.node.length,textafter)
                        p.get(CONTENT).delete(0,1)
                        c.length > 0 && p.get(CONTENT).unshift(c)
                    })
                } else if (!p.has(CHILDREN)) {
                    let i = p.parent.toArray().indexOf(p)
                    if (i === p.parent.length -1) return
                    let next = p.parent.get(i+1)
                    let textbefore = s.node.toString()
                    s.node = next.get(TEXT)
                    s.offset = textbefore.length
                    next.doc?.transact(() => {
                        next.parent.delete(i)
                        next.get(TEXT).insert(0,textbefore)
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
//         while (s.get(CHILDREN).length > 0) {
//             s = s.get(CHILDREN).get(s.get(CHILDREN).length - 1)
//         }
//         return s
//     }
// }

const getLastContent = (node: Y.Map<any>): Y.Text => {
    switch (true) {
        case node.has(TEXT):
            if (node.get(CHILDREN) && node.get(CHILDREN).length > 0) {
                return getLastContent(node.get(CHILDREN).get(node.get(CHILDREN).length - 1))
            } else if (node.get(CONTENT) && node.get(CONTENT).length > 0) {
                return getLastContent(node.get(CONTENT).get(node.get(CONTENT).length - 1))
            } else {
                return node.get(TEXT)
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
            s.node = s.node.parent!.parent!.parent.get(TEXT)
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
            s.node = s.node.parent!.parent!.parent.get(TEXT)
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

export const toggleDone = (s: Sel) => {
    if (s.focus) return
    if (s.node.parent.has(TEXT)) {
        if (s.node.parent.has('done')) {
            s.node.parent.delete('done')
        } else {
            s.node.parent.set('done', '')
        }
    }
}

export const toggleArchive = (s: Sel) => {
    if (s.focus) return
    if (s.node.parent.has(TEXT)) {
        if (s.node.parent.has('r')) {
            s.node.parent.delete('r')
        } else {
            s.node.parent.set('r', '')
        }
    }
}


/* INPUT HANDLERS */

export const beforeinputHandler = (e: InputEvent, s: Sel) => {
    e.preventDefault()
    switch (e.inputType) {
        case 'insertText':
            if (s.node.length === 0) {
                switch (e.data) {
                    case '#':
                        addSection(s)
                        break
                    case '|':
                        // replaceContent(s, createTable)
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
            if (s.node.length === 0 && s.node.parent.has(TEXT) && !s.node.parent.has(CHILDREN) && (s.node.parent.parent.length === s.node.parent.parent.toArray().indexOf(s.node.parent)+1) && !s.node.parent.parent.parent.has(CHILDREN)) {
                let [n,f] = createParagraph('')
                let p = s.node.parent
                let pp = p.parent.parent

                s.node = f
                s.offset = 0
                
                pp.doc.transact(() => {
                    p.parent.delete(p.parent.toArray().indexOf(p),1)
                    pp.parent.insert(pp.parent.toArray().indexOf(pp)+1,[n])
                })

            } else {
                insertParagraph(s)
            }
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
            addSection(s)
            break
        case e.key === 'Enter' && e.ctrlKey:
            e.preventDefault()
            addSection(s)
            break
        case e.key === 'Enter' && e.shiftKey:
            e.preventDefault()
        case e.key === 'Backspace' && e.ctrlKey && e.shiftKey:
            e.preventDefault()
            // deleteSection(getSection(s.node))
            break
        case e.key === 'l' && e.ctrlKey:
            e.preventDefault()
            insertList(s)
            break
        case e.key === '1' && e.ctrlKey:
            e.preventDefault()
            // insertContent(s, createTable)
            break
        case e.key === '2' && e.ctrlKey:
            toggleDone(s)
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
