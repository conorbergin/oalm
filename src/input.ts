import * as Y from 'yjs'
import { Sel } from './selection'
import { paste } from './paste'
import { setMsg } from './Editor'


// paragraphs and sections
export const TEXT = '01'
export const CONTENT = '02'
export const CHILDREN = '03'

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
export const STEPSEQUENCER = 'S'

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

const ROOT_NODE = 'root_node'
const SECTION_NODE = 'section_node'
const PAINT_NODE = 'paint'

const getCursorContext = (s: Sel) => {
    if (s.node.parent === s.root) {
        return ROOT_NODE
    } else if ((s.node.parent as Y.Map<any>).has(CHILDREN)) {
        return SECTION_NODE
    } else if ((s.node.parent as Y.Map<any>).has('paint')) {
        return PAINT_NODE
    }
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
    // throw new Error('selection is not in a text node',s.node)
}

export const insertList = (s: Sel) => {
    if (s.focus) return null
    const m = new Y.Map()
    const [p, c] = createParagraph('')
    m.set('list', Y.Array.from([p]))
    if (!s.node.parent.has(CHILDREN)) {
        const p = s.node.parent
        const i = p.parent.toArray().indexOf(p)
        p.parent.insert(i + 1, [m])
    }
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
                if (p.has(CONTENT) && p.get(CONTENT).length > 0) {

                    let textafter = p.get(CONTENT).get(0).get(TEXT).toString()
                    let c = p.get(CONTENT).get(0).get(CONTENT).clone().toArray()
                    p.doc.transact(() => {
                        s.node.insert(s.node.length, textafter)
                        p.get(CONTENT).delete(0, 1)
                        c.length > 0 && p.get(CONTENT).unshift(c)
                    })
                } else if (!p.has(CHILDREN)) {
                    let i = p.parent.toArray().indexOf(p)
                    if (i === p.parent.length - 1) return
                    let next = p.parent.get(i + 1)
                    let textbefore = s.node.toString()
                    s.node = next.get(TEXT)
                    s.offset = textbefore.length
                    next.doc?.transact(() => {
                        next.parent.delete(i)
                        next.get(TEXT).insert(0, textbefore)
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
const getLastLocationInNode = (node: Y.Map<any>) => { }

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


/* INPUT HANDLERS */

export const beforeinputHandler = (e: InputEvent, s: Sel) => {
    e.preventDefault()
    switch (e.inputType) {
        case 'insertText':
            insertText(s, e.data!)
            break

        case 'deleteContentBackward':
        case 'deleteWordBackward':
            if (s.node instanceof Y.Map) {
                let o = s.node
                if (s.node.parent.toArray.indexOf(s.node) === 0) {
                    s.node = s.node.parent?.parent?.get(TEXT)
                    s.offset = s.node.length
                } else {
                    s.node = s.node.parent.get(s.node.parent.toArray().indexOf(s.node) - 1)
                    s.offset = s.node.length
                }
                o.parent.delete(o.parent.toArray().indexOf(o))
            }
            deleteContentBackward(s)
            break

        case 'deleteContentForward':
        case 'deleteWordForward':
        case 'deleteContent':
            deleteContent(s)
            break

        case 'insertParagraph':
            if (s.node instanceof Y.Map) {
                let t = new Y.Text('')
                let m = new Y.Map()
                m.set(TEXT, t)
                let o = s.node
                s.node = t
                o.parent.insert(o.parent.toArray().indexOf(o) + 1, [m])
            } else if (s.root === s.node.parent) {
                insertParagraph(s)
            } else if (s.node.length === 0 && (s.node.parent.parent.length === s.node.parent.parent.toArray().indexOf(s.node.parent) + 1)) {
                if (s.node.parent.parent.parent.has(CHILDREN)) {
                    let m = new Y.Map()
                    let t = new Y.Text('')
                    m.set(TEXT, t)
                    m.set(CONTENT, new Y.Array())
                    m.set(CHILDREN, new Y.Array())

                    let p = s.node.parent.parent.parent

                    s.node = t

                    p.doc!.transact(() => {
                        p.get(CONTENT).delete(p.get(CONTENT).length - 1, 1)
                        p?.parent?.parent.get(CHILDREN).insert(p.parent.parent.get(CHILDREN).toArray().indexOf(p) + 1, [m])
                    })
                } else {
                    let [n, f] = createParagraph('')
                    let p = s.node.parent
                    let pp = p.parent.parent

                    s.node = f
                    s.offset = 0

                    pp.doc.transact(() => {
                        p.parent.delete(p.parent.toArray().indexOf(p), 1)
                        pp.parent.insert(pp.parent.toArray().indexOf(pp) + 1, [n])
                    })
                }

            } else if (s.node.parent.has('name')) {
                let newRow = new Y.Map()
                s.node.parent.parent.parent.get('items').get(0).forEach((v, k) => {
                    newRow.set(k, new Y.Text(''))
                })
                s.node.parent.parent.parent.get('items').unshift([newRow])


            } else if (s.node.parent.parent.parent.has('items')) {
                let index = s.node.parent.parent.toArray().indexOf(s.node.parent)
                let newRow = new Y.Map()
                s.node.parent.parent.get(0).forEach((v, k) => {
                    newRow.set(k, new Y.Text(''))
                })
                s.node.parent.parent.insert(index + 1, [newRow])

            } else {
                insertParagraph(s)
            }
            break
        case 'insertReplacementText':
            // console.log('replaceText', e.dataTransfer)
            insertText(s, e.dataTransfer?.getData('text/plain'))
            break
        case 'insertFromPaste':
            console.log('paste', e)
            paste(s, e)
            break
        default:
            break
    }
}

