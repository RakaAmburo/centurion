import CommandUtils from "../commandUtils.js"
import MessageQueue from "../../messageQueue.js"

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
            }
            return [resp]
        }
    }
}

export default detectors