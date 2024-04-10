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
import {useState} from 'react'
import {Checkbox, ListItemText, MenuItem, Select, styled} from '@mui/material'
import Line from '../../components/Line'
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {ru} from 'date-fns/locale/ru'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3'

import CheckBox from '../../components/CheckBox'
import {useNavigate} from 'react-router-dom'

ChartJS.register(
	ArcElement,
	Tooltip,
	Legend,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
	BarElement,
)

interface IStatistics {}

const getLabels = () => {
	let labels = []
	for (let i = 0; i < 200; i++) {
		labels.push(i)
	}
	return labels
}

const getDatasets = () => {
	let datasets = []
	for (let i = 0; i < 200; i++) {
		//сделай плавный график волнистый (каждая точка должна отличаться от предыдущей максимальной разницей в 10)
		let a = Math.abs(Math.random() * Math.abs(Math.cos(i)))
		if (datasets[i - 1] - a < Math.E) {
			if (datasets[i - 1] - a > 0) {
				a = datasets[i - 1] - a * 0.1
			} else {
				a = datasets[i - 1] + datasets[i - 1] * 0.06
			}
		}
		datasets.push(a)
	}
	return datasets
}

const options = {
	responsive: true,
	maintainAspectRatio: false,

	//width and height
	aspectRatio: 2,

	plugins: {
		legend: {
			//off
			display: false,
		},
		title: {
			display: false,
		},
		tooltip: {
			enabled: true,
		},

		//плавнее

		scales: {
			x: {
				ticks: {
					display: false,
				},
				grid: {
					display: false,
				},
			},
			y: {
				ticks: {
					display: false,
				},
				grid: {
					display: false,
				},
			},
		},
	},
}

const optionsBar = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			//off
			display: false,
		},
		title: {
			display: true,
			text: 'Chart.js Bar Chart - Stacked',
		},
	},
	scales: {
		x: {
			stacked: true,
		},
		y: {
			stacked: true,
		},
	},
	//width and height
	aspectRatio: 2,
}
const labels = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
]

let data = {
	labels: labels,
	datasets: [
		{
			label: 'Dataset 1',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#FF0000',
			borderColor: '#FF0000',
		},
		{
			label: 'Dataset 2',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#9747FF',
			borderColor: '#9747FF',
		},
		{
			label: 'Dataset 3',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#0027FF',
			borderColor: '#0027FF',
		},
		{
			label: 'Dataset 4',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#25991C',
			borderColor: '#25991C',
		},
		{
			label: 'Dataset 5',
			data: getDatasets(),
			fill: false,
			backgroundColor: '#C7CB00',
			borderColor: '#C7CB00',
		},
	],
}
const StyledPickersLayout = styled('span')({
	'.MuiDateCalendar-root': {
		color: '#25991c',
		borderRadius: 2,
		borderWidth: 1,
		borderColor: '#25991c',
		border: '1px solid',
		// backgroundColor: '#bbdefb',
	},
	'.MuiPickersDay-today': {
		border: '1px solid #25991c ',
	},
	'.Mui-selected': {
		color: '#fff',
		backgroundColor: '#25991c !important',
	},
	'.Mui-selected:focus': {
		color: '#fff',
		backgroundColor: '#25991c',
	},
	'.MuiButtonBase-root:focus': {
		color: '#fff',
		backgroundColor: '#25991c',
	},
	'.MuiPickersYear-yearButton .Mui-selected:focus': {
		color: '#fff',
		backgroundColor: '#25991c',
	},
})
const Statistics = ({}: IStatistics) => {
	const navigate = useNavigate()

	const names = [
		'Все предметы',
		'Математика',
		'Русский язык',
		'Информатика',
		'Физика',
		'Химия',
	]
	const generateData = (
		count: number,
	): Array<{
		name: string
		lessons: string
		cancel: string
		income: string
		consumption: string
		duty: string
	}> => {
		const data: Array<{
			name: string
			lessons: string
			cancel: string
			income: string
			consumption: string
			duty: string
		}> = []
		for (let i = 0; i < count; i++) {
			data.push({
				name: Math.random().toString(36).substring(2, 10),
				lessons: Math.floor(Math.random() * 100).toString(),
				cancel: Math.floor(Math.random() * 10).toString(),
				income: (Math.floor(Math.random() * 10000) + 5000).toString(),
				consumption: (Math.floor(Math.random() * 2000) + 1000).toString(),
				duty: (Math.floor(Math.random() * 10000) + 500).toString(),
			})
		}
		return data
	}
	const dataTable = generateData(50)

	const [chooseGraphic, setChooseGraphic] = useState<number>(0)

	const [studFinItem, setStudFinItem] = useState<string[]>(['Все предметы'])
	const [studFinDate, setStudFinDate] = useState<number>(0)
	const [studFinDateStart, setStudFinDateStart] = useState<Date>()
	const [studFinDateEnd, setStudFinDateEnd] = useState<Date>()
	const [studFinCheck2, setStudFinCheck2] = useState<boolean>(true)
	const [studFinCheck1, setStudFinCheck1] = useState<boolean>(true)

	const [studAmItem, setStudAmItem] = useState<number>(0)
	const [studAmDate, setStudAmDate] = useState<number>(0)
	const [studAmDateStart, setStudAmDateStart] = useState<Date>()
	const [studAmDateEnd, setStudAmDateEnd] = useState<Date>()
	const [studAmCheck2, setStudAmCheck2] = useState<boolean>(true)
	const [studAmCheck1, setStudAmCheck1] = useState<boolean>(true)

	const [studLesItem, setStudLesItem] = useState<number>(0)
	const [studLesDate, setStudLesDate] = useState<number>(0)
	const [studLesDateStart, setStudLesDateStart] = useState<Date>()
	const [studLesDateEnd, setStudLesDateEnd] = useState<Date>()
	const [studLesCheck2, setStudLesCheck2] = useState<boolean>(true)
	const [studLesCheck1, setStudLesCheck1] = useState<boolean>(true)

	const [cliFinItem, setCliFinItem] = useState<number>(0)
	const [cliFinDate, setCliFinDate] = useState<number>(0)
	const [cliFinDateStart, setCliFinDateStart] = useState<Date>()
	const [cliFinDateEnd, setCliFinDateEnd] = useState<Date>()
	const [cliFinCheck2, setCliFinCheck2] = useState<boolean>(true)
	const [cliFinCheck1, setCliFinCheck1] = useState<boolean>(true)

	const [cliAmItem, setCliAmItem] = useState<number>(0)
	const [cliAmDate, setCliAmDate] = useState<number>(0)
	const [cliAmDateStart, setCliAmDateStart] = useState<Date>()
	const [cliAmDateEnd, setCliAmDateEnd] = useState<Date>()
	const [cliAmCheck2, setCliAmCheck2] = useState<boolean>(true)
	const [cliAmCheck1, setCliAmCheck1] = useState<boolean>(true)

	const [cliWorkItem, setCliWorkItem] = useState<number>(0)
	const [cliWorkDate, setCliWorkDate] = useState<number>(0)
	const [cliWorkDateStart, setCliWorkDateStart] = useState<Date>()
	const [cliWorkDateEnd, setCliWorkDateEnd] = useState<Date>()
	const [cliWorkCheck2, setCliWorkCheck2] = useState<boolean>(true)
	const [cliWorkCheck1, setCliWorkCheck1] = useState<boolean>(true)

	const [studRelatItem, setStudRelatItem] = useState<number>(0)
	const [studRelatDate, setStudRelatDate] = useState<number>(0)
	const [studRelatDateStart, setStudRelatDateStart] = useState<Date>()
	const [studRelatDateEnd, setStudRelatDateEnd] = useState<Date>()
	const [studRelatCheck2, setStudRelatCheck2] = useState<boolean>(true)
	const [studRelatCheck1, setStudRelatCheck1] = useState<boolean>(true)

	const [sortColumn, setSortColumn] = useState(null)
	const [sortDirection, setSortDirection] = useState(null)

	const handleSort = (column: any) => {
		if (sortColumn === column) {
			if (sortDirection === 'asc') {
				setSortDirection('desc')
			} else if (sortDirection === 'desc') {
				setSortColumn(null)
				setSortDirection(null)
			} else {
				setSortDirection('asc')
			}
		} else {
			setSortColumn(column)
			setSortDirection('asc')
		}
	}

	const sortData = (data: any, column: any, direction: any) => {
		if (direction === 'asc') {
			return data.sort((a: any, b: any) => {
				if (column === 'name') {
					return a[column].localeCompare(b[column])
				} else {
					return a[column] - b[column]
				}
			})
		} else if (direction === 'desc') {
			return data.sort((a, b) => {
				if (column === 'name') {
					return b[column].localeCompare(a[column])
				} else {
					return b[column] - a[column]
				}
			})
		} else {
			return data
		}
	}

	const sortedData = sortData(
		[
			{
				name: 'Viva',
				lessons: 70,
				cancel: 32,
				income: 19,
				consumption: 4,
				duty: 29,
			},
			{
				name: 'It',
				lessons: 47,
				cancel: 53,
				income: 73,
				consumption: 87,
				duty: 35,
			},
			{
				name: 'Fintone',
				lessons: 25,
				cancel: 36,
				income: 34,
				consumption: 10,
				duty: 72,
			},
			{
				name: 'Viva',
				lessons: 56,
				cancel: 33,
				income: 30,
				consumption: 29,
				duty: 21,
			},
			{
				name: 'Holdlamis',
				lessons: 48,
				cancel: 99,
				income: 57,
				consumption: 29,
				duty: 43,
			},
			{
				name: 'Kanlam',
				lessons: 65,
				cancel: 77,
				income: 15,
				consumption: 93,
				duty: 30,
			},
			{
				name: 'Otcom',
				lessons: 76,
				cancel: 8,
				income: 64,
				consumption: 15,
				duty: 64,
			},
			{
				name: 'Redhold',
				lessons: 88,
				cancel: 10,
				income: 50,
				consumption: 57,
				duty: 68,
			},
			{
				name: 'Zontrax',
				lessons: 36,
				cancel: 69,
				income: 75,
				consumption: 24,
				duty: 68,
			},
			{
				name: 'Bigtax',
				lessons: 22,
				cancel: 32,
				income: 42,
				consumption: 31,
				duty: 60,
			},
			{
				name: 'Rank',
				lessons: 40,
				cancel: 89,
				income: 68,
				consumption: 14,
				duty: 57,
			},
			{
				name: 'Konklab',
				lessons: 82,
				cancel: 41,
				income: 100,
				consumption: 64,
				duty: 5,
			},
			{
				name: 'Konklab',
				lessons: 36,
				cancel: 22,
				income: 57,
				consumption: 29,
				duty: 96,
			},
			{
				name: 'Greenlam',
				lessons: 64,
				cancel: 15,
				income: 14,
				consumption: 82,
				duty: 20,
			},
			{
				name: 'Daltfresh',
				lessons: 40,
				cancel: 83,
				income: 37,
				consumption: 6,
				duty: 13,
			},
			{
				name: 'Sonsing',
				lessons: 36,
				cancel: 81,
				income: 80,
				consumption: 46,
				duty: 94,
			},
			{
				name: 'Job',
				lessons: 2,
				cancel: 49,
				income: 79,
				consumption: 90,
				duty: 12,
			},
			{
				name: 'Veribet',
				lessons: 32,
				cancel: 51,
				income: 65,
				consumption: 23,
				duty: 97,
			},
			{
				name: 'Transcof',
				lessons: 42,
				cancel: 39,
				income: 2,
				consumption: 45,
				duty: 80,
			},
			{
				name: 'Cookley',
				lessons: 93,
				cancel: 59,
				income: 28,
				consumption: 34,
				duty: 45,
			},
			{
				name: 'Vagram',
				lessons: 47,
				cancel: 16,
				income: 34,
				consumption: 40,
				duty: 76,
			},
			{
				name: 'Cardguard',
				lessons: 57,
				cancel: 94,
				income: 25,
				consumption: 39,
				duty: 95,
			},
			{
				name: 'Bitwolf',
				lessons: 99,
				cancel: 62,
				income: 99,
				consumption: 35,
				duty: 22,
			},
			{
				name: 'Flowdesk',
				lessons: 21,
				cancel: 42,
				income: 59,
				consumption: 45,
				duty: 100,
			},
			{
				name: 'Overhold',
				lessons: 85,
				cancel: 41,
				income: 50,
				consumption: 84,
				duty: 72,
			},
		],
		sortColumn,
		sortDirection,
	)

	return (
		<>
			<div className={s.wrapper}>
				<div className={s.Header}>
					<button
						onClick={() => {
							setChooseGraphic(0)
						}}>
						<ShowChartIcon
							className={`${chooseGraphic === 0 && s.activeIcon} ${s.Icon}`}
						/>
					</button>
					<button
						onClick={() => {
							setChooseGraphic(1)
						}}>
						<BarChartIcon
							className={`${chooseGraphic === 1 && s.activeIcon} ${s.Icon}`}
						/>
					</button>
					<button onClick={() => navigate('../')}>
						<CloseIcon className={s.CloseIcon} />
					</button>
				</div>
				<div className={s.MainBlock}>
					<div className={s.GraphicBlock}>
						<div className={s.MenuForGraphic}>
							<Select
								multiple
								className={s.muiSelect}
								value={studFinItem}
								renderValue={(selected) => selected.join(', ')}
								onChange={(e: any) => setStudFinItem(e.target.value)}
								variant={'standard'}>
								{names.map((name, index) => (
									<MenuItem value={name} key={index}>
										<Checkbox checked={studFinItem.indexOf(name) > -1} />
										<ListItemText primary={name} />
									</MenuItem>
								))}
							</Select>
							<Line width="260px" />
							<Select
								className={s.muiSelect}
								value={studFinDate}
								onChange={(e: any) => setStudFinDate(e.target.value)}
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
									<LocalizationProvider
										dateAdapter={AdapterDateFns}
										adapterLocale={ru}>
										<DatePicker
											value={studFinDateStart}
											onChange={(e: any) => setStudFinDateStart(e)}
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
								<Line width="20px" className={s.LineDate} />
								<div className={s.DatePicker}>
									<LocalizationProvider
										dateAdapter={AdapterDateFns}
										adapterLocale={ru}>
										<DatePicker
											value={studFinDateEnd}
											onChange={(e: any) => setStudFinDateEnd(e)}
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
											<p>Ученики-финансы</p>
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
											<p>Ученики-финансы</p>
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
					<Line width="100%" className={s.Line} />
					<div className={s.GraphicBlock}>
						<div className={s.MenuForGraphic}>
							<p className={s.TitleTable}>Ученики сводная таблица</p>
							<Select
								className={s.muiSelect}
								value={studFinDate}
								onChange={(e: any) => setStudFinDate(e.target.value)}
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
									<LocalizationProvider
										dateAdapter={AdapterDateFns}
										adapterLocale={ru}>
										<DatePicker
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
								<Line width="20px" className={s.LineDate} />
								<div className={s.DatePicker}>
									<LocalizationProvider
										dateAdapter={AdapterDateFns}
										adapterLocale={ru}>
										<DatePicker
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
						<div className={s.TableWrap}>
							<table className={s.Table}>
								<thead className={s.Thead}>
									<tr className={s.Tr}>
										<th
											onClick={() => handleSort('name')}
											style={{
												borderBottom:
													sortColumn === 'name'
														? `2px solid ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Учеников:
										</th>
										<th
											onClick={() => handleSort('lessons')}
											style={{
												borderBottom:
													sortColumn === 'lessons'
														? `2px solid ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Занятия:
										</th>
										<th
											onClick={() => handleSort('avg_cost')}
											style={{
												borderBottom:
													sortColumn === 'avg_cost'
														? `2px solid ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Средняя стоимость занятия:
										</th>
										<th
											onClick={() => handleSort('cancel')}
											style={{
												borderBottom:
													sortColumn === 'cancel'
														? `2px solid ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Отмененные:
										</th>
										<th
											onClick={() => handleSort('income')}
											style={{
												borderBottom:
													sortColumn === 'income'
														? `2px solid ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Доход:
										</th>
										<th
											onClick={() => handleSort('consumption')}
											style={{
												borderBottom:
													sortColumn === 'consumption'
														? `2px solid ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Расход:
										</th>
										<th
											onClick={() => handleSort('duty')}
											style={{
												borderBottom:
													sortColumn === 'duty'
														? `2px solid ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Долг:
										</th>
										<th
											onClick={() => handleSort('total')}
											style={{
												borderBottom:
													sortColumn === 'total'
														? `2px solid ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Итог:
										</th>
									</tr>
								</thead>
								<tbody className={s.Tbody}>
									{sortedData.map((item: any, index: any) => (
										<tr className={s.Tr} key={index}>
											<td className={s.Td}>
												<p>{item.name}</p>
											</td>
											<td className={s.Td}>
												<p>{item.lessons}</p>
											</td>
											<td className={s.Td}>
												<p>?</p>
											</td>
											<td className={s.Td}>
												<p>{item.cancel}</p>
											</td>
											<td className={s.Td}>
												<p>{item.income}</p>
											</td>
											<td className={s.Td}>
												<p>{item.consumption}</p>
											</td>
											<td className={s.Td}>
												<p>{item.duty}</p>
											</td>
											<td className={s.Td}>
												<p>
													{String(
														Number(item.income) -
															Number(item.duty) -
															Number(item.consumption),
													)}
												</p>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
					<Line width="100%" className={s.Line} />
				</div>
			</div>
		</>
	)
}

export default Statistics
