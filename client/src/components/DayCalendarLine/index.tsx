import s from './index.module.scss'
import Line from '../Line'
import DataSlidePicker from '../DataSlidePicker'
import CloseIcon from '@mui/icons-material/Close'
import CheckBox from '../CheckBox/index'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
interface IDayCalendarLine {
	// Base
	icon: any
	timeStart: string
	timeEnd: string
	name: string
	item: string
	price: string
	prevpay?: boolean
	iconClick?: () => void
	LineClick?: () => void
}
const DayCalendarLine = ({
	icon,
	timeStart,
	timeEnd,
	name,
	item,
	price,
	prevpay,
	iconClick,
	LineClick,
}: IDayCalendarLine) => {
	return (
		<>
			<div className={s.wrapper}>
				<button onClick={iconClick} className={s.Icon}>
					<img src={icon} alt={icon} />
				</button>
				<div onClick={LineClick} className={s.ClickWrapper}>
					<div className={s.Time}>
						<p>
							{timeStart}-{timeEnd}
						</p>
					</div>
					<div className={s.Name}>
						<p title={name}>
							{name.length > 24 ? name.slice(0, 24) + '...' : name}
						</p>
					</div>
					<div className={s.Item}>
						<p title={item}>
							{item.length > 13 ? item.slice(0, 13) + '...' : item}
						</p>
					</div>
					<div className={s.Price}>
						<p title={price}>
							{price.length > 5 ? price.slice(0, 5) + '>' : price} ₽
						</p>
					</div>
				</div>
				<CheckBox checked={prevpay} className={s.Checkbox} size="20px" />
				<button className={s.BtnDelete}>
					<DeleteOutlineIcon />
				</button>
			</div>
		</>
	)
}

export default DayCalendarLine
