import { Component, onCleanup } from 'solid-js'
import * as Y from 'yjs'
import { TEXT } from './input'
import { ContentContainer, EditorState } from './Editor'
import { yDeleteFromArray } from './utils'


// VALID CASES 
// *hello*  _goodbye_ *_hello_* *[link]*
// INVALID CASES
// *hello*goodbye 
const isWhitespace = (s: string) => s === ' ' || s === '/t' || s === '/n'
const isPunctuation = (s: string) => s === '.' || s === ',' || s === '!'
const isValidLeft = (l: string, r: string) => (isWhitespace(l) || l === '') && !isWhitespace(r)
const isValidRight = (l: string, r: string) => !isWhitespace(l) && isWhitespace(r)

const STRONG = '*'
const EMPH = '_'
const LBRKT = '['
const RBRKT = ']'

const buildElement = (s:string) => {
    switch (s[0]) {
        case '`': return Object.assign(document.createElement('code'),{textContent:s})
        case '[': return Object.assign(document.createElement('a'),{textContent:s,href:s.slice(1,-1)})
        case '*':
        case '_':
            let el = document.createElement(s[0] === '*' ? 'strong' : 'em')
            el.append(s[0],...highlight3(s.slice(1,-1)),s[0])
            return el
        default:
            return s
    }
}


export const highlight3 = (s: string) => {
    const openers = '*_`['
    const matchOpener = (s:string) => {
        switch (s) {
            case '*': return '*'
            case '_': return '_'
            case '`': return '`'
            case '[': return ']'
        }
    }


    if (s === '') return [document.createElement('br')]
    let r: Array<string | Node> = []
    let i = 0
    let b = 0

    if ((s[0] === '_' || s[0] === 'x') && s[1] === ' ') {
        if (s[0] === '_') {
            r.push(Object.assign(document.createElement('span'),{textContent:'☐',className:'unchecked'}))
        } else {
            r.push(Object.assign(document.createElement('span'),{textContent:'☒',className:'checked'}))
        }
        i++
        b++
    }


    while (i < s.length) {
        if (openers.includes(s[i]) && (i == 0 || isWhitespace(s[i - 1]))) {
            let success = false
            for (let j = i + 1; j < s.length; j++) {
                if ( s[j] === matchOpener(s[i]) 
                        && (j === s.length - 1 || isWhitespace(s[j + 1]) || isPunctuation(s[j + 1])) ) {
                    if (b !== i) {
                        r.push(s.slice(b, i))
                    }
                    r.push(buildElement(s.slice(i,j+1)))

                    i = j + 1
                    b = i
                    success = true
                    break
                }
            }
            if (!success) i++
        } else {
            i++
        }
    }
    if (b < s.length) {
        r.push(s.slice(b))
    }
    return r
}



export const TextView: Component<{ node: Y.Text, state: EditorState, tag: string }> = (props) => {

    let s
    let el = document.createElement(props.tag)
    let br = props.tag === 'span' ? false : true

    let { docFromDom, domFromDoc } = props.state

    let node = props.node
    s = node.toString()
    docFromDom.set(el, node)
    domFromDoc.set(node, el)
    el.classList.add('oalmText')
    const update = () => { el.innerHTML = ''; el.append(...highlight3(node.toString())) }
    update()
    node.observe(update)

    // onCleanup(() => {
    //     node.unobserve(update)
    // })
    return el
}

export const ParagraphView = (props) => {

    const commands = [
        { name: 'delete', run: () => yDeleteFromArray(props.node) }
    ]

    return (
        <ContentContainer commands={commands} state={props.state} node={props.node}>
            <TextView node={props.node} state={props.state} tag='p' />
        </ContentContainer>
    )
}



