// useHistory.tsx

import { useState, useCallback, useRef } from 'react';
import { addDays, differenceInDays } from 'date-fns';

// Интерфейсы
export interface TimeSlot {
	hour: number;
	minute: number;
}

export interface HistoryLesson {
	// itemId – это индекс предмета в массиве
	itemId: number;
	date: Date;
	itemName: string;
	isDone: boolean;
	price: string;
	isPaid: boolean;
	isCancel: boolean;
	isAutoChecked?: boolean;
	timeSlot: {
		startTime: TimeSlot;
		endTime: TimeSlot;
	};
	isTrial?: boolean;
	type?: 'lesson';
}

export interface TimeRange {
	startTime: TimeSlot;
	endTime: TimeSlot;
}

export interface Timeline {
	id: number;
	day: string;
	active: boolean;
	startTime: TimeSlot;
	endTime: TimeSlot;
	editingStart: boolean;
	editingEnd: boolean;
	timeRanges: TimeRange[];
}

export interface Item {
	// Здесь идентификатора не передаём – будем использовать индекс в массиве как id
	itemName: string;
	costOneLesson: string;
	startLesson: Date;
	endLesson: Date;
	timeLinesArray: Timeline[];
	tryLessonCheck?: boolean;
	trialLessonDate?: Date;
	trialLessonTime?: {
		startTime: TimeSlot;
		endTime: TimeSlot;
	};
	tryLessonCost?: string;
}

export interface PrePay {
	cost: string;
	date: Date;
	id: number;
	type?: 'prepayment';
}

interface UseHistoryResult {
	combinedHistory: (HistoryLesson | (PrePay & { type: 'prepayment' }))[];
	balance: number;
	// Функции теперь принимают идентификатор предмета (индекс в массиве) – если он не передан, производится обновление для всех предметов
	updateHistory: (items: Item[], changedItemId?: number) => void;
	addPrePay: (prePayCost: string, prePayDate: Date, prePayId?: number) => void;
	deletePrePay: (id: number) => void;
	editPrePay: (id: number, newDate: Date, newCost: string) => void;
	updateCombinedHistory: (history: HistoryLesson[], prePay: PrePay[]) => void;
	putCombinedHistory: (combinedHistory: (HistoryLesson | PrePay)[]) => void;
	updateHistoryWithChanges: (items: Item[], changedItemId: number) => void;
}

// Функция для получения дня недели (0 — понедельник, 6 — воскресенье)
const getDay = (date: Date): number => {
	const dayIndex = date.getDay() - 1;
	return dayIndex === -1 ? 6 : dayIndex;
};

export const useHistory = (
	initialHistory: HistoryLesson[] = [],
	initialPrePay: PrePay[] = [],
	isExistingCard = false
): UseHistoryResult => {
	// Состояния
	const [history, setHistory] = useState<HistoryLesson[]>(initialHistory);
	const [prePay, setPrePay] = useState<PrePay[]>(() =>
		(initialPrePay || []).map((prepay) => ({
			...prepay,
			date: new Date(prepay.date),
			id: prepay.id || Date.now(),
			cost: String(prepay.cost),
		}))
	);
	const [combinedHistory, setCombinedHistory] = useState<
		(HistoryLesson | (PrePay & { type: 'prepayment' }))[]
	>([]);
	const [balance, setBalance] = useState<number>(0);

	// Рефы
	const updateSourceRef = useRef<'socket' | 'items' | 'initial' | null>(null);
	const lastUpdateRef = useRef<string>('');

	// Функция для проверки, закончился ли урок
	const isLessonEndTimeInPast = useCallback(
		(lesson: HistoryLesson): boolean => {
			if (!lesson?.timeSlot?.endTime) return false;
			const now = new Date();
			const lessonEndTime = new Date(lesson.date);
			const hour = lesson.timeSlot.endTime.hour || 0;
			const minute = lesson.timeSlot.endTime.minute || 0;
			lessonEndTime.setHours(hour, minute, 0, 0);
			return lessonEndTime <= now;
		},
		[]
	);

	// Функция для обработки уроков и расчёта баланса
	const processLessonsAndCalculateBalance = useCallback(
		(lessons: HistoryLesson[], prepayments: PrePay[]) => {
			const now = new Date();
			const updatedLessons = lessons.map((lesson) => {
				const lessonDate = new Date(lesson.date);
				const hour = lesson.timeSlot.endTime.hour || 0;
				const minute = lesson.timeSlot.endTime.minute || 0;
				const lessonEndTime = new Date(lessonDate);
				lessonEndTime.setHours(hour, minute, 0, 0);
				return { ...lesson, isDone: lessonEndTime <= now };
			});

			const totalPrePay = prepayments.reduce(
				(sum, payment) => sum + Number(payment.cost),
				0
			);

			const totalLessonCost = updatedLessons.reduce((sum, lesson) => {
				if (lesson.isDone && !lesson.isCancel) {
					return sum + Number(lesson.price);
				}
				return sum;
			}, 0);

			const manualPaidAdjustment = updatedLessons.reduce((sum, lesson) => {
				if (lesson.isDone && !lesson.isCancel && lesson.isPaid && !lesson.isAutoChecked) {
					return sum + Number(lesson.price);
				}
				return sum;
			}, 0);

			const currentBalance = totalPrePay - totalLessonCost + manualPaidAdjustment;

			const processedLessons = updatedLessons.sort(
				(a, b) => a.date.getTime() - b.date.getTime()
			);

			return { processedLessons, currentBalance };
		},
		[]
	);

	// Модифицированная функция обновления комбинированной истории
	const updateCombinedHistory = useCallback(
		(historyData: HistoryLesson[], prePayData: PrePay[]) => {
			const updateKey = JSON.stringify({
				history: historyData,
				prepay: prePayData,
			});
			if (lastUpdateRef.current === updateKey) return;
			lastUpdateRef.current = updateKey;

			if (!Array.isArray(historyData) || !Array.isArray(prePayData)) {
				console.warn('Invalid data:', { historyData, prepay: prePayData });
				return;
			}

			const { processedLessons, currentBalance } =
				processLessonsAndCalculateBalance(historyData, prePayData);

			// Приводим даты к корректному виду и задаём значения по умолчанию для timeSlot
			let validHistory = processedLessons.map((lesson) => ({
				...lesson,
				date: new Date(lesson.date),
				timeSlot: {
					startTime: lesson.timeSlot?.startTime || { hour: 0, minute: 0 },
					endTime: lesson.timeSlot?.endTime || { hour: 0, minute: 0 },
				},
			}));

			// ===== Новая логика перерасчёта автоматических галочек =====
			// Считаем сумму всех предоплат
			const totalPrePay = prePayData.reduce(
				(sum, payment) => sum + Number(payment.cost),
				0
			);
			let cumulativeCost = 0;
			// Флаг цепочки – как только встречается урок, для которого не хватает средств, дальнейшие не отмечаются
			let chainActive = true;
			// Сортируем уроки по возрастанию даты и пересчитываем флаги
			validHistory = validHistory
				.sort((a, b) => a.date.getTime() - b.date.getTime())
				.map((lesson) => {
					const lessonCost = Number(lesson.price);
					if (!chainActive) {
						return { ...lesson, isPaid: false, isAutoChecked: false };
					}
					if (cumulativeCost + lessonCost <= totalPrePay) {
						cumulativeCost += lessonCost;
						// Независимо от того, что пришло с сервера (например, ручное isPaid: true, isAutoChecked: false),
						// ставим автоматическую отметку
						return { ...lesson, isPaid: true, isAutoChecked: true };
					} else {
						// Если на данном уроке не хватает средств – цепочка прерывается.
						// При этом даже если урок с сервера пришёл с ручной отметкой,
						// мы не ставим автоматическую галочку и «переносим» её на следующее занятие.
						chainActive = false;
						return { ...lesson, isPaid: false, isAutoChecked: false };
					}
				});
			// Сортируем обратно в порядке убывания дат (для комбинированной истории)
			validHistory = validHistory.sort(
				(a, b) => b.date.getTime() - a.date.getTime()
			);
			// ===========================================================

			const validPrePay = prePayData.map((payment) => ({
				...payment,
				date: new Date(payment.date),
				type: 'prepayment' as const,
				isCancel: false,
				isDone: true,
				isPaid: true,
				cost: String(payment.cost),
			}));

			const combined = [...validHistory, ...validPrePay].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
			);

			setCombinedHistory(combined);
			setBalance(currentBalance);
		},
		[processLessonsAndCalculateBalance]
	);

	// Функция генерации уроков для предмета (принимает предмет и его индекс как идентификатор)
	const generateLessonsForItem = useCallback(
		(item: Item, itemId: number): HistoryLesson[] => {
			const lessons: HistoryLesson[] = [];

			// Пробное занятие (если активировано)
			if (item.tryLessonCheck && item.trialLessonDate && item.trialLessonTime) {
				lessons.push({
					itemId: itemId,
					date: new Date(item.trialLessonDate),
					itemName: item.itemName,
					isDone: isLessonEndTimeInPast({
						date: new Date(item.trialLessonDate),
						timeSlot: item.trialLessonTime,
					} as HistoryLesson),
					price: item.tryLessonCost || item.costOneLesson || "0",
					isPaid: false,
					isCancel: false,
					isAutoChecked: false,
					timeSlot: item.trialLessonTime,
					isTrial: true,
					type: 'lesson',
				});
			}

			// Регулярные занятия (если есть расписание)
			if (
				item.timeLinesArray?.some((timeline) =>
					timeline.timeRanges?.some(
						(range) =>
							range.startTime.hour !== 0 ||
							range.startTime.minute !== 0 ||
							range.endTime.hour !== 0 ||
							range.endTime.minute !== 0
					)
				)
			) {
				const differenceDays = differenceInDays(item.endLesson, item.startLesson);
				const dateRange = Array.from({ length: differenceDays + 1 }, (_, i) =>
					addDays(item.startLesson, i)
				);
				dateRange.forEach((date) => {
					const dayOfWeek = getDay(date);
					const scheduleForDay = item.timeLinesArray[dayOfWeek];
					if (scheduleForDay?.timeRanges?.length > 0) {
						scheduleForDay.timeRanges.forEach((timeRange) => {
							const lessonDate = new Date(date);
							lessonDate.setHours(timeRange.startTime.hour, timeRange.startTime.minute);
							lessons.push({
								itemId: itemId,
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
							});
						});
					}
				});
			}

			return lessons.sort((a, b) => a.date.getTime() - b.date.getTime());
		},
		[isLessonEndTimeInPast]
	);

	// Функция обновления истории для конкретного предмета по его индексу.
	// Если параметр changedItemId не передан, то обновляются занятия для всех предметов.
	const updateHistory = useCallback(
		(items: Item[], changedItemId?: number) => {
			if (updateSourceRef.current === 'socket') return;
			if (changedItemId !== undefined) {
				const changedItem = items[changedItemId];
				if (!changedItem) return;
				setHistory((currentHistory) => {
					const filteredHistory = currentHistory.filter(
						(lesson) => lesson.itemId !== changedItemId
					);
					const newLessons = generateLessonsForItem(changedItem, changedItemId);
					const newHistory = [...filteredHistory, ...newLessons].sort(
						(a, b) => a.date.getTime() - b.date.getTime()
					);
					updateCombinedHistory(newHistory, prePay);
					return newHistory;
				});
			} else {
				// Если не указан конкретный предмет – обновляем историю для всех
				const allLessons: HistoryLesson[] = [];
				items.forEach((item, index) => {
					const lessonsForItem = generateLessonsForItem(item, index);
					allLessons.push(...lessonsForItem);
				});
				allLessons.sort((a, b) => a.date.getTime() - b.date.getTime());
				setHistory(allLessons);
				updateCombinedHistory(allLessons, prePay);
			}
		},
		[generateLessonsForItem, updateCombinedHistory, prePay]
	);

	// Функция обновления истории с учётом изменений для конкретного предмета (по индексу)
	const updateHistoryWithChanges = useCallback(
		(items: Item[], changedItemId: number) => {
			const changedItem = items[changedItemId];
			if (!changedItem) return;
			setHistory((prevHistory) => {
				const now = new Date();
				const remainingLessons = prevHistory.filter(
					(lesson) => lesson.itemId !== changedItemId || new Date(lesson.date) < now
				);
				if (changedItem.costOneLesson && changedItem.timeLinesArray) {
					const newLessons = generateLessonsForItem(changedItem, changedItemId).filter(
						(lesson) => new Date(lesson.date) >= now
					);
					const newHistory = [...remainingLessons, ...newLessons].sort(
						(a, b) => a.date.getTime() - b.date.getTime()
					);
					updateCombinedHistory(newHistory, prePay);
					return newHistory;
				}
				return remainingLessons;
			});
		},
		[generateLessonsForItem, updateCombinedHistory, prePay]
	);

	// Функция добавления предоплаты
	const addPrePay = useCallback(
		(prePayCost: string, prePayDate: Date, prePayId?: number) => {
			setPrePay((prev) => {
				const newPrePay: PrePay = {
					id: prePayId || Date.now(),
					cost: prePayCost,
					date: prePayDate,
					type: 'prepayment',
				};
				const newList = [...prev, newPrePay];
				updateCombinedHistory(history, newList);
				return newList;
			});
		},
		[history, updateCombinedHistory]
	);

	// Функция редактирования предоплаты
	const editPrePay = useCallback(
		(id: number, newDate: Date, newCost: string) => {
			setPrePay((prev) => {
				const newList = prev.map((item) =>
					item.id === id ? { ...item, date: newDate, cost: newCost } : item
				);
				updateCombinedHistory(history, newList);
				return newList;
			});
		},
		[history, updateCombinedHistory]
	);

	// Функция удаления предоплаты
	const deletePrePay = useCallback(
		(id: number) => {
			setPrePay((prev) => {
				const deletedPrePay = prev.find((item) => item.id === id);
				const newList = prev.filter((item) => item.id !== id);
				if (deletedPrePay) {
					const deletedPrePayAmount = Number(deletedPrePay.cost);
					const deletedPrePayDate = new Date(deletedPrePay.date);
					setHistory((currentHistory) => {
						const sortedHistory = [...currentHistory].sort(
							(a, b) => a.date.getTime() - b.date.getTime()
						);
						let remainingAmount = deletedPrePayAmount;
						const updatedHistory = sortedHistory.map((lesson) => {
							if (new Date(lesson.date) < deletedPrePayDate || lesson.isCancel) {
								return lesson;
							}
							if (lesson.isPaid && lesson.isAutoChecked && remainingAmount > 0) {
								const lessonCost = Number(lesson.price);
								if (remainingAmount >= lessonCost) {
									remainingAmount -= lessonCost;
									return { ...lesson, isPaid: false, isAutoChecked: false };
								}
							}
							return lesson;
						});
						return updatedHistory;
					});
				}
				updateCombinedHistory(history, newList);
				return newList;
			});
		},
		[history, updateCombinedHistory]
	);

	// Функция загрузки комбинированной истории с сервера
	const putCombinedHistory = useCallback(
		(serverCombinedHistory: (HistoryLesson | PrePay)[]) => {
			const lessons = serverCombinedHistory
				.filter((entry): entry is HistoryLesson => entry.type === 'lesson')
				.map((lesson) => ({
					...lesson,
					date: new Date(lesson.date),
				}));
			const prepayments = serverCombinedHistory
				.filter((entry): entry is PrePay => entry.type === 'prepayment')
				.map((prepay) => ({
					...prepay,
					date: new Date(prepay.date),
				}));
			setHistory(lessons);
			setPrePay(prepayments);
			setCombinedHistory(serverCombinedHistory);
			const { currentBalance } = processLessonsAndCalculateBalance(lessons, prepayments);
			setBalance(currentBalance);
		},
		[processLessonsAndCalculateBalance]
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
	};
};

export default useHistory;
