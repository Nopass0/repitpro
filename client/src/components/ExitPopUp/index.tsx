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
interface IExitPopUp {
	title?: string
	yes?: () => void
	no?: () => void
	style?: React.CSSProperties
	className?: string
}
const ExitPopUp = ({title, yes, no, style, className}: IExitPopUp) => {
	return (
		<div style={style} className={`${s.wrapper} ${className}`}>
			<h1>{title}</h1>
			<div className={s.btn}>
				<button onClick={no} className={s.No}>
					Нет
				</button>
				<button onClick={yes} className={s.Yes}>
					Да
				</button>
			</div>
		</div>
	)
}

export default ExitPopUp
