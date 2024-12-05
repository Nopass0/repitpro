import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import ScheduleIcon from '@mui/icons-material/Schedule'
import * as mui from '@mui/material'
import {useEffect, useRef, useState} from 'react'
import InputMask from 'react-input-mask'
import {useDispatch, useSelector} from 'react-redux'
import Plus from '../../assets/ItemPlus.svg'
import {StudentMedia} from '../StudentMedia'
import socket, {isServer} from '../../socket'
import {
	ELeftMenuPage,
	EPagePopUpExit,
	IItemCard,
	IlinksArray,
	IPrePayList,
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
			addPrePay(prePayCostValue, prePayDate, newPrePayId) // используем функцию из хука
			setPrePayList((prevList) => [
				...(prevList || []),
				{
					cost: prePayCostValue,
					date: prePayDate,
					id: newPrePayId,
				},
			])
			setPrePayCostValue('')
			setPrePayDate(new Date())
		}
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

	const formatDate = (date: Date) => {
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = String(date.getFullYear()).slice(-2) // Take last 2 digits of the year

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
			})
	}, [items])

	const [activeTimePicker, setActiveTimePicker] = useState<{
		itemIndex: number
		timelineId: number | null
	}>({
		itemIndex: -1,
		timelineId: null,
	})

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

	//change item function by name of value
	const changeItemValue = (
		itemIndex: number,
		name: string,
		value: string | boolean | number | Date | null,
	) => {
		setItems((items: IItemCard[]) =>
			items.map((item, index) =>
				index === itemIndex ? {...item, [name]: value} : item,
			),
		)
	}

	// const sendData = () => {
	// 	setLoading(true)
	// 	console.log(
	// 		{
	// 			nameStudent,
	// 			contactFace,
	// 			email,
	// 			linkStudent,
	// 			costStudent,
	// 			commentStudent,
	// 			prePayCost,
	// 			prePayDate,
	// 			costOneLesson,
	// 			items,
	// 			audios,
	// 			token,
	// 			files,
	// 			phoneNumber,
	// 		},
	// 		'sendData',
	// 	)
	// 	if (currentOpenedStudent !== '') {
	// 		socket.emit('updateStudentAndItems', {
	// 			id: currentOpenedStudent,
	// 			nameStudent,
	// 			contactFace,
	// 			email,
	// 			linkStudent,
	// 			costStudent,
	// 			commentStudent,
	// 			prePayCost,
	// 			prePayDate,
	// 			costOneLesson,
	// 			files,
	// 			audios,
	// 			historyLessons: historyLesson,

	// 			items,
	// 			token,
	// 			phoneNumber,
	// 			prePay: prePayList,
	// 		})

	// 		socket.emit('createLink', {
	// 			tag: 'addStudent',
	// 			linkedId: currentOpenedStudent,
	// 			links: links,
	// 			token: token,
	// 		})
	// 		window.location.reload()
	// 	} else {
	// 		socket.emit('addStudent', {
	// 			nameStudent,
	// 			contactFace,
	// 			email,
	// 			linkStudent,
	// 			historyLessons: historyLesson,
	// 			costStudent,
	// 			commentStudent,
	// 			prePayCost,
	// 			prePayDate,
	// 			files,
	// 			audios,
	// 			costOneLesson,
	// 			items,
	// 			token,
	// 			phoneNumber,
	// 			prePay: prePayList,
	// 		})

	// 		socket.emit('createLink', {
	// 			tag: 'addStudent',
	// 			linkedId: currentOpenedStudent,
	// 			links: links,
	// 			token: token,
	// 		})
	// 	}
	// }

	const sendData = () => {
		setLoading(true)

		// Удаляем предыдущие слушатели перед добавлением нового
		socket.off('addStudent')

		// Устанавливаем новый слушатель
		socket.once('addStudent', (data) => {
			if (data?.ok === true) {
				window.location.reload()
				return
			}
			alert(data?.error)
			setLoading(false)
		})

		// Отправляем данные
		if (currentOpenedStudent !== '') {
			socket.emit('updateStudentAndItems', {
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
				historyLessons: historyLesson,
				items,
				token,
				phoneNumber,
				prePay: prePayList,
				mediaFiles,
			})

			socket.emit('createLink', {
				tag: 'addStudent',
				linkedId: currentOpenedStudent,
				links: links,
				token: token,
			})
		} else {
			console.log('sendData', {
				nameStudent,
				contactFace,
				email,
				linkStudent,
				historyLessons: historyLesson,
				combinedHistory: combinedHistory,
				costStudent,
				commentStudent,
				prePayCost,
				prePayDate,
				files,
				audios,
				costOneLesson,
				items,
				token,
				phoneNumber,
				prePay: prePayList,
				mediaFiles,
			})
			socket.emit('addStudent', {
				nameStudent,
				contactFace,
				email,
				linkStudent,
				historyLessons: combinedHistory.filter((item) => item.type == 'lesson'),
				combinedHistory: combinedHistory,

				costStudent,
				commentStudent,
				prePayCost,
				prePayDate,
				files,
				audios,
				costOneLesson,
				items,
				token,
				phoneNumber,
				prePay: prePayList,
				mediaFiles,
			})

			socket.emit('createLink', {
				tag: 'addStudent',
				linkedId: currentOpenedStudent,
				links: links,
				token: token,
			})
		}
	}

	const [errorList, setErrorList] = useState<string[]>([])

	const [open, setOpen] = useState(false)

	const [showEndTimePicker, setShowEndTimePicker] = useState(-1)

	const [lessonDuration, setLessonDuration] = useState()

	const {
		combinedHistory,
		balance,
		updateHistory,
		addPrePay,
		deletePrePay,
		editPrePay,
		isLessonDone,
	} = useHistory(
		data?.historyLessons || [],
		data?.students?.[0]?.prePay || prePayList || [],
		!!currentOpenedStudent,
	)

	const handleClick_delete = (itemIndex: number, id: number) => {
		// Сначала обновляем timeLinesArray в items
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
											timeRanges: [], // Очищаем timeRanges для этого дня
										}
									: timeline,
							),
						}
					: item,
			),
		)

		// После обновления items, обновляем историю
		updateHistory(items)
	}

	// const handleClick_dp = (itemIndex: number, id: number) => {
	// 	console.log(itemIndex, id, items)
	// 	setItems((prevItems) =>
	// 		prevItems.map((item, index) =>
	// 			index === itemIndex
	// 				? {
	// 						...item,
	// 						timeLinesArray: item.timeLinesArray.map((timeline) =>
	// 							timeline.id === id
	// 								? {
	// 										...timeline,
	// 										active: !timeline.active,
	// 										editingStart: !timeline.active,
	// 										editingEnd: false,
	// 									}
	// 								: {
	// 										...timeline,
	// 										active: false,
	// 										editingStart: false,
	// 										editingEnd: false,
	// 									},
	// 						),
	// 					}
	// 				: item,
	// 		),
	// 	)
	// 	console.log(items, 'itemsitemsitems')

	// 	setShowEndTimePicker(-1)
	// }
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
		setItems((prevItems) =>
			prevItems.map((item, index) =>
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
			),
		)

		// После обновления items, обновляем историю
		updateHistory(items)

		setShowEndTimePicker(-1)
	}

	function handlePrePayDelete(id) {
		// First delete from the hook's state
		deletePrePay(id)

		// Update the local prePayList state
		setPrePayList((prevList) => prevList.filter((item) => item.id !== id))

		// Force update of combinedHistory by triggering updateHistory
		updateHistory(items)

		// Reset any editing states
		setEditId(null)
		setDeletedId(null)
	}

	function handlePrePayEdit(id, newDate, newCost) {
		// Update in the hook's state
		editPrePay(id, newDate, newCost)

		// Update local prePayList state
		setPrePayList((prevList) => {
			return prevList.map((item) =>
				item.id === id
					? {...item, date: new Date(newDate), cost: newCost}
					: item,
			)
		})

		// Force update of combinedHistory by triggering updateHistory
		updateHistory(items)

		// Reset editing state
		setEditId(null)
	}

	useEffect(() => {
		if (prePayList) {
			// Calculate total prepayment sum
			// const sum = prePayList.reduce((acc, item) => acc + Number(item.cost), 0);
			// setPrePayCost(sum.toString());

			// Ensure combined history is updated
			updateHistory(items)
		}
	}, [prePayList])

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

	// Функция для обработки предоплат
	// const handlePrePayment = (historyLessons, prePayList) => {
	// 	// Проверяем, является ли prePayList массивом и не пуст ли он
	// 	if (!Array.isArray(prePayList) || prePayList.length === 0) {
	// 		return historyLessons
	// 	}

	// 	// Функция для сравнения дат без учета времени
	// 	const isSameDay = (date1, date2) => {
	// 		return (
	// 			date1.getFullYear() === date2.getFullYear() &&
	// 			date1.getMonth() === date2.getMonth() &&
	// 			date1.getDate() === date2.getDate()
	// 		)
	// 	}

	// 	// Сортируем предоплаты по дате
	// 	const sortedPrePayList = [...prePayList].sort(
	// 		(a, b) => new Date(a.date) - new Date(b.date),
	// 	)

	// 	// Сортируем занятия по дате
	// 	const sortedHistoryLessons = [...historyLessons].sort(
	// 		(a, b) => new Date(a.date) - new Date(b.date),
	// 	)

	// 	let remainingPrePayment = 0
	// 	let nextPrePayIndex = 0

	// 	const updatedHistoryLessons = sortedHistoryLessons.map((lesson) => {
	// 		const lessonDate = new Date(lesson.date)

	// 		// Применяем все предоплаты, которые были до или в тот же день, что и это занятие
	// 		while (
	// 			nextPrePayIndex < sortedPrePayList.length &&
	// 			(new Date(sortedPrePayList[nextPrePayIndex].date) < lessonDate ||
	// 				isSameDay(
	// 					new Date(sortedPrePayList[nextPrePayIndex].date),
	// 					lessonDate,
	// 				))
	// 		) {
	// 			remainingPrePayment += Number(sortedPrePayList[nextPrePayIndex].cost)
	// 			nextPrePayIndex++
	// 		}

	// 		// Проверяем, можем ли мы оплатить это занятие
	// 		if (remainingPrePayment >= Number(lesson.price) && !lesson.isCancel) {
	// 			remainingPrePayment -= Number(lesson.price)
	// 			return {...lesson, isPaid: true}
	// 		} else {
	// 			return {...lesson, isPaid: false}
	// 		}
	// 	})

	// 	return updatedHistoryLessons
	// }
	//
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

	const [allLessons, setAllLessons] = useState<number>(0)
	const [allLessonsPrice, setAllLessonsPrice] = useState<number>(0)

	// useEffect(() => {
	// 	console.log('Effect triggered:', {items, prePayList, currentItemIndex})

	// 	if (!Array.isArray(items) || items.length === 0) {
	// 		return
	// 	}

	// 	let countLessons = 0
	// 	let countLessonsPrice = 0
	// 	const now = new Date()

	// 	// Create new array for lessons
	// 	let newHistoryLessons = []

	// 	// Generate lessons for all items
	// 	for (let i = 0; i < items.length; i++) {
	// 		const item = items[i]
	// 		const differenceDays = differenceInDays(item.endLesson, item.startLesson)

	// 		const dateRange = Array.from({length: differenceDays + 1}, (_, j) =>
	// 			addDays(item.startLesson, j),
	// 		)

	// 		for (const date of dateRange) {
	// 			const dayOfWeek = getDay(date)
	// 			const scheduleForDay = item.timeLinesArray[dayOfWeek]

	// 			const hasScheduledTime = !(
	// 				scheduleForDay.startTime.hour === 0 &&
	// 				scheduleForDay.startTime.minute === 0 &&
	// 				scheduleForDay.endTime.hour === 0 &&
	// 				scheduleForDay.endTime.minute === 0
	// 			)

	// 			if (hasScheduledTime) {
	// 				const lessonDate = new Date(date)
	// 				lessonDate.setHours(
	// 					scheduleForDay.startTime.hour,
	// 					scheduleForDay.startTime.minute,
	// 				)

	// 				const existingLesson = historyLesson.find(
	// 					(lesson) => lesson.date.getTime() === lessonDate.getTime(),
	// 				)

	// 				const newLesson = {
	// 					date: lessonDate,
	// 					itemName: item.itemName,
	// 					isDone: existingLesson ? existingLesson.isDone : lessonDate < now,
	// 					price: item.costOneLesson,
	// 					isPaid: false, // Reset payment status for recalculation
	// 					isCancel: existingLesson ? existingLesson.isCancel : false,
	// 				}

	// 				// Update counters only for current item and non-canceled lessons
	// 				if (!newLesson.isCancel && i === currentItemIndex) {
	// 					countLessons++
	// 					countLessonsPrice += Number(item.costOneLesson)
	// 				}

	// 				newHistoryLessons.push(newLesson)
	// 			}
	// 		}
	// 	}

	// 	// Add existing lessons that weren't generated
	// 	historyLesson.forEach((lesson) => {
	// 		console.log('Existing lesson:', lesson)
	// 		const lessonExists = newHistoryLessons.some(
	// 			(newLesson) => newLesson.date.getTime() === lesson.date.getTime(),
	// 		)

	// 		if (!lessonExists) {
	// 			newHistoryLessons.push({
	// 				...lesson,
	// 				date: new Date(lesson.date),
	// 				isPaid: false, // Reset payment status for recalculation
	// 			})

	// 			if (
	// 				!lesson.isCancel &&
	// 				lesson.itemName === items[currentItemIndex].itemName
	// 			) {
	// 				countLessons++
	// 				countLessonsPrice += Number(lesson.price)
	// 			}
	// 		}
	// 	})

	// 	// Sort lessons chronologically
	// 	newHistoryLessons.sort((a, b) => a.date.getTime() - b.date.getTime())

	// 	console.log('Before payment processing:', {
	// 		lessonsCount: newHistoryLessons.length,
	// 		prePayList,
	// 	})

	// 	// Process payments
	// 	console.log(
	// 		`\n\nHandle PrePayList. (History): ${JSON.stringify(newHistoryLessons)}`,
	// 	)
	// 	const updatedHistoryLessons = handlePrePayment(
	// 		newHistoryLessons,
	// 		prePayList || [],
	// 		items[currentItemIndex].itemName,
	// 	)

	// 	console.log('After payment processing:', {
	// 		lessonsCount: updatedHistoryLessons.length,
	// 		paidLessons: updatedHistoryLessons.filter((l) => l.isPaid).length,
	// 	})

	// 	// Update state
	// 	setAllLessons(countLessons)
	// 	setAllLessonsPrice(countLessonsPrice)
	// 	setHistoryLesson(updatedHistoryLessons)
	// }, [items, prePayList, currentItemIndex])

	// useEffect(() => {
	// 	console.log('Effect triggered:', {items, prePayList, currentItemIndex})
	// 	if (!Array.isArray(items) || items.length === 0) {
	// 		return
	// 	}
	// 	let countLessons = 0
	// 	let countLessonsPrice = 0
	// 	const now = new Date()

	// 	// Create new array for lessons
	// 	let newHistoryLessons = []

	// 	// First, add all existing lessons to preserve their original prices and states
	// 	historyLesson.forEach((lesson) => {
	// 		newHistoryLessons.push({
	// 			...lesson,
	// 			date: new Date(lesson.date),
	// 			isPaid: false, // Reset payment status for recalculation
	// 		})

	// 		if (
	// 			!lesson.isCancel &&
	// 			lesson.itemName === items[currentItemIndex].itemName
	// 		) {
	// 			countLessons++
	// 			countLessonsPrice += Number(lesson.price)
	// 		}
	// 	})

	// 	// Generate lessons for all items
	// 	for (let i = 0; i < items.length; i++) {
	// 		const item = items[i]
	// 		const differenceDays = differenceInDays(item.endLesson, item.startLesson)
	// 		const dateRange = Array.from({length: differenceDays + 1}, (_, j) =>
	// 			addDays(item.startLesson, j),
	// 		)

	// 		for (const date of dateRange) {
	// 			const dayOfWeek = getDay(date)
	// 			const scheduleForDay = item.timeLinesArray[dayOfWeek]
	// 			const hasScheduledTime = !(
	// 				scheduleForDay.startTime.hour === 0 &&
	// 				scheduleForDay.startTime.minute === 0 &&
	// 				scheduleForDay.endTime.hour === 0 &&
	// 				scheduleForDay.endTime.minute === 0
	// 			)

	// 			if (hasScheduledTime) {
	// 				const lessonDate = new Date(date)
	// 				lessonDate.setHours(
	// 					scheduleForDay.startTime.hour,
	// 					scheduleForDay.startTime.minute,
	// 				)

	// 				// Check if lesson already exists
	// 				const existingLessonIndex = newHistoryLessons.findIndex(
	// 					(lesson) => lesson.date.getTime() === lessonDate.getTime(),
	// 				)

	// 				// Only add new lesson if it doesn't exist
	// 				if (existingLessonIndex === -1) {
	// 					const newLesson = {
	// 						date: lessonDate,
	// 						itemName: item.itemName,
	// 						isDone: lessonDate < now,
	// 						price: item.costOneLesson,
	// 						isPaid: false,
	// 						isCancel: false,
	// 					}

	// 					// Update counters only for current item and non-canceled lessons
	// 					if (!newLesson.isCancel && i === currentItemIndex) {
	// 						countLessons++
	// 						countLessonsPrice += Number(item.costOneLesson)
	// 					}

	// 					newHistoryLessons.push(newLesson)
	// 				}
	// 			}
	// 		}
	// 	}

	// 	// Sort lessons chronologically
	// 	newHistoryLessons.sort((a, b) => a.date.getTime() - b.date.getTime())

	// 	console.log('Before payment processing:', {
	// 		lessonsCount: newHistoryLessons.length,
	// 		prePayList,
	// 	})

	// 	// Process payments
	// 	console.log(
	// 		`\n\nHandle PrePayList. (History): ${JSON.stringify(newHistoryLessons)}`,
	// 	)

	// 	const updatedHistoryLessons = handlePrePayment(
	// 		newHistoryLessons,
	// 		prePayList || [],
	// 		items[currentItemIndex].itemName,
	// 	)

	// 	console.log('After payment processing:', {
	// 		lessonsCount: updatedHistoryLessons.length,
	// 		paidLessons: updatedHistoryLessons.filter((l) => l.isPaid).length,
	// 	})

	// 	// Update state
	// 	setAllLessons(countLessons)
	// 	setAllLessonsPrice(countLessonsPrice)
	// 	setHistoryLesson(updatedHistoryLessons)
	// }, [items, prePayList, currentItemIndex])

	// Используем баланс для отображения
	useEffect(() => {
		if (balance !== undefined) {
			// Обновляем отображение баланса в интерфейсе
			console.log('Current balance:', balance)
		}
	}, [balance])

	// Обновляем историю при изменении items
	useEffect(() => {
		if (items.length > 0) {
			updateHistory(items)
		}
	}, [items])

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

	const [processedPrePayIds, setProcessedPrePayIds] = useState<number[]>([])

	useEffect(() => {
		if (data) {
			setNameStudent(data.students[0].nameStudent)
			setCostOneLesson(data.students[0].costOneLesson)
			setPrePayCost(data.students[0].prePayCost)
			setPrePayDate(data.students[0].prePayDate)
			setContactFace(data.students[0].contactFace)
			setPhoneNumber(data.students[0].phoneNumber)
			setEmail(data.students[0].email)
			setLinkStudent(data.students[0].linkStudent)
			setCommentStudent(data.students[0].commentStudent)
			setCostStudent(data.students[0].costStudent)
			const itemsWithTimelineIds = data.items.map((item, itemIndex) => ({
				...item,
				timeLinesArray: item.timeLinesArray.map((timeline, timelineIndex) => ({
					...timeline,
					id: (timelineIndex + 1) * (itemIndex + 1),
				})),
			}))
			setItems(itemsWithTimelineIds)
			setFiles(data.students[0].filesData)
			setAudios(data.students[0].audiosData)
			setMediaFiles(data.students[0].mediaFiles || [])

			// Обработка предоплат
			if (data.students[0].prePay?.length > 0) {
				// Сортируем предоплаты по дате перед добавлением
				const sortedPrePay = [...data.students[0].prePay].sort(
					(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
				)

				// Фильтруем только новые предоплаты, которых нет в processedPrePayIds
				const newPrePays = sortedPrePay.filter(
					(payment) => !processedPrePayIds.includes(payment.id),
				)

				// Если есть новые предоплаты, обновляем список
				if (newPrePays.length > 0) {
					// Добавляем новые ID в список обработанных
					setProcessedPrePayIds((prev) => [
						...prev,
						...newPrePays.map((payment) => payment.id),
					])

					// Добавляем только новые предоплаты
					newPrePays.forEach((payment) => {
						addPrePay(
							payment.cost.toString(),
							new Date(payment.date),
							payment.id,
						)
					})
				}
			}
		}
	}, [data, processedPrePayIds]) // Добавляем processedPrePayIds в зависимости

	// useEffect(() => {
	// 	socket.on('getAllStudentSchedules', (schedules) => {
	// 		console.log('getAllStudentSchedules 123', schedules)
	// 		// Преобразуем расписания в формат истории
	// 		const historyFromSchedules = schedules.map((schedule) => {
	// 			const lessonDate = new Date(
	// 				Number(schedule.year),
	// 				Number(schedule.month) - 1,
	// 				Number(schedule.day),
	// 			)

	// 			return {
	// 				date: lessonDate,
	// 				itemName: schedule.itemName,
	// 				price: schedule.lessonsPrice,
	// 				isDone: schedule.isAutoChecked || schedule.isChecked,
	// 				isPaid: schedule.isPaid,
	// 				isCancel: schedule.isCancel,
	// 				typeLesson: schedule.typeLesson,
	// 				studentName: schedule.studentName,
	// 				studentId: schedule.studentId,
	// 			}
	// 		})

	// 		console.log('HL: ', prePayList)

	// 		// Фильтруем дубликаты, оставляя уникальные записи по дате и itemName
	// 		const uniqueHistory = historyFromSchedules.filter(
	// 			(lesson, index, array) => {
	// 				return (
	// 					index ===
	// 					array.findIndex(
	// 						(l) =>
	// 							l.date.getTime() === lesson.date.getTime() &&
	// 							l.itemName === lesson.itemName &&
	// 							l.price === lesson.price &&
	// 							l.isPaid === lesson.isPaid &&
	// 							l.isCancel === lesson.isCancel,
	// 					)
	// 				)
	// 			},
	// 		)

	// 		// Сортируем по дате
	// 		const sortedHistory = uniqueHistory.sort(
	// 			(a, b) => b.date.getTime() - a.date.getTime(),
	// 		)

	// 		// Обновляем историю
	// 		setHistoryLesson(sortedHistory)
	// 	})

	// 	return () => {
	// 		socket.off('getAllStudentSchedules')
	// 	}
	// }, [socket])

	const [isFirstLoad, setIsFirstLoad] = useState(true)

	useEffect(() => {
		socket.on('getAllStudentSchedules', (schedules) => {
			// Если это не первая загрузка, просто выходим
			if (!isFirstLoad) return

			// Преобразуем расписания в формат истории
			const historyFromSchedules = schedules.map((schedule) => {
				const lessonDate = new Date(
					Number(schedule.year),
					Number(schedule.month) - 1,
					Number(schedule.day),
				)
				const timeSlot = {
					startTime: {
						hour: schedule.startHour || 0,
						minute: schedule.startMinute || 0,
					},
					endTime: {
						hour: schedule.endHour || 0,
						minute: schedule.endMinute || 0,
					},
				}
				return {
					date: lessonDate,
					itemName: schedule.itemName,
					price: schedule.lessonsPrice,
					isDone: false,
					isPaid: schedule.isPaid,
					isCancel: schedule.isCancel,
					isAutoChecked: schedule.isAutoChecked,
					timeSlot: timeSlot,
					typeLesson: schedule.typeLesson,
					studentName: schedule.studentName,
					studentId: schedule.studentId,
				}
			})

			// Фильтруем дубликаты и проверяем наличие в prePayList
			const uniqueHistory = historyFromSchedules.filter(
				(lesson, index, array) => {
					const isUnique =
						index ===
						array.findIndex(
							(l) =>
								l.date.getTime() === lesson.date.getTime() &&
								l.itemName === lesson.itemName &&
								l.price === lesson.price &&
								l.isPaid === lesson.isPaid &&
								l.isCancel === lesson.isCancel,
						)

					const existsInPrePayList = prePayList.some(
						(prePay) =>
							new Date(prePay.date).getTime() === lesson.date.getTime(),
					)

					return isUnique && !existsInPrePayList
				},
			)

			console.log('\nuniqueHistory\n', uniqueHistory)

			const sortedHistory = uniqueHistory.sort(
				(a, b) => b.date.getTime() - a.date.getTime(),
			)

			const historyWithDoneStatus = sortedHistory.map((lesson) => ({
				...lesson,
				isDone: isLessonDone(lesson.date, lesson.timeSlot.endTime),
			}))

			console.log('\nsortedHistory\n', historyWithDoneStatus)
			updateHistory(historyWithDoneStatus)

			// Отмечаем, что первая загрузка завершена
			setIsFirstLoad(false)
		})

		return () => {
			socket.off('getAllStudentSchedules')
		}
	}, [socket, prePayList, isFirstLoad])

	useEffect(() => {
		setTimeout(() => {
			dispatch({type: 'SET_EDITED_CARDS', payload: false})
		}, 1000)
	}, [])
	useEffect(() => {
		console.log(editedCards, 'editedCards')
	}, [data, editedCards])

	useEffect(() => {
		if (!!prePayList) {
			let sum = prePayList.reduce((acc, item) => {
				return acc + Number(item.cost)
			}, 0)
			setPrePayCost(sum.toString())
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

	useEffect(() => {
		if (currentOpenedStudent && token) {
			socket.emit('getAllStudentSchedules', {
				studentId: currentOpenedStudent,
				token: token,
			})
		}
	}, [currentOpenedStudent, token])

	const handleAddStudentExit = () => {
		console.log('addStudent')
		dispatch({
			type: 'SET_CURRENT_OPENED_STUDENT',
			payload: '',
		})

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
								<div className="flex items-center bg-zinc-50 justify-between w-full mb-2 p-4 border-4 border-green-500 rounded-lg">
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
								<div className={s.StudentCard + 'flex flex-col'}>
									<div className="flex flex-row items-center justify-between w-[80%] p-4">
										<p className="text-md font-medium">Баланс</p>
										<span
											className={
												balance < 0
													? 'text-md font-semibold text-red-500'
													: 'text-md font-semibold text-green-500'
											}>
											{balance} ₽
										</span>
										<Button
											variant="default"
											size="icon"
											disabled={isEditMode}
											className="w-[40%]"
											onClick={() => setIsBalanceOpen(!isBalanceOpen)}>
											<>
												{/* <Plus className="w-4 h-4" /> */}
												<span>Пополнить</span>
											</>
										</Button>
									</div>

									{isBalanceOpen && (
										<div className="flex flex-row w-full">
											<MiniCalendar
												disabled={isEditMode}
												value={prePayDate}
												onChange={(newDate) => handlePrePayDate(newDate)}
												calendarId="prePay"
											/>

											<Input
												num
												className={s.PrePayCostInput}
												type="text"
												value={prePayCostValue}
												disabled={isEditMode}
												onChange={(e) => {
													setPrePayCostValue(e.target.value)
												}}
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

											<p>₽</p>
											<button
												onClick={() =>
													addPrePayList(
														prePayCostValue,
														prePayDate,
														prePayList.length,
													)
												}
												style={{marginLeft: '10px'}}>
												<CheckCircleIcon color="success" />
											</button>
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
																		{item.price}₽
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
								<label className="block text-sm font-medium text-gray-700">
									Комментарий
								</label>
								<Textarea
									className="mt-1 p-2 w-[90%] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
									value={commentStudent}
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
							<div className="flex flex-col gap-2 w-full"></div>
							<div className={s.ItemWrapper}>
								<div className={s.ItemHeader}>
									<div className="flex items-center bg-white justify-between w-full mb-2 p-4 border-2 border-green-500 rounded-lg  ">
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
									<Button
										variant="ghost"
										disabled={isEditMode}
										onClick={() => addItem()}>
										<img src={Plus} alt={Plus} />
									</Button>
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
												<>
													<Line width="100%" className={s.Line} />
													<div className={s.StudentCard}>
														<p>Дата и время пробного занятия:</p>
														<div className="flex flex-col gap-2 w-full">
															<div className="flex items-center gap-4">
																<MiniCalendar
																	disabled={isEditMode}
																	value={item.trialLessonDate || new Date()}
																	onChange={(newDate) =>
																		changeItemValue(
																			index,
																			'trialLessonDate',
																			new Date(newDate),
																		)
																	}
																	calendarId={`trialLesson_${index}`}
																/>
																{!isEditMode && (
																	<button
																		onClick={() =>
																			handleClick_dp(
																				index,
																				-1, // Special ID for trial lesson
																			)
																		}
																		className={s.ScheduleBtn}>
																		<ScheduleIcon />
																	</button>
																)}
															</div>
															{item.trialLessonTime && (
																<div className="text-sm ml-2">
																	{`${String(item.trialLessonTime.startTime.hour).padStart(2, '0')}:${String(item.trialLessonTime.startTime.minute).padStart(2, '0')} -
             ${String(item.trialLessonTime.endTime.hour).padStart(2, '0')}:${String(item.trialLessonTime.endTime.minute).padStart(2, '0')}`}
																</div>
															)}
															{activeTimePicker.itemIndex === index &&
																activeTimePicker.timelineId === -1 && (
																	<div className={s.timePickerWrapper}>
																		<TimePicker
																			title="Время пробного занятия"
																			onTimeChange={(
																				startHour,
																				startMinute,
																				endHour,
																				endMinute,
																			) => {
																				changeItemValue(
																					index,
																					'trialLessonTime',
																					{
																						startTime: {
																							hour: startHour,
																							minute: startMinute,
																						},
																						endTime: {
																							hour: endHour,
																							minute: endMinute,
																						},
																					},
																				)
																				setActiveTimePicker({
																					itemIndex: -1,
																					timelineId: null,
																				})
																			}}
																			onExit={() => {
																				setActiveTimePicker({
																					itemIndex: -1,
																					timelineId: null,
																				})
																			}}
																			addBlock={true}
																			freeSlots={freeSlots}
																			currentDay={format(
																				new Date(
																					item.trialLessonDate || new Date(),
																				),
																				'EE',
																			)}
																			lessonDuration={
																				item.lessonDuration || undefined
																			}
																		/>
																	</div>
																)}
														</div>
													</div>
												</>
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
													<p style={{marginRight: '50px'}}>Тип занятия:</p>

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
											<Line width="100%" className={s.Line} />
											<div className={s.StudentCard}>
												<TextAreaInputBlock
													title="Место проведения:"
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
											<div className={s.StudentCard}>
												<p>Стоимость одного занятия:</p>
												<Input
													width={`${item.costOneLesson.length}ch`}
													num
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
												/>
											</div>
										</div>
									</>
								))}
								<div className="h-10"></div>
								<StudentMedia
									files={mediaFiles}
									isExpanded={isMediaExpanded}
									onToggle={() => setIsMediaExpanded(!isMediaExpanded)}
									onFileUpload={handleFileUpload}
									onLinkAdd={handleLinkAdd}
									onAudioRecord={handleAudioRecord}
									onItemRemove={handleMediaRemove}
									sortBy={mediaSortBy}
									onSortChange={setMediaSortBy}
								/>
								{/* <mui.ListItemButton
							style={{marginTop: '10px'}}
							onClick={handleClick}>
							<img src={uploadFile} alt={uploadFile} />
							<mui.ListItemText primary="Файлы/ссылки" />
							{open ? <ExpandLess /> : <ExpandMore />}
						</mui.ListItemButton> */}
								{/*
						<mui.Collapse in={open} timeout="auto" unmountOnExit>
							<mui.List
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									flexDirection: 'column',
								}}
								component="div"
								disablePadding>
								<Line width="100%" className={s.Line} />
								<p>Список пока пуст</p>
							</mui.List>
						</mui.Collapse> */}
								{/* <FileNLinks
									alreadyUploaded={files}
									callback={handleFileNLinks}
									linksArray={links}
									submitLinks={handleLinksSubmit}
									deleteLink={deleteLink}
								/> */}

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
