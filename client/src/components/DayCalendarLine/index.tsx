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
import TimePicker from '../Timer/index'
import Client from '../../assets/6.svg'
import {useState} from 'react'

interface IDayCalendarLine {
	// Base
	icon: string
	timeStart: string
	key: number
	timeEnd: string
	name: string
	item: string
	price: string
	prevpay?: boolean
	editMode?: boolean
	iconClick?: () => void
	LineClick?: () => void
}
const DayCalendarLine = ({
	icon,
	timeStart,
	timeEnd,
	name,
	item,
	price,
	key,
	prevpay,
	editMode,
	iconClick,
	LineClick,
}: IDayCalendarLine) => {
	const [editIcon, setEditIcon] = useState<string>(icon)
	const [editName, setEditName] = useState<string>(name)
	const [editTimeStart, setEditTimeStart] = useState<string>(timeStart)
	const [editTimeEnd, setEditTimeEnd] = useState<string>(timeEnd)
	const [editItem, setEditItem] = useState<string>(item)
	const [editPrice, setEditPrice] = useState<string>(price)
	const [activeKey, setActiveKey] = useState<number | null>(null)

	const handleStartTimeChange = (hour: number, minute: number, key: number) => {
		setEditTimeStart((prevState) => {
			if (key === prevState.key) {
				return `${hour.toString().padStart(2, '0')}:${minute
					.toString()
					.padStart(2, '0')}`
			}
			return prevState
		})
	}

	const handleEndTimeChange = (hour: number, minute: number, key: number) => {
		setEditTimeEnd((prevState) => {
			if (key === prevState.key) {
				return `${hour.toString().padStart(2, '0')}:${minute
					.toString()
					.padStart(2, '0')}`
			}
			return prevState
		})
	}

	return (
		<>
			<div className={s.wrapper}>
				<button
					onClick={() => {
						!editMode && iconClick
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
								}}>
								<MenuItem value={'1'}>
									<img src={Home} alt={'Home'} />
								</MenuItem>
								<MenuItem value={'2'}>
									<img src={HomeStudent} alt={'HomeStudent'} />
								</MenuItem>
								<MenuItem value={'3'}>
									<img src={Group} alt={'Group'} />
								</MenuItem>
								<MenuItem value={'4'}>
									<img src={Online} alt={'Online'} />
								</MenuItem>
								<MenuItem value={'5'}>
									<img src={GroupOnline} alt={'GroupOnline'} />
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
						<p>
							{timeStart}-{timeEnd}
						</p>
					</div>
					{activeKey === key && (
						<div className={s.timePickerWrapper}>
							<TimePicker
								title="Начало занятий"
								onTimeChange={(hour, minute) =>
									handleStartTimeChange(hour, minute, key)
								}
							/>
							<TimePicker
								title="Конец занятий"
								onTimeChange={(hour, minute) =>
									handleEndTimeChange(hour, minute, key)
								}
							/>
						</div>
					)}
					<div className={s.Name}>
						<p title={name}>
							{name.length > 24 ? name.slice(0, 24) + '...' : name}
						</p>
					</div>
					<div className={s.Item}>
						<p title={item}>
							{item.length > 13 ? item.slice(0, 13) + '...' : item}
						</p>
					</div>
					<div className={s.Price}>
						<p title={price}>
							{price.length > 5 ? price.slice(0, 5) + '>' : price} ₽
						</p>
					</div>
				</div>
				<CheckBox checked={prevpay} className={s.Checkbox} size="20px" />
				<button className={s.BtnDelete}>
					<DeleteOutlineIcon />
				</button>
			</div>
		</>
	)
}

export default DayCalendarLine
