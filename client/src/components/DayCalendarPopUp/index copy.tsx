import s from './index.module.scss'
import Line from '../Line'
import CloseIcon from '@mui/icons-material/Close'
import DayCalendarLine from '../DayCalendarLine/index'
import * as mui from '@mui/base'

import {useDispatch, useSelector} from 'react-redux'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import socket from '../../socket'
import React from 'react'
import {debounce} from 'lodash'

import Arrow, {ArrowType} from '../../assets/arrow'
import DayCalendarLineClient from '../DayCalendarLineClient'
import ExitPopUp from '../ExitPopUp'
import ReactDOM from 'react-dom'
import {EPagePopUpExit} from '@/types'

interface IDayCalendarPopUp {
	style?: React.CSSProperties
	onExit?: () => void
	iconClick?: () => void
	LineClick?: () => void
	className?: string
}

const calculateStatistics = (students, clients, hiddenNum) => {
	// Only count non-canceled lessons
	const activeStudents = students.filter((student) => !student.isCancel)

	return {
		lessonsCount: activeStudents.length,
		lessonsTotal: activeStudents.reduce(
			(sum, student) => sum + Number(student.costOneLesson || 0),
			0,
		),
		worksCount: clients?.length || 0,
		worksTotal:
			clients?.reduce(
				(sum, client) => sum + Number(client.workPrice || 0),
				0,
			) || 0,
	}
}
const calculatePaymentStatus = (student, currentDate) => {
	let sortedPrePay = []
	if (Array.isArray(student.prePay)) {
		sortedPrePay = [...student.prePay].sort(
			(a, b) => new Date(a.date) - new Date(b.date),
		)
	} else if (typeof student.prePay === 'object' && student.prePay !== null) {
		sortedPrePay = [student.prePay].sort(
			(a, b) => new Date(a.date) - new Date(b.date),
		)
	}

	let sortedHistory =
		Array.isArray(student.history) &&
		student.history.length > 0 &&
		Array.isArray(student.history[0].historyLessons)
			? [...student.history[0].historyLessons].sort(
					(a, b) => new Date(a.date) - new Date(b.date),
				)
			: []

	let balance = 0

	sortedPrePay.forEach((pay) => {
		if (new Date(pay.date) <= currentDate) {
			balance += parseFloat(pay.cost || 0)
		}
	})

	const todayLesson = sortedHistory.find(
		(lesson) =>
			new Date(lesson.date).toDateString() === currentDate.toDateString(),
	)

	let isPaid = false
	if (todayLesson) {
		if (balance >= parseFloat(todayLesson.price || 0)) {
			isPaid = true
			balance -= parseFloat(todayLesson.price || 0)
		}
	}

	return isPaid
}

// Функция для создания даты из дня, месяца и года
const createDate = (
	day: string | number,
	month: string | number,
	year: string | number,
): Date => {
	// Убираем ведущие нули и конвертируем в числа
	const normalizedDay = parseInt(String(day).replace(/^0+/, ''))
	const normalizedMonth = parseInt(String(month).replace(/^0+/, ''))
	const normalizedYear = parseInt(String(year))

	return new Date(Date.UTC(normalizedYear, normalizedMonth - 1, normalizedDay))
}

// Функция для нормализации даты
const normalizeDate = (date: Date | string): Date => {
	const d = date instanceof Date ? date : new Date(date)
	return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
}

// Функция для сравнения дат
const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
	try {
		const d1 = normalizeDate(date1)
		const d2 = normalizeDate(date2)

		return (
			d1.getUTCDate() === d2.getUTCDate() &&
			d1.getUTCMonth() === d2.getUTCMonth() &&
			d1.getUTCFullYear() === d2.getUTCFullYear()
		)
	} catch (error) {
		console.error('Date comparison error:', error)
		return false
	}
}

const getLessonPaidStatus = (
	student,
	selectedDay,
	selectedMonth,
	selectedYear,
) => {
	// Проверяем наличие истории занятий
	if (!student?.history?.[0]?.historyLessons) {
		return false
	}

	// Создаем дату для сравнения (убираем ведущие нули)
	const compareDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(selectedDay).padStart(2, '0')}`
	console.log(`\nCompare date : ${compareDate}\n`)
	// Ищем занятие на выбранную дату и проверяем isPaid
	let isPaid = student.history[0].historyLessons.some((lesson) => {
		const lessonDate = new Date(lesson.date).toISOString().split('T')[0]
		return lessonDate === compareDate && lesson.isPaid
	})

	console.log(`\nIs paid : ${isPaid}\n`)

	return isPaid
}

const DayCalendarPopUp = ({
	style,
	onExit,
	iconClick,
	LineClick,
	className,
}: IDayCalendarPopUp) => {
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)

	// Создаем мемоизированную нормализованную дату
	const normalizedSelectedDate = useMemo(() => {
		return normalizeDate(
			calendarNowPopupDay,
			calendarNowPopupMonth,
			calendarNowPopupYear,
		)
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear])
	const [currentDate] = useState(new Date())
	const currentMonth = useSelector((state: any) => state.currentMonth)
	const currentYear = useSelector((state: any) => state.currentYear)
	const currentOpenedStudent = useSelector(
		(state: any) => state.currentOpenedStudent,
	)
	const currentScheduleDay = useSelector(
		(state: any) => state.currentScheduleDay,
	)
	const details = useSelector((state: any) => state.details)
	const isEditDayPopUp = useSelector((state: any) => state.isEditDayPopUp)
	const hiddenNum = useSelector((state: any) => state.hiddenNum)
	const dispath = useDispatch()
	//for date mode
	const months = [
		'Январь',
		'Февраль',
		'Март',
		'Апрель',
		'Май',
		'Июнь',
		'Июль',
		'Август',
		'Сентябрь',
		'Октябрь',
		'Ноябрь',
		'Декабрь',
	]

	const [editMode, setEditMode] = React.useState(false)
	const user = useSelector((state: any) => state.user)
	const token = user.token
	const [pagePopup, setPagePopup] = useState<EPagePopUpExit>(
		EPagePopUpExit.None,
	)
	const dayPopUpExit = useSelector((state: any) => state.dayPopUpExit)
	const [students, setStudents] = React.useState<
		{
			nameStudent: string
			costOneLesson: string
			studentId: string
			place: string
			itemName: string
			tryLessonCheck: boolean
			groupName?: string
			id: string
			typeLesson: string
			startTime: {hour: number; minute: number}
			endTime: {hour: number; minute: number}
			type: string
		}[]
	>([])

	const [clients, setClients] = React.useState<any[]>()
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const dispatch = useDispatch()
	const retryCountRef = useRef(0)
	const mountedRef = useRef(false)

	// const statistics = useMemo(() => {
	// 	return calculateStatistics(students, clients, hiddenNum)
	// }, [students, clients, hiddenNum])

	const [statistics, setStatistics] = useState(() =>
		calculateStatistics(students, clients, hiddenNum),
	)

	useEffect(() => {
		setStatistics(calculateStatistics(students, clients, hiddenNum))
	}, [students, clients, hiddenNum])

	const [isEditCard, setIsEditCard] = useState<boolean>(false)
	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	const handleCancelLesson = useCallback(
		(id: string) => {
			setStudents((prevStudents) => {
				const newStudents = prevStudents.map((student) =>
					student.id === id
						? {...student, isCancel: !student.isCancel}
						: student,
				)

				// Immediately update statistics based on the new state
				const newStats = calculateStatistics(newStudents, clients, hiddenNum)
				setStatistics(newStats)

				return newStudents
			})
		},
		[clients, hiddenNum],
	)

	const Footer = () => (
		<footer className={s.Footer}>
			<div className={s.Left}>
				<div className={s.Lessons}>
					<p>
						Занятий: <b>{statistics.lessonsCount}</b>
					</p>
					{!hiddenNum && <b>{statistics.lessonsTotal}₽</b>}
				</div>
				<div className={s.works}>
					<p>
						Работ: <b>{statistics.worksCount}</b>
					</p>
					{!hiddenNum && <b>{statistics.worksTotal}₽</b>}
				</div>
			</div>
			<div className={s.income}>
				{!hiddenNum && (
					<p>
						Доход: <b>{statistics.lessonsTotal}₽</b>
					</p>
				)}
			</div>
		</footer>
	)

	const fetchData = useCallback(() => {
		console.log('Fetching data...')
		setIsLoading(true)
		setError(null)

		const params = {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
			studentId: currentOpenedStudent, // Добавьте это поле
			scheduleId: currentScheduleDay, // Добавьте это поле
		}

		socket.emit('getStudentsByDate', params)
		socket.emit('getClientsByDate', params)
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

	useEffect(() => {
		let timeoutId: NodeJS.Timeout

		const handleStudentsData = (data: any) => {
			console.log('Received students data:', data)
			if (mountedRef.current) {
				setStudents(data)
				setIsLoading(false)
				clearTimeout(timeoutId)
				retryCountRef.current = 0 // Reset retry count on successful fetch
			}
		}

		const handleClientsData = (data: any) => {
			console.log('Received clients data:', data)
			if (mountedRef.current) {
				setClients(data)
				setIsLoading(false)
				clearTimeout(timeoutId)
				retryCountRef.current = 0 // Reset retry count on successful fetch
			}
		}

		const retryFetch = () => {
			if (retryCountRef.current < 4) {
				// We've already tried once, so we'll retry up to 4 more times
				retryCountRef.current++
				fetchData()
			} else {
				if (mountedRef.current) {
					setError('Failed to fetch data after 5 attempts')
					setIsLoading(false)
				}
			}
		}

		fetchData()

		timeoutId = setTimeout(() => {
			if (isLoading) {
				console.log('Data fetch timeout, retrying...')
				retryFetch()
			}
		}, 5000) // 5 seconds timeout

		socket.on('getStudentsByDate', handleStudentsData)
		socket.on('getClientsByDate', handleClientsData)

		return () => {
			socket.off('getStudentsByDate', handleStudentsData)
			socket.off('getClientsByDate', handleClientsData)
			clearTimeout(timeoutId)
		}
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

	// New state to track temporary lines
	const [tempStudents, setTempStudents] = React.useState<
		Array<{
			id: string
			nameStudent: string
			costOneLesson: string
			itemName: string
			studentId: string
			typeLesson: string
			tryLessonCheck: boolean
			startTime: {hour: number; minute: number}
			endTime: {hour: number; minute: number}
			isTemp?: boolean // New flag to mark temporary entries
		}>
	>([])

	// Функция для сортировки студентов по времени начала занятия
	const sortStudentsByStartTime = (studentsToSort) => {
		return [...studentsToSort].sort((a, b) => {
			const aTime = a.startTime.hour * 60 + a.startTime.minute
			const bTime = b.startTime.hour * 60 + b.startTime.minute
			return aTime - bTime
		})
	}

	// Modified handleAddStudentDay to use temporary storage
	const handleAddStudentDay = () => {
		socket.emit('createStudentSchedule', {
			token: token,
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
		})

		socket.once('createStudentSchedule', (data: any) => {
			if (data.created) {
				const newTempStudent = {
					id: data.created,
					nameStudent: '',
					costOneLesson: '0',
					itemName: '',
					studentId: '',
					typeLesson: '1',
					tryLessonCheck: false,
					startTime: {hour: 0, minute: 0},
					endTime: {hour: 0, minute: 0},
					isTemp: true,
				}

				setTempStudents((prev) => [...prev, newTempStudent])
			}
		})
	}

	// Modified onUpdate to track changes in temporary lines
	// const onUpdate = (
	// 	id: string,
	// 	editIcon: string,
	// 	editName: string,
	// 	editTimeStart: string,
	// 	editTimeEnd: string,
	// 	editItem: string,
	// 	editPrice: string,
	// 	isDelete: boolean,
	// 	studentId: string,
	// ) => {
	// 	const [startHour, startMinute] = editTimeStart.split(':')
	// 	const [endHour, endMinute] = editTimeEnd.split(':')

	// 	// Check if we're updating a temporary line
	// 	const isTempLine = tempStudents.some((student) => student.id === id)

	// 	if (isTempLine) {
	// 		setTempStudents((prev) =>
	// 			prev.map((student) =>
	// 				student.id === id
	// 					? {
	// 							...student,
	// 							nameStudent: editName,
	// 							costOneLesson: editPrice,
	// 							itemName: editItem,
	// 							typeLesson: editIcon,
	// 							startTime: {
	// 								hour: parseInt(startHour),
	// 								minute: parseInt(startMinute),
	// 							},
	// 							endTime: {
	// 								hour: parseInt(endHour),
	// 								minute: parseInt(endMinute),
	// 							},
	// 							studentId,
	// 						}
	// 					: student,
	// 			),
	// 		)
	// 	} else {
	// 		// Update regular students as before
	// 		const updatedStudents = students.map((student) =>
	// 			student.id === id
	// 				? {
	// 						...student,
	// 						nameStudent: editName,
	// 						costOneLesson: editPrice,
	// 						itemName: editItem,
	// 						typeLesson: editIcon,
	// 						startTime: {
	// 							hour: parseInt(startHour),
	// 							minute: parseInt(startMinute),
	// 						},
	// 						endTime: {
	// 							hour: parseInt(endHour),
	// 							minute: parseInt(endMinute),
	// 						},
	// 						studentId,
	// 					}
	// 				: student,
	// 		)
	// 		setStudents(updatedStudents)
	// 	}
	// }

	// const onUpdate = (
	// 	id: string,
	// 	editIcon: string,
	// 	editName: string,
	// 	editTimeStart: string,
	// 	editTimeEnd: string,
	// 	editItem: string,
	// 	editPrice: string,
	// 	isDelete: boolean,
	// 	studentId: string,
	// 	isCancel: boolean,
	// ) => {
	// 	const [startHour, startMinute] = editTimeStart.split(':')
	// 	const [endHour, endMinute] = editTimeEnd.split(':')

	// 	// Создаем обновленного студента
	// 	const updatedStudent = {
	// 		nameStudent: editName,
	// 		costOneLesson: editPrice,
	// 		itemName: editItem,
	// 		typeLesson: editIcon,
	// 		startTime: {
	// 			hour: parseInt(startHour),
	// 			minute: parseInt(startMinute),
	// 		},
	// 		endTime: {
	// 			hour: parseInt(endHour),
	// 			minute: parseInt(endMinute),
	// 		},
	// 		studentId,
	// 		isCancel,
	// 	}

	// 	// Обновляем состояние локально
	// 	setStudents((prevStudents) =>
	// 		prevStudents.map((student) =>
	// 			student.id === id ? {...student, ...updatedStudent} : student,
	// 		),
	// 	)
	// }

	const onUpdate = (
		id: string,
		editIcon: string,
		editName: string,
		editTimeStart: string,
		editTimeEnd: string,
		editItem: string,
		editPrice: string,
		isDelete: boolean,
		studentId: string,
		isCancel: boolean,
	) => {
		const [startHour, startMinute] = editTimeStart.split(':')
		const [endHour, endMinute] = editTimeEnd.split(':')

		// Create the updated student object
		const updatedStudent = {
			nameStudent: editName,
			costOneLesson: editPrice,
			itemName: editItem,
			typeLesson: editIcon,
			startTime: {
				hour: parseInt(startHour),
				minute: parseInt(startMinute),
			},
			endTime: {
				hour: parseInt(endHour),
				minute: parseInt(endMinute),
			},
			studentId,
			isCancel,
		}

		// Update local state
		setStudents((prevStudents) =>
			prevStudents.map((student) =>
				student.id === id ? {...student, ...updatedStudent} : student,
			),
		)

		// Notify other components about the change
		socket.emit('studentScheduleChanged', {
			id,
			...updatedStudent,
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})

		// Update AddStudent component and other related components
		dispatch({type: 'SET_UPDATE_CARD', payload: true})

		// Emit an event to update related components
		socket.emit('updateRelatedComponents', {
			type: 'FIELD_CHANGED',
			payload: {
				id,
				field: 'all', // indicates all fields have potentially changed
				value: updatedStudent,
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
			},
			token: token,
		})
	}

	// Обновляем useEffect для обработки данных
	useEffect(() => {
		const handleStudentsData = (data: any) => {
			console.log('Received students data:', data)
			if (mountedRef.current) {
				// Нормализуем данные перед установкой
				const normalizedData = data.map((student) => ({
					...student,
					isCancel: Boolean(student.isCancel),
					costOneLesson: student.costOneLesson || '0',
					tryLessonCheck: Boolean(student.tryLessonCheck),
				}))
				setStudents(normalizedData)
				setIsLoading(false)
			}
		}

		const handleClientsData = (data: any) => {
			if (mountedRef.current) {
				setClients(data || [])
				setIsLoading(false)
			}
		}

		socket.on('getStudentsByDate', handleStudentsData)
		socket.on('getClientsByDate', handleClientsData)

		// Запрашиваем начальные данные
		if (token) {
			fetchData()
		}

		return () => {
			socket.off('getStudentsByDate', handleStudentsData)
			socket.off('getClientsByDate', handleClientsData)
		}
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

	const handleSend = async () => {
		const filledTempStudents = tempStudents.filter(
			(student) =>
				student.nameStudent &&
				student.itemName &&
				(student.startTime.hour !== 0 || student.startTime.minute !== 0),
		)

		const studentsToSave = [...students, ...filledTempStudents]
		let updatePromises = []

		// Создаем массив промисов для каждого обновления
		studentsToSave.forEach((student) => {
			const promise = new Promise((resolve, reject) => {
				socket.emit('updateStudentSchedule', {
					id: student.id,
					day: calendarNowPopupDay,
					month: calendarNowPopupMonth,
					year: calendarNowPopupYear,
					lessonsPrice: student.costOneLesson || 0,
					studentName: student.nameStudent,
					itemName: student.itemName,
					typeLesson: student.typeLesson,
					startTime: student.startTime,
					endTime: student.endTime,
					isChecked: student.tryLessonCheck,
					isCancel: student.isCancel,
					token: token,
				})

				// Ожидаем ответ от сервера для каждого обновления
				socket.once(`updateStudentSchedule_${student.id}`, (response) => {
					if (response.success) {
						resolve(response)
					} else {
						reject(new Error('Failed to update student schedule'))
					}
				})

				// Добавляем таймаут для каждого запроса
				setTimeout(() => reject(new Error('Update timeout')), 5000)
			})
			updatePromises.push(promise)
		})

		try {
			// Ждем завершения всех обновлений
			await Promise.all(updatePromises)

			// После успешного сохранения всех изменений
			setTempStudents([])
			setEditMode(false)
			dispatch({type: 'SET_IS_EDIT_DAY_POPUP', payload: false})

			// Принудительно запрашиваем свежие данные
			socket.emit('getStudentsByDate', {
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				token: token,
				studentId: currentOpenedStudent, // Добавьте это поле
				scheduleId: currentScheduleDay, // Добавьте это поле
			})

			socket.emit('getClientsByDate', {
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				token: token,
			})
		} catch (error) {
			console.error('Error saving changes:', error)
			// Здесь можно добавить обработку ошибок, например показ уведомления
		}
	}

	// Modified exit handler
	const handleExit = () => {
		if (editMode) {
			const hasUnsavedChanges = tempStudents.some(
				(student) =>
					student.nameStudent ||
					student.itemName ||
					student.startTime.hour !== 0 ||
					student.startTime.minute !== 0,
			)

			if (hasUnsavedChanges) {
				dispatch({
					type: 'SET_DAY_POPUP_EXIT',
					payload: EPagePopUpExit.Exit,
				})
			} else {
				setTempStudents([])
				setEditMode(false)
				onExit?.()
			}
		} else {
			setTempStudents([])
			onExit?.()
		}
	}

	const displayStudents = useMemo(() => {
		const allStudents = [...students, ...tempStudents]
		return allStudents.map((student) => ({
			...student,
			isPaid: getLessonPaidStatus(
				student,
				calendarNowPopupDay,
				calendarNowPopupMonth,
				calendarNowPopupYear,
			),
		}))
	}, [
		students,
		tempStudents,
		calendarNowPopupDay,
		calendarNowPopupMonth,
		calendarNowPopupYear,
	])

	const sortedDisplayStudents = sortStudentsByStartTime(displayStudents)

	//hour or minute to normal view. Ex: 12:3 to 12:03/ 1:5 to 01:05
	const timeNormalize = (time: number) => {
		return time < 10 ? '0' + time : time
	}
	let isEditStudents: boolean
	// const onUpdate = (
	// 	id: string,
	// 	editIcon: string,
	// 	editName: string,
	// 	editTimeStart: string,
	// 	editTimeEnd: string,
	// 	editItem: string,
	// 	editPrice: string,
	// 	isDelete: boolean,
	// 	studentId: string,
	// ) => {
	// 	// Split the editTimeStart into startHour, startMinute
	// 	const [startHour, startMinute] = editTimeStart.split(':')

	// 	// Split the editTimeEnd into endHour, endMinute
	// 	const [endHour, endMinute] = editTimeEnd.split(':')

	// 	console.log('onUpdate', id, editIcon, editName, editTimeStart, editTimeEnd)
	// 	isEditStudents =
	// 		students
	// 			.map((student) =>
	// 				student.id === id
	// 					? (student.nameStudent !== editName ||
	// 							student.costOneLesson !== editPrice ||
	// 							student.itemName !== editItem ||
	// 							student.typeLesson !== editIcon ||
	// 							student.startTime.hour !== parseInt(startHour) ||
	// 							student.startTime.minute !== parseInt(startMinute) ||
	// 							student.endTime.hour !== parseInt(endHour) ||
	// 							student.endTime.minute !== parseInt(endMinute)) &&
	// 						true
	// 					: false,
	// 			)
	// 			.filter((item) => item === true).length > 0

	// 	// Create a new array with the updated student data
	// 	const updatedStudents = students.map((student) =>
	// 		student.id === id
	// 			? {
	// 					...student,
	// 					nameStudent: editName,
	// 					costOneLesson: editPrice,
	// 					itemName: editItem,
	// 					tryLessonCheck: false, // You can update this based on your requirements
	// 					typeLesson: editIcon,
	// 					isDelete: isDelete,
	// 					studentId: studentId,
	// 					startTime: {
	// 						hour: parseInt(startHour),
	// 						minute: parseInt(startMinute),
	// 					},
	// 					endTime: {hour: parseInt(endHour), minute: parseInt(endMinute)},
	// 				}
	// 			: student,
	// 	)

	// 	// Update the students state with the updated data
	// 	setStudents(updatedStudents)
	// }

	// function handleSend(
	// 	students: {
	// 		nameStudent: string
	// 		costOneLesson: string
	// 		studentId: string
	// 		itemName: string
	// 		tryLessonCheck: boolean
	// 		id: string
	// 		typeLesson: string
	// 		startTime: {hour: number; minute: number}
	// 		endTime: {hour: number; minute: number}
	// 	}[],
	// ) {
	// 	console.log(
	// 		students,
	// 		'handleSend',
	// 		token,
	// 		calendarNowPopupDay,
	// 		calendarNowPopupMonth,
	// 		calendarNowPopupYear,
	// 	)
	// 	for (let i = 0; i < students.length; i++) {
	// 		socket.emit('updateStudentSchedule', {
	// 			id: students[i].id,
	// 			day: calendarNowPopupDay,
	// 			month: calendarNowPopupMonth,
	// 			year: calendarNowPopupYear,
	// 			lessonsPrice: students[i].costOneLesson || 0,
	// 			studentName: students[i].nameStudent,
	// 			itemName: students[i].itemName,
	// 			typeLesson: students[i].typeLesson,
	// 			startTime: students[i].startTime,
	// 			endTime: students[i].endTime,
	// 			isChecked: students[i].tryLessonCheck,
	// 			token: token,
	// 		})
	// 	}
	// }

	const updData = (day: string, month: string, year: string) => {
		//remove leading 0
		day = day.replace(/^0+/, '')
		month = month.replace(/^0+/, '')

		dispath({
			type: 'SET_CALENDAR_NOW_POPUP',
			payload: {
				day: day,
				month: month,
				year: year,
			},
		})

		socket.emit('getStudentsByDate', {
			day: day,
			month: month,
			year: year,
			token: token,
		})
		socket.emit('getClientsByDate', {
			day: day,
			month: month,
			year: year,
			token: token,
		})
	}

	const debouncedOnUpdate = debounce(updData, 2)

	const fetchDataForDate = (day, month, year) => {
		setIsLoading(true)
		socket.emit('getStudentsByDate', {day, month, year, token})
		socket.emit('getClientsByDate', {day, month, year, token})
	}

	const handleAddDay = () => {
		const newDate = new Date(
			calendarNowPopupYear,
			Number(calendarNowPopupMonth) - 1,
			calendarNowPopupDay,
		)
		newDate.setDate(newDate.getDate() + 1)

		const newDay = String(newDate.getDate()).padStart(2, '0')
		const newMonth = String(newDate.getMonth() + 1).padStart(2, '0')
		const newYear = String(newDate.getFullYear())

		debouncedOnUpdate(newDay, newMonth, newYear)

		fetchDataForDate(newDay, newMonth, newYear)
	}

	const handlePrevDay = () => {
		const newDate = new Date(
			calendarNowPopupYear,
			Number(calendarNowPopupMonth) - 1,
			calendarNowPopupDay,
		)
		newDate.setDate(newDate.getDate() - 1)

		const newDay = String(newDate.getDate()).padStart(2, '0')
		const newMonth = String(newDate.getMonth() + 1).padStart(2, '0')
		const newYear = String(newDate.getFullYear())

		debouncedOnUpdate(newDay, newMonth, newYear)

		fetchDataForDate(newDay, newMonth, newYear)
	}

	useEffect(() => {
		const handleCreateStudentSchedule = (data: {
			created: string
			nameStudent?: string
			costOneLesson?: string
			itemName?: string
		}) => {
			if (data.created && typeof data.created === 'string') {
				console.log('Received new student schedule:', data)
				setStudents((prevStudents) => {
					// Check if this ID already exists to prevent duplicates
					const exists = prevStudents.some(
						(student) => student.id === data.created,
					)
					if (exists) {
						return prevStudents
					}

					return [
						...prevStudents,
						{
							id: data.created,
							nameStudent: data.nameStudent ?? '',
							costOneLesson: data.costOneLesson ?? '0',
							itemName: data.itemName ?? '',
							studentId: '',
							typeLesson: '1',
							tryLessonCheck: false,
							startTime: {hour: 0, minute: 0},
							endTime: {hour: 0, minute: 0},
							type: 'student',
							isCancel: false,
						},
					]
				})
			}
		}

		socket.on('createStudentSchedule', handleCreateStudentSchedule)

		return () => {
			socket.off('createStudentSchedule', handleCreateStudentSchedule)
		}
	}, []) // Empty dependency array since we're using function reference

	// Отсортированный список студентов
	const sortedStudents = sortStudentsByStartTime(students)
	return (
		<>
			<div
				style={style}
				className={`${!details ? s.wrapper : s.wrapperNoDetails} ${className}`}>
				<div>
					<header className={s.Header}>
						<div className={s.HeaderItems}>
							<div></div>
							<div className={s.dataSlidePicker}>
								<button
									className={s.btn}
									onClick={() => {
										if (!editMode) {
											handlePrevDay()
										} else {
											dispatch({
												type: 'SET_DAY_POPUP_EXIT',
												payload: EPagePopUpExit.Exit,
											})
										}
									}}>
									<span>
										<Arrow direction={ArrowType.left} />
									</span>
								</button>
								<mui.Select
									className={s.muiSelect}
									multiple={true}
									renderValue={(option: mui.SelectOption<number> | null) => {
										return (
											<>
												<p className={s.btnText}>
													{calendarNowPopupDay}{' '}
													{months[Number(calendarNowPopupMonth) - 1]}{' '}
													{calendarNowPopupYear}г.
												</p>
											</>
										)
									}}></mui.Select>

								<button
									className={s.btn}
									onClick={() => {
										if (!editMode) {
											handleAddDay()
										} else {
											dispatch({
												type: 'SET_DAY_POPUP_EXIT',
												payload: EPagePopUpExit.Exit,
											})
										}
									}}>
									<span>
										<Arrow direction={ArrowType.right} />
									</span>
								</button>
							</div>
							<button
								className={s.closeIconWrap}
								onClick={() => {
									if (!editMode) {
										onExit()
									} else {
										console.log(editMode, isEditDayPopUp, 'EXIT')
										dispatch({
											type: 'SET_DAY_POPUP_EXIT',
											payload: EPagePopUpExit.Exit,
										})

										console.log('Exit Yes')
										console.log(editMode, isEditDayPopUp, pagePopup, 'EXIT2')
									}
								}}>
								<CloseIcon className={s.closeIcon} />
							</button>
						</div>
					</header>
					<section className={s.MainBlock}>
						<Line width="700px" className={s.LineHeader} />
						{clients &&
							clients.map((client: any, index: number) => (
								<React.Fragment key={client.id}>
									{client.clientId !== clients[index + 1]?.clientId && (
										<>
											<DayCalendarLineClient
												id={client.clientId}
												key={client.id}
												name={client.studentName}
												price={client.workPrice}
												studentId=""
												item={client.itemName}
												priceCheck={
													client.workStages[0].endPaymentPrice ===
													client.workPrice
														? client.workStages[0].endPaymentPayed
														: client.workStages[0].firstPaymentPayed
												}
												procent={`
                      ${Math.round((client.workPrice / client.totalWorkPrice) * 100)}`}
											/>
											<Line className={s.Line} width="700px" />
										</>
									)}
								</React.Fragment>
							))}

						{sortedStudents.map((student: any) => (
							<React.Fragment key={student._id || student.id}>
								<DayCalendarLine
									key={student._id || student.id}
									id={student.id}
									place={student.place}
									studentId={student.studentId}
									groupId={student.groupId}
									students={students}
									onUpdate={(
										id,
										editIcon,
										editName,
										editTimeStart,
										editTimeEnd,
										editItem,
										editPrice,
										isDelete,
										studentId,
										isCancel,
									) => {
										handleCancelLesson(id)
										onUpdate(
											id,
											editIcon,
											editName,
											editTimeStart,
											editTimeEnd,
											editItem,
											editPrice,
											isDelete,
											studentId,
											isCancel,
										)

										//sleep 1 sec js
										setTimeout(() => {
											handleCancelLesson(id)
										}, 500)

										setStudents((prevStudents) =>
											prevStudents.map((s) =>
												s.id === id
													? {
															...s,
															nameStudent: editName,
															costOneLesson: editPrice,
															itemName: editItem,
															typeLesson: editIcon,
															startTime: {
																hour: parseInt(editTimeStart.split(':')[0]),
																minute: parseInt(editTimeStart.split(':')[1]),
															},
															endTime: {
																hour: parseInt(editTimeEnd.split(':')[0]),
																minute: parseInt(editTimeEnd.split(':')[1]),
															},
															studentId,
															isCancel,
														}
													: s,
											),
										)
									}}
									LineClick={LineClick}
									iconClick={iconClick}
									icon={student.type == 'group' ? 3 : student.typeLesson}
									isCancel={student.isCancel}
									isTrial={student.isTrial}
									editMode={editMode}
									onCancel={handleCancelLesson}
									timeStart={
										timeNormalize(student.startTime.hour) +
										':' +
										timeNormalize(student.startTime.minute)
									}
									timeEnd={
										timeNormalize(student.endTime.hour) +
										':' +
										timeNormalize(student.endTime.minute)
									}
									name={
										student.type == 'student'
											? student.nameStudent
											: student.groupName
									}
									item={student.itemName}
									price={student.costOneLesson}
									prevpay={student.isPaid}
									type={student.type}
								/>
								{/* <Line className={s.Line} width="700px" /> */}
							</React.Fragment>
						))}
						{Array.from({length: 8}).map((_, index: number) => (
							<React.Fragment key={`fake-${index}`}>
								<div className={s.FakeBlock}></div>
								<Line className={s.Line} width="700px" />
							</React.Fragment>
						))}
					</section>
				</div>
				<div>
					<section className={s.ThreeBtnWrapper}>
						<button
							onClick={() => {
								if (!editMode) {
									setEditMode(!editMode)
									dispatch({
										type: 'SET_IS_EDIT_DAY_POPUP',
										payload: true,
									})
								}
							}}
							className={`${s.EditBtn} ${!editMode && s.active}`}>
							Редактировать
						</button>
						<button
							onClick={() => {
								if (!isEditStudents) {
									if (editMode) {
										handleSend(students)
										setEditMode(!editMode)
										dispatch({
											type: 'SET_IS_EDIT_DAY_POPUP',
											payload: false,
										})
										dispatch({type: 'SET_UPDATE_CARD', payload: true})
									}
									console.log(isEditDayPopUp, 'Saved version: ', students)
								} else {
									setIsEditCard(isEditCard)
									dispatch({
										type: 'SET_DAY_POPUP_EXIT',
										payload: EPagePopUpExit.Exit,
									})
								}
							}}
							className={`${s.SaveBtn} ${editMode && s.active}`}>
							Сохранить
						</button>
						{/* <button
							onClick={() => {
								handeleAddStudentDay()
							}}
							className={s.PlusBtn}>
							<img src={Plus} alt={Plus} />
						</button> */}
					</section>
					<footer className={s.Footer}>
						<div className={s.Left}>
							<div className={s.Lessons}>
								<p>
									Занятий:{' '}
									<b>{students.filter((item) => !item.isCancel).length}</b>
								</p>
								{!hiddenNum && (
									<b>
										{students
											.filter((item) => !item.isCancel)
											.reduce((a, b) => +a + +b.costOneLesson, 0)}
										₽
									</b>
								)}
							</div>
							<div className={s.works}>
								<p>
									Работ: <b>{clients && clients.length}</b>
								</p>
								{!hiddenNum && (
									<b>
										{clients && clients.reduce((a, b) => +a + +b.workPrice, 0)}₽
									</b>
								)}
							</div>
						</div>
						<div className={s.income}>
							{!hiddenNum && (
								<p>
									Доход: <b>{statistics.lessonsTotal}₽</b>
								</p>
							)}
						</div>
					</footer>
				</div>
			</div>
			{ReactDOM.createPortal(
				dayPopUpExit === EPagePopUpExit.Exit && editMode && isEditCard && (
					<>
						<div className={s.PopUp__wrapper}>
							<ExitPopUp
								className={s.PopUp}
								title="Сохранить изменения?"
								yes={() => {
									handleSend(students)
									setEditMode(false)
									dispatch({type: 'SET_IS_EDIT_DAY_POPUP', payload: false})
									dispatch({
										type: 'SET_DAY_POPUP_EXIT',
										payload: EPagePopUpExit.None,
									})
									setIsEditCard(false)
									isEditStudents = false
								}}
								no={() => {
									dispatch({
										type: 'SET_DAY_POPUP_EXIT',
										payload: EPagePopUpExit.None,
									})
								}}
							/>
						</div>
					</>
				),
				document.body,
			)}
		</>
	)
}

export default DayCalendarPopUp
