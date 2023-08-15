import * as Y from 'yjs'

export const test = () => {

    const docA = new Y.Doc()
    const docB = new Y.Doc()

    const arrayA = docA.getArray('array')
    const arrayB = docB.getArray('array')


    arrayA.insert(0, ['a', 'b', 'c'])

    arrayB.insert(0, ['d', 'e', 'f'])
    arrayB.push(['A', 'B', 'C'])

    console.log('before merge', arrayA.toJSON(), arrayB.toJSON())

    Y.applyUpdate(docA, Y.encodeStateAsUpdate(docB))
    Y.applyUpdate(docB, Y.encodeStateAsUpdate(docA))

    console.log('after merge', arrayA.toJSON(), arrayB.toJSON())
}