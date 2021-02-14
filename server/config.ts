import type { ImportMap } from '../compiler/mod.ts'
import { path } from '../deps.ts'
import cssLoader from '../plugins/css.ts'
import { defaultReactVersion } from '../shared/constants.ts'
import { existsFileSync } from '../shared/fs.ts'
import log from '../shared/log.ts'
import util from '../shared/util.ts'
import type { Config } from '../types.ts'
import { getAlephModuleUrl, reLocaleID } from './helper.ts'

export const defaultConfig: Readonly<Required<Config>> = {
  framework: 'react',
  reactVersion: defaultReactVersion,
  buildTarget: 'es5',
  baseUrl: '/',
  srcDir: '/',
  outputDir: '/dist',
  defaultLocale: 'en',
  locales: [],
  rewrites: {},
  ssr: {},
  plugins: [],
  headers: {},
  env: {},
}

/** load config from `aleph.config.(ts|js|json)` */
export async function loadConfig(workingDir: string): Promise<[Config, ImportMap]> {
  let data: Config = {}
  for (const name of Array.from(['ts', 'js', 'json']).map(ext => 'aleph.config.' + ext)) {
    const p = path.join(workingDir, name)
    if (existsFileSync(p)) {
      log.info('Aleph server config loaded from', name)
      if (name.endsWith('.json')) {
        const v = JSON.parse(await Deno.readTextFile(p))
        if (util.isPlainObject(v)) {
          data = v
        }
      } else {
        let { default: v } = await import('file://' + p)
        if (util.isFunction(v)) {
          v = await v()
        }
        if (util.isPlainObject(v)) {
          data = v
        }
      }
      break
    }
  }

  const config: Config = {}
  const {
    framework,
    reactVersion,
    srcDir,
    outputDir,
    baseUrl,
    buildTarget,
    defaultLocale,
    locales,
    ssr,
    rewrites,
    plugins,
    headers,
    env,
  } = data
  if (isFramework(framework)) {
    config.framework = framework
  }
  if (util.isNEString(reactVersion)) {
    config.reactVersion = reactVersion
  }
  if (util.isNEString(srcDir)) {
    config.srcDir = util.cleanPath(srcDir)
  }
  if (util.isNEString(outputDir)) {
    config.outputDir = util.cleanPath(outputDir)
  }
  if (util.isNEString(baseUrl)) {
    config.baseUrl = util.cleanPath(baseUrl)
  }
  if (isBuildTarget(buildTarget)) {
    config.buildTarget = buildTarget
  }
  if (isLocaleID(defaultLocale)) {
    config.defaultLocale = defaultLocale
  }
  if (util.isArray(locales)) {
    locales.filter(id => !isLocaleID(id)).forEach(id => log.warn(`invalid locale ID '${id}'`))
    config.locales = Array.from(new Set(locales.filter(isLocaleID)))
  }
  if (typeof ssr === 'boolean') {
    config.ssr = ssr
  } else if (util.isPlainObject(ssr)) {
    const include = util.isArray(ssr.include) ? ssr.include.map(v => util.isNEString(v) ? new RegExp(v) : v).filter(v => v instanceof RegExp) : []
    const exclude = util.isArray(ssr.exclude) ? ssr.exclude.map(v => util.isNEString(v) ? new RegExp(v) : v).filter(v => v instanceof RegExp) : []
    const staticPaths = util.isArray(ssr.staticPaths) ? ssr.staticPaths.map(v => util.cleanPath(v.split('?')[0])) : []
    config.ssr = { include, exclude, staticPaths }
  }
  if (util.isPlainObject(rewrites)) {
    config.rewrites = toPlainStringRecord(rewrites)
  }
  if (util.isPlainObject(headers)) {
    config.headers = toPlainStringRecord(headers)
  }
  if (util.isPlainObject(env)) {
    config.env = toPlainStringRecord(env)
  }
  config.plugins = [
    util.isNEArray(plugins) ? plugins : [],
    cssLoader() // add the css loader as default
  ].flat()

  // todo: load ssr.config.ts

  // load import maps
  const importMap: ImportMap = { imports: {}, scopes: {} }
  for (const filename of Array.from(['import_map', 'import-map', 'importmap']).map(name => `${name}.json`)) {
    const importMapFile = path.join(workingDir, filename)
    if (existsFileSync(importMapFile)) {
      const data = JSON.parse(await Deno.readTextFile(importMapFile))
      const imports: Record<string, string> = toPlainStringRecord(data.imports)
      const scopes: Record<string, Record<string, string>> = {}
      if (util.isPlainObject(data.scopes)) {
        Object.entries(data.scopes).forEach(([scope, imports]) => {
          scopes[scope] = toPlainStringRecord(imports)
        })
      }
      Object.assign(importMap, { imports, scopes })
      break
    }
  }

  // update import map for alephjs dev env
  const DEV_PORT = Deno.env.get('ALEPH_DEV_PORT')
  if (DEV_PORT) {
    const alephModuleUrl = getAlephModuleUrl()
    const imports = {
      'aleph': `${alephModuleUrl}/mod.ts`,
      'aleph/': `${alephModuleUrl}/`,
      'react': `https://esm.sh/react@${config.reactVersion}`,
      'react-dom': `https://esm.sh/react-dom@${config.reactVersion}`,
    }
    Object.assign(importMap.imports, imports)
  }

  return [config, importMap]
}

function isFramework(v: any): v is 'react' {
  switch (v) {
    case 'react':
      return true
    default:
      return false
  }
}

function isBuildTarget(v: any): v is 'es5' | 'es2015' | 'es2016' | 'es2017' | 'es2018' | 'es2019' | 'es2020' {
  switch (v) {
    case 'es5':
    case 'es2015':
    case 'es2016':
    case 'es2017':
    case 'es2018':
    case 'es2019':
    case 'es2020':
      return true
    default:
      return false
  }
}

function isLocaleID(v: any): v is string {
  return util.isNEString(v) && reLocaleID.test(v)
}

function toPlainStringRecord(v: any) {
  const imports: Record<string, string> = {}
  if (util.isPlainObject(v)) {
    Object.entries(v).forEach(([key, value]) => {
      if (key == '') {
        return
      }
      if (util.isNEString(value)) {
        imports[key] = value
        return
      } else if (util.isNEArray(value)) {
        for (const v of value) {
          if (util.isNEString(v)) {
            imports[key] = v
            return
          }
        }
      }
    })
  }
  return imports
}
