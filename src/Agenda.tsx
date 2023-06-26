import * as Y from 'yjs';
import { Component, For, Signal, children, Accessor } from 'solid-js';


const getAgenda = (root: Y.Map<any>) => {
    let r = root.has('schedule') ? [{...root.get('schedule').toJSON(),heading : root.get('heading').toString()}] : []
    let c = root.has('children') ? root.get('children').map((value) => {
        return getAgenda(value)
    }) : []
    return [...r,...c.flat()]
}

export const AgendaView : Component<{path: Accessor<Array<Y.Map<any>>>}> = (props) => {
    return (
        <div style={{
            'display': 'grid',
            "grid-template-columns": '3fr 1fr 1fr',
            "margin": '1rem 4rem',
            'font-family': 'InputSans',
        }}>
            <div style="font-weight: bold">Heading</div>
            <div style="font-weight: bold">Status</div>
            <div style="font-weight: bold">Date</div>

                <For each={getAgenda(props.path().at(-1)!)}>
                    {(item) => <><div>{item.heading}</div><div style={`color: ${item.status === 'done' ? 'green' : 'red'}`} >{item.status}</div><div>{item.date}</div></>}
                </For>

        </div>
    )
}
