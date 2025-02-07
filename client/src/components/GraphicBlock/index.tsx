import type React from 'react'
import {useState, useEffect} from 'react'
import {
	Line,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	LineChart,
	BarChart,
} from 'recharts'
import {format} from 'date-fns'
import {CalendarIcon, CalendarX, Loader} from 'lucide-react'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select'
import {Button} from '@/ui/button'
import {Calendar} from '@/ui/calendar'
import {Popover, PopoverContent, PopoverTrigger} from '@/ui/popover'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight'
interface IGraphicBlock {
	className?: string
	style?: React.CSSProperties
	ItemState?: string[]
	DateState?: number
	DateStartState?: Date
	DateEndState?: Date
	data?: {
		labels: string[]
		datasets: any[]
		maxValue: number
	}
	options?: any
	chooseGraphic?: number
	title?: string
	isClient?: boolean
	loading?: boolean
	OnChangeDate?: (value: string) => void
	OnChangeDateStart?: (date: Date | undefined) => void
	OnChangeDateEnd?: (date: Date | undefined) => void
	yScaleName?: string
	renderCheckboxes?: () => React.ReactNode
	isTotalChecked: boolean
	showTotal: boolean
}

const GraphicBlock: React.FC<IGraphicBlock> = ({
	className,
	style,
	DateState = 0,
	DateStartState,
	DateEndState,
	data,
	chooseGraphic,
	OnChangeDate,
	OnChangeDateStart,
	OnChangeDateEnd,
	title,
	loading,
	yScaleName,
	renderCheckboxes,
	isTotalChecked,
	showTotal,
}) => {
	const [dataSet, setDataSet] = useState<any>(null)

	useEffect(() => {
		if (data) {
			const formattedData = data.labels.map((label, index) => {
				const dataPoint: {[key: string]: any} = {date: label}
				let total = 0
				data.datasets.forEach((dataset, datasetIndex) => {
					const value = dataset.data[index] || 0
					dataPoint[`value${datasetIndex}`] = value
					total += value
				})
				dataPoint['total'] = total
				return dataPoint
			})
			setDataSet(formattedData)
		}
	}, [data])

	if (loading) {
		return (
			<div className="flex flex-col items-center justify-center h-64">
				<Loader className="animate-spin h-8 w-8 mb-4" />
				<p>Загрузка данных...</p>
			</div>
		)
	}

	if (!dataSet) {
		return (
			<div className="flex items-center justify-center h-64">
				Нет данных для отображения.
			</div>
		)
	}

	const handlePeriodChange = (value: string) => {
		if (OnChangeDate) {
			OnChangeDate(value)
		}
	}

	// Custom axis with arrows
	const renderCustomAxisLine = ({x1, y1, x2, y2, ...props}) => {
		return (
			<g>
				<line
					x1={x1}
					y1={y1}
					x2={x2}
					y2={y2}
					{...props}
					stroke="red"
					strokeWidth={1}
				/>
				{/* Add arrow for Y axis */}
				{x1 === x2 && (
					<polygon
						points={`${x1},${y1} ${x1 - 5},${y1 + 5} ${x1 + 5},${y1 + 5}`}
						fill="black"
					/>
				)}
				{/* Add arrow for X axis */}
				{y1 === y2 && (
					<polygon
						points={`${x2},${y2} ${x2 - 5},${y2 - 5} ${x2 - 5},${y2 + 5}`}
						fill="black"
					/>
				)}
			</g>
		)
	}

	return (
		<div className={`${className} flex gap-6 items-center`} style={style}>
			{/* Left Column */}
			<div className="w-[250px] flex-shrink-0 ">
				<div className="flex flex-col space-y-4">
					<Select
						value={DateState.toString()}
						onValueChange={handlePeriodChange}>
						<SelectTrigger className="w-full h-9 text-sm">
							<SelectValue placeholder="Выберите период" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="0">Последние 30 дней</SelectItem>
							<SelectItem value="1">С начала месяца</SelectItem>
							<SelectItem value="2">С начала года</SelectItem>
							<SelectItem value="3">За всё время</SelectItem>
						</SelectContent>
					</Select>

					<div className="flex items-center gap-2">
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="h-9 px-3 text-sm flex-1 flex items-center gap-2"
									style={{borderColor: '#e2e8f0'}}>
									{DateStartState ? format(DateStartState, 'dd.MM') : 'От'}
									<CalendarIcon className="ml-2 h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="start">
								<Calendar
									mode="single"
									selected={DateStartState}
									onSelect={OnChangeDateStart}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant="outline"
									className="h-9 px-3 text-sm flex-1 flex items-center gap-2"
									style={{borderColor: '#e2e8f0'}}>
									{DateEndState ? format(DateEndState, 'dd.MM') : 'До'}
									<CalendarIcon className="ml-2 h-4 w-4" />
								</Button>
							</PopoverTrigger>
							<PopoverContent className="w-auto p-0" align="end">
								<Calendar
									mode="single"
									selected={DateEndState}
									onSelect={OnChangeDateEnd}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>

					{renderCheckboxes && (
						<div className="space-y-2 text-sm">{renderCheckboxes()}</div>
					)}
				</div>
			</div>

			{/* Right Column - Chart */}
			<div className="flex-1 min-w-0">
				<div className="flex items-center ml-20 gap-2 ">
					<span className="text-sm text-gray-500">{title}</span>
				</div>
				<div className="w-[98%] h-[350px]">
					<KeyboardArrowUpIcon className="relative left-[68px] top-[36px] opacity-[0.6]" />
					{chooseGraphic === 0 ? (
						<LineChart
							width={1180}
							height={350}
							data={dataSet}
							margin={{top: 20, right: 30, left: 20, bottom: 20}}>
							<CartesianGrid
								stroke="#000000"
								strokeOpacity={0.1}
								vertical={true}
							/>
							<XAxis
								dataKey="date"
								axisLine={renderCustomAxisLine}
								tickLine={false}
								tick={{fill: '#000000', fontSize: 12}}
								dy={10}
							/>

							<YAxis
								axisLine={renderCustomAxisLine}
								tickLine={false}
								tick={{fill: '#000000', fontSize: 12}}
								dx={-10}
								label={{
									value: yScaleName || 'Чел',
									angle: 0,

									position: 'insideTopLeft',
									offset: -20,
									style: {
										fill: '#000000',
										fontSize: 14,
										fontWeight: 500,
									},
								}}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: 'white',
									border: '1px solid #e2e8f0',
									borderRadius: '6px',
									fontSize: '12px',
								}}
							/>
							{data &&
								data.datasets.map((dataset, index) => (
									<Line
										key={index}
										type="monotone"
										dataKey={`value${index}`}
										stroke={dataset.borderColor}
										strokeWidth={2}
										dot={false}
										activeDot={{r: 4, strokeWidth: 2}}
									/>
								))}
							{showTotal && (
								<Line
									type="monotone"
									dataKey="total"
									stroke="black"
									strokeWidth={2}
									dot={false}
									activeDot={{r: 4, strokeWidth: 2}}
								/>
							)}
						</LineChart>
					) : (
						<BarChart
							width={1180}
							height={350}
							data={dataSet}
							margin={{top: 20, right: 30, left: 20, bottom: 20}}
							barSize={30}>
							<CartesianGrid
								stroke="#000000"
								strokeOpacity={0.1}
								vertical={true}
							/>
							<XAxis
								dataKey="date"
								axisLine={renderCustomAxisLine}
								tickLine={false}
								tick={{fill: '#000000', fontSize: 12}}
								dy={10}
							/>
							<YAxis
								axisLine={renderCustomAxisLine}
								tickLine={false}
								tick={{fill: '#000000', fontSize: 12}}
								dx={-10}
								label={{
									value: yScaleName || 'Чел',
									angle: -90,
									position: 'insideLeft',
									style: {fill: '#000000', fontSize: 12},
								}}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: 'white',
									border: '1px solid #e2e8f0',
									borderRadius: '6px',
									fontSize: '12px',
								}}
							/>
							{data &&
								data.datasets.map((dataset, index) => (
									<Bar
										key={index}
										dataKey={`value${index}`}
										fill={dataset.backgroundColor}
									/>
								))}
							{showTotal && <Bar dataKey="total" fill="black" />}
						</BarChart>
					)}
					<KeyboardArrowRightIcon className="relative bottom-[62px] left-[1136px]" />
				</div>
			</div>
		</div>
	)
}

export default GraphicBlock
