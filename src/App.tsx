import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect, onCleanup, Accessor, Setter } from 'solid-js'


import { deriveUser, getKeychain, putKeychain, hello, User, authenticate, createNotebook, register, createKeychain } from './service'

import { Portal } from 'solid-js/web'
import { CalendarView } from './Calendar'
import { Pernot } from './Pernot'

import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
import { createTable } from './table'

const createYJSMapSignal = (map: Y.Map<any>) => {
    const [signal, setSignal] = createSignal(Array.from(map.entries()))
    let f = () => setSignal(Array.from(map.entries()))
    map.observe(f)
    onCleanup(() => {
        map.unobserve(f)
    })
    return signal
}

export const UserView = (props: { user: User }) => {

    let kcdoc = new Y.Doc()
    let idbprov = new IndexeddbPersistence(props.user.userid, kcdoc)
    let [keychain, setKeychain] = createSignal<any>(null)

    const [doc, setDoc] = createSignal(null)
    const [screen, setScreen] = createSignal(0)


    let f = () => {
        setKeychain(Array.from(kcdoc.getMap('pernot-keychain').entries()))
        putKeychain(props.user, kcdoc)
    }

    createEffect(() => {
        getKeychain(props.user).then((k) => {
            if (k === undefined) throw new Error('Keychain not found')
            Y.applyUpdate(kcdoc, new Uint8Array(k))
            kcdoc.getMap('pernot-keychain').observe(f)
        })
        onCleanup(() => {
            kcdoc.getMap('pernot-keychain').unobserve(f)
        })
    })


    return (
        <>
            <div class="flex flex-col fixed w-full h-full">
                <div class="p-1 pb-0">
                    <div class="flex gap-4 text-sm">
                        <button onClick={() => { setScreen(screen() === 1 ? 0 : 1) }}>Calendar</button>
                        <button onClick={() => { setScreen(screen() === 1 ? 0 : 1) }}>Pernot</button>
                    </div>
                    <Show when={screen() === 0}>
                        <div class="flex gap-4 text-sm">
                        </div>
                    </Show>
                </div>
                <Switch>
                    <Match when={screen() === 0}>
                        <Show when={doc()}>
                            <Pernot doc={doc()!} />
                        </Show>
                    </Match>
                    <Match when={screen() === 1}>
                        <CalendarView />
                    </Match>
                </Switch>
            </div>

        </>

    )
}


export const App: Component = () => {

    const [message, setMessage] = createSignal('')
    const [login, setLogin] = createSignal(false)
    const [user, setUser] = createSignal<null | User>(null)



    let e: HTMLInputElement
    let p: HTMLInputElement
    let c: HTMLInputElement

    const handleSubmit = async () => {
        let user = await deriveUser(e.value, p.value)
        let resp = await authenticate(user)
        if (resp.ok) {
            setUser(user)
        } else if (resp.status === 404) {
            p.value = ''
            setMessage('Wrong password')
        } else if (resp.status === 401) {
            p.value = ''
            setMessage('Email unverified')
        } else {
            setMessage('Email sent')
            let [kc, priv] = await createKeychain(user)
            let d = new Y.Doc()
            Y.applyUpdate(d,new Uint8Array(kc))
            let idbprov = new IndexeddbPersistence(user.userid, d)
            await idbprov.whenSynced
            idbprov.destroy()
            register(user, priv)
        }

    }

    return (
        <div >
            <Switch>
                <Match when={user() && login()}>
                    <button onClick={() => { setUser(null); setLogin(false) }}>Sign Out</button>
                    <UserView user={user()!} />
                </Match>
                <Match when={login()}>
                    <button onClick={() => { setLogin(false) }}>Sign Out</button>
                    <Pernot doc={{id:'default',secret:null}}/>
                </Match>
                <Match when={true}>
                    <div class="flex justify-center pt-12">
                        <div class="flex flex-col gap-4 w-96" >
                            <h1 class="text-2xl font-bold">Pernot</h1>
                            <span >{message()}</span>
                            <input class="border-b border-black p-2" ref={e} type="email" placeholder="email" />
                            <input class="border-b border-black p-2" ref={p} type="password" placeholder="password" />
                            <div class="flex gap-2"><input ref={c} type="checkbox" textContent="save details" />Save data locally (I own this computer)</div>
                            <button onClick={handleSubmit}>Sign In / Register</button>
                            <button onClick={() => { setLogin(true) }}>Continue as Guest</button>
                        </div>
                    </div>
                </Match>
            </Switch>
        </div>
    )
}