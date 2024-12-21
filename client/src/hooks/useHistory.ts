import {useState, useCallback, useRef} from 'react'
import {addDays, differenceInDays} from 'date-fns'

// Interfaces
interface TimeSlot {
	hour: number
	minute: number
}

interface HistoryLesson {
	id?: string
	itemId?: string // Add itemId to HistoryLesson
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
	isExistingCard: boolean = false,
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
	const previousItemNames = useRef<Map<string, string>>(new Map())

	// Helper functions
	const calculateStringDifference = (str1: string, str2: string): number => {
		let differences = 0
		const maxLength = Math.max(str1.length, str2.length)

		for (let i = 0; i < maxLength; i++) {
			if (str1[i] !== str2[i]) {
				differences++
			}
		}

		differences += Math.abs(str1.length - str2.length)
		return differences
	}

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
			const now = new Date()
			let currentBalance = 0

			// Process prepayments
			prepayments.forEach((prepay) => {
				const prepayDate = new Date(prepay.date)
				const isToday = prepayDate.toDateString() === now.toDateString()
				const isPast = prepayDate < now

				if (isPast || isToday) {
					currentBalance += Number(prepay.cost)
				}
			})

			// Sort lessons chronologically
			const sortedLessons = [...lessons].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			)

			const lastLessonDate = sortedLessons.length
				? new Date(sortedLessons[sortedLessons.length - 1].date)
				: now

			// First pass: handle manual payments and set isDone
			const processedLessons = sortedLessons.map((lesson) => {
				if (lesson.isPaid && !lesson.isAutoChecked) {
					currentBalance += Number(lesson.price)
					return {
						...lesson,
						isDone: isLessonEndTimeInPast(lesson),
					}
				}

				return {
					...lesson,
					isDone: isLessonEndTimeInPast(lesson),
					isPaid: false,
					isAutoChecked: false,
				}
			})

			// Calculate total prepayment amount
			const totalPrepaymentAmount = prepayments.reduce(
				(total, prepay) => total + Number(prepay.cost),
				0,
			)

			// Second pass: apply prepayments to lessons
			let remainingPrepaymentAmount = totalPrepaymentAmount
			processedLessons.forEach((lesson) => {
				const lessonDate = new Date(lesson.date)

				if (
					!lesson.isCancel &&
					!lesson.isPaid &&
					lessonDate <= lastLessonDate
				) {
					const lessonCost = Number(lesson.price)
					if (remainingPrepaymentAmount >= lessonCost) {
						lesson.isPaid = true
						lesson.isAutoChecked = true
						remainingPrepaymentAmount -= lessonCost
					}
				}
			})

			// Final pass: subtract costs of past lessons from balance
			processedLessons.forEach((lesson) => {
				if (!lesson.isCancel && lesson.isDone) {
					currentBalance -= Number(lesson.price)
				}
			})

			return {processedLessons, currentBalance}
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

	const updateHistory = useCallback(
		(items: Item[], changedItemName?: string) => {
			if (!changedItemName || updateSourceRef.current === 'socket') return

			const changedItem = items.find(
				(item) => item.itemName === changedItemName,
			)
			if (!changedItem) return

			setHistory((currentHistory) => {
				const updatedHistory = currentHistory.map((lesson) => {
					if (lesson.itemId === changedItem.id) {
						return {
							...lesson,
							itemName: changedItem.itemName,
							price: changedItem.costOneLesson,
						}
					}
					return lesson
				})

				// Check if any lessons were updated. If not, it's a new item, so create lessons.
				if (
					updatedHistory.every((lesson) => lesson.itemName !== changedItemName)
				) {
					const differenceDays = differenceInDays(
						changedItem.endLesson,
						changedItem.startLesson,
					)

					const dateRange = Array.from({length: differenceDays + 1}, (_, i) =>
						addDays(changedItem.startLesson, i),
					)

					const newLessons: HistoryLesson[] = []

					// Create regular lessons
					dateRange.forEach((date) => {
						const dayOfWeek = getDay(date)
						const scheduleForDay = changedItem.timeLinesArray[dayOfWeek]

						if (scheduleForDay?.timeRanges?.length > 0) {
							scheduleForDay.timeRanges.forEach((timeRange) => {
								const lessonDate = new Date(date)
								lessonDate.setHours(
									timeRange.startTime.hour,
									timeRange.startTime.minute,
								)

								newLessons.push({
									itemId: changedItem.id, // Assign itemId here
									date: lessonDate,
									itemName: changedItem.itemName,
									isDone: isLessonEndTimeInPast({
										date: lessonDate,
										timeSlot: {
											startTime: timeRange.startTime,
											endTime: timeRange.endTime,
										},
									} as HistoryLesson),
									price: changedItem.costOneLesson,
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

					// Add trial lesson if configured
					if (
						changedItem.tryLessonCheck &&
						changedItem.trialLessonDate &&
						changedItem.trialLessonTime
					) {
						newLessons.push({
							itemId: changedItem.id, // Assign itemId here
							date: new Date(changedItem.trialLessonDate),
							itemName: changedItem.itemName,
							isDone: isLessonEndTimeInPast({
								date: new Date(changedItem.trialLessonDate),
								timeSlot: changedItem.trialLessonTime,
							} as HistoryLesson),
							price: changedItem.tryLessonCost || changedItem.costOneLesson,
							isPaid: false,
							isCancel: false,
							isAutoChecked: false,
							timeSlot: changedItem.trialLessonTime,
							isTrial: true,
							type: 'lesson',
						})
					}

					const combinedHistory = [...currentHistory, ...newLessons].sort(
						(a, b) => a.date.getTime() - b.date.getTime(),
					)
					updateCombinedHistory(combinedHistory, prePay)
					return combinedHistory
				} else {
					updateCombinedHistory(updatedHistory, prePay)
					return updatedHistory
				}
			})
		},
		[isLessonEndTimeInPast, updateCombinedHistory, prePay],
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
				// Находим удаляемую предоплату и создаем новый список без неё
				const deletedPrePay = prev.find((item) => item.id === id)
				const newList = prev.filter((item) => item.id !== id)

				if (deletedPrePay) {
					const deletedPrePayAmount = Number(deletedPrePay.cost)
					const deletedPrePayDate = new Date(deletedPrePay.date)

					// Обновляем историю занятий после удаления предоплаты
					setHistory((currentHistory) => {
						// Сортируем занятия по дате
						const sortedHistory = [...currentHistory].sort(
							(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
						)

						// Пересчитываем статусы оплаты занятий
						let remainingAmount = deletedPrePayAmount
						const updatedHistory = sortedHistory.map((lesson) => {
							// Пропускаем занятия до даты предоплаты или отмененные
							if (
								new Date(lesson.date) < deletedPrePayDate ||
								lesson.isCancel
							) {
								return lesson
							}

							// Если занятие было автоматически оплачено и у нас есть остаток предоплаты
							if (
								lesson.isPaid &&
								lesson.isAutoChecked &&
								remainingAmount > 0
							) {
								const lessonCost = Number(lesson.price)
								if (remainingAmount >= lessonCost) {
									remainingAmount -= lessonCost
									// Отменяем автоматическую оплату
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

				// Обновляем общую историю и баланс
				updateCombinedHistory(history, newList)
				return newList
			})
		},
		[history, updateCombinedHistory],
	)

	const putCombinedHistory = useCallback(
		(serverCombinedHistory: (HistoryLesson | PrePay)[]) => {
			// Разделяем историю на занятия и предоплаты
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

			// Обновляем состояние
			setHistory(lessons)
			setPrePay(prepayments)
			setCombinedHistory(serverCombinedHistory)

			// Пересчитываем баланс
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
					const differenceDays = differenceInDays(
						changedItem.endLesson,
						changedItem.startLesson,
					)
					const dateRange = Array.from({length: differenceDays + 1}, (_, i) =>
						addDays(changedItem.startLesson, i),
					)

					const newLessons = []

					dateRange.forEach((date) => {
						const dayOfWeek = getDay(date)
						const scheduleForDay = changedItem.timeLinesArray[dayOfWeek]

						if (scheduleForDay?.timeRanges?.length) {
							scheduleForDay.timeRanges.forEach((timeRange) => {
								const lessonDate = new Date(date)
								lessonDate.setHours(
									timeRange.startTime.hour,
									timeRange.startTime.minute,
								)

								newLessons.push({
									itemId: changedItem.id, // Assign itemId here
									date: lessonDate,
									itemName: changedItem.itemName,
									isDone: isLessonEndTimeInPast({
										date: lessonDate,
										timeSlot: {
											startTime: timeRange.startTime,
											endTime: timeRange.endTime,
										},
									} as HistoryLesson),
									price: changedItem.costOneLesson,
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

					// Добавляем пробное занятие если оно есть
					if (
						changedItem.tryLessonCheck &&
						changedItem.trialLessonDate &&
						changedItem.trialLessonTime
					) {
						newLessons.push({
							itemId: changedItem.id, // Assign itemId here
							date: new Date(changedItem.trialLessonDate),
							itemName: changedItem.itemName,
							isDone: isLessonEndTimeInPast({
								date: new Date(changedItem.trialLessonDate),
								timeSlot: changedItem.trialLessonTime,
							} as HistoryLesson),
							price: changedItem.tryLessonCost || changedItem.costOneLesson,
							isPaid: false,
							isCancel: false,
							isAutoChecked: false,
							timeSlot: changedItem.trialLessonTime,
							isTrial: true,
							type: 'lesson',
						})
					}

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
		[isLessonEndTimeInPast, prePay, updateCombinedHistory],
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
