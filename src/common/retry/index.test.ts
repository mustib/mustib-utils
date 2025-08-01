import { describe, expect, it, vi } from 'vitest'
import { retry } from '.'

describe('retry()', () => {
  it('should retry', async () => {
    const result = 3
    const retries = await retry((() => {
      let i = 0
      return () => {
        i++
        if (i === result) {
          return result
        }
        return undefined
      }
    })())

    expect(retries).toBe(result)
  })

  it('should allow a custom retry number', async () => {
    const retries = 3
    const result = await retry({ retries }, (() => {
      let i = 0
      return () => {
        i++
        if (i === retries) {
          return retries
        }
        return undefined
      }
    })())

    expect(result).toBe(retries)
  })

  it('should not retry if non-undefined value returned even if falsy', async () => {
    const values = [0, null, false, NaN, true, [], {}]
    const spies = Promise.all(values.map(async (value) => {
      const spy = vi.fn()
      await retry(() => {
        spy()
        return value;
      })
      return spy
    }));

    (await spies).map(spy => expect(spy).toHaveBeenCalledTimes(1))
  })

  it('should resolve when the callback returns a non-undefined value', async () => {
    const value = 3
    const result = await retry(() => value)
    expect(result).toBe(value)
  })
})