import React, {useState, useEffect} from 'react'
import {createPortal} from 'react-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {ChevronUp, ChevronDown, X, Clock} from 'lucide-react'
import {Button} from '@/ui/button'
import {Card} from '@/ui/card'
import {ScrollArea} from '@/ui/scroll-area'
import {cn} from '@/lib/utils'

interface TimeRange {
	startTime: string
	endTime: string
}

interface TimePickerState {
	hours: number
	minutes: number
}

interface TimeRangePickerProps {
	duration?: number
	onTimeRangeSelect: (ranges: TimeRange[]) => void
	onClose: () => void
	className?: string
	busyOnlineSlots?: {
		freeTime: {
			startTime: {hour: number; minute: number}
			endTime: {hour: number; minute: number}
		}[]
	} | null
	existingRanges?: TimeRange[]
	position?: {x: number; y: number}
	singleRange?: boolean
}

const overlayVariants = {
	hidden: {opacity: 0},
	visible: {opacity: 1},
}

const TimeRangePicker: React.FC<TimeRangePickerProps> = ({
	duration = 0,
	onTimeRangeSelect,
	onClose,
	className,
	busyOnlineSlots = null,
	existingRanges = [],
	position,
	singleRange = false,
}) => {
	const [step, setStep] = useState<'start' | 'end'>('start')
	const [startTime, setStartTime] = useState<TimePickerState>({
		hours: 8,
		minutes: 0,
	})
	const [endTime, setEndTime] = useState<TimePickerState>({
		hours: 9,
		minutes: 0,
	})
	const [ranges, setRanges] = useState<TimeRange[]>(existingRanges)
	const [expanded, setExpanded] = useState(false)

	// Initialize time from existing range if in single range mode
	useEffect(() => {
		if (singleRange && existingRanges.length > 0) {
			const [firstRange] = existingRanges
			const [startHours, startMinutes] = firstRange.startTime
				.split(':')
				.map(Number)
			const [endHours, endMinutes] = firstRange.endTime.split(':').map(Number)

			setStartTime({hours: startHours, minutes: startMinutes})
			setEndTime({hours: endHours, minutes: endMinutes})
		}
	}, [singleRange, existingRanges])

	// Update end time based on duration
	useEffect(() => {
		if (duration && step === 'end') {
			const totalMinutes = startTime.hours * 60 + startTime.minutes + duration
			setEndTime({
				hours: Math.floor(totalMinutes / 60) % 24,
				minutes: totalMinutes % 60,
			})
		}
	}, [duration, step, startTime])

	const formatTime = (time: TimePickerState): string => {
		return `${String(time.hours).padStart(2, '0')}:${String(time.minutes).padStart(2, '0')}`
	}

	const parseTime = (timeStr: string): TimePickerState => {
		const [hours, minutes] = timeStr.split(':').map(Number)
		return {hours, minutes}
	}

	const getTimeInMinutes = (time: TimePickerState): number => {
		return time.hours * 60 + time.minutes
	}

	const getTimeFromMinutes = (minutes: number): TimePickerState => {
		return {
			hours: Math.floor(minutes / 60) % 24,
			minutes: minutes % 60,
		}
	}

	const isTimeBusy = (time: TimePickerState): boolean => {
		if (!busyOnlineSlots) return false

		const timeInMinutes = getTimeInMinutes(time)
		return busyOnlineSlots.freeTime.some((slot) => {
			const slotStart = getTimeInMinutes({
				hours: slot.startTime.hour,
				minutes: slot.startTime.minute,
			})
			const slotEnd = getTimeInMinutes({
				hours: slot.endTime.hour,
				minutes: slot.endTime.minute,
			})
			return timeInMinutes >= slotStart && timeInMinutes <= slotEnd
		})
	}

	const findNearestAvailableTime = (
		currentTime: TimePickerState,
		increment: boolean,
	): TimePickerState => {
		if (!busyOnlineSlots) return currentTime

		const currentMinutes = getTimeInMinutes(currentTime)
		const busySlots = busyOnlineSlots.freeTime
			.map((slot) => ({
				start: getTimeInMinutes({
					hours: slot.startTime.hour,
					minutes: slot.startTime.minute,
				}),
				end: getTimeInMinutes({
					hours: slot.endTime.hour,
					minutes: slot.endTime.minute,
				}),
			}))
			.sort((a, b) => a.start - b.start)

		// If we're not in a busy slot, return the current time
		if (!isTimeBusy(currentTime)) {
			return currentTime
		}

		if (increment) {
			// Find the next available time after all busy slots
			for (const slot of busySlots) {
				if (currentMinutes <= slot.end) {
					return getTimeFromMinutes(slot.end + 1)
				}
			}
			// If no slot found, wrap to beginning of day
			return {hours: 0, minutes: 0}
		} else {
			// Find the previous available time before all busy slots
			for (let i = busySlots.length - 1; i >= 0; i--) {
				const slot = busySlots[i]
				if (currentMinutes >= slot.start) {
					return getTimeFromMinutes(slot.start - 1)
				}
			}
			// If no slot found, wrap to end of day
			return {hours: 23, minutes: 59}
		}
	}

	const roundToNearestFiveMinutes = (
		minutes: number,
		increment: boolean,
	): number => {
		const remainder = minutes % 5
		if (remainder === 0) return minutes

		if (increment) {
			return minutes + (5 - remainder)
		} else {
			return minutes - remainder
		}
	}

	const handleTimeChange = (
		increment: boolean,
		isStart: boolean,
		changeMinutes: boolean,
	) => {
		const setState = isStart ? setStartTime : setEndTime
		const currentState = isStart ? startTime : endTime

		setState((prev) => {
			let newMinutes = prev.minutes
			let newHours = prev.hours

			if (changeMinutes) {
				newMinutes = prev.minutes + (increment ? 5 : -5)
				if (newMinutes >= 60) {
					newMinutes = 0
					newHours = (newHours + 1) % 24
				} else if (newMinutes < 0) {
					newMinutes = 55
					newHours = (newHours - 1 + 24) % 24
				}
			} else {
				newHours = (prev.hours + (increment ? 1 : -1) + 24) % 24
			}

			let newTime = {hours: newHours, minutes: newMinutes}

			// If the new time is in a busy slot, find the nearest available time
			if (isTimeBusy(newTime)) {
				newTime = findNearestAvailableTime(newTime, increment)
				// После перескакивания занятого слота округляем минуты до ближайших 5 минут
				if (changeMinutes) {
					newTime.minutes = roundToNearestFiveMinutes(
						newTime.minutes,
						increment,
					)
				}
			}

			// Ensure end time is not before start time
			if (!isStart) {
				const startMinutes = getTimeInMinutes(startTime)
				const newMinutes = getTimeInMinutes(newTime)
				if (newMinutes <= startMinutes) {
					return currentState
				}
			}

			return newTime
		})
	}

	const handleAddRange = () => {
		// Check if either start or end time is in a busy slot
		if (isTimeBusy(startTime) || isTimeBusy(endTime)) {
			alert('Выбранный промежуток пересекается с занятым временем')
			return
		}

		const newRange = {
			startTime: formatTime(startTime),
			endTime: formatTime(endTime),
		}

		if (singleRange) {
			const newRanges = [newRange]
			setRanges(newRanges)
			onTimeRangeSelect(newRanges)
			onClose()
		} else {
			const newRanges = [...ranges, newRange]
			setRanges(newRanges)
			onTimeRangeSelect(newRanges)
		}
		setStep('start')
	}

	const handleRemoveRange = (index: number) => {
		const newRanges = ranges.filter((_, i) => i !== index)
		setRanges(newRanges)
		onTimeRangeSelect(newRanges)
	}

	const handleClearAll = () => {
		setRanges([])
		onTimeRangeSelect([])
	}

	const handleOverlayClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose()
		}
	}

	return createPortal(
		<AnimatePresence>
			<motion.div
				initial="hidden"
				animate="visible"
				exit="hidden"
				variants={overlayVariants}
				className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center"
				onClick={handleOverlayClick}>
				<motion.div
					initial={{scale: 0.9, opacity: 0}}
					animate={{scale: 1, opacity: 1}}
					exit={{scale: 0.9, opacity: 0}}
					className="relative flex"
					style={
						position
							? {
									position: 'absolute',
									left: position.x,
									top: position.y,
								}
							: undefined
					}>
					<Card
						className={cn(
							'w-64 p-3 shadow-lg bg-white border-green-500',
							className,
						)}>
						<div className="flex items-center justify-between mb-3">
							<div className="flex items-center text-sm text-gray-600">
								<Clock className="w-4 h-4 mr-1" />
								<span>
									{step === 'start' ? 'Время начала' : 'Время окончания'}
								</span>
							</div>
							<Button
								variant="ghost"
								size="sm"
								className="h-8 w-8 p-0"
								onClick={onClose}>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<div className="flex justify-center gap-4 mb-4">
							<div className="flex flex-col items-center">
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										handleTimeChange(true, step === 'start', false)
									}>
									<ChevronUp className="h-4 w-4" />
								</Button>
								<span className="text-2xl font-bold">
									{step === 'start'
										? String(startTime.hours).padStart(2, '0')
										: String(endTime.hours).padStart(2, '0')}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										handleTimeChange(false, step === 'start', false)
									}>
									<ChevronDown className="h-4 w-4" />
								</Button>
							</div>

							<span className="text-2xl font-bold self-center">:</span>

							<div className="flex flex-col items-center">
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										handleTimeChange(true, step === 'start', true)
									}>
									<ChevronUp className="h-4 w-4" />
								</Button>
								<span className="text-2xl font-bold">
									{step === 'start'
										? String(startTime.minutes).padStart(2, '0')
										: String(endTime.minutes).padStart(2, '0')}
								</span>
								<Button
									variant="ghost"
									size="sm"
									onClick={() =>
										handleTimeChange(false, step === 'start', true)
									}>
									<ChevronDown className="h-4 w-4" />
								</Button>
							</div>
						</div>

						<Button
							className="w-full mb-2"
							onClick={() => {
								if (step === 'start') {
									setStep('end')
								} else {
									handleAddRange()
								}
							}}>
							{step === 'start' ? 'Продолжить' : 'Применить'}
						</Button>

						{!singleRange && ranges.length > 0 && (
							<div className="mt-4 border-t pt-4">
								<div className="flex items-center justify-between mb-2">
									<span className="text-sm font-medium">Выбранные слоты</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleClearAll}
										className="text-red-500 hover:text-red-600">
										Очистить все
									</Button>
								</div>

								<div className="space-y-2">
									{ranges
										.slice(0, expanded ? undefined : 2)
										.map((range, index) => (
											<div
												key={index}
												className="flex items-center justify-between bg-gray-50 rounded-md p-2">
												<span className="text-sm">
													{range.startTime} - {range.endTime}
												</span>
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleRemoveRange(index)}
													className="text-red-500 hover:text-red-600">
													<X className="h-4 w-4" />
												</Button>
											</div>
										))}

									{ranges.length > 2 && (
										<Button
											variant="ghost"
											size="sm"
											className="w-full text-gray-500"
											onClick={() => setExpanded(!expanded)}>
											{expanded
												? 'Свернуть'
												: `Показать еще ${ranges.length - 2}`}
										</Button>
									)}
								</div>
							</div>
						)}
					</Card>

					{busyOnlineSlots && busyOnlineSlots.freeTime.length > 0 && (
						<Card className="w-64 p-3 shadow-lg bg-white border-red-500 ml-2">
							<div className="flex items-center justify-between mb-3">
								<span className="text-sm font-medium text-gray-600">
									Занятые слоты
								</span>
							</div>
							<ScrollArea className="h-64">
								<div className="space-y-2">
									{busyOnlineSlots.freeTime.map((timeRange, index) => (
										<div
											key={index}
											className="flex items-center justify-between bg-gray-50 rounded-md p-2">
											<span className="text-sm">
												{formatTime({
													hours: timeRange.startTime.hour,
													minutes: timeRange.startTime.minute,
												})}{' '}
												-{' '}
												{formatTime({
													hours: timeRange.endTime.hour,
													minutes: timeRange.endTime.minute,
												})}
											</span>
										</div>
									))}
								</div>
							</ScrollArea>
						</Card>
					)}
				</motion.div>
			</motion.div>
		</AnimatePresence>,
		document.body,
	)
}

export const useTimeRangePicker = (initialRanges: TimeRange[] = []) => {
	const [isOpen, setIsOpen] = useState(false)
	const [ranges, setRanges] = useState<TimeRange[]>(initialRanges)
	const [position, setPosition] = useState<{x: number; y: number} | undefined>()

	const openPicker = (x?: number, y?: number) => {
		if (x && y) {
			setPosition({x, y})
		}
		setIsOpen(true)
	}

	const closePicker = () => {
		setIsOpen(false)
		setPosition(undefined)
	}

	return {
		isOpen,
		ranges,
		position,
		openPicker,
		closePicker,
		setRanges,
	}
}

export default TimeRangePicker
