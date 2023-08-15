import { Component, Setter , JSX } from "solid-js"

import { Portal } from "solid-js/web"


interface Dialog {
    children: JSX.Element
    pos: {x:number, y:number}
    setShow: Setter<boolean>
}

export const Dialog: Component<{ children: Element, pos: {x:number, y:number}, setShow: Setter<boolean> }> = (props) => {
    return (
        <Portal>
            <div class="fixed w-screen h-screen bg-gray-300/25 top-0 left-0" onClick={() => props.setShow(false)}>
                <div class="fixed bg-white p-4 rounded-xl w-fit h-fit opacity-100 shadow-md" style={{'left':props.pos.x +'px' , 'top':props.pos.y + 'px'}} onClick={(e) => e.stopPropagation()}>
                    {props.children}
                </div>
            </div>
        </Portal>
    )
}