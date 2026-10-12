import type { H3Event } from 'h3'

export interface D1Meta {
  changes: number
}

export interface D1Result<T = unknown> {
  success: boolean
  results?: T[]
  meta: D1Meta
}

export interface D1Statement {
  bind(...values: Array<string | number | null | Uint8Array>): D1Statement
  first<T = unknown>(): Promise<T | null>
  all<T = unknown>(): Promise<D1Result<T>>
  run<T = unknown>(): Promise<D1Result<T>>
}

export interface D1Database {
  prepare(query: string): D1Statement
  batch<T = unknown>(statements: D1Statement[]): Promise<Array<D1Result<T>>>
}

export interface EmailBinding {
  send(message: {
    from: string
    to: string
    subject: string
    text: string
    html: string
  }): Promise<{ messageId: string }>
}

export interface WorkerBindings {
  DB?: D1Database
  EMAIL?: EmailBinding
}

export function getWorkerBindings(event: H3Event): WorkerBindings {
  const context = event.context as typeof event.context & {
    cloudflare?: { env?: WorkerBindings }
  }
  return context.cloudflare?.env ?? {}
}

export function getDatabase(event: H3Event): D1Database {
  const database = getWorkerBindings(event).DB
  if (!database) {
    throw createError({ statusCode: 503, statusMessage: 'La base D1 n’est pas disponible.' })
  }
  return database
}
