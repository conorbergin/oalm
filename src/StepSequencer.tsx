import { Component, For, Show, createSignal, createEffect, on, onCleanup } from 'solid-js'
import * as Tone from 'tone'
import * as Y from 'yjs'

const STEPS = 16
const TRACKS = 8
const BPM = 140

const keys = ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5']



export const StepSequencer: Component<{ node: Y.Map<any> }> = (props) => {
    const node = props.node
    const synth = new Tone.PolySynth(Tone.Synth, {

    }).toDestination()

    const [notes, setNotes] = createSignal<Array<any>>([{s:10,e:11,p:10 },{s:10,e:30,p:40},{s:30,e:33,p:19}])
    const [cursor, setCursor] = createSignal(0)
    const [playing, setPlaying] = createSignal(false)

    const [flip, setFlip] = createSignal(false)

    const handleKeydown = (e: KeyboardEvent) => {
        switch (e.key) {
            case ' ':
                e.preventDefault()
                setPlaying(p => !p)
                break
            case 'ArrowRight':
                e.preventDefault()
                setCursor(c => (c + 1) % STEPS)
                break
            case 'ArrowLeft':
                e.preventDefault()
                setCursor(c => (c - 1 + STEPS) % STEPS)
                break
            default:
                break

        }
    }
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

    let p

    const handlePointerDown = (e: PointerEvent) => {
        e.preventDefault()

        const handlePointerMove = (e: PointerEvent) => {
        }

        const handlePointerUp = (e: PointerEvent) => {
            e.preventDefault()
            document.removeEventListener('pointermove', handlePointerMove)
            document.removeEventListener('pointerup', handlePointerUp)
        }

        document.addEventListener('pointermove', handlePointerMove)
        document.addEventListener('pointerup', handlePointerUp)
    }
    


    return (
        <div ref={p} tabIndex={0} onkeydown={handleKeydown}>
            <div class="flex">
                <button class="ml-1" onClick={() => { setPlaying(p => !p) }}>{playing() ? 'Stop' : 'Play'}</button>
                <button class="ml-1" onClick={() => { setFlip(p => !p) }}>Flip</button>
            </div>
            <Show when={!flip()}>
                <svg viewBox='0 0 100 100' width='600px' onpointerdown={handlePointerDown}>
                    <For each={Array(STEPS).fill(0)}>
                        {(n, index) => (
                            <line y1={10 + index() * 2} x1={2} y2={10 + index() * 2} x2={98} stroke="lightgray" stroke-width={0.2} shape-rendering='crispEdges' />
                        )}
                    </For>
                    <For each={notes()}>
                        {(n, index) => (
                            <>
                                <rect y={n.p-2} x={10+n.s} width={n.e-n.s} height={2} rx={1} fill="black"/>

                            </>
                        )}
                    </For>
                </svg>
            </Show>

        </div>
    )
}