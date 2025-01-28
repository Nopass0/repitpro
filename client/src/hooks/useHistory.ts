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
			let currentBalance = 0;
			
			// Sort all events chronologically
			const allEvents = [
				...lessons.map(lesson => ({ ...lesson, type: 'lesson' as const })),
				...prepayments.map(prepay => ({ ...prepay, type: 'prepayment' as const }))
			].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
			
			// Initialize all lessons as unpaid and sort them chronologically
			const processedLessons = lessons
				.map(lesson => ({ 
					...lesson, 
					isPaid: false, 
					isAutoChecked: false 
				}))
				.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
			
			// Process payments strictly sequentially
			let lastUnpaidIndex = 0;
			
			for (const event of allEvents) {
				if (event.type === 'prepayment') {
					currentBalance += Number(event.cost);
					
					// Try to pay for lessons sequentially after each prepayment
					while (lastUnpaidIndex < processedLessons.length) {
						const lesson = processedLessons[lastUnpaidIndex];
						if (!lesson.isCancel) {
							const lessonPrice = Number(lesson.price);
							if (currentBalance >= lessonPrice) {
								currentBalance -= lessonPrice;
								lesson.isPaid = true;
								lesson.isAutoChecked = true;
								lastUnpaidIndex++;
							} else {
								break;
							}
						} else {
							lastUnpaidIndex++;
						}
					}
				}
			}
			
			// Update isDone based on current time
			const now = new Date();
			processedLessons.forEach(lesson => {
				const lessonDate = new Date(lesson.date);
				const lessonEndTime = new Date(lessonDate);
				if (lesson.timeSlot?.endTime) {
					lessonEndTime.setHours(lesson.timeSlot.endTime.hour, lesson.timeSlot.endTime.minute);
					lesson.isDone = lessonEndTime < now;
				}
			});
			
			return {
				processedLessons,
				currentBalance
			};
		},
		[],
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
				console.warn('Invalid data:', { historyData, prePayData })
				return
			}

			const { processedLessons, currentBalance } =
				processLessonsAndCalculateBalance(historyData, prePayData)

			// Process lesson history
			const validHistory = processedLessons.map((lesson) => ({
				...lesson,
				date: new Date(lesson.date),
				timeSlot: {
					startTime: lesson.timeSlot?.startTime || { hour: 0, minute: 0 },
					endTime: lesson.timeSlot?.endTime || { hour: 0, minute: 0 },
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
				const dateRange = Array.from({ length: differenceDays + 1 }, (_, i) =>
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
				// Find previous item name by itemId
				const oldItemName = currentHistory.find(
					(lesson) => lesson.itemId === changedItem.id,
				)?.itemName

				if (oldItemName) {
					// If found old item name, update it to new one
					const updatedHistory = currentHistory.map((lesson) => {
						if (lesson.itemId === changedItem.id) {
							return {
								...lesson,
								itemName: changedItem.itemName,
							}
						}
						return lesson
					})

					updateCombinedHistory(updatedHistory, prePay)
					return updatedHistory
				} else {
					// If this is a new item, generate lessons for it
					const existingLessons = currentHistory.filter(
						(lesson) => lesson.itemId !== changedItem.id,
					)

					const newLessons = generateLessonsForItem(changedItem)

					const combinedHistory = [...existingLessons, ...newLessons].sort(
						(a, b) => a.date.getTime() - b.date.getTime(),
					)

					updateCombinedHistory(combinedHistory, prePay)
					return combinedHistory
				}
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
					item.id === id ? { ...item, date: newDate, cost: newCost } : item,
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

			const { currentBalance } = processLessonsAndCalculateBalance(
				lessons,
				prepayments,
			)
			setBalance(currentBalance)
		},
		[processLessonsAndCalculateBalance],
	)

	const updateHistoryWithChanges = useCallback(
		(items: Item[], changedItemName: string) => {
			const now = new Date();
			
			setHistory(prevHistory => {
				// First, find all existing lessons for the changed item
				const existingLessons = prevHistory.filter(
					lesson => lesson.itemName === changedItemName
				);
				
				// Get the changed item from items array
				const changedItem = items.find(item => item.itemName === changedItemName);
				if (!changedItem) return prevHistory;

				// Generate new lessons based on the updated schedule
				const newLessons = generateLessonsForItem(changedItem);

				// Remove old lessons for this item that are in the future
				const otherItemsLessons = prevHistory.filter(
					lesson => 
						lesson.itemName !== changedItemName || 
						(lesson.itemName === changedItemName && new Date(lesson.date) < now)
				);

				// Combine past lessons with new future lessons
				const updatedHistory = [
					...otherItemsLessons,
					...newLessons.filter(lesson => new Date(lesson.date) >= now)
				];

				// Sort lessons by date
				updatedHistory.sort((a, b) => 
					new Date(a.date).getTime() - new Date(b.date).getTime()
				);

				return updatedHistory;
			});
		},
		[generateLessonsForItem]
	);

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
