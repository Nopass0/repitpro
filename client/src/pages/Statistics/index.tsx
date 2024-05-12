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

import CheckBox from '../../components/CheckBox'
import {useNavigate} from 'react-router-dom'
import {useSelector} from 'react-redux'
import socket from '../../socket'
import GraphicBlock from '../../components/GraphicBlock/index'
import MiniCalendar from '../../components/MiniCalendar'
import Arrow from '../../assets/arrow'

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
const labels = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль']

let data = {
	labels: labels,
	datasets: [
		{
			label: 'Dataset 1',
			data: [],
			fill: false,
			backgroundColor: '#FF0000',
			borderColor: '#FF0000',
		},
		{
			label: 'Dataset 2',
			data: [],
			fill: false,
			backgroundColor: '#9747FF',
			borderColor: '#9747FF',
		},
		{
			label: 'Dataset 3',
			data: [],
			fill: false,
			backgroundColor: '#0027FF',
			borderColor: '#0027FF',
		},
		{
			label: 'Dataset 4',
			data: [],
			fill: false,
			backgroundColor: '#25991C',
			borderColor: '#25991C',
		},
		{
			label: 'Dataset 5',
			data: [],
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

	const [names, setNames] = useState<string[]>(['Все предметы'])
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
	const [studFinDateStart, setStudFinDateStart] = useState<Date>(
		new Date(Date.now()).getTime() - 30 * 24 * 60 * 60 * 1000,
	)
	const [studFinDateEnd, setStudFinDateEnd] = useState<Date>(
		new Date(Date.now()),
	)
	const [studFinCheck2, setStudFinCheck2] = useState<boolean>(true)
	const [studFinCheck1, setStudFinCheck1] = useState<boolean>(true)

	const [startDataS1, setStartDataS1] = useState<Date>()
	const [startDataS2, setStartDataS2] = useState<Date>()

	const [endDataS1, setEndDataS1] = useState<Date>()
	const [endDataS2, setEndDataS2] = useState<Date>()

	const [studAmItem, setStudAmItem] = useState<string[]>(['Все предметы'])
	const [studAmDate, setStudAmDate] = useState<number>(0)
	const [studAmDateStart, setStudAmDateStart] = useState<Date>()
	const [studAmDateEnd, setStudAmDateEnd] = useState<Date>()
	const [studAmCheck2, setStudAmCheck2] = useState<boolean>(true)
	const [studAmCheck1, setStudAmCheck1] = useState<boolean>(true)

	const [studLesItem, setStudLesItem] = useState<string[]>(['Все предметы'])
	const [studLesDate, setStudLesDate] = useState<number>(0)
	const [studLesDateStart, setStudLesDateStart] = useState<Date>()
	const [studLesDateEnd, setStudLesDateEnd] = useState<Date>()
	const [studLesCheck2, setStudLesCheck2] = useState<boolean>(true)
	const [studLesCheck1, setStudLesCheck1] = useState<boolean>(true)

	const [cliFinItem, setCliFinItem] = useState<string[]>(['Все предметы'])
	const [cliFinDate, setCliFinDate] = useState<number>(0)
	const [cliFinDateStart, setCliFinDateStart] = useState<Date>()
	const [cliFinDateEnd, setCliFinDateEnd] = useState<Date>()
	const [cliFinCheck2, setCliFinCheck2] = useState<boolean>(true)
	const [cliFinCheck1, setCliFinCheck1] = useState<boolean>(true)

	const [cliAmItem, setCliAmItem] = useState<string[]>(['Все предметы'])
	const [cliAmDate, setCliAmDate] = useState<number>(0)
	const [cliAmDateStart, setCliAmDateStart] = useState<Date>()
	const [cliAmDateEnd, setCliAmDateEnd] = useState<Date>()
	const [cliAmCheck2, setCliAmCheck2] = useState<boolean>(true)
	const [cliAmCheck1, setCliAmCheck1] = useState<boolean>(true)

	const [cliWorkItem, setCliWorkItem] = useState<string[]>(['Все предметы'])
	const [cliWorkDate, setCliWorkDate] = useState<number>(0)
	const [cliWorkDateStart, setCliWorkDateStart] = useState<Date>()
	const [cliWorkDateEnd, setCliWorkDateEnd] = useState<Date>()
	const [cliWorkCheck2, setCliWorkCheck2] = useState<boolean>(true)
	const [cliWorkCheck1, setCliWorkCheck1] = useState<boolean>(true)

	const [studRelatItem, setStudRelatItem] = useState<string[]>(['Все предметы'])
	const [studRelatDate, setStudRelatDate] = useState<number>(0)
	const [studRelatDateStart, setStudRelatDateStart] = useState<Date>()
	const [studRelatDateEnd, setStudRelatDateEnd] = useState<Date>()
	const [studRelatCheck2, setStudRelatCheck2] = useState<boolean>(true)
	const [studRelatCheck1, setStudRelatCheck1] = useState<boolean>(true)

	const [sortColumn, setSortColumn] = useState(null)
	const [sortDirection, setSortDirection] = useState(null)

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [clientData, setClientData] = useState([])
	const [studentsData, setStudentsData] = useState([])
	const [startData, setStartData] = useState<Date>(new Date(Date.now() + 1))
	const [endData, setEndData] = useState<Date>(new Date(Date.now() + 86400000))

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

	useEffect(() => {
		socket.emit('getAllItemsIdsAndNames', token)
		socket.on('getAllItemsIdsAndNames', (data: any) => {
			console.log('getAllItemsIdsAndNames', data)
			const namesTemp = ['Все предметы']
			// Get all itemName !== 'void'
			for (let i = 0; i < data.length; i++) {
				if (data[i].itemName !== 'void') {
					namesTemp.push(data[i].itemName)
				}
			}
			setNames(namesTemp)
			console.log(names, 'namesTempnamesTempnamesTemp')
		})
		socket.emit('getTableData', {
			token: token,
			dateRange: {start: startData, end: endData},
		})
		socket.on('getTableData', (data: any) => {
			console.log('getTableData', data)
			setStudentsData(data)
		})

		socket.emit('getClientTableData', {
			token: token,
			dateRange: {start: startData, end: endData},
		})

		socket.on('getClientTableData', (data: any) => {
			console.log('getClientTableData', data)
			setClientData(data)
		})
	}, [])

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

	const sortedData = sortData(studentsData, sortColumn, sortDirection)
	const sortedData2 = sortData(clientData, sortColumn, sortDirection)

	useEffect(() => {
		socket.emit('getTableData', {
			token: token,
			dateRange: {start: startData, end: endData},
		})
		socket.emit('getClientTableData', {
			token: token,
			dateRange: {start: cliAmDateStart, end: cliAmDateEnd},
		})
		console.log(sortedData, 'sortedData')
	}, [startData, endData])

	socket.once('getStudentFinanceData', (data: any) => {
		console.log('getStudentFinanceData', data)
	})
	useEffect(() => {
		socket.emit('getStudentFinanceData', {
			token: token,
			startDate: studFinDateStart,
			endDate: studFinDateEnd,
			subjectIds: [
				'clv10ubqx0003fbi91ucd904u',
				'clv11nno10001346txhqgrqle',
				'clv12inew000i346t8bdne1c4',
			],
		})
	}, [])

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
					<GraphicBlock
						StyledPickersLayout={StyledPickersLayout}
						names={names}
						ItemState={studFinItem}
						OnChangeItem={(e: any) => setStudFinItem(e.target.value)}
						DateState={studFinDate}
						OnChangeDate={(e: any) => setStudFinDate(e.target.value)}
						DateStartState={studFinDateStart}
						OnChangeDateStart={(e: any) => setStudFinDateStart(e.target.value)}
						DateEndState={studFinDateEnd}
						OnChangeDateEnd={(e: any) => setStudFinDateEnd(e.target.value)}
						chooseGraphic={chooseGraphic}
						data={data}
						options={options}
						optionsBar={optionsBar}
						title="Ученики-Финансы"
					/>
					<Line width="100%" className={s.Line} />
					<GraphicBlock
						StyledPickersLayout={StyledPickersLayout}
						names={names}
						ItemState={studAmItem}
						OnChangeItem={(e: any) => setStudAmItem(e.target.value)}
						DateState={studAmDate}
						OnChangeDate={(e: any) => setStudAmDate(e.target.value)}
						DateStartState={studAmDateStart}
						OnChangeDateStart={(e: any) => setStudAmDateStart(e.target.value)}
						DateEndState={studAmDateEnd}
						OnChangeDateEnd={(e: any) => setStudAmDateEnd(e.target.value)}
						chooseGraphic={chooseGraphic}
						data={data}
						options={options}
						optionsBar={optionsBar}
						title="Ученики-Количество"
					/>
					<Line width="100%" className={s.Line} />
					<GraphicBlock
						StyledPickersLayout={StyledPickersLayout}
						names={names}
						ItemState={studLesItem}
						OnChangeItem={(e: any) => setStudLesItem(e.target.value)}
						DateState={studLesDate}
						OnChangeDate={(e: any) => setStudLesDate(e.target.value)}
						DateStartState={studLesDateStart}
						OnChangeDateStart={(e: any) => setStudLesDateStart(e.target.value)}
						DateEndState={studLesDateEnd}
						OnChangeDateEnd={(e: any) => setStudLesDateEnd(e.target.value)}
						chooseGraphic={chooseGraphic}
						data={data}
						options={options}
						optionsBar={optionsBar}
						title="Ученики-Занятия"
					/>
					<Line width="100%" className={s.Line} />
					{/* Table */}
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
									<MiniCalendar
										value={startData}
										onChange={(newDate) => setStartData(newDate)}
									/>
								</div>
								<Line width="20px" className={s.LineDate} />
								<div className={s.DatePicker}>
									<MiniCalendar
										value={endData}
										onChange={(newDate) => setEndData(newDate)}
									/>
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
														? `10px solid  ${
																sortDirection === 'asc' ? 'green' : 'red'
														  }`
														: 'none',
											}}
											className={s.Th}>
											Учеников: <Arrow direction="up" />
										</th>
										<th
											onClick={() => handleSort('lessons')}
											style={{
												borderBottom:
													sortColumn === 'lessons'
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
												<p>{item.avgCost}</p>
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
												<p>{item.total}</p>
											</td>
										</tr>
									))}
									{Array.from({length: Math.abs(10 - sortedData.length)}).map(
										(_, index: number) => (
											<tr key={index} className={s.Tr}>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
											</tr>
										),
									)}
								</tbody>
							</table>
						</div>
					</div>
					<Line width="100%" className={s.Line} />
					<GraphicBlock
						StyledPickersLayout={StyledPickersLayout}
						names={names}
						ItemState={cliFinItem}
						OnChangeItem={(e: any) => setCliFinItem(e.target.value)}
						DateState={cliFinDate}
						OnChangeDate={(e: any) => setCliFinDate(e.target.value)}
						DateStartState={cliFinDateStart}
						OnChangeDateStart={(e: any) => setCliFinDateStart(e.target.value)}
						DateEndState={cliFinDateEnd}
						OnChangeDateEnd={(e: any) => setCliFinDateEnd(e.target.value)}
						chooseGraphic={chooseGraphic}
						data={data}
						options={options}
						optionsBar={optionsBar}
						title="Заказчики-Финансы"
						isClient
					/>
					<Line width="100%" className={s.Line} />
					<GraphicBlock
						StyledPickersLayout={StyledPickersLayout}
						names={names}
						ItemState={cliAmItem}
						OnChangeItem={(e: any) => setCliAmItem(e.target.value)}
						DateState={cliAmDate}
						OnChangeDate={(e: any) => setCliAmDate(e.target.value)}
						DateStartState={cliAmDateStart}
						OnChangeDateStart={(e: any) => setCliAmDateStart(e.target.value)}
						DateEndState={cliAmDateEnd}
						OnChangeDateEnd={(e: any) => setCliAmDateEnd(e.target.value)}
						chooseGraphic={chooseGraphic}
						data={data}
						options={options}
						optionsBar={optionsBar}
						title="Заказчики-Количество"
						isClient
					/>
					<Line width="100%" className={s.Line} />
					<GraphicBlock
						StyledPickersLayout={StyledPickersLayout}
						names={names}
						ItemState={cliWorkItem}
						OnChangeItem={(e: any) => setCliWorkItem(e.target.value)}
						DateState={cliWorkDate}
						OnChangeDate={(e: any) => setCliWorkDate(e.target.value)}
						DateStartState={cliWorkDateStart}
						OnChangeDateStart={(e: any) => setCliWorkDateStart(e.target.value)}
						DateEndState={cliWorkDateEnd}
						OnChangeDateEnd={(e: any) => setCliAmDateEnd(e.target.value)}
						chooseGraphic={chooseGraphic}
						data={data}
						options={options}
						optionsBar={optionsBar}
						title="Заказчики-Работы"
						isClient
					/>
					<Line width="100%" className={s.Line} />
					{/* Table */}
					<div className={s.GraphicBlock}>
						<div className={s.MenuForGraphic}>
							<p className={s.TitleTable}>Заказчики сводная таблица</p>
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
									<MiniCalendar
										value={startDataS1}
										onChange={(newDate) => setStartDataS1(newDate)}
									/>
								</div>
								<Line width="20px" className={s.LineDate} />
								<div className={s.DatePicker}>
									<MiniCalendar
										value={endDataS2}
										onChange={(newDate) => setEndDataS2(newDate)}
									/>
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
														? `10px solid  ${
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
									{sortedData2.map((item: any, index: any) => (
										<tr className={s.Tr} key={index}>
											<td className={s.Td}>
												<p>{item.name}</p>
											</td>
											<td className={s.Td}>
												<p>{item.lessons}</p>
											</td>
											<td className={s.Td}>
												<p>{item.avgCost}</p>
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
												<p>{item.total}</p>
											</td>
										</tr>
									))}
									{Array.from({length: Math.abs(10 - sortedData2.length)}).map(
										(_, index: number) => (
											<tr key={index} className={s.Tr}>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
												<td className={s.Td}>
													<p></p>
												</td>
											</tr>
										),
									)}
								</tbody>
							</table>
						</div>
					</div>
					<Line width="100%" className={s.Line} />
					<GraphicBlock
						StyledPickersLayout={StyledPickersLayout}
						names={names}
						ItemState={studRelatItem}
						OnChangeItem={(e: any) => setStudRelatItem(e.target.value)}
						DateState={studRelatDate}
						OnChangeDate={(e: any) => setStudAmDate(e.target.value)}
						DateStartState={studRelatDateStart}
						OnChangeDateStart={(e: any) =>
							setStudRelatDateStart(e.target.value)
						}
						DateEndState={studRelatDateEnd}
						OnChangeDateEnd={(e: any) => setStudAmDateEnd(e.target.value)}
						chooseGraphic={chooseGraphic}
						data={data}
						options={options}
						optionsBar={optionsBar}
						title="Ученики - Заказчики сравнительный график"
						isClient
					/>
				</div>
			</div>
		</>
	)
}

export default Statistics
