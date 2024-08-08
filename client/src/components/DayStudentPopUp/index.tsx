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
import {Option, Select, SelectOption} from '@mui/base'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import CheckBox from '../CheckBox'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useDispatch, useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import socket from '../../socket'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {IStudentPoints} from '@/types'
interface IDayStudentPopUp {
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

const DayStudentPopUp = ({
	icon,
	name,
	address,
	date,
	time,
	style,
	onExit,
	groupId,
}: IDayStudentPopUp) => {
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
	const [studentSchedules, setStudentSchedules] = useState<any>()
	const [currentIndexStudentSchedules, setCurrentIndexStudentSchedules] =
		useState<number>()
	const hiddenNum = useSelector((state: any) => state.hiddenNum)
	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [pagePopUp, setPagePopUp] = useState<EPagePopUp>(EPagePopUp.None)

	const [student, setStudent] = useState<any>({})
	const [isOpened, setIsOpened] = useState(false)
	const [openSelect1, setOpenSelect1] = useState(false)
	const [openSelect2, setOpenSelect2] = useState(false)

	const [homeWorkComment, setHomeWorkComment] = useState(
		student?.homeWork || '',
	)
	const [classroomComment, setClassroomComment] = useState(
		student?.classWork || '',
	)
	const [homeFiles, setHomeFiles] = useState<any>(student?.homeFiles || [])
	const [homeFilesPaths, setHomeFilesPaths] = useState<string[]>([])
	const [classroomFilesPaths, setClassroomFilesPaths] = useState<string[]>([])
	const [audios, setAudios] = useState<any>(student?.audios || [])

	const [classAudio, setClassAudio] = useState<any>(student?.classAudio || [])

	const [disabled, setDisabled] = useState<boolean>(false)

	const handleAddHomeAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setAudios([...homeFiles, {name: name, type: type, size: size, file: file}])
		setDisabled(true)
		setTimeout(() => {
			setDisabled(false)
		}, 2000)
	}

	const handleAddClassroomAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		console.log(file, name, type, size)
		setClassAudio([
			...classAudio,
			{name: name, type: type, size: size, file: file},
		])
		setDisabled(true)
		setTimeout(() => {
			setDisabled(false)
		}, 2000)
		console.log('\n--------class-audio--------\n', classAudio, '\n--------\n')
	}

	const [classroomFiles, setClassroomFiles] = useState<any>(
		student?.classFiles || [],
	)
	const [homeStudentsPoints, setHomeStudentsPoints] =
		useState<IStudentPoints[]>()
	const [classroomStudentsPoints, setClassroomStudentsPoints] =
		useState<IStudentPoints[]>()

	interface LessonHistory {
		date: string
		price: string
		isDone: boolean
		isPaid: boolean
		itemName: string
	}

	interface StudentData {
		prePayCost: string
		prePayDate: string
		history: {
			historyLessons?: LessonHistory[]
		}[]
	}

	function calculateRemainingPrePay(
		studentData: StudentData,
		currentDateString: string,
	): number {
		const currentDate = new Date(
			calendarNowPopupYear,
			calendarNowPopupMonth - 1,
			calendarNowPopupDay,
		)

		console.log(currentDate, '--- currentDate')

		const prePayCost = parseFloat(studentData.prePayCost)
		const prePayDate = new Date(studentData.prePayDate)

		let remainingPrePay = prePayCost

		studentData.history?.forEach((history) => {
			history.historyLessons?.forEach((lesson) => {
				const lessonDate = new Date(lesson.date)
				const lessonPrice = parseFloat(lesson.price)

				// Если урок уже прошел, он выполнен и он оплачен
				if (lessonDate >= prePayDate && lessonDate <= currentDate) {
					console.log(
						'lessonDate >= prePayDate',
						lessonDate >= prePayDate,
						lessonDate,
					)
					remainingPrePay -= lessonPrice
				}
			})
		})

		console.log('remainingPrePay', remainingPrePay)

		return Math.max(remainingPrePay, 0) // Остаток не может быть меньше 0
	}

	const handleAddHomeFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		console.log('FiletoAdd', fileToAdd)
		// // Проверяем, есть ли уже такой файл в массиве homeFiles
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
			setDisabled(true)
			setTimeout(() => {
				setDisabled(false)
			}, 2000)
		} else {
			console.log('Этот файл уже был добавлен.')
		}
	}

	const handleAddClassroomFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		// Проверяем, есть ли уже такой файл в массиве classroomFiles
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
			setDisabled(true)
			setTimeout(() => {
				setDisabled(false)
			}, 2000)
		} else {
			console.log('Этот файл уже был добавлен.')
		}
	}

	const [students, setStudents] = useState([])
	const [currentIndex, setCurrentIndex] = useState(0) // Track the current student index

	const [groups, setGroups] = useState<any>([])
	const [group, setGroup] = useState<any>({})

	useEffect(() => {
		if (student.groupId) {
			socket.emit('getByGroupId', {
				groupId: student.groupId,
				token: token,
			})
		}

		socket.once('getByGroupId', (data: any) => {
			console.log('getByGroupId', data)
			setStudentSchedules(data)
			let indexOfStudent = data.findIndex(
				(student: any) => student.id === currentScheduleDay,
			)
			setCurrentIndexStudentSchedules(indexOfStudent)
			console.log(
				indexOfStudent,
				currentScheduleDay,
				'currentIndexStudentSchedules',
			)
		})
	}, [student, currentScheduleDay])

	function nextStudentSchedule() {
		console.log(
			'nextStudentSchedule',
			currentIndexStudentSchedules,
			studentSchedules,
		)
		if (currentIndexStudentSchedules! < studentSchedules.length - 1) {
			dispatch({
				type: 'SET_CURRENT_OPENED_SCHEDULE_DAY',
				payload: studentSchedules[currentIndexStudentSchedules! + 1].id,
			})
			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: studentSchedules[currentIndexStudentSchedules! + 1].day,
					month: studentSchedules[currentIndexStudentSchedules! + 1].month,
					year: studentSchedules[currentIndexStudentSchedules! + 1].year,
				},
			})
			setDisabled(true)
			setTimeout(() => {
				setDisabled(false)
			}, 2000)
			console.log(
				studentSchedules[currentIndexStudentSchedules! + 1],
				currentScheduleDay,
				'next',
			)
		}
	}

	function prevStudentSchedule() {
		if (currentIndexStudentSchedules! > 0) {
			dispatch({
				type: 'SET_CURRENT_OPENED_SCHEDULE_DAY',
				payload: studentSchedules[currentIndexStudentSchedules! - 1].id,
			})
			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: studentSchedules[currentIndexStudentSchedules! - 1].day,
					month: studentSchedules[currentIndexStudentSchedules! - 1].month,
					year: studentSchedules[currentIndexStudentSchedules! - 1].year,
				},
			})
			setDisabled(true)
			setTimeout(() => {
				setDisabled(false)
			}, 2000)
			console.log(
				studentSchedules[currentIndexStudentSchedules! - 1],
				currentScheduleDay,
				'prev',
			)
		}
	}

	useEffect(() => {
		console.log(
			'\n---------------currentOpenedStudent---------------\n',
			currentOpenedStudent,
		)
	}, [currentOpenedStudent])

	useEffect(() => {
		console.log(
			'\n---------------currentOpenedStudent---------------\n',
			currentOpenedStudent,
		)
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
			studentId: currentOpenedStudent,
			isGroup: false,
		})
	}, [
		currentScheduleDay,
		calendarNowPopupDay,
		calendarNowPopupMonth,
		calendarNowPopupYear,
		currentOpenedStudent,
	])

	socket.once('getStudentsByDate', (data: any) => {
		console.log('getStudentsByDate', data)
		//get students array and get by id
		console.log('data', data, 'currentScheduleDay', currentScheduleDay)
		const student = data?.find(
			(student: any) => student.id === currentScheduleDay,
		)
		setStudent(student || {})
		console.log(
			'studentstudentstudentstudentstudentstudentstudentstudentstudent',
			student,
		)
		setHomeWorkComment(student?.homeWork || '')
		setClassroomComment(student?.classWork || '')
		setHomeFiles(student?.homeFiles || [])
		setClassroomFiles(student?.classFiles || [])
		// setAudios(student?.audios || [])
		// setClassAudio(student?.classAudio || [])
		setHomeFilesPaths(student?.homeFilesPath || [])
		setClassroomFilesPaths(student?.classFilesPath || [])
		setHomeStudentsPoints(student?.homeStudentsPoints)
		setClassroomStudentsPoints(student?.classStudentsPoints)
		setIsOpened(true)
	})

	console.log('groupgroupgroupgroupgroup', group)

	useEffect(() => {
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
		socket.once('getStudentsByDate', (data) => {
			setStudents(data)
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

	useEffect(() => {
		if (currentScheduleDay && isOpened && student) {
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
				classStudentsPoints: [
					{
						studentId: currentOpenedStudent,
						studentName: student.name,
						points:
							(classroomStudentsPoints &&
								((classroomStudentsPoints[0].points &&
									classroomStudentsPoints[0].points) ||
									1)) ||
							1,
					},
				],
				homeFiles: homeFiles,
				homeWork: homeWorkComment,
				// audios: audios,
				// classAudio: classAudio,
				homeStudentsPoints: [
					{
						studentId: currentOpenedStudent,
						studentName: student.name,
						points:
							(homeStudentsPoints &&
								((homeStudentsPoints[0].points &&
									homeStudentsPoints[0].points) ||
									1)) ||
							1,
					},
				],
			})
		}
	}, [
		student,
		homeWorkComment,
		classroomComment,
		classroomFiles,
		homeFiles,
		classroomStudentsPoints,
		homeStudentsPoints,
		currentScheduleDay,
	])

	return (
		<div style={style} className={s.wrapper}>
			<div className={s.InfoBlock}>
				<div className={s.Header}>
					<div className={s.MainHeader}>
						<div className={s.IconHeader}>
							<img src={icon} alt="icon" />
							<div className={s.HeaderCol}>
								<p>{student?.nameStudent}</p>
								<p>{student?.itemName}</p>
							</div>
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
								alreadyRecorded={audios}
								callback={handleAddHomeAudio}
								className={s.RecordNListen}
								typeCard="student"
							/>
							<input
								type="file"
								id="inputFile1"
								className={s.InputFile}
								onChange={handleAddHomeFile}
							/>
							{/* <label htmlFor="inputFile1" className={s.LabelFile}>
								<img src={uploadFile} alt="uploadFile" />
							</label> */}
							<Select
								className={s.Select}
								multiple
								onListboxOpenChange={() => setOpenSelect1(!openSelect1)}
								renderValue={(option: SelectOption<number> | null) => {
									if (option == null || option.value === null) {
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
									}
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
								<Option className={s.Option} value={0}>
									{homeFiles.length === 0
										? 'Список пока пуст'
										: homeFiles.map((file: any, index: number) => (
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
											))}
								</Option>
							</Select>
						</div>
						<h1>Выполнение домашней работы</h1>

						{homeStudentsPoints && (
							<NowLevel
								className={s.NowLevel}
								value={
									homeStudentsPoints.length > 0
										? homeStudentsPoints[0].points
										: 1
								}
								onChange={(e) =>
									setHomeStudentsPoints((prev) => [{...prev[0], points: e}])
								}
							/>
						)}
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
								alreadyRecorded={classAudio}
								callback={handleAddClassroomAudio}
								className={s.RecordNListen}
								typeCard="student"
							/>
							<input
								type="file"
								id="inputFile2"
								className={s.InputFile}
								onChange={handleAddClassroomFile}
							/>
							{/* <label htmlFor="inputFile2" className={s.LabelFile}>
								<img src={uploadFile} alt="uploadFile" />
							</label> */}
							<Select
								className={s.Select}
								multiple
								onListboxOpenChange={() => setOpenSelect2(!openSelect2)}
								renderValue={(option: SelectOption<number> | null) => {
									if (option == null || option.value === null) {
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
									}
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
								<Option className={s.Option} value={0}>
									{classroomFiles.length === 0
										? 'Список пока пуст'
										: classroomFiles.map((file: any) => (
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
											))}
								</Option>
							</Select>
						</div>
						<h1>Работа на занятии</h1>
						{classroomStudentsPoints && (
							<NowLevel
								className={s.NowLevel}
								value={
									classroomStudentsPoints.length > 0
										? classroomStudentsPoints[0].points
										: 1
								}
								onChange={(e) =>
									setClassroomStudentsPoints((prev) => [
										{...prev[0], points: e},
									])
								}
							/>
						)}
						<div className={s.PrePay}>
							<p>
								{student && (
									<>
										{student.prePayCost} - (Остаток:{' '}
										{student && calculateRemainingPrePay(student, date)} )
									</>
								)}{' '}
								₽
							</p>
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
					<button
						style={{display: disabled ? 'none' : 'block'}}
						disabled={disabled}
						className={s.btnRight}
						onClick={nextStudentSchedule}>
						<span>
							<Arrow direction={ArrowType.right} />
						</span>
					</button>
					<button
						style={{display: disabled ? 'none' : 'block'}}
						disabled={disabled}
						className={s.btnLeft}
						onClick={prevStudentSchedule}>
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
