import React, {useEffect, useState, useMemo} from 'react'
import {Bar, Line as LineGraph} from 'react-chartjs-2'
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from 'chart.js'

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	BarElement,
	Title,
	Tooltip,
	Legend,
)

import s from './index.module.scss'
import {FormControl, InputLabel, MenuItem, Select} from '@mui/material'
import Line from '../Line'
import MiniCalendar from '../MiniCalendar'
import {
	differenceInDays,
	differenceInMonths,
	differenceInYears,
	parse,
	format,
} from 'date-fns'
import {Loader} from 'lucide-react'

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
	OnChangeDate?: (e: any) => void
	OnChangeDateStart?: (e: any) => void
	OnChangeDateEnd?: (e: any) => void
	StyledPickersLayout?: any
	renderCheckboxes?: () => React.ReactNode
}

const GraphicBlock: React.FC<IGraphicBlock> = ({
	className,
	style,
	isClient,
	ItemState,
	DateState,
	DateStartState,
	DateEndState,
	data,
	options,
	chooseGraphic,
	OnChangeDate,
	OnChangeDateStart,
	OnChangeDateEnd,
	title,
	StyledPickersLayout,
	loading,
	renderCheckboxes,
}) => {
	const [dataSet, setDataSet] = useState<any>(null)

	const formatXAxisLabels = (value: string, index: number, values: any[]) => {
		if (!DateStartState || !DateEndState || !value) return ''

		const days = differenceInDays(DateEndState, DateStartState)
		const months = differenceInMonths(DateEndState, DateStartState)
		const years = differenceInYears(DateEndState, DateStartState)

		let date
		try {
			date =
				typeof value === 'number'
					? new Date(value)
					: parse(value, 'yyyy-MM-dd', new Date())
		} catch (error) {
			console.error('Error parsing date:', error)
			return ''
		}

		if (isNaN(date.getTime())) {
			console.error('Invalid date:', value)
			return ''
		}

		if (days <= 31) {
			return format(date, 'd MMM')
		} else if (months <= 12) {
			return format(date, 'MMM yyyy')
		} else {
			return format(date, 'yyyy')
		}
	}

	const memoizedOptions = useMemo(
		() => ({
			responsive: true,
			maintainAspectRatio: false,
			aspectRatio: 2,
			plugins: {
				legend: {display: true},
				title: {display: false},
				tooltip: {enabled: true},
			},
			scales: {
				x: {
					type: 'category', // Ensure this matches the registered scale
					stacked: false,
					ticks: {display: true},
					grid: {display: false},
					title: {
						display: true,
						text: 'Дата',
					},
				},
				y: {
					type: 'linear', // Use 'linear' for numerical data on y-axis
					stacked: false,
					ticks: {display: true},
					grid: {display: true},
					title: {
						display: true,
						text: 'Значение',
					},
				},
			},
		}),
		[],
	)

	useEffect(() => {
		if (data) {
			const formattedData = {
				...data,
				labels: data.labels.map((label: string | number) => {
					if (typeof label === 'number') {
						return new Date(label).toISOString().split('T')[0]
					}
					return label
				}),
			}
			setDataSet(formattedData)
		}
	}, [data])

	if (loading) {
		return (
			<div className={s.loading}>
				<Loader className={s.loader} />
				<p>Загрузка данных...</p>
			</div>
		)
	}

	if (!dataSet) {
		return <div className={s.loading}>Нет данных для отображения.</div>
	}

	return (
		<div className={`${s.GraphicBlock} ${className}`} style={style}>
			<div className={s.MenuForGraphic}>
				<FormControl variant="standard" className={s.formControl}>
					<InputLabel id="date-select-label">Выберите период</InputLabel>
					<Select
						labelId="date-select-label"
						className={s.muiSelect}
						value={DateState}
						onChange={OnChangeDate}
						defaultValue={0}>
						<MenuItem value={0}>За последние 30 дней</MenuItem>
						<MenuItem value={1}>С начала месяца</MenuItem>
						<MenuItem value={2}>С начала года</MenuItem>
						<MenuItem value={3}>За всё время</MenuItem>
					</Select>
				</FormControl>
				<Line width="260px" />
				<div className={s.Dates}>
					<div className={s.DatePicker}>
						<MiniCalendar
							value={DateStartState}
							onChange={OnChangeDateStart}
							calendarId={title}
						/>
					</div>
					<Line width="20px" className={s.LineDate} />
					<div className={s.DatePicker}>
						<MiniCalendar
							value={DateEndState}
							onChange={OnChangeDateEnd}
							calendarId={`${title}-right`}
						/>
					</div>
				</div>
				{renderCheckboxes && renderCheckboxes()}
			</div>
			<div className={s.ChartWrap}>
				<p>{title}</p>
				<div className={s.chart_container}>
					{chooseGraphic === 0 ? (
						<LineGraph
							className={s.Graphic}
							data={dataSet}
							options={memoizedOptions}
						/>
					) : (
						<Bar
							className={s.Graphic}
							data={dataSet}
							options={memoizedOptions}
						/>
					)}
				</div>
			</div>
		</div>
	)
}

export default GraphicBlock
