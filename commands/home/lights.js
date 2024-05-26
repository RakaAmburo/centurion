import udpTransceiver from "../../udpTransceiver.js"

udpTransceiver

let lights = {
    'REGEX:balcony.lights.(?<arg0>on|off|status)': {
        skipFolderName: false,
        func: async (data) => {
            let resp
            let options = {
                "on": async () => await udpTransceiver.transceive("BALCONY_ON"),
                "off": async () => await udpTransceiver.transceive("BALCONY_OFF"),
                "status": async () => await udpTransceiver.transceive("BALCONY_STATUS")
            }
            resp = await options[data.args[0]]
            return [resp]
        }
    }
}

export default lights