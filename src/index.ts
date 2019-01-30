import * as fs from 'fs';
import * as getStdin from 'get-stdin';
import commandLineArgs = require('command-line-args');
import { CacheRequester } from './cache-requester';
import { ConcourseRequest, SourceConfig, Version, ConcourseResponse } from './concourse';
import { Logger } from './logger';
import { PersistentCache } from './cache';
import { PullRequestResponse, BitBucketClient, PullRequest } from './bitbucket';
import { execFile } from 'child_process';
import { serialize, deserialize } from 'class-transformer';
import { CheckCommand } from './check';
import { InCommand } from './in';
import { OutCommand } from './out';
import { Execute } from './exec';

const logger: Logger = new Logger();

async function main() {
    const stdin = await getStdin();
    const concourseRequest: ConcourseRequest = JSON.parse(stdin);
    logger.setLogLevel(concourseRequest.source.log_level);

    const t0 = Date.now();
    logger.debug('main()');

    logger.debug(`cwd: ${process.cwd()}`);
    fs.readdirSync(process.cwd()).forEach(file => {
        logger.debug(`file: ${file}`);
    });

    const mainDefinitions = [{ name: 'command', defaultOption: true }];
    const mainOptions = commandLineArgs(mainDefinitions, {
        stopAtFirstUnknown: true,
    });
    let argv = mainOptions._unknown || [];

    const bitBucketClient: BitBucketClient = new BitBucketClient(logger, concourseRequest.source.username, concourseRequest.source.password, fs);
    const execute: Execute = new Execute();

    logger.debug('stdin: ' + stdin);

    let commandOutput;
    switch (mainOptions.command) {
        case 'check': {
            const checkCommand: CheckCommand = new CheckCommand(logger, bitBucketClient);
            commandOutput = await checkCommand.doIt(concourseRequest.source, concourseRequest.version);
            break;
        }
        case 'in': {
            const inDefinitions = [{ name: 'destination', defaultOption: true }];
            const inOptions = commandLineArgs(inDefinitions, {
                argv,
                stopAtFirstUnknown: true,
            });
            argv = inOptions._unknown || [];
            const inCommand: InCommand = new InCommand(logger, bitBucketClient, fs, execute);
            commandOutput = await inCommand.doIt(concourseRequest.source, inOptions.destination, concourseRequest.version!);
            break;
        }
        case 'out': {
            const outDefinitions = [{ name: 'destination', defaultOption: true }];
            const outOptions = commandLineArgs(outDefinitions, {
                argv,
                stopAtFirstUnknown: true,
            });
            argv = outOptions._unknown || [];
            const outCommand: OutCommand = new OutCommand(logger, bitBucketClient, fs);
            commandOutput = await outCommand.doIt(concourseRequest.source, outOptions.destination, concourseRequest.params!);
            break;
        }
        default: {
            throw new Error('must be either check, in or out');
        }
    }

    logger.debug(`output: ${JSON.stringify(commandOutput)}`);
    logger.output(commandOutput);

    const t1 = Date.now();
    logger.debug('main took ' + (t1 - t0) + ' milliseconds.');
}

main()
    .then()
    .catch(err => {
        logger.error('failed: ' + err);
        logger.error('stacktrace: ' + err.stack);
        process.exit(1);
    });
