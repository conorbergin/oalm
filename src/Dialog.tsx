import { Component, Setter , JSX } from "solid-js"

import { Portal } from "solid-js/web"


interface Dialog {
    children: JSX.Element
    setShow: Setter<boolean>
}

export const Dialog: Component<{ children: Element, setShow: Setter<boolean> }> = (props) => {
    return (
        <Portal>
            <div class="fixed flex w-screen h-screen bg-gray-300/25 top-0 left-0 justify-center items-center" onClick={() => props.setShow(false)}>
                <div class=" bg-white p-4 rounded-xl w-fit h-fit opacity-100 shadow-md"  onClick={(e) => e.stopPropagation()}>
                    {props.children}
                </div>
            </div>
        </Portal>
    )
}