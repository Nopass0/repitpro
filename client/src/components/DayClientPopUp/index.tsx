import s from './index.module.scss'
import Line from '../Line'
import CloseIcon from '@mui/icons-material/Close'
import Client from '../../assets/6.svg'
import CheckBox from '../CheckBox'
import {useDispatch, useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import socket from '../../socket'
import Arrow, {ArrowType} from '../../assets/arrow'
interface IDayClientPopUp {
	name?: string
	date?: string
	item?: string
	totalPrice?: string
	clientId: string

	style?: React.CSSProperties
	onExit?: () => void
}
const DayClientPopUp = ({
	name,
	date,
	item,
	totalPrice,
	clientId,
	style,
	onExit,
}: IDayClientPopUp) => {
	const dispatch = useDispatch()
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)
	const currentOpenedClient = useSelector(
		(state: any) => state.currentScheduleDayClientId,
	)

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [clients, setClients] = useState<any>([])
	const [client, setClient] = useState<any>({})

	const [stagesClient, setStagesClient] = useState<any[]>([])
	const [currentIndexClientSchedule, setCurrentIndexClientSchedule] =
		useState<number>()
	const [clientStudentSchedule, setClientStudentSchedule] = useState<any>()

	console.log(currentOpenedClient, 'currentOpenedClient')
	function nextDayClient() {
		if (currentIndexClientSchedule! < clientStudentSchedule.length - 1) {
			// dispatch({
			// 	type: 'SET_CURRENT_SCHEDULE_DAY_CLIENT_ID',
			// 	payload:
			// 		clientStudentSchedule![currentIndexClientSchedule! + 1].clientId,
			// })
			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: clientStudentSchedule[currentIndexClientSchedule! + 1].day,
					month: clientStudentSchedule[currentIndexClientSchedule! + 1].month,
					year: clientStudentSchedule[currentIndexClientSchedule! + 1].year,
				},
			})

			console.log(
				clientStudentSchedule[currentIndexClientSchedule! + 1],
				currentOpenedClient,
				'next',
			)
		}
	}

	function prevDayClient() {
		if (currentIndexClientSchedule! >= 0) {
			console.log(
				clientStudentSchedule[currentIndexClientSchedule! - 1],
				currentOpenedClient,
				'[prev]',
			)
			// dispatch({
			// 	type: 'SET_CURRENT_SCHEDULE_DAY_CLIENT_ID',
			// 	payload:
			// 		clientStudentSchedule![currentIndexClientSchedule! - 1].clientId,
			// })
			dispatch({
				type: 'SET_CALENDAR_NOW_POPUP',
				payload: {
					day: clientStudentSchedule[currentIndexClientSchedule! - 1].day,
					month: clientStudentSchedule[currentIndexClientSchedule! - 1].month,
					year: clientStudentSchedule[currentIndexClientSchedule! - 1].year,
				},
			})
		}
	}

	useEffect(() => {
		socket.emit('getByClientScheduleId', {
			clientId: client.clientId,
			token: token,
		})

		socket.once('getByClientScheduleId', (data: any) => {
			console.log('getByClientScheduleId', data)
			setClientStudentSchedule(data)
			let indexOfClients = data.findIndex(
				(client: any) => client.id === currentOpenedClient,
			)
			setCurrentIndexClientSchedule(indexOfClients)
			console.log('clientStudentSchedule', clientStudentSchedule)
		})

		console.log(client)
	}, [client, clientId])
	useEffect(() => {
		socket.emit('getClientsByDate', {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token: token,
		})
		socket.once('getClientsByDate', (data: any) => {
			console.log('getClientsByDate', data)
			setClients(data)

			//get client where clientId = clientId
			const client = data.find(
				(client: any) => client.clientId === clientId,
			)
			setClient(client)
			console.log(
				client.workStages.map((client: any) => client.firstPaymentDate),
				'clientclientclientclientclient',
			)
		})
	}, [])

	useEffect(() => {
		if (client) {
			setStagesClient(client.workStages)
		}
		console.log(stagesClient, 'stagesClientstagesClientstagesClient', client)
	}, [client, clients])

	//Date to 12.02.2022 format
	const formatDate = (date: Date) => {
		const day = String(new Date(date).getDate()).padStart(2, '0')
		const month = String(new Date(date).getMonth() + 1).padStart(2, '0')
		const year = String(new Date(date).getFullYear()).slice(-2) // Take last 2 digits of the year

		return `${day}.${month}.${year}`
	}

	return (
		<div style={style} className={s.wrapper}>
			<div className={s.Header}>
				<p>{client?.studentName}</p>
				<p>{date}</p>
				<button onClick={onExit}>
					<CloseIcon className={s.closeIcon} />
				</button>
			</div>
			<Line width="691px" className={s.LineHeader} />
			<div className={s.Main}>
				<img width={'50px'} height={'50px'} src={Client} alt="Client" />
				<div className={s.info}>
					<h1>{client?.itemName}</h1>
					{client.workStages && (
						<>
							<div className={s.HeaderInfo}>
								<p>Общая стоимость {client.totalWorkPrice} ₽</p>
								<p>
									{client.workStages[0].prePay ? 'Предоплата' : 'Постоплата'}
								</p>
							</div>
							<div className={s.LineInfo}>
								<p>{formatDate(client.workStages[0].firstPaymentDate)}</p>
								<p>Оплата</p>
								<p>{client.workStages[0].fisrtPaymentPrice}₽</p>
								<CheckBox
									className={s.Checkbox}
									size={'20px'}
									checked={client.workStages[0].firstPaymentPayed}
								/>
								<p>
									{Math.round(
										(client.workStages[0].firstPaymentPayed /
											client.totalWorkPrice) *
											100,
									)}{' '}
									%
								</p>
							</div>
							<Line width="100%" className={s.Line} />
							<div className={s.LineInfo}>
								<p>{formatDate(client.workStages[0].startWorkDate)}</p>
								<p>Начало работы</p>
								<p></p>
								<CheckBox
									className={s.Checkbox}
									size={'20px'}
									checked={client.workStages[0].isStartWork}
								/>
								<p></p>
							</div>
							<Line width="100%" className={s.Line} />
							<div className={s.LineInfo}>
								<p>{formatDate(client.workStages[0].endPaymentDate)}</p>
								<p>Оплата</p>
								<p>{client.workStages[0].endPaymentPrice}₽</p>
								<CheckBox
									className={s.Checkbox}
									size={'20px'}
									checked={client.workStages[0].endPaymentPayed}
								/>
								<p>
									{Math.round(
										(client.workStages[0].endPaymentPayed /
											client.totalWorkPrice) *
											100,
									)}{' '}
									%
								</p>
							</div>
							<Line width="100%" className={s.Line} />
							<div className={s.LineInfo}>
								<p>{formatDate(client.workStages[0].endWorkDate)}</p>
								<p>Сдача работы</p>
								<p>₽</p>
								<CheckBox
									className={s.Checkbox}
									size={'20px'}
									checked={client.workStages[0].isEndWork}
								/>
								<p>
									{Math.round(
										(client.workStages[0].endPaymentPayed /
											client.totalWorkPrice) *
											100,
									) +
										Math.round(
											(client.workStages[0].firstPaymentPayed /
												client.totalWorkPrice) *
												100,
										)}{' '}
									%
								</p>
							</div>
							<Line width="100%" className={s.Line} />
						</>
					)}
				</div>
			</div>
			{/* <div className={s.buttons}>
				<div className={s.btn}>
					<button className={s.btnRight} onClick={nextDayClient}>
						<span>
							<Arrow direction={ArrowType.right} />
						</span>
					</button>
					<button className={s.btnLeft} onClick={prevDayClient}>
						<span>
							<Arrow direction={ArrowType.left} />
						</span>
					</button>
				</div>
			</div> */}
		</div>
	)
}

export default DayClientPopUp
