import React, {useEffect, useState, useMemo, useCallback} from 'react'
import {useSelector} from 'react-redux'
import {useNavigate} from 'react-router-dom'
import {styled, Checkbox, FormGroup, FormControlLabel} from '@mui/material'
import {BarChart2, LineChart, X} from 'lucide-react'
import socket from '../../socket'
import GraphicBlock from '../../components/GraphicBlock'
import Line from '../../components/Line'
import s from './index.module.scss'

const StyledPickersLayout = styled('span')(({theme}) => ({
	'.MuiDateCalendar-root, .MuiPickersDay-today, .Mui-selected, .Mui-selected:focus, .MuiButtonBase-root:focus, .MuiPickersYear-yearButton .Mui-selected:focus':
		{
			color: '#25991c',
			backgroundColor: '#25991c',
			borderColor: '#25991c',
		},
}))

const initialDate = new Date()
const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)

const initialGraphicState = {
	items: ['all'],
	date: 0,
	dateStart: initialDate,
	dateEnd: futureDate,
}

interface GraphicState {
	items: string[]
	date: number
	dateStart: Date
	dateEnd: Date
}

interface AllData {
	studentFinanceData: {labels: string[]; datasets: any[]; maxValue: number}
	studentCountData: {labels: string[]; datasets: any[]; maxValue: number}
	studentLessonsData: {labels: string[]; datasets: any[]; maxValue: number}
	clientFinanceData: {labels: string[]; datasets: any[]; maxValue: number}
	clientCountData: {labels: string[]; datasets: any[]; maxValue: number}
	clientWorksData: {labels: string[]; datasets: any[]; maxValue: number}
	comparisonData: {labels: string[]; datasets: any[]; maxValue: number}
}

const Statistics: React.FC = () => {
	const navigate = useNavigate()
	const token = useSelector((state: any) => state.user.token)
	const [names, setNames] = useState<string[]>([])
	const [chooseGraphic, setChooseGraphic] = useState<number>(0)
	const [itemsIds, setItemsIds] = useState<string[]>([])
	const [loading, setLoading] = useState<boolean>(true)

	const [graphicStates, setGraphicStates] = useState<{
		[key: string]: GraphicState
	}>({
		studFin: initialGraphicState,
		studAm: initialGraphicState,
		studLes: initialGraphicState,
		cliFin: initialGraphicState,
		cliAm: initialGraphicState,
		cliWork: initialGraphicState,
		studRelat: initialGraphicState,
	})

	const [allData, setAllData] = useState<AllData>({
		studentFinanceData: {labels: [], datasets: [], maxValue: 0},
		studentCountData: {labels: [], datasets: [], maxValue: 0},
		studentLessonsData: {labels: [], datasets: [], maxValue: 0},
		clientFinanceData: {labels: [], datasets: [], maxValue: 0},
		clientCountData: {labels: [], datasets: [], maxValue: 0},
		clientWorksData: {labels: [], datasets: [], maxValue: 0},
		comparisonData: {labels: [], datasets: [], maxValue: 0},
	})

	const fetchData = useCallback(
		(type: string) => {
			setLoading(true)
			console.log(`Fetching ${type} data with params:`, {
				token,
				startDate: graphicStates[type].dateStart,
				endDate: graphicStates[type].dateEnd,
				subjectIds: graphicStates[type].items,
			})

			switch (type) {
				case 'studFin':
					socket.emit('getStudentFinanceData', {
						token,
						startDate: graphicStates[type].dateStart,
						endDate: graphicStates[type].dateEnd,
						subjectIds: graphicStates[type].items,
					})
					break
				case 'studAm':
					socket.emit('getStudentCountData', {
						token,
						startDate: graphicStates[type].dateStart,
						endDate: graphicStates[type].dateEnd,
						subjectIds: graphicStates[type].items,
					})
					break
				case 'studLes':
					socket.emit('getStudentLessonsData', {
						token,
						startDate: graphicStates[type].dateStart,
						endDate: graphicStates[type].dateEnd,
						subjectIds: graphicStates[type].items,
					})
					break
				case 'cliFin':
					socket.emit('getClientFinanceData', {
						token,
						startDate: graphicStates[type].dateStart,
						endDate: graphicStates[type].dateEnd,
					})
					break
				case 'cliAm':
					socket.emit('getClientCountData', {
						token,
						startDate: graphicStates[type].dateStart,
						endDate: graphicStates[type].dateEnd,
					})
					break
				case 'cliWork':
					socket.emit('getClientWorksData', {
						token,
						startDate: graphicStates[type].dateStart,
						endDate: graphicStates[type].dateEnd,
					})
					break
				case 'studRelat':
					socket.emit('getStudentClientComparisonData', {
						token,
						startDate: graphicStates[type].dateStart,
						endDate: graphicStates[type].dateEnd,
					})
					break
				default:
					console.error('Unknown data type:', type)
			}
		},
		[token, graphicStates],
	)

	useEffect(() => {
		console.log('Setting up socket listeners')
		socket.on('getAllItemsIdsAndNames', (data: any) => {
			console.log('Received items and names:', data)
			setNames(data.map((item: any) => item.itemName))
			setItemsIds(data.map((item: any) => item.id))
		})

		socket.on('getStudentFinanceData', (data: any) => {
			console.log('Received student finance data:', data)
			setAllData((prev) => ({...prev, studentFinanceData: data}))
			setLoading(false)
		})

		socket.on('getStudentCountData', (data: any) => {
			console.log('Received student count data:', data)
			setAllData((prev) => ({...prev, studentCountData: data}))
			setLoading(false)
		})

		socket.on('getStudentLessonsData', (data: any) => {
			console.log('Received student lessons data:', data)
			setAllData((prev) => ({...prev, studentLessonsData: data}))
			setLoading(false)
		})

		socket.on('getClientFinanceData', (data: any) => {
			console.log('Received client finance data:', data)
			setAllData((prev) => ({...prev, clientFinanceData: data}))
			setLoading(false)
		})

		socket.on('getClientCountData', (data: any) => {
			console.log('Received client count data:', data)
			setAllData((prev) => ({...prev, clientCountData: data}))
			setLoading(false)
		})

		socket.on('getClientWorksData', (data: any) => {
			console.log('Received client works data:', data)
			setAllData((prev) => ({...prev, clientWorksData: data}))
			setLoading(false)
		})

		socket.on('getStudentClientComparisonData', (data: any) => {
			console.log('Received student-client comparison data:', data)
			setAllData((prev) => ({...prev, comparisonData: data}))
			setLoading(false)
		})

		socket.on('error', (error: any) => {
			console.error('Socket error:', error)
			setLoading(false)
		})

		return () => {
			console.log('Cleaning up socket listeners')
			socket.off('getAllItemsIdsAndNames')
			socket.off('getStudentFinanceData')
			socket.off('getStudentCountData')
			socket.off('getStudentLessonsData')
			socket.off('getClientFinanceData')
			socket.off('getClientCountData')
			socket.off('getClientWorksData')
			socket.off('getStudentClientComparisonData')
			socket.off('error')
		}
	}, [])

	useEffect(() => {
		console.log('Emitting getAllItemsIdsAndNames')
		socket.emit('getAllItemsIdsAndNames', token)
	}, [token])

	useEffect(() => {
		Object.keys(graphicStates).forEach(fetchData)
	}, [graphicStates, fetchData])

	const handleChange = useCallback(
		(type: string, field: string, value: any) => {
			console.log('Handling change:', {type, field, value})
			setGraphicStates((prev) => ({
				...prev,
				[type]: {...prev[type], [field]: value},
			}))
			fetchData(type)
		},
		[fetchData],
	)

	const handleItemChange = useCallback(
		(type: string, itemName: string) => {
			setGraphicStates((prev) => {
				let newItems
				if (itemName === 'Все предметы') {
					newItems = prev[type].items.includes('all') ? [] : ['all']
				} else {
					newItems = prev[type].items.includes(itemName)
						? prev[type].items.filter(
								(item) => item !== itemName && item !== 'all',
							)
						: [...prev[type].items.filter((item) => item !== 'all'), itemName]
				}
				return {
					...prev,
					[type]: {...prev[type], items: newItems},
				}
			})
			fetchData(type)
		},
		[fetchData],
	)

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
					stacked: false,
					ticks: {display: true},
					grid: {display: false},
					title: {
						display: true,
						text: 'Дата',
					},
				},
				y: {
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

	const renderCheckboxes = useCallback(
		(type: string) => (
			<div className={s.checkboxContainer}>
				<FormGroup className={s.checkboxGroup}>
					{names.map((name) => (
						<FormControlLabel
							key={name}
							control={
								<Checkbox
									checked={
										graphicStates[type].items.includes(name) ||
										(name === 'Все предметы' &&
											graphicStates[type].items.includes('all'))
									}
									onChange={() => handleItemChange(type, name)}
								/>
							}
							label={name}
						/>
					))}
				</FormGroup>
			</div>
		),
		[names, graphicStates, handleItemChange],
	)

	const graphicBlocks = [
		{
			title: 'Ученики-Финансы',
			stateKey: 'studFin',
			dataKey: 'studentFinanceData',
		},
		{
			title: 'Ученики-Количество',
			stateKey: 'studAm',
			dataKey: 'studentCountData',
		},
		{
			title: 'Ученики-Занятия',
			stateKey: 'studLes',
			dataKey: 'studentLessonsData',
		},
		{
			title: 'Заказчики-Финансы',
			stateKey: 'cliFin',
			dataKey: 'clientFinanceData',
			isClient: true,
		},
		{
			title: 'Заказчики-Количество',
			stateKey: 'cliAm',
			dataKey: 'clientCountData',
			isClient: true,
		},
		{
			title: 'Заказчики-Работы',
			stateKey: 'cliWork',
			dataKey: 'clientWorksData',
			isClient: true,
		},
		{
			title: 'Ученики - Заказчики сравнительный график',
			stateKey: 'studRelat',
			dataKey: 'comparisonData',
			isClient: true,
		},
	]

	return (
		<div className={s.wrapper}>
			<div className={s.Header}>
				{[LineChart, BarChart2].map((Icon, index) => (
					<button key={index} onClick={() => setChooseGraphic(index)}>
						<Icon
							className={`${chooseGraphic === index ? s.activeIcon : ''} ${s.Icon}`}
						/>
					</button>
				))}
				<button onClick={() => navigate('../')}>
					<X className={s.CloseIcon} />
				</button>
			</div>
			<div className={s.MainBlock}>
				{graphicBlocks.map(({title, stateKey, dataKey, isClient}, index) => (
					<React.Fragment key={stateKey}>
						<div className={s.graphicBlockWrapper}>
							<GraphicBlock
								StyledPickersLayout={StyledPickersLayout}
								ItemState={graphicStates[stateKey].items}
								DateState={graphicStates[stateKey].date}
								OnChangeDate={(e: any) =>
									handleChange(stateKey, 'date', e.target.value)
								}
								DateStartState={graphicStates[stateKey].dateStart}
								OnChangeDateStart={(e: any) =>
									handleChange(stateKey, 'dateStart', e)
								}
								DateEndState={graphicStates[stateKey].dateEnd}
								OnChangeDateEnd={(e: any) =>
									handleChange(stateKey, 'dateEnd', e)
								}
								chooseGraphic={chooseGraphic}
								data={
									allData[dataKey as keyof AllData] || {
										labels: [],
										datasets: [],
										maxValue: 0,
									}
								}
								options={memoizedOptions}
								title={title}
								isClient={isClient}
								loading={loading}
								renderCheckboxes={() => renderCheckboxes(stateKey)}
							/>
						</div>
						<Line width="100%" className={s.Line} />
					</React.Fragment>
				))}
			</div>
		</div>
	)
}

export default React.memo(Statistics)
