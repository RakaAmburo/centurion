import mqtt from 'mqtt'
import utils from './commonUtils.js';

const BROKER_URL = 'mqtt://192.168.1.135:1883'

export const publish = (topic, message) => {
    return new Promise((resolve, reject) => {
        const client = mqtt.connect(BROKER_URL)

        client.on('connect', () => {
            client.publish(topic, message, (err) => {
                client.end()
                if (err) {
                    utils.logError('Mq connecting error:' + err)
                    reject('Mq Error')
                }
                else resolve('Mq Sent')
            })
        })

        client.on('error', (err) => {
            utils.logError('Mq sending error:' + err)
            client.end()
            reject('Mq Error')
        })
    })
}