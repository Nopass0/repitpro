import {useEffect, useRef} from 'react'
import socket from '../socket'

function useSocketOnce(eventName: string, callback: (data: any) => void) {
	const hasRun = useRef(false)

	useEffect(() => {
		const handler = (data: any) => {
			if (!hasRun.current) {
				callback(data)
				hasRun.current = true
			}
		}

		socket.once(eventName, handler)

		// Cleanup function to remove the listener if the component unmounts
		return () => {
			socket.off(eventName, handler)
		}
	}, [eventName, callback])
}

export default useSocketOnce
