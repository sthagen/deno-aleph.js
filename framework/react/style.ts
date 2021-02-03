import type { StyleHTMLAttributes } from 'https://esm.sh/react'
import { useEffect } from 'https://esm.sh/react'
import util from '../../shared/util.ts'

export const serverStyles: Map<string, string> = new Map()

export default function Style({ children, ...rest }: StyleHTMLAttributes<{}>) {
    const css = children?.toLocaleString()
    const { __styleId: id } = rest as any

    if (id && css) {
        applyCSS('#' + id, css)
    }

    useEffect(() => () => id && removeCSS('#' + id), [])

    return null
}

export function removeCSS(id: string) {
    const { document } = window as any
    Array.from(document.head.children).forEach((el: any) => {
        if (el.getAttribute('data-module-id') === id) {
            document.head.removeChild(el)
        }
    })
}

export function applyCSS(id: string, css: string) {
    if (util.inDeno()) {
        serverStyles.set(id, css)
    } else {
        const { document } = window as any
        const ssrStyle = Array.from<any>(document.head.children).find((el: any) => {
            return el.getAttribute('data-module-id') === id && el.hasAttribute('ssr')
        })
        if (ssrStyle) {
            ssrStyle.removeAttribute('ssr')
        } else {
            const prevStyleEls = Array.from(document.head.children).filter((el: any) => {
                return el.getAttribute('data-module-id') === id
            })
            const styleEl = document.createElement('style')
            styleEl.type = 'text/css'
            styleEl.appendChild(document.createTextNode(css))
            styleEl.setAttribute('data-module-id', id)
            document.head.appendChild(styleEl)
            if (prevStyleEls.length > 0) {
                prevStyleEls.forEach(el => document.head.removeChild(el))
            }
            return styleEl
        }
    }
}
