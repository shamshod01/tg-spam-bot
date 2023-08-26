const { Api, TelegramClient } = require("telegram");
const TelegramApi = require('node-telegram-bot-api')
const { StringSession } = require("telegram/sessions");
const cron = require('node-cron');
const fs = require('fs');
const request = require('request');
const path = require('path');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config()

const intialSession = require('./session.json')
const {calculateNewCoordinates} = require('./utils');

const PHOTO = 'file.jpg'
let SPAM = 'hello oil'
let LATITUDE = 37.468766 //25.254857//
let LONGITUDE = 126.936944 // 55.329514//
let INTERVAL = 1
let API_ID = Number(process.env.API_ID)
let API_HASH = process.env.API_HASH
let SESSION_STRING = intialSession.sessionString
const BOT_TOKEN = process.env.BOT_TOKEN
const LOGIN = process.env.LOGIN
const PASSWORD = process.env.PASSWORD
let TEMP_LATITUDE = LATITUDE;
let TEMP_LONGITUDE = LONGITUDE;

let LOGIN_CANDIADATE = 218834326
let CANDIDATE_DATA = {
    phone: null,
    password: null,
    recievedCode: null
}


const bot = new TelegramApi(BOT_TOKEN, { polling: true })
bot.setMyCommands([
    { command: '/start', description: 'restart' },
    { command: '/run', description: "start sending messages"},
    { command: '/stop', description: "stop sending messages"},
    { command: '/mass_send', description: "send message to all chatting you have"},
    { command: '/check_int', description: 'how often posts are been sending' },
    { command: '/check_lct', description: 'current location' },
    { command: '/check_sndr', description: 'who sends posts' },
    { command: '/sender', description: "update sender"},
])
const sesssion = new StringSession(SESSION_STRING)
let client = new TelegramClient(sesssion, API_ID, API_HASH, {});

async function getChats() {
   // console.log(TEMP_LONGITUDE)
   // console.log(TEMP_LATITUDE)
    const geoPoint = new Api.InputGeoPoint({
        lat: TEMP_LATITUDE,
        long: TEMP_LONGITUDE,
        accuracyRadius: 40,
    })
   // console.log(geoPoint)
    const api  = new Api.contacts.GetLocated({
        geoPoint: geoPoint,
        selfExpires: 1
    })
   // console.log(api)
    const result = await client.invoke(
        api
    );
    return result.chats
}

module.exports.runBot = async () => {

    await client.connect()


    bot.on('message', async msg => {
        const text = msg.text ? msg.text : ''
        const chatId = msg.chat.id

//        console.log(msg)
        if (text === '/start') {
            return bot.sendSticker(chatId, 'CAACAgIAAxkBAAICeGTDbLZvdR46W50TsUyZ3v2Hf3jQAAL7BQAClvoSBZdb7eV44WgWLwQ')
        }
        if (text.includes('login')) {
            return await registerUser(msg)
        }
        if (chatId !== LOGIN_CANDIADATE) {
            return bot.sendMessage(chatId, "It is telegram bot for massive sending Adds to nearby channels. text @manjeom_com if you need it.")
        }
        if (msg.location && chatId == LOGIN_CANDIADATE) {
            LATITUDE = msg.location.latitude
            LONGITUDE = msg.location.longitude
            return bot.sendMessage(chatId, "Location has been updated successfully")
        }
        if (msg.photo && msg.photo[0]) {
            SPAM = msg.text || msg.caption
            const fileId = msg.photo[msg.photo.length-1].file_id;
            await handlePhoto(fileId)
            return bot.sendMessage(LOGIN_CANDIADATE, "Message was updated successfully")
        }
        if(text == '/run') {
            rescheduleCronJob(INTERVAL);
            return bot.sendMessage(chatId, `Messages will be sent every ${INTERVAL} minutes`)
        }
        if (text.includes('interval')) {
            let interval = parseDataFromString(text, 'interval')
            if(!Number(interval) || Number(interval) > 59 || Number(interval) < 1) {
                return bot.sendMessage(LOGIN_CANDIADATE, "Send only number between 1~23")    
             }
             INTERVAL = Number(interval);
            return bot.sendMessage(LOGIN_CANDIADATE, "Interval was updated successfully")
        }
        if(text.includes('sender')) {
            return await newSender()
        }
        if(text === '/stop') {
            stopTask()
            return bot.sendMessage(chatId, `Message sending has been stopped`)
        }
        if(text === '/mass_send') {
            await massSend()
            return bot.sendMessage(chatId, `Messages have been sent`)
        }
        return handleGetters(text);
    })
}

// Function that resolves a promise when the global variable is not null
async function getUserData(data) {
    await bot.sendMessage(LOGIN_CANDIADATE, `Please enter your ${data}`);
    bot.on('message', async msg => {
        if (msg.chat.id != LOGIN_CANDIADATE) return;
        const text = msg.text ? msg.text : ''
        if (text.includes('phone')) {
            CANDIDATE_DATA.phone = parseDataFromString(text, 'phone')
        }

        if (text.includes('recievedCode')) {
            CANDIDATE_DATA.recievedCode = parseDataFromString(text, 'recievedCode')
     //       console.log(CANDIDATE_DATA.recievedCode)
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
async function handleGetters(text) {
    if (text === '/check_int') {
        return bot.sendMessage(LOGIN_CANDIADATE, INTERVAL)
    }
    else if (text === '/check_lct') {
        return bot.sendMessage(LOGIN_CANDIADATE, `latitude: ${LATITUDE} longitude: ${LONGITUDE}`)
    }
    else if (text === '/check_sndr') {
        try{
            let me = await client.getMe()
            return bot.sendMessage(LOGIN_CANDIADATE, me.phone);
        } catch(e) {
            return bot.sendMessage(LOGIN_CANDIADATE, "it seems there is no sender")
        }
        
    }
}
async function registerUser(msg) {
    if (LOGIN == parseDataFromString(msg.text, 'login') && PASSWORD == parseDataFromString(msg.text, 'password')) {
        LOGIN_CANDIADATE = msg.chat.id
        return bot.sendMessage(msg.chat.id, "Welcome Boss!")
    }
    return bot.sendMessage(msg.chat.id, "It is telegram bot for massive sending Adds to nearby channels. text @manjeom_com if you need it.")
}
async function newSender() {
    await client.disconnect()
    const sesssion = new StringSession('')
    client = new TelegramClient(sesssion, API_ID, API_HASH, {});
    await client.start({
        phoneNumber: () => getUserData('phone'),
        password: () => getUserData("password"),
        phoneCode: () => getUserData("recievedCode"),
        onError: (err) => console.log(err),
    });
    SESSION_STRING = String(client.session.save())
    //console.log(SESSION_STRING);
    removeAndCreateSessionFile(SESSION_STRING);
    CANDIDATE_DATA = {
        phone: null,
        password: null,
        recievedCode: null
    }
    bot.sendMessage(LOGIN_CANDIADATE, "sender has been set!")
}
function parseDataFromString(inputString, dataName) {
    const regex = new RegExp(`(?<=${dataName}:\\s*)[^,]+`);
    const match = inputString.match(regex);

    if (match) {
        const data = match[0].trim();
        return data;
    } else {
        return null; // Return null if the input string doesn't contain the specified dataName
    }
}

let scheduledJob; // Variable to store the scheduled cron job

// Function to be called by cron
async function taskFunction() {
    console.log('try fetch groups')
   // await client.connect()
    let chats = await getChats()
    client.floodSleepThreshold = 60; // sleeps if the wait is lower than 300 seconds
    //console.log("fetched this groups", chats.map(e => e.title))
    for (const i of chats) {
        if(i.defaultBannedRights.sendMessages ||  i.defaultBannedRights.sendMedia || i.joinRequest || i.restricted ||  i.defaultBannedRights.sendPhotos) continue;
        console.log('try to join');
        console.log(i);
        const result = await client.invoke(
            new Api.channels.JoinChannel({
                channel: i.id,
            })
        );
        console.log('tried to join');
        await sendPost(i.id);
    }
    console.log("end of sending");
    await bot.sendMessage(LOGIN_CANDIADATE, "message was sent to groups of this location")
    await bot.sendLocation(LOGIN_CANDIADATE, TEMP_LATITUDE, TEMP_LONGITUDE)
    const newLocation = calculateNewCoordinates(LATITUDE, LONGITUDE);
    TEMP_LATITUDE = newLocation.latitude;
    TEMP_LONGITUDE = newLocation.longitude;
    console.log('Task function called!');
}
async function massSend() {
    let dialogs = await client.getDialogs({
        limit: 50
    })
    for(const el of dialogs) {
        if(!el.isGroup || chat.defaultBannedRights.sendMessages ||  chat.defaultBannedRights.sendMedia ||  chat.defaultBannedRights.sendPhotos|| chat.joinRequest || chat.restricted) continue;
        await sendPost(el.id);
    }
}

async function sendPost(chatId) {
    let post = {message: SPAM}
    if (fs.existsSync(PHOTO)) {
        post.file = `./${PHOTO}`
    }
    console.log("try to send message");

    const msgSend = await client.sendMessage(chatId, post);

    console.log("tried to send message", msgSend);
}

// Cron job function that schedules the taskFunction based on the Interval
function rescheduleCronJob(interval) {
    const cronExpression = `*/${interval} * * * *`; // Cron expression for the Interval in minutes
    // Clear the previous cron job before scheduling the new one
    stopTask();

    scheduledJob = cron.schedule(cronExpression, taskFunction);
    //console.log(`Task scheduled to run every ${interval} minutes.`);
}

function stopTask(){
    if (scheduledJob) {
        scheduledJob.stop();
    }
}

function removeAndCreateSessionFile(s) {
    const fileName = 'session.json';
    const textToWrite = JSON.stringify({ sessionString: s })

    // Check if the file exists
    removeFile(fileName);

    // Create a new file and write some text into it
    fs.writeFileSync(fileName, textToWrite);
    //console.log(`'${fileName}' created successfully with initial text.`);
}

function removeFile(fileName) {
     // Check if the file exists
     if (fs.existsSync(fileName)) {
        // Remove the existing file
        fs.unlinkSync(fileName);
      // console.log(`'${fileName}' removed successfully.`);
    }
}

// this is used to download the file from the link
const download = (url, path, callback) => {
    request.head(url, (err, res, body) => {
    request(url).pipe(fs.createWriteStream(path)).on('close', callback);
  });
};

async function handlePhoto(fileId) {
    removeFile(PHOTO)
    const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`
      );
      // extract the file path
      const res2 = await res.json();
      const filePath = res2.result.file_path;
  
      // now that we've "file path" we can generate the download link
      const downloadURL = 
        `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;
  
      // download the file (in this case it's an image)
      download(downloadURL, path.join(__dirname, PHOTO), () =>
        console.log('Done!')
        
       );
}
