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
import {DatePicker} from '@mui/x-date-pickers/DatePicker'
import CreateIcon from '@mui/icons-material/Create'
import './index.css'
import {ru} from 'date-fns/locale/ru'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3'
import ScheduleDate from '../ScheduleDate/index'
import ScheduleIcon from '@mui/icons-material/Schedule'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
interface IAddStudent {}

const AddStudent = ({}: IAddStudent) => {
	// Block Student
	const [nameStudent, setNameStudent] = useState<string>('')
	const [contactFace, setContactFace] = useState<string>('')
	const [phoneNumber, setPhoneNumber] = useState<string>('')
	const [email, setEmail] = useState<string>('')
	const [address, setAddress] = useState<string>('')
	const [linkStudent, setLinkStudent] = useState<string>('')
	const [costStudent, setCostStudent] = useState<string>('')
	const [commentStudent, setCommentStudent] = useState<string>('')
	const [prePayCost, setPrePayCost] = useState<string>('')
	const [prePayDate, setPrePayDate] = useState<string>('')
	const [selectedDate, setSelectedDate] = useState(null)
	const [storyLesson, setStoryLesson] = useState<string>('')
	const [costOneLesson, setCostOneLesson] = useState<string>('')
	// Block item
	const [itemName, setItemName] = useState<string>('')
	const [tryLessonCheck, setTryLessonCheck] = useState<boolean>(false)
	const [tryLessonCost, setTryLessonCost] = useState<string>('')

	const [todayProgramStudent, setTodayProgramStudent] = useState<string>('')
	const [targetLesson, setTargetLesson] = useState<string>('')
	const [programLesson, setProgramLesson] = useState<string>('')
	const [typeLesson, setTypeLesson] = useState<string>('')
	const [placeLesson, setPlaceLesson] = useState<string>('')
	const [timeLesson, setTimeLesson] = useState<string>('')
	const [startLesson, setStartLesson] = useState<string>('')
	const [endLesson, setEndLesson] = useState<string>('')

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
				<div className={s.HeaderAddStudent}>
					<div className={s.dataSlidePicker}>
						<button className={s.btn}>
							<span>
								<Arrow direction={ArrowType.left} />
							</span>
						</button>
						<p className={s.btnText}>Карточка ученика &frac14;</p>
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
					<div className={s.HeaderAddStudFixed}></div>

					<div className={s.StudentCard}>
						<p>Контактное лицо:</p>
						<input
							type="text"
							value={contactFace}
							onChange={(e) => setContactFace(e.target.value)}
						/>
					</div>

					<Line width="296px" className={s.Line} />

					<div className={s.StudentCard}>
						<p>Тел:</p>
						<input
							type="text"
							value={phoneNumber}
							onChange={(e) => setPhoneNumber(e.target.value)}
							placeholder="+7 (___) ___-__"
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
						<p>Адрес:</p>
						<input
							type="text"
							value={address}
							onChange={(e) => setAddress(e.target.value)}
						/>
					</div>
					<Line width="296px" className={s.Line} />
					<div className={s.StudentCard}>
						<p>Источник:</p>
						<input
							type="text"
							value={linkStudent}
							onChange={(e) => setLinkStudent(e.target.value)}
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
						<p>Предоплата:</p>
						<LocalizationProvider
							dateAdapter={AdapterDateFns}
							adapterLocale={ru}>
							<DatePicker
								slots={{
									layout: StyledPickersLayout,
								}}
								timezone="system"
								showDaysOutsideCurrentMonth
							/>
						</LocalizationProvider>

						<input
							className={s.PrePayCostInput}
							type="text"
							value={prePayCost}
							onChange={(e) => setPrePayCost(e.target.value)}
						/>

						<p>₽</p>
					</div>

					<Line width="296px" className={s.Line} />

					<mui.ListItemButton onClick={handleClick}>
						<mui.ListItemText primary="История занятий и оплат" />
						{open ? <ExpandLess /> : <ExpandMore />}
					</mui.ListItemButton>

					<mui.Collapse
						className={s.MuiCollapse}
						in={open}
						timeout="auto"
						unmountOnExit>
						<mui.List className={s.MuiList} component="div" disablePadding>
							<div className={s.ListObjectWrapper}>
								<div className={s.ListObject}>
									<p
										style={{
											fontWeight: '500',
											fontSize: '14px',
											marginRight: '5px',
										}}>
										12.03.2024
									</p>
									<p style={{fontWeight: '300', fontSize: '12px'}}>Занятия</p>
									<CheckBox size="16px" />
									<p style={{marginLeft: '55px', fontSize: '14px'}}>0₽</p>
									<CheckBox size="16px" />
									<button className={s.ButtonEdit}>
										<CreateIcon style={{width: '18px', height: '18px'}} />
									</button>
								</div>
								<div className={s.ListObject}>
									<p
										style={{
											fontWeight: '500',
											fontSize: '14px',
											marginRight: '5px',
										}}>
										12.03.2024
									</p>
									<p style={{fontWeight: '300', fontSize: '12px'}}>Занятия</p>
									<CheckBox size="16px" />
									<p style={{marginLeft: '55px', fontSize: '14px'}}>0₽</p>
									<CheckBox size="16px" />
									<button className={s.ButtonEdit}>
										<CreateIcon style={{width: '18px', height: '18px'}} />
									</button>
								</div>
							</div>
						</mui.List>
					</mui.Collapse>

					<Line width="296px" className={s.Line} />
					<div className={s.StudentCard}>
						<p>Стоимость одного занятия:</p>
						<input
							type="text"
							value={costOneLesson}
							onChange={(e) => setCostOneLesson(e.target.value)}
						/>
						<p>₽</p>
					</div>
					<Line width="296px" className={s.Line} />

					<div className={s.StudentCard}>
						<p>Комментарий:</p>
						<textarea
							value={commentStudent}
							onChange={(e) => setCommentStudent(e.target.value)}
						/>
					</div>
					<Line width="296px" className={s.Line} />
				</div>

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
							<p className={s.btnText}>Предмет &frac14;</p>
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
							<input
								type="text"
								value={itemName}
								onChange={(e) => setItemName(e.target.value)}
								placeholder="Наименование"
							/>
						</div>

						<Line width="296px" className={s.Line} />

						<div className={s.StudentCardCheckBox}>
							<div className={s.CardCheckBox}>
								<p>Пробное занятие:</p>
							</div>
							<CheckBox className={s.CheckBox} size="20px" />
							<p>Стоимость:</p>
							<input
								type="text"
								value={tryLessonCost}
								onChange={(e) => setTryLessonCost(e.target.value)}
							/>
							<p>₽</p>
						</div>

						<Line width="296px" className={s.Line} />
						{/* Level */}

						<div className={s.StudentCard}>
							<p>Текущая программа ученика:</p>
							<input
								type="text"
								value={todayProgramStudent}
								onChange={(e) => setTodayProgramStudent(e.target.value)}
							/>
						</div>

						<Line width="296px" className={s.Line} />

						<div className={s.StudentCard}>
							<p>Цель занятий:</p>
							<input
								type="text"
								value={targetLesson}
								onChange={(e) => setTargetLesson(e.target.value)}
							/>
						</div>

						<Line width="296px" className={s.Line} />
						<div className={s.StudentCard}>
							<p>Программа ученика:</p>
							<input
								type="text"
								value={programLesson}
								onChange={(e) => setProgramLesson(e.target.value)}
							/>
						</div>

						<Line width="296px" className={s.Line} />

						{/* Type */}

						<div className={s.StudentCard}>
							<p>Место проведения:</p>
							<input
								type="text"
								value={placeLesson}
								onChange={(e) => setPlaceLesson(e.target.value)}
							/>
						</div>

						<Line width="296px" className={s.Line} />

						<div className={s.StudentCard}>
							<p>Продолжительность занятия:</p>
							<input
								type="text"
								value={timeLesson}
								onChange={(e) => setTimeLesson(e.target.value)}
							/>
							<p>мин</p>
						</div>

						<Line width="296px" className={s.Line} />

						<div className={s.StudentCard}>
							<p>Начало занятий:</p>
						</div>

						<Line width="296px" className={s.Line} />
						<div style={{marginBottom: '10px'}} className={s.StudentCard}>
							<p>Окончание занятий:</p>
						</div>

						<div className={s.ScheduleWrapper}>
							<div className={s.ScheduleHeader}>
								<p>Расписание</p>
							</div>
							<Line width="295px" className={s.LineGreen} />
							<div className={s.Schedule}>
								<div className={s.ScheduleItem}>
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											alignItems: 'center',
										}}>
										<ScheduleDate>
											<p>Пн</p>
										</ScheduleDate>
										<p style={{marginLeft: '10px', fontWeight: '400'}}>
											18:30 - 19:30
										</p>
									</div>
									<button className={s.ScheduleBtn}>
										<ScheduleIcon />
									</button>
								</div>
								<Line width="294px" className={s.Line} />

								<div className={s.ScheduleItem}>
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											alignItems: 'center',
										}}>
										<ScheduleDate>
											<p>Вт</p>
										</ScheduleDate>
										<p style={{marginLeft: '10px', fontWeight: '400'}}>
											18:30 - 19:30
										</p>
									</div>
									<button className={s.ScheduleBtn}>
										<ScheduleIcon />
									</button>
								</div>
								<Line width="294px" className={s.Line} />

								<div className={s.ScheduleItem}>
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											alignItems: 'center',
										}}>
										<ScheduleDate>
											<p>Ср</p>
										</ScheduleDate>
										<p style={{marginLeft: '10px', fontWeight: '400'}}>
											18:30 - 19:30
										</p>
									</div>
									<button className={s.ScheduleBtn}>
										<ScheduleIcon />
									</button>
								</div>
								<Line width="294px" className={s.Line} />

								<div className={s.ScheduleItem}>
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											alignItems: 'center',
										}}>
										<ScheduleDate>
											<p>Чт</p>
										</ScheduleDate>
										<p style={{marginLeft: '10px', fontWeight: '400'}}>
											18:30 - 19:30
										</p>
									</div>
									<button className={s.ScheduleBtn}>
										<ScheduleIcon />
									</button>
								</div>
								<Line width="294px" className={s.Line} />

								<div className={s.ScheduleItem}>
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											alignItems: 'center',
										}}>
										<ScheduleDate active>
											<p>Пт</p>
										</ScheduleDate>
										<p style={{marginLeft: '10px', fontWeight: '400'}}>
											18:30 - 19:30
										</p>
									</div>
									<button className={s.ScheduleBtn}>
										<ScheduleIcon />
									</button>
								</div>
								<Line width="294px" className={s.Line} />

								<div className={s.ScheduleItem}>
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											alignItems: 'center',
										}}>
										<ScheduleDate weekend>
											<p>Сб</p>
										</ScheduleDate>
										<p style={{marginLeft: '10px', fontWeight: '400'}}>
											18:30 - 19:30
										</p>
									</div>
									<button className={s.ScheduleBtn}>
										<ScheduleIcon />
									</button>
								</div>
								<Line width="294px" className={s.Line} />
								<div className={s.ScheduleItem}>
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											alignItems: 'center',
										}}>
										<ScheduleDate weekend>
											<p>Вс</p>
										</ScheduleDate>
										<p style={{marginLeft: '10px', fontWeight: '400'}}>
											18:30 - 19:30
										</p>
									</div>
									<button className={s.ScheduleBtn}>
										<ScheduleIcon />
									</button>
								</div>
							</div>
						</div>

						<div className={s.MathBlock}>
							<div className={s.MathObjectsList}>
								<div className={s.MathObject}>
									<p>Всего занятий: 0</p>
									<p>Сумма: 0₽</p>
								</div>
								<Line width="294px" className={s.Line} />
								<div className={s.MathObject}>
									<p>Прошло: 0</p>
									<p>Оплачено: 0 (0₽)</p>
								</div>
								<Line width="294px" className={s.Line} />
								<div className={s.MathObject}>
									<p>Не оплачено: 0</p>
									<p style={{display: 'flex', flexDirection: 'row'}}>
										<p style={{marginRight: '5px'}}>Долг:</p>
										<p style={{color: 'red'}}>0</p>
										<p>₽</p>
									</p>
								</div>
							</div>
						</div>
						<mui.ListItemButton
							style={{marginTop: '10px'}}
							onClick={handleClick}>
							<FileDownloadIcon style={{marginRight: '10px'}} />
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
						<div className={s.FooterSpace}></div>
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

export default AddStudent
