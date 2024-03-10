import React, {useEffect} from 'react'
import {ICell} from '../../types'
import s from './index.module.scss'
import {Select, SelectOption, OptionGroup, Option} from '@mui/base'
import Arrow from '../../assets/arrow'
import socket from '../../socket'
import {useSelector} from 'react-redux'

const daysInMonth = (date: Date) => {
	let res = new Date(date.getFullYear(), date.getMonth() + 2, 0).getDate()
	console.log('Date', res)
	console.log('Days in month', res)
	return res
}

interface ICalendar {
	className?: string
	cells?: ICell[]
}

export const Calendar = ({className, cells}: ICalendar) => {
	const [currentCells, setCurrentCells] = React.useState<ICell[]>()
	const currentMonth = useSelector((state: any) => state.currentMonth)
	const currentYear = useSelector((state: any) => state.currentYear)

	// useEffect(() => {}, [currentMonth])

	socket.once('getMonth', (data) => {
		setCurrentCells(data)
		console.log(data)
	})

	// Ваш импорт и код до возвращения компонента

	const firstDayOfWeekIndex = 1

	const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

	return (
		<div className={s.calendar + ' ' + (className || '')}>
			<table className={s.table}>
				<thead className={s.head}>
					<tr>
						{weekdays.map((day, index) => (
							<th key={index} className={s.th}>
								{day}
							</th>
						))}
					</tr>
				</thead>
				<tbody className={s.body}>
					{Array.from({length: 6}, (_, weekIndex) => (
						<tr className={s.tr} key={weekIndex}>
							{Array.from({length: 7}, (_, dayIndex) => {
								let day =
									((weekIndex * 7 +
										dayIndex -
										(new Date(currentYear, currentMonth, 1).getDay() === 0
											? 7
											: new Date(currentYear, currentMonth, 1).getDay() - 0) +
										firstDayOfWeekIndex) %
										daysInMonth(new Date(currentYear, currentMonth, 0))) +
									1

								let cell = currentCells?.find(
									(item) => item.day == day && item.month == currentMonth + 1,
								)

								// console.log(cell)

								return (
									<td className={s.td} key={dayIndex}>
										<div className={s.content}>
											<p id="day" className={s.dayIndex}>
												{day} - {currentCells?.length}
											</p>
											{cell && (
												// cell.day
												<div className={s.data}>
													<p className={s.dataField}>
														<p>Занятий: {cell.lessonsCount}</p>
														<p>{cell.lessonsPrice}руб.</p>{' '}
													</p>
													<p className={s.dataField}>
														<p>Работ: {cell.workCount}</p>
														<p>{cell.workPrice}руб.</p>{' '}
													</p>
												</div>
											)}
										</div>
									</td>
								)
							})}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	)
}

export default Calendar
