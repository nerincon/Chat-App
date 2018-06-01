const express = require('express');
const nunjucks = require('nunjucks');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var users = {};
var connections = [];


nunjucks.configure('views', {
  autoescape: true,
  express: app,
  noCache: true
});



app.use('/socket-io',
  express.static('node_modules/socket.io-client/dist'));

app.get('/', function (req, res) {
  res.render('index.html');
});

app.get('/privateroom/', function(req, res){
  var roomname = req.query.roomname;
  var username = req.query.username;

  console.log(roomname);
  console.log(username);
  res.render('room.html', {room: roomname, user: username});
})

io.on('connection', function(socket){
  var my_room;

  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  //Send Message
  socket.on('send message', function(msg){
    console.log('message: ' + msg.msg);
    console.log('room: ' + msg.room);
    io.to(msg.room).emit('new message', {msg: msg.msg, user: socket.username});
  });

  //New User
  socket.on('new user', function(data){
    socket.join(data.room);
    my_room = data.room;
    console.log('myRoom: '+ my_room);
    if (!users[data.room]) {
      users[data.room] =  [];
    }

    console.log(users);
    
    if(data.user in users[data.room]){
      console.log(data)
      
    } else {
    
    socket.username = data.user;
    users[data.room].push(data.user);
    console.log(users);
    updateUsernames(data.room);
    }
  });

  socket.on('join-room', function(room){
    socket.join(room, function() {
      console.log('ROOMS', socket.rooms);
      io.to(room).emit('chat-msg', '**new user joined**');
    });
  });

  //Disconnect
  socket.on('disconnect', function(){
    if(!socket.username){return}
    users[my_room].splice(users[my_room].indexOf(socket.username), 1);
    updateUsernames();
    connections.splice(connections.indexOf(socket), 1);
    console.log('Disconnected: %s sockets connected', connections.length);
  });
});

function updateUsernames(room) {
  io.to(room).emit('get users', users[room]);
}

http.listen(8080, function () {
  console.log('Listening on port 8080');
});