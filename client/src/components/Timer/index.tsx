import React, {useState} from 'react'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import CloseIcon from '@mui/icons-material/Close'
interface TimePickerProps {
	onTimeChange: (hours: number, minutes: number) => void
	title: string
	onExit?: () => void
}

const TimePicker: React.FC<TimePickerProps> = ({
	onTimeChange,
	title,
	onExit,
}: TimePickerProps) => {
	const [selectedHours, setSelectedHours] = useState<number>(8)
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
			<div
				style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
				<h1 className={s.Title}>{title}</h1>
				<button onClick={onExit} style={{position: 'relative', left: '10px'}}>
					<CloseIcon style={{color: 'red'}} />
				</button>
			</div>
			<div className={s.Pick}>
				<div className={s.hourPicker}>
					<button
						className={s.arrowButton}
						onClick={() => handleHourChange(-1)}>
						{/* SVG for up arrow */}
						<Arrow direction={ArrowType.up} />
					</button>
					<button
						onClick={() => handleHourChange(-1)}
						className={s.PrevNextTime}>
						{selectedHours - 1 < 0
							? 23
							: (selectedHours - 1).toString().padStart(2, '0')}
					</button>
					<div className={s.timeDisplay}>
						{selectedHours.toString().padStart(2, '0')}
					</div>
					<button
						onClick={() => handleHourChange(1)}
						className={s.PrevNextTime}>
						{selectedHours + 1 > 23
							? '00'
							: (selectedHours + 1).toString().padStart(2, '0')}
					</button>

					<button className={s.arrowButton} onClick={() => handleHourChange(1)}>
						{/* SVG for down arrow */}
						<Arrow direction={ArrowType.down} />
					</button>
				</div>
				<div className={s.CenterTime}>
					<p>:</p>
				</div>
				<div className={s.minutePicker}>
					<button
						className={s.arrowButton}
						onClick={() => handleMinuteChange(-5)}>
						{/* SVG for up arrow */}
						<Arrow direction={ArrowType.up} />
					</button>

					<button
						onClick={() => handleMinuteChange(-5)}
						className={s.PrevNextTime}>
						{selectedMinutes === 0
							? 55
							: selectedMinutes === 5
							? '00'
							: selectedMinutes === 10
							? '05'
							: selectedMinutes - 5}
					</button>
					<div className={s.timeDisplay}>
						{selectedMinutes === 0
							? '00'
							: selectedMinutes === 5
							? '05'
							: selectedMinutes}
					</div>
					<button
						onClick={() => handleMinuteChange(5)}
						className={s.PrevNextTime}>
						{selectedMinutes === 0
							? '05'
							: selectedMinutes === 55
							? '00'
							: selectedMinutes + 5}
					</button>

					<button
						className={s.arrowButton}
						onClick={() => handleMinuteChange(5)}>
						{/* SVG for down arrow */}
						<Arrow direction={ArrowType.down} />
					</button>
				</div>
			</div>
			<button
				className={s.SaveBtn}
				onClick={() => {
					onTimeChange(selectedHours, selectedMinutes)
				}}>
				Сохранить
			</button>
		</div>
	)
}

export default TimePicker
