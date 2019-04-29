/** 客户端逻辑*/

// 初始化socket
var Chat = function(socket) {
    this.socket = socket
}
// 消息发送
Chat.prototype.sendMessage = function(room,text) {
    var message = {
        room:room,
        text:text
    }
    this.socket.emit('message',message)
}
// 变更房间
Chat.prototype.changeRoom = function(room) {
    this.socket.emit('join',{
        newRoom:room
    })
}
// 文字命令识别
Chat.prototype.processCommand = function(command) {
    // 字符串间空格用逗号分隔 返回数组
    var words = command.split(' ')
    // 将拿到的第一个字符串(命令关键字) 从第二个字符开始到结尾(由于第一个字符是/)
    var command = words[0].substring(1,words[0].length).toLowerCase()
    var message = false
    switch(command) {
        // 进入房间命令
        case 'join':
            // 将数组中第一个(命令关键字)删除
            words.shift()
            // 数组内容转乘字符串  空格分隔(因为用户输入的是空格)
            var room = words.join(' ')
            this.changeRoom(room)
            break
        case 'nick':
            words.shift()
            var name = words.join(' ')
            this.socket.emit('nameAttempt',name)
            break
        default:
        message = '无效命令'
    }
    return message
}