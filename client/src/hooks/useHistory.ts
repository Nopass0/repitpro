import {useState, useCallback, useRef} from 'react'
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
	startTime: TimeSlot
	endTime: TimeSlot
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
	updateHistory: (items: Item[], changedItemName: string) => void
	addPrePay: (prePayCost: string, prePayDate: Date, prePayId?: number) => void
	deletePrePay: (id: number) => void
	editPrePay: (id: number, newDate: Date, newCost: string) => void
	updateCombinedHistory: (history: HistoryLesson[], prePay: PrePay[]) => void
	putCombinedHistory: (combinedHistory: (HistoryLesson | PrePay)[]) => void
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

	const updateSourceRef = useRef<'socket' | 'items' | 'initial' | null>(null)
	const lastUpdateRef = useRef<string>('')

	// Проверка, закончилось ли занятие
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

	// Обработка занятий и расчет баланса
	const processLessonsAndCalculateBalance = useCallback(
		(lessons: HistoryLesson[], prepayments: PrePay[]) => {
			const now = new Date()
			let currentBalance = 0

			const sortedLessons = [...lessons].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			)
			const sortedPrepayments = [...prepayments].sort(
				(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
			)

			// Помечаем прошедшие занятия
			const processedLessons = sortedLessons.map((lesson) => ({
				...lesson,
				isDone: isLessonEndTimeInPast(lesson),
			}))

			// Добавляем в баланс суммы от занятий, оплаченных вручную
			processedLessons.forEach((lesson) => {
				if (!lesson.isCancel && lesson.isPaid && !lesson.isAutoChecked) {
					currentBalance += Number(lesson.price)
				}
			})

			// Применяем предоплаты
			sortedPrepayments.forEach((prepay) => {
				const prepayDate = new Date(prepay.date)
				const isToday = prepayDate.toDateString() === now.toDateString()
				const isPast = prepayDate < now

				if (isPast || isToday) {
					const prepayAmount = Number(prepay.cost)
					currentBalance += prepayAmount

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

			// Вычитаем прошедшие занятия
			processedLessons.forEach((lesson) => {
				if (!lesson.isCancel && lesson.isDone) {
					currentBalance -= Number(lesson.price)
				}
			})

			return {processedLessons, currentBalance}
		},
		[isLessonEndTimeInPast],
	)

	// Обновление истории занятий при изменениях
	const updateHistory = useCallback(
		(items: Item[], changedItemName: string) => {
			// Пропускаем обновление если это изменение от сокета
			if (!changedItemName || updateSourceRef.current === 'socket') return

			const changedItem = items.find(
				(item) => item.itemName === changedItemName,
			)
			if (!changedItem) return

			setHistory((currentHistory) => {
				// Фильтруем занятия
				const existingLessons = currentHistory.filter(
					(lesson) => lesson.itemName === changedItemName,
				)
				const otherLessons = currentHistory.filter(
					(lesson) => lesson.itemName !== changedItemName,
				)

				const differenceDays = differenceInDays(
					changedItem.endLesson,
					changedItem.startLesson,
				)
				const dateRange = Array.from({length: differenceDays + 1}, (_, i) =>
					addDays(changedItem.startLesson, i),
				)

				const newLessons: HistoryLesson[] = []

				// Генерируем занятия по расписанию
				dateRange.forEach((date) => {
					const dayOfWeek = getDay(date)
					const scheduleForDay = changedItem.timeLinesArray[dayOfWeek]

					if (scheduleForDay?.timeRanges?.length > 0) {
						scheduleForDay.timeRanges.forEach((timeRange) => {
							if (!timeRange.startTime?.hour || !timeRange.endTime?.hour) return

							const lessonDate = new Date(date)
							lessonDate.setHours(
								timeRange.startTime.hour,
								timeRange.startTime.minute,
							)

							// Проверяем существование занятия
							const existingLesson = existingLessons.find((lesson) => {
								const sameDate =
									lesson.date.toDateString() === lessonDate.toDateString()
								const sameTime =
									lesson.timeSlot.startTime.hour === timeRange.startTime.hour &&
									lesson.timeSlot.startTime.minute ===
										timeRange.startTime.minute
								return sameDate && sameTime
							})

							if (existingLesson) {
								// Обновляем существующее занятие
								newLessons.push({
									...existingLesson,
									price: changedItem.costOneLesson,
									timeSlot: {
										startTime: timeRange.startTime,
										endTime: timeRange.endTime,
									},
								})
							} else {
								// Создаем новое занятие
								newLessons.push({
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
							}
						})
					}
				})

				// Обрабатываем пробное занятие
				if (
					changedItem.tryLessonCheck &&
					changedItem.trialLessonDate &&
					changedItem.trialLessonTime
				) {
					const existingTrialLesson = existingLessons.find(
						(lesson) =>
							lesson.isTrial &&
							lesson.date.toDateString() ===
								new Date(changedItem.trialLessonDate).toDateString(),
					)

					if (existingTrialLesson) {
						newLessons.push({
							...existingTrialLesson,
							price: changedItem.tryLessonCost || changedItem.costOneLesson,
							timeSlot: changedItem.trialLessonTime,
						})
					} else {
						newLessons.push({
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
				}

				// Объединяем и сортируем занятия
				const updatedHistory = [...otherLessons, ...newLessons].sort(
					(a, b) => a.date.getTime() - b.date.getTime(),
				)

				updateCombinedHistory(updatedHistory, prePay)
				return updatedHistory
			})
		},
		[isLessonEndTimeInPast, prePay],
	)

	// Обновление комбинированной истории
	const updateCombinedHistory = useCallback(
		(historyData: HistoryLesson[], prePayData: PrePay[]) => {
			const updateKey = JSON.stringify({
				history: historyData,
				prepay: prePayData,
			})

			if (lastUpdateRef.current === updateKey) return
			lastUpdateRef.current = updateKey

			if (!Array.isArray(historyData) || !Array.isArray(prePayData)) {
				console.warn('Invalid data:', {historyData, prePayData})
				return
			}

			const {processedLessons, currentBalance} =
				processLessonsAndCalculateBalance(historyData, prePayData)

			const validHistory = processedLessons.map((lesson) => ({
				...lesson,
				date: new Date(lesson.date),
				timeSlot: {
					startTime: lesson.timeSlot?.startTime || {hour: 0, minute: 0},
					endTime: lesson.timeSlot?.endTime || {hour: 0, minute: 0},
				},
			}))

			const validPrePay = prePayData.map((payment) => ({
				...payment,
				date: new Date(payment.date),
				type: 'prepayment' as const,
				isCancel: false,
				isDone: true,
				isPaid: true,
				cost: String(payment.cost),
			}))

			const combined = [...validHistory, ...validPrePay].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			)

			setCombinedHistory(combined)
			setBalance(currentBalance)
		},
		[processLessonsAndCalculateBalance],
	)

	// Загрузка истории с сервера
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

	// Управление предоплатами
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
				// Находим удаляемую предоплату
				const deletedPrePay = prev.find((item) => item.id === id)
				const newList = prev.filter((item) => item.id !== id)

				// Если нашли удаляемую предоплату
				if (deletedPrePay) {
					const deletedPrePayAmount = Number(deletedPrePay.cost)
					const deletedPrePayDate = new Date(deletedPrePay.date)

					// Получаем текущую историю
					setHistory((currentHistory) => {
						// Сортируем занятия по дате
						const sortedHistory = [...currentHistory].sort(
							(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
						)

						// Находим все занятия после даты предоплаты, которые были автоматически оплачены
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
									// Отменяем оплату
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

				// Обновляем общую историю с новым списком предоплат
				updateCombinedHistory(history, newList)
				return newList
			})
		},
		[history, updateCombinedHistory],
	)

	const updateHistoryWithChanges = useCallback(
		(items: Item[], changedItemName: string) => {
			// Skip if no items or no changed item name
			if (!changedItemName || !items.length) return

			const changedItem = items.find(
				(item) => item.itemName === changedItemName,
			)
			if (!changedItem) return

			setHistory((currentHistory) => {
				// Separate lessons for changed item from others
				const existingLessons = currentHistory.filter(
					(lesson) => lesson.itemName === changedItemName,
				)
				const otherLessons = currentHistory.filter(
					(lesson) => lesson.itemName !== changedItemName,
				)

				const newLessons: HistoryLesson[] = []

				// Get date range for new schedule
				const differenceDays = differenceInDays(
					changedItem.endLesson,
					changedItem.startLesson,
				)
				const dateRange = Array.from({length: differenceDays + 1}, (_, i) =>
					addDays(changedItem.startLesson, i),
				)

				// Generate lessons for each day
				dateRange.forEach((date) => {
					const dayOfWeek = getDay(date)
					const scheduleForDay = changedItem.timeLinesArray[dayOfWeek]

					// Only process if there are time ranges for this day
					if (scheduleForDay?.timeRanges?.length) {
						scheduleForDay.timeRanges.forEach((timeRange) => {
							const lessonDate = new Date(date)
							lessonDate.setHours(
								timeRange.startTime.hour,
								timeRange.startTime.minute,
							)

							// Check for existing lesson at this time
							const existingLesson = existingLessons.find((lesson) => {
								const sameDate =
									lesson.date.toDateString() === lessonDate.toDateString()
								const sameTime =
									lesson.timeSlot.startTime.hour === timeRange.startTime.hour &&
									lesson.timeSlot.startTime.minute ===
										timeRange.startTime.minute
								return sameDate && sameTime
							})

							if (existingLesson) {
								// Keep existing lesson but update price and time
								newLessons.push({
									...existingLesson,
									price: changedItem.costOneLesson,
									timeSlot: {
										startTime: timeRange.startTime,
										endTime: timeRange.endTime,
									},
								})
							} else {
								// Create new lesson
								newLessons.push({
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
							}
						})
					}
				})

				// Handle trial lesson if exists
				if (
					changedItem.tryLessonCheck &&
					changedItem.trialLessonDate &&
					changedItem.trialLessonTime
				) {
					const existingTrialLesson = existingLessons.find(
						(lesson) =>
							lesson.isTrial &&
							lesson.date.toDateString() ===
								new Date(changedItem.trialLessonDate).toDateString(),
					)

					if (existingTrialLesson) {
						newLessons.push({
							...existingTrialLesson,
							price: changedItem.tryLessonCost || changedItem.costOneLesson,
							timeSlot: changedItem.trialLessonTime,
						})
					} else {
						newLessons.push({
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
				}

				// Combine and sort all lessons
				const updatedHistory = [...otherLessons, ...newLessons].sort(
					(a, b) => a.date.getTime() - b.date.getTime(),
				)

				updateCombinedHistory(updatedHistory, prePay)
				return updatedHistory
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
