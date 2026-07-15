import { createPortal } from 'preact/compat'
import { useCallback, useEffect, useState } from 'preact/hooks'
import { useTranslation } from 'react-i18next'
import { beginMessageSelection, cancelMessageSelection, getMessageSelectionSnapshot, subscribeMessageSelection } from '../messageSelection'
import { checkIfConversationStarted } from '../page'
import { IconArrowRightFromBracket, IconCross } from './Icons'
import type { MessageSelectionSnapshot } from '../messageSelection'

import './MessageSelectionToolbar.css'

export function useMessageSelection(): MessageSelectionSnapshot {
    const [selection, setSelection] = useState(getMessageSelectionSnapshot)

    useEffect(() => subscribeMessageSelection(setSelection), [])
    return selection
}

export function useSelectionExport(active: boolean, onComplete: () => void) {
    return useCallback(async (action: () => boolean | Promise<boolean>) => {
        const result = await action()
        if (result && active) {
            cancelMessageSelection()
            onComplete()
        }
        return result
    }, [active, onComplete])
}

export function useMessageSelectionMode(active: boolean, setOpen: (open: boolean) => void) {
    const { t } = useTranslation()
    return useCallback(() => {
        if (active) {
            cancelMessageSelection()
        }
        else {
            if (!checkIfConversationStarted()) {
                alert(t('Please start a conversation first'))
                return false
            }
            beginMessageSelection()
        }
        setOpen(false)
        return true
    }, [active, setOpen, t])
}

export function MessageSelectionToolbar({ container, onExport }: {
    readonly container: HTMLElement
    readonly onExport: () => void
}) {
    const { t } = useTranslation()
    const selection = useMessageSelection()
    if (!selection.active) return null

    const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-ce-exporter-root]'))
    const owner = roots.find(root => root.offsetParent !== null) ?? roots[0]
    if (owner !== container) return null

    const count = selection.selectedMessageIds.size
    return createPortal(
        <div className="ce-selection-toolbar ce-card" role="toolbar" aria-label={t('Message selection actions')}>
            <span className="ce-selection-count" aria-live="polite">
                {t('Selected messages count', { count })}
            </span>
            <div className="ce-selection-actions">
                <button
                    type="button"
                    className="ce-selection-action"
                    aria-label={t('Cancel')}
                    onClick={cancelMessageSelection}
                >
                    <span aria-hidden="true"><IconCross /></span>
                    <span>{t('Cancel')}</span>
                </button>
                <button
                    type="button"
                    className="ce-selection-action ce-selection-action-primary"
                    aria-label={t('Export selected')}
                    disabled={count === 0}
                    onClick={onExport}
                >
                    <span aria-hidden="true"><IconArrowRightFromBracket /></span>
                    <span className="ce-selection-label-full">{t('Export selected')}</span>
                    <span className="ce-selection-label-compact">{t('Export')}</span>
                </button>
            </div>
        </div>,
        document.body,
    )
}
