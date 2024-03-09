import s from './index.module.scss'
import * as mui from '@mui/base'
import * as React from 'react'
import Line from '../Line'
import Search from '../../assets/search'
interface ILeftMenu {}

const LeftMenu = ({}: ILeftMenu) => {
	const [type, setType] = React.useState<string>('')
	const [archive, setArchive] = React.useState<string>('')
	const [search,setSearch] = React.useState<string>('')
	return (
		<div className={s.wrapper}>
			<div className={s.HeaderLeftMenu}>
				<div className={s.FilterNArchive}>
					<mui.Select
						className={s.muiSelectType}
						renderValue={(option: mui.SelectOption<number> | null) => {
							if (option == null || option.value === null) {
								return (
									<>
										<p className={s.muiSelectTypeReturn}>Все</p>
									</>
								)
							}
							return `${option.label}`
						}}>
						<mui.Option value={1}>
							<p>Все</p>
						</mui.Option>
						<mui.Option value={2}>
							<p>Заказчики</p>
						</mui.Option>
						<mui.Option value={3}>
							<p>Ученики</p>
						</mui.Option>
					</mui.Select>
					<Line width="264px" className={s.Line} />
					<mui.Select
						className={s.muiSelectArchive}
						renderValue={(option: mui.SelectOption<number> | null) => {
							if (option == null || option.value === null) {
								return (
									<>
										<p className={s.muiSelectArchiveReturn}>С архивом</p>
									</>
								)
							}
							return `${option.label}`
						}}>
						<mui.Option value={1}>
							<p>С архивом</p>
						</mui.Option>
						<mui.Option value={2}>
							<p>Без архива</p>
						</mui.Option>
					</mui.Select>
				</div>
				<div className={s.SearchInput}>
					<input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Имя" />
					<div className={s.SearchIconDiv}>
						<Search className={s.SearchIcon}/>
					</div>
				</div>
			</div>
			<div className={s.MainLeftMenu}>
				
			</div>
		</div>
	)
}

export default LeftMenu
