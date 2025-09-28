import { useState, useCallback } from 'react'
import { ErrorHandler, AppError } from '@/lib/errorHandler'

interface UseAsyncState<T> {
  data: T | null
  loading: boolean
  error: AppError | null
}

interface UseAsyncReturn<T> extends UseAsyncState<T> {
  execute: (...args: any[]) => Promise<T | null>
  reset: () => void
}

export function useAsync<T = any>(
  asyncFunction: (...args: any[]) => Promise<T>,
  immediate = false
): UseAsyncReturn<T> {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const result = await asyncFunction(...args)
        setState({ data: result, loading: false, error: null })
        return result
      } catch (error) {
        const appError = ErrorHandler.handle(error)
        setState({ data: null, loading: false, error: appError })
        ErrorHandler.logError(appError, asyncFunction.name)
        return null
      }
    },
    [asyncFunction]
  )

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null })
  }, [])

  // immediate 실행
  useState(() => {
    if (immediate) {
      execute()
    }
  })

  return { ...state, execute, reset }
}

// 특정 작업용 훅들
export function useApiCall<T = any>(apiFunction: (...args: any[]) => Promise<T>) {
  return useAsync(apiFunction, false)
}

export function useSubmit<T = any>(submitFunction: (...args: any[]) => Promise<T>) {
  const { execute, loading, error } = useAsync(submitFunction, false)

  const submit = useCallback(async (...args: any[]) => {
    const result = await execute(...args)
    if (result && !error) {
      // 성공 시 추가 작업
      return result
    }
    return null
  }, [execute, error])

  return { submit, loading, error }
}