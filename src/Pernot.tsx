import * as Y from "yjs";

import { Component, For, Show, Match, Switch } from "solid-js";
import { StepSequencer } from "./StepSequencer";
import { Codemirror } from "./Codemirror";
import { TableView } from "./Table";


export const Pernot: Component<{ root: Y.Map<any> }> = (props) => {
    return (
        <div class="border-t border-black flex flex-cols justify-center overflow-scroll">
            <div class="max-w-prose flex-grow p-1">
                <FolderView root={props.root} />
            </div>
        </div>
    )
}

export const FolderView: Component = (props) => {
    return (
        <>
            <div class="font-bold">
                <Codemirror ytext={props.root.get('!')} />
            </div>
            <div class="flex flex-col gap-1 p-1">

                <For each={props.root.get('$').toArray()}>
                    {(item) =>

                        <Switch>
                            <Match when={item.has('S')}>
                                <StepSequencer node={item} />
                            </Match>
                            <Match when={item.has('!')}>
                                <div class=" border">
                                    <Codemirror ytext={item.get('!')} />
                                </div>
                            </Match>
                            <Match when={item.has('header')}>
                                <TableView node={item} />
                            </Match>
                        </Switch>
                    }
                </For>
                <Show when={props.root.has('&') && props.root.get('&').length}>
                    <div class="flex flex-col gap-1">
                        <For each={props.root.get('&').toArray()}>
                            {(item) => <div class="border border-black"><FolderView root={item} /></div>}
                        </For>
                    </div>
                </Show>
            </div>
        </>
    )
}

export const FileView: Component<{ node: Y.Map<any> }> = (props) => {

    return (
        <div class="flex flex-col">
            <div class="h-4 bg-gray-400">

            </div>
            <Codemirror ytext={props.node.get('!')} />

        </div>
    )
}