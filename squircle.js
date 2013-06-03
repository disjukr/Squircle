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
var topicElement = document.getElementById('topic');
var tabsElement = document.getElementById('tabs');
var serverTabElement = document.getElementById('server-tab');
var tabButtonsElement = document.getElementById('tab-buttons');
var tabElements = {'#': serverTabElement};
var topics = {'#': 'Squircle - firc, ozinger based web irc client'};

var FIRCEventListener = function (type, data) {
    var handler = FIRCEventHandler[type];
    if (handler && handler.apply) {
        var dataType = typeof data;
        if (dataType == 'object')
            handler.apply(this, data);
        else
            handler(data);
    }
}

var FIRCEventHandler = {};

FIRCEventHandler['debug'] = function (raw) {
    if (raw.substr(0, 8) == 'RECV : :') {
        var splittedRaw = raw.substr(8).split(' ');
        var first = splittedRaw.shift();
        var second = splittedRaw.shift();
        var third = splittedRaw.shift();
        switch (second) {
        case 'NOTICE':
            if (third != 'Auth') {
                var message = splittedRaw.join(' ').substr(1);
                var from = first.split('!')[0];
                console.log('notice');
                console.log('from: ' + from);
                console.log('message: ' + message);
                appendElementToChannel(currentChannel,
                    createNoticeElement(from + ': ' + message));
            }
            break;
        case '482':
            var channel = splittedRaw.shift();
            var message = splittedRaw.join(' ').substr(1);
            console.log('error');
            console.log('channel: ' + channel);
            console.log('message: ' + message);
            appendElementToChannel(channel, createNoticeElement(message));
            topicElement.value = topics[channel];
            break;
        }
    }
}

FIRCEventHandler['onReady'] = function () {
    console.log('ready');
    firc.setInfo(server, port, encode, nickname,
                 channel, password, security);
    firc.connect();
}

FIRCEventHandler['onConnect'] = function () {
    console.log('connect');
}

FIRCEventHandler['onError'] = function (errorCode) {
    console.log('error');
    console.log('error code: ' + errorCode);
    switch (errorCode) {
    case 106: //nickname
        nickname = defaultNickname();
        firc.setInfo(server, port, encode, nickname,
                     channel, password, security);
        firc.connect();
        break;
    }
}

FIRCEventHandler['onJoin'] = function (channel) {
    console.log('join');
    console.log('channel: ' + channel);
    tabElements[channel] = createTabElement();
    tabsElement.appendChild(tabElements[channel]);
    tabButtonsElement.appendChild(createTabButtonElement(channel));
    activeChannel(channel);
    appendElementToChannel(channel,
        createNoticeElement(nickname + ' has joined'));
}

FIRCEventHandler['onTopic'] = function (channel, topic) {
    console.log('topic');
    console.log('channel: ' + channel);
    console.log('topic: ' + topic);
    topics[channel] = topic;
    topicElement.value = topics[currentChannel];
}

FIRCEventHandler['onTopicChange'] = function (channel, nickname, topic) {
    console.log('topic change');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    console.log('topic: ' + topic);
    topics[channel] = topic;
    appendElementToChannel(channel,
        createNoticeElement(nickname +
            ' has changed the topic to: ' + topic));
    topicElement.value = topics[currentChannel];
}

FIRCEventHandler['onChannelListStart'] = function () {
    console.log('channel list start');
}

FIRCEventHandler['onChannelList'] = function (channel, userCount,
                                              topic, mode) {
    console.log('channel: ' + channel);
    console.log('user count: ' + userCount);
    console.log('topic: ' + topic);
    console.log('mode: ' + mode);
}

FIRCEventHandler['onChannelListEnd'] = function () {
    console.log('channel list end');
}

FIRCEventHandler['onChannelKey'] = function (channel) {
    console.log('channel key required');
    console.log('channel: ' + channel);
}

FIRCEventHandler['onChannelMode'] = function (channel, mode, key, limit) {
    console.log('channel mode');
    console.log('channel: ' + channel);
    console.log('mode: ' + mode);
    console.log('key: ' + key);
    console.log('limit: ' + limit);
}

FIRCEventHandler['onChannelChange'] = function (channel, mode, nickname) {
    console.log('channel change');
    console.log('channel: ' + channel);
    console.log('mode: ' + mode);
    if (mode.charAt(1) == 'h') {
        requestUserList(channel); //Deal with firc bug
    }
    console.log('nickname: ' + nickname);
}

FIRCEventHandler['onBanList'] = function (channel, nickname, from, time) {
    console.log('ban list');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    console.log('from: ' + from);
    console.log('time: ' + time);
}

FIRCEventHandler['onBanListEnd'] = function () {
    console.log('ban list end');
}

FIRCEventHandler['onUserList'] = function (channel, users) {
    console.log('user list');
    console.log('channel: ' + channel);
    console.log('users: ' + users);
    for (var i = 0; i < users.length; ++i) {
        var user = users[i];
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
}

FIRCEventHandler['onUserJoin'] = function (channel, nickname) {
    console.log('user join');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    appendElementToChannel(channel,
        createNoticeElement(nickname + ' has joined'));
}

FIRCEventHandler['onUserNick'] = function (user, nickname) {
    console.log('user nickname');
    console.log('user: ' + user);
    console.log('nickname: ' + nickname);
}

FIRCEventHandler['onUserMode'] = function (channel, mode, nickname, from) {
    console.log('user mode');
    console.log('channel: ' + channel);
    console.log('raw mode: ' + mode);
    switch (mode.charAt(1)) {
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
    console.log('nickname: ' + nickname);
    console.log('from: ' + from);
}

FIRCEventHandler['onUserPart'] = function (channel, nickname, message) {
    console.log('user part');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
    appendElementToChannel(channel,
        createNoticeElement(nickname + ' has quit: ' + message));
}

FIRCEventHandler['onUserQuit'] = function (nickname, message) {
    console.log('user quit');
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
    //TODO: append to all channel which had the user
    appendElementToChannel(currentChannel,
        createNoticeElement(nickname + ' has quit: ' + message));
}

FIRCEventHandler['onKick'] = function (channel, nickname,
                                       from, message, isMe) {
    console.log('user kick');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    console.log('from: ' + from);
    console.log('message: ' + message);
    console.log('is me: ' + isMe);
    if (isMe) {
        appendElementToChannel(channel,
            createNoticeElement('You have been kicked by' +
                from + ' because ' + message));
    }
    else {
        appendElementToChannel(channel,
            createNoticeElement(nickname + ' have been kicked by' +
                from + ' because ' + message));
    }
}

FIRCEventHandler['onWhoIs'] = function (nickname, realname, ip,
                                        channel, idle, connected) {
    console.log('whois');
    console.log('nickname: ' + nickname);
    console.log('realname: ' + realname);
    console.log('ip: ' + ip);
    console.log('channel: ' + channel);
    console.log('idle: ' + idle);
    console.log('connected: ' + connected);
}

FIRCEventHandler['onMessage'] = function (channel, nickname, message) {
    console.log('message');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
    appendElementToChannel(channel, createChatElement(nickname, message));
}

FIRCEventHandler['onMyMessage'] = function (channel, nickname, message) {
    console.log('my message');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
}

FIRCEventHandler['onPrivMessage'] = function (nickname, message) {
    console.log('private message');
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
}

FIRCEventHandler['onServerMessage'] = function (message) {
    console.log('server message');
    console.log('message: ' + message);
    appendElementToServer(createChatElement('', message));
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

function changeChannelTopic(channel, topic) {
    firc.channelTopic(channel, topic);
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
    return 'ika' + parseInt(Math.random() * 10000);
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
    topicElement.value = topics[channel]? topics[channel] : '';
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
        activeChannel(channel);
    }.bind(this);
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
    messageElement.innerHTML = plainTolink(message);
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

function plainTolink(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp, "<a href='$1' target='_blank' class='linkInMessage'>$1</a>"); 
}

window.onresize = function () {
    var stageHeight = ('innerHeight' in window)?
        window.innerHeight : document.documentElement.offsetHeight;
    tabsElement.style.height = (stageHeight - 60) + 'px';
    leftSideElement.style.height = (stageHeight - 20) + 'px';
    rightSideElement.style.height = (stageHeight - 20) + 'px';
    centerElement.style.height = stageHeight + 'px';
    tabsElement.scrollTop = tabsElement.scrollHeight;
};
window.onresize();

topicElement.value = topics[currentChannel];
topicElement.onkeydown = function () {
    if (event.keyCode == 13) { //enter
        topicElement.blur();
    }
}
topicElement.onblur = function () {
    if (topicElement.value != topics[currentChannel])
        changeChannelTopic(currentChannel, topicElement.value);
}

swfobject.embedSWF('./firc2.swf', 'firc', '1px', '1px', '10',
    null, null, null, {allowScriptAccess: 'always'},
    function (e) { firc = e.ref; });
