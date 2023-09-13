import { Component, Setter, JSX, Accessor, createEffect, Show, onCleanup } from "solid-js"

import { Portal } from "solid-js/web"


// export interface Dialog {
//   children: any
//   show: boolean,
//   setShow: Setter<boolean>
// }

export const Dialog: Component<{ children: any, show: boolean, setShow: Setter<boolean> }> = (props) => {
  let r: HTMLDialogElement
  createEffect(() => {
    if (props.show) {
      r.show()
    } else {
      r.close()
    }
  })
  return (
    <dialog contentEditable={false} ref={r} onClick={() => props.setShow(false)}>
      {props.children}
    </dialog>
  )
}


export const Modal: Component<{ children: any, show: boolean, setShow: Setter<boolean>, coords: {x:number,y:number} }> = (props) => {
  let r: HTMLDialogElement
  createEffect(() => {
    if (props.show) {
      r.showModal()
    } else {
      r.close()
    }
  })
  return (
    <dialog class='p-0 rounded' contentEditable={false} ref={r} onClick={() => props.setShow(false)}>
      <div class='p-2' onClick={e => e.stopPropagation()}>
        {props.children}
      </div>
    </dialog>
  )
}


export const ModalFull: Component<{ children: any, show: boolean, setShow: Setter<boolean> }> = (props) => {
  createEffect(() => {
    if (props.show) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
  })
  return (
    <Show when={props.show}>
      <Portal>
        <div contentEditable={false} class='fixed top-0 left-0 w-screen h-screen bg-white z-20'>
          {props.children}
        </div>
      </Portal>
    </Show>
  )
}