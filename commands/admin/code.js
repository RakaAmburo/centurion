import utils from "../../commonUtils.js"
import CommandUtils from "../commandUtils.js"
import { sendNotification } from '../../fbMessageSender.js';
import { setToken } from '../../fbTokenManager.js';
import MessageQueue from "../../messageQueue.js"

let code = {
    'test.notification': {
        skipFolderName: true,
        func: async (data) => {
            let resp
            if (data.env == "server") {
                resp = await CommandUtils.forward(data, "raspberry")
            } else {
               try {
                   await sendNotification("Test", "Senidng test notification");
                   resp = 'Sending!'
               } catch (error) {
                   //console.error("--- TEST FALLIDO ---");
                   resp = "Error: " + error.message;
                   //console.error("Detalle del error:", error.message);
               }
            }
            return [resp]
        }
    },
    'store.new.token': {
        skipFolderName: true,
        func: async (data) => {
            let resp
            if (data.env == "server") {
                console.log("tk recieved worked")
                console.log(data.extraParams?.token)
                resp = await CommandUtils.forward(data, "raspberry")
            } else {
                console.log("tk recieved worked in rasp")
                console.log(data.extraParams?.token)
                let resutBuilder = (result) => ({"possibleMessages":["new token saved"], "extras": {"status": result}})
                CommandUtils.execAndAlert(setToken, resutBuilder , data.extraParams?.token)
                resp = "processing new token!"
            }
            return [resp]
        }
    },
    'new.token.saved': {
        skipFolderName: true,
        func: async (data) => {
            let resp
            if (data.env == "server") {
                MessageQueue.prepareAndEnqueue(1, data.extraParams?.status)
                resp = 'alert received!'
            } else {
                resp = await CommandUtils.forward(data, "server")
            }
            return [resp]
        }
    },
    'REGEX:(?<arg0>raspberry|server|asus).update.and.restart': {
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