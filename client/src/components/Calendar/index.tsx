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
	let currentMonth = useSelector((state: any) => state.currentMonth)
	let cacheMonth = currentMonth
	const currentYear = useSelector((state: any) => state.currentYear)

	let currentPartOfMonth = 1 // 0 - previous month, 1 - current month, 2 - next month

	let sumParamsOfWeeks = [
		{
			lessonsCount: 0,
			lessonsPrice: 0,
			workCount: 0,
			workPrice: 0,
		},
		{
			lessonsCount: 0,
			lessonsPrice: 0,
			workCount: 0,
			workPrice: 0,
		},
		{
			lessonsCount: 0,
			lessonsPrice: 0,
			workCount: 0,
			workPrice: 0,
		},
		{
			lessonsCount: 0,
			lessonsPrice: 0,
			workCount: 0,
			workPrice: 0,
		},
		{
			lessonsCount: 0,
			lessonsPrice: 0,
			workCount: 0,
			workPrice: 0,
		},
		{
			lessonsCount: 0,
			lessonsPrice: 0,
			workCount: 0,
			workPrice: 0,
		},
	]

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
							<th
								key={index}
								className={
									s.th + ' ' + (day === 'Сб' || day === 'Вс' ? s.red : '')
								}>
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
										(new Date(currentYear, currentMonth, 1).getDay() == 0
											? 7
											: new Date(currentYear, currentMonth, 1).getDay() - 0) +
										firstDayOfWeekIndex) %
										daysInMonth(new Date(currentYear, currentMonth, 0))) +
									1
								
								

								if (day < 1 && currentPartOfMonth == 1) {
									//get previous month
									day =
										daysInMonth(new Date(currentYear, currentMonth - 1, 0)) +
										day

									currentPartOfMonth = 0

									//get previous month cells
									let prevMonthCell = currentCells?.find(
										(item) => item.month == currentMonth,
									)

									console.log('prevMonthCells', prevMonthCell)
								}

								if (day == 1 && currentPartOfMonth == 1) {
									currentPartOfMonth = 2
								}

								if (day == 1 && currentPartOfMonth == 0) {
									currentPartOfMonth = 1
								}

								if (currentPartOfMonth == 0 && day < 1) {
									day =
										daysInMonth(new Date(currentYear, currentMonth - 1, 0)) +
										day
								}

								if (weekdays[dayIndex] == 'Пн' && day == 1 && weekIndex == 0) {
									currentPartOfMonth = 1
								}
								let cell = currentCells?.find(
									(item) =>
										item.day == day &&
										item.month ==
											(currentPartOfMonth == 1
												? currentMonth + 1
												: currentPartOfMonth == 0
												? currentMonth - 1
												: currentPartOfMonth == 2
												? currentMonth + 2
												: currentMonth),
								)

								//get current day of week
								let dayOfWeek = new Date(
									currentYear,
									currentPartOfMonth == 1
										? currentMonth + 1
										: currentPartOfMonth == 0
										? currentMonth - 1
										: currentPartOfMonth == 2
										? currentMonth + 2
										: currentMonth,
									day,
								).getDay()

								//sum params of week
								sumParamsOfWeeks[weekIndex] = {
									lessonsCount:
										sumParamsOfWeeks[weekIndex].lessonsCount +
										(cell ? cell.lessonsCount : 0),
									lessonsPrice:
										sumParamsOfWeeks[weekIndex].lessonsPrice +
										(cell ? cell.lessonsPrice : 0),
									workCount:
										sumParamsOfWeeks[weekIndex].workCount +
										(cell ? cell.workCount : 0),
									workPrice:
										sumParamsOfWeeks[weekIndex].workPrice +
										(cell ? cell.workPrice : 0),
								}

								console.log(cell)
								console.log(
									'День: ',
									day,
									'Месяц: ',
									currentMonth,
									'Неделя: ',
									weekIndex,
								)

								return (
									<td className={s.td} key={dayIndex}>
										<div className={s.content}>
											<p
												id="day"
												className={
													s.dayIndex +
													' ' +
													(dayIndex === 6 || dayIndex === 5 ? s.red : '') +
													' ' +
													(currentPartOfMonth !== 1 && s.grey)
												}>
												{day}
											</p>
											{cell && (
												// cell.day
												<div className={s.data + ' ' + (currentPartOfMonth !== 1 && s.grey) }>
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
			<div className={s.sum}>
				<table className={s.sumTable}>
					<thead className={s.head}>
						<tr>
							<th className={s.th}>
								<Select
									defaultValue={1}
									renderValue={(option: SelectOption<number> | null) => {
										return (
											<div className={s.selectContainer}>
												<p className={s.selectText}>Добавить</p>
												<Arrow />
											</div>
										)
									}}
									placeholder="Select"
									className={s.select}>
									<OptionGroup className={s.optionGroup}>
										<Option value={1} className={s.option}>
											Ученика
										</Option>
										<Option value={2} className={s.option}>
											Группу
										</Option>
										<Option value={3} className={s.option}>
											Заказчика
										</Option>
									</OptionGroup>
								</Select>
							</th>
						</tr>
					</thead>
					<tbody className={s.body}>
						{sumParamsOfWeeks.map((item, index) => (
							<tr className={s.tr}>
								<td className={s.td}>
									<div className={s.content}>
										<p id="day" className={s.dayIndex}>
											За неделю
										</p>
										<div className={s.data}>
											<p className={s.dataField}>
												<p>Занятий: {item.lessonsCount}</p>
												<p>{item.lessonsPrice}руб.</p>
											</p>
											<p className={s.dataField}>
												<p>Работ: {item.workCount}</p>
												<p>{item.workPrice}руб.</p>
											</p>
										</div>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default Calendar
