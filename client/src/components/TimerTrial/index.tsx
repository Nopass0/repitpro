import React, {useState} from 'react'
import ReactDOM from 'react-dom'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import CloseIcon from '@mui/icons-material/Close'

interface TimePickerTrialProps {
	onTimeChange: (
		startHour: number,
		startMinute: number,
		endHour: number,
		endMinute: number,
	) => void
	onExit?: () => void
	freeSlots: any
	currentDay: string
	lessonDuration?: number
}

const TimePickerTrial: React.FC<TimePickerTrialProps> = ({
	onTimeChange,
	onExit,
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

	const isTimeAvailable = (
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

		if (normalizedMinutes >= 60) {
			normalizedHours += Math.floor(normalizedMinutes / 60)
			normalizedMinutes = normalizedMinutes % 60
		} else if (normalizedMinutes < 0) {
			normalizedHours -= 1
			normalizedMinutes = 60 + normalizedMinutes
		}

		if (normalizedHours >= 22) {
			normalizedHours = 8
			normalizedMinutes = 0
		} else if (normalizedHours < 8) {
			normalizedHours = 8
			normalizedMinutes = 0
		}

		return [normalizedHours, normalizedMinutes]
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
				isTimeAvailable(
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

			// Calculate default end time based on lesson duration
			const defaultEndMinutes = newMinutes + (lessonDuration || 60)
			const defaultEndHours = newHours + Math.floor(defaultEndMinutes / 60)
			const normalizedEndMinutes = defaultEndMinutes % 60

			if (
				isTimeAvailable(
					newHours,
					newMinutes,
					defaultEndHours,
					normalizedEndMinutes,
				)
			) {
				setSelectedHours(newHours)
				setSelectedMinutes(newMinutes)
				setEndHours(defaultEndHours)
				setEndMinutes(normalizedEndMinutes)
				setErrorMessage('')
			} else {
				setErrorMessage('Выбранное время пересекается с занятым слотом')
			}
		}
	}

	const handleNext = () => {
		if (!isSelectingEndTime) {
			setIsSelectingEndTime(true)
		} else {
			if (
				isTimeAvailable(selectedHours, selectedMinutes, endHours, endMinutes)
			) {
				onTimeChange(selectedHours, selectedMinutes, endHours, endMinutes)
				onExit && onExit()
			} else {
				setErrorMessage('Выбранное время пересекается с занятым слотом')
			}
		}
	}

	const timePickerContent = (
		<div
			className={s.overlay}
			onClick={(e) => {
				if (e.target === e.currentTarget) {
					onExit && onExit()
				}
			}}>
			<div className={s.timePickerModal}>
				<div className={s.header}>
					<h1 className={s.title}>
						{isSelectingEndTime
							? 'Время окончания занятия'
							: 'Время начала занятия'}
					</h1>
					<button onClick={onExit} className={s.closeButton}>
						<CloseIcon style={{color: 'red'}} />
					</button>
				</div>

				<div className={s.timePickerContent}>
					<div className={s.timeSelector}>
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

						<div className={s.separator}>:</div>

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

					<button className={s.nextButton} onClick={handleNext}>
						{isSelectingEndTime ? 'Сохранить' : 'Далее'}
					</button>
				</div>
			</div>
		</div>
	)

	return ReactDOM.createPortal(timePickerContent, document.body)
}

export default TimePickerTrial
