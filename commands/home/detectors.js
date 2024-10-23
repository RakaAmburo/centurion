import CommandUtils from "../commandUtils.js"
import MessageQueue from "../../messageQueue.js"
import udpTransceiver from "../../udpTransceiver.js"

let detectors = {
    'bath.movement.detected': {
        skipFolderName: false,
        availableIn: [""],
        func: async (data) => {
            let resp
            if (data.env == "server") {
                MessageQueue.prepareAndEnqueue(1, "Bath movement detected!")
                resp = 'alert received!'
            } else {
                resp = await CommandUtils.forward(data, "server")
                udpTransceiver.transmit("SWITCH_1_ON")
            }
            return [resp]
        }
    }
}

export default detectors