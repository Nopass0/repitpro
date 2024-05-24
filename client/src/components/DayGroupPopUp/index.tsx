import s from './index.module.scss'
import Line from '../Line'
import RecordNListen from '../RecordNListen'
import {Option, Select, SelectOption} from '@mui/base'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import CheckBox from '../CheckBox'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useDispatch, useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import CloseIcon from '@mui/icons-material/Close'
import socket from '../../socket'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

interface IDayGroupPopUp {
	icon?: any
	name?: string
	address?: string
	date?: string
	time?: string
	style?: React.CSSProperties
	onExit?: () => void
	groupId?: string
}

enum EPagePopUp {
	PrePay,
	None,
}

const DayGroupPopUp = ({
	icon,
	name,
	address,
	date,
	time,
	style,
	onExit,
	groupId,
}: IDayGroupPopUp) => {
	const dispatch = useDispatch()
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

	const [pagePopUp, setPagePopUp] = useState<EPagePopUp>(EPagePopUp.None)

	const [student, setStudent] = useState<any>({})
	const [isOpened, setIsOpened] = useState(false)
	const [openSelect1, setOpenSelect1] = useState(false)
	const [openSelect2, setOpenSelect2] = useState(false)

	const [homeWorkComment, setHomeWorkComment] = useState('')
	const [classroomComment, setClassroomComment] = useState('')
	const [homeFiles, setHomeFiles] = useState<any[]>([])
	const [homeFilesPaths, setHomeFilesPaths] = useState<string[]>([])
	const [classroomFiles, setClassroomFiles] = useState<any[]>([])
	const [classroomFilesPaths, setClassroomFilesPaths] = useState<string[]>([])
	const [homeAudios, setHomeAudios] = useState<any[]>([])
	const [classAudios, setClassAudios] = useState<any[]>([])
	const [homeStudentsPoints, setHomeStudentsPoints] = useState<any[]>([])
	const [classroomStudentsPoints, setClassroomStudentsPoints] = useState<any[]>(
		[],
	)

	const [groupSchedules, setGroupSchedules] = useState<any>()
	const [groupCurrentIndexSchedule, setGroupCurrentIndexSchedule] =
		useState<number>()

	const handleAddHomeAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setHomeAudios([...homeAudios, {name, type, size, file}])
	}

	const handleAddClassroomAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setClassAudios([...classAudios, {name, type, size, file}])
	}

	const handleAddHomeFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		if (!homeFiles.some((file) => file.name === fileToAdd.name)) {
			setHomeFiles([
				...homeFiles,
				{
					name: fileToAdd.name,
					size: fileToAdd.size,
					type: fileToAdd.type,
					file: fileToAdd,
				},
			])
		} else {
			console.log('Этот файл уже был добавлен.')
		}
	}

	const handleAddClassroomFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		if (!classroomFiles.some((file) => file.name === fileToAdd.name)) {
			setClassroomFiles([
				...classroomFiles,
				{
					name: fileToAdd.name,
					size: fileToAdd.size,
					type: fileToAdd.type,
					file: fileToAdd,
				},
			])
		} else {
			console.log('Этот файл уже был добавлен.')
		}
	}

	const handleNextStudent = () => {
		if (groupCurrentIndexSchedule! < groupSchedules.length - 1) {
			dispatch({
				type: 'SET_CURRENT_OPENED_SCHEDULE_DAY',
				payload: groupSchedules[groupCurrentIndexSchedule! + 1].id,
			})
			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: groupSchedules[groupCurrentIndexSchedule! + 1].day,
					month: groupSchedules[groupCurrentIndexSchedule! + 1].month,
					year: groupSchedules[groupCurrentIndexSchedule! + 1].year,
				},
			})
		}
	}
	const handlePrevStudent = () => {
		if (groupCurrentIndexSchedule! > 0) {
			dispatch({
				type: 'SET_CURRENT_OPENED_SCHEDULE_DAY',
				payload: groupSchedules[groupCurrentIndexSchedule! - 1].id,
			})
			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: groupSchedules[groupCurrentIndexSchedule! - 1].day,
					month: groupSchedules[groupCurrentIndexSchedule! - 1].month,
					year: groupSchedules[groupCurrentIndexSchedule! - 1].year,
				},
			})
		}
	}

	useEffect(() => {
		if (student.groupId) {
			socket.emit('getByGroupScheduleId', {
				groupId: student.groupId,
				token: token,
			})
		}

		socket.once('getByGroupScheduleId', (data: any) => {
			setGroupSchedules(data)
			let indexOfStudent = data.findIndex(
				(student: any) => student.id === currentScheduleDay,
			)
			setGroupCurrentIndexSchedule(indexOfStudent)
			console.log(
				data,
				indexOfStudent,
				currentScheduleDay,
				'currentIndexStudentSchedules',
			)
		})
	}, [student, currentScheduleDay])
	useEffect(() => {
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			isGroup: true,
			token: token,
		})

		socket.once('getStudentsByDate', (data: any) => {
			const student = data?.find(
				(student: any) => student.id === currentScheduleDay,
			)
			setStudent(student || {})
			console.log(
				'\n-------------------------students(group----------------------------)\n',
				student,
				'\n-------------------------students(group----------------------------)\n',
			)
			setHomeWorkComment(student?.homeWork || '')
			setClassroomComment(student?.classWork || '')
			setHomeFiles(Array.isArray(student?.homeFiles) ? student.homeFiles : [])
			setClassroomFiles(
				Array.isArray(student?.classFiles) ? student.classFiles : [],
			)
			setHomeAudios(
				Array.isArray(student?.homeAudios) ? student.homeAudios : [],
			)
			setClassAudios(
				Array.isArray(student?.classAudios) ? student.classAudios : [],
			)
			setHomeStudentsPoints(
				Array.isArray(student?.homeStudentsPoints)
					? student.homeStudentsPoints
					: [],
			)
			setClassroomStudentsPoints(
				Array.isArray(student?.classStudentsPoints)
					? student.classStudentsPoints
					: [],
			)
		})

		setIsOpened(true)
	}, [
		calendarNowPopupDay,
		calendarNowPopupMonth,
		calendarNowPopupYear,
		token,
		currentScheduleDay,
	])

	useEffect(() => {
		if (currentScheduleDay && isOpened) {
			socket.emit('updateStudentSchedule', {
				id: currentScheduleDay,
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				token: token,
				classFiles: classroomFiles.map((file) => file.file),
				classWork: classroomComment,
				classStudentsPoints: classroomStudentsPoints.map((student) => ({
					studentId: student.studentId,
					points: student.points,
				})),
				homeFiles: homeFiles.map((file) => file.file),
				homeWork: homeWorkComment,
				homeAudios: homeAudios.map((audio) => audio.file),
				classAudios: classAudios.map((audio) => audio.file),
				homeStudentsPoints: homeStudentsPoints.map((student) => ({
					studentId: student.studentId,
					points: student.points,
				})),
			})
		}
	}, [
		homeWorkComment,
		classroomComment,
		homeFiles,
		classroomFiles,
		homeAudios,
		classAudios,
		homeStudentsPoints,
		classroomStudentsPoints,
	])

	const [students, setStudents] = useState<any[]>([])
	const [currentIndex, setCurrentIndex] = useState(0) // Track the current student index

	useEffect(() => {
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
		socket.once('getStudentsByDate', (data) => {
			setStudents(Array.isArray(data) ? data : [])
		})
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

	useEffect(() => {
		// Find the index of the current student based on the currentScheduleDay
		const currentStudentIndex = students.findIndex(
			(student) => student.id === currentScheduleDay,
		)

		// If the current student is found in the array, set the currentIndex
		if (currentStudentIndex !== -1) {
			setCurrentIndex(currentStudentIndex)
		}
	}, [students, currentScheduleDay])

	return (
		<div style={style} className={s.wrapper}>
			<div className={s.InfoBlock}>
				<div className={s.Header}>
					<div className={s.MainHeader}>
						<div className={s.IconHeader}>
							<img src={icon} alt="icon" />
							<p>{student?.nameStudent}</p>
						</div>
						<div className={s.Devider}></div>
						<div className={s.AddressHeader}>
							<p>Адрес:</p>
							<p>{student?.place}</p>
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
							<RecordNListen
								alreadyRecorded={homeAudios}
								callback={handleAddHomeAudio}
								className={s.RecordNListen}
							/>
							<input
								type="file"
								id="inputFile1"
								className={s.InputFile}
								onChange={handleAddHomeFile}
							/>
							<Select
								className={s.Select}
								multiple
								onListboxOpenChange={() => setOpenSelect1(!openSelect1)}
								renderValue={(option: SelectOption<number> | null) => {
									return (
										<>
											<div className={s.ListWrapper}>
												<label htmlFor="inputFile1" className={s.LabelFile}>
													<img src={uploadFile} alt="uploadFile" />
												</label>
												<div className={s.Icons}>
													{openSelect1 ? <ExpandLess /> : <ExpandMore />}
												</div>
											</div>
										</>
									)
								}}>
								{homeFiles.length === 0 ? (
									<Option className={s.Option} value={0}>
										Список пока пуст
									</Option>
								) : (
									homeFiles.map((file: any, index: number) => (
										<Option className={s.Option} key={index} value={index}>
											<div className={s.FileWrapper}>
												<p>{file.name.slice(0, 25) + '...'}</p>
												<button
													className={s.DeleteBtn}
													onClick={() =>
														setHomeFiles(
															homeFiles.filter(
																(f: any) => f.name !== file.name,
															),
														)
													}>
													<DeleteOutlineIcon />
												</button>
											</div>
										</Option>
									))
								)}
							</Select>
						</div>
						<h1>Выполнение домашней работы</h1>

						{homeStudentsPoints.map((student: any, index: number) => (
							<div key={index} className={s.HomeWorkGroups}>
								<div className={s.HomeWorkStud}>
									<p>{student.studentName}</p>
									<NowLevel
										className={s.NowLevel}
										value={student.points}
										onChange={(newPoints) => {
											const updatedPoints = homeStudentsPoints.map((s, i) =>
												i === index ? {...s, points: newPoints} : s,
											)
											setHomeStudentsPoints(updatedPoints)
										}}
									/>
								</div>
								{index < homeStudentsPoints.length - 1 && (
									<Line width="371px" className={s.Line} />
								)}
							</div>
						))}
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
							<RecordNListen
								alreadyRecorded={classAudios}
								callback={handleAddClassroomAudio}
								className={s.RecordNListen}
							/>
							<input
								type="file"
								id="inputFile2"
								className={s.InputFile}
								onChange={handleAddClassroomFile}
							/>
							<Select
								className={s.Select}
								multiple
								onListboxOpenChange={() => setOpenSelect2(!openSelect2)}
								renderValue={(option: SelectOption<number> | null) => {
									return (
										<>
											<div className={s.ListWrapper}>
												<label htmlFor="inputFile2" className={s.LabelFile}>
													<img src={uploadFile} alt="uploadFile" />
												</label>
												<div className={s.Icons}>
													{openSelect2 ? <ExpandLess /> : <ExpandMore />}
												</div>
											</div>
										</>
									)
								}}>
								{classroomFiles.length === 0 ? (
									<Option className={s.Option} value={0}>
										Список пока пуст
									</Option>
								) : (
									classroomFiles.map((file: any, index: number) => (
										<Option className={s.Option} key={index} value={index}>
											<div className={s.FileWrapper}>
												<p>{file.name.slice(0, 25) + '...'}</p>
												<button
													className={s.DeleteBtn}
													onClick={() =>
														setClassroomFiles(
															classroomFiles.filter(
																(f: any) => f.name !== file.name,
															),
														)
													}>
													<DeleteOutlineIcon />
												</button>
											</div>
										</Option>
									))
								)}
							</Select>
						</div>
						<h1>Работа на занятии</h1>

						{classroomStudentsPoints.map((student: any, index: number) => (
							<div className={s.WorkClassGroup}>
								<div key={index} className={s.WorkClassStud}>
									<p>{student.studentName}</p>
									<NowLevel
										className={s.NowLevel}
										value={student.points}
										onChange={(newPoints) => {
											const updatedPoints = classroomStudentsPoints.map(
												(s, i) => (i === index ? {...s, points: newPoints} : s),
											)
											setClassroomStudentsPoints(updatedPoints)
										}}
									/>
								</div>
								{index < classroomStudentsPoints.length - 1 && (
									<Line width="100%" className={s.Line} />
								)}
							</div>
						))}
						<div className={s.Total}>
							<p>Итог: </p>
						</div>
					</div>
				</div>
			</div>
			<div className={s.buttons}>
				<button onClick={onExit}>
					<CloseIcon className={s.closeIcon} />
				</button>
				<div className={s.btn}>
					<button className={s.btnRight} onClick={handleNextStudent}>
						<span>
							<Arrow direction={ArrowType.right} />
						</span>
					</button>
					<button className={s.btnLeft} onClick={handlePrevStudent}>
						<span>
							<Arrow direction={ArrowType.left} />
						</span>
					</button>
				</div>
			</div>
		</div>
	)
}

export default DayGroupPopUp
