import type { ClientBlock, ClientField } from 'payload'

export type AnyClientField = ClientField
export type AnyClientBlock = ClientBlock

export type FormFieldsState = Record<string, { value?: unknown; rows?: unknown[] }>
