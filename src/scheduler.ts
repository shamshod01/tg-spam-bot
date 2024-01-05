import cron from 'node-cron'

let scheduledJob; // Variable to store the scheduled cron job

export function stopTask() {
    if (scheduledJob) {
        scheduledJob.stop();
    }
}

export function rescheduleCronJob(interval, taskFunction) {
    const eachMinute = Math.floor(Math.random() * (30 - 59 + 1)) + 30;

    const cronExpression = `*/${eachMinute} * * * * *`; // Cron expression for the Interval in minutes
    // Clear the previous cron job before scheduling the new one
    stopTask();

    scheduledJob = cron.schedule(cronExpression, taskFunction);
    //console.log(`Task scheduled to run every ${interval} minutes.`);
    return eachMinute;
}