// This script converts question markdown files into JSON format
const fs = require("fs-extra")
const path = require("path")
const chalk = require("chalk")
const { attempt, readQuestions, getCodeBlocks } = require("./util")

console.time("Extractor")

let outName = null

const getSection = (searchString, contents, excludeSubsections) => {

  let log
  if (outName === "alt-attribute.md" && searchString === "#### Answer") log = (...args) => console.log(...args)
  else log = () => {}

  log("BEGIN")

  log(searchString)

  const searchIndex = contents.indexOf(searchString)
  if (searchIndex < 0) return ""

  log(searchIndex)

  let endSearch = "\\n#"

  if(!excludeSubsections){
    let i
    for (i = 0; searchString[i] === "#" && i < searchString.length; i++);
    log(i)

    if (i > 0) {
      endSearch += `{${i - 1},${i}}[^#]`
    }
    
  }
  log(endSearch, endSearch.length)

  const endRegex = new RegExp(endSearch)
  log(endRegex)

  const startIndex = searchIndex + searchString.length + 1
  log(startIndex)
  const stopIndex = contents.slice(startIndex).search(endRegex)
  log(stopIndex)
  const endIndex = stopIndex === -1 ? undefined : stopIndex + startIndex
  log(endIndex)

  log("CONTENTS")
  log(contents)
  log("/CONTENTS")

  const result = contents.slice(startIndex, endIndex).trim()
  log(result)
  return result
}

attempt("questions.json generation", () => {
  const output = Object.entries(readQuestions()).map(([ name, contents ]) => {
    outName = name
    const question = getSection("", contents.slice(3))
    const answer = getSection("#### Answer", contents)

    const goodToHear = getSection("#### Good to hear", contents, true)
      .split("\n")
      .map(v => v.replace(/[*-] /g, ""))
      .filter(v => v.trim() !== "")

    const links = getSection("##### Additional links", contents)
      .split("\n")
      .filter(v =>
        /(\/\*[\w\'\s\r\n\*]*\*\/)|(\/\/[\w\s\']*)|(\<![\-\-\s\w\>\/]*\>)/.test(
          v
        )
      )
      .map(v => v.replace(/[*-] /g, ""))
      .filter(v => v.trim() !== "" && !v.includes("tags"))
    return {
      name,
      question,
      answer,
      goodToHear,
      links,
      tags: (contents.match(/<!--\s*tags:\s*\((.+)\)/) || [])[1].split(","),
      expertise: parseInt(
        (contents.match(/<!--\s*expertise:\s*\((.+)\)/) || [])[1],
        10
      ),
      questionCodeBlocks: getCodeBlocks(question),
      answerCodeBlocks: getCodeBlocks(answer)
    }
  })

  fs.writeFileSync("./data/questions.json", JSON.stringify(output, null, 2))
})

console.log(`${chalk.green("SUCCESS!")} questions.json file generated!`)
console.timeEnd("Extractor")
