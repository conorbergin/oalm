import * as Y from 'yjs'
import { Observable } from 'lib0/observable'

const iv = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])


export const encrypt = async (data: ArrayBuffer, key: CryptoKey) => crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, key, data)

export const decrypt = async (data: ArrayBuffer, key: CryptoKey) => crypto.subtle.decrypt({ name: "AES-GCM", iv: iv }, key, data)

export interface EncryptedWebsocketProvider {
    doc: Y.Doc,
    open : boolean
    key: CryptoKey
    _ws : WebSocket
    _updateHandler: (update:any,origin:any) => void
}

export class EncryptedWebsocketProvider extends Observable<string> {
    constructor(serverUrl : string,roomname :string, doc: Y.Doc, key: CryptoKey) {
        super()

        this.doc = doc
        this.key = key
        

        this._ws = new WebSocket(serverUrl + roomname)

        this._ws.onopen = () => console.log('open')
        this._ws.onclose = () => console.log('close')
        this._ws.onmessage = async msg => {
            if (msg.data instanceof Blob) {
                const e = new Uint8Array(await msg.data.arrayBuffer())
                console.log(e)
                const u = await decrypt(e,this.key)
                Y.applyUpdate(this.doc, new Uint8Array(u))
            }
        }

        this._updateHandler = async (update,origin) => {
            if (origin !== this) {
                console.log(update)
                if (this._ws.readyState === WebSocket.OPEN) {
                    this._ws.send(await encrypt(update,this.key))
                }
            }
        }
        this.doc.on('update',this._updateHandler)
    }

    destroy() {}

    disconnect() {}

    connect() {}
}