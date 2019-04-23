var socketio = require('socket.io')
var io
//初始化聊天室状态
var guestNumber = 1
var nickNames = {}
var namesUsed = []
var currentRoom = {}

//启动 socketio 服务器
exports.listen = function(server) {
    // 启动Socket.IO服务器，允许它搭载在已有的HTTP服务器上
    io = socketio.listen(server)
    // 在服务端保存用户数据键值对
    io.set('log level',1)
    //每个用户连接时触发connection
    io.sockets.on('connection',function(socket) {
        console.log(scoket)
        //在用户连接上来时赋予其一个访客名
        guestNumber = assignGuestName(socket,guestNumber,nickNames,namesUsed)
        console.log(guestNumber)
        // 默认进入的房间
        joinRoom(socket,'公共区')
        // 用户发出的消息
        handleMessageBroadcasting(socket,nickNames)
        // 更改用户名
        handleNameChangeAttempts(socket, nickNames, namesUsed)
        // 创建新房间
        handleRoomJoining(socket)
        // 将已存在的房间名发送给接入的用户
        socket.on('rooms',function() {
            // 高版本用io.sockets.adapter.rooms 用于获得所有房间信息 每个房间相当于为接入的用户开辟的单独空间
            socket.emit('rooms',io.sockets.manager.rooms)
        })
        // 退出清除
        handleClientDisconnection(socket, nickNames, namesUsed)
    })
}
