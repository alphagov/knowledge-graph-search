// This module has utils for using hot-module-reloading when developing locally
// It should only be used locally
// Any 3rd party package should be a dev dependency
import config from '../config'
import { state, setState } from '../state'
const localforage = config.enableHMR ? require('localforage') : null

const CACHE_KEY = 'persistentState'

export const hasStateInCache = async () => {
  const keys = await localforage.keys()
  return keys.includes(CACHE_KEY)
}

export const getStateFromCache = async () =>
  await localforage.getItem(CACHE_KEY)

const saveState = async () => {
  await localforage.setItem(CACHE_KEY, JSON.stringify(state))
}

export const setStateFromCache = async () => {
  if (await hasStateInCache()) {
    const newStateString = await localforage.getItem(CACHE_KEY)
    const newState = JSON.parse(newStateString)
    setState(newState)
  }
}

const clearCache = async () => await localforage.removeItem(CACHE_KEY)

if (config.enableHMR) {
  require('../scss/main.scss')
  global.hmr = { saveState, setStateFromCache, clearCache }
  document.addEventListener('DOMContentLoaded', function () {
    setStateFromCache()
  })
}
