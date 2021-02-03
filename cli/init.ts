import { colors, ensureDir, gzipDecode, path, Untar } from '../deps.ts'
import { ensureTextFile } from '../shared/fs.ts'
import util from '../shared/util.ts'
import { VERSION } from '../version.ts'

export const helpMessage = `
Usage:
    aleph init <dir> [...options]

<dir> represents the directory of Aleph.js app,
if the <dir> is empty, the current directory will be used.

Options:
    -h, --help  Prints help message
`

export default async function (appDir: string, options: Record<string, string | boolean>) {
    const rev = 'master'
    const template = 'hello-world'
    const vscode = await confirm(`Add recommended VS Code workspace settings?`)

    console.log('Downloading template...')
    const resp = await fetch('https://codeload.github.com/alephjs/alephjs-templates/tar.gz/' + rev)
    const gzData = await Deno.readAll(new Deno.Buffer(await resp.arrayBuffer()))

    console.log('Saving template...')
    const tarData = gzipDecode(gzData)
    const entryList = new Untar(new Deno.Buffer(tarData))

    // todo: add template select ui
    for await (const entry of entryList) {
        if (entry.fileName.startsWith(`alephjs-templates-${rev}/${template}/`)) {
            const fp = path.join(appDir, util.trimPrefix(entry.fileName, `alephjs-templates-${rev}/${template}/`))
            if (entry.type === 'directory') {
                await ensureDir(fp)
                continue
            }
            await ensureTextFile(fp, '')
            const file = await Deno.open(fp, { write: true })
            await Deno.copy(entry, file)
        }
    }

    const gitignore = [
        '.DS_Store',
        'Thumbs.db',
        '.aleph/',
        'dist/',
    ]
    const importMap = {
        imports: {
            'aleph': `https://deno.land/x/aleph@v${VERSION}/mod.ts`,
            'aleph/': `https://deno.land/x/aleph@v${VERSION}/`,
            'react': 'https://esm.sh/react@17.0.1',
            'react-dom': 'https://esm.sh/react-dom@17.0.1',
        },
        scopes: {}
    }
    await Promise.all([
        Deno.writeTextFile(path.join(appDir, '.gitignore'), gitignore.join('\n')),
        Deno.writeTextFile(path.join(appDir, 'import_map.json'), JSON.stringify(importMap, undefined, 4))
    ])

    if (vscode) {
        const extensions = {
            'recommendations': [
                'denoland.vscode-deno'
            ]
        }
        const settigns = {
            'deno.enable': true,
            'deno.unstable': true,
            'deno.import_map': './import_map.json'
        }
        await ensureDir(path.join(appDir, '.vscode'))
        await Promise.all([
            Deno.writeTextFile(path.join(appDir, '.vscode', 'extensions.json'), JSON.stringify(extensions, undefined, 4)),
            Deno.writeTextFile(path.join(appDir, '.vscode', 'settings.json'), JSON.stringify(settigns, undefined, 4))
        ])
    }

    console.log('Done')
    console.log('---')
    console.log(colors.green('Aleph.js is ready to Go.'))
    console.log(`${colors.dim('$')} cd ` + path.basename(appDir))
    console.log(`${colors.dim('$')} aleph ${colors.bold('dev')}     ${colors.dim('# start the app in `development` mode')}`)
    console.log(`${colors.dim('$')} aleph ${colors.bold('start')}   ${colors.dim('# start the app in `production` mode')}`)
    console.log(`${colors.dim('$')} aleph ${colors.bold('build')}   ${colors.dim('# build the app to a static site (SSG)')}`)
    console.log('---')
    Deno.exit(0)
}

async function ask(question: string = ':', stdin = Deno.stdin, stdout = Deno.stdout) {
    await stdout.write(new TextEncoder().encode(question + ' '))
    const buf = new Uint8Array(1024)
    const n = <number>await stdin.read(buf)
    const answer = new TextDecoder().decode(buf.subarray(0, n))
    return answer.trim()
}

async function confirm(question: string = 'are you sure?') {
    let a: string
    while (!/^(y(es)?|no?)$/i.test(a = (await ask(question + ' [y/n]')).trim())) { }
    return a.charAt(0).toLowerCase() === 'y'
}
