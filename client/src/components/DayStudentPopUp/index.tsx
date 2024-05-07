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
import {useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import socket from '../../socket'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
interface IDayStudentPopUp {
	icon?: any
	name?: string
	address?: string
	date?: string
	time?: string
	style?: React.CSSProperties
	onExit?: () => void
	isGroup?: boolean
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
	isGroup,
	groupId,
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
			setStudent(student || {})
			console.log(
				'studentstudentstudentstudentstudentstudentstudentstudentstudent',
				student,
			)
			setHomeWorkComment(student?.homeWork || '')
			setClassroomComment(student?.classWork || '')
			setHomeFiles(student?.homeFiles || [])
			setClassroomFiles(student?.classFiles || [])
			setHomeFilesPaths(student?.homeFilesPath || [])
			setClassroomFilesPaths(student?.classFilesPath || [])
			setHomeStudentsPoints(student?.homeStudentsPoints?.points || 1)
			setClassroomStudentsPoints(student?.classStudentsPoints?.points || 1)
		})
		setIsOpened(true)
	}, [])

	const [groups, setGroups] = useState<any>([])
	const [group, setGroup] = useState<any>({})

	useEffect(() => {
		socket.emit('getGroupsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			userId: token,
		})
		socket.once('getGroupsByDate', (data: any) => {
			console.log('getGroupsByDate', data)
			setGroups(data)

			//get group where groupId = groupId
			const group = data.find((group: any) => group.groupId === groupId)
			setGroup(group)
		})
	}, [])

	console.log('groupgroupgroupgroupgroup', group)

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
							<p>{student?.nameStudent}</p>
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
							<RecordNListen className={s.RecordNListen} />
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
						{!isGroup ? (
							<NowLevel
								className={s.NowLevel}
								value={homeStudentsPoints}
								onChange={(e) => setHomeStudentsPoints(e)}
							/>
						) : (
							<>
								<div className={s.HomeWorkGroups}>
									<div className={s.HomeWorkStud}>
										<p>Петров</p>
										<NowLevel
											className={s.NowLevel}
											value={homeStudentsPoints}
											onChange={(e) => setHomeStudentsPoints(e)}
										/>
									</div>
									<Line width="371px" className={s.Line} />
									<div className={s.HomeWorkStud}>
										<p>Петров</p>
										<NowLevel
											className={s.NowLevel}
											value={homeStudentsPoints}
											onChange={(e) => setHomeStudentsPoints(e)}
										/>
									</div>
									<Line width="371px" className={s.Line} />
									<div className={s.HomeWorkStud}>
										<p>Петров</p>
										<NowLevel
											className={s.NowLevel}
											value={homeStudentsPoints}
											onChange={(e) => setHomeStudentsPoints(e)}
										/>
									</div>
									<Line width="371px" className={s.Line} />
									<div className={s.HomeWorkStud}>
										<p>Петров</p>
										<NowLevel
											className={s.NowLevel}
											value={homeStudentsPoints}
											onChange={(e) => setHomeStudentsPoints(e)}
										/>
									</div>
									<Line width="371px" className={s.Line} />
								</div>
							</>
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
							<RecordNListen className={s.RecordNListen} />
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
						{!isGroup ? (
							<>
								<NowLevel
									className={s.NowLevel}
									value={classroomStudentsPoints}
									onChange={(e) => setClassroomStudentsPoints(e)}
								/>
								<div className={s.PrePay}>
									<p>{!hiddenNum && <>0</>} ₽</p>
									<CheckBox size="16px" />
								</div>
							</>
						) : (
							<>
								<div className={s.WorkClassGroup}>
									<div className={s.WorkClassStud}>
										<CheckBox borderRadius={10} size="16px" />
										<p>Петров</p>
										<NowLevel
											className={s.NowLevel}
											value={classroomStudentsPoints}
											onChange={(e) => setClassroomStudentsPoints(e)}
										/>

										<CheckBox className={s.CheckboxComment} size="16px" />
										<p>Предоплата</p>
									</div>
									<Line width="100%" className={s.Line} />
									<div className={s.WorkClassStud}>
										<CheckBox borderRadius={10} size="16px" />
										<p>Петров</p>
										<NowLevel
											className={s.NowLevel}
											value={classroomStudentsPoints}
											onChange={(e) => setClassroomStudentsPoints(e)}
										/>

										<CheckBox className={s.CheckboxComment} size="16px" />
										<p>Предоплата</p>
									</div>
									<Line width="100%" className={s.Line} />
									<div className={s.WorkClassStud}>
										<CheckBox borderRadius={10} size="16px" />
										<p>Петров</p>
										<NowLevel
											className={s.NowLevel}
											value={classroomStudentsPoints}
											onChange={(e) => setClassroomStudentsPoints(e)}
										/>

										<CheckBox className={s.CheckboxComment} size="16px" />
										<p>Предоплата</p>
									</div>
									<Line width="100%" className={s.Line} />
									<div className={s.WorkClassStud}>
										<CheckBox borderRadius={10} size="16px" />
										<p>Петров</p>
										<NowLevel
											className={s.NowLevel}
											value={classroomStudentsPoints}
											onChange={(e) => setClassroomStudentsPoints(e)}
										/>

										<CheckBox className={s.CheckboxComment} size="16px" />
										<p>Предоплата</p>
									</div>
									<Line width="100%" className={s.Line} />
								</div>
								<div className={s.Total}>{!hiddenNum && <p>Итог: </p>}</div>
							</>
						)}
					</div>
				</div>
			</div>
			<div className={s.buttons}>
				<button onClick={onExit}>
					<CloseIcon className={s.closeIcon} />
				</button>
				{/* <div className={s.btn}>
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
				</div> */}
			</div>
		</div>
	)
}

export default DayStudentPopUp
