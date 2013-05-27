var firc = document.getElementById('firc');
var server = 'webirc.ozinger.org';
var port = '8080';
var encode = 'UTF-8';
var nickname = 'squidward' + parseInt(Math.random() * 10000);
var channel = '#studio321';
var password = '';
var security = '843';

var FIRCEventListener = function (type, data) {
    switch (type) {
    case 'debug':
        //console.log(data);
        break;
    case 'onReady':
        console.log('ready');
        firc.setInfo(server, port, encode, nickname,
                     channel, password, security);
        firc.connect();
        break;
    case 'onConnect':
        console.log('connect');
        break;
    case 'onDisconnect':
        console.log('disconnect');
    case 'onError':
        console.log('error');
        console.log('error code: ' + data[0]);
        if (data[0] == 106) { //nickname
            console.log('change nickname and reconnect');
            nickname = 'squidward' + parseInt(Math.random() * 10000);
            firc.setInfo(server, port, encode, nickname,
                         channel, password, security);
            firc.connect();
        }
        break;
    case 'onJoin':
        console.log('join');
        console.log('channel: ' + data);
        break;
    case 'onTopic':
        console.log('topic change');
        console.log('channel: ' + data[0]);
        console.log('topic: ' + data[1]);
        break;
    case 'onTopicChange':
        console.log('topic change');
        console.log('channel: ' + data[0]);
        console.log('topic: ' + data[1]);
        break;
    case 'onChannelListStart':
        console.log('channel list start');
        break;
    case 'onChannelList':
        console.log('channel: ' + data[0]);
        console.log('user number: ' + data[1]);
        console.log('topic: ' + data[2]);
        console.log('mode: ' + data[3]);
        break;
    case 'onChannelListEnd':
        console.log('channel list end');
        break;
    case 'onChannelKey':
        console.log('channel key required');
        console.log('channel: ' + data);
        break;
    case 'onChannelMode':
        console.log('channel mode');
        console.log('channel: ' + data[0]);
        console.log('mode: ' + data[1]);
        console.log('key: ' + data[2]);
        console.log('limit: ' + data[3]);
        break;
    case 'onChannelChange':
        console.log('channel change');
        console.log('channel: ' + data[0]);
        console.log('mode: ' + data[1]);
        console.log('nickname: ' + data[2]);
        break;
    case 'onBanList':
        console.log('ban list');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        console.log('from: ' + data[2]);
        console.log('time: ' + data[3]);
        break;
    case 'onBanListEnd':
        console.log('ban list end');
        break;
    case 'onUserList':
        console.log('user list');
        console.log('channel: ' + data[0]);
        console.log('users: ' + data[1]);
        break;
    case 'onUserJoin':
        console.log('user join');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        break;
    case 'onUserNick':
        console.log('user nickname');
        console.log('user: ' + data[0]);
        console.log('nickname: ' + data[1]);
        break;
    case 'onUserMode':
        console.log('user mode');
        console.log('channel: ' + data[0]);
        console.log('mode: ' + data[1]);
        console.log('nickname: ' + data[2]);
        console.log('from: ' + data[3]);
        break;
    case 'onUserPart':
        console.log('user part');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        console.log('message: ' + data[2]);
        break;
    case 'onUserQuit':
        console.log('user quit');
        console.log('nickname: ' + data[0]);
        console.log('message: ' + data[1]);
        break;
    case 'onKick':
        console.log('user kick');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        console.log('from: ' + data[2]);
        console.log('message: ' + data[3]);
        console.log('is me: ' + data[4]);
        break;
    case 'onWhoIs':
        console.log('whois');
        console.log('nickname: ' + data[0]);
        console.log('realname: ' + data[1]);
        console.log('ip: ' + data[2]);
        console.log('channel: ' + data[3]);
        console.log('idle: ' + data[4]);
        console.log('connected: ' + data[5]);
        break;
    case 'onMessage':
        console.log('message');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        console.log('message: ' + data[2]);
        break;
    case 'onMyMessage':
        console.log('my message');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        console.log('message: ' + data[2]);
        break;
    case 'onPrivMessage':
        console.log('private message');
        console.log('nickname: ' + data[0]);
        console.log('message: ' + data[1]);
        break;
    case 'onServerMessage':
        console.log('server message');
        console.log('message: ' + data);
        break;
    }
    console.log('');
}

function sendIrcCommand(message) {
    firc.sendMessage('', message);
}

function sendMessage(channel, message) {
    if (channel != '') {
        firc.sendMessage(channel, message);
    }
}

function changeNickname(nickname) {
    firc.changeNickname(nickname);
}

function joinChannel(channel, password) {
    firc.joinChannel(channel, password);
}

function partChannel(channel, message) {
    sendIrcCommand('PART ' + channel + ' :' + message);
}

function quitIrc(message) {
    sendIrcCommand('QUIT :' + message);
}

function requestChannelList() {
    firc.getChannelList();
}

function requestChannelMode(channel) {
    firc.getChannelMode(channel);
}