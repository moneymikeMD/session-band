import { expect, test } from 'claude-code/testing'

import type { Where } from '../types'

const MAC: Where = {
  computer: 'michaels-macbook-air', os: 'mac', workspace: 'home', project: 'homelab',
  herdr: { workspace: 'w1', tab: 'review', agent: 'proj-48' },
}
const BAND = { plugin: 'session-band', component: 'AbovePrompt', props: { hasSurvey: false } } as const

for (const surface of ['terminal', 'desktop'] as const) {
  test(`tree is the default and draws the herdr pane on its own row (${surface})`, async ($, on) => {
    on('state.get', () => ({ value: { value: MAC, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect((await ui.find({ type: 'Text', text: /╰─/ }))?.text).toContain('proj-48')
    await ui.unmount()
  })

  test(`bookends draws powerline arrows when picked (${surface})`, { options: { style: 'bookends' } }, async ($, on) => {
    on('state.get', () => ({ value: { value: MAC, version: 1 } }))
    const ui = await $.ui.mount({ ...BAND, surface })
    expect(await ui.find({ type: 'Text', text: /╰─/ })).toBeUndefined()
    expect((await ui.find({ type: 'Text', text: // }))?.text).toContain('proj-48')
    await ui.unmount()
  })
}
