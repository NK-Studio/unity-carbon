import toHash from 'tohash'

// JetBrains Mono with Sarasa Mono K's Hangul merged in at two cells per syllable,
// built by scripts/build-hangul-font.py
export const FONT_FAMILY = 'JetBrains Mono Hangul'
// only reached if the bundled face fails to load
export const KOREAN_FONT_FAMILIES = `'Apple SD Gothic Neo', 'Malgun Gothic', 'Noto Sans KR', 'Nanum Gothic'`
export const FONT_STACK = `'${FONT_FAMILY}', ${KOREAN_FONT_FAMILIES}, monospace`

export const ISLANDS_DARK_THEME = {
  id: 'islands-dark',
  name: 'Rider Islands Dark',
  // extracted from Rider's own scheme:
  // Rider.app/Contents/plugins/rider-theme-pack/lib/rider-theme-pack.jar → colorSchemes/RiderIslandsDark.xml
  highlights: {
    background: '#191A1C',
    text: '#D0D0D0',
    variable: '#BDBDBD',
    variable2: '#66C3CC',
    variable3: '#C191FF',
    attribute: '#85C46C',
    definition: '#39CC9B',
    keyword: '#6C95EB',
    type: '#6C95EB',
    atom: '#6C95EB',
    operator: '#BDBDBD',
    property: '#66C3CC',
    number: '#ED94C0',
    string: '#C9A26D',
    comment: '#85C46C',
    meta: '#6C95EB',
    tag: '#C191FF',
    builtin: '#C191FF',
    unityType: '#C191FF',
    unityInterface: '#B18CFA',
    unityDelegate: '#D7BBFC',
    unityMethod: '#59C093',
    unityEvent: '#DE90B7',
    unityMember: '#66C3CC',
    unityValueType: '#D7BBFC',
    unityEnumMember: '#6FB9C4',
  },
}

export const ISLANDS_LIGHT_THEME = {
  id: 'islands-light',
  name: 'Rider Islands Light',
  light: true,
  // the Islands Light UI theme ships with Rider's light editor scheme, extracted from:
  // Rider.app/Contents/plugins/rider-theme-pack/lib/rider-theme-pack.jar → colorSchemes/RiderLight.xml
  highlights: {
    background: '#FFFFFF',
    text: '#202020',
    variable: '#383838',
    variable2: '#0093A1',
    variable3: '#6B2FBA',
    attribute: '#248700',
    definition: '#00855F',
    keyword: '#0F54D6',
    type: '#0F54D6',
    atom: '#0F54D6',
    operator: '#383838',
    property: '#0093A1',
    number: '#AB2F6B',
    string: '#8C6C41',
    comment: '#248700',
    meta: '#0F54D6',
    tag: '#6B2FBA',
    builtin: '#6B2FBA',
    unityType: '#6B2FBA',
    unityInterface: '#6B2FBA',
    unityDelegate: '#300073',
    unityMethod: '#00855F',
    unityEvent: '#AB2F6B',
    unityMember: '#0093A1',
    unityValueType: '#300073',
    unityEnumMember: '#0093A1',
  },
}

export const THEMES = [ISLANDS_DARK_THEME, ISLANDS_LIGHT_THEME]
export const THEMES_HASH = toHash(THEMES)

export const LANGUAGES = [
  { name: 'Plain Text', mode: 'text' },
  {
    name: 'C# (with Unity)',
    mode: 'clike',
    mime: 'text/x-csharp',
    short: 'csharp',
    highlight: 'csharp',
  },
  {
    name: 'C++',
    mode: 'clike',
    mime: 'text/x-c++src',
    short: 'cpp',
    highlight: 'cpp',
  },
  { name: 'CSS', mode: 'css', short: 'css', highlight: 'css' },
  {
    name: 'HTML/XML',
    mode: 'htmlmixed',
    mime: 'text/html',
    short: 'xml',
    highlight: 'xml',
  },
  {
    name: 'Java',
    mode: 'clike',
    mime: 'text/x-java',
    short: 'java',
    highlight: 'java',
  },
  {
    name: 'JavaScript',
    mode: 'javascript',
    short: 'javascript',
    highlight: 'javascript',
  },
  {
    name: 'JSON',
    mode: 'javascript',
    mime: 'application/json',
    short: 'json',
    highlight: 'json',
  },
  { name: 'JSX', mode: 'jsx', mime: 'text/jsx', short: 'jsx' },
  {
    name: 'Kotlin',
    mode: 'clike',
    mime: 'text/x-kotlin',
    short: 'kotlin',
    highlight: 'kotlin',
  },
  { name: 'Swift', mode: 'swift', short: 'swift', highlight: 'swift' },
  {
    name: 'TypeScript',
    mode: 'javascript',
    mime: 'application/typescript',
    short: 'typescript',
    highlight: 'typescript',
  },
  { name: 'TSX', mode: 'jsx', mime: 'text/typescript-jsx', short: 'tsx' },
]

export const LANGUAGE_MIME_HASH = toHash(LANGUAGES, 'mime')
export const LANGUAGE_MODE_HASH = toHash(LANGUAGES, 'mode')
export const LANGUAGE_NAME_HASH = toHash(LANGUAGES, 'short')

export const EXPORT_SIZES = [
  { id: '1x', name: '1x', value: 1 },
  { id: '2x', name: '2x', value: 2 },
  { id: '4x', name: '4x', value: 4 },
]

export const EXPORT_SIZES_HASH = toHash(EXPORT_SIZES)

// the range the font-size slider and the ctrl/cmd + wheel zoom share
export const MIN_FONT_SIZE = 10
export const MAX_FONT_SIZE = 40

export const DEFAULT_EXPORT_FILENAME = 'code'
export const DEFAULT_LANGUAGE = 'text'
export const DEFAULT_THEME = ISLANDS_DARK_THEME
export const DEFAULT_BG_COLOR = 'rgba(171, 184, 195, 1)'
export const DEFAULT_EXPORT_SIZE = EXPORT_SIZES_HASH['2x']

export const COLORS = {
  BLACK: '#121212',
  PRIMARY: '#F8E81C',
  SECONDARY: '#fff',
  GRAY: '#858585',
  DARK_GRAY: '#393939',
  HOVER: '#1F1F1F',
  PURPLE: '#C198FB',
  DARK_PURPLE: '#55436F',
  RED: '#ff5f56',
  BLUE: '#57b5f9',
  GREEN: '#37b589',
}

export const DEFAULT_CODE = `const pluckDeep = key => obj => key.split('.').reduce((accum, key) => accum[key], obj)

const compose = (...fns) => res => fns.reduce((accum, next) => next(accum), res)

const unfold = (f, seed) => {
  const go = (f, seed, acc) => {
    const res = f(seed)
    return res ? go(f, res[1], acc.concat([res[0]])) : acc
  }
  return go(f, seed, [])
}`

export const DEFAULT_SETTINGS = {
  paddingVertical: '56px',
  paddingHorizontal: '56px',
  backgroundImage: null,
  backgroundImageSelection: null,
  backgroundMode: 'color',
  backgroundColor: DEFAULT_BG_COLOR,
  dropShadow: true,
  dropShadowOffsetX: '0px',
  dropShadowOffsetY: '20px',
  dropShadowBlurRadius: '68px',
  theme: DEFAULT_THEME.id,
  windowTheme: 'none',
  language: DEFAULT_LANGUAGE,
  fontFamily: FONT_FAMILY,
  fontSize: '14px',
  lineHeight: '150%',
  windowControls: true,
  widthAdjustment: true,
  lineNumbers: false,
  firstLineNumber: 1,
  exportSize: '2x',
  squaredImage: false,
  hiddenCharacters: false,
  name: '',
  width: 680,
}

export const DEFAULT_WIDTHS = {
  minWidth: 320,
  maxWidth: 2560,
}
