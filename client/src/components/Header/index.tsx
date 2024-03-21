import {OptionGroup, SelectOption, Option} from '@mui/base'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import * as mui from '@mui/material'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import logo from '../../assets/logo.png'
import Eye from '../../assets/eye'
import Doc from '../../assets/doc'
import DataSlidePicker from '../DataSlidePicker'
import Exit from '../../assets/exit'
import {Link, useNavigate} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {useState} from 'react'
import {ELeftMenuPage} from '../../types'

interface IHeader {}

const Header = ({}: IHeader) => {
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const currentMonth = useSelector((state: any) => state.currentMonth) // new Date().getMonth()
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)

	const handleLogout = () => {
		dispatch({type: 'LOGOUT'})
		navigate('/login')
	}

	return (
		<header className={s.header}>
			<div className={s.wrapperHeader}>
				<div className={s.HeaderLeft}>
					<div className={s.logoContainer}>
						<img
							src={logo}
							alt="logo"
							width={36}
							height={36}
							className={s.logo}
						/>
						<h1 className={s.title}>КАБИНЕТ РЕПЕТИТОРА</h1>
					</div>

					<mui.Select
						className={s.muiSelect__menu}
						renderValue={(option: SelectOption<number> | null) => {
							return (
								<div className={s.selectContainer}>
									<p className={s.selectText}>Добавить</p>
								</div>
							)
						}}
						variant={'standard'}
						// @ts-ignore
						defaultValue={1}
						// value={valueMuiSelectArchive}
					>
						<mui.MenuItem
							onClick={() => {
								dispatch({
									type: 'SET_LEFT_MENU_PAGE',
									payload: ELeftMenuPage.AddStudent,
								})
							}}
							value={1}>
							Ученика
						</mui.MenuItem>
						<mui.MenuItem
							onClick={() => {
								dispatch({
									type: 'SET_LEFT_MENU_PAGE',
									payload: ELeftMenuPage.AddGroup,
								})
							}}
							value={2}>
							Группу
						</mui.MenuItem>
						<mui.MenuItem
							onClick={() => {
								dispatch({
									type: 'SET_LEFT_MENU_PAGE',
									payload: ELeftMenuPage.AddClient,
								})
							}}
							value={3}>
							Заказчика
						</mui.MenuItem>
					</mui.Select>

					<div className={s.calendarBtns}>
						<button className={s.hideBtn + ' ' + s.HiddenBtn}>
							<p className={s.btnText}>Скрыть</p>
							<p className={s.rub}>₽</p>
							{/* <Eye className={s.eye} /> */}
						</button>

						<button className={s.hideBtn + ' ' + s.DetailsBtn}>
							<p className={s.btnText}>Подробно</p>

							<Doc className={s.eye} />
						</button>
					</div>
				</div>

				<DataSlidePicker className={s.dataSlidePicker} dateMode />

				<div className={s.Buttons}>
					<Link
						to={'/statistics'}
						className={s.greenBtn + ' ' + s.rightlyLastBtns}>
						<p className={s.btnText}>Статистика</p>
					</Link>
					<Link to={'/'} className={s.greenBtn}>
						<p
							onClick={() => {
								dispatch({
									type: 'SET_LEFT_MENU_PAGE',
									payload: ELeftMenuPage.MyCabinet,
								})
							}}
							className={s.btnText}>
							Личный кабинет
						</p>
					</Link>

					<button onClick={handleLogout} className={s.exitBtn}>
						<p className={s.btnText}>Выход</p>
						<Exit />
					</button>
				</div>
			</div>
		</header>
	)
}

export default Header
