const express = require('express');
const formidable = require('formidable');
const fs = require('fs/promises');
const app = express();
const PORT = 3000;

const Timer = require('./Timer');
const CloneDetector = require('./CloneDetector');
const CloneStorage = require('./CloneStorage');
const FileStorage = require('./FileStorage');
const URL = process.env.URL || 'http://localhost:8080/';
const STATS_FREQ = 100;


// Express and Formidable stuff to receice a file for further processing
// --------------------
const form = formidable({multiples:false});

app.post('/', fileReceiver );
function fileReceiver(req, res, next) {
    form.parse(req, (err, fields, files) => {
        fs.readFile(files.data.filepath, { encoding: 'utf8' })
        .then( data => { return processFile(fields.name, data); });
    });
    return res.end('');
}

app.get('/', viewClones );

//const server = app.listen(PORT, () => { console.log('Listening for files on port', PORT); });

const http = require('http'); // Import the http module
const server = http.createServer(app); // Create the HTTP server

const { Server } = require("socket.io"); //Require and initialize Socket.IO
const io = new Server(server);

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

server.listen(PORT, () => { // Start the HTTP server
    console.log('Listening for files on port', PORT);
});

// Page generation for viewing current progress
// --------------------
function getStatistics() {
    let cloneStore = CloneStorage.getInstance();
    let fileStore = FileStorage.getInstance();
    let output = 'Processed ' + fileStore.numberOfFiles + ' files containing ' + cloneStore.numberOfClones + ' clones.'
    return output;
}

function lastFileTimersHTML() {
    if (!lastFile) return '';
    output = '<p>Timers for last file processed:</p>\n<ul>\n'
    let timers = Timer.getTimers(lastFile);
    for (t in timers) {
        output += '<li>' + t + ': ' + (timers[t] / (1000n)) + ' µs\n'
    }
    output += '</ul>\n';
    return output;
}

function listClonesHTML() {
    let cloneStore = CloneStorage.getInstance();
    let output = '';

    cloneStore.clones.forEach( clone => {
        output += '<hr>\n';
        output += '<h2>Source File: ' + clone.sourceName + '</h2>\n';
        output += '<p>Starting at line: ' + clone.sourceStart + ' , ending at line: ' + clone.sourceEnd + '</p>\n';
        output += '<ul>';
        clone.targets.forEach( target => {
            output += '<li>Found in ' + target.name + ' starting at line ' + target.startLine + '\n';            
        });
        output += '</ul>\n'
        output += '<h3>Contents:</h3>\n<pre><code>\n';
        output += clone.originalCode;
        output += '</code></pre>\n';
    });

    return output;
}

function listProcessedFilesHTML() {
    let fs = FileStorage.getInstance();
    let output = '<HR>\n<H2>Processed Files</H2>\n'
    output += fs.filenames.reduce( (out, name) => {
        out += '<li>' + name + '\n';
        return out;
    }, '<ul>\n');
    output += '</ul>\n';
    return output;
}

function viewClones(req, res, next) {
    let page='<HTML><HEAD><TITLE>CodeStream Clone Detector</TITLE></HEAD>\n';
    page += '<BODY><H1>CodeStream Clone Detector</H1>\n';
    page += '<P>' + getStatistics() + '</P>\n';
    page += lastFileTimersHTML() + '\n';
    page += listClonesHTML() + '\n';
    page += listProcessedFilesHTML() + '\n';
    page += '</BODY></HTML>';
    res.send(page);
}

// Some helper functions
// --------------------
// PASS is used to insert functions in a Promise stream and pass on all input parameters untouched.
PASS = fn => d => {
    try {
        fn(d);
        return d;
    } catch (e) {
        throw e;
    }
};

var lastFile = null;

let fileTimings = []; // Array to store timing data for each file


function maybePrintStatistics(file, cloneDetector, cloneStore, fileTimings) {
    if (0 == cloneDetector.numberOfProcessedFiles % STATS_FREQ) {
        console.log();
        console.log('Processed', cloneDetector.numberOfProcessedFiles, 'files and found', cloneStore.numberOfClones, 'clones.');

        // Calculate and print detailed statistics
        const stats = calculateDetailedStatistics(fileTimings); // Get the statistics object

        // Print to console (for now)
        printStatisticsToConsole(stats);

        let timers = Timer.getTimers(file);
        let str = 'Timers for last file processed: ';
        for (let t in timers) {
            str += t + ': ' + (timers[t] / (1000n)) + ' µs ';
        }
        console.log(str);
        console.log('List of found clones available at', URL);

        // *** NEW:  Emit the statistics using Socket.IO ***
        if (io) { // Check if io is initialized
            io.emit('timingStats', stats); // Emit the stats
        }

    }

    return file;
}


// Processing of the file
// --------------------
function processFile(filename, contents) {
    let cd = new CloneDetector();
    let cloneStore = CloneStorage.getInstance();

    return Promise.resolve({name: filename, contents: contents} )
        //.then( PASS( (file) => console.log('Processing file:', file.name) ))
        .then( (file) => Timer.startTimer(file, 'total') )
        .then( (file) => cd.preprocess(file) )
        .then( (file) => cd.transform(file) )

        .then( (file) => Timer.startTimer(file, 'match') )
        .then( (file) => cd.matchDetect(file) )
        .then( (file) => cloneStore.storeClones(file) )
        .then( (file) => Timer.endTimer(file, 'match') )

        .then( (file) => cd.storeFile(file) )
        .then( (file) => Timer.endTimer(file, 'total') )
    // TODO Store the timers from every file (or every 10th file), create a new landing page /timers
    // and display more in depth statistics there. Examples include:
    // average times per file, average times per last 100 files, last 1000 files.
    // Perhaps throw in a graph over all files.
        .then( PASS((file) => {
            lastFile = file;
            fileTimings.push(Timer.getTimers(file)); // Store the timings
            return file; // Important: Return the file!
        }))
        .then(PASS((file) => maybePrintStatistics(file, cd, cloneStore, fileTimings))) // Pass fileTimings
        .catch(console.log);
};

function calculateDetailedStatistics(fileTimings) {
    let avgTotalTime = 0;
    let avgMatchTime = 0;
    let last100Total = 0;
    let last100Match = 0;
    let last1000Total = 0;
    let last1000Match = 0;

    if (fileTimings.length > 0) {
        fileTimings.forEach(timings => {
            avgTotalTime += Number(timings.total); // Convert to Number *before* adding
            avgMatchTime += Number(timings.match); // Convert to Number *before* adding
        });

        avgTotalTime = Number(avgTotalTime) / fileTimings.length; // Convert to Number before dividing
        avgMatchTime = Number(avgMatchTime) / fileTimings.length; // Convert to Number before dividing


        // Last 100 (Do the same conversion before adding and dividing)
        if (fileTimings.length >= 100) {
            for (let i = fileTimings.length - 100; i < fileTimings.length; i++) {
                last100Total += Number(fileTimings[i].total);
                last100Match += Number(fileTimings[i].match);
            }
            last100Total = Number(last100Total) / 100;
            last100Match = Number(last100Match) / 100;
        }

        // Last 1000 (Same conversion logic)
        if (fileTimings.length >= 1000) {
            for (let i = fileTimings.length - 1000; i < fileTimings.length; i++) {
                last1000Total += Number(fileTimings[i].total);
                last1000Match += Number(fileTimings[i].match);
            }
            last1000Total = Number(last1000Total) / 1000;
            last1000Match = Number(last1000Match) / 1000;
        }
    }
    avgTotalTime=avgTotalTime/1000000;
    avgMatchTime=avgMatchTime/1000000;
    last100Total=last100Total/1000000;
    last1000Total=last1000Total/1000000;

    return { // Return a statistics object
        avgTotalTime,
        avgMatchTime,
        last100Total,
        last100Match,
        last1000Total,
        last1000Match,
        totalFiles: fileTimings.length,
        lastFileTotal: Number(lastFile?.timers?.total || 0),
        lastFileMatch: Number(lastFile?.timers?.match || 0)
    };
}

function printStatisticsToConsole(stats) {
    console.log("Detailed Timing Statistics as of", new Date().toLocaleString(), ":");
    console.log(`Average Total Time: ${stats.avgTotalTime.toFixed(2)}s`);
    console.log(`Average Match Time: ${stats.avgMatchTime.toFixed(2)}s`);
    console.log(`Average Total Time for 100 Files: ${stats.last100Total.toFixed(2)}s`);
    console.log(`Average Total Time for 1000 Files: ${stats.last1000Total.toFixed(2)}s`);
}

/*
1. Preprocessing: Remove uninteresting code, determine source and comparison units/granularities
2. Transformation: One or more extraction and/or transformation techniques are applied to the preprocessed code to obtain an intermediate representation of the code.
3. Match Detection: Transformed units (and/or metrics for those units) are compared to find similar source units.
4. Formatting: Locations of identified clones in the transformed units are mapped to the original code base by file location and line number.
5. Post-Processing and Filtering: Visualisation of clones and manual analysis to filter out false positives
6. Aggregation: Clone pairs are aggregated to form clone classes or families, in order to reduce the amount of data and facilitate analysis.
*/
