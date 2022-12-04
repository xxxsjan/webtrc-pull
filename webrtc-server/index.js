const app = require('express')();
const fs = require('fs');
const { rename } = require('fs/promises');
const path = require('path');
const { Server } = require('socket.io');

const key = fs.readFileSync(path.resolve(__dirname, './assets/localhost+3-key.pem'));
const cert = fs.readFileSync(path.resolve(__dirname, './assets/localhost+3.pem'));

const allowCors = function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
};
app.use(allowCors);

const https = require('https').createServer({ key, cert }, app);
// 监听3005端口
https.listen(3001, '0.0.0.0', function () {
  console.log('https://192.168.1.103:3001');
});

// const http = require('http');
// const httpServer = http.createServer(app);
// httpServer.listen(port, '0.0.0.0', () => {
//   console.log('run at http://192.168.1.103:3002');
// });

const io = new Server(https, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: '*',
    credentials: true,
  },
  allowEIO3: true,
  transport: ['websocket'],
});
const userList = [];
io.on('connection', (socket) => {
  console.log('connection~', socket.id, JSON.stringify(socket.handshake.query));
  // console.log(socket.id, socket.rooms);
  socket.on('join', (roomId) => {
    console.log(socket.id, 'join in', roomId);
    socket.join(roomId); // 大厅聊天
    socket.emit('new', socket.id, roomId); // 通知自己
    socket.to(roomId).emit('new', socket.id); // 通知别人
  });

  // 用户离开房间
  socket.on('leave', (data) => {
    console.log('leave', data);
  });
  //消息中转
  socket.on('message', (message) => {
    console.log('--message', '--socket.id', socket.id, '--target:' + message.target, '--data-type:' + message.data.type);
    if (message.target) {
      socket.to(message.target).emit('message', {
        originId: socket.id,
        data: message.data,
      });
    } else {
      // console.log('!target');
      // socket.broadcast.to('demo').emit('message', {
      //   originId: socket.id,
      //   data: message.data,
      // });
    }
  });

  // 222222222222222222222222222222222222222222
  socket.on('offer', async (offer, cb) => {
    console.log('offer', socket.id);
    socket.to(offer.id).emit('offer', offer);
    cb && cb({ status: 'ok' });
  });

  socket.on('answer', async (answer, cb) => {
    socket.to(answer.id).emit('answer', answer);
    cb && cb();
  });
  socket.on('candidate', async (candidate) => {
    console.log('candidate: ');
    socket.to(candidate.id).emit('candidate', candidate);
  });

  // 333333333333333333333333333333333333333333333333333333333
  socket.on('open-live', async (data) => {
    console.log('open-live: ');
    socket.join(data.roomId);
    socket.emit('live-msg', {
      msg: '开播成功',
    });
  });

  socket.on('enter-live', async (data) => {
    userList.push(socket.id);
    console.log('userList: ', userList);
    socket.join(data.roomId);
    socket.to(data.roomId).emit('new', data.id);
  });
  socket.on('live-offer', async (data) => {
    console.log('live-offer: ');
    socket.to(data.id).emit('offer', data);
  });
  socket.on('live-answer', async (data) => {
    console.log('live-answer: ');
    socket.to(data.id).emit('answer', data);
  });
  socket.on('live-candidate', async (data) => {
    console.log('live-candidate', data.origin, data.id);
    socket.to(data.id).emit('candidate', data);
  });

  socket.on('get-looker', (data) => {
    console.log(userList);
    io.to(data.roomId).emit('get-looker', { list: userList });
  });
});
