const { Api, TelegramClient } = require("telegram");
const TelegramApi = require('node-telegram-bot-api')
const { StringSession } = require("telegram/sessions");
const cron = require('node-cron');
const fs = require('fs');
const intialSession = require('./session.json')
let SPAM = 'POST HERE'
const ADMIN = []
let LATITUDE = 37.468766
let LONGITUDE = 126.936944
let INTERVAL = 1
let API_ID = process.env.API_ID
let API_HASH = process.env.API_HASH
let SESSION_STRING = intialSession.sessionString
const BOT_TOKEN = process.env.BOT_TOKEN
const LOGIN = 'ADMIN'
const PASSWORD = '123'
let CURRENT_USER = intialSession.phone



let LOGIN_CANDIADATE = 218834326
let CANDIDATE_DATA = {
    phone: null,
    password: null,
    recievedCode: null
}


const bot = new TelegramApi(BOT_TOKEN, { polling: true })
bot.setMyCommands([
    { command: '/start', description: 'restart' },
    { command: '/check_msg', description: 'what post is been sending' },
    { command: '/check_int', description: 'how often posts are been sending' },
    { command: '/check_lct', description: 'current location' },
    { command: '/sender', description: 'who sends posts' },
    { command: '/message', description: 'update message' },
    { command: '/interval', description: 'update interval' },    
])
const sesssion = new StringSession(SESSION_STRING)
const client = new TelegramClient(sesssion, API_ID, API_HASH, {});

async function getChats(){
    const result = await client.invoke(
        new Api.contacts.GetLocated({
            geoPoint: new Api.InputGeoPoint({
                lat: LATITUDE,
                long: LONGITUDE,
                accuracyRadius: 43,
            }),
            selfExpires: 43,
        })
    );

    return result.chats
}

module.exports.runBot = async ()  => {





    bot.on('message', async msg => {
        const text = msg.text ? msg.text : ''
        const chatId = msg.chat.id
        console.log(msg)
        if (text === '/start') {
            return bot.sendSticker(chatId, 'CAACAgIAAxkBAAOLY4BuKYi5bkgILFnWv4n7gvgnpSEAAt0gAAKmUghIdWpUJizpPg0rBA')

        }
        if (text.includes('login')) {
            return await registerUser(msg)
        }
        if (msg.location && chatId == LOGIN_CANDIADATE) {
            LATITUDE = msg.location.latitude
            LONGITUDE = msg.location.longitude
            return bot.sendMessage(chatId, "Location has been updated successfully")
        }
        if (text.includes('message')) {
            return await setMessage();
        }
        if (text.includes('interval')) {
            return await setMessageInterval();
        }
        if (chatId === LOGIN_CANDIADATE) {
            return handleGetters(text);
        }

        return bot.sendMessage(chatId, "It is telegram bot for massive sending Adds to nearby channels. text @manjeom_com if you need it.")

    })
}



async function setMessage() {
    await bot.sendMessage(LOGIN_CANDIADATE, `Please enter your message`);
    let done = false;
    bot.on('message', async msg => {
        if (msg.chat.id != LOGIN_CANDIADATE) return;
        await client.connect()
        const result = await client.invoke(
            new Api.messages.ForwardMessages({
              fromPeer: LOGIN_CANDIADATE,
              id: msg.message_id,
              randomId: [BigInt("-4156887774564")],
              toPeer: msg.chat.id,
              dropAuthor: true,
            })
          );
          console.log(result); // prints the result
        done = true;
    })

    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            if (done) {
                clearInterval(intervalId);
                resolve(bot.sendMessage(LOGIN_CANDIADATE, "Message was updated successfully"));
            }
        }, 1000); // Check every 1 second (1000 milliseconds)
    });
}
// Function that resolves a promise when the global variable is not null
async function getUserData(data) {
    await bot.sendMessage(LOGIN_CANDIADATE, `Please enter your ${data}`);
    bot.on('message', async msg => {
        if (msg.chat.id != LOGIN_CANDIADATE) return;
        const text = msg.text;
        if (text.includes('phone')) {
            CANDIDATE_DATA.phone = parseDataFromString(text, 'phone')
        }

        if (text.includes('recievedCode')) {
            CANDIDATE_DATA.recievedCode = parseDataFromString(text, 'recievedCode')
            console.log(CANDIDATE_DATA.recievedCode)
        }

        if (text.includes('password')) {
            CANDIDATE_DATA.password = parseDataFromString(text, 'password')
        }
    })
    //  const result = await res(data);
    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            if (CANDIDATE_DATA[data] !== null) {
                clearInterval(intervalId);
                resolve(CANDIDATE_DATA[data]);
            }
        }, 1000); // Check every 1 second (1000 milliseconds)
    });
}

async function setMessageInterval() {
    await bot.sendMessage(LOGIN_CANDIADATE, `Please enter interval of messages in hours`);
    let done = false;
    bot.on('message', async msg => {
        if (msg.chat.id != LOGIN_CANDIADATE) return;
        INTERVAL = Number(msg.text);
        done = true;
    })

    return new Promise((resolve, reject) => {
        const intervalId = setInterval(() => {
            if (done) {
                clearInterval(intervalId);
                scheduleCronJob(INTERVAL);
                resolve(bot.sendMessage(LOGIN_CANDIADATE, "Interval was updated successfully"));
            }
        }, 1000); // Check every 1 second (1000 milliseconds)
    });
}

async function handleGetters(text) {

    if (text === '/check_msg') {
        return bot.sendMessage(LOGIN_CANDIADATE, SPAM)
    }
    else if (text === '/check_int') {
        return bot.sendMessage(LOGIN_CANDIADATE, INTERVAL)
    }
    else if (text === '/check_lct') {
        return bot.sendMessage(LOGIN_CANDIADATE, `latitude: ${LATITUDE} longitude: ${LONGITUDE}`)
    }
    else if (text === '/sender') {
        return bot.sendMessage(LOGIN_CANDIADATE, CURRENT_USER);
    }
}

async function registerUser(msg) {
    if (LOGIN == parseDataFromString(msg.text, 'login') && PASSWORD == parseDataFromString(msg.text, 'password')) {
        LOGIN_CANDIADATE = msg.chat.id
    }

    await client.start({
        phoneNumber: () => getUserData('phone'),
        password: () => getUserData("password"),
        phoneCode: () => getUserData("recievedCode"),
        onError: (err) => console.log(err),
    });
    SESSION_STRING = String(client.session.save())
    removeAndCreateSessionFile(SESSION_STRING, CANDIDATE_DATA.phone);
    console.log(SESSION_STRING);
    CURRENT_USER = CANDIDATE_DATA.phone;
    CANDIDATE_DATA = {
        phone: null,
        password: null,
        recievedCode: null
    }
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

    await client.connect()
    let chats  = await getChats()
    client.floodSleepThreshold = 300; // sleeps if the wait is lower than 300 seconds
    console.log(chats)
    for(const i of chats) {
        const result = await client.invoke(
            new Api.channels.JoinChannel({
              channel: i.id,
            })
          );
        console.log(result);
        const msgSend = await client.sendMessage(i.id, { message: SPAM });
        console.log(msgSend);

    }
    console.log("end of sending")
  console.log('Task function called!');
}

// Cron job function that schedules the taskFunction based on the Interval
function scheduleCronJob(interval) {
  const cronExpression = `*/${interval} * * * *`; // Cron expression for the Interval in minutes
  // Clear the previous cron job before scheduling the new one
  if (scheduledJob) {
    scheduledJob.stop();
  }

  scheduledJob = cron.schedule(cronExpression, taskFunction);
  console.log(`Task scheduled to run every ${interval} minutes.`);
}

function removeAndCreateSessionFile(s, p) {
    const fileName = 'session.json';
    const textToWrite = JSON.stringify({sessionString: s, phone: p})
  
    // Check if the file exists
    if (fs.existsSync(fileName)) {
      // Remove the existing file
      fs.unlinkSync(fileName);
      console.log(`'${fileName}' removed successfully.`);
    }
  
    // Create a new file and write some text into it
    fs.writeFileSync(fileName, textToWrite);
    console.log(`'${fileName}' created successfully with initial text.`);
  }