import utils from "../../commonUtils.js"
import CommandUtils from "../commandUtils.js"

let code = {
    'test.one.thing': {
        func: async (data) => {
            console.log("worked")
            return ['processing!']
        }
    },
    'REGEX:(?<arg0>raspberry|server|asus).pull.and.restart': {
        skipFolderName: true,
        func: async (data) => {
            let ret
            if (data.args[0] == data.env) {
                utils.pullFromGitAndRestart()
                ret = 'processing!'
            } else {
                ret = await CommandUtils.forward(data, data.args[0])
            }
            return [ret]
        }
    }
}

/* async function forward(data, dest) {
    let client
    if (data.env == "server") {
        client = data.wsConns.get(dest)
    } else {
        client = data.wsClient
    }
    let payload = validator.getPayloadStructure(data.originalMatchingAllConditions, validator.WSType.INST)
    client.send(payload.prepareToSend());
    response = await responseObserver
        .listenResponseOrFail(payload.getId(), 2000, dest + " not responding!")
    return response
}
 */
export default code