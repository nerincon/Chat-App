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
  var username = req.query.username;
  var roomname = req.query.roomname;
  res.render('index.html', {user: username, room:roomname});
});

app.get('/privateroom/', function(req, res){
  var roomname = req.query.roomname;
  var username = req.query.username;

  console.log('line31: '+roomname);
  console.log('line32: '+username);
  res.render('room.html', {room: roomname, user: username});
})

io.on('connection', function(socket){
  var my_room;

  // // ONLY FOR TESTING PURPOSES------------
  // socket.on('testing', function(test){
  //   console.log('trying to send test');
  //   console.log(test);
  //   var teststring = 'This is a testing string for verification';
  //   io.emit('testing', {teststring});
  // });

  connections.push(socket);
  console.log('Connected: %s sockets connected', connections.length);

  //Send Message
  socket.on('send message', function(msg){
    console.log('message: ' + msg.msg);
    console.log('room: ' + msg.room);
    io.to(msg.room).emit('new message', {msg: msg.msg, user: socket.username});
  });

  //New User
  socket.on('new user', function({newUsername, room}) {
    socket.join(room, function () {
      console.log('ROOMS', socket.rooms);
    });
    console.log('room: '+room);
    my_room = room;
    console.log('myRoom: '+ my_room);
    if (!users[room]) {
      users[room] =  [];
      console.log('Any rooms? '+users)
    }
    
    if(newUsername in users[room]){
      console.log('user: '+newUsername + ' already in room' + room)
      
    } else {
    
    socket.username = newUsername;
    console.log('76: '+ newUsername)
    users[room].push(newUsername);
    console.log('user pushed into room: '+users[room]);
    updateUsernames(room);
    io.emit('new user', {users});
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
  console.log("ROOM 101:"+ room)
  console.log("USERS 102:", users)
  io.to(room).emit('get users', users[room]);
}

  // socket.on('get users', function(user){
  //   console.log('from get users new: '+ user);
  //   io.to(room).emit('testing', {teststring});
  // });

http.listen(8080, function () {
  console.log('Listening on port 8080');
});