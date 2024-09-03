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

	const currentDaySlots =
		freeSlots.find((slot) => slot.day === currentDay)?.freeTime || []

	const isIntervalAvailable = (
		startHours: number,
		startMinutes: number,
		endHours: number,
		endMinutes: number,
	): boolean => {
		const startTime = startHours * 60 + startMinutes
		const endTime = endHours * 60 + endMinutes
		return currentDaySlots.some((slot) => {
			const slotStartTime = slot.start.hour * 60 + slot.start.minute
			const slotEndTime = slot.end.hour * 60 + slot.end.minute
			return (
				startTime >= slotStartTime &&
				endTime <= slotEndTime &&
				startTime < endTime
			)
		})
	}

	const findNextAvailableTime = (
		hours: number,
		minutes: number,
		increment: number,
	): [number, number] => {
		let newHours = hours
		let newMinutes = minutes
		while (
			!isIntervalAvailable(
				newHours,
				newMinutes,
				(newHours + 1) % 24,
				newMinutes,
			)
		) {
			newMinutes += increment
			if (newMinutes >= 60) {
				newHours = (newHours + 1) % 24
				newMinutes = 0
			} else if (newMinutes < 0) {
				newHours = (newHours - 1 + 24) % 24
				newMinutes = 55
			}
		}
		return [newHours, newMinutes]
	}

	const calculateEndTime = (
		startHours: number,
		startMinutes: number,
	): [number, number] => {
		if (!lessonDuration) return [(startHours + 1) % 24, startMinutes]
		let endMinutes = startMinutes + lessonDuration
		let endHours = (startHours + Math.floor(endMinutes / 60)) % 24
		endMinutes = endMinutes % 60
		return [endHours, endMinutes]
	}

	const handleTimeChange = (
		hoursIncrement: number,
		minutesIncrement: number,
	) => {
		if (isSelectingEndTime) {
			let newEndHours = (endHours + hoursIncrement + 24) % 24
			let newEndMinutes = (endMinutes + minutesIncrement + 60) % 60
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
				setErrorMessage('Выбранный интервал недоступен')
			}
		} else {
			let newHours = (selectedHours + hoursIncrement + 24) % 24
			let newMinutes = (selectedMinutes + minutesIncrement + 60) % 60
			;[newHours, newMinutes] = findNextAvailableTime(
				newHours,
				newMinutes,
				minutesIncrement || 5,
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
				setErrorMessage('Выбранный интервал недоступен')
			}
		}
	}

	useEffect(() => {
		const [startHours, startMinutes] = findNextAvailableTime(8, 0, 5)
		const [endHours, endMinutes] = calculateEndTime(startHours, startMinutes)
		setSelectedHours(startHours)
		setSelectedMinutes(startMinutes)
		setEndHours(endHours)
		setEndMinutes(endMinutes)
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
				setErrorMessage('Выбранный интервал недоступен')
			}
		} else {
			setIsSelectingEndTime(true)
		}
	}

	const handleSlotClick = (slot) => {
		const newStartHours = slot.start.hour
		const newStartMinutes = slot.start.minute
		const [newEndHours, newEndMinutes] = calculateEndTime(
			newStartHours,
			newStartMinutes,
		)
		if (
			isIntervalAvailable(
				newStartHours,
				newStartMinutes,
				newEndHours,
				newEndMinutes,
			)
		) {
			setSelectedHours(newStartHours)
			setSelectedMinutes(newStartMinutes)
			setEndHours(newEndHours)
			setEndMinutes(newEndMinutes)
			setErrorMessage('')
		} else {
			setErrorMessage('Выбранный интервал недоступен')
		}
	}

	return (
		<div className={s.wrapper}>
			<div className={s.timePicker}>
				<div
					style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', textAlign: 'center'}}>
					<h1 className={s.Title}>
						{isSelectingEndTime
							? 'Время окончания занятия'
							: 'Время начала занятия'}
					</h1>
					<button onClick={onExit} style={{position: 'relative'}}>
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
			{addBlock && (
				<div className={s.freeSlotContainer}>
					<h2 className={s.freeSlotTitle}>Свободные слоты на {currentDay}:</h2>
					<div className={s.freeSlotList}>
						{currentDaySlots.map((slot, index) => (
							<div
								key={index}
								className={s.freeSlot}
								onClick={() => handleSlotClick(slot)}>
								{`${slot.start.hour.toString().padStart(2, '0')}:${slot.start.minute
									.toString()
									.padStart(2, '0')} - 
                 ${slot.end.hour.toString().padStart(2, '0')}:${slot.end.minute
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
