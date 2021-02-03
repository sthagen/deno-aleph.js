import { ensureDir, path } from '../deps.ts'

/* check whether or not the given path exists as a directory */
export async function existsDir(path: string): Promise<boolean> {
    try {
        const fi = await Deno.lstat(path)
        if (fi.isDirectory) {
            return true
        }
        return false
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false
        }
        return Promise.reject(err)
    }
}

/* check whether or not the given path exists as a directory */
export function existsDirSync(path: string) {
    try {
        const fi = Deno.lstatSync(path)
        if (fi.isDirectory) {
            return true
        }
        return false
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false
        }
        throw err
    }
}

/* check whether or not the given path exists as regular file */
export async function existsFile(path: string): Promise<boolean> {
    try {
        const fi = await Deno.lstat(path)
        if (fi.isFile) {
            return true
        }
        return false
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false
        }
        return Promise.reject(err)
    }
}

/* check whether or not the given path exists as regular file */
export function existsFileSync(path: string) {
    try {
        const fi = Deno.lstatSync(path)
        if (fi.isFile) {
            return true
        }
        return false
    } catch (err) {
        if (err instanceof Deno.errors.NotFound) {
            return false
        }
        throw err
    }
}

/** ensure and write a text file */
export async function ensureTextFile(name: string, content: string): Promise<void> {
    const dir = path.dirname(name)
    await ensureDir(dir)
    await Deno.writeTextFile(name, content)
}
