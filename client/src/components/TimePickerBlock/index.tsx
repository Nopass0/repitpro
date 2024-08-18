import React, {useState, useEffect} from 'react'
import s from './index.module.scss'
import {format, parseISO} from 'date-fns'
import axios from 'axios'

interface OccupiedTimeSlot {
	date: string
	slots: Array<{
		startTime: string
		endTime: string
	}>
}

interface TimePickerBlockProps {
	token: string
	startDate: string
	endDate: string
}

const API_BASE_URL = 'http://localhost:3000' // Базовый URL для API

async function fetchOccupiedTimeSlots(
	token: string,
	startDate: string,
	endDate: string,
): Promise<OccupiedTimeSlot[]> {
	try {
		const response = await axios.get(`${API_BASE_URL}/occupied-time-slots`, {
			params: {token, startDate, endDate},
		})
		return response.data
	} catch (error) {
		console.error('Error fetching occupied time slots:', error)
		return []
	}
}

const TimePickerBlock: React.FC<TimePickerBlockProps> = ({
	token,
	startDate,
	endDate,
}: TimePickerBlockProps) => {
	const [occupiedSlots, setOccupiedSlots] = useState<OccupiedTimeSlot[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function loadOccupiedSlots() {
			setLoading(true)
			const slots = await fetchOccupiedTimeSlots(token, startDate, endDate)
			setOccupiedSlots(slots)
			setLoading(false)
		}

		loadOccupiedSlots()
	}, [token, startDate, endDate])

	return (
		<div
			className={s.TimePicker}
			style={{
				width: occupiedSlots.length === 0 && !loading ? '189px' : 'auto',
			}}>
			<p className={s.Title}>Занятые даты:</p>
			{loading ? (
				<p>Загрузка...</p>
			) : occupiedSlots.length > 0 ? (
				<div className={s.Dates}>
					<ul>
						{occupiedSlots.flatMap((day) =>
							day.slots.map((slot, index) => (
								<li key={`${day.date}-${index}`}>
									с {format(parseISO(day.date), 'yyyy.MM.dd')} {slot.startTime}{' '}
									до {format(parseISO(day.date), 'yyyy.MM.dd')} {slot.endTime}
								</li>
							)),
						)}
					</ul>
				</div>
			) : (
				<p className={s.Title}>Занятых дат нет</p>
			)}
		</div>
	)
}

export default TimePickerBlock
