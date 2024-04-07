import s from './index.module.scss'
import * as mui from '@mui/material'
import {SelectOption} from '@mui/base'
import Line from '../Line'
import Search from '../../assets/search'
import {useEffect, useState} from 'react'
import './index.css'
import AddStudent from '../AddStudent'
import {useSelector} from 'react-redux'
import {ELeftMenuPage} from '../../types'
import AddGroup from '../AddGroup'
import AddClient from '../AddClient'
import MyCabinet from '../MyCabinet'
import socket from '../../socket'
import {ExpandLess, ExpandMore, Telegram} from '@mui/icons-material'
import phoneIcon from '../../assets/PhoneSVG.svg'
import EmailIcon from '../../assets/EmailSVG.svg'
import TelegramIcon from '../../assets/TelegramSVG.svg'
import WhatsAppIcon from '../../assets/WhatsUPSVG.svg'
import { Link } from 'react-router-dom'
interface ILeftMenu {}

const MainPage = () => {
	const [type, setType] = useState<string>('')
	const [archive, setArchive] = useState<string>('')
	const [search, setSearch] = useState<string>('')
	const [valueMuiSelectType, setValueMuiSelectType] = useState<number>(0)
	const [valueMuiSelectArchive, setValueMuiSelectArchive] = useState<number>(0)
	const [students, setStudents] = useState([])
	const [open, setOpen] = useState<boolean>(false)
	const user = useSelector((state: any) => state.user)
	const token = user?.token

	console.log('Token: ', token)

	socket.emit('getStudentList', token)

	useEffect(() => {
		socket.once('getStudentList', (data: any) => {
			console.log('Students', data)
			setStudents(data)
		})
	}, [])

	console.log('STUDENTS: ', students)

	const data_muiSelectType = [
		{
			label: 'Все',
			value: students.length,
		},
		{
			label: 'Заказчики',
			value: '50',
		},
		{
			label: 'Ученики',
			value: students.length,
		},
	]

	return (
		<div className={s.wrapper}>
			<div className={s.HeaderLeftMenu}>
				<div className={s.FilterNArchive}>
					<mui.Select
						className={s.muiSelectType}
						displayEmpty
						variant={'standard'}
						value={valueMuiSelectType}
						onChange={(e) => {
							setValueMuiSelectType(e.target.value)
						}}>
						{data_muiSelectType.map((item, index) => (
							<mui.MenuItem value={index} key={index}>
								<div
									style={{
										display: 'flex',
										flexDirection: 'row',
										whiteSpace: 'nowrap',
										fontSize: '16px',
									}}>
									<p>{`${item.label}`}</p>&nbsp;
									<p style={{fontWeight: '600'}}>{item.value}</p>
								</div>
							</mui.MenuItem>
						))}
					</mui.Select>

					<Line width="264px" className={s.Line} />

					<mui.Select
						className={s.muiSelectType}
						variant={'standard'}
						value={valueMuiSelectArchive}
						onChange={(e: any) => {
							setValueMuiSelectArchive(e.target.value)
						}}>
						<mui.MenuItem value={0}>
							<div
								style={{
									display: 'flex',
									flexDirection: 'row',
									whiteSpace: 'nowrap',
									fontSize: '16px',
								}}>
								<p>С архивом</p>
							</div>
						</mui.MenuItem>
						<mui.MenuItem value={1}>
							<div
								style={{
									display: 'flex',
									flexDirection: 'row',
									whiteSpace: 'nowrap',
									fontSize: '16px',
								}}>
								<p>Только архив</p>
							</div>
						</mui.MenuItem>
					</mui.Select>
				</div>
				<div className={s.SearchInput}>
					<input
						type="text"
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Имя"
					/>
					<div className={s.SearchIconDiv}>
						<Search className={s.SearchIcon} />
					</div>
				</div>
			</div>
			<div className={s.MainLeftMenu}>
				{/* FOR GROUP */}

				{/* <mui.ListItemButton onClick={() => setOpen(!open)}>
					<div className={s.ListWrapper}>
						<button className={s.btn}></button>

					</div>
					{open ? <ExpandLess /> : <ExpandMore />}
				</mui.ListItemButton>

				<mui.Collapse
					className={s.MuiCollapse}
					in={open}
					timeout="auto"
					unmountOnExit>
					<mui.List
						className={s.MuiList}
						component="div"
						disablePadding></mui.List>
				</mui.Collapse> */}

				{students.map((item: any) => (
					<>
						<mui.Select
							className={s.muiSelect__menu}
							variant={'standard'}
							renderValue={() => {
								return (
									<>
										<div className={s.ListWrapper}>
											<button className={s.btn}>Test</button>
											<p>{item.nameStudent}</p>
										</div>
									</>
								)
							}}>
							<mui.MenuItem>
								<div className={s.ListItem}>
									{item.phoneNumber ? (
									<>
									<p className={s.Phone}>{item.phoneNumber}</p>
									<div className={s.Icons}>
										<Link to={`tel:${item.phoneNumber}`}>
											<img src={phoneIcon} alt="phoneIcon" />
										</Link>
										<Link to={`emailto:2223@mail.ru`}>
											<img src={EmailIcon} alt="EmailIcon" />
										</Link>
										<Link to={`tg://resolve?domain=${item.phoneNumber}`}>
											<img src={TelegramIcon} alt="TelegramIcon" />
										</Link>
										<Link to={`https://wa.me/${item.phoneNumber}`}>
											<img src={WhatsAppIcon} alt="WhatsApp" />
										</Link>
									</div>
									</>	
									): (
										<>
											<p className={s.NoData}>Данных нет</p>
										</>
									)}
								</div>
							</mui.MenuItem>
						</mui.Select>
						<Line className={s.Line} width="296px" />
					</>
					// <div>
					// 	<p>
					// 		Имя {item.nameStudent} - Номер {item.phoneNumber} - Is Archive{' '}
					// 		{String(item.isArchived)}
					// 	</p>
					// </div>
				))}
			</div>
		</div>
	)
}

const LeftMenu = ({}: ILeftMenu) => {
	const Page = useSelector((state: any) => state.leftMenu)

	switch (Page) {
		case ELeftMenuPage.MainPage:
			return <MainPage />

		case ELeftMenuPage.AddStudent:
			return <AddStudent />
		case ELeftMenuPage.AddGroup:
			return <AddGroup />
		case ELeftMenuPage.AddClient:
			return <AddClient />

		case ELeftMenuPage.MyCabinet:
			return <MyCabinet />

		default:
			return <MainPage />
	}
}

export default LeftMenu
