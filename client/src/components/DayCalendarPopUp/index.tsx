import s from './index.module.scss'
import Line from '../Line'
import DataSlidePicker from '../DataSlidePicker'
import CloseIcon from '@mui/icons-material/Close'
import DayCalendarLine from '../DayCalendarLine/index'
import GroupOnline from '../../assets/1.svg'
import Online from '../../assets/2.svg'
import HomeStudent from '../../assets/3.svg'
import Group from '../../assets/4.svg'
import Home from '../../assets/5.svg'
import Client from '../../assets/6.svg'
import Plus from '../../assets/ItemPlus.svg'
import {useSelector} from 'react-redux'
import {useEffect} from 'react'
import socket from '../../socket'
import React from 'react'
interface IDayCalendarPopUp {
	style?: React.CSSProperties
	onExit?: () => void
	iconClick?: () => void
	LineClick?: () => void
}
const DayCalendarPopUp = ({
	style,
	onExit,
	iconClick,
	LineClick,
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

	const [editMode, setEditMode] = React.useState(false)

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [students, setStudents] = React.useState<
		{
			nameStudent: string
			costOneLesson: string
			studentId: string
			itemName: string
			tryLessonCheck: boolean
			id: string
			typeLesson: string
			startTime: {hour: number; minute: number}
			endTime: {hour: number; minute: number}
		}[]
	>([])

	useEffect(() => {
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
		socket.once('getStudentsByDate', (data: any) => {
			console.log('getStudentsByDate', data)
			setStudents(data)
		})
	}, [])

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
	) => {
		// Split the editTimeStart into startHour, startMinute
		const [startHour, startMinute] = editTimeStart.split(':')

		// Split the editTimeEnd into endHour, endMinute
		const [endHour, endMinute] = editTimeEnd.split(':')

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

	// useEffect(() => {
	// 	console.log('Students upd: ', students)
	// }, [students])

	return (
		<div style={style} className={s.wrapper}>
			<div>
				<header className={s.Header}>
					<div className={s.HeaderItems}>
						{/* this */}
						<DataSlidePicker className={s.dataSlidePicker} dateMode />
						<button onClick={onExit}>
							<CloseIcon className={s.closeIcon} />
						</button>
					</div>
				</header>
				<section className={s.MainBlock}>
					<Line width="700px" className={s.LineHeader} />
					{students &&
						students.map((student: any) => (
							<>
								<DayCalendarLine
									key={student._id}
									id={student.id}
									studentId={student.studentId}
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
									icon={student.typeLesson}
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
									name={student.nameStudent}
									item={student.itemName}
									price={student.costOneLesson}
									prevpay={student.tryLessonCheck}
								/>
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
							setEditMode(!editMode)
							students.push(
								//void object
								{
									id: '-' + Math.random().toString(36).substr(2, 9),
									nameStudent: '',
									costOneLesson: '',
									itemName: '',
									studentId: '-' + Math.random().toString(36).substr(2, 9),
									typeLesson: '1',
									tryLessonCheck: false,
									startTime: {hour: 0, minute: 0},
									endTime: {hour: 0, minute: 0},
								},
							)
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
							<b>{students.reduce((a, b) => +a + +b.costOneLesson, 0)}₽</b>
						</div>
						<div className={s.works}>
							<p>
								Работ: <b>0</b>
							</p>
							<b>0₽</b>
						</div>
					</div>
					<div className={s.income}>
						<p>
							Доход:{' '}
							<b>{students.reduce((a, b) => +a + +b.costOneLesson, 0)}₽</b>
						</p>
					</div>
				</footer>
			</div>
		</div>
	)
}

export default DayCalendarPopUp
