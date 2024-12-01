import React, {useState, useEffect} from 'react'
import {createPortal} from 'react-dom'
import {motion, AnimatePresence} from 'framer-motion'
import {ChevronUp, ChevronDown, Plus, X, Clock} from 'lucide-react'
import {Button} from '@/ui/button'
import {Card} from '@/ui/card'
import {ScrollArea} from '@/ui/scroll-area'
import {cn} from '@/lib/utils'

interface TimeRange {
	startTime: string
	endTime: string
}

interface TimeRangePickerProps {
	duration?: number
	onTimeRangeSelect: (ranges: TimeRange[]) => void
	onClose: () => void
	className?: string
	busySlots?: string[]
	existingRanges?: TimeRange[]
	position?: {x: number; y: number}
}

interface TimePickerState {
	hours: number
	minutes: number
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
	busySlots = [],
	existingRanges = [],
	position,
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

	const handleHourChange = (increment: boolean, isStart: boolean) => {
		const setState = isStart ? setStartTime : setEndTime
		setState((prev) => ({
			...prev,
			hours: (prev.hours + (increment ? 1 : -1) + 24) % 24,
		}))
	}

	const handleMinuteChange = (increment: boolean, isStart: boolean) => {
		const setState = isStart ? setStartTime : setEndTime
		setState((prev) => {
			let newMinutes = prev.minutes + (increment ? 5 : -5)
			let newHours = prev.hours

			if (newMinutes >= 60) {
				newMinutes = 0
				newHours = (newHours + 1) % 24
			} else if (newMinutes < 0) {
				newMinutes = 55
				newHours = (newHours - 1 + 24) % 24
			}

			return {hours: newHours, minutes: newMinutes}
		})
	}

	const handleAddRange = () => {
		const newRange = {
			startTime: formatTime(startTime),
			endTime: formatTime(endTime),
		}
		setRanges([...ranges, newRange])
		onTimeRangeSelect([...ranges, newRange])
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

	// Handle overlay click
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
					className="relative"
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
						{/* Header */}
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

						{/* Time Picker */}
						<div className="flex justify-center gap-4 mb-4">
							{/* Hours */}
							<div className="flex flex-col items-center">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleHourChange(true, step === 'start')}>
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
									onClick={() => handleHourChange(false, step === 'start')}>
									<ChevronDown className="h-4 w-4" />
								</Button>
							</div>

							<span className="text-2xl font-bold self-center">:</span>

							{/* Minutes */}
							<div className="flex flex-col items-center">
								<Button
									variant="ghost"
									size="sm"
									onClick={() => handleMinuteChange(true, step === 'start')}>
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
									onClick={() => handleMinuteChange(false, step === 'start')}>
									<ChevronDown className="h-4 w-4" />
								</Button>
							</div>
						</div>

						{/* Continue/Add Button */}
						<Button
							className="w-full mb-2"
							onClick={() => {
								if (step === 'start') {
									setStep('end')
								} else {
									handleAddRange()
									setStep('start')
								}
							}}>
							{step === 'start' ? 'Продолжить' : 'Добавить'}
						</Button>

						{/* Existing Ranges */}
						{ranges.length > 0 && (
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
