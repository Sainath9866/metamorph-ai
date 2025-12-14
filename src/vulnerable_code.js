class DataProcessor {
    constructor() {
        this.cache = new Map();
        this.listeners = [];
        this.intervalId = null;
        this.cacheLimit = 100; // Limit for cache
    }

    /**
     * Starts processing data and sets up the interval and event listener.
     */
    startProcessing() {
        const handler = (data) => {
            if (this.cache.size >= this.cacheLimit) {
                // Remove the oldest entry if limit is reached
                const oldestKey = Math.min(...this.cache.keys());
                this.cache.delete(oldestKey);
            }
            this.cache.set(Date.now(), data);
            console.log('Processing data:', data);
        };

        // Adding listener without cleanup
        process.on('data', handler);
        this.listeners.push(handler);

        // Set up an interval that generates data
        this.intervalId = setInterval(async () => {
            // Generate data asynchronously
            const data = { timestamp: Date.now(), value: Math.random() };
            if (this.cache.size >= this.cacheLimit) {
                const oldestKey = Math.min(...this.cache.keys());
                this.cache.delete(oldestKey);
            }
            this.cache.set(Date.now(), data);
        }, 100);
    }

    /**
     * Cleans up resources such as intervals and event listeners.
     */
    stop() {
        clearInterval(this.intervalId);
        this.listeners.forEach(listener => {
            process.removeListener('data', listener);
        });
        this.cache.clear();
    }

    /**
     * Processes input data asynchronously.
     * @param {string} input - The input data to process.
     * @returns {Promise<Object>} - The processed data result.
     */
    async processData(input) {
        const fs = require('fs/promises');
        try {
            const data = await fs.readFile('/dev/random', { encoding: 'utf8' });
            // Handle processed data if necessary
        } catch (error) {
            console.error('Error processing file:', error);
        }

        // Return processed data
        return { processed: true, input }; // Removed unnecessary Promise.resolve
    }
}

// Creating instance with proper lifecycle management
const processor = new DataProcessor();
processor.startProcessing();

// Ensure to clean up resources on exit or in case of an error
process.on('exit', () => processor.stop());
process.on('SIGINT', () => {
    processor.stop();
    process.exit();
});

module.exports = DataProcessor;