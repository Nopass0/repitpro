import {OptionGroup, SelectOption, Option} from '@mui/base'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import * as mui from '@mui/material'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import logo from '../../assets/Logo.svg'
import Eye from '../../assets/eye'
import Doc from '../../assets/doc'
import DataSlidePicker from '../DataSlidePicker'
import Exit from '../../assets/exit'
import {Link, useNavigate} from 'react-router-dom'
import {useDispatch, useSelector} from 'react-redux'
import {useState} from 'react'
import {ELeftMenuPage, EPagePopUpExit} from '../../types'
import mobileLogo from '../../assets/mobileLogo.svg'
import {slide as Menu} from 'react-burger-menu'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import AddIcon from '@mui/icons-material/Add'
import MenuIcon from '@mui/icons-material/Menu'
import {WindowSharp} from '@mui/icons-material'
interface IHeader {}

const Header = ({}: IHeader) => {
	const navigate = useNavigate()
	const dispatch = useDispatch()
	const currentMonth = useSelector((state: any) => state.currentMonth) // new Date().getMonth()
	const hiddenNum = useSelector((state: any) => state.hiddenNum)
	const details = useSelector((state: any) => state.details)
	const pagePopUpExit = useSelector((state: any) => state.pagePopUpExit)
	const EleftMenu = useSelector((state: any) => state.leftMenu)
	const [isDropdownOpen, setIsDropdownOpen] = useState(false)

	const handleLogout = () => {
		dispatch({type: 'LOGOUT'})
		navigate('/login')
	}
	const mobileLeftSelector = useSelector((state: any) => state.mobileLeft)

	return (
		<header className={s.header}>
			<div className={s.wrapperHeader}>
				<div className={s.HeaderLeft}>
					<button
						className={s.LogoWrapper}
						onClick={() => {
							if (
								ELeftMenuPage.MainPage !== EleftMenu &&
								ELeftMenuPage.MyCabinet !== EleftMenu
							) {
								dispatch({
									type: 'SET_PAGE_POPUP_EXIT',
									payload: EPagePopUpExit.Exit,
								})
							} else {
								navigate('../')
								dispatch({
									type: 'SET_LEFT_MENU_PAGE',
									payload: ELeftMenuPage.MainPage,
								})
								dispatch({
									type: 'SET_PAGE_POPUP_EXIT',
									payload: EPagePopUpExit.None,
								})
							}
						}}>
						<img src={logo} alt="logo" className={s.logo} />
						<img src={mobileLogo} alt="mobileLogo" className={s.mobileLogo} />
					</button>
					<button
						className={s.BurgerMenu}
						onClick={() => {
							dispatch({
								type: 'SET_LEFT_MENU_PAGE',
								payload: ELeftMenuPage.MainPage,
							})
							dispatch({type: 'SET_MOBILE_LEFT', payload: !mobileLeftSelector})
						}}>
						<MenuIcon />
					</button>
					{/* <Menu width={'200px'} className={s.BurgerMenu}  /> */}
					<mui.Select
						className={s.muiSelect__menu}
						renderValue={(option: SelectOption<number> | null) => {
							return (
								<>
									<div className={s.selectContainer}>
										<p className={s.selectText}>Добавить</p>
									</div>
									<div className={s.hiddenDivMuiSelect}></div>
								</>
							)
						}}
						variant={'standard'}
						// @ts-ignore
						defaultValue={1}
						// value={valueMuiSelectArchive}
					>
						<mui.MenuItem
							classes={{
								root: s.muiMenuItemRoot,
								selected: s.muiMenuItemSelected,
							}}
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
							classes={{
								root: s.muiMenuItemRoot,
								selected: s.muiMenuItemSelected,
							}}
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
							classes={{
								root: s.muiMenuItemRoot,
								selected: s.muiMenuItemSelected,
							}}
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
						<button
							style={{color: hiddenNum ? '#25991c' : ''}}
							onClick={() => {
								dispatch({
									type: 'SET_HIDDEN_NUM',
									payload: !hiddenNum,
								})
								console.log(hiddenNum)
							}}
							className={s.hideBtn + ' ' + s.HiddenBtn}>
							<p className={s.btnText}>{hiddenNum ? 'Показать' : 'Скрыть'}</p>
							<p className={s.rub}>₽</p>
							{/* <Eye className={s.eye} /> */}
						</button>

						<button
							onClick={() => {
								dispatch({type: 'SET_DETAILS', payload: !details})
								console.log(details)
							}}
							style={{color: details ? '#25991c' : ''}}
							className={s.hideBtn + ' ' + s.DetailsBtn}>
							<p className={s.btnText}>Подробно</p>
							<Doc className={s.eyeNotMob} />
						</button>
					</div>
				</div>

				<DataSlidePicker className={s.dataSlidePicker} dateMode />
				<mui.Select
					className={`${s.muiSelect__Buttons}`}
					IconComponent={''}
					renderValue={(option: SelectOption<number> | null) => {
						return (
							<div className={s.Mui_AddIcon}>
								<AddIcon />
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
				<div className={s.Buttons}>
					<button
						onClick={() => {
							dispatch({type: 'SET_DETAILS', payload: !details})
							console.log(details)
						}}
						style={{color: details ? '#25991c' : ''}}
						className={s.hideBtn + ' ' + s.DetailsBtn}>
						<Doc className={s.eye} />
					</button>
					<Link
						to={'/statistics'}
						className={s.greenBtn + ' ' + s.rightlyLastBtns}>
						<p className={s.btnText}>Статистика</p>
					</Link>
					<Link to={'/'} className={s.greenBtn}>
						<p
							onClick={() => {
								if (
									EPagePopUpExit.None === pagePopUpExit &&
									ELeftMenuPage.MainPage === EleftMenu
								) {
									dispatch({
										type: 'SET_LEFT_MENU_PAGE',
										payload: ELeftMenuPage.MyCabinet,
									})
								} else {
									dispatch({
										type: 'SET_PAGE_POPUP_EXIT',
										payload: EPagePopUpExit.Exit,
									})
								}
							}}
							className={s.btnText}>
							Личный кабинет
						</p>
					</Link>
					<mui.Select
						className={s.muiSelect__ButtonsStat}
						IconComponent={''}
						renderValue={(option: SelectOption<number> | null) => {
							return <MoreVertIcon />
						}}
						variant={'standard'}
						// @ts-ignore
						defaultValue={1}
						// value={valueMuiSelectArchive}
					>
						<mui.MenuItem value={1}>
							<Link className={s.ItemTwoBtns} to={'/statistics'}>
								<p className={s.btnText}>Статистика</p>
							</Link>
						</mui.MenuItem>
						<mui.MenuItem value={2}>
							<Link className={s.ItemTwoBtns} to={'/'}>
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
						</mui.MenuItem>
					</mui.Select>
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
