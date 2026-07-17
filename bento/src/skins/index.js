import { defaultSkin } from './default.js'

const registry = new Map()
registry.set('default', defaultSkin)

export function getSkin(name) {
  return registry.get(name) || defaultSkin
}