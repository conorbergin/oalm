import {Sel } from "./selection"

export const paste = (s:Sel, e:InputEvent) => {
    let data = e.dataTransfer
    if (!data) return
    let text = data.getData('text/plain')
    if (text) {
        s.node.insert(s.offset, text.split('\n')[0])
    }
}


const fromPlainText = () => {}