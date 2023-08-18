import { Component, For, Switch, Match, Suspense, onMount, lazy, Show, createSignal, createEffect, onCleanup, Accessor, Setter } from 'solid-js'

import { deriveUser, getKeychain, putKeychain, hello, User, authenticate, createNotebook, register, createKeychain } from './service'

const ACCOUNT_NOT_AUTHENTICATED = 490
const ACCOUNT_NOT_VERIFIED = 491
const ACCOUNT_NOT_REGISTERED = 492

const ACCOUNT_ALREADY_REGISTERED = 493
const ACCOUNT_ALREADY_VERIFIED = 494

const MISSING_PARAMETERS = 495
const BAD_TOKEN = 496

import { Portal } from 'solid-js/web'
import { CalendarView } from './Calendar'
import { Pernot } from './Pernot'
import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'

export const App: Component = () => {


    const [message, setMessage] = createSignal('')
    const [login, setLogin] = createSignal(false)
    const [user, setUser] = createSignal<null | User>(null)

    let e: HTMLInputElement
    let p: HTMLInputElement
    let c: HTMLInputElement

    const handleSubmit = async () => {

        let user = await deriveUser(e.value, p.value)
        console.log(user)
        let resp = await authenticate(user)
        if (resp.ok) {

            setUser(user)
            setLogin(true)
        } else if (resp.status === ACCOUNT_NOT_AUTHENTICATED) {
            p.value = ''
            setMessage('Wrong password')
        } else if (resp.status === ACCOUNT_NOT_VERIFIED) {
            p.value = ''
            setMessage('Email unverified')
        } else {
            let [kc, pub] = await createKeychain(user)
            let r = await register(user, pub, kc)
            setMessage('Email sent')
        }

    }

    return (
        <div class="fixed h-screen w-screen">

            <Switch>
                <Match when={user() && login()}>
                    <button onClick={() => { setUser(null); setLogin(false) }}>Sign Out</button>
                    <UserView user={user()!} />
                </Match>
                <Match when={login()}>
                    <button onClick={() => { setLogin(false) }}>Sign Out</button>
                    <Pernot doc={{ id: 'default', secret: null }} />
                </Match>
                <Match when={true}>
                    <div class="flex justify-center pt-12">
                        <div class="flex flex-col gap-4 w-96" >
                            <h1 class="text-6xl font-script text-center">Pernote</h1>
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


export const UserView: Component<{ user: User }> = (props) => {

    console.log(props.user)
    let kcdoc = new Y.Doc()
    let idbprov = new IndexeddbPersistence(props.user.userid, kcdoc)
    let [keychain, setKeychain] = createSignal<any>(null)

    const [doc, setDoc] = createSignal(null)


    let f = () => {
        setKeychain(Array.from(kcdoc.getMap('pernot-keychain').entries()))
        putKeychain(props.user, kcdoc)
    }

    createEffect(() => {
        getKeychain(props.user).then((k) => {
            if (k === undefined) throw new Error('Keychain not found')
            Y.applyUpdate(kcdoc, new Uint8Array(k))
            kcdoc.getMap('pernot-keychain').observe(f)
            f()
        })
        onCleanup(() => {
            kcdoc.getMap('pernot-keychain').unobserve(f)
        })
    })


    return (
        <>
            <Show when={keychain()} fallback="waiting for keychain ...">
                <Show when={doc()} fallback={
                    <div class="flex  flex-col justify-center gap-2">
                        <For each={keychain()}>
                            {([id, secret]: [string, ArrayBuffer]) => <button onClick={() => { setDoc({ id, secret }) }}>{id}</button>}
                        </For>
                    </div>
                }>
                    <Pernot doc={doc()} user={props.user} />
                </Show>
            </Show>
        </>

    )
}