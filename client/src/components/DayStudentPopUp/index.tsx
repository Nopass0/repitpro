import React, {useEffect, useState} from 'react'
import {useDispatch, useSelector} from 'react-redux'
import {Option, Select, SelectOption} from '@mui/base'
import CloseIcon from '@mui/icons-material/Close'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Arrow, {ArrowType} from '../../assets/arrow'

import s from './index.module.scss'
import RecordNListen from '../RecordNListen'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import PrepaymentComponent from '../PrepaymentComponent'
import socket from '../../socket'
import {IStudentPoints} from '@/types'

// Импорт иконок для типов уроков
import GroupOnline from '../../assets/1.svg'
import Online from '../../assets/2.svg'
import HomeStudent from '../../assets/3.svg'
import Group from '../../assets/4.svg'
import Home from '../../assets/5.svg'
import Client from '../../assets/6.svg'

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

const DayStudentPopUp: React.FC<IDayStudentPopUp> = ({
	icon,
	name,
	address,
	date,
	time,
	style,
	onExit,
	groupId,
}) => {
	const dispatch = useDispatch()

	// Redux selectors
	const user = useSelector((state: any) => state.user)
	const token = user?.token
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

	// Local state
	const [student, setStudent] = useState<any>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [studentSchedules, setStudentSchedules] = useState<any[]>([])
	const [currentIndexStudentSchedules, setCurrentIndexStudentSchedules] =
		useState<number>()
	const [openSelect1, setOpenSelect1] = useState(false)
	const [openSelect2, setOpenSelect2] = useState(false)
	const [disabled, setDisabled] = useState(false)

	// Form state
	const [homeWorkComment, setHomeWorkComment] = useState('')
	const [classroomComment, setClassroomComment] = useState('')
	const [homeFiles, setHomeFiles] = useState<any[]>([])
	const [classroomFiles, setClassroomFiles] = useState<any[]>([])
	const [homeFilesPaths, setHomeFilesPaths] = useState<string[]>([])
	const [classroomFilesPaths, setClassroomFilesPaths] = useState<string[]>([])
	const [audios, setAudios] = useState<any[]>([])
	const [classAudio, setClassAudio] = useState<any[]>([])
	const [homeStudentsPoints, setHomeStudentsPoints] =
		useState<IStudentPoints[]>()
	const [classroomStudentsPoints, setClassroomStudentsPoints] =
		useState<IStudentPoints[]>()

	useEffect(() => {
		console.log('Effect running with:', {
			currentScheduleDay,
			currentOpenedStudent,
			token,
		})

		if (!token) {
			setError('No token available')
			return
		}

		if (!currentOpenedStudent) {
			setError('No student ID provided')
			return
		}

		const handleStudentData = (data: any) => {
			setIsLoading(false)

			if (data.error) {
				setError(data.error)
				return
			}

			console.log('Received student data:', data)

			if (Array.isArray(data)) {
				console.log(
					'Looking for student with id:',
					currentScheduleDay || currentOpenedStudent,
				)
				// Сначала пытаемся найти по currentScheduleDay, если нет - по currentOpenedStudent
				const foundStudent = data.find(
					(s) =>
						s.id === currentScheduleDay || s.studentId === currentOpenedStudent,
				)

				if (foundStudent) {
					console.log('Found student:', foundStudent)
					setStudent(foundStudent)
					setHomeWorkComment(foundStudent.homeWork || '')
					setClassroomComment(foundStudent.classWork || '')
					setHomeFiles(foundStudent.homeFiles || [])
					setClassroomFiles(foundStudent.classFiles || [])
					setHomeFilesPaths(foundStudent.homeFilesPath || [])
					setClassroomFilesPaths(foundStudent.classFilesPath || [])
					setHomeStudentsPoints(foundStudent.homeStudentsPoints)
					setClassroomStudentsPoints(foundStudent.classStudentsPoints)

					// Если currentScheduleDay не установлен, устанавливаем его
					if (!currentScheduleDay) {
						dispatch({
							type: 'SET_CURRENT_SCHEDULE_DAY',
							payload: foundStudent.id,
						})
					}
				} else {
					console.log('Student not found in data:', data)
				}
			}
		}

		const fetchData = () => {
			setIsLoading(true)
			setError(null)
			socket.emit('getStudentsByDate', {
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				token: token,
				studentId: currentOpenedStudent,
				scheduleId: currentScheduleDay,
			})
		}

		socket.on('getStudentsByDate', handleStudentData)
		fetchData()

		return () => {
			socket.off('getStudentsByDate', handleStudentData)
		}
	}, [
		currentScheduleDay,
		calendarNowPopupDay,
		calendarNowPopupMonth,
		calendarNowPopupYear,
		currentOpenedStudent,
		token,
	])

	// Получение расписаний студента
	useEffect(() => {
		if (student?.id && token) {
			socket.emit('getAllStudentSchedules', {
				studentId: currentOpenedStudent,
				token: token,
			})

			const handleStudentSchedules = (data: any) => {
				console.log('Received student schedules:', data)
				if (Array.isArray(data)) {
					setStudentSchedules(data)
					const currentIndex = data.findIndex(
						(schedule) => schedule.id === student.id,
					)
					setCurrentIndexStudentSchedules(currentIndex)
				}
			}

			socket.on('getAllStudentSchedules', handleStudentSchedules)

			return () => {
				socket.off('getAllStudentSchedules', handleStudentSchedules)
			}
		}
	}, [student?.id, token, currentOpenedStudent])

	useEffect(() => {
		if (currentScheduleDay && student?.id) {
			const updateData = {
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
						studentName: student.nameStudent,
						points:
							(classroomStudentsPoints && classroomStudentsPoints[0]?.points) ||
							1,
					},
				],
				homeFiles: homeFiles,
				homeWork: homeWorkComment,
				homeStudentsPoints: [
					{
						studentId: currentOpenedStudent,
						studentName: student.nameStudent,
						points: (homeStudentsPoints && homeStudentsPoints[0]?.points) || 1,
					},
				],
			}

			console.log('Sending update:', updateData)

			socket.emit('updateStudentSchedule', updateData)

			const handleUpdateResponse = (response: any) => {
				console.log('Update response:', response)
				if (response.success) {
					// Обновляем данные после успешного сохранения
					socket.emit('getStudentsByDate', {
						day: calendarNowPopupDay,
						month: calendarNowPopupMonth,
						year: calendarNowPopupYear,
						token: token,
						studentId: currentOpenedStudent,
						scheduleId: currentScheduleDay,
					})
				}
			}

			socket.once(
				`updateStudentSchedule_${currentScheduleDay}`,
				handleUpdateResponse,
			)

			return () => {
				socket.off(
					`updateStudentSchedule_${currentScheduleDay}`,
					handleUpdateResponse,
				)
			}
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
		calendarNowPopupDay,
		calendarNowPopupMonth,
		calendarNowPopupYear,
		token,
		currentOpenedStudent,
	])

	const handleAddHomeAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setAudios([...audios, {name, type, size, file}])
		setDisabled(true)
		setTimeout(() => setDisabled(false), 2000)
	}

	const handleAddClassroomAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setClassAudio([...classAudio, {name, type, size, file}])
		setDisabled(true)
		setTimeout(() => setDisabled(false), 2000)
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
			setDisabled(true)
			setTimeout(() => setDisabled(false), 2000)
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
			setDisabled(true)
			setTimeout(() => setDisabled(false), 2000)
		}
	}

	const getIconByType = (type: number) => {
		switch (type) {
			case 1:
				return GroupOnline
			case 2:
				return Online
			case 3:
				return HomeStudent
			case 4:
				return Group
			case 5:
				return Home
			case 6:
				return Client
			default:
				return icon
		}
	}

	const nextStudentSchedule = () => {
		if (
			studentSchedules.length &&
			currentIndexStudentSchedules !== undefined &&
			currentIndexStudentSchedules < studentSchedules.length - 1
		) {
			const nextSchedule = studentSchedules[currentIndexStudentSchedules + 1]

			dispatch({
				type: 'SET_CURRENT_SCHEDULE_DAY',
				payload: nextSchedule.id,
			})

			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: nextSchedule.day,
					month: nextSchedule.month,
					year: nextSchedule.year,
				},
			})

			setDisabled(true)
			setTimeout(() => setDisabled(false), 2000)
		}
	}

	const prevStudentSchedule = () => {
		if (
			studentSchedules.length &&
			currentIndexStudentSchedules !== undefined &&
			currentIndexStudentSchedules > 0
		) {
			const prevSchedule = studentSchedules[currentIndexStudentSchedules - 1]

			dispatch({
				type: 'SET_CURRENT_SCHEDULE_DAY',
				payload: prevSchedule.id,
			})

			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: prevSchedule.day,
					month: prevSchedule.month,
					year: prevSchedule.year,
				},
			})

			setDisabled(true)
			setTimeout(() => setDisabled(false), 2000)
		}
	}

	if (isLoading) {
		return (
			<div className={s.wrapper}>
				<div className={s.loading}>Loading...</div>
			</div>
		)
	}

	if (error) {
		return (
			<div className={s.wrapper}>
				<div className={s.error}>Error: {error}</div>
			</div>
		)
	}

	if (!student) {
		return (
			<div className={s.wrapper}>
				<div className={s.noData}>No student data available</div>
			</div>
		)
	}

	return (
		<div style={style} className={s.wrapper}>
			<div className={s.InfoBlock}>
				{student.isCancel && (
					<div className={s.cancelStamp}>
						<p>Отменено</p>
					</div>
				)}

				<div className={s.Header}>
					<div className={s.MainHeader}>
						<div className={s.IconHeader}>
							<img
								src={
									student?.typeLesson ? getIconByType(student.typeLesson) : icon
								}
								alt="icon"
							/>
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
							<Select
								className={s.Select}
								multiple
								onListboxOpenChange={() => setOpenSelect1(!openSelect1)}
								renderValue={(option: SelectOption<number> | null) => (
									<div className={s.ListWrapper}>
										<label htmlFor="inputFile1" className={s.LabelFile}>
											<img src={uploadFile} alt="uploadFile" />
										</label>
										<div className={s.Icons}>
											{openSelect1 ? <ExpandLess /> : <ExpandMore />}
										</div>
									</div>
								)}>
								<Option className={s.Option} value={0}>
									{homeFiles.length === 0
										? 'Список пока пуст'
										: homeFiles.map((file: any, index: number) => (
												<div key={index} className={s.FileWrapper}>
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
							<Select
								className={s.Select}
								multiple
								onListboxOpenChange={() => setOpenSelect2(!openSelect2)}
								renderValue={(option: SelectOption<number> | null) => (
									<div className={s.ListWrapper}>
										<label htmlFor="inputFile2" className={s.LabelFile}>
											<img src={uploadFile} alt="uploadFile" />
										</label>
										<div className={s.Icons}>
											{openSelect2 ? <ExpandLess /> : <ExpandMore />}
										</div>
									</div>
								)}>
								<Option className={s.Option} value={0}>
									{classroomFiles.length === 0
										? 'Список пока пуст'
										: classroomFiles.map((file: any, index: number) => (
												<div key={index} className={s.FileWrapper}>
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
							<PrepaymentComponent
								student={student}
								currentDate={
									new Date(
										calendarNowPopupYear,
										calendarNowPopupMonth - 1,
										calendarNowPopupDay,
									)
								}
							/>
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
