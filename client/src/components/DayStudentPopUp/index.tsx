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
import RecordNListen from '../RecordNListen'
import {MenuItem, Select} from '@mui/material'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import CheckBox from '../CheckBox'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import socket from '../../socket'
interface IDayStudentPopUp {
	icon?: any
	name?: string
	address?: string
	date?: string
	time?: string
	style?: React.CSSProperties
	onExit?: () => void
}
const DayStudentPopUp = ({
	icon,
	name,
	address,
	date,
	time,
	style,
	onExit,
}: IDayStudentPopUp) => {
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)
	const currentOpenedStudent = useSelector(
		(state: any) => state.currentOpenedStudent,
	)
	const currentScheduleDay = useSelector(
		(state: any) => state.currentScheduleDay,
	)

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [student, setStudent] = useState<any>({})
	const [isOpened, setIsOpened] = useState(false)

	const [homeWorkComment, setHomeWorkComment] = useState(
		student?.homeWork || '',
	)
	const [classroomComment, setClassroomComment] = useState(
		student?.classWork || '',
	)
	const [homeFiles, setHomeFiles] = useState<any>(student?.homeFiles || [])
	const [classroomFiles, setClassroomFiles] = useState<any>(
		student?.classFiles || [],
	)
	const [homeStudentsPoints, setHomeStudentsPoints] = useState<number>(
		student?.homeStudentsPoints?.points || 1,
	)
	const [classroomStudentsPoints, setClassroomStudentsPoints] =
		useState<number>(student?.classStudentsPoints?.points || 1)

	const handleAddHomeFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		// Проверяем, есть ли уже такой файл в массиве homeFiles
		if (!homeFiles.some((file) => file.name === fileToAdd.name)) {
			setHomeFiles([...homeFiles, fileToAdd])
		} else {
			console.log('Этот файл уже был добавлен.')
		}
	}

	const handleAddClassroomFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		// Проверяем, есть ли уже такой файл в массиве classroomFiles
		if (!classroomFiles.some((file) => file.name === fileToAdd.name)) {
			setClassroomFiles([...classroomFiles, fileToAdd])
		} else {
			console.log('Этот файл уже был добавлен.')
		}
	}

	useEffect(() => {
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
		socket.once('getStudentsByDate', (data: any) => {
			console.log('getStudentsByDate', data)
			//get students array and get by id
			console.log('data', data, 'currentScheduleDay', currentScheduleDay)
			const student = data?.find(
				(student: any) => student.id === currentScheduleDay,
			)
			console.log('student', student)
			setStudent(student || {})
			setHomeWorkComment(student?.homeWork || '')
			setClassroomComment(student?.classWork || '')
			setHomeFiles(student?.homeFiles || [])
			setClassroomFiles(student?.classFiles || [])
			setHomeStudentsPoints(student?.homeStudentsPoints?.points || 1)
			setClassroomStudentsPoints(student?.classStudentsPoints?.points || 1)
		})
		setIsOpened(true)
	}, [])

	useEffect(() => {
		if (currentScheduleDay && isOpened) {
			console.log(
				'New info: ',
				currentScheduleDay,
				homeWorkComment,
				classroomComment,
				homeFiles,
				classroomFiles,
				homeStudentsPoints,
				classroomStudentsPoints,
			)

			socket.emit('updateStudentSchedule', {
				id: currentScheduleDay,
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				token: token,
				classFiles: classroomFiles,
				classWork: classroomComment,
				classStudentsPoints: {
					studentId: currentOpenedStudent,
					points: classroomStudentsPoints,
				},
				homeFiles: homeFiles,
				homeWork: homeWorkComment,
				homeStudentsPoints: {
					studentId: currentOpenedStudent,
					points: homeStudentsPoints,
				},
			})
		}
	}, [
		homeWorkComment,
		classroomComment,
		homeFiles,
		classroomFiles,
		homeStudentsPoints,
		classroomStudentsPoints,
	])

	return (
		<div style={style} className={s.wrapper}>
			<div className={s.InfoBlock}>
				<div className={s.Header}>
					<div className={s.MainHeader}>
						<div className={s.IconHeader}>
							<img src={icon} alt="icon" />
							<p>{name}</p>
						</div>
						<div className={s.Devider}></div>
						<div className={s.AddressHeader}>
							<p>Адрес:</p>
							<p>{address}</p>
						</div>
						<div className={s.Devider}></div>
						<div className={s.DateHeader}>
							<p>{date}</p>
							<p>{time}</p>
						</div>
					</div>
				</div>
				<div className={s.MainBlock}>
					<div className={s.HomeWorkWrapper}>
						<h1>Домашняя работа</h1>
						<textarea
							className={s.TextArea}
							placeholder="Задания, комментарий"
							value={homeWorkComment}
							onChange={(e) => setHomeWorkComment(e.target.value)}
						/>
						<div className={s.MediaBlock}>
							<RecordNListen />
							<input
								type="file"
								id="inputFile1"
								className={s.InputFile}
								onChange={handleAddHomeFile}
							/>
							<label htmlFor="inputFile1" className={s.LabelFile}>
								<img src={uploadFile} alt="uploadFile" />
							</label>
							<Select renderValue={() => ''} className={s.Select}>
								<MenuItem value={0}>
									{homeFiles.length === 0
										? 'Список пока пуст'
										: homeFiles.map((file: any) => <p>{file.name}</p>)}
								</MenuItem>
							</Select>
						</div>
						<h1>Выполнение домашней работы</h1>
						<NowLevel
							value={homeStudentsPoints}
							onChange={(e) => setHomeStudentsPoints(e)}
						/>
					</div>
					<div className={s.Devider}></div>
					<div className={s.LessonWrapper}>
						<h1>Занятие</h1>
						<textarea
							className={s.TextArea}
							placeholder="Комментарий"
							value={classroomComment}
							onChange={(e) => setClassroomComment(e.target.value)}
						/>
						<div className={s.MediaBlock}>
							<RecordNListen />
							<input
								type="file"
								id="inputFile2"
								className={s.InputFile}
								onChange={handleAddClassroomFile}
							/>
							<label htmlFor="inputFile1" className={s.LabelFile}>
								<img src={uploadFile} alt="uploadFile" />
							</label>
							<Select renderValue={() => ''} className={s.Select}>
								<MenuItem value={0}>
									{classroomFiles.length === 0
										? 'Список пока пуст'
										: classroomFiles.map((file: any) => <p>{file.name}</p>)}
								</MenuItem>
							</Select>
						</div>
						<h1>Работа на занятии</h1>
						<NowLevel
							value={classroomStudentsPoints}
							onChange={(e) => setClassroomStudentsPoints(e)}
						/>
						<div className={s.PrePay}>
							<p>0 ₽</p>
							<CheckBox size="16px" />
						</div>
					</div>
				</div>
			</div>
			<div className={s.buttons}>
				<button onClick={onExit}>
					<CloseIcon className={s.closeIcon} />
				</button>
				<div className={s.btn}>
					<button className={s.btnRight}>
						<span>
							<Arrow direction={ArrowType.right} />
						</span>
					</button>
					<button className={s.btnLeft}>
						<span>
							<Arrow direction={ArrowType.left} />
						</span>
					</button>
				</div>
			</div>
		</div>
	)
}

export default DayStudentPopUp
