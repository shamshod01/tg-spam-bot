import {get, set} from "./manageState";
import fs from "fs";
import request from "request";
import path from "path";

let MOVE_FAR = true;

export const calculateNewCoordinates = async () => {
    let DIRECTION = get('movement_direction');
    let MOVEMENT_DISTANCE = get('movement_distance');
    const latitude = get('latitude');
    const longitude = get('longitude');

    //change location;
    MOVEMENT_DISTANCE = MOVE_FAR ? MOVEMENT_DISTANCE+1 : MOVEMENT_DISTANCE-1;
    if(MOVEMENT_DISTANCE === 11 || MOVEMENT_DISTANCE === 0) {
        MOVE_FAR = !MOVE_FAR;
        MOVEMENT_DISTANCE = MOVE_FAR ? MOVEMENT_DISTANCE+1 : MOVEMENT_DISTANCE-1;
        DIRECTION = DIRECTION + 15 === 360 ? 0 : DIRECTION + 15
    }
    //  console.log(MOVEMENT_DISTANCE, DIRECTION);
    const angle = DIRECTION;
    const distance = MOVEMENT_DISTANCE*1000;

    const EARTH_RADIUS = 6371000; // Earth's radius in meters
    const angleRad = (angle * Math.PI) / 180;
    const deltaLat = (distance * Math.cos(angleRad)) / EARTH_RADIUS;
    const deltaLng = (distance * Math.sin(angleRad)) / (EARTH_RADIUS * Math.cos(latitude * (Math.PI / 180)));
    const newLat = latitude + (deltaLat * 180) / Math.PI;
    const newLng = longitude + (deltaLng * 180) / Math.PI;


    await set('movement_distance', MOVEMENT_DISTANCE);
    await set('movement_direction', DIRECTION);
    await set('latitude', newLat);
    await set('longitude', newLng);

    return { latitude: newLat, longitude: newLng };
}
export const randomSleep = (N, M) => {
    const randomSeconds = Math.floor(Math.random() * (M - N + 1)) + N;
    return new Promise(resolve => {
        setTimeout(resolve, randomSeconds * 1000);
    });
}

function removeFile(fileName:string) {
    if (fs.existsSync(fileName)) {
        fs.unlinkSync(fileName);
    }
}

const downloadFile = (url, path, callback) => {
    request.head(url, (err, res, body) => {
        request(url).pipe(fs.createWriteStream(path)).on('close', callback);
    });
};

export async function handlePhoto(fileId) {
    removeFile(get('image'))
    const res = await fetch(
        `https://api.telegram.org/bot${get('bot_token')}/getFile?file_id=${fileId}`
    );
    // extract the file path
    const res2 = await res.json();
    const filePath = res2.result.file_path;

    // now that we've "file path" we can generate the download link
    const downloadURL =
        `https://api.telegram.org/file/bot${get('bot_token')}/${filePath}`;
    // download the file (in this case it's an image)
    downloadFile(downloadURL, path.join(path.dirname(process.execPath), get('image')), () =>
        console.log('Done!')

    );
}


export async function withTimeout<T>(asyncFn: () => Promise<T>, timeout: number = 5000): Promise<T | false> {
    let timer: NodeJS.Timeout;

    // Set up a Promise that will be rejected after a timeout
    const timeoutPromise = new Promise<false>((resolve, reject) => {
        timer = setTimeout(() => {
            reject(new Error('Operation timed out'));
        }, timeout);
    });

    try {
        // Race the two promises against each other
        const result = await Promise.race([asyncFn(), timeoutPromise]);

        // Clear the timeout if the async function completed successfully
        clearTimeout(timer);

        return result;
    } catch (error) {
        // Clear the timeout if the async function failed or timeout reached
        clearTimeout(timer);

        // Check if the error is because of timeout
        if (error.message === 'Operation timed out') {
            return false;
        }
        console.log(error);
        return false;
    }
}

export function parseDataFromString(inputString:string, dataName:string):string {
    const regex = new RegExp(`(?<=${dataName}:\\s*)[^,]+`);
    console.log(inputString, regex)
    const match = inputString.match(regex);

    //if (match) {
        return match[0].trim();
    // } else {
    //     return null; // Return null if the input string doesn't contain the specified dataName
    // }
}