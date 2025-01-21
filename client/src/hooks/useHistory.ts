import {useState, useCallback, useRef} from 'react'
import {addDays, differenceInDays} from 'date-fns'

// Interfaces
interface TimeSlot {
	hour: number
	minute: number
}

interface HistoryLesson {
	id?: string
	itemId?: string
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
	startTime: TimeSlot
	endTime: TimeSlot
}

interface Timeline {
	id: number
	day: string
	active: boolean
	startTime: TimeSlot
	endTime: TimeSlot
	editingStart: boolean
	editingEnd: boolean
	timeRanges: TimeRange[]
}

interface Item {
	id?: string
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
	updateHistory: (items: Item[], changedItemName?: string) => void
	addPrePay: (prePayCost: string, prePayDate: Date, prePayId?: number) => void
	deletePrePay: (id: number) => void
	editPrePay: (id: number, newDate: Date, newCost: string) => void
	updateCombinedHistory: (history: HistoryLesson[], prePay: PrePay[]) => void
	putCombinedHistory: (combinedHistory: (HistoryLesson | PrePay)[]) => void
	updateHistoryWithChanges: (items: Item[], changedItemName: string) => void
}

// Helper function to get day of week
const getDay = (date: Date): number => {
	const dayIndex = date.getDay() - 1
	return dayIndex === -1 ? 6 : dayIndex
}

export const useHistory = (
	initialHistory: HistoryLesson[] = [],
	initialPrePay: PrePay[] = [],
	isExistingCard = false,
): UseHistoryResult => {
	// State
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

	// Refs
	const updateSourceRef = useRef<'socket' | 'items' | 'initial' | null>(null)
	const lastUpdateRef = useRef<string>('')

	// Helper functions
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

	const processLessonsAndCalculateBalance = useCallback(
		(lessons: HistoryLesson[], prepayments: PrePay[]) => {
			let currentBalance = 0

			// 1. Add all prepayments
			prepayments.forEach((prepay) => {
				currentBalance += Number(prepay.cost)
			})

			// 2. Add manual payments (not auto-checked)
			lessons.forEach((lesson) => {
				if (lesson.isPaid && !lesson.isAutoChecked) {
					currentBalance += Number(lesson.price)
				}
			})

			// 3. Sort all lessons chronologically
			const sortedLessons = [...lessons].sort((a, b) => {
				const dateCompare = a.date.getTime() - b.date.getTime()
				if (dateCompare === 0) {
					// If dates are equal, prioritize trial lessons
					if (a.isTrial && !b.isTrial) return -1
					if (!a.isTrial && b.isTrial) return 1
					// If both are trial or both are not, sort by name
					return a.itemName.localeCompare(b.itemName)
				}
				return dateCompare
			})

			// 4. Apply prepayments to lessons strictly in sequential order
			let remainingPrepayment = currentBalance
			let canMarkAsPaid = true
			const processedLessons = sortedLessons.map((lesson) => {
				const newLesson = {...lesson}

				// If a previous lesson was unpaid and not cancelled, we can't mark any more lessons as paid
				if (!canMarkAsPaid) {
					newLesson.isPaid = false
					newLesson.isAutoChecked = false
					return newLesson
				}

				if (!newLesson.isCancel && !newLesson.isPaid) {
					if (remainingPrepayment >= Number(newLesson.price)) {
						remainingPrepayment -= Number(newLesson.price)
						newLesson.isPaid = true
						newLesson.isAutoChecked = true
					} else {
						canMarkAsPaid = false
						newLesson.isPaid = false
						newLesson.isAutoChecked = false
					}
				}

				// If this lesson is not cancelled and not paid, we can't pay for future lessons
				if (!newLesson.isCancel && !newLesson.isPaid) {
					canMarkAsPaid = false
				}

				return newLesson
			})

			// 5. Calculate final balance
			let finalBalance = currentBalance
			processedLessons.forEach((lesson) => {
				if (lesson.isDone && !lesson.isCancel) {
					finalBalance -= Number(lesson.price)
				}
			})

			return {processedLessons, currentBalance: finalBalance}
		},
		[isLessonEndTimeInPast],
	)

	const updateCombinedHistory = useCallback(
		(historyData: HistoryLesson[], prePayData: PrePay[]) => {
			const updateKey = JSON.stringify({
				history: historyData,
				prepay: prePayData,
			})

			// Prevent duplicate updates
			if (lastUpdateRef.current === updateKey) return
			lastUpdateRef.current = updateKey

			// Validate input data
			if (!Array.isArray(historyData) || !Array.isArray(prePayData)) {
				console.warn('Invalid data:', {historyData, prePayData})
				return
			}

			const {processedLessons, currentBalance} =
				processLessonsAndCalculateBalance(historyData, prePayData)

			// Process lesson history
			const validHistory = processedLessons.map((lesson) => ({
				...lesson,
				date: new Date(lesson.date),
				timeSlot: {
					startTime: lesson.timeSlot?.startTime || {hour: 0, minute: 0},
					endTime: lesson.timeSlot?.endTime || {hour: 0, minute: 0},
				},
			}))

			// Process prepayments
			const validPrePay = prePayData.map((payment) => ({
				...payment,
				date: new Date(payment.date),
				type: 'prepayment' as const,
				isCancel: false,
				isDone: true,
				isPaid: true,
				cost: String(payment.cost),
			}))

			// Combine and sort all entries
			const combined = [...validHistory, ...validPrePay].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			setCombinedHistory(combined)
			setBalance(currentBalance)
		},
		[processLessonsAndCalculateBalance],
	)

	const generateLessonsForItem = useCallback(
		(item: Item): HistoryLesson[] => {
			const lessons: HistoryLesson[] = []

			// Always add trial lesson if configured, regardless of other schedule
			if (item.tryLessonCheck && item.trialLessonDate && item.trialLessonTime) {
				lessons.push({
					itemId: item.id,
					date: new Date(item.trialLessonDate),
					itemName: item.itemName,
					isDone: isLessonEndTimeInPast({
						date: new Date(item.trialLessonDate),
						timeSlot: item.trialLessonTime,
					} as HistoryLesson),
					price: item.tryLessonCost || item.costOneLesson,
					isPaid: false,
					isCancel: false,
					isAutoChecked: false,
					timeSlot: item.trialLessonTime,
					isTrial: true,
					type: 'lesson',
				})
			}

			// Generate regular lessons only if schedule exists
			if (
				item.timeLinesArray?.some((timeline) =>
					timeline.timeRanges?.some(
						(range) =>
							range.startTime.hour !== 0 ||
							range.startTime.minute !== 0 ||
							range.endTime.hour !== 0 ||
							range.endTime.minute !== 0,
					),
				)
			) {
				const differenceDays = differenceInDays(
					item.endLesson,
					item.startLesson,
				)
				const dateRange = Array.from({length: differenceDays + 1}, (_, i) =>
					addDays(item.startLesson, i),
				)

				dateRange.forEach((date) => {
					const dayOfWeek = getDay(date)
					const scheduleForDay = item.timeLinesArray[dayOfWeek]

					if (scheduleForDay?.timeRanges?.length > 0) {
						scheduleForDay.timeRanges.forEach((timeRange) => {
							const lessonDate = new Date(date)
							lessonDate.setHours(
								timeRange.startTime.hour,
								timeRange.startTime.minute,
							)

							lessons.push({
								itemId: item.id,
								date: lessonDate,
								itemName: item.itemName,
								isDone: isLessonEndTimeInPast({
									date: lessonDate,
									timeSlot: {
										startTime: timeRange.startTime,
										endTime: timeRange.endTime,
									},
								} as HistoryLesson),
								price: item.costOneLesson,
								isPaid: false,
								isCancel: false,
								isAutoChecked: false,
								timeSlot: {
									startTime: timeRange.startTime,
									endTime: timeRange.endTime,
								},
								type: 'lesson',
							})
						})
					}
				})
			}

			return lessons.sort((a, b) => a.date.getTime() - b.date.getTime())
		},
		[isLessonEndTimeInPast],
	)

	const updateHistory = useCallback(
		(items: Item[], changedItemName?: string) => {
			if (!changedItemName || updateSourceRef.current === 'socket') return

			const changedItem = items.find(
				(item) => item.itemName === changedItemName,
			)
			if (!changedItem) return

			setHistory((currentHistory) => {
				// Keep existing lessons for other items
				const existingLessons = currentHistory.filter(
					(lesson) => lesson.itemName !== changedItemName,
				)

				// Generate new lessons for the changed item
				const newLessons = generateLessonsForItem(changedItem)

				// Combine existing and new lessons, then sort
				const combinedHistory = [...existingLessons, ...newLessons].sort(
					(a, b) => a.date.getTime() - b.date.getTime(),
				)

				updateCombinedHistory(combinedHistory, prePay)
				return combinedHistory
			})
		},
		[generateLessonsForItem, updateCombinedHistory, prePay],
	)

	const addPrePay = useCallback(
		(prePayCost: string, prePayDate: Date, prePayId?: number) => {
			setPrePay((prev) => {
				const newPrePay: PrePay = {
					id: prePayId || Date.now(),
					cost: prePayCost,
					date: prePayDate,
					type: 'prepayment',
				}

				const newList = [...prev, newPrePay]
				updateCombinedHistory(history, newList)
				return newList
			})
		},
		[history, updateCombinedHistory],
	)

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
		[history, updateCombinedHistory],
	)

	const deletePrePay = useCallback(
		(id: number) => {
			setPrePay((prev) => {
				const deletedPrePay = prev.find((item) => item.id === id)
				const newList = prev.filter((item) => item.id !== id)

				if (deletedPrePay) {
					const deletedPrePayAmount = Number(deletedPrePay.cost)
					const deletedPrePayDate = new Date(deletedPrePay.date)

					setHistory((currentHistory) => {
						const sortedHistory = [...currentHistory].sort(
							(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
						)

						let remainingAmount = deletedPrePayAmount
						const updatedHistory = sortedHistory.map((lesson) => {
							if (
								new Date(lesson.date) < deletedPrePayDate ||
								lesson.isCancel
							) {
								return lesson
							}

							if (
								lesson.isPaid &&
								lesson.isAutoChecked &&
								remainingAmount > 0
							) {
								const lessonCost = Number(lesson.price)
								if (remainingAmount >= lessonCost) {
									remainingAmount -= lessonCost
									return {
										...lesson,
										isPaid: false,
										isAutoChecked: false,
									}
								}
							}

							return lesson
						})

						return updatedHistory
					})
				}

				updateCombinedHistory(history, newList)
				return newList
			})
		},
		[history, updateCombinedHistory],
	)

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

			const {currentBalance} = processLessonsAndCalculateBalance(
				lessons,
				prepayments,
			)
			setBalance(currentBalance)
		},
		[processLessonsAndCalculateBalance],
	)

	const updateHistoryWithChanges = useCallback(
		(items: Item[], changedItemName: string) => {
			if (!changedItemName || !items.length) return

			const changedItem = items.find(
				(item) => item.itemName === changedItemName,
			)
			if (!changedItem) return

			setHistory((currentHistory) => {
				const updatedHistory = currentHistory.map((lesson) => {
					if (lesson.itemId === changedItem.id) {
						return {...lesson, itemName: changedItem.itemName}
					}
					return lesson
				})

				if (
					updatedHistory.every((lesson) => lesson.itemName !== changedItemName)
				) {
					const newLessons = generateLessonsForItem(changedItem)

					const updatedHistoryCombined = [
						...currentHistory,
						...newLessons,
					].sort((a, b) => a.date.getTime() - b.date.getTime())
					updateCombinedHistory(updatedHistoryCombined, prePay)
					return updatedHistoryCombined
				} else {
					updateCombinedHistory(updatedHistory, prePay)
					return updatedHistory
				}
			})
		},
		[generateLessonsForItem, prePay, updateCombinedHistory],
	)

	return {
		combinedHistory,
		balance,
		updateHistory,
		addPrePay,
		deletePrePay,
		editPrePay,
		updateCombinedHistory,
		putCombinedHistory,
		updateHistoryWithChanges,
	}
}

export default useHistory
