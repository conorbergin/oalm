import { deleteSection } from "./input"
import * as Y from 'yjs'
import { path, setPath, hack, setHack} from './App'
import { Setter } from "solid-js"

import { setLock, EditorState } from './Editor'


const zoneHeight = 20

export const dragHandle = `
<?xml version="1.0" encoding="utf-8"?>
<svg height="4rem" viewBox="0 0 3 4" fill="none" xmlns="http://www.w3.org/2000/svg">`
  + Array.from({ length: 2 }, (_, i) => Array.from({ length: 3 }, (_, j) => `<circle cx="${1 + i}" cy="${1 + j}" r=".35" fill="#000000" />`).join('\n')).join('\n')
  + `</svg>`



// Strategy
// 1. On pointerdown, create a drag element and a drag shadow, hide the target element and insert the shadow below it
// 2. On pointermove, move the drag element to the pointer position, if the pointer is over a valid drop zone, move the shadow to the drop zone
// 3. On pointerup, if the pointer is over the delte zone or open zone, act accordingly, otherwise insert delete everything and fire a transaction to insert the dragged element at the drag shadow position

export const dragSection = (event: PointerEvent, node: any, editor: EditorState) => {
    event.target.releasePointerCapture(event.pointerId)
    event.preventDefault()

    let targetElement = (event.target as Element).parentElement as HTMLElement

    if (true) {
        targetElement = targetElement.parentElement
    }

    setLock(true)

    let newParent = node.parent
    let oldIndex = (node.parent! as Y.Array<any>).toArray().indexOf(node)
    let newIndex = oldIndex

    let rect = targetElement.getBoundingClientRect()
    let dragElement = targetElement.cloneNode(true) as HTMLElement
    let dragShadow = Object.assign(document.createElement('div'), { className: 'drag-shadow' })
    dragShadow.style.height = rect.height + 'px'

    targetElement.style.display = 'none'
    targetElement.insertAdjacentElement('afterend', dragShadow)

    dragElement.classList.add('dragging')
    dragElement.style.width = rect.width - 20 + 'px'

    let initialX = event.clientX - rect.left
    let initialY = event.clientY - rect.top

    dragElement.style.transform = `translate(${event.clientX - initialX}px, ${event.clientY + window.scrollY - initialY}px)`

    document.body.appendChild(dragElement)

    let deleteZone = Object.assign(document.createElement('div'), { className: 'delete-shadow' })
    document.body.append(deleteZone)
    let openZone = node instanceof Y.Map && (node.get('role') === "section") ? Object.assign(document.createElement('div'), { className: 'open-shadow' }) : null
    openZone && document.body.append(openZone)

    const handlePointerMove = (e: PointerEvent) => {
        if (e.pointerId !== event.pointerId) return
        event.preventDefault()

        if (e.clientY > window.innerHeight - 100) {
            window.scrollBy(0, 10)
        } else if (e.clientY < 100) {
            window.scrollBy(0, -10)
        }

        dragElement.style.transform = `translate(${e.clientX - initialX}px, ${e.clientY + window.scrollY - initialY}px)`

        if (e.target === dragShadow) return

        let t = null
        if (e.target instanceof Element) {
            t = e.target.closest('.section .border')
        }
        let tnode = editor.docFromDom.get(t)
        if (tnode) {
            console.log('hello')
            let r = t.getBoundingClientRect()
            let index = (tnode.parent as Y.Array<any>).toArray().indexOf(tnode)
            if (e.clientY < r.top + zoneHeight) {
                console.log('before')
                newIndex = index
                newParent = tnode.parent
                t.before(dragShadow)
            } else if (e.clientY > r.bottom - zoneHeight) {
                console.log('after')
                newIndex = index + 1
                newParent = tnode.parent
                t.after(dragShadow)
            } else if (editor.docFromDom.get(t).get('children').length === 0) {
                // need a better metric for this
                t.insertAdjacentElement('beforeend', dragShadow)
                newIndex = 0
                newParent = tnode.get('children')
            }
        }
    }

    const handlePointerUp = (e: PointerEvent) => {
        e.preventDefault()
        dragElement.remove()
        dragShadow.remove()
        deleteZone.remove()
        openZone && openZone.remove()

        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
        setLock(false)
        switch (true) {
            case e.target === deleteZone:
                console.log('delete')
                node.parent && node.parent.delete(node.parent.toArray().indexOf(node))
                return
            case e.target === openZone:
                console.log('open')
                setPath(path => [...path, node])
                setHack(h => !h)
                console.log(path())
                return
            default:
                if (newParent !== node.parent && newIndex !== oldIndex) {
                    console.log('move')
                    Y.transact(node.doc!, () => {
                        let n = node.clone();
                        (node.parent as Y.Array<any>).delete(oldIndex);
                        (newParent as Y.Array<any>).insert(newIndex, [n]);
                    })
                    return
                } else {
                    console.log('no change')
                    targetElement.style.display = ''
                    return
                }
        }
    }

    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
}
