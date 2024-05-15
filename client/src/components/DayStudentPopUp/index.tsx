import s from './index.module.scss'
import Line from '../Line'
import CloseIcon from '@mui/icons-material/Close'
import RecordNListen from '../RecordNListen'
import {Option, Select, SelectOption} from '@mui/base'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import CheckBox from '../CheckBox'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useSelector, useDispatch} from 'react-redux'
import {useEffect, useState, useCallback} from 'react'
import socket from '../../socket'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ExitPopUp from '../ExitPopUp'
import ReactDOM from 'react-dom'
import {RootState} from '../../store'
import {
	IStudent,
	EPagePopUpExit,
	ELeftMenuPage,
	ECurrentDayPopUp,
} from '../../types'

interface IDayStudentPopUp {
	icon?: string
	name?: string
	address?: string
	date?: string
	time?: string
	style?: React.CSSProperties
	onExit?: () => void
	isGroup?: boolean
	groupId?: string
	price?: string
}

enum EPagePopUp {
	PrePay,
	None,
}

const DayStudentPopUp: React.FC<IDayStudentPopUp> = ({
	icon,
	name,
	address,
	date,
	time,
	style,
	onExit,
	isGroup,
	groupId,
	price,
}) => {
	const dispatch = useDispatch()
	const calendarNowPopupDay = useSelector(
		(state: RootState) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: RootState) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: RootState) => state.calendarNowPopupYear,
	)
	const currentScheduleDay = useSelector(
		(state: RootState) => state.currentScheduleDay,
	)
	const hiddenNum = useSelector((state: RootState) => state.hiddenNum)
	const user = useSelector((state: RootState) => state.user)
	const token = user.token

	const [pagePopUp, setPagePopUp] = useState<EPagePopUp>(EPagePopUp.None)
	const [payChecked, setPayChecked] = useState<boolean>(false)
	const [student, setStudent] = useState<IStudent | null>(null)
	const [isOpened, setIsOpened] = useState(false)
	const [openSelect1, setOpenSelect1] = useState(false)
	const [openSelect2, setOpenSelect2] = useState(false)
	const [homeWorkComment, setHomeWorkComment] = useState('')
	const [classroomComment, setClassroomComment] = useState('')
	const [homeFiles, setHomeFiles] = useState<any[]>([])
	const [classroomFiles, setClassroomFiles] = useState<any[]>([])
	const [homeFilesPaths, setHomeFilesPaths] = useState<string[]>([])
	const [classroomFilesPaths, setClassroomFilesPaths] = useState<string[]>([])
	const [audios, setAudios] = useState<any[]>([])
	const [classAudio, setClassAudio] = useState<any[]>([])
	const [homeStudentsPoints, setHomeStudentsPoints] = useState<number>(1)
	const [classroomStudentsPoints, setClassroomStudentsPoints] =
		useState<number>(1)
	const [studentsList, setStudentsList] = useState<IStudent[]>([])
	const [currentIndex, setCurrentIndex] = useState(0)

	const currentStudent = studentsList[currentIndex]

	const fetchStudentsByDate = useCallback(() => {
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token,
		})
		socket.once('getStudentsByDate', (data: IStudent[]) => {
			setStudentsList(data)
		})
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

	const fetchGroupsByDate = useCallback(() => {
		socket.emit('getGroupsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			userId: token,
		})
		socket.once('getGroupsByDate', (data: any[]) => {
			const group = data.find((group: any) => group.groupId === groupId)
			setGroup(group)
		})
	}, [
		calendarNowPopupDay,
		calendarNowPopupMonth,
		calendarNowPopupYear,
		token,
		groupId,
	])

	const updateStudentData = useCallback((student: IStudent | null) => {
		if (student) {
			setStudent(student)
			setHomeWorkComment(student.homeWork || '')
			setClassroomComment(student.classWork || '')
			setHomeFiles(student.homeFiles || [])
			setClassroomFiles(student.classFiles || [])
			setHomeFilesPaths(student.homeFilesPath || [])
			setClassroomFilesPaths(student.classFilesPath || [])
			setHomeStudentsPoints(student.homeStudentsPoints?.points || 1)
			setClassroomStudentsPoints(student.classStudentsPoints?.points || 1)
		}
	}, [])

	useEffect(() => {
		fetchStudentsByDate()
	}, [fetchStudentsByDate])

	useEffect(() => {
		if (currentScheduleDay) {
			const studentIndex = studentsList.findIndex(
				(student) => student.id === currentScheduleDay,
			)
			if (studentIndex !== -1) {
				setCurrentIndex(studentIndex)
			}
		}
	}, [studentsList, currentScheduleDay])

	useEffect(() => {
		updateStudentData(currentStudent)
	}, [currentStudent, updateStudentData])

	useEffect(() => {
		fetchGroupsByDate()
	}, [fetchGroupsByDate])

	const handleAddHomeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const fileToAdd = e.target.files?.[0]
		if (fileToAdd && !homeFiles.some((file) => file.name === fileToAdd.name)) {
			setHomeFiles([
				...homeFiles,
				{
					name: fileToAdd.name,
					size: fileToAdd.size,
					type: fileToAdd.type,
					file: fileToAdd,
				},
			])
		}
	}

	const handleAddClassroomFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const fileToAdd = e.target.files?.[0]
		if (
			fileToAdd &&
			!classroomFiles.some((file) => file.name === fileToAdd.name)
		) {
			setClassroomFiles([
				...classroomFiles,
				{
					name: fileToAdd.name,
					size: fileToAdd.size,
					type: fileToAdd.type,
					file: fileToAdd,
				},
			])
		}
	}

	const handlePrevStudent = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === 0 ? studentsList.length - 1 : prevIndex - 1,
		)
	}

	const handleNextStudent = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === studentsList.length - 1 ? 0 : prevIndex + 1,
		)
	}

	const handleAddHomeAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setAudios([...audios, {name, type, size, file}])
	}

	const handleAddClassroomAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setClassAudio([...classAudio, {name, type, size, file}])
	}

	const handleHomeStudentsPointsChange = (studentId: string, value: number) => {
		const updatedStudentsList = studentsList.map((student) =>
			student.id === studentId
				? {...student, homeStudentsPoints: value}
				: student,
		)
		setStudentsList(updatedStudentsList)
	}

	const handleClassStudentsPointsChange = (
		studentId: string,
		value: number,
	) => {
		const updatedStudentsList = studentsList.map((student) =>
			student.id === studentId
				? {...student, classStudentsPoints: value}
				: student,
		)
		setStudentsList(updatedStudentsList)
	}

	useEffect(() => {
		if (currentScheduleDay && isOpened) {
			if (isGroup && studentsList.length) {
				studentsList.forEach((student) => {
					socket.emit('updateStudentSchedule', {
						id: student.id,
						day: calendarNowPopupDay,
						month: calendarNowPopupMonth,
						year: calendarNowPopupYear,
						token,
						classFiles: classroomFiles,
						classWork: classroomComment,
						classStudentsPoints: {
							studentId: student.id,
							points: student.classStudentsPoints || 1,
						},
						homeFiles: homeFiles,
						homeWork: homeWorkComment,
						homeStudentsPoints: {
							studentId: student.id,
							points: student.homeStudentsPoints || 1,
						},
					})
				})
			} else {
				socket.emit('updateStudentSchedule', {
					id: currentScheduleDay,
					day: calendarNowPopupDay,
					month: calendarNowPopupMonth,
					year: calendarNowPopupYear,
					token,
					classFiles: classroomFiles,
					classWork: classroomComment,
					classStudentsPoints: {
						studentId: currentStudent?.id,
						points: classroomStudentsPoints,
					},
					homeFiles: homeFiles,
					homeWork: homeWorkComment,
					homeStudentsPoints: {
						studentId: currentStudent?.id,
						points: homeStudentsPoints,
					},
				})
			}
		}
	}, [
		homeWorkComment,
		classroomComment,
		homeFiles,
		classroomFiles,
		homeStudentsPoints,
		classroomStudentsPoints,
		currentScheduleDay,
		isOpened,
		currentStudent,
		isGroup,
		studentsList,
	])

	return (
		<>
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
									alreadyRecorded={audios}
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
									renderValue={(option: SelectOption<number> | null) => (
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
									<Option className={s.Option} value={0}>
										{homeFiles.length === 0
											? 'Список пока пуст'
											: homeFiles.map((file, index) => (
													<div className={s.FileWrapper} key={index}>
														<p>{file.name.slice(0, 25) + '...'}</p>
														<button
															className={s.DeleteBtn}
															onClick={() =>
																setHomeFiles(
																	homeFiles.filter((f) => f.name !== file.name),
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
							{!isGroup ? (
								<NowLevel
									className={s.NowLevel}
									value={homeStudentsPoints}
									onChange={(e) => setHomeStudentsPoints(e)}
								/>
							) : (
								<div className={s.HomeWorkGroups}>
									{studentsList.map((student, index) => (
										<div className={s.HomeWorkStud} key={index}>
											<p>{student.nameStudent}</p>
											<NowLevel
												className={s.NowLevel}
												value={homeStudentsPoints}
												onChange={(e) =>
													handleHomeStudentsPointsChange(student.id, e)
												}
											/>
											<Line width="371px" className={s.Line} />
										</div>
									))}
								</div>
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
									)}>
									<Option className={s.Option} value={0}>
										{classroomFiles.length === 0
											? 'Список пока пуст'
											: classroomFiles.map((file, index) => (
													<div className={s.FileWrapper} key={index}>
														<p>{file.name.slice(0, 25) + '...'}</p>
														<button
															className={s.DeleteBtn}
															onClick={() =>
																setClassroomFiles(
																	classroomFiles.filter(
																		(f) => f.name !== file.name,
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
							{!isGroup ? (
								<>
									<NowLevel
										className={s.NowLevel}
										value={classroomStudentsPoints}
										onChange={(e) => setClassroomStudentsPoints(e)}
									/>
									<div className={s.PrePay}>
										<p>{!hiddenNum && <>{student?.costOneLesson}</>} ₽</p>
										<CheckBox
											checked={payChecked}
											onChange={() => setPagePopUp(EPagePopUp.PrePay)}
											size="16px"
										/>
									</div>
								</>
							) : (
								<div className={s.WorkClassGroup}>
									<div className={s.WorkClassStud}>
										{studentsList.map((student, index) => (
											<div className={s.HomeWorkStud} key={index}>
												<CheckBox borderRadius={10} size="16px" />
												<p>{student.nameStudent}</p>
												<NowLevel
													className={s.NowLevel}
													value={classroomStudentsPoints}
													onChange={(e) =>
														handleClassStudentsPointsChange(student.id, e)
													}
												/>
												<CheckBox className={s.CheckboxComment} size="16px" />
												<p>Предоплата</p>
												<Line width="371px" className={s.Line} />
											</div>
										))}
									</div>
								</div>
							)}
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
			{ReactDOM.createPortal(
				pagePopUp === EPagePopUp.PrePay && (
					<div
						className={s.PopUp__wrapper}
						style={{
							maxWidth: '190px',
							position: 'absolute',
							left: '50%',
							top: '50%',
							transform: 'translate(-50%, -50%)',
						}}>
						<ExitPopUp
							className={s.PopUp}
							title="Подтвердите действие"
							yes={() => {
								setPayChecked(!payChecked)
								setPagePopUp(EPagePopUp.None)
							}}
							no={() => setPagePopUp(EPagePopUp.None)}
						/>
					</div>
				),
				document.body,
			)}
		</>
	)
}

export default DayStudentPopUp
