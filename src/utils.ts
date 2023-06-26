import * as Y from 'yjs'


export const hasTag = (node : Y.AbstractType<any>, tag : string) : boolean => node instanceof Y.Map && node.get('tag') === tag

export const yIndex = (node : Y.AbstractType<any>) : number => node.parent.toArray().indexOf(node)

export const yKey = (node : Y.AbstractType<any>) : string => node.parent.entries().find(([k,v]) => v === node)[0]



export const yReplace = (oldNode : Y.AbstractType<any>, newNode : Y.AbstractType<any>) => {
    let parent = oldNode.parent
    switch (parent.constructor) {
        case Y.Array:
            let index = yIndex(oldNode)
            parent.insert(index, [newNode])
            parent.delete(index+1, 1)
            break
        case Y.Map:
            parent.set(yKey(oldNode), newNode)
            break
    }
}

export const genId = (length : number) => {
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