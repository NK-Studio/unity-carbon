import morph from 'morphmorph'
import omitBy from 'lodash.omitby'
import { htmlUnescape } from 'escape-goat'

const SETTINGS_KEY = 'CARBON_STATE'

const createAssigner = key => {
  const assign = morph.assign(key)

  return v => assign(localStorage, JSON.stringify(v))
}

export const omit = keys => object => omitBy(object, (_, k) => keys.indexOf(k) > -1)

export const saveSettings = morph.compose(
  createAssigner(SETTINGS_KEY),
  omit([
    'code',
    'backgroundImage',
    'backgroundImageSelection',
    'themes',
    'highlights',
    'fontUrl',
    'selectedLines',
    'name',
  ])
)
const parse = v => {
  try {
    return JSON.parse(v)
  } catch (e) {
    // pass
  }
}

export const toggle = stateField => state => ({ [stateField]: !state[stateField] })

// https://gist.github.com/alexgibson/1704515
export const escapeHtml = s => {
  if (typeof s === 'string') {
    return s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\//g, '&#x2F;')
  }
}

export const unescapeHtml = s => {
  if (typeof s === 'string') {
    return htmlUnescape(s).replace(/&#x2F;/g, '/')
  }
}

export const getSettings = morph.compose(parse, escapeHtml, morph.get(SETTINGS_KEY))

export const clearSettings = () => localStorage.removeItem(SETTINGS_KEY)

export const fileToDataURL = blob =>
  new Promise(res => {
    const reader = new FileReader()
    reader.onload = e => res(e.target.result)
    reader.readAsDataURL(blob)
  })

export const fileToJSON = blob =>
  new Promise(res => {
    const reader = new FileReader()
    reader.onload = e => res(parse(e.target.result))
    reader.readAsText(blob)
  })

export const formatCode = async code => {
  const prettier = await import('prettier/standalone')
  const babylonParser = await import('prettier/parser-babel')

  return prettier.format(code, {
    parser: 'babel',
    plugins: [babylonParser],
    semi: false,
    singleQuote: true,
  })
}

export const stringifyColor = obj => `rgba(${obj.rgb.r},${obj.rgb.g},${obj.rgb.b},${obj.rgb.a})`
