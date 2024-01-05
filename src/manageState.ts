import * as path from "path";
import * as fs from 'fs/promises';
import {decrypt, encrypt} from "./crypto";
import {randomSleep} from "./utils";
let filePath:string// = path.join(__dirname, './info.json');

if ((process as any).pkg) {
    // If running as pkg binary, set the external path relative to the binary's location
    filePath = path.join(path.dirname(process.execPath), 'info.json');
} else {
    // If running in standard Node.js environment, use the previous approach
    filePath = path.join(__dirname, 'info.json');
}

const STATE = {
    "api_id": 0,
    "api_hash": "",
    "session": "",

    "bot_token": "",
    "admin": 218834326,
    "login": "bot",
    "password": "123",
    "image": "file.jpg",
    "message": "hello",
    "interval": 1,

    "init_longitude": 55.329514,
    "init_latitude": 25.254857,
    "longitude": 55.329514,
    "latitude": 25.254857,
    "movement_distance": 0,
    "movement_direction": 0
}

export interface State {
    api_id: number,
    api_hash: string,
    session: string,

    bot_token: string,
    admin: number,
    login: string,
    password: string,

    message: string,
    image: string,
    interval: number,

    init_longitude: number,
    init_latitude: number,
    longitude: number,
    latitude: number,
    "movement_distance": number,
    "movement_direction": number
}
let state:State;

export async function initState() {

    await ensureInfoFileExists()
    const res = await fs.readFile(filePath, 'utf8')
    const plainState = decrypt(JSON.parse(res))
    state = JSON.parse(plainState);
}

export function get<K extends keyof State>(name: K): State[K] {
    return state[name];
}
export async function set(name: keyof State, value) {
    //@ts-ignore
    state[name] = value;

    const cipherState = encrypt(JSON.stringify(state))
    await fs.writeFile(
        filePath,
        JSON.stringify(cipherState)
    );

    await randomSleep(1, 2)
}

export async function setMany(newState: {[key:string]:any }) {
    for(const [key, value] of Object.entries(newState)) {
        //@ts-ignore
        state[key] = value;
    }
    const cipherState = encrypt(JSON.stringify(state))
    await fs.writeFile(
        filePath,
        JSON.stringify(cipherState)
    );
    await randomSleep(1, 2)
}


export async function ensureInfoFileExists() {
    try {
        await fs.access(filePath);
    } catch (err) {
        const cipherState = encrypt(JSON.stringify(STATE))
        // The file doesn't exist, create or extract it
        await fs.writeFile(filePath, JSON.stringify(cipherState));
    }
}
