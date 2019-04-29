/**聊天的输入逻辑 */
// 针对用户输入的逻辑
function divEscapedContentElement(message,isRoom){
    if(isRoom) {
        return `<div id="message-content">${message}</div>`
    }else{
        return `<div><div class="userNameContent">${userName}:</div><div class="message-content">${message}</div></div>`
    }
}
// 针对系统传递的信息
function divSystemContentElement(message){
    return $(`<div id="system-content"></div>`).html(`<i>${message}</i>`)
}
// 处理用户输入
function processUserInput(chatApp,socket) {
    var message = $('#send-message').val()
    var systemMessage
    if(message.charAt(0) == '/') {
        systemMessage = chatApp.processCommand(message)
        if(systemMessage) {
            $('#messages').append(divEscapedContentElement(systemMessage))
        }
    }else{
        // 非命令 直接发送信息
        chatApp.sendMessage($('#room').text(),message)
        $('#messages').append(divEscapedContentElement(message))
        // prop返回属性的值 布尔属性如checked 返回true/false而不会返回checked
        $('#messages').scrollTop($('#messages').prop('scrollHeight'))
    }
    // 发送完成后清空输入框
    $('#send-message').val('')
    
}

// 客户端socketio初始化
var socket = io.connect()
// 页面加载完成时
$(document).ready(function() {
    var chatApp = new Chat(scoket)
    // 更名结果
    socket.on('nameResult',function(result) {
        var message
        if(result.succcess) {
            message = '以改为'+name.result
        }else{
            message = result.message
        }
        $('#messages').append(divEscapedContentElement(message))
    })
    // 更换房间结果
    socket.on('joinResult',function(result) {
        $('#room').text(result.room)
        $('#messages').append(divSystemContentElement('房间已变更'))
    })
    // 显示接收到的消息
    socket.on('messsage',function(message) {
        var newElement = $('<div></div>').text(message.text)
        $('#messages').append(newElement)
    })
    // 显示可选房间列表
    socket.on('rooms',function(rooms) {
        $('#room-list').empty()
        for(var room in rooms) {
            // 返回start到stop-1的字符串，即房间名称
            room = room.substring(1,room.length)
            if(room!='') {
                $('#room-list').append(divEscapedContentElement(room))
            }
        }
        // 点击进入房间
        $('#room-list div').on('click',function() {
            chatApp.proccessCommand('/join'+$(this).text)
            // 进入房间后激活输入框
            $('#send-message').focus()
        })
    })
    // 定时刷新可选房间列表
    setInterval(function() {
        socket.emit('rooms')
    },1000)
    // 初始化时就激活输入框
    $('#send-message').focus()
    // 提交type=submit的input时发送聊天消息
    $('#send-form').submit(function() {
        processUserInput(chatApp,socket)
        return false
    })
})