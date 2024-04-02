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

	const [jobs, setJobs] = useState([
		{
			jobName: '',
			itemName: '',
			typePayment: false, // Предоплата false - оплата true
			cost: 0,
		},
	])

	// Stage One
	const [totalCostStageOne, setTotalCostStageOne] = useState<number>()

	// Stage Two
	const [totalCostStageTwo, setTotalCostStageTwo] = useState<number>()
	const [nameStageTwo, setNameStageTwo] = useState<string>('')
	const [costStageTwo, setCostStageTwo] = useState<number>()
	const [commentStageTwo, setCommentStageTwo] = useState<string>('')

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
							onChange={(e) => setPhoneNumber(e.target.value)}
						/>
						<div className={s.PhoneIcons}></div>
					</div>
					<Line width="296px" className={s.Line} />
					<div className={s.StudentCard}>
						<p>Эл. почта:</p>
						<input
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
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
							<button className={s.btn}>
								<span>
									<Arrow direction={ArrowType.left} />
								</span>
							</button>
							{/* NO DATA */}
							<p className={s.btnText}>Работа &frac14;</p>
							<button className={s.btn}>
								<span>
									<Arrow direction={ArrowType.right} />
								</span>
							</button>
						</div>
						<button className={s.ItemPlus}>
							<img src={Plus} alt={Plus} />
						</button>
					</div>

					<Line width="296px" className={s.Line} />

					<div className={s.ItemMain}>
						<div className={s.StudentCard}>
							<p>Предмет:</p>
							<input
								type="text"
								value={itemName}
								onChange={(e) => setItemName(e.target.value)}
							/>
						</div>

						<Line width="296px" className={s.Line} />

						<div className={s.StudentCard}>
							<p>Название работы:</p>
							<input
								type="text"
								// value={workName}
								// onChange={(e) => setWorkName(e.target.value)}
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
										value={totalCostStageOne}
										onChange={(e) => setTotalCostStageOne(e.target.value)}
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
										value={totalCostStageTwo}
										onChange={(e) => setTotalCostStageTwo(e.target.value)}
									/>
									<p>₽</p>
								</div>
								<Line width="296px" className={s.Line} />
								<div className={s.StudentCard}>
									<p>Комментарий:</p>
									<textarea
										value={commentStageTwo}
										onChange={(e) => setCommentStageTwo(e.target.value)}
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
										<button className={s.btn}>
											<span>
												<Arrow direction={ArrowType.left} />
											</span>
										</button>
										{/* NO DATA */}
										<p className={s.btnText}>Этапы &frac14;</p>
										<button className={s.btn}>
											<span>
												<Arrow direction={ArrowType.right} />
											</span>
										</button>
									</div>
									<button className={s.ItemPlus}>
										<img src={Plus} alt={Plus} />
									</button>
								</div>
								<div className={s.StudentCard}>
									<p>Название:</p>
									<input
										type="text"
										value={nameStageTwo}
										onChange={(e) => setNameStageTwo(e.target.value)}
									/>
								</div>
								<Line width="296px" className={s.Line} />
								<div className={s.StudentCard}>
									<p>Стоимость этапа:</p>
									<Input
										style={{borderBottom: '1px solid #e2e2e9'}}
										num
										type="text"
										value={costStageTwo}
										onChange={(e) => setCostStageTwo(e.target.value)}
									/>
									<p>₽</p>
								</div>
								<Line width="296px" className={s.Line} />
							</>
						)}
						{/* NO DATA */}
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
				</div>
			</div>
			<div className={s.FooterWrapper}>
				<div className={s.FooterButton}>
					<div className={s.EditNSave}>
						<button className={s.Edit}>
							<p>Редактировать</p>
						</button>
						<button className={s.Save}>
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
