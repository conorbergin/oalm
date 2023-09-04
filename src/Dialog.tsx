import { Component, Setter, JSX,Accessor, createEffect } from "solid-js"

import { Portal } from "solid-js/web"


interface Dialog {
  children: JSX.Element
  setShow: Setter<boolean>
}

export const Dialog: Component<{ children: Element, show: boolean,setShow: Setter<boolean> }> = (props) => {
  let r : HTMLDialogElement
  createEffect(() => {
    if (props.show) {
      r.showModal()
    } else {
      r.close()
    }
  })
  return (
    <dialog ref={r}>
      {props.children}
    </dialog>
  )
}