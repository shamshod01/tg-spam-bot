import {Api, TelegramClient} from "telegram";
import {get} from "./manageState";
import {StringSession} from "telegram/sessions";
import fs from "fs";
import {randomSleep, withTimeout} from "./utils";
import path from "path";


class Client {
    instance: TelegramClient

    async connect() {
        const session = new StringSession(get('session'));
        this.instance = new TelegramClient(session, get('api_id'), get('api_hash'), {})
        await this.instance.connect()
    }

    async setInstance(inst: TelegramClient) {
        if(this.instance) await this.instance.disconnect();
        this.instance = inst;
        await this.instance.connect()
    }
}

export const client = new Client()

export async function massSend() {
    let dialogs = await client.instance.getDialogs({
        limit: 50
    })
    for (const el of dialogs) {
        const chat = el.entity
        //@ts-ignore
        if (!el.isGroup || chat.defaultBannedRights.sendMessages || chat.defaultBannedRights.sendMedia || chat.defaultBannedRights.sendPhotos || chat.defaultBannedRights.embedLinks || chat.joinRequest || chat.restricted) continue;
        await sendPost(el.id);
    }
}

export async function sendPost(chatId) {
    let post: { file?: string, message: string } = {message: get('message')}
    if (fs.existsSync(get('image'))) {
        post.file = path.join(path.dirname(process.execPath), get('image'));
    }
    console.log("try to send message");
    await randomSleep(0, 50) // to avoid spam system

    const msgSend = await withTimeout(async () => {
        return await client.instance.sendMessage(chatId, post);
    }, 1000)
    console.log("tried to send message", msgSend);
}

export async function getChats() {
    const geoPoint = new Api.InputGeoPoint({
        lat: get('latitude'),
        long: get('longitude'),
        accuracyRadius: 40,
    })
    const api = new Api.contacts.GetLocated({
        geoPoint: geoPoint,
        selfExpires: 1
    })

    const result = await withTimeout(async () => {
        return await client.instance.invoke(
            api
        );
    })
    client.instance.floodSleepThreshold = 60;
    //@ts-ignore
    return result ? result.chats : false
}

export async function joinChat(chat:any) {
    if (chat.defaultBannedRights.sendMessages
        || chat.defaultBannedRights.sendMedia
        || chat.joinRequest
        || chat.restricted
        || chat.defaultBannedRights.sendPhotos
        || chat.defaultBannedRights.embedLinks) return false;
    console.log('try to join');
    console.log(chat);
    return await withTimeout(async () => {
        return await client.instance.invoke(
            new Api.channels.JoinChannel({
                channel: chat.id,
            })
        );
    }, 1000)
}