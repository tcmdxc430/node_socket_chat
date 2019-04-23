var http = require("http");// 服务器与客户端通信模块
var fs = require("fs");// 文件系统
var path = require("path");// 系统路径
var mime = require("mime"); // 根据文件扩展名得出对应文件mime类型
var cache = {};// 初始化缓存

//所请求的文件不存在时发送404错误
function send404(response){
    response.writeHead(404,{'Content-type':'text/plain'})
    response.write('a 404 err')
    // 断开服务器连接
    response.end()
}
//提供文件数据服务
function sendFile(response,filePath,fileContents) {
    response.writeHead(200,
        {
            // 获取filePath文件的mime类型 如果是2.0+mime lookup=>getType
            'Content-Type':mime.lookup(path.basename(filePath))
        })
    // 断开服务器连接  并将fileContents的html解析结果展示出来
    console.log(fileContents)
    response.end(fileContents)
}

//提供静态文件服务 如果缓存中有文件内容在缓存中读取  如果没有才去文件中查找
function serveStatic(response,cache,absPath) {
    console.log(response)
    if(cache[absPath]){
        sendFile(response,absPath,cache[absPath])
    }else{
        // 检验absPath文件是否存在 返回boolean
        fs.exists(absPath,function(exists){
            if(exists) {
                // 读取并解析absPath文件中的内容 返回data解析结果
                fs.readFile(absPath,function(err,data) {
                    console.log('readFile')
                    if(err) {
                        send404(response)
                    }else {
                        // 将解析结果存入缓存
                        cache[absPath] = data
                        sendFile(response,absPath,data)
                    }
                })
            }else{
                send404(response)
            }
        })
    }
}