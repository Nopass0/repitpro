import {io} from 'socket.io-client'

//check is this server or local machine
const isServer = window.location.hostname !== 'localhost'

const socket = io('http://localhost:3000')
// const socket = io(isServer ? 'http://0.0.0.0:3000' : 'http://localhost:3000')

export default socket
