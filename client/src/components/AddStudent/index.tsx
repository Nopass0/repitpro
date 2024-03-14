import s from './index.module.scss'
import * as mui from '@mui/material'
import {styled} from '@mui/material/styles'
import Line from '../Line'
import Search from '../../assets/search'
import {useState} from 'react'
import Arrow, {ArrowType} from '../../assets/arrow'
import microSVG from '../../assets/Microphone1.svg'
import Listen from '../../assets/Listen.svg'
import Plus from '../../assets/ItemPlus.svg'
import InActive from '../../assets/InActiveCheckboxIcon.svg'
import CheckBox from '../CheckBox'
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

	return (
		<div className={s.wrapper}>
			<div className={s.wrapperMenu}>
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
				<div className={s.StudentInput}>
					<div className={s.StudentCard}>
						<p>Имя:</p>
						<input
							type="text"
							value={nameStudent}
							onChange={(e) => setNameStudent(e.target.value)}
						/>
					</div>

					<Line width="296px" className={s.Line} />

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
							<div className={s.LineWrap}>
								<Line className={s.Line} width="30px" />
							</div>
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

					</div>
				</div>
			</div>
		</div>
	)
}

export default AddStudent
