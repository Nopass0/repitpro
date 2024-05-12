import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
	scales,
	BarElement,
} from 'chart.js'
import {Bar, Line as LineGraph} from 'react-chartjs-2'
import s from './index.module.scss'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import CloseIcon from '@mui/icons-material/Close'
import {useEffect, useState} from 'react'
import {Checkbox, ListItemText, MenuItem, Select, styled} from '@mui/material'
import Line from '../../components/Line'
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {ru} from 'date-fns/locale/ru'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3'

import {useNavigate} from 'react-router-dom'
import {useSelector} from 'react-redux'
import CheckBox from '../CheckBox'
import MiniCalendar from '../MiniCalendar'

interface IGraphicBlock {
	className?: string
	style?: React.CSSProperties
	names?: any

	ItemState?: any
	DateState?: any
	DateStartState?: any
	DateEndState?: any
	data?: any
	options?: any
	optionsBar?: any
	chooseGraphic?: any
	title?: string
	isClient?: boolean

	OnChangeItem?: (e: any) => void
	OnChangeDate?: (e: any) => void
	OnChangeDateStart?: (e: any) => void
	OnChangeDateEnd?: (e: any) => void

	StyledPickersLayout?: any
}

const GraphicBlock: React.FC<IGraphicBlock> = ({
	className,
	style,
	isClient,
	names,

	ItemState,
	DateState,
	DateStartState,
	DateEndState,
	data,
	options,
	optionsBar,
	chooseGraphic,
	OnChangeItem,
	OnChangeDate,
	OnChangeDateStart,
	OnChangeDateEnd,
	title,

	StyledPickersLayout,
}: IGraphicBlock) => {
	const [item, setItem] = useState<string[]>(['Все предметы'])
	const [date, setDate] = useState<number>(0)
	const [dateStart, setDateStart] = useState<Date | null>(null)
	const [dateEnd, setDateEnd] = useState<Date | null>(null)
	return (
		<>
			<div className={s.GraphicBlock}>
				<div className={s.MenuForGraphic}>
					{!isClient && (
						<>
							<Select
								multiple
								className={s.muiSelect}
								value={ItemState || ['Все предметы']}
								renderValue={(selected) => selected.join(', ')}
								onChange={OnChangeItem}
								variant={'standard'}>
								{names.map((name: any, index: number) => (
									<MenuItem value={name} key={index}>
										<Checkbox checked={ItemState.indexOf(name) > -1} />
										<ListItemText primary={name} />
									</MenuItem>
								))}
							</Select>
							<Line width="260px" />
						</>
					)}
					<Select
						className={s.muiSelect}
						value={DateState}
						onChange={OnChangeDate}
						variant={'standard'}>
						<MenuItem value={0}>
							<p>За последние 30 дней</p>
						</MenuItem>
						<MenuItem value={1}>
							<p>С начала месяца</p>
						</MenuItem>
						<MenuItem value={2}>
							<p>С начала года</p>
						</MenuItem>
						<MenuItem value={3}>
							<p>За всё время</p>
						</MenuItem>
						<MenuItem value={4}>
							<p>Задать период</p>
						</MenuItem>
					</Select>
					<Line width="260px" />
					<div className={s.Dates}>
						<div className={s.DatePicker}>
							<MiniCalendar
								value={DateStartState}
								onChange={(newData) => OnChangeDateStart(newData)}
							/>
						</div>
						<Line width="20px" className={s.LineDate} />
						<div className={s.DatePicker}>
							<LocalizationProvider
								dateAdapter={AdapterDateFns}
								adapterLocale={ru}>
								<DatePicker
									value={DateEndState}
									onChange={OnChangeDateEnd}
									slots={{
										layout: StyledPickersLayout,
									}}
									sx={{
										input: {
											paddingTop: '0px',
											paddingBottom: '0px',
											paddingLeft: '4px',
											fontWeight: '500',
										},
										svg: {
											width: '18px',
											height: '18px',
										},
									}}
									timezone="system"
									showDaysOutsideCurrentMonth
								/>
							</LocalizationProvider>
						</div>
					</div>
					<div className={s.DataBlock}>
						<p></p>
						<p></p>
						<p style={{fontWeight: '500', textAlign: 'center'}}>Рубли</p>
						<p style={{fontWeight: '500', textAlign: 'center'}}>%</p>
						<CheckBox size="16px" color="red" />
						<p>Всего</p>
						<p style={{textAlign: 'center'}}>2000</p>
						<p style={{textAlign: 'center'}}>100</p>
						<CheckBox size="16px" color="blue" />
						<p
							style={{
								textAlign: 'center',
								display: 'flex',
								alignItems: 'center',
							}}>
							На дому
						</p>
						<p
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							2000
						</p>
						<p
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							100
						</p>
					</div>
				</div>
				{(() => {
					switch (chooseGraphic) {
						case 0: {
							return (
								<div className={s.ChartWrap}>
									<p>{title}</p>
									<div className={s.chart_container}>
										<LineGraph
											className={s.Graphic}
											data={data}
											options={options}
										/>
									</div>
								</div>
							)
						}

						case 1: {
							return (
								<div className={s.ChartWrap}>
									<p>{title}</p>
									<div className={s.chart_container}>
										<Bar
											className={s.Graphic}
											data={data}
											options={optionsBar}
										/>
									</div>
								</div>
							)
						}
					}
				})()}
			</div>
		</>
	)
}

export default GraphicBlock
