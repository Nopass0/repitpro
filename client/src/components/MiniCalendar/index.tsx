import React, {useState, useRef, useEffect} from 'react'
import ReactDOM from 'react-dom'
import styles from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'

interface CalendarProps {
	value?: string
	onChange: (value: Date) => void
}

const MiniCalendar: React.FC<CalendarProps> = ({
	value = formatDate(new Date()),
	onChange,
}) => {
	const [isOpen, setIsOpen] = useState(false)
	const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
	const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
	const [selectedDate, setSelectedDate] = useState<Date | null>(null)
	const [tempYear, setTempYear] = useState(currentYear)
	const [tempMonth, setTempMonth] = useState(currentMonth)
	const inputRef = useRef<HTMLInputElement>(null)
	const calendarRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const parsedDate = value ? new Date(value) : new Date()
		setCurrentYear(parsedDate.getFullYear())
		setCurrentMonth(parsedDate.getMonth())
		setSelectedDate(parsedDate)
		setTempYear(parsedDate.getFullYear())
		setTempMonth(parsedDate.getMonth())
	}, [value])

	const daysInMonth = new Date(tempYear, tempMonth + 1, 0).getDate()
	let firstDayOfMonth = new Date(tempYear, tempMonth, 1).getDay() - 1
	if (firstDayOfMonth < 0) firstDayOfMonth = 6

	const prevMonth = () => {
		setTempMonth((prevMonth) => (prevMonth === 0 ? 11 : prevMonth - 1))
		setTempYear((prevYear) => (tempMonth === 0 ? prevYear - 1 : prevYear))
	}

	const nextMonth = () => {
		setTempMonth((prevMonth) => (prevMonth === 11 ? 0 : prevMonth + 1))
		setTempYear((prevYear) => (tempMonth === 11 ? prevYear + 1 : prevYear))
	}

	const renderDays = () => {
		const days = []
		let day = 1
		for (let i = 0; i < 6; i++) {
			const week = []
			for (let j = 0; j < 7; j++) {
				if (i === 0 && j < firstDayOfMonth) {
					week.push(<td key={`empty-${j}`}></td>)
				} else if (day > daysInMonth) {
					break
				} else {
					const isWeekend = j === 5 || j === 6
					const isSelected =
						selectedDate &&
						selectedDate.getDate() === day &&
						selectedDate.getMonth() === tempMonth &&
						selectedDate.getFullYear() === tempYear
					week.push(
						<td
							key={day}
							className={`${isWeekend ? styles.weekend : ''} ${
								isSelected ? styles.selected : ''
							}`}
							onClick={() => handleDateClick(day)}>
							<span
								className={`${styles.dateCircle} ${
									isSelected ? styles.selected : ''
								}`}>
								{day}
							</span>
						</td>,
					)
					day++
				}
			}
			days.push(<tr key={i}>{week}</tr>)
		}
		return days
	}

	const handleDateClick = (day: number) => {
		const selectedDate = new Date(tempYear, tempMonth, day)
		setSelectedDate(selectedDate)
		setCurrentYear(tempYear)
		setCurrentMonth(tempMonth)
		const formattedDate = formatDate(selectedDate)
		onChange(selectedDate)
		console.log(
			'Calendar data temp: ',
			currentYear,
			'- Current year',
			currentMonth,
			'- Current month',
			tempMonth,
			'- Temp month',
			tempYear,
			'- Temp year',
			selectedDate,
			'- Selected date',
			formattedDate,
		)
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
			calendarRef.current.style.position = 'fixed'
			calendarRef.current.style.left = `${inputRect.left}px`
			calendarRef.current.style.top = `${inputRect.bottom}px`
			calendarRef.current.style.zIndex = '9999'
		}
	}, [isOpen])

	return (
		<div className={styles.container}>
			<input
				type="text"
				value={formatDate(value ? new Date(value) : new Date())}
				onClick={() => setIsOpen(!isOpen)}
				readOnly
				ref={inputRef}
			/>
			{ReactDOM.createPortal(
				isOpen ? (
					<div
						className={`${styles.calendarWrapper} ${isOpen ? styles.open : ''}`}
						ref={calendarRef}
						onClick={(e) => e.stopPropagation()}>
						<div className={styles.calendar}>
							<div className={styles.header}>
								<div>
									<span className={styles.monthYear}>
										{tempYear}{' '}
										{new Date(tempYear, tempMonth).toLocaleString('ru-RU', {
											month: 'long',
										})}
									</span>
									<button className={styles.navButton} onClick={prevMonth}>
										<Arrow
											direction={ArrowType.left}
											className={styles.arrow}
										/>
									</button>
									<button className={styles.navButton} onClick={nextMonth}>
										<Arrow
											direction={ArrowType.right}
											className={styles.arrow}
										/>
									</button>
								</div>
								<button
									className={styles.closeButton}
									onClick={() => setIsOpen(false)}>
									&#10005;
								</button>
							</div>
							<table>
								<thead>
									<tr>
										<th>Пн</th>
										<th>Вт</th>
										<th>Ср</th>
										<th>Чт</th>
										<th>Пт</th>
										<th className={styles.weekend}>Сб</th>
										<th className={styles.weekend}>Вс</th>
									</tr>
								</thead>
								<tbody>{renderDays()}</tbody>
							</table>
						</div>
					</div>
				) : null,
				document.body,
			)}
		</div>
	)
}

const formatDate = (date: Date): string => {
	const day = date.getDate().toString().padStart(2, '0')
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const year = date.getFullYear()
	return `${day}.${month}.${year}`
}

export default MiniCalendar
