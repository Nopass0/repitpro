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
	const [studFinDateStart, setStudFinDateStart] = useState<Date>(new Date())
	const [studFinDateEnd, setStudFinDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
	)
	const [studFinCheck2, setStudFinCheck2] = useState<boolean>(true)
	const [studFinCheck1, setStudFinCheck1] = useState<boolean>(true)
	const [startDataS1, setStartDataS1] = useState<Date>()
	const [startDataS2, setStartDataS2] = useState<Date>()
	const [endDataS1, setEndDataS1] = useState<Date>()
	const [endDataS2, setEndDataS2] = useState<Date>()

	const [studAmItem, setStudAmItem] = useState<string[]>(['Все предметы'])
	const [studAmDate, setStudAmDate] = useState<number>(0)
	const [studAmDateStart, setStudAmDateStart] = useState<Date>(new Date())
	const [studAmDateEnd, setStudAmDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 3000),
	)
	const [studAmCheck2, setStudAmCheck2] = useState<boolean>(true)
	const [studAmCheck1, setStudAmCheck1] = useState<boolean>(true)

	const [studLesItem, setStudLesItem] = useState<string[]>(['Все предметы'])
	const [studLesDate, setStudLesDate] = useState<number>(0)
	const [studLesDateStart, setStudLesDateStart] = useState<Date>(new Date())
	const [studLesDateEnd, setStudLesDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 3000),
	)
	const [studLesCheck2, setStudLesCheck2] = useState<boolean>(true)
	const [studLesCheck1, setStudLesCheck1] = useState<boolean>(true)

	const [cliFinItem, setCliFinItem] = useState<string[]>(['Все предметы'])
	const [cliFinDate, setCliFinDate] = useState<number>(0)
	const [cliFinDateStart, setCliFinDateStart] = useState<Date>(new Date())
	const [cliFinDateEnd, setCliFinDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 3000),
	)
	const [cliFinCheck2, setCliFinCheck2] = useState<boolean>(true)
	const [cliFinCheck1, setCliFinCheck1] = useState<boolean>(true)

	const [cliAmItem, setCliAmItem] = useState<string[]>(['Все предметы'])
	const [cliAmDate, setCliAmDate] = useState<number>(0)
	const [cliAmDateStart, setCliAmDateStart] = useState<Date>(new Date())
	const [cliAmDateEnd, setCliAmDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 3000),
	)
	const [cliAmCheck2, setCliAmCheck2] = useState<boolean>(true)
	const [cliAmCheck1, setCliAmCheck1] = useState<boolean>(true)

	const [cliWorkItem, setCliWorkItem] = useState<string[]>(['Все предметы'])
	const [cliWorkDate, setCliWorkDate] = useState<number>(0)
	const [cliWorkDateStart, setCliWorkDateStart] = useState<Date>(new Date())
	const [cliWorkDateEnd, setCliWorkDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 3000),
	)
	const [cliWorkCheck2, setCliWorkCheck2] = useState<boolean>(true)
	const [cliWorkCheck1, setCliWorkCheck1] = useState<boolean>(true)

	const [studRelatItem, setStudRelatItem] = useState<string[]>(['Все предметы'])
	const [studRelatDate, setStudRelatDate] = useState<number>(0)
	const [studRelatDateStart, setStudRelatDateStart] = useState<Date>(new Date())
	const [studRelatDateEnd, setStudRelatDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 3000),
	)
	const [studRelatCheck2, setStudRelatCheck2] = useState<boolean>(true)
	const [studRelatCheck1, setStudRelatCheck1] = useState<boolean>(true)

	const [studTableDate, setStudTableDate] = useState<number>(3)
	const [studTableDateStart, setStudTableDateStart] = useState<Date>(new Date())
	const [studTableDateEnd, setStudTableDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 3000),
	)

	const [cliTableDate, setCliTableDate] = useState<number>(0)
	const [cliTableDateStart, setCliTableDateStart] = useState<Date>(new Date())
	const [cliTableDateEnd, setCliTableDateEnd] = useState<Date>(
		new Date(Date.now() + 180 * 24 * 60 * 60 * 3000),
	)

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
		// chooseGraphic,
		startData,
		endData,
		// token,
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
		// itemsIds,
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
		switch (studFinDate) {
			case 0:
				setStudFinDateStart(new Date())
				setStudFinDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setStudFinDateStart(startDate)
				setStudFinDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setStudFinDateStart(startDate2)
				setStudFinDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setStudFinDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setStudFinDateEnd(endDate)
				break
		}
	}, [studFinDate])

	useEffect(() => {
		switch (studAmDate) {
			case 0:
				setStudAmDateStart(new Date())
				setStudAmDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setStudAmDateStart(startDate)
				setStudAmDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setStudAmDateStart(startDate2)
				setStudAmDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setStudAmDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setStudAmDateEnd(endDate)
				break
		}
	}, [studAmDate])

	useEffect(() => {
		switch (studLesDate) {
			case 0:
				setStudLesDateStart(new Date())
				setStudLesDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setStudLesDateStart(startDate)
				setStudLesDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setStudLesDateStart(startDate2)
				setStudLesDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setStudLesDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setStudLesDateEnd(endDate)
				break
		}
	}, [studLesDate])

	useEffect(() => {
		switch (studTableDate) {
			case 0:
				setStudTableDateStart(new Date())
				setStudTableDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setStudTableDateStart(startDate)
				setStudTableDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setStudTableDateStart(startDate2)
				setStudTableDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setStudTableDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setStudTableDateEnd(endDate)
				break
		}
	}, [studTableDate])

	useEffect(() => {
		switch (cliFinDate) {
			case 0:
				setCliFinDateStart(new Date())
				setCliFinDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setCliFinDateStart(startDate)
				setCliFinDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setCliFinDateStart(startDate2)
				setCliFinDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setCliFinDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setCliFinDateEnd(endDate)
				break
		}
	}, [cliFinDate])

	useEffect(() => {
		switch (cliAmDate) {
			case 0:
				setCliAmDateStart(new Date())
				setCliAmDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setCliAmDateStart(startDate)
				setCliAmDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setCliAmDateStart(startDate2)
				setCliAmDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setCliAmDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setCliAmDateEnd(endDate)
				break
		}
	}, [cliAmDate])
	useEffect(() => {
		switch (cliWorkDate) {
			case 0:
				setCliWorkDateStart(new Date())
				setCliWorkDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setCliWorkDateStart(startDate)
				setCliWorkDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setCliWorkDateStart(startDate2)
				setCliWorkDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setCliWorkDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setCliWorkDateEnd(endDate)
				break
		}
	}, [cliWorkDate])

	useEffect(() => {
		switch (cliTableDate) {
			case 0:
				setCliTableDateStart(new Date())
				setCliTableDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setCliTableDateStart(startDate)
				setCliTableDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setCliTableDateStart(startDate2)
				setCliTableDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setCliTableDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setCliTableDateEnd(endDate)
				break
		}
	}, [cliTableDate])

	useEffect(() => {
		switch (studRelatDate) {
			case 0:
				setStudRelatDateStart(new Date())
				setStudRelatDateEnd(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
				break
			case 1:
				const startDate = new Date()
				startDate.setDate(1)
				setStudRelatDateStart(startDate)
				setStudRelatDateEnd(new Date())
				break
			case 2:
				const startDate2 = new Date()
				startDate2.setMonth(0)
				startDate2.setDate(1)
				setStudRelatDateStart(startDate2)
				setStudRelatDateEnd(new Date())
				break
			case 3:
				const currentYear = new Date().getFullYear()
				setStudRelatDateStart(new Date(currentYear, 0, 1))
				const endDate = new Date(currentYear, 11, 31)
				setStudRelatDateEnd(endDate)
				break
		}
	}, [studRelatDate])

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
				<GraphicBlock
					StyledPickersLayout={StyledPickersLayout}
					names={names}
					ItemState={studFinItem}
					OnChangeItem={(e: any) => setStudFinItem(e.target.value)}
					DateState={studFinDate}
					OnChangeDate={(e: any) => {
						setStudFinDate(e.target.value)
					}}
					DateStartState={studFinDateStart}
					OnChangeDateStart={(e: any) => setStudFinDateStart(e)}
					DateEndState={studFinDateEnd}
					OnChangeDateEnd={(e: any) => setStudFinDateEnd(e)}
					chooseGraphic={chooseGraphic}
					data={financeData}
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
					OnChangeDateStart={(e: any) => setStudAmDateStart(e)}
					DateEndState={studAmDateEnd}
					OnChangeDateEnd={(e: any) => setStudAmDateEnd(e)}
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
					OnChangeDateStart={(e: any) => setStudLesDateStart(e)}
					DateEndState={studLesDateEnd}
					OnChangeDateEnd={(e: any) => setStudLesDateEnd(e)}
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
							value={studTableDate}
							onChange={(e: any) => {
								setStudTableDate(e.target.value)
							}}
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
						</Select>
						<Line width="260px" />
						<div className={s.Dates}>
							<div className={s.DatePicker}>
								<MiniCalendar
									value={studTableDateStart}
									onChange={(newDate) => setStudTableDateStart(newDate)}
									
								/>
							</div>
							<Line width="20px" className={s.LineDate} />
							<div className={s.DatePicker}>
								<MiniCalendar
									value={studTableDateEnd}
									onChange={(newDate) => setStudTableDateEnd(newDate)}
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
					OnChangeDateStart={(e: any) => setCliFinDateStart(e)}
					DateEndState={cliFinDateEnd}
					OnChangeDateEnd={(e: any) => setCliFinDateEnd(e)}
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
					OnChangeDateStart={(e: any) => setCliAmDateStart(e)}
					DateEndState={cliAmDateEnd}
					OnChangeDateEnd={(e: any) => setCliAmDateEnd(e)}
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
					OnChangeDateStart={(e: any) => setCliWorkDateStart(e)}
					DateEndState={cliWorkDateEnd}
					OnChangeDateEnd={(e: any) => setCliWorkDateEnd(e)}
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
							value={cliTableDate}
							onChange={(e: any) => setCliTableDate(e.target.value)}
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
						</Select>
						<Line width="260px" />
						<div className={s.Dates}>
							<div className={s.DatePicker}>
								<MiniCalendar
									value={cliTableDateStart}
									onChange={(newDate) => setCliTableDateStart(newDate)}
								/>
							</div>
							<Line width="20px" className={s.LineDate} />
							<div className={s.DatePicker}>
								<MiniCalendar
									value={cliTableDateEnd}
									onChange={(newDate) => setCliTableDateEnd(newDate)}
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
					OnChangeDate={(e: any) => setStudRelatDate(e.target.value)}
					DateStartState={studRelatDateStart}
					OnChangeDateStart={(e: any) => setStudRelatDateStart(e)}
					DateEndState={studRelatDateEnd}
					OnChangeDateEnd={(e: any) => setStudRelatDateEnd(e)}
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
