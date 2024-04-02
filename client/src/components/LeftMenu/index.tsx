import s from './index.module.scss'
import * as mui from '@mui/material'
import Line from '../Line'
import Search from '../../assets/search'
import {useState} from 'react'
import './index.css'
import AddStudent from '../AddStudent'
import {useSelector} from 'react-redux'
import {ELeftMenuPage} from '../../types'
import AddGroup from '../AddGroup'
import AddClient from '../AddClient'
import MyCabinet from '../MyCabinet'
interface ILeftMenu {}

const MainPage = () => {
	const [type, setType] = useState<string>('')
	const [archive, setArchive] = useState<string>('')
	const [search, setSearch] = useState<string>('')
	const [valueMuiSelectType, setValueMuiSelectType] = useState<number>(0)
	const [valueMuiSelectArchive, setValueMuiSelectArchive] = useState<number>(0)

	const data_muiSelectType = [
		{
			label: 'Все',
			value: '40',
		},
		{
			label: 'Заказчики',
			value: '50',
		},
		{
			label: 'Ученики',
			value: '20',
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
			<div className={s.MainLeftMenu}></div>
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
