import s from './index.module.scss'
import Line from '../Line'
import CloseIcon from '@mui/icons-material/Close'
import DayCalendarLine from '../DayCalendarLine/index'
import * as mui from '@mui/base'

import Plus from '../../assets/ItemPlus.svg'
import {useDispatch, useSelector} from 'react-redux'
import {useEffect, useRef, useState} from 'react'
import socket from '../../socket'
import React from 'react'
import {debounce} from 'lodash'

import Arrow, {ArrowType} from '../../assets/arrow'
import DayCalendarLineClient from '../DayCalendarLineClient'
interface IDayCalendarPopUp {
	style?: React.CSSProperties
	onExit?: () => void
	iconClick?: () => void
	LineClick?: () => void
	className?: string
}
const DayCalendarPopUp = ({
	style,
	onExit,
	iconClick,
	LineClick,
	className,
}: IDayCalendarPopUp) => {
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)

	const currentMonth = useSelector((state: any) => state.currentMonth)
	const currentYear = useSelector((state: any) => state.currentYear)
	const details = useSelector((state: any) => state.details)

	const hiddenNum = useSelector((state: any) => state.hiddenNum)
	const dispath = useDispatch()
	//for date mode
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

	const [editMode, setEditMode] = React.useState(false)

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [students, setStudents] = React.useState<
		{
			nameStudent: string
			costOneLesson: string
			studentId: string
			place: string
			itemName: string
			tryLessonCheck: boolean
			groupName?: string
			id: string
			typeLesson: string
			startTime: {hour: number; minute: number}
			endTime: {hour: number; minute: number}
			type: string
		}[]
	>([])

	const [clients, setClients] = React.useState<any[]>()
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const dispatch = useDispatch()
	const retryCountRef = useRef(0)
	const mountedRef = useRef(false)

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	const fetchData = () => {
		console.log(`Fetching data (Attempt ${retryCountRef.current + 1}/5)`)
		setIsLoading(true)
		setError(null)

		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
		socket.emit('getClientsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
	}

	useEffect(() => {
		let timeoutId: NodeJS.Timeout

		const handleStudentsData = (data: any) => {
			console.log('Received students data:', data)
			if (mountedRef.current) {
				setStudents(data)
				setIsLoading(false)
				clearTimeout(timeoutId)
				retryCountRef.current = 0 // Reset retry count on successful fetch
			}
		}

		const handleClientsData = (data: any) => {
			console.log('Received clients data:', data)
			if (mountedRef.current) {
				setClients(data)
				setIsLoading(false)
				clearTimeout(timeoutId)
				retryCountRef.current = 0 // Reset retry count on successful fetch
			}
		}

		const retryFetch = () => {
			if (retryCountRef.current < 4) {
				// We've already tried once, so we'll retry up to 4 more times
				retryCountRef.current++
				fetchData()
			} else {
				if (mountedRef.current) {
					setError('Failed to fetch data after 5 attempts')
					setIsLoading(false)
				}
			}
		}

		fetchData()

		timeoutId = setTimeout(() => {
			if (isLoading) {
				console.log('Data fetch timeout, retrying...')
				retryFetch()
			}
		}, 5000) // 5 seconds timeout

		socket.on('getStudentsByDate', handleStudentsData)
		socket.on('getClientsByDate', handleClientsData)

		return () => {
			socket.off('getStudentsByDate', handleStudentsData)
			socket.off('getClientsByDate', handleClientsData)
			clearTimeout(timeoutId)
		}
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

	//hour or minute to normal view. Ex: 12:3 to 12:03/ 1:5 to 01:05
	const timeNormalize = (time: number) => {
		return time < 10 ? '0' + time : time
	}

	console.log(students)

	const onUpdate = (
		id: string,
		editIcon: string,
		editName: string,
		editTimeStart: string,
		editTimeEnd: string,
		editItem: string,
		editPrice: string,
		isDelete: boolean,
		studentId: string,
	) => {
		// Split the editTimeStart into startHour, startMinute
		const [startHour, startMinute] = editTimeStart.split(':')

		// Split the editTimeEnd into endHour, endMinute
		const [endHour, endMinute] = editTimeEnd.split(':')

		console.log('onUpdate', id, editIcon, editName, editTimeStart, editTimeEnd)

		// Create a new array with the updated student data
		const updatedStudents = students.map((student) =>
			student.id === id
				? {
						...student,
						nameStudent: editName,
						costOneLesson: editPrice,
						itemName: editItem,
						tryLessonCheck: false, // You can update this based on your requirements
						typeLesson: editIcon,
						isDelete: isDelete,
						studentId: studentId,
						startTime: {
							hour: parseInt(startHour),
							minute: parseInt(startMinute),
						},
						endTime: {hour: parseInt(endHour), minute: parseInt(endMinute)},
					}
				: student,
		)

		// Update the students state with the updated data
		setStudents(updatedStudents)
	}

	function handleSend(
		students: {
			nameStudent: string
			costOneLesson: string
			studentId: string
			itemName: string
			tryLessonCheck: boolean
			id: string
			typeLesson: string
			startTime: {hour: number; minute: number}
			endTime: {hour: number; minute: number}
		}[],
	) {
		console.log(
			students,
			'handleSend',
			token,
			calendarNowPopupDay,
			calendarNowPopupMonth,
			calendarNowPopupYear,
		)
		for (let i = 0; i < students.length; i++) {
			socket.emit('updateStudentSchedule', {
				id: students[i].id,
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				lessonsPrice: students[i].costOneLesson,
				studentName: students[i].nameStudent,
				itemName: students[i].itemName,
				typeLesson: students[i].typeLesson,
				startTime: students[i].startTime,
				endTime: students[i].endTime,
				isChecked: students[i].tryLessonCheck,
				token: token,
			})
		}
	}

	// Function to manually trigger data fetch
	const refreshData = () => {
		// Re-fetch data
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
		socket.emit('getClientsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
	}

	// useEffect(() => {
	// 	console.log('Students upd: ', students)
	// }, [students])

	const updData = (day: string, month: string, year: string) => {
		//remove leading 0
		day = day.replace(/^0+/, '')
		month = month.replace(/^0+/, '')

		dispath({
			type: 'SET_CALENDAR_NOW_POPUP',
			payload: {
				day: day,
				month: month,
				year: year,
			},
		})

		socket.emit('getStudentsByDate', {
			day: day,
			month: month,
			year: year,
			token: token,
		})
		socket.emit('getClientsByDate', {
			day: day,
			month: month,
			year: year,
			token: token,
		})
	}

	const debouncedOnUpdate = debounce(updData, 2)

	const manualRefresh = () => {
		retryCountRef.current = 0 // Reset retry count
		fetchData()
	}

	const handleAddDay = () => {
		//get calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear (Ex: '1', '1', "2023") and remake it to Date and add 1 day
		const newDate = new Date(
			calendarNowPopupYear,
			Number(calendarNowPopupMonth) - 1,
			calendarNowPopupDay,
		)
		newDate.setDate(newDate.getDate() + 1)

		//get new day, month, year as string (Ex: '1', '1', "2023") and set it to calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear
		const newDay = String(newDate.getDate()).padStart(2, '0')
		const newMonth = String(newDate.getMonth() + 1).padStart(2, '0')
		const newYear = String(newDate.getFullYear())

		debouncedOnUpdate(newDay, newMonth, newYear)
	}

	const handlePrevDay = () => {
		//get calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear (Ex: '1', '1', "2023") and remake it to Date and subtract 1 day
		const newDate = new Date(
			calendarNowPopupYear,
			Number(calendarNowPopupMonth) - 1,
			calendarNowPopupDay,
		)
		newDate.setDate(newDate.getDate() - 1)

		//get new day, month, year as string (Ex: '1', '1', "2023") and set it to calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear
		const newDay = String(newDate.getDate()).padStart(2, '0')
		const newMonth = String(newDate.getMonth() + 1).padStart(2, '0')
		const newYear = String(newDate.getFullYear())

		debouncedOnUpdate(newDay, newMonth, newYear)
	}

	const handeleAddStudentDay = () => {
		socket.emit('createStudentSchedule', {
			token: token,
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
		})
		socket.once('createStudentSchedule', (data: any) => {
			if (data.created != '' || data.created != undefined) {
				console.log('createStudentSchedule', data)
				students.push(
					// @ts-ignore
					{
						id: data.created,
						nameStudent: '',
						costOneLesson: '',
						itemName: '',
						studentId: '',
						typeLesson: '1',
						tryLessonCheck: false,
						startTime: {hour: 0, minute: 0},
						endTime: {hour: 0, minute: 0},
					},
				)
				setEditMode(true),
					//delete all undefined from students array
					setStudents(students.filter((student) => student !== undefined))
			}
		})
	}

	return (
		<div
			style={style}
			className={`${!details ? s.wrapper : s.wrapperNoDetails} ${className}`}>
			<div>
				<header className={s.Header}>
					<div className={s.HeaderItems}>
						{/* <DataSlidePicker className={s.dataSlidePicker} dateMode /> */}
						<div></div>
						<div className={s.dataSlidePicker}>
							<button
								className={s.btn}
								onClick={() => {
									handlePrevDay()
								}}>
								<span>
									<Arrow direction={ArrowType.left} />
								</span>
							</button>
							<mui.Select
								className={s.muiSelect}
								multiple={true}
								renderValue={(option: mui.SelectOption<number> | null) => {
									return (
										<>
											<p className={s.btnText}>
												{calendarNowPopupDay}{' '}
												{months[Number(calendarNowPopupMonth) - 1]}{' '}
												{calendarNowPopupYear}г.
											</p>
										</>
									)
								}}></mui.Select>

							<button
								className={s.btn}
								onClick={() => {
									handleAddDay()
								}}>
								<span>
									<Arrow direction={ArrowType.right} />
								</span>
							</button>
						</div>
						{/* this */}
						<button className={s.closeIconWrap} onClick={onExit}>
							<CloseIcon className={s.closeIcon} />
						</button>
					</div>
				</header>
				<section className={s.MainBlock}>
					<Line width="700px" className={s.LineHeader} />
					{clients &&
						clients.map((client: any, index: number) => (
							<>
								{client.clientId !== clients[index + 1]?.clientId && (
									<>
										<DayCalendarLineClient
											id={client.clientId}
											key={client.id}
											name={client.studentName}
											price={client.workPrice}
											studentId=""
											item={client.itemName}
											priceCheck={
												client.workStages[0].endPaymentPrice ===
												client.workPrice
													? client.workStages[0].endPaymentPayed
													: client.workStages[0].firstPaymentPayed
											}
											procent={`
											${Math.round((client.workPrice / client.totalWorkPrice) * 100)}`}
										/>
										<Line className={s.Line} width="700px" />
									</>
								)}
							</>
						))}

					{students &&
						students.map((student: any) => (
							<>
								<DayCalendarLine
									key={student._id}
									id={student.id}
									place={student.place}
									studentId={student.studentId}
									groupId={student.groupId}
									students={students}
									onUpdate={(
										id,
										editIcon,
										editName,
										editTimeStart,
										editTimeEnd,
										editItem,
										editPrice,
										isDelete,
										studentId,
									) =>
										onUpdate(
											id,
											editIcon,
											editName,
											editTimeStart,
											editTimeEnd,
											editItem,
											editPrice,
											isDelete,
											studentId,
										)
									}
									LineClick={LineClick}
									iconClick={iconClick}
									icon={student.type == 'group' ? 3 : student.typeLesson}
									editMode={editMode}
									timeStart={
										timeNormalize(student.startTime.hour) +
										':' +
										timeNormalize(student.startTime.minute)
									}
									timeEnd={
										timeNormalize(student.endTime.hour) +
										':' +
										timeNormalize(student.endTime.minute)
									}
									name={
										student.type == 'student'
											? student.nameStudent
											: student.groupName
									}
									item={student.itemName}
									price={student.costOneLesson}
									prevpay={student.tryLessonCheck}
									type={student.type}
								/>
							</>
						))}
					{Array.from({length: 8}).map((_, index: number) => (
						<>
							<div className={s.FakeBlock} key={index}></div>
							<Line className={s.Line} width="700px" />
						</>
					))}
				</section>
			</div>
			<div>
				<section className={s.ThreeBtnWrapper}>
					<button
						onClick={() => editMode === false && setEditMode(!editMode)}
						className={`${s.EditBtn} ${!editMode && s.active}`}>
						Редактировать
					</button>
					<button
						onClick={() => {
							editMode === true && setEditMode(!editMode)
							console.log('Saved version: ', students)
							handleSend(students)
						}}
						className={`${s.SaveBtn} ${editMode && s.active}`}>
						Сохранить
					</button>
					<button
						onClick={() => {
							handeleAddStudentDay()
						}}
						className={s.PlusBtn}>
						<img src={Plus} alt={Plus} />
					</button>
				</section>
				<footer className={s.Footer}>
					<div className={s.Left}>
						<div className={s.Lessons}>
							<p>
								Занятий: <b>{students.length}</b>
							</p>
							{!hiddenNum && (
								<b>{students.reduce((a, b) => +a + +b.costOneLesson, 0)}₽</b>
							)}
						</div>
						<div className={s.works}>
							<p>
								Работ: <b>{clients && clients.length}</b>
							</p>
							{!hiddenNum && (
								<b>
									{clients && clients.reduce((a, b) => +a + +b.workPrice, 0)}₽
								</b>
							)}
						</div>
					</div>
					<div className={s.income}>
						{!hiddenNum && (
							<p>
								Доход:{' '}
								<b>{students.reduce((a, b) => +a + +b.costOneLesson, 0)}₽</b>
							</p>
						)}
					</div>
				</footer>
			</div>
		</div>
	)
}

export default DayCalendarPopUp
