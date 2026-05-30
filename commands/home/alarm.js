import { publish } from '../../mqttPublisher.js'
import CommandUtils from "../commandUtils.js"


let alarm = {
    'REGEX:shields.(?<arg0>on|off)': {
        skipFolderName: true,
        availableIn: [""],
        func: async (data) => {
            let resp
            if (data.env == "server") {
                resp = await CommandUtils.forward(data, "raspberry")
            } else {
               resp = await publish('scutum', data.args[0].toUpperCase())
            }
            return [resp]
        }
    },
    'REGEX:full.armed.(?<arg0>on|off)': {
        skipFolderName: true,
        availableIn: [""],
        func: async (data) => {
            let resp
            if (data.env == "server") {
                resp = await CommandUtils.forward(data, "raspberry")
            } else {
               resp = await publish('casa/alarm/fullarmed', data.args[0].toUpperCase())
            }
            return [resp]
        }
    }
}

export default alarm