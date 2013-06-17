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
var nicknameElement = document.getElementById('nickname');
var talkElement = document.getElementById('talk');

var serverTabElement = document.getElementById('server-tab');
var serverTabButtonElement = document.getElementById('server-tab-button');
var serveruserListElement = document.getElementById('server-user-list');

var tabsElement = document.getElementById('tabs');
var tabElements = {'#': serverTabElement};

var tabChildLimit = 500;

var tabButtonsElement = document.getElementById('tab-buttons');
var tabButtonElements = {'#': serverTabButtonElement};

var userListsElement = document.getElementById('user-lists');
var userListElements = {'#': serveruserListElement};

var topics = {'#': 'Squircle - firc, ozinger based web irc client'};

var nicknameMd5s = {};

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
                    createNoticeElement(from + ': ' + message), 'notice');
            }
            break;
        case '482':
            var channel = splittedRaw.shift();
            var message = splittedRaw.join(' ').substr(1);
            console.log('error');
            console.log('channel: ' + channel);
            console.log('message: ' + message);
            appendElementToChannel(channel,
                createNoticeElement(message), 'notice');
            topicElement.value = topics[channel];
            break;
        case '404':
            var channel = splittedRaw.shift();
            var message = splittedRaw.join(' ').substr(1);
            console.log('error');
            console.log('channel: ' + channel);
            console.log('message: ' + message);
            appendElementToChannel(channel,
                createNoticeElement(message), 'notice');
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
    case 106:
        nickname = defaultNickname();
        firc.setInfo(server, port, encode, nickname,
                     channel, password, security);
        firc.connect();
        break;
    case 433:
        nickname = nickname + '_';
        changeNickname(nickname);
        break;
    case 403:
        appendElementToChannel(currentChannel,
            createNoticeElement('Invalid channel name'), 'notice');
        break;
    }
}

FIRCEventHandler['onJoin'] = function (channel) {
    console.log('join');
    console.log('channel: ' + channel);

    if (tabElements[channel] == null) {
        tabElements[channel] = createTabElement();
        tabsElement.appendChild(tabElements[channel]);

        tabButtonElements[channel] = createTabButtonElement(channel);
        tabButtonsElement.appendChild(tabButtonElements[channel]);

        userListElements[channel] = createUserListElement();
        userListsElement.appendChild(userListElements[channel]);
    }

    activeChannel(channel);
    appendElementToChannel(channel,
        createNoticeElement(nickname + ' has joined'), 'notice');
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
            ' has changed the topic to: ' + topic), 'notice');
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
    switch (mode.charAt(1)) { //Deal with firc bug
    case 'q':
        requestuserList(channel);
        break;
    case 'h':
        requestuserList(channel);
        break;
    }
    console.log('nickname: ' + nickname);
    appendElementToChannel(channel,
        createNoticeElement(nickname + ' sets mode ' +
            mode + ' on ' + channel), 'notice');
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
        var status = user.charAt(0);
        var nickname;
        switch (status) {
        case '~':
            nickname = user.substr(1);
            console.log('owner: ' + nickname);
            break;
        case '@':
            nickname = user.substr(1);
            console.log('operator: ' + nickname);
            break;
        case '%':
            nickname = user.substr(1);
            console.log('half operator: ' + nickname);
            break;
        case '+':
            nickname = user.substr(1);
            console.log('voice user: ' + nickname);
            break;
        default:
            nickname = user;
            console.log('user: ' + user);
            break;
        }
        if (nicknameMd5s[nickname] == null) {
            var xhr = new XMLHttpRequest();
            if (xhr) {
                xhr.onload = function (e) {
                    nicknameMd5s[this] = e.currentTarget.responseText;
                }.bind(nickname);
                xhr.open('get',
                    'http://api.ozinger.org/disjukr/' + nickname, true);
                xhr.send();
            }
        }
        if (userList(channel)[nickname] == null)
            appendUserToChannel(channel, status, nickname);
        else
            setUserStatus(status, userList(channel)[nickname]);
    }
}

FIRCEventHandler['onUserJoin'] = function (channel, nickname) {
    console.log('user join');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    appendElementToChannel(channel,
        createNoticeElement(nickname + ' has joined'), 'notice');
    appendUserToChannel(channel, '', nickname);
}

FIRCEventHandler['onUserNick'] = function (user, nickname) {
    console.log('user nickname');
    console.log('user: ' + user);
    console.log('nickname: ' + nickname);
    for (var channel in userListElements) {
        if (userList(channel)[user] != null) {
            appendElementToChannel(currentChannel,
                createNoticeElement(user + ' now known as ' + nickname),
                'notice');
            setUserNickname(channel, user, nickname);
        }
    }
}

FIRCEventHandler['onUserMode'] = function (channel, mode, nickname, from) {
    console.log('user mode');
    console.log('channel: ' + channel);
    console.log('raw mode: ' + mode);
    var isGive = mode.charAt(0) == '+';
    var status;
    var cls;
    switch (mode.charAt(1)) {
    case 'o':
        status = 'channel operator status';
        cls = 'user operator';
        break;
    case 'v':
        status = 'voice';
        cls = 'user voice';
        break;
    }
    console.log('mode: ' + status);
    console.log('nickname: ' + nickname);
    console.log('from: ' + from);
    appendElementToChannel(channel,
        createNoticeElement(from + (isGive? ' gives ' : ' removes ') +
            status + ' to ' + nickname), 'notice');
    userList(channel)[nickname].className = isGive? cls : 'user';
}

FIRCEventHandler['onUserPart'] = function (channel, nickname, message) {
    console.log('user part');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
    appendElementToChannel(channel,
        createNoticeElement(nickname + ' has quit: ' + message), 'notice');
    removeUserFromChannel(channel, nickname);
}

FIRCEventHandler['onUserQuit'] = function (nickname, message) {
    console.log('user quit');
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
    for (var channel in userListElements) {
        if (userList(channel)[nickname] != null) {
            appendElementToChannel(channel,
                createNoticeElement(nickname + ' has quit: ' + message),
                'notice');
            removeUserFromChannel(channel, nickname);
        }
    }
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
            createNoticeElement('You have been kicked by ' +
                from + ': ' + message), 'notice');
        removeUserListFromChannel(channel);
    }
    else {
        appendElementToChannel(channel,
            createNoticeElement(nickname + ' have been kicked by ' +
                from + ': ' + message), 'notice');
        removeUserFromChannel(channel, nickname);
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

FIRCEventHandler['onMessage'] = function (channel, from, message) {
    console.log('message');
    console.log('channel: ' + channel);
    console.log('nickname: ' + from);
    console.log('message: ' + message);
    var iMentioned = mentioned(message, nickname);
    appendElementToChannel(channel,
        createChatElement(from, message, iMentioned),
        iMentioned? 'mention' : 'message');
}

FIRCEventHandler['onMyMessage'] = function (channel, nickname, message) {
    console.log('my message');
    console.log('channel: ' + channel);
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
    appendElementToChannel(channel, createMyChatElement(message));
}

FIRCEventHandler['onPrivMessage'] = function (nickname, message) {
    console.log('private message');
    console.log('nickname: ' + nickname);
    console.log('message: ' + message);
}

FIRCEventHandler['onServerMessage'] = function (message) {
    console.log('server message');
    console.log('message: ' + message);
    appendElementToChannel('#', createChatElement('', message));
}

var SpecialCommandHandler = {};

SpecialCommandHandler['/help'] = function (command) {
    var availableCommands = [];
    for (var command in SpecialCommandHandler)
        availableCommands.push(command);
    appendElementToChannel(currentChannel,
        createNoticeElement('available commands: ' +
            availableCommands.join(' ')), 'notice');
}

SpecialCommandHandler['/h'] = function (command) {
    SpecialCommandHandler['/help'](command);
}

SpecialCommandHandler['/join'] = function (channel, password) {
    joinChannel(channel, password);
}

SpecialCommandHandler['/j'] = function (channel, password) {
    SpecialCommandHandler['/join'](channel, password);
}

SpecialCommandHandler['/msg'] = function () {
    var args = Array.prototype.slice.call(arguments);
    var channel = args.shift();
    var message = args.join(' ');
    sendMessage(channel, message);
}

SpecialCommandHandler['/clear'] = function () {
    tabElements[currentChannel].innerHTML = '';
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
    nicknameElement.value = nickname = newNickname;
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

function requestuserList(channel) {
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
    userListElements[currentChannel].className = 'user-list off';
    userListElements[channel].className = 'user-list on';
    if (channel != '#') { //not server
        var tabButtonElement = tabButtonElements[channel].
            getElementsByClassName('tab-button')[0];
        tabButtonElement.className = 'tab-button';
    }
    tabsElement.scrollTop = tabsElement.scrollHeight;
    topicElement.value = topics[channel]? topics[channel] : '';
    currentChannel = channel;
}

function appendElementToChannel(channel, element, level) {
    var tabElement = tabElements[channel];
    if (tabElement) {
        var needScroll = tabsElement.offsetHeight +
            tabsElement.scrollTop >= tabsElement.scrollHeight;
        var children = tabElement.children;
        while (children.length >= tabChildLimit)
            children[0].remove();
        tabElement.appendChild(element);
        if (needScroll)
            tabsElement.scrollTop = tabsElement.scrollHeight;
        if ((currentChannel != channel) && (channel != '#')) {
            var tabButtonElement = tabButtonElements[channel].
                getElementsByClassName('tab-button')[0];
            var cls = tabButtonElement.className;
            switch (level) {
            case 'notice':
                if (cls != 'tab-button unconfirmed-mention')
                if (cls != 'tab-button unconfirmed-message')
                    cls = 'tab-button unconfirmed-notice';
                break;
            case 'message':
                if (cls != 'tab-button unconfirmed-mention')
                    cls = 'tab-button unconfirmed-message';
                break;
            case 'mention':
                cls = 'tab-button unconfirmed-mention';
                break;
            }
            tabButtonElement.className = cls;
        }
    }
}

function createTabButtonElement(channel) {
    var tabButtonElement = document.createElement('button');
    tabButtonElement.textContent = channel;
    tabButtonElement.className = 'tab-button';
    tabButtonElement.onclick = function () {
        activeChannel(channel);
    }.bind(this);

    var closeButtonElement = document.createElement('button');
    closeButtonElement.textContent = 'x';
    closeButtonElement.className = 'tab-close-button';
    closeButtonElement.onclick = function () {
        if (channel == currentChannel)
            activeChannel('#');
        partChannel(channel, 'Leaving');
        removeUserListFromChannel(channel);
        userListElements[channel].remove();
        delete userListElements[channel];
        tabElements[channel].remove();
        delete tabElements[channel];
        tabButtonElements[channel].remove();
        delete tabButtonElements[channel];
    }.bind(this);

    var wrapElement = document.createElement('div');
    wrapElement.appendChild(tabButtonElement);
    wrapElement.appendChild(closeButtonElement);
    wrapElement.style.clear = 'both';

    return wrapElement;
}

function createTabElement() {
    var tabElement = document.createElement('div');
    return tabElement;
}

function createNoticeElement(message, time) {
    var messageElement = document.createElement('p');
    messageElement.innerHTML = plainToHtmlEntity(message);
    messageElement.className = 'notice-message';

    var timeElement = createTimeElement(time);

    var noticeElement = document.createElement('div');
    noticeElement.className = 'notice';
    noticeElement.appendChild(messageElement);
    noticeElement.appendChild(timeElement);

    var wrapElement = document.createElement('div');
    wrapElement.appendChild(noticeElement);
    wrapElement.style.clear = 'both';

    return wrapElement;
}

function createMyChatElement(message, time) {
    var messageElement = document.createElement('p');
    messageElement.innerHTML = plainToHtmlEntity(message);
    messageElement.className = 'chat-message';

    var timeElement = createTimeElement(time);

    var boxElement = document.createElement('div');
    boxElement.className = 'my-chat-box';
    boxElement.appendChild(messageElement);
    boxElement.appendChild(timeElement);

    var wrapElement = document.createElement('div');
    wrapElement.appendChild(boxElement);
    wrapElement.style.clear = 'both';

    return wrapElement;
}

function createChatElement(nickname, message, mentioned, time) {
    var profileElement = createProfileElement(nickname);
    profileElement.className = 'chat-img';

    var nicknameElement = document.createElement('div');
    nicknameElement.className = 'chat-nickname';
    nicknameElement.textContent = nickname == ''? '*' : nickname;

    var messageElement = document.createElement('p');
    messageElement.innerHTML = plainToHtmlEntity(message);
    messageElement.className = 'chat-message';

    var timeElement = createTimeElement(time);

    var boxElement = document.createElement('div');
    boxElement.className = mentioned? 'chat-box mentioned' : 'chat-box';
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

function createTimeElement(time) {
    time = time || new Date();
    var timeElement = document.createElement('time');
    timeElement.className = 'time';
    timeElement.dateTime = time;
    timeElement.textContent = formatTime(time);
    return timeElement;
}

function createProfileElement(nickname, defaultImage) {
    defaultImage = defaultImage ||
        'https://raw.github.com/disjukr/Squircle/gh-pages/img/ozinger.png';
    var imageElement = new Image();
    if (nicknameMd5s[nickname] == null) {
        imageElement.src = './img/ozinger.png';
    }
    else {
        imageElement.src = 'http://www.gravatar.com/avatar/' +
            nicknameMd5s[nickname] +
            '?d=' + encodeURIComponent(defaultImage);
    }
    return imageElement;
}

function createUserListElement() {
    var userListElement = document.createElement('ul');
    userListElement.users = {};
    return userListElement;
}

function createUserElement(status, nickname) {
    var userElement = document.createElement('li');
    userElement.textContent = nickname;
    setUserStatus(status, userElement);
    return userElement;
}

function setUserStatus(status, userElement) {
    switch (status) {
    case '~':
        userElement.className = 'user owner';
        break;
    case '@':
        userElement.className = 'user operator';
        break;
    case '%':
        userElement.className = 'user half-operator';
        break;
    case '+':
        userElement.className = 'user voice';
        break;
    default:
        userElement.className = 'user';
        break;
    }
}

function setUserNickname(channel, user, nickname) {
    var userListElement = userListElements[channel];
    var userElement = userListElement.users[user];
    userListElement.users[nickname] = userElement;
    delete userListElement.users[user];
    userElement.textContent = nickname;
}

function appendUserToChannel(channel, status, nickname) {
    var userElement = createUserElement(status, nickname);
    var userListElement = userListElements[channel];
    userListElement.appendChild(userElement);
    userListElement.users[nickname] = userElement;
}

function removeUserFromChannel(channel, nickname) {
    var userListElement = userListElements[channel];
    var userElement = userListElement.users[nickname];
    delete userListElement.users[nickname];
    userElement.remove();
}

function removeUserListFromChannel(channel) {
    var userListElement = userListElements[channel];
    userListElement.innerHTML = '';
    userListElement.users = {};
}

function userList(channel) {
    return (channel == '#')? {} : userListElements[channel].users;
}

function mentioned(message, nickname) {
    var regex = new RegExp('\\b(' + nickname + ')\\b');
    return regex.test(message);
}

function plainToHtml(text) {
    return plainToLink(plainToHtmlEntity(text));
}

function plainToHtmlEntity(text) {
    text = text.split('&').join('&amp;');
    text = text.split('<').join('&lt;');
    text = text.split('>').join('&gt;');
    text = text.split(' ').join('&nbsp;');
    text = text.split('\"').join('&quot;');
    text = text.split('\'').join('&apos;');
    return text;
}

function plainToLink(text) {
    var exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
    return text.replace(exp, "<a href='$1' target='_blank' class='link'>$1</a>");
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
topicElement.onkeydown = function (e) {
    var keyCode = e.keyCode? e.keyCode : event.keyCode;
    if (keyCode == 13) { //enter
        topicElement.blur();
    }
}
topicElement.onblur = function () {
    if (topicElement.value != topics[currentChannel])
        changeChannelTopic(currentChannel, topicElement.value);
}

nicknameElement.value = nickname;
nicknameElement.onkeydown = function (e) {
    var keyCode = e.keyCode? e.keyCode : event.keyCode;
    if (keyCode == 13) { //enter
        nicknameElement.blur();
    }
}
nicknameElement.onblur = function () {
    nicknameElement.value = nicknameElement.value.split(/\s/).join('');
    if (nicknameElement.value != nickname)
        changeNickname(nicknameElement.value);
}

talkElement.value = '';
talkElement.onkeydown = function (e) {
    var keyCode = e.keyCode? e.keyCode : event.keyCode;
    if (keyCode == 13) { //enter
        var talk = talkElement.value;
        var command;
        var commandArgs;
        if (talk.charAt(0) == '/') { //special command
            commandArgs = talk.split(/\s+/);
            command = commandArgs.shift().toLowerCase();
            FIRCEventHandler['onMyMessage'](currentChannel, nickname, talk);
            if (SpecialCommandHandler[command] == null)
                appendElementToChannel(currentChannel,
                    createNoticeElement(command + ': Unknown command'),
                    'notice');
            else
                SpecialCommandHandler[command].apply(null, commandArgs);
        }
        else {
            //irc command length limit is 512 including CRLF
            //so i cut message moderately
            var talkLength = utf8_length(talk);
            var talkLengthLimit = 470 - utf8_length(currentChannel);
            if (talkLength < talkLengthLimit) {
                sendMessage(currentChannel, talk);
            }
            else { //split message by irc command length limit
                var byteCount;
                var restCount;
                for (byteCount = 0; byteCount < talkLength;
                    byteCount += talkLengthLimit) {
                    restCount = talkLength - byteCount;
                    sendMessage(currentChannel,
                        substr_utf8_bytes(talk, byteCount,
                            (restCount < talkLengthLimit)?
                            restCount : talkLengthLimit));
                }
            }
        }
        talkElement.value = '';
    }
}

talkElement.focus();

function utf8_length(s) {
    return s.replace(/[\0-\x7f]|([0-\u07ff]|(.))/g,"$&$1$2").length;
} //code from: https://gist.github.com/mathiasbynens/1010324#comment-34505

function encode_utf8(s) {
  return unescape(encodeURIComponent(s));
}

function substr_utf8_bytes(str, startInBytes, lengthInBytes) {
    var resultStr = '';
    var startInChars = 0;
    var char;
    for (var bytePos = 0; bytePos < startInBytes; ++startInChars) {
        char = str.charCodeAt(startInChars);
        bytePos += (char < 128)? 1 : encode_utf8(str[startInChars]).length;
    }
    var end = startInChars + lengthInBytes - 1;
    for (var n = startInChars; startInChars <= end; ++n) {
        char = str.charCodeAt(n);
        end -= (char < 128)? 1 : encode_utf8(str[n]).length;
        if (str[n] == null) break;
        resultStr += str[n];
    }
    return resultStr;
} //code from: http://stackoverflow.com/questions/11200451/extract-substring-by-utf-8-byte-positions

swfobject.embedSWF('./firc2.swf', 'firc', '1px', '1px', '10',
    null, null, null, {allowScriptAccess: 'always'},
    function (e) { firc = e.ref; });
