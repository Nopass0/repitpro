import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ScheduleIcon from '@mui/icons-material/Schedule'
import * as mui from '@mui/material'
import {useEffect, useRef, useState} from 'react'
import InputMask from 'react-input-mask'
import {useDispatch, useSelector} from 'react-redux'
import Plus from '../../assets/ItemPlus.svg'
import {AudioRecorder, FileAndLinkUploader, StudentMedia} from '../StudentMedia'
import socket, {isServer} from '../../socket'
import {
	ELeftMenuPage,
	EPagePopUpExit,
	IItemCard,
	IlinksArray,
	IPrePayList,
	Item,
	ITimeLine,
} from '../../types'
import CheckBox from '../CheckBox'
import Input from '../Input'
import Schedule from '../Schedule'
import Line from '../Line'
import NowLevel from '../NowLevel'
import TimePicker from '../Timer/index'
import './index.css'
import s from './index.module.scss'

import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import axios from 'axios'
import {addDays, differenceInDays, format} from 'date-fns'
import {TailSpin} from 'react-loader-spinner'
import {useNavigate} from 'react-router-dom'
import DeleteConfirmation from '../DeleteConfirmation'
import ExitPopUp from '../ExitPopUp'
import IconsPhone from '../IconsPhone/index'
import MiniCalendar from '../MiniCalendar'
import PrePayRow from '../PrePayRow'
import TextAreaInputBlock from '../TextAreaInputBlock'
import {Button} from '@/ui/button'
import {ChevronLeft, ChevronRight, X} from 'lucide-react'
import {Textarea} from '@/ui/textarea'
import {useHistory} from '@/hooks/useHistory'
import {useMemo, useCallback} from 'react'
import debounce from 'lodash/debounce'
import TimeRangePicker, {useTimeRangePicker} from '@/ui/time-range-picker-day'

interface IAddStudent {}
interface IScheduleTimer {
	id: number
}

const AddStudent = ({}: IAddStudent) => {
	const user = useSelector((state: any) => state.user)
	const token = user.token
	const [data, setData] = useState()
	const [allIdStudent, setAllIdStudent] = useState([])
	const currentOpenedStudent = useSelector(
		(state: any) => state.currentOpenedStudent,
	)
	const editedCards = useSelector((state: any) => state.editedCards)
	const listRef = useRef(null)
	const [currentStudPosition, setCurrentStudPosition] = useState<number>()
	const [historyLesson, setHistoryLesson] = useState<any>([])

	const [isEditMode, setIsEditMode] = useState<boolean>(
		currentOpenedStudent ? true : false,
	)
	const [loading, setLoading] = useState<boolean>(false)
	const navigate = useNavigate()
	const [audios, setAudios] = useState<any>([])
	const [prePayList, setPrePayList] = useState<IPrePayList[]>([])
	const [editId, setEditId] = useState<number | null>(null)
	const [deletedId, setDeletedId] = useState<number | null>(null)
	const addStudentExit = useSelector((state: any) => state.addStudentExit)
	const addGroupExit = useSelector((state: any) => state.addGroupExit)
	const addClientExit = useSelector((state: any) => state.addClientExit)
	// const [combinedHistory, setCombinedHistory] = useState([])
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
	const deleteButtonRef = useRef(null)

	const updateCard = useSelector((state: any) => state.updateCard)

	//media
	const [mediaFiles, setMediaFiles] = useState([])
	const [isMediaExpanded, setIsMediaExpanded] = useState(false)
	const [mediaSortBy, setMediaSortBy] = useState('name')

	const handleFileUpload = (file) => {
		const newFile = {
			id: String(Date.now()),
			name: file.name,
			type: 'file',
			url: URL.createObjectURL(file),
			size: file.size,
		}
		setMediaFiles((prev) => [...prev, newFile])
	}

	const handleLinkAdd = (url) => {
		const newLink = {
			id: String(Date.now()),
			name: new URL(url).hostname,
			type: 'link',
			url: url,
		}
		setMediaFiles((prev) => [...prev, newLink])
	}

	const handleAudioRecord = (blob) => {
		const newAudio = {
			id: String(Date.now()),
			name: `Запись ${new Date().toLocaleString()}`,
			type: 'audio',
			url: URL.createObjectURL(blob),
		}
		setMediaFiles((prev) => [...prev, newAudio])
	}

	const handleMediaRemove = (id) => {
		setMediaFiles((prev) => prev.filter((file) => file.id !== id))
	}

	useEffect(() => {
		if (updateCard && currentOpenedStudent) {
			// Перезагружаем данные студента
			socket.emit('getGroupByStudentId', {
				token: token,
				studentId: currentOpenedStudent,
			})

			// Сбрасываем флаг обновления
			dispatch({type: 'SET_UPDATE_CARD', payload: false})
		}
	}, [updateCard, currentOpenedStudent])

	const handleAddAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setAudios([...audios, {file: file, name: name, type: type, size: size}])
	}

	// Pre Pay Functions
	// Update functions for handling prepayment changes
	function addPrePayList(prePayCostValue, prePayDate, prePayId) {
		if (prePayCostValue !== '') {
			const newPrePayId = prePayId || Date.now()

			// First update prePayList state
			const newPrePay = {
				cost: prePayCostValue,
				date: prePayDate,
				id: newPrePayId,
			}

			setPrePayList((prevList) => [...(prevList || []), newPrePay])

			// Then call addPrePay from useHistory hook
			addPrePay(prePayCostValue, prePayDate, newPrePayId)

			// Reset input values
			setPrePayCostValue('')
			setPrePayDate(new Date())
		}
	}

	function handlePrePayDelete(id) {
		deletePrePay(id) // используем функцию из хука
		setPrePayList((prevList) => {
			const deletedPrepay = prevList.find((item) => item.id === id)
			if (!deletedPrepay) return prevList
			return prevList.filter((item) => item.id !== id)
		})
	}

	function handlePrePayEdit(id: number, newDate: Date, newCost: string) {
		console.log('handlePrePayEdit called with:', {id, newDate, newCost})
		editPrePay(id, newDate, newCost)
		setPrePayList((prevList) => {
			console.log('Previous prePayList:', prevList)
			const newList = prevList.map((item) =>
				item.id === id
					? {...item, date: new Date(newDate), cost: newCost}
					: item,
			)
			console.log('New prePayList:', newList)
			return newList
		})
		setEditId(null)
	}

	const startEditing = (id: number) => {
		setEditId(id)
	}

	const finishEditing = () => {
		setEditId(null)
	}

	const startDelete = (id: number) => {
		setDeletedId(id)
	}
	const finishDelete = () => {
		setDeletedId(null)
	}

	const [isBalanceOpen, setIsBalanceOpen] = useState(false)

	useEffect(() => {
		socket.emit('getAllIdStudents', {token: token})
		socket.on('getAllIdStudents', (data: any) => {
			// Make from object {id: 123}, {id: 2345} to Array Strings ['123', '2345']
			const arr = Object.values(data).map((item: any) => item.id)
			const csp = arr.indexOf(currentOpenedStudent)
			setAllIdStudent(arr)
			setCurrentStudPosition(csp)
			// setOpen(true)
		})

		socket.on('getGroupByStudentId', (data: any) => {
			setData(data.group)
		})
	}, [])

	const nextStud = () => {
		if (Number(currentStudPosition) < allIdStudent.length - 1) {
			setCurrentStudPosition(Number(currentStudPosition) + 1)
			const newId = allIdStudent[Number(currentStudPosition) + 1]

			dispatch({type: 'SET_CURRENT_OPENED_STUDENT', payload: newId})
			console.log(currentOpenedStudent, 'newIdDispatch')
			socket.emit('getGroupByStudentId', {
				token: token,
				studentId: newId,
			})
		}
		socket.once('getGroupByStudentId', (data: any) => {
			setData(data.group)
		})
	}

	const prevStud = () => {
		if (Number(currentStudPosition) > 0) {
			setCurrentStudPosition(Number(currentStudPosition) - 1)
			const newId = allIdStudent[Number(currentStudPosition) - 1]

			dispatch({type: 'SET_CURRENT_OPENED_STUDENT', payload: newId})
			console.log(currentOpenedStudent, newId, 'newIdDispatch')
			socket.emit('getGroupByStudentId', {
				token: token,
				studentId: newId,
			})
			socket.on('getGroupByStudentId', (data: any) => {
				setData(data.group)
			})
		}
	}

	const handleToArchive = () => {
		socket.emit('studentToArhive', {
			token: token,
			id: currentOpenedStudent,
			isArchived: true,
		})
		window.location.reload()
	}

	const [textAreaHeight, setTextAreaHeight] = useState<number>(19)

	// Block Student
	const [nameStudent, setNameStudent] = useState<string>('')
	const [contactFace, setContactFace] = useState<string>('')
	const [phoneNumber, setPhoneNumber] = useState<string>('')
	const [email, setEmail] = useState<string>('')
	const [linkStudent, setLinkStudent] = useState<string>('')
	const [costStudent, setCostStudent] = useState<string>('')
	const [commentStudent, setCommentStudent] = useState<string>('')
	const [prePayCost, setPrePayCost] = useState<string>('')
	const [prePayCostValue, setPrePayCostValue] = useState<string>('')
	const [prePayDate, setPrePayDate] = useState<any>(new Date(Date.now()))
	const [costOneLesson, setCostOneLesson] = useState<string>('')

	const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

	const PagePopUpExit = useSelector((state: any) => state.pagePopUpExit)
	const [currentItemIndex, setCurrentItemIndex] = useState(0)
	const dispatch = useDispatch()

	const [historyLessonsFirst, setHistoryLessonsFirst] = useState<boolean>(true)

	//get week
	const getVoidWeek = (): ITimeLine[] => {
		const week = daysOfWeek.map((day, index) => ({
			id: (index + 1) * (currentItemIndex + 1),
			day,
			active: false,
			startTime: {hour: 0, minute: 0},
			endTime: {hour: 0, minute: 0},
			editingStart: false,
			editingEnd: false,
		}))

		return week
	}

	const formatDate = (date: Date | string) => {
		// Убедимся, что у нас есть объект Date
		const dateObject = date instanceof Date ? date : new Date(date)

		// Проверяем валидность даты
		if (isNaN(dateObject.getTime())) {
			console.warn('Invalid date:', date)
			return ''
		}

		const day = String(dateObject.getDate()).padStart(2, '0')
		const month = String(dateObject.getMonth() + 1).padStart(2, '0')
		const year = String(dateObject.getFullYear()).slice(-2) // Take last 2 digits of the year

		return `${day}.${month}.${year}`
	}

	const [timeLines, setTimeLines] = useState<ITimeLine[]>(getVoidWeek())

	// Block item
	const [items, setItems] = useState<IItemCard[]>([
		{
			itemName: '',
			tryLessonCheck: false,
			tryLessonCost: '',
			trialLessonDate: new Date(),
			trialLessonTime: {
				startTime: {hour: 0, minute: 0},
				endTime: {hour: 0, minute: 0},
			},
			todayProgramStudent: '',
			
			targetLesson: '',
			programLesson: '',
			typeLesson: '1',
			placeLesson: '',
			timeLesson: '',
			valueMuiSelectArchive: 1,
			costOneLesson: '',
			startLesson: new Date(Date.now()),
			endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
			nowLevel: undefined,
			lessonDuration: null,
			timeLinesArray: getVoidWeek() as ITimeLine[],
			files: [],
		},
	])

	const [linksArray, setLinksArray] = useState<IlinksArray[]>([])
	const [links, setLinks] = useState<string[]>([])
	const handleLinksSubmit = (linksCallback: string[]) => {
		setLinks(linksCallback)
	}

	useEffect(() => {
		socket.emit('getLinksByLinkedId', {
			linkedId: currentOpenedStudent,
			token: token,
		})
		socket.once('getLinksByLinkedId', (data: any) => {
			console.log('Links:', data.links)
			setLinks(data.links)
		})
	}, [])

	const deleteLink = (link: string) => {
		socket.emit('deleteLink', {
			linkedId: currentOpenedStudent,
			token: token,
		})
		socket.once('deleteLink', () => {
			setLinks(links.filter((item) => item !== link))
		})
	}

	const [files, setFiles] = useState<{}[]>([])

	const [freeSlots, setFreeSlots] = useState([])
	const [busyOnlineSlots, setBusyOnlineSlots] = useState([])
	useEffect(() => {
		const adr = !isServer ? 'http://localhost:3000' : 'https://repitpro.ru/api'
		axios
			.get(`${adr}/check-free-slots`, {
				params: {
					token: token,
					startDate: items[currentItemIndex].startLesson,
					endDate: items[currentItemIndex].endLesson,
				},
			})
			.then((data) => {
				console.log(data)
				setFreeSlots(data.data.freeSlots)
				setBusyOnlineSlots(data.data.freeSlots)
			})
	}, [items])

	const [activeTimePicker, setActiveTimePicker] = useState<{
		itemIndex: number
		timelineId: number | null
	}>({
		itemIndex: -1,
		timelineId: null,
	})

	
	const {
		combinedHistory,
		balance,
		updateHistory,
		addPrePay,
		deletePrePay,
		editPrePay,
		updateCombinedHistory,
		putCombinedHistory,
		updateHistoryWithChanges,
	} = useHistory(
		useMemo(() => [], []),
		useMemo(() => [], []),
		isEditMode,
	)

	const handleFileNLinks = (
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
		console.log(files, 'FILESFILES')
	}

	//add item function
	const addItem = () => {
		const newItemName = items[currentItemIndex].itemName
		const existingItemsNames = items
			.filter((item, index) => index !== currentItemIndex)
			.map((item) => item.itemName)

		if (
			newItemName !== '' &&
			currentItemIndex === items.length - 1 &&
			!existingItemsNames.includes(newItemName)
		) {
			setItems([
				...items,
				{
					itemName: '',
					tryLessonCheck: false,
					tryLessonCost: '',
					trialLessonDate: new Date(),
					trialLessonTime: {
						startTime: {hour: 0, minute: 0},
						endTime: {hour: 0, minute: 0},
					},
					todayProgramStudent: '',
					targetLesson: '',
					programLesson: '',
					typeLesson: '1',
					placeLesson: '',
					timeLesson: '',
					valueMuiSelectArchive: 1,
					startLesson: new Date(Date.now()),
					costOneLesson: '',

					files: [],
					endLesson: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000 * 2),
					nowLevel: undefined,
					lessonDuration: null,
					timeLinesArray: getVoidWeek() as ITimeLine[],
				},
			])
			setCurrentItemIndex(currentItemIndex + 1)
		}
	}

	// id items
	const [editedItems, setEditedItems] = useState<Set<string>>(new Set())

	// Модифицируем функцию changeItemValue
	const changeItemValue = (
		itemIndex: number,
		name: string,
		value: string | boolean | number | Date | null,
	) => {
		setItems((prevItems: IItemCard[]) => {
			const newItems = prevItems.map((item, index) =>
				index === itemIndex ? {...item, [name]: value} : item,
			)

			// Добавляем измененный предмет в список
			if (isEditMode) {
				setEditedItems((prev) =>
					new Set(prev).add(newItems[itemIndex].itemId),
				)
			}

			return newItems
		})
	}

	// Добавляем эффект для обработки изменений
	useEffect(() => {
		if (isEditMode && editedItems.size > 0) {
			editedItems.forEach((itemId: string) => {
				updateHistoryWithChanges(items, itemId)
			})
		}
	}, [items, isEditMode, editedItems])

	// При выходе из режима редактирования очищаем список измененных предметов
	useEffect(() => {
		if (!isEditMode) {
			setEditedItems(new Set())
		}
	}, [isEditMode])

	const sendData = () => {
		setLoading(true)
		socket.off('addStudent')
		socket.off('updateStudentAndItems')

		const dataToSend = {
			id: currentOpenedStudent,
			nameStudent,
			contactFace,
			email,
			linkStudent,
			costStudent,
			commentStudent,
			prePayCost,
			prePayDate,
			costOneLesson,
			files,
			audios,
			items,
			token,
			phoneNumber,
			mediaFiles,
			// Отправляем всю историю как есть
			combinedHistory,
		}

		if (currentOpenedStudent) {
			socket.once('updateStudentAndItems', (response) => {
				if (response.success) {
					// Теперь ответ содержит обновленную combinedHistory
					if (response.combinedHistory) {
						putCombinedHistory(response.combinedHistory)
					}

					// Обновляем остальные данные если нужно
					if (response.student) {
						setNameStudent(response.student.nameStudent)
						setCostOneLesson(response.student.costOneLesson)
						setPrePayCost(response.student.prePayCost)
						setPrePayDate(response.student.prePayDate)
						setContactFace(response.student.contactFace)
						setPhoneNumber(response.student.phoneNumber)
						setEmail(response.student.email)
						setLinkStudent(response.student.linkStudent)
						setCommentStudent(response.student.commentStudent)
						setCostStudent(response.student.costStudent)
					}

					if (response.group?.items) {
						setItems(response.group.items)
					}

					// Обновляем Redux store если нужно
					dispatch({
						type: 'SET_UPDATE_CARD',
						payload: true,
					})

					window.location.reload()
					return
				}

				alert(response.error)
				setLoading(false)
			})

			socket.emit('updateStudentAndItems', dataToSend)
		} else {
			// Логика для создания нового студента остается прежней
			socket.once('addStudent', (response) => {
				if (response?.ok) {
					window.location.reload()
					return
				}
				alert(response?.error)
				setLoading(false)
			})

			socket.emit('addStudent', dataToSend)
		}
	}

	const [errorList, setErrorList] = useState<string[]>([])

	const [open, setOpen] = useState(false)

	const [showEndTimePicker, setShowEndTimePicker] = useState(-1)

	const [lessonDuration, setLessonDuration] = useState()

	const handleClick_delete = (itemIndex: number, id: number) => {
		setItems((prevItems) => {
			const newItems = prevItems.map((item, index) =>
				index === itemIndex
					? {
							...item,
							timeLinesArray: item.timeLinesArray.map((timeline) =>
								timeline.id === id
									? {
											...timeline,
											startTime: {hour: 0, minute: 0},
											endTime: {hour: 0, minute: 0},
											timeRanges: [],
											active: false,
										}
									: timeline,
							),
						}
					: item,
			)

			// Всегда обновляем историю после изменений в расписании
			if (isEditMode) updateHistory(newItems)
			return newItems
		})
	}
	const [initialTimeRange, setInitialTimeRange] = useState<TimeRange | null>(
		null,
	)
	const [trialLessonDate, setTrialLessonDate] = useState<Date | null>(null)
	const {isOpen, ranges, openPicker, closePicker, setRanges} =
		useTimeRangePicker(initialTimeRange ? [initialTimeRange] : [])

	const handleTimeSelect = (selectedRanges) => {
		if (selectedRanges.length > 0) {
			onTimeChange(selectedRanges[0])
		}
	}

	// Измененная функция handleClick_dp
	const handleClick_dp = (itemIndex: number, id: number) => {
		// Если этот таймпикер уже активен, деактивируем его
		if (
			activeTimePicker.itemIndex === itemIndex &&
			activeTimePicker.timelineId === id
		) {
			setActiveTimePicker({itemIndex: -1, timelineId: null})
		} else {
			// Иначе активируем новый таймпикер
			setActiveTimePicker({itemIndex, timelineId: id})
		}

		setShowEndTimePicker(-1)
	}

	const handleTimeChange = (
		itemIndex: number,
		id: number,
		startHour: number,
		startMinute: number,
		endHour: number,
		endMinute: number,
	) => {
		setItems((prevItems) => {
			const newItems = prevItems.map((item, index) =>
				index === itemIndex
					? {
							...item,
							timeLinesArray: item.timeLinesArray.map((timeline) =>
								timeline.id === id
									? {
											...timeline,
											startTime: {hour: startHour, minute: startMinute},
											endTime: {hour: endHour, minute: endMinute},
											editingStart: false,
											active: false,
											timeRanges: [
												{
													startTime: {hour: startHour, minute: startMinute},
													endTime: {hour: endHour, minute: endMinute},
												},
											],
										}
									: timeline,
							),
						}
					: item,
			)

			// Сразу после обновления items хук useEffect выше обновит combinedHistory
			return newItems
		})

		setShowEndTimePicker(-1)
	}

	const closeTimePicker = (index: number, id: number) => {
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
										}
									: timeline,
							),
						}
					: item,
			),
		)
		setShowEndTimePicker(-1)
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

	const isSameDay = (date1, date2) => {
		const d1 = new Date(date1)
		const d2 = new Date(date2)
		return (
			d1.getFullYear() === d2.getFullYear() &&
			d1.getMonth() === d2.getMonth() &&
			d1.getDate() === d2.getDate()
		)
	}

	// Function to handle prepayments and lesson status
	const handlePrePayment = (historyLessons, prePayList, currentItemName) => {
		if (!Array.isArray(prePayList)) {
			return historyLessons
		}

		const isDateTimeBeforeOrEqual = (date1, date2) => {
			const d1 = new Date(date1)
			const d2 = new Date(date2)
			return d1 < d2 || isSameDay(d1, d2) // Include same day
		}

		const sortedPrePayList = [...prePayList].sort(
			(a, b) => new Date(a.date) - new Date(b.date),
		)

		const sortedHistoryLessons = [...historyLessons].sort(
			(a, b) => new Date(a.date) - new Date(b.date),
		)

		// Reset all payment flags initially
		const resetLessons = sortedHistoryLessons.map((lesson) => ({
			...lesson,
			isPaid: false,
		}))

		// Track which lessons should be paid
		const paidLessons = new Set()

		// Process each prepayment chronologically
		sortedPrePayList.forEach((prepay) => {
			let remainingAmount = Number(prepay.cost)
			const prepayDate = new Date(prepay.date)

			// Get eligible lessons for this prepayment (all subjects)
			const eligibleLessons = resetLessons
				.filter(
					(lesson) =>
						!lesson.isCancel &&
						!paidLessons.has(lesson.date.getTime()) &&
						isDateTimeBeforeOrEqual(prepayDate, lesson.date),
				)
				.sort((a, b) => new Date(a.date) - new Date(b.date))

			// Apply prepayment to lessons
			for (const lesson of eligibleLessons) {
				const lessonPrice = Number(lesson.price)
				if (remainingAmount >= lessonPrice) {
					paidLessons.add(lesson.date.getTime())
					remainingAmount -= lessonPrice
				} else {
					break
				}
			}
		})

		// Create final lesson list with updated payment status
		const now = new Date()
		return resetLessons.map((lesson) => {
			const lessonDate = new Date(lesson.date)
			const isDone = lessonDate < now

			return {
				...lesson,
				isDone,
				isPaid: paidLessons.has(lessonDate.getTime()),
			}
		})
	}

	// Statistics functions now accept currentItemName parameter
	const getTotalPaidPrice = (data, currentItemName = null) => {
		return data.reduce((total, item) => {
			if (
				item.isPaid &&
				!item.isCancel &&
				(!currentItemName || item.itemName === currentItemName)
			) {
				total += Number(item.price)
			}
			return total
		}, 0)
	}

	const getCountOfPaidObjects = (data, currentItemName = null) => {
		return data.reduce((count, item) => {
			if (
				item.isPaid &&
				!item.isCancel &&
				(!currentItemName || item.itemName === currentItemName)
			) {
				count++
			}
			return count
		}, 0)
	}

	const getCountOfDoneObjects = (data, currentItemName = null) => {
		return data.reduce((count, item) => {
			if (
				item.isDone &&
				!item.isCancel &&
				(!currentItemName || item.itemName === currentItemName)
			) {
				count++
			}
			return count
		}, 0)
	}

	const handleLessonDurationChange = (e: any) => {
		const value = parseInt(e.target.value, 10)
		changeItemValue(currentItemIndex, 'lessonDuration', value)
	}

	const handleClick = () => {
		setOpen(!open)
		setHistoryLessonsFirst(false)
	}

	function handlePrePayDate(newValue: any) {
		setPrePayDate(new Date(newValue))
	}
	function getDay(date: any) {
		const dayIndex = date.getDay() - 1
		return dayIndex === -1 ? 6 : dayIndex
	}
	const today = new Date()
	let nearestDateIndex = 0
	let nearestDateDiff = Infinity

	for (let i = 0; i < historyLesson.length; i++) {
		const lessonDate = new Date(historyLesson[i].date)
		const diff = Math.abs(today.getTime() - lessonDate.getTime())
		if (diff < nearestDateDiff) {
			nearestDateIndex = i
			nearestDateDiff = diff
		}
	}


	const [prevBalance, setPrevBalance] = useState(null)

	useEffect(() => {
		// Проверяем, был ли уже установлен баланс и отличается ли он от предыдущего
		if (balance !== undefined && balance !== prevBalance) {
			console.log('Current balance:', balance)
			setPrevBalance(balance)
		}
	}, [balance])

	const [scrollPosition, setScrollPosition] = useState(0)
	const collapseRef = useRef(null)
	useEffect(() => {
		if (listRef.current && collapseRef.current) {
			const listHeight = listRef.current.offsetHeight
			const windowHeight = window.innerHeight
			const collapseIsOpen = Boolean(collapseRef.current.state.expanded)

			if (collapseIsOpen) {
				setScrollPosition(window.scrollY + windowHeight / 2 - listHeight / 2)
				listRef.current.scrollTop = scrollPosition
			}
		}
	}, [listRef, scrollPosition, collapseRef])

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
					item.nowLevel !== undefined ||
					item.lessonDuration !== null ||
					item.costOneLesson !== ''
				)
			}) ||
			nameStudent !== '' ||
			contactFace !== '' ||
			email !== '' ||
			linkStudent !== '' ||
			costStudent !== '' ||
			commentStudent !== '' ||
			phoneNumber !== '' ||
			prePayCost !== ''
		) {
			dispatch({type: 'SET_EDITED_CARDS', payload: true})
		}
	}, [
		items,
		nameStudent,
		contactFace,
		email,
		linkStudent,
		costStudent,
		commentStudent,
		phoneNumber,
		prePayCost,
	])

	const isLessonEndTimeInPast = (lesson: {
		date: Date
		timeSlot: {
			endTime: {hour: number; minute: number}
		}
	}) => {
		const now = new Date()
		const lessonEndTime = new Date(lesson.date)
		lessonEndTime.setHours(
			lesson.timeSlot.endTime.hour,
			lesson.timeSlot.endTime.minute,
		)
		return lessonEndTime < now
	}
	const [isLoading, setIsLoading] = useState(true)

	interface TimeSlot {
		hour: number
		minute: number
	}

	interface TimeRange {
		startTime: TimeSlot
		endTime: TimeSlot
	}

	const prevItemsRef = useRef<string | null>(null)
	const memoizedItems = useMemo(() => items, [JSON.stringify(items)])

	const updateSourceRef = useRef<'socket' | 'items' | 'initial' | null>(null)

	const syncScheduleWithHistory = (
		oldItems: Item[],
		newItems: Item[],
		currentHistory: HistoryLesson[],
	): HistoryLesson[] => {
		const getDayOfWeek = (date: Date): number => {
			const day = date.getDay()
			return day === 0 ? 6 : day - 1 // Convert to 0-6 where 0 is Monday
		}

		const isTimeInRange = (
			lessonTime: TimeSlot,
			rangeStart: TimeSlot,
			rangeEnd: TimeSlot,
		): boolean => {
			const lessonMinutes = lessonTime.hour * 60 + lessonTime.minute
			const rangeStartMinutes = rangeStart.hour * 60 + rangeStart.minute
			const rangeEndMinutes = rangeEnd.hour * 60 + rangeEnd.minute
			return (
				lessonMinutes >= rangeStartMinutes && lessonMinutes < rangeEndMinutes
			)
		}

		const isTimeSlotChanged = (
			oldTimeSlot: TimeRange,
			newTimeSlot: TimeRange,
		): boolean => {
			return (
				oldTimeSlot.startTime.hour !== newTimeSlot.startTime.hour ||
				oldTimeSlot.startTime.minute !== newTimeSlot.startTime.minute ||
				oldTimeSlot.endTime.hour !== newTimeSlot.endTime.hour ||
				oldTimeSlot.endTime.minute !== newTimeSlot.endTime.minute
			)
		}

		let updatedHistory = [...currentHistory]

		// Process each item to find schedule changes
		newItems.forEach((newItem) => {
			const oldItem = oldItems.find(
				(item) => item.itemName === newItem.itemName,
			)
			if (!oldItem) return

			// Check each day's schedule
			newItem.timeLinesArray.forEach((newTimeLine, dayIndex) => {
				const oldTimeLine = oldItem.timeLinesArray[dayIndex]
				const oldTimeRanges = oldTimeLine.timeRanges || []
				const newTimeRanges = newTimeLine.timeRanges || []

				// Find lessons for this item and day of week
				updatedHistory = updatedHistory.filter((lesson) => {
					if (lesson.itemName !== newItem.itemName) return true

					const lessonDate = new Date(lesson.date)
					if (getDayOfWeek(lessonDate) !== dayIndex) return true

					// Check if lesson time falls within any of the new time ranges
					const lessonStartTime = lesson.timeSlot.startTime
					let keepLesson = false

					for (const newRange of newTimeRanges) {
						if (
							isTimeInRange(
								lessonStartTime,
								newRange.startTime,
								newRange.endTime,
							)
						) {
							keepLesson = true
							break
						}
					}

					return keepLesson
				})

				// Add new lessons for added or modified time ranges
				newTimeRanges.forEach((newRange) => {
					const isNewOrModified = !oldTimeRanges.some(
						(oldRange) => !isTimeSlotChanged(oldRange, newRange),
					)

					if (isNewOrModified) {
						// Generate new lessons for this time range
						let currentDate = new Date(newItem.startLesson)
						const endDate = new Date(newItem.endLesson)

						while (currentDate <= endDate) {
							if (getDayOfWeek(currentDate) === dayIndex) {
								const lessonDate = new Date(currentDate)
								lessonDate.setHours(
									newRange.startTime.hour,
									newRange.startTime.minute,
								)

								// Check if lesson doesn't already exist
								const lessonExists = updatedHistory.some(
									(lesson) =>
										lesson.itemName === newItem.itemName &&
										lesson.date.getTime() === lessonDate.getTime() &&
										isTimeInRange(
											lesson.timeSlot.startTime,
											newRange.startTime,
											newRange.endTime,
										),
								)

								if (!lessonExists) {
									updatedHistory.push({
										date: lessonDate,
										itemName: newItem.itemName,
										isDone: lessonDate < new Date(),
										price: newItem.costOneLesson,
										isPaid: false,
										isCancel: false,
										type: 'lesson',
										timeSlot: {
											startTime: {...newRange.startTime},
											endTime: {...newRange.endTime},
										},
									})
								}
							}
							currentDate = addDays(currentDate, 1)
						}
					}
				})
			})
		})

		// Sort updated history by date
		return updatedHistory.sort((a, b) => a.date.getTime() - b.date.getTime())
	}

	const generateInitialLessons = (items: IItemCard[]): HistoryLesson[] => {
		const now = new Date()
		const lessons: HistoryLesson[] = []

		items.forEach((item) => {
			if (!item.itemName || !item.costOneLesson || !item.timeLinesArray) return

			// Добавляем пробное занятие если оно активно
			if (item.tryLessonCheck && item.trialLessonDate && item.trialLessonTime) {
				const lessonDate = new Date(item.trialLessonDate)
				lessonDate.setHours(
					item.trialLessonTime.startTime.hour,
					item.trialLessonTime.startTime.minute,
				)

				lessons.push({
					date: lessonDate,
					itemName: item.itemName,
					isDone: lessonDate < now,
					price: item.tryLessonCost || item.costOneLesson,
					isPaid: false,
					isCancel: false,
					type: 'lesson',
					timeSlot: {
						startTime: {...item.trialLessonTime.startTime},
						endTime: {...item.trialLessonTime.endTime},
					},
					isTrial: true,
				})
			}

			// Add regular lessons
			const differenceDays = differenceInDays(item.endLesson, item.startLesson)
			const dateRange = Array.from({length: differenceDays + 1}, (_, i) =>
				addDays(new Date(item.startLesson), i),
			)

			dateRange.forEach((date) => {
				const dayOfWeek = getDay(date)
				const daySchedule = item.timeLinesArray[dayOfWeek]

				if (daySchedule?.timeRanges?.length) {
					daySchedule.timeRanges.forEach((timeRange) => {
						const lessonDate = new Date(date)
						lessonDate.setHours(
							timeRange.startTime.hour,
							timeRange.startTime.minute,
						)

						lessons.push({
							date: lessonDate,
							itemName: item.itemName,
							isDone: lessonDate < now,
							price: item.costOneLesson,
							isPaid: false,
							isCancel: false,
							type: 'lesson',
							timeSlot: {
								startTime: {...timeRange.startTime},
								endTime: {...timeRange.endTime},
							},
						})
					})
				}
			})

			// Add trial lesson if configured
			if (item.tryLessonCheck && item.trialLessonDate && item.trialLessonTime) {
				lessons.push({
					date: new Date(item.trialLessonDate),
					itemName: item.itemName,
					isDone: item.trialLessonDate < now,
					price: item.tryLessonCost || item.costOneLesson,
					isPaid: false,
					isCancel: false,
					type: 'lesson',
					timeSlot: {
						startTime: {...item.trialLessonTime.startTime},
						endTime: {...item.trialLessonTime.endTime},
					},
					isTrial: true,
				})
			}
		})

		return lessons.sort((a, b) => a.date.getTime() - b.date.getTime())
	}

	// В компоненте AddStudent
	useEffect(() => {
		if (!isEditMode && items.length > 0) {
			// Для новой карточки обновляем историю для всех предметов
			items.forEach((item) => {
				if (item.itemName && item.costOneLesson) {
					updateHistory(items, item.itemId)
				}
			})
		}
	}, [isEditMode, items, updateHistory])

	useEffect(() => {
		if (data) {
			updateSourceRef.current = 'initial'
			const student = data.students?.[0]
			if (student) {
				// Используем combinedHistory из группы
				if (data.combinedHistory) {
					putCombinedHistory(data.combinedHistory)
				}

				// Обновляем остальные данные студента
				setNameStudent(student.nameStudent)
				setCostOneLesson(student.costOneLesson)
				setPrePayCost(student.prePayCost)
				setPrePayDate(student.prePayDate)
				setContactFace(student.contactFace)
				setPhoneNumber(student.phoneNumber)
				setEmail(student.email)
				setLinkStudent(student.linkStudent)
				setCommentStudent(student.commentStudent)
				setCostStudent(student.costStudent)
				setFiles(student.filesData)
				setAudios(student.audiosData)
				setMediaFiles(student.mediaFiles || [])
				setItems(data.items || [])


			}
			setIsLoading(false)
		}
	}, [data])

	const [autoSwitched, setAutoSwitched] = useState(false);

	useEffect(() => {
	  // Авто-переключение происходит, если карточек больше одной,
	  // индекс текущего предмета равен 0 и авто-переключение ещё не выполнено
	  if (!autoSwitched && items.length > 1 && currentItemIndex === 0) {
		const timer = setTimeout(() => {
		  setCurrentItemIndex(1);
		  setAutoSwitched(true); // Фиксируем, что авто-переключение уже было
		}, 1000);
		return () => clearTimeout(timer);
	  }
	}, [items, currentItemIndex, autoSwitched]);
	
	  

	useEffect(() => {
		setTimeout(() => {
			dispatch({type: 'SET_EDITED_CARDS', payload: false})
		}, 1000)
	}, [])
	useEffect(() => {
		console.log(editedCards, 'editedCards')
	}, [data, editedCards])

	useEffect(() => {
		if (prePayList?.length > 0) {
			const sum = prePayList.reduce((acc, item) => acc + Number(item.cost), 0)
			setPrePayCost(sum.toString())
		}
	}, [prePayList])

	useEffect(() => {
		// Handle prepayments immediately, regardless of items
		if (!!prePayList) {
			const sum = prePayList.reduce((acc, item) => acc + Number(item.cost), 0)
			setPrePayCost(sum.toString())

			// Update combined history with just prepayments if no items exist yet
			if (items.length === 0) {
				updateCombinedHistory([], prePayList)
			}
		}
	}, [prePayList])

	const findNearestDateElement = () => {
		const todayFormat = formatDate(new Date(Date.now()))
		const today = new Date()
		let nearestDateDiff = Infinity
		let nearestDateElement = null

		combinedHistory.forEach((lesson) => {
			const lessonDate = new Date(lesson.date)
			const diff = Math.abs(today.getTime() - lessonDate.getTime())
			const lessonDateFormat = formatDate(lesson.date)
			if (lessonDateFormat === todayFormat) {
				nearestDateElement = document.getElementById(
					`history-data-${lessonDateFormat}`,
				)
			} else if (diff < nearestDateDiff) {
				nearestDateDiff = diff
				nearestDateElement = document.getElementById(
					`history-data-${lessonDateFormat}`,
				)
			}
		})

		return nearestDateElement
	}
	useEffect(() => {
		if (open && listRef.current) {
			const nearestDateElement = findNearestDateElement()
			if (nearestDateElement) {
				nearestDateElement.scrollIntoView({behavior: 'smooth', block: 'center'})
			}
		}
	}, [open])

	const debouncedSetItems = useCallback(
		debounce((newItems) => {
			setItems(newItems)
		}, 300),
		[],
	)

	useEffect(() => {
		if (memoizedItems.length > 0) {
			const transformedItems = memoizedItems.map((item) => ({
				itemName: item.itemName,
				costOneLesson: item.costOneLesson,
				startLesson: new Date(item.startLesson),
				endLesson: new Date(item.endLesson),
				timeLinesArray: item.timeLinesArray.map((timeline) => ({
					...timeline,
					timeRanges: timeline.timeRanges || [
						{
							startTime: timeline.startTime,
							endTime: timeline.endTime,
						},
					],
				})),
				tryLessonCheck: item.tryLessonCheck,
				trialLessonDate: item.trialLessonDate,
				trialLessonTime: item.trialLessonTime,
				tryLessonCost: item.tryLessonCost,
			}))

			// Обновляем историю только если это не сокет-обновление
			if (updateSourceRef.current !== 'socket') {
				updateSourceRef.current = 'items'
				if (isEditMode) updateHistory(transformedItems)
			}
			updateSourceRef.current = null
		}
	}, [memoizedItems, updateHistory])

	useEffect(() => {
		const handleScheduleUpdate = (response: any) => {
			if (response.success) {
				// Перезагружаем данные студента
				socket.emit('getGroupByStudentId', {
					token: token,
					studentId: currentOpenedStudent,
				})
			}
		}

		socket.on(
			`updateStudentSchedule_${currentOpenedStudent}`,
			handleScheduleUpdate,
		)

		return () => {
			socket.off(
				`updateStudentSchedule_${currentOpenedStudent}`,
				handleScheduleUpdate,
			)
		}
	}, [currentOpenedStudent, token])

	useEffect(() => {
		if (currentOpenedStudent && token) {
			const handleSchedules = (schedules) => {
				console.log('Socket update received:', schedules)
				if (schedules?.items) {
					updateSourceRef.current = 'socket'
					debouncedSetItems((prevItems) => {
						const itemsStr = JSON.stringify(schedules.items)
						const prevItemsStr = JSON.stringify(prevItems)
						return itemsStr !== prevItemsStr ? schedules.items : prevItems
					})
				}
			}

			socket.on('getAllStudentSchedules', handleSchedules)

			return () => {
				socket.off('getAllStudentSchedules', handleSchedules)
				debouncedSetItems.cancel()
			}
		}
	}, [currentOpenedStudent, token, debouncedSetItems])

	const handleAddStudentExit = () => {
		console.log('addStudent')
		dispatch({
			type: 'SET_CURRENT_OPENED_STUDENT',
			payload: '',
		})

		const handlePrePayAdd = (
			prePayCostValue: string,
			prePayDate: Date,
			prePayId?: number,
		) => {
			if (prePayCostValue !== '') {
				const newPrePayId = prePayId || Date.now()
				// Добавляем предоплату независимо от режима редактирования
				addPrePay(prePayCostValue, prePayDate, newPrePayId)
				setPrePayCostValue('')
				setPrePayDate(new Date())
			}
		}

		dispatch({
			type: 'SET_LEFT_MENU_PAGE',
			payload: ELeftMenuPage.MainPage,
		})
		socket.emit('getGroupByStudentId', {
			token: token,
			studentId: '',
		})
		dispatch({
			type: 'SET_PAGE_POPUP_EXIT',
			payload: EPagePopUpExit.None,
		})
		dispatch({
			type: 'SET_ADD_STUDENT_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_GROUP_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_CLIENT_EXIT',
			payload: false,
		})
		setTimeout(() => {
			dispatch({
				type: 'SET_LEFT_MENU_PAGE',
				payload: ELeftMenuPage.AddStudent,
			})
		}, 10)
	}

	const handleAddGroupExit = () => {
		console.log('addGroup')
		dispatch({
			type: 'SET_CURRENT_OPENED_GROUP',
			payload: '',
		})
		socket.emit('getGroupById', {token: token, groupId: ''})
		dispatch({
			type: 'SET_LEFT_MENU_PAGE',
			payload: ELeftMenuPage.MainPage,
		})
		dispatch({
			type: 'SET_PAGE_POPUP_EXIT',
			payload: EPagePopUpExit.None,
		})
		dispatch({
			type: 'SET_ADD_STUDENT_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_GROUP_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_CLIENT_EXIT',
			payload: false,
		})
		setTimeout(() => {
			dispatch({
				type: 'SET_LEFT_MENU_PAGE',
				payload: ELeftMenuPage.AddGroup,
			})
		}, 10)
	}

	const handleAddClientExit = () => {
		console.log('addClient')
		dispatch({
			type: 'SET_CURRENT_OPENED_CLIENT',
			payload: '',
		})
		socket.emit('getClientById', {token: token, clientId: ''})
		dispatch({
			type: 'SET_LEFT_MENU_PAGE',
			payload: ELeftMenuPage.MainPage,
		})
		dispatch({
			type: 'SET_PAGE_POPUP_EXIT',
			payload: EPagePopUpExit.None,
		})
		dispatch({
			type: 'SET_ADD_STUDENT_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_GROUP_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_CLIENT_EXIT',
			payload: false,
		})
		setTimeout(() => {
			dispatch({
				type: 'SET_LEFT_MENU_PAGE',
				payload: ELeftMenuPage.AddClient,
			})
		}, 10)
	}

	return (
		<>
			{/* <button
				className={s.CloseButton}
				style={{display: loading && 'none'}}
				onClick={() => {
					if (!isEditMode) {
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
				}}>
				<CloseIcon className={s.CloseIcon} />
			</button> */}
			<div className={s.wrapper}>
				{!loading ? (
					<>
						<div className={s.Header}>
							<div className="flex items-center w-full  rounded-md gap-2 border border-green-500 px-0.5 py-1 justify-between">
								{/* <div className={s.dataSlidePicker}>
									<button
										onClick={prevStud}
										style={{
											backgroundColor: currentStudPosition === 0 && '#eee',
										}}
										className={s.btn}>
										<span>
											<Arrow direction={ArrowType.left} />
										</span>
									</button>
									<p className={s.btnText}>
										Карточка ученика{' '}
										{currentOpenedStudent
											? `${currentStudPosition + 1}/${allIdStudent.length}`
											: `${allIdStudent.length + 1}/${allIdStudent.length + 1}`}
									</p>
									<button
										onClick={nextStud}
										style={{
											backgroundColor:
												currentStudPosition === allIdStudent.length - 1 &&
												'#eee',
										}}
										className={s.btn}>
										<span>
											<Arrow direction={ArrowType.right} />
										</span>
									</button>
								</div> */}
								<div className="flex items-center bg-zinc-50 justify-between w-full mb-2 p-4 border-[2px] border-solid border-green-500 rounded-lg outline-none ring-0">
									<div className="flex items-center w-full gap-2 justify-between">
										<Button variant="ghost" size="icon" onClick={prevStud}>
											<ChevronLeft className="h-5 w-5" />
										</Button>
										<h2 className="text-lg font-medium">
											Ученик{' '}
											{currentOpenedStudent
												? `${currentStudPosition + 1}/${allIdStudent.length}`
												: `${allIdStudent.length + 1}/${allIdStudent.length + 1}`}
										</h2>
										<Button variant="ghost" size="icon" onClick={nextStud}>
											<ChevronRight className="h-5 w-5" />
										</Button>
									</div>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => {
											if (!isEditMode) {
												dispatch({
													type: 'SET_PAGE_POPUP_EXIT',
													payload: 'Exit',
												})
											} else {
												dispatch({
													type: 'SET_LEFT_MENU_PAGE',
													payload: 'MainPage',
												})
											}
										}}
										className="hover:text-red-500">
										<X className="h-5 w-5" />
									</Button>
								</div>
							</div>
							<div className={s.StudNameHead}>
								<div className={s.StudentCardName}>
									<div className={s.StudentCardInput}>
										<TextAreaInputBlock
											placeholder="Имя студента"
											value={nameStudent}
											disabled={isEditMode}
											onChange={(e) =>
												setNameStudent(
													e.target.value.charAt(0).toUpperCase() +
														e.target.value.slice(1).toLowerCase(),
												)
											}
											textIndent="40px"
											firstMinSymbols={30}
										/>
									</div>
									<p>*</p>
								</div>

								{/* <Line width="100%" className={s.Line} /> */}
							</div>
						</div>
						<div className={s.wrapperMenu}>
							<div className={s.StudentInput}>
								<div className={s.StudentCard}>
									<TextAreaInputBlock
										title="Контактное лицо:"
										value={contactFace}
										disabled={isEditMode}
										onChange={(e) => setContactFace(e.target.value)}
										textIndent="140px"
										firstMinSymbols={20}
									/>
								</div>

								<Line width="100%" className={s.Line} />
								<div className={s.StudentCard}>
									<p>Тел:</p>
									<InputMask
										type="text"
										mask="+7 (999) 999-99-99"
										maskChar="_"
										value={phoneNumber}
										disabled={isEditMode}
										onChange={(e: any) => setPhoneNumber(e.target.value)}
										placeholder="+7 (___) ___-__"
									/>
									<IconsPhone phoneNumber={phoneNumber} email={email} />
								</div>
								<Line width="100%" className={s.Line} />
								<div className={s.StudentCard}>
									<p>Эл. почта:</p>
									<input
										type="email"
										value={email}
										disabled={isEditMode}
										onChange={(e) => setEmail(e.target.value)}
									/>
								</div>
								<Line width="100%" className={s.Line} />
								{/* <TextAreaInputBlock
									title="Источник:"
									value={linkStudent}
									disabled={isEditMode}
									onChange={(e) => {
										setLinkStudent(e.target.value)
									}}
									textIndent="80px"
									firstMinSymbols={27}
								/> */}
								{/* <Line width="100%" className={s.Line} /> */}
								<div className={`${s.StudentCard} `}>
									<p>Расходы по ученику:</p>
									<Input
										width={`${costStudent.length}ch`}
										num
										type="text"
										value={costStudent}
										disabled={isEditMode}
										onChange={(e: any) => setCostStudent(e.target.value)}
										style={{borderBottom: '1px solid #e2e2e9'}}
									/>
									<p>₽</p>
								</div>
								<Line width="100%" className={s.Line} />
								<div className={`flex flex-col items-center w-[93%]`}>
									<div className="flex items-center justify-between w-full p-4 border-b">
										<div className="flex items-center gap-3">
											<p className="text-md font-medium">Пополнение</p>
											<span
												className={`text-md font-semibold ${
													balance < 0 ? 'text-red-500' : 'text-green-500'
												}`}>
												{balance} ₽
											</span>
										</div>

										<Button
											variant="default"
											size="icon"
											disabled={isEditMode}
											className="w-24"
											onClick={() => setIsBalanceOpen(!isBalanceOpen)}>
											<span>Пополнить</span>
										</Button>
									</div>

									{isBalanceOpen && (
										<div className="p-4 flex items-center gap-3 bg-white rounded-md">
											<MiniCalendar
												disabled={isEditMode}
												value={prePayDate}
												onChange={handlePrePayDate}
												calendarId="prePay"
											/>

											<div className="flex items-center gap-2">
												<Input
													num
													className={`${s.PrePayCostInput} w-24`}
													type="text"
													value={prePayCostValue}
													disabled={isEditMode}
													onChange={(e) => setPrePayCostValue(e.target.value)}
													onKeyDown={(e) => {
														if (e.key === 'Enter' && prePayCost !== '') {
															addPrePayList(
																prePayCostValue,
																prePayDate,
																prePayList.length,
															)
														}
													}}
												/>

												<span className="text-gray-600">₽</span>

												<button
													onClick={() =>
														addPrePayList(
															prePayCostValue,
															prePayDate,
															prePayList.length,
														)
													}
													className="flex items-center justify-center hover:bg-gray-100 rounded-full p-1">
													<CheckCircleIcon className="w-6 h-6 text-green-500" />
												</button>
											</div>
										</div>
									)}
								</div>
								<Line width="100%" className={s.Line} />
								<mui.ListItemButton onClick={handleClick}>
									<p className={s.MuiListItemText}>История занятий и оплат</p>
									{open ? <ExpandLess /> : <ExpandMore />}
								</mui.ListItemButton>
								<mui.Collapse
									className={s.MuiCollapse}
									in={open}
									timeout="auto"
									ref={listRef}
									unmountOnExit>
									<mui.List
										className={s.MuiList}
										component="div"
										disablePadding
										ref={collapseRef}>
										<div className={s.ListObjectWrapper}>
											{combinedHistory.length > 0 ? (
												<>
													{combinedHistory.map((item, index) => (
														<div
															id={`history-data-${formatDate(item.date)}`}
															key={index}
															className={`${s.ListObject} ${item.isCancel} ${item.type === 'lesson' && item.isCancel ? s.canceled : ''}`}>
															{item.type === 'lesson' ? (
																<>
																	<p
																		style={{
																			fontWeight: '500',
																			fontSize: '14px',
																			marginRight: '5px',
																			display: 'flex',
																			flexDirection: 'row',
																			alignItems: 'center',
																		}}>
																		{item.isTrial && (
																			<p className="text-sm absolute right-20 px-0.5 py-1 bg-blue-500/30 rounded-md">
																				Пробное
																			</p>
																		)}
																		<div
																			style={{
																				backgroundColor:
																					item.type === 'lesson'
																						? hashToColor(
																								hashString(item.itemName || ''),
																							)
																						: '#4CAF50', // Зеленый цвет для предоплат
																				width: '10px',
																				height: '35px',
																				borderTopLeftRadius: '8px',
																				borderBottomLeftRadius: '8px',
																				marginRight: '5px',
																			}}></div>
																		{formatDate(item.date)}
																	</p>
																	<CheckBox
																		onChange={(e) => e.preventDefault()}
																		size="16px"
																		disabled={item.isCancel}
																		checked={item.isDone}
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
																		{item.itemName}
																	</p>
																	<p
																		style={{
																			fontSize: '14px',
																			width: '100px',
																			textAlign: 'end',
																			textOverflow: 'ellipsis',
																		}}>
																		{item.price || 0}₽
																	</p>
																	<CheckBox
																		onChange={(e) => e.preventDefault()}
																		size="16px"
																		checked={item.isPaid}
																		disabled={item.isCancel}
																	/>
																	{item.isCancel && (
																		<p
																			style={{
																				position: 'absolute',
																				left: '100px',
																				fontWeight: 'bold',
																				fontSize: '16px',
																				color: 'red',
																			}}>
																			Отменено
																		</p>
																	)}
																</>
															) : (
																<>
																	<PrePayRow
																		id={item.id}
																		cost={item.cost}
																		date={item.date}
																		isEdit={isEditMode}
																		isEditing={editId === item.id}
																		onEdit={() => {
																			startEditing(item.id)
																		}}
																		onEditDone={(newDate, newCost) =>
																			handlePrePayEdit(
																				item.id,
																				newDate,
																				newCost,
																			)
																		}
																		onDelete={() => handlePrePayDelete(item.id)}
																		finishEditing={finishEditing}
																		onAcceptDelete={() => startDelete(item.id)}
																		finishDelete={finishDelete}
																		isDeleted={deletedId === item.id}
																	/>
																</>
															)}
														</div>
													))}
												</>
											) : (
												<div className={s.ListNoInfo}>
													<p>Информации нет</p>
												</div>
											)}
										</div>
									</mui.List>
								</mui.Collapse>
								<Line width="100%" className={s.Line} />

								<Textarea
									className="mt-1 p-2 w-[90%] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
									value={commentStudent}
									placeholder="Комментарий"
									disabled={isEditMode}
									onChange={(e) => {
										setCommentStudent(e.target.value)
									}}
								/>
								<Line width="100%" className={s.Line} />
							</div>

							{/* <RecordNListen
								alreadyRecorded={audios}
								callback={handleAddAudio}
								className={s.RecordNListen}
								typeCard="student"
							/> */}

							{/* use AudioRecorder instead */}
							<div className="mb-6 py-6">
								<AudioRecorder
									files={mediaFiles}
									onAudioRecord={handleAudioRecord}
									onItemRemove={handleMediaRemove}
								/>
							</div>

							<div className="flex items-center bg-zinc-50 justify-between my-5 p-4 border-2 border-solid border-green-500 rounded-lg outline-none ring-0">
								<div className="w-full flex justify-center items-center">
									<div className="flex items-center  justify-between px-4 pt-2 truncate border-2 border-green-500 rounded-lg mb-2">
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												currentItemIndex > 0 &&
												setCurrentItemIndex(currentItemIndex - 1)
											}>
											<ChevronLeft className="h-5 w-5" />
										</Button>
										<h2 className="text-lg font-medium">
											Предмет {currentItemIndex + 1} / {items.length}
										</h2>
										<Button
											variant="ghost"
											size="icon"
											onClick={() =>
												currentItemIndex < items.length - 1 &&
												setCurrentItemIndex(currentItemIndex + 1)
											}>
											<ChevronRight className="h-5 w-5" />
										</Button>
									</div>
								</div>
								<Button
									variant="ghost"
									disabled={isEditMode}
									onClick={() => addItem()}
									className="ml-4">
									<img src={Plus} alt={Plus} />
								</Button>
							</div>
							<div className={s.ItemWrapper}>
								{/* <Line width="100%" className={s.Line} /> */}

								{items.map((item, index) => (
									<>
										<div
											key={index}
											className={
												currentItemIndex === index ? s.ItemActive : s.ItemMain
											}>
											<div className={s.StudentCard}>
												<TextAreaInputBlock
													// title="Контактное лицо:"
													value={
														item.itemName
															? `${item.itemName[0].toUpperCase()}${item.itemName
																	.slice(1)
																	.toLowerCase()}`
															: ''
													}
													disabled={isEditMode}
													onChange={(e) =>
														changeItemValue(
															index,
															'itemName',
															e.target.value.toLowerCase(),
														)
													}
													textIndent="0px"
													firstMinSymbols={56}
													placeholder="Наименование"
												/>
												<p className="text-red-500">*</p>
											</div>
											<Line width="100%" className={s.Line} />
											<div className={s.StudentCardCheckBox}>
												<div className={s.CardCheckBox}>
													<p>Пробное занятие:</p>
												</div>
												<CheckBox
													className={s.CheckBox}
													size="20px"
													checked={item.tryLessonCheck!}
													onChange={(e) =>
														changeItemValue(
															index,
															'tryLessonCheck',
															e.target.checked,
														)
													}
												/>
												<p>Стоимость:</p>
												<Input
													num
													type="text"
													value={item.tryLessonCost!}
													placeholder="0"

													disabled={isEditMode}
													onChange={(e) => {
														changeItemValue(index, 'tryLessonCheck', true)

														changeItemValue(
															index,
															'tryLessonCost',
															e.target.value,
														)
														console.log(item.tryLessonCost, e.target.value)
													}}
												/>
												<p>₽</p>
											</div>

											{item.tryLessonCheck && (
												<div className="flex flex-col gap-2 w-full">
													<div className="flex items-center gap-4">
														<MiniCalendar
															disabled={isEditMode}
															value={item.trialLessonDate || new Date()} // Используем значение из items
															onChange={(newDate) => {
																changeItemValue(
																	index,
																	'trialLessonDate',
																	newDate,
																)
																updateHistory(items) // Принудительно обновляем историю
															}}
															calendarId={`trialLesson_${index}`}
														/>

														<div className="flex items-center gap-2">
															<button
																onClick={() => openPicker()}
																disabled={isEditMode}
																className="px-4 py-2 bg-white border rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50">
																{item.trialLessonTime
																	? `${item.trialLessonTime.startTime.hour}:${item.trialLessonTime.startTime.minute.toString().padStart(2, '0')} - ${item.trialLessonTime.endTime.hour}:${item.trialLessonTime.endTime.minute.toString().padStart(2, '0')}`
																	: 'Выбрать время'}
															</button>
														</div>

														{!isEditMode && isOpen && (
															<TimeRangePicker
																singleRange={true}
																existingRanges={ranges}
																onTimeRangeSelect={(selectedRanges) => {
																	if (selectedRanges.length > 0) {
																		const [startHour, startMinute] =
																			selectedRanges[0].startTime
																				.split(':')
																				.map(Number)
																		const [endHour, endMinute] =
																			selectedRanges[0].endTime
																				.split(':')
																				.map(Number)

																		changeItemValue(index, 'trialLessonTime', {
																			startTime: {
																				hour: startHour,
																				minute: startMinute,
																			},
																			endTime: {
																				hour: endHour,
																				minute: endMinute,
																			},
																		})
																		updateHistory(items)
																	}
																}}
																onClose={closePicker}
																className="z-50"
															/>
														)}
													</div>
												</div>
											)}
											<Line width="100%" className={s.Line} />
											<div className={s.StudentCardCheckBox}>
												<div className={s.CardCheckBoxLevel}>
													<p>Текущий уровень:</p>
												</div>

												<NowLevel
													onChange={(val) =>
														changeItemValue(index, 'nowLevel', val)
													}
													value={item.nowLevel!}
													disabled={isEditMode}
													amountInputs={5}
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
													<p style={{marginRight: '50px'}}>Место проведения:</p>

													<mui.Select
														className={s.muiSelect__menu}
														variant={'standard'}
														disabled={isEditMode}
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

														<mui.MenuItem value={4}>
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
													</mui.Select>
												</div>
											</div>
											{!(item.typeLesson == 2 || item.typeLesson == 4) ? (
												<Line width="100%" className={s.Line} />
											) : null}
											{item.typeLesson === 2 || item.typeLesson === 4 ? (
												<>
													<div className={s.StudentCard}>
														<TextAreaInputBlock
															title="Адрес:"
															value={item.placeLesson!}
															disabled={isEditMode}
															onChange={(e) => {
																changeItemValue(
																	index,
																	'placeLesson',
																	e.target.value,
																)
															}}
															textIndent="150px"
															// firstMinSymbols={31}
														/>
													</div>
													<Line width="100%" className={s.Line} />
												</>
											) : null}
											<div className={s.StudentCard}>
												<p>Стоимость одного занятия:</p>
												<Input
													width={`${item.costOneLesson.length}ch`}
													num
													placeholder='0'
													type="text"
													value={item.costOneLesson}
													disabled={isEditMode}
													onChange={(e) => {
														changeItemValue(
															index,
															'costOneLesson',
															e.target.value,
														)
														// handlePrePayment()
													}}
													style={{borderBottom: '1px solid #e2e2e9'}}
												/>
												<p>₽</p>
											</div>
											<Line width="100%" className={s.Line} />
											<div className={s.StudentCard}>
												<p>Продолжительность занятия:</p>
												<Input
													num
													disabled={isEditMode}
													type="text"
													value={item.lessonDuration || ''}
													onChange={(e: any) => {
														handleLessonDurationChange(e)
														// handlePrePayment()
													}}
													style={{borderBottom: '1px solid #e2e2e9'}}
												/>
												<p>мин</p>
											</div>
											<Line width="100%" className={s.Line} />
											<div className={s.StudentCard}>
												<p>Начало занятий:</p>
												{/* <LocalizationProvider
											dateAdapter={AdapterDateFns}
											adapterLocale={ru}>
											<DatePicker
												slots={{
													layout: StyledPickersLayout,
													calendarHeader: PickersCalendarHeader,
												}}
												slotProps={{
													calendarHeader: {
														slots: {
															switchViewButton: CalendarCloseButton,
														},
													},
												}}
												sx={{
													input: {
														paddingTop: '0px',
														paddingBottom: '0px',
													},
												}}
												value={item.startLesson}
												disabled={isEditMode}
												onChange={(newValue) => {
													changeItemValue(
														index,
														'startLesson',
														String(newValue!),
													)
												}}
												timezone="system"
												showDaysOutsideCurrentMonth
											/>
										</LocalizationProvider> */}
												<MiniCalendar
													disabled={isEditMode || currentOpenedStudent}
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
											</div>
											<div className={s.ScheduleWrapper}>
												<div className={s.ScheduleHeader}>
													<p>Расписание</p>
												</div>
												<Line width="324px" className={s.LineGreen} />
												<Schedule
													currentItemIndex={currentItemIndex}
													items={items}
													changeItemValue={changeItemValue}
													isEditMode={isEditMode}
													handleClick_dp={handleClick_dp}
													handleClick_delete={handleClick_delete}
													activeTimePicker={activeTimePicker}
													setActiveTimePicker={setActiveTimePicker}
													handleTimeChange={handleTimeChange}
													freeSlots={freeSlots}
													busyOnlineSlots={busyOnlineSlots}
												/>
											</div>
										</div>
									</>
								))}
								<div className="h-10"></div>
								{/* <StudentMedia
									files={mediaFiles}
									isExpanded={isMediaExpanded}
									onToggle={() => setIsMediaExpanded(!isMediaExpanded)}
									onFileUpload={handleFileUpload}
									onLinkAdd={handleLinkAdd}
									onAudioRecord={handleAudioRecord}
									onItemRemove={handleMediaRemove}
									sortBy={mediaSortBy}
									onSortChange={setMediaSortBy}
								/> */}

								{/* use FileAndLinkUploader instead */}
								<div className="mb-6 py-6">
									<AudioRecorder
										files={mediaFiles}
										onAudioRecord={handleAudioRecord}
										onItemRemove={handleMediaRemove}
									/>
								</div>

								<FileAndLinkUploader
									files={mediaFiles}
									onFileUpload={handleFileUpload}
									onLinkAdd={handleLinkAdd}
									onAudioRecord={handleAudioRecord}
									onItemRemove={handleMediaRemove}
									sortBy={mediaSortBy}
									onSortChange={setMediaSortBy}
								/>

								{errorList.length > 0 && (
									<div className={s.ErrorList}>
										<p>
											Данное время занято:{' '}
											{errorList.map((i) => i[0].day)[0] + ' '}
											{errorList.map((i) => i[0].timeLines)[0][0].time}
										</p>
									</div>
								)}
							</div>
						</div>
						<div className={s.FooterWrapper}>
							<div className={s.FooterButton}>
								<div className={s.EditNSave}>
									<button
										disabled={currentOpenedStudent === ''}
										className={`${s.Edit} ${isEditMode ? s.Save : ''}`}
										onClick={() => {
											setIsEditMode(!isEditMode)
											// dispatch({type: 'SET_EDITED_CARDS', payload: !isEditMode})
										}}>
										<p>Редактировать</p>
									</button>
									<button
										onClick={sendData}
										className={!isEditMode ? s.Save : s.SaveWhite}>
										<p>Сохранить</p>
									</button>
								</div>
								<div className={s.ArchiveNDelete}>
									<button
										disabled={currentOpenedStudent === ''}
										className={s.Archive}
										onClick={handleToArchive}>
										<p>В архив</p>
									</button>
									<button
										ref={deleteButtonRef}
										disabled={currentOpenedStudent === ''}
										className={s.Delete}
										onClick={(e) => {
											e.stopPropagation() // Предотвращаем всплытие события
											setShowDeleteConfirm(true)
										}}>
										<p>Удалить</p>
									</button>

									{/* Добавьте этот код после закрывающего тега FooterWrapper */}
									{showDeleteConfirm && (
										<DeleteConfirmation
											buttonRef={deleteButtonRef}
											onDelete={() => {
												socket.emit('deleteStudent', {
													token: token,
													id: currentOpenedStudent,
												})
												setShowDeleteConfirm(false)
												window.location.reload()
											}}
											onCancel={() => {
												setShowDeleteConfirm(false)
											}}
										/>
									)}
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
							console.log('Click Yes')
							if (addStudentExit) {
								console.log('if addStud')
								handleAddStudentExit()
							}
							if (addGroupExit) {
								console.log('if addGroup')
								handleAddGroupExit()
							}
							if (addClientExit) {
								console.log('if addClient')
								handleAddClientExit()
							}
							if (!addStudentExit && !addGroupExit && !addClientExit) {
								console.log('not if')
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
							}
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

export default AddStudent