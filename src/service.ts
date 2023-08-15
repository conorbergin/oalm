const API_URL = 'https://api.pernot.xyz'

import * as Y from 'yjs'
import { fixer } from './fixer'

const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])


const encrypt = async (data: ArrayBuffer, user: User) => {
    return await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv: iv
        },
        user.masterKey,
        data
    )
}

const decrypt = async (data: ArrayBuffer, user: User) => {
    try {
        return await crypto.subtle.decrypt(
            {
                name: "AES-GCM",
                iv: iv
            },
            user.masterKey,
            data
        )
    } catch (e) {
        console.log('failed to decrypt:' + e)
        return
    }
}




export type User = {
    userid: string,
    masterKey: CryptoKey,
    masterHash: string,
}

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
    ).then(key => crypto.subtle.exportKey("raw", key)).then(k => btoa(String.fromCharCode(...new Uint8Array(k))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''))

    return {
        userid,
        masterKey,
        masterHash,
    }
}


export const createKeychain = async (user: User) => {
    let doc = new Y.Doc()
    let kc = doc.getMap('pernot-keychain')
    let pk = doc.getMap('pernot-keypair')

    let keypair = await crypto.subtle.generateKey(
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
    let pub = await crypto.subtle.exportKey("spki", keypair.publicKey)
    // console.log('len: ' + pub.byteLength + ' b64: ' + btoa(dec.decode(pub)))


    let priv = await crypto.subtle.exportKey("pkcs8", keypair.privateKey)
    // console.log('len: ' + priv.byteLength + ' b64: ' + btoa(dec.decode(pub)))


    pk.set('private', new Uint8Array(priv))
    pk.set('public', new Uint8Array(pub))

    let first_key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )
    let first_key_export = await crypto.subtle.exportKey("raw", first_key)
    kc.set(crypto.randomUUID(), new Uint8Array(first_key_export))
    // console.log(kc.toJSON())
    // console.log(pk.toJSON())

    return [Y.encodeStateAsUpdate(doc), pub]
}

export const register = async (user: User, publicKey: ArrayBuffer, keychain: ArrayBuffer) => {
    if (publicKey.byteLength != 550) {
        throw new Error('invalid public key')
    }
    let url = `${API_URL}/register?userid=${user.userid}&userhash=${user.masterHash}`
    let body = new Blob([publicKey, await encrypt(keychain,user)])
    return fetch(url, {
        method: 'POST',
        body,
    })
}

export const putNotebook = async (user: User, doc: Y.Doc) => {
    let docid = doc.getMap('root').get('id')
    let url = `${API_URL}/notebook?userid=${user.userid}&userhash=${user.masterHash}&notebookid=${docid}`
    let body = await encrypt(Y.encodeStateAsUpdate(doc), user)
    fetch(url, {
        method: 'POST',
        body: body,
    })
}


export const getNotebook = async (user: User, docid: string) => {
    let url = `${API_URL}/notebook?userid=${user.userid}&userhash=${user.masterHash}&notebookid=${docid}`
    let resp = await fetch(url)
    if (!resp.ok || !resp.body) {
        console.log('no notebook')
        return
    }
    let data = await (await resp.blob()).arrayBuffer()
    return decrypt(data, user)
}

export const putKeychain = async (user: User, keychain: Y.Doc) => {
    let url = `${API_URL}/keychain?userid=${user.userid}&userhash=${user.masterHash}`
    let body = await encrypt(Y.encodeStateAsUpdate(keychain), user)
    fetch(url, {
        method: 'POST',
        body: body,
    })
}

export const getKeychain = async (user: User) => {
    let url = `${API_URL}/keychain?userid=${user.userid}&userhash=${user.masterHash}`
    let resp = await fetch(url)
    if (!resp.ok || !resp.body) {
        console.log('no keychain')
        return
    }
    let data = await (await resp.blob()).arrayBuffer()
    let dec = new TextDecoder()
    // console.log('encryted keychain: ' + btoa(dec.decode(data)))
    return decrypt(data, user)
}




export const createNotebook = async (): Promise<[string, ArrayBuffer, ArrayBuffer]> => {
    let key = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )
    let ek = await crypto.subtle.exportKey("raw", key)
    let guid = crypto.randomUUID()
    let ydoc = new Y.Doc()
    ydoc.getMap('root').set('id', guid)
    fixer(ydoc.getMap('root'))
    let update = Y.encodeStateAsUpdate(ydoc)
    return [guid, update, ek]
}

export const hello = async () => fetch(`${API_URL}/hello`).then(resp => resp.text())


export const authenticate = async (user: User) => {
    let url = `${API_URL}/authorize?userid=${user.userid}&userhash=${user.masterHash}`
    return fetch(url)
}




export const inviteUser = async (user: User, inviteeId: string, notebookId: string, notebookKey: string) => {
    let url = `${API_URL}/publickey?userid=${user.userid}&userhash=${user.masterHash}&invitee=${inviteeId}`
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
            modulusLength: 4096,
            publicExponent: new Uint8Array([1, 0, 1]),
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
    let url2 = `${API_URL}/invite?userid=${user.userid}&userhash=${user.masterHash}&invitee=${inviteeId}`
    return fetch(url2, {
        method: 'POST',
        body: encryptedKey,
    })
}


export const secret2txt = async (secret: CryptoKey) => {
    let b = await crypto.subtle.exportKey("raw", secret)
    return btoa(String.fromCharCode(...new Uint8Array(b)))
}

export const txt2secret = async (txt: string) => {
    let b = atob(txt)
    return await crypto.subtle.importKey(
        "raw",
        new Uint8Array([...b].map(c => c.charCodeAt(0))),
        {
            name: "AES-GCM",
            length: 256
        },
        true,
        ["encrypt", "decrypt"]
    )
}