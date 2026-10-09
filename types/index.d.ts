export type Where = { computer: string; workspace: string; project: string }

declare module 'claude-code' {
  interface PluginState {
    'session-band': { where: Where | null }
  }
}
