import * as Y from 'yjs'
import { Sel } from './selection'
import { yDeleteFromArray, yIndex } from './utils'

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
    const lines = text.split('\n')
    if (lines.length === 1) {
        s.offset += text.length
        s.node.insert(s.offset - text.length, text)
    } else {
        s.node.doc!.transact(() => {
            const textafter = s.node.toString().slice(s.offset)
            const ll = lines.pop()
            lines.push(ll + textafter)
            const ylines = lines.slice(1).map(l => new Y.Text(l))
            // console.log(ylines)
            s.node.delete(s.offset, s.node.length - s.offset)
            s.node.insert(s.offset, lines[0])
            if (!s.node.parent) {
                s.node.doc?.getArray(ROOT_CHILDREN).unshift(ylines)
            } else if (s.node.parent instanceof Y.Map) {
                if (s.node.parent.has(CHILDREN)) {
                    s.node.parent.get(CONTENT).unshift(ylines)
                } else {
                    // list
                }
            } else if (s.node.parent instanceof Y.Array) {
                const index = s.node.parent.toArray().indexOf(s.node)
                s.node.parent.insert(index + 1, ylines)
            }
        })
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

const expandSelBackwards = (s: Sel) => {
    if (s.offset === 0) {
        if (s.node === s.node.doc!.getText(ROOT_TEXT)) { return }
        if (s.node.parent instanceof Y.Map && s.node.parent.parent instanceof Y.Array) {
            if (s.node.parent.has(CHILDREN)) {

            } else {

            }

        }

    } else {
        if (!s.focus) {
            s.focus = { node: s.node, offset: s.offset }
        }
        s.offset--
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

const findBranchBefore = (m : Y.Map<any>) => {
    if (m.parent instanceof Y.Array) {
        const index = m.parent.toArray().indexOf(m)
        if (index > 0) {
            return m.parent.get(index-1)
        } else {
            if (m.parent === m.doc?.getArray(ROOT_CHILDREN)) {
                const l = m.doc.getArray(ROOT_CHILDREN).length
                return m.doc.getArray(ROOT_CONTENT).get(l)
            }
        }
    }
}

const expandSelectionBackward = (s:Sel) => {
    if (!s.node.doc) { throw new Error('no doc')}
    if (!s.focus) {
        s.focus = {node:s.node,offset:s.offset}
    }
    if (s.offset !== 0) {
        s.offset--
    } else if (s.node.parent instanceof Y.Array) {
        const index = s.node.parent.toArray().indexOf(s.node)
        if (index > 0) {
            s.node = s.node.parent.get(index-1)
            s.offset = s.node.length
        } else if (s.node.parent.parent instanceof Y.Map) {
            s.node =  s.node.parent.parent.get(TEXT)
            s.offset = s.node.length
        } else if (s.node.parent === s.node.doc.getArray(ROOT_CONTENT)) {
            s.node = s.node.doc.getText(ROOT_TEXT)
            s.offset = s.node.length
        } else {
            throw new Error('unreachable')
        }
    } else if (s.node.parent instanceof Y.Map) {
        

    } else {
        throw new Error('unreachable')
    }
    if (s.focus.node === s.node && s.focus.offset === s.offset) {
        s.focus = null
    }
}
const getPath = (node: Y.AbstractType<any>): Y.AbstractType<any>[] => node.parent ? [node, ...getPath(node.parent)] : [node]
const getPathIntersection = (a: Array<any>, b: Array<any>) => a.find(x => b.includes(x))

const deleteSelection = (s: Sel) => {
    if (!s.focus) throw new Error('range is collapsed')
    const doc = s.node.doc
    if (!doc) { throw new Error('no doc') }
    const start = s.node
    const s_offset = s.offset
    const end = s.focus.node
    const e_offset = s.focus.offset
    s.focus = null
    const textbefore = start.toString().slice(0, s_offset)
    const textafter = end.toString().slice(e_offset)
    const start_path = getPath(start)
    const end_path = getPath(end)
    const intersection = getPathIntersection(start_path, end_path)

    s.focus = null
    doc.transact(() => {
        if (start === end) {
            start.delete(s_offset,start.length-e_offset)
        } else if (start.parent instanceof Y.Array && start.parent === end.parent) {
            // both in content 
            const s_index = start.parent.toArray().indexOf(start)
            const e_index = start.parent.toArray().indexOf(end)
            start.delete(s_offset,start.length - s_offset)
            start.parent.delete(s_index+1,e_index - s_index)
            start.insert(s_offset,textafter)
        } else if (end.parent instanceof Y.Array && ((start.parent && start.parent === end.parent.parent) || start === doc.getText(ROOT_TEXT) && end.parent === doc.getArray(ROOT_CONTENT))) {
            // starts in heading and ends in content
            const e_index = end.parent.toArray().indexOf(end)
            start.delete(s_offset,start.length-s_offset)
            end.parent.delete(0,e_index+1)
            start.insert(s_offset,textafter)
        } else if (intersection) {
            const s_path = start_path.slice(0, start_path.indexOf(intersection))
            const e_path = end_path.slice(0, end_path.indexOf(intersection))
            console.log(s_path.map(s => s.toJSON()), e_path.map(s => s.toJSON()))

        } else {
            const starts_in_text = start_path.at(-1) === doc.getText(ROOT_TEXT)
            const starts_in_content = start_path.at(-1) === doc.getArray(ROOT_CONTENT)
            const ends_in_content = start_path.at(-1) === doc.getArray(ROOT_CONTENT)
            const ends_in_children = start_path.at(-1) === doc.getArray(ROOT_CHILDREN)
            switch (true) {
                case starts_in_text && ends_in_content: {
                    return
                }
                case starts_in_text && ends_in_content: {
                    return
                }
                case starts_in_text && ends_in_content: {
                    return
                }
                default: throw new Error('paths broken')
            }
        }
    })
}

const split = (s: Sel) => {
    const node = s.node
    const offset = s.offset
    if (!node.doc) { throw new Error('selection node not in doc') }
    if (s.focus) { deleteSelection(s) }
    const paragraph = new Y.Text(node.toString().slice(offset))
    s.node = paragraph
    s.offset = 0
    if (!node.parent) {
        // root heading
        node.delete(offset, node.length - offset)
        node.doc.getArray(ROOT_CONTENT).unshift([paragraph])
    } else if (node.parent instanceof Y.Map) {
        if (node.parent.has(CHILDREN)) {
            // heading
            node.delete(offset, node.length - offset)
            node.parent.get(CONTENT).unshift([paragraph])
        }
    } else if (node.parent instanceof Y.Array) {
        const index = node.parent.toArray().indexOf(node)
        if (node.length === 0 && node.parent.parent !== s.root && node.parent.length - 1 === index) {
            if (node.parent.parent instanceof Y.Map && node.parent.parent.parent instanceof Y.Array) {
                let parent_index = node.parent.parent.parent.toArray().indexOf(node.parent.parent)
                if (node.parent.parent.has(CHILDREN)) {
                    const [section, location] = createSection(paragraph.toString())
                    s.node = location
                    s.offset = 0
                    node.parent.parent.parent.insert(parent_index, [section])
                } else {
                    // list 
                    return
                }
            }
        } else {
            s.node = paragraph
            s.offset = 0
            node.delete(offset, node.length - offset)
            node.parent.insert(index + 1, [paragraph])
        }
    }

}

const replaceText = (s: Sel, e: InputEvent) => {
    if (!s.focus) {
        // firefox doesn't select the word
        console.log('replaceText', e.dataTransfer)
        const line = s.node.toString()
        let start = s.offset
        let end = s.offset
        while (line[end] !== ' ' && line[end] !== '\n' && end <= line.length) { end++ }
        while (line[start] !== ' ' && line[start] !== '\n' && start >= 0) { start-- }
        start++
        s.offset = start
        s.focus = { node: s.node, offset: end }
    }
    const text = e.dataTransfer?.getData('text') ?? ' '
    console.log(text)
    insertText(s, text)
}

export const paste = (s: Sel, e: InputEvent) => {
    let data = e.dataTransfer
    if (!data) return
    let text = data.getData('text/plain')
    if (!text) return
    insertText(s, text)
}

/* INPUT HANDLERS */

export const beforeinputHandler = (e: InputEvent, s: Sel) => {
    e.preventDefault()
    const doc = s.node.doc
    if (!doc) { throw new Error('node not attacted to doc') }
    switch (e.inputType) {

        case 'insertLineBreak':
            return insertText(s, '\n')

        case 'insertText':
            return insertText(s, e.data!)

        case 'deleteContentBackward':
        case 'deleteWordBackward':
            return deleteContentBackward(s)

        case 'deleteContentForward':
        case 'deleteWordForward':
        case 'deleteContent':
            return deleteContent(s)

        case 'insertParagraph':
            return split(s)

        case 'insertReplacementText':
            return replaceText(s, e)

        case 'insertFromPaste':
            return paste(s, e)

        default:
            return
    }
}
