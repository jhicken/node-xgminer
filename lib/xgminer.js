/*!
 * (x)gminer
 * Copyright(c) 2014 Brandon Barker <https://github.com/brandon-barker>
 * GPL v2 Licensed
 */

/**
 * Module dependencies.
 */

const _ = require('lodash');
const net = require('net');
const {parseCcminerOutput, parseClaymoreOutput , guid} = require('./util');
const cgminerCommands = require('./config/cgminerCommands.json');
const ccminerCommands = require('./config/ccminerCommands.json');
const claymoreCommands = require('./config/claymoreCommands.json');
const MINER_TYPES = require('./minerTypes');
/**
 * Create an instance of xgminer.
 *
 * @param {Name} name
 * @param {Host} host
 * @param {Port} port
 * @param {Options} options
 */

function xgminer(host, port, miner) {
  const minerInfo = {
    miner: miner || MINER_TYPES.CGMINER,
    host: host || '127.0.0.1',
    port: port || 4028
  };

  let api = {};

  /**
   * The base 'send' command, this is a utility function that is used to connect to the actual miner and send a command
   * @param command
   * @param parameter
   */

  function send(command, parameter) {
    return new Promise((resolve, reject)=>{
      var socket;
      // this try catch will not catch errors in nested async functions 
      try {
        socket = net.connect({
          host: minerInfo.host,
          port: minerInfo.port
        }, ()=>{
          var data = '';
          var json;
          
          socket.on('data', function (res) {
            data += res.toString();
          });
        
          socket.on('end', function () {
            socket.removeAllListeners();
            try {
              
              json = (
                minerInfo.miner === MINER_TYPES.CCMINER && parseCcminerOutput(data) ||
                minerInfo.miner === MINER_TYPES.CGMINER && JSON.parse(data.replace('\x00', '').replace('}{','},{')) ||
                minerInfo.miner === MINER_TYPES.CLAYMOREMINER && parseClaymoreOutput(data) || {}
              );
              // Resolve the promise and pass the JSON result back
              resolve(json);
            } catch (err) {
              reject(err);
            }
          });
        
          socket.write(
            minerInfo.miner === MINER_TYPES.CCMINER && (
              command+'|' + (parameter ? parameter+'|' : '')
            ) ||
            minerInfo.miner === MINER_TYPES.CGMINER && JSON.stringify({
              command: command,
              parameter: parameter
            }) ||
            minerInfo.miner === MINER_TYPES.CLAYMOREMINER && JSON.stringify({
              id: guid(),
              jsonrpc:'2.0',
              method: command,
              param: parameter || undefined
            }) || {}
          );
        });
  
        socket.on('error', function (err) {
          socket.removeAllListeners();
  
          // Reject the promise and pass the error back
          reject(err);
        });
      } catch (ex) {
        reject(ex);
      }
    });
  }

  function addCommandsForMiner() {
    /**
     * Dynamically build up functions from the commands.json file
     */
  
    if (minerInfo.miner === MINER_TYPES.CGMINER) { api.commands = cgminerCommands; }
    if (minerInfo.miner === MINER_TYPES.CCMINER) { api.commands = ccminerCommands; }
    if (minerInfo.miner === MINER_TYPES.CLAYMOREMINER) { api.commands = claymoreCommands; }
  
    _.forEach(api.commands, function (command) {
      api[command.name] = function (args) {
        return new Promise((resolve, reject)=>{
          send(command.name, args).then(function (result) {
            resolve(result);
          }, function (err) {
            reject(err);
          });
        })
  
      }
    });
  }
  addCommandsForMiner()

  return api;
}



/**
 * Module exports.
 */

module.exports = xgminer;
