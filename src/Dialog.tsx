import { Component, Setter, JSX,Accessor } from "solid-js"

import { Portal } from "solid-js/web"


interface Dialog {
  children: JSX.Element
  setShow: Setter<boolean>
}

export const Dialog: Component<{ children: Element, show: Accessor<boolean>,setShow: Setter<boolean> }> = (props) => {
  let r
  createEffect(() => {
    
  })
  return (
    <dialog ref={r}>

    </dialog>
  )
}