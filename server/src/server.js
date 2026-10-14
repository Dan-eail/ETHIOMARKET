import http from 'http'
import { Server } from 'socket.io'
import app from './app.js'
import { config } from './config/env.js'
import prisma from './config/database.js'

const server = http.createServer(app)

const io = new Server(server, {
  cors: {
    origin: config.clientOrigin || '*',
    methods: ['GET', 'POST']
  }
})

// Real-time Socket.IO communication
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`)

  socket.on('join_user', (userId) => {
    socket.join(`user:${userId}`)
  })

  socket.on('join_conversation', (convId) => {
    socket.join(`conv:${convId}`)
  })

  socket.on('send_message', (data) => {
    // Broadcast to conversation room
    io.to(`conv:${data.conversationId}`).emit('new_message', data)
  })

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`)
  })
})

const PORT = config.port

server.listen(PORT, () => {
  console.log(`🌾 EthioMarket API Server running in ${config.nodeEnv} mode on port ${PORT}`)
  console.log(`🚀 Health Check: http://localhost:${PORT}/api/v1/health`)
})

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing database connections...')
  await prisma.$disconnect()
  server.close(() => {
    console.log('Server shut down cleanly.')
  })
})
