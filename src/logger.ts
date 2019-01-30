import * as fs from 'fs';

export class Logger {
    private _logPath: string;
    private _outPath: string;
    private _logLevel: string;

    constructor() {
        this._logPath = '/tmp/bitbucket-pullrequest.log';
        this._outPath = '/tmp/bitbucket-pullrequest.out';
        this._logLevel = 'ERROR';
    }

    setLogLevel(logLevel: string | undefined) {
        if (logLevel == null) {
            return;
        }
        this._logLevel = logLevel;
    }

    debug(message: string) {
        const print: boolean = this._logLevel === 'DEBUG';
        this.log('DEBUG: ' + message, print);
    }

    info(message: string) {
        const print: boolean = this._logLevel === 'DEBUG' || this._logPath === 'INFO';
        this.log('INFO: ' + message, print);
    }

    error(message: string) {
        const print: boolean = this._logLevel === 'DEBUG' || this._logPath === 'INFO' || this._logPath === 'ERROR';
        this.log('ERROR: ' + message, print);
    }

    private log(message: string, print: boolean) {
        fs.appendFileSync(this._logPath, message);
        fs.appendFileSync(this._logPath, '\n');
        if (print) {
            console.error(message);
        }
    }

    output(response: any) {
        fs.appendFileSync(this._outPath, JSON.stringify(response));
        fs.appendFileSync(this._outPath, '\n');
        console.log(JSON.stringify(response));
    }
}
