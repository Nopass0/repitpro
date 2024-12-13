import {useState, useEffect, useCallback, useRef} from 'react'
import {addDays, differenceInDays} from 'date-fns'

interface TimeSlot {
	hour: number
	minute: number
}

interface HistoryLesson {
	date: Date
	itemName: string
	isDone: boolean
	price: string
	isPaid: boolean
	isCancel: boolean
	isAutoChecked?: boolean
	timeSlot: {
		startTime: TimeSlot
		endTime: TimeSlot
	}
	isTrial?: boolean
	type?: 'lesson'
}

interface TimeRange {
	startTime: {
		hour: number
		minute: number
	}
	endTime: {
		hour: number
		minute: number
	}
}

interface Timeline {
	id: number
	day: string
	active: boolean
	startTime: {
		hour: number
		minute: number
	}
	endTime: {
		hour: number
		minute: number
	}
	editingStart: boolean
	editingEnd: boolean
	timeRanges: TimeRange[]
}

interface Item {
	itemName: string
	costOneLesson: string
	startLesson: Date
	endLesson: Date
	timeLinesArray: Timeline[]
	tryLessonCheck?: boolean
	trialLessonDate?: Date
	trialLessonTime?: {
		startTime: TimeSlot
		endTime: TimeSlot
	}
	tryLessonCost?: string
}

interface PrePay {
	cost: string
	date: Date
	id: number
	type?: 'prepayment'
}

interface UseHistoryResult {
	combinedHistory: (HistoryLesson | (PrePay & {type: 'prepayment'}))[]
	balance: number
	updateHistory: (items: Item[]) => void
	addPrePay: (prePayCost: string, prePayDate: Date, prePayId?: number) => void
	deletePrePay: (id: number) => void
	editPrePay: (id: number, newDate: Date, newCost: string) => void
	updateCombinedHistory: (history: HistoryLesson[], prePay: PrePay[]) => void
	putCombinedHistory: (combinedHistory: (HistoryLesson | PrePayment)[]) => void
}

const getDay = (date: Date): number => {
	const dayIndex = date.getDay() - 1
	return dayIndex === -1 ? 6 : dayIndex
}

export const useHistory = (
	initialHistory: HistoryLesson[] = [],
	initialPrePay: PrePay[] = [],
	isExistingCard: boolean = false,
): UseHistoryResult => {
	const [history, setHistory] = useState<HistoryLesson[]>(initialHistory)
	const [prePay, setPrePay] = useState<PrePay[]>(() =>
		(initialPrePay || []).map((prepay) => ({
			...prepay,
			date: new Date(prepay.date),
			id: prepay.id || Date.now(),
			cost: String(prepay.cost),
		})),
	)
	const [combinedHistory, setCombinedHistory] = useState<
		(HistoryLesson | (PrePay & {type: 'prepayment'}))[]
	>([])
	const [balance, setBalance] = useState<number>(0)
	const [initialized, setInitialized] = useState(false)

	// Refs for tracking changes and preventing duplicate updates
	const updateSourceRef = useRef<'socket' | 'items' | 'initial' | null>(null)
	const lastUpdateRef = useRef<string>('')
	const prevHistoryRef = useRef(JSON.stringify(history))
	const prevPrePayRef = useRef(JSON.stringify(prePay))

	// Helper function to check if lesson is in the past
	const isLessonEndTimeInPast = useCallback(
		(lesson: HistoryLesson): boolean => {
			if (!lesson?.timeSlot?.endTime) return false

			const now = new Date()
			const lessonEndTime = new Date(lesson.date)
			lessonEndTime.setHours(
				lesson.timeSlot.endTime.hour || 0,
				lesson.timeSlot.endTime.minute || 0,
			)
			return lessonEndTime <= now
		},
		[],
	)

	// Main processing function for lessons and balance calculation
	const processLessonsAndCalculateBalance = useCallback(
		(lessons: HistoryLesson[], prepayments: PrePay[]) => {
			const now = new Date()
			let currentBalance = 0

			// Sort lessons and prepayments by date
			const sortedLessons = [...lessons].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			)

			const sortedPrepayments = [...prepayments].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			)

			// Process lessons with initial flags
			const processedLessons = sortedLessons.map((lesson) => ({
				...lesson,
				isDone: isLessonEndTimeInPast(lesson),
				isPaid: false,
				isAutoChecked: false,
				type: 'lesson' as const,
			}))

			// Add prepayments to balance and apply to lessons
			sortedPrepayments.forEach((prepay) => {
				const prepayDate = new Date(prepay.date)
				const isToday = prepayDate.toDateString() === now.toDateString()
				const isPast = prepayDate < now

				if (isPast || isToday) {
					const prepayAmount = Number(prepay.cost)
					currentBalance += prepayAmount

					// Apply prepayment to unpaid lessons
					let remainingAmount = prepayAmount
					processedLessons.forEach((lesson) => {
						if (
							!lesson.isCancel &&
							!lesson.isPaid &&
							new Date(lesson.date) >= prepayDate
						) {
							const lessonCost = Number(lesson.price)
							if (remainingAmount >= lessonCost) {
								lesson.isPaid = true
								lesson.isAutoChecked = true
								remainingAmount -= lessonCost
							}
						}
					})
				}
			})

			// Subtract completed lessons from balance
			processedLessons.forEach((lesson) => {
				if (!lesson.isCancel && lesson.isDone) {
					currentBalance -= Number(lesson.price)
				}
			})

			return {processedLessons, currentBalance}
		},
		[isLessonEndTimeInPast],
	)

	// Update combined history function
	const updateCombinedHistory = useCallback(
		(historyData: HistoryLesson[], prePayData: PrePay[]) => {
			// Create unique key for current update
			const updateKey = JSON.stringify({
				history: historyData,
				prepay: prePayData,
			})

			// Skip if this is the same update
			if (lastUpdateRef.current === updateKey) {
				return
			}

			lastUpdateRef.current = updateKey

			// Validate input data
			if (!Array.isArray(historyData) || !Array.isArray(prePayData)) {
				console.warn('Invalid data:', {historyData, prePayData})
				return
			}

			const {processedLessons, currentBalance} =
				processLessonsAndCalculateBalance(historyData, prePayData)

			// Format history lessons
			const validHistory = processedLessons.map((lesson) => ({
				...lesson,
				date: new Date(lesson.date),
				timeSlot: {
					startTime: lesson.timeSlot?.startTime || {hour: 0, minute: 0},
					endTime: lesson.timeSlot?.endTime || {hour: 0, minute: 0},
				},
			}))

			// Format prepayments
			const validPrePay = prePayData.map((payment) => ({
				...payment,
				date: new Date(payment.date),
				type: 'prepayment' as const,
				isCancel: false,
				isDone: true,
				isPaid: true,
				cost: String(payment.cost),
			}))

			// Combine and sort by date (descending)
			const combined = [...validHistory, ...validPrePay].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			setCombinedHistory(combined)
			setBalance(currentBalance)
		},
		[processLessonsAndCalculateBalance],
	)

	// Generate new history from schedule
	const generateNewHistory = useCallback((items: Item[]): HistoryLesson[] => {
		const newHistory: HistoryLesson[] = []

		items.forEach((item) => {
			const differenceDays = differenceInDays(item.endLesson, item.startLesson)
			const dateRange = Array.from({length: differenceDays + 1}, (_, i) =>
				addDays(item.startLesson, i),
			)

			dateRange.forEach((date) => {
				const dayOfWeek = getDay(date)
				const scheduleForDay = item.timeLinesArray[dayOfWeek]

				if (scheduleForDay?.timeRanges?.length > 0) {
					scheduleForDay.timeRanges.forEach((timeRange) => {
						if (!timeRange.startTime?.hour || !timeRange.endTime?.hour) return

						const lessonDate = new Date(date)
						lessonDate.setHours(
							timeRange.startTime.hour,
							timeRange.startTime.minute,
						)

						newHistory.push({
							date: lessonDate,
							itemName: item.itemName,
							isDone: false,
							price: item.costOneLesson || '0',
							isPaid: false,
							isCancel: false,
							isAutoChecked: false,
							timeSlot: {
								startTime: timeRange.startTime,
								endTime: timeRange.endTime,
							},
							isTrial: false,
							type: 'lesson',
						})
					})
				}
			})

			// Handle trial lesson if exists
			if (item.tryLessonCheck && item.trialLessonDate && item.trialLessonTime) {
				newHistory.push({
					date: new Date(item.trialLessonDate),
					itemName: item.itemName,
					isDone: false,
					price: item.tryLessonCost || '0',
					isPaid: false,
					isCancel: false,
					isAutoChecked: false,
					timeSlot: item.trialLessonTime,
					isTrial: true,
					type: 'lesson',
				})
			}
		})

		return newHistory.sort((a, b) => a.date.getTime() - b.date.getTime())
	}, [])

	// Update history without overwriting prepayments
	const updateHistory = useCallback(
		(items: Item[]) => {
			if (updateSourceRef.current === 'socket') return

			const newHistory = generateNewHistory(items)
			setHistory(newHistory)
			updateCombinedHistory(newHistory, prePay)
			return newHistory // Возвращаем новую историю для использования в других местах
		},
		[generateNewHistory, prePay, updateCombinedHistory],
	)

	// Функция добавления предоплаты
	const addPrePay = useCallback(
		(prePayCost: string, prePayDate: Date, prePayId?: number) => {
			const newPrePay: PrePay = {
				id: prePayId || Date.now(),
				type: 'prepayment',
				cost: prePayCost,
				date: prePayDate,
				isDone: true,
				isPaid: true,
				isCancel: false,
			}

			setPrePay((prev) => {
				const newList = [...prev, newPrePay]
				updateCombinedHistory(history, newList)
				return newList
			})
		},
		[history],
	)

	// Функция удаления предоплаты
	const deletePrePay = useCallback(
		(id: number) => {
			setPrePay((prev) => {
				const newList = prev.filter((item) => item.id !== id)
				updateCombinedHistory(history, newList)
				return newList
			})
		},
		[history],
	)

	// Функция редактирования предоплаты
	const editPrePay = useCallback(
		(id: number, newDate: Date, newCost: string) => {
			setPrePay((prev) => {
				const newList = prev.map((item) =>
					item.id === id ? {...item, date: newDate, cost: newCost} : item,
				)
				updateCombinedHistory(history, newList)
				return newList
			})
		},
		[history],
	)

	// Initial setup for existing card
	useEffect(() => {
		if (isExistingCard) {
			const formattedHistory = initialHistory.map((lesson) => ({
				...lesson,
				date: new Date(lesson.date),
				type: 'lesson' as const,
			}))

			const formattedPrePay = initialPrePay.map((prepay) => ({
				...prepay,
				date: new Date(prepay.date),
				type: 'prepayment' as const,
				isDone: true,
				isPaid: true,
				isCancel: false,
			}))

			setHistory(formattedHistory)
			setPrePay(formattedPrePay)
			updateCombinedHistory(formattedHistory, formattedPrePay)
		}
	}, [isExistingCard, initialHistory, initialPrePay])

	const putCombinedHistory = useCallback(
		(serverCombinedHistory: (HistoryLesson | PrePay)[]) => {
			const lessons = serverCombinedHistory
				.filter((entry): entry is HistoryLesson => entry.type === 'lesson')
				.map((lesson) => ({
					...lesson,
					date: new Date(lesson.date),
				}))

			const prepayments = serverCombinedHistory
				.filter((entry): entry is PrePay => entry.type === 'prepayment')
				.map((prepay) => ({
					...prepay,
					date: new Date(prepay.date),
				}))

			setHistory(lessons)
			setPrePay(prepayments)
			setCombinedHistory(serverCombinedHistory)

			// Пересчитываем баланс
			calculateBalance(lessons, prepayments)
		},
		[],
	)

	const calculateBalance = useCallback(
		(lessons: HistoryLesson[], prepayments: PrePay[]) => {
			let currentBalance = 0
			const now = new Date()

			// Добавляем все предоплаты
			prepayments.forEach((prepay) => {
				if (prepay.date <= now) {
					currentBalance += Number(prepay.cost)
				}
			})

			// Вычитаем стоимость прошедших уроков
			lessons.forEach((lesson) => {
				if (lesson.isDone && !lesson.isCancel) {
					currentBalance -= Number(lesson.price)
				}
			})

			setBalance(currentBalance)
		},
		[],
	)

	// Update when data changes
	useEffect(() => {
		if (initialized) {
			const historyStr = JSON.stringify(history)
			const prePayStr = JSON.stringify(prePay)

			if (
				prevHistoryRef.current !== historyStr ||
				prevPrePayRef.current !== prePayStr
			) {
				updateCombinedHistory(history, prePay)
				prevHistoryRef.current = historyStr
				prevPrePayRef.current = prePayStr
			}
		}
	}, [history, prePay, initialized, updateCombinedHistory])

	return {
		combinedHistory,
		balance,
		updateHistory,
		addPrePay,
		deletePrePay,
		editPrePay,
		updateCombinedHistory,
		putCombinedHistory,
	}
}

export default useHistory
