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
const {parseCcminerOutput} = require('./util');
const cgminerCommands = require('./config/cgminerCommands.json');
const ccminerCommands = require('./config/ccminerCommands.json');

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
    miner: miner || 'cgminer',
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
                minerInfo.miner === 'ccminer' ?
                parseCcminerOutput(data) :
                JSON.parse(data.replace('\x00', '').replace('}{','},{'))
              );
              // Resolve the promise and pass the JSON result back
              resolve(json);
            } catch (err) {
              reject(err);
            }
          });
        
          socket.write(minerInfo.miner === 'ccminer' ? (
            command+'|' + (parameter ? parameter+'|' : '')
          ) : JSON.stringify({
            command: command,
            parameter: parameter
          }));
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
  
    if (minerInfo.miner === 'cgminer') { api.commands = cgminerCommands; }
    if (minerInfo.miner === 'ccminer') { api.commands = ccminerCommands; }
  
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
