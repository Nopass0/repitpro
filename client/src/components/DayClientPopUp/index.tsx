import s from './index.module.scss'
import Line from '../Line'
import DataSlidePicker from '../DataSlidePicker'
import CloseIcon from '@mui/icons-material/Close'
import DayCalendarLine from '../DayCalendarLine/index'
import GroupOnline from '../../assets/1.svg'
import Online from '../../assets/2.svg'
import HomeStudent from '../../assets/3.svg'
import Group from '../../assets/4.svg'
import Home from '../../assets/5.svg'
import Client from '../../assets/6.svg'
import Plus from '../../assets/ItemPlus.svg'
import RecordNListen from '../RecordNListen'
import {Option, Select, SelectOption} from '@mui/base'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import CheckBox from '../CheckBox'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import socket from '../../socket'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
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
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)
	const user = useSelector((state: any) => state.user)
	const token = user.token

	const [clients, setClients] = useState<any>([])
	const [client, setClient] = useState<any>({})

	const [stagesClient, setStagesClient] = useState<any[]>([])
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
			const client = data.find((client: any) => client.clientId === clientId)
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
					{client.workStages &&
						
							<>
								<div className={s.HeaderInfo}>
									<p>Общая стоимость {client.totalWorkPrice} ₽</p>
									<p>{client.workStages[0].prePay ? 'Предоплата' : 'Постоплата'}</p>
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
											(client.workStages[0].firstPaymentPayed / client.totalWorkPrice) * 100,
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
											(client.workStages[0].endPaymentPayed / client.totalWorkPrice) * 100,
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
											(client.workStages[0].endPaymentPayed / client.totalWorkPrice) * 100,
										) +
											Math.round(
												(client.workStages[0].firstPaymentPayed / client.totalWorkPrice) * 100,
											)}{' '}
										%
									</p>
								</div>
								<Line width="100%" className={s.Line} />
							</>
						}
				</div>
			</div>
			{/* <div className={s.buttons}>
				<div className={s.btn}>
					<button className={s.btnRight}>
						<span>
							<Arrow direction={ArrowType.right} />
						</span>
					</button>
					<button className={s.btnLeft}>
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
