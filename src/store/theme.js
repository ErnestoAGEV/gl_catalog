import { state, emit } from './state.js'
import { STORAGE_KEYS } from '../utils/config.js'
import { writeJson } from '../utils/storage.js'

export function getTheme() {
  return state.theme
}

export function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'
  writeJson(STORAGE_KEYS.theme, state.theme)
  emit()
  return state.theme
}
