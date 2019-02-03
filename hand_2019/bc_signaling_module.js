'use strict';

// BroadcastChannelへ接続する
export function connectSignaling(channel) {
  let channelName = '_webrtc_test_channel';
  if (channel) {
    channelName = channel;
  }
  broadcast = new BroadcastChannel(channelName);
  console.log('connect BroadcastChannel name=' + channelName);

  broadcast.onmessage = (evt) => {
    //console.log('ws onmessage() data.type:', evt.data.type);
    const message = JSON.parse(evt.data);
    console.log('ws onmessage() message.type:', message.type);
    switch(message.type){
      case 'offer': {
        console.log('Received offer ...');
        receiveSdpFunc(message, message.type);
        break;
      }
      case 'answer': {
        console.log('Received answer ...');
        receiveSdpFunc(message, message.type);
        break;
      }
      case 'candidate': {
        console.log('Received ICE candidate ...');
        const candidate = new RTCIceCandidate(message.ice);
        console.log(candidate);
        receiveIceCandidate(candidate);
        break;
      }
      case 'close': {
        console.log('peer is closed ...');
        closedFunc();
        break;
      }      
      default: { 
        console.log("Invalid message"); 
        break;              
      }         
    }
  };
}

export function sendSdp(sessionDescription) {
  const message = JSON.stringify(sessionDescription);
  console.log('---sending SDP type=' + sessionDescription.type);
  //ws.send(message);
  broadcast.postMessage(message);
}

export function sendIceCandidate(candidate) {
  console.log('---sending ICE candidate ---');
  const message = JSON.stringify({ type: 'candidate', ice: candidate });
  console.log('sending candidate=' + message);
  //ws.send(message);
  broadcast.postMessage(message);
}

export function sendClose() {
  const message = JSON.stringify({ type: 'close' });
  console.log('---sending close message---');
  //ws.send(message);
  broadcast.postMessage(message);
}

export function setRceiveSdpHandeler(handler) {
  receiveSdpFunc = handler;
}
let receiveSdpFunc = null;

export function setReceiveIceCandidateHandeler(handler) {
  receiveIceCandidate = handler;
}
let receiveIceCandidate = null;

export function setCloseHander(handler) {
  closedFunc = handler;
}
let closedFunc = null;

// ---- inner variable, function ----
let broadcast = null;


