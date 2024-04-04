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
import {MenuItem, Select} from '@mui/material'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import CheckBox from '../CheckBox'
import Arrow, {ArrowType} from '../../assets/arrow'
interface IDayStudentPopUp {
	icon?: any
	name?: string
	address?: string
	date?: string
	time?: string
	style?: React.CSSProperties
	onExit?: () => void
}
const DayStudentPopUp = ({
	icon,
	name,
	address,
	date,
	time,
	style,
	onExit
}: IDayStudentPopUp) => {
	return (
		<div style={style} className={s.wrapper}>
			<div className={s.InfoBlock}>
				<div className={s.Header}>
					<div className={s.MainHeader}>
						<div className={s.IconHeader}>
							<img src={icon} alt="icon" />
							<p>{name}</p>
						</div>
						<div className={s.Devider}></div>
						<div className={s.AddressHeader}>
							<p>Адрес:</p>
							<p>{address}</p>
						</div>
						<div className={s.Devider}></div>
						<div className={s.DateHeader}>
							<p>{date}</p>
							<p>{time}</p>
						</div>
					</div>
				</div>
				<div className={s.MainBlock}>
					<div className={s.HomeWorkWrapper}>
						<h1>Домашняя работа</h1>
						<textarea
							className={s.TextArea}
							placeholder="Задания, комментарий"
						/>
						<div className={s.MediaBlock}>
							<RecordNListen />
							<input type="file" id="inputFile1" className={s.InputFile} />
							<label htmlFor="inputFile1" className={s.LabelFile}>
								<img src={uploadFile} alt="uploadFile" />
							</label>
							<Select renderValue={() => ''} className={s.Select}>
								<MenuItem value={0}>Список пока пуст</MenuItem>
							</Select>
						</div>
						<h1>Выполнение домашней работы</h1>
						<NowLevel />
					</div>
					<div className={s.Devider}></div>
					<div className={s.LessonWrapper}>
						<h1>Занятие</h1>
						<textarea className={s.TextArea} placeholder="Комментарий" />
						<div className={s.MediaBlock}>
							<RecordNListen />
							<input type="file" id="inputFile1" className={s.InputFile} />
							<label htmlFor="inputFile1" className={s.LabelFile}>
								<img src={uploadFile} alt="uploadFile" />
							</label>
							<Select renderValue={() => ''} className={s.Select}>
								<MenuItem value={0}>Список пока пуст</MenuItem>
							</Select>
						</div>
						<h1>Работа на занятии</h1>
						<NowLevel />
						<div className={s.PrePay}>
							<p>0 ₽</p>
							<CheckBox size="16px" />
						</div>
					</div>
				</div>
			</div>
			<div className={s.buttons}>
				<button onClick={onExit}>
					<CloseIcon className={s.closeIcon} />
				</button>
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
			</div>
		</div>
	)
}

export default DayStudentPopUp
