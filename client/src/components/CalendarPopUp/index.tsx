import React from 'react'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useDispatch, useSelector} from 'react-redux'
import CloseIcon from '@mui/icons-material/Close'
interface CalendarPopUpProps {
	onExit?: () => void
}

const CalendarPopUp: React.FC<CalendarPopUpProps> = ({
	onExit,
}: CalendarPopUpProps) => {
	const dispath = useDispatch()
	const currentYear = useSelector((state: any) => state.currentYear)
	const currentMonth = useSelector((state: any) => state.currentMonth)

	const setYear = (year: number) => {
		dispath({
			type: 'SET_CURRENT_YEAR',
			payload: year,
		})
	}

	const handlePrevYear = () => {
		setYear(currentYear - 1)
	}

	const handleNextYear = () => {
		setYear(currentYear + 1)
	}

	const setMonth = (mounth: number) => {
		dispath({
			type: 'SET_CURRENT_MONTH',
			payload: {month: mounth, year: currentYear},
		})
	}

	return (
		<div className={s.wrapper}>
			<div className={s.Header}>
				<div></div>
				<div className={s.Header__inside}>
					<button className={s.ArrowBtn} onClick={handlePrevYear}>
						<Arrow direction={ArrowType.left} />
					</button>
					<h1 className={s.Year}>{currentYear}</h1>
					<button className={s.ArrowBtn} onClick={handleNextYear}>
						<Arrow direction={ArrowType.right} />
					</button>
				</div>
				<CloseIcon style={{cursor: 'pointer', color:'red', position: 'relative', bottom: '15px', left: '15px'}} onClick={onExit} />
			</div>
			<div className={s.Main}>
				<table className={s.Table}>
					<tbody className={s.TBody}>
						<tr className={s.Tr}>
							<td
								onClick={() => {
									setMonth(0)
								}}
								className={s.Td + '  ' + (currentMonth === 0 && s.active)}>
								Янв
							</td>
							<td
								onClick={() => {
									setMonth(1)
								}}
								className={s.Td + '  ' + (currentMonth === 1 && s.active)}>
								Фев
							</td>
							<td
								onClick={() => {
									setMonth(2)
								}}
								className={s.Td + '  ' + (currentMonth === 2 && s.active)}>
								Мар
							</td>
							<td
								onClick={() => {
									setMonth(3)
								}}
								className={s.Td + '  ' + (currentMonth === 3 && s.active)}>
								Апр
							</td>
						</tr>
						<tr className={s.Tr}>
							<td
								onClick={() => {
									setMonth(4)
								}}
								className={s.Td + '  ' + (currentMonth === 4 && s.active)}>
								Май
							</td>
							<td
								onClick={() => {
									setMonth(5)
								}}
								className={s.Td + '  ' + (currentMonth === 5 && s.active)}>
								Июн
							</td>
							<td
								onClick={() => {
									setMonth(6)
								}}
								className={s.Td + '  ' + (currentMonth === 6 && s.active)}>
								Июл
							</td>
							<td
								onClick={() => {
									setMonth(7)
								}}
								className={s.Td + '  ' + (currentMonth === 7 && s.active)}>
								Авг
							</td>
						</tr>
						<tr className={s.Tr}>
							<td
								onClick={() => {
									setMonth(8)
								}}
								className={s.Td + '  ' + (currentMonth === 8 && s.active)}>
								Сен
							</td>
							<td
								onClick={() => {
									setMonth(9)
								}}
								className={s.Td + '  ' + (currentMonth === 9 && s.active)}>
								Окт
							</td>
							<td
								onClick={() => {
									setMonth(10)
								}}
								className={s.Td + '  ' + (currentMonth === 10 && s.active)}>
								Ноя
							</td>
							<td
								onClick={() => {
									setMonth(11)
								}}
								className={s.Td + '  ' + (currentMonth === 11 && s.active)}>
								Дек
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	)
}

export default CalendarPopUp
