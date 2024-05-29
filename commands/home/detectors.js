import CommandUtils from "../commandUtils.js"
import MessageQueue from "../../messageQueue.js"

let detectors = {
    'bath.movement.detected': {
        skipFolderName: false,
        availableIn: [""],
        func: async (data) => {
            let resp
            if (data.env == "server") {
                MessageQueue.severity = 1
                resp = 'alert received!'
            } else {
                resp = await CommandUtils.forward(data, "server")
            }
            return [resp]
        }
    }
}

export default detectors