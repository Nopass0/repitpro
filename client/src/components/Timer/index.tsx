import React, {useState} from 'react'
import s from './index.module.scss'
import * as mui from '@mui/material'
import Arrow, {ArrowType} from '../../assets/arrow'

interface TimePickerProps {
	onTimeChange: (hours: number, minutes: number) => void
	title: string
}

const TimePicker: React.FC<TimePickerProps> = ({
	onTimeChange,
	title,
}: TimePickerProps) => {
	const [selectedHours, setSelectedHours] = useState<number>(0)
	const [selectedMinutes, setSelectedMinutes] = useState<number>(0)

	const handleHourChange = (increment: number) => {
		setSelectedHours((prevHours) => {
			const newHours = (prevHours + increment + 24) % 24
			// onTimeChange(newHours, selectedMinutes)
			return newHours
		})
	}

	const handleMinuteChange = (increment: number) => {
		setSelectedMinutes((prevMinutes) => {
			const newMinutes = (prevMinutes + increment + 60) % 60
			// onTimeChange(selectedHours, newMinutes)
			return newMinutes
		})
	}

	const renderTimeOption = (value: number) => {
		const newValue = (value + 24) % 24
		return <div className={s.timeOption}>{newValue}</div>
	}

	return (
		<div className={s.timePicker}>
			<h1>{title}</h1>
			<div className={s.hourPicker}>
				<button className={s.arrowButton} onClick={() => handleHourChange(-1)}>
					{/* SVG for up arrow */}
					<Arrow direction={ArrowType.up} />
				</button>
				<div className={s.timeDisplay}>{selectedHours}</div>
				<div className={s.timeOptions}>
					{renderTimeOption(selectedHours - 1)}
					{renderTimeOption(selectedHours)}
					{renderTimeOption(selectedHours + 1)}
				</div>
				<button className={s.arrowButton} onClick={() => handleHourChange(1)}>
					{/* SVG for down arrow */}
					<Arrow direction={ArrowType.down} />
				</button>
			</div>
			<div className={s.minutePicker}>
				<button
					className={s.arrowButton}
					onClick={() => handleMinuteChange(-5)}>
					{/* SVG for up arrow */}
					<Arrow direction={ArrowType.up} />
				</button>
				<div className={s.timeDisplay}>{selectedMinutes}</div>
				<div className={s.timeOptions}>
					{renderTimeOption(selectedMinutes - 5)}
					{renderTimeOption(selectedMinutes)}
					{renderTimeOption(selectedMinutes + 5)}
				</div>
				<button className={s.arrowButton} onClick={() => handleMinuteChange(5)}>
					{/* SVG for down arrow */}
					<Arrow direction={ArrowType.down} />
				</button>
			</div>
			<mui.Button
				onClick={() => {
					onTimeChange(selectedHours, selectedMinutes)
				}}>
				Save
			</mui.Button>
		</div>
	)
}

export default TimePicker
