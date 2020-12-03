const fs = require('fs');
const path = require('path');

function readFileAsBase64(filePath) {
  const content = fs.readFileSync(filePath)
  return content.toString('base64');
}

/*
Assumes downloaded zip of https://github.com/htdebeer/SVG-cards
and placed it in the current directory
*/
const root = path.join(__dirname, "SVG-cards-master/png/1x")
const elements = fs.readdirSync(root)
const output = {}
for (const element of elements) {
  if (element.match(/^club_/) || element.match(/^diamond_/) || element.match(/^heart_/) || element.match(/^spade_/) || element === "joker_red.png") {
    output[element.replace(".png", '')] = readFileAsBase64(path.join(root, element))
  }
}

output["club_ace"] = output["club_1"]
delete output["club_1"]
output["diamond_ace"] = output["diamond_1"]
delete output["diamond_1"]
output["spade_ace"] = output["spade_1"]
delete output["spade_1"]
output["heart_ace"] = output["heart_1"]
delete output["heart_1"]
output["joker"] = output["joker_red"]
delete output["joker_red"]

output['back'] = readFileAsBase64(path.join(__dirname, 'back.png'))

console.log(Object.keys(output))

fs.writeFileSync("frontend/src/app/data/card_images.js", "module.exports = " + JSON.stringify(output, null, 2))