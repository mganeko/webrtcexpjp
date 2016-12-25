'use strict';
//var io = require('socket.io-client');

const SOCKETIO_SERVER = 'https://signaling.talkin.info/';
importScripts(SOCKETIO_SERVER + 'socket.io/socket.io.js');

/*
var workerModule = function(self) {
  var socket = null;

  self.addEventListener('message', function(ev) {
    var payload = ev.data;
    switch (payload.type) {
    case 'INIT':
      socket = io(payload.data.SOCKET_SERVER);
      break;
    case 'CH':
      socket.emit('pub:ch', payload.data);
      break;
    case 'AUDIO':
      socket.emit('audio', payload.data);
      break;

    case 'IMAGE':
      socket.emit('image', payload.data);
      break;
    }
  });
};
*/

let socket = null;

self.addEventListener('message', function(ev) {
  var payload = ev.data;
  switch (payload.type) {
    case 'INIT':
      //socket = io(payload.data.SOCKET_SERVER);
      break;
    case 'CH':
      //socket.emit('pub:ch', payload.data);
      break;
    case 'AUDIO':
      //socket.emit('audio', payload.data);
      break;

    case 'IMAGE':
      if (socket) {
        socket.emit('message', payload);
      }
      //socket.emit('image', payload.data);
      let b = payload.data.blob;
      let s2 = b.size;
      _postbackAck({size: s2});
      break;
  }
});

function _postbackAck(msg) {
  self.postMessage({
    type: 'ack',
    data: msg
  });
}

function _getRoomName() {
  return '_simplepub_room';
}

function _connectServer() {
  socket = io.connect(SOCKETIO_SERVER);
  socket.on('connect', onChannelOpened)
        .on('welcome', onWelcome)
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

  function onWelcome(evt) {
    socket.id = evt.id;
    console.log('welcome message from server: self id=' + socket.id);
    console.log(' Enter into: ' + _getRoomName() + ' members=' + evt.members);

    self.postMessage({
      type: 'notify',
      message: 'Enter into room:' + _getRoomName()
    });
    return;
  }


  function onUserDisconnect(evt) {
    if (evt) {
      console.log('--user disconnect id=' + evt.id);
    }
  }

  function onMessage(evt) {
    let id = evt.from;
    let target = evt.sendto;
    let type = evt.type;
    console.log('onMessage() id=' + id + ' target=' + target + ' type=' + type);

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
      
    }
  }
}


    

// ----- init ---
_connectServer();


