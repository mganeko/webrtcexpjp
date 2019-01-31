'use strict';

// 画面のキャプチャー映像を取得する
export async function getScreenStream() {
  const localScreenStream = await navigator.mediaDevices.getDisplayMedia({video: true}).catch(err => {
    console.error('mediaDevices.getDisplayMedia() error:', err);
    return null;
  });
  return localScreenStream;
}

// ローカルのカメラ映像、マイク音声を停止する
export function stopLocalStream(localStream) {
  if (localStream) {
    stopStream(localStream);
    //localStream = null;
  }  
}


// ------- inner variable, function ------
//let localStream = null;

// MediaStreamの各トラックを停止させる
function stopStream(stream) {
  stream.getTracks().forEach(track => track.stop());
}