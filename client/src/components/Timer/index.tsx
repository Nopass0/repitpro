import React, {useState, useEffect} from 'react'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import CloseIcon from '@mui/icons-material/Close'

interface TimePickerProps {
	onTimeChange: (
		startHours: number,
		startMinutes: number,
		endHours: number,
		endMinutes: number,
	) => void
	title: string
	onExit?: () => void
	addBlock?: boolean
	freeSlots: any
	currentDay: string
	lessonDuration?: number
}

const TimePicker: React.FC<TimePickerProps> = ({
	onTimeChange,
	title,
	onExit,
	addBlock,
	freeSlots,
	currentDay,
	lessonDuration,
}) => {
	const [selectedHours, setSelectedHours] = useState<number>(8)
	const [selectedMinutes, setSelectedMinutes] = useState<number>(0)
	const [endHours, setEndHours] = useState<number>(9)
	const [endMinutes, setEndMinutes] = useState<number>(0)
	const [isSelectingEndTime, setIsSelectingEndTime] = useState<boolean>(false)
	const [errorMessage, setErrorMessage] = useState<string>('')

	const occupiedSlotsForDay =
		freeSlots?.find((slot) => slot.day === currentDay)?.freeTime || []

	const isIntervalAvailable = (
		startHours: number,
		startMinutes: number,
		endHours: number,
		endMinutes: number,
	): boolean => {
		const startTime = startHours * 60 + startMinutes
		const endTime = endHours * 60 + endMinutes

		if (startTime < 8 * 60 || endTime > 22 * 60) return false
		if (endTime <= startTime) return false

		return !occupiedSlotsForDay.some((slot) => {
			const slotStart = slot.startTime.hour * 60 + slot.startTime.minute
			const slotEnd = slot.endTime.hour * 60 + slot.endTime.minute

			return (
				(startTime >= slotStart && startTime < slotEnd) ||
				(endTime > slotStart && endTime <= slotEnd) ||
				(startTime <= slotStart && endTime >= slotEnd)
			)
		})
	}

	const normalizeTime = (hours: number, minutes: number): [number, number] => {
		let normalizedHours = hours
		let normalizedMinutes = minutes

		// Handle minutes overflow
		if (normalizedMinutes >= 60) {
			normalizedHours += Math.floor(normalizedMinutes / 60)
			normalizedMinutes = normalizedMinutes % 60
		}
		// Handle minutes underflow
		else if (normalizedMinutes < 0) {
			normalizedHours -= 1
			normalizedMinutes = 60 + normalizedMinutes
		}

		// Handle hours overflow/underflow
		if (normalizedHours >= 22) {
			normalizedHours = 8
			normalizedMinutes = 0
		} else if (normalizedHours < 8) {
			normalizedHours = 8
			normalizedMinutes = 0
		}

		return [normalizedHours, normalizedMinutes]
	}

	const findNextAvailableTime = (
		hours: number,
		minutes: number,
		increment: number,
	): [number, number] => {
		let attempts = 0
		const maxAttempts = 180 // 15 часов * 12 (5-минутные интервалы)

		let [newHours, newMinutes] = normalizeTime(hours, minutes)

		while (attempts < maxAttempts) {
			const [endHours, endMinutes] = calculateEndTime(newHours, newMinutes)

			if (isIntervalAvailable(newHours, newMinutes, endHours, endMinutes)) {
				return [newHours, newMinutes]
			}

			;[newHours, newMinutes] = normalizeTime(newHours, newMinutes + increment)
			attempts++
		}

		return [8, 0] // Возвращаем начало рабочего дня, если не нашли свободный слот
	}

	const calculateEndTime = (
		startHours: number,
		startMinutes: number,
	): [number, number] => {
		if (!lessonDuration) return [startHours + 1, startMinutes]

		const totalMinutes = startMinutes + lessonDuration
		const endHours = startHours + Math.floor(totalMinutes / 60)
		const endMinutes = totalMinutes % 60

		return [endHours, endMinutes]
	}

	const handleTimeChange = (
		hoursIncrement: number,
		minutesIncrement: number,
	) => {
		if (isSelectingEndTime) {
			const [newEndHours, newEndMinutes] = normalizeTime(
				endHours + hoursIncrement,
				endMinutes + minutesIncrement,
			)

			const startTime = selectedHours * 60 + selectedMinutes
			const newEndTime = newEndHours * 60 + newEndMinutes

			if (newEndTime <= startTime) {
				setErrorMessage('Время окончания должно быть больше времени начала')
				return
			}

			if (
				isIntervalAvailable(
					selectedHours,
					selectedMinutes,
					newEndHours,
					newEndMinutes,
				)
			) {
				setEndHours(newEndHours)
				setEndMinutes(newEndMinutes)
				setErrorMessage('')
			} else {
				setErrorMessage('Выбранное время пересекается с занятым слотом')
			}
		} else {
			const [newHours, newMinutes] = normalizeTime(
				selectedHours + hoursIncrement,
				selectedMinutes + minutesIncrement,
			)

			const [newEndHours, newEndMinutes] = calculateEndTime(
				newHours,
				newMinutes,
			)

			if (
				isIntervalAvailable(newHours, newMinutes, newEndHours, newEndMinutes)
			) {
				setSelectedHours(newHours)
				setSelectedMinutes(newMinutes)
				setEndHours(newEndHours)
				setEndMinutes(newEndMinutes)
				setErrorMessage('')
			} else {
				setErrorMessage('Выбранное время пересекается с занятым слотом')
			}
		}
	}

	useEffect(() => {
		const initializeTime = () => {
			// Начинаем с 8:00
			let initHours = 8
			let initMinutes = 0

			const [newHours, newMinutes] = findNextAvailableTime(
				initHours,
				initMinutes,
				5,
			)
			const [endHours, endMinutes] = calculateEndTime(newHours, newMinutes)

			setSelectedHours(newHours)
			setSelectedMinutes(newMinutes)
			setEndHours(endHours)
			setEndMinutes(endMinutes)
		}

		initializeTime()
	}, [currentDay, freeSlots, lessonDuration])

	const handleSave = () => {
		if (isSelectingEndTime) {
			if (
				isIntervalAvailable(
					selectedHours,
					selectedMinutes,
					endHours,
					endMinutes,
				)
			) {
				onTimeChange(selectedHours, selectedMinutes, endHours, endMinutes)
				onExit && onExit()
			} else {
				setErrorMessage('Выбранное время пересекается с занятым слотом')
			}
		} else {
			setIsSelectingEndTime(true)
		}
	}

	const getSortedOccupiedSlots = () => {
		return [...occupiedSlotsForDay]
			.sort((a, b) => {
				const timeA = a.startTime.hour * 60 + a.startTime.minute
				const timeB = b.startTime.hour * 60 + b.startTime.minute
				return timeA - timeB
			})
			.filter(
				(slot) =>
					slot.startTime.hour !== 0 ||
					slot.startTime.minute !== 0 ||
					slot.endTime.hour !== 0 ||
					slot.endTime.minute !== 0,
			)
	}

	return (
		<div className={s.wrapper}>
			<div className={s.timePicker}>
				<div className={s.header}>
					<h1 className={s.Title}>
						{isSelectingEndTime
							? 'Время окончания занятия'
							: 'Время начала занятия'}
					</h1>
					<button onClick={onExit} className={s.closeButton}>
						<CloseIcon style={{color: 'red'}} />
					</button>
				</div>
				<div className={s.Pick}>
					<div className={s.hourPicker}>
						<button
							className={s.arrowButton}
							onClick={() => handleTimeChange(-1, 0)}>
							<Arrow direction={ArrowType.up} />
						</button>
						<div className={s.timeDisplay}>
							{(isSelectingEndTime ? endHours : selectedHours)
								.toString()
								.padStart(2, '0')}
						</div>
						<button
							className={s.arrowButton}
							onClick={() => handleTimeChange(1, 0)}>
							<Arrow direction={ArrowType.down} />
						</button>
					</div>
					<div className={s.CenterTime}>
						<p>:</p>
					</div>
					<div className={s.minutePicker}>
						<button
							className={s.arrowButton}
							onClick={() => handleTimeChange(0, -5)}>
							<Arrow direction={ArrowType.up} />
						</button>
						<div className={s.timeDisplay}>
							{(isSelectingEndTime ? endMinutes : selectedMinutes)
								.toString()
								.padStart(2, '0')}
						</div>
						<button
							className={s.arrowButton}
							onClick={() => handleTimeChange(0, 5)}>
							<Arrow direction={ArrowType.down} />
						</button>
					</div>
				</div>
				{errorMessage && <div className={s.errorMessage}>{errorMessage}</div>}
				<button className={s.SaveBtn} onClick={handleSave}>
					{isSelectingEndTime ? 'Сохранить' : 'Далее'}
				</button>
			</div>
			{addBlock && getSortedOccupiedSlots().length > 0 && (
				<div className={s.freeSlotContainer}>
					<h2 className={s.freeSlotTitle}>Занятые слоты на {currentDay}:</h2>
					<div className={s.freeSlotList}>
						{getSortedOccupiedSlots().map((slot, index) => (
							<div key={index} className={s.occupiedSlot}>
								{`${slot.startTime.hour.toString().padStart(2, '0')}:${slot.startTime.minute
									.toString()
									.padStart(2, '0')} - 
                ${slot.endTime.hour.toString().padStart(2, '0')}:${slot.endTime.minute
									.toString()
									.padStart(2, '0')}`}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}

export default TimePicker
