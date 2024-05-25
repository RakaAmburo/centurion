import { join, resolve } from "path";
import { readdirSync, statSync } from "fs";
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

var myPath = join(__dirname, "");
var commands = {};
commands.phraseKeyMap = {}
commands.allKeys = []
readdirSync(myPath).forEach(function (folder) {
    let subDir = resolve(myPath, folder)
    if (statSync(subDir).isDirectory()) {
        readdirSync(subDir).forEach(function (cmdFile) {
            if (cmdFile.endsWith(".js")) {
                let jsfile = resolve(subDir, cmdFile)
                //console.log("jsfile " + jsfile)
                import("file://" + jsfile).then(imported => {
                    commands = extend(commands, imported.default, folder);
                })
            }
        })
    }
});

function extend(obj, src, folder) {
    Object.keys(src).forEach(function (key) {
        let spreadKey = key.replace(/\./g, ' ')
        let fixedKeyRaw, keyRaw
        if (src[key]?.skipFolderName == true){
            fixedKeyRaw = `${key}`
            keyRaw = `${spreadKey}`
        } else {
            fixedKeyRaw = `${folder}.${key}`
            keyRaw = `${folder} ${spreadKey}`
        }
        let fixedKey = fixedKeyRaw
        commands.phraseKeyMap[keyRaw] = fixedKey
        commands.allKeys.push(keyRaw)
        obj[fixedKey] = src[key].func;
    });
    return obj;
}

export default commands;