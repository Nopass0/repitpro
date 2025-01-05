import React from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {Clock, Plus, Trash2, ChevronDown, ChevronUp} from 'lucide-react'
import {Button} from '@/ui/button'
import {Card} from '@/ui/card'
import TimeRangePicker, {useTimeRangePicker} from '@/ui/time-range-picker'
import {cn} from '@/lib/utils'

const Schedule = ({
	currentItemIndex,
	items,
	changeItemValue,
	isEditMode,
	freeSlots,
	busyOnlineSlots,
}) => {
	const weekDays = [
		{day: 'Пн', index: 0, isWeekend: false},
		{day: 'Вт', index: 1, isWeekend: false},
		{day: 'Ср', index: 2, isWeekend: false},
		{day: 'Чт', index: 3, isWeekend: false},
		{day: 'Пт', index: 4, isWeekend: false},
		{day: 'Сб', index: 5, isWeekend: true},
		{day: 'Вс', index: 6, isWeekend: true},
	]

	const [expandedDays, setExpandedDays] = React.useState({})
	const {
		isOpen: isTimePickerOpen,
		ranges: selectedRanges,
		position,
		openPicker,
		closePicker,
		setRanges,
	} = useTimeRangePicker()

	const [activeDay, setActiveDay] = React.useState(null)

	// Преобразование старого формата данных в новый
	React.useEffect(() => {
		if (!items[currentItemIndex].timeLinesArray[0].timeRanges) {
			const updatedTimelines = items[currentItemIndex].timeLinesArray.map(
				(timeline) => {
					if (
						timeline.startTime.hour !== 0 ||
						timeline.startTime.minute !== 0
					) {
						return {
							...timeline,
							timeRanges: [
								{
									startTime: timeline.startTime,
									endTime: timeline.endTime,
								},
							],
						}
					}
					return {
						...timeline,
						timeRanges: [],
					}
				},
			)
			changeItemValue(currentItemIndex, 'timeLinesArray', updatedTimelines)
		}
	}, [currentItemIndex, items])

	const handleTimeRangeSelect = (dayIndex, ranges) => {
		const updatedTimelines = [...items[currentItemIndex].timeLinesArray]
		const timeRanges = ranges.map((range) => {
			const [startHour, startMinute] = range.startTime.split(':').map(Number)
			const [endHour, endMinute] = range.endTime.split(':').map(Number)
			return {
				startTime: {hour: startHour, minute: startMinute},
				endTime: {hour: endHour, minute: endMinute},
			}
		})

		updatedTimelines[dayIndex] = {
			...updatedTimelines[dayIndex],
			active: ranges.length > 0,
			timeRanges: timeRanges,
			startTime: timeRanges[0]?.startTime || {hour: 0, minute: 0},
			endTime: timeRanges[0]?.endTime || {hour: 0, minute: 0},
		}

		changeItemValue(currentItemIndex, 'timeLinesArray', updatedTimelines)
		setActiveDay(null)
		closePicker()
	}

	const handleDayClick = (event, dayIndex, timeline) => {
		const rect = event.currentTarget.getBoundingClientRect()
		setActiveDay(dayIndex)

		const existingRanges =
			timeline.timeRanges?.map((time) => ({
				startTime: `${String(time.startTime.hour).padStart(2, '0')}:${String(time.startTime.minute).padStart(2, '0')}`,
				endTime: `${String(time.endTime.hour).padStart(2, '0')}:${String(time.endTime.minute).padStart(2, '0')}`,
			})) || []

		setRanges(existingRanges)
		openPicker(rect.right + 10, rect.top)
	}

	const handleClearDay = (dayIndex) => {
		const updatedTimelines = [...items[currentItemIndex].timeLinesArray]
		updatedTimelines[dayIndex] = {
			...updatedTimelines[dayIndex],
			active: false,
			timeRanges: [],
			startTime: {hour: 0, minute: 0},
			endTime: {hour: 0, minute: 0},
		}
		changeItemValue(currentItemIndex, 'timeLinesArray', updatedTimelines)
	}

	const toggleDayExpansion = (index) => {
		setExpandedDays((prev) => ({
			...prev,
			[index]: !prev[index],
		}))
	}

	return (
		<div className="space-y-2">
			<Card className="p-4 border-green-500">
				<div className="divide-y divide-gray-200">
					{weekDays.map(({day, index, isWeekend}) => {
						const timeline = items[currentItemIndex].timeLinesArray[index]
						const hasRanges =
							timeline.timeRanges?.length > 0 ||
							timeline.startTime.hour !== 0 ||
							timeline.startTime.minute !== 0
						const isExpanded = expandedDays[index]

						return (
							<div
								key={index}
								className={cn('py-3', isWeekend && 'text-red-50')}>
								<div className="flex items-center justify-between gap-4 px-2">
									<div className="flex items-center gap-4 min-w-0 flex-1">
										<span
											className={cn(
												'font-medium w-8',
												hasRanges && 'text-green-500',
												isWeekend && 'text-red-500',
											)}>
											{day}
										</span>

										{hasRanges && (
											<div className="flex items-center gap-2 flex-1">
												<span
													className={cn(
														'px-2 py-1 rounded-md text-sm whitespace-nowrap',
														'bg-green-100 text-green-700',
													)}>
													{timeline.timeRanges
														? `${String(timeline.timeRanges[0].startTime.hour).padStart(2, '0')}:${String(timeline.timeRanges[0].startTime.minute).padStart(2, '0')} -
                             ${String(timeline.timeRanges[0].endTime.hour).padStart(2, '0')}:${String(timeline.timeRanges[0].endTime.minute).padStart(2, '0')}`
														: `${String(timeline.startTime.hour).padStart(2, '0')}:${String(timeline.startTime.minute).padStart(2, '0')} -
                             ${String(timeline.endTime.hour).padStart(2, '0')}:${String(timeline.endTime.minute).padStart(2, '0')}`}
												</span>
												{(timeline.timeRanges?.length > 1 ||
													timeline.timeRanges?.length === 1) && (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => toggleDayExpansion(index)}
														className="p-0 h-6">
														{isExpanded ? (
															<ChevronUp className="h-4 w-4" />
														) : (
															<ChevronDown className="h-4 w-4" />
														)}
													</Button>
												)}
											</div>
										)}
									</div>

									{!isEditMode && (
										<div className="flex items-center gap-2">
											{hasRanges ? (
												<>
													<Button
														variant="ghost"
														size="icon"
														className={cn(
															'h-8 w-8',
															'text-green-500 hover:text-green-600',
														)}
														onClick={(e) => handleDayClick(e, index, timeline)}>
														<Plus className="h-4 w-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														className="h-8 w-8 text-red-500 hover:text-red-600"
														onClick={() => handleClearDay(index)}>
														<Trash2 className="h-4 w-4" />
													</Button>
												</>
											) : (
												<Button
													variant="ghost"
													size="sm"
													className={cn(
														'gap-1.5',
														'text-green-500 hover:text-green-600',
													)}
													onClick={(e) => handleDayClick(e, index, timeline)}>
													<Clock className="h-4 w-4" />
													Добавить
												</Button>
											)}
										</div>
									)}
								</div>

								{/* Expanded time ranges */}
								{isExpanded &&
									hasRanges &&
									timeline.timeRanges &&
									timeline.timeRanges.length > 0 && (
										<div className="mt-2 pl-12 space-y-1">
											{timeline.timeRanges.map((range, rangeIndex) => (
												<div
													key={rangeIndex}
													className={cn(
														'px-2 py-1 rounded-md text-sm',
														'bg-green-50 text-green-700',
													)}>
													{`${String(range.startTime.hour).padStart(2, '0')}:${String(range.startTime.minute).padStart(2, '0')} -
                        ${String(range.endTime.hour).padStart(2, '0')}:${String(range.endTime.minute).padStart(2, '0')}`}
												</div>
											))}
										</div>
									)}
							</div>
						)
					})}
				</div>
			</Card>

			<AnimatePresence>
				{isTimePickerOpen && activeDay !== null && (
					<TimeRangePicker
						duration={items[currentItemIndex].lessonDuration}
						onTimeRangeSelect={(ranges) =>
							handleTimeRangeSelect(activeDay, ranges)
						}
						onClose={closePicker}
						existingRanges={selectedRanges}
						position={position}
						busySlots={freeSlots[activeDay]}
						busyOnlineSlots={busyOnlineSlots[activeDay]}
					/>
				)}
			</AnimatePresence>
		</div>
	)
}

export default Schedule
