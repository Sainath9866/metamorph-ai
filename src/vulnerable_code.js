// This file demonstrates the intentionally buggy code that will be fixed by Cline
// It contains multiple issues that simulate a production memory leak

class DataProcessor {
    constructor() {
        this.cache = new Map();
        this.listeners = [];
        this.intervalId = null;
    }

    // BUG 1: Memory leak - event listeners never cleaned up
    startProcessing() {
        const handler = (data) => {
            this.cache.set(Date.now(), data);
            console.log('Processing data:', data);
        };

        // Adding listener without cleanup
        process.on('data', handler);
        this.listeners.push(handler);

        // BUG 2: Interval never cleared
        this.intervalId = setInterval(() => {
            // BUG 3: Cache grows indefinitely
            const data = { timestamp: Date.now(), value: Math.random() };
            this.cache.set(Date.now(), data);
        }, 100);
    }

    // BUG 4: No cleanup method
    // A proper implementation would have:
    // stop() {
    //   clearInterval(this.intervalId);
    //   this.listeners.forEach(listener => {
    //     process.removeListener('data', listener);
    //   });
    //   this.cache.clear();
    // }

    processData(input) {
        // BUG 5: Synchronous blocking operation
        const fs = require('fs');
        const data = fs.readFileSync('/dev/random', { encoding: 'utf8' });

        // BUG 6: Unhandled promise rejection
        Promise.reject(new Error('Simulated failure'));

        return { processed: true, input };
    }
}

// BUG 7: Creating instance without proper lifecycle management
const processor = new DataProcessor();
processor.startProcessing();

module.exports = DataProcessor;
