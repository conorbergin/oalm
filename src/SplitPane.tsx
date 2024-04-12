import { Component, JSXElement, Show, createSignal, mergeProps } from "solid-js"




export const SidePane: Component<{ side: JSXElement, divider:JSXElement, main: JSXElement, sticky?:number, default?:number}> = (_props) => {


    const props = mergeProps({sticky: 20, default:200},_props)
    let dividerRef: HTMLDivElement
    let containerRef: HTMLDivElement



    const handleDrag = (event: PointerEvent) => {
        event.preventDefault()
        document.body.style.cursor = "grabbing !important"
        let initalX = event.clientX

        let moved = false

        const handlePointerMove = (e: PointerEvent) => {
            e.preventDefault()
            moved = true
            setSideWidth(w => {
                let newW = w + (e.clientX - initalX)
                initalX = e.clientX
                return newW
            })
        }

        const handlePointerUp = (e: PointerEvent) => {
            if (!moved) {
                sideWidth() < props.sticky ? setSideWidth(props.default) : setSideWidth(0)
            }
            document.body.style.cursor = ""
            document.removeEventListener("pointermove", handlePointerMove)
            document.removeEventListener("pointerup", handlePointerUp)
        }

        document.addEventListener("pointermove", handlePointerMove)
        document.addEventListener("pointerup", handlePointerUp)
    }

    let [sideWidth, setSideWidth] = createSignal<number>(200)

    return (
        <div ref={containerRef} class="flex">
            <Show when={sideWidth() > props.sticky}>
                <div style={{
                    "width": `${sideWidth()}px`,
                    overflow:"hidden"
                }}>
                    {props.side}
                </div>


            </Show>
            <div style={{
                cursor: "grab"
            }} ref={dividerRef} onPointerDown={handleDrag} >
                {props.divider}
            </div>
            <div>
                {props.main}
            </div>
        </div>
    )
}