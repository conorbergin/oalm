import { Component, createSignal, For, Switch, Match } from "solid-js";
import { scaleLinear, scaleBand } from "d3-scale"
import { a } from "@vite-pwa/assets-generator/dist/utils-a49afd3e";


const mostlyNumbers = (arr: Array<any>) => {
    let n = arr.map((x) => Number(x))
    if (n.filter((x) => isNaN(x)).length > n.length / 8) {
        return arr
    } else {
        return n
    }
}

const arrIsNum = (arr: Array<any>) => {
    return arr.every((x) => x instanceof Number)
}



export const ChartChooser: Component<{ x: Array<any>, y: Array<any> }> = (props) => {
    let [x, setX] = createSignal(mostlyNumbers(props.x))
    let [y, setY] = createSignal(mostlyNumbers(props.y))

    console.log(x(), typeof x()[0], y(), typeof y()[0] === 'number')

    return (
        <div>
            <Switch>
                <Match when={typeof x()[0] === 'number' && typeof y()[0] === 'number'}>
                    <ScatterPlot x={x()} y={y()} />
                </Match>
                <Match when={true}>
                    <BarChart cont={y()} disc={x()} />
                </Match>
                <Match when={typeof x()[0] === 'number'}>
                    <BarChart cont={x()} disc={y()} />
                </Match>
            </Switch>
        </div>
    )
}

export const BarChart: Component<{ cont: Array<number>, disc: Array<string> }> = (props) => {

    let [yScale, setYScale] = createSignal(scaleLinear().domain([0, Math.max(...props.cont)]).range([0, 100]))

    return (
        <div class="grid" style="grid-template-columns: 2rem 1fr; grid-template-rows: 1fr 2rem">
            <div class="flex w-4 h-48">
                <div class="w-3">

                </div>
                <div class="w-1 h-full flex flex-col">
                    <For each={yScale().ticks()}>
                        {(item) => <div class="border-b border-r flex-1 border-black"></div>}
                    </For>
                </div>
            </div>
            <div class="flex items-end border-b border-black">
                <For each={props.cont}>
                    {(item, index) => <div class="ml-1 mr-1  border-l border-r border-t border-black bg-screentone-63 flex-grow" style={{ height: yScale()(item) + '%' }}></div>}
                </For>
            </div>
            <div />
            <div class="grid" style={{'grid-template-columns': `repeat(${props.disc.length},1fr)`}}>
                <For each={props.disc}>
                    {(item) => <div class="flex-grow text-center">{item}</div>}
                </For>
            </div>


        </div>
    )
}

export const ScatterPlot: Component<{ x: Array<number>, y: Array<String> }> = (props) => {

    return (
        <div>

        </div>
    )
}
