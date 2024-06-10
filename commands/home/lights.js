import udpTransceiver from "../../udpTransceiver.js"
import CommandUtils from "../commandUtils.js"


let lights = {
    'REGEX:balcony.lights.(?<arg0>on|off|status)': {
        skipFolderName: true,
        func: async (data) => {
            let resp
            if (data.env == "server") {
                resp = await CommandUtils.forward(data, "raspberry")
            } else {
                let options = {
                    "on": async () => await udpTransceiver.transceive("BALCONY_ON"),
                    "off": async () => await udpTransceiver.transceive("BALCONY_OFF"),
                    "status": async () => await udpTransceiver.transceive("BALCONY_STATUS")
                }
                resp = await options[data.args[0]]()
            }
            return [resp]
        }
    },
    'REGEX:switch.(?<arg0>[1-4]{1}).(?<arg1>on|off|status)': {
        skipFolderName: true,
        func: async (data) => {
            let resp
            if (data.env == "server") {
                resp = await CommandUtils.forward(data, "raspberry")
            } else {
                let options = {
                    "1-on": async () => await udpTransceiver.transceive("SWITCH_1_ON"),
                    "1-off": async () => await udpTransceiver.transceive("SWITCH_1_OFF"),
                    "status": async () => await udpTransceiver.transceive("BALCONY_STATUS")
                }
                let key = data.args[0] + "-" + data.args[1]
                resp = await options[key]()
            }
            return [resp]
        }
    }
}

export default lights