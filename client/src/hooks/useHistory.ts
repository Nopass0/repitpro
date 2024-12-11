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
	trialLessonDate?: string
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
}

interface UseHistoryResult {
	combinedHistory: (HistoryLesson | (PrePay & {type: 'prepayment'}))[]
	balance: number
	updateHistory: (items: Item[]) => void
	addPrePay: (prePayCost: string, prePayDate: Date, prePayId?: number) => void
	deletePrePay: (id: number) => void
	editPrePay: (id: number, newDate: Date, newCost: string) => void
	updateCombinedHistory: (history: HistoryLesson[], prePay: PrePay[]) => void
	updateTimeRanges: (
		itemIndex: number,
		dayOfWeek: number,
		newTimeRanges: TimeRange[],
	) => void
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
	const [items, setItems] = useState<Item[]>([])

	// Refs for tracking changes
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
			}))

			// Add past and today's prepayments to balance
			sortedPrepayments.forEach((prepay) => {
				const prepayDate = new Date(prepay.date)
				const isToday = prepayDate.toDateString() === now.toDateString()
				const isPast = prepayDate < now

				if (isPast || isToday) {
					currentBalance += Number(prepay.cost)
				}
			})

			// Subtract completed lessons from balance
			processedLessons.forEach((lesson) => {
				if (lesson.isCancel) return

				if (lesson.isDone) {
					currentBalance -= Number(lesson.price)
				}
			})

			// Apply prepayments to future lessons
			sortedPrepayments.forEach((prepay) => {
				let remainingAmount = Number(prepay.cost)
				const prepayDate = new Date(prepay.date)

				// Find all lessons after this prepayment
				processedLessons
					.filter((lesson) => {
						const lessonDate = new Date(lesson.date)
						return lessonDate > prepayDate && !lesson.isCancel && !lesson.isPaid
					})
					.forEach((lesson) => {
						const lessonCost = Number(lesson.price)
						if (remainingAmount >= lessonCost) {
							lesson.isPaid = true
							lesson.isAutoChecked = true
							remainingAmount -= lessonCost
						}
					})
			})

			// Handle manual payments
			processedLessons.forEach((lesson) => {
				if (lesson.isPaid && !lesson.isAutoChecked) {
					currentBalance += Number(lesson.price)
				}
			})

			return {processedLessons, currentBalance}
		},
		[isLessonEndTimeInPast],
	)

	// Update combined history function
	const updateCombinedHistory = useCallback(
		(historyData: HistoryLesson[], prePayData: PrePay[]) => {
			if (!Array.isArray(historyData) || !Array.isArray(prePayData)) {
				console.warn('Invalid data:', {historyData, prePayData})
				return
			}

			const {processedLessons, currentBalance} =
				processLessonsAndCalculateBalance(historyData, prePayData)

			// Format lessons for display
			const validHistory = processedLessons.map((lesson) => ({
				...lesson,
				date: new Date(lesson.date),
				type: 'lesson' as const,
				timeSlot: {
					startTime: lesson.timeSlot?.startTime || {hour: 0, minute: 0},
					endTime: lesson.timeSlot?.endTime || {hour: 0, minute: 0},
				},
			}))

			// Format prepayments for display
			const validPrePay = prePayData.map((payment) => ({
				...payment,
				date: new Date(payment.date),
				type: 'prepayment' as const,
				isCancel: false,
				isDone: true,
				isPaid: true,
				cost: String(payment.cost),
			}))

			// Combine and sort by date (newest first)
			const combined = [...validHistory, ...validPrePay].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			setCombinedHistory(combined)
			setBalance(currentBalance)
		},
		[processLessonsAndCalculateBalance],
	)

	// Prepayment management functions
	const addPrePay = useCallback(
		(prePayCost: string, prePayDate: Date, prePayId?: number) => {
			const newPrePay = {
				cost: prePayCost,
				date: prePayDate,
				id: prePayId || Date.now(),
			}

			setPrePay((prev) => {
				const newList = [...prev, newPrePay]
				return newList
			})
		},
		[],
	)

	const deletePrePay = useCallback((id: number) => {
		setPrePay((prev) => {
			const newList = prev.filter((item) => item.id !== id)
			return newList
		})
	}, [])

	const editPrePay = useCallback(
		(id: number, newDate: Date, newCost: string) => {
			setPrePay((prev) => {
				const newList = prev.map((item) =>
					item.id === id
						? {...item, date: new Date(newDate), cost: newCost}
						: item,
				)
				return newList
			})
		},
		[],
	)

	// Initial setup for existing card
	useEffect(() => {
		if (!initialized && isExistingCard) {
			const formattedHistory = (initialHistory || []).map((lesson) => ({
				...lesson,
				date: new Date(lesson.date),
				timeSlot: {
					startTime: lesson.timeSlot?.startTime || {hour: 0, minute: 0},
					endTime: lesson.timeSlot?.endTime || {hour: 0, minute: 0},
				},
				isDone: isLessonEndTimeInPast(lesson),
				isPaid: lesson.isPaid || false,
				isCancel: lesson.isCancel || false,
				isAutoChecked: lesson.isAutoChecked || false,
				price: lesson.price || '0',
			}))

			const formattedPrePay = (initialPrePay || []).map((prepay) => ({
				...prepay,
				date: new Date(prepay.date),
				id: prepay.id || Date.now(),
				cost: String(prepay.cost),
			}))

			setHistory(formattedHistory)
			setPrePay(formattedPrePay)
			updateCombinedHistory(formattedHistory, formattedPrePay)
			setInitialized(true)
		}
	}, [
		isExistingCard,
		initialHistory,
		initialPrePay,
		initialized,
		isLessonEndTimeInPast,
		updateCombinedHistory,
	])

	// Update when data changes
	useEffect(() => {
		if (initialized) {
			const historyStr = JSON.stringify(history)
			const prePayStr = JSON.stringify(prePay)

			if (
				prevHistoryRef.current !== historyStr ||
				prevPrePayRef.current !== prePayStr
			) {
				const currentPrePay = [...prePay]
				updateCombinedHistory(history, currentPrePay)

				prevHistoryRef.current = historyStr
				prevPrePayRef.current = prePayStr
			}
		}
	}, [history, prePay, initialized, updateCombinedHistory])

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
						})
					})
				}
			})
		})

		return newHistory.sort((a, b) => a.date.getTime() - b.date.getTime())
	}, [])

	// Update history function
	const updateHistory = useCallback(
		(items: Item[]) => {
			const newHistory = generateNewHistory(items)
			const currentPrePay = [...prePay]

			if (JSON.stringify(history) !== JSON.stringify(newHistory)) {
				setHistory(newHistory)
				setItems(items)
				updateCombinedHistory(newHistory, currentPrePay)
			}
		},
		[generateNewHistory, updateCombinedHistory, history, prePay],
	)

	// Update time ranges
	const updateTimeRanges = useCallback(
		(itemIndex: number, dayOfWeek: number, newTimeRanges: TimeRange[]) => {
			setItems((prevItems) => {
				const newItems = [...prevItems]
				if (!newItems[itemIndex]) return prevItems

				newItems[itemIndex] = {
					...newItems[itemIndex],
					timeLinesArray: newItems[itemIndex].timeLinesArray.map(
						(timeline, idx) =>
							idx === dayOfWeek
								? {...timeline, timeRanges: newTimeRanges}
								: timeline,
					),
				}

				const newHistory = generateNewHistory(newItems)
				const currentPrePay = [...prePay]

				setHistory(newHistory)
				updateCombinedHistory(newHistory, currentPrePay)

				return newItems
			})
		},
		[generateNewHistory, updateCombinedHistory, prePay],
	)

	return {
		combinedHistory,
		balance,
		updateHistory,
		addPrePay,
		deletePrePay,
		editPrePay,
		updateTimeRanges,
		updateCombinedHistory,
	}
}

export default useHistory
