import s from './index.module.scss'
import * as mui from '@mui/material'
import {styled} from '@mui/material/styles'
import Line from '../Line'
import {useEffect, useState} from 'react'
import Arrow, {ArrowType} from '../../assets/arrow'
import Plus from '../../assets/ItemPlus.svg'
import CheckBox from '../CheckBox'
import InputMask from 'react-input-mask'
import './index.css'
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
import TextAreaInputBlock from '../TextAreaInputBlock'
import MiniCalendar from '../MiniCalendar'
import {TailSpin} from 'react-loader-spinner'
interface IAddClient {}

const AddClient = ({}: IAddClient) => {
	const dispatch = useDispatch()
	const editedCards = useSelector((state: any) => state.editedCards)
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
	const [typePayment, setTypePayment] = useState<boolean>(false) // Баланс
	const [generalComment, setGeneralComment] = useState<string>('')

	const [currentJobIndex, setCurrentJobIndex] = useState<number>(0)
	const [currentStageIndex, setCurrentStageIndex] = useState<number>(0)

	const [pagePopUpExitInside, setPagePopUpExitInside] = useState<number>(0)
	const navigate = useNavigate()
	const [files, setFiles] = useState<any>([])

	const [audios, setAudios] = useState<any>([])

	const [loading, setLoading] = useState<boolean>(false)

	const handleAddAudio = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		setAudios([...audios, {file, name, type, size}])
	}

	const user = useSelector((state: any) => state.user)
	const token = user?.token

	const [links, setLinks] = useState<string[]>([])

	const handleLinksSubmit = (linksCallback: string[]) => {
		setLinks(linksCallback)
	}

	useEffect(() => {
		socket.emit('getLinksByLinkedId', {
			linkedId: currentOpenedClient,
			token: token,
		})
		socket.once('getLinksByLinkedId', (data: any) => {
			setLinks(data.links)
		})
	}, [])

	const deleteLink = (link: string, index: number) => {
		socket.emit('deleteLink', {
			linkedId: currentOpenedClient,
			token: token,
		})
		socket.once('deleteLink', (data: any) => {
			setLinks(links.filter((item) => item !== link))
		})
	}

	const handleAddFile = (
		file: any,
		name: string,
		type: string,
		size: number,
	) => {
		console.log(
			'\n-----------client-files------------------\n',
			file,
			name,
			type,
			size,
			'\n------------\n',
		)
		setFiles([...files, {file, name, type, size}])
	}

	const [jobs, setJobs] = useState([
		{
			jobName: '',
			itemName: '',
			cost: 0,
			stages: [
				{
					totalCost: 0,
					name: '',
					typePayment: false, // Баланс false - оплата true

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
		if (
			jobs[currentJobIndex].itemName !== '' &&
			currentJobIndex === jobs.length - 1
		) {
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
							typePayment: false, // Баланс false - оплата true
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
			setCurrentJobIndex(currentJobIndex + 1)
		}
	}

	const changeJob = (index: number, name: string, value: any) => {
		setJobs(jobs.map((job, i) => (i === index ? {...job, [name]: value} : job)))
	}

	const changeStage = (jobIndex, stageIndex, name, value) => {
		setJobs(
			jobs.map((job, i) =>
				i === jobIndex
					? {
							...job,
							stages: job.stages.map((stage, j) => {
								if (j === stageIndex) {
									const updatedStage = {...stage, [name]: value}
									// Если изменилась стоимость этапа, обновляем общую стоимость
									if (name === 'cost') {
										const totalCost = job.stages.reduce(
											(sum, s, idx) =>
												sum +
												(idx === stageIndex
													? Number(value)
													: Number(s.cost) || 0),
											0,
										)
										updatedStage.totalCost = totalCost
										// Обновляем totalCost для всех этапов
										job.stages.forEach((s) => (s.totalCost = totalCost))
									}
									return updatedStage
								}
								return stage
							}),
						}
					: job,
			),
		)
	}

	const addStage = (jobIndex) => {
		if (
			jobs[jobIndex].stages[currentStageIndex].name !== '' &&
			currentStageIndex === jobs[jobIndex].stages.length - 1
		) {
			setJobs(
				jobs.map((job, i) =>
					i === jobIndex
						? {
								...job,
								stages: [
									...job.stages,
									{
										totalCost: job.stages.reduce(
											(sum, stage) => sum + (Number(stage.cost) || 0),
											0,
										),
										name: '',
										typePayment: false, // Баланс false - оплата true
										dateStart: new Date(Date.now()),
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
			setCurrentStageIndex(currentStageIndex + 1)
		}
	}

	const sendInfo = () => {
		setLoading(true)
		if (currentOpenedClient !== '') {
			socket.emit('updateClient', {
				id: currentOpenedClient,
				nameStudent: nameStudent,
				phoneNumber: phoneNumber,
				email: email,
				costStudent: costStudent,
				commentClient: commentClient,
				jobs: jobs,
				files: files,
				token: token,
				audios: audios,
			})
			socket.emit('createLink', {
				tag: 'addClient',
				linkedId: currentOpenedClient,
				links: links,
				token: token,
			})
		} else {
			socket.emit('addClient', {
				nameStudent: nameStudent,
				phoneNumber: phoneNumber,
				email: email,
				costStudent: costStudent,
				commentClient: commentClient,
				jobs: jobs,
				files: files,
				token: token,
				audios: audios,
			})
			socket.emit('createLink', {
				tag: 'addClient',
				linkedId: currentOpenedClient,
				links: links,
				token: token,
			})
		}

		window.location.reload()
		// setLoading(false)
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

	const [data, setData] = useState<any>(null)
	const [allIdsClient, setAllIdsClient] = useState<string[]>([])
	const currentOpenedClient = useSelector(
		(state: any) => state.currentOpenedClient,
	)
	const [currentClientPosition, setCurrentClientPosition] = useState<number>(0)
	const [isEditMode, setIsEditMode] = useState(
		currentOpenedClient ? true : false,
	)
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
			setFiles(data.files)
			setcommentClient(data.commentClient)
			setAudios(data.audios)
		})
	}, [])

	useEffect(() => {
		if (data) {
			setJobs(data.jobs)
			setNameStudent(data.nameStudent)
			setPhoneNumber(data.phoneNumber)
			setEmail(data.email)
			setCostStudent(data.costStudent)
			setFiles(data.files)
			setcommentClient(data.commentClient)
			setAudios(data.audios)

			if (data.jobs[currentJobIndex].stages.length > 1) {
				setStages(2)
			} else {
				setStages(1)
			}
		}
	}, [data])

	const nextClient = () => {
		if (!editedCards) {
			if (Number(currentClientPosition) < allIdsClient.length - 1) {
				setCurrentClientPosition(Number(currentClientPosition) + 1)
				const newId = allIdsClient[Number(currentClientPosition) + 1]

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
					setAudios(data.audios)
				})
			}
		} else {
			setPagePopUpExitInside(1)
		}
	}

	const prevClient = () => {
		if (!editedCards) {
			if (Number(currentClientPosition) > 0) {
				setCurrentClientPosition(Number(currentClientPosition) - 1)
				const newId = allIdsClient[Number(currentClientPosition) - 1]

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
					setAudios(data.audios)
				})
			}

			setIsEditMode(true)
		} else {
			setPagePopUpExitInside(2)
		}
	}

	const handleDelete = () => {
		socket.emit('deleteClient', {
			token: token,
			id: currentOpenedClient,
		})
		window.location.reload()
	}
	const addStudentExit = useSelector((state: any) => state.addStudentExit)
	const addGroupExit = useSelector((state: any) => state.addGroupExit)
	const addClientExit = useSelector((state: any) => state.addClientExit)
	const handleAddStudentExit = () => {
		console.log('addStudent')
		dispatch({
			type: 'SET_CURRENT_OPENED_STUDENT',
			payload: '',
		})

		dispatch({
			type: 'SET_LEFT_MENU_PAGE',
			payload: ELeftMenuPage.MainPage,
		})
		socket.emit('getGroupByStudentId', {
			token: token,
			studentId: '',
		})
		dispatch({
			type: 'SET_PAGE_POPUP_EXIT',
			payload: EPagePopUpExit.None,
		})
		dispatch({
			type: 'SET_ADD_STUDENT_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_GROUP_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_CLIENT_EXIT',
			payload: false,
		})
		setTimeout(() => {
			dispatch({
				type: 'SET_LEFT_MENU_PAGE',
				payload: ELeftMenuPage.AddStudent,
			})
		}, 10)
	}

	const handleAddGroupExit = () => {
		console.log('addGroup')
		dispatch({
			type: 'SET_CURRENT_OPENED_GROUP',
			payload: '',
		})
		socket.emit('getGroupById', {token: token, groupId: ''})
		dispatch({
			type: 'SET_LEFT_MENU_PAGE',
			payload: ELeftMenuPage.MainPage,
		})
		dispatch({
			type: 'SET_PAGE_POPUP_EXIT',
			payload: EPagePopUpExit.None,
		})
		dispatch({
			type: 'SET_ADD_STUDENT_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_GROUP_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_CLIENT_EXIT',
			payload: false,
		})
		setTimeout(() => {
			dispatch({
				type: 'SET_LEFT_MENU_PAGE',
				payload: ELeftMenuPage.AddGroup,
			})
		}, 10)
	}

	const handleAddClientExit = () => {
		console.log('addClient')
		dispatch({
			type: 'SET_CURRENT_OPENED_CLIENT',
			payload: '',
		})
		socket.emit('getClientById', {token: token, clientId: ''})
		dispatch({
			type: 'SET_LEFT_MENU_PAGE',
			payload: ELeftMenuPage.MainPage,
		})
		dispatch({
			type: 'SET_PAGE_POPUP_EXIT',
			payload: EPagePopUpExit.None,
		})
		dispatch({
			type: 'SET_ADD_STUDENT_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_GROUP_EXIT',
			payload: false,
		})
		dispatch({
			type: 'SET_ADD_CLIENT_EXIT',
			payload: false,
		})
		setTimeout(() => {
			dispatch({
				type: 'SET_LEFT_MENU_PAGE',
				payload: ELeftMenuPage.AddClient,
			})
		}, 10)
	}
	const handleToArchive = () => {
		socket.emit('clientToArhive', {
			token: token,
			id: currentOpenedClient,
			isArchived: true,
		})
		window.location.reload()
	}

	useEffect(() => {
		console.log(jobs, jobs[0].stages, '<Job stages>')
	}, [jobs])

	useEffect(() => {
		if (currentOpenedClient === '') {
			if (
				nameStudent !== '' ||
				phoneNumber !== '' ||
				email !== '' ||
				costStudent !== '' ||
				commentClient !== '' ||
				jobs.some((job) => {
					return (
						job.jobName !== '' ||
						job.itemName !== '' ||
						job.cost !== 0 ||
						job.stages.some((stage) => {
							return (
								stage.totalCost !== 0 ||
								stage.name !== '' ||
								stage.typePayment !== false ||
								stage.cost !== 0 ||
								stage.prePay !== true ||
								stage.postPay !== false ||
								stage.endPaymentPrice !== 0 ||
								stage.firstPaymentPayed !== false ||
								stage.isStartWork !== false ||
								stage.fisrtPaymentPrice !== 0 ||
								stage.endPaymentPayed !== false ||
								stage.isEndWork !== false ||
								stage.payment !== 0 ||
								stage.payed !== false ||
								stage.workStarted !== false
							)
						})
					)
				})
			) {
				dispatch({type: 'SET_EDITED_CARDS', payload: true})
			}
		}
	}, [nameStudent, phoneNumber, email, costStudent, commentClient, jobs])
	useEffect(() => {
		setTimeout(() => {
			dispatch({type: 'SET_EDITED_CARDS', payload: false})
		}, 1000)
	}, [])
	return (
		<>
			<button
				onClick={() => {
					if (editedCards) {
						dispatch({
							type: 'SET_PAGE_POPUP_EXIT',
							payload: EPagePopUpExit.Exit,
						})
					} else {
						dispatch({
							type: 'SET_LEFT_MENU_PAGE',
							payload: ELeftMenuPage.MainPage,
						})
					}
				}}
				className={s.CloseButton}>
				<CloseIcon className={s.CloseIcon} />
			</button>
			<div className={s.wrapper}>
				{!loading ? (
					<>
						<div className={s.Header}>
							<div className={s.HeaderAddClient}>
								<div className={s.dataSlidePicker}>
									<button
										className={s.btn}
										style={{
											backgroundColor: currentClientPosition === 0 && '#eee',
										}}
										onClick={prevClient}>
										<span>
											<Arrow direction={ArrowType.left} />
										</span>
									</button>
									<p className={s.btnText}>
										Карточка заказчика{' '}
										{currentOpenedClient
											? `${currentClientPosition + 1}/
								${allIdsClient.length}`
											: `${allIdsClient.length + 1} / ${allIdsClient.length + 1}`}
									</p>
									<button
										className={s.btn}
										style={{
											backgroundColor:
												currentClientPosition === allIdsClient.length - 1 &&
												'#eee',
										}}
										onClick={nextClient}>
										<span>
											<Arrow direction={ArrowType.right} />
										</span>
									</button>
								</div>
							</div>
							<div className={s.StudNameHead}>
								<div className={s.StudentCardName}>
									<TextAreaInputBlock
										title="Имя:"
										disabled={isEditMode}
										value={nameStudent}
										onChange={(e) =>
											setNameStudent(
												e.target.value.charAt(0).toUpperCase() +
													e.target.value.slice(1).toLowerCase(),
											)
										}
										textIndent="40px"
									/>
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
										disabled={isEditMode}
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
										disabled={isEditMode}
										type="email"
										value={email}
										onChange={(e: any) => setEmail(e.target.value)}
									/>
								</div>
								<Line width="100%" className={s.Line} />

								<div className={s.StudentCard}>
									<p>Расходы по заказчику:</p>
									<input
										disabled={isEditMode}
										width={`${costStudent.length}ch`}
										type="text"
										value={costStudent}
										onChange={(e) => setCostStudent(e.target.value)}
										style={{borderBottom: '1px solid #e2e2e9'}}
									/>
									<p>₽</p>
								</div>

								<Line width="100%" className={s.Line} />
								<TextAreaInputBlock
									disabled={isEditMode}
									title="Комментарий:"
									value={commentClient}
									// disabled={isEditMode}
									onChange={(e) => {
										setcommentClient(e.target.value)
									}}
									textIndent="120px"
								/>
							</div>
							<Line width="100%" className={s.Line} />

							<RecordNListen
								alreadyRecorded={audios}
								callback={handleAddAudio}
								typeCard="client"
							/>

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
										<TextAreaInputBlock
											title="Предмет:"
											disabled={isEditMode}
											value={job.itemName}
											onChange={(e) => {
												changeJob(
													index,
													'itemName',
													e.target.value.charAt(0).toUpperCase() +
														e.target.value.slice(1).toLowerCase(),
												)
											}}
											textIndent="75px"
										/>
										<Line width="100%" className={s.Line} />

										<TextAreaInputBlock
											title="Название работы:"
											disabled={isEditMode}
											value={job.jobName}
											onChange={(e) => {
												changeJob(
													index,
													'jobName',
													e.target.value.charAt(0).toUpperCase() +
														e.target.value.slice(1).toLowerCase(),
												)
											}}
											textIndent="140px"
										/>
										<Line width="100%" className={s.Line} />
										<div className={s.StudentCard}>
											<mui.Select
												// disabled={isEditMode}
												variant={'standard'}
												// defaultValue={1}
												value={stages}
												onChange={(e) => {
													setStages(Number(e.target.value))
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
														disabled={isEditMode}
														width={`${String(job.stages[0].totalCost).length}ch`}
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
														disabled={isEditMode}
														width={`${String(job.stages[0].totalCost).length}ch`}
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

												<RecordNListen
													typeCard="client"
													alreadyRecorded={audios}
													callback={handleAddAudio}
												/>
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
															Этапы {currentStageIndex + 1} /{' '}
															{job.stages.length}
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
															<TextAreaInputBlock
																title="Название:"
																disabled={isEditMode}
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
																textIndent="80px"
															/>
															<Line width="100%" className={s.Line} />
															<div className={s.StudentCard}>
																<p>Стоимость этапа:</p>
																<Input
																	disabled={isEditMode}
																	style={{borderBottom: '1px solid #e2e2e9'}}
																	num
																	type="text"
																	value={item.cost || ''}
																	width={`${String(item.cost).length}ch`}
																	onChange={(e) => {
																		changeStage(
																			index,
																			indexStage,
																			'cost',
																			Number(e.target.value),
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
																	<p>Баланс</p>
																	<CheckBox
																		disabled={isEditMode}
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
																		disabled={isEditMode}
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
																			<MiniCalendar
																				disabled={isEditMode}
																				value={item.startWorkDate}
																				onChange={(newDate) =>
																					changeStage(
																						index,
																						indexStage,
																						'startWorkDate',
																						new Date(newDate),
																					)
																				}
																				calendarId="startWorkDate"
																			/>
																			<div className={s.PayText}>
																				<p>Начало работы</p>
																			</div>
																			<CheckBox
																				disabled={isEditMode}
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
																			<MiniCalendar
																				disabled={isEditMode}
																				value={item.firstPaymentDate}
																				onChange={(newDate) =>
																					changeStage(
																						index,
																						indexStage,
																						'firstPaymentDate',
																						new Date(newDate),
																					)
																				}
																			/>
																			<div className={s.PayInput}>
																				<p>Оплата</p>
																				<Input
																					disabled={isEditMode}
																					num
																					type="text"
																					value={String(
																						item.fisrtPaymentPrice!,
																					)}
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
																				disabled={isEditMode}
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
																			<p
																				style={{
																					width: '33px',
																					overflow: 'hidden',
																					whiteSpace: 'nowrap',
																				}}>
																				{item.fisrtPaymentPrice &&
																				item.cost &&
																				String(item.cost) !== '0'
																					? Math.round(
																							(item.fisrtPaymentPrice /
																								item.cost) *
																								100,
																						)
																					: '0'}
																				%
																			</p>
																		</div>
																		<Line width="317px" className={s.Line} />
																		<div className={s.PaymentRow}>
																			<MiniCalendar
																				disabled={isEditMode}
																				value={item.endWorkDate}
																				onChange={(newDate) =>
																					changeStage(
																						index,
																						indexStage,
																						'endWorkDate',
																						new Date(newDate),
																					)
																				}
																			/>
																			<div className={s.PayText}>
																				<p>Сдача работы</p>
																			</div>
																			<CheckBox
																				disabled={isEditMode}
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
																			<MiniCalendar
																				disabled={isEditMode}
																				value={item.endPaymentDate}
																				onChange={(newDate) =>
																					changeStage(
																						index,
																						indexStage,
																						'endPaymentDate',
																						new Date(newDate),
																					)
																				}
																				calendarId="endPaymentDate"
																			/>
																			<div className={s.PayInput}>
																				<p>Оплата</p>
																				<Input
																					disabled={isEditMode}
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
																				disabled={isEditMode}
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
																			<p
																				style={{
																					width: '33px',
																					overflow: 'hidden',
																					whiteSpace: 'nowrap',
																				}}>
																				{item.endPaymentPrice &&
																				item.cost &&
																				String(item.cost) !== '0'
																					? Math.round(
																							(item.endPaymentPrice /
																								item.cost) *
																								100,
																						)
																					: '0'}
																				%
																			</p>
																		</div>

																		<Line width="317px" className={s.Line} />
																		<div className={s.PaymentRow}>
																			<p
																				style={{
																					color:
																						item.fisrtPaymentPrice +
																							item.endPaymentPrice >=
																							item.cost &&
																						item.firstPaymentPayed &&
																						item.endPaymentPayed
																							? '#25c25c'
																							: '#4e4e4e',
																				}}>
																				Этап оплачен полностью
																			</p>
																		</div>
																	</>
																) : (
																	<>
																		<div className={s.PaymentRow}>
																			<MiniCalendar
																				disabled={isEditMode}
																				value={item.firstPaymentDate}
																				onChange={(newDate) =>
																					changeStage(
																						index,
																						indexStage,
																						'firstPaymentDate',
																						new Date(newDate),
																					)
																				}
																				calendarId="firstPaymentDate"
																			/>
																			<div className={s.PayInput}>
																				<p>Оплата</p>
																				<Input
																					disabled={isEditMode}
																					num
																					type="text"
																					value={String(
																						item.fisrtPaymentPrice!,
																					)}
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
																				disabled={isEditMode}
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
																			<p
																				style={{
																					width: '33px',
																					overflow: 'hidden',
																					whiteSpace: 'nowrap',
																				}}>
																				{item.fisrtPaymentPrice &&
																				item.cost &&
																				String(item.cost) !== '0'
																					? Math.round(
																							(item.fisrtPaymentPrice /
																								item.cost) *
																								100,
																						)
																					: '0'}
																				%
																			</p>
																		</div>
																		<Line width="317px" className={s.Line} />
																		<div className={s.PaymentRow}>
																			<MiniCalendar
																				disabled={isEditMode}
																				value={item.startWorkDate!}
																				onChange={(newDate) =>
																					changeStage(
																						index,
																						indexStage,
																						'startWorkDate',
																						new Date(newDate),
																					)
																				}
																				calendarId="startWorkDate"
																			/>
																			<div className={s.PayText}>
																				<p>Начало работы</p>
																			</div>
																			<CheckBox
																				disabled={isEditMode}
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
																			<MiniCalendar
																				disabled={isEditMode}
																				value={item.endPaymentDate!}
																				onChange={(newDate) =>
																					changeStage(
																						index,
																						indexStage,
																						'endPaymentDate',
																						new Date(newDate),
																					)
																				}
																				calendarId="endPaymentDate"
																			/>
																			<div className={s.PayInput}>
																				<p>Оплата</p>
																				<Input
																					disabled={isEditMode}
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
																				disabled={isEditMode}
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
																			<p
																				style={{
																					width: '33px',
																					overflow: 'hidden',
																					whiteSpace: 'nowrap',
																				}}>
																				{item.endPaymentPrice &&
																				item.cost &&
																				String(item.cost) !== '0'
																					? Math.round(
																							(item.endPaymentPrice /
																								item.cost) *
																								100,
																						)
																					: '0'}
																				%
																			</p>
																		</div>
																		<Line width="317px" className={s.Line} />
																		<div className={s.PaymentRow}>
																			<MiniCalendar
																				disabled={isEditMode}
																				value={job.stages[0].endWorkDate}
																				onChange={(newValue) => {
																					changeStage(
																						index,
																						indexStage,
																						'endWorkDate',
																						new Date(newValue),
																					)
																				}}
																				calendarId="endWorkDate"
																			/>
																			<div className={s.PayText}>
																				<p>Сдача работы</p>
																			</div>
																			<CheckBox
																				disabled={isEditMode}
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
																		{item.fisrtPaymentPrice +
																			item.endPaymentPrice >=
																			item.cost && (
																			<>
																				<Line
																					width="317px"
																					className={s.Line}
																				/>
																				<div className={s.PaymentRow}>
																					<p
																						style={{
																							color:
																								item.fisrtPaymentPrice +
																									item.endPaymentPrice >=
																									item.cost &&
																								item.firstPaymentPayed &&
																								item.endPaymentPayed
																									? '#25c25c'
																									: '#4e4e4e',
																						}}>
																						Этап оплачен полностью
																					</p>
																				</div>
																			</>
																		)}
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
														<p>Баланс</p>
														<CheckBox
															disabled={isEditMode}
															checked={
																job.stages[0].typePayment === false
																	? true
																	: false
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
															disabled={isEditMode}
															checked={
																job.stages[0].typePayment === true
																	? true
																	: false
															}
															size="18px"
														/>
													</div>
												</div>
												<div className={s.PaymentTable}>
													{job.stages[0].typePayment === true ? (
														<>
															<div className={s.PaymentRow}>
																<MiniCalendar
																	disabled={isEditMode}
																	value={job.stages[0].startWorkDate}
																	onChange={(newValue) => {
																		changeStage(
																			index,
																			0,
																			'startWorkDate',
																			new Date(newValue),
																		)
																	}}
																	calendarId="startWorkDate"
																/>
																<div className={s.PayText}>
																	<p>Начало работы</p>
																</div>
																<CheckBox
																	disabled={isEditMode}
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
																<MiniCalendar
																	disabled={isEditMode}
																	value={job.stages[0].firstPaymentDate}
																	onChange={(newValue) => {
																		changeStage(
																			index,
																			0,
																			'firstPaymentDate',
																			new Date(newValue),
																		)
																	}}
																	calendarId="firstPaymentDate"
																/>
																<div className={s.PayInput}>
																	<p>Оплата</p>
																	<Input
																		disabled={isEditMode}
																		width={`${
																			String(job.stages[0].fisrtPaymentPrice)
																				.length
																		}ch`}
																		num
																		type="text"
																		value={String(
																			job.stages[0].fisrtPaymentPrice,
																		)}
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
																	disabled={isEditMode}
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
																<p
																	style={{
																		width: '33px',
																		overflow: 'hidden',
																		whiteSpace: 'nowrap',
																	}}>
																	{job.stages[0].fisrtPaymentPrice &&
																	job.stages[0].totalCost &&
																	String(job.stages[0].totalCost) !== '0'
																		? Math.round(
																				(job.stages[0].fisrtPaymentPrice /
																					job.stages[0].totalCost) *
																					100,
																			)
																		: '0'}
																	%
																</p>
															</div>
															<Line width="317px" className={s.Line} />
															<div className={s.PaymentRow}>
																<MiniCalendar
																	disabled={isEditMode}
																	value={job.stages[0].endWorkDate}
																	onChange={(newValue) => {
																		changeStage(
																			index,
																			0,
																			'endWorkDate',
																			new Date(newValue),
																		)
																	}}
																	calendarId="endWorkDate"
																/>
																<div className={s.PayText}>
																	<p>Сдача работы</p>
																</div>
																<CheckBox
																	disabled={isEditMode}
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
																<MiniCalendar
																	disabled={isEditMode}
																	value={job.stages[0].endPaymentDate}
																	onChange={(newValue) => {
																		changeStage(
																			index,
																			0,
																			'endPaymentDate',
																			new Date(newValue),
																		)
																	}}
																	calendarId="endPaymentDate"
																/>
																<div className={s.PayInput}>
																	<p>Оплата</p>
																	<Input
																		disabled={isEditMode}
																		width={`${
																			String(job.stages[0].endPaymentPrice)
																				.length
																		}ch`}
																		num
																		type="text"
																		value={`${String(
																			job.stages[0].endPaymentPrice,
																		)}`}
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
																	disabled={isEditMode}
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
																<p
																	style={{
																		width: '33px',
																		overflow: 'hidden',
																		whiteSpace: 'nowrap',
																	}}>
																	{job.stages[0].endPaymentPrice &&
																	job.stages[0].totalCost &&
																	String(job.stages[0].totalCost) !== '0'
																		? Math.round(
																				(job.stages[0].endPaymentPrice /
																					job.stages[0].totalCost) *
																					100,
																			)
																		: '0'}
																	%
																</p>
															</div>

															<Line width="317px" className={s.Line} />
															<div className={` ${s.PaymentRow}}`}>
																<p
																	style={{
																		color:
																			job.stages[0].fisrtPaymentPrice +
																				job.stages[0].endPaymentPrice >=
																			job.stages[0].totalCost
																				? '#25c25c'
																				: '#FF0000',
																	}}>
																	Работа оплачена полностью
																</p>
															</div>
														</>
													) : (
														<>
															<div className={s.PaymentRow}>
																<MiniCalendar
																	disabled={isEditMode}
																	value={job.stages[0].firstPaymentDate}
																	onChange={(newValue) => {
																		changeStage(
																			index,
																			0,
																			'firstPaymentDate',
																			new Date(newValue),
																		)
																	}}
																	calendarId="firstPaymentDate"
																/>
																<div className={s.PayInput}>
																	<p>Оплата</p>
																	<Input
																		disabled={isEditMode}
																		num
																		type="text"
																		value={String(
																			job.stages[0].fisrtPaymentPrice,
																		)}
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
																	disabled={isEditMode}
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
																<p
																	style={{
																		width: '33px',
																		overflow: 'hidden',
																		whiteSpace: 'nowrap',
																	}}>
																	{job.stages[0].fisrtPaymentPrice &&
																	job.stages[0].totalCost &&
																	String(job.stages[0].totalCost) !== '0'
																		? Math.round(
																				(job.stages[0].fisrtPaymentPrice /
																					job.stages[0].totalCost) *
																					100,
																			)
																		: '0'}
																	%
																</p>
															</div>
															<Line width="317px" className={s.Line} />
															<div className={s.PaymentRow}>
																<MiniCalendar
																	disabled={isEditMode}
																	value={job.stages[0].startWorkDate}
																	onChange={(newValue) => {
																		changeStage(
																			index,
																			0,
																			'startWorkDate',
																			new Date(newValue),
																		)
																	}}
																	calendarId="startWorkDate"
																/>
																<div className={s.PayText}>
																	<p>Начало работы</p>
																</div>
																<CheckBox
																	disabled={isEditMode}
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
																<MiniCalendar
																	disabled={isEditMode}
																	value={job.stages[0].endPaymentDate}
																	onChange={(newValue) => {
																		changeStage(
																			index,
																			0,
																			'endPaymentDate',
																			new Date(newValue),
																		)
																	}}
																	calendarId="endPaymentDate"
																/>
																<div className={s.PayInput}>
																	<p>Оплата</p>
																	<Input
																		disabled={isEditMode}
																		num
																		type="text"
																		value={String(
																			job.stages[0].endPaymentPrice,
																		)}
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
																	disabled={isEditMode}
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
																<p
																	style={{
																		width: '33px',
																		overflow: 'hidden',
																		whiteSpace: 'nowrap',
																	}}>
																	{job.stages[0].endPaymentPrice &&
																	job.stages[0].totalCost &&
																	String(job.stages[0].totalCost) !== '0'
																		? Math.round(
																				(job.stages[0].endPaymentPrice /
																					job.stages[0].totalCost) *
																					100,
																			)
																		: '0'}
																	%
																</p>
															</div>
															<Line width="317px" className={s.Line} />
															<div className={s.PaymentRow}>
																<MiniCalendar
																	disabled={isEditMode}
																	value={job.stages[0].endWorkDate}
																	onChange={(newValue) => {
																		changeStage(
																			index,
																			0,
																			'endWorkDate',
																			new Date(newValue),
																		)
																	}}
																	calendarId="endWorkDate"
																/>
																<div className={s.PayText}>
																	<p>Сдача работы</p>
																</div>
																<CheckBox
																	disabled={isEditMode}
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
																<p
																	style={{
																		color:
																			job.stages[0].fisrtPaymentPrice +
																				job.stages[0].endPaymentPrice >=
																				job.stages[0].totalCost &&
																			job.stages[0].firstPaymentPayed &&
																			job.stages[0].endPaymentPayed
																				? 'green'
																				: '#eee',
																	}}>
																	Работа оплачена полностью
																</p>
															</div>
														</>
													)}
												</div>
											</>
										)}
										{/* NO DATA */}

										<FileNLinks
											alreadyUploaded={files}
											callback={handleAddFile}
											linksArray={links}
											submitLinks={handleLinksSubmit}
											deleteLink={deleteLink}
										/>
										<Line width="100%" className={s.Line} />
										<TextAreaInputBlock
											disabled={isEditMode}
											title="Комментарий:"
											value={generalComment}
											// disabled={isEditMode}
											onChange={(e) => {
												setGeneralComment(e.target.value)
											}}
											textIndent="120px"
										/>

										<Line width="100%" className={s.Line} />

										{/* <RecordNListen /> */}
									</div>
								))}
							</div>
						</div>
						<div className={s.FooterWrapper}>
							<div className={s.FooterButton}>
								<div className={s.EditNSave}>
									<button
										disabled={currentOpenedClient === ''}
										className={`${s.Edit} ${isEditMode ? s.Save : ''}`}
										onClick={() => {
											setIsEditMode(!isEditMode)
											dispatch({type: 'SET_EDITED_CARDS', payload: true})
										}}>
										<p>Редактировать</p>
									</button>
									<button
										className={!isEditMode ? s.Save : s.SaveWhite}
										onClick={sendInfo}>
										<p>Сохранить</p>
									</button>
								</div>
								<div className={s.ArchiveNDelete}>
									<button
										disabled={currentOpenedClient === ''}
										onClick={handleToArchive}
										className={s.Archive}>
										<p>В архив</p>
									</button>
									<button
										disabled={currentOpenedClient === ''}
										onClick={handleDelete}
										className={s.Delete}>
										<p>Удалить</p>
									</button>
								</div>
							</div>
						</div>
					</>
				) : (
					<>
						<div className={s.Spin}>
							<TailSpin
								visible={true}
								height="80"
								width="80"
								color="#4fa94d"
								ariaLabel="tail-spin-loading"
								radius="1"
								wrapperStyle={{}}
								wrapperClass=""
							/>
						</div>
					</>
				)}
			</div>
			{PagePopUpExit === EPagePopUpExit.Exit && (
				<div className={s.ExitPopUpWrap}>
					<ExitPopUp
						className={s.ExitPopUp}
						title="Закрыть без сохранения?"
						yes={() => {
							if (addStudentExit) {
								console.log('if addStud')
								handleAddStudentExit()
							}
							if (addGroupExit) {
								console.log('if addGroup')
								handleAddGroupExit()
							}
							if (addClientExit) {
								console.log('if addClient')
								handleAddClientExit()
							}
							if (!addStudentExit && !addGroupExit && !addClientExit) {
								console.log('not if')
								dispatch({type: 'SET_EDITED_CARDS', payload: false})
								dispatch({
									type: 'SET_LEFT_MENU_PAGE',
									payload: ELeftMenuPage.MainPage,
								})
								dispatch({
									type: 'SET_PAGE_POPUP_EXIT',
									payload: EPagePopUpExit.None,
								})
								navigate('../')
							}
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
			{pagePopUpExitInside > 0 && (
				<div className={s.ExitPopUpWrap}>
					<ExitPopUp
						className={s.ExitPopUp}
						title="Закрыть без сохранения?"
						yes={() => {
							if (pagePopUpExitInside === 1) {
								dispatch({type: 'SET_EDITED_CARDS', payload: false})
								setPagePopUpExitInside(0)
								if (Number(currentClientPosition) < allIdsClient.length - 1) {
									setCurrentClientPosition(Number(currentClientPosition) + 1)
									const newId = allIdsClient[Number(currentClientPosition) + 1]

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
										setAudios(data.audios)
									})
									setIsEditMode(true)
								}
							}
							if (pagePopUpExitInside === 2) {
								dispatch({type: 'SET_EDITED_CARDS', payload: false})
								setPagePopUpExitInside(0)
								if (Number(currentClientPosition) > 0) {
									setCurrentClientPosition(Number(currentClientPosition) - 1)
									const newId = allIdsClient[Number(currentClientPosition) - 1]

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
										setAudios(data.audios)
									})

									setIsEditMode(true)
								}
							}
						}}
						no={() => setPagePopUpExitInside(0)}
					/>
				</div>
			)}
		</>
	)
}

export default AddClient
