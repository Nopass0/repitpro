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
} from 'chart.js'
import {Bar, Line as LineGraph} from 'react-chartjs-2'
import s from './index.module.scss'
import ShowChartIcon from '@mui/icons-material/ShowChart'
import BarChartIcon from '@mui/icons-material/BarChart'
import CloseIcon from '@mui/icons-material/Close'
import {useState} from 'react'
import {MenuItem, Select, styled} from '@mui/material'
import Line from '../../components/Line'
import {DatePicker, LocalizationProvider} from '@mui/x-date-pickers'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {ru} from 'date-fns/locale/ru'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3'

import CheckBox from '../../components/CheckBox'

ChartJS.register(
	ArcElement,
	Tooltip,
	Legend,
	LineElement,
	CategoryScale,
	LinearScale,
	PointElement,
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
			enabled: false,
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

let data = {
	labels: getLabels(),
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
	const [chooseGraphic, setChooseGraphic] = useState<number>(0)

	const [studFinItem, setStudFinItem] = useState<number>(0)
	const [studFinDate, setStudFinDate] = useState<number>(0)
	const [studFinDateStart, setStudFinDateStart] = useState<Date>()
	const [studFinDateEnd, setStudFinDateEnd] = useState<Date>()
	const [studFinCheck2, setStudFinCheck2] = useState<boolean>(true)
	const [studFinCheck1, setStudFinCheck1] = useState<boolean>(true)
	const [studFinData1, setStudFinData1] = useState<string>('')
	const [studFinData2, setStudFinData2] = useState<string>('')
	const [studFinData3, setStudFinData3] = useState<string>('')
	const [studFinData4, setStudFinData4] = useState<string>('')

	const [studAmItem, setStudAmItem] = useState<number>(0)
	const [studAmDate, setStudAmDate] = useState<number>(0)
	const [studAmDateStart, setStudAmDateStart] = useState<Date>()
	const [studAmDateEnd, setStudAmDateEnd] = useState<Date>()
	const [studAmCheck2, setStudAmCheck2] = useState<boolean>(true)
	const [studAmCheck1, setStudAmCheck1] = useState<boolean>(true)
	const [studAmData1, setStudAmData1] = useState<string>('')
	const [studAmData2, setStudAmData2] = useState<string>('')
	const [studAmData3, setStudAmData3] = useState<string>('')
	const [studAmData4, setStudAmData4] = useState<string>('')

	const [studLesItem, setStudLesItem] = useState<number>(0)
	const [studLesDate, setStudLesDate] = useState<number>(0)
	const [studLesDateStart, setStudLesDateStart] = useState<Date>()
	const [studLesDateEnd, setStudLesDateEnd] = useState<Date>()
	const [studLesCheck2, setStudLesCheck2] = useState<boolean>(true)
	const [studLesCheck1, setStudLesCheck1] = useState<boolean>(true)
	const [studLesData1, setStudLesData1] = useState<string>('')
	const [studLesData2, setStudLesData2] = useState<string>('')
	const [studLesData3, setStudLesData3] = useState<string>('')
	const [studLesData4, setStudLesData4] = useState<string>('')

	const [cliFinItem, setCliFinItem] = useState<number>(0)
	const [cliFinDate, setCliFinDate] = useState<number>(0)
	const [cliFinDateStart, setCliFinDateStart] = useState<Date>()
	const [cliFinDateEnd, setCliFinDateEnd] = useState<Date>()
	const [cliFinCheck2, setCliFinCheck2] = useState<boolean>(true)
	const [cliFinCheck1, setCliFinCheck1] = useState<boolean>(true)
	const [cliFinData1, setCliFinData1] = useState<string>('')
	const [cliFinData2, setCliFinData2] = useState<string>('')
	const [cliFinData3, setCliFinData3] = useState<string>('')
	const [cliFinData4, setCliFinData4] = useState<string>('')

	const [cliAmItem, setCliAmItem] = useState<number>(0)
	const [cliAmDate, setCliAmDate] = useState<number>(0)
	const [cliAmDateStart, setCliAmDateStart] = useState<Date>()
	const [cliAmDateEnd, setCliAmDateEnd] = useState<Date>()
	const [cliAmCheck2, setCliAmCheck2] = useState<boolean>(true)
	const [cliAmCheck1, setCliAmCheck1] = useState<boolean>(true)
	const [cliAmData1, setCliAmData1] = useState<string>('')
	const [cliAmData2, setCliAmData2] = useState<string>('')
	const [cliAmData3, setCliAmData3] = useState<string>('')
	const [cliAmData4, setCliAmData4] = useState<string>('')

	const [cliWorkItem, setCliWorkItem] = useState<number>(0)
	const [cliWorkDate, setCliWorkDate] = useState<number>(0)
	const [cliWorkDateStart, setCliWorkDateStart] = useState<Date>()
	const [cliWorkDateEnd, setCliWorkDateEnd] = useState<Date>()
	const [cliWorkCheck2, setCliWorkCheck2] = useState<boolean>(true)
	const [cliWorkCheck1, setCliWorkCheck1] = useState<boolean>(true)
	const [cliWorkData1, setCliWorkData1] = useState<string>('')
	const [cliWorkData2, setCliWorkData2] = useState<string>('')
	const [cliWorkData3, setCliWorkData3] = useState<string>('')
	const [cliWorkData4, setCliWorkData4] = useState<string>('')

	const [studRelatItem, setStudRelatItem] = useState<number>(0)
	const [studRelatDate, setStudRelatDate] = useState<number>(0)
	const [studRelatDateStart, setStudRelatDateStart] = useState<Date>()
	const [studRelatDateEnd, setStudRelatDateEnd] = useState<Date>()
	const [studRelatCheck2, setStudRelatCheck2] = useState<boolean>(true)
	const [studRelatCheck1, setStudRelatCheck1] = useState<boolean>(true)
	const [studRelatData1, setStudRelatData1] = useState<string>('')
	const [studRelatData2, setStudRelatData2] = useState<string>('')
	const [studRelatData3, setStudRelatData3] = useState<string>('')
	const [studRelatData4, setStudRelatData4] = useState<string>('')

	return (
		<>
			<div className={s.wrapper}>
				<div className={s.Header}>
					<button
						onClick={() => {
							setChooseGraphic(0)
						}}>
						<ShowChartIcon className={`${s.activeIcon} ${s.Icon}`} />
					</button>
					<button
						onClick={() => {
							setChooseGraphic(1)
						}}>
						<BarChartIcon className={`${s.Icon}`} />
					</button>
					<button>
						<CloseIcon className={s.CloseIcon} />
					</button>
				</div>
				<div className={s.MainBlock}>
					<div className={s.GraphicBlock}>
						<div className={s.MenuForGraphic}>
							<Select
								className={s.muiSelect}
								value={studFinItem}
								onChange={(e: any) => setStudFinItem(e.target.value)}
								variant={'standard'}>
								<MenuItem value={0}>
									<p>Все предметы</p>
								</MenuItem>
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
						{(() => {
							switch (chooseGraphic) {
								case 0: {
									return (
										<div className={s.chart_container}>
											<LineGraph
												className={s.Graphic}
												data={data}
												options={options}
											/>
										</div>
									)
								}
								
								case 1: {
									return (
										<div className={s.chart_container}>
											<Bar
												className={s.Graphic}
												data={data}
												options={options}
											/>
										</div>
									)
								}
							}
						})()}
					</div>
				</div>
			</div>
		</>
	)
}

export default Statistics
