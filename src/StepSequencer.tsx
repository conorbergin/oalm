import { Component, For, Show, createSignal, createEffect, on, onCleanup } from 'solid-js'
import * as Tone from 'tone'
import * as Y from 'yjs'

const STEPS = 16
const TRACKS = 8
const BPM = 140

const keys = ['A3', 'B3', 'C4', 'D4', 'E4', 'F4', 'G4', 'A4']



export const StepSequencer: Component<{ node: Y.Map<any> }> = (props) => {
    const node = props.node
    const synth = new Tone.PolySynth(Tone.Synth).toDestination()

    const [notes, setNotes] = createSignal<Array<Boolean>>(node.get('d').toArray())
    const [cursor, setCursor] = createSignal(0)
    const [playing, setPlaying] = createSignal(false)

    const f = () => { setNotes(node.get('d').toArray()) }

    node.get('d').observe(f)

    let interval = setInterval(() => {
        if (!playing()) return
        setCursor(c => (c + 1) % STEPS)
        for (let i = 0; i < TRACKS; i++) {
            let index = cursor() + (i * STEPS)
            let now = Tone.now()
            if (notes()[index]) {
                synth.triggerAttackRelease(keys[TRACKS - i - 1], '16n', now)
            }
        }
    }, 60000 / BPM)

    onCleanup(() => {
        clearInterval(interval)
        node.unobserve(f)
    })

    return (
        <div >
            <div class="bg-gray-700 text-white text-sm">
                <button onClick={() => { setPlaying(p => !p) }}>{playing() ? 'Stop' : 'Play'}</button>
            </div>
            <div class="grid grid-cols-16">
                <For each={notes()}>
                    {(n, index) => (
                        <button onClick={() => {
                            node.doc!.transact(() => {
                                node.get('d').delete(index())
                                node.get('d').insert(index(), [!n])
                            })
                        }
                        }>
                            <div classList={{ 'outline-2': cursor() === index() % 16 }} class=" h-4 m-1 p-0.5 outline-black outline outline-1 flex">
                                <Show when={n}>
                                    <div class="bg-black flex-1 outline outline-1 outline-black" ></div>
                                </Show>
                            </div>
                        </button>
                    )}
                </For>
            </div>

        </div>
    )
}