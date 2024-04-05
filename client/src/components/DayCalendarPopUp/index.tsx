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

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [students, setStudents] = React.useState<
		{
			nameStudent: string
			costOneLesson: string
			studentId: string
			itemName: string
			tryLessonCheck: boolean
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

	return (
		<div style={style} className={s.wrapper}>
			<header className={s.Header}>
				<div className={s.HeaderItems}>
					<DataSlidePicker className={s.dataSlidePicker} dateMode />
					<button onClick={onExit}>
						<CloseIcon className={s.closeIcon} />
					</button>
				</div>
			</header>
			<Line width="700px" className={s.LineHeader} />
			<section className={s.MainBlock}>
				{students &&
					students.map((student: any) => (
						<>
							<DayCalendarLine
								key={student._id}
								LineClick={LineClick}
								iconClick={iconClick}
								icon={GroupOnline}
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
			<section className={s.ThreeBtnWrapper}>
				<button className={`${s.EditBtn} ${s.active}`}>Редактировать</button>
				<button className={`${s.SaveBtn}`}>Сохранить</button>
				<button className={s.PlusBtn}>
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
						Доход: <b>{students.reduce((a, b) => +a + +b.costOneLesson, 0)}₽</b>
					</p>
				</div>
			</footer>
		</div>
	)
}

export default DayCalendarPopUp
