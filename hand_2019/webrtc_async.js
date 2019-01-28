const localVideo = document.getElementById('local_video');
const remoteVideo = document.getElementById('remote_video');
const textForSendSdp = document.getElementById('text_for_send_sdp');
const textToReceiveSdp = document.getElementById('text_for_receive_sdp');
let localStream = null;
let peerConnection = null;
//let sendigOffer = false;

async function startVideo() {
  localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true}).catch(err => {
    console.error('mediaDevices.getUserMedia() error:', err);
    return;
  });
  playVideo(localVideo, localStream);
}

function stopVideo() {
  cleanupVideoElement(localVideo);
  if (localStream) {
    stopStream(localStream);
    localStream = null;
  }
}

// Videoの再生を開始する
async function playVideo(element, stream) {
  if (element.srcObject === stream) {
    console.warn('same stream, so ignore');
    return;
  };

  element.srcObject = stream;
  await element.play().catch(
    err => console.error('playVideo() error:', err)
  );
}

// ビデオエレメントを初期化する
function cleanupVideoElement(element) {
  element.pause();
  element.srcObject = null;
}

// MediaStreamの各トラックを停止させる
function stopStream(stream) {
  stream.getTracks().forEach(track => track.stop());
}

// Connectボタンが押されたらWebRTCのOffer処理を開始
async function connect() {
  if (peerConnection) {
    console.warn('peer already exist.');
    return;
  }

  const iceType = 'vanilla';
  peerConnection = prepareNewConnection();
  let offer = await makeOfferAsync(peerConnection, localStream, iceType).catch(err =>{
    console.error('makeOfferAsync() error:', err);
    return;
  });
  console.log('makeOfferAsync() success');
  sendSdp(offer);
}

// P2P通信を切断する
function hangUp(){
  if (peerConnection) {
    if(peerConnection.iceConnectionState !== 'closed'){
      peerConnection.close();
    }

    peerConnection = null;
    cleanupVideoElement(remoteVideo);
    textForSendSdp.value = '';
    return;
  }
  console.log('peerConnection is closed.');
}

// WebRTCを利用する準備をする
function prepareNewConnection() {
  const pc_config = {"iceServers":[ {"urls":"stun:stun.webrtc.ecl.ntt.com:3478"} ]};
  const peer = new RTCPeerConnection(pc_config);

  // リモートのMediStreamTrackを受信した時
  peer.ontrack = evt => {
    console.log('-- peer.ontrack()');
    playVideo(remoteVideo, evt.streams[0]);
  };

  // ICEのステータスが変更になったときの処理
  peer.oniceconnectionstatechange = function() {
    console.log('ICE connection Status has changed to ' + peer.iceConnectionState);
    switch (peer.iceConnectionState) {
      case 'closed':
      case 'failed':
        if (peerConnection) {
          hangUp();
        }
        break;
      case 'dissconnected':
        break;
    }
  };

  return peer;
}

async function makeOfferAsync(peer, stream, iceType) {
  let sendigOffer = true;
  return new Promise(async (resolve, reject) =>  {
    // --- setup onnegotiationneeded ---
    // ???
    // Offer側でネゴシエーションが必要になったときの処理
    peer.onnegotiationneeded = async () => {
      console.log('==== onnegotiationneeded() ====');
      if (sendigOffer) {
        sendigOffer = false;

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

        if (iceType === 'tricle') {
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
      localStream.getTracks().forEach(track => peer.addTrack(track, stream));
    } else {
      console.warn('no local stream, but continue.');
    }

    // ICE Candidateを収集したときのイベント
    peer.onicecandidate = evt => {
      if (evt.candidate) {
        console.log(evt.candidate);
        if (iceType === 'tricle') {
          //sendIceCandidate(evt.candidate);
        }
      } else {
        console.log('empty ice event');
        if (iceType === 'vanilla') {
          // go next step with complete offer SDP
          resolve(peer.localDescription);
        }
      }
    };
  });
}

// 手動シグナリングのための処理を追加する
function sendSdp(sessionDescription) {
  console.log('---sending sdp ---');
  textForSendSdp.value = sessionDescription.sdp;
  textForSendSdp.focus();
  textForSendSdp.select();
}

// Receive remote SDPボタンが押されたらOffer側とAnswer側で処理を分岐
async function onSdpText() {
  const text = textToReceiveSdp.value;
  if (isOfferSide()) {
    console.log('Received answer text...');
    const answer = new RTCSessionDescription({
        type : 'answer',
        sdp : text,
    });
    
    await peerConnection.setRemoteDescription(answer).catch(err => {
      console.error('setRemoteDescription(answer) error', err);
      return;
    });
    console.log('setRemoteDescription(answer) success');
  }
  else {
    console.log('Received offer text...');
    const offer = new RTCSessionDescription({
        type : 'offer',
        sdp : text,
    });

    const iceType = 'vanilla';
    peerConnection = prepareNewConnection();
    await peerConnection.setRemoteDescription(offer).catch(err => {
      console.error('setRemoteDescription(offer) error', err);
      return;
    });
    console.log('setRemoteDescription(offer) success');

    let answer = await makeAnswerAsync(peerConnection, localStream, iceType).catch(err => {
      console.error('makeAnswerAsync() error:', err);
      return;
    });
    console.log('makeAnswerAsync() success');

    sendSdp(answer);
  }

  textToReceiveSdp.value ='';
}

function isOfferSide() {
  if (peerConnection) {
    return true;
  }
  else {
    false;
  }
}

function makeAnswerAsync(peer, stream, iceType) {
  return new Promise(async (resolve, reject) =>  {
    // --- setup onnegotiationneeded ---
    // ???

    // --- add stream ---
    if (stream) {
      console.log('Adding local stream...');
      localStream.getTracks().forEach(track => peer.addTrack(track, stream));
    } else {
      console.warn('no local stream, but continue.');
    }

    // ICE Candidateを収集したときのイベント
    peer.onicecandidate = evt => {
      if (evt.candidate) {
        console.log(evt.candidate);
        if (iceType === 'tricle') {
          //sendIceCandidate(evt.candidate);
        }
      } else {
        console.log('empty ice event');
        if (iceType === 'vanilla') {
          // go next step with complete answer SDP
          resolve(peer.localDescription);
        }
      }
    };


    // --- answer ----
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

    if (iceType === 'tricle') {
      // go next step with inital answer SDP
      resolve(peer.localDescription);
    }
  });
}