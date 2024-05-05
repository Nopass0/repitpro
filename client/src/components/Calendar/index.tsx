import React, {useEffect, useState} from 'react'
import {ICell, ECurrentDayPopUp, ELeftMenuPage} from '../../types'
import s from './index.module.scss'
import Arrow from '../../assets/arrow'
import socket from '../../socket'
import {useDispatch, useSelector} from 'react-redux'
import GroupOnline from '../../assets/1.svg'
import Online from '../../assets/2.svg'
import HomeStudent from '../../assets/3.svg'
import Group from '../../assets/4.svg'
import Home from '../../assets/5.svg'
import Client from '../../assets/6.svg'
import Line from '../Line'
import DayCalendarPopUp from '../DayCalendarPopUp/index'
import DayStudentPopUp from '../DayStudentPopUp/index'
import DataSlidePicker from '../DataSlidePicker'
import DayClientPopUp from '../DayClientPopUp/index'
import {format} from 'date-fns'

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

enum PagePopup {
	DayCalendar,
	DayStudent,
	DayClient,
	None,
}

const months = [
	'Январь',
	'Февраль',
	'Март',
	'Апрель',
	'Май',
	'Июнь',
	'Июль',
	'Август',
	'Сентябрь',
	'Октябрь',
	'Ноябрь',
	'Декабрь',
]

export const Calendar = ({className, cells}: ICalendar) => {
	const [currentCells, setCurrentCells] = useState<ICell[]>()
	let currentMonth = useSelector((state: any) => state.currentMonth)
	let cacheMonth = currentMonth
	const currentYear = useSelector((state: any) => state.currentYear)

	let token = useSelector((state: any) => state.user.token)
	const hiddenNum = useSelector((state: any) => state.hiddenNum)
	const details = useSelector((state: any) => state.details)
	const currentScheduleDayClientId = useSelector(
		(state: any) => state.currentScheduleDayClientId,
	)
	const currentLeftMenu = useSelector((state: any) => state.leftMenu)
	
	const currentScheduleDay = useSelector(
		(state: any) => state.currentScheduleDay,
	)
	console.log(currentScheduleDay, 'currentScheduleDay')

	const currentPopUpType = useSelector((state: any) => state.currentPopUpType)

	const dispatch = useDispatch()

	let currentPartOfMonth = 1 // 0 - previous month, 1 - current month, 2 - next month
	const [pagePopup, setPagePopup] = useState<PagePopup | null>(null)
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

	useEffect(() => {
		socket.emit('getMonth', {currentMonth, currentYear, token: token})
	}, [])

	// Ваш импорт и код до возвращения компонента

	const firstDayOfWeekIndex = 1

	const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

	//string as money format (Ex: 1000 => 1 000, 10000 => 10 000, 100000 => 100 000, 10=> 10)
	const toMoneyFormat = (num: number) => {
		return num
			.toString()
			.split('')
			.reverse()
			.reduce((prev, next, index) => {
				return (index % 3 ? next : next + ' ') + prev
			})
	}
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)
	const [clients, setClients] = React.useState<any[]>()
	useEffect(() => {
		socket.emit('getClientsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
	}, [])
	socket.once('getClientsByDate', (data: any) => {
		console.log('getClientsByDate', data)
		setClients(data)
	})

	useEffect(() => {
		if (details) {
			setPagePopup(PagePopup.None)
			dispatch({type: 'SET_CURRENT_OPENED_SCHEDULE_DAY', payload: ''})
		}
	}, [details])

	useEffect(() => {
		if (
			currentLeftMenu === ELeftMenuPage.MainPage && pagePopup !== PagePopup.DayCalendar
		) {
			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: String(format(new Date(), 'dd')),
					month: String(
						(currentPartOfMonth == 1
							? currentMonth + 1
							: currentPartOfMonth == 0
							? currentMonth - 1
							: currentPartOfMonth == 2
							? currentMonth + 2
							: currentMonth) - 1,
					),
					year: String(currentYear),
				},
			})
			setPagePopup(PagePopup.DayCalendar)
		}
	}, [currentLeftMenu])
	return (
		<div className={`${className} ${!details ? s.calendarMini : ''}`}>
			<DataSlidePicker className={s.dataSlidePicker} dateMode />
			<div className={`${s.calendar}`}>
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

									if (
										weekdays[dayIndex] == 'Пн' &&
										day == 1 &&
										weekIndex == 0
									) {
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
										<td
											className={s.td}
											onClick={() => {
												dispatch({
													type: 'SET_CALENDAR_NOW_POPUP',
													payload: {
														day: String(day),
														month: String(
															(currentPartOfMonth == 1
																? currentMonth + 1
																: currentPartOfMonth == 0
																? currentMonth - 1
																: currentPartOfMonth == 2
																? currentMonth + 2
																: currentMonth) - 1,
														),
														year: String(currentYear),
													},
												})
												setPagePopup(PagePopup.DayCalendar)
											}}
											key={dayIndex}>
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
												{/* {cell && ( */}

												<div
													className={
														s.data + ' ' + (currentPartOfMonth !== 1 && s.grey)
													}>
													{details ? (
														<>
															<p className={s.dataField}>
																<p>
																	Занятий:{' '}
																	<b>
																		{cell
																			? cell.lessonsCount.toString().slice(0, 2)
																			: 0}
																	</b>
																</p>
																<p style={{display: hiddenNum ? 'none' : ''}}>
																	<b>
																		{cell
																			? toMoneyFormat(cell.lessonsPrice)
																					.toString()
																					.slice(0, 8)
																			: 0}
																		₽
																	</b>
																</p>
															</p>
															<p className={s.dataField}>
																<p>
																	Работ:
																	<b>
																		{cell
																			? cell.workCount.toString().slice(0, 2)
																			: 0}
																	</b>
																</p>
																<p style={{display: hiddenNum ? 'none' : ''}}>
																	<b>
																		{cell
																			? toMoneyFormat(cell.workPrice)
																					.toString()
																					.slice(0, 8)
																			: 0}
																		₽
																	</b>
																</p>
															</p>
															<p className={s.dataField}>
																<p>Доход</p>
																<p style={{display: hiddenNum ? 'none' : ''}}>
																	<b>
																		{cell
																			? toMoneyFormat(
																					cell.workPrice + cell.lessonsPrice,
																			  )
																					.toString()
																					.slice(0, 12)
																			: 0}
																		₽
																	</b>
																</p>
															</p>
														</>
													) : (
														<>
															<div className={s.LineWrapper}>
																{cell &&
																	Array.from({
																		length: Math.min(55, cell.lessonsCount),
																	}).map((_, i) => (
																		<Line
																			key={i}
																			width="30px"
																			className={`${s.LineLesson} ${s.green}`}
																		/>
																	))}
																{cell &&
																	Array.from({
																		length: Math.min(55, cell.workCount),
																	}).map((_, i) => (
																		<Line
																			key={i}
																			width="30px"
																			className={`${s.LineLesson} ${s.blue}`}
																		/>
																	))}
															</div>
														</>
													)}
												</div>
												{/* )} */}
											</div>
										</td>
									)
								})}
							</tr>
						))}
					</tbody>
				</table>
				{/* <div className={s.sum}> */}
				<table className={s.sumTable}>
					<thead className={s.head}>
						<tr>
							<th className={s.th}>
								{/* <Select
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
									</Select> */}
								<p className={s.sumText}>Расчёт дохода</p>
								{/* <Line width="190px" className={s.Line} /> */}
							</th>
						</tr>
					</thead>
					<tbody className={s.body}>
						{sumParamsOfWeeks.map((item, index) => (
							<>
								<tr className={s.tr}>
									<td className={s.td}>
										<div className={s.content}>
											<p id="day" className={s.dayIndex}>
												За неделю
											</p>
											<div className={s.data}>
												{item.lessonsCount > 0 && (
													<>
														<p className={s.dataField}>
															<p>
																Занятий:{' '}
																<b>
																	{item.lessonsCount.toString().slice(0, 2)}
																</b>
															</p>
															<p style={{display: hiddenNum ? 'none' : ''}}>
																<b>
																	{toMoneyFormat(item.lessonsPrice)
																		.toString()
																		.slice(0, 12)}
																	₽
																</b>
															</p>
														</p>
													</>
												)}
												{item.workCount > 0 && (
													<>
														<p className={s.dataField}>
															<p>
																Работ:{' '}
																<b>{item.workCount.toString().slice(0, 2)}</b>
															</p>
															<p style={{display: hiddenNum ? 'none' : ''}}>
																<b>
																	{toMoneyFormat(item.workPrice)
																		.toString()
																		.slice(0, 12)}
																	₽
																</b>
															</p>
														</p>
													</>
												)}

												<p className={s.dataField}>
													<p>
														Доход:{' '}
														<b>
															{(item.workCount + item.lessonsCount)
																.toString()
																.slice(0, 2)}
														</b>
													</p>
													<p style={{display: hiddenNum ? 'none' : ''}}>
														<b>
															{toMoneyFormat(item.workPrice + item.lessonsPrice)
																.toString()
																.slice(0, 12)}
															₽
														</b>
													</p>
												</p>
											</div>
										</div>
										{/* {index <= 4 && (
												<Line width="190px" className={s.LineSumTr} />
											)} */}
									</td>
								</tr>
							</>
						))}
					</tbody>
				</table>
				{/* </div> */}
			</div>

			{/* TODO */}
			<div className={s.footer}>
				<div className={s.info}>
					<div className={s.info__init}>
						<div className={s.block}>
							<p className={s.Title}>Ученики</p>
							<div className={s.ImgWrapper}>
								<div className={s.infoImg}>
									<img src={Home} alt={Home} />
									<p>Занятие на дому</p>
								</div>
								<div className={s.infoImg}>
									<img src={HomeStudent} alt={HomeStudent} />
									<p>
										Занятие <br /> у ученика
									</p>
								</div>
								<div className={s.infoImg}>
									<img src={Group} alt={Group} />
									<p>Группа</p>
								</div>
								<div className={s.infoImg}>
									<img src={Online} alt={Online} />
									<p>Онлайн</p>
								</div>
								<div className={s.infoImg}>
									<img src={GroupOnline} alt={GroupOnline} />
									<p>Группа онлайн</p>
								</div>
								<div className={s.infoImgMobile}>
									<img src={Client} alt={Client} />
									<p>Заказчики</p>
								</div>
								<div className={s.devider}></div>
							</div>
						</div>
						<div className={s.ClientWrapper}>
							<p className={s.Title}>Заказчики</p>
							<div className={s.infoImg}>
								<img src={Client} alt={Client} />
							</div>
						</div>
					</div>
				</div>
				<div className={s.IncomeNPrognosisWrapper}>
					<div className={s.IncomeWrapper}>
						<div className={s.IncomeInit}>
							<p className={s.Title}>Доход с начала месяца</p>
							<div className={s.Lessons}>
								<p>
									Занятий:{' '}
									<b>
										{sumParamsOfWeeks.reduce((a, b) => a + b.lessonsCount, 0)}
									</b>
								</p>
								<b style={{display: hiddenNum ? 'none' : ''}}>
									{toMoneyFormat(
										sumParamsOfWeeks.reduce((a, b) => a + b.lessonsPrice, 0),
									)}{' '}
									₽
								</b>
							</div>
							<div className={s.Works}>
								<p>
									Работ:{' '}
									<b>{sumParamsOfWeeks.reduce((a, b) => a + b.workCount, 0)}</b>
								</p>
								<b style={{display: hiddenNum ? 'none' : ''}}>
									{toMoneyFormat(
										sumParamsOfWeeks.reduce((a, b) => a + b.workPrice, 0),
									)}{' '}
									₽
								</b>
							</div>
							<div className={s.Income}>
								<p>Доход</p>
								<b style={{display: hiddenNum ? 'none' : ''}}>
									{toMoneyFormat(
										sumParamsOfWeeks.reduce(
											(a, b) => a + b.lessonsPrice + b.workPrice,
											0,
										),
									)}{' '}
									₽
								</b>
							</div>
						</div>
					</div>
					<div className={s.PrognosisWrapper}>
						<div className={s.PrognosisInit}>
							<p className={s.Title}>Прогноз на {months[currentMonth]}</p>
							<div className={s.Lessons}>
								<p>
									Занятий:{' '}
									<b>
										{sumParamsOfWeeks.reduce((a, b) => a + b.lessonsCount, 0)}
									</b>
								</p>
								<b style={{display: hiddenNum ? 'none' : ''}}>
									{toMoneyFormat(
										sumParamsOfWeeks.reduce((a, b) => a + b.lessonsPrice, 0),
									)}{' '}
									₽
								</b>
							</div>
							<div className={s.Works}>
								<p>
									Работ:{' '}
									<b>{sumParamsOfWeeks.reduce((a, b) => a + b.workCount, 0)}</b>
								</p>
								<b style={{display: hiddenNum ? 'none' : ''}}>
									{toMoneyFormat(
										sumParamsOfWeeks.reduce((a, b) => a + b.workPrice, 0),
									)}{' '}
									₽
								</b>
							</div>
							<div className={s.Income}>
								<p>Доход</p>
								<b style={{display: hiddenNum ? 'none' : ''}}>
									{toMoneyFormat(
										sumParamsOfWeeks.reduce(
											(a, b) => a + b.lessonsPrice + b.workPrice,
											0,
										),
									)}{' '}
									₽
								</b>
							</div>
						</div>
					</div>
				</div>
			</div>
			{pagePopup === PagePopup.DayCalendar && currentScheduleDay === '' && (
				<div className={`${details ? s.PagePopUpWrap : s.PagePopUpWrapMobile}`}>
					<DayCalendarPopUp
						className={s.DayCalendarPopUp}
						onExit={() => setPagePopup(PagePopup.None)}
						LineClick={() => {
							setPagePopup(PagePopup.DayStudent)
						}}
					/>
				</div>
			)}
			{currentScheduleDay !== '' &&
				currentPopUpType === ECurrentDayPopUp.Student && (
					<div
						className={`${details ? s.PagePopUpWrap : s.PagePopUpWrapMobile}`}>
						<DayStudentPopUp
							style={{
								position: 'relative',
								top: '150px',
								margin: 'auto',
							}}
							icon={Home}
							// name="Группа Бэтта 1 Математика"
							// address="г. Москва, ул. Мясницкая, 4"
							date={`${calendarNowPopupDay} ${new Date(calendarNowPopupMonth)
								.toLocaleString('ru-RU', {
									month: 'long',
								})
								.replace(/^./, (firstLetter) =>
									firstLetter.toLocaleUpperCase(),
								)} ${calendarNowPopupYear}`}
							// time="Пн 10:00 - 12:00"
							onExit={() =>
								dispatch({type: 'SET_CURRENT_OPENED_SCHEDULE_DAY', payload: ''})
							}
						/>
					</div>
				)}
			{currentScheduleDay !== '' &&
				currentPopUpType === ECurrentDayPopUp.Group && (
					<div
						className={`${details ? s.PagePopUpWrap : s.PagePopUpWrapMobile}`}>
						<DayStudentPopUp
							style={{
								position: 'relative',
								top: '150px',
								margin: 'auto',
							}}
							groupId={currentScheduleDay}
							icon={Home}
							date={`${calendarNowPopupDay} ${new Date(calendarNowPopupMonth)
								.toLocaleString('ru-RU', {
									month: 'long',
								})
								.replace(/^./, (firstLetter) =>
									firstLetter.toLocaleUpperCase(),
								)} ${calendarNowPopupYear}`}
							// time="Пн 10:00 - 12:00"
							isGroup
							onExit={() =>
								dispatch({type: 'SET_CURRENT_OPENED_SCHEDULE_DAY', payload: ''})
							}
						/>
					</div>
				)}
			{currentScheduleDay !== '' &&
				currentPopUpType === ECurrentDayPopUp.Client && (
					<div
						className={`${details ? s.PagePopUpWrap : s.PagePopUpWrapMobile}`}>
						<DayClientPopUp
							clientId={currentScheduleDayClientId}
							style={{
								position: 'relative',
								top: '150px',
								margin: 'auto',
							}}
							date={`${calendarNowPopupDay} ${new Date(calendarNowPopupMonth)
								.toLocaleString('ru-RU', {
									month: 'long',
								})
								.replace(/^./, (firstLetter) =>
									firstLetter.toLocaleUpperCase(),
								)} ${calendarNowPopupYear}`}
							onExit={() =>
								dispatch({
									type: 'SET_CURRENT_OPENED_SCHEDULE_DAY',
									payload: '',
								})
							}
						/>
					</div>
				)}
		</div>
	)
}

export default Calendar
