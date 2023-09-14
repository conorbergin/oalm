import type * as Y from 'yjs'

export type Sel = {
    root: Y.Map<any> | Y.Doc,
    node: Y.Text | Y.XmlText,
    offset: number,
    focus: {
        node: Y.Text | Y.XmlText,
        offset: number
    } | null
}

export const selectionToDom = (s: Sel, viewFromState: Map<any, HTMLElement>) => {
    let el = viewFromState.get(s.node)
    if (!el) { console.log('not found') }
    Cursor.setCurrentCursorPosition(s.offset, el as Element)
}

export const selectionFromDom = (s: Sel, stateFromView: Map<HTMLElement, any>) => {
    let selection = document.getSelection()
    if (!selection || selection.type === "none" || !selection.anchorNode) return null

    const range = selection.getRangeAt(0);
    const anchorNode = range.startContainer instanceof Element ? range.startContainer.closest('.oalmText') : range.startContainer.parentElement!.closest('.oalmText')
    if (anchorNode === null) { throw new Error('Failed to find anchor node') }

    const preAnchorRange = range.cloneRange();
    preAnchorRange.selectNodeContents(anchorNode);
    preAnchorRange.setEnd(range.startContainer, range.startOffset);



    s.node = stateFromView.get(anchorNode as HTMLElement)
    s.offset = preAnchorRange.toString().length
    s.focus = null

    if (!selection.isCollapsed) {
        const focusNode = range.endContainer instanceof Element ? range.endContainer.closest('.oalmText') : range.endContainer.parentElement!.closest('.oalmText')
        if (focusNode === null) { throw new Error('Failed to find focus node') }
        const preFocusRange = range.cloneRange()
        preFocusRange.selectNodeContents(focusNode)
        preFocusRange.setEnd(range.endContainer, range.endOffset)
        s.focus = {
            node: stateFromView.get(focusNode as HTMLElement),
            offset: preFocusRange.toString().length
        }
    }

    console.log(s)

}

const getParent = (domNode: Node, docFromDom: Map<any, any>): Node => {
    if (docFromDom.has(domNode)) {
        return domNode
    } else {
        return getParent(domNode.parentNode!, docFromDom)
    }

}

// https://stackoverflow.com/questions/6249095/how-to-set-the-caret-cursor-position-in-a-contenteditable-element-div
class Cursor {
    static getCurrentCursorPosition(parentElement: Element) {
        var selection = window.getSelection(),
            charCount = -1,
            node;

        if (selection.focusNode) {
            if (Cursor._isChildOf(selection.focusNode, parentElement)) {
                node = selection.focusNode;
                charCount = selection.focusOffset;

                while (node) {
                    if (node === parentElement) {
                        break;
                    }

                    if (node.previousSibling) {
                        node = node.previousSibling;
                        charCount += node.textContent.length;
                    } else {
                        node = node.parentNode;
                        if (node === null) {
                            break;
                        }
                    }
                }
            }
        }

        return charCount;
    }

    static setCurrentCursorPosition(chars: number, element: Element) {
        if (chars >= 0) {
            var selection = window.getSelection();

            let range = Cursor._createRange(element, { count: chars });

            if (range) {
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);
            }
        }
    }

    static _createRange(node, chars, range) {
        if (!range) {
            range = document.createRange()
            range.selectNode(node);
            range.setStart(node, 0);
        }

        if (chars.count === 0) {
            range.setEnd(node, chars.count);
        } else if (node && chars.count > 0) {
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.length < chars.count) {
                    chars.count -= node.textContent.length;
                } else {
                    range.setEnd(node, chars.count);
                    chars.count = 0;
                }
            } else {
                for (var lp = 0; lp < node.childNodes.length; lp++) {
                    range = Cursor._createRange(node.childNodes[lp], chars, range);

                    if (chars.count === 0) {
                        break;
                    }
                }
            }
        }

        return range;
    }

    static _isChildOf(node, parentElement) {
        while (node !== null) {
            if (node === parentElement) {
                return true;
            }
            node = node.parentNode;
        }

        return false;
    }
}
