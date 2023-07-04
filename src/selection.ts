import type * as Y from 'yjs'



export type Sel = {
    node: Y.Text | Y.XmlText,
    offset: number,
    focus: {
        node: Y.Text | Y.XmlText,
        offset: number
    } | null
}

// if (typeof window.getSelection != "undefined") {
//     var range = window.getSelection().getRangeAt(0);
//     var selected = range.toString().length; // *
//     var preCaretRange = range.cloneRange();
//     preCaretRange.selectNodeContents(element);
//     preCaretRange.setEnd(range.endContainer, range.endOffset);
  
//     caretOffset = preCaretRange.toString().length - selected; // *
//   }



export const selectionToDom = (s: Sel, viewFromState: Map<any, HTMLElement>) => {

    let el = viewFromState.get(s.node)
    Cursor.setCurrentCursorPosition(s.offset, el as Element)


    // let range = document.createRange()
    // let anchorNode = viewFromState.get(s.node)
    // anchorNode = s.node.length ? anchorNode.firstChild : anchorNode
    // range.setStart(anchorNode, s.offset)
    // if (s.focus) {
    //     range.setEnd(viewFromState.get(s.focus.node), s.focus.offset)
    // } else {
    //     range.collapse(true)
    // }
    // let domSelection = document.getSelection()
    // if (!domSelection) console.error("No dom selection")
    // domSelection.removeAllRanges()
    // domSelection.addRange(range)
}



export const selectionFromDom = (s: mySelection, stateFromView: Map<HTMLElement, any>): mySelection | null => {
    let selection = document.getSelection()
    if (!selection || selection.type === "none" || !selection.anchorNode) return null

    let anchorNode = getParent(selection.anchorNode, stateFromView)
    let focusNode = selection.isCollapsed ? null : getParent(selection.focusNode, stateFromView)


    s.node = stateFromView.get(anchorNode as HTMLElement)
    s.offset = getOffset(anchorNode as HTMLElement)
    s.focus = focusNode ? {
        node: stateFromView.get(focusNode as HTMLElement),
        offset: getOffset(focusNode as HTMLElement)
    } : null

}

const getParent = (domNode: Node, docFromDom: Map<any, any>): Node => {
    if (docFromDom.has(domNode)) {
        return domNode
    } else {
        return getParent(domNode.parentNode!, docFromDom)
    }

}


const getOffset = (element: Element) => {
    let caretPosition = 0;
    const selection = window.getSelection();

    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const preSelectionRange = range.cloneRange();
        preSelectionRange.selectNodeContents(element);
        preSelectionRange.setEnd(range.startContainer, range.startOffset);
        caretPosition = preSelectionRange.toString().length;
    }

    return caretPosition;
}


class Cursor {
    static getCurrentCursorPosition(parentElement:Element) {
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
    
    static setCurrentCursorPosition(chars:number, element: Element) {
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
        } else if (node && chars.count >0) {
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
