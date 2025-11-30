/* eslint-disable no-multi-assign */
/* eslint-disable no-console */
import { parseJson, } from "@common/parseJson"
import { closestPierce } from "@browser/closestPierce"

/**
 * The data that will be passed to {@link RegisteredActionData.generateDataHandler action.generateDataHandler}
 */
export type GenerateData<CurrTarget = HTMLElement> = {
  /**
   * The current event
   */
  readonly event: Omit<Event, 'currentTarget'> & { currentTarget: CurrTarget },

  /**
   * The target of the event returned by {@link EventAction._getMatchedTarget}
   */
  matchedTarget: HTMLElement,

  eventName: string,

  /**
   * The parameter passed to the action
   */
  actionParam: unknown,

  /**
   * The {@link ParsedAction parsed action} object
   */
  readonly _parsedAction: ParsedAction
}

type CustomAction<T> = {
  /**
   * Action handler
   * @param data The return result of `generateDataHandler`
   * @returns void
   */
  handler(data: T): void

  /**
   * A function that will be called to generate the data for the action handler
   * 
   * It will get a {@link GenerateData data} object as a parameter, and it's return value will be passed as the first parameter to the action handler
   */
  generateDataHandler?(data: GenerateData): T

  /**
   * A boolean that is required when overriding existing action and it is overridable
   */
  override?: boolean,

  /**
   * A boolean that indicates if the action can be overridden
   */
  overridable?: boolean
}

type ActionHandlerOrCustomAction<T> = CustomAction<T>['handler'] | CustomAction<T>

export type ParsedAction = {
  /**
   * The name of the action
   */
  name: string,

  /**
   * The parameter passed to the action
   */
  param: unknown,

  /**
   * A boolean that indicates if the action is an "or" action **(name starts with `||`)**
   */
  hasOr: boolean,

  /**
   * An array of parsed switches object with `name` and `param`
   */
  switches: {
    /**
     * The name of the switch
     */
    name: string,

    /**
     * The parameter passed to the switch
     */
    param: unknown,

    /**
     * A boolean indicated if switch is negated **(name starts with `!`)**
     */
    isNegated: boolean
  }[]
}

type RegisteredActionData<T> = {
  handler: (data: T) => void
  generateDataHandler: ((data: GenerateData) => T) | undefined
  overridable: boolean
}

type SwitchHandlerData = GenerateData & {
  /**
   * The parameter passed to the switch
   */
  switchParam: unknown,

  /**
   * The name of the current action that is being executed
   */
  actionName: string
}

export type CustomSwitch = {
  /**
   * The switch handler.
   * 
   * It receives a {@link SwitchHandlerData data} object as a parameter and return a `boolean` indicates if the action should be executed
   */
  handler: (data: SwitchHandlerData) => boolean

  /**
   * A boolean that is required when overriding existing switch and it is overridable
   */
  override?: boolean

  /**
   * A boolean that indicates if the switch can be overridden
   */
  overridable?: boolean,

  /**
   * A boolean that indicates if the switch is dynamic
   * 
   * if true, the returned switch handler value will not be cashed through the current event actions
   */
  dynamic?: boolean
}

type SwitchHandlerOrCustomSwitch = CustomSwitch['handler'] | CustomSwitch

type RegisteredSwitchData = {
  handler: (data: SwitchHandlerData) => boolean
  overridable: boolean,
  dynamic: boolean
}

type ConstructorOptions<T> = {
  /**
   * Add actions at initialization
   */
  actions?: Record<string, ActionHandlerOrCustomAction<T>>,

  /**
   * Add switches at initialization
   */
  switches?: Record<string, SwitchHandlerOrCustomSwitch>,

  /**
   * A function that return the custom data which will be passed to actions handlers.
   * 
   * Its return type must match the generic type `T` passed to the `EventAction<T>`
   * 
   * @see {@link RegisteredActionData.generateDataHandler}
   * 
   */
  generateDataHandler?: (data: GenerateData) => T,

  /**
   * If exists, {@link EventAction.getMatchedTargetPierce getMatchedTargetPierce} will be used instead of {@link EventAction.getMatchedTarget getMatchedTarget} which is required for working on shadow dom elements.
   */
  currTargetSelector?: string

  /**
   * A custom function to get the event attribute name
   * 
   * @see {@link EventAction.getEventAttributeName getEventAttributeName}
   */
  getEventAttributeName?: typeof EventAction.getEventAttributeName

  /**
   * A custom function to get the matched target
   * 
   * @see {@link EventAction.getMatchedTarget getMatchedTarget}
   */
  getMatchedTarget?: typeof EventAction.getMatchedTarget
}

const defaultGenerateDataHandler = (data: GenerateData) => data

export class EventAction<T = GenerateData> {
  /**
   * A map of memoized actions where keys are the matchedTargets and the values are an object where the keys are the registered EventAction event names for that element and the values are an the parsed actions array for that event
   */
  protected static memoizedElementActions = new Map<Element, Record<string, ParsedAction[]
  >>()

  static defaultActions: Record<string, RegisteredActionData<GenerateData>> = {
    '#prevent': {
      handler(data) {
        data.event.preventDefault()
      },
      generateDataHandler: defaultGenerateDataHandler,
      overridable: false
    },
    '#stop': {
      handler(data) {
        data.event.stopPropagation()
      },
      generateDataHandler: defaultGenerateDataHandler,
      overridable: false
    },

    "#nothing": {
      handler() { },
      generateDataHandler: defaultGenerateDataHandler,
      overridable: false,
    },

    '#debug': {
      handler: console.log,
      generateDataHandler: defaultGenerateDataHandler,
      overridable: false
    },

    '#log': {
      handler(data) {
        const param = data.actionParam
        if (param !== '') {
          console.log(param)
        }
        else {
          console.log(`(${data.eventName}) event dispatched by (${data.matchedTarget.tagName.toLowerCase()}) element ${data._parsedAction.hasOr ? '(with or action type)' : ''}`, `with switches(${data._parsedAction.switches?.map(s => `${s.name}${s.param !== '' ? `:${s.param}` : ''}`).join(', ')})`)
        }
      },
      generateDataHandler: defaultGenerateDataHandler,
      overridable: false
    }
  }

  static defaultSwitches: Record<string, CustomSwitch> = {
    '#key': {
      handler(data) {
        if (!(data.event instanceof KeyboardEvent)) return false

        let keysArray: string[] | undefined;
        if (Array.isArray(data.switchParam)) {
          keysArray = data.switchParam as string[]
        } else if (typeof data.switchParam === 'string') {
          keysArray = data.switchParam.replace(/Space/g, ' ').split(',').map(k => k === '' ? ',' : k)
        }

        if (!keysArray || keysArray.length === 0) return false

        return keysArray.includes(data.event.key)
      },
      overridable: false,
      dynamic: false,
    },

    '#special-key': {
      handler(data) {
        if (!(data.event instanceof KeyboardEvent)) return false
        switch (data.switchParam) {
          case 'ctrl':
            return data.event.ctrlKey
          case 'alt':
            return data.event.altKey
          case 'shift':
            return data.event.shiftKey
          case 'meta':
            return data.event.metaKey

          default:
            return false;
        }
      },
      overridable: false,
      dynamic: false
    },

    '#modifier': {
      handler(data) {
        let modifiers: string[] | undefined;

        const { event, actionParam } = data;

        if (typeof actionParam === 'string') modifiers = actionParam.split(',')
        else if (Array.isArray(actionParam)) modifiers = actionParam

        if (!modifiers || modifiers.length === 0 || !(event instanceof PointerEvent || event instanceof KeyboardEvent)) {
          return false
        }

        return modifiers.some(modifier => event.getModifierState(modifier))

      },
      overridable: true,
      dynamic: true
    }
  }


  /**
   * Finds the first matched element from the `event.composedPath()` that is contained in the `event.currentTarget` and matches the given attribute.
   *
   * It receives an object with the following parameters:
   * 
   * - attributeName: The name of the attribute to match (without brackets).
   * - event: The Event whose composedPath and currentTarget are used for the search.
   */
  static getMatchedTarget({ attributeName, event }: { event: Event, attributeName: string }): HTMLElement | undefined {
    const { currentTarget } = event
    if (!(currentTarget instanceof HTMLElement)) return undefined;
    for (const el of event.composedPath()) {
      if (!(el instanceof HTMLElement)) continue

      if (!currentTarget.contains(el))
        break;

      if (el.matches(`[${attributeName}]`)) {
        return el
      }
    }

    return undefined
  }


  /**
   * **NOTE:** It must be used when working on shadow dom elements, because {@link EventAction.getMatchedTarget getMatchedTarget} does not work for shadow dom elements.
   * 
   * This function is similar to {@link EventAction.getMatchedTarget getMatchedTarget}, but instead uses {@link closestPierce} to determine if the target matches the attributeName is contained in the closest element that matches currTargetSelector.
   * 
   * it receives an object with the following parameters:
   * 
   * - attributeName: The name of the attribute to match (without brackets).
   * - event: The Event whose composedPath and currentTarget are used for the search.
   * - currTargetSelector: The selector that is used to determine if the target is contained in the currentTarget.
   */
  static getMatchedTargetPierce({ attributeName, event, currTargetSelector }: { event: Event, attributeName: string, currTargetSelector: string }): HTMLElement | undefined {
    for (const el of event.composedPath()) {

      if (!(el instanceof HTMLElement)) continue

      if (!closestPierce(currTargetSelector, el)) break

      if (el.hasAttribute(attributeName)) {
        return el
      }
    }

    return undefined
  }


  /**
   * Returns the HTML data attribute name for the given event name.
   *
   * @param eventName - The name of the event.
   * @returns The HTML data attribute name for the event.
   */
  static getEventAttributeName(eventName: string) {
    return `data-${eventName}`
  }


  /**
   * Parse an action name and returns an object with the following properties:
   * - name: The name of the action.
   * - hasOr: A boolean indicating whether the action name starts with `||`.
   * 
   * @param name - The name of the action to parse.
   */
  static parseActionName(name: string): { name: string, hasOr: boolean } {
    const trimmedName = name.trim()
    const hasOr = trimmedName.startsWith('||')
    return { name: hasOr ? trimmedName.slice(2) : trimmedName, hasOr }
  }


  /**
   * Parse a switch name and returns an object with the following properties:
   * - name: The name of the switch.
   * - isNegated: A boolean indicating whether the switch name starts with `!`.
   * 
   * @param name - The name of the switch to parse.
   */
  static parseSwitchName(name: string): { name: string, isNegated: boolean } {
    const trimmedName = name.trim()
    const isNegated = trimmedName.startsWith('!')
    return {
      name: isNegated ? trimmedName.slice(1) : trimmedName,
      isNegated
    }
  }


  /**
   * Parse an action string and returns a {@link ParsedAction parsed action}.
   * 
   * @param actionString - The action string to parse.
   * 
   * @example
   * 
   * parseActionString('switch1:param1? switch2:param2? ||action:param');
   * {
   *  name: 'action',
   *  param: 'param',
   *  hasOr: true,
   *  switches: [
   *    {name: 'switch1', param: 'param1'},
   *    {name: 'switch2', param: 'param2'}
   *  ]
   * }
   */
  static parseActionString(actionString: string): ParsedAction {
    const trimmed = actionString.replace(/\s+/g, ' ').trim();
    if (trimmed === '') return { name: '', param: '', switches: [], hasOr: false };
    const switchIndex = trimmed.lastIndexOf('?');
    const hasSwitches = switchIndex !== -1;
    const paramIndex = trimmed.lastIndexOf(':');
    const hasParam = paramIndex !== -1 && paramIndex > switchIndex;
    const name = hasSwitches ? trimmed.slice(switchIndex + 1, hasParam ? paramIndex : undefined) : trimmed.slice(0, hasParam ? paramIndex : undefined);
    const param = hasParam ? trimmed.slice(paramIndex + 1) : '';
    let switches: ParsedAction['switches'] = [];
    if (hasSwitches) {
      const _switchString = trimmed.slice(0, switchIndex);
      const switchesArray = _switchString.split('?');
      switches = switchesArray.map(switchString => {
        const switchParamIndex = switchString.indexOf(':');
        const hasSwitchParam = switchParamIndex !== -1;
        const switchName = hasSwitchParam ? switchString.slice(0, switchParamIndex) : switchString;
        const switchParam = hasSwitchParam ? switchString.slice(switchParamIndex + 1) : '';
        return { param: switchParam.trim(), ...this.parseSwitchName(switchName) };
      });
    }

    return { param: param.trim(), switches, ...EventAction.parseActionName(name) };
  }

  protected actions: Record<string, RegisteredActionData<unknown>> = { ...(EventAction.defaultActions as any) }

  protected switches: Record<string, RegisteredSwitchData> = {}

  protected currTargetSelector?: string

  /**
   * A custom function to get the event attribute name.
   * @see {@link EventAction.getEventAttributeName getEventAttributeName}
   */
  getEventAttributeName?: typeof EventAction.getEventAttributeName

  /**
   * A custom function to get the matched target element.
   * @see {@link EventAction.getMatchedTarget getMatchedTarget}
   */
  getMatchedTarget?: typeof EventAction.getMatchedTarget

  constructor(options?: ConstructorOptions<T>) {
    this.registerSwitches(EventAction.defaultSwitches);

    const { actions, generateDataHandler, switches, getEventAttributeName, getMatchedTarget, currTargetSelector } = options ?? {}

    if (getMatchedTarget && currTargetSelector !== undefined) {
      console.warn(`currentTargetSelector (${currTargetSelector}) is useless when getTargetElement is defined`, this)
    }

    this.currTargetSelector = currTargetSelector
    if (getMatchedTarget) (this.getMatchedTarget = getMatchedTarget)
    if (getEventAttributeName) (this.getEventAttributeName = getEventAttributeName);
    if (switches) this.registerSwitches(switches);
    if (actions) this.registerActions(actions, { generateDataHandler })
  }


  /**
   * A quick way to add multiple event action listeners to an element.
   *
   * @param element - The element to register the event listeners on.
   * @param eventsNames - An array of event names to register listeners for element.
   *
   * @returns This instance, for method chaining.
   */
  addListeners(element: HTMLElement, eventsNames: (string)[]): this {
    eventsNames.forEach(eventName => {
      element.addEventListener(eventName, this.listener)
    })

    return this
  }

  /**
   * A quick way to remove multiple event action listeners from an element.
   *
   * @param element - The element to remove event listeners from.
   * @param eventsNames - An array of event names to remove their listeners from element.
   *
   * @returns This instance, for method chaining.
   */

  removeListeners(element: HTMLElement, eventsNames: (string)[]): this {
    eventsNames.forEach(eventName => {
      element.removeEventListener(eventName, this.listener)
    })
    EventAction.memoizedElementActions.delete(element)
    return this
  }

  /**
   * Adds switches to the event action instance.
   *
   * @param switches - An object where the keys are switch names and the values are either a switch handler or a custom switch object.
   * 
   * @see {@link SwitchHandlerOrCustomSwitch}.
   * 
   * @returns This instance, for method chaining.
   */
  registerSwitches(switches: Record<string, SwitchHandlerOrCustomSwitch>): this {
    for (const [name, _switch] of Object.entries(switches)) {
      const existingSwitch = this.switches[name]
      if (existingSwitch && !existingSwitch.overridable) {
        console.warn(`Switch named (${name}) is already registered and cannot be overridden`, this)
        continue
      }

      const $switch: CustomSwitch = typeof _switch === 'function' ? {
        handler: _switch,
        override: false,
        overridable: true,
        dynamic: false,
      } : _switch

      const switchData: RegisteredSwitchData = {
        handler: $switch.handler,
        overridable: $switch.overridable ?? true,
        dynamic: $switch.dynamic ?? false
      }

      if (existingSwitch && !$switch.override) {
        console.warn(`Switch named (${name}) is already registered and need (override) option to be true to be overridden`)
        continue
      }

      const parsedSwitchName = EventAction.parseSwitchName(name)

      if (parsedSwitchName.isNegated) {
        console.warn(`Switch name must not start with (!) as it is used to negate switches, add your logic once with the name (${parsedSwitchName.name}) and negate the switch name in the attribute instead, Please note that your switch handler will be wrapped in a negated one, and the name will be converted to (${parsedSwitchName.name}) if you omit this warning`)
        const originalHandler = switchData.handler;
        switchData.handler = (...args) => {
          return !originalHandler(...args)
        }

      }

      this.switches[parsedSwitchName.name] = switchData
    }

    return this
  }

  /**
   * Adds actions to the event action.
   *
   * @param actions - An object where the keys are action names and the values are either an action handler or a custom action object.
   * @param options - An optional object with these properties:
   *  - {@link RegisteredActionData.generateDataHandler `generateDataHandler`} A default `generateDataHandler` for all provided actions instead of adding it to each action.
   *
   * @see {@link ActionHandlerOrCustomAction}.
   *
   * @returns This instance, for method chaining.
   */
  registerActions(actions: Record<string, ActionHandlerOrCustomAction<T>>, options?: {
    generateDataHandler?: (data: GenerateData) => T
  }): this {
    for (const [name, _action] of Object.entries(actions)) {
      const existingAction = this.actions[name]
      if (existingAction && !existingAction.overridable) {
        console.warn(`Action named (${name}) is already registered and cannot be overridden`, this)
        continue;
      }

      const action: CustomAction<unknown> = typeof _action === 'function' ? {
        handler: _action,
        override: false,
        overridable: true,
        generateDataHandler: options?.generateDataHandler
      } : _action

      const actionData: RegisteredActionData<unknown> = {
        handler: action.handler,
        overridable: action.overridable ?? true,
        generateDataHandler: action.generateDataHandler ?? options?.generateDataHandler
      }

      if (existingAction && !action.override) {
        console.warn(`Action named (${name}) is already registered and need (override) option to be true to be overridden`)
        continue
      }

      const parsedActionName = EventAction.parseActionName(name)

      if (parsedActionName.hasOr) {
        console.warn(`Action name cannot start with (||), as it is used to detect if the action hasOr, which is used as an indicator to not run other actions if this one gets executed, Please not that the action name will be converted to (${parsedActionName.name}) if you omit this warning`)
      }

      this.actions[parsedActionName.name] = actionData
    }

    return this
  }


  /**
   * Parses an attribute string and returns a parsed actions array.
   */
  parseActionsString(attributeString: string): ParsedAction[] {
    const json = parseJson(attributeString);

    if (Array.isArray(json)) {
      return json.reduce<ParsedAction[]>((result, actionData) => {
        if (typeof actionData === 'string') {
          result.push(EventAction.parseActionString(actionData));
        } else if (
          Array.isArray(actionData) &&
          actionData.length > 0 &&
          typeof actionData[0] === 'string'
        ) {
          switch (actionData.length) {
            case 1:
              result.push(EventAction.parseActionString(actionData[0]))
              break;
            case 2:
              result.push({
                param: actionData[1],
                switches: [],
                ...EventAction.parseActionName(actionData[0])
              })
              break;
            default:
              result.push({
                param: actionData[1],
                switches: actionData.slice(2).map(switchData => {
                  const [name = '', param = ''] = Array.isArray(switchData) ? switchData : switchData.split(':')
                  return {
                    param,
                    ...EventAction.parseSwitchName(name)
                  }
                }),
                ...EventAction.parseActionName(actionData[0])
              })
              break;
          }
        } else if (typeof actionData === 'object' && actionData !== null) {
          result.push(actionData)
        }
        return result;
      }, []);
    }

    return attributeString
      .split('&&')
      .map(EventAction.parseActionString.bind(EventAction));
  }


  /**
   * for internal use
   * 
   * Used to get the matched target for an event
   */
  protected _getMatchedTarget({ attributeName, event }: {
    attributeName: string,
    event: Event
  }): HTMLElement | undefined {
    if (this.getMatchedTarget) {
      return this.getMatchedTarget({
        attributeName,
        event
      });
    }

    if (this.currTargetSelector !== undefined && this.currTargetSelector !== '') {
      return EventAction.getMatchedTargetPierce({
        attributeName,
        event,
        currTargetSelector: this.currTargetSelector
      })
    }

    return EventAction.getMatchedTarget({
      attributeName,
      event
    })

  }

  /**
   * Executes the parsed actions array and their switches.
   * 
   * It expects an object with the following properties:
   * - `parsedActions`: the parsed actions array.
   * - `matchedTarget`: the matched target for the event.
   * - `event`: the event.
   * - `eventName`: the name of the event.
   * 
   * @returns an object with the following properties:
   * - `executedActions`: the executed actions array.
   */
  executeParsedActions({ event, eventName, matchedTarget, parsedActions }: { parsedActions: ParsedAction[], matchedTarget: HTMLElement, event: Event, eventName: string }): { executedActions: ParsedAction[] } {
    const staticSwitches: Record<string, Map<unknown, boolean>> = {}

    const executedActions: ParsedAction[] = []

    for (const parsedAction of parsedActions) {
      if (parsedAction.name === '') continue

      const action = this.actions[parsedAction.name]

      if (!action) {
        console.warn(`There is no registered action with the name (${parsedAction.name}) for the event (${eventName})`, matchedTarget)
        continue
      }

      const checkSwitches = parsedAction.switches.length === 0 ? true : parsedAction.switches.every(switchData => {
        const staticValue = staticSwitches[switchData.name]?.get(switchData.param)
        if (staticValue !== undefined) return switchData.isNegated ? !staticValue : staticValue

        const switchAction = this.switches[switchData.name]
        if (!switchAction) {
          console.warn(`There is no registered switch with the name (${switchData.name}) for the event (${eventName})`, matchedTarget)
          return false
        }

        const value = switchAction.handler({
          actionParam: parsedAction.param,
          event: event as GenerateData['event'],
          matchedTarget,
          eventName,
          switchParam: switchData.param,
          actionName: parsedAction.name,
          _parsedAction: parsedAction
        })

        if (!switchAction.dynamic) {
          const map = staticSwitches[switchData.name] ||= new Map();
          map.set(switchData.param, value)
        }

        return switchData.isNegated ? !value : value
      })

      if (!checkSwitches) continue

      const handlerData: GenerateData = {
        actionParam: parsedAction.param,
        event: event as GenerateData['event'],
        matchedTarget,
        eventName,
        _parsedAction: parsedAction,
      }

      action.handler(action.generateDataHandler ? action.generateDataHandler(handlerData) : handlerData)

      executedActions.push(parsedAction)

      if (parsedAction.hasOr) {
        break
      }
    }

    return { executedActions }
  }


  /**
   * Memoizes and Parses an action string into a parsed actions array if it is not memoized,
   *
   * @param data - An object containing the matched target, event name, and action string.
   * @returns The memoized parsed actions array.
   */
  getOrMemoizeParsedActions(data: { matchedTarget: HTMLElement, eventName: string, actionStr: string }): ParsedAction[] {
    const { matchedTarget, eventName, actionStr } = data
    let memoizedTargetEvents = EventAction.memoizedElementActions.get(matchedTarget);
    if (!memoizedTargetEvents) {
      const events = {}
      EventAction.memoizedElementActions.set(matchedTarget, events)
      memoizedTargetEvents = events
    }
    const parsedActions = memoizedTargetEvents[eventName] ||= this.parseActionsString(actionStr)

    return parsedActions
  }

  /**
   * The event listener function.
   * 
   * it returns undefined or an object with the following properties:
   * - `matchedTarget`: the matched target for the event.
   * - `attributeName`: the name of the attribute that contains the event actions.
   * - `parsedActions`: the parsed actions array.
   * - `executedActions`: the executed actions array.
   * 
   * The returned object can be useful for debugging purposes, and can also be used when the listener is not the actual event listener handler if that is needed.
   */
  listener = (e: Event): undefined | { matchedTarget: HTMLElement, attributeName: string, parsedActions: ParsedAction[], executedActions: ParsedAction[] } => {
    const eventName = e.type
    const attributeName = (this.getEventAttributeName ?? EventAction.getEventAttributeName)(eventName)

    const matchedTarget = this._getMatchedTarget({ attributeName, event: e })

    if (!matchedTarget) return undefined

    const actionStr = matchedTarget.getAttribute(attributeName)
    if (actionStr === null || actionStr === '') return undefined

    const parsedActions = this.getOrMemoizeParsedActions({
      matchedTarget,
      eventName,
      actionStr
    })

    const { executedActions } = this.executeParsedActions({
      event: e,
      eventName,
      matchedTarget,
      parsedActions
    });

    return {
      matchedTarget,
      attributeName,
      parsedActions,
      executedActions
    }
  }
}
