import s from './index.module.scss'
import * as mui from '@mui/material'
import {styled} from '@mui/material/styles'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Line from '../Line'
import Search from '../../assets/search'
import {useEffect, useState} from 'react'
import Arrow, {ArrowType} from '../../assets/arrow'
import microSVG from '../../assets/Microphone1.svg'
import Listen from '../../assets/Listen.svg'
import Plus from '../../assets/ItemPlus.svg'
import InActive from '../../assets/InActiveCheckboxIcon.svg'
import CheckBox from '../CheckBox'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import InputMask from 'react-input-mask'
import {DatePicker} from '@mui/x-date-pickers/DatePicker'
import CreateIcon from '@mui/icons-material/Create'
import './index.css'
import {ru} from 'date-fns/locale/ru'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3'
import ScheduleDate from '../ScheduleDate/index'
import ScheduleIcon from '@mui/icons-material/Schedule'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TimeSelector from '../Timer/index'
import uploadFile from '../../assets/UploadFile.svg'
import Input from '../Input'
import socket from '../../socket'
import {useDispatch, useSelector} from 'react-redux'
import CloseIcon from '@mui/icons-material/Close'
import ExitPopUp from '../ExitPopUp'
import {useNavigate} from 'react-router-dom'
import {ELeftMenuPage, EPagePopUpExit} from '../../types'
import FileNLinks from '../FileNLinks'
import RecordNListen from '../RecordNListen/index'
import IconsPhone from '../IconsPhone'
interface IAddClient {}

const AddClient = ({}: IAddClient) => {
	const dispatch = useDispatch()

	const PagePopUpExit = useSelector((state: any) => state.pagePopUpExit)
	// Block Student
	const [stages, setStages] = useState<number>(1)
	const [nameStudent, setNameStudent] = useState<string>('')
	const [phoneNumber, setPhoneNumber] = useState<string>('')
	const [email, setEmail] = useState<string>('')
	const [costStudent, setCostStudent] = useState<string>('')
	const [commentClient, setcommentClient] = useState<string>('')

	// Block item
	const [itemName, setItemName] = useState<string>('')
	const [typePayment, setTypePayment] = useState<boolean>(false) // Предоплата
	const [generalComment, setGeneralComment] = useState<string>('')

	const [currentJobIndex, setCurrentJobIndex] = useState<number>(0)
	const [currentStageIndex, setCurrentStageIndex] = useState<number>(0)

	const user = useSelector((state: any) => state.user)
	const token = user?.token

	const [jobs, setJobs] = useState([
		{
			jobName: '',
			itemName: '',
			cost: 0,
			stages: [
				{
					totalCost: 0,
					name: '',
					typePayment: false, // Предоплата false - оплата true

					dateStart: new Date(Date.now()), // Изначально установлено null, чтобы пользователь мог ввести дату
					cost: 0,
					prePay: true,
					postPay: false,

					// First payment
					endPaymentPrice: 0,
					endPaymentDate: new Date(Date.now()),
					firstPaymentPayed: false,

					// Start work
					startWorkDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
					isStartWork: false,

					// end payment
					firstPaymentDate: new Date(Date.now()),
					fisrtPaymentPrice: 0,
					endPaymentPayed: false,

					// end work
					endWorkDate: new Date(Date.now()),
					isEndWork: false,

					payment: 0,
					payed: false,
					date: new Date(Date.now()),
					workStarted: false,
					paymentDate: new Date(Date.now()),
				},
			],
		},
	])

	const addJob = () => {
		if (jobs[currentJobIndex].itemName !== '') {
			setJobs([
				...jobs,
				{
					jobName: '',
					itemName: '',
					cost: 0,
					stages: [
						{
							totalCost: 0,
							name: '',
							typePayment: false, // Предоплата false - оплата true

							dateStart: new Date(Date.now()), // Изначально установлено null, чтобы пользователь мог ввести дату
							cost: 0,
							prePay: true,
							postPay: false,
							payment: 0,

							// First payment
							endPaymentPrice: 0,
							endPaymentDate: new Date(Date.now()),
							firstPaymentPayed: false,

							// Start work
							startWorkDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
							isStartWork: false,

							// end payment
							firstPaymentDate: new Date(Date.now()),
							fisrtPaymentPrice: 0,
							endPaymentPayed: false,

							// end work
							endWorkDate: new Date(Date.now()),
							isEndWork: false,

							payed: false,
							date: new Date(Date.now()),
							workStarted: false,
							paymentDate: new Date(Date.now()),
						},
					],
				},
			])
		}
	}

	const changeJob = (index: number, name: string, value: any) => {
		setJobs(jobs.map((job, i) => (i === index ? {...job, [name]: value} : job)))
	}

	const changeStage = (
		jobIndex: number,
		stageIndex: number,
		name: string,
		value: any,
	) => {
		setJobs(
			jobs.map((job, i) =>
				i === jobIndex
					? {
							...job,
							stages: job.stages.map((stage, j) =>
								j === stageIndex ? {...stage, [name]: value} : stage,
							),
					  }
					: job,
			),
		)
	}

	const addStage = (jobIndex: number) => {
		if (jobs[jobIndex].stages[currentStageIndex].name !== '') {
			setJobs(
				jobs.map((job, i) =>
					i === jobIndex
						? {
								...job,
								stages: [
									...job.stages,
									{
										totalCost: 0,
										name: '',
										typePayment: false, // Предоплата false - оплата true

										dateStart: new Date(Date.now()), // Изначально установлено null, чтобы пользователь мог ввести дату
										cost: 0,
										prePay: true,
										postPay: false,
										payment: 0,
										payed: false,
										date: new Date(Date.now()),
										workStarted: false,

										// First payment
										endPaymentPrice: 0,
										endPaymentDate: new Date(Date.now()),
										firstPaymentPayed: false,

										// Start work
										startWorkDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
										isStartWork: false,

										// end payment
										firstPaymentDate: new Date(Date.now()),
										fisrtPaymentPrice: 0,
										endPaymentPayed: false,

										// end work
										endWorkDate: new Date(Date.now()),
										isEndWork: false,

										paymentDate: new Date(Date.now()),
									},
								],
						  }
						: job,
				),
			)
		}
	}

	const sendInfo = () => {
		socket.emit('addClient', {
			nameStudent: nameStudent,
			phoneNumber: phoneNumber,
			email: email,
			costStudent: costStudent,
			commentClient: commentClient,
			jobs: jobs,
			token: token,
		})

		window.location.reload()
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
	const [open, setOpen] = useState(true)

	const handleClick = () => {
		setOpen(!open)
	}

	const [data, setData] = useState<any>(null)
	const [allIdsClient, setAllIdsClient] = useState<string[]>([])
	const currentOpenedClient = useSelector(
		(state: any) => state.currentOpenedClient,
	)
	const [currentClientPosition, setCurrentClientPosition] = useState<number>(0)

	useEffect(() => {
		socket.emit('getClientList', token)
		socket.once('getClientList', (data) => {
			console.log(data, '------ getClientList --------')
			const ids = data.map((client: any) => client.id)
			const position = ids.indexOf(currentOpenedClient)
			setCurrentClientPosition(position)
			setAllIdsClient(ids)
		})

		socket.once('getClientById', (data) => {
			console.log(data, '------ getClientById --------')
			setData(data)
			setJobs(data.jobs)
			setNameStudent(data.nameStudent)
			setPhoneNumber(data.phoneNumber)
			setEmail(data.email)
			setCostStudent(data.costStudent)
			setcommentClient(data.commentClient)
		})
	}, [])

	useEffect(() => {
		if (data) {
			setJobs(data.jobs)
			setNameStudent(data.nameStudent)
			setPhoneNumber(data.phoneNumber)
			setEmail(data.email)
			setCostStudent(data.costStudent)
			setcommentClient(data.commentClient)
		}
	}, [data])

	const nextClient = () => {
		if (Number(currentClientPosition) < allIdsClient.length - 1) {
			setCurrentClientPosition(Number(currentClientPosition) + 1)
			const newId = allIdsClient[Number(currentClientPosition)]

			dispatch({type: 'SET_CURRENT_OPENED_CLIENT', payload: newId})
			socket.emit('getClientById', {token: token, clientId: newId})

			socket.once('getClientById', (data) => {
				console.log(data, 'getGroupById')
				setData(data)
				setJobs(data.jobs)
				setNameStudent(data.nameStudent)
				setPhoneNumber(data.phoneNumber)
				setEmail(data.email)
				setCostStudent(data.costStudent)
				setcommentClient(data.commentClient)
			})
		}
	}

	const prevClient = () => {
		if (Number(currentClientPosition) > 0) {
			setCurrentClientPosition(Number(currentClientPosition) - 1)
			const newId = allIdsClient[Number(currentClientPosition)]

			dispatch({type: 'SET_CURRENT_OPENED_CLIENT', payload: newId})
			socket.emit('getClientById', {token: token, clientId: newId})

			socket.once('getClientById', (data) => {
				console.log(data, 'getGroupById')
				setData(data)
				setJobs(data.jobs)
				setNameStudent(data.nameStudent)
				setPhoneNumber(data.phoneNumber)
				setEmail(data.email)
				setCostStudent(data.costStudent)
				setcommentClient(data.commentClient)
			})
		}
	}

	useEffect(() => {
		console.log(jobs, jobs[0].stages, '<Job stages>')
	}, [jobs])

	return (
		<>
			<button
				onClick={() => {
					dispatch({
						type: 'SET_PAGE_POPUP_EXIT',
						payload: EPagePopUpExit.Exit,
					})
					// } else {
					// 	dispatch({
					// 		type: 'SET_LEFT_MENU_PAGE',
					// 		payload: ELeftMenuPage.MainPage,
					// 	})
					// }
				}}
				className={s.CloseButton}>
				<CloseIcon className={s.CloseIcon} />
			</button>
			<div className={s.wrapper}>
				<div className={s.Header}>
					<div className={s.HeaderAddClient}>
						<div className={s.dataSlidePicker}>
							<button className={s.btn} onClick={prevClient}>
								<span>
									<Arrow direction={ArrowType.left} />
								</span>
							</button>
							<p className={s.btnText}>
								Карточка заказчика {currentClientPosition + 1}/
								{allIdsClient.length}
							</p>
							<button className={s.btn} onClick={nextClient}>
								<span>
									<Arrow direction={ArrowType.right} />
								</span>
							</button>
						</div>
					</div>
					<div className={s.StudNameHead}>
						<div className={s.StudentCardName}>
							<div className={s.StudentCardName_Left}>
								<p>Имя:</p>
								<input
									type="text"
									value={nameStudent}
									onChange={(e) =>
										setNameStudent(
											e.target.value.charAt(0).toUpperCase() +
												e.target.value.slice(1).toLowerCase(),
										)
									}
								/>
							</div>
							<p>*</p>
						</div>

						{/* <Line width="100%" className={s.Line} /> */}
					</div>
				</div>
				<div className={s.wrapperMenu}>
					<div className={s.StudentInput}>
						<div className={s.StudentCard}>
							<p>Тел:</p>
							<InputMask
								type="text"
								mask="+7 (999) 999-99-99"
								maskChar="_"
								value={phoneNumber}
								onChange={(e: any) => setPhoneNumber(e.target.value)}
							/>
							<IconsPhone phoneNumber={phoneNumber} email={email} />
						</div>
						<Line width="100%" className={s.Line} />
						<div className={s.StudentCard}>
							<p>Эл. почта:</p>
							<input
								type="email"
								value={email}
								onChange={(e: any) => setEmail(e.target.value)}
							/>
						</div>
						<Line width="100%" className={s.Line} />

						<div className={s.StudentCard}>
							<p>Расходы по ученику:</p>
							<Input
								width={`${costStudent.length}ch`}
								type="text"
								value={costStudent}
								onChange={(e) => setCostStudent(e.target.value)}
								style={{borderBottom: '1px solid #e2e2e9'}}
							/>
							<p>₽</p>
						</div>

						<Line width="100%" className={s.Line} />

						<div className={s.StudentCard}>
							<p>Комментарий:</p>
							<textarea
								value={commentClient}
								onChange={(e) => setcommentClient(e.target.value)}
							/>
						</div>
					</div>
					<Line width="100%" className={s.Line} />

					<RecordNListen />

					<div className={s.ItemWrapper}>
						<div className={s.ItemHeader}>
							<div className={s.dataSlidePicker}>
								<button
									className={s.btn}
									onClick={() =>
										currentJobIndex > 0 &&
										setCurrentJobIndex(currentJobIndex - 1)
									}>
									<span>
										<Arrow direction={ArrowType.left} />
									</span>
								</button>
								{/* NO DATA */}
								<p className={s.btnText}>
									Работа {currentJobIndex + 1} / {jobs.length}
								</p>
								<button
									className={s.btn}
									onClick={() =>
										currentJobIndex < jobs.length - 1 &&
										setCurrentJobIndex(currentJobIndex + 1)
									}>
									<span>
										<Arrow direction={ArrowType.right} />
									</span>
								</button>
							</div>
							<button className={s.ItemPlus} onClick={addJob}>
								<img src={Plus} alt={Plus} />
							</button>
						</div>

						{/* <Line width="100%" className={s.Line} /> */}

						{jobs.map((job, index) => (
							<div
								className={
									currentJobIndex === index ? s.ItemActive_ : s.ItemMain_
								}>
								<div className={s.StudentCard}>
									<p>Предмет:</p>
									<input
										type="text"
										value={job.itemName}
										onChange={(e) => {
											changeJob(
												index,
												'itemName',
												e.target.value.charAt(0).toUpperCase() +
													e.target.value.slice(1).toLowerCase(),
											)
										}}
									/>
								</div>

								<Line width="100%" className={s.Line} />

								<div className={s.StudentCard}>
									<p>Название работы:</p>
									<input
										type="text"
										value={job.jobName}
										onChange={(e) => {
											changeJob(
												index,
												'jobName',
												e.target.value.charAt(0).toUpperCase() +
													e.target.value.slice(1).toLowerCase(),
											)
										}}
									/>
								</div>

								<Line width="100%" className={s.Line} />
								<div className={s.StudentCard}>
									<mui.Select
										variant={'standard'}
										// defaultValue={1}
										value={stages}
										onChange={(e) => {
											setStages(e.target.value)
										}}>
										<mui.MenuItem value={1}>
											<p>Стандартная работа</p>
										</mui.MenuItem>
										<mui.MenuItem value={2}>
											<p>Многоэтапная работа</p>
										</mui.MenuItem>
									</mui.Select>
								</div>

								<Line width="100%" className={s.Line} />

								{stages === 1 && (
									<>
										<div className={s.StudentCard}>
											<p>Общая стоимость работы:</p>
											<Input
												width={`${Number(job.stages[0].totalCost.length)}ch`}
												num
												type="text"
												value={job.stages[0].totalCost || ''}
												onChange={(e) => {
													changeStage(index, 0, 'totalCost', e.target.value)
												}}
												style={{borderBottom: '1px solid #e2e2e9'}}
											/>
											<p>₽</p>
										</div>

										<Line width="100%" className={s.Line} />
									</>
								)}
								{stages === 2 && (
									<>
										<div className={s.StudentCard}>
											<p>Общая стоимость работы:</p>
											<Input
												width={`${job.stages[0].totalCost.length}ch`}
												num
												type="text"
												value={job.stages[0].totalCost || ''}
												onChange={(e) => {
													changeStage(index, 0, 'totalCost', e.target.value)
												}}
											/>
											<p>₽</p>
										</div>
										{/* <div className={s.StudentCard}>
										<p>Комментарий:</p>
										<textarea
											value={job.stage.commentStageTwo}
											onChange={(e) =>
												changeStage(index, 0, 'comment', e.target.value)
											}
										/>
									</div> */}
										<Line width="100%" className={s.Line} />

										<RecordNListen />
										<div className={s.ItemHeader}>
											<div className={s.dataSlidePicker}>
												<button
													className={s.btn}
													onClick={() =>
														currentStageIndex > 0 &&
														setCurrentStageIndex(currentStageIndex - 1)
													}>
													<span>
														<Arrow direction={ArrowType.left} />
													</span>
												</button>
												{/* NO DATA */}
												<p className={s.btnText}>
													Этапы {currentStageIndex + 1} / {job.stages.length}
												</p>
												<button
													className={s.btn}
													onClick={() =>
														currentStageIndex < job.stages.length - 1 &&
														setCurrentStageIndex(currentStageIndex + 1)
													}>
													<span>
														<Arrow direction={ArrowType.right} />
													</span>
												</button>
											</div>
											<button
												className={s.ItemPlus}
												onClick={() => addStage(index)}>
												<img src={Plus} alt={Plus} />
											</button>
										</div>
										{job.stages.map((item, indexStage) => (
											<>
												<div
													key={indexStage}
													className={
														currentStageIndex === indexStage
															? s.ItemActive_
															: s.ItemMain_
													}>
													<div className={s.StudentCard}>
														<p>Название:</p>
														<input
															type="text"
															value={item.name}
															onChange={(e) => {
																changeStage(
																	index,
																	indexStage,
																	'name',
																	e.target.value.charAt(0).toUpperCase() +
																		e.target.value.slice(1).toLowerCase(),
																)
															}}
														/>
													</div>
													<Line width="100%" className={s.Line} />
													<div className={s.StudentCard}>
														<p>Стоимость этапа:</p>
														<Input
															style={{borderBottom: '1px solid #e2e2e9'}}
															num
															type="text"
															value={item.totalCost}
															width={`${item.totalCost.length}ch`}
															onChange={(e) => {
																changeStage(
																	index,
																	indexStage,
																	'totalCost',
																	e.target.value,
																)
															}}
														/>
														<p>₽</p>
													</div>
													<Line width="100%" className={s.Line} />
													<div className={s.TypePaymentWrapper}>
														<div
															onClick={() => {
																setTypePayment(false)
																changeStage(
																	index,
																	indexStage,
																	'typePayment',
																	typePayment,
																)
															}}
															className={s.PrevPay}>
															<p>Предоплата</p>
															<CheckBox
																checked={
																	item.typePayment === false ? true : false
																}
																size="18px"
															/>
														</div>
														<div
															onClick={() => {
																setTypePayment(true)
																changeStage(
																	index,
																	indexStage,
																	'typePayment',
																	typePayment,
																)
															}}
															className={s.NextPay}>
															<p>Постоплата</p>
															<CheckBox
																checked={
																	item.typePayment === true ? true : false
																}
																size="18px"
															/>
														</div>
													</div>
													<div className={s.PaymentTable}>
														{item.typePayment === true ? (
															<>
																<div className={s.PaymentRow}>
																	<LocalizationProvider
																		dateAdapter={AdapterDateFns}
																		adapterLocale={ru}>
																		<DatePicker
																			className={s.DatePickerPayment}
																			slots={{
																				layout: StyledPickersLayout,
																			}}
																			sx={{
																				input: {
																					paddingTop: '0px',
																					paddingBottom: '0px',
																					paddingLeft: '0px',
																				},
																			}}
																			value={item.startWorkDate}
																			onChange={(newValue) => {
																				changeStage(
																					index,
																					indexStage,
																					'startWorkDate',
																					newValue,
																				)
																			}}
																			timezone="system"
																			showDaysOutsideCurrentMonth
																		/>
																	</LocalizationProvider>
																	<div className={s.PayText}>
																		<p>Начало работы</p>
																	</div>
																	<CheckBox
																		size="18px"
																		checked={item.isStartWork}
																		onChange={() =>
																			changeStage(
																				index,
																				indexStage,
																				'isStartWork',
																				!item.isStartWork,
																			)
																		}
																	/>
																	<p style={{width: '33px'}}></p>
																</div>
																<Line width="317px" className={s.Line} />
																<div className={s.PaymentRow}>
																	<LocalizationProvider
																		dateAdapter={AdapterDateFns}
																		adapterLocale={ru}>
																		<DatePicker
																			className={s.DatePickerPayment}
																			slots={{
																				layout: StyledPickersLayout,
																			}}
																			sx={{
																				input: {
																					paddingTop: '0px',
																					paddingBottom: '0px',
																					paddingLeft: '0px',
																				},
																			}}
																			value={item.firstPaymentDate}
																			onChange={(newValue) => {
																				changeStage(
																					index,
																					indexStage,
																					'firstPaymentDate',
																					newValue,
																				)
																			}}
																			timezone="system"
																			showDaysOutsideCurrentMonth
																		/>
																	</LocalizationProvider>
																	<div className={s.PayInput}>
																		<p>Оплата</p>
																		<Input
																			num
																			type="text"
																			value={String(item.fisrtPaymentPrice!)}
																			onChange={(e) =>
																				changeStage(
																					index,
																					indexStage,
																					'fisrtPaymentPrice',
																					Number(e.target.value),
																				)
																			}
																		/>
																		<p>₽</p>
																	</div>
																	<CheckBox
																		size="18px"
																		checked={item.firstPaymentPayed}
																		onChange={() =>
																			changeStage(
																				index,
																				indexStage,
																				'firstPaymentPayed',
																				!item.firstPaymentPayed,
																			)
																		}
																	/>
																	<p style={{width: '33px'}}>0%</p>
																</div>
																<Line width="317px" className={s.Line} />
																<div className={s.PaymentRow}>
																	<LocalizationProvider
																		dateAdapter={AdapterDateFns}
																		adapterLocale={ru}>
																		<DatePicker
																			className={s.DatePickerPayment}
																			slots={{
																				layout: StyledPickersLayout,
																			}}
																			sx={{
																				input: {
																					paddingTop: '0px',
																					paddingBottom: '0px',
																					paddingLeft: '0px',
																				},
																			}}
																			value={item.endWorkDate}
																			onChange={(newValue) => {
																				changeStage(
																					index,
																					indexStage,
																					'endWorkDate',
																					newValue,
																				)
																			}}
																			timezone="system"
																			showDaysOutsideCurrentMonth
																		/>
																	</LocalizationProvider>
																	<div className={s.PayText}>
																		<p>Сдача работы</p>
																	</div>
																	<CheckBox
																		size="18px"
																		checked={item.isEndWork}
																		onChange={() =>
																			changeStage(
																				index,
																				indexStage,
																				'isEndWork',
																				!item.isEndWork,
																			)
																		}
																	/>
																	<p style={{width: '33px'}}></p>
																</div>
																<Line width="317px" className={s.Line} />
																<div className={s.PaymentRow}>
																	<LocalizationProvider
																		dateAdapter={AdapterDateFns}
																		adapterLocale={ru}>
																		<DatePicker
																			className={s.DatePickerPayment}
																			slots={{
																				layout: StyledPickersLayout,
																			}}
																			sx={{
																				input: {
																					paddingTop: '0px',
																					paddingBottom: '0px',
																					paddingLeft: '0px',
																				},
																			}}
																			value={item.endPaymentDate}
																			onChange={(newValue) => {
																				changeStage(
																					index,
																					indexStage,
																					'endPaymentDate',
																					newValue,
																				)
																			}}
																			timezone="system"
																			showDaysOutsideCurrentMonth
																		/>
																	</LocalizationProvider>
																	<div className={s.PayInput}>
																		<p>Оплата</p>
																		<Input
																			num
																			type="text"
																			value={String(item.endPaymentPrice)}
																			onChange={(e) =>
																				changeStage(
																					index,
																					indexStage,
																					'endPaymentPrice',
																					Number(e.target.value),
																				)
																			}
																		/>
																		<p>₽</p>
																	</div>
																	<CheckBox
																		size="18px"
																		checked={item.endPaymentPayed}
																		onChange={() =>
																			changeStage(
																				index,
																				indexStage,
																				'endPaymentPayed',
																				!item.endPaymentPayed,
																			)
																		}
																	/>
																	<p style={{width: '33px'}}>0%</p>
																</div>
															</>
														) : (
															<>
																<div className={s.PaymentRow}>
																	<LocalizationProvider
																		dateAdapter={AdapterDateFns}
																		adapterLocale={ru}>
																		<DatePicker
																			className={s.DatePickerPayment}
																			slots={{
																				layout: StyledPickersLayout,
																			}}
																			sx={{
																				input: {
																					paddingTop: '0px',
																					paddingBottom: '0px',
																					paddingLeft: '0px',
																				},
																			}}
																			value={item.firstPaymentDate}
																			onChange={(newValue) => {
																				changeStage(
																					index,
																					indexStage,
																					'firstPaymentDate',
																					newValue,
																				)
																			}}
																			timezone="system"
																			showDaysOutsideCurrentMonth
																		/>
																	</LocalizationProvider>
																	<div className={s.PayInput}>
																		<p>Оплата</p>
																		<Input
																			num
																			type="text"
																			value={String(item.fisrtPaymentPrice!)}
																			onChange={(e) =>
																				changeStage(
																					index,
																					indexStage,
																					'fisrtPaymentPrice',
																					Number(e.target.value),
																				)
																			}
																		/>
																		<p>₽</p>
																	</div>
																	<CheckBox
																		size="18px"
																		checked={item.firstPaymentPayed}
																		onChange={() =>
																			changeStage(
																				index,
																				indexStage,
																				'firstPaymentPayed',
																				!item.firstPaymentPayed,
																			)
																		}
																	/>
																	<p style={{width: '33px'}}>0%</p>
																</div>
																<Line width="317px" className={s.Line} />
																<div className={s.PaymentRow}>
																	<LocalizationProvider
																		dateAdapter={AdapterDateFns}
																		adapterLocale={ru}>
																		<DatePicker
																			className={s.DatePickerPayment}
																			slots={{
																				layout: StyledPickersLayout,
																			}}
																			sx={{
																				input: {
																					paddingTop: '0px',
																					paddingBottom: '0px',
																					paddingLeft: '0px',
																				},
																			}}
																			value={item.startWorkDate!}
																			onChange={(newValue) => {
																				changeStage(
																					index,
																					indexStage,
																					'startWorkDate',
																					newValue,
																				)
																			}}
																			timezone="system"
																			showDaysOutsideCurrentMonth
																		/>
																	</LocalizationProvider>
																	<div className={s.PayText}>
																		<p>Начало работы</p>
																	</div>
																	<CheckBox
																		size="18px"
																		checked={item.isStartWork}
																		onChange={() =>
																			changeStage(
																				index,
																				indexStage,
																				'isStartWork',
																				!item.isStartWork,
																			)
																		}
																	/>
																	<p style={{width: '33px'}}></p>
																</div>
																<Line width="317px" className={s.Line} />
																<div className={s.PaymentRow}>
																	<LocalizationProvider
																		dateAdapter={AdapterDateFns}
																		adapterLocale={ru}>
																		<DatePicker
																			className={s.DatePickerPayment}
																			slots={{
																				layout: StyledPickersLayout,
																			}}
																			sx={{
																				input: {
																					paddingTop: '0px',
																					paddingBottom: '0px',
																					paddingLeft: '0px',
																				},
																			}}
																			value={item.endPaymentDate!}
																			onChange={(newValue) => {
																				changeStage(
																					index,
																					indexStage,
																					'endPaymentDate',
																					newValue,
																				)
																			}}
																			timezone="system"
																			showDaysOutsideCurrentMonth
																		/>
																	</LocalizationProvider>
																	<div className={s.PayInput}>
																		<p>Оплата</p>
																		<Input
																			num
																			type="text"
																			value={String(item.endPaymentPrice)}
																			onChange={(e) =>
																				changeStage(
																					index,
																					indexStage,
																					'endPaymentPrice',
																					Number(e.target.value),
																				)
																			}
																		/>
																		<p>₽</p>
																	</div>
																	<CheckBox
																		size="18px"
																		checked={item.endPaymentPayed}
																		onChange={() =>
																			changeStage(
																				index,
																				indexStage,
																				'endPaymentPayed',
																				!item.endPaymentPayed,
																			)
																		}
																	/>
																	<p style={{width: '33px'}}>0%</p>
																</div>
																<Line width="317px" className={s.Line} />
																<div className={s.PaymentRow}>
																	<LocalizationProvider
																		dateAdapter={AdapterDateFns}
																		adapterLocale={ru}>
																		<DatePicker
																			className={s.DatePickerPayment}
																			slots={{
																				layout: StyledPickersLayout,
																			}}
																			sx={{
																				input: {
																					paddingTop: '0px',
																					paddingBottom: '0px',
																					paddingLeft: '0px',
																				},
																			}}
																			value={job.stages[0].endWorkDate}
																			onChange={(newValue) => {
																				changeStage(
																					index,
																					indexStage,
																					'endWorkDate',
																					newValue,
																				)
																			}}
																			timezone="system"
																			showDaysOutsideCurrentMonth
																		/>
																	</LocalizationProvider>
																	<div className={s.PayText}>
																		<p>Сдача работы</p>
																	</div>
																	<CheckBox
																		size="18px"
																		checked={item.isEndWork}
																		onChange={() =>
																			changeStage(
																				index,
																				indexStage,
																				'isEndWork',
																				!item.isEndWork,
																			)
																		}
																	/>
																	<p style={{width: '33px'}}></p>
																</div>
																<Line width="317px" className={s.Line} />
															</>
														)}
													</div>
												</div>
											</>
										))}
									</>
								)}
								{stages == 1 && (
									<>
										<div className={s.TypePaymentWrapper}>
											<div
												onClick={() => {
													setTypePayment(false)
													changeStage(index, 0, 'typePayment', typePayment)
												}}
												className={s.PrevPay}>
												<p>Предоплата</p>
												<CheckBox
													checked={
														job.stages[0].typePayment === false ? true : false
													}
													size="18px"
												/>
											</div>
											<div
												onClick={() => {
													setTypePayment(true)
													changeStage(index, 0, 'typePayment', typePayment)
												}}
												className={s.NextPay}>
												<p>Постоплата</p>
												<CheckBox
													checked={
														job.stages[0].typePayment === true ? true : false
													}
													size="18px"
												/>
											</div>
										</div>
										<div className={s.PaymentTable}>
											{job.stages[0].typePayment === true ? (
												<>
													<div className={s.PaymentRow}>
														<LocalizationProvider
															dateAdapter={AdapterDateFns}
															adapterLocale={ru}>
															<DatePicker
																className={s.DatePickerPayment}
																slots={{
																	layout: StyledPickersLayout,
																}}
																sx={{
																	input: {
																		paddingTop: '0px',
																		paddingBottom: '0px',
																		paddingLeft: '0px',
																	},
																}}
																value={job.stages[0].startWorkDate}
																onChange={(newValue) => {
																	changeStage(
																		index,
																		0,
																		'startWorkDate',
																		newValue,
																	)
																}}
																timezone="system"
																showDaysOutsideCurrentMonth
															/>
														</LocalizationProvider>
														<div className={s.PayText}>
															<p>Начало работы</p>
														</div>
														<CheckBox
															size="18px"
															checked={job.stages[0].isStartWork}
															onChange={() =>
																changeStage(
																	index,
																	0,
																	'isStartWork',
																	!job.stages[0].isStartWork,
																)
															}
														/>
														<p style={{width: '33px'}}></p>
													</div>
													<Line width="317px" className={s.Line} />
													<div className={s.PaymentRow}>
														<LocalizationProvider
															dateAdapter={AdapterDateFns}
															adapterLocale={ru}>
															<DatePicker
																className={s.DatePickerPayment}
																slots={{
																	layout: StyledPickersLayout,
																}}
																sx={{
																	input: {
																		paddingTop: '0px',
																		paddingBottom: '0px',
																		paddingLeft: '0px',
																	},
																}}
																value={job.stages[0].endPaymentDate!}
																onChange={(newValue) => {
																	changeStage(
																		index,
																		0,
																		'endPaymentDate',
																		newValue,
																	)
																}}
																timezone="system"
																showDaysOutsideCurrentMonth
															/>
														</LocalizationProvider>
														<div className={s.PayInput}>
															<p>Оплата</p>
															<Input
																num
																type="text"
																value={String(job.stages[0].fisrtPaymentPrice)}
																onChange={(e) =>
																	changeStage(
																		index,
																		0,
																		'fisrtPaymentPrice',
																		Number(e.target.value),
																	)
																}
															/>
															<p>₽</p>
														</div>
														<CheckBox
															size="18px"
															checked={job.stages[0].firstPaymentPayed}
															onChange={() =>
																changeStage(
																	index,
																	0,
																	'firstPaymentPayed',
																	!job.stages[0].firstPaymentPayed,
																)
															}
														/>
														<p style={{width: '33px'}}>0%</p>
													</div>
													<Line width="317px" className={s.Line} />
													<div className={s.PaymentRow}>
														<LocalizationProvider
															dateAdapter={AdapterDateFns}
															adapterLocale={ru}>
															<DatePicker
																className={s.DatePickerPayment}
																slots={{
																	layout: StyledPickersLayout,
																}}
																sx={{
																	input: {
																		paddingTop: '0px',
																		paddingBottom: '0px',
																		paddingLeft: '0px',
																	},
																}}
																value={job.stages[0].endWorkDate}
																onChange={(newValue) => {
																	changeStage(index, 0, 'endWorkDate', newValue)
																}}
																timezone="system"
																showDaysOutsideCurrentMonth
															/>
														</LocalizationProvider>
														<div className={s.PayText}>
															<p>Сдача работы</p>
														</div>
														<CheckBox
															size="18px"
															checked={job.stages[0].isEndWork}
															onChange={() =>
																changeStage(
																	index,
																	0,
																	'isEndWork',
																	!job.stages[0].isEndWork,
																)
															}
														/>
														<p style={{width: '33px'}}></p>
													</div>
													<Line width="317px" className={s.Line} />
													<div className={s.PaymentRow}>
														<LocalizationProvider
															dateAdapter={AdapterDateFns}
															adapterLocale={ru}>
															<DatePicker
																className={s.DatePickerPayment}
																slots={{
																	layout: StyledPickersLayout,
																}}
																sx={{
																	input: {
																		paddingTop: '0px',
																		paddingBottom: '0px',
																		paddingLeft: '0px',
																	},
																}}
																value={job.stages[0].firstPaymentDate}
																onChange={(newValue) => {
																	changeStage(
																		index,
																		0,
																		'firstPaymentDate',
																		newValue,
																	)
																}}
																timezone="system"
																showDaysOutsideCurrentMonth
															/>
														</LocalizationProvider>
														<div className={s.PayInput}>
															<p>Оплата</p>
															<Input
																num
																type="text"
																value={String(job.stages[0].endPaymentPrice)}
																onChange={(e) =>
																	changeStage(
																		index,
																		0,
																		'endPaymentPrice',
																		Number(e.target.value),
																	)
																}
															/>
															<p>₽</p>
														</div>
														<CheckBox
															size="18px"
															checked={job.stages[0].endPaymentPayed}
															onChange={() =>
																changeStage(
																	index,
																	0,
																	'endPaymentPayed',
																	!job.stages[0].endPaymentPayed,
																)
															}
														/>
														<p style={{width: '33px'}}>0%</p>
													</div>
												</>
											) : (
												<>
													<div className={s.PaymentRow}>
														<LocalizationProvider
															dateAdapter={AdapterDateFns}
															adapterLocale={ru}>
															<DatePicker
																className={s.DatePickerPayment}
																slots={{
																	layout: StyledPickersLayout,
																}}
																sx={{
																	input: {
																		paddingTop: '0px',
																		paddingBottom: '0px',
																		paddingLeft: '0px',
																	},
																}}
																value={job.stages[0].firstPaymentDate}
																onChange={(newValue) => {
																	changeStage(
																		index,
																		0,
																		'firstPaymentDate',
																		newValue,
																	)
																}}
																timezone="system"
																showDaysOutsideCurrentMonth
															/>
														</LocalizationProvider>
														<div className={s.PayInput}>
															<p>Оплата</p>
															<Input
																num
																type="text"
																value={String(job.stages[0].fisrtPaymentPrice)}
																onChange={(e) =>
																	changeStage(
																		index,
																		0,
																		'fisrtPaymentPrice',
																		Number(e.target.value),
																	)
																}
															/>
															<p>₽</p>
														</div>
														<CheckBox
															size="18px"
															checked={job.stages[0].endPaymentPayed}
															onChange={() =>
																changeStage(
																	index,
																	0,
																	'endPaymentPayed',
																	!job.stages[0].endPaymentPayed,
																)
															}
														/>
														<p style={{width: '33px'}}>0%</p>
													</div>
													<Line width="317px" className={s.Line} />
													<div className={s.PaymentRow}>
														<LocalizationProvider
															dateAdapter={AdapterDateFns}
															adapterLocale={ru}>
															<DatePicker
																className={s.DatePickerPayment}
																slots={{
																	layout: StyledPickersLayout,
																}}
																sx={{
																	input: {
																		paddingTop: '0px',
																		paddingBottom: '0px',
																		paddingLeft: '0px',
																	},
																}}
																value={job.stages[0].startWorkDate}
																onChange={(newValue) => {
																	changeStage(
																		index,
																		0,
																		'startWorkDate',
																		newValue,
																	)
																}}
																timezone="system"
																showDaysOutsideCurrentMonth
															/>
														</LocalizationProvider>
														<div className={s.PayText}>
															<p>Начало работы</p>
														</div>
														<CheckBox
															size="18px"
															checked={job.stages[0].isStartWork}
															onChange={() =>
																changeStage(
																	index,
																	0,
																	'isStartWork',
																	!job.stages[0].isStartWork,
																)
															}
														/>
														<p style={{width: '33px'}}></p>
													</div>
													<Line width="317px" className={s.Line} />
													<div className={s.PaymentRow}>
														<LocalizationProvider
															dateAdapter={AdapterDateFns}
															adapterLocale={ru}>
															<DatePicker
																className={s.DatePickerPayment}
																slots={{
																	layout: StyledPickersLayout,
																}}
																sx={{
																	input: {
																		paddingTop: '0px',
																		paddingBottom: '0px',
																		paddingLeft: '0px',
																	},
																}}
																value={job.stages[0].endPaymentDate}
																onChange={(newValue) => {
																	changeStage(
																		index,
																		0,
																		'endPaymentDate',
																		newValue,
																	)
																}}
																timezone="system"
																showDaysOutsideCurrentMonth
															/>
														</LocalizationProvider>
														<div className={s.PayInput}>
															<p>Оплата</p>
															<Input
																num
																type="text"
																value={String(job.stages[0].endPaymentPrice)}
																onChange={(e) =>
																	changeStage(
																		index,
																		0,
																		'endPaymentPrice',
																		Number(e.target.value),
																	)
																}
															/>
															<p>₽</p>
														</div>
														<CheckBox
															size="18px"
															checked={job.stages[0].firstPaymentPayed}
															onChange={() =>
																changeStage(
																	index,
																	0,
																	'firstPaymentPayed',
																	!job.stages[0].firstPaymentPayed,
																)
															}
														/>
														<p style={{width: '33px'}}>0%</p>
													</div>
													<Line width="317px" className={s.Line} />
													<div className={s.PaymentRow}>
														<LocalizationProvider
															dateAdapter={AdapterDateFns}
															adapterLocale={ru}>
															<DatePicker
																className={s.DatePickerPayment}
																slots={{
																	layout: StyledPickersLayout,
																}}
																sx={{
																	input: {
																		paddingTop: '0px',
																		paddingBottom: '0px',
																		paddingLeft: '0px',
																	},
																}}
																value={job.stages[0].endWorkDate}
																onChange={(newValue) => {
																	changeStage(index, 0, 'endWorkDate', newValue)
																}}
																timezone="system"
																showDaysOutsideCurrentMonth
															/>
														</LocalizationProvider>
														<div className={s.PayText}>
															<p>Сдача работы</p>
														</div>
														<CheckBox
															size="18px"
															checked={job.stages[0].isEndWork}
															onChange={() =>
																changeStage(
																	index,
																	0,
																	'isEndWork',
																	!job.stages[0].isEndWork,
																)
															}
														/>
														<p style={{width: '33px'}}></p>
													</div>
													<Line width="317px" className={s.Line} />
												</>
											)}
										</div>
									</>
								)}
								{/* NO DATA */}

								<FileNLinks />
								<Line width="100%" className={s.Line} />

								<div className={s.StudentCard}>
									<p>Комментарий:</p>
									<textarea
										value={generalComment}
										onChange={(e) => setGeneralComment(e.target.value)}
									/>
								</div>
								<Line width="100%" className={s.Line} />

								<RecordNListen />
							</div>
						))}
					</div>
				</div>
				<div className={s.FooterWrapper}>
					<div className={s.FooterButton}>
						<div className={s.EditNSave}>
							<button className={s.Edit}>
								<p>Редактировать</p>
							</button>
							<button className={s.Save} onClick={sendInfo}>
								<p>Сохранить</p>
							</button>
						</div>
						<div className={s.ArchiveNDelete}>
							<button className={s.Archive}>
								<p>В архив</p>
							</button>
							<button className={s.Delete}>
								<p>Удалить</p>
							</button>
						</div>
					</div>
				</div>
			</div>
			{PagePopUpExit === EPagePopUpExit.Exit && (
				<div className={s.ExitPopUpWrap}>
					<ExitPopUp
						className={s.ExitPopUp}
						title="Закрыть без сохранения?"
						yes={() => {
							dispatch({
								type: 'SET_LEFT_MENU_PAGE',
								payload: ELeftMenuPage.MainPage,
							})
							dispatch({
								type: 'SET_PAGE_POPUP_EXIT',
								payload: EPagePopUpExit.None,
							})
						}}
						no={() =>
							dispatch({
								type: 'SET_PAGE_POPUP_EXIT',
								payload: EPagePopUpExit.None,
							})
						}
					/>
				</div>
			)}
		</>
	)
}

export default AddClient
