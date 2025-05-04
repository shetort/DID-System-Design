// utils/Logger.js
const fs = require('fs');
const path = require('path');

const LOG_FILE_PATH = path.join(__dirname, 'contract-logs.json');

class Logger {
    constructor() {
        this.ensureLogFile();
    }

    ensureLogFile() {
        if (!fs.existsSync(LOG_FILE_PATH)) {
            fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([]));
        }
    }

    async addLog(logData) {
        const logs = await this.getLogs();
        logs.push({
            timestamp: new Date().toISOString(),
            ...logData
        });
        fs.writeFileSync(LOG_FILE_PATH, JSON.stringify(logs, null, 2));
    }

    async getLogs() {
        this.ensureLogFile();
        const data = fs.readFileSync(LOG_FILE_PATH);
        return JSON.parse(data);
    }

    async clearLogs() {
        fs.writeFileSync(LOG_FILE_PATH, JSON.stringify([]));
    }
}

module.exports = new Logger();