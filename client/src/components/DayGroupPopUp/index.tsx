import s from './index.module.scss'
import Line from '../Line'
import RecordNListen from '../RecordNListen'
import {Option, Select, SelectOption} from '@mui/base'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import {IDayGroupStudent, IFile, IStudentPoints} from '../../types'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useDispatch, useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import CloseIcon from '@mui/icons-material/Close'
import socket from '../../socket'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import useOnce from '../../hooks/useOnce'
import useOnceEvery from '../../hooks/useOnceEvery'
import useSocketOnce from '../../hooks/useSocketOnce'
import {TailSpin} from 'react-loader-spinner'

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

	//Redux states
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)
	const currentScheduleDay = useSelector(
		(state: any) => state.currentScheduleDay,
	)
	const user = useSelector((state: any) => state.user)
	//End Redux states

	const token = user.token

	const [student, setStudent] = useState<IDayGroupStudent>()
	const [isOpened, setIsOpened] = useState<boolean>(false)
	const [openSelect1, setOpenSelect1] = useState<boolean>(false)
	const [openSelect2, setOpenSelect2] = useState<boolean>(false)

	// const [homeWorkComment, setHomeWorkComment] = useState('')
	// const [classroomComment, setClassroomComment] = useState('')

	// const [homeFiles, setHomeFiles] = useState<IFile[]>([])
	// const [classroomFiles, setClassroomFiles] = useState<IFile[]>([])

	// const [homeAudios, setHomeAudios] = useState<IFile[]>([])
	// const [classAudios, setClassAudios] = useState<IFile[]>([])

	// const [homeStudentsPoints, setHomeStudentsPoints] = useState<
	// 	IStudentPoints[]
	// >([])
	// const [classroomStudentsPoints, setClassroomStudentsPoints] = useState<
	// 	IStudentPoints[]
	// >([])

	const [groupSchedules, setGroupSchedules] = useState<any>()
	const [groupCurrentIndexSchedule, setGroupCurrentIndexSchedule] =
		useState<number>()

	const changeStudentField = (key: string, value: any) => {
		setStudent((prev: IDayGroupStudent | undefined) => {
			if (!prev) return prev // Handle undefined case

			return {...prev, [key]: value} // Update the specific field
		})
	}
	const [loader, setLoader] = useState<boolean>(false)
	const [disabled, setDisabled] = useState<boolean>(false)
	const handleAddHomeAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		student &&
			changeStudentField('homeAudios', [
				...student.homeAudios,
				{name, type, size, file},
			])
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
		student &&
			changeStudentField('classAudios', [
				...student.classAudios,
				{name, type, size, file},
			])
		setDisabled(true)
		setTimeout(() => {
			setDisabled(false)
		}, 2000)
	}

	const handleAddHomeFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		if (
			student &&
			!student.homeFiles.some((file) => file.name === fileToAdd.name)
		) {
			changeStudentField('homeFiles', [
				...student.homeFiles,
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
		if (
			student &&
			!student.classFiles.some((file) => file.name === fileToAdd.name)
		) {
			changeStudentField('classFiles', [
				...student.classFiles,
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

	const handleNextStudent = () => {
		console.log(
			'\n-----------------',
			groupCurrentIndexSchedule,
			groupSchedules,
		)
		if (groupCurrentIndexSchedule! < groupSchedules.length - 1) {
			console.log('Next student')
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
			setDisabled(true)
			setTimeout(() => {
				setDisabled(false)
			}, 2000)
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
			setDisabled(true)
			setTimeout(() => {
				setDisabled(false)
			}, 2000)
		}
	}
	// useSocketOnce('getByGroupScheduleId', (data: any) => {
	// 	setGroupSchedules(data)
	// 	let indexOfStudent = data.findIndex(
	// 		(student: any) => student.id === currentScheduleDay,
	// 	)
	// 	setGroupCurrentIndexSchedule(indexOfStudent)
	// 	console.log(
	// 		data,
	// 		indexOfStudent,
	// 		currentScheduleDay,
	// 		'currentIndexStudentSchedules',
	// 	)
	// })

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

	socket.once('getStudentsByDate', (data: IDayGroupStudent[]) => {
		const student = data?.find(
			(student: any) => student.id === currentScheduleDay,
		)
		setStudent(student)
		setIsOpened(true)
	})

	// ? enry point. GET DATA
	useEffect(() => {
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			isGroup: true,
			token: token,
		})
	}, [
		calendarNowPopupDay,
		calendarNowPopupMonth,
		calendarNowPopupYear,
		currentScheduleDay,
		groupCurrentIndexSchedule,
	])

	// ? GET STUDENT DATA AND SEND getByGroupScheduleId
	// useSocketOnce('getStudentsByDate', (data: IDayGroupStudent[]) => {
	// 	const student = data?.find(
	// 		(student: any) => student.id === currentScheduleDay,
	// 	)
	// 	console.log('ONCE --- getByGroupScheduleId', student)
	// 	student &&
	// 		socket.emit('getByGroupScheduleId', {
	// 			groupId: student.groupId,
	// 			token: token,
	// 		})
	// })

	socket.once('getStudentsByDate', (data: IDayGroupStudent[]) => {
		const student = data?.find(
			(student: any) => student.id === currentScheduleDay,
		)
		console.log('ONCE --- getByGroupScheduleId', student)
		student &&
			socket.emit('getByGroupScheduleId', {
				groupId: student.groupId,
				token: token,
			})
	})

	// ? UPDATE DATA
	useEffect(() => {
		if (currentScheduleDay && isOpened && student) {
			console.log('UPDATE-UPDATE-UPDATE')

			socket.emit('updateStudentSchedule', {
				id: currentScheduleDay,
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				token: token,
				classFiles: student.classFiles.map((file) => {
					return file
				}),
				classWork: student.classWork,
				classStudentsPoints: student.classStudentsPoints
					? student.classStudentsPoints.map((student) => ({
							studentId: student.studentId,
							points: student.points,
						}))
					: [],
				homeFiles: student.homeFiles.map((file) => {
					return file
				}),
				homeWork: student.homeWork,
				homeAudios: student.homeAudios.map((audio) => {
					return audio
				}),
				classAudios: student.classAudios.map((audio) => {
					return audio
				}),
				homeStudentsPoints: student.homeStudentsPoints
					? student.homeStudentsPoints.map((student) => ({
							studentId: student.studentId,
							points: student.points,
						}))
					: [],
			})
		}
	}, [student])

	return (
		<div style={style} className={s.wrapper}>
			{!loader ? (
				<>
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
									value={student?.homeWork}
									onChange={(e) =>
										changeStudentField('homeWork', e.target.value)
									}
								/>
								<div className={s.MediaBlock}>
									<RecordNListen
										typeCard="day/home/audio"
										alreadyRecorded={student?.homeAudios}
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
										renderValue={(selected: SelectOption<number>[]) => (
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
										)}>
										{student?.homeFiles.length === 0 ? (
											<Option className={s.Option} value={0}>
												Список пока пуст
											</Option>
										) : (
											student?.homeFiles.map((file: any, index: number) => (
												<Option className={s.Option} key={index} value={index}>
													<div className={s.FileWrapper}>
														<p>{file.name.slice(0, 25) + '...'}</p>
														<button
															className={s.DeleteBtn}
															onClick={() =>
																changeStudentField(
																	'homeFiles',
																	student.homeFiles.filter(
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

								{student &&
									student.homeStudentsPoints.map(
										(studentPoints: IStudentPoints, index: number) => (
											<div key={index} className={s.HomeWorkGroups}>
												<div className={s.HomeWorkStud}>
													<p>{studentPoints.studentName}</p>
													<NowLevel
														className={s.NowLevel}
														value={studentPoints.points}
														onChange={(newPoints) => {
															const updatedPoints =
																student.homeStudentsPoints.map(
																	(s: IStudentPoints, i: number) =>
																		i === index ? {...s, points: newPoints} : s,
																)
															changeStudentField(
																'homeStudentsPoints',
																updatedPoints,
															)
														}}
													/>
												</div>
												{index < student.homeStudentsPoints.length - 1 && (
													<Line width="371px" className={s.Line} />
												)}
											</div>
										),
									)}
							</div>
							<div className={s.Devider}></div>
							<div className={s.LessonWrapper}>
								<h1>Занятие</h1>
								<textarea
									className={s.TextArea}
									placeholder="Комментарий"
									value={student?.classWork}
									onChange={(e) =>
										changeStudentField('classWork', e.target.value)
									}
								/>
								<div className={s.MediaBlock}>
									<RecordNListen
										typeCard="day/classroom/audio"
										alreadyRecorded={student?.classAudios}
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
										renderValue={(selected: SelectOption<number>[]) => {
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
										{student && student.classFiles.length === 0 ? (
											<Option className={s.Option} value={0}>
												Список пока пуст
											</Option>
										) : (
											student?.classFiles.map((file: any, index: number) => (
												<Option className={s.Option} key={index} value={index}>
													<div className={s.FileWrapper}>
														<p>{file.name.slice(0, 25) + '...'}</p>
														<button
															className={s.DeleteBtn}
															onClick={() =>
																changeStudentField(
																	'classFiles',
																	student.classFiles.filter(
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

								{student &&
									student.classStudentsPoints.map(
										(studentPoints: IStudentPoints, index: number) => (
											<div className={s.WorkClassGroup}>
												<div key={index} className={s.WorkClassStud}>
													<p>{studentPoints.studentName}</p>
													<NowLevel
														className={s.NowLevel}
														value={studentPoints.points}
														onChange={(newPoints) => {
															const updatedPoints =
																student.classStudentsPoints.map(
																	(s: IStudentPoints, i: number) =>
																		i === index ? {...s, points: newPoints} : s,
																)
															changeStudentField(
																'classStudentsPoints',
																updatedPoints,
															)
														}}
													/>
												</div>
												{index < student.classStudentsPoints.length - 1 && (
													<Line width="100%" className={s.Line} />
												)}
											</div>
										),
									)}
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
							<button
								disabled={disabled}
								className={s.btnRight}
								onClick={handleNextStudent}>
								<span>
									<Arrow direction={ArrowType.right} />
								</span>
							</button>
							<button
								disabled={disabled}
								className={s.btnLeft}
								onClick={handlePrevStudent}>
								<span>
									<Arrow direction={ArrowType.left} />
								</span>
							</button>
						</div>
					</div>
				</>
			) : (
				<div className={s.Spin}>
					<TailSpin
						visible={true}
						height="80"
						width="80"
						color="#4fa94d"
						ariaLabel="tail-spin-loading"
						radius="1"
						wrapperStyle={{}}
						wrapperClass=""
					/>
				</div>
			)}
		</div>
	)
}

export default DayGroupPopUp
