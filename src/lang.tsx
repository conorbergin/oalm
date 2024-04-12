import { Temporal } from "@js-temporal/polyfill"

const headerRowSymbol = "-"

const HEADING_SYMBOL = "="

export const OL_SYM = "+"
export const UL_SYM = "-"


const branch = (a: number, b?: number) => b ? `branch-${a}-${b}` : `branch-${a}`
const leaf = (a: number, b?: number) => b ? `leaf-${a}-${b}` : `leaf-${a}`


export type LexText = {
    location: number,
    text: string
}

export type LineAttrs = { kind: "heading", level: number }


export abstract class CSTNode {
    constructor(public location: number) { }

    abstract render(): any;
}

const textOrBr = (s: string) => s === "" ? <br /> : s


const renderHeading = (text: string, level: number) => <></>


// class={`font-bold ${this.level === 1 && this.location > 0 ? "mt-2 pt-2 border-t border-dashed" : ""}`}
export class Line extends CSTNode {
    constructor(location: number, public text: string, public attr?: LineAttrs) {
        super(location)
    }
    render() {
        if (this.attr?.kind === "heading") {
            return (
                <div data-index={leaf(this.location)} classList={{ "mt-2 pt-2 border-t border-dashed": this.attr.level === 1 && this.location > 0 }} class="font-bold">
                    <span class="text-gray-500">{this.text.slice(0, this.attr.level)}</span><span>{this.text.slice(this.attr.level)}</span>
                </div>
            )
        } else {
            return <div data-index={leaf(this.location)}>{textOrBr(this.text)}</div>
        }
    }
}

export type LexLine = {
    kind: "line",
    location: number,
    text: string
}

export type LexHeading = {
    kind: "heading",
    location: number,
    level: number,
    text: string,
    date: Date | null
}

export type Date = {
    text: string,
    date: any
}

export type LexTable = {
    kind: "table",
    location: number,
    header: { row: LexText[], separator: LexText } | null
    body: LexText[][]
}

export type LexList = {
    location: number,
    kind: "list",
    decorator: string,
    body: LexListItem[]
}

export type LexListItem = {
    // kind:"listitem",
    location:number,
    text:string,
    children: LexBlock[]
}


export type LexBlock = LexList | LexTable | LexHeading | LexLine

export class Table extends CSTNode {
    constructor(location: number, public body: LexText[][]) {
        super(location);
    }

    render() {
        const width = Math.max(...this.body.map(r => r.length));
        let ret: any[] = [];

        for (let row of this.body) {
            const last = row.at(-1)!.location += row.at(-1)!.text.length;
            const arr = new Array(width - row.length);

            ret.push(
                ...row.map((x, idx) => <div class={`${idx === 0 ? "" : "border-l"} mt-1 mb-1 pl-1 pr-1`} data-index={leaf(x.location)}>{textOrBr(x.text)}</div>),
                ...arr.fill(() => <div class="border-l mt-1 mb-1 pl-1 pr-1 border-gray-500" data-index={leaf(last)}><br /></div>)
            );
        }

        return <div data-index={branch(this.location)} style={{ "grid-template-columns": `repeat(${width},auto)` }} class="grid text-green-500">{ret}</div>
    }
}


export class HeaderTable extends CSTNode {
    constructor(location: number, public header: LexText[], public divider: LexText, public body: LexText[][]) {
        super(location);
    }

    render() {
        const width = Math.max(...this.body.map(r => r.length), ...[this.header.length]);
        const endOfRowLocation = (row: LexText[]) => row.at(-1)!.location + row.at(-1)!.text.length;
        const renderText = (text: LexText, className: string) => <div data-index={leaf(this.location)} class={className}>{textOrBr(text.text)}</div>;

        return (
            <div class="text-green-700 grid" data-index={branch(this.location)} style={{ "grid-template-columns": `repeat(${width},auto)` }}>
                {[...this.header.map((x, idx) => renderText(x, `${idx === 0 ? "" : "border-l"} mt-1 pl-1 pr-1 font-bold`)), ...Array(width - this.header.length).fill(renderText({ location: endOfRowLocation(this.header), text: "" }, "mt-1 mb-1 pl-1 pr-1 border-l"))]}
                <div data-index={leaf(this.divider.location)} class="text-sm leading-3" style="grid-column: 1 / -1">{this.divider.text}</div>
                {this.body.flatMap((x, outerIdx) =>
                    [...x.map((y, idx) =>
                        renderText(y, `${idx === 0 ? "" : "border-l"} ${outerIdx === 0 ? "" : "mt-1"} mb-1 pl-1 pr-1`)), ...Array(width - x.length).fill(renderText({ location: endOfRowLocation(x), text: "" }, "mt-1 mb -1 pl-1 pr-1 border-l"))
                    ]
                )}
            </div>
        )

    }
}

export class List extends CSTNode {
    constructor(location: number, public decorator: string, public body: Array<LexText | List>) {
        super(location)
    }

    render() {
        return <div class="text-blue-500" data-index={branch(this.location)} >{this.body.map(x => x instanceof List ? x.render() : <div data-index={leaf(x.location)}>{x.text}</div>)}</div>
    }
}

function parseListItem(line: string) {
    let indent = 0
    let kind = ""

    for (let c of line) {
        if (c === " ") {
            if (kind === "") {
                indent++
            } else {
                return { kind, indent }
            }
        } else if (c === OL_SYM) {
            kind = OL_SYM
        } else if (c === UL_SYM) {
            kind = UL_SYM
        } else {
            return null
        }
    }
    return null
}

function parseDate(s:string):Date {
 
    let date = null
    try {
        date = Temporal.PlainDate.from(s) ?? null
    } catch (e) {
        
    } 
    return {
        text:s,
        date
    }
}

function parseHeadingOrLine(location: number, text: string): LexLine | LexHeading {
    if (!text.startsWith(HEADING_SYMBOL)) {
        return { kind: "line", location, text }
    }
    for (let i = 0; i < 6; i++) {
        if (text[i] === HEADING_SYMBOL) {
            continue;
        } else if (text[i] === " ") {
            if (text.includes("#")) {
                let [head,date] = text.split("#")
                try {
                    let d = Temporal.PlainDate.from(date.trim())
                    return { kind: "heading", location, level:i, text: head, date: {date:d,text:date}}
                } catch (e) {
                    return { kind: "heading", location, level:i, text: head + "#" + date, date: null}
                }
            } else {
                return { kind: "heading", location, level: i, text, date: null }
            }
        } else {
            break;
        }
    }
    return { kind: "line", location, text }

}

const parseCells = (loc:number,s:string):LexText[] => {



    let count = loc
    let parsed = []
    for (let t of s.split("|")) {
        parsed.push({text:t,location:count})
        count += t.length  + 1
    }
    return parsed
}

export function parse(text: string): LexBlock[] {

    if (!text) {
        return [{ kind: "line", text: "", location: 0 }]
    }


    const parsed: LexBlock[] = []

    let lines = text.split("\n")
    let locs = lines.reduce((acc, it) => acc.concat(it.length + acc.at(-1)! + 1), [0])

    let idx = -1

    outer: while (++idx < lines.length) {
        if (lines[idx].includes("|")) {

            const cells = parseCells(locs[idx], lines[idx])
            const last = parsed.at(-1)
            if (last?.kind === "table") {
                last.body.push(cells)
            } else {
                parsed.push({ kind: "table", body: [cells], header: null, location: locs[idx] })
            }
        } else if (lines[idx].startsWith("---")) {
            const last = parsed.at(-1)
            if (last?.kind === "table" && last.body.length === 1) {
                last.header = { row: last.body[0], separator: { location: locs[idx], text: lines[idx] } }
                last.body = []
            } else {
                parsed.push({ kind: "line", location: locs[idx], text: lines[idx] })
            }
            // } else if (lines[idx].startsWith("```")) {
            //     let fc = new FencedCode(locs[idx], [{ location: locs[idx], text: lines[idx] }])
            //     parsed.push(fc)
            //     while (++idx < lines.length) {
            //         fc.lines.push({ text: lines[idx], location: locs[idx] })
            //         if (lines[idx].startsWith("```")) {
            //             break;
            //         }
            //     }

        // } else if (lines[idx].startsWith(UL_SYM + " ") || lines[idx].startsWith(OL_SYM + " ")) {
        //     // List parsing
        //     // A flat list is simply:
        //     // - apple
        //     // - banana
        //     // - pear
        //     //
        //     // Use + for a numbered list
        //     //
        //     // Nested lists can be made by indenting your list by one more space than the parent list, any more and the list will fail
        //     //
        //     let l: LexList = { kind: "list", location: locs[idx], decorator: lines[idx][0], body: [{ location: locs[idx], text: lines[idx],children:[] }] }
        //     parsed.push(l)
        //     let stack = [l]
        //     // while (++idx < lines.length) {
        //     //     let r = parseListItem(lines[idx]);
        //     //     if (!r) {
        //     //         idx--;
        //     //         continue outer;
        //     //     } else if (r.kind === stack.at(-1)?.decorator && r.indent === stack.length - 1) {
        //     //         stack.at(-1)!.body.push({ location: locs[idx], text: lines[idx] })
        //     //     } else if (r.indent < stack.length + 1) {
        //     //         let l = new List(locs[idx], lines[idx][r.indent], [{ location: locs[idx], text: lines[idx] }])
        //     //         stack = stack.slice(0, r.indent)
        //     //         if (stack.length === 0) {
        //     //             idx--
        //     //             continue outer;
        //     //         }
        //     //     } else {
        //     //         idx--
        //     //         continue outer;
        //     //     }
        //     // }
        } else {
            parsed.push(parseHeadingOrLine(locs[idx], lines[idx]))
        }
    }
    // console.log(parsed)
    return parsed
}


function parseBlocks(text:string):LexBlock[] {
    if (!text) {
        return [{ kind: "line", text: "", location: 0 }]
    }

    let loc = 0
    let blocks : Array<LexBlock> = []
    for (let line of text.split("\n")) {
        if (line.startsWith("=")) {
            blocks.push(parseHeadingOrLine(loc,line))
        } else if (line.includes("|")) {
            blocks.push({
                kind:"table",
                location:loc,
                header:null,
                body:[parseCells(loc,line)]
            })
        } else {
            blocks.push({kind:"line",location:loc,text:line})
        }
        loc += line.length + 1
    }

    return blocks
    
}


function joinBlocks(blocks:LexBlock[]):LexBlock[] {

    for (let block of blocks) {
        
    }
}