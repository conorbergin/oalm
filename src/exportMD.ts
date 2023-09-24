import * as Y from 'yjs'
import { TEXT, CONTENT, CHILDREN, ROOT_CHILDREN, ROOT_CONTENT, ROOT_TEXT } from './input'


export const exportMD = (section: Y.Map<any>) => exportFormat(section,1,'markdown')


export const exportFormat = (section:Y.Map<any> | Y.Doc, level: number, format:string):string[] => {
    if (!['html','markdown'].includes(format)) {throw new Error('bad format specifier')}
    try {
        const isDoc = section instanceof Y.Doc
        const header = isDoc ? section.getText(ROOT_TEXT).toString() : section.get(TEXT).toString()
        const content = isDoc ? section.getArray(ROOT_CONTENT).toArray() : section.get(CONTENT).toArray()
        const children = isDoc ? section.getArray(ROOT_CHILDREN).toArray() : section.get(CHILDREN).toArray()
        const header_out = format === 'markdown' ? `${'#'.repeat(level)} ${header}` : format === 'html' ? `<h${level}>${header}</h${level}` : ''
        const children_out = format === 'markdown' ? content.flatMap(l => markdownContent(l)) : format === 'html' ? content.map(l => htmlContent(l)) : []
        return [header_out, ...children_out,...children.flatMap(c => exportFormat(c,level+1,format))]

    } catch (err) {
        console.log('export error')

    }
}

const markdownContent = (c : Y.Text | Y.Map<any>) => {
    if (c instanceof Y.Text) { return c.toString()}
    if (c instanceof Y.Map) {
        if (c.has('header')) {
            return 'table'
        } else {
            return 'not table'
        }
    }
}

const htmlContent = (c : Y.Text | Y.Map<any>) => {
    if (c instanceof Y.Text) { return `<p>"${c.toString()}"</p>`}
    if (c instanceof Y.Map) {
        if (c.has('header')) {
            return 'table'
        } else {
            return 'not table'
        }
    }
}