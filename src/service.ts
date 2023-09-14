const API_URL = 'https://oalm-api.pernot.workers.dev'

import * as Y from 'yjs'

import { Base64 } from 'js-base64'

export type UserData = {
    userid: string,
    masterKey: CryptoKey,
    masterHash: string,
}

export type DocData = {
    id: string,
    read: string,
    write?: string,
}

const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

const encrypt = async (data: ArrayBuffer, user: UserData) => crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, user.masterKey, data)

const decrypt = async (data: ArrayBuffer, user: UserData) => crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, user.masterKey, data)

export const deriveUser = async (userid: string, password: string) => {
    let enc = new TextEncoder()
    let mat = await crypto.subtle.importKey(
        "raw",
        enc.encode(password),
        "PBKDF2",
        false,
        ["deriveKey", "deriveBits"]
    )
    let masterKey = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode(userid),
            iterations: 10000,
            hash: "SHA-256"
        },
        mat,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )
    let masterHash = await crypto.subtle.deriveKey(
        {
            name: "PBKDF2",
            salt: enc.encode('hfjdskf'),
            iterations: 1000,
            hash: "SHA-256"
        },
        mat,
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt"]
    )
        .then(key => crypto.subtle.exportKey("raw", key))
        .then(k => Base64.fromUint8Array(new Uint8Array(k), true))

    return {
        userid,
        masterKey,
        masterHash,
    }
}

export const createKeychain = async (user: UserData) => {
    let doc = new Y.Doc()
    let keychain = doc.getMap('oalm-keychain')
    let keypair = doc.getMap('oalm-keypair')

    let kp = await crypto.subtle.generateKey(
        {
            name: "RSA-OAEP",
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt", "decrypt"]
    )
    // console.log('a')

    let dec = new TextDecoder()
    let enc = new TextEncoder()
    let pub = await crypto.subtle.exportKey("spki", kp.publicKey)
    let priv = await crypto.subtle.exportKey("pkcs8", kp.privateKey)

    keypair.set('private', new Uint8Array(priv))
    keypair.set('public', new Uint8Array(pub))
    await createDoc(keychain)
    return [Y.encodeStateAsUpdate(doc), pub]
}

export const createDoc = async (keychain: Y.Map<any>) => {
    let key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )
    let ek = await crypto.subtle.exportKey("raw", key)
    let m = new Y.Map()
    let read = new Uint8Array(16)
    let write = new Uint8Array(16)
    crypto.getRandomValues(read)
    crypto.getRandomValues(write)
    let r = Base64.fromUint8Array(new Uint8Array(read), true)
    let w = Base64.fromUint8Array(new Uint8Array(write), true)
    m.set('private', new Uint8Array(ek))
    m.set('read', r)
    m.set('write', w)
    console.log(m.toJSON())
    keychain.set(crypto.randomUUID(), m)
}

export const register = async (user: UserData, publicKey: ArrayBuffer, keychain: ArrayBuffer) => {
    if (publicKey.byteLength != 550) {
        alert('invalid public key')
    }
    let url = `${API_URL}/register?user=${user.userid}&hash=${user.masterHash}`
    let body = new Blob([publicKey, await encrypt(keychain, user)])
    return fetch(url, {
        method: 'POST',
        body,
    })
}





export const syncKeychain = async (doc: Y.Doc, user: UserData, counters: Map<string, string>, modified: boolean) => {
    const g = await fetch(`${API_URL}/keychain?user=${user.userid}&hash=${user.masterHash}&counter=${counters.get(user.userid)}`)
    if (g.ok) {
        const s_counter = g.headers.get('counter')
        console.log(`counter ${counters.get(user.userid)}, server counter: ${s_counter}`)
        await decrypt(await (await g.blob()).arrayBuffer(), user).then(u => Y.applyUpdate(doc, new Uint8Array(u))).catch(e => console.log('decryption error:' + e))
        if (s_counter) { counters.set(user.userid, s_counter) }
    } else {
        console.log(await g.text())
    }
    if (modified) {
        const p = await fetch(
            `${API_URL}/keychain?user=${user.userid}&hash=${user.masterHash}`,
            {
                method: 'POST',
                body: await encrypt(Y.encodeStateAsUpdate(doc), user)
            }
        )
        if (p.ok) {
            console.log('hello counter')
            const c = counters.get(user.userid)
            if (c) { counters.set(user.userid, `${parseInt(c) + 1}`) }
        }
    }
}

export const syncDoc = async (doc: Y.Doc, meta: DocData, user: UserData, counters: Map<string, string>, modified: boolean) => {
    const g = await fetch(`${API_URL}/doc?user=${user.userid}&hash=${user.masterHash}&doc=${meta.id}&read=${meta.read}&counter=${counters.get(meta.id)}`)
    if (g.ok) {
        const s_counter = g.headers.get('counter')
        console.log(`counter ${counters.get(meta.id)}, server counter: ${s_counter}`)
        await decrypt(await (await g.blob()).arrayBuffer(), user).then(u => Y.applyUpdate(doc, new Uint8Array(u))).catch(e => console.log('decryption error:' + e))
        if (s_counter) { counters.set(meta.id, s_counter) }
    } else {
        console.log(await g.text())
    }
    if (modified && meta.write) {
        const p = await fetch(
            `${API_URL}/doc?user=${user.userid}&hash=${user.masterHash}&doc=${meta.id}&write=${meta.write}&read=${meta.read}`,
            {
                method: 'POST',
                body: await encrypt(Y.encodeStateAsUpdate(doc), user)
            }
        )
        if (p.ok) {
            const c = counters.get(meta.id)
            if (c) { counters.set(meta.id, `${parseInt(c) + 1}`) }
        }
    }
}


export const authenticate = async (user: UserData) => {
    let url = `${API_URL}/authorize?user=${user.userid}&hash=${user.masterHash}`
    return fetch(url)
}

export const inviteUser = async (user: UserData, inviteeId: string, notebookId: string, notebookKey: string) => {
    let url = `${API_URL}/publickey?user=${user.userid}&hash=${user.masterHash}&email=${inviteeId}`
    let resp = await fetch(url)
    let body = await resp.body
    if (!body) {
        return
    }
    let publickey = await (await resp.blob()).arrayBuffer()
    let key = await crypto.subtle.importKey(
        "spki",
        new Uint8Array(publickey),
        {
            name: "RSA-OAEP",
            // modulusLength: 4096,
            // publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256"
        },
        true,
        ["encrypt"]
    )
    let encryptedKey = await crypto.subtle.encrypt(
        {
            name: "RSA-OAEP"
        },
        key,
        new TextEncoder().encode(notebookId + notebookKey)
    )
    let url2 = `${API_URL}/invite?user=${user.userid}&hash=${user.masterHash}&email=${inviteeId}`
    return fetch(url2, {
        method: 'POST',
        body: encryptedKey,
    })
}