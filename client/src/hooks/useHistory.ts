import {useState, useEffect} from 'react'
import {addDays, differenceInDays, isBefore, isSameDay, isToday} from 'date-fns'

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
	isAutoChecked?: boolean // добавляем флаг автоматической оплаты
	timeSlot: {
		// добавляем временной промежуток
		startTime: TimeSlot
		endTime: TimeSlot
	}
	isTrial?: boolean // добавляем флаг пробного занятия
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
	const [prePay, setPrePay] = useState<PrePay[]>(initialPrePay)
	const [combinedHistory, setCombinedHistory] = useState<
		(HistoryLesson | (PrePay & {type: 'prepayment'}))[]
	>([])
	const [balance, setBalance] = useState<number>(0)

	const addPrePay = (
		prePayCost: string,
		prePayDate: Date,
		prePayId: number,
	) => {
		const newPrePay = {
			cost: prePayCost,
			date: prePayDate,
			id: prePayId || Date.now(),
		}
		const newPrePayList = [...(prePay || []), newPrePay]
		setPrePay(newPrePayList)

		// Немедленно обновляем комбинированную историю
		updateCombinedHistory(history, newPrePayList)
		updatePaymentStatuses(history, newPrePayList)
		calculateBalance(history, newPrePayList)
	}

	const deletePrePay = (id: number) => {
		const newPrePayList = prePay.filter((item) => item.id !== id)
		setPrePay(newPrePayList)
		calculateBalance(history, newPrePayList)
	}

	const editPrePay = (id: number, newDate: Date, newCost: string) => {
		const newPrePayList = prePay.map((item) =>
			item.id === id ? {...item, date: new Date(newDate), cost: newCost} : item,
		)
		setPrePay(newPrePayList)
		calculateBalance(history, newPrePayList)
	}

	// Функция для обработки существующей истории с сервера
	const processExistingHistory = () => {
		const today = new Date()

		// Обновляем isDone статус для существующих записей
		const updatedHistory = initialHistory.map((lesson) => ({
			...lesson,
			isDone:
				isBefore(new Date(lesson.date), today) ||
				isToday(new Date(lesson.date)),
		}))

		setHistory(updatedHistory)
		updateCombinedHistory(updatedHistory, initialPrePay)
	}

	const updateTimeRanges = (
		itemIndex: number,
		dayOfWeek: number,
		newTimeRanges: TimeRange[],
	) => {
		const affectedItem = items[itemIndex]
		if (!affectedItem) return

		// Обновляем историю с учетом изменений в расписании
		const updatedHistory = updateHistoryOnTimeRangeChange(history, {
			...affectedItem,
			timeLinesArray: affectedItem.timeLinesArray.map((timeline, index) =>
				index === dayOfWeek
					? {...timeline, timeRanges: newTimeRanges}
					: timeline,
			),
		})

		setHistory(updatedHistory)

		// Перерасчитываем оплаты и баланс
		const historyWithPayments = updatePaymentStatuses(updatedHistory)
		setHistory(historyWithPayments)
		updateCombinedHistory(historyWithPayments, prePay)
		calculateBalance(historyWithPayments)
	}

	const updateHistoryOnTimeRangeChange = (
		history: HistoryLesson[],
		item: Item,
	): HistoryLesson[] => {
		return history.filter((lesson) => {
			// Если это занятие другого предмета - оставляем
			if (lesson.itemName !== item.itemName) {
				return true
			}

			const lessonDate = new Date(lesson.date)
			const dayOfWeek = getDay(lessonDate)
			const scheduleForDay = item.timeLinesArray[dayOfWeek]

			// Проверяем, существует ли этот временной слот
			const timeSlotExists = scheduleForDay?.timeRanges?.some(
				(range) =>
					range.startTime.hour === lesson.timeSlot.startTime.hour &&
					range.startTime.minute === lesson.timeSlot.startTime.minute &&
					range.endTime.hour === lesson.timeSlot.endTime.hour &&
					range.endTime.minute === lesson.timeSlot.endTime.minute,
			)

			// Оставляем только занятия с существующими временными слотами
			return timeSlotExists
		})
	}

	// Функция для генерации новой истории на основе расписания
	const generateNewHistory = (items: Item[]): HistoryLesson[] => {
		const now = new Date()
		let newHistory: HistoryLesson[] = []

		items.forEach((item) => {
			// Сначала добавляем пробное занятие
			if (item.tryLessonCheck && item.trialLessonDate && item.trialLessonTime) {
				const trialDate = new Date(item.trialLessonDate)
				const timeSlot = item.trialLessonTime

				newHistory.push({
					date: trialDate,
					itemName: item.itemName,
					isDone: isLessonDone(trialDate, timeSlot.startTime),
					price: item.tryLessonCost,
					isPaid: false,
					isCancel: false,
					isAutoChecked: false,
					timeSlot: timeSlot,
					isTrial: true,
				})
			}

			// Затем генерируем обычные занятия
			const differenceDays = differenceInDays(item.endLesson, item.startLesson)
			const dateRange = Array.from({length: differenceDays + 1}, (_, i) =>
				addDays(item.startLesson, i),
			)

			dateRange.forEach((date) => {
				const dayOfWeek = getDay(date)
				const scheduleForDay = item.timeLinesArray[dayOfWeek]

				if (scheduleForDay?.timeRanges?.length > 0) {
					scheduleForDay.timeRanges.forEach((timeRange) => {
						if (isValidTimeRange(timeRange)) {
							const lessonDate = new Date(date)
							lessonDate.setHours(
								timeRange.startTime.hour,
								timeRange.startTime.minute,
							)

							// Создаем занятие со всеми необходимыми полями
							newHistory.push({
								date: lessonDate,
								itemName: item.itemName,
								isDone: isLessonDone(lessonDate, timeRange.startTime),
								price: item.costOneLesson,
								isPaid: false,
								isCancel: false,
								isAutoChecked: false,
								timeSlot: {
									startTime: timeRange.startTime,
									endTime: timeRange.endTime,
								},
								isTrial: false,
							})
						}
					})
				}
			})
		})

		return newHistory.sort((a, b) => a.date.getTime() - b.date.getTime())
	}

	// Вспомогательная функция для проверки, прошло ли занятие
	const isLessonDone = (lessonDate: Date, timeSlot: TimeSlot): boolean => {
		const now = new Date()
		const lessonDateTime = new Date(lessonDate)
		lessonDateTime.setHours(timeSlot.hour, timeSlot.minute)
		return lessonDateTime < now
	}

	// Вспомогательная функция для проверки валидности временного промежутка
	const isValidTimeRange = (timeRange: any) => {
		return (
			timeRange.startTime?.hour !== 0 ||
			timeRange.startTime?.minute !== 0 ||
			timeRange.endTime?.hour !== 0 ||
			timeRange.endTime?.minute !== 0
		)
	}

	// Функция для обновления статусов оплаты на основе предоплат
	const updatePaymentStatuses = (history: HistoryLesson[]): HistoryLesson[] => {
		const sortedPrePay = [...prePay].sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		)

		let remainingPrePayment = 0
		let currentPrePayIndex = 0

		// Сначала сбрасываем все автоматические оплаты
		let updatedHistory = history.map((lesson) => ({
			...lesson,
			isPaid: lesson.isPaid && !lesson.isAutoChecked,
			isAutoChecked: false,
		}))

		updatedHistory = updatedHistory.map((lesson) => {
			const lessonDate = new Date(lesson.date)

			// Применяем предоплаты до текущего занятия или в тот же день
			while (currentPrePayIndex < sortedPrePay.length) {
				const prePayDate = new Date(sortedPrePay[currentPrePayIndex].date)

				if (isSameDay(prePayDate, lessonDate) || prePayDate < lessonDate) {
					remainingPrePayment += Number(sortedPrePay[currentPrePayIndex].cost)
					currentPrePayIndex++
				} else {
					break
				}
			}

			// Если занятие отменено, пропускаем его
			if (lesson.isCancel) {
				return lesson
			}

			// Пробуем применить оплату к занятию (включая пробное)
			const lessonPrice = Number(lesson.price)
			if (remainingPrePayment >= lessonPrice) {
				remainingPrePayment -= lessonPrice
				return {
					...lesson,
					isPaid: true,
					isAutoChecked: true,
				}
			}

			return lesson
		})

		return updatedHistory
	}

	// Вспомогательная функция для сравнения дат
	const isSameOrBefore = (date1: Date, date2: Date) => {
		const d1 = new Date(date1)
		const d2 = new Date(date2)
		return d1.getTime() <= d2.getTime()
	}

	// Функция для обновления комбинированной истории
	const updateCombinedHistory = (
		history: HistoryLesson[],
		prePay: PrePay[],
	) => {
		const combined = [
			...history.map((lesson) => ({
				...lesson,
				type: 'lesson' as const,
				date: new Date(lesson.date),
			})),
			...prePay.map((payment) => ({
				...payment,
				type: 'prepayment' as const,
				date: new Date(payment.date),
				isCancel: false,
				isDone: true, // Предоплата всегда считается выполненной
				isPaid: true, // Предоплата всегда считается оплаченной
			})),
		]

		// Сортируем по дате в обратном порядке (новые сверху)
		const sorted = combined.sort((a, b) => {
			const dateA = new Date(a.date)
			const dateB = new Date(b.date)

			// Сравниваем только дату (день, месяц, год), игнорируя время
			const dateComparisonWithoutTime =
				new Date(
					dateB.getFullYear(),
					dateB.getMonth(),
					dateB.getDate(),
				).getTime() -
				new Date(
					dateA.getFullYear(),
					dateA.getMonth(),
					dateA.getDate(),
				).getTime()

			if (dateComparisonWithoutTime === 0) {
				// Если даты совпадают, предоплаты идут после занятий
				if (a.type !== b.type) {
					return a.type === 'lesson' ? -1 : 1
				}
				// Если типы одинаковые, сортируем по времени
				return dateB.getTime() - dateA.getTime()
			}

			return dateComparisonWithoutTime
		})

		setCombinedHistory(sorted)
	}

	// Функция для расчета текущего баланса
	const calculateBalance = (history: HistoryLesson[]) => {
		// Считаем общую сумму всех занятий (включая пробные, исключая отмененные)
		const totalLessonsAmount = history.reduce((sum, lesson) => {
			if (!lesson.isCancel) {
				// Учитываем все неотмененные занятия, включая пробные
				return sum + Number(lesson.price)
			}
			return sum
		}, 0)

		// Начинаем с отрицательного баланса
		let currentBalance = -totalLessonsAmount

		// Добавляем все предоплаты
		const totalPrePay = prePay.reduce(
			(sum, payment) => sum + Number(payment.cost),
			0,
		)
		currentBalance += totalPrePay

		// Добавляем суммы за все прошедшие оплаченные занятия (включая пробные)
		const completedPaidLessons = history.reduce((sum, lesson) => {
			if (lesson.isDone && lesson.isPaid && !lesson.isCancel) {
				return sum + Number(lesson.price)
			}
			return sum
		}, 0)
		currentBalance += completedPaidLessons

		setBalance(currentBalance)
	}

	// Функция для обновления истории
	const updateHistory = (items: Item[]) => {
		if (isExistingCard) {
			processExistingHistory()
			return
		}

		const newHistory = generateNewHistory(items)
		const updatedHistory = updatePaymentStatuses(newHistory, prePay)
		setHistory(updatedHistory)
		updateCombinedHistory(updatedHistory, prePay)
		calculateBalance(updatedHistory, prePay)
	}

	// Эффект для начальной инициализации
	useEffect(() => {
		if (isExistingCard) {
			processExistingHistory()
		}
	}, [])

	// Эффект для обновления баланса при изменении истории или предоплат
	useEffect(() => {
		calculateBalance(history, prePay)
	}, [history, prePay])

	return {
		combinedHistory,
		balance,
		updateHistory,
		addPrePay,
		deletePrePay,
		editPrePay,
		updateTimeRanges,
	}
}