import React, {useState, useRef, useEffect} from 'react'
import ReactDOM from 'react-dom'
import s from './index.module.scss'
import CloseIcon from '@mui/icons-material/Close'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'

import * as pr from 'react-multi-date-picker'
interface CalendarProps {
	value?: string
	onChange: (value: Date) => void
	calendarId?: string
	disabled?: boolean
}

const MiniCalendar: React.FC<CalendarProps> = ({
	value = formatDate(new Date(Date.now())),
	onChange,
	calendarId,
	disabled,
}) => {
	const [date, setDate] = useState()
	const inputStart = useRef()
	const inputEnd = useRef()

	const [sDate, setSDate] = useState('')
	const [eDate, setEDate] = useState('')

	const dateInputMask = function dateInputMask(elm) {
		elm.addEventListener('keypress', function (e) {
			if (e.keyCode < 47 || e.keyCode > 57) {
				e.preventDefault()
			}

			const len = elm.value.length

			// If we're at a particular place, let the user type the slash
			// i.e., 12/12/1212
			if (len !== 1 || len !== 3) {
				if (e.keyCode == 47) {
					e.preventDefault()
				}
			}

			// If they don't add the slash, do it for them...
			if (len === 2) {
				elm.value += '.'
			}

			// If they don't add the slash, do it for them...
			if (len === 5) {
				elm.value += '.'
			}
		})
	}

	const monthNames = [
		'Январь',
		'Февраль',
		'Март',
		'Апрель',
		'Май',
		'Июнь',
		'Июль',
		'Август',
		'Сентябрь',
		'Октябрь',
		'Ноябрь',
		'Декабрь',
	]

	const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
	//2 yours for now (get date) (generayte array of strings like 2023, 2024, ...). Only years
	const yearsGen = () => {
		const currentYear = new Date().getFullYear()
		const years = []
		for (let i = 0; i < 3; i++) {
			years.push(currentYear + i)
		}
		return years
	}

	const years = yearsGen()
	// const [value, setValue] = useState(years)
	const [isOpen, setIsOpen] = useState<boolean>(false)
	const [currentYear, setCurrentYear] = useState<number>(
		new Date().getFullYear(),
	)
	const [currentMonth, setCurrentMonth] = useState<number>(
		new Date().getMonth(),
	)
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [tempYear, setTempYear] = useState<number>(currentYear)
	const [tempMonth, setTempMonth] = useState<number>(currentMonth)
	const inputRef = useRef<HTMLInputElement>(null)
	const calendarRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const parsedDate = value ? new Date(value) : new Date()
		setSelectedDate(parsedDate)
		setTempYear(parsedDate.getFullYear())
		setTempMonth(parsedDate.getMonth())
	}, [value])

	const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate()
	const firstDayOfMonth = new Date(tempYear, tempMonth, 1).getDay()

	const prevMonth = () => {
		setTempMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1))
		setTempYear((prevYear) => (prevMonth === 0 ? prevYear - 1 : prevYear))
	}

	const nextMonth = () => {
		setTempMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1))
		setTempYear((prevYear) => (prevMonth === 11 ? prevYear + 1 : prevYear))
	}

	const handleDateClick = (day: number) => {
		if (selectedDate) {
			const newDate = new Date(selectedDate)
			newDate.setDate(day)
			newDate.setMonth(tempMonth)
			newDate.setFullYear(tempYear)
			setSelectedDate(newDate)

			// Update currentYear and currentMonth
			setCurrentYear(newDate.getFullYear())
			setCurrentMonth(newDate.getMonth())

			if (inputRef.current) {
				inputRef.current.value = formatDate(newDate)
			}

			onChange(newDate)
		}
	}

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				calendarRef.current &&
				!calendarRef.current.contains(event.target as Node)
			) {
				setIsOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	useEffect(() => {
		if (isOpen && calendarRef.current && inputRef.current) {
			const inputRect = inputRef.current.getBoundingClientRect()
			const {innerHeight: windowHeight, innerWidth: windowWidth} = window
			const calendarHeight = calendarRef.current.getBoundingClientRect().height
			let top = inputRect.bottom
			let left = inputRect.left
			const width = inputRect.width

			if (top + calendarHeight > windowHeight) {
				top = Math.max(0, inputRect.top - calendarHeight)
			}

			if (left + width > windowWidth) {
				left = Math.max(0, windowWidth - width)
			}

			calendarRef.current.style.position = 'fixed'
			calendarRef.current.style.top = `${top}px`
			calendarRef.current.style.left = `${left}px`
			calendarRef.current.style.zIndex = '9999'
		}
	}, [isOpen])

	return (
		<div className={s.container}>
			<div className={s.input__init}>
				<input
				disabled={disabled}
					type="text"
					value={formatDate(selectedDate ? selectedDate : new Date())}
					onClick={() => setIsOpen(!isOpen)}
					readOnly
					ref={inputRef}
					id={`minicalendar__input-id-${calendarId}`}
				/>
				<label htmlFor={`minicalendar__input-id-${calendarId}`}>
					<CalendarMonthIcon />
				</label>
			</div>
			{ReactDOM.createPortal(
				isOpen ? (
					<div className={s.wrapper} ref={calendarRef}>
						<button className={s.closeButton} onClick={() => setIsOpen(false)}>
							<CloseIcon className={s.closeIcon} />
						</button>
						<pr.Calendar
						disabled={disabled}
							value={value}
							onChange={onChange}
							numberOfMonths={1}
							disableMonthPicker={false}
							disableYearPicker={true}
							months={monthNames}
							weekDays={weekDays}
							// range
							className={s.Calendar}
							// minDate={Date.now()}
							monthYearSeparator=" "
							mapDays={({
								date,
								today,
								selectedDate,
								currentMonth,
								isSameDate,
							}) => {
								const props = {}

								props.style = {
									borderRadius: '18px',
									backgrounddivor: isSameDate(date, selectedDate)
										? '#4169E1'
										: '',
									// divor: 'white',4169E1
								}

								if (isSameDate(date, today))
									props.style = {
										...props.style,
										divor: '#4169E1',
									}

								if (isSameDate(date, selectedDate))
									props.style = {
										...props.style,
										divor: 'white',
										backgrounddivor: '#4169E1',
									}

								return props
							}}
							renderButton={(direction, handleClick) => (
								<button onClick={handleClick}>
									{direction === 'right' ? (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="24"
											height="24"
											viewBox="0 0 24 24"
											className="mr-3"
											fill="none">
											<path
												d="M10.5 17L15.5 12L10.5 7"
												stroke="#808080"
												stroke-width="1.4"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									) : (
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="8"
											height="12"
											viewBox="0 0 8 12"
											className="ml-3"
											fill="none">
											<path
												d="M6.5 11L1.5 6L6.5 1"
												stroke="#808080"
												stroke-width="1.4"
												stroke-linecap="round"
												stroke-linejoin="round"
											/>
										</svg>
									)}
								</button>
							)}
						/>
					</div>
				) : null,
				document.body,
			)}
		</div>
	)
}
export const formatDate = (date: Date): string => {
	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const year = date.getFullYear().toString()
	return `${day}.${month}.${year}`
}
export default MiniCalendar
