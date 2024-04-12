import s from './index.module.scss'
import * as mui from '@mui/material'
import * as MUI from '@mui/base'
import {SelectOption} from '@mui/base'
import Line from '../Line'
import Search from '../../assets/search'
import {useEffect, useState} from 'react'
import './index.css'
import AddStudent from '../AddStudent'
import {useDispatch, useSelector} from 'react-redux'
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
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn'
import Home from '../../assets/5.svg'

import Group from '../../assets/4.svg'
import {Link} from 'react-router-dom'
interface ILeftMenu {}

const MainPage = () => {
	const [search, setSearch] = useState<string>('')
	const [valueMuiSelectType, setValueMuiSelectType] = useState<number>(0)
	const [valueMuiSelectArchive, setValueMuiSelectArchive] = useState<number>(0)
	const [students, setStudents] = useState([])
	const [groups, setGroups] = useState([])
	const user = useSelector((state: any) => state.user)
	const token = user?.token

	const dispatch = useDispatch()
	// const [openSelect, setOpenSelect] = useState<boolean>(false)
	const [openedStudents, setOpenedStudents] = useState<number[]>([])
	const [openedGroups, setOpenedGroups] = useState<number[]>([])
	const handleOpenStudent = (index: number) => {
		if (openedStudents.includes(index)) {
			setOpenedStudents(openedStudents.filter((item) => item !== index))
		} else {
			setOpenedStudents([...openedStudents, index])
		}
	}
	const handelOpenGroups = (index: number) => {
		if (openedGroups.includes(index)) {
			setOpenedGroups(openedGroups.filter((item) => item !== index))
		} else {
			setOpenedGroups([...openedGroups, index])
		}
	}

	socket.emit('getStudentList', token)
	socket.emit('getGroupList', token)

	useEffect(() => {
		socket.once('getStudentList', (data: any) => {
			console.log('Students', data)
			setStudents(data)
		})
		socket.once('getGroupList', (data: any) => {
			console.log('Groups', data)
			setGroups(data)
		})
	}, [])

	const data_muiSelectType = [
		{
			label: 'Все',
			value: students.length + groups.length,
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

	const [filteredStudents, setFilteredStudents] = useState([])
	const [filteredGroups, setFilteredGroups] = useState([])

	useEffect(() => {
		if (valueMuiSelectArchive === 0) {
			setFilteredStudents(students)
			setFilteredGroups(groups)
		} else {
			const archivedStudents = students.filter((student) => student.isArchived)
			const archivedGroups = groups.filter(
				(group) =>
					group.isArchived ||
					group.students.some((student) => student.isArchived),
			)
			setFilteredStudents(archivedStudents)
			setFilteredGroups(archivedGroups)
		}
	}, [valueMuiSelectArchive, students, groups])

	const handleSearch = (e) => {
		const searchValue = e.target.value.toLowerCase()

		const filteredStudentsList = students.filter((student) =>
			student.nameStudent.toLowerCase().includes(searchValue),
		)
		setFilteredStudents(filteredStudentsList)

		const filteredGroupsList = groups.filter((group) =>
			group.groupName.toLowerCase().includes(searchValue),
		)
		setFilteredGroups(filteredGroupsList)
	}
	const handleOpenCard = (studentId: string) => {
		socket.emit('getGroupByStudentId', {
			token: token,
			studentId: studentId,
		})

		//SET_CURRENT_OPENED_STUDENT with studentid
		dispatch({type: 'SET_CURRENT_OPENED_STUDENT', payload: studentId})
		//SET_LEFT_MENU_PAGE
		dispatch({type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddStudent})
	}
	return (
		<div className={s.wrapper}>
			<div className={s.HeaderLeftMenu}>
				<div className={s.FilterNArchive}>
					<mui.Select
						className={s.muiSelectType}
						displayEmpty
						variant={'standard'}
						value={valueMuiSelectType}
						onChange={(e: any) => {
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
						onChange={(e) => {
							handleSearch(e)
							setSearch(e.target.value)
						}}
						placeholder="Имя"
					/>
					<div className={s.SearchIconDiv}>
						<Search className={s.SearchIcon} />
					</div>
				</div>
			</div>
			<div className={s.MainLeftMenu}>
				{/* FOR GROUP */}
				{valueMuiSelectType === 0 && (
					<div className={s.GroupWrapper}>
						{filteredGroups.map((item: any, index: number) => (
							<>
								<mui.ListItemButton
									className={s.ListGroup}
									key={index}
									onClick={() => handelOpenGroups(index)}>
									<div
										className={`${s.ListGroupWrapper} ${
											item.isArchived === true && s.Archive
										}`}>
										<button className={s.btn}>
											<img width="32px" height="32px" src={Group} alt="Group" />
										</button>
										<p>{item.groupName}</p>
										{item.isArchived && (
											<>
												<button className={s.Icons}>
													<KeyboardReturnIcon />
												</button>
											</>
										)}
										<div className={s.Icons}>
											{openedGroups.includes(index) ? (
												<>
													<ExpandLess />
												</>
											) : (
												<>
													<ExpandMore />
												</>
											)}
										</div>
									</div>
								</mui.ListItemButton>

								<mui.Collapse
									className={s.MuiCollapse}
									in={openedGroups.includes(index)}
									timeout="auto"
									unmountOnExit>
									<mui.List
										className={s.MuiList}
										component="div"
										disablePadding>
										{item.students.map((student: any, index: number) => (
											// <p>{student.nameStudent}</p>
											<MUI.Select
												key={index}
												className={`${s.muiSelect}`}
												onListboxOpenChange={() => handleOpenStudent(index)}
												multiple
												renderValue={(
													option: MUI.SelectOption<number> | null,
												) => {
													if (option == null || option.value === null) {
														return (
															<>
																<div className={s.ListWrapper}>
																	<button className={s.btn}>
																		<img src={Home} alt="Home" />
																	</button>
																	<p>{student.nameStudent}</p>
																	<div className={s.Icons}>
																		{openedStudents.includes(index) ? (
																			<ExpandLess />
																		) : (
																			<ExpandMore />
																		)}
																	</div>
																</div>
															</>
														)
													}
													return (
														<>
															<div className={s.ListWrapper}>
																<button className={s.btn}>
																	<img src={Home} alt="Home" />
																</button>
																<p>{student.nameStudent}</p>

																<div className={s.Icons}>
																	{openedStudents.includes(index) ? (
																		<ExpandLess />
																	) : (
																		<ExpandMore />
																	)}
																</div>
															</div>
														</>
													)
												}}>
												<MUI.Option className={s.muiOption} value={1}>
													<div className={s.ListItem}>
														{student.phoneNumber ? (
															<>
																<p className={s.Phone}>{student.phoneNumber}</p>
																<div className={s.Icons}>
																	<Link to={`tel:${student.phoneNumber}`}>
																		<img src={phoneIcon} alt="phoneIcon" />
																	</Link>
																	<Link to={`mailto:${student.email}`}>
																		<img src={EmailIcon} alt="EmailIcon" />
																	</Link>
																	<Link
																		to={`tg://resolve?domain=${student.phoneNumber}`}>
																		<img
																			src={TelegramIcon}
																			alt="TelegramIcon"
																		/>
																	</Link>
																	<Link
																		to={`https://wa.me/${student.phoneNumber}`}>
																		<img src={WhatsAppIcon} alt="WhatsApp" />
																	</Link>
																</div>
															</>
														) : (
															<>
																<p className={s.NoData}>Данных нет</p>
															</>
														)}
													</div>
												</MUI.Option>
											</MUI.Select>
										))}
									</mui.List>
								</mui.Collapse>

								<Line className={s.LineList} width="296px" />
							</>
						))}
					</div>
				)}

				{/* FOR STUDENTS */}
				{(valueMuiSelectType === 0 || valueMuiSelectType === 2) && (
					<>
						{filteredStudents.map((item: any, index: number) => (
							<>
								<MUI.Select
									key={index}
									className={s.muiSelect}
									onListboxOpenChange={() => handleOpenStudent(index)}
									multiple
									renderValue={(option: MUI.SelectOption<number> | null) => {
										if (option == null || option.value === null) {
											return (
												<>
													<div
														className={`${s.ListWrapper} ${
															item.isArchived === true && s.Archive
														}`}>
														<button
															onClick={() => console.log('1234')}
															className={s.btn}>
															<img src={Home} alt="Home" />
														</button>
														<p>{item.nameStudent}</p>
														{item.isArchived && (
															<>
																<button className={s.Icons}>
																	<KeyboardReturnIcon />
																</button>
															</>
														)}
														<div className={s.Icons}>
															{openedStudents.includes(index) ? (
																<ExpandLess />
															) : (
																<ExpandMore />
															)}
														</div>
													</div>
												</>
											)
										}
										return (
											<>
												<div
													className={`${s.ListWrapper} ${
														item.isArchived === true && s.Archive
													}`}>
													<button
														onClick={() => console.log('1234')}
														className={s.btn}>
														<img src={Home} alt="Home" />
													</button>
													<p>{item.nameStudent}</p>
													{item.isArchived === true && (
														<>
															<button className={s.Icons}>
																<KeyboardReturnIcon />
															</button>
														</>
													)}
													<div className={s.Icons}>
														{openedStudents.includes(index) ? (
															<ExpandLess />
														) : (
															<ExpandMore />
														)}
													</div>
												</div>
											</>
										)
									}}>
									<MUI.Option className={s.muiOption} value={1}>
										<div className={s.ListItem}>
											{item.phoneNumber ? (
												<>
													<p className={s.Phone}>{item.phoneNumber}</p>
													<div className={s.Icons}>
														<Link to={`tel:${item.phoneNumber}`}>
															<img src={phoneIcon} alt="phoneIcon" />
														</Link>
														<Link to={`mailto:${item.email}`}>
															<img src={EmailIcon} alt="EmailIcon" />
														</Link>
														<Link
															to={`tg://resolve?domain=${item.phoneNumber}`}>
															<img src={TelegramIcon} alt="TelegramIcon" />
														</Link>
														<Link to={`https://wa.me/${item.phoneNumber}`}>
															<img src={WhatsAppIcon} alt="WhatsApp" />
														</Link>
													</div>
												</>
											) : (
												<>
													<p className={s.NoData}>Данных нет</p>
												</>
											)}
										</div>
									</MUI.Option>
								</MUI.Select>
								<Line className={s.LineList} width="296px" />
							</>
						))}
					</>
				)}
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
