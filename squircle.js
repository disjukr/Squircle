var firc;
var server = 'webirc.ozinger.org';
var port = '8080';
var encode = 'UTF-8';
var nickname = defaultNickname();
var channel = '#abcdef';
var password = '';
var security = '843';

var currentChannel = '#';
var leftSideElement = document.getElementById('left-side');
var rightSideElement = document.getElementById('right-side');
var centerElement = document.getElementById('center');
var tabsElement = document.getElementById('tabs');
var serverTabElement = document.getElementById('server-tab');
var tabButtonsElement = document.getElementById('tab-buttons');
var tabElements = {'#': serverTabElement};

var FIRCEventListener = function (type, data) {
    switch (type) {
    case 'debug':
        if (data.substr(0, 8) == 'RECV : :') {
            var splittedData = data.substr(8).split(' ');
            var first = splittedData.shift();
            var second = splittedData.shift();
            var third = splittedData.shift();
            var fourth = splittedData.join(' ').substr(1);
            if (second == 'NOTICE' && third != 'Auth') {
                var from = first.split('!')[0];
                console.log('notice');
                console.log('from: ' + from);
                console.log('message: ' + fourth);
                appendElementToChannel(currentChannel,
                    createNoticeElement(from + ': ' + fourth));
            }
        }
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
    case 'onError':
        console.log('error');
        console.log('error code: ' + data[0]);
        if (data[0] == 106) { //nickname
            console.log('change nickname and reconnect');
            nickname = defaultNickname();
            firc.setInfo(server, port, encode, nickname,
                         channel, password, security);
            firc.connect();
        }
        break;
    case 'onJoin':
        console.log('join');
        console.log('channel: ' + data);
        tabElements[data] = createTabElement();
        tabsElement.appendChild(tabElements[data]);
        tabButtonsElement.appendChild(createTabButtonElement(data));
        activeChannel(data);
        appendElementToChannel(data,
            createNoticeElement(nickname + ' has joined'));
        break;
    case 'onTopic':
        console.log('topic');
        console.log('channel: ' + data[0]);
        console.log('topic: ' + data[1]);
        break;
    case 'onTopicChange':
        console.log('topic change');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        console.log('topic: ' + data[2]);
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
        if (data[1].charAt(1) == 'h') {
            requestUserList(data[0]); //Deal with firc bug
        }
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
        for (var i = 0; i < data[1].length; ++i) {
            var user = data[1][i];
            switch (user.charAt(0)) {
            case '~':
                console.log('owner: ' + user.substr(1));
                break;
            case '@':
                console.log('operator: ' + user.substr(1));
                break;
            case '%':
                console.log('half operator: ' + user.substr(1));
                break;
            case '+':
                console.log('voice user: ' + user.substr(1));
                break;
            default:
                console.log('user: ' + user);
                break;
            }
        }
        break;
    case 'onUserJoin':
        console.log('user join');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        appendElementToChannel(data[0],
            createNoticeElement(data[1] + ' has joined'));
        break;
    case 'onUserNick':
        console.log('user nickname');
        console.log('user: ' + data[0]);
        console.log('nickname: ' + data[1]);
        break;
    case 'onUserMode':
        console.log('user mode');
        console.log('channel: ' + data[0]);
        console.log('raw mode: ' + data[1]);
        switch (data[1].charAt(1)) {
        case 'q':
            console.log('mode: ' + 'Owner');
            break;
        case 'o':
            console.log('mode: ' + 'Operator');
            break;
        case 'v':
            console.log('mode: ' + 'Voice');
            break;
        }
        console.log('nickname: ' + data[2]);
        console.log('from: ' + data[3]);
        break;
    case 'onUserPart':
        console.log('user part');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        console.log('message: ' + data[2]);
        appendElementToChannel(data[0],
            createNoticeElement(data[1] + ' has quit: ' + data[2]));
        break;
    case 'onUserQuit':
        console.log('user quit');
        console.log('nickname: ' + data[0]);
        console.log('message: ' + data[1]);
        //TODO: append to all channel which had the user
        appendElementToChannel(currentChannel,
            createNoticeElement(data[0] + ' has quit: ' + data[1]));
        break;
    case 'onKick':
        console.log('user kick');
        console.log('channel: ' + data[0]);
        console.log('nickname: ' + data[1]);
        console.log('from: ' + data[2]);
        console.log('message: ' + data[3]);
        console.log('is me: ' + data[4]);
        if (data[4]) {
            appendElementToChannel(data[0],
                createNoticeElement('You have been kicked by' +
                    data[2] + ' because ' + data[3]));
        }
        else {
            appendElementToChannel(data[0],
                createNoticeElement(data[1] + ' have been kicked by' +
                    data[2] + ' because ' + data[3]));
        }
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
        appendElementToChannel(data[0], createChatElement(data[1], data[2]));
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
        appendElementToServer(createChatElement('', data));
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

function changeNickname(newNickname) {
    nickname = newNickname;
    firc.changeNickname(newNickname);
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

function requestUserList(channel) {
    sendIrcCommand('NAMES ' + channel);
}

function requestChannelList() {
    firc.getChannelList();
}

function requestChannelMode(channel) {
    firc.getChannelMode(channel);
}

function defaultNickname() {
    return 'squidward' + parseInt(Math.random() * 10000);
}

function formatTime(time) {
    time = time || new Date();
    function zeroPatch(decimal) {
        return (decimal < 10)? '0' + decimal : decimal;
    }
    var hours = zeroPatch(time.getHours());
    var minutes = zeroPatch(time.getMinutes());
    var seconds = zeroPatch(time.getSeconds());
    return hours + ':' + minutes + ':' + seconds;
}

function activeChannel(channel) {
    tabElements[currentChannel].className = 'tab off';
    tabElements[channel].className = 'tab on';
    tabsElement.scrollTop = tabsElement.scrollHeight;
    currentChannel = channel;
}

function appendElementToServer(element) {
    var needScroll = tabsElement.offsetHeight +
        tabsElement.scrollTop >= tabsElement.scrollHeight;
    serverTabElement.appendChild(element);
    if (needScroll)
        tabsElement.scrollTop = tabsElement.scrollHeight;
}

function appendElementToChannel(channel, element) {
    var needScroll = tabsElement.offsetHeight +
        tabsElement.scrollTop >= tabsElement.scrollHeight;
    tabElements[channel].appendChild(element);
    if (needScroll)
        tabsElement.scrollTop = tabsElement.scrollHeight;
}

function createTabButtonElement(channel) {
    var tabButtonElement = document.createElement('button');
    tabButtonElement.textContent = channel;
    tabButtonElement.onclick = function () {
        activeChannel(this);
    }.bind(channel);
    return tabButtonElement;
}

function createTabElement() {
    var tabElement = document.createElement('div');
    return tabElement;
}

function createNoticeElement(message, time) {
    var messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.className = 'notice-message';

    time = time || new Date();
    var timeElement = document.createElement('time');
    timeElement.className = 'notice-time';
    timeElement.dateTime = time;
    timeElement.textContent = formatTime(time);

    var noticeElement = document.createElement('div');
    noticeElement.className = 'notice';
    noticeElement.appendChild(messageElement);
    noticeElement.appendChild(timeElement);

    var wrapElement = document.createElement('div');
    wrapElement.appendChild(noticeElement);
    wrapElement.style.clear = 'both';

    return wrapElement;
}

function createChatElement(nickname, message, time) {
    var profileElement = createProfileElement(nickname);
    profileElement.className = 'chat-img';

    var nicknameElement = document.createElement('div');
    nicknameElement.className = 'chat-nickname';
    nicknameElement.textContent = nickname == ''? '*' : nickname;

    var messageElement = document.createElement('p');
    messageElement.textContent = message;
    messageElement.className = 'chat-message';

    time = time || new Date();
    var timeElement = document.createElement('time');
    timeElement.className = 'chat-time';
    timeElement.dateTime = time;
    timeElement.textContent = formatTime(time);

    var boxElement = document.createElement('div');
    boxElement.className = 'chat-box';
    boxElement.appendChild(messageElement);
    boxElement.appendChild(timeElement);

    var chatElement = document.createElement('div');
    chatElement.className = 'chat';
    chatElement.appendChild(profileElement);
    chatElement.appendChild(nicknameElement);

    var wrapElement = document.createElement('div');
    wrapElement.appendChild(chatElement);
    wrapElement.appendChild(boxElement);
    wrapElement.style.clear = 'both';

    return wrapElement;
}

function createProfileElement(nickname) {
    var imageElement = new Image();
    imageElement.src = './img/ozinger.png';
    imageElement.style.margin = '0';
    imageElement.style.width = 'inherit';
    imageElement.style.height = 'inherit';
    imageElement.style.borderRadius = 'inherit';

    var profileElement = document.createElement('object');
    profileElement.data = './img/profile/' + nickname + '.png';
    profileElement.appendChild(imageElement);

    return profileElement;
}

window.onresize = function () {
    var stageHeight = ('innerHeight' in window)?
        window.innerHeight : document.documentElement.offsetHeight;
    tabsElement.style.height = (stageHeight - 60) + 'px';
    leftSideElement.style.height = (stageHeight - 80) + 'px';
    rightSideElement.style.height = (stageHeight - 80) + 'px';
    centerElement.style.height = stageHeight + 'px';
};
window.onresize();

swfobject.embedSWF('./firc2.swf', 'firc', '1px', '1px', '10',
    null, null, null, {allowScriptAccess: 'always'},
    function (e) { firc = e.ref; });
