import s from './index.module.scss'
import * as mui from '@mui/material'
import {styled} from '@mui/material/styles'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Line from '../Line'
import Search from '../../assets/search'
import {useState} from 'react'
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
import {useSelector} from 'react-redux'
interface IAddClient {}

const AddClient = ({}: IAddClient) => {
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

	const [currentJobIndex, setCurrentJobIndex] = useState(0)
	const [currentStageIndex, setCurrentStageIndex] = useState(0)

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
					paymentDate: null, // Изначально установлено null, чтобы пользователь мог ввести дату
					startDate: null, // Изначально установлено null, чтобы пользователь мог ввести дату
				},
			],
		},
	])

	const addJob = () => {
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
						paymentDate: null,
						startDate: null,
					},
				],
			},
		])
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
									typePayment: false,
									paymentDate: null,
									startDate: null,
								},
							],
					  }
					: job,
			),
		)
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
	return (
		<div className={s.wrapper}>
			<div className={s.Header}>
				<div className={s.HeaderAddClient}>
					<div className={s.dataSlidePicker}>
						<button className={s.btn}>
							<span>
								<Arrow direction={ArrowType.left} />
							</span>
						</button>
						<p className={s.btnText}>Карточка заказчика &frac14;</p>
						<button className={s.btn}>
							<span>
								<Arrow direction={ArrowType.right} />
							</span>
						</button>
					</div>
				</div>
				<div className={s.StudNameHead}>
					<div className={s.StudentCardName}>
						<p>Имя:</p>
						<input
							type="text"
							value={nameStudent}
							onChange={(e) => setNameStudent(e.target.value)}
						/>
						<p>*</p>
					</div>

					{/* <Line width="296px" className={s.Line} /> */}
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
						<div className={s.PhoneIcons}></div>
					</div>
					<Line width="296px" className={s.Line} />
					<div className={s.StudentCard}>
						<p>Эл. почта:</p>
						<input
							type="email"
							value={email}
							onChange={(e: any) => setEmail(e.target.value)}
						/>
					</div>
					<Line width="296px" className={s.Line} />

					<div className={s.StudentCard}>
						<p>Расходы по ученику:</p>
						<input
							type="text"
							value={costStudent}
							onChange={(e) => setCostStudent(e.target.value)}
						/>
						<p>₽</p>
					</div>

					<Line width="296px" className={s.Line} />

					<div className={s.StudentCard}>
						<p>Комментарий:</p>
						<textarea
							value={commentClient}
							onChange={(e) => setcommentClient(e.target.value)}
						/>
					</div>
				</div>
				<Line width="296px" className={s.Line} />

				<div className={s.RecordNListen}>
					<button className={s.Record}>
						<p>Аудио</p>
						<img src={microSVG} alt={microSVG} />
					</button>
					<button className={s.Listen}>
						<p>Прослушать</p>
						<img src={Listen} alt={Listen} />
					</button>
				</div>

				<div className={s.ItemWrapper}>
					<div className={s.ItemHeader}>
						<div className={s.dataSlidePicker}>
							<button
								className={s.btn}
								onClick={() => setCurrentJobIndex(currentJobIndex - 1)}>
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
								onClick={() => setCurrentJobIndex(currentJobIndex + 1)}>
								<span>
									<Arrow direction={ArrowType.right} />
								</span>
							</button>
						</div>
						<button className={s.ItemPlus} onClick={addJob}>
							<img src={Plus} alt={Plus} />
						</button>
					</div>

					<Line width="296px" className={s.Line} />

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
										changeJob(index, 'itemName', e.target.value)
									}}
								/>
							</div>

							<Line width="296px" className={s.Line} />

							<div className={s.StudentCard}>
								<p>Название работы:</p>
								<input
									type="text"
									value={job.jobName}
									onChange={(e) => {
										changeJob(index, 'jobName', e.target.value)
									}}
								/>
							</div>

							<Line width="296px" className={s.Line} />
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

							<Line width="296px" className={s.Line} />

							{stages === 1 && (
								<>
									<div className={s.StudentCard}>
										<p>Общая стоимость работы:</p>
										<Input
											num
											type="text"
											value={job.stages[0].totalCost}
											onChange={(e) => {
												changeStage(index, 0, 'totalCost', e.target.value)
											}}
										/>
										<p>₽</p>
									</div>

									<Line width="296px" className={s.Line} />
								</>
							)}
							{stages === 2 && (
								<>
									<div className={s.StudentCard}>
										<p>Общая стоимость работы:</p>
										<Input
											num
											type="text"
											value={job.cost}
											onChange={(e) => {
												changeStage(index, 0, 'cost', e.target.value)
											}}
										/>
										<p>₽</p>
									</div>
									<Line width="296px" className={s.Line} />
									<div className={s.StudentCard}>
										<p>Комментарий:</p>
										<textarea
											value={commentStageTwo}
											onChange={(e) =>
												changeStage(index, 0, 'comment', e.target.value)
											}
										/>
									</div>
									<Line width="296px" className={s.Line} />

									<div className={s.RecordNListen}>
										<button className={s.Record}>
											<p>Аудио</p>
											<img src={microSVG} alt={microSVG} />
										</button>
										<button className={s.Listen}>
											<p>Прослушать</p>
											<img src={Listen} alt={Listen} />
										</button>
									</div>
									<div className={s.ItemHeader}>
										<div className={s.dataSlidePicker}>
											<button
												className={s.btn}
												onClick={() =>
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
									{job.stages.map((item, index) => (
										<>
											<div
												className={
													currentStageIndex === index
														? s.ItemActive_
														: s.ItemMain_
												}>
												<p>Название:</p>
												<input
													type="text"
													value={item.name}
													onChange={(e) => {
														changeJob(
															index,
															'stages.' + index + '.name',
															e.target.value,
														)
													}}
												/>
											</div>
											<Line width="296px" className={s.Line} />
											<div className={s.StudentCard}>
												<p>Стоимость этапа:</p>
												<Input
													style={{borderBottom: '1px solid #e2e2e9'}}
													num
													type="text"
													value={item.totalCost}
													onChange={(e) => {
														changeJob(
															index,
															'stages.' + index + '.totalCost',
															e.target.value,
														)
													}}
												/>
												<p>₽</p>
											</div>
											<Line width="296px" className={s.Line} />
											<div className={s.TypePaymentWrapper}>
												<div className={s.PrevPay}>
													<p>Предоплата</p>
													<CheckBox size="18px" />
												</div>
												<div className={s.NextPay}>
													<p>Постоплата</p>
													<CheckBox size="18px" />
												</div>
											</div>
											<div className={s.PaymentTable}>
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
															timezone="system"
															showDaysOutsideCurrentMonth
														/>
													</LocalizationProvider>
													<div className={s.PayInput}>
														<p>Оплата</p>
														<Input num type="text" />
														<p>₽</p>
													</div>
													<CheckBox size="18px" />
													<p style={{width: '33px'}}>0%</p>
												</div>
												<Line width="268px" className={s.Line} />
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
															timezone="system"
															showDaysOutsideCurrentMonth
														/>
													</LocalizationProvider>
													<div className={s.PayText}>
														<p>Начало работы</p>
													</div>
													<CheckBox size="18px" />
													<p style={{width: '33px'}}></p>
												</div>
												<Line width="268px" className={s.Line} />
											</div>
										</>
									))}
									<></>
								</>
							)}
							{stages == 1 && (
								<>
									<div className={s.TypePaymentWrapper}>
										<div
											onClick={() => {
												setTypePayment(false)
												changeJob(0, 'stages.0.typePayment', typePayment)
											}}
											className={s.PrevPay}>
											<p>Предоплата</p>
											<CheckBox
												checked={typePayment === false ? true : false}
												size="18px"
											/>
										</div>
										<div
											onClick={() => {
												setTypePayment(true)
												changeJob(0, 'stages.0.typePayment', typePayment)
											}}
											className={s.NextPay}>
											<p>Постоплата</p>
											<CheckBox
												checked={typePayment === true ? true : false}
												size="18px"
											/>
										</div>
									</div>
									<div
										className={s.PaymentTable}
										style={
											typePayment === true
												? {flexDirection: 'column-reverse'}
												: undefined
										}>
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
													value={job.stages[0].paymentDate}
													onChange={(newValue) => {
														changeJob(0, 'stages.0.paymentDate', newValue)
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
													value={job.stages[0].paymentDate}
													onChange={(e) =>
														changeJob(0, 'stages.0.payment', e.target.value)
													}
												/>
												<p>₽</p>
											</div>
											<CheckBox size="18px" />
											<p style={{width: '33px'}}>0%</p>
										</div>
										<Line width="268px" className={s.Line} />
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
													timezone="system"
													showDaysOutsideCurrentMonth
												/>
											</LocalizationProvider>
											<div className={s.PayText}>
												<p>Начало работы</p>
											</div>
											<CheckBox size="18px" />
											<p style={{width: '33px'}}></p>
										</div>
										<Line width="268px" className={s.Line} />
									</div>
								</>
							)}
							{/* NO DATA */}

							<mui.ListItemButton
								style={{marginTop: '10px'}}
								onClick={handleClick}>
								<img src={uploadFile} alt={uploadFile} />
								<mui.ListItemText primary="Файлы/ссылки" />
								{open ? <ExpandLess /> : <ExpandMore />}
							</mui.ListItemButton>

							<mui.Collapse in={open} timeout="auto" unmountOnExit>
								<mui.List
									style={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										flexDirection: 'column',
									}}
									component="div"
									disablePadding>
									<Line width="296px" className={s.Line} />
									<p>Список пока пуст</p>
								</mui.List>
							</mui.Collapse>
							<Line width="296px" className={s.Line} />

							<div className={s.StudentCard}>
								<p>Комментарий:</p>
								<textarea
									value={generalComment}
									onChange={(e) => setGeneralComment(e.target.value)}
								/>
							</div>
							<Line width="296px" className={s.Line} />
							<div className={s.RecordNListen}>
								<button className={s.Record}>
									<p>Аудио</p>
									<img src={microSVG} alt={microSVG} />
								</button>
								<button className={s.Listen}>
									<p>Прослушать</p>
									<img src={Listen} alt={Listen} />
								</button>
							</div>
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
	)
}

export default AddClient
