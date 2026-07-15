import * as Dialog from '@radix-ui/react-dialog'
import * as HoverCard from '@radix-ui/react-hover-card'
import { useCallback, useEffect, useMemo, useState } from 'preact/hooks'
import { useTranslation } from 'react-i18next'
import { exportToHtml } from '../exporter/html'
import { exportToPng } from '../exporter/image'
import { exportToJson, exportToOoba, exportToTavern } from '../exporter/json'
import { exportToMarkdown } from '../exporter/markdown'
import { exportToText } from '../exporter/text'
import { useCollapsedSidebar } from '../hooks/useCollapsedSidebar'
import { useWindowResize } from '../hooks/useWindowResize'
import { refreshMessageSelection } from '../messageSelection'
import { Divider } from './Divider'
import { ExportDialog } from './ExportDialog'
import { FileCode, IconArrowRightFromBracket, IconCamera, IconCheckBox, IconCopy, IconJSON, IconMarkdown, IconSetting, IconZip } from './Icons'
import { MenuItem } from './MenuItem'
import { MessageSelectionToolbar, useMessageSelection, useMessageSelectionMode, useSelectionExport } from './MessageSelectionToolbar'
import { SettingProvider, useSettingContext } from './SettingContext'
import { SettingDialog } from './SettingDialog'

import '../style.css'
import './Dialog.css'

function MenuInner({ container }: { container: HTMLDivElement }) {
    const { t } = useTranslation()

    const [open, setOpen] = useState(false)
    const [jsonOpen, setJsonOpen] = useState(false)
    const [exportOpen, setExportOpen] = useState(false)
    const [settingOpen, setSettingOpen] = useState(false)
    const selection = useMessageSelection()

    const { format, enableTimestamp, timeStamp24H, enableMeta, exportMetaList } = useSettingContext()

    useEffect(() => {
        if (enableTimestamp) {
            document.body.setAttribute('data-time-format', timeStamp24H ? '24' : '12')
        }
        else {
            document.body.removeAttribute('data-time-format')
        }
    }, [enableTimestamp, timeStamp24H])

    const metaList = useMemo(() => enableMeta ? exportMetaList : [], [enableMeta, exportMetaList])

    const closeSelectedExport = useCallback(() => {
        setJsonOpen(false)
        setOpen(false)
    }, [])
    const runExport = useSelectionExport(selection.active, closeSelectedExport)

    const onClickText = useCallback(() => runExport(exportToText), [runExport])
    const onClickPng = useCallback(() => runExport(() => exportToPng(format)), [format, runExport])
    const onClickMarkdown = useCallback(() => runExport(() => exportToMarkdown(format, metaList)), [format, metaList, runExport])
    const onClickHtml = useCallback(() => runExport(() => exportToHtml(format, metaList)), [format, metaList, runExport])
    const onClickJSON = useCallback(() => {
        if (selection.active && selection.selectedMessageIds.size === 0) return false
        setJsonOpen(true)
        return true
    }, [selection.active, selection.selectedMessageIds.size])
    const onClickOfficialJSON = useCallback(() => runExport(() => exportToJson(format)), [format, runExport])
    const onClickTavern = useCallback(() => runExport(() => exportToTavern(format)), [format, runExport])
    const onClickOoba = useCallback(() => runExport(() => exportToOoba(format)), [format, runExport])
    const onClickSelectMessages = useMessageSelectionMode(selection.active, setOpen)

    const width = useWindowResize(() => window.innerWidth)
    const isMobile = width < 768
    const isCollapsedSidebar = useCollapsedSidebar(container, isMobile)
    const isOrphan = container.classList.contains('ce-exporter-orphan')
    const Portal = HoverCard.Portal

    return (
        <>
            <MessageSelectionToolbar
                container={container}
                onExport={() => {
                    refreshMessageSelection()
                    requestAnimationFrame(() => setOpen(true))
                }}
            />
            {isMobile && open && (
                <div
                    className="dropdown-backdrop animate-fadeIn"
                    onClick={() => setOpen(false)}
                ></div>
            )}

            <HoverCard.Root
                openDelay={0}
                closeDelay={300}
                open={open}
                onOpenChange={setOpen}
            >
                <HoverCard.Trigger>
                    <MenuItem
                        className={isCollapsedSidebar
                            ? 'ce-nav-trigger ce-nav-trigger-collapsed'
                            : 'ce-nav-trigger border-0 ms-2 me-1.5 mb-2'}
                        text={t('ExportHelper')}
                        ariaLabel={t('ExportHelper')}
                        icon={IconArrowRightFromBracket}
                        onClick={() => {
                            setOpen(true)
                            return true
                        }}
                    />
                </HoverCard.Trigger>
                <Portal
                    container={isMobile ? container : document.body}
                    forceMount={open || jsonOpen || settingOpen || exportOpen}
                >
                    <HoverCard.Content
                        className={`
                        grid grid-cols-2
                        bg-menu
                        ce-card
                        transition-opacity duration-200
                        gap-1 py-2 px-1
                        ${isMobile
                            ? 'animate-slideUp'
                            : 'animate-fadeIn'}`}
                        style={{
                            width: isMobile ? 316 : 268,
                            left: -6,
                            bottom: 0,
                            backgroundColor: 'var(--ce-menu-primary)',
                        }}
                        sideOffset={isMobile && isOrphan ? 192 : isMobile ? 0 : 8}
                        side={isMobile ? 'bottom' : 'right'}
                        align="start"
                        alignOffset={isMobile ? 0 : -64}
                        collisionPadding={isMobile && isOrphan ? 16 : isMobile ? 0 : 8}
                    >
                        <MenuItem
                            text={t(selection.active ? 'Cancel message selection' : 'Select messages')}
                            icon={IconCheckBox}
                            className="row-full"
                            onClick={onClickSelectMessages}
                        />
                        <SettingDialog
                            open={settingOpen}
                            onOpenChange={setSettingOpen}
                        >
                            <div className="row-full">
                                <MenuItem text={t('Setting')} icon={IconSetting} />
                            </div>
                        </SettingDialog>

                        <MenuItem
                            text={t('Copy Text')}
                            successText={t('Copied!')}
                            icon={IconCopy}
                            className="row-full"
                            disabled={selection.active && selection.selectedMessageIds.size === 0}
                            onClick={onClickText}
                        />
                        <MenuItem
                            text={t('Screenshot')}
                            icon={IconCamera}
                            className="row-half"
                            disabled={selection.active && selection.selectedMessageIds.size === 0}
                            onClick={onClickPng}
                        />
                        <MenuItem
                            text={t('Markdown')}
                            icon={IconMarkdown}
                            className="row-half"
                            disabled={selection.active && selection.selectedMessageIds.size === 0}
                            onClick={onClickMarkdown}
                        />
                        <MenuItem
                            text={t('HTML')}
                            icon={FileCode}
                            className="row-half"
                            disabled={selection.active && selection.selectedMessageIds.size === 0}
                            onClick={onClickHtml}
                        />
                        <Dialog.Root
                            open={jsonOpen}
                            onOpenChange={setJsonOpen}
                        >
                            <Dialog.Trigger asChild>
                                <MenuItem
                                    text={t('JSON')}
                                    icon={IconJSON}
                                    className="row-half"
                                    disabled={selection.active && selection.selectedMessageIds.size === 0}
                                    onClick={onClickJSON}
                                />
                            </Dialog.Trigger>
                            <Dialog.Portal>
                                <Dialog.Overlay className="DialogOverlay" />
                                <Dialog.Content className="DialogContent" style={{ width: '320px' }}>
                                    <Dialog.Title className="DialogTitle">{t('JSON')}</Dialog.Title>
                                    <MenuItem
                                        text={t('OpenAI Official Format')}
                                        icon={IconCopy}
                                        className="row-full"
                                        onClick={onClickOfficialJSON}
                                    />
                                    <MenuItem
                                        text="JSONL (TavernAI, SillyTavern)"
                                        icon={IconCopy}
                                        className="row-full"
                                        onClick={onClickTavern}
                                    />
                                    <MenuItem
                                        text="Ooba (text-generation-webui)"
                                        icon={IconCopy}
                                        className="row-full"
                                        onClick={onClickOoba}
                                    />
                                </Dialog.Content>
                            </Dialog.Portal>
                        </Dialog.Root>
                        {!selection.active && (
                            <ExportDialog
                                format={format}
                                open={exportOpen}
                                onOpenChange={setExportOpen}
                            >
                                <div className="row-full">
                                    <MenuItem
                                        text={t('Export All')}
                                        icon={IconZip}
                                    />
                                </div>
                            </ExportDialog>
                        )}

                        {!isMobile && (
                            <HoverCard.Arrow
                                width="16"
                                height="8"
                                style={{
                                    'fill': 'var(--ce-menu-secondary)',
                                    'stroke': 'var(--ce-border-light)',
                                    'stoke-width': '2px',
                                }}
                            />
                        )}
                    </HoverCard.Content>
                </Portal>
            </HoverCard.Root>
            {!isCollapsedSidebar && <Divider />}
        </>
    )
}

export function Menu({ container }: { container: HTMLDivElement }) {
    return (
        <SettingProvider>
            <MenuInner container={container} />
        </SettingProvider>
    )
}
