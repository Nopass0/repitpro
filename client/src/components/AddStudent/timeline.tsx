import React, {useEffect, useState} from 'react'
import s from './index.module.scss'
import ScheduleDate from '../ScheduleDate'
import ScheduleIcon from '@mui/icons-material/Schedule'
import TimePicker from '../Timer'

interface ITimeLine {
	day: string
	intervalTime?: number
}

const TimeLine = ({day, intervalTime = 0}: ITimeLine) => {
	const [active, setActive] = useState(false)
	const [iAmCallEvent, setIAmCallEvent] = useState(false)
	const [startTime, setStartTime] = useState<{hour: number; minute: number}>({
		hour: 0,
		minute: 0,
	})
	const [endTime, setEndTime] = useState<{hour: number; minute: number}>({
		hour: 0,
		minute: 0,
	})

	const handleClick = () => {
		setActive(!active)
		setIAmCallEvent(true)
		const event = new CustomEvent('openTimePicker', {detail: {active: !active}})
		window.dispatchEvent(event)
	}

	useEffect(() => {
		const handleOpenTimePicker = (e: CustomEvent) => {
			if (e.detail.active !== undefined) {
				setActive(e.detail.active)
				setIAmCallEvent(false)
			}
		}
		window.addEventListener('openTimePicker', handleOpenTimePicker)
		return () => {
			window.removeEventListener('openTimePicker', handleOpenTimePicker)
		}
	}, []) // useEffect should run only once after the component mounted

	const handleStartTimeChange = (hour: number, minute: number) => {
		setStartTime({hour, minute})
		if (intervalTime === 0) {
			// If interval timer is 0, set the same start time as end time
			setEndTime({hour, minute})
		}
	}

	const handleEndTimeChange = (hour: number, minute: number) => {
		setEndTime({hour, minute})
	}

	return (
		<>
			<div className={s.ScheduleItem}>
				<div
					style={{display: 'flex', flexDirection: 'row', alignItems: 'center'}}>
					<ScheduleDate>
						<p>{day}</p>
					</ScheduleDate>
					<p style={{marginLeft: '10px', fontWeight: '400'}}>
						{startTime.hour}:{startTime.minute} - {endTime.hour}:
						{endTime.minute}
					</p>
				</div>
				<button onClick={handleClick} className={s.ScheduleBtn}>
					<ScheduleIcon />
				</button>
			</div>
			{active && (
				<div className={s.timePickerWrapper}>
					<TimePicker
						title="-"
						onTimeChange={
							intervalTime === 0 ? handleStartTimeChange : handleEndTimeChange
						}
					/>
				</div>
			)}
		</>
	)
}

export default TimeLine
