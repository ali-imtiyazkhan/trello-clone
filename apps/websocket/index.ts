import { WebSocketServer } from "ws";

const PORT = Number(process.env.PORT) || 8080
const wss = new WebSocketServer({ port: PORT })

wss.on("connection", (socket) => {
    console.log("client connected")

    socket.on("message", (msg) => {
        const text = msg.toString()
        console.log("raw message : ", text)

        try {
            const data = JSON.parse(text)
            console.log("data is : ", data)
        } catch (err) {
            console.log("not valid JSON : ", text)
        }
    })

    socket.send(JSON.stringify("There is nothing that we can do so let's make this possible "))
});