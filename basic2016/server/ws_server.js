"use strict";

// Please install ws module
//   npm install ws
//
// Run
//   node ws_server.js

let WebSocketServer = require('ws').Server;
let port = 3001;
let wsServer = new WebSocketServer({ port: port });
console.log('websocket server start. port=' + port);

wsServer.on('connection', function(ws) {
  console.log('-- websocket connected--');
  ws.on('message', function incoming(message) {
    //console.log('received message from ws:', getId(ws));
    console.log('==== receive message ====');

    wsServer.clients.forEach(function each(client) {
      if (ws === client) {
        //console.log('-- skip sender:', getId(ws));
        console.log('- skip sender -');
      }
      else {
        //console.log('- send message to other:', getId(client));
        console.log('- send message to other -');
        client.send(message);
      }
    });
  });
});

function getId(ws) {
  // un Documented id
  return ws._ultron.id;
}
