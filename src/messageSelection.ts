import i18n from './i18n'
import type { ApiConversationWithId, ConversationNode, ConversationResult } from './api'

export interface MessageSelectionSnapshot {
    readonly active: boolean
    readonly selectedMessageIds: ReadonlySet<string>
}

type MessageSelectionListener = (snapshot: MessageSelectionSnapshot) => void

const selectedMessageIds = new Set<string>()
const listeners = new Set<MessageSelectionListener>()
const boundTurns = new Map<HTMLElement, { readonly messageId: string; readonly button: HTMLButtonElement }>()

let active = false
let activeChatId: string | null = null

function snapshot(): MessageSelectionSnapshot {
    return {
        active,
        selectedMessageIds: new Set(selectedMessageIds),
    }
}

function publish() {
    const nextSnapshot = snapshot()
    listeners.forEach(listener => listener(nextSnapshot))
    updateBoundTurns(nextSnapshot)
}

export function getMessageSelectionSnapshot(): MessageSelectionSnapshot {
    return snapshot()
}

export function subscribeMessageSelection(listener: MessageSelectionListener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
}

export function refreshMessageSelection() {
    publish()
}

export function beginMessageSelection() {
    active = true
    selectedMessageIds.clear()
    publish()
}

export function cancelMessageSelection() {
    active = false
    selectedMessageIds.clear()
    publish()
}

export function toggleMessageSelection(messageId: string) {
    if (!active) return

    if (selectedMessageIds.has(messageId)) {
        selectedMessageIds.delete(messageId)
    }
    else {
        selectedMessageIds.add(messageId)
    }
    publish()
}

export function getSelectedMessageIds(): ReadonlySet<string> | null {
    return active ? new Set(selectedMessageIds) : null
}

function createSelectionButton(messageId: string): HTMLButtonElement {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'ce-message-selector'
    button.setAttribute('aria-pressed', 'false')

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    icon.setAttribute('viewBox', '0 0 24 24')
    icon.setAttribute('aria-hidden', 'true')

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
    circle.setAttribute('cx', '12')
    circle.setAttribute('cy', '12')
    circle.setAttribute('r', '9')

    const check = document.createElementNS('http://www.w3.org/2000/svg', 'path')
    check.setAttribute('class', 'ce-message-selector-check')
    check.setAttribute('d', 'm8 12 2.5 2.5L16 9')

    icon.append(circle, check)
    button.append(icon)
    button.addEventListener('click', (event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleMessageSelection(messageId)
    })
    return button
}

function updateBoundTurns(selection: MessageSelectionSnapshot) {
    document.body.toggleAttribute('data-ce-message-selection', selection.active)

    boundTurns.forEach(({ messageId, button }, turn) => {
        const selected = selection.selectedMessageIds.has(messageId)
        turn.toggleAttribute('data-ce-message-selected', selected)
        button.setAttribute('aria-pressed', String(selected))

        const label = i18n.t(selected ? 'Deselect message' : 'Select message')
        button.setAttribute('aria-label', label)
        button.title = label
    })
}

export function syncMessageSelectionTargets(chatId: string | null) {
    if (chatId !== activeChatId) {
        activeChatId = chatId
        cancelMessageSelection()
    }

    boundTurns.forEach(({ button }, turn) => {
        if (turn.isConnected) return
        button.remove()
        boundTurns.delete(turn)
    })

    const turns = document.querySelectorAll<HTMLElement>('main [data-testid^="conversation-turn-"]')
    turns.forEach((turn) => {
        const messageId = turn.querySelector<HTMLElement>('[data-message-id]')?.dataset.messageId
        if (!messageId) return

        const binding = boundTurns.get(turn)
        if (binding?.messageId === messageId) return
        binding?.button.remove()

        const button = createSelectionButton(messageId)
        turn.classList.add('ce-selectable-message')
        turn.dataset.ceMessageId = messageId
        turn.append(button)
        boundTurns.set(turn, { messageId, button })
    })

    updateBoundTurns(snapshot())
}

export function applyMessageSelection(conversation: ConversationResult): ConversationResult {
    const selectedIds = getSelectedMessageIds()
    if (selectedIds === null) return conversation

    return {
        ...conversation,
        conversationNodes: conversation.conversationNodes.filter(node => node.message && selectedIds.has(node.message.id)),
    }
}

export function applyMessageSelectionToRawConversation(conversation: ApiConversationWithId): ApiConversationWithId {
    const selectedIds = getSelectedMessageIds()
    if (selectedIds === null) return conversation

    const path: ConversationNode[] = []
    let nodeId: string | undefined = conversation.current_node
    while (nodeId) {
        const node: ConversationNode | undefined = conversation.mapping[nodeId]
        if (!node) break
        path.push(node)
        nodeId = node.parent
    }

    const latestSelectedIndex = path.findIndex(node => node.message && selectedIds.has(node.message.id))
    const filteredPath = latestSelectedIndex >= 0 ? path.slice(latestSelectedIndex) : path.slice(-1)
    const retainedNodeIds = new Set(filteredPath.map(node => node.id))
    const mapping: Record<string, ConversationNode> = {}

    filteredPath.forEach((node) => {
        const filteredNode: ConversationNode = {
            id: node.id,
            children: node.children.filter(childId => retainedNodeIds.has(childId)),
        }
        if (node.parent && retainedNodeIds.has(node.parent)) filteredNode.parent = node.parent
        if (node.message && selectedIds.has(node.message.id)) {
            filteredNode.message = node.message
            if (node.thinking) filteredNode.thinking = node.thinking
        }
        mapping[node.id] = filteredNode
    })

    const currentNode = filteredPath[0]
    return currentNode
        ? { ...conversation, current_node: currentNode.id, mapping }
        : conversation
}
