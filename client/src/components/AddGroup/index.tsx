import s from './index.module.scss'
import * as mui from '@mui/material'
import * as MUI from '@mui/base'
import {styled} from '@mui/material/styles'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Line from '../Line'
import {useEffect, useState} from 'react'
import Arrow, {ArrowType} from '../../assets/arrow'
import Plus from '../../assets/ItemPlus.svg'
import CheckBox from '../CheckBox'
import CreateIcon from '@mui/icons-material/Create'
import InputMask from 'react-input-mask'
import './index.css'
import ScheduleDate from '../ScheduleDate/index'
import ScheduleIcon from '@mui/icons-material/Schedule'
import NowLevel from '../NowLevel/index'
import Input from '../Input'

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
	ELeftMenuPage,
	EPagePopUpExit,
	IGroupHistoryLessons,
	IItemCard,
	IStudent,
	ITimeLine,
} from '../../types'
import TimePicker from '../Timer/index'
import {useDispatch, useSelector} from 'react-redux'
import socket from '../../socket'
import {addDays, differenceInDays} from 'date-fns'
import ExitPopUp from '../ExitPopUp'
import CloseIcon from '@mui/icons-material/Close'
import FileNLinks from '../FileNLinks'
import RecordNListen from '../RecordNListen/index'
import IconsPhone from '../IconsPhone/index'
import {useNavigate} from 'react-router-dom'
import TextAreaInputBlock from '../TextAreaInputBlock'
import MiniCalendar from '../MiniCalendar'
import {TailSpin} from 'react-loader-spinner'
import {preview} from 'vite'

interface IAddGroup {
	className?: string
}

const AddGroup = ({className}: IAddGroup) => {
	const user = useSelector((state: any) => state.user)
	const token = user?.token
	const [groupName, setGroupName] = useState<string>('')
	// Block Student
	const dispatch = useDispatch()
	const [commentStudent, setCommentStudent] = useState<string>('')

	const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

	const [currentItemIndex, setCurrentItemIndex] = useState(0)
	const [currentStudentIndex, setCurrentStudentIndex] = useState(0)

	const PagePopUpExit = useSelector((state: any) => state.pagePopUpExit)
	const editedCards = useSelector((state: any) => state.editedCards)
	const currentOpenedGroup = useSelector(
		(state: any) => state.currentOpenedGroup,
	)

	const [allCostForGroup, setAllCostForGroup] = useState<number>(0)
	const [allPriceGroup, setAllPriceGroup] = useState<number>(0)
	const [files, setFiles] = useState<{}[]>([])
	const [filesItems, setFilesItems] = useState<{}[]>([])

	const navigate = useNavigate()
	const [audioItems, setAudioItems] = useState<{}[]>([])
	const [audioStudents, setAudioStudents] = useState<{}[]>([])

	const [errorList, setErrorList] = useState<string[]>([])

	const [loading, setLoading] = useState<boolean>(false)

	const [links, setLinks] = useState<string[]>([])
	const [linksItems, setLinksItems] = useState<string[]>([])

	const [groupsIndexes, setGroupsIndexes] = useState<number[]>([])
	const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(0)

	const [data, setData] = useState<any>()

	// Block item
	const [items, setItems] = useState<IItemCard[]>([
		{
			itemName: '',
			tryLessonCheck: false,
			tryLessonCost: '',
			todayProgramStudent: '',
			targetLesson: '',
			programLesson: '',
			typeLesson: '1',
			placeLesson: '',
			costOneLesson: '',
			files: [],
			timeLesson: '',
			startLesson: new Date(Date.now()),
			endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
			// totalCostOneLesson: 0,
			commentItem: '',
			lessonDuration: null,
			nowLevel: 0,
			valueMuiSelectArchive: 1,
			timeLinesArray: getVoidWeek() as ITimeLine[],
		},
	])

	const [students, setStudents] = useState<IStudent[]>([
		{
			nameStudent: '',
			contactFace: '',
			phoneNumber: '',
			email: '',
			costOneLesson: '',
			address: '',
			linkStudent: '',
			costStudent: '',
			commentStudent: '',
			prePayCost: '',
			prePayDate: new Date(Date.now()),
			selectedDate: null,
			files: [],
			storyLesson: '',
			tryLessonCheck: false,
			tryLessonCost: '',
			targetLessonStudent: '',
			todayProgramStudent: '',
			startLesson: new Date(Date.now()),
			endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
		},
	])

	const [studentsHistoryLessons, setStudentsHistoryLessons] = useState<
		IGroupHistoryLessons[][]
	>([])

	const [isEditMode, setIsEditMode] = useState(
		currentOpenedGroup ? true : false,
	)

	const [openHistory, setOpenHistory] = useState(false)

	const [showEndTimePicker, setShowEndTimePicker] = useState(-1)

	let allDuty = 0
	const [DutyStudents, setDutyStudents] = useState<any>([])

	const handleAddAudioItems = (
		file: Blob,
		name: string,
		type: string,
		size: string,
	) => {
		setAudioItems([
			...audioItems,
			{name: name, type: type, file: file, size: size},
		])
	}

	const handleAddAudioStudents = (
		file: Blob,
		name: string,
		type: string,
		size: string,
	) => {
		setAudioStudents([
			...audioStudents,
			{name: name, type: type, file: file, size: size},
		])
	}

	function getVoidWeek(): ITimeLine[] {
		const week = daysOfWeek.map((day, index) => ({
			id: (index + 1) * (currentItemIndex > 0 ? currentItemIndex : 1),
			day,
			active: false,
			startTime: {hour: 0, minute: 0},
			endTime: {hour: 0, minute: 0},
			editingStart: false,
			editingEnd: false,
		}))

		return week
	}

	const sendInfo = () => {
		setLoading(true)
		if (currentOpenedGroup !== '') {
			// !TODO
			socket.emit('updateGroup', {
				id: currentOpenedGroup,
				groupName: groupName,
				items: items,
				students: students,
				token: token,
				files: files,
				filesItems: filesItems,
				audiosItems: audioItems,
				audiosStudents: audioStudents,
				historyLessons: studentsHistoryLessons,
			})
			socket.emit('createLink', {
				tag: 'addGroup',
				linkedId: currentOpenedGroup,
				links: links,
				token: token,
			})
			socket.emit('createLink', {
				tag: 'addGroupItems',
				linkedId: `${currentOpenedGroup}_items`,
				links: linksItems,
				token: token,
			})
			// setLoading(false)
			window.location.reload()
		} else {
			console.log(
				'\n----------------------------sendInfo----------------\n',
				groupName,
				items,
				students,
				token,
				files,
				filesItems,
				'\n----------------------------sendInfo----------------\n',
			)
			setLoading(false)
			if (groupName && students.every((student) => student.nameStudent)) {
				socket.emit('addGroup', {
					groupName: groupName,
					items: items,
					students: students,
					token: token,
					files: files,
					filesItems: filesItems,
					audiosItems: audioItems,
					audiosStudents: audioStudents,
					historyLessons: studentsHistoryLessons,
				})

				socket.emit('createLink', {
					tag: 'addGroup',
					linkedId: currentOpenedGroup,
					links: links,
					token: token,
				})
				socket.emit('createLink', {
					tag: 'addGroupItems',
					linkedId: `${currentOpenedGroup}_items`,
					links: linksItems,
					token: token,
				})
			}
		}
		// window.location.reload()
	}

	function getDay(date: any) {
		const dayIndex = date.getDay() - 1
		return dayIndex === -1 ? 6 : dayIndex
	}

	const nextGroup = () => {
		if (Number(currentGroupIndex) < groupsIndexes.length - 1) {
			setCurrentGroupIndex(Number(currentGroupIndex) + 1)
			const newId = groupsIndexes[Number(currentGroupIndex) + 1]

			dispatch({type: 'SET_CURRENT_OPENED_GROUP', payload: newId})
			socket.emit('getGroupById', {token: token, groupId: newId})

			socket.once('getGroupById', (data) => {
				console.log(data, 'getGroupById')
				setData(data)
				setGroupName(data.groupName)
				setItems(data.items)
				setStudents(data.students)
				setFiles(data.files)
				setFilesItems(data.filesItems)
				setAudioItems(data.audioItems)
				setAudioStudents(data.audioStudents)
			})
		}
	}

	const prevGroup = () => {
		if (Number(currentGroupIndex) > 0) {
			setCurrentGroupIndex(Number(currentGroupIndex) - 1)
			const newId = groupsIndexes[Number(currentGroupIndex) - 1]

			dispatch({type: 'SET_CURRENT_OPENED_GROUP', payload: newId})
			socket.emit('getGroupById', {token: token, groupId: newId})

			socket.once('getGroupById', (data) => {
				console.log(data, 'getGroupById')
				setData(data)
				setGroupName(data.groupName)
				setItems(data.items)
				setStudents(data.students)
				setFiles(data.files)
				setFilesItems(data.filesItems)
				setAudioItems(data.audioItems)
				setAudioStudents(data.audioStudents)
			})
		}
	}

	//change item function by name of value
	const changeItemValue = (
		itemIndex: number,
		name: string,
		value: string | boolean | number | Date | null,
	) => {
		setItems(
			items.map((item, index) =>
				index === itemIndex ? {...item, [name]: value} : item,
			),
		)
		console.log(items)
	}

	const changeStudentValue = (
		studentIndex: number,
		name: string,
		value: string | boolean | number | Date | null,
	) => {
		setStudents(
			students.map((student, index) =>
				index === studentIndex ? {...student, [name]: value} : student,
			),
		)
	}

	const handleClick_delete = (itemIndex: number, id: number) => {
		setItems((prevItems) =>
			prevItems.map((item, index) =>
				index === itemIndex
					? {
							...item,
							timeLinesArray: item.timeLinesArray.map((timeline) =>
								timeline.id === id
									? {
											...timeline,
											startTime: {hour: 0, minute: 0},
											endTime: {hour: 0, minute: 0},
										}
									: timeline,
							),
						}
					: item,
			),
		)
	}

	const handleClick_dp = (itemIndex: number, id: number) => {
		setItems((prevItems) =>
			prevItems.map((item, index) =>
				index === itemIndex
					? {
							...item,
							timeLinesArray: item.timeLinesArray.map((timeline) =>
								timeline.id === id
									? {
											...timeline,
											active: !timeline.active,
											editingStart: !timeline.active,
											editingEnd: false,
										}
									: {
											...timeline,
											active: false,
											editingStart: false,
											editingEnd: false,
										},
							),
						}
					: item,
			),
		)
		setShowEndTimePicker(-1)
	}

	const handleStartTimeChange = (
		itemIndex: number,
		id: number,
		hour: number,
		minute: number,
	) => {
		console.log('start', itemIndex, id, hour, minute)
		setItems((prevItems) =>
			prevItems.map((item, index) =>
				index === itemIndex
					? {
							...item,
							timeLinesArray: item.timeLinesArray.map(
								(timeline) =>
									timeline.id === id
										? {
												...timeline,
												startTime: {hour, minute},
												editingEnd: item.lessonDuration! > 0 ? false : true,
												editingStart: false,
												active: false, // Закрываем окно выбора начала занятий
											}
										: {...timeline, active: false}, // Закрываем окно выбора начала занятий для других строк
							),
						}
					: item,
			),
		)

		if (items[itemIndex].lessonDuration! > 0) {
			const endHour = hour + Math.floor(items[itemIndex].lessonDuration! / 60)
			const endMinute = (minute + (items[itemIndex].lessonDuration! % 60)) % 60
			setItems((prevItems) =>
				prevItems.map((item, index) =>
					index === itemIndex
						? {
								...item,
								timeLinesArray: item.timeLinesArray.map((timeline) =>
									timeline.id === id
										? {
												...timeline,
												endTime: {hour: endHour, minute: endMinute},
												editingEnd: false,
											}
										: timeline,
								),
							}
						: item,
				),
			)
			setShowEndTimePicker(-1)
		} else {
			setShowEndTimePicker(id)
		}
	}

	const handleEndTimeChange = (
		itemIndex: number,
		id: number,
		hour: number,
		minute: number,
	) => {
		const timelineToUpdate = items[itemIndex].timeLinesArray.find(
			(timeline) => timeline.id === id,
		)
		if (
			timelineToUpdate &&
			(hour > timelineToUpdate.startTime.hour ||
				(hour === timelineToUpdate.startTime.hour &&
					minute > timelineToUpdate.startTime.minute))
		) {
			setItems((prevItems) =>
				prevItems.map((item, index) =>
					index === itemIndex
						? {
								...item,
								timeLinesArray: item.timeLinesArray.map((timeline) =>
									timeline.id === id
										? {...timeline, endTime: {hour, minute}, editingEnd: false}
										: timeline,
								),
							}
						: item,
				),
			)
			// console.log('close', index, id)
			setShowEndTimePicker(-1)
		} else {
			console.log('End time must be greater than start time')
		}
	}

	const handleNextItem = () => {
		if (currentItemIndex < items.length - 1) {
			setCurrentItemIndex(currentItemIndex + 1)
		}
	}

	const handlePrevItem = () => {
		if (currentItemIndex > 0) {
			setCurrentItemIndex(currentItemIndex - 1)
		}
	}

	// ! TODO
	const compareDates = (a: IGroupHistoryLessons, b: IGroupHistoryLessons) => {
		return new Date(a.date).getTime() - new Date(b.date).getTime()
	}

	// Function to hash a string using a custom hash function
	const hashString = (str: string) => {
		let hash = 0
		for (let i = 0; i < str.length; i++) {
			const char = str.charCodeAt(i)
			hash = (hash << 5) - hash + char
			hash = hash & hash // Convert to 32bit integer
		}
		return Math.abs(hash) // Ensure positive integer
	}

	const formatDate = (date: Date) => {
		console.log(date, 'DATE----')
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = String(date.getFullYear()).slice(-2) // Take last 2 digits of the year

		return `${day}.${month}.${year}`
	}

	// Function to convert a hash value to a hexadecimal color code with fixed saturation and brightness
	const hashToColor = (hash: number) => {
		const saturation = 0.6 // Fixed saturation
		const brightness = 0.7 // Fixed brightness

		// Vary hue based on hash
		const hue = hash % 360

		// Convert HSB to RGB
		const h = hue / 60
		const c = brightness * saturation
		const x = c * (1 - Math.abs((h % 2) - 1))
		const m = brightness - c
		let r, g, b
		if (h >= 0 && h < 1) {
			;[r, g, b] = [c, x, 0]
		} else if (h >= 1 && h < 2) {
			;[r, g, b] = [x, c, 0]
		} else if (h >= 2 && h < 3) {
			;[r, g, b] = [0, c, x]
		} else if (h >= 3 && h < 4) {
			;[r, g, b] = [0, x, c]
		} else if (h >= 4 && h < 5) {
			;[r, g, b] = [x, 0, c]
		} else {
			;[r, g, b] = [c, 0, x]
		}

		// Convert RGB to hexadecimal color code
		const rgb = [(r + m) * 255, (g + m) * 255, (b + m) * 255]
		const hexColor = rgb
			.map((value) => Math.round(value).toString(16).padStart(2, '0'))
			.join('')
		return `#${hexColor}`
	}

	const handleAddItem = () => {
		const newItemName = items[currentItemIndex].itemName
		const existingItemsNames = items
			.filter((item, index) => index !== currentItemIndex)
			.map((item) => item.itemName)

		if (
			items[currentItemIndex].itemName !== '' &&
			currentItemIndex === items.length - 1 &&
			!existingItemsNames.includes(newItemName)
		) {
			setItems([
				...items,
				{
					itemName: '',
					tryLessonCheck: false,
					tryLessonCost: '',
					todayProgramStudent: '',
					targetLesson: '',
					programLesson: '',
					typeLesson: '1',
					costOneLesson: '',
					files: [],
					placeLesson: '',
					timeLesson: '',
					startLesson: new Date(Date.now()),
					endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
					nowLevel: 0,
					valueMuiSelectArchive: 1,
					lessonDuration: null,
					commentItem: '',
					timeLinesArray: getVoidWeek() as ITimeLine[],
				},
			])
			setCurrentItemIndex(currentItemIndex + 1)
		}
	}

	const handleAddFile = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		console.log(file, name, type, size)
		setFiles((prevData) => [
			...prevData,
			{name: name, type: type, size: size, file: file},
		])
	}

	const handleAddFileItems = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		console.log(file, name, type, size)
		setFilesItems((prevData) => [
			...prevData,
			{name: name, type: type, size: size, file: file},
		])
		console.log(filesItems)
	}

	// ! CHECK THIS
	const handleLinksSubmit = (linksCallback: string[]) => {
		setLinks(linksCallback)
	}

	const deleteLink = (link: string, index: number) => {
		socket.emit('deleteLink', {
			linkedId: currentOpenedGroup,
			token: token,
		})
		socket.once('deleteLink', (data: any) => {
			setLinks(links.filter((item) => item !== link))
		})
	}

	// Items Audio
	const handleLinksSubmitItems = (linksCallback: string[]) => {
		setLinksItems(linksCallback)
	}

	const deleteLinkItems = (link: string, index: number) => {
		socket.emit('deleteLink', {
			linkedId: `${currentOpenedGroup}_items`,
			token: token,
		})
		socket.once('deleteLink', (data: any) => {
			setLinksItems(linksItems.filter((item) => item !== link))
		})
	}

	const closeTimePicker = (index: number, id: number) => {
		//get timeline
		const timelineToUpdate = items[index].timeLinesArray.find(
			(timeline) => timeline.id === id,
		)

		setItems((prevItems) =>
			prevItems.map((item, itemIndex) =>
				itemIndex === index
					? {
							...item,
							timeLinesArray: item.timeLinesArray.map((timeline) =>
								timeline.id === id
									? {
											...timeline,
											editingEnd: false,
											active: false,
											startTime: {
												hour:
													timelineToUpdate?.startTime.hour &&
													!timelineToUpdate?.endTime.hour
														? 0
														: timelineToUpdate?.startTime.hour!,
												minute:
													timelineToUpdate?.startTime.minute &&
													!timelineToUpdate?.endTime.minute
														? 0
														: timelineToUpdate?.startTime.minute!,
											},
											endTime: {
												hour: timelineToUpdate?.endTime.hour
													? timelineToUpdate?.endTime.hour
													: 0,
												minute: timelineToUpdate?.endTime.minute
													? timelineToUpdate?.endTime.minute
													: 0,
											}, // Reset endTime when closing without saving
										}
									: timeline,
							),
						}
					: item,
			),
		)

		console.log('close', index, id)
		setShowEndTimePicker(-1)
	}
	const handleNextStudent = () => {
		if (currentStudentIndex < students.length - 1) {
			setCurrentStudentIndex(currentStudentIndex + 1)
		}
	}

	const handlePrevStudent = () => {
		if (currentStudentIndex > 0) {
			setCurrentStudentIndex(currentStudentIndex - 1)
		}
	}

	const handleAddStudent = () => {
		if (
			students[currentStudentIndex].nameStudent !== '' &&
			currentStudentIndex === students.length - 1
		) {
			setStudents([
				...students,
				{
					nameStudent: '',
					contactFace: '',
					phoneNumber: '',
					email: '',
					address: '',
					linkStudent: '',
					costStudent: '',
					commentStudent: '',
					prePayCost: '',
					prePayDate: new Date(Date.now()),
					selectedDate: null,
					storyLesson: '',
					tryLessonCheck: false,
					tryLessonCost: '',
					nowLevel: 0,
					costOneLesson: '',
					targetLessonStudent: '',
					todayProgramStudent: '',
					startLesson: new Date(Date.now()),
					endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
					files: [],
				},
			])
			setCurrentStudentIndex(currentStudentIndex + 1)
		}
	}

	// ? CHECK THIS
	const NotPayedStudent = (index: number) => {
		if (studentsHistoryLessons[index] === undefined) return '0'
		const Payed =
			studentsHistoryLessons[index].filter((i) => i.isDone).length -
			studentsHistoryLessons[index].filter((i) => i.isPaid).length
		if (Payed > 0) {
			return Payed
		} else return '0'
	}

	const handleDutyStudent = (student: any, index: number) => {
		const duty =
			(studentsHistoryLessons[index] &&
				(studentsHistoryLessons[index].filter((i) => i.isDone).length -
					studentsHistoryLessons[index].filter((i) => i.isPaid).length) *
					Number(student.costOneLesson)) ||
			0

		DutyStudents[index] = duty
		return DutyStudents[index]
	}

	const handleDelete = () => {
		socket.emit('deleteGroup', {
			token: token,
			id: currentOpenedGroup,
		})
		window.location.reload()
	}

	const handleToArchive = () => {
		socket.emit('groupToArchive', {
			token: token,
			id: currentOpenedGroup,
			isArchived: true,
		})
		window.location.reload()
	}
	// const handleStudentsHistoryLessons = (index: number) => {
	// 	let filteredLessons = studentsHistoryLessons[currentStudentIndex].map(
	// 		(lesson: IGroupHistoryLessons, lessonIndex: number) => (
	// 			<div className={s.ListObject} key={lessonIndex}>
	// 				<p
	// 					style={{
	// 						fontWeight: '500',
	// 						fontSize: '14px',
	// 						marginRight: '5px',
	// 						display: 'flex',
	// 						flexDirection: 'row',
	// 						alignItems: 'center',
	// 					}}>
	// 					<div
	// 						style={{
	// 							backgroundColor: hashToColor(hashString(lesson.itemName)),
	// 							width: '10px',
	// 							height: '35px',
	// 							borderTopLeftRadius: '8px',
	// 							borderBottomLeftRadius: '8px',
	// 							marginRight: '5px',
	// 						}}></div>
	// 					{formatDate(lesson.date)}
	// 				</p>
	// 				<p
	// 					style={{
	// 						fontWeight: '300',
	// 						fontSize: '14px',
	// 						width: '95px',
	// 						minWidth: '95px',
	// 						maxWidth: '95px',
	// 						whiteSpace: 'nowrap',
	// 						overflow: 'hidden',
	// 						textOverflow: 'ellipsis',
	// 					}}>
	// 					{lesson.itemName}
	// 				</p>
	// 				<CheckBox
	// 					checked={lesson.isDone}
	// 					size="16px"
	// 					onChange={() =>
	// 						setHistoryLessonIsDone(index, lessonIndex, !lesson.isDone)
	// 					}
	// 				/>
	// 				<p
	// 					style={{
	// 						width: '100px',
	// 						textAlign: 'end',
	// 						fontSize: '14px',
	// 						textOverflow: 'ellipsis',
	// 						overflow: 'hidden',
	// 					}}>
	// 					{lesson.price || 0}₽
	// 				</p>
	// 				<CheckBox
	// 					checked={lesson.isPaid}
	// 					size="16px"
	// 					onChange={() =>
	// 						setHistoryLessonIsPaid(index, lessonIndex, !lesson.isPaid)
	// 					}
	// 				/>
	// 				<button className={s.ButtonEdit}>
	// 					<CreateIcon style={{width: '18px', height: '18px'}} />
	// 				</button>
	// 			</div>
	// 		),
	// 	)
	// 	return filteredLessons
	// }

	const [filteredLessonsHistory, setFilteredLessonsHistory] = useState<
		JSX.Element[]
	>([])

	useEffect(() => {
		const updateFilteredLessons = () => {
			if (studentsHistoryLessons[currentStudentIndex]) {
				const lessons = studentsHistoryLessons[currentStudentIndex].map(
					(lesson: IGroupHistoryLessons, lessonIndex: number) => (
						<div className={s.ListObject} key={lessonIndex}>
							<p
								style={{
									fontWeight: '500',
									fontSize: '14px',
									marginRight: '5px',
									display: 'flex',
									flexDirection: 'row',
									alignItems: 'center',
								}}>
								<div
									style={{
										backgroundColor: hashToColor(hashString(lesson.itemName)),
										width: '10px',
										height: '35px',
										borderTopLeftRadius: '8px',
										borderBottomLeftRadius: '8px',
										marginRight: '5px',
									}}></div>
								{formatDate(lesson.date)}
							</p>
							<CheckBox
								checked={lesson.isDone}
								size="16px"
								onChange={() =>
									setHistoryLessonIsDone(
										currentStudentIndex,
										lessonIndex,
										!lesson.isDone,
									)
								}
							/>
							<p
								style={{
									fontWeight: '300',
									fontSize: '16px',
									width: '95px',
									minWidth: '95px',
									maxWidth: '95px',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
								}}>
								{lesson.itemName}
							</p>

							<p
								style={{
									width: '100px',
									textAlign: 'end',
									fontSize: '14px',
									textOverflow: 'ellipsis',
									overflow: 'hidden',
								}}>
								{lesson.price || 0}₽
							</p>
							<CheckBox
								checked={lesson.isPaid}
								size="16px"
								onChange={() =>
									setHistoryLessonIsPaid(
										currentStudentIndex,
										lessonIndex,
										!lesson.isPaid,
									)
								}
							/>
							<button className={s.ButtonEdit}>
								<CreateIcon style={{width: '18px', height: '18px'}} />
							</button>
						</div>
					),
				)
				setFilteredLessonsHistory(lessons)
			}
		}

		updateFilteredLessons()
	}, [studentsHistoryLessons, currentStudentIndex])

	const handleDuty = (student: any, index: number) => {
		const duty =
			(studentsHistoryLessons[index] &&
				(studentsHistoryLessons[index].filter((i) => i.isDone).length -
					studentsHistoryLessons[index].filter((i) => i.isPaid).length) *
					Number(student.costOneLesson)) ||
			0

		DutyStudents[index] = duty
		if (duty < 0 || allDuty < 0) {
			return 0
		}
		allDuty += duty
		return duty
	}

	socket.once('addGroup', (data) => {
		const ok: boolean = data.ok
		if (ok === true) {
			window.location.reload()
		} else {
			const meesage = data.error
			if (errorList.indexOf(meesage) === -1) {
				setErrorList([...errorList, meesage])
			}
			setLoading(false)
		}
	})

	socket.once('getLinksByLinkedId', (data: any) => {
		if (data.tag === 'addGroup') {
			setLinks(data.links)
			console.log(data, 'ADDGROUP')
		} else if (data.tag === 'addGroupItems') {
			setLinksItems(data.links)
			console.log(data, 'ADDGROUPITEMS')
		}
	})

	useEffect(() => {
		socket.emit('getGroupById', {
			token: token,
			groupId: currentOpenedGroup,
		})
		socket.emit('getGroupList', token)
		socket.once('getGroupList', (data) => {
			const arr = Object.values(data).map((item: any) => item.id)
			const cgp = arr.indexOf(currentOpenedGroup)
			setGroupsIndexes(arr)
			setCurrentGroupIndex(cgp)
		})

		socket.once('getGroupById', (data) => {
			setData(data)
			setGroupName(data.groupName)
			setItems(data.items)
			setStudents(data.students)
			setFiles(data.files)
			setFilesItems(data.filesItems)
			setAudioItems(data.audioItems)
			setAudioStudents(data.audioStudents)
			// !! Check This
			let dateHistory = data.historyLessons.map((i) => {
				return i.map((j) => {
					{
						return {...j, date: new Date(j.date)}
					}
				})
			})
			console.log(dateHistory, 'DateHISTORY')
			setStudentsHistoryLessons(dateHistory)
			console.log(data.historyLessons, 'data.historyLessons ----')
		})

		socket.emit('getLinksByLinkedId', {
			linkedId: currentOpenedGroup,
			token: token,
		})
		socket.emit('getLinksByLinkedId', {
			linkedId: `${currentOpenedGroup}_items`,
			token: token,
		})
	}, [])

	useEffect(() => {
		if (data) {
			console.log(data, 'getGroupById DATA')

			setGroupName(data.groupName)
			setItems(data.items)
			setStudents(data.students)
			setFiles(data.files)
			setFilesItems(data.filesItems)
			setAudioItems(data.audioItems)
			setAudioStudents(data.audioStudents)
		}
	}, [data])

	const setHistoryLessonIsDone = (
		studentIndex: number,
		lessonIndex: number,
		value: boolean,
	) => {
		setStudentsHistoryLessons((prevHistoryLessons) => {
			const updatedHistoryLessons = [...prevHistoryLessons]
			updatedHistoryLessons[studentIndex] = updatedHistoryLessons[
				studentIndex
			].map((lesson, index) =>
				index === lessonIndex ? {...lesson, isDone: value} : lesson,
			)
			return updatedHistoryLessons
		})
	}
	const setHistoryLessonIsPaid = (
		studentIndex: number,
		lessonIndex: number,
		value: boolean,
	) => {
		setStudentsHistoryLessons((prevHistoryLessons) => {
			const updatedHistoryLessons = [...prevHistoryLessons]
			updatedHistoryLessons[studentIndex] = updatedHistoryLessons[
				studentIndex
			].map((lesson, index) =>
				index === lessonIndex ? {...lesson, isPaid: value} : lesson,
			)
			return updatedHistoryLessons
		})
	}

	const updateHistoryLessons = () => {
		console.log(
			'\n------------------Функция updateHistoryLessons вызвана----------------\n',
		)

		const newStudentsHistoryLessons = students.map((student, studentIndex) => {
			console.log(
				`\n------------------Обработка студента ${student.nameStudent} (индекс ${studentIndex})----------------\n`,
			)

			const historyLessons_ = []
			for (let i = 0; i < items.length; i++) {
				const differenceDays = differenceInDays(
					items[i].endLesson!,
					items[i].startLesson!,
				)
				const dateRange = Array.from({length: differenceDays + 1}, (_, j) =>
					addDays(items[i].startLesson!, j),
				)

				console.log(
					`\n------------------Урок ${items[i].itemName} имеет диапазон дат от ${items[i].startLesson} до ${items[i].endLesson}----------------\n`,
				)
				console.log('Диапазон дат:', dateRange)

				for (const date of dateRange) {
					const dayOfWeek = getDay(date)
					const scheduleForDay = items[i].timeLinesArray[dayOfWeek]

					console.log(
						`\n------------------Дата ${date} (день недели: ${dayOfWeek})----------------\n`,
					)
					console.log('Расписание на этот день:', scheduleForDay)

					const cond =
						scheduleForDay.startTime.hour === 0 &&
						scheduleForDay.startTime.minute === 0 &&
						scheduleForDay.endTime.hour === 0 &&
						scheduleForDay.endTime.minute === 0

					if (!cond) {
						const existingLesson = studentsHistoryLessons[studentIndex]?.find(
							(l) =>
								new Date(l.date).getTime() === date.getTime() &&
								l.itemName === items[i].itemName &&
								l.price === Number(students[studentIndex].costOneLesson),
						)

						console.log(
							'\n------------------Существующий урок истории (existingLesson)----------------\n',
							existingLesson,
						)

						const hl = {
							date: date,
							itemName: items[i].itemName,
							isDone: existingLesson
								? existingLesson.isDone
								: date <= new Date(Date.now()),
							price: Number(students[studentIndex].costOneLesson),
							isPaid: existingLesson ? existingLesson.isPaid : false,
						}

						console.log(
							'\n------------------Новый урок истории----------------\n',
							hl,
						)

						historyLessons_.push(hl)
					}
				}
			}
			console.log(
				'\n------------------История уроков для студента----------------\n',
				historyLessons_,
			)
			return historyLessons_
		})

		console.log(
			'\n------------------Новая история уроков студентов----------------\n',
			newStudentsHistoryLessons,
		)

		console.log(
			'\n------------------Изменения в истории уроков обнаружены----------------\n',
		)

		const currentStudent = students[currentStudentIndex]
		const costLesson = Number(currentStudent.costOneLesson)
		const prePayment = Number(currentStudent.prePayCost)
		const prePaymentDate = currentStudent.prePayDate
			? new Date(currentStudent.prePayDate)
			: null
		let remainingPrePayment = prePayment

		console.log(
			'\n------------------Текущий студент и начальные данные предоплаты----------------\n',
			{
				currentStudent,
				costLesson,
				prePayment,
				prePaymentDate,
				remainingPrePayment,
			},
		)
		// ! DATES
		const updatedHistoryLessons = newStudentsHistoryLessons.map(
			(lessons, studentIndex) => {
				if (studentIndex === currentStudentIndex) {
					console.log(
						'\n------------------Обновление истории уроков для текущего студента----------------\n',
					)

					const sortedAndFilteredLessons = lessons
						.sort(compareDates)
						.filter((lesson) => {
							const lessonDate = new Date(lesson.date)
							const startLesson = new Date(currentStudent.startLesson!)
							const endLesson = new Date(currentStudent.endLesson!)

							return lessonDate >= startLesson && lessonDate <= endLesson
						})

					console.log(
						'\n------------------Отсортированные и отфильтрованные уроки----------------\n',
						sortedAndFilteredLessons,
					)

					const mappedLessons = sortedAndFilteredLessons.map((lesson) => {
						const lessonDate = new Date(lesson.date)
						if (
							prePaymentDate &&
							lessonDate >= prePaymentDate &&
							remainingPrePayment >= costLesson
						) {
							remainingPrePayment -= costLesson
							return {...lesson, isPaid: true}
						}
						return lesson
					})

					console.log(
						'\n------------------Уроки с учетом предоплаты----------------\n',
						mappedLessons,
					)

					return mappedLessons
				}
				return lessons
			},
		)

		console.log(
			'\n------------------Обновленная история уроков----------------\n',
			updatedHistoryLessons,
		)

		setStudentsHistoryLessons(updatedHistoryLessons)
	}

	useEffect(() => {
		console.log('\n------------------useEffect вызван----------------\n')
		updateHistoryLessons()

		console.log(
			'\n------------------Текущая история уроков студентов----------------\n',
			studentsHistoryLessons,
			'STUDENTS_HISTORY_LESSONS',
		)
	}, [items, students, currentStudentIndex])

	useEffect(() => {
		//sum all costStudent and write to allCost
		let sumCost = 0
		let totalCostGroup = 0
		students.forEach((student) => {
			sumCost += Number(student.costStudent)
			totalCostGroup += Number(student.costOneLesson) || 0
		})

		setAllCostForGroup(sumCost)
		setAllPriceGroup(totalCostGroup)
	}, [students, studentsHistoryLessons])

	// ! CHECK THIS
	// useEffect(() => {
	// 	studentsHistoryLessons[currentStudentIndex] &&
	// 		handleStudentsHistoryLessons(currentStudentIndex)
	// }, [students, students[currentStudentIndex], currentStudentIndex])

	useEffect(() => {
		if (
			items.some((item) => {
				return (
					item.itemName !== '' ||
					item.tryLessonCheck !== false ||
					item.tryLessonCost !== '' ||
					item.todayProgramStudent !== '' ||
					item.targetLesson !== '' ||
					item.programLesson !== '' ||
					item.typeLesson !== '1' ||
					item.placeLesson !== '' ||
					item.timeLesson !== '' ||
					item.valueMuiSelectArchive !== 1 ||
					item.nowLevel !== 0 ||
					item.lessonDuration !== null
				)
			}) ||
			groupName !== '' ||
			students.some((student) => {
				return (
					student.nameStudent !== '' ||
					student.contactFace !== '' ||
					student.email !== '' ||
					student.linkStudent !== '' ||
					student.costStudent !== '' ||
					student.commentStudent !== '' ||
					student.phoneNumber !== '' ||
					student.prePayCost !== ''
				)
			})
		) {
			dispatch({type: 'SET_EDITED_CARDS', payload: true})
		}
	}, [items, students, groupName])
	useEffect(() => {
		setTimeout(() => {
			dispatch({type: 'SET_EDITED_CARDS', payload: false})
		}, 1000)
	}, [])
	return (
		<>
			<button
				onClick={() => {
					if (editedCards) {
						dispatch({
							type: 'SET_PAGE_POPUP_EXIT',
							payload: EPagePopUpExit.Exit,
						})
					} else {
						dispatch({
							type: 'SET_LEFT_MENU_PAGE',
							payload: ELeftMenuPage.MainPage,
						})
					}
				}}
				className={s.CloseButton}>
				<CloseIcon className={s.CloseIcon} />
			</button>
			<div className={`${s.wrapper} ${className}`}>
				{!loading ? (
					<>
						<div className={s.Header}>
							<div className={s.HeaderAddGroup}>
								<div className={s.dataSlidePicker}>
									<button
										className={s.btn}
										style={{backgroundColor: currentGroupIndex === 0 && '#eee'}}
										onClick={() => prevGroup()}>
										<span>
											<Arrow direction={ArrowType.left} />
										</span>
									</button>
									<p className={s.btnText}>
										Карточка группы{' '}
										{currentOpenedGroup
											? `${currentGroupIndex + 1} / ${groupsIndexes.length}`
											: `${groupsIndexes.length + 1} / ${groupsIndexes.length + 1}`}
									</p>
									<button
										className={s.btn}
										style={{
											backgroundColor:
												currentGroupIndex === groupsIndexes.length - 1 &&
												'#eee',
										}}
										onClick={() => nextGroup()}>
										<span>
											<Arrow direction={ArrowType.right} />
										</span>
									</button>
								</div>
							</div>
							<div className={s.StudNameHead}>
								<div className={s.StudentCardName}>
									<div className={s.StudentCarName__Left}>
										<TextAreaInputBlock
											title="Группа:"
											value={groupName}
											disabled={isEditMode}
											onChange={(e) =>
												setGroupName(
													e.target.value.charAt(0).toUpperCase() +
														e.target.value.slice(1).toLowerCase(),
												)
											}
											placeholder="Название группы"
											textIndent="60px"
										/>
									</div>
									<p>*</p>
								</div>
							</div>
						</div>
						<div className={s.wrapperMenu}>
							<div className={s.ItemWrapper}>
								<div className={s.ItemHeader}>
									<div className={s.dataSlidePicker}>
										<button className={s.btn} onClick={handlePrevItem}>
											<span>
												<Arrow direction={ArrowType.left} />
											</span>
										</button>
										<p className={s.btnText}>
											Предмет {currentItemIndex + 1} / {items.length}
										</p>
										<button className={s.btn} onClick={handleNextItem}>
											<span>
												<Arrow direction={ArrowType.right} />
											</span>
										</button>
									</div>
									<button className={s.ItemPlus} onClick={handleAddItem}>
										<img src={Plus} alt={Plus} />
									</button>
								</div>

								{/* <Line width="100%" className={s.Line} /> */}

								{items.map((item, index) => (
									<>
										<div
											key={index}
											className={
												currentItemIndex === index ? s.ItemActive : s.ItemMain
											}>
											<TextAreaInputBlock
												style={{width: '100%'}}
												value={item.itemName}
												disabled={isEditMode}
												onChange={(e) =>
													changeItemValue(
														index,
														'itemName',
														e.target.value.charAt(0).toUpperCase() +
															e.target.value.slice(1).toLowerCase(),
													)
												}
												placeholder="Наименование"
												textIndent="0px"
											/>
											<Line width="100%" className={s.Line} />
											<TextAreaInputBlock
												disabled={isEditMode}
												title="Цель занятий:"
												value={item.targetLesson}
												// disabled={isEditMode}
												onChange={(e) => {
													changeItemValue(index, 'targetLesson', e.target.value)
												}}
												textIndent="110px"
											/>

											<Line width="100%" className={s.Line} />
											<TextAreaInputBlock
												disabled={isEditMode}
												title="Программа занятия:"
												value={item.programLesson}
												// disabled={isEditMode}
												onChange={(e) => {
													changeItemValue(
														index,
														'programLesson',
														e.target.value,
													)
												}}
												textIndent="160px"
											/>

											<Line width="100%" className={s.Line} />
											<div className={s.StudentCard}>
												<div
													style={{
														display: 'flex',
														flexDirection: 'row',
														alignItems: 'center',
													}}>
													<p style={{marginRight: '50px'}}>Тип занятия:</p>

													<mui.Select
														disabled={isEditMode}
														className={s.muiSelect__menu}
														variant={'standard'}
														value={item.typeLesson}
														onChange={(e) => {
															changeItemValue(
																index,
																'typeLesson',
																e.target.value,
															)
														}}>
														<mui.MenuItem value={1}>
															<svg
																width="32"
																height="32"
																viewBox="0 0 49 49"
																fill="none"
																xmlns="http://www.w3.org/2000/svg">
																<rect
																	x="0.5"
																	y="0.5"
																	width="48"
																	height="48"
																	rx="7.5"
																	fill="#F9F9FD"
																/>
																<rect
																	x="0.5"
																	y="0.5"
																	width="48"
																	height="48"
																	rx="7.5"
																	stroke="#25991C"
																/>
																<path
																	d="M14.3021 35.1061H20.3643V25.2014H28.6356V35.1061H34.6978V19.8093L24.5 12.1242L14.3021 19.8058V35.1061ZM14.3021 37.1582C13.7435 37.1582 13.2619 36.9558 12.8572 36.551C12.4524 36.1463 12.25 35.6647 12.25 35.1061V19.8093C12.25 19.4863 12.3207 19.1803 12.4621 18.8914C12.6035 18.6024 12.8068 18.3639 13.0719 18.176L23.2698 10.491C23.4608 10.3548 23.6588 10.2536 23.8638 10.1874C24.0688 10.121 24.2824 10.0879 24.5045 10.0879C24.7266 10.0879 24.9392 10.121 25.1423 10.1874C25.3454 10.2536 25.5414 10.3548 25.7301 10.491L35.928 18.176C36.1931 18.3639 36.3964 18.6024 36.5378 18.8914C36.6792 19.1803 36.7499 19.4863 36.7499 19.8093V35.1061C36.7499 35.6647 36.5475 36.1463 36.1428 36.551C35.738 36.9558 35.2564 37.1582 34.6978 37.1582H26.5835V27.2535H22.4164V37.1582H14.3021Z"
																	fill="#25991C"
																/>
															</svg>
														</mui.MenuItem>
														<mui.MenuItem value={2}>
															<svg
																width="32"
																height="32"
																viewBox="0 0 51 49"
																fill="none"
																xmlns="http://www.w3.org/2000/svg">
																<rect
																	x="0.5"
																	y="0.5"
																	width="50"
																	height="48"
																	rx="7.5"
																	fill="#F9F9FD"
																/>
																<rect
																	x="0.5"
																	y="0.5"
																	width="50"
																	height="48"
																	rx="7.5"
																	stroke="#25991C"
																/>
																<path
																	d="M18.356 30.2295C18.015 30.2295 17.7319 30.123 17.5067 29.9099C17.2815 29.6969 17.1689 29.433 17.1689 29.118V28.3109C17.1689 26.9535 17.9333 25.8589 19.4619 25.0271C20.9905 24.1954 22.993 23.7795 25.4694 23.7795C27.969 23.7795 29.9792 24.1954 31.5 25.0271C33.0209 25.8589 33.7813 26.9535 33.7813 28.3109V29.118C33.7813 29.433 33.6682 29.6969 33.4418 29.9099C33.2154 30.123 32.9349 30.2295 32.6003 30.2295H18.356ZM25.4751 25.5651C23.6022 25.5651 22.0761 25.8182 20.897 26.3244C19.7179 26.8306 19.1173 27.4691 19.0954 28.2399V28.4439H31.8646V28.2162C31.831 27.4625 31.226 26.8322 30.0494 26.3253C28.8729 25.8185 27.3481 25.5651 25.4751 25.5651ZM25.4751 21.6477C24.386 21.6477 23.4603 21.289 22.698 20.5716C21.9356 19.8542 21.5544 18.983 21.5544 17.9581C21.5544 16.9332 21.9356 16.0621 22.698 15.3447C23.4603 14.6273 24.386 14.2686 25.4751 14.2686C26.5642 14.2686 27.49 14.6273 28.2523 15.3447C29.0147 16.0621 29.3959 16.9332 29.3959 17.9581C29.3959 18.983 29.0147 19.8542 28.2523 20.5716C27.49 21.289 26.5642 21.6477 25.4751 21.6477ZM25.4777 16.0541C24.899 16.0541 24.4167 16.2349 24.0307 16.5965C23.6448 16.9581 23.4518 17.4112 23.4518 17.9557C23.4518 18.5003 23.6439 18.9542 24.0282 19.3174C24.4125 19.6806 24.8939 19.8622 25.4726 19.8622C26.0513 19.8622 26.5336 19.6814 26.9196 19.3198C27.3055 18.9582 27.4985 18.5051 27.4985 17.9605C27.4985 17.416 27.3063 16.9621 26.9221 16.5989C26.5378 16.2357 26.0564 16.0541 25.4777 16.0541Z"
																	fill="#25991C"
																/>
																<path
																	d="M20.5587 38.7918C20.2202 38.7918 19.9367 38.6816 19.7085 38.4613C19.4802 38.2408 19.366 37.9672 19.366 37.6404C19.366 37.3136 19.4802 37.0418 19.7085 36.8251C19.9367 36.6084 20.2202 36.5001 20.5587 36.5001H23.2921L23.3267 35.2459H10.6453C9.8319 35.2459 9.13364 34.9658 8.5505 34.4054C7.96735 33.8452 7.67578 33.1743 7.67578 32.3928V12.5616C7.67578 11.7801 7.96735 11.1092 8.5505 10.549C9.13364 9.98865 9.8319 9.7085 10.6453 9.7085H40.7787C41.5984 9.7085 42.2983 9.98865 42.8783 10.549C43.4583 11.1092 43.7483 11.7801 43.7483 12.5616V32.3928C43.7483 33.1743 43.4583 33.8452 42.8783 34.4054C42.2983 34.9658 41.5984 35.2459 40.7787 35.2459H28.0973L28.0628 36.5001H30.8084C31.1469 36.5001 31.4303 36.6103 31.6586 36.8307C31.8869 37.0511 32.0011 37.3247 32.0011 37.6515C32.0011 37.9783 31.8869 38.2501 31.6586 38.4668C31.4303 38.6835 31.1469 38.7918 30.8084 38.7918H20.5587ZM10.6453 32.9541H40.7787C40.9491 32.9541 41.0891 32.9015 41.1987 32.7963C41.3082 32.691 41.363 32.5565 41.363 32.3928V12.5616C41.363 12.3979 41.3082 12.2634 41.1987 12.1581C41.0891 12.0529 40.9491 12.0003 40.7787 12.0003H10.6453C10.483 12.0003 10.3451 12.0529 10.2315 12.1581C10.1179 12.2634 10.0611 12.3979 10.0611 12.5616V32.3928C10.0611 32.5565 10.1179 32.691 10.2315 32.7963C10.3451 32.9015 10.483 32.9541 10.6453 32.9541Z"
																	fill="#25991C"
																/>
															</svg>
														</mui.MenuItem>
														<mui.MenuItem value={3}>
															<svg
																width="32"
																height="32"
																viewBox="0 0 49 49"
																fill="none"
																xmlns="http://www.w3.org/2000/svg">
																<rect
																	x="0.5"
																	y="0.5"
																	width="48"
																	height="48"
																	rx="7.5"
																	fill="#F9F9FD"
																/>
																<rect
																	x="0.5"
																	y="0.5"
																	width="48"
																	height="48"
																	rx="7.5"
																	stroke="#25991C"
																/>
																<path
																	d="M28.3646 14.0186C27.6459 14.0186 27.0332 13.7659 26.5265 13.2605C26.0198 12.7551 25.7665 12.1431 25.7665 11.4243C25.7665 10.7056 26.0192 10.0929 26.5246 9.58624C27.03 9.07953 27.642 8.82617 28.3607 8.82617C29.0794 8.82617 29.6921 9.07888 30.1988 9.58428C30.7056 10.0897 30.9589 10.7017 30.9589 11.4204C30.9589 12.1391 30.7062 12.7518 30.2008 13.2586C29.6954 13.7653 29.0833 14.0186 28.3646 14.0186ZM29.1898 39.9187C28.9256 39.9187 28.706 39.8301 28.5309 39.653C28.3558 39.4758 28.2683 39.2558 28.2683 38.9928V31.3316L24.1395 27.4684L23.0785 32.2443C22.9406 32.8521 22.6049 33.3256 22.0714 33.6648C21.5379 34.0039 20.9626 34.1102 20.3453 33.9836L14.1844 32.7337C13.9478 32.6868 13.7608 32.5594 13.6234 32.3513C13.486 32.1433 13.4438 31.9108 13.4967 31.6538C13.553 31.4109 13.6828 31.2223 13.8861 31.0881C14.0894 30.9538 14.3098 30.9132 14.5472 30.966L20.4209 32.1565C20.5469 32.1848 20.6611 32.162 20.7634 32.088C20.8658 32.014 20.9311 31.914 20.9595 31.788L23.5859 18.4137L19.8673 20.0586C19.7822 20.0964 19.7137 20.1507 19.6617 20.2216C19.6098 20.2924 19.5838 20.3751 19.5838 20.4696V24.0899C19.5838 24.3529 19.4948 24.5729 19.3169 24.7501C19.1389 24.9272 18.9178 25.0158 18.6536 25.0158C18.3895 25.0158 18.1698 24.9272 17.9948 24.7501C17.8197 24.5729 17.7321 24.3529 17.7321 24.0899V20.4526C17.7321 19.9954 17.8611 19.5716 18.119 19.181C18.377 18.7904 18.7207 18.5098 19.1502 18.3391L23.6918 16.426C24.3852 16.1243 24.8944 15.9295 25.2194 15.8416C25.5444 15.7538 25.852 15.7098 26.1421 15.7098C26.582 15.7098 26.9805 15.8142 27.3376 16.023C27.6947 16.2318 27.9942 16.5255 28.236 16.904L29.748 19.3227C30.3153 20.2271 31.0702 21.0253 32.0128 21.7172C32.9554 22.4091 34.0361 22.858 35.2548 23.064C35.4923 23.0973 35.6926 23.2047 35.8557 23.3861C36.0188 23.5674 36.1004 23.7684 36.1004 23.9889C36.1004 24.2681 36.0004 24.5019 35.8004 24.6905C35.6005 24.879 35.3676 24.9541 35.1018 24.9157C33.7917 24.7355 32.5557 24.2677 31.394 23.5122C30.2322 22.7567 29.1786 21.6741 28.2332 20.2645L26.8623 26.484L29.3981 28.8686C29.63 29.1108 29.8083 29.3737 29.9329 29.6573C30.0576 29.9409 30.12 30.2364 30.12 30.5437V38.9928C30.12 39.2558 30.0294 39.4758 29.8483 39.653C29.6671 39.8301 29.4476 39.9187 29.1898 39.9187Z"
																	fill="#25991C"
																/>
															</svg>
														</mui.MenuItem>
													</mui.Select>
												</div>
											</div>

											<Line width="100%" className={s.Line} />

											<TextAreaInputBlock
												title="Место проведения"
												disabled={isEditMode}
												value={item.placeLesson}
												onChange={(e) =>
													changeItemValue(
														currentItemIndex,
														'placeLesson',
														e.target.value,
													)
												}
												textIndent="150px"
											/>
											<Line width="100%" className={s.Line} />

											<div className={s.StudentCard}>
												<p>Продолжительность занятия:</p>
												<Input
													disabled={isEditMode}
													num
													type="text"
													value={item.lessonDuration!}
													onChange={(e) =>
														changeItemValue(
															currentItemIndex,
															'lessonDuration',
															e.target.value,
														)
													}
													style={{borderBottom: '1px solid #e2e2e9'}}
												/>
												<p>мин</p>
											</div>

											<Line width="100%" className={s.Line} />

											<div className={s.StudentCard}>
												<p>Начало занятий:</p>
												<MiniCalendar
													disabled={isEditMode}
													value={item.startLesson}
													onChange={(newDate) =>
														changeItemValue(
															index,
															'startLesson',
															new Date(newDate),
														)
													}
													calendarId={`startLesson_${index}`}
												/>

												<p style={{color: 'red'}}>*</p>
											</div>
											<Line width="100%" className={s.Line} />
											<div
												style={{marginBottom: '10px'}}
												className={s.StudentCard}>
												<p>Окончание занятий:</p>
												<MiniCalendar
													disabled={isEditMode}
													value={item.endLesson}
													onChange={(newDate) =>
														changeItemValue(
															index,
															'endLesson',
															new Date(newDate),
														)
													}
													calendarId={`endLesson_${index}`}
												/>
												<p style={{color: 'red'}}>*</p>
											</div>

											<div className={s.ScheduleWrapper}>
												<div className={s.ScheduleHeader}>
													<p>Расписание</p>
												</div>
												<Line width="324px" className={s.LineGreen} />
												<div className={s.Schedule}>
													{items[currentItemIndex].timeLinesArray.map(
														(timeline, index) => (
															<>
																<div
																	id={String(timeline.id)}
																	key={timeline.id}
																	className={
																		s.ScheduleItem +
																		' ' +
																		((timeline.startTime.hour !== 0 ||
																			timeline.startTime.minute !== 0 ||
																			timeline.endTime.hour !== 0 ||
																			timeline.endTime.minute !== 0) &&
																			s.active_s)
																	}>
																	<div
																		style={{
																			width: '200px',
																			display: 'flex',
																			flexDirection: 'row',
																			alignItems: 'center',
																		}}>
																		<ScheduleDate
																			weekend={
																				timeline.day === 'Сб' ||
																				timeline.day === 'Вс'
																			}
																			active={
																				timeline.startTime.hour !== 0 ||
																				timeline.startTime.minute !== 0 ||
																				timeline.endTime.hour !== 0 ||
																				timeline.endTime.minute !== 0
																			}>
																			<p>{timeline.day}</p>
																		</ScheduleDate>
																		{(timeline.startTime.hour !== 0 ||
																			timeline.startTime.minute !== 0 ||
																			timeline.endTime.hour !== 0 ||
																			timeline.endTime.minute !== 0) && (
																			<p
																				style={{
																					marginLeft: '10px',
																					fontWeight: '400',
																				}}>
																				{`${timeline.startTime.hour
																					.toString()
																					.padStart(
																						2,
																						'0',
																					)}:${timeline.startTime.minute
																					.toString()
																					.padStart(2, '0')} - ${
																					timeline.endTime.hour ||
																					timeline.endTime.minute !== 0
																						? `${timeline.endTime.hour
																								.toString()
																								.padStart(
																									2,
																									'0',
																								)}:${timeline.endTime.minute
																								.toString()
																								.padStart(2, '0')}`
																						: '' // Display only start time if end time is not set
																				}`}
																			</p>
																		)}
																	</div>
																	{!isEditMode && (
																		<>
																			<button
																				onClick={() =>
																					handleClick_delete(
																						currentItemIndex,
																						timeline.id,
																					)
																				}
																				className={s.ScheduleBtn_Delete}>
																				<DeleteOutlineIcon />
																			</button>
																			<button
																				onClick={() =>
																					handleClick_dp(
																						currentItemIndex,
																						timeline.id,
																					)
																				}
																				className={s.ScheduleBtn}>
																				<ScheduleIcon />
																			</button>
																		</>
																	)}

																	{(timeline.active ||
																		timeline.id === showEndTimePicker) && (
																		<div
																			className={s.timePickerWrapper}
																			style={{
																				...(window.innerWidth >= 1024
																					? {
																							transform: `translateY(${
																								index * 40
																							}px) translateX(-50%)`,
																						}
																					: {}),
																			}}>
																			{timeline.active &&
																				!timeline.editingEnd && (
																					<TimePicker
																						title="Начало занятий"
																						onTimeChange={(hour, minute) =>
																							handleStartTimeChange(
																								currentItemIndex,
																								timeline.id,
																								hour,
																								minute,
																							)
																						}
																						onExit={() =>
																							closeTimePicker(
																								currentItemIndex,
																								timeline.id,
																							)
																						}
																					/>
																				)}
																			{timeline.editingEnd && (
																				<TimePicker
																					title="Конец занятий"
																					onTimeChange={(hour, minute) =>
																						handleEndTimeChange(
																							currentItemIndex,
																							timeline.id,
																							hour,
																							minute,
																						)
																					}
																					onExit={() =>
																						closeTimePicker(
																							currentItemIndex,
																							timeline.id,
																						)
																					}
																				/>
																			)}
																		</div>
																	)}
																</div>

																{items[currentItemIndex].timeLinesArray.length -
																	1 !==
																	index && (
																	<Line width="324px" className={s.Line} />
																)}
															</>
														),
													)}
												</div>
											</div>
											<div className={s.MathBlockItem}>
												<div className={s.MathObjectsList}>
													<div className={s.MathHeader}>
														<p>Общая стоимость 1-го занятия:</p>
														<p>{allPriceGroup}₽</p>
													</div>
													<Line width="294px" className={s.Line} />
													<div className={s.MathObject}>
														<p>
															Всего занятий:{' '}
															{studentsHistoryLessons[index] &&
																studentsHistoryLessons[index].length}
														</p>
														<p>
															Сумма:{' '}
															{studentsHistoryLessons[index] &&
																studentsHistoryLessons[index].length *
																	allPriceGroup}
															₽
														</p>
													</div>
													<Line width="294px" className={s.Line} />
													<div className={s.MathObject}>
														<p>
															Прошло:{' '}
															{
																studentsHistoryLessons
																	.map(
																		(item) =>
																			item.filter((obj) => obj.isDone === true)
																				.length,
																	)
																	.sort((a, b) => b - a)[0]
															}
														</p>
														<p>
															Оплачено:
															{studentsHistoryLessons
																.map(
																	(item) =>
																		item.filter((obj) => obj.isDone === true)
																			.length,
																)
																.sort((a, b) => b - a)[0] * allPriceGroup}
															₽
														</p>
													</div>
													<Line width="294px" className={s.Line} />
													<div className={s.MathObject}>
														<p>
															Не оплачено:{' '}
															{studentsHistoryLessons[index] &&
																studentsHistoryLessons[index].length -
																	studentsHistoryLessons
																		.map(
																			(item) =>
																				item.filter(
																					(obj) => obj.isDone === true,
																				).length,
																		)
																		.sort((a, b) => b - a)[0] <=
																	0}
														</p>
														<p style={{display: 'flex', flexDirection: 'row'}}>
															<p style={{marginRight: '5px'}}>Долг:</p>
															<MUI.Select
																key={index}
																className={`${s.muiSelect}`}
																multiple
																renderValue={(
																	option: MUI.SelectOption<number> | null,
																) => {
																	if (option == null || option.value === null) {
																		return
																		;<>
																			<p
																				style={{
																					color: 'red',
																					fontSize: '16px',
																				}}>
																				{allDuty}
																			</p>
																		</>
																	}
																	return (
																		<>
																			<p
																				style={{
																					color: 'red',
																					fontSize: '16px',
																				}}>
																				{allDuty}
																			</p>
																		</>
																	)
																}}>
																{students.map((student: any, index: number) => (
																	<MUI.Option
																		className={s.muiOption}
																		value={index}>
																		<div className={s.wrapOption}>
																			<>
																				<p>{student.nameStudent}</p>
																				<p
																					style={{
																						color: 'red',
																						fontSize: '16px',
																					}}>
																					{handleDutyStudent(student, index)}
																				</p>
																			</>
																		</div>
																	</MUI.Option>
																))}
															</MUI.Select>
															<p>₽</p>
														</p>
													</div>
													<Line width="294px" className={s.Line} />
													<div className={s.MathObject}>
														<p>Общие расходы по группе:</p>
														<p>{allCostForGroup}₽</p>
													</div>
												</div>
											</div>
											<FileNLinks
												alreadyUploaded={filesItems}
												callback={handleAddFileItems}
												linksArray={linksItems}
												submitLinks={handleLinksSubmitItems}
												deleteLink={deleteLinkItems}
												fileInputId="1"
											/>

											<Line width="100%" className={s.Line} />

											<TextAreaInputBlock
												title="Комментарий:"
												value={items[currentItemIndex].commentItem}
												onChange={(e) => {
													setItems(
														items.map((item, index) => {
															return index === currentItemIndex
																? {...item, commentItem: e.target.value}
																: item
														}),
													)
												}}
												disabled={isEditMode}
												textIndent="110px"
											/>
											<Line width="100%" className={s.Line} />
											<RecordNListen
												alreadyRecorded={audioItems}
												callback={handleAddAudioItems}
												typeCard="group"
											/>
										</div>
									</>
								))}

								<div className={s.ItemHeader}>
									<div className={s.dataSlidePicker}>
										<button className={s.btn} onClick={handlePrevStudent}>
											<span>
												<Arrow direction={ArrowType.left} />
											</span>
										</button>
										<p className={s.btnText}>
											Ученик {currentStudentIndex + 1} / {students.length}
										</p>
										<button className={s.btn} onClick={handleNextStudent}>
											<span>
												<Arrow direction={ArrowType.right} />
											</span>
										</button>
									</div>
									<button className={s.ItemPlus} onClick={handleAddStudent}>
										<img src={Plus} alt={Plus} />
									</button>
								</div>

								{students.map((student: IStudent, index: number) => (
									<>
										<div
											className={
												currentStudentIndex === index
													? s.ItemActive
													: s.ItemMain
											}>
											<div
												style={{
													display: 'flex',
													justifyContent: 'space-between',
												}}>
												<TextAreaInputBlock
													style={{width: '100%'}}
													title="Имя"
													disabled={isEditMode}
													value={student.nameStudent}
													onChange={(e) =>
														changeStudentValue(
															index,
															'nameStudent',
															e.target.value.charAt(0).toUpperCase() +
																e.target.value.slice(1).toLowerCase(),
														)
													}
													textIndent="40px"
												/>
												<p style={{color: 'red'}}>*</p>
											</div>
											<Line width="100%" className={s.Line} />

											<TextAreaInputBlock
												title="Контактное лицо:"
												disabled={isEditMode}
												value={student.contactFace}
												onChange={(e) =>
													changeStudentValue(
														index,
														'contactFace',
														e.target.value,
													)
												}
												textIndent="140px"
											/>
											<Line width="100%" className={s.Line} />

											<div className={s.StudentCard}>
												<p>Тел:</p>
												<InputMask
													disabled={isEditMode}
													type="text"
													mask="+7 (999) 999-99-99"
													maskChar="_"
													value={student.phoneNumber}
													onChange={(e) =>
														changeStudentValue(
															index,
															'phoneNumber',
															e.target.value,
														)
													}
												/>
												<IconsPhone
													phoneNumber={student.phoneNumber}
													email={student.email}
												/>
												<div className={s.PhoneIcons}></div>
											</div>
											<Line width="100%" className={s.Line} />
											<div className={s.StudentCard}>
												<p>Эл. почта:</p>
												<input
													disabled={isEditMode}
													type="email"
													value={student.email}
													onChange={(e) =>
														changeStudentValue(index, 'email', e.target.value)
													}
												/>
											</div>
											<Line width="100%" className={s.Line} />
											<TextAreaInputBlock
												disabled={isEditMode}
												title="Источник:"
												value={student.linkStudent}
												// disabled={isEditMode}
												onChange={(e) => {
													changeStudentValue(
														index,
														'linkStudent',
														e.target.value,
													)
												}}
												textIndent="90px"
											/>

											<Line width="100%" className={s.Line} />
											<div className={s.StudentCard}>
												<p>Расходы по ученику:</p>
												<Input
													disabled={isEditMode}
													num
													value={student.costStudent}
													width={`${student.costStudent.length}ch`}
													onChange={(e) =>
														changeStudentValue(
															index,
															'costStudent',
															e.target.value,
														)
													}
													style={{borderBottom: '1px solid #e2e2e9'}}
												/>
												<p>₽</p>
											</div>

											<Line width="100%" className={s.Line} />

											<div className={s.StudentCard}>
												<p>Предоплата:</p>
												<MiniCalendar
													disabled={isEditMode}
													value={student.prePayDate}
													onChange={(newDate) =>
														changeStudentValue(
															index,
															'prePayDate',
															new Date(newDate),
														)
													}
													calendarId={`prePay_${index}`}
												/>
												<Input
													disabled={isEditMode}
													num
													className={s.PrePayCostInput}
													type="text"
													value={student.prePayCost}
													onChange={(e) => {
														changeStudentValue(
															index,
															'prePayCost',
															e.target.value,
														)
													}}
												/>

												<p>₽</p>
											</div>
											<Line width="100%" className={s.Line} />
											<div className={s.StudentCardCheckBox}>
												<div className={s.CardCheckBox}>
													<p>Пробное занятие:</p>
												</div>
												<CheckBox
													checked={student.tryLessonCheck}
													onChange={() =>
														changeStudentValue(
															index,
															'tryLessonCheck',
															!student.tryLessonCheck,
														)
													}
													className={s.CheckBox}
													size="20px"
												/>
												<p>Стоимость:</p>
												<Input
													disabled={isEditMode}
													num
													type="text"
													value={student.tryLessonCost}
													onChange={(e) => {
														changeStudentValue(
															index,
															'tryLessonCost',
															String(e.target.value),
														)
													}}
												/>
												<p>₽</p>
											</div>
											<Line width="100%" className={s.Line} />
											{/* NO DATA */}
											<div className={s.StudentCardCheckBox}>
												<div className={s.CardCheckBoxLevel}>
													<p>Текущий уровень:</p>
												</div>

												<NowLevel
													disabled={isEditMode}
													value={Number(student.nowLevel)}
													onChange={(e) => {
														changeStudentValue(index, 'nowLevel', Number(e))
													}}
													amountInputs={5}
												/>
											</div>
											<Line width="100%" className={s.Line} />
											<TextAreaInputBlock
												disabled={isEditMode}
												title="Текущая программа ученика:"
												value={student.todayProgramStudent}
												// disabled={isEditMode}
												onChange={(e) => {
													changeStudentValue(
														index,
														'todayProgramStudent',
														e.target.value,
													)
												}}
												textIndent="230px"
											/>

											<Line width="100%" className={s.Line} />

											<TextAreaInputBlock
												title="Цель занятий:"
												disabled={isEditMode}
												value={student.targetLessonStudent}
												onChange={(e) =>
													changeStudentValue(
														index,
														'targetLessonStudent',
														e.target.value,
													)
												}
												textIndent="110px"
											/>
											<Line width="100%" className={s.Line} />

											{/* NO DATA */}
											<div className={s.StudentCard}>
												<p>Начало занятий:</p>
												<MiniCalendar
													disabled={isEditMode}
													value={student.startLesson}
													onChange={(newDate) =>
														changeStudentValue(
															index,
															'startLesson',
															new Date(newDate),
														)
													}
													calendarId={`${index}startLessonStudent`}
												/>

												<p style={{color: 'red'}}>*</p>
											</div>
											<Line width="100%" className={s.Line} />
											<div
												style={{marginBottom: '10px'}}
												className={s.StudentCard}>
												<p>Окончание занятий:</p>
												<MiniCalendar
													disabled={isEditMode}
													value={student.endLesson}
													onChange={(newDate) =>
														changeStudentValue(
															index,
															'endLesson',
															new Date(newDate),
														)
													}
													calendarId={`${index}endLessonStudent`}
												/>
												<p style={{color: 'red'}}>*</p>
											</div>

											<Line width="100%" className={s.Line} />
											<div className={s.StudentCard}>
												<p>Стоимость одного занятия:</p>
												<Input
													disabled={isEditMode}
													// width={`${student.costOneLesson}ch`}
													num
													type="text"
													value={student.costOneLesson || ''}
													onChange={(e) => {
														changeStudentValue(
															index,
															'costOneLesson',
															parseInt(e.target.value, 10),
														)
													}}
													style={{borderBottom: '1px solid #e2e2e9'}}
												/>
												<p>₽</p>
											</div>
											<div className={s.MathBlockStudent}>
												<div className={s.MathObjectsList}>
													<div className={s.MathObject}>
														<p>
															Всего занятий:{' '}
															{studentsHistoryLessons[currentStudentIndex] &&
															studentsHistoryLessons[currentStudentIndex]
																.length !== 0
																? filteredLessonsHistory.length
																: '0'}
														</p>
														<p>
															Сумма:{' '}
															{studentsHistoryLessons[currentStudentIndex] &&
															studentsHistoryLessons[currentStudentIndex]
																.length !== 0
																? filteredLessonsHistory.length *
																		Number(student.costOneLesson) || 0
																: '0'}
															₽
														</p>
													</div>
													<Line width="294px" className={s.Line} />
													<div className={s.MathObject}>
														{/* count isDone */}
														<p>
															Прошло:{' '}
															{studentsHistoryLessons[currentStudentIndex] &&
																studentsHistoryLessons[
																	currentStudentIndex
																].filter(
																	(i) =>
																		new Date(i.date) >=
																			new Date(student.startLesson) &&
																		new Date(i.date) <=
																			new Date(student.endLesson) &&
																		i.isDone,
																).length}
														</p>
														<p>
															Оплачено:{' '}
															{studentsHistoryLessons[currentStudentIndex] &&
																studentsHistoryLessons[
																	currentStudentIndex
																].filter(
																	(i) =>
																		new Date(i.date) >=
																			new Date(student.startLesson) &&
																		new Date(i.date) <=
																			new Date(student.endLesson) &&
																		i.isPaid,
																).length}{' '}
															(
															{(studentsHistoryLessons[currentStudentIndex] &&
																studentsHistoryLessons[
																	currentStudentIndex
																].filter((i) => i.isPaid).length *
																	Number(student.costOneLesson)) ||
																0}
															₽)
														</p>
													</div>
													<Line width="294px" className={s.Line} />
													<div className={s.MathObject}>
														<p>
															Не оплачено:{' '}
															{studentsHistoryLessons[currentStudentIndex] &&
															studentsHistoryLessons[
																currentStudentIndex
															].filter(
																(i) =>
																	new Date(i.date) >=
																		new Date(student.startLesson) &&
																	new Date(i.date) <=
																		new Date(student.endLesson) &&
																	i.isDone,
															).length > 0
																? NotPayedStudent(index)
																: '0'}
														</p>
														<p style={{display: 'flex', flexDirection: 'row'}}>
															<p style={{marginRight: '5px'}}>Долг:</p>
															<p style={{color: 'red'}}>
																{handleDuty(student, index)}
															</p>
															<p>₽</p>
														</p>
													</div>
												</div>
											</div>
											{/* NO DATA */}
											<div className={s.StudentCardMathBlock}>
												<p>Посещение занятий: 0</p>
												<p>Пропущено: 0</p>
											</div>
											<Line width="100%" className={s.Line} />
											<mui.ListItemButton
												onClick={() => setOpenHistory(!openHistory)}>
												<mui.ListItemText primary="История занятий и оплат" />
												{openHistory ? <ExpandLess /> : <ExpandMore />}
											</mui.ListItemButton>

											<mui.Collapse
												className={s.MuiCollapse}
												in={openHistory}
												timeout="auto"
												unmountOnExit>
												<mui.List
													className={s.MuiList}
													component="div"
													disablePadding>
													<div className={s.ListObjectWrapper}>
														{studentsHistoryLessons[currentStudentIndex] &&
														studentsHistoryLessons[currentStudentIndex]
															.length !== 0 ? (
															<>{filteredLessonsHistory}</>
														) : (
															<>
																<div className={s.ListNoInfo}>
																	<p>Информации нет</p>
																</div>
															</>
														)}
													</div>
												</mui.List>
											</mui.Collapse>
											<Line width="100%" className={s.Line} />

											<FileNLinks
												alreadyUploaded={files}
												callback={handleAddFile}
												linksArray={links}
												submitLinks={handleLinksSubmit}
												deleteLink={deleteLink}
											/>

											<Line width="100%" className={s.Line} />
											<TextAreaInputBlock
												disabled={isEditMode}
												title="Комментарий:"
												value={students[currentStudentIndex].commentStudent}
												// disabled={isEditMode}
												onChange={(e) => {
													changeStudentValue(
														index,
														'commentStudent',
														e.target.value,
													)
												}}
												textIndent="120px"
											/>

											<Line width="100%" className={s.Line} />
											<RecordNListen
												alreadyRecorded={audioStudents}
												callback={handleAddAudioStudents}
												typeCard="group"
											/>
										</div>
										{errorList.length > 0 && (
											<div className={s.ErrorList}>
												{errorList.map((i) => (
													<p key={i}>{i}</p>
												))}
											</div>
										)}
									</>
								))}
							</div>
						</div>
						<div className={s.FooterWrapper}>
							<div className={s.FooterButton}>
								<div className={s.EditNSave}>
									<button
										disabled={currentOpenedGroup === ''}
										className={`${s.Edit} ${isEditMode ? s.Save : ''}`}
										onClick={() => setIsEditMode(!isEditMode)}>
										<p>Редактировать</p>
									</button>
									<button
										className={!isEditMode ? s.Save : s.SaveWhite}
										onClick={sendInfo}>
										<p>Сохранить</p>
									</button>
								</div>
								<div className={s.ArchiveNDelete}>
									<button
										disabled={currentOpenedGroup === ''}
										onClick={handleToArchive}
										className={s.Archive}>
										<p>В архив</p>
									</button>
									<button
										disabled={currentOpenedGroup === ''}
										onClick={handleDelete}
										className={s.Delete}>
										<p>Удалить</p>
									</button>
								</div>
							</div>
						</div>
					</>
				) : (
					<>
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
					</>
				)}
			</div>
			{PagePopUpExit === EPagePopUpExit.Exit && (
				<div className={s.ExitPopUpWrap}>
					<ExitPopUp
						className={s.ExitPopUp}
						title="Закрыть без сохранения?"
						yes={() => {
							dispatch({type: 'SET_EDITED_CARDS', payload: false})
							dispatch({
								type: 'SET_LEFT_MENU_PAGE',
								payload: ELeftMenuPage.MainPage,
							})
							dispatch({
								type: 'SET_PAGE_POPUP_EXIT',
								payload: EPagePopUpExit.None,
							})
							navigate('../')
						}}
						no={() =>
							dispatch({
								type: 'SET_PAGE_POPUP_EXIT',
								payload: EPagePopUpExit.None,
							})
						}
					/>
				</div>
			)}
		</>
	)
}

export default AddGroup
