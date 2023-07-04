import * as Y from 'yjs';
import { Component, For, Signal, children, Accessor, createSignal, onCleanup } from 'solid-js';
import { TextView } from './Editor';


// Agenda format:
// start datetime + end datetime
// vague datetime + duration


const getAgenda = (root: Y.Map<any>) => {
    let ret = [root.has('schedule') ? root : null, ...root.get('children').map(getAgenda)].flat().filter(n => n)
    // console.log(ret)
    return []
}

export const AgendaView: Component<{ path: Accessor<Array<Y.Map<any>>> }> = (props) => {
    return (
        <>
        Today is {new Date().toLocaleDateString()}
            <div style={{
                'display': 'grid',
                "grid-template-columns": '3fr 1fr 1fr',
                "margin": '1rem 1.4rem',
            }}>
                <div style="font-weight: bold">Heading</div>
                <div style="font-weight: bold">Status</div>
                <div style="font-weight: bold">Date</div>



            </div>
        </>
    )
}


const AgendaItem: Component<{ node: Y.Map<any> }> = (props) => {
    let node = props.node

    // let [date,setDate] = createSignal('')
    let [date, setDate] = createSignal(node.get('~'))
    let [done, setDone] = createSignal(node.has('done'))



    let f = () => {
        setDate(node.get('~'))
        setDone(node.has('done'))
    }


    node.observe(f)

    onCleanup(() => {
        node.unobserve(f)
    })

    return (
        <>
            <p>heading</p>
            <p classList={{ done: done() }}>Done</p>
            <p classList={{ done: done() }}>{date()}</p>
        </>
    )
}
