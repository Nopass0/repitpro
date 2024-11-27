import {useState, useEffect, useCallback} from 'react'
import {useDispatch} from 'react-redux'
import {Student, NavigationState, Item} from './types'
import {studentApi} from './api'

interface UseStudentNavigationProps {
	initialStudentId?: string
}

interface UseStudentNavigationReturn {
	// Navigation state
	currentStudent: Student | null
	currentItem: Item | null
	navigationState: NavigationState
	loading: boolean
	error: Error | null

	// Navigation actions
	nextStudent: () => Promise<void>
	previousStudent: () => Promise<void>
	nextItem: () => void
	previousItem: () => void

	// Data actions
	refreshCurrentStudent: () => Promise<void>
	updateStudent: (data: Partial<Student>) => Promise<void>
	archiveStudent: () => Promise<void>
	deleteStudent: () => Promise<void>
}

export const useStudentNavigation = ({
	initialStudentId,
}: UseStudentNavigationProps): UseStudentNavigationReturn => {
	const dispatch = useDispatch()

	// State
	const [students, setStudents] = useState<string[]>([])
	const [currentStudent, setCurrentStudent] = useState<Student | null>(null)
	const [currentItemIndex, setCurrentItemIndex] = useState(0)
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<Error | null>(null)

	// Derived state
	const currentItem = currentStudent?.items[currentItemIndex] || null
	const currentStudentIndex = currentStudent
		? students.indexOf(currentStudent.id)
		: -1

	const navigationState: NavigationState = {
		currentStudentIndex: currentStudentIndex,
		currentItemIndex,
		totalStudents: students.length,
		totalItems: currentStudent?.items.length || 0,
	}

	// Load initial data
	useEffect(() => {
		const loadInitialData = async () => {
			try {
				setLoading(true)
				const response = await studentApi.getAllStudents()
				setStudents(response.students.map((s) => s.id))

				if (initialStudentId) {
					const student = await studentApi.getStudentById(initialStudentId)
					setCurrentStudent(student)
				}
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error('Failed to load students'),
				)
			} finally {
				setLoading(false)
			}
		}

		loadInitialData()
	}, [initialStudentId])

	// Navigation methods
	const nextStudent = useCallback(async () => {
		if (currentStudentIndex < students.length - 1) {
			try {
				setLoading(true)
				const nextId = students[currentStudentIndex + 1]
				const student = await studentApi.getStudentById(nextId)
				setCurrentStudent(student)
				setCurrentItemIndex(0)

				// Update Redux state if needed
				dispatch({type: 'SET_CURRENT_OPENED_STUDENT', payload: nextId})
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error('Failed to load next student'),
				)
			} finally {
				setLoading(false)
			}
		}
	}, [currentStudentIndex, students, dispatch])

	const previousStudent = useCallback(async () => {
		if (currentStudentIndex > 0) {
			try {
				setLoading(true)
				const prevId = students[currentStudentIndex - 1]
				const student = await studentApi.getStudentById(prevId)
				setCurrentStudent(student)
				setCurrentItemIndex(0)

				// Update Redux state if needed
				dispatch({type: 'SET_CURRENT_OPENED_STUDENT', payload: prevId})
			} catch (err) {
				setError(
					err instanceof Error
						? err
						: new Error('Failed to load previous student'),
				)
			} finally {
				setLoading(false)
			}
		}
	}, [currentStudentIndex, students, dispatch])

	const nextItem = useCallback(() => {
		if (currentStudent && currentItemIndex < currentStudent.items.length - 1) {
			setCurrentItemIndex((prev) => prev + 1)
		}
	}, [currentStudent, currentItemIndex])

	const previousItem = useCallback(() => {
		if (currentItemIndex > 0) {
			setCurrentItemIndex((prev) => prev - 1)
		}
	}, [currentItemIndex])

	// Data methods
	const refreshCurrentStudent = useCallback(async () => {
		if (currentStudent) {
			try {
				setLoading(true)
				const refreshedStudent = await studentApi.getStudentById(
					currentStudent.id,
				)
				setCurrentStudent(refreshedStudent)
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error('Failed to refresh student'),
				)
			} finally {
				setLoading(false)
			}
		}
	}, [currentStudent])

	const updateStudent = useCallback(
		async (data: Partial<Student>) => {
			if (currentStudent) {
				try {
					setLoading(true)
					const updatedStudent = await studentApi.updateStudent(
						currentStudent.id,
						data,
					)
					setCurrentStudent(updatedStudent)
				} catch (err) {
					setError(
						err instanceof Error ? err : new Error('Failed to update student'),
					)
				} finally {
					setLoading(false)
				}
			}
		},
		[currentStudent],
	)

	const archiveStudent = useCallback(async () => {
		if (currentStudent) {
			try {
				setLoading(true)
				await studentApi.archiveStudent(currentStudent.id)
				// Optionally navigate to next student or refresh list
				await nextStudent()
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error('Failed to archive student'),
				)
			} finally {
				setLoading(false)
			}
		}
	}, [currentStudent, nextStudent])

	const deleteStudent = useCallback(async () => {
		if (currentStudent) {
			try {
				setLoading(true)
				await studentApi.deleteStudent(currentStudent.id)
				// Navigate to next student or refresh list
				await nextStudent()
			} catch (err) {
				setError(
					err instanceof Error ? err : new Error('Failed to delete student'),
				)
			} finally {
				setLoading(false)
			}
		}
	}, [currentStudent, nextStudent])

	return {
		currentStudent,
		currentItem,
		navigationState,
		loading,
		error,
		nextStudent,
		previousStudent,
		nextItem,
		previousItem,
		refreshCurrentStudent,
		updateStudent,
		archiveStudent,
		deleteStudent,
	}
}
