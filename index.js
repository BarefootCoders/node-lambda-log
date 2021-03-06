/**
 * @module lambda-log
 * @version 1.2.0
 * @description Basic logging mechanism for Lambda Functions
 * @requires Node 6.10+
 * @author Kyle Ross
 */
"use strict";
const EventEmitter = require('events');

/**
 * @class LambdaLog
 * @extends {EventEmitter}
 */
class LambdaLog extends EventEmitter {
    /**
     * Creates new instance of LambdaLog
     * @constructor
     * @param  {Object} meta Global meta object to include with every log
     * @param  {Array}  tags Global tags to include with every log
     * @return {this}        Instance of LambdaLog
     */
    constructor(meta={}, tags=[]) {
        super();
        /**
         * Access to the uninstantiated LambdaLog class
         * @type {LambdaLog}
         */
        this.LambdaLog = LambdaLog;
        /**
         * Global configuration for the class
         * @type {Object}
         */
        this.config = {
            // Global meta object to include with every log
            meta,
            // Global tags array to include with every log
            tags,
            // Enable debugging mode (log.debug messages)
            debug: false,
            // Enable development mode which pretty-prints the log object to the console
            dev: false,
            // Disables logging to the console (used for testing)
            silent: false
        };

        ['info', 'warn', 'error', 'debug'].forEach((lvl) => {
            /**
             * Shorthand log methods for `info`, `debug`, `warn` and `error`
             * @param  {Any}    message  Message to log. Can be any type, but string or `Error` reccommended.
             * @param  {Object} meta Optional meta data to attach to the log.
             * @return {Object}      The compiled log object that was logged to the console.
             *
             * @example
             * const log = require('lambda-log');
             *
             * log.info('Test info log');
             * log.debug('Test debug log');
             * log.warn('Test warn log');
             * log.error('Test error log');
             */
            this[lvl] = (message, meta={}) => {
                return this.log(lvl, message, meta);
            };
        });
    }

    /**
     * Creates log message based on the provided parameters
     * @param  {String} level Log level (`info`, `debug`, `warn` or `error`)
     * @param  {Any}    message   Message to log. Can be any type, but string or `Error` reccommended.
     * @param  {Object} meta  Optional meta data to attach to the log.
     * @return {Object}       The compiled log object that was logged to the console.
     */
    log(level, message, meta={}) {
        if(['info', 'warn', 'error', 'debug'].indexOf(level) === -1) {
            throw new Error(`"${level}" is not a valid log level`);
        }

        if(level === 'debug' && !this.config.debug) return false;

        let tags = ['log', level].concat(this.config.tags),
            errorMeta = {};

        // If `message` is an Error-like object, use the message and add the `stack` to `meta`
        if(LambdaLog.isError(message)) {
            errorMeta.stack = message.stack;
            message = message.message;
        }

        let metadata = Object.assign({}, meta || {}, this.config.meta, errorMeta),
            data = Object.assign({ message }, metadata, { _tags: tags });

        if(!this.config.silent) {
            let method = level === 'debug'? 'log' : level;
            console[method](JSON.stringify(data, null, this.config.dev? 4 : 0));
        }

        /**
         * Emits log event after logging to console with the log data
         * @event log
         * @attribute data
         */
        this.emit('log', { level, log: data, meta: metadata });
        return data;
    }

    /**
     * Checks if value is an Error or Error-like object
     * @static
     * @param  {Any}     val Value to test
     * @return {Boolean}     Whether the value is an Error or Error-like object
     */
    static isError(val) {
        return !!val && typeof val === 'object' && (
            val instanceof Error || (
                val.hasOwnProperty('message') && val.hasOwnProperty('stack')
            )
        );
    }
}

/**
 * Exports new instance of LambdaLog
 * @type {LambdaLog}
 */
module.exports = new LambdaLog();
