import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import moment from 'moment';
import { networkInterfaces } from 'os';
const nets = networkInterfaces();
import simpleGit from 'simple-git'
const git = simpleGit(process.cwd());

const dateFormat = 'D-MM-YY|HH:mm:ss';
const utils = []

utils.executeInLocal = async (cmd) => {
    try {
        await execAsync(cmd)
    } catch (e) {
        console.error(e.message.trim());
        throw new Error('Excecution problem')
    }
    console.log(`Command: (${cmd}) -> OK`)
}

utils.executeInLocalWithOut = async (cmd) => {
    try {
        const { stdout, stderr } = await execAsync(cmd)
        console.log('stdout:', stdout);
        console.log('stderr:', stderr);
    } catch (e) {
        console.error(e.message.trim());
        throw new Error('Excecution problem')
    }
    console.log(`Command: (${cmd}) -> OK`)
}

utils.logInfo = async (msg) => {
    let date = moment().format(dateFormat)
    console.log(date + " -> " + msg)
}

utils.logError = async (msg) => {
    let date = moment().format(dateFormat)
    console.error(date + " -> " + msg)
}

utils.getLocalIp = () => {
    for (const name of Object.keys(nets)) {
        for (const net of nets[name]) {
            if (net.family === 'IPv4' && !net.internal) {
                //console.log("local ip: " + name + " " + net.address)
                return net.address
            }
        }
    }
    return 0
}

utils.wait = ms => new Promise(resolve => setTimeout(resolve, ms));

utils.retartApp = (seconds) => {
    setTimeout(() => {
        process.exit(0);
    }, seconds * 1000);
    return `restarting in ${seconds} secs!`
}

utils.pullFromGitAndRestart = () => {
    git.pull((err, update) => {
        if (err) {
            utils.logError('Cant pull from git ' + err)
        } else if (update && update.summary.changes) {
            utils.logInfo('Git pull changes found!')
            utils.logInfo(utils.retartApp(10))
        } else {
            utils.logInfo('Git with no changes, keep as if.')
        }
    })
}

export default utils