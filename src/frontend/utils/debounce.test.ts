import debounce from './debounce'

jest.useFakeTimers()

describe('debounce', () => {
  let func: jest.Mock
  let debouncedFunc: (...args: any[]) => void

  beforeEach(() => {
    func = jest.fn()
    debouncedFunc = debounce(func, 500)
  })

  it('should execute the function only once over the debounce period', () => {
    debouncedFunc()
    debouncedFunc()
    debouncedFunc()

    expect(func).toHaveBeenCalledTimes(0)

    jest.runAllTimers()

    expect(func).toHaveBeenCalledTimes(1)
  })

  it('should clear previous timer on subsequent calls', () => {
    debouncedFunc()
    const firstCallId = jest.getTimerCount()
    debouncedFunc()
    const secondCallId = jest.getTimerCount()

    expect(firstCallId).not.toBe(secondCallId)
  })

  it('should not execute the function if the debounced function is not invoked again before the delay', () => {
    debouncedFunc()

    jest.advanceTimersByTime(499)

    expect(func).toHaveBeenCalledTimes(0)

    debouncedFunc()

    jest.advanceTimersByTime(499)

    expect(func).toHaveBeenCalledTimes(0)
  })
})
