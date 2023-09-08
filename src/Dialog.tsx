import { Component, Setter, JSX,Accessor, createEffect } from "solid-js"

import { Portal } from "solid-js/web"


// export interface Dialog {
//   children: any
//   show: boolean,
//   setShow: Setter<boolean>
// }

export const Dialog: Component<{ children: any, show: boolean,setShow: Setter<boolean> }> = (props) => {
  let r : HTMLDialogElement
  createEffect(() => {
    if (props.show) {
      r.show()
    } else {
      r.close()
    }
  })
  return (
    <dialog  contentEditable={false} ref={r} onClick={() => props.setShow(false)}>
      {props.children}
    </dialog>
  )
}


export const Modal: Component<{ children: any, show: boolean,setShow: Setter<boolean> }> = (props) => {
  let r : HTMLDialogElement
  createEffect(() => {
    if (props.show) {
      r.showModal()
    } else {
      r.close()
    }
  })
  return (
    <dialog  contentEditable={false} ref={r} onClick={() => props.setShow(false)}>
      {props.children}
    </dialog>
  )
}


export const ModalFull: Component<{ children: any, show: boolean,setShow: Setter<boolean> }> = (props) => {
  let r : HTMLDialogElement
  createEffect(() => {
    if (props.show) {
      r.showModal()
    } else {
      r.close()
    }
  })
  return (
    <dialog class='w-full h-full' contentEditable={false} ref={r} onClick={() => props.setShow(false)}>
      {props.children}
    </dialog>
  )
}