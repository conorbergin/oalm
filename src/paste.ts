import {Sel } from "./selection"
import * as Y from 'yjs'
import { yIndex } from "./utils"
import { TEXT } from "./input"

export const paste = (s:Sel, e:InputEvent) => {
    let data = e.dataTransfer
    if (!data) return
    let text = data.getData('text/plain')
    if (!text) return
    let lines = text.split('\n').filter(f => f !== '')
    console.log(lines)
    s.node.insert(s.offset, lines[0])
    if (lines.length > 1) {
        let j = yIndex(s.node.parent)
        for (let i = 1; i < lines.length; i++) {
            let m = new Y.Map()
            let t = new Y.Text(lines[i])
            m.set(TEXT,t)
            s.node.parent.parent.insert(j+i,[m])
        }
    }
}


const fromPlainText = () => {}