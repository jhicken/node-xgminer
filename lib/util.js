/*!
 * (x)gminer
 * Copyright(c) 2014 Brandon Barker <https://github.com/brandon-barker>
 * GPL v2 Licensed
 */

/**
 * Creates a generic error object which can be passed back to your app
 */

const strftime = require('strftime');

exports.createError = function (name, message, data) {
  return {
    success: false,
    name: name,
    error: message,
    data: data
  };
}

exports.parseClaymoreOutput = function(data) {
  data = JSON.parse(data).result;
  const [ethHashrate, ethAcceptedShares, ethRejectedShares] = data[2].split(';');
  const [otherHashrate, otherAcceptedShares, otherRejectedShares] = data[4].split(';');
  const [ethInvalidShares, ethPoolSwitches, otherInvalidShares, otherPoolSwitches] = data[8].split(';');

  let tempsAndFans = data[6].split(';');
  let temps = [];
  let fansSpeeds = [];

  while(tempsAndFans.length > 0) {
    temps.push(parseFloat(tempsAndFans.shift()));
    fansSpeeds.push(parseFloat(tempsAndFans.shift()));
  }
  
  return {
    version: data[0],
    uptime: parseFloat(data[1])*60, // this is in sec
    ethHashrate: parseFloat(ethHashrate)*1000,
    ethAcceptedShares: parseFloat(ethAcceptedShares),
    ethRejectedShares: parseFloat(ethRejectedShares),
    ethInvalidShares: parseFloat(ethInvalidShares),
    ethPoolSwitches: parseFloat(ethPoolSwitches),
    ethGpuHashrates: data[3].split(';').map((value)=> parseFloat(value)*1000),
    otherHashrate: parseFloat(otherHashrate*1000),
    otherAcceptedShares: parseFloat(otherAcceptedShares),
    otherRejectedShares: parseFloat(otherRejectedShares),
    otherInvalidShares: parseFloat(otherInvalidShares),
    otherPoolSwitches: parseFloat(otherPoolSwitches),
    otherGpuHashrates: data[5].split(';').map((value)=> parseFloat(value)*1000),
    pools: data[7].split(';'),
    temps,
    fansSpeeds
  };
}

exports.parseCcminerOutput = function(data) {
  return data.replace('\x00', '')
    .split('|')
    .filter((item)=>item)
    .map((arrayItem)=>{
      return arrayItem && arrayItem.split(';').reduce((accumulator, apiItem)=>{
        const [key, value] = apiItem.split('=');
        accumulator[getCcminerKeyTranslation(key)] = getCcminerValueTranslation(key,value);
        return accumulator;
      },{})
    },[]) 
}

function getCcminerKeyTranslation(key) {
  let translated;
  switch (key) {
    case 'NAME': translated = 'Software'; break;
    case 'VER': translated = 'Version'; break;
    case 'ALGO': translated = 'Algorithm'; break;
    case 'GPUS': translated = 'GPUs'; break;
    case 'CPUS': translated = 'Threads'; break;
    case 'KHS': translated = 'Hash rate'; break;
    case 'ACC': translated = 'Accepted shares'; break;
    case 'ACCMN': translated = 'Accepted / mn'; break;
    case 'REJ': translated = 'Rejected'; break;
    case 'SOLV': translated = 'Solved'; break;
    case 'BEST': translated = 'Best share'; break;
    case 'STALE': translated = 'Stale shares'; break;
    case 'LAST': translated = 'Last share'; break;
    case 'DIFF': translated = 'Difficulty'; break;
    case 'NETKHS': translated = 'Net Rate'; break;
    case 'UPTIME': translated = 'Miner up time'; break;
    case 'TS': translated = 'Last update'; break;
    case 'THR': translated = 'Throughput'; break;
    case 'WAIT': translated = 'Wait time'; break;
    case 'H': translated = 'Bloc height'; break;
    case 'I': translated = 'Intensity'; break;
    case 'HWF': translated = 'Failures'; break;
    case 'POOL': translated = 'Pool'; break;
    case 'POOLS': translated = 'Pools'; break;
    case 'TEMP': translated = 'T°c'; break;
    case 'FAN': translated = 'Fan %'; break;
    case 'CPUFREQ': translated = 'CPU Freq.'; break;
    case 'FREQ': translated = 'Base Freq.'; break;
    case 'MEMFREQ': translated = 'Mem. Freq.'; break;
    case 'GPUF': translated = 'Curr Freq.'; break;
    case 'MEMF': translated = 'Mem. Freq.'; break;
    case 'KHW': translated = 'Efficiency'; break;
    case 'POWER': translated = 'Power'; break;
    case 'PLIM': translated = 'P.Limit'; break;
    case 'PST': translated = 'P-State'; break;
    // pool infos
    case 'POOL': translated = 'Pool'; break;
    case 'PING': translated = 'Ping (ms)'; break;
    case 'DISCO': translated = 'Disconnects'; break;
    case 'USER': translated = 'User'; break;
    default: translated = key; break;
  }
  return translated;
}

function getCcminerValueTranslation(key, value){
  switch (key) {
    case 'UPTIME':
      value = parseInt(value);
      break;
		case 'WAIT':
			let min = Math.floor(parseInt(value) / 60);
			const sec = parseInt(value) % 60;
			const val = `${min}mn${sec}s`;
			if (min > 180) {
				let hrs = Math.floor(min / 60);
				min = min % 60;
				value = `${hrs}h${min}mn`;
			}
			break;
		case 'CPUFREQ':
		case 'FREQ':
		case 'MEMFREQ':
		case 'GPUF':
		case 'MEMF':
			value = `${value} MHz`;
			break;
		case 'POWER':
			value = `${Math.round(parseFloat(value)/1000)} W`;
			break;
		case 'TS':
			value = strftime("%H:%M:%S", new Date(Date(value)));
			break;
		case 'KHS':
		case 'NETKHS':
			value = value + ' kH/s';
			break;
		case 'KHW':
			value = value + ' kH/W';
			break;
		default:
			break;
  }
  return value
}

exports.guid = function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}