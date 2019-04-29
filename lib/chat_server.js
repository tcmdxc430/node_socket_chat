// 服务端逻辑

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
        // console.log(socket)
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

// 分配昵称
function assignGuestName(socket,guestNumber,nickNames,namesUsed) {
    var name = '访客0' + guestNumber
    nickNames[socket.id] = name
    console.log('nickNames'+nickNames)
    // 将结果和昵称发送给用户
    socket.emit('nameResult',{
        success:true,
        name:name
    })
    // 存入昵称列表
    namesUsed.push(name)
    return guestNumber+1
}
// 进入房间
function joinRoom(socket,room) {
    socket.join(room)
    // 记录用户的当前房间
    currentRoom[socket.id] = room
    // 把房间信息发给用户
    socket.emit('joinResult',{
        room:room
    })
    // 向该用户之外的所有连接广播
    socket.broadcast.to(room).emit('message',{
        text:nickNames[socket.id]+'已加入'+room
    })
    // 所有在房间内的连接
    var usersInRoom = io.sockets.clients(room)
    if(usersInRoom.length>1) {
        var usersInRoomSummary = '在该房间用户有：'
        for(var index in usersInRoom){
            // 所有房间内连接的id
            var userSocketId = usersInRoom[index].id
            // 当连接id不是自己时
            if(userSocketId!=socket.id){
                // 第二个昵称开始逗号分隔
                if(index>0) {
                    usersInRoomSummary += ','
                }
                usersInRoomSummary += nickNames[userSocketId]
            }
        }
        // 信息发送给当前连接
        socket.emit('message',{
            text:usersInRoomSummary
        })
    }
}
// 修改昵称
function handleNameChangeAttempts(socket, nickNames, namesUsed) {
    // 监听nameAttempt请求
    socket.on('nameAttempt',function(name) {
        if(name.indexOf('xjp') === 0) {
            socket.emit('nameResult',{
                success:false,
                message:'不能含有习近平'
            })
        }else{
            // 如果输入内容没有被占用
            if(namesUsed.indexOf(name) == -1) {
                var previousName = nickNames[socket.id]
                // 老昵称索引
                var previousNameIndex = namesUsed.indexOf(previousName)
                // 加入新昵称
                namesUsed.push(name)
                nickNames[socket.id] = name
                // 删除老昵称
                delete namesUsed[previousNameIndex]
                socket.emit('nameResult',{
                    success:true,
                    name:name
                })
                // 对分组currentRoom[socket.id]内的用户发送消息
                socket.broadcast.to(currentRoom[socket.id]).emit('message',{
                    text:previousName+'现更名为'+name
                })
            }else{
                socket.emit('nameResult',{
                    success:false,
                    message:'该昵称已存在'
                })
            }
        }
    })
}
// 消息发送
function handleMessageBroadcasting(socket,nickNames){
    socket.on('message',function(message) {
        socket.broadcast.to(message.room).emit('message',{
            text:nickNames[socket.id]+':'+message.text
        })
    })
}
// 创建房间 如果是已有房间 则直接进入
function handleRoomJoining(socket) {
    socket.on('join',function(room) {
        socket.leave(currentRoom[socket.id])
        // 从客户端接收到newRoom
        joinRoom(socket,room.newRoom)
    })
}

//关闭后清除
function handleClientDisconnection(socket, nickNames, namesUsed) {
    socket.on('disconnect',function(){
        var nameIndex = namesUsed.indexOf(nickNames[socket.id])
        // 在数组中清除昵称
        delete namesUsed[nameIndex]
        // 清除连接
        delete nickNames[socket.id]
    })
}