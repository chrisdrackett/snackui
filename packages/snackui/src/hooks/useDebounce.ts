import { debounce } from 'lodash'
import { useEffect, useMemo, useRef, useState } from 'react'

// copied from lodash because otherwise webpack-lodash gets mad
type DebounceSettings = {
  leading?: boolean
  maxWait?: number
  trailing?: boolean
}

export function useDebounce<
  A extends (...args: any) => any,
  DebouncedFn extends A & {
    cancel: () => void
  }
>(
  fn: A,
  wait: number,
  options: DebounceSettings = { leading: false },
  mountArgs: any[] = []
): DebouncedFn {
  const dbEffect = useRef<DebouncedFn | null>(null)

  useEffect(() => {
    return () => {
      dbEffect.current?.cancel()
    }
  }, [])

  return useMemo(() => {
    dbEffect.current = (debounce(fn, wait, options) as unknown) as DebouncedFn
    return dbEffect.current
  }, [JSON.stringify(options), ...mountArgs])
}

/**
 * Returns a value once it stops changing after "amt" time.
 * Note: you may need to memo or this will keep re-rendering
 */
export function useDebounceValue<A>(val: A, amt = 0): A {
  const [state, setState] = useState(val)

  useEffect(() => {
    let tm = setTimeout(() => {
      setState((prev) => {
        if (prev === val) return prev
        return val
      })
    }, amt)

    return () => {
      clearTimeout(tm)
    }
  }, [val])

  return state
}
