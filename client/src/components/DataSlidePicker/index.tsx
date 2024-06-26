import React from 'react'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useDispatch, useSelector} from 'react-redux'
import * as mui from '@mui/base'
import CalendarPopUp from '../CalendarPopUp/index'
import './index.css'
interface IDataSlidePicker {
	defaultValueId?: number
	data?: string[]
	onChange?: (id: number, data: string) => void
	className?: string
	dateMode?: boolean
}

const DataSlidePicker = ({
	defaultValueId,
	data,
	onChange,
	className,
	dateMode,
}: IDataSlidePicker) => {
	const currentMonth = useSelector((state: any) => state.currentMonth)
	const currentYear = useSelector((state: any) => state.currentYear)
	const [value, setValue] = React.useState(
		dateMode ? currentMonth : defaultValueId,
	)
	const dispath = useDispatch()
	const [selectOpen, setSelectOpen] = React.useState<false>(false)

	//for date mode
	const months = [
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

	const handleChange = (id: number) => {
		if (id === -1) id = data!.length - 1
		if (id === data?.length) id = 0
		setValue(id)
		if (onChange) onChange(id, data![id])
	}
	console.log(months[currentMonth], currentMonth, 'months[currentMonth]')

	const handleChangeDate = (id: number) => {
		//change months for date mode. If month 'Январь' and year 2024 and click first arrow will be 'Декабрь' and year 2023
		if (id === -1) {
			id = months.length - 1
			dispath({type: 'SET_CURRENT_YEAR', payload: currentYear - 1})
		}
		if (id === months.length) {
			id = 0
			dispath({type: 'SET_CURRENT_YEAR', payload: currentYear + 1})
		}

		dispath({
			type: 'SET_CURRENT_MONTH',
			payload: {month: id, year: currentYear},
		})
		setValue(id)
	}

	return (
		<div className={s.dataSlidePicker + ' ' + (className || '')}>
			<button
				className={s.btn}
				onClick={() => {
					dateMode ? handleChangeDate(value - 1) : handleChange(value - 1)
				}}>
				<span>
					<Arrow direction={ArrowType.left} />
				</span>
			</button>
			<mui.Select
				listboxOpen={selectOpen}
				className={s.muiSelect}
				multiple={true}
				onClick={() => setSelectOpen(true)}
				renderValue={(option: mui.SelectOption<number> | null) => {
					if (option == null || option.value === null) {
						return (
							<>
								<p className={s.btnText}>
									{dateMode
										? `${months[currentMonth]} ${currentYear}г.`
										: data![value]}
								</p>
							</>
						)
					}
					return (
						<>
							<p className={s.btnText}>
								{dateMode
									? `${months[currentMonth]} ${currentYear}г.`
									: data![value]}
							</p>
						</>
					)
				}}>
				<mui.Option className={s.muiOption} value={1}>
					<CalendarPopUp onExit={()=> setSelectOpen(false)}/>
				</mui.Option>
			</mui.Select>

			<button
				className={s.btn}
				onClick={() => {
					dateMode ? handleChangeDate(value + 1) : handleChange(value + 1)
				}}>
				<span>
					<Arrow direction={ArrowType.right} />
				</span>
			</button>
		</div>
	)
}

export default DataSlidePicker
