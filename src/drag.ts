import * as Y from 'yjs'
export const drag = (event: PointerEvent, node: any, state: EditorState, klass: string, func: () => {}) => {
    const zoneHeight = 20
    if (!(event.target instanceof Element)) return
    event.target.releasePointerCapture(event.pointerId)
    event.preventDefault()
  
    let targetElement = event.target.closest(`.${klass}`) as HTMLElement
  
    let moved = false
  
  
    let newParent = node.parent
    let oldIndex = (node.parent! as Y.Array<any>).toArray().indexOf(node)
    let newIndex = oldIndex
  
    let rect = targetElement.getBoundingClientRect()
    let dragElement = targetElement.cloneNode(true) as HTMLElement
    let dragShadow = Object.assign(document.createElement('div'), { className: 'border bg-gray-100' })
    dragShadow.style.height = rect.height + 'px'
  
    let initialX = event.clientX - rect.left
    let initialY = event.clientY - rect.top
  
    const handlePointerMove = (e: PointerEvent) => {
      if (!moved) {
        if (Math.abs(e.clientY - event.clientY) < 5 && Math.abs(e.clientX - event.clientX) < 5) {
          return
        } else {
          moved = true
          targetElement.style.display = 'none'
          targetElement.insertAdjacentElement('afterend', dragShadow)
          dragElement.classList.add('absolute', 'z-50', 'font-body')
          dragElement.style.width = rect.width - 20 + 'px'
          dragElement.style.top = '0px'
          dragElement.style.left = '0px'
          dragElement.style.pointerEvents = 'none'
          dragElement.style.transform = `translate(${event.clientX - initialX}px, ${event.clientY + window.scrollY - initialY}px)`
          document.body.appendChild(dragElement)
        }
      }
      moved = true
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
        t = e.target.closest(`.${klass}`)
      }
      let tnode = state.drag.get(t)
      if (tnode) {
        console.log('hello')
        let r = t.getBoundingClientRect()
        let index = (tnode.parent as Y.Array<any>).toArray().indexOf(tnode)
        if (e.clientY < r.top + zoneHeight) {
          // console.log('before')
          newIndex = index
          newParent = tnode.parent
          t.before(dragShadow)
        } else if (e.clientY > r.bottom - zoneHeight) {
          // console.log('after')
          newIndex = index + 1
          newParent = tnode.parent
          t.after(dragShadow)
        }
      }
    }
  
    const handlePointerUp = (e: PointerEvent) => {
      e.preventDefault()
      dragElement.remove()
      dragShadow.remove()
      targetElement.style.display = ''
  
      document.removeEventListener('pointermove', handlePointerMove)
      document.removeEventListener('pointerup', handlePointerUp)
  
      if (!moved) {
        func()
      }
  
      if (newParent !== node.parent) {
        console.log('move')
        Y.transact(node.doc!, () => {
          let n = node.clone();
          (node.parent as Y.Array<any>).delete(oldIndex);
          (newParent as Y.Array<any>).insert(newIndex, [n]);
        })
        return
      } else if (newIndex !== oldIndex) {
        Y.transact(node.doc!, () => {
          let n = node.clone()
          let adj = newIndex > oldIndex ? 1 : 0;
          (node.parent as Y.Array<any>).delete(oldIndex);
          (newParent as Y.Array<any>).insert(newIndex - adj, [n]);
  
  
        })
      } else {
        console.log('no change')
        return
      }
    }
  
    document.addEventListener('pointermove', handlePointerMove)
    document.addEventListener('pointerup', handlePointerUp)
  }
  