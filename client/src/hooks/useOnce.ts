import {useEffect, useRef} from 'react'

/**
 * Executes a callback function only once based on the dependency array.
 *
 * @param {() => void} callback - The callback function to be executed.
 * @param {any[]} deps - The dependency array to trigger the callback execution.
 */
function useOnce(callback: () => void, deps: any[]) {
	const hasRun = useRef(false)

	useEffect(() => {
		if (!hasRun.current) {
			callback()
			hasRun.current = true
		}
	}, deps)
}

export default useOnce
