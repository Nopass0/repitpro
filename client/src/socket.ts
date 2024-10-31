import {io} from 'socket.io-client'

// Check if this is a server or local machine
export const isServer = window.location.hostname !== 'localhost'

const protocol = isServer ? 'https' : 'http'
const socket = io(
	`${protocol}://${window.location.hostname}${!isServer ? ':3000' : ''}`,
	{
		transports: ['websocket', 'polling'],
		upgrade: true,
		rememberUpgrade: true,
		timeout: 10000,
		withCredentials: true,
		autoConnect: true,
		reconnection: true,
		reconnectionAttempts: 5,
		reconnectionDelay: 1000,
		reconnectionDelayMax: 5000,
		extraHeaders: {
			'Access-Control-Allow-Origin': window.location.origin,
		},
	},
)

socket.on('connect_error', (error) => {
	console.error('Connection error:', error)
})

socket.on('connect', () => {
	console.log('Connected to server')
})

socket.on('disconnect', (reason) => {
	console.log('Disconnected:', reason)
})

socket.on('error', (error) => {
	console.error('Socket error:', error)
})

export default socket
