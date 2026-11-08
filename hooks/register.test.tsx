import { expect, test } from 'claude-code/testing'

import type { Where } from '../types'

const MAC: Where = {
  computer: 'michaels-macbook-air', os: 'mac', workspace: 'home', project: 'homelab',
  herdr: { workspace: 'w1', tab: 'review', agent: 'proj-48' },
}
const BAND = { plugin: 'session-band', component: 'AbovePrompt', props: {
    hasSurvey: false, isWorking: false, maxRows: 4, bodyColumns: 120,
    scroll: { offset: 0, bodyRows: 4 }, view: {},
  },
} as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`tree is the default and draws the herdr pane on its own row (${surface})`, async ($, on) => {
    on('state.get', () => ({ value: { value: MAC, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /╰─/ }))?.text).toContain('proj-48')
    await ui.unmount()
  })

  test(`bookends draws powerline arrows when picked (${surface})`, { options: { style: 'bookends', icons: 'nerd' } }, async ($, on) => {
    on('state.get', () => ({ value: { value: MAC, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /╰─/ })).toBeUndefined()
    expect((await ui.find({ type: 'Text', text: /\uE0B2/ }))?.text).toContain('proj-48')
    await ui.unmount()
  })

  test(`inside herdr the default icons are plain Unicode (${surface})`, async ($, on) => {
    on('state.get', () => ({ value: { value: MAC, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /\u2756 w1/ }))?.text).toContain('w1')
    expect(await ui.find({ type: 'Text', text: /\uEBEB/ })).toBeUndefined()
    await ui.unmount()
  })
}
