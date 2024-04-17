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
// import {debounce} from 'lodash'

import {Input} from '@mui/base'
import {useDispatch, useSelector} from 'react-redux'
import {ECurrentDayPopUp, ELeftMenuPage} from '../../types'
import socket from '../../socket'
import DayStudentPopUp from '../DayStudentPopUp'
import DayClientPopUp from '../DayClientPopUp'

export const UPDATE_STUDENTS = 'UPDATE_STUDENTS'

export const updateStudents = (students: any) => ({
	type: UPDATE_STUDENTS,
	payload: students,
})

interface IDayCalendarLineClient {
	// Base
	id: string
	key: number
	name: string
	item: string
	studentId: string
	price: string
	orderCheck?: boolean
	priceCheck?: boolean
	procent?: string
	editMode?: boolean

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
const DayCalendarLineClient = ({
	id,

	name,
	item,
	price,
	key,
	studentId,
	editMode,
	iconClick,
	LineClick,
	procent,

	onUpdate,
	orderCheck,
	priceCheck,
}: IDayCalendarLineClient) => {
	const [orderCheckState, setOrderCheckState] = useState<boolean>(
		orderCheck || false,
	)
	const [priceCheckState, setPriceCheckState] = useState<boolean>(
		priceCheck || false,
	)
	const [isMobile, setIsMobile] = useState(window.innerWidth <= 678)
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
	const currentpopup = useSelector((state: any) => state.currentPopUpType)
	const user = useSelector((state: any) => state.user)
	const token = user?.token

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

	const handleOpenClient = (clientId: string) => {
		console.log(clientId, '----------- handleOpenClient -----------')
		socket.emit('getClientById', {
			token: token,
			clientId: clientId,
		})
		//SET_CURRENT_OPENED_CLIENT with clientid
		dispatch({type: 'SET_CURRENT_OPENED_CLIENT', payload: clientId})
		//SET_LEFT_MENU_PAGE
		dispatch({type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddClient})
	}

	const handleOpenGroup = (groupId: string) => {
		socket.emit('getGroupById', {
			token: token,
			groupId: groupId,
		})
		//SET_CURRENT_OPENED_GROUP with groupid
		dispatch({type: 'SET_CURRENT_OPENED_GROUP', payload: groupId})
		//SET_LEFT_MENU_PAGE
		dispatch({type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddGroup})
	}

	// const debouncedOnUpdate = debounce(onUpdate, 500)

	const [isDetailsShow, setIsDetailsShow] = useState<boolean>(false)

	// const handleUpdate = () => {
	// 	if (onUpdate) {
	// 		console.log('onUpdate', id, studentId)
	// 		debouncedOnUpdate(id, studentId, orderCheckState, priceCheckState)
	// 	}
	// }

	return (
		<>
			<div className={s.wrapper}>
				<button
					onClick={() => {
						if (!editMode) {
							handleOpenClient(id)
							return iconClick
						}
					}}
					className={s.Icon}>
					<img src={Client} alt="Client" />
				</button>
				<div
					onClick={() => {
						if (!editMode) {
							dispatch({
								type: 'SET_CURRENT_SCHEDULE_DAY_CLIENT_ID',
								payload: id,
							})
							dispatch({
								type: 'SET_CURRENT_POPUP_TYPE',
								payload: ECurrentDayPopUp.Client,
							})
							console.log(currentpopup, '1234667')
						}
						dispatch({
							type: 'SET_CURRENT_OPENED_SCHEDULE_DAY',
							payload: id,
						})
					}}
					className={s.ClickWrapper}>
					<div className={s.ClickUp}>
						<div className={s.Item}>
							<p>{item}</p>
						</div>
						<div className={s.Name}>
							<p>{name}</p>
						</div>
					</div>
					<div className={s.ClientDown}>
						<div className={s.Order}>
							<p>Заказ принят</p>
							<CheckBox
								checked={orderCheck}
								onChange={() => {
									setOrderCheckState(!orderCheckState)
									// handleUpdate()
								}}
								disabled={editMode}
								className={s.Checkbox}
								size={isMobile ? '12px' : '20px'}
							/>
						</div>
						<div className={s.Price}>
							<p>{price} ₽</p>
							<CheckBox
								checked={priceCheckState}
								onChange={() => {
									setPriceCheckState(!priceCheckState)
									// handleUpdate()
								}}
								disabled={editMode}
								className={s.Checkbox}
								size={isMobile ? '12px' : '20px'}
							/>
						</div>
						<div className={s.Procent}>
							<p>{procent}%</p>
						</div>
					</div>
				</div>
				<div></div>
				<div></div>
			</div>
		</>
	)
}

export default DayCalendarLineClient
