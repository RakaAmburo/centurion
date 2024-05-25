import validator from "./securityUtils.js";
import utils from "./commonUtils.js";
import udpTransceiver from "./udpTransceiver.js";
import commands from "./commands/commandConstructor.js";
import postHanler from "./commands/commandHandler.js";

/* udpTransceiver.init(8284, 8285, 8286)
await utils.wait(2000)
let message = await udpTransceiver.transceive("BALCONY_STATUS")
console.log(message) */

  let token = validator.generateToken();
  console.log(token)
/* console.log(await validator.tokenIsNotValid("omC8tIQ5tIyv")) */
//validator.toblackList("192.168.1.0")

//console.log("aqui")
/* let prot = validator.getPayloadStructure("hola", validator.webSocketComType.inst);
let message = prot.prepareToSend()
console.log(message) */
//console.log(await validator.protocolCheck(1))
//console.log(validator.protocolExtract("VvL0w2hcwTD3DcELy0cGZHHLOJHjosDgDMZ5pPOToTLLectOOcHmHCcjeTDgDk8cp9tRK2OToTLRwPHvqdBTSWZuDTNTpPEvSJ8cqPHvpvD3V90gDkn8p9yvSJ5zw9XToTD7GsL4").message)


//utils.pullFromGit()
await utils.wait(2000)
console.log(commands)
//commands['admin.test.one.thing']()
//await postHanler(["admin test one things"], commands)
let res = await postHanler(["raspberry pull and restart"], commands)
console.log(res)