import * as Y from 'yjs'
import { Sel } from './selection'
import { paste } from './paste'
import { yDeleteFromArray } from './utils'

// paragraphs and sections
export const ROOT_TEXT = 'oalm-01'
export const ROOT_CONTENT = 'oalm-02'
export const ROOT_CHILDREN = 'oalm-03'
export const TEXT = '01'
export const CONTENT = '02'
export const CHILDREN = '03'

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

// export const createList = (text: string): [Y.Map<any>, Y.Text] => {
//     const m = new Y.Map()
//     const [p, c] = createParagraph('')
//     m.set(CONTENT, Y.Array.from([p]))
//     return [m,c]
// }

export const insertText = (s: Sel, text: string) => {
    if (s.focus) { deleteSelection(s) }
    if (s.node instanceof Y.Text) {
        s.offset += text.length
        s.node.insert(s.offset - text.length, text)
        return
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

export const deleteContent = (s: Sel) => {
    if (s.focus) {
        deleteSelection(s)
    } else if (s.offset === s.node.length) {
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

const deleteContentBackward = (s: Sel) => {
    if (s.focus) {
        deleteSelection(s)
    } else {
        moveSelBackward(s)
        deleteContent(s)
    }
}

const deleteSelection = (s: Sel) => {
    if (!s.focus) throw new Error('range is collapsed')
    if (s.focus.node === s.node) {
        const start = s.offset
        const end = s.focus.offset
        s.focus = null
        s.node.delete(start, end - start)
    } else if (!s.node.parent) {
        //selection starts in ROOT_TEXT
        if (!s.focus.node.parent!.parent!.parent) {
            if (s.focus.node.parent.parent.has(CHILDREN)) {
                //
            } else {
                //
            }
        } else {
            
        }

    } else if (s.node.parent.parent === s.focus.node.parent!.parent) {
        if (s.node.parent.has(CHILDREN)) {
            const textbefore = s.node.toString().slice(0,s.offset)
            const parent1 = s.node.parent
            const parent2 = s.focus.node.parent
            const index1 = parent1.parent.toArray().indexOf(parent1)
            const index2 = parent2.parent.toArray().indexOf(parent2)
            const focus = s.focus.node
            const focus_offset = s.focus.offset
            s.node = focus
            s.offset = textbefore.length
            s.focus = null
            parent1.parent.delete(index1,index2-index1)
            focus.delete(0,focus_offset)
            focus.insert(0,textbefore)

        } else {
            const parent_array = s.node.parent.parent as Y.Array<any>
            const i1 = parent_array.toArray().indexOf(s.node.parent)
            const i2 = parent_array.toArray().indexOf(s.focus.node.parent)
            const textafter = s.focus.node.toString().slice(s.focus.offset)
            s.focus = null
            s.node.delete(s.offset,s.node.length-s.offset)
            parent_array.delete(i1+1,i2-i1)
            s.node.insert(s.node.length,textafter)
        }
    }
}

/* INPUT HANDLERS */

export const beforeinputHandler = (e: InputEvent, s: Sel) => {
    e.preventDefault()
    const doc = s.node.doc
    if (!doc) { throw new Error('node not attacted to doc')}
    switch (e.inputType) {
        case 'insertLineBreak':
            insertText(s, '\n')
            break
        case 'insertText':
            insertText(s, e.data!)
            break

        case 'deleteContentBackward':
        case 'deleteWordBackward':
            deleteContentBackward(s)
            break

        case 'deleteContentForward':
        case 'deleteWordForward':
        case 'deleteContent':
            deleteContent(s)
            break

        case 'insertParagraph':
            if (s.focus) { deleteSelection(s) }
            const node = s.node
            const offset = s.offset
            const textafter = offset < node.length ? node.toString().slice(offset) : ''
            const [paragraph, cursor] = createParagraph(textafter)
            s.node = cursor
            s.offset = 0
            if (node === doc.getText(ROOT_TEXT)) {
                textafter && node.delete(offset, node.length)
                doc.getArray(ROOT_CONTENT).unshift([paragraph])
            } else if (node.parent instanceof Y.Map) {
                if (node.parent.has(CHILDREN)) {
                    textafter && node.delete(offset, node.length)
                    node.parent.get(CONTENT).unshift([paragraph])
                } else if (node.parent.parent instanceof Y.Array) {
                    let index = node.parent.parent.toArray().indexOf(node.parent)
                    if (node.length === 0 && node.parent.parent.parent && node.parent.parent.parent !== s.root && index === node.parent.parent.length - 1) {
                        const section = node.parent.parent.parent
                        if (section.parent instanceof Y.Array) {
                            const section_index = section.parent.toArray().indexOf(section)
                            const [new_section, cursor] = createSection(textafter)
                            s.node = cursor
                            s.offset = 0
                            section.parent.insert(section_index + 1, [new_section])
                            node.parent.parent.delete(index)
                        } else {
                            throw new Error('unreachable')
                        }
                    } else {
                        textafter && node.delete(offset, node.length)
                        node.parent.parent.insert(index + 1, [paragraph])
                    }
                } else {
                    throw new Error('unreachable')

                }
            }
            break
        case 'insertReplacementText':
            // console.log('replaceText', e.dataTransfer)
            // const line = s.node.toString()
            // let start = s.offset
            // let end = s.offset
            // while (line[end] !== ' ' && line[end] !== '\n' && end <= line.length) {end++}
            // while (line[start] !== ' ' && line[start] !== '\n' && start >= 0 ) {start--}
            // start++
            // s.offset = start
            // s.node.delete(start,end-start)
            const text = e.dataTransfer?.getData('text') ?? ' '
            console.log(text)
            insertText(s, text)
            break
        case 'insertFromPaste':
            console.log('paste', e)
            paste(s, e)
            break
        default:
            break
    }
}

