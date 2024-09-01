import {io} from 'socket.io-client'

// Check if this is a server or local machine
const isServer = window.location.hostname !== 'localhost'

const protocol = isServer ? 'https' : 'http'
const socket = io(`${protocol}://${window.location.hostname}`)

export default socket
