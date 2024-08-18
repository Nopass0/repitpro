import React, {useState} from 'react'
import s from './index.module.scss'

interface TimePickerBlockProps {
	busyDates?: string[]
}

const TimePickerBlock: React.FC<TimePickerBlockProps> = ({
	busyDates,
}: TimePickerBlockProps) => {
	return (
		<div className={s.TimePicker} style={{width: !busyDates && '189px'}}>
			<p className={s.Title}>Занятые даты:</p>
			{busyDates ? (
				<div className={s.Dates}>
					<ul>
						<li>с 2024.10.10 12:00 до 2024.10.10 13:00</li>

						<li>с 2024.10.10 12:00 до 2024.10.10 13:00</li>
					</ul>
				</div>
			) : (
				<>
					<p className={s.Title}>Занятых дат, нет</p>
				</>
			)}
		</div>
	)
}

export default TimePickerBlock
