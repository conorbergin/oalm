import { Component, mergeProps, onCleanup, createSignal } from 'solid-js'
import * as Y from 'yjs'
import { TEXT } from './input'
import { yDeleteFromArray } from './utils'


function mySignal(x) {
    return createSignal(x)
}


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

const buildElement = (s: string) => {
    switch (s[0]) {
        case '`': return Object.assign(document.createElement('code'), { textContent: s })
        case '[': return Object.assign(document.createElement('a'), { textContent: s, href: s.slice(1, -1) })
        case '*':
        case '_':
            let el = document.createElement(s[0] === '*' ? 'strong' : 'em')
            el.append(s[0], ...highlight3(s.slice(1, -1)), s[0])
            return el
        default:
            return s
    }
}


export const highlight3 = (s: string, placeholder?: string | null) => {

    let classList = ''
    const openers = '*_`['
    const matchOpener = (s: string) => {
        switch (s) {
            case '*': return '*'
            case '_': return '_'
            case '`': return '`'
            case '[': return ']'
        }
    }


    if (s === '') return [placeholder ?? document.createElement('br')]
    let r: Array<string | Node> = []
    let i = 0
    let b = 0

    if ((s[0] === '_' || s[0] === 'x') && s[1] === ' ') {
        if (s[0] === '_') {
            r.push(Object.assign(document.createElement('span'), { textContent: '☐', className: 'unchecked' }))
        } else {
            r.push(Object.assign(document.createElement('span'), { textContent: '☒', className: 'checked' }))
        }
        i++
        b++
    }




    while (i < s.length) {
        if (openers.includes(s[i]) && (i == 0 || isWhitespace(s[i - 1]))) {

            let success = false
            for (let j = i + 1; j < s.length; j++) {
                if (s[j] === matchOpener(s[i])
                    && (j === s.length - 1 || isWhitespace(s[j + 1]) || isPunctuation(s[j + 1]))) {
                    if (b !== i) {
                        r.push(s.slice(b, i))
                    }
                    r.push(buildElement(s.slice(i, j + 1)))

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

const evaluate = (s:string,context:string) => {
    let div = Object.assign(document.createElement('div'),{className:"rounded bg-neutral-100 dark:bg-neutral-700 p-1 text-blue-700"})
    div.contentEditable = "false"
    try {

        div.textContent = String(eval(s))
    } catch (e) {
        console.log(e)
        div.textContent = "Error"
    }
    return div
}

export const TextView: Component<{ ytext: Y.Text, placeholder?: string | null }> = (_props) => {

    const props = mergeProps({placeholder:null},_props)
    let s
    let el = document.createElement('div')
    el.setAttribute("data-node","true")


    let node = props.ytext
    s = node.toString()
    el.classList.add('oalmText')
    const update = () => { 
        const s = node.toString()
        const contents = highlight3(s,props.placeholder)

    }
    update()
    node.observe(update)

    // onCleanup(() => {
    //     node.unobserve(update)
    // })
    return el
}