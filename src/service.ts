const API_URL = 'https://oalm-api.pernot.workers.dev'

import * as Y from 'yjs'

import { Base64 } from 'js-base64'

export type User = {
    userid: string,
    masterKey: CryptoKey,
    masterHash: string,
}

const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])

const encrypt = async (data: ArrayBuffer, user: User) => crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, user.masterKey, data)

const decrypt = async (data: ArrayBuffer, user: User) => crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, user.masterKey, data)

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

export const createKeychain = async (user: User) => {
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
    await createNotebook(keychain)
    return [Y.encodeStateAsUpdate(doc), pub]
}

export const createNotebook = async (keychain: Y.Map<any>) => {
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

export const register = async (user: User, publicKey: ArrayBuffer, keychain: ArrayBuffer) => {
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

export const putDoc = async (user: User, doc: Y.Doc, id: string, read:string, write: string) => {
    let url = `${API_URL}/doc?user=${user.userid}&hash=${user.masterHash}&doc=${id}&write=${write}&read=${read}`
    let body = await encrypt(Y.encodeStateAsUpdate(doc), user)
    fetch(url, {
        method: 'POST',
        body: body,
    })
}

export const getDoc = async (user: User, docid: string, read: string) => {
    let url = `${API_URL}/doc?user=${user.userid}&hash=${user.masterHash}&doc=${docid}&read=${read}`
    let resp = await fetch(url)
    if (!resp.ok) {
        console.log('doc')
        return
    }
    let data = await (await resp.blob()).arrayBuffer()
    return decrypt(data, user)
}

export const putKeychain = async (user: User, keychain: Y.Doc) => {
    let url = `${API_URL}/keychain?user=${user.userid}&hash=${user.masterHash}`
    let body = await encrypt(Y.encodeStateAsUpdate(keychain), user)
    fetch(url, {
        method: 'POST',
        body: body,
    })
}

export const getKeychain = async (user: User) => {
    let url = `${API_URL}/keychain?user=${user.userid}&hash=${user.masterHash}`
    let resp = await fetch(url)
    if (!resp.ok || !resp.body) {
        console.log('no keychain')
        return
    }
    let data = await (await resp.blob()).arrayBuffer()
    return decrypt(data, user)
}

export const authenticate = async (user: User) => {
    let url = `${API_URL}/authorize?user=${user.userid}&hash=${user.masterHash}`
    return fetch(url)
}

export const inviteUser = async (user: User, inviteeId: string, notebookId: string, notebookKey: string) => {
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

// export const hello = async () => fetch(`${API_URL}/hello`).then(resp => resp.text())

// export const secret2txt = async (secret: CryptoKey) => {
//     let b = await crypto.subtle.exportKey("raw", secret)
//     return btoa(String.fromCharCode(...new Uint8Array(b)))
// }

// export const txt2secret = async (txt: string) => {
//     let b = atob(txt)
//     return await crypto.subtle.importKey(
//         "raw",
//         new Uint8Array([...b].map(c => c.charCodeAt(0))),
//         {
//             name: "AES-GCM",
//             length: 256
//         },
//         true,
//         ["encrypt", "decrypt"]
//     )
// }