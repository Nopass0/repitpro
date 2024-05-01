import s from './index.module.scss'
import Line from '../Line'
import DataSlidePicker from '../DataSlidePicker'
import CloseIcon from '@mui/icons-material/Close'
import CheckBox from '../CheckBox/index'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GroupOnline from '../../assets/1.svg'
import Online from '../../assets/2.svg'
import HomeStudent from '../../assets/3.svg'
import Group from '../../assets/4.svg'
import Home from '../../assets/5.svg'
import {Select, MenuItem} from '@mui/material'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import InputMask from 'react-input-mask'
import TimePicker from '../Timer/index'
import Client from '../../assets/6.svg'
import {useEffect, useState} from 'react'
import {debounce} from 'lodash'

import {Input} from '@mui/base'
import {useDispatch, useSelector} from 'react-redux'
import {ECurrentDayPopUp, ELeftMenuPage} from '../../types'
import socket from '../../socket'
import DayStudentPopUp from '../DayStudentPopUp'
import ExitPopUp from '../ExitPopUp/index'

enum PagePopup {
	Exit,
	PrePay,
	None,
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

	type?: string

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
	key,
	studentId,
	groupId,
	prevpay,
	isGroup,
	editMode,
	iconClick,
	LineClick,
	onUpdate,
	type,
}: IDayCalendarLine) => {
	const [editIcon, setEditIcon] = useState<string>(icon)
	const [editName, setEditName] = useState<string>(name)
	const [editTime, setEditTime] = useState<string>(`${timeStart}-${timeEnd}`)
	const [editPrevpay, setEditPrevpay] = useState<boolean>(prevpay || false)
	const [isDelete, setIsDelete] = useState<boolean>(false)

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

	const debouncedOnUpdate = debounce(onUpdate, 500)

	const [isDetailsShow, setIsDetailsShow] = useState<boolean>(false)

	const handleUpdate = () => {
		console.log(
			'handleUpdate',
			id,
			editIcon,
			editName,
			editTimeStart,
			editTimeEnd,
			editItem,
			editPrice,
			isDelete,
			studentId,
		)
		if (onUpdate) {
			console.log(
				'onUpdate',
				id,
				editIcon,
				editName,
				editTimeStart,
				editTimeEnd,
				editItem,
				editPrice,
				isDelete,
				studentId,
			)
			debouncedOnUpdate(
				id,
				editIcon,
				editName,
				editTimeStart,
				editTimeEnd,
				editItem,
				editPrice,
				isDelete,
			)
		}
	}

	const handleOpenDayPopUp = () => {
		setIsDetailsShow(true)
	}

	return (
		<>
			<div style={{display: isDelete ? 'none' : 'block'}}>
				<div className={s.wrapper}>
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
										onChange={(e: any) => {
											setEditPrice(e.target.value)
											handleUpdate()
										}}
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
						onClick={() => {
							setPagePopup(PagePopup.Exit)
						}}
						className={s.BtnDelete}>
						<DeleteOutlineIcon />
					</button>
				</div>

				<Line className={s.Line} width="700px" />
			</div>
			{isDetailsShow && (
				<DayStudentPopUp icon={icon} name={editName} time={editTime} />
			)}
			{pagePopup === PagePopup.Exit && (
				<>
					<div className={s.PopUp__wrapper}>
						<ExitPopUp
							className={s.PopUp}
							title="Вы действительно хотите удалить?"
							yes={() => {
								setIsDelete(true)
								handleUpdate()
								setPagePopup(PagePopup.None)
							}}
							no={() => setPagePopup(PagePopup.None)}
						/>
					</div>
				</>
			)}
			{pagePopup === PagePopup.PrePay && (
				<>
					<div className={s.PopUp__wrapper}>
						<ExitPopUp
							className={s.PopUp}
							title="Подтвердите действие"
							yes={() => {
								setEditPrevpay(!editPrevpay)
								handleUpdate()
								setPagePopup(PagePopup.None)
							}}
							no={() => setPagePopup(PagePopup.None)}
						/>
					</div>
				</>
			)}
		</>
	)
}

export default DayCalendarLine
