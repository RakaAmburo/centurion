import udpTransceiver from "../../udpTransceiver.js"
import CommandUtils from "../commandUtils.js"
import utils from "../../commonUtils.js"

function convertSeries(series) {
    // Divide la serie de números por los dos puntos ":"
    const numbers = series.split(":").map(Number);
    let result = '';

    // Iterar sobre los números y comparar los consecutivos
    for (let i = 1; i < numbers.length; i++) {
        const difference = numbers[i] - numbers[i - 1];  // Diferencia real (no absoluta)
        
        if (Math.abs(difference) < 50) {
            result += '=';  // Diferencia menor a 50
        } else if (difference > 50) {
            result += '+';  // Diferencia mayor a 50 y positiva
        } else {
            result += '-';  // Diferencia mayor a 50 y negativa
        }
    }

    return result;
}

let lights = {
    'test.all.switches': {
        skipFolderName: true,
        func: async (data) => {
            let resp
            if (data.env == "server") {
                resp = await CommandUtils.forward(data, "raspberry")
            } else {
                udpTransceiver.transmit("SWITCH_1_ON")
                udpTransceiver.transmit("SWITCH_2_ON")
                udpTransceiver.transmit("SWITCH_3_ON")
                resp = await udpTransceiver.transceive("SWITCH_4_ON")

                let turnAllOff = async () => {
                    udpTransceiver.transmit("SWITCH_1_OFF")
                    udpTransceiver.transmit("SWITCH_2_OFF")
                    udpTransceiver.transmit("SWITCH_3_OFF")
                    let finalStatus = await udpTransceiver.transceive("SWITCH_4_OFF")
                }
                utils.delayAndExec(10, turnAllOff, "turning all switches off")
            }
            return [resp]
        }
    },
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
                    "status": async () => await udpTransceiver.transceive("BALCONY_STATUS"),
                    "2-on": async () => await udpTransceiver.transceive("SWITCH_2_ON"),
                    "2-off": async () => await udpTransceiver.transceive("SWITCH_2_OFF"),
                    "3-on": async () => await udpTransceiver.transceive("SWITCH_3_ON"),
                    "3-off": async () => await udpTransceiver.transceive("SWITCH_3_OFF"),
                    "4-on": async () => await udpTransceiver.transceive("SWITCH_4_ON"),
                    "4-off": async () => await udpTransceiver.transceive("SWITCH_4_OFF")

                }
                let key = data.args[0] + "-" + data.args[1]
                resp = await options[key]()
            }
            return [resp]
        }
    }, 
    'execute.knock': {
        skipFolderName: true,
        func: async (data) => {
            let resp
            utils.logInfo("incomming raw msg: " + convertSeries(data.extraParams.knocks));
            return [data.extraParams.knocks]
        }
    }
}

export default lights