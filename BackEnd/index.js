const { 
    v4: uuidv4,
  } = require('uuid');
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const cors = require('cors');
const { futimesSync } = require('fs');

app.use(cors({
    origin: '*'
}));

app.get('/', (req, res) => {
    res.send('<h1>PING PONG SERVER -- </h1>');
});

let rooms = [];

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on( "create", () =>{
        room = {
            id: uuidv4(),
            players: [{
                socketID: socket.id,
                playerNo: 1,
                score: 0,
                x: 90,
                y: 360,
            }],
            ball: {
                x: 700,
                y: 400,
                dx: Math.random() < 0.5 ? 1 : -80,
                dy: Math.random() < 0.5 ? 0.75 : -0.75,
            },
            winner: 0,
        }
        console.log('a user connected',room.id);
        rooms.push(room);
        socket.join(room.id);
        socket.emit('playerNo', {
            roomID: room.id,
            playerNo: 1
        });
    });
    socket.on("join", (roomId) => {
        console.log(rooms);

        // get room 
        let room = rooms.find(room => room.id === roomId);
        
        if (room) {
            socket.join(room.id);
            socket.emit('playerNo', {
                roomID: room.id,
                playerNo: 2
            });

            // add player to room
            room.players.push({
                socketID: socket.id,
                playerNo: 2,
                score: 0,
                x: 1290,
                y: 360,
            });

            // send message to room
            io.to(room.id).emit('startingGame');

            setTimeout(() => {
                io.to(room.id).emit('startedGame', room);

                // start game
                startGame(room);
            }, 3000);
        }
        else {
            socket.emit('playerNo', {
                roomID: roomId,
                playerNo: 0
            });
        }
    });

    socket.on("move", (data) => {
        let room = rooms.find(room => room.id === data.roomID);

        if (room) {
            if (data.direction === 'up') {
                room.players[data.playerNo - 1].y -= 10;

                if (room.players[data.playerNo - 1].y < 0) {
                    room.players[data.playerNo - 1].y = 0;
                }
            }
            else if (data.direction === 'down') {
                room.players[data.playerNo - 1].y += 10;

                if (room.players[data.playerNo - 1].y > 700) {
                    room.players[data.playerNo - 1].y = 700;
                }
            }
        }

        // update rooms
        rooms = rooms.map(r => {
            if (r.id === room.id) {
                return room;
            }
            else {
                return r;
            }
        });

        io.to(room.id).emit('updateGame', room);
    });

    socket.on("leave", (roomID) => {
        socket.leave(roomID);
    });



    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

function startGame(room) {
    let interval = setInterval(() => {
        room.ball.x += room.ball.dx * 5;
        room.ball.y += room.ball.dy * 4;

        // check if ball hits player 1
        if (room.ball.x < 110 && room.ball.x>90 && room.ball.y > room.players[0].y && room.ball.y < room.players[0].y + 100) {
            room.ball.dx = 0.80;

            // change ball direction
            if (room.ball.y < room.players[0].y + 50) {
                room.ball.dy = -0.75;
            }
            else if (room.ball.y > room.players[0].y + 50) {
                room.ball.dy = 0.75;
            }
            else {
                room.ball.dy = 0;
            }
        }

        // check if ball hits player 2
        if (room.ball.x > 1290 && room.ball.x<1310 && room.ball.y > room.players[1].y && room.ball.y < room.players[1].y + 100) {
            room.ball.dx = -0.80;

            // change ball direction
            if (room.ball.y < room.players[1].y + 30) {
                room.ball.dy = -0.75;
            }
            else if (room.ball.y > room.players[1].y + 30) {
                room.ball.dy = 0.75;
            }
            else {
                room.ball.dy = 0;
            }
        }

        // up and down walls
        if (room.ball.y < 5 || room.ball.y > 790) {
            room.ball.dy *= -1;
        }


        // left and right walls
        if (room.ball.x < 5) {
            room.players[1].score += 1;
            room.players[0].x=90;
            room.players[0].y=360;
            room.players[1].x=1290;
            room.players[1].y=360;
            room.ball.x = 700;
            room.ball.y = 400;
            room.ball.dx = 0.80;
            room.ball.dy = Math.random() < 0.5 ? 0.75 : -0.75;
        }

        if (room.ball.x > 1395) {
            room.players[0].score += 1;
            room.players[0].x=90;
            room.players[0].y=360;
            room.players[1].x=1290;
            room.players[1].y=360;
            room.ball.x = 700;
            room.ball.y = 400;
            room.ball.dx = -0.80;
            room.ball.dy = Math.random() < 0.5 ? 0.75 : -0.75;
        }


        if (room.players[0].score === 10) {
            room.winner = 1;
            rooms = rooms.filter(r => r.id !== room.id);
            io.to(room.id).emit('endGame', room);
            clearInterval(interval);
        }

        if (room.players[1].score === 10) {
            room.winner = 2;
            rooms = rooms.filter(r => r.id !== room.id);
            io.to(room.id).emit('endGame', room);
            clearInterval(interval);
        }

        io.to(room.id).emit('updateGame', room);
    }, 1000 / 60);
}



server.listen(3000, () => {
    console.log('listening on *:3000');
});