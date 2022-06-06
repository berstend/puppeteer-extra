const fs = require('fs')
const path = require('path')

// const workdir = path.join(__dirname, 'dist')
const workdir = path.join('dist')
const files = fs.readdirSync(workdir)
let changes = 0
for (const file of files.filter(n => n.endsWith('.d.ts'))) {
  const content = fs.readFileSync(path.join(workdir, file), 'utf-8')
  const newContent = content.replace(
    /^\/\/\/ <reference path="\.\.\/src\//g,
    '/// <reference path="../dist/'
  )
  if (content.length !== newContent.length) {
    changes++
    fs.writeFileSync(path.join(__dirname, 'dist', file), newContent)
  }
}
if (changes) {
  console.log(`${changes} file updated`)
} else {
  console.log(`Nothing to update`)
}
