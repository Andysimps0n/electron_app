const BLOCK_TAGS = new Set(['P', 'DIV', 'LI', 'H1', 'H2', 'H3'])

function getSelectionRange() {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) {
    return null
  }

  return selection.getRangeAt(0)
}

function setSelectionRange(range) {
  const selection = window.getSelection()
  selection.removeAllRanges()
  selection.addRange(range)
}

export function placeCursorAtStart(node) {
  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(true)
  setSelectionRange(range)
}

export function placeCursorAtEnd(node) {
  const range = document.createRange()
  range.selectNodeContents(node)
  range.collapse(false)
  setSelectionRange(range)
}

function normalizeBlock(editor, node) {
  if (node.nodeType === Node.TEXT_NODE && node.parentElement === editor) {
    const div = document.createElement('div')
    editor.insertBefore(div, node)
    div.appendChild(node)
    return div
  }

  return node.nodeType === Node.TEXT_NODE ? node.parentElement : node
}

export function getEditingBlock(node, editorRoot) {
  let current = normalizeBlock(editorRoot, node)

  while (current && current !== editorRoot) {
    if (BLOCK_TAGS.has(current.tagName)) {
      return current
    }
    current = current.parentElement
  }

  return null
}

export function getTextBeforeCursor(block, range) {
  const blockRange = document.createRange()
  blockRange.selectNodeContents(block)
  blockRange.setEnd(range.startContainer, range.startOffset)
  return blockRange.toString()
}

export function getListItemAtSelection(editorRoot) {
  const range = getSelectionRange()
  if (!range) {
    return null
  }

  let node =
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer

  while (node && node !== editorRoot) {
    if (node.tagName === 'LI') {
      return node
    }
    node = node.parentElement
  }

  return null
}

function getDirectLiText(li) {
  let text = ''

  for (const child of li.childNodes) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent
    } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'UL') {
      text += child.textContent
    }
  }

  return text
}

export function isListItemEmpty(li) {
  return getDirectLiText(li).replace(/\u00a0/g, ' ').trim() === ''
}

function ensureListItemHasPlaceholder(li) {
  if (isListItemEmpty(li) && !li.querySelector('br')) {
    li.appendChild(document.createElement('br'))
  }
}

function getCursorOffsetWithin(element) {
  const range = getSelectionRange()
  if (!range || !element.contains(range.startContainer)) {
    return 0
  }

  const preRange = document.createRange()
  preRange.selectNodeContents(element)
  preRange.setEnd(range.startContainer, range.startOffset)
  return preRange.toString().length
}

function setCursorOffsetWithin(element, offset) {
  const range = document.createRange()
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let remaining = offset
  let node = walker.nextNode()

  while (node) {
    const length = node.textContent.length
    if (remaining <= length) {
      range.setStart(node, remaining)
      range.collapse(true)
      setSelectionRange(range)
      return
    }
    remaining -= length
    node = walker.nextNode()
  }

  placeCursorAtEnd(element)
}

function preserveCursorIn(element, action) {
  const offset = getCursorOffsetWithin(element)
  action()
  setCursorOffsetWithin(element, offset)
}

function cleanupEmptyLists(editorRoot) {
  editorRoot.querySelectorAll('ul').forEach((ul) => {
    if (ul.querySelector('li')) {
      return
    }

    ul.remove()
  })
}

function convertBlockToListItem(editor, block, range) {
  const prefixRange = document.createRange()
  prefixRange.selectNodeContents(block)
  prefixRange.setEnd(range.startContainer, range.startOffset)
  prefixRange.deleteContents()

  const li = document.createElement('li')
  const remainingNodes = [...block.childNodes]

  if (remainingNodes.length === 0) {
    li.appendChild(document.createElement('br'))
  } else {
    remainingNodes.forEach((node) => li.appendChild(node))
  }

  const ul = document.createElement('ul')
  ul.appendChild(li)
  block.replaceWith(ul)

  if (isListItemEmpty(li)) {
    li.innerHTML = ''
    li.appendChild(document.createElement('br'))
    placeCursorAtStart(li)
  } else {
    placeCursorAtEnd(li)
  }
}

function tryConvertMarkdownBullet(editor) {
  const range = getSelectionRange()
  if (!range || !range.collapsed) {
    return false
  }

  const block = getEditingBlock(range.startContainer, editor)
  if (!block || block.tagName === 'LI') {
    return false
  }

  const textBefore = getTextBeforeCursor(block, range)
  if (textBefore !== '-') {
    return false
  }

  convertBlockToListItem(editor, block, range)
  return true
}

function splitListItem(li) {
  const range = getSelectionRange()
  if (!range) {
    return
  }

  const newLi = document.createElement('li')
  const tailRange = range.cloneRange()
  tailRange.setEnd(li, li.childNodes.length)
  const tailContents = tailRange.extractContents()
  newLi.appendChild(tailContents)

  ensureListItemHasPlaceholder(li)
  ensureListItemHasPlaceholder(newLi)

  li.parentElement.insertBefore(newLi, li.nextElementSibling)
  placeCursorAtStart(newLi)
}

function exitListItem(editor, li) {
  const ul = li.parentElement
  const followingItems = []

  let sibling = li.nextElementSibling
  while (sibling) {
    const next = sibling.nextElementSibling
    followingItems.push(sibling)
    sibling = next
  }

  li.remove()

  const paragraph = document.createElement('div')
  paragraph.appendChild(document.createElement('br'))

  if (ul.children.length === 0) {
    ul.replaceWith(paragraph)
    cleanupEmptyLists(editor)
    placeCursorAtStart(paragraph)
    return
  }

  ul.parentNode.insertBefore(paragraph, ul.nextSibling)

  if (followingItems.length > 0) {
    const continuation = document.createElement('ul')
    followingItems.forEach((item) => continuation.appendChild(item))
    paragraph.parentNode.insertBefore(continuation, paragraph.nextSibling)
  }

  cleanupEmptyLists(editor)
  placeCursorAtStart(paragraph)
}

function indentListItem(li) {
  const previousItem = li.previousElementSibling
  if (!previousItem) {
    const offset = getCursorOffsetWithin(li)
    const nestedList = document.createElement('ul')
    const nestedItem = document.createElement('li')

    while (li.firstChild) {
      nestedItem.appendChild(li.firstChild)
    }

    ensureListItemHasPlaceholder(nestedItem)
    nestedList.appendChild(nestedItem)
    li.appendChild(nestedList)
    setCursorOffsetWithin(nestedItem, offset)
    return
  }

  preserveCursorIn(li, () => {
    let nestedList = previousItem.querySelector(':scope > ul')
    if (!nestedList) {
      nestedList = document.createElement('ul')
      previousItem.appendChild(nestedList)
    }

    nestedList.appendChild(li)
  })
}

function outdentListItem(li) {
  const list = li.parentElement
  const parentItem = list.parentElement

  if (!parentItem || parentItem.tagName !== 'LI') {
    return
  }

  const parentList = parentItem.parentElement

  preserveCursorIn(li, () => {
    parentList.insertBefore(li, parentItem.nextElementSibling)

    if (list.children.length === 0) {
      list.remove()
    }
  })
}

export function handleListKeyDown(editor, event) {
  if (event.key === ' ' && tryConvertMarkdownBullet(editor)) {
    event.preventDefault()
    return true
  }

  const listItem = getListItemAtSelection(editor)
  if (!listItem) {
    return false
  }

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()

    if (isListItemEmpty(listItem)) {
      exitListItem(editor, listItem)
    } else {
      splitListItem(listItem)
    }

    return true
  }

  if (event.key === 'Tab' && !event.altKey) {
    event.preventDefault()

    if (event.shiftKey) {
      outdentListItem(listItem)
    } else {
      indentListItem(listItem)
    }

    return true
  }

  return false
}
