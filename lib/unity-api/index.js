import dotnet from './dotnet.json'
import engine from './engine.json'
import editor from './editor.json'
import inputSystem from './input-system.json'
import textMeshPro from './textmeshpro.json'
import cinemachine from './cinemachine.json'
import urp from './urp.json'
import addressables from './addressables.json'
import localization from './localization.json'
import aiNavigation from './ai-navigation.json'
import netcodeGameObjects from './netcode-gameobjects.json'
import scripting from './scripting.json'

export const UNITY_API_MODULES = {
  dotnet,
  engine,
  editor,
  inputSystem,
  textMeshPro,
  cinemachine,
  urp,
  addressables,
  localization,
  aiNavigation,
  netcodeGameObjects,
  scripting,
}

const mergeCategory = category =>
  new Set(Object.values(UNITY_API_MODULES).flatMap(module => module[category] || []))

export const UNITY_NAMESPACES = mergeCategory('namespaces')
export const UNITY_CLASSES = mergeCategory('types')
export const UNITY_INTERFACES = mergeCategory('interfaces')
export const UNITY_STRUCTS = mergeCategory('structs')
export const UNITY_ENUMS = mergeCategory('enums')
// Delegate types have their own Rider color. Keep this separate from classes even
// though delegates are reference types in the CLR.
export const UNITY_DELEGATES = new Set(['Action'])
// every registered type name, whatever kind it is — detection does not care
export const UNITY_TYPES = new Set([
  ...UNITY_CLASSES,
  ...UNITY_INTERFACES,
  ...UNITY_STRUCTS,
  ...UNITY_ENUMS,
  ...UNITY_DELEGATES,
])
export const UNITY_METHODS = mergeCategory('methods')
export const UNITY_MEMBERS = mergeCategory('members')
export const UNITY_ATTRIBUTES = mergeCategory('attributes')
export const UNITY_ENUM_MEMBERS = mergeCategory('enumMembers')

const namespaceIdentifiers = Array.from(UNITY_NAMESPACES).flatMap(namespace => namespace.split('.'))
export const UNITY_NAMESPACE_IDENTIFIERS = new Set(namespaceIdentifiers)

export function classifyUnityIdentifier(identifier) {
  if (UNITY_DELEGATES.has(identifier)) return 'unity-delegate'
  if (UNITY_CLASSES.has(identifier) || UNITY_ATTRIBUTES.has(identifier)) return 'unity-type'
  if (UNITY_INTERFACES.has(identifier)) return 'unity-interface'
  // Rider paints value types apart from classes, and enum values with them
  if (UNITY_STRUCTS.has(identifier)) return 'unity-struct'
  if (UNITY_ENUMS.has(identifier)) return 'unity-enum'
  if (UNITY_METHODS.has(identifier)) return 'unity-method'
  if (UNITY_ENUM_MEMBERS.has(identifier)) return 'unity-enum-member'
  if (UNITY_MEMBERS.has(identifier)) return 'unity-member'
  if (UNITY_NAMESPACE_IDENTIFIERS.has(identifier)) return 'unity-namespace'
  return null
}
