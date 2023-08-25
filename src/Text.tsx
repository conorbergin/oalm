import { Component, onCleanup } from 'solid-js'
import * as Y from 'yjs'
import { TEXT } from './input'
import { ContentContainer, EditorState } from './Editor'
import { yDeleteSelfFromArray } from './utils'


// VALID CASES 
// *hello*  _goodbye_ *_hello_* *[link]*
// INVALID CASES
// *hello*goodbye 
const isWhitespace = (s: string) => s === ' ' || s === '/t' || s === '/n'
const isValidLeft = (l: string, r: string) => (isWhitespace(l) || l === '') && !isWhitespace(r)
const isValidRight = (l: string, r: string) => !isWhitespace(l) && isWhitespace(r)

const STRONG = '*'
const EMPH = '_'
const LBRKT = '['
const RBRKT = ']'



export const highlight3 = (s: string) => {

    let split = s.split(/(\s|^)([_*]|[[][^]*[]])(\s|$)/)
    let r: Array<string | Node> = []

    return r
}


export const highlight2 = (s: string) => {

    let strong: number[][] = []
    let emph: number[][] = []
    let link: number[][] = []

    let i = 1
    while (i < s.length - 1) {
        if (i === 1) {
            if (!isWhitespace(s[i])) {
                switch (s[0]) {
                    case STRONG: openStrong = 0; break;
                    case EMPH: openEmph = 0; break;
                    case LBRKT: openLink = 0; break;
                }
            }
        } else if (i === s.length - 1) {
            if (!isWhitespace(s[i])) {
                switch (s[i + 1]) {
                    case STRONG: if (openStrong) { strong.push([openStrong, i + 1]) }; break;
                    case EMPH: if (openEmph) { emph.push([openEmph, i + 1]) }; break;
                    case RBRKT: if (openLink) { link.push([openLink, i + 1]) } break;
                }
            }
        } else {
            if (!isWhitespace(s[i])) {

            }


        }
        i++
    }

    // let i = 0, j = 0
    let r = []
    if (u.length > 0 && a.length > 0) {
        //needs work mate
        while (true) {
            if (i === u.length || j === a.length) {
                break
            } else if (u[i][0] > a[j][1]) {
                j++
            } else if (a[j][0] > u[i][1]) {
                i++
            } else if (u[i][0] < a[j][0] && u[i][1] < a[j][1]) {
                italic.push([u[i][0], a[j][0] - 1])
                bold.push([u[i][1] + 1, a[j][1]])
                boldItalic.push([a[j][0], u[i][1]])
            } else if (u[i][0] > a[j][0] && u[i][1] > a[j][1]) {
                italic.push([a[j][1] + 1, u[i][1]])
                bold.push([a[j][0], u[i][0] - 1])
                boldItalic.push([u[i][0], a[j][1]])
            } else if (u[i]) {

            }
        }
    } else {
        r.push(s)
    }

    return r
}

export function highlight(str: string, br: boolean) {

    if (str === '') {
        return br ? '<br>' : ''
    }
    let r = str

    // Bold and italic
    const boldRegex = /(?<!\S)(\*\S.*?\S\*)(?!\S)/g;
    r = r.replace(boldRegex, '<span class="font-bold">$1</span>');

    const italicRegex = /(?<!\S)(_\S.*?\S_)(?!\S)/g;
    r = r.replace(italicRegex, '<span class="font-italic">$1</span>');

    // Links
    const linkRegex = /\[[^\]]+\]\[^\s]+/g;
    r = r.replace(linkRegex, '<span data-link="" class="text-blue-800">$1</span>');

    // Headings
    const headingRegex = /^(#{1,6})\s+(.*)$/gm;
    r = r.replace(headingRegex, (match, level, content) => {
        const headingLevel = level.length;
        return `<span class="text-red-800">${level} ${content}</span>`;
    });

    return r;



}

export const TextView: Component<{ node: Y.Map<any>, state: EditorState, tag: string }> = (props) => {

    let s
    let el = document.createElement(props.tag)
    let br = props.tag === 'span' ? false : true
    el.contentEditable = 'true'

    el.onbeforeinput = (e) => console.log(e.data)

    let { docFromDom, domFromDoc } = props.state

    let node = props.node.get(TEXT)
    s = node.toString()
    docFromDom.set(el, node)
    domFromDoc.set(node, el)
    el.textContent = highlight(s, br)
    let update = () => { el.textContent = highlight(node.toString(), br) }
    node.observe(update)

    // onCleanup(() => {
    //     node.unobserve(update)
    // })
    return el
}


export const TextView2: Component<{ node: Y.Text, tag: string }> = (props) => {

    let s
    let el = document.createElement(props.tag)
    let br = props.tag === 'span' ? false : true
    el.contentEditable = 'true'



    let node = props.node
    el.onbeforeinput = (e) => {
        node.insert(0, e.data)
    }
    s = node.toString()
    el.innerHTML = highlight(s, br)
    let update = () => { el.innerHTML = highlight(node.toString(), br) }
    node.observe(update)

    onCleanup(() => {
        node && node.unobserve(update)
    })
    return el
}


export const ParagraphView = (props) => {

    const commands = [
        { name: 'delete', run: () => yDeleteSelfFromArray(props.node) }
    ]

    return (
        <ContentContainer commands={commands} state={props.state} node={props.node}>
            <TextView node={props.node} state={props.state} tag='p' />
        </ContentContainer>
    )
}



