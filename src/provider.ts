import * as Y from 'yjs'
import { Observable } from 'lib0/observable'




export interface EncryptedWebsocketProvider {
    doc: Y.Doc,

    _ws : WebSocket
    _updateHandler: (update:any,origin:any) => void
}

export class EncryptedWebsocketProvider extends Observable<string> {
    constructor(serverUrl : string,roomname :string, doc: Y.Doc) {
        super()

        this.doc = doc

        this._ws = new WebSocket(serverUrl)

        this._ws.onopen = () => console.log('open')
        this._ws.onclose = () => console.log('close')
        this._ws.onmessage = () => {}

        
        this._updateHandler = (update,origin) => {
            if (origin !== this) {
                // encrypt and broadacst update
                console.log(update)
            }
        }
        this.doc.on('update',this._updateHandler)
    }

    destroy() {}

    disconnect() {}

    connect() {}
}