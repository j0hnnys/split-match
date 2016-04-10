/*
A simple node.js that uses streams to transform the data and it teaches command line
application development.
References:
+ https://strongloop.com/strongblog/practical-examples-of-the-new-node-js-streams-api/
+ For prototyping and inheritence model
refer to intermediate.js on canvas and http://book.mixu.net/node/ch6.html
+ https://nodesource.com/blog/understanding-object-streams/
+ commander.js
- https://github.com/visionmedia/commander.js
- http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-lineinterfaces-
made-easy
*/

// Transform, fs, commander, underscore, inherits...
var Transform = require('stream').Transform;
var inherits = require('util').inherits;
var underscore = require('underscore');
var program = require('commander');
var fs = require('fs');
var sleep = require('sleep');

// For Node 0.8 users
if (!Transform) {
    Transform = require('readable-stream/transform');
}

// Constructor logic includes Internal state logic. PatternMatch needs to consider it because it has to parse chunks that get transformed
function PatternMatch(pattern) {
    this.pattern = pattern;
    // Switching on object mode so when stream reads sensordata it emits single pattern match.
    Transform.call( this, { objectMode: true });
}

// Extend the Transform class.
inherits(PatternMatch, Transform);

// Transform classes require that we implement a single method called _transform and optionally implement a method called _flush. Your assignment will implement both.
PatternMatch.prototype._transform = function (substr, encoding, nextStr) { // nextStr() is function to call
    var data = substr.toString();
    var lines = data.split(this.pattern);
    if (lines.length === 1) {
        this.characters = (this.characters || "") + lines[0];
    } else {
        this.characters = lines[lines.length - 1];
        lines.splice(lines.length - 1);
        var that = this;
        underscore.each(lines, function (line) {
            that.push(line);
        });
        nextStr();    
    }
}

// After stream has been read and transformed, the _flush is called. It is a great place to push values to output stream and clean up existing data
PatternMatch.prototype._flush = function (flushCompleted) {
    flushCompleted();
}

// That wraps up our little patternMatch module.
// Program module is for taking command line arguments
program
    .option('-p, --pattern <pattern>', 'Input Pattern such as . /n ,')
    .parse(process.argv);

// Create an input stream from the file system
var inputStream = fs.createReadStream("input.txt");
// Create a Pattern Matching stream that will run through the input and find matches 
// for the given pattern at the command line - "." and ",".
var patternStream = inputStream.pipe(new PatternMatch(program.pattern));

// Read matches from the stream.
var matches = [];
patternStream.on('readable', function() {
    var substr;
    while ((substr = patternStream.read()) !== null) {
        matches.push(substr);
    }
});

patternStream.on('end', function() {
    console.log('===Input:===');
    fs.readFile('input.txt', 'utf-8', function(err, data) {
        if (err) {
            // Something went wrong 
            return console.log(err);
        }
        console.log(data);
        // Output goes since 'Input:' asynchronous calls sometimes make it go after the 'Output:'
        console.log('===Output:===');
        console.log(matches);
    });
});