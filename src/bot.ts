import {get, initState, set} from "./manageState";
import TelegramBot from "node-telegram-bot-api";
import {client, getChats, joinChat, massSend, sendPost} from './client';
import {calculateNewCoordinates, handlePhoto, parseDataFromString, randomSleep} from "./utils";
import {StringSession} from "telegram/sessions";
import {TelegramClient} from "telegram";
import {rescheduleCronJob, stopTask} from "./scheduler";

interface Login {
    phone:string|null,
    password: string|null,
    receivedCode: any,
}

let CANDIDATE_DATA:Login = {
    phone: null,
    password: null,
    receivedCode: null,
}


enum COMMANDS {
    start= '/start',
    run = '/run',
    stop = '/stop',
    massSend = '/mass_send',
    checkInterval = '/check_int',
    checkLocation = '/check_lct',
    checkSender = '/check_sndr',
    sender = '/set_sender'
}

let bot:TelegramBot

export const runBot = async () => {
    await initState()
    await client.connect()
    const token = get('bot_token');
    bot = new TelegramBot(token, { polling: true })

    await bot.setMyCommands([
        {command: COMMANDS.start, description: 'restart'},
        {command: COMMANDS.run, description: "start sending messages"},
        {command: COMMANDS.stop, description: "stop sending messages"},
        {command: COMMANDS.massSend, description: "send message to all chatting you have"},
        {command: COMMANDS.checkInterval, description: 'how often posts are been sending'},
        {command: COMMANDS.checkLocation, description: 'current location'},
        {command: COMMANDS.checkSender, description: 'who sends posts'},
        {command: COMMANDS.sender, description: "update sender"},
    ])
    console.log('\n\n BOT STARTED SUCCESSFULLY \n\n')
    bot.on('message', async msg => {
        const text = msg.text ? msg.text : ''
        const chatId = msg.chat.id

        if(text === COMMANDS.start) {
            return bot.sendSticker(chatId, 'CAACAgIAAxkBAAICeGTDbLZvdR46W50TsUyZ3v2Hf3jQAAL7BQAClvoSBZdb7eV44WgWLwQ');
        }
        if(text.includes('login')) {
            return await authAdmin(msg);
        }
        if(chatId !== get('admin'))
            return bot.sendMessage(chatId, "It is telegram bot for massive sending Adds to nearby channels. text @manjeom_com if you need it.")

        if(msg.location) {
            await set('latitude', msg.location.latitude);
            await set('longitude', msg.location.longitude);
            return bot.sendMessage(chatId, "Location has been updated successfully")
        }
        if (msg.photo && msg.photo[0]) {
            const post = msg.text || msg.caption
            await set('message', post);
            const fileId = msg.photo[msg.photo.length - 1].file_id;
            await handlePhoto(fileId);
            return bot.sendMessage(get('admin'), "Message was updated successfully");
        }
        if (text == COMMANDS.run) {
            const minute = rescheduleCronJob(get('interval'), taskFunction);
            return bot.sendMessage(chatId, `Messages will be sent every ${get('interval')} hours at ${minute}th minute`)
        }
        if (text.includes('interval')) {
            let interval = parseDataFromString(text, 'interval')
            if (!Number(interval) || Number(interval) > 59 || Number(interval) < 1) {
                return bot.sendMessage(chatId, "Send only number between 1~23")
            }
            await set('interval', Number(interval));
            return bot.sendMessage(chatId, "Interval was updated successfully")
        }
        if (text === COMMANDS.sender) {
            if(!get('session')) {
                return bot.sendMessage(chatId, "To change user go to https://my.telegram.org/auth?to=apps and create API key and hash. Then send it in format\n api_id: id value, \n api_hash: hash value")
            }
            return await newSender()
        }
        if (text === COMMANDS.stop) {
            await stopTask()
            return bot.sendMessage(chatId, `Message sending has been stopped`)
        }
        if (text === COMMANDS.massSend) {
            await massSend()
            return bot.sendMessage(chatId, `Messages have been sent`)
        }
        if(text.includes('api_id') && text.includes('api_hash')) {
            const key = parseDataFromString(msg.text, 'api_id')
            const hash = parseDataFromString(msg.text, 'api_hash')
            if(key && hash) {
                await set('api_id', Number(key));
                await set('api_hash', hash);
                if(!get('session')) {
                    return await newSender()
                }
                // it will connect client using new value of api id and api hash
                await client.connect()
                return bot.sendMessage(chatId, "api hash and key is submitted")
            }
            return bot.sendMessage(chatId, "please, start again all process")
        }
        return handleGetters(text);
    })

}

async function handleGetters(text:string) {
    const admin = get('admin')
    if (text === COMMANDS.checkInterval) {
        return bot.sendMessage(admin, String(get('interval')));
    }
    else if (text === COMMANDS.checkLocation) {
        return bot.sendLocation(admin, get('latitude'), get('longitude'));
    }
    else if (text === COMMANDS.checkSender) {
        try {
            let me = await client.instance.getMe();
            //@ts-ignore
            return bot.sendMessage(admin, me.phone);
        } catch (e) {
            return bot.sendMessage(admin, "it seems there is no sender");
        }

    }
}

export async function taskFunction() {
    try {
        console.log('fetch groups')
        const chats = await getChats();
        if (!chats) {
            console.log('failed to fetch chats');
            return;
        }
        for (const i of chats) {
            await randomSleep(9, 50);
            const joined = await joinChat(i);
            console.log('tried to join', joined)
          //  joined && await sendPost(i);
        }
        console.log('end of sending');
        await bot.sendMessage(get('admin'), 'message was sent to groups of this location')
        await bot.sendLocation(get('admin'), get('latitude'), get('longitude'));
        await calculateNewCoordinates()
        console.log('task function called successfully!')
    }catch (e) {
        console.log('\n TASK FUNCTION ERROR \n\n', e);
    }

}

async function newSender() {
    try {
        const session = new StringSession('')
        const newClient = new TelegramClient(session, get('api_id'), get('api_hash'), {});
        // @ts-ignore
        await newClient.start({
            // @ts-ignore
            phoneNumber: () => getUserData('phone'),
            // @ts-ignore
            password: () => getUserData("password"),
            // @ts-ignore
            phoneCode: () => getUserData("receivedCode"),
            onError: (err) => console.log(err),
        });
        await set('session',String(newClient.session.save()));
        await client.setInstance(newClient);
        CANDIDATE_DATA = {
            phone: null,
            password: null,
            receivedCode: null,
        }
        await bot.sendMessage(get('admin'), "sender has been set!")
    }catch(e) {
        await bot.sendMessage(get('admin'), "something went wrong")
    }

}

async function getUserData(data) {
    await bot.sendMessage(get('admin'), `Please enter your ${data}`);
    bot.on('message', async msg => {
        if (msg.chat.id != get('admin')) return;
        const text = msg.text ? msg.text : ''
        if (text.includes('phone')) {
            CANDIDATE_DATA.phone = parseDataFromString(text, 'phone')
        }

        if (text.includes('receivedCode')) {
            CANDIDATE_DATA.receivedCode = parseDataFromString(text, 'receivedCode')
        }

        if (text.includes('password')) {
            CANDIDATE_DATA.password = parseDataFromString(text, 'password')
        }
    })
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            if (CANDIDATE_DATA[data] !== null) {
                clearInterval(intervalId);
                resolve(CANDIDATE_DATA[data]);
            }
        }, 1000); // Check every 1 second (1000 milliseconds)
    });
}

async function authAdmin(msg) {
    if (get('login') == parseDataFromString(msg.text, 'login') && get('password') == parseDataFromString(msg.text, 'password')) {
        await set('admin', msg.chat.id);
        return bot.sendMessage(msg.chat.id, "Welcome Boss!")
    }
    return bot.sendMessage(msg.chat.id, "It is telegram bot for massive sending Adds to nearby channels. text @manjeom_com if you need it.")
}

