import s from './index.module.scss'
import * as mui from '@mui/material'
import * as MUI from '@mui/base'
import {styled} from '@mui/material/styles'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Line from '../Line'
import Search from '../../assets/search'
import {useEffect, useState} from 'react'
import Arrow, {ArrowType} from '../../assets/arrow'
import microSVG from '../../assets/Microphone1.svg'
import Listen from '../../assets/Listen.svg'
import Plus from '../../assets/ItemPlus.svg'
import InActive from '../../assets/InActiveCheckboxIcon.svg'
import CheckBox from '../CheckBox'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import {DatePicker} from '@mui/x-date-pickers/DatePicker'
import CreateIcon from '@mui/icons-material/Create'
import InputMask from 'react-input-mask'
import './index.css'
import {ru} from 'date-fns/locale/ru'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3'
import ScheduleDate from '../ScheduleDate/index'
import ScheduleIcon from '@mui/icons-material/Schedule'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TimeSelector from '../Timer/index'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel/index'
import InputPhoneNumber from '../InputPhoneNumber/index'
import Input from '../Input'

import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import {
	ELeftMenuPage,
	IHistoryLessons,
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

import {useNavigate} from 'react-router-dom'
import FileNLinks from '../FileNLinks'
import RecordNListen from '../RecordNListen/index'
import IconsPhone from '../IconsPhone/index'

interface IAddGroup {
	className?: string
}
enum PagePopup {
	Exit,
	None,
}
const AddGroup = ({className}: IAddGroup) => {
	const [groupName, setGroupName] = useState<string>('')
	// Block Student
	const dispatch = useDispatch()
	const [commentStudent, setCommentStudent] = useState<string>('')

	const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

	const [currentItemIndex, setCurrentItemIndex] = useState(0)
	const [currentStudentIndex, setCurrentStudentIndex] = useState(0)
	const [costOneLesson, setCostOneLesson] = useState<number>(0)
	const [pagePopup, setPagePopup] = useState<PagePopup | null>(null)

	const [allCostForGroup, setAllCostForGroup] = useState<number>(0)
	const [allPriceGroup, setAllPriceGroup] = useState<number>(0)

	const user = useSelector((state: any) => state.user)
	const token = user?.token

	const getVoidWeek = (): ITimeLine[] => {
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
			timeLesson: '',
			startLesson: new Date(Date.now()),
			endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
			// totalCostOneLesson: 0,
			// commentItem: '',
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
			prePayDate: '',
			selectedDate: null,
			storyLesson: '',
			targetLessonStudent: '',
			todayProgramStudent: '',
		},
	])

	const sendInfo = () => {
		if (groupName && students.every((student) => student.nameStudent)) {
			socket.emit('addGroup', {
				groupName: groupName,
				items: items,
				students: students,
				token: token,
			})

			window.location.reload()
		}
	}

	const [historyLesson, setHistoryLesson] = useState<any>([])

	// Function to get the total sum of paid prices
	const getTotalPaidPrice = (data) => {
		return data.reduce((total, item) => {
			if (item.isPaid) {
				total += Number(item.price)
			}
			return total
		}, 0)
	}

	// Function to get the count of paid objects
	const getCountOfPaidObjects = (data) => {
		return data.reduce((count, item) => {
			if (item.isPaid) {
				count++
			}
			return count
		}, 0)
	}

	// Function to get the count of objects where isDone is true
	const getCountOfDoneObjects = (data) => {
		return data.reduce((count, item) => {
			if (item.isDone) {
				count++
			}
			return count
		}, 0)
	}

	function getDay(date: any) {
		const dayIndex = date.getDay() - 1
		return dayIndex === -1 ? 6 : dayIndex
	}

	const [data, setData] = useState()
	const currentOpenedGroup = useSelector(
		(state: any) => state.currentOpenedGroup,
	)

	const [groupsIndexes, setGroupsIndexes] = useState<number[]>([])
	const [currentGroupIndex, setCurrentGroupIndex] = useState<number>(0)

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
		})
	}, [])

	useEffect(() => {
		if (data) {
			console.log(data, 'getGroupById DATA')

			setGroupName(data.groupName)
			setItems(data.items)
			setStudents(data.students)
		}
	}, [data])

	const nextGroup = () => {
		if (Number(currentGroupIndex) < groupsIndexes.length - 1) {
			setCurrentGroupIndex(Number(currentGroupIndex) + 1)
			const newId = groupsIndexes[Number(currentGroupIndex)]

			dispatch({type: 'SET_CURRENT_OPENED_GROUP', payload: newId})
			socket.emit('getGroupById', {token: token, groupId: newId})

			socket.once('getGroupById', (data) => {
				console.log(data, 'getGroupById')
				setData(data)
				setGroupName(data.groupName)
				setItems(data.items)
				setStudents(data.students)
			})
		}
	}

	const prevGroup = () => {
		if (Number(currentGroupIndex) > 0) {
			setCurrentGroupIndex(Number(currentGroupIndex) - 1)
			const newId = groupsIndexes[Number(currentGroupIndex)]

			dispatch({type: 'SET_CURRENT_OPENED_GROUP', payload: newId})
			socket.emit('getGroupById', {token: token, groupId: newId})

			socket.once('getGroupById', (data) => {
				console.log(data, 'getGroupById')
				setData(data)
				setGroupName(data.groupName)
				setItems(data.items)
				setStudents(data.students)
			})
		}
	}

	// socket.on('getGroupById', (data) => {
	// 	console.log(data, 'getGroupById')
	// 	setItems(data.items)

	// 	//get position data.id in groupsIndexes
	// 	const index = groupsIndexes.indexOf(data.id)
	// 	setCurrentGroupIndex(index)
	// 	console.log(
	// 		'Current index:',
	// 		index,
	// 		'groupsIndexes:',
	// 		groupsIndexes,
	// 		'data.id:',
	// 		data.id,
	// 	)

	// 	setStudents(data.students)
	// 	setGroupName(data.groupName)
	// })

	// useEffect(() => {
	// 	socket.emit('getGroupList', token)
	// 	socket.on('getGroupList', (data) => {
	// 		console.log(data, 'getGroupList')
	// 		const groupIndexes = []
	// 		data.forEach((element) => {
	// 			groupIndexes.push(element.id)
	// 		})
	// 		setGroupsIndexes(groupIndexes)
	// 		console.log(groupIndexes, 'groupIndexes')
	// 	})
	// 	socket.on('getGroupById', (data) => {
	// 		console.log(data, 'getGroupById')
	// 		setItems(data.items)

	// 		//get position data.id in groupsIndexes
	// 		const index = groupsIndexes.indexOf(data.id)
	// 		setCurrentGroupIndex(index)
	// 		setCurrentID
	// 		console.log(
	// 			'Current index:',
	// 			index,
	// 			'groupsIndexes:',
	// 			groupsIndexes,
	// 			'data.id:',
	// 			data.id,
	// 		)

	// 		setStudents(data.students)
	// 		setGroupName(data.groupName)
	// 	})
	// }, [])

	// useEffect(() => {
	// 	socket.emit('getGroupById', {token: token, groupId: currentID})
	// }, [groupsIndexes, currentOpenedGroup])

	// const handleGroupChange = (index) => {
	// 	const newId = groupsIndexes[index]
	// 	dispatch({type: 'SET_CURRENT_OPENED_GROUP', payload: newId})
	// 	socket.emit('getGroupById', {
	// 		token: token,
	// 		groupId: newId,
	// 	})
	// }
	// socket.once('getGroupById', (data) => {
	// 	setGroupName(data.groupName)
	// 	setItems(data.items)
	// 	setStudents(data.students)
	// 	setCurrentGroupIndex(index) // Установить индекс только здесь
	// })

	// const nextGroup = () => {
	// 	if (currentGroupIndex < groupsIndexes.length - 1) {
	// 		handleGroupChange(currentGroupIndex + 1)
	// 	}
	// }

	// const prevGroup = () => {
	// 	if (currentGroupIndex > 0) {
	// 		handleGroupChange(currentGroupIndex - 1)
	// 	}
	// }

	// useEffect(() => {
	// 	socket.emit('getGroupList', token)
	// 	socket.once('getGroupList', (data) => {
	// 		const groupIndexes = data.map((element) => element.id)
	// 		setGroupsIndexes(groupIndexes)
	// 	})

	// 	const getGroupByIdListener = (data) => {
	// 		console.log(data, 'getGroupById')
	// 		setItems(data.items)
	// 		const index = groupsIndexes.indexOf(data.id)
	// 		setCurrentGroupIndex(index)
	// 		setStudents(data.students)
	// 		setGroupName(data.groupName)
	// 	}

	// 	socket.once('getGroupById', getGroupByIdListener)

	// 	return () => {
	// 		socket.off('getGroupById', getGroupByIdListener)
	// 	}
	// }, [])

	// useEffect(() => {
	// 	if (currentGroupIndex >= 0 && currentGroupIndex < groupsIndexes.length) {
	// 		const newId = groupsIndexes[currentGroupIndex]
	// 		setCurrentID(newId)
	// 		socket.emit('getGroupById', {token: token, groupId: newId})
	// 	}
	// }, [currentGroupIndex, groupsIndexes])

	const [studentsHistoryLessons, setStudentsHistoryLessons] = useState(
		students.map(() => []),
	)

	const [allLessons, setAllLessons] = useState<number>(0)
	const [allLessonsPrice, setAllLessonsPrice] = useState<number>(0)
	useEffect(() => {
		const newStudentsHistoryLessons = students.map((student, studentIndex) => {
			let historyLessons_ = []
			for (let i = 0; i < items.length; i++) {
				let differenceDays = differenceInDays(
					items[i].endLesson,
					items[i].startLesson,
				)
				const dateRange = Array.from({length: differenceDays + 1}, (_, j) =>
					addDays(items[i].startLesson, j),
				)

				for (const date of dateRange) {
					const dayOfWeek = getDay(date)
					const scheduleForDay = items[i].timeLinesArray[dayOfWeek]

					const cond =
						scheduleForDay.startTime.hour === 0 &&
						scheduleForDay.startTime.minute === 0 &&
						scheduleForDay.endTime.hour === 0 &&
						scheduleForDay.endTime.minute === 0

					if (!cond) {
						let hl = {
							date: date,
							itemName: items[i].itemName,
							isDone: date <= new Date(Date.now()) ? true : false,
							price: students[studentIndex].costOneLesson,
							isPaid: false,
						}

						historyLessons_.push(hl)
					}
				}
			}
			return historyLessons_
		})

		setStudentsHistoryLessons(newStudentsHistoryLessons)
	}, [items, students])

	const setHistoryLessonIsDone = (studentIndex, lessonIndex, value) => {
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

	const setHistoryLessonIsPaid = (studentIndex, lessonIndex, value) => {
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

	//add item function
	const addItem = () => {
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
				placeLesson: '',
				timeLesson: '',
				valueMuiSelectArchive: 1,
				startLesson: new Date(Date.now()),
				endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
				nowLevel: undefined,
				lessonDuration: null,
				timeLinesArray: getVoidWeek() as ITimeLine[],
			},
		])
	}

	//change item function by name of value
	const changeItemValue = (
		itemIndex: number,
		name: string,
		value: string | boolean | number | Date | null,
	) => {
		console.log('Changed: ', itemIndex, name, value)
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

	const [showEndTimePicker, setShowEndTimePicker] = useState(-1)

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
		console.log(itemIndex, id, items)
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
							timeLinesArray: item.timeLinesArray.map((timeline) =>
								timeline.id === id
									? {
											...timeline,
											startTime: {hour, minute},
											editingEnd: item.lessonDuration! > 0 ? false : true,
											editingStart: false,
									  }
									: timeline,
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
			setShowEndTimePicker(-1)
		} else {
			console.log('End time must be greater than start time')
		}
	}

	const handleLessonDurationChange = (e: any) => {
		const value = parseInt(e.target.value, 10)
		changeItemValue(currentItemIndex, 'lessonDuration', value)
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

	const compareDates = (a, b) => {
		return a.date - b.date
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
		if (items[currentItemIndex].itemName !== '') {
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
					placeLesson: '',
					timeLesson: '',
					startLesson: new Date(Date.now()),
					endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
					nowLevel: 0,
					valueMuiSelectArchive: 1,
					lessonDuration: null,
					timeLinesArray: getVoidWeek() as ITimeLine[],
				},
			])
		}
	}
	const closeTimePicker = (index: number, id: number) => {
		//change
		setItems((prevItems) =>
			prevItems.map((item, itemIndex) =>
				itemIndex === index
					? {
							...item,
							timeLinesArray: item.timeLinesArray.map((timeline) =>
								timeline.id === id
									? {...timeline, editingEnd: false, active: false}
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
				prePayDate: '',
				selectedDate: null,
				storyLesson: '',
				costOneLesson: '',
				targetLessonStudent: '',
				todayProgramStudent: '',
			},
		])
	}

	const StyledPickersLayout = styled('span')({
		'.MuiDateCalendar-root': {
			color: '#25991c',
			borderRadius: 2,
			borderWidth: 1,
			borderColor: '#25991c',
			border: '1px solid',
			// backgroundColor: '#bbdefb',
		},
		'.MuiPickersDay-today': {
			border: '1px solid #25991c ',
		},
		'.Mui-selected': {
			color: '#fff',
			backgroundColor: '#25991c !important',
		},
		'.Mui-selected:focus': {
			color: '#fff',
			backgroundColor: '#25991c',
		},
		'.MuiButtonBase-root:focus': {
			color: '#fff',
			backgroundColor: '#25991c',
		},
		'.MuiPickersYear-yearButton .Mui-selected:focus': {
			color: '#fff',
			backgroundColor: '#25991c',
		},
	})
	const [open, setOpen] = useState(true)
	const [openHistory, setOpenHistory] = useState(false)

	//calulations
	//Всего занятий - начало + окончание + расписание в предмете
	const getTotalLessons = (
		startDate: Date,
		endDate: Date,
		timeLinesArray: ITimeLine[],
	) => {
		let totalLessons = 0
		let start = startDate
		while (start.getTime() < endDate.getTime()) {
			totalLessons += timeLinesArray.filter((timeLine) => {
				return timeLine.startTime.hour !== 0 && timeLine.startTime.minute !== 0
			}).length
			start = new Date(start.getTime() + 60 * 60 * 1000)
		}
		console.log(totalLessons, 'totalLessons')
		return totalLessons
	}

	//Сумма - Всего занятия * Общая стоимость 1-го занятия
	const totalCostForGroup = (totalLessons: number, costPerLesson: number) => {
		return totalLessons * costPerLesson
	}

	//Прошло - от календаря, то есть нынешняя дата и начало занятия
	const passedLessons = (
		historyLessons: {
			isDone: boolean
			isPaid: boolean
		}[],
	) => {
		let passed = 0
		historyLessons.forEach((historyLesson) => {
			if (historyLesson.isDone) passed++
		})
		return passed
	}

	//Оплачено - Прошло * Общая стоимость занятия
	const paidLessons = (
		historyLessons: {
			isDone: boolean
			isPaid: boolean
		}[],
	) => {
		let paid = 0
		historyLessons.forEach((historyLesson) => {
			if (historyLesson.isPaid) paid++
		})
		return paid
	}

	const NotPayedStudent = (index: number) => {
		let Payed =
			studentsHistoryLessons[index].filter((i) => i.isDone).length -
			studentsHistoryLessons[index].filter((i) => i.isPaid).length
		if (Payed > 0) {
			return Payed
		} else return '0'
	}

	let allDuty = 0
	const [DutyStudents, setDutyStudents] = useState<any>([])
	useEffect(() => {
		//sum all costStudent and write to allCost
		let sumCost = 0
		let totalCostGroup = 0
		students.forEach((student) => {
			sumCost += Number(student.costStudent)
			totalCostGroup += Number(student.costOneLesson) || 0

			// studentsHistoryLessons[index] &&
			// 	(studentsHistoryLessons[index].filter((i) => i.isDone).length -
			// 		studentsHistoryLessons[index].filter((i) => i.isPaid).length) *
			// 		student.costOneLesson
		})
		setAllCostForGroup(sumCost)
		setAllPriceGroup(totalCostGroup)
	}, [students, historyLesson, studentsHistoryLessons])

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

	const handleClick = () => {
		setOpen(!open)
	}

	return (
		<>
			<button
				onClick={() => {
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
								item.nowLevel !== undefined ||
								item.lessonDuration !== null
							)
						})
					) {
						setPagePopup(PagePopup.Exit)
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
				<div className={s.Header}>
					<div className={s.HeaderAddGroup}>
						<div className={s.dataSlidePicker}>
							<button className={s.btn} onClick={() => prevGroup()}>
								<span>
									<Arrow direction={ArrowType.left} />
								</span>
							</button>
							<p className={s.btnText}>
								Карточка группы {currentGroupIndex + 1} / {groupsIndexes.length}
							</p>
							<button className={s.btn} onClick={() => nextGroup()}>
								<span>
									<Arrow direction={ArrowType.right} />
								</span>
							</button>
						</div>
					</div>
					<div className={s.StudNameHead}>
						<div className={s.StudentCardName}>
							<div className={s.StudentCarName__Left}>
								<p>Группа:</p>
								<input
									type="text"
									value={groupName}
									onChange={(e) => setGroupName(e.target.value)}
									placeholder="Название группы"
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
									<div className={s.StudentCard}>
										<input
											type="text"
											value={item.itemName}
											onChange={(e) =>
												changeItemValue(index, 'itemName', e.target.value)
											}
											placeholder="Наименование"
										/>
									</div>

									<Line width="100%" className={s.Line} />

									<div className={s.StudentCard}>
										<p>Цель занятий:</p>
										<input
											type="text"
											value={item.targetLesson}
											onChange={(e) =>
												changeItemValue(index, 'targetLesson', e.target.value)
											}
										/>
									</div>

									<Line width="100%" className={s.Line} />
									<div className={s.StudentCard}>
										<p>Программа ученика:</p>
										<input
											type="text"
											value={item.programLesson}
											onChange={(e) =>
												changeItemValue(index, 'programLesson', e.target.value)
											}
										/>
									</div>

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
												className={s.muiSelect__menu}
												variant={'standard'}
												value={item.typeLesson}
												onChange={(e) => {
													changeItemValue(index, 'typeLesson', e.target.value)
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
									<div className={s.StudentCard}>
										<p>Место проведения:</p>
										<input
											type="text"
											value={item.placeLesson}
											onChange={(e) =>
												changeItemValue(
													currentItemIndex,
													'placeLesson',
													e.target.value,
												)
											}
										/>
									</div>

									<Line width="100%" className={s.Line} />

									<div className={s.StudentCard}>
										<p>Продолжительность занятия:</p>
										<Input
											num
											type="text"
											value={item.lessonDuration}
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
										<LocalizationProvider
											dateAdapter={AdapterDateFns}
											adapterLocale={ru}>
											<DatePicker
												slots={{
													layout: StyledPickersLayout,
												}}
												sx={{
													input: {
														paddingTop: '0px',
														paddingBottom: '0px',
													},
												}}
												value={item.startLesson}
												onChange={(newValue) => {
													changeItemValue(
														currentItemIndex,
														'startLesson',
														String(newValue!),
													)
													console.log(newValue!)
												}}
												timezone="system"
												showDaysOutsideCurrentMonth
											/>
										</LocalizationProvider>

										<p style={{color: 'red'}}>*</p>
									</div>
									<Line width="100%" className={s.Line} />
									<div style={{marginBottom: '10px'}} className={s.StudentCard}>
										<p>Окончание занятий:</p>
										<LocalizationProvider
											dateAdapter={AdapterDateFns}
											adapterLocale={ru}>
											<DatePicker
												slots={{
													layout: StyledPickersLayout,
												}}
												sx={{
													input: {
														paddingTop: '0px',
														paddingBottom: '0px',
													},
												}}
												value={item.endLesson}
												onChange={(newValue) =>
													changeItemValue(
														currentItemIndex,
														'endLesson',
														String(newValue!),
													)
												}
												timezone="system"
												showDaysOutsideCurrentMonth
											/>
										</LocalizationProvider>
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
																			.padStart(
																				2,
																				'0',
																			)} - ${timeline.endTime.hour
																			.toString()
																			.padStart(
																				2,
																				'0',
																			)}:${timeline.endTime.minute
																			.toString()
																			.padStart(2, '0')}`}
																	</p>
																)}
															</div>
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
																	handleClick_dp(currentItemIndex, timeline.id)
																}
																className={s.ScheduleBtn}>
																<ScheduleIcon />
															</button>

															{(timeline.active ||
																timeline.id === showEndTimePicker) && (
																<div
																	className={s.timePickerWrapper}
																	style={{
																		transform: `translateY(${
																			index * 40
																		}px) translateX(-50%)`,
																	}}>
																	{timeline.active && !timeline.editingEnd && (
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
																		item.filter((obj) => obj.isDone === true)
																			.length,
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
																	<p style={{color: 'red', fontSize: '16px'}}>
																		{allDuty}
																	</p>
																</>
															}
															return (
																<>
																	<p style={{color: 'red', fontSize: '16px'}}>
																		{allDuty}
																	</p>
																</>
															)
														}}>
														{students.map((student: any, index: number) => (
															<MUI.Option className={s.muiOption} value={index}>
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

									<FileNLinks />

									<Line width="100%" className={s.Line} />

									<div className={s.StudentCard}>
										<p>Комментарий:</p>
										<textarea
											value={items[currentItemIndex].commentItem}
											onChange={(e) => {
												setItems(
													items.map((item, index) => {
														return index === currentItemIndex
															? {...item, comment: e.target.value}
															: item
													}),
												)
											}}
										/>
									</div>
									<Line width="100%" className={s.Line} />
									<RecordNListen />
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

						{students.map((student, index) => (
							<>
								<div
									className={
										currentStudentIndex === index ? s.ItemActive : s.ItemMain
									}>
									<div
										style={{justifyContent: 'space-between'}}
										className={s.StudentCard}>
										<div className={s.StudentCarName__Left}>
											<p>Имя:</p>
											<input
												type="text"
												value={student.nameStudent}
												onChange={(e) =>
													changeStudentValue(
														index,
														'nameStudent',
														e.target.value,
													)
												}
											/>
										</div>
										<p style={{color: 'red'}}>*</p>
									</div>
									<Line width="100%" className={s.Line} />
									<div className={s.StudentCard}>
										<p>Контактное лицо:</p>
										<input
											type="text"
											value={student.contactFace}
											onChange={(e) =>
												changeStudentValue(index, 'contactFace', e.target.value)
											}
										/>
									</div>

									<Line width="100%" className={s.Line} />

									<div className={s.StudentCard}>
										<p>Тел:</p>
										<InputMask
											type="text"
											mask="+7 (999) 999-99-99"
											maskChar="_"
											value={student.phoneNumber}
											onChange={(e) =>
												changeStudentValue(index, 'phoneNumber', e.target.value)
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
											type="email"
											value={student.email}
											onChange={(e) =>
												changeStudentValue(index, 'email', e.target.value)
											}
										/>
									</div>
									<Line width="100%" className={s.Line} />

									<div className={s.StudentCard}>
										<p>Источник:</p>
										<input
											type="text"
											value={student.linkStudent}
											onChange={(e) =>
												changeStudentValue(index, 'linkStudent', e.target.value)
											}
										/>
									</div>
									<Line width="100%" className={s.Line} />
									<div className={s.StudentCard}>
										<p>Расходы по ученику:</p>
										<Input
											num
											value={student.costStudent}
											width={`${student.costStudent.length}ch`}
											onChange={(e) =>
												changeStudentValue(index, 'costStudent', e.target.value)
											}
											style={{borderBottom: '1px solid #e2e2e9'}}
										/>
										<p>₽</p>
									</div>

									<Line width="100%" className={s.Line} />

									<div className={s.StudentCard}>
										<p>Предоплата:</p>
										<LocalizationProvider
											dateAdapter={AdapterDateFns}
											adapterLocale={ru}>
											<DatePicker
												slots={{
													layout: StyledPickersLayout,
												}}
												sx={{
													input: {
														paddingTop: '0px',
														paddingBottom: '0px',
													},
												}}
												value={student.prePayDate}
												onChange={(newValue) => {
													changeStudentValue(index, 'prePayDate', newValue)
												}}
												timezone="system"
												showDaysOutsideCurrentMonth
											/>
										</LocalizationProvider>

										<Input
											num
											className={s.PrePayCostInput}
											type="text"
											value={student.prePayCost}
											onChange={(e) =>
												changeStudentValue(index, 'prePayCost', e.target.value)
											}
										/>

										<p>₽</p>
									</div>
									<Line width="100%" className={s.Line} />
									<div className={s.StudentCardCheckBox}>
										<div className={s.CardCheckBox}>
											<p>Пробное занятие:</p>
										</div>
										<CheckBox className={s.CheckBox} size="20px" />
										<p>Стоимость:</p>
										<Input
											num
											type="text"
											value={students[currentStudentIndex].tryLessonCost}
											onChange={(e) => setTryLessonCost(e.target.value)}
										/>
										<p>₽</p>
									</div>
									<Line width="100%" className={s.Line} />
									{/* NO DATA */}
									<div className={s.StudentCardCheckBox}>
										<div className={s.CardCheckBoxLevel}>
											<p>Текущий уровень:</p>
										</div>

										<NowLevel amountInputs={5} />
									</div>
									<Line width="100%" className={s.Line} />
									<div className={s.StudentCard}>
										<p>Текущая программа ученика:</p>
										<input
											type="text"
											value={student.todayProgramStudent}
											onChange={(e) => {
												changeStudentValue(
													index,
													'todayProgramStudent',
													e.target.value,
												)
											}}
										/>
									</div>
									<Line width="100%" className={s.Line} />

									<div className={s.StudentCard}>
										<p>Цель занятий:</p>
										<input
											type="text"
											value={student.targetLessonStudent}
											onChange={(e) =>
												changeStudentValue(
													index,
													'targetLessonStudent',
													e.target.value,
												)
											}
										/>
									</div>
									<Line width="100%" className={s.Line} />

									{/* NO DATA */}
									<div className={s.StudentCard}>
										<p>Начало занятий:</p>
										<LocalizationProvider
											dateAdapter={AdapterDateFns}
											adapterLocale={ru}>
											<DatePicker
												slots={{
													layout: StyledPickersLayout,
												}}
												sx={{
													input: {
														paddingTop: '0px',
														paddingBottom: '0px',
													},
												}}
												timezone="system"
												showDaysOutsideCurrentMonth
											/>
										</LocalizationProvider>

										<p style={{color: 'red'}}>*</p>
									</div>
									<Line width="100%" className={s.Line} />
									<div style={{marginBottom: '10px'}} className={s.StudentCard}>
										<p>Окончание занятий:</p>
										<LocalizationProvider
											dateAdapter={AdapterDateFns}
											adapterLocale={ru}>
											<DatePicker
												slots={{
													layout: StyledPickersLayout,
												}}
												sx={{
													input: {
														paddingTop: '0px',
														paddingBottom: '0px',
													},
												}}
												timezone="system"
												showDaysOutsideCurrentMonth
											/>
										</LocalizationProvider>
										<p style={{color: 'red'}}>*</p>
									</div>

									<Line width="100%" className={s.Line} />
									<div className={s.StudentCard}>
										<p>Стоимость одного занятия:</p>
										<Input
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
													{studentsHistoryLessons[index]
														? studentsHistoryLessons[index].length
														: '0'}
												</p>
												<p>
													Сумма:{' '}
													{studentsHistoryLessons[index]
														? studentsHistoryLessons[index].length *
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
													{studentsHistoryLessons[index] &&
														studentsHistoryLessons[index].filter(
															(i) => i.isDone,
														).length}
												</p>
												<p>
													Оплачено:{' '}
													{studentsHistoryLessons[index] &&
														studentsHistoryLessons[index].filter(
															(i) => i.isPaid,
														).length}{' '}
													(
													{(studentsHistoryLessons[index] &&
														studentsHistoryLessons[index].filter(
															(i) => i.isPaid,
														).length * Number(student.costOneLesson)) ||
														0}
													₽)
												</p>
											</div>
											<Line width="294px" className={s.Line} />
											<div className={s.MathObject}>
												<p>
													Не оплачено:{' '}
													{studentsHistoryLessons[index] &&
														(studentsHistoryLessons[index].filter(
															(i) => i.isDone,
														).length > 0
															? NotPayedStudent(index)
															: '0')}
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
												{studentsHistoryLessons[currentStudentIndex].length !==
												0 ? (
													studentsHistoryLessons[currentStudentIndex]
														.sort(compareDates)
														.map((lesson, lessonIndex) => (
															<div className={s.ListObject}>
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
																			backgroundColor: hashToColor(
																				hashString(lesson.itemName),
																			),
																			width: '10px',
																			height: '35px',
																			borderTopLeftRadius: '8px',
																			borderBottomLeftRadius: '8px',
																			marginRight: '5px',
																		}}></div>
																	{formatDate(lesson.date)}
																</p>
																<p
																	style={{
																		fontWeight: '300',
																		fontSize: '14px',
																		width: '95px',
																		minWidth: '95px',
																		maxWidth: '95px',
																		whiteSpace: 'nowrap',
																		overflow: 'hidden',
																		textOverflow: 'ellipsis',
																	}}>
																	{lesson.itemName}
																</p>
																<CheckBox
																	checked={lesson.isDone}
																	size="16px"
																	onChange={() =>
																		setHistoryLessonIsDone(
																			index,
																			lessonIndex,
																			!lesson.isDone,
																		)
																	}
																/>
																<p
																	style={{
																		marginLeft: '55px',
																		fontSize: '14px',
																	}}>
																	{lesson.price || 0}₽
																</p>
																<CheckBox
																	checked={lesson.isPaid}
																	size="16px"
																	onChange={() =>
																		setHistoryLessonIsPaid(
																			index,
																			lessonIndex,
																			!lesson.isPaid,
																		)
																	}
																/>
																<button className={s.ButtonEdit}>
																	<CreateIcon
																		style={{width: '18px', height: '18px'}}
																	/>
																</button>
															</div>
														))
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

									<FileNLinks />

									<Line width="100%" className={s.Line} />
									<div className={s.StudentCard}>
										<p>Комментарий:</p>
										<textarea
											value={commentStudent}
											onChange={(e) => setCommentStudent(e.target.value)}
										/>
									</div>
									<Line width="100%" className={s.Line} />
									<RecordNListen />
								</div>
							</>
						))}
					</div>
				</div>
				<div className={s.FooterWrapper}>
					<div className={s.FooterButton}>
						<div className={s.EditNSave}>
							<button className={s.Edit}>
								<p>Редактировать</p>
							</button>
							<button className={s.Save} onClick={sendInfo}>
								<p>Сохранить</p>
							</button>
						</div>
						<div className={s.ArchiveNDelete}>
							<button className={s.Archive}>
								<p>В архив</p>
							</button>
							<button className={s.Delete}>
								<p>Удалить</p>
							</button>
						</div>
					</div>
				</div>
			</div>
			{pagePopup === PagePopup.Exit && (
				<div className={s.ExitPopUpWrap}>
					<ExitPopUp
						className={s.ExitPopUp}
						title="Закрыть без сохранения?"
						yes={() => {
							dispatch({
								type: 'SET_LEFT_MENU_PAGE',
								payload: ELeftMenuPage.MainPage,
							})
						}}
						no={() => setPagePopup(PagePopup.None)}
					/>
				</div>
			)}
		</>
	)
}

export default AddGroup
