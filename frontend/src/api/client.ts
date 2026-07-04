const apiBaseUrl = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      detail?: string
    } | null
    throw new Error(errorBody?.detail ?? `Ошибка API: ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
