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
import {Option, Select, SelectOption} from '@mui/base'
import uploadFile from '../../assets/UploadFile.svg'
import NowLevel from '../NowLevel'
import CheckBox from '../CheckBox'
import Arrow, {ArrowType} from '../../assets/arrow'
import {useSelector} from 'react-redux'
import {useEffect, useState} from 'react'
import socket from '../../socket'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
interface IDayClientPopUp {
	name?: string
	date?: string
	item?: string
	totalPrice?: string

	style?: React.CSSProperties
	onExit?: () => void
}
const DayClientPopUp = ({
	name,
	date,
	item,
	totalPrice,

	style,
	onExit,
}: IDayClientPopUp) => {
	return (
		<div style={style} className={s.wrapper}>
			<div className={s.Header}>
				<p>{name}</p>
				<p>{date}</p>
				<button onClick={onExit}>
					<CloseIcon className={s.closeIcon} />
				</button>
			</div>
			<Line width="691px" className={s.LineHeader} />
			<div className={s.Main}>
				<img width={'50px'} height={'50px'} src={Client} alt="Client" />
				<div className={s.info}>
					<h1>{item}</h1>
					<div className={s.HeaderInfo}>
						<p>Общая стоимость {totalPrice} ₽</p>
						<p>Предоплата</p>
					</div>
					<div className={s.LineInfo}>
						<p>12.12.2022</p>
						<p>Оплата</p>
						<p>3000 ₽</p>
						<CheckBox className={s.Checkbox} size={'20px'} />
						<p>%</p>
					</div>
					<Line width="100%" className={s.Line} />
					<div className={s.LineInfo}>
						<p>12.12.2022</p>
						<p>Заказ принят</p>
						<p>3000 ₽</p>
						<CheckBox className={s.Checkbox} size={'20px'} />
						<p>%</p>
					</div>
					<Line width="100%" className={s.Line} />
					<div className={s.LineInfo}>
						<p>12.12.2022</p>
						<p>Оплата</p>
						<p>3000 ₽</p>
						<CheckBox className={s.Checkbox} size={'20px'} />
						<p>%</p>
					</div>
					<Line width="100%" className={s.Line} />
				</div>
			</div>
			{/* <div className={s.buttons}>
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
			</div> */}
		</div>
	)
}

export default DayClientPopUp
