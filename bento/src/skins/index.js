import { defaultSkin } from './default.js'

const registry = new Map()
registry.set('default', defaultSkin)

export function getSkin(name) {
  return registry.get(name) || defaultSkin
}

export function getSkinNames() {
  return Array.from(registry.keys())
}

export function registerSkin(name, skin) {
  registry.set(name, skin)
}