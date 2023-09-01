import { Accessor, onCleanup, createSignal } from 'solid-js'
import * as Y from 'yjs'


export const hasTag = (node: Y.AbstractType<any>, tag: string): boolean => node instanceof Y.Map && node.get('tag') === tag

export const yIndex = (node: Y.AbstractType<any>): number => node.parent.toArray().indexOf(node)

export const yKey = (node: Y.AbstractType<any>): string => node.parent.entries().find(([k, v]) => v === node)[0]

export const yDeleteFromArray = (node: Y.AbstractType<any>) => {
    (node.parent as Y.Array<any>).delete((node.parent as Y.Array<any>).toArray().indexOf(node), 1)
}

export const yReplaceInArray = (oldNode: Y.AbstractType<any>, newNode: Y.AbstractType<any>) => {
    const parent = oldNode.parent as Y.Array<any>
    const index = parent.toArray().indexOf(oldNode)
    Y.transact(oldNode.doc!, () => {
        parent.delete(index, 1)
        parent.insert(index,[newNode])
    })
}

export const yReplace = (oldNode: Y.AbstractType<any>, newNode: Y.AbstractType<any>) => {
    let parent = oldNode.parent
    switch (parent.constructor) {
        case Y.Array:
            let index = yIndex(oldNode)
            parent.insert(index, [newNode])
            parent.delete(index + 1, 1)
            break
        case Y.Map:
            parent.set(yKey(oldNode), newNode)
            break
    }
}

export const genId = (length: number) => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;

    const cryptoArray = new Uint8Array(length);
    window.crypto.getRandomValues(cryptoArray);

    let id = '';
    for (let i = 0; i < length; i++) {
        id += characters[cryptoArray[i] % charactersLength];
    }

    return id;
}


export const yArraySignal = (a: Y.Array<any>): Accessor<Array<any>> => {
    const [arr, setArr] = createSignal(a.toArray())
    const f = () => setArr(a.toArray())
    a.observe(f)
    onCleanup(() => a && a.unobserve(f))
    return arr
}

export const ySignal = (node: Y.Map<any>, key: string): Accessor<any> => {
    const [sig, setSig] = createSignal(node.get(key) ?? null)
    const f = () => setSig(node.get(key) ?? null)
    node.observe(f)
    onCleanup(() => node && node.unobserve(f))
    return sig
}