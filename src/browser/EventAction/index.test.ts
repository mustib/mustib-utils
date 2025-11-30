/* eslint-disable no-new */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { page } from 'vitest/browser'
import { EventAction, type GenerateData, type ParsedAction } from '.'

beforeEach(() => {
  document.body.outerHTML = '';
  vi.resetAllMocks()
})


describe('EventAction', async () => {
  it('should parse action string', async () => {
    const eventAction = new EventAction()

    expect(eventAction.parseActionsString(`actionName`), 'should parse action name').toStrictEqual<ParsedAction[]>([{
      hasOr: false,
      name: 'actionName',
      param: '',
      switches: []
    }])

    expect(eventAction.parseActionsString(`actionName:actionParam`), 'should parse action name with param').toStrictEqual<ParsedAction[]>([{
      hasOr: false,
      name: 'actionName',
      param: 'actionParam',
      switches: []
    }])

    expect(eventAction.parseActionsString(`||actionName`), 'should parse action name with or').toStrictEqual<ParsedAction[]>([{
      hasOr: true,
      name: 'actionName',
      param: '', switches: []
    }])

    expect(eventAction.parseActionsString(`switchName?`), 'should parse switch name').toStrictEqual<ParsedAction[]>([
      {
        hasOr: false,
        name: '', param: '',
        switches: [{ name: 'switchName', isNegated: false, param: '' }]
      }
    ])

    expect(eventAction.parseActionsString(`switchName:switchParam?`), 'should parse switch name with param').toStrictEqual<ParsedAction[]>([
      {
        hasOr: false,
        name: '',
        param: '',
        switches: [{ name: 'switchName', isNegated: false, param: 'switchParam' }]
      }
    ])

    expect(eventAction.parseActionsString(`!switchName?`), 'should parse negated switch name').toStrictEqual<ParsedAction[]>([
      {
        hasOr: false,
        name: '',
        param: '',
        switches: [{ name: 'switchName', isNegated: true, param: '' }]
      }
    ])

    expect(eventAction.parseActionsString(`action1&&action2`), 'should parse multiple actions').toStrictEqual<ParsedAction[]>([
      { hasOr: false, name: 'action1', param: '', switches: [] },
      { hasOr: false, name: 'action2', param: '', switches: [] }
    ])

    expect(eventAction.parseActionsString(`switch1?switch2?`), 'should parse multiple switches').toStrictEqual<ParsedAction[]>([
      {
        hasOr: false, name: '', param: '', switches: [
          {
            name: 'switch1', isNegated: false, param: '',
          },
          {
            name: 'switch2', isNegated: false, param: '',
          }]
      },
    ])

    expect(eventAction.parseActionsString(`switch1:  param  ?  switch2:  param?  action1:  param   && switch1:  param?  switch2 :  param  ? action2 :  param`), 'should truncate spaces between actions, switches and their params').toStrictEqual<ParsedAction[]>([
      {
        hasOr: false, name: 'action1', param: 'param', switches: [
          {
            name: 'switch1', isNegated: false, param: 'param',
          },
          {
            name: 'switch2', isNegated: false, param: 'param',
          }]
      },
      {
        hasOr: false, name: 'action2', param: 'param', switches: [
          {
            name: 'switch1', isNegated: false, param: 'param',
          },
          {
            name: 'switch2', isNegated: false, param: 'param',
          }]
      },
    ])
  })


  it('should parse json action', () => {
    const eventAction = new EventAction();

    expect(eventAction.parseActionsString(JSON.stringify(['switch: param ? action : param'])), 'should parse normal json array').toStrictEqual<ParsedAction[]>([{
      hasOr: false,
      name: 'action',
      param: 'param',
      switches: [{
        isNegated: false,
        name: 'switch',
        param: 'param'
      }]
    }])

    expect(eventAction.parseActionsString(JSON.stringify([
      ['action', 'param', ['switch', 'param']]
    ])), 'should parse custom json array with switch array').toStrictEqual<ParsedAction[]>([{
      hasOr: false,
      name: 'action',
      param: 'param',
      switches: [{
        isNegated: false,
        name: 'switch',
        param: 'param'
      }]
    }])

    expect(eventAction.parseActionsString(JSON.stringify([
      ['action', 'param', 'switch:param']
    ])), 'should parse custom json array with switch string').toStrictEqual<ParsedAction[]>([{
      hasOr: false,
      name: 'action',
      param: 'param',
      switches: [{
        isNegated: false,
        name: 'switch',
        param: 'param'
      }]
    }]);

    [
      [['  action  ', ' param ', ' switch : param ']],
      [['  action  ', ' param ', ['  switch  ', ' param ']]]
    ].forEach(arr => {
      expect(eventAction.parseActionsString(JSON.stringify(arr)), 'should not truncate custom json array params, but should truncate action names and switches').toStrictEqual<ParsedAction[]>([{
        hasOr: false,
        name: 'action',
        param: ' param ',
        switches: [{
          isNegated: false,
          name: 'switch',
          param: ' param '
        }]
      }])


      expect(eventAction.parseActionsString(JSON.stringify([
        ['action', 1, ['switch', true]]
      ])), 'should keep custom json array params types').toStrictEqual<ParsedAction[]>([{
        hasOr: false,
        name: 'action',
        param: 1,
        switches: [{
          isNegated: false,
          name: 'switch',
          param: true
        }]
      }])

      expect(eventAction.parseActionsString(JSON.stringify([
        ['action', 1, ['switch', true]],
        ['||action', 1, ['switch', true], ['!switch', false]],
      ])), 'should parse custom json array with multiple options').toStrictEqual<ParsedAction[]>([{
        hasOr: false,
        name: 'action',
        param: 1,
        switches: [{
          isNegated: false,
          name: 'switch',
          param: true
        }]
      },
      {
        name: 'action',
        hasOr: true,
        param: 1,
        switches: [
          { isNegated: false, name: 'switch', param: true },
          { isNegated: true, name: 'switch', param: false },
        ]
      }
      ])
    })

  })

  it('should call action handler', async () => {
    document.body.innerHTML = `
      <button data-click="action">Click me</button>
    `

    const action = vi.fn()
    const eventAction = new EventAction({
      actions: {
        action
      }
    })
    const events = ['click']
    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click()
    expect(action, 'should call the first time').toBeCalledTimes(1)
    await btn.click()
    expect(action, 'should call the second time').toBeCalledTimes(2)
    eventAction.removeListeners(document.body, events)
    await btn.click()
    expect(action, 'should not call after removing listener').toBeCalledTimes(2)
  })

  it('should call action handler with right data', async () => {
    const actionParam = 'param'
    document.body.innerHTML = `
      <button data-click="action:${actionParam}">Click me</button>
    `

    const action = vi.fn((data: GenerateData) => data)
    const eventAction = new EventAction({
      actions: {
        action
      }
    })
    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click()

    const returnValue = action.mock.results[0]?.value as ReturnType<typeof action>

    expect(returnValue.actionParam, 'should call with the right param').toBe(actionParam)
    expect(returnValue.matchedTarget, 'should call with the right matchedTarget').toBe(btn.element())
    expect(returnValue.eventName, 'should call with the right eventName').toBe(events[0])
    expect(returnValue.event, 'should call with the right event').toBeInstanceOf(MouseEvent)
    expect(returnValue._parsedAction, 'should have _parsedAction').toBeDefined()
  })

  it('should call multiple action handlers', async () => {
    document.body.innerHTML = `
      <button data-click="action1 && action2 && action3">Click me</button>
    `

    const action1 = vi.fn();
    const action2 = vi.fn();
    const action3 = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action1,
        action2,
        action3
      }
    })

    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click();
    [action1, action2, action3].forEach(action => expect(action).toHaveBeenCalledOnce())
  })

  it('should call switch handler', async () => {
    document.body.innerHTML = `
      <button data-click="switch?action">Click me</button>
    `

    const $switch = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action() { }
      },
      switches: {
        switch: $switch
      }
    })

    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click();
    expect($switch).toHaveBeenCalledOnce()
  })

  it('should not call switch handler if there is no action', async () => {
    document.body.innerHTML = `
      <button data-click="switch: param ? ">Click me</button>
    `

    const $switch = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action() { }
      },
      switches: {
        switch: $switch
      }
    })

    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click();
    expect($switch).not.toBeCalled()
  })

  it('should not call switch handler twice for the current event when not dynamic', async () => {
    document.body.innerHTML = `
      <button data-click="switch:param? action && switch:param? action ">Click me</button>
    `

    const $switch = vi.fn(() => true);
    const action = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action
      },
      switches: {
        switch: $switch
      }
    })

    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click();
    expect(action).toHaveBeenCalledTimes(2)
    expect($switch).toHaveBeenCalledOnce()
  })

  it('should call switch handler every time param changes event when not dynamic', async () => {
    document.body.innerHTML = `
      <button data-click="switch:param1? action && switch:param2? action ">Click me</button>
    `

    const $switch = vi.fn(() => true);
    const action = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action
      },
      switches: {
        switch: {
          handler: $switch,
          dynamic: false
        }
      }
    })

    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click();
    expect(action).toHaveBeenCalledTimes(2)
    expect($switch).toHaveBeenCalledTimes(2)
  })

  it('should call switch handler for every action when dynamic', async () => {
    document.body.innerHTML = `
      <button data-click="switch:param? action && switch:param? action ">Click me</button>
    `

    const $switch = vi.fn(() => true);
    const action = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action
      },
      switches: {
        switch: {
          handler: $switch,
          dynamic: true
        }
      }
    })

    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click();
    expect(action).toHaveBeenCalledTimes(2)
    expect($switch).toHaveBeenCalledTimes(2)
  })

  it('should not call action if switch handler returns falsy value', async () => {
    document.body.innerHTML = `
      <button data-click="switch:param? action">Click me</button>
    `

    const $switch = vi.fn(() => false);
    const action = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action
      },
      switches: {
        switch: {
          handler: $switch,
          dynamic: true
        }
      }
    })

    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click();
    expect(action).toHaveBeenCalledTimes(0)
    expect($switch).toHaveBeenCalledTimes(1)
  })

  it('should only call actions for matched target', async () => {
    document.body.innerHTML = `
      <div data-click="action1">
        <div>outer</div>
        <div data-click="action2">inner</div>
      </div>
    `
    const action1 = vi.fn();
    const action2 = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action1, action2
      },
    })

    const events = ['click']
    eventAction.addListeners(document.body, events)

    const inner = page.getByText('inner')
    await inner.click();
    expect(action1).toHaveBeenCalledTimes(0)
    expect(action2).toHaveBeenCalledTimes(1)

    const outer = page.getByText('outer')
    await outer.click();
    expect(action1).toHaveBeenCalledTimes(1)
    expect(action2).toHaveBeenCalledTimes(1)
  })

  it('should negate switch', async () => {
    document.body.innerHTML = `
      <button data-click="switch? action && !switch ? action">Click me</button>
    `

    const $switch = vi.fn(() => false);
    const action = vi.fn();

    const eventAction = new EventAction({
      actions: {
        action
      },
      switches: {
        switch: $switch
      }
    })

    const events = ['click']

    eventAction.addListeners(document.body, events)

    const btn = page.getByRole('button')
    await btn.click();
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('should not register action name starts with ||', async () => {
    const warnMock = vi.spyOn(console, 'warn');
    let hasWarned = false;

    warnMock.mockImplementation((...args) => {
      if (!hasWarned) hasWarned = args.some(arg => typeof arg === 'string' && /^Action name cannot start with \(\|\|\)/.test(arg))
    })


    const eventAction = new EventAction({
      actions: {
        '||action': () => { }
      }
    })

    expect(hasWarned, 'should warn when action name starts with "||"').toBe(true);

    // @ts-expect-error access private property
    expect(eventAction.actions, 'should not register action name with "||"').not.toHaveProperty('||action')
    // @ts-expect-error access private property
    expect(eventAction.actions, 'should register action name without "||"').toHaveProperty('action')
  })

  it('should not register switch name starts with !', async () => {
    const warnMock = vi.spyOn(console, 'warn');

    let hasWarned = false
    warnMock.mockImplementation((...args) => {
      if (!hasWarned) hasWarned = args.some(arg => typeof arg === 'string' && /^Switch name must not start with \(!\)/.test(arg))
    })

    const eventAction = new EventAction({
      switches: {
        '!switch': () => true
      }
    })

    expect(hasWarned).toBe(true)

    // @ts-expect-error access private property
    expect(eventAction.switches, 'should not register switch name with "!"').not.toHaveProperty('!switch')
    // @ts-expect-error access private property
    expect(eventAction.switches, 'should register switch name without "!"').toHaveProperty('switch')
    // @ts-expect-error access private property
    expect(eventAction.switches.switch.handler(), 'should register negated switch handler when name starts with "!"').toBe(false)
  })


  /**
   * TODO:
   * 
   * Test for overridable actions and switches
   * 
   * Test for custom currentTargetSelector
   * 
   * Test for custom generateDataHandler
   * 
   * Test for custom getMatchedTarget
   * 
   * Test for executedActions array
   * 
   * Test for memoizedParsedActions
   * 
   * Test for executing unregistered actions or switches
   */
})