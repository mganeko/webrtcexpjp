# WebRTC 実験室

WebRTC 関連の実験(HTML, JavaScript)を公開します。

GitHub pages はこちら https://mganeko.github.io/webrtcexpjp/

## WebRTC Meetup 10 のサンプル
Chrome 50 で動作確認
* 音声も含んだ多段中継の実験 [self/relay.html](/self/relay.html)
* 映像のディレイの実験 [self/relay_delay.html](/self/relay_delay.html)
* SDPのbandwidth制限を用いた、MediaRecorderのビットレート調整の実験 [self/record_bandwidth.html](/self/record_bandwidth.html)
* SDPのコーデック指定を用いて、MediaRecorderのVP9録画実験 [self/record_relay_vp9](/self/record_relay_vp9.html)
* オプション指定でのMediaRecordeのVP9録画サンプル [self/record_vp9.html](/self/record_vp9.html)

##  Promise版 手動シグナリング
Firefox 46, Chrome 51 で確認
* Promiseを使った、Vanilla ICEの手動シグナリング [hand/vanilla_promise.html](hand/vanilla_promise.html)

## Canvas.captureStream() を使った擬似Simulcast(手動シグナリング)
Firefox Nightly 49同士, Chrome 51同士で確認 (Firefox - Chrome間では動作しない）
* Canvas.captureStream()の擬似Simulcast 送信側 [hand/canvas_pseudo_simulcast.html](hand/canvas_pseudo_simulcast.html)
 * audio x 1, video x 3 (camera x 1, canvas x 2) を最初からマルチストリーム通信
* 擬似Simulcast 受信側 [hand/receive_pseudo_simulcast.html](hand/receive_pseudo_simulcast.html)
* replaceTrack()を使って、videoTrackを切り替えるデモ(送信側)(FireFox 49) [hand/switch_pseudo_simulcast.html](hand/switch_pseudo_simulcast.html)
 * 受信は [hand/receive_pseudo_simulcast.html](hand/receive_pseudo_simulcast.html) を流用
