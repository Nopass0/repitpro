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

import {Input} from '@mui/base'

export const UPDATE_STUDENTS = 'UPDATE_STUDENTS'

export const updateStudents = (students: any) => ({
	type: UPDATE_STUDENTS,
	payload: students,
})

interface IDayCalendarLine {
	// Base
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

	iconClick?: () => void
	LineClick?: () => void
	onUpdate?: (
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
	icon,
	timeStart,
	timeEnd,
	name,
	item,
	price,
	key,
	studentId,
	prevpay,
	editMode,
	iconClick,
	LineClick,
	onUpdate,
}: IDayCalendarLine) => {
	const [editIcon, setEditIcon] = useState<string>(icon)
	const [editName, setEditName] = useState<string>(name)
	const [editTimeStart, setEditTimeStart] = useState<string>(
		`${timeStart}-${timeEnd}`,
	)
	const [editPrevpay, setEditPrevpay] = useState<boolean>(prevpay || false)
	const [isDelete, setIsDelete] = useState<boolean>(false)
	const [editTimeEnd, setEditTimeEnd] = useState<string>(timeEnd)
	const [editItem, setEditItem] = useState<string>(item)
	const [editPrice, setEditPrice] = useState<string>(price)
	const [activeKey, setActiveKey] = useState<number | null>(null)

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

		return `${formattedStartTime}-${formattedEndTime}`
	}

	const handleUpdate = () => {
		console.log(
			'handleUpdate',
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
			onUpdate(
				editIcon,
				editName,
				editTimeStart,
				editTimeEnd,
				editItem,
				editPrice,
				isDelete,
				studentId,
			)
		}
	}

	return (
		<>
			<div style={{display: isDelete ? 'none' : 'flex'}} className={s.wrapper}>
				<button
					onClick={() => {
						if (!editMode) {
							return iconClick
						}
					}}
					className={s.Icon}>
					{!editMode ? (
						<img
							src={
								editIcon === '1'
									? Home
									: editIcon === '2'
									? HomeStudent
									: editIcon === '3'
									? Group
									: editIcon === '4'
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
						!editMode && LineClick
					}}
					className={s.ClickWrapper}
					style={editMode ? {cursor: 'default'} : {cursor: 'pointer'}}>
					<div className={s.Time} onClick={() => setActiveKey(key)}>
						{!editMode ? (
							<p>{editTimeStart}</p>
						) : (
							<InputMask
								onChange={(e: any) => {
									setEditTimeStart(formatTime(e.target.value))
									handleUpdate()
								}}
								value={editTimeStart}
								mask="99:99-99:99"
							/>
						)}
					</div>
					<div className={s.Name}>
						{!editMode ? (
							<p title={editName}>
								{editName.length > 24 ? name.slice(0, 24) + '...' : editName}
							</p>
						) : (
							<Input
								onChange={(e: any) => {
									setEditName(e.target.value)
									handleUpdate()
								}}
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
								onChange={(e: any) => {
									setEditItem(e.target.value)
									handleUpdate()
								}}
								value={editItem}
							/>
						)}
					</div>
					<div className={s.Price}>
						{!editMode ? (
							<p title={editPrice}>
								{editPrice.length > 5 ? price.slice(0, 5) + '>' : editPrice} ₽
							</p>
						) : (
							<>
								<Input
									style={{width: '50px'}}
									onChange={(e: any) => {
										setEditPrice(e.target.value)
										handleUpdate()
									}}
									value={editPrice}
									type="number"
								/>{' '}
								<p>₽</p>
							</>
						)}
					</div>
				</div>
				<CheckBox
					checked={editPrevpay}
					onChange={() => {
						setEditPrevpay(!editPrevpay)
						handleUpdate()
					}}
					className={s.Checkbox}
					size="20px"
				/>
				<button
					onClick={() => {
						setIsDelete(true)
						handleUpdate()
					}}
					className={s.BtnDelete}>
					<DeleteOutlineIcon />
				</button>
			</div>
		</>
	)
}

export default DayCalendarLine
