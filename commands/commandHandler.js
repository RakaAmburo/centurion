import utils from "../commonUtils.js"
import stringSimilarity from "string-similarity"
import wordsToNumbers from  "words-to-numbers"

var execEnabled = true
const args = []

let requestHandler = async (possibleCommands, commands, wsConns, wsClient, clientId) => {
    let phraseKeyMap = commands.phraseKeyMap
    let fixedCmds = possibleCommands.map((cmd) => {
        let voiceCmd = cmd.toLowerCase()
        voiceCmd = wordsToNumbers(voiceCmd)
        utils.logInfo("voice cmd: " + voiceCmd)
        return voiceCmd
    })

    let cmdToRun = ['common.phrase.not.found']
    let originalMatchingAllConditions
    let index = 0
    args.splice(0, args.length)
    Object.keys(phraseKeyMap).forEach(function (phrase) {
        fixedCmds.some(voiceCmd => {
            if (phrase.includes('REGEX:')) {
                let phraseOk = phrase.replace(/\REGEX:/, '');
                phraseOk = `^${phraseOk}$`
                //console.log("-" + phraseOk + "-" + voiceCmd + "-")
                let matched = voiceCmd.match(new RegExp(phraseOk))
                if (matched) {
                    originalMatchingAllConditions = voiceCmd
                    let varNum = 0
                    while (matched.groups['arg' + varNum]) {
                        args.push(matched.groups['arg' + varNum])
                        ++varNum
                    }
                    utils.logInfo("Reg exp matched");
                    cmdToRun[index++] = phraseKeyMap[phrase]
                    return true
                }
            } else {
                var similarity = stringSimilarity.compareTwoStrings(phrase, voiceCmd);
                if (similarity > 0.85) {
                    originalMatchingAllConditions = voiceCmd
                    utils.logInfo("Similarity: " + similarity);
                    cmdToRun[index++] = phraseKeyMap[phrase]
                    return true
                }
            }
        })
    });

    if (cmdToRun.length > 1) {
        utils.logInfo('repeated commands  or similar, printing array')
        cmdToRun.forEach((cmd) => {
            utils.logInfo(cmd)
        })
        cmdToRun = ['common.phrase.repeated']
    }

    let response = {}
    if (execEnabled || cmdToRun[0] === "general.ping") {
        if (cmdToRun[0] !== "general.ping") {
            execEnabled = false
        }
        let data = {}
        data.args = args
        data.env = clientId
        data.wsConns = wsConns
        data.wsClient = wsClient
        data.originalMatchingAllConditions = originalMatchingAllConditions
        try {
            response.status = await (commands[cmdToRun[0]] || commands['common.phrase.not.found'])(data)//wsConns, allKeys, args
        } catch (error) {
            utils.logError("Error executing command:")
            utils.logError(error)
        }
        
        delayAndEnableExec()
        if (cmdToRun[0]) {
            response.appliedCmd = cmdToRun[0].replace(/\./g, ' ')
        } else {
            response.appliedCmd = 'General phrase not found'
        }
    } else {
        response.appliedCmd = "none"
        response.status = ["consecutive requests with millis apart not allowed"]
    }

    return response
}

async function delayAndEnableExec() {
    setTimeout(function () {
        execEnabled = true
    }, 1500);
};

export default requestHandler;