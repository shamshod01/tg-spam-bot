# TMS - Telegram Message Sender
TMS is auto message sending tool from your account. Sign in to bot with your telegram account and it will send messages from your account automatically.

## Main features
- periodically change location and join near Groups
- send Message to those groups within an interval
- send massive messages to all groups of that account

## Additional features
- admin access only
- update interval, account, location
- build exec file and run on any OS without code

## Project structure
```
- src
   |- app.ts - main file
   |- bot.ts - manager bot code (setting interval, logging admin etc.
   |- client.ts - account functions (login, join chat, send message) 
   |- crypto.ts - (en/de)crypt used in manageState.ts
   |- manageState.ts - state control (set, get)
   |- scheduler.ts - scheduling task function to call each interval
   |- utils.ts - helpers
```

## Project Setup
1. ```shell 
    npm install
    ```
2. update `manageState.ts`
   1. `api_id` - to run client
   2. `api_hash` - to run client
   3. `bot_token` - is need to run manager bot
3. update `crypto.ts`
   1. `key` - string used for state encryption
4. ```shell 
    npm run start
   ```
   
### compile
```shell 
npm run compile
```

### make exec file
```shell
npm run build:mac 
```
change `mac` to `win` or `linux` to build for other OS
