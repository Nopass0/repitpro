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
interface IDayCalendarPopUp {
	style?: React.CSSProperties
	onExit?: () => void
	iconClick?: () => void
	LineClick?: () => void
}
const DayCalendarPopUp = ({
	style,
	onExit,
	iconClick,
	LineClick,
}: IDayCalendarPopUp) => {
	return (
		<div style={style} className={s.wrapper}>
			<header className={s.Header}>
				<div className={s.HeaderItems}>
					<DataSlidePicker className={s.dataSlidePicker} dateMode />
					<button onClick={onExit}>
						<CloseIcon className={s.closeIcon} />
					</button>
				</div>
			</header>
			<Line width="700px" className={s.LineHeader} />
			<section className={s.MainBlock}>
				<DayCalendarLine
					LineClick={LineClick}
					iconClick={iconClick}
					icon={GroupOnline}
					timeStart="12:00"
					timeEnd="13:00"
					name="Константинова Александра"
					item="Русский языка"
					price="2000000"
				/>

				<Line className={s.Line} width="700px" />
				<DayCalendarLine
					icon={GroupOnline}
					timeStart="12:00"
					timeEnd="13:00"
					name="Константинова Александра"
					item="Русский языка"
					price="2000000"
				/>

				<Line className={s.Line} width="700px" />
				<DayCalendarLine
					icon={GroupOnline}
					timeStart="12:00"
					timeEnd="13:00"
					name="Константинова Александра"
					item="Русский языка"
					price="2000000"
				/>

				<Line className={s.Line} width="700px" />
				<DayCalendarLine
					icon={GroupOnline}
					timeStart="12:00"
					timeEnd="13:00"
					name="Константинова Александра"
					item="Русский языка"
					price="2000000"
				/>

				<Line className={s.Line} width="700px" />
				<DayCalendarLine
					icon={GroupOnline}
					timeStart="12:00"
					timeEnd="13:00"
					name="Константинова Александра"
					item="Русский языка"
					price="2000000"
				/>

				<Line className={s.Line} width="700px" />
				<DayCalendarLine
					icon={GroupOnline}
					timeStart="12:00"
					timeEnd="13:00"
					name="Константинова Александра"
					item="Русский языка"
					price="2000000"
				/>

				<Line className={s.Line} width="700px" />
				<DayCalendarLine
					icon={GroupOnline}
					timeStart="12:00"
					timeEnd="13:00"
					name="Константинова Александра"
					item="Русский языка"
					price="2000000"
				/>

				<Line className={s.Line} width="700px" />
			</section>
			<section className={s.ThreeBtnWrapper}>
				<button className={`${s.EditBtn} ${s.active}`}>Редактировать</button>
				<button className={`${s.SaveBtn}`}>Сохранить</button>
				<button className={s.PlusBtn}>
					<img src={Plus} alt={Plus} />
				</button>
			</section>
			<footer className={s.Footer}>
				<div className={s.Left}>
					<div className={s.Lessons}>
						<p>
							Занятий: <b>1</b>
						</p>
						<b>2 000 ₽</b>
					</div>
					<div className={s.works}>
						<p>
							Работ: <b>1</b>
						</p>
						<b>2 000 ₽</b>
					</div>
				</div>
				<div className={s.income}>
					<p>
						Доход: <b>2 000 ₽</b>
					</p>
				</div>
			</footer>
		</div>
	)
}

export default DayCalendarPopUp
