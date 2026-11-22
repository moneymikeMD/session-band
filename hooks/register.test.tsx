import { expect, test } from 'claude-code/testing'

import type { Stats, Where } from '../types'

const MAC: Where = {
  computer: 'michaels-macbook-air', os: 'mac', workspace: 'home', project: 'homelab',
  herdr: { workspace: 'w1', tab: 'review', agent: 'proj-48' },
}
const STATS: Stats = {
  used: 52_000, window: 200_000, threshold: 80_000, usd: 3.42, startedAt: 0, now: 72 * 60_000, compactions: 2,
  limits: [{ kind: 'five_hour', percentUsed: 41, resetsAt: null }],
}
const BAND = { plugin: 'session-band', component: 'AbovePrompt', props: {
    hasSurvey: false, isCollapsed: false, isWorking: false, maxRows: 4, bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 4 }, view: {},
  },
} as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`tree is the default and draws the herdr pane on its own row (${surface})`, async ($, on) => {
    on('state.get', (_, e) => ({ value: { value: e.key === 'where' ? MAC : null, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /╰─/ }))?.text).toContain('proj-48')
    await ui.unmount()
  })

  test(`bookends draws powerline arrows when picked (${surface})`, { options: { style: 'bookends', icons: 'nerd' } }, async ($, on) => {
    on('state.get', (_, e) => ({ value: { value: e.key === 'where' ? MAC : null, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /╰─/ })).toBeUndefined()
    expect((await ui.find({ type: 'Text', text: /\uE0B2/ }))?.text).toContain('proj-48')
    await ui.unmount()
  })

  test(`inside herdr the default icons are plain Unicode (${surface})`, async ($, on) => {
    on('state.get', (_, e) => ({ value: { value: e.key === 'where' ? MAC : null, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /\u2756 w1/ }))?.text).toContain('w1')
    expect(await ui.find({ type: 'Text', text: /\uEBEB/ })).toBeUndefined()
    await ui.unmount()
  })

  test(`the stats row closes the tree under the herdr row (${surface})`, async ($, on) => {
    on('state.get', (_, e) => ({ value: { value: e.key === 'where' ? MAC : STATS, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /├─/ }))?.text).toContain('proj-48')
    expect((await ui.find({ type: 'Text', text: /╰─/ }))?.text).toContain('ctx 52k/80k')
    await ui.unmount()
  })

  test(`stats off leaves the band as it was (${surface})`, { options: { stats: 'off' } }, async ($, on) => {
    on('state.get', (_, e) => ({ value: { value: e.key === 'where' ? MAC : STATS, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /ctx/ })).toBeUndefined()
    await ui.unmount()
  })
}
