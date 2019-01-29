'use strict';

export const ICETYPE_VANILLA = 'vanilla';
export const ICETYPE_TRICKLE = 'trickle';
export const SDPTYPE_OFFER = 'offer';
export const SDPTYPE_ANSWER = 'answer';

// Offerを開始する
// promiseを返す
export async function startOfferAsync(stream) {
  if (peerConnection) {
    console.warn('peer already exist.');
    return;
  }

  const iceType = getIceType();
  peerConnection = prepareNewConnection();
  let offer = await makeOfferAsync(peerConnection, stream, iceType).catch(err =>{
    console.error('makeOfferAsync() error:', err);
    return;
  });
  return offer;
}

// P2P通信を切断する
export function closeConnection() {
  if (peerConnection) {
    if(peerConnection.iceConnectionState !== 'closed'){
      peerConnection.close();
    }

    peerConnection = null;
    return;
  }
  console.log('peerConnection is closed.');
}

// ICEの方式をセットする
let _selectedIceType = ICETYPE_VANILLA;
export function setIceType(ice) {
  _selectedIceType = ice;
}

function getIceType() {
  return _selectedIceType;
}

// ICE candidateを送るための関数をセットする
let sendIceCandidateFunc = null;
export function setSendIceCandidateHandler(handler) {
  sendIceCandidateFunc = handler;
}

// 相手の映像を受け取った時の処理をセットする
let remoteVideoFunc = null;
export function setRemoteVideoHandler(handler) {
  remoteVideoFunc = handler;
}

// 相手の映像が終了した時の処理をセットする
let cleanUpFunc = null;
export function setCleanUpHandler(handler) {
  cleanUpFunc = handler;
}

// Offer側かを確認する
export function isOfferSide() {
  if (peerConnection) {
    return true;
  }
  else {
    false;
  }
}

// 受け取ったAnswerをセットする
export async function setAnswer(answer) {
  await peerConnection.setRemoteDescription(answer).catch(err => {
    console.error('setRemoteDescription(answer) error', err);
    return;
  });
  console.log('setRemoteDescription(answer) success');
}

// Offerを受け取り、応答する
// promiseを返す
export async function acceptOfferAsync(offer, stream) {
  const iceType = getIceType();
  peerConnection = prepareNewConnection();
  await peerConnection.setRemoteDescription(offer).catch(err => {
    console.error('setRemoteDescription(offer) error', err);
    return;
  });
  console.log('setRemoteDescription(offer) success');

  let answer = await makeAnswerAsync(peerConnection, stream, iceType).catch(err => {
    console.error('makeAnswerAsync() error:', err);
    return;
  });
  return answer;
}

// ICE candaidate受信時にセットする
export function addIceCandidate(candidate) {
  if (peerConnection) {
    peerConnection.addIceCandidate(candidate);
  }
  else {
    console.error('PeerConnection not exist!');
    return;
  }
}

// ------- inner variable, function ------
let peerConnection = null;

// WebRTCを利用する準備をする
function prepareNewConnection() {
  const pc_config = {"iceServers":[ {"urls":"stun:stun.webrtc.ecl.ntt.com:3478"} ]};
  const peer = new RTCPeerConnection(pc_config);

  // リモートのMediStreamTrackを受信した時
  peer.ontrack = evt => {
    console.log('-- peer.ontrack()');
    remoteVideoFunc(evt.streams[0]);
  };

  // ICEのステータスが変更になったときの処理
  peer.oniceconnectionstatechange = function() {
    console.log('ICE connection Status has changed to ' + peer.iceConnectionState);
    switch (peer.iceConnectionState) {
      case 'closed':
      case 'failed':
        if (peerConnection) {
          closeConnection();
          cleanUpFunc();
        }
        break;
      case 'dissconnected':
        break;
    }
  };

  return peer;
}

// returning Promise
function makeOfferAsync(peer, stream, iceType) {
  const sdpType = SDPTYPE_OFFER;
  return makeSdpAsync(peer, stream, iceType, sdpType);
}

// returning Promise
function makeAnswerAsync(peer, stream, iceType) {
  const sdpType = SDPTYPE_ANSWER;
  return makeSdpAsync(peer, stream, iceType, sdpType);
}

// returning Promise
async function makeSdpAsync(peer, stream, iceType, sdpType) {
  let sendingOffer = false;
  if (sdpType === SDPTYPE_OFFER) {
    sendingOffer = true;
  }

  return new Promise(async (resolve, reject) =>  {
    // --- setup onnegotiationneeded ---

    // Offer側でネゴシエーションが必要になったときの処理
    peer.onnegotiationneeded = async () => {
      console.log('==== onnegotiationneeded() ====');
      if (sendingOffer) {
        sendingOffer = false;

        let offer = await peer.createOffer().catch(err =>{
          console.error('createOffer error:', err);
          reject(err);
          return;
        });
        console.log('createOffer() succsess');

        await peer.setLocalDescription(offer).catch(err =>{
          console.error('setLocalDescription(offer) error:', err);
          reject(err);
          return;
        });
        console.log('setLocalDescription(offer) succsess');

        if (iceType === ICETYPE_TRICKLE) {
          // go to next step with initial offer SDP
          resolve(peer.localDescription);
        }
      }
      else {
        console.warn('--skip onnegotiationneeded()--');
      }
    }

    // --- add stream ---
    if (stream) {
      console.log('Adding local stream...');
      stream.getTracks().forEach(track => peer.addTrack(track, stream));
    } else {
      console.warn('no local stream, but continue.');
    }

    // ICE Candidateを収集したときのイベント
    peer.onicecandidate = evt => {
      if (evt.candidate) {
        console.log(evt.candidate);
        if (iceType === ICETYPE_TRICKLE) {
          sendIceCandidateFunc(evt.candidate);
        }
      } else {
        console.log('empty ice event');
        if (iceType === ICETYPE_VANILLA) {
          // go next step with complete offer SDP
          resolve(peer.localDescription);
        }
      }
    };

    // --- answer ----
    if (sdpType === SDPTYPE_ANSWER) {
      let answer = await peer.createAnswer().catch(err =>{
        console.error('createAnswer() error:', err);
        reject(err);
        return;
      });
      console.log('createAnswer() succsess');

      await peer.setLocalDescription(answer).catch(err =>{
        console.error('setLocalDescription(answer) error:', err);
        reject(err);
        return;
      });
      console.log('setLocalDescription(answer) succsess')

      if (iceType === ICETYPE_TRICKLE) {
        // go next step with inital answer SDP
        resolve(peer.localDescription);
      }
    }
  }); 
}



