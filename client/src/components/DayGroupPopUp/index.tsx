import React, {useEffect, useState} from 'react'
import s from './index.module.scss'
import CloseIcon from '@mui/icons-material/Close'
import RecordNListen from '../RecordNListen'
import {Option, Select, SelectOption} from '@mui/base'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import {useSelector} from 'react-redux'
import socket from '../../socket'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import Arrow, {ArrowType} from '../../assets/arrow'

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
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)
	const hiddenNum = useSelector((state: any) => state.hiddenNum)
	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [group, setGroup] = useState<any>({})
	const [students, setStudents] = useState<any[]>([])
	const [items, setItems] = useState<any[]>([])
	const [currentIndex, setCurrentIndex] = useState(0) // Track the current student index
	const currentStudent = students[currentIndex] // Get the current student

	useEffect(() => {
		socket.emit('fetchGroupsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
		socket.once('fetchGroupsByDate', (data: any) => {
			const groupData = data.find((group: any) => group.id === groupId)
			if (groupData) {
				setGroup(groupData)
				setStudents(groupData.students)
				setItems(groupData.items)
			}
		})
	}, [
		calendarNowPopupDay,
		calendarNowPopupMonth,
		calendarNowPopupYear,
		groupId,
		token,
	])

	const handleSave = () => {
		socket.emit('modifyGroupSchedule', {
			groupId: groupId,
			items: items,
			students: students,
			token: token,
		})
	}

	useEffect(() => {
		handleSave()
	}, [students, items]) // Save data whenever students or items change

	const handlePrevStudent = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === 0 ? students.length - 1 : prevIndex - 1,
		)
	}

	const handleNextStudent = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === students.length - 1 ? 0 : prevIndex + 1,
		)
	}

	const handleAddHomeFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		if (
			!currentStudent.homeFiles?.some(
				(file: any) => file.name === fileToAdd.name,
			)
		) {
			setStudents(
				students.map((student, index) =>
					index === currentIndex
						? {
								...student,
								homeFiles: [
									...(student.homeFiles || []),
									{
										name: fileToAdd.name,
										size: fileToAdd.size,
										type: fileToAdd.type,
										file: fileToAdd,
									},
								],
							}
						: student,
				),
			)
		} else {
			console.log('Этот файл уже был добавлен.')
		}
	}

	const handleAddClassroomFile = (e: any) => {
		const fileToAdd = e.target.files[0]
		if (
			!currentStudent.classFiles?.some(
				(file: any) => file.name === fileToAdd.name,
			)
		) {
			setStudents(
				students.map((student, index) =>
					index === currentIndex
						? {
								...student,
								classFiles: [
									...(student.classFiles || []),
									{
										name: fileToAdd.name,
										size: fileToAdd.size,
										type: fileToAdd.type,
										file: fileToAdd,
									},
								],
							}
						: student,
				),
			)
		} else {
			console.log('Этот файл уже был добавлен.')
		}
	}

	const handleHomeWorkChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value
		setStudents(
			students.map((student, index) =>
				index === currentIndex ? {...student, homeWork: value} : student,
			),
		)
	}

	const handleClassWorkChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const value = e.target.value
		setStudents(
			students.map((student, index) =>
				index === currentIndex ? {...student, classWork: value} : student,
			),
		)
	}

	return (
		<div style={style} className={s.wrapper}>
			<div className={s.InfoBlock}>
				<div className={s.Header}>
					<div className={s.MainHeader}>
						<div className={s.IconHeader}>
							<img src={icon} alt="icon" />
							<p>{group.groupName}</p>
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
							value={currentStudent?.homeWork || ''}
							onChange={handleHomeWorkChange}
						/>
						<div className={s.MediaBlock}>
							<RecordNListen
								alreadyRecorded={currentStudent?.audios || []}
								callback={(
									file: any,
									name: string,
									type: string,
									size: number,
								) => {
									setStudents(
										students.map((student, index) =>
											index === currentIndex
												? {
														...student,
														audios: [
															...(student.audios || []),
															{name: name, type: type, size: size, file: file},
														],
													}
												: student,
										),
									)
								}}
								className={s.RecordNListen}
								typeCard="day/group/audio/homework"
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
								onListboxOpenChange={() => {}}
								renderValue={(option: SelectOption<number> | null) => {
									return (
										<div className={s.ListWrapper}>
											<label htmlFor="inputFile1" className={s.LabelFile}>
												<img src={uploadFile} alt="uploadFile" />
											</label>
										</div>
									)
								}}>
								<Option className={s.Option} value={0}>
									{currentStudent?.homeFiles?.length === 0
										? 'Список пока пуст'
										: currentStudent?.homeFiles?.map(
												(file: any, index: number) => (
													<div className={s.FileWrapper} key={index}>
														<p>{file.name.slice(0, 25) + '...'}</p>
														<button
															className={s.DeleteBtn}
															onClick={() =>
																setStudents(
																	students.map((student, i) =>
																		i === currentIndex
																			? {
																					...student,
																					homeFiles: student.homeFiles.filter(
																						(f: any) => f.name !== file.name,
																					),
																				}
																			: student,
																	),
																)
															}>
															<DeleteOutlineIcon />
														</button>
													</div>
												),
											)}
								</Option>
							</Select>
						</div>
						<h1>Выполнение домашней работы</h1>
						<div className={s.HomeWorkGroups}>
							{students.map((student: any, index: number) => (
								<div className={s.HomeWorkStud} key={index}>
									<p>{student.nameStudent}</p>
									<NowLevel
										className={s.NowLevel}
										value={student.homeStudentsPoints?.points || 0}
										onChange={(e) =>
											setStudents(
												students.map((s, i) =>
													i === index
														? {...s, homeStudentsPoints: {points: e}}
														: s,
												),
											)
										}
									/>
								</div>
							))}
						</div>
					</div>
					<div className={s.Devider}></div>
					<div className={s.LessonWrapper}>
						<h1>Занятие</h1>
						<textarea
							className={s.TextArea}
							placeholder="Комментарий"
							value={currentStudent?.classWork || ''}
							onChange={handleClassWorkChange}
						/>
						<div className={s.MediaBlock}>
							<RecordNListen
								alreadyRecorded={currentStudent?.classAudio || []}
								callback={(
									file: any,
									name: string,
									type: string,
									size: number,
								) => {
									setStudents(
										students.map((student, index) =>
											index === currentIndex
												? {
														...student,
														classAudio: [
															...(student.classAudio || []),
															{name: name, type: type, size: size, file: file},
														],
													}
												: student,
										),
									)
								}}
								className={s.RecordNListen}
								typeCard="day/group/audio/classwork"
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
								onListboxOpenChange={() => {}}
								renderValue={(option: SelectOption<number> | null) => {
									return (
										<div className={s.ListWrapper}>
											<label htmlFor="inputFile2" className={s.LabelFile}>
												<img src={uploadFile} alt="uploadFile" />
											</label>
										</div>
									)
								}}>
								<Option className={s.Option} value={0}>
									{currentStudent?.classFiles?.length === 0
										? 'Список пока пуст'
										: currentStudent?.classFiles?.map(
												(file: any, index: number) => (
													<div className={s.FileWrapper} key={index}>
														<p>{file.name.slice(0, 25) + '...'}</p>
														<button
															className={s.DeleteBtn}
															onClick={() =>
																setStudents(
																	students.map((student, i) =>
																		i === currentIndex
																			? {
																					...student,
																					classFiles: student.classFiles.filter(
																						(f: any) => f.name !== file.name,
																					),
																				}
																			: student,
																	),
																)
															}>
															<DeleteOutlineIcon />
														</button>
													</div>
												),
											)}
								</Option>
							</Select>
						</div>
						<h1>Работа на занятии</h1>
						<div className={s.WorkClassGroup}>
							{students.map((student: any, index: number) => (
								<div className={s.HomeWorkStud} key={index}>
									<p>{student.nameStudent}</p>
									<NowLevel
										className={s.NowLevel}
										value={student.classStudentsPoints?.points || 0}
										onChange={(e) =>
											setStudents(
												students.map((s, i) =>
													i === index
														? {...s, classStudentsPoints: {points: e}}
														: s,
												),
											)
										}
									/>
								</div>
							))}
						</div>
						<div className={s.Total}>{!hiddenNum && <p>Итог: </p>}</div>
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
				<button onClick={handleSave}>Сохранить</button>
			</div>
		</div>
	)
}

export default DayGroupPopUp
