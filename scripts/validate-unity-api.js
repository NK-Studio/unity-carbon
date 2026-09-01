#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs')
const path = require('path')

const registryDirectory = path.join(__dirname, '..', 'lib', 'unity-api')
const categories = [
  'namespaces',
  'types',
  'interfaces',
  'structs',
  'enums',
  'methods',
  'members',
  'attributes',
  'enumMembers',
]
const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/
const namespace = /^(?:[A-Za-z_][A-Za-z0-9_]*)(?:\.[A-Za-z_][A-Za-z0-9_]*)*$/
const errors = []

for (const filename of fs.readdirSync(registryDirectory).filter(file => file.endsWith('.json'))) {
  const filepath = path.join(registryDirectory, filename)
  const registry = JSON.parse(fs.readFileSync(filepath, 'utf8'))

  for (const key of Object.keys(registry)) {
    if (!categories.includes(key)) errors.push(`${filename}: unsupported category "${key}"`)
  }

  for (const category of categories) {
    const values = registry[category]
    if (!Array.isArray(values)) {
      errors.push(`${filename}: ${category} must be an array`)
      continue
    }

    const seen = new Set()
    for (const value of values) {
      const pattern = category === 'namespaces' ? namespace : identifier
      if (typeof value !== 'string' || !pattern.test(value)) {
        errors.push(`${filename}: invalid ${category} entry ${JSON.stringify(value)}`)
      }
      if (seen.has(value)) errors.push(`${filename}: duplicate ${category} entry "${value}"`)
      seen.add(value)
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('Unity API registries are valid.')
