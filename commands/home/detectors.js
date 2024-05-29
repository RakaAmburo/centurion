import CommandUtils from "../commandUtils.js"

let detectors = {
    'bath.movement.detected': {
        skipFolderName: false,
        availableIn: [""],
        func: async (data) => {
            let resp
            if (data.env == "server") {
                //severity 1 o poner en la cola de mensajes
                ret = 'alert received!'
            } else {
                resp = await CommandUtils.forward(data, "server")
            }
            return [resp]
        }
    }
}

export default detectors