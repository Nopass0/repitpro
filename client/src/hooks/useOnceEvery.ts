import {useEffect, useRef} from 'react'

/**
 * Executes a callback function only once based on the dependency array.
 *
 * @param {() => void} callback - The callback function to be executed.
 * @param {any[]} deps - The dependency array to trigger the callback execution.
 */
function useOnceEvery(callback: () => void, deps: any[]) {
	const hasRun = useRef(false)
	const previousDeps = useRef(deps)

	useEffect(() => {
		const allDepsChanged = deps.every(
			(dep, index) => dep !== previousDeps.current[index],
		)

		if (allDepsChanged && !hasRun.current) {
			callback()
			hasRun.current = true
		}

		previousDeps.current = deps
	}, deps)
}

export default useOnceEvery
