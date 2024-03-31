import { io } from "https://cdn.socket.io/4.4.1/socket.io.esm.min.js";


import Ball from "./ball.js";
import Player from "./player.js";


let playOnlineBtn = document.getElementById('playOnlineBtn');
let playofflineBtn = document.getElementById('playofflineBtn');

const joinForm = document.getElementById('joinForm');
let createRoomBtn = document.getElementById('createRoomBtn');
let onlineBtns = document.getElementById('onlineBtns');

let offlineBtns = document.getElementById('offlineBtns');
let playWithFrndBtn = document.getElementById('playWithFrndBtn');
let playWithCompBtn = document.getElementById('playWithCompBtn');

playOnlineBtn.addEventListener('click', playOnline);
createRoomBtn.addEventListener('click', createRoom);
joinForm.addEventListener('submit', function(event) {
    event.preventDefault();
    console.log(event);
    const roomId = document.getElementById('roomIdInput').value;
    // Call the joinRoom function with the room ID as an argument
    joinRoom(roomId);
  });

playofflineBtn.addEventListener('click', playOffline);
playWithFrndBtn.addEventListener('click', playWithFriend);
playWithCompBtn.addEventListener('click', playWithComputer);


let message = document.getElementById('message');

let boardWidth = 1400;
let boardHeight= 800;
let canvas = document.getElementById('canvas');
canvas.height = boardHeight;
canvas.width = boardWidth;
let ctx = canvas.getContext('2d');

let rounds = [2, 2, 2, 2, 2];
let colors = ['#1abc9c', '#2ecc71', '#3498db', '#8c52ff', '#9b59b6'];

let round =0;
let playerSpeed=10;
let ballVx=0.80;
let ballVy=0.75;
let player1;
let player2;
let ball;

let isGameStarted = false;
let playerNo = 0;
let roomID;

let socket; // Declare the socket variable without initialization

function playOnline(){
    playOnlineBtn.style.display = 'none';
    playofflineBtn.style.display = 'none';
    onlineBtns.style.display = 'block';
    connectToSocket(); // Connect when the game starts
}

function playOffline(){
    playOnlineBtn.style.display = 'none';
    playofflineBtn.style.display = 'none';
    offlineBtns.style.display = 'block';
}

function createRoom() {
    onlineBtns.style.display = 'none';

    if (socket.connected) {
        socket.emit('create');
    }
    else {
        message.innerText = "Refresh the page and try again..."
    }
}

function joinRoom(roomId) {
    console.log(roomId);
    onlineBtns.style.display = 'none';
    if (socket.connected) {
        socket.emit('join',roomId);
    }
    else {
        message.innerText = "Refresh the page and try again..."
    }
}

function connectToSocket() {
    if (!socket || !socket.connected) { // Check if not already connected

        socket = io("https://ping-pong-zbwg.onrender.com", {
            transports: ['websocket']
        });
        

        socket.on("playerNo", (data) => {
            playerNo = data.playerNo;
            if(playerNo == 1){
                message.innerText = `Waiting for other player...(Your room ID:${data.roomID})`
            }
            else if(playerNo == 0){
                message.innerText = `No Room exist for this Room Id-${data.roomID}. Please refresh and try again or create a new one.`
            }
        });
        
        socket.on("startingGame", () => {
            isGameStarted = true;
            message.innerText = "We are going to start the game...";
        });
        
        socket.on("startedGame", (room) => {
            console.log(room);
        
            roomID = room.id;
            message.innerText = "";
        
            player1 = new Player(room.players[0].x, room.players[0].y, 20, 100, 'red');
            player2 = new Player(room.players[1].x, room.players[1].y, 20, 100, 'blue');
        
            player1.score = room.players[0].score;
            player2.score = room.players[1].score;
        
        
            ball = new Ball(room.ball.x, room.ball.y, 10, 'white');

        
            window.addEventListener('keydown', (e) => {
                if (isGameStarted) {
                    if (e.keyCode === 38) {
                        console.log("player move 1 up")
                        socket.emit("move", {
                            roomID: roomID,
                            playerNo: playerNo,
                            direction: 'up'
                        })
                    } else if (e.keyCode === 40) {
                        console.log("player move 1 down")
                        socket.emit("move", {
                            roomID: roomID,
                            playerNo: playerNo,
                            direction: 'down'
                        })
                    }
                }
            });
        
            draw();
        });
        
        socket.on("updateGame", (room) => {
            player1.y = room.players[0].y;
            player2.y = room.players[1].y;
        
            player1.score = room.players[0].score;
            player2.score = room.players[1].score;
        
            ball.x = room.ball.x;
            ball.y = room.ball.y;

        
            draw();
        });
        
        socket.on("endGame", (room) => {
            isGameStarted = false;
            message.innerText = `${room.winner === playerNo ? "You are Winner!" : "You are Loser!"}`;
        
            socket.emit("leave", roomID);
        
        
            setTimeout(() => {
                reset();
            }, 2000);
        });
        
    }
}

function playWithFriend(){
    isGameStarted =true;
    offlineBtns.style.display = 'none';
    message.innerText = "We are going to start the game...";
    setTimeout(() => {
        message.innerText ="";
        // start game
        initialize();
    }, 2000);
}

function initialize(){
    player1 = new Player(90, 360, 20, 100, 'red');
    player2 = new Player(1290, 360, 20, 100, 'blue');
    
    ball = new Ball(700, 400, 10, 'white');
        
    window.addEventListener('keydown', (e) => {
        if (isGameStarted) {
        //player1
        if (e.code == "KeyW") {
            player1.y -= playerSpeed;
            if (player1.y < 0) {
                player1.y = 0;
            }
        }
        else if (e.code == "KeyS") {
            player1.y += playerSpeed;
            if (player1.y >700) {
                player1.y = 700;
            }
        }

        //player2
        if (e.code == "ArrowUp") {
            player2.y -= playerSpeed;
            if (player2.y < 0) {
                player2.y = 0;
            }
        }
        else if (e.code == "ArrowDown") {
            player2.y += playerSpeed;
            if (player2.y >700) {
                player2.y = 700;
            }
        }
          
        }
    });

    draw();
    requestAnimationFrame(update);
}

function update(){
    ball.x += ball.dx * 5;
    ball.y += ball.dy * 4;

    // check if ball hits player 1
    if (ball.x < 110 && ball.x>90 && ball.y > player1.y && ball.y < player1.y + 100) {
        ball.dx = ballVx;

        // change ball direction
        if (ball.y < player1.y + 50) {
            ball.dy = -ballVy;
        }
        else if (ball.y > player1.y + 50) {
            ball.dy = ballVy;
        }
        else {
            ball.dy = 0;
        }
    }

    // check if ball hits player 2
    if (ball.x > 1290 && ball.x<1310 && ball.y > player2.y && ball.y < player2.y + 100) {
        ball.dx = -ballVx;

        // change ball direction
        if (ball.y < player2.y + 50) {
            ball.dy = -ballVy;
        }
        else if (ball.y > player2.y + 50) {
            ball.dy = ballVy;
        }
        else {
            ball.dy = 0;
        }
    }

    // up and down walls
    if (ball.y < 5 || ball.y > 790) {
        ball.dy *= -1;
    }


    // left and right walls
    if (ball.x < 5) {
        player2.score += 1;
        player1.x=90;
        player1.y=360;
        player2.x=1290;
        player2.y=360;
        ball = new Ball(700, 400, 10, 'white');
        ball.dx = 0.75;
    }

    if (ball.x > 1395) {
        player1.score += 1;
        player1.x=90;
        player1.y=360;
        player2.x=1290;
        player2.y=360;
        ball = new Ball(700, 400, 10, 'white');
        ball.dx = -1;
    }


    if (player1.score === 10) {
        isGameStarted = false;
        message.innerText = "Player 1 wins!";
        setTimeout(() => {
            reset();
        }, 2000);
    }

    if (player2.score === 10) {
        isGameStarted = false;
        message.innerText = "Player 2 wins!";
        setTimeout(() => {
            reset();
        }, 2000);
    }
    draw();
    if(isGameStarted){
        requestAnimationFrame(update);
    }
    else{
        ctx.clearRect(0, 0, 1400, 800);
    }
}

function playWithComputer(){
    isGameStarted =true;
    offlineBtns.style.display = 'none';
    message.innerText = "We are going to start the game...";
    setTimeout(() => {
        message.innerText ="";
        // start game
        initializeComputer();
    }, 2000);
}

function initializeComputer(){
    player1 = new Player(90, 360, 20, 100, 'red');
    player2 = new Player(1290, 360, 20, 80, 'blue');
    
    ball = new Ball(700, 400, 10, 'white');
        
    window.addEventListener('keydown', (e) => {
        if (isGameStarted) {
        //player1
        if (e.code == "KeyW" || e.code == "ArrowUp") {
            player1.y -= playerSpeed;
            if (player1.y < 0) {
                player1.y = 0;
            }
        }
        else if (e.code == "KeyS" || e.code == "ArrowDown") {
            player1.y += playerSpeed;
            if (player1.y >700) {
                player1.y = 700;
            }
        }      
        }
    });

    draw();
    requestAnimationFrame(updateComputer);
}

function updateComputer(){
    ball.x += (ball.dx * 5);
    ball.y += (ball.dy * 4);

    // check if ball hits player 1
    if (ball.x < 110 && ball.x>90 && ball.y > player1.y && ball.y < player1.y + 100) {
        ball.dx = ballVx;

        // change ball direction
        if (ball.y < player1.y + 50) {
            ball.dy = -ballVy;
        }
        else if (ball.y > player1.y + 50) {
            ball.dy = ballVy;
        }
        else {
            ball.dy = 0;
        }
    }

    // check if ball hits player 2
    if (ball.x > 1290 && ball.x<1310 && ball.y > player2.y && ball.y < player2.y + 80) {
        ball.dx = -ballVx;

        // change ball direction
        if (ball.y < player2.y + 40) {
            ball.dy = -ballVy;
        }
        else if (ball.y > player2.y + 40) {
            ball.dy = ballVy;
        }
        else {
            ball.dy = 0;
        }
    }

    // up and down walls
    if (ball.y < 5 || ball.y > 790) {
        ball.dy *= -1;
    }


    // left and right walls
    if (ball.x < 5) {
        player2.score += 1;
        player1.x=90;
        player1.y=360;
        player2.x=1290;
        player2.y=360;
        ball = new Ball(700, 400, 10, 'white');
        ball.dx = 0.75;
    }

    if (ball.x > 1395) {
        player1.score += 1;
        player1.x=90;
        player1.y=360;
        player2.x=1290;
        player2.y=360;
        ball = new Ball(700, 400, 10, 'white');
        ball.dx = -0.75;
    }
    // ai move
    if (player2.y > ball.y - 40) {
        if (ball.dx > 0) player2.y -= playerSpeed/(6+round);
        else player2.y -= playerSpeed/20;

        if(player2.y<0)player2.y=0;
    }
    if (player2.y < ball.y - 40) {
        if (ball.dx > 0) player2.y += playerSpeed/5;
        else player2.y += playerSpeed/20;
        if(player2.y>720)player2.y=720;
    }

    // Handle the end of round transition
    // Check to see if the player won the round.
    if (player1.score === rounds[round]) {
        // Check to see if there are any more rounds/levels left and display the victory screen if
        // there are not.
        if (!rounds[round + 1]) {
            isGameStarted = false;
            message.innerText = "Winner!";
            setTimeout(() => {
                reset();
            }, 2000);
        } else {
            // If there is another round, reset all the values and increment the round number.
            player1.score = player2.score = 0;
            playerSpeed+=5;
            ballVx+=0.2;
            ballVy+=0.1;
            round += 1;
        }
    }
    // Check to see if the ai/AI has won the round.
    else if (player2.score === rounds[round]) {
        isGameStarted = false;
        message.innerText = "Game Over!";
            setTimeout(() => {
                reset();
            }, 2000);
    }

    draw();
    if(isGameStarted){
        requestAnimationFrame(updateComputer);
    }
    else{
        ctx.clearRect(0, 0, 1400, 800);
    }
}

function draw() {
    ctx.clearRect(0, 0, 1400, 800);

    ctx.fillStyle = colors[round];
 
    // Draw the background
    ctx.fillRect(
        0,
        0,
        1400,
        800
    );

    player1.draw(ctx);
    player2.draw(ctx);
    ball.draw(ctx);

    // center line
    ctx.strokeStyle = 'white';
    ctx.beginPath();
    ctx.setLineDash([10, 10])
    ctx.moveTo(700, 5);
    ctx.lineTo(700, 795);
    ctx.stroke();

    // write round
    ctx.fillStyle = 'black';
    ctx.fillText(`Round- ${round+1}`, 660, 30)
}

function reset(){
    ctx.clearRect(0, 0, 1400, 800);
    message.innerText ="";
    playOnlineBtn.style.display = 'block';
    playofflineBtn.style.display = 'block';
    round =0;
    playerSpeed=10;
    ballVx=0.80;
    ballVy=0.75;
}