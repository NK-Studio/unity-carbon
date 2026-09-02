#!/usr/bin/env node
/* eslint-disable no-console */

// Reads C# declarations (a .cs file, or a .md holding ```csharp fences) and folds the
// public API it finds into one of the registries in lib/unity-api.
//
//   node scripts/import-unity-api.js <file...> [--registry engine] [--dry-run]

const fs = require('fs')
const path = require('path')

const registryDirectory = path.join(__dirname, '..', 'lib', 'unity-api')

// names too generic to key syntax colors on: a local called `x` or `value` is not a
// Unity member, and the classifier only ever sees the identifier, never its scope
const IGNORED_NAMES = new Set([
  'x',
  'y',
  'z',
  'w',
  'r',
  'g',
  'b',
  'a',
  'value',
  'item',
  'index',
  'count',
  'length',
  'size',
  'name',
  'key',
  'result',
  'data',
])
// Object overrides and operator declarations, which carry no Unity meaning
const IGNORED_METHODS = new Set(['Equals', 'GetHashCode', 'ToString', 'Finalize', 'operator'])

const MODIFIERS =
  '(?:public|static|readonly|const|new|override|virtual|abstract|sealed|extern|unsafe|volatile|partial|required|async|ref|event)'
const TYPE = '[\\w<>\\[\\],.?]+'

function parseArguments(argv) {
  const files = []
  let registry = 'engine'
  let dryRun = false

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--registry' || argument === '-r') {
      registry = argv[(index += 1)]
    } else if (argument === '--dry-run' || argument === '-n') {
      dryRun = true
    } else if (argument === '--help' || argument === '-h') {
      return null
    } else {
      files.push(argument)
    }
  }

  return files.length ? { files, registry, dryRun } : null
}

// a .md file only contributes what is inside its code fences
function readSource(file) {
  const contents = fs.readFileSync(file, 'utf8')
  if (path.extname(file).toLowerCase() !== '.md') {
    return contents
  }

  const fences = contents.match(/```(?:cs|csharp|c#)?\n([\s\S]*?)```/g) || []
  return fences.map(fence => fence.replace(/```[^\n]*\n/, '').replace(/```$/, '')).join('\n')
}

// strings and comments hold prose, not declarations
function stripTrivia(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/@"(?:[^"]|"")*"/g, '""')
    .replace(/"(?:\\.|[^"\\])*"/g, '""')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
}

function collect(source) {
  const found = {
    namespaces: new Set(),
    types: new Set(),
    interfaces: new Set(),
    structs: new Set(),
    enums: new Set(),
    methods: new Set(),
    members: new Set(),
    attributes: new Set(),
    enumMembers: new Set(),
  }

  const namespacePattern = /\bnamespace\s+([A-Za-z_][\w.]*)/g
  for (const match of source.matchAll(namespacePattern)) {
    found.namespaces.add(match[1])
  }

  // declared types, mapped to the category each kind belongs in
  const kinds = { class: 'types', struct: 'structs', interface: 'interfaces', record: 'types' }
  const typePattern = new RegExp(
    `\\b(?:${MODIFIERS}\\s+)*\\b(class|struct|interface|record)\\s+([A-Za-z_]\\w*)`,
    'g'
  )
  for (const match of source.matchAll(typePattern)) {
    const name = match[2]
    if (/Attribute$/.test(name)) {
      found.attributes.add(name.replace(/Attribute$/, ''))
    } else {
      found[kinds[match[1]]].add(name)
    }
  }

  // enum bodies: the declaration itself plus every value inside the braces
  const enumPattern = /\benum\s+([A-Za-z_]\w*)[^{]*\{([^}]*)\}/g
  for (const match of source.matchAll(enumPattern)) {
    found.enums.add(match[1])
    for (const value of match[2].split(',')) {
      const name = value.trim().split(/\s|=/)[0]
      if (/^[A-Za-z_]\w*$/.test(name)) found.enumMembers.add(name)
    }
  }

  const declaredTypes = new Set([...found.types, ...found.structs, ...found.interfaces])

  // public methods: a return type, a name, then an argument list
  const methodPattern = new RegExp(
    `^[ \\t]*public\\s+(?:${MODIFIERS}\\s+)*${TYPE}\\s+([A-Za-z_]\\w*)\\s*(?:<[^>(]*>\\s*)?\\(`,
    'gm'
  )
  for (const match of source.matchAll(methodPattern)) {
    const name = match[1]
    // constructors repeat the type name and say nothing new
    if (declaredTypes.has(name)) continue
    if (/\boperator\b/.test(match[0])) continue
    found.methods.add(name)
  }

  // public fields, properties and constants: a type, a name, then `;` `=` `=>`, a
  // property body, or the brace opening on the next line
  const memberPattern = new RegExp(
    `^[ \\t]*public\\s+(?:${MODIFIERS}\\s+)*${TYPE}\\s+([A-Za-z_]\\w*)\\s*(?:;|=>|=(?!>)|\\{|$)`,
    'gm'
  )
  for (const match of source.matchAll(memberPattern)) {
    if (/\boperator\b/.test(match[0])) continue
    found.members.add(match[1])
  }

  // a name cannot be both; the method reading wins
  for (const name of found.methods) found.members.delete(name)
  for (const name of [...declaredTypes, ...found.enums]) found.members.delete(name)

  for (const name of found.methods) {
    if (IGNORED_METHODS.has(name) || IGNORED_NAMES.has(name)) found.methods.delete(name)
  }
  for (const name of found.members) {
    if (IGNORED_NAMES.has(name) || name === 'operator') found.members.delete(name)
  }

  return found
}

function main() {
  const options = parseArguments(process.argv.slice(2))
  if (!options) {
    console.log(
      'usage: node scripts/import-unity-api.js <file...> [--registry <name>] [--dry-run]\n\n' +
        '  <file>       .cs source, or .md containing ```csharp fences\n' +
        '  --registry   registry to merge into (default: engine)\n' +
        '  --dry-run    print what would be added without writing\n\n' +
        `  registries: ${fs
          .readdirSync(registryDirectory)
          .filter(file => file.endsWith('.json'))
          .map(file => path.basename(file, '.json'))
          .join(', ')}`
    )
    process.exit(1)
  }

  const target = path.join(registryDirectory, `${options.registry}.json`)
  if (!fs.existsSync(target)) {
    console.error(`no such registry: ${options.registry} (${target})`)
    process.exit(1)
  }

  const missing = options.files.filter(file => !fs.existsSync(file))
  if (missing.length) {
    for (const file of missing) {
      console.error(`no such file: ${file}`)
    }
    console.error(
      '\ncheck the path — "~/Users/you/..." doubles your home directory, use "~/Downloads/..."'
    )
    process.exit(1)
  }

  // an identifier already carried by any registry is left where it is
  const known = {}
  for (const file of fs.readdirSync(registryDirectory).filter(name => name.endsWith('.json'))) {
    const registry = JSON.parse(fs.readFileSync(path.join(registryDirectory, file), 'utf8'))
    for (const [category, values] of Object.entries(registry)) {
      known[category] = known[category] || new Set()
      values.forEach(value => known[category].add(value))
    }
  }

  const found = collect(options.files.map(file => stripTrivia(readSource(file))).join('\n'))

  const registry = JSON.parse(fs.readFileSync(target, 'utf8'))
  const added = {}
  let total = 0

  for (const [category, values] of Object.entries(found)) {
    const additions = [...values].filter(value => !(known[category] || new Set()).has(value)).sort()
    if (!additions.length) continue
    added[category] = additions
    total += additions.length
    registry[category] = [...new Set([...(registry[category] || []), ...additions])].sort()
  }

  if (!total) {
    console.log('nothing new — every identifier is already registered')
    return
  }

  for (const [category, values] of Object.entries(added)) {
    console.log(`${category} (+${values.length}): ${values.join(', ')}`)
  }

  if (options.dryRun) {
    console.log(`\ndry run — ${options.registry}.json left unchanged`)
    return
  }

  fs.writeFileSync(target, `${JSON.stringify(registry, null, 2)}\n`)
  console.log(`\nadded ${total} identifiers to ${options.registry}.json`)
}

main()
