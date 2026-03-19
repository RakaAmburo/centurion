import { publish } from '../../mqttPublisher.js'


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
    }
}

export default alarm