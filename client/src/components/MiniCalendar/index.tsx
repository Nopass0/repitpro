import React, {useState, useRef, useEffect} from 'react'
import ReactDOM from 'react-dom'
import styles from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import CloseIcon from '@mui/icons-material/Close'
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth'

interface CalendarProps {
	value?: string
	onChange: (value: Date) => void
}

const MiniCalendar: React.FC<CalendarProps> = ({
	value = formatDate(new Date()),
	onChange,
}) => {
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

	const renderDays = () => {
		const days = []
		let day = 1

		// Determine how many empty cells to render at the start
		const startOffset = (firstDayOfMonth + 6) % 7

		for (let i = 0; i < 6; i++) {
			const week = []
			for (let j = 0; j < 7; j++) {
				if (i === 0 && j < startOffset) {
					// Render empty cell
					week.push(<td key={`empty-${j}`}></td>)
				} else if (day > daysInMonth) {
					// Stop rendering if we've reached the end of the month
					break
				} else {
					const isSelected =
						selectedDate &&
						selectedDate.getDate() === day &&
						selectedDate.getMonth() === tempMonth &&
						selectedDate.getFullYear() === tempYear
					week.push(
						<td
							key={day}
							className={`${isSelected ? styles.selected : ''}`}
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
			if (day > daysInMonth) break // Break the loop if we've rendered all days
		}
		return days
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
			let width = inputRect.width

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
		<div className={styles.container}>
			<div className={styles.input__init}>
				<input
					type="text"
					value={formatDate(selectedDate ? selectedDate : new Date())}
					onClick={() => setIsOpen(!isOpen)}
					readOnly
					ref={inputRef}
					id="minicalendar__input-id"
				/>
				<label htmlFor="minicalendar__input-id">
					<CalendarMonthIcon />
				</label>
			</div>
			{ReactDOM.createPortal(
				isOpen ? (
					<div
						className={`${styles.calendarWrapper} ${isOpen ? styles.open : ''}`}
						ref={calendarRef}
						onClick={(e) => e.stopPropagation()}>
						<div className={styles.calendar}>
							<button
								className={styles.closeButton}
								onClick={() => setIsOpen(false)}>
								<CloseIcon className={styles.closeIcon} />
							</button>
							<div className={styles.header}>
								<div className={styles.header__init}>
									<span className={styles.monthYear}>
										{new Date(tempYear, tempMonth).toLocaleString('ru-RU', {
											month: 'long',
										})}{' '}
										{tempYear}
									</span>
									<div className={styles.navButtons}>
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
								</div>
							</div>
							<table className={styles.table}>
								<thead className={styles.thead}>
									<tr className={styles.tr}>
										<th>Пн</th>
										<th>Вт</th>
										<th>Ср</th>
										<th>Чт</th>
										<th>Пт</th>
										<th className={styles.weekend}>Сб</th>
										<th className={styles.weekend}>Вс</th>
									</tr>
								</thead>
								<tbody className={styles.tbody}>{renderDays()}</tbody>
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
	const year = date.getFullYear().toString()
	return `${day}.${month}.${year}`
}
export default MiniCalendar
