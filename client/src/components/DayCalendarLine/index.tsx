import s from './index.module.scss'
import Line from '../Line'
import CheckBox from '../CheckBox/index'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GroupOnline from '../../assets/1.svg'
import Online from '../../assets/2.svg'
import HomeStudent from '../../assets/3.svg'
import Group from '../../assets/4.svg'
import Home from '../../assets/5.svg'
import {Select, MenuItem} from '@mui/material'
import InputMask from 'react-input-mask'
import {useCallback, useEffect, useState} from 'react'
import {debounce} from 'lodash'
import CancelIcon from '@mui/icons-material/Cancel'
import {Input} from '@mui/base'
import {useDispatch, useSelector} from 'react-redux'
import {ECurrentDayPopUp, ELeftMenuPage} from '../../types'
import socket from '../../socket'
import DayStudentPopUp from '../DayStudentPopUp'
import ExitPopUp from '../ExitPopUp/index'
import ReactDOM from 'react-dom'

enum PagePopup {
	Exit,
	PrePay,
	None,
	Cancel,
}

export const UPDATE_STUDENTS = 'UPDATE_STUDENTS'

export const updateStudents = (students: any) => ({
	type: UPDATE_STUDENTS,
	payload: students,
})

interface IDayCalendarLine {
	// Base
	id: string
	icon: string
	timeStart: string
	key: number
	timeEnd: string
	name: string
	item: string
	studentId: string
	price: string
	prevpay?: boolean
	editMode?: boolean
	isGroup?: boolean
	groupId?: string
	students?: any
	type?: string
	isCancel: boolean
	place?: string
	isTrial?: boolean
	iconClick?: () => void
	LineClick?: () => void
	onUpdate?: (
		id: string,
		editIcon: string,
		editName: string,
		editTimeStart: string,
		editTimeEnd: string,
		editItem: string,
		editPrice: string,
		isDelete: boolean,
		studentId: string,
		isCancel: boolean,
	) => void
}
const DayCalendarLine = ({
	id,
	icon,
	timeStart,
	timeEnd,
	name,
	item,
	price,
	place,
	key,
	isTrial,
	students,
	studentId,
	groupId,
	prevpay,
	isGroup,
	editMode,
	iconClick,
	LineClick,
	onUpdate,
	isCancel: initialIsCancel,
	type,
}: IDayCalendarLine) => {
	const [editIcon, setEditIcon] = useState<string>(icon)
	const [editName, setEditName] = useState<string>(name)
	const [editTime, setEditTime] = useState<string>(`${timeStart}-${timeEnd}`)
	const [editPrevpay, setEditPrevpay] = useState<boolean>(prevpay || false)
	const [isDelete, setIsDelete] = useState<boolean>(false)
	const [isCancel, setIsCancel] = useState<boolean>(initialIsCancel)

	const [editTimeStart, setEditTimeStart] = useState<string>(timeStart)
	const [editTimeEnd, setEditTimeEnd] = useState<string>(timeEnd)

	const [editItem, setEditItem] = useState<string>(item)
	const [editPrice, setEditPrice] = useState<string>(price)
	const [activeKey, setActiveKey] = useState<number | null>(null)
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 678)
	const [pagePopup, setPagePopup] = useState<PagePopup>(PagePopup.None)

	const hiddenNum = useSelector((state: any) => state.hiddenNum)
	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth <= 678)
		}

		window.addEventListener('resize', handleResize)

		return () => {
			window.removeEventListener('resize', handleResize)
		}
	}, [])

	useEffect(() => {
		const handleLessonCanceled = (data: any) => {
			if (data.success && data.updatedSchedule.id === id) {
				setIsCancel(true)
			} else if (!data.success) {
				console.error('Failed to cancel lesson:', data.error)
				// Здесь можно добавить обработку ошибки, например, показать уведомление пользователю
			}
		}

		socket.on('lessonCanceled', handleLessonCanceled)

		return () => {
			socket.off('lessonCanceled', handleLessonCanceled)
		}
	}, [id])

	const dispatch = useDispatch()

	const user = useSelector((state: any) => state.user)
	const token = user?.token

	const formatTime = (value: string) => {
		// Remove the mask characters
		const cleanValue = value.replace(/[^0-9]/g, '')

		// Split the value into two time ranges
		const [startTime, endTime] = [
			cleanValue.slice(0, 4),
			cleanValue.slice(4, 8),
		]

		// Format the start time
		const startHours = parseInt(startTime.slice(0, 2), 10)
		const startMinutes = parseInt(startTime.slice(2, 4), 10)
		const formattedStartHours = Math.min(23, isNaN(startHours) ? 0 : startHours)
		const formattedStartMinutes = Math.min(
			59,
			isNaN(startMinutes) ? 0 : startMinutes,
		)

		// Format the end time, ensuring it's greater than the start time
		let formattedEndHours = parseInt(endTime.slice(0, 2), 10)
		let formattedEndMinutes = parseInt(endTime.slice(2, 4), 10)

		if (
			formattedEndHours < formattedStartHours ||
			(formattedEndHours === formattedStartHours &&
				formattedEndMinutes <= formattedStartMinutes)
		) {
			formattedEndHours = formattedStartHours
			formattedEndMinutes = formattedStartMinutes + 1

			if (formattedEndMinutes === 60) {
				formattedEndHours = (formattedEndHours + 1) % 24
				formattedEndMinutes = 0
			}
		}

		formattedEndHours = Math.min(
			23,
			isNaN(formattedEndHours) ? 0 : formattedEndHours,
		)
		formattedEndMinutes = Math.min(
			59,
			isNaN(formattedEndMinutes) ? 0 : formattedEndMinutes,
		)

		// Format the time string
		const formattedStartTime = `${formattedStartHours
			.toString()
			.padStart(2, '0')}:${formattedStartMinutes.toString().padStart(2, '0')}`
		const formattedEndTime = `${formattedEndHours
			.toString()
			.padStart(2, '0')}:${formattedEndMinutes.toString().padStart(2, '0')}`

		console.log('Formatted time:', formattedStartTime, formattedEndTime)
		console.table(['Formatted time:', formattedStartTime, formattedEndTime])

		return `${formattedStartTime}-${formattedEndTime}`
	}

	useEffect(() => {
		//set start and end data to format 00:00
		setEditTimeStart(formatTime(editTime).split('-')[0])
		setEditTimeEnd(formatTime(editTime).split('-')[1])
	}, [editTime])

	const handleOpenCard = () => {
		socket.emit('getGroupByStudentId', {
			token: token,
			studentId: studentId,
		})

		dispatch({type: 'SET_DAY_STUDENTS', payload: students})
		//SET_CURRENT_OPENED_STUDENT with studentid
		dispatch({type: 'SET_CURRENT_OPENED_STUDENT', payload: studentId})
		//SET_LEFT_MENU_PAGE
		dispatch({type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddStudent})
	}

	const handleOpenCardGroup = () => {
		socket.emit('getGroupById', {
			token: token,
			groupId: groupId,
		})

		//SET_CURRENT_OPENED_STUDENT with studentid
		dispatch({type: 'SET_CURRENT_OPENED_GROUP', payload: groupId})
		//SET_LEFT_MENU_PAGE
		dispatch({type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddGroup})
	}

	// Create a debounced version of onUpdate
	// const debouncedOnUpdate = useCallback(
	// 	debounce((updatedPrice: string) => {
	// 		if (onUpdate) {
	// 			onUpdate(
	// 				id,
	// 				editIcon,
	// 				editName,
	// 				editTimeStart,
	// 				editTimeEnd,
	// 				editItem,
	// 				updatedPrice,
	// 				isDelete,
	// 				studentId,
	// 			)
	// 		}
	// 	}, 300),
	// 	[
	// 		id,
	// 		editIcon,
	// 		editName,
	// 		editTimeStart,
	// 		editTimeEnd,
	// 		editItem,
	// 		isDelete,
	// 		studentId,
	// 		onUpdate,
	// 	],
	// )
	//
	const handleUpdate = () => {
		if (onUpdate) {
			console.log('handleUpdate с isCancel:', isCancel)
			onUpdate(
				id,
				editIcon,
				editName,
				editTimeStart,
				editTimeEnd,
				editItem,
				editPrice,
				isDelete,
				studentId,
				isCancel,
			)
		}
	}

	// Обновляем debouncedOnUpdate
	const debouncedOnUpdate = useCallback(
		debounce((updatedPrice: string) => {
			if (onUpdate) {
				onUpdate(
					id,
					editIcon,
					editName,
					editTimeStart,
					editTimeEnd,
					editItem,
					updatedPrice,
					isDelete,
					studentId,
					isCancel,
				)
			}
		}, 300),
		[
			id,
			editIcon,
			editName,
			editTimeStart,
			editTimeEnd,
			editItem,
			isDelete,
			studentId,
			isCancel,
			onUpdate,
		],
	)

	const [isDetailsShow, setIsDetailsShow] = useState<boolean>(false)

	// const handleUpdate = () => {
	// 	console.log(
	// 		'handleUpdate',
	// 		id,
	// 		editIcon,
	// 		editName,
	// 		editTimeStart,
	// 		editTimeEnd,
	// 		editItem,
	// 		editPrice,
	// 		isDelete,
	// 		studentId,
	// 	)
	// 	if (onUpdate) {
	// 		console.log(
	// 			'onUpdate',
	// 			id,
	// 			editIcon,
	// 			editName,
	// 			editTimeStart,
	// 			editTimeEnd,
	// 			editItem,
	// 			editPrice,
	// 			isDelete,
	// 			studentId,
	// 		)
	// 		debouncedOnUpdate(
	// 			id,
	// 			editIcon,
	// 			editName,
	// 			editTimeStart,
	// 			editTimeEnd,
	// 			editItem,
	// 			editPrice,
	// 			isDelete,
	// 		)
	// 	}
	// }
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)

	const handleCancel = () => {
		setPagePopup(PagePopup.Cancel)
	}

	const handleAddStudentDay = () => {
		socket.emit('createStudentSchedule', {
			token: token,
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			studentId: studentId,
			itemName: editItem, // Ensure this matches the server schema
			lessonsPrice: editPrice, // Ensure this matches the server schema
			studentName: editName, // Ensure this matches the server schema
			copyBy: id,
		})
	}

	// Function to update payment status in history
	const updatePaymentStatus = async (newIsPaid: boolean) => {
		const updateData = {
			id,
			token,
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			isChecked: newIsPaid,
			studentId,
			// Include other necessary fields
			itemName: editItem,
			lessonsPrice: editPrice,
			typeLesson: editIcon,
			startTime: {
				hour: parseInt(editTimeStart.split(':')[0]),
				minute: parseInt(editTimeStart.split(':')[1]),
			},
			endTime: {
				hour: parseInt(editTimeEnd.split(':')[0]),
				minute: parseInt(editTimeEnd.split(':')[1]),
			},
		}

		// Emit update to server
		socket.emit('updateStudentSchedule', updateData)

		// Wait for response to confirm update
		return new Promise((resolve) => {
			socket.once(`updateStudentSchedule_${id}`, (response) => {
				if (response.success) {
					resolve(true)
				} else {
					console.error('Failed to update payment status:', response.error)
					resolve(false)
				}
			})
		})
	}

	// Handle checkbox change
	const handlePaymentStatusChange = async () => {
		const newIsPaid = !editPrevpay

		// Show confirmation dialog
		setPagePopup(PagePopup.PrePay)

		// The actual update will happen in the confirmation dialog's "yes" handler
		// See the ExitPopUp component below
	}

	const confirmCancel = () => {
		// Обновляем локальное состояние
		setIsCancel(true)

		// Уведомляем родительский компонент об отмене
		if (onUpdate) {
			onUpdate(
				id,
				editIcon,
				editName,
				editTimeStart,
				editTimeEnd,
				editItem,
				editPrice,
				isDelete,
				studentId,
				true, // isCancel = true
			)
		}

		// Отправляем запрос на сервер
		socket.emit('cancelLesson', {id, token})
		setPagePopup(PagePopup.None)

		// Запрашиваем обновленные данные
		socket.emit('getStudentsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
	}

	const handleOpenDayPopUp = () => {
		setIsDetailsShow(true)
	}

	// Handle price change
	const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newPrice = e.target.value
		setEditPrice(newPrice)
		debouncedOnUpdate(newPrice)
	}

	return (
		<>
			<div
				className={`${isCancel ? s.cancelled : ''} ${isTrial ? s.trial : ''}`}
				style={{display: isDelete ? 'none' : 'block'}}>
				{isCancel && (
					<div className={s.cancelStamp}>
						<p>Отменено</p>
					</div>
				)}
				{isTrial && (
					<div className={s.trialStamp}>
						<p>Пробное</p>
					</div>
				)}
				<div className={`${s.wrapper} ${isCancel && s.cancelWrapper}`}>
					<button
						onClick={() => {
							if (!editMode && type === 'student') {
								handleOpenCard()
								return iconClick
							} else if (!editMode && type === 'group') {
								handleOpenCardGroup()
								return iconClick
							}
						}}
						className={s.Icon}>
						{!editMode ? (
							<img
								src={
									editIcon === 1
										? Home
										: editIcon === 2
											? HomeStudent
											: editIcon === 3
												? Group
												: editIcon === 4
													? Online
													: GroupOnline
								}
								alt={editIcon}
							/>
						) : (
							<>
								<Select
									className={s.elect__menu}
									variant={'standard'}
									value={editIcon}
									onChange={(e) => {
										//set icon
										setEditIcon(String(e.target.value))
										handleUpdate() // Call handleUpdate here
									}}>
									<MenuItem value={'1'}>
										<img src={Home} alt={'Home'} />
									</MenuItem>
									<MenuItem value={'2'}>
										<img src={HomeStudent} alt={'HomeStudent'} />
									</MenuItem>

									<MenuItem value={'4'}>
										<img src={Online} alt={'Online'} />
									</MenuItem>
								</Select>
							</>
						)}
					</button>
					<div
						onClick={() => {
							if (!editMode && type === 'student')
								return (
									dispatch({
										type: 'SET_CURRENT_POPUP_TYPE',
										payload: ECurrentDayPopUp.Student,
									}) &&
									dispatch({
										type: 'SET_CURRENT_OPENED_SCHEDULE_DAY',
										payload: id,
									})
								)
							else if (!editMode && type === 'group') {
								dispatch({
									type: 'SET_CURRENT_POPUP_TYPE',
									payload: ECurrentDayPopUp.Group,
								}) &&
									dispatch({
										type: 'SET_CURRENT_OPENED_SCHEDULE_DAY',
										payload: id,
									})
							}
						}}
						className={s.ClickWrapper}
						style={editMode ? {cursor: 'default'} : {cursor: 'pointer'}}>
						<div className={s.Time} onClick={() => setActiveKey(key)}>
							{!editMode ? (
								<p>{editTime}</p>
							) : (
								<InputMask
									onChange={(e: any) => {
										console.log(e.target.value)
										setEditTime(formatTime(e.target.value))
										handleUpdate()
									}}
									value={editTime}
									mask="99:99-99:99"
								/>
							)}
						</div>
						<div className={s.Name}>
							{!editMode ? (
								<p title={editName}>
									{editName &&
										(editName.length > 24
											? name.slice(0, 24) + '...'
											: editName)}
								</p>
							) : (
								<Input
									className={s.InputCstm}
									onChange={(e: any) => {
										setEditName(e.target.value)
										handleUpdate()
									}}
									placeholder="Имя"
									value={editName}
								/>
							)}
						</div>
						<div className={s.NewAdd}>
							<button
								onClick={(e) => {
									e.stopPropagation()
									handleAddStudentDay()
								}}
								className={`${s.AddButton} ${s.AddButtonGreen}`}>
								+
							</button>
						</div>
						<div className={s.Item}>
							{!editMode ? (
								<p title={editItem}>
									{editItem.length > 13 ? item.slice(0, 13) + '...' : editItem}
								</p>
							) : (
								<Input
									className={s.InputCstm}
									onChange={(e: any) => {
										setEditItem(e.target.value)
										handleUpdate()
									}}
									placeholder="Предмет"
									value={editItem}
								/>
							)}
						</div>
						<div className={s.Price}>
							{!editMode ? (
								<p title={editPrice}>
									{!hiddenNum && (
										<>
											{editPrice.length > 5 && !isMobile
												? price.slice(0, 5) + '>'
												: editPrice}{' '}
										</>
									)}
									₽
								</p>
							) : (
								<>
									<Input
										className={s.InputCstm}
										style={{width: '50px'}}
										onChange={handlePriceChange}
										value={editPrice}
										type="number"
										placeholder="Цена"
									/>{' '}
									<p>₽</p>
								</>
							)}
						</div>
					</div>
					<CheckBox
						checked={editPrevpay}
						onChange={() => {
							if (editPrice) {
								setPagePopup(PagePopup.PrePay)
							}
						}}
						className={s.Checkbox}
						size={isMobile ? '12px' : '20px'}
					/>
					<button
						onClick={handleCancel}
						className={s.BtnCancel}
						style={{display: isCancel ? 'none' : 'block'}}>
						<DeleteOutlineIcon />
					</button>
				</div>

				<Line className={s.Line} width="700px" />
			</div>
			{isDetailsShow && (
				<DayStudentPopUp
					icon={icon}
					name={editName}
					time={editTime}
					price={editPrice}
				/>
			)}

			{ReactDOM.createPortal(
				pagePopup === PagePopup.Cancel && (
					<div className={s.PopUp__wrapper}>
						<ExitPopUp
							className={s.PopUp}
							title="Вы действительно хотите отменить занятие?"
							yes={confirmCancel}
							no={() => setPagePopup(PagePopup.None)}
						/>
					</div>
				),
				document.body,
			)}

			{ReactDOM.createPortal(
				pagePopup === PagePopup.PrePay && (
					<>
						<div className={s.PopUp__wrapper}>
							<ExitPopUp
								className={s.PopUp}
								title="Подтвердите действие"
								yes={async () => {
									const newIsPaid = !editPrevpay
									const success = await updatePaymentStatus(newIsPaid)

									if (success) {
										setEditPrevpay(newIsPaid)
										// Update local state
										if (onUpdate) {
											onUpdate(
												id,
												editIcon,
												editName,
												editTimeStart,
												editTimeEnd,
												editItem,
												editPrice,
												isDelete,
												studentId,
												isCancel,
											)
										}

										// Refresh the data
										socket.emit('getStudentsByDate', {
											day: calendarNowPopupDay,
											month: calendarNowPopupMonth,
											year: calendarNowPopupYear,
											token: token,
										})
									}

									setPagePopup(PagePopup.None)
								}}
								no={() => setPagePopup(PagePopup.None)}
							/>
						</div>
					</>
				),
				document.body,
			)}
		</>
	)
}

export default DayCalendarLine
