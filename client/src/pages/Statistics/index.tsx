import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
	BarElement,
} from 'chart.js'
import s from './index.module.scss'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import CloseIcon from '@mui/icons-material/Close'
import {useEffect, useState} from 'react'
import {MenuItem, Select, styled} from '@mui/material'
import Line from '../../components/Line'
import CheckBox from '../../components/CheckBox'
import {useNavigate} from 'react-router-dom'
import {useSelector} from 'react-redux'
import socket from '../../socket'
import GraphicBlock from '../../components/GraphicBlock/index'
import MiniCalendar from '../../components/MiniCalendar'
import Arrow from '../../assets/arrow'

// Register ChartJS components
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

const getLabels = () => Array.from({length: 200}, (_, i) => i)

const getDatasets = () => {
	const datasets = []
	for (let i = 0; i < 200; i++) {
		let a = Math.abs(Math.random() * Math.abs(Math.cos(i)))
		if (datasets[i - 1] - a < Math.E) {
			a = datasets[i - 1] + datasets[i - 1] * 0.06
		}
		datasets.push(a)
	}
	return datasets
}

const options = {
	responsive: true,
	maintainAspectRatio: false,
	aspectRatio: 2,
	plugins: {
		legend: {display: false},
		title: {display: false},
		tooltip: {enabled: true},
		scales: {
			x: {ticks: {display: false}, grid: {display: false}},
			y: {ticks: {display: false}, grid: {display: false}},
		},
	},
}

const optionsBar = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {display: false},
		title: {display: true, text: 'Chart.js Bar Chart - Stacked'},
	},
	scales: {
		x: {stacked: true},
		y: {stacked: true},
	},
	aspectRatio: 2,
}

const labels = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль']

const data = {
	labels: labels,
	datasets: Array.from({length: 5}, (_, i) => ({
		label: `Dataset ${i + 1}`,
		data: [1, 2, 3, 4, 5, 6, 7],
		fill: false,
		backgroundColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
		borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
	})),
}

const StyledPickersLayout = styled('span')({
	'.MuiDateCalendar-root': {
		color: '#25991c',
		borderRadius: 2,
		borderWidth: 1,
		borderColor: '#25991c',
		border: '1px solid',
	},
	'.MuiPickersDay-today': {
		border: '1px solid #25991c',
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
	const [chooseGraphic, setChooseGraphic] = useState<number>(0)
	const [studFinItem, setStudFinItem] = useState<string[]>(['Все предметы'])
	const [studFinDate, setStudFinDate] = useState<number>(0)
	const [studFinDateStart, setStudFinDateStart] = useState<Date>(
		new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
	)
	const [studFinDateEnd, setStudFinDateEnd] = useState<Date>(
		new Date(Date.now() + 30 * 24 * 60 * 60 * 3000),
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
	const [sortColumn, setSortColumn] = useState<string | null>(null)
	const [sortDirection, setSortDirection] = useState<string | null>(null)

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [clientData, setClientData] = useState([])
	const [studentsData, setStudentsData] = useState([])
	const [startData, setStartData] = useState<Date>(new Date(Date.now() + 1))
	const [endData, setEndData] = useState<Date>(new Date(Date.now() + 86400000))

	const handleSort = (column: string) => {
		if (sortColumn === column) {
			setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
		} else {
			setSortColumn(column)
			setSortDirection('asc')
		}
	}

	const [itemsIds, setItemsIds] = useState([])
	const [financeData, setFinanceData] = useState<any>({
		labels: [],
		datasets: [],
	})
	const [studentCountData, setStudentCountData] = useState<any>({
		labels: [],
		datasets: [],
	})
	const [studentCountItemsData, setStudentCountItemsData] = useState<any>({
		labels: [],
		datasets: [],
	})
	const [clientsFinanceData, setClientsFinanceData] = useState<any>({
		labels: [],
		datasets: [],
	})
	const [clientsCountData, setClientsCountData] = useState<any>({
		labels: [],
		datasets: [],
	})
	const [clientsWorksData, setClientsWorksData] = useState<any>({
		labels: [],
		datasets: [],
	})
	const [clientsNstudentsCompareData, setClientsNstudentsCompareData] =
		useState<any>({labels: [], datasets: []})

	useEffect(() => {
		socket.emit('getAllItemsIdsAndNames', token)
		socket.on('getAllItemsIdsAndNames', (data: any) => {
			const namesTemp = ['Все предметы']
			const idsTemp = []
			data.forEach((item) => {
				if (item.itemName !== 'void') {
					namesTemp.push(item.itemName)
				}
				if (item.id !== '') {
					idsTemp.push(item.id)
				}
			})
			setNames(namesTemp)
			setItemsIds(idsTemp)
		})

		socket.emit('getTableData', {
			token: token,
			dateRange: {start: startData, end: endData},
		})
		socket.on('getTableData', (data: any) => setStudentsData(data))

		socket.emit('getClientTableData', {
			token: token,
			dateRange: {start: startData, end: endData},
		})
		socket.on('getClientTableData', (data: any) => setClientData(data))

		const emitDataRequests = () => {
			const payload = {
				token: token,
				subjectIds: itemsIds,
			}
			socket.emit('getStudentFinanceData', {
				...payload,
				startDate: studFinDateStart,
				endDate: studFinDateEnd,
			})
			socket.emit('getStudentCountData', {
				...payload,
				startDate: studAmDateStart,
				endDate: studAmDateEnd,
			})
			socket.emit('getStudentLessonsData', {
				...payload,
				startDate: studRelatDateStart,
				endDate: studRelatDateEnd,
			})
			socket.emit('getClientFinanceData', {
				...payload,
				startDate: cliAmDateStart,
				endDate: cliAmDateEnd,
			})
			socket.emit('getClientCountData', {
				...payload,
				startDate: cliFinDateStart,
				endDate: cliFinDateEnd,
			})
			socket.emit('getClientWorksData', {
				...payload,
				startDate: cliWorkDateStart,
				endDate: cliWorkDateEnd,
			})
			socket.emit('getStudentClientComparisonData', {
				...payload,
				startDate: cliAmDateStart,
				endDate: cliAmDateEnd,
			})
		}

		emitDataRequests()

		socket.on('getStudentFinanceData', (data: any) => setFinanceData(data))
		socket.on('getStudentCountData', (data: any) => setStudentCountData(data))
		socket.on('getStudentLessonsData', (data: any) =>
			setStudentCountItemsData(data),
		)
		socket.on('getClientFinanceData', (data: any) =>
			setClientsFinanceData(data),
		)
		socket.on('getClientCountData', (data: any) => setClientsCountData(data))
		socket.on('getClientWorksData', (data: any) => setClientsWorksData(data))
		socket.on('getStudentClientComparisonData', (data: any) =>
			setClientsNstudentsCompareData(data),
		)
	}, [
		chooseGraphic,
		startData,
		endData,
		token,
		studFinDateStart,
		studFinDateEnd,
		studAmDateStart,
		studAmDateEnd,
		studRelatDateStart,
		studRelatDateEnd,
		cliAmDateStart,
		cliAmDateEnd,
		cliFinDateStart,
		cliFinDateEnd,
		cliWorkDateStart,
		cliWorkDateEnd,
		itemsIds,
	])

	const sortData = (data: any, column: string, direction: string) => {
		if (direction === 'asc') {
			return data.sort((a: any, b: any) =>
				column === 'name'
					? a[column].localeCompare(b[column])
					: a[column] - b[column],
			)
		} else if (direction === 'desc') {
			return data.sort((a: any, b: any) =>
				column === 'name'
					? b[column].localeCompare(a[column])
					: b[column] - a[column],
			)
		} else {
			return data
		}
	}

	const sortedStudentsData = sortData(studentsData, sortColumn, sortDirection)
	const sortedClientsData = sortData(clientData, sortColumn, sortDirection)

	useEffect(() => {
		socket.emit('getTableData', {
			token: token,
			dateRange: {start: startData, end: endData},
		})
		socket.emit('getClientTableData', {
			token: token,
			dateRange: {start: cliAmDateStart, end: cliAmDateEnd},
		})
	}, [chooseGraphic, startData, endData, token, cliAmDateStart, cliAmDateEnd])

	return (
		<div className={s.wrapper}>
			<div className={s.Header}>
				<button onClick={() => setChooseGraphic(0)}>
					<ShowChartIcon
						className={`${chooseGraphic === 0 && s.activeIcon} ${s.Icon}`}
					/>
				</button>
				<button onClick={() => setChooseGraphic(1)}>
					<BarChartIcon
						className={`${chooseGraphic === 1 && s.activeIcon} ${s.Icon}`}
					/>
				</button>
				<button onClick={() => navigate('../')}>
					<CloseIcon className={s.CloseIcon} />
				</button>
			</div>
			<div className={s.MainBlock}>
				{financeData && (
					<GraphicBlock
						StyledPickersLayout={StyledPickersLayout}
						names={names}
						ItemState={studFinItem}
						OnChangeItem={(e: any) => setStudFinItem(e.target.value)}
						DateState={financeData}
						OnChangeDate={(e: any) => setStudFinDate(e.target.value)}
						DateStartState={studFinDateStart}
						OnChangeDateStart={(e: any) => setStudFinDateStart(e.target.value)}
						DateEndState={studFinDateEnd}
						OnChangeDateEnd={(e: any) => setStudFinDateEnd(e.target.value)}
						chooseGraphic={chooseGraphic}
						data={financeData}
						options={options}
						optionsBar={optionsBar}
						title="Ученики-Финансы"
					/>
				)}
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
					data={studentCountData}
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
					data={studentCountItemsData}
					options={options}
					optionsBar={optionsBar}
					title="Ученики-Занятия"
				/>
				<Line width="100%" className={s.Line} />
				{/* Students Table */}
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
									<th onClick={() => handleSort('name')} className={s.Th}>
										Учеников:{' '}
										{sortColumn === 'name' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('lessons')} className={s.Th}>
										Занятия:{' '}
										{sortColumn === 'lessons' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('avg_cost')} className={s.Th}>
										Средняя стоимость занятия:{' '}
										{sortColumn === 'avg_cost' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('cancel')} className={s.Th}>
										Отмененные:{' '}
										{sortColumn === 'cancel' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('income')} className={s.Th}>
										Доход:{' '}
										{sortColumn === 'income' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th
										onClick={() => handleSort('consumption')}
										className={s.Th}>
										Расход:{' '}
										{sortColumn === 'consumption' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('duty')} className={s.Th}>
										Долг:{' '}
										{sortColumn === 'duty' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('total')} className={s.Th}>
										Итог:{' '}
										{sortColumn === 'total' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
								</tr>
							</thead>
							<tbody className={s.Tbody}>
								{sortedStudentsData.map((item: any, index: any) => (
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
								{Array.from({
									length: Math.abs(10 - sortedStudentsData.length),
								}).map((_, index: number) => (
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
								))}
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
					data={clientsFinanceData}
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
					data={clientsCountData}
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
					data={clientsWorksData}
					options={options}
					optionsBar={optionsBar}
					title="Заказчики-Работы"
					isClient
				/>
				<Line width="100%" className={s.Line} />
				{/* Clients Table */}
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
									<th onClick={() => handleSort('name')} className={s.Th}>
										Учеников:{' '}
										{sortColumn === 'name' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('lessons')} className={s.Th}>
										Занятия:{' '}
										{sortColumn === 'lessons' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('avg_cost')} className={s.Th}>
										Средняя стоимость занятия:{' '}
										{sortColumn === 'avg_cost' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('cancel')} className={s.Th}>
										Отмененные:{' '}
										{sortColumn === 'cancel' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('income')} className={s.Th}>
										Доход:{' '}
										{sortColumn === 'income' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th
										onClick={() => handleSort('consumption')}
										className={s.Th}>
										Расход:{' '}
										{sortColumn === 'consumption' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('duty')} className={s.Th}>
										Долг:{' '}
										{sortColumn === 'duty' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
									<th onClick={() => handleSort('total')} className={s.Th}>
										Итог:{' '}
										{sortColumn === 'total' &&
											(sortDirection === 'asc' ? (
												<Arrow direction="up" />
											) : (
												<Arrow direction="down" />
											))}
									</th>
								</tr>
							</thead>
							<tbody className={s.Tbody}>
								{sortedClientsData.map((item: any, index: any) => (
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
								{Array.from({
									length: Math.abs(10 - sortedClientsData.length),
								}).map((_, index: number) => (
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
								))}
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
					OnChangeDateStart={(e: any) => setStudRelatDateStart(e.target.value)}
					DateEndState={studRelatDateEnd}
					OnChangeDateEnd={(e: any) => setStudAmDateEnd(e.target.value)}
					chooseGraphic={chooseGraphic}
					data={clientsNstudentsCompareData}
					options={options}
					optionsBar={optionsBar}
					title="Ученики - Заказчики сравнительный график"
					isClient
				/>
			</div>
		</div>
	)
}

export default Statistics
