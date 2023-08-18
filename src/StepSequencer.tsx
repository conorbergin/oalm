import { Component, For, Show, createSignal, createEffect, on, onCleanup } from 'solid-js'
import * as Tone from 'tone'
import { MidiNote, Note } from 'tone/build/esm/core/type/NoteUnits'
import * as Y from 'yjs'

import { EditorState, TextView, drag, menu } from './Editor'

import * as d3 from 'd3-selection'
import { a } from '@vite-pwa/assets-generator/dist/utils-a49afd3e'

const STEPS = 16
const TRACKS = 8
const BPM = 140

const keys = ['A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5']


// notes are stored in a map, keys are made of the note time and pitch, and values are the note length and velocity
// 1:1/4~C4

export const newPiece = () => {
    const m = new Y.Map()
    m.set('bpm', 140)
    let p = newPart()
    let a = Y.Array.from([p])
    m.set('parts', a)
    return m
}

const newPart = () => {
    const m = new Y.Map()
    m.set('instrument', 'synth')
    m.set('notes', new Y.Map())
    return m
}

const pitchInScale = (scale: number, pitch: number) => {
    const maj = [true, false, true, false, true, true, false, true, false, true, false, true]
    return maj.slice((scale * 7) % 12).concat(maj.slice(0, (scale * 7) % 12))[pitch % 12]
}


export const StepSequencer: Component<{ node: Y.Map<any>, state: EditorState, collapsed: boolean }> = (props) => {

    
    
    const chorus = new Tone.Chorus(4, 2.5, 0.5).toDestination()
    const inst = chorus
    
    const polySynth = new Tone.PolySynth(Tone.FMSynth).connect(chorus)
    
    polySynth.set({
        "harmonicity": 6,
        "modulationIndex": 2,
        "oscillator": {
            "type": "sine"
        },
        "envelope": {
            "attack": 0.001,
            "decay": 2,
            "sustain": 0.1,
            "release": 2
        },
        "modulation": {
            "type": "square"
        },
        "modulationEnvelope": {
            "attack": 0.002,
            "decay": 0.2,
            "sustain": 0,
            "release": 0.2
        }
    })
    
    
    const [parts, setParts] = createSignal(props.node.get('parts').toArray())
    const [bpm, setBpm] = createSignal(props.node.get('bpm'))
    const [steps, setSteps] = createSignal(props.node.get('length'))


    const [activePart, setActivePart] = createSignal(0)
    const [pitchWidth, setPitchWidth] = createSignal(128)
    const [noteGrid, setNoteGrid] = createSignal(0.25)
    const [scale, setScale] = createSignal(1)
    const [aspect, setAspect] = createSignal(10)
    const [playing, setPlaying] = createSignal(false)
    const [mouseOver, setMouseOver] = createSignal(false)
    const [coords, setCoords] = createSignal([0, 0])
    const [flip, setFlip] = createSignal(false)








    Tone.Transport.bpm.value = props.node.get('bpm')


    const f = () => {
        setBpm(props.node.get('bpm'))
        Tone.Transport.bpm.value = props.node.get('bpm')
        setSteps(props.node.get('length'))
    }
    const g = () => {
        setParts(props.node.get('parts').toArray())
    }
    props.node.observe(f)
    props.node.get('parts').observe(g)
    // onCleanup(() => {
    //     props.node.has('parts') && props.node.get('parts').unobserve(g)
    //     console.log(props.node.toJSON())
    //     props.node.unobserve(f)
    // })


    const parseBeat = (time: string) => {
        const [bar, beat, sub] = time.split(':')
        return (parseInt(bar) + parseInt(sub) / 16) * aspect()
    }


    const nArray = (n: Y.Map<any>) => Array.from(n.get('notes').keys()).map((k: string) => {
        const [time, pitch] = k.split('~')
        return { time, pitch, length: n.get('notes').get(k) }
    }).sort((a: any, b: any) => Tone.Time(a.time).toSeconds() - Tone.Time(b.time).toSeconds())


    const Part: Component<{ node: Y.Map<any>, active: boolean }> = (props) => {

        const p = new Tone.Part((time, note) => {
            console.log(note)
            polySynth.triggerAttackRelease(note.pitch, note.length, time)
        }, nArray(props.node))

        p.loopStart = 0
        p.loop = true
        p.start(0)


        createEffect(() => p.loopEnd = `${steps()}m`)


        const [arr, setArr] = createSignal(nArray(props.node))
        arr().forEach((n: any) => console.log(n.time, Tone.Time(n.time).toSeconds()))
        const f = (yevent: Y.YMapEvent<any>) => {
            setArr(nArray(props.node))
            yevent.changes.keys.forEach((change, key) => {
                switch (change.action) {
                    case 'add':
                        p.add(key.split('~')[0], { pitch: key.split('~')[1], length: props.node.get('notes').get(key) })
                        break
                    case 'update':
                        // p.set(key.split('~')[0], {pitch: key.split('~')[1], length: props.node.get('notes').get(key)})
                        break
                    case 'delete':
                        p.remove(key.split('~')[0])
                        break
                    default:
                        break
                }
            })


        }
        props.node.get('notes').observe(f)
        let radius = 0.6

        return (
            <>
                <For each={arr()}>
                    {(n) =>
                        <>
                            <line x1={parseBeat(n.time)} y1={Tone.Midi(n.pitch).toMidi()} x2={parseBeat(n.time) + 3 * radius} y2={Tone.Midi(n.pitch).toMidi()} stroke={props.active ? 'black' : 'gray'} stroke-width="0.1" />
                            <line x1={parseBeat(n.time) + 3 * radius} y1={Tone.Midi(n.pitch).toMidi() - radius} x2={parseBeat(n.time) + 3 * radius} y2={Tone.Midi(n.pitch).toMidi() + radius} stroke={props.active ? 'black' : 'gray'} stroke-width="0.1" />
                            <polygon fill={props.active ? 'black' : 'gray'} points={`${parseBeat(n.time)},${Tone.Midi(n.pitch).toMidi() + radius} ${parseBeat(n.time) + radius},${Tone.Midi(n.pitch).toMidi()} ${parseBeat(n.time)},${Tone.Midi(n.pitch).toMidi() - radius} ${parseBeat(n.time) - radius},${Tone.Midi(n.pitch).toMidi()}`} />
                        </>
                    }
                </For>
            </>
        )
    }




    createEffect(() => {
        if (playing()) {
            Tone.Transport.start()
        } else {
            Tone.Transport.stop()
            polySynth.releaseAll()
        }
    })

    const handlePointerMove = (e: PointerEvent) => {
        !mouseOver() && setMouseOver(true)
        setCoords(d3.pointer(e))
    }

    const handlePointerLeave = (e: PointerEvent) => {
        setMouseOver(false)
    }

    const decimalToTransportTime = (d, f) => {
        const whole = Math.floor(d)
        const rem = d - whole
        const q = Math.round(rem * f)
        const sixteenths = q * (16 / f)
        if (sixteenths === 16) {
            return `${whole + 1}:0:0`
        } else {
            return `${whole}:0:${sixteenths}`
        }
    }

    const handleClick = (e: MouseEvent) => {
        console.log('click')
        const p = d3.pointer(e)
        const pitch = Tone.Midi(Math.round(p[1])).toNote()
        const t = decimalToTransportTime(p[0] / aspect(), Math.round(1 / noteGrid()))
        const key = `${t}~${pitch}`
        if (props.node.get('parts').get(activePart()).get('notes').has(key)) {
            props.node.get('parts').get(activePart()).get('notes').delete(key)
        } else {
            props.node.get('parts').get(activePart()).get('notes').set(key, '16n')
        }
    }


    const sw = 1

    const handleDrag = (e: PointerEvent) => {
        drag(e, props.node, props.state, 'content')
    }

    const handleMenu = (e: PointerEvent) => {
        menu(
            e,
            props.node,
            {
                'delete': () => props.node.parent.delete(props.node.parent.toArray().indexOf(props.node), 1)
            }
        )
    }

    return (
        <div  contenteditable={false} class="flex flex-col content">

            <div class="flex gap-1">
                <button contenteditable={false} onPointerDown={handleDrag} onClick={handleMenu} >~</button>
                <button contenteditable={false} class="bg-neutral-200" onClick={() => { setPlaying(p => !p) }}>{playing() ? 'Stop' : 'Play'}</button>
                <input class="w-16" type="number" min="30" max="240" value={bpm()} onChange={(e) => props.node.set('bpm',e.target.valueAsNumber)} />
                <select onChange={(e) => setNoteGrid(parseFloat(e.target.value))}>
                    <option value='1' >1/1</option>
                    <option value='0.5' >1/2</option>
                    <option value='0.25' selected>1/4</option>
                    <option value='0.125'>1/8</option>
                </select>
                <select onChange={(e) => setScale(parseFloat(e.target.value))}>
                    <option value={0} >C/Am</option>
                    <option value={1} >G/Em</option>
                    <option value={2} >D/Bm</option>
                    <option value={3} >A/F#m</option>
                    <option value={4} >E/C#m</option>
                    <option value={5} >B/G#m</option>
                    <option value={6} >F#/D#m</option>
                    <option value={7} >Db/Bbm</option>
                    <option value={8} >Ab/Fm</option>
                    <option value={9} >Eb/Cm</option>
                    <option value={10} >Bb/Gm</option>
                    <option value={11} >F/Dm</option>
                </select>
                <input class="w-14" type="number" min="4" max="64" value={steps()} onChange={(e) => props.node.set('length',e.target.valueAsNumber)} />
                <For each={parts()}>
                    {(p, index) => <>
                        <button classList={{ 'font-bold': index() === activePart() }} onClick={() => setActivePart(index())}>{p.get('instrument')}</button>
                        <button onClick={() => props.node.get('parts').delete(index())}>-</button>
                    </>}
                </For>
                <button onClick={() => props.node.get('parts').push([newPart()])}>+</button>
            </div>
            <Show when={!flip()}>
                <div class=" overflow-scroll max-h-96">
                    <svg viewBox={`-1 -1 ${steps() * aspect() + 2} ${pitchWidth()}`} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} onClick={handleClick}>
                        <For each={[...Array(pitchWidth()).keys()]}>
                            {(n) =>
                                <Show when={pitchInScale(scale(), n)}>
                                    <line y1={n} x1={0} y2={n} x2={steps() * aspect()} stroke={(n + 7 * scale()) % 12 === 0 ? "gray" : "lightgray"} stroke-width={sw} vector-effect="non-scaling-stroke" stroke-dasharray="1,1" />
                                </Show>
                            }
                        </For>
                        <For each={[...Array((1 / noteGrid()) * steps() + 1).keys()]}>
                            {(n, index) => (
                                <line x1={n * noteGrid() * aspect()} y1={0} x2={n * noteGrid() * aspect()} y2={pitchWidth()} stroke={index() % Math.round(1 / noteGrid()) === 0 ? "gray" : "lightgray"} stroke-width={sw} stroke-dasharray="1,1" vector-effect="non-scaling-stroke" />
                            )}
                        </For>
                        <For each={parts()}>
                            {(p, index) => <Part node={p} active={index() === activePart()} />}
                        </For>
                        <Show when={mouseOver()}>
                            <circle cx={Math.round(coords()[0] / (aspect() * noteGrid())) * aspect() * noteGrid()} cy={Math.round(coords()[1])} r={0.5} fill="red" />
                        </Show>
                    </svg>
                </div>
            </Show>
        </div>

    )
}



