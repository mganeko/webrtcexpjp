'use strict';
//var io = require('socket.io-client');

//const SOCKETIO_SERVER = 'https://signaling.talkin.info/';
//const SOCKETIO_SERVER = 'http://localhost:3002/';
//importScripts(SOCKETIO_SERVER + 'socket.io/socket.io.js');

let ROOM_NAME = '_ios_bridge';
let socket = null;

// -- lamejs --
importScripts("lame.all.js");
const SAMPLE_RATE_REDUCE = 2; // make samples half size
const BLOCK_SIZE = 576;
let mp3encoder = null;

// main --> worker
self.addEventListener('message', function(ev) {
  var payload = ev.data;
  switch (payload.type) {
    case 'INIT':
      console.log('worker INIT');
      let serverUrl = payload.server;
      let room = payload.room;
      _setRoomName(room); 
      importScripts(serverUrl + 'socket.io/socket.io.js');
      _connectServer(serverUrl);

      prepareMp3Encoder(payload.sampleRate);
      break;
    case 'CH':
      //socket.emit('pub:ch', payload.data);
      break;
    case 'AUDIO':
      let arr = payload.data.buf;
      let audioSize = arr.length;
      _postbackAck({blobtype: 'AUDIO', size: audioSize});
      let mp3 = _ConmpressAudioToMp3(arr);
      payload.data.buf = mp3.buffer;
      payload.type = 'MP3_AUDIO';
      if (socket) {
        socket.emit('message', payload);
      }

      break;

    case 'IMAGE':
      if (socket) {
        socket.emit('message', payload);
      }
      //socket.emit('image', payload.data);
      let b = payload.data.blob;
      let imageSize = b.size;
      _postbackAck({blobtype: 'IMAGE', size: imageSize});
      break;

    case 'DATA_URL':
      if (socket) {
        socket.emit('message', payload);
      }
      let url = payload.data.url;
      let urlSize = url.length;
      _postbackAck({blobtype: 'DATA_URL', size: urlSize});
      break;
  }
});

function _postbackAck(msg) {
  /*-- skip now --
  self.postMessage({
    type: 'ack',
    data: msg
  });
  ---*/
}

function _setRoomName(room) {
  ROOM_NAME = room;
}

function _getRoomName() {
  return ROOM_NAME;
}

function _connectServer(serverUrl) {
  socket = io.connect(serverUrl);
  socket.on('connect', onChannelOpened)
        //.on('welcome', onWelcome)
        //.on('server notify', onServerNotify)
        .on('user disconnected', onUserDisconnect)
        .on('message', onMessage)
        .on('error', onSocketError);
  
  function onSocketError(e) {
    console.error(e);
  }

  function onChannelOpened(evt) {
    console.log('Channel opened.');
    self.postMessage({
      type: 'notify',
      message: 'connected to socketio server'
    });

    let roomname = _getRoomName();
    socket.emit('enter', roomname);
    console.log('enter room=', roomname);   
  }

  /*
  function onWelcome(evt) {
    socket.id = evt.id;
    console.log('welcome message from server: self id=' + socket.id);
    console.log(' Enter into: ' + _getRoomName() + ' members=' + evt.members);

    self.postMessage({
      type: 'notify',
      message: 'Enter into room:' + _getRoomName()
    });
    self.postMessage({
      type: 'room_ready',
      message: 'Enter into room:' + _getRoomName()
    });    
    return;
  }
  */


  function onUserDisconnect(evt) {
    if (evt) {
      console.log('--user disconnect id=' + evt.id);
    }
  }

  // from signalig server (socket.io)
  function onMessage(evt) {
    let id = evt.from;
    let target = evt.sendto;
    let type = evt.type;
    //console.log('onMessage() id=' + id + ' target=' + target + ' type=' + type);

    if (type === 'IMAGE') {
      let data = evt.data;
      let buf = evt.data.blob; // arraybuffer
      let len = buf.byteLength;
      //console.log('onMassage() IMAGE byteLength=' + len);

      self.postMessage({
        type: 'image',
        data: buf
      });
    }
    else if (type === 'AUDIO') {
      let data = evt.data;
      let buf = data.buf; // arraybuffer
      let len = buf.byteLength;
      let compressArr = new Int8Array(buf);
      let compressLen = compressArr.length;
      decompressArr = null;
      //let decompressArr = _decomressAudio(compressArr);

      //let decompressLen = decompressArr.length;
      //console.log('--- remote AUDIO buf len=' + len + ' , compress len=' + compressLen + ' , decompress len=' + decompressLen);

      console.error('NOT USED');
      self.postMessage({
        type: 'audio',
        data: decompressArr
      });
    }
    else if (type === 'MP3_AUDIO') {
      let data = evt.data;
      let buf = data.buf; //
      let len = buf.byteLength;

      self.postMessage({
        type: 'mp3_audio',
        data: buf
      });
    }
    else if (type === 'DATA_URL') {
      let data = evt.data;
      let url = evt.data.url;
      //console.log('onMassage() DATA_URL  len=' + url.length + '  url=' + url.slice(0, 50));

      self.postMessage({
        type: 'data_url',
        data: url
      });
    }
  }
}

function prepareMp3Encoder(sampleRate) {
  const channels = 1; //1 for mono or 2 for stereo
  const kbps = 36; //32; //64; //kbps to encode mp3 (24, 16 NG for 44.1k, 32 NG for 48k)
       // 44.1k --> 24 NG, 32 OK, 36 OK
       // 48k --> 32 NG, 36 OK, 48 OK
  mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate / SAMPLE_RATE_REDUCE, kbps);
  console.log('[worker] mp3encoder created. sampleRate=' + sampleRate / SAMPLE_RATE_REDUCE);
}

function _ConmpressAudioToMp3(arr) {
  if (! mp3encoder) {
    console.error('mp3encorder NOT READY');
    return null;
  }

  // --- WebAudio --> PCM16 --> MP3 --> 
  let pcm = makePCM(arr);
  let concatMp3Array = compressConcatMp3(mp3encoder, pcm);

  return concatMp3Array
}

function makePCM(inputData) { // inputData: 32bit実数の配列
  const INT_MAX = 0x7fff;

  let len = inputData.length;
  //if (len !== BUFFER_SIZE) {
  //  console.warn('inputData.len=' + len + ' <>' +  BUFFER_SIZE);
  //}

  let reducedLen = Math.floor(len / SAMPLE_RATE_REDUCE);
  let pcmArray = new Int16Array(reducedLen);
  for (let i = 0; i < reducedLen; i++) {
    let f = inputData[i * SAMPLE_RATE_REDUCE];
    f = Math.max(-1.0, f);
    f = Math.min(1.0, f);
    pcmArray[i] = f * INT_MAX;
  }

  return pcmArray;
}

function compressConcatMp3(encoder, pcmBuf) {
  let len = pcmBuf.length;
  //console.log('compress PCM len=' + len);
  if (! encoder) {
    return null;
  }

  // --- compress blocks ---
  const sampleBlockSize = BLOCK_SIZE * 2;
  let mp3Data = [];
  let compressedLength = 0;
  for (let i = 0; i < len; i += sampleBlockSize) {
    let sampleChunk = pcmBuf.subarray(i, i + sampleBlockSize);
    let mp3buf = encoder.encodeBuffer(sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
      compressedLength += mp3buf.length;
    }
  }

  let mp3buf = encoder.flush();   //finish writing mp3
  if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
      compressedLength += mp3buf.length;
  }

  //console.log('compressConcatMp3 MP3 len=' + compressedLength);

  // --- concat blocks ---
  let wholeBuffer = new Uint8Array(compressedLength);
  let pos = 0;
  for(let block of mp3Data) {
      wholeBuffer.set(block, pos);
      pos += block.length;
  }
  
  return wholeBuffer;
}

function compressF32(encoder, inputData) {
  let len = inputData.length;
  //console.log('compressF32 input len=' + len);

  // --- compress blocks ---
  const sampleBlockSize = BLOCK_SIZE * 2 * SAMPLE_RATE_REDUCE;
  let mp3Data = [];
  let compressedLength = 0;
  for (let i = 0; i < len; i += sampleBlockSize) {
    let sampleChunk = inputData.subarray(i, i + sampleBlockSize);
    let mp3buf = encoder.encodeBufferF32(SAMPLE_RATE_REDUCE, sampleChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(mp3buf);
      compressedLength += mp3buf.length;
    }
  }

  let mp3buf = encoder.flush();   //finish writing mp3
  if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
      compressedLength += mp3buf.length;
  }

  //console.log('compressF32 MP3 len=' + compressedLength);

  // --- concat blocks ---
  let wholeBuffer = new Uint8Array(compressedLength);
  let pos = 0;
  for(let block of mp3Data) {
      wholeBuffer.set(block, pos);
      pos += block.length;
  }
  
  return wholeBuffer;    
}

// ----- init ---
//_connectServer(SOCKETIO_SERVER);


