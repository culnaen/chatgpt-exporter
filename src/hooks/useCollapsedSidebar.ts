import { useEffect, useState } from 'preact/hooks'

export function useCollapsedSidebar(container: HTMLDivElement, isMobile: boolean) {
    const [isCollapsed, setIsCollapsed] = useState(false)

    useEffect(() => {
        if (isMobile) {
            setIsCollapsed(false)
            return
        }

        let frame = 0
        const observed = new Set<Element>()
        const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update)

        function sidebarElement() {
            return container.closest('nav, aside, [aria-label="Sidebar"], [data-testid="sidebar"]')
                ?? container.parentElement
        }

        function observe(element: Element | null | undefined) {
            if (!observer || !element || observed.has(element)) return
            observer.observe(element)
            observed.add(element)
        }

        function update() {
            cancelAnimationFrame(frame)
            frame = requestAnimationFrame(() => {
                const parentWidth = container.parentElement?.getBoundingClientRect().width ?? 0
                const sidebarWidth = sidebarElement()?.getBoundingClientRect().width ?? parentWidth
                const nextCollapsed = (parentWidth > 0 && parentWidth < 96)
                    || (sidebarWidth > 0 && sidebarWidth < 96)

                setIsCollapsed(nextCollapsed)
                container.toggleAttribute('data-ce-sidebar-collapsed', nextCollapsed)
                observe(container.parentElement)
                observe(sidebarElement())
            })
        }

        observe(container.parentElement)
        observe(sidebarElement())
        update()

        window.addEventListener('resize', update)
        return () => {
            cancelAnimationFrame(frame)
            window.removeEventListener('resize', update)
            observer?.disconnect()
            container.removeAttribute('data-ce-sidebar-collapsed')
        }
    }, [container, isMobile])

    return isCollapsed
}
