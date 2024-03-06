import {OptionGroup, Select, SelectOption, Option} from '@mui/base'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'
import logo from '../../assets/logo.png'
import Eye from '../../assets/eye'
import Doc from '../../assets/doc'
import DataSlidePicker from '../DataSlidePicker'
import Exit from '../../assets/exit'
import {useNavigate} from 'react-router-dom'
import {useDispatch} from 'react-redux'

interface IHeader {}

const Header = ({}: IHeader) => {
	const navigate = useNavigate()
	const dispatch = useDispatch()

	const handleLogout = () => {
		dispatch({type: 'LOGOUT'})
		navigate('/login')
	}

	return (
		<header className={s.header}>
			<div className={s.logoContainer}>
				<img src={logo} alt="logo" width={36} height={36} className={s.logo} />
				<h1 className={s.title}>КАБИНЕТ РЕПЕТИТОРА</h1>
			</div>
			<Select
				defaultValue={1}
				renderValue={(option: SelectOption<number> | null) => {
					return (
						<div className={s.selectContainer}>
							<p className={s.selectText}>Добавить</p>
							<Arrow />
						</div>
					)
				}}
				placeholder="Select"
				className={s.select}>
				<OptionGroup className={s.optionGroup}>
					<Option value={1} className={s.option}>
						Ученика
					</Option>
					<Option value={2} className={s.option}>
						Группу
					</Option>
					<Option value={3} className={s.option}>
						Заказчика
					</Option>
				</OptionGroup>
			</Select>
			<button className={s.hideBtn}>
				<p className={s.btnText}>Скрыть</p>
				<p className={s.rub}>₽</p>
				<Eye className={s.eye} />
			</button>

			<button className={s.hideBtn + ' ' + s.rightly}>
				<p className={s.btnText}>Подробно</p>

				<Doc className={s.eye} />
			</button>

			<DataSlidePicker
				className={s.dataSlidePicker}
				data={[
					'Январь',
					'Февраль',
					'Март',
					'Апрель',
					'Май',
					'Июнь',
					'Июль',
					'Август',
					'Сентябрь',
					'Октябрь',
					'Ноябрь',
					'Декабрь',
				]}
				defaultValueId={1}
			/>

			<div>
				<button className={s.greenBtn + ' ' + s.rightlyLastBtns}>
					<p className={s.btnText}>Статистика</p>
				</button>
				<button className={s.greenBtn}>
					<p className={s.btnText}>Личный кабинет</p>
				</button>
			</div>
			<button onClick={handleLogout} className={s.exitBtn}>
				<p className={s.btnText}>Выход</p>
				<Exit />
			</button>
		</header>
	)
}

export default Header
