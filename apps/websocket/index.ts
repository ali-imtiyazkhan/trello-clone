import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection",(socket)=>{
    console.log("new user connected")

    socket.on("message",(message)=>{
        console.log(message.toString())
    })

    socket.send("welcome to websocket server")

    socket.on("close",()=>{
        console.log("user disconnected")
    })
})