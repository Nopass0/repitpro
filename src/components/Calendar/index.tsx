import React from 'react'
import {ICell} from '../../types'
import s from './index.module.scss'
import {Select, SelectOption, OptionGroup, Option} from '@mui/base'
import Arrow from '../../assets/arrow'

interface ICalendar {
	className?: string
	cells?: ICell[]
}

export const Calendar = ({className, cells}: ICalendar) => {
	return (
		//(table) heder with week days and and content 7x6 cells with data
		<div className={s.calendar + ' ' + (className || '')}>
			<table className={s.table}>
				<thead className={s.head}>
					<tr>
						<th className={s.th}>Пн</th>
						<th className={s.th}>Вт</th>
						<th className={s.th}>Ср</th>
						<th className={s.th}>Чт</th>
						<th className={s.th}>Пт</th>
						<th className={s.th}>Сб</th>
						<th className={s.th}>Вс</th>
					</tr>
				</thead>
				<tbody className={s.body}>
					{Array.from({length: 6}, (_, weekIndex) => (
						<tr className={s.tr} key={weekIndex}>
							{Array.from({length: 7}, (_, dayIndex) => {
								const cell = cells?.[weekIndex * 7 + dayIndex]

								return (
									<td className={s.td} key={dayIndex}>
										<div className={s.content}>
											<p id="day" className={s.dayIndex}>
												{cell ? `${cell.day}` : ''}
											</p>
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
						<tr className={s.tr}>
							<td className={s.td}>
								<div className={s.content}>
									<p id="day" className={s.dayIndex}>
										За неделю
									</p>
								</div>
							</td>
						</tr>
						<tr className={s.tr}>
							<td className={s.td}>
								<div className={s.content}>
									<p id="day" className={s.dayIndex}>
										За неделю
									</p>
								</div>
							</td>
						</tr>
						<tr className={s.tr}>
							<td className={s.td}>
								<div className={s.content}>
									<p id="day" className={s.dayIndex}>
										За неделю
									</p>
								</div>
							</td>
						</tr>
						<tr className={s.tr}>
							<td className={s.td}>
								<div className={s.content}>
									<p id="day" className={s.dayIndex}>
										За неделю
									</p>
								</div>
							</td>
						</tr>
						<tr className={s.tr}>
							<td className={s.td}>
								<div className={s.content}>
									<p id="day" className={s.dayIndex}>
										За неделю
									</p>
								</div>
							</td>
						</tr>
						<tr className={s.tr}>
							<td className={s.td}>
								<div className={s.content}>
									<p id="day" className={s.dayIndex}>
										За неделю
									</p>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default Calendar
