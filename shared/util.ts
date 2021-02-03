export default {
    inDeno(): boolean {
        return typeof Deno !== 'undefined' && this.isNEString(Deno.version?.deno)
    },
    isString(a: any): a is string {
        return typeof a === 'string'
    },
    isNEString(a: any): a is string {
        return typeof a === 'string' && a.length > 0
    },
    isArray(a: any): a is Array<any> {
        return Array.isArray(a)
    },
    isNEArray(a: any): a is Array<any> {
        return Array.isArray(a) && a.length > 0
    },
    isPlainObject(a: any): a is Record<string, any> {
        return typeof a === 'object' && a !== null && !this.isArray(a) && Object.getPrototypeOf(a) == Object.prototype
    },
    isFunction(a: any): a is Function {
        return typeof a === 'function'
    },
    isLikelyHttpURL(s: string): boolean {
        const p = s.slice(0, 8).toLowerCase()
        return p === 'https://' || p.slice(0, 7) === 'http://'
    },
    shortHash(hash: string): string {
        return hash.slice(0, 9)
    },
    trimPrefix(s: string, prefix: string): string {
        if (prefix !== '' && s.startsWith(prefix)) {
            return s.slice(prefix.length)
        }
        return s
    },
    trimSuffix(s: string, suffix: string): string {
        if (suffix !== '' && s.endsWith(suffix)) {
            return s.slice(0, -suffix.length)
        }
        return s
    },
    ensureExt(s: string, ext: string): string {
        if (s.endsWith(ext)) {
            return s
        }
        return s + ext
    },
    splitBy(s: string, searchString: string): [string, string] {
        const i = s.indexOf(searchString)
        if (i >= 0) {
            return [s.slice(0, i), s.slice(i + 1)]
        }
        return [s, '']
    },
    formatBytes(bytes: number) {
        if (bytes < 1 << 10) {
            return bytes.toString() + 'B'
        }
        if (bytes < 1 << 20) {
            return Math.ceil(bytes / (1 << 10)) + 'KB'
        }
        if (bytes < 1 << 30) {
            return this.trimSuffix((bytes / (1 << 20)).toFixed(1), '.0') + 'MB'
        }
        if (bytes < 1 << 40) {
            return this.trimSuffix((bytes / (1 << 30)).toFixed(1), '.0') + 'GB'
        }
        if (bytes < 1 << 50) {
            return this.trimSuffix((bytes / (1 << 40)).toFixed(1), '.0') + 'TB'
        }
        return this.trimSuffix((bytes / (1 << 50)).toFixed(1), '.0') + 'PB'
    },
    splitPath(path: string): string[] {
        return path
            .split(/[\/\\]+/g)
            .map(p => p.trim())
            .filter(p => p !== '' && p !== '.')
            .reduce((path, p) => {
                if (p === '..') {
                    path.pop()
                } else {
                    path.push(p)
                }
                return path
            }, [] as Array<string>)
    },
    cleanPath(path: string): string {
        return '/' + this.splitPath(path).join('/')
    },
    debounce<T extends Function>(callback: T, delay: number): T {
        let timer: number | null = null
        return ((...args: any[]) => {
            if (timer != null) {
                clearTimeout(timer)
            }
            timer = setTimeout(() => {
                timer = null
                callback(...args)
            }, delay)
        }) as any
    },
    debounceX(id: string, callback: () => void, delay: number) {
        const self = this as any
        const timers: Map<string, number> = self.__debounce_timers || (self.__debounce_timers = new Map())
        if (timers.has(id)) {
            clearTimeout(timers.get(id)!)
        }
        timers.set(id, setTimeout(() => {
            timers.delete(id)
            callback()
        }, delay))
    }
}
