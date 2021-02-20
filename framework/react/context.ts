import { createContext } from 'https://esm.sh/react'
import type { RouterURL } from '../../types.ts'
import { createBlankRouterURL } from '../core/routing.ts'
import { createNamedContext } from './helper.ts'
import type { RendererStorage } from './renderer.ts'

export const RouterContext = createNamedContext<RouterURL>(createBlankRouterURL(), 'RouterContext')

export const SSRContext = createContext<RendererStorage>({
  headElements: new Map(),
  scriptElements: new Map(),
})
