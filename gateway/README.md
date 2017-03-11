
## WebRTC Meetup 14 Sample

### ブラウザでiOS Gateway 作ってみた / Build iOS Gateway on Browser

* getUserMedia() --> iOS sample 

#### 使い方
* このディレクトリ内のファイルと img/ ディレクトリをlocalhost のウエブサーバーに配置
* [lamejs](https://github.com/zhuker/lamejs) から [lame.all.js](https://github.com/zhuker/lamejs/blob/master/lame.all.js) を取得、同じディレクトリに保存

* server/ ディレクトリ内で npm install socket.io を実行し、socket.ioモジュールをインストール
* server/ ディレクトリ内で node signaling_room.js でsocket.io サーバーを起動

* PCブラウザでlocalhostの mp3pub.html を開く (Chromeで確認)
* iOSのSafariで、http://PCのIPアドレス/mp3ios.html を開く

#### How to use
* copy html/js files and img/ directory to your local Web server.
* download [lame.all.js](https://github.com/zhuker/lamejs/blob/master/lame.all.js) from [lamejs](https://github.com/zhuker/lamejs) , and save to your local Web server

* `npm install socket.io` in server/ directory to intall socket.io modules
* `node signaling_room.js` in server/ directory to start socket server

* open http://localhost/mp3pub.html with PC Chrome
* open http://ip-address-of-pc/mp3ios.html with iOS Safari

### ライセンス/Lisence

* MIT ライセンス / MIT Lisence
