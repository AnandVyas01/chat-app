const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const {generateMessage, generateLocation} = require('./utils/messages')
const {
    addUser,
    removeUser,
    getUser,
    getUsersInRoom
} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);


const port  = process.env.PORT || 3000 ;
const publicDirectoryPath = path.join(__dirname , '../public');

app.use(express.static(publicDirectoryPath));

// const message = 'Welcome!'
io.on('connection', (socket)=>{
    console.log('new connection added.');
    // socket.emit('Message' , generateMessage('Welcome!'));
    // socket.broadcast.emit('Message', generateMessage('A new user has joined !'))
    socket.on('join', ({username, room}, callback)=>{
        const {error, user} = addUser({id:socket.id , username , room});
        if(error){
            return callback(error);
        }
        socket.join(user.room);
        socket.emit('Message' , generateMessage('Admin', `Welcome ${user.username} !`));
        socket.broadcast.to(user.room).emit('Message', generateMessage('Admin', `${user.username} has joined !`))
        callback()

        io.to(user.room).emit('roomData', {
            room : user.room,
            user: getUsersInRoom(user.room)
        })
    })
    socket.on('sendMessage', (message, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('Message', generateMessage(user.username, message));
        callback('Messages Delivered !')
    });
    socket.on('sendLocation', (coordinates, callback)=>{
        const user = getUser(socket.id);
        io.to(user.room).emit('LocationMessage', generateLocation(user.username, `https://google.com/maps?q=${coordinates.latitude},${coordinates.longitude}`));
        callback('Location delivered!')
    })
    socket.on('disconnect', ()=>{
        const user = removeUser(socket.id);
        io.to(user.room).emit('roomData', {
            room : user.room,
            user: getUsersInRoom(user.room)
        })
        if(user){
            io.to(user.room).emit('Message', generateMessage('Admin', `${user.username} has left!`))
        }
    });
});

server.listen(port, ()=>{
    console.log('Started the server!!');
});