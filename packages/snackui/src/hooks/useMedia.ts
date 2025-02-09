//
// for types:
//
//   interface MyMediaQueries {}
//   const myMediaQueries: MyMediaQueries = {}
//   configureMedia(myMediaQueries)
//   declare module 'snackui' {
//     interface MediaQueryState extends MyMediaQueries
//   }
//
//

import { useEffect, useLayoutEffect, useRef } from 'react'

import { useConstant } from './useConstant'
import { useForceUpdate } from './useForceUpdate'

type MediaQueryObject = { [key: string]: string | number }
type MediaQueryShort = MediaQueryObject

if (!process.env.IS_STATIC) {
  require('@expo/match-media')
}

// temp patch for test environments
global.matchMedia =
  global.matchMedia ||
  function () {
    return { addEventListener() {}, removeEventListener() {}, matches: [] }
  }

export interface MediaQueryState {
  xs: boolean
  notXs: boolean
  sm: boolean
  notSm: boolean
  md: boolean
  lg: boolean
  xl: boolean
  xxl: boolean
  short: boolean
  tall: boolean
}

export type MediaQueryKey = keyof MediaQueryState

export type MediaQueries = {
  [key in MediaQueryKey]: MediaQueryShort
}

export const defaultMediaQueries = {
  xs: { maxWidth: 660 },
  notXs: { minWidth: 660 + 1 },
  sm: { maxWidth: 860 },
  notSm: { minWidth: 860 + 1 },
  md: { minWidth: 960 },
  lg: { minWidth: 1120 },
  xl: { minWidth: 1280 },
  xxl: { minWidth: 1420 },
  short: { maxHeight: 820 },
  tall: { minHeight: 820 },
}

const mediaState: { [key in keyof MediaQueryState]: boolean } = {} as any
const mediaQueryListeners: { [key: string]: Set<Function> } = {}

export const getMedia = () => mediaState

let hasConfigured = false

export type ConfigureMediaQueryOptions = {
  queries: MediaQueries
  // defaultActive?: MediaQueryKey[]
}

export const configureMedia = ({
  queries = defaultMediaQueries,
}: ConfigureMediaQueryOptions) => {
  if (hasConfigured) {
    throw new Error(`Already configured mediaQueries once`)
  }
  hasConfigured = true

  // setup
  for (const key in queries) {
    const getMatch = () => global.matchMedia(mediaObjectToString(queries[key]))
    const match = getMatch()
    mediaState[key] = !!match.matches
    match.addEventListener('change', () => {
      const next = !!getMatch().matches
      if (next === mediaState[key]) return
      mediaState[key] = next
      const listeners = mediaQueryListeners[key]
      if (listeners?.size) {
        for (const cb of [...listeners]) {
          cb()
        }
      }
    })
  }
}

type UseMediaState = {
  selections: { [key: string]: boolean }
  nextSelections: { [key: string]: boolean }
  isRendering: boolean
  isUnmounted: boolean
}

const defaultOptions: ConfigureMediaQueryOptions = {
  queries: defaultMediaQueries,
  // defaultActive: ['sm', 'xs']
}

export const useMedia = () => {
  if (!hasConfigured) {
    configureMedia(defaultOptions)
  }

  const forceUpdate = useForceUpdate()
  const state = useRef() as React.MutableRefObject<UseMediaState>
  if (!state.current) {
    state.current = {
      selections: {},
      nextSelections: {},
      isUnmounted: false,
      isRendering: true,
    }
  }
  state.current.isRendering = true

  // track usage
  useLayoutEffect(() => {
    const st = state.current
    st.isRendering = false
    // delete old
    for (const key in st.selections) {
      if (!(key in st.nextSelections)) {
        mediaQueryListeners[key].delete(forceUpdate)
      }
    }
    // add new
    for (const key in st.nextSelections) {
      if (!(key in st.selections)) {
        mediaQueryListeners[key] = mediaQueryListeners[key] || new Set()
        mediaQueryListeners[key].add(forceUpdate)
      }
    }
  })

  // unmount
  useLayoutEffect(() => {
    return () => {
      const st = state.current
      st.isUnmounted = true
      const allKeys = {
        ...st.selections,
        ...st.nextSelections,
      }
      for (const key in allKeys) {
        mediaQueryListeners[key].delete(forceUpdate)
      }
    }
  }, [])

  return useConstant(() => {
    const st = state.current
    return new Proxy(mediaState, {
      get(target, key) {
        if (!mediaState) return
        if (typeof key !== 'string') {
          return Reflect.get(target, key)
        }
        if (!(key in mediaState)) {
          throw new Error(
            `No media query configured "${String(key)}" in: ${Object.keys(
              mediaState
            )}`
          )
        }
        if (!st.isUnmounted) {
          if (st.isRendering) {
            st.nextSelections[key] = true
          }
        }
        if (key in mediaState) {
          return mediaState[key]
        }
        return Reflect.get(mediaState, key)
      },
    })
  })
}

const camelToHyphen = (str: string) =>
  str.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).toLowerCase()

export const mediaObjectToString = (
  query: string | MediaQueryObject,
  negate?: boolean
) => {
  if (typeof query === 'string') return query
  return Object.entries(query)
    .map(([feature, value]) => {
      feature = camelToHyphen(feature)
      if (typeof value === 'number' && /[height|width]$/.test(feature)) {
        value = `${value}px`
      }
      return `(${feature}: ${value})`
    })
    .join(' and ')
}
