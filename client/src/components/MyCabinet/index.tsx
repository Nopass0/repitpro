import s from './index.module.scss'
import * as mui from '@mui/material'
import {styled} from '@mui/material/styles'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import Line from '../Line'
import Search from '../../assets/search'
import {useEffect, useState} from 'react'
import Arrow, {ArrowType} from '../../assets/arrow'
import microSVG from '../../assets/Microphone1.svg'
import Listen from '../../assets/Listen.svg'
import Plus from '../../assets/ItemPlus.svg'
import InActive from '../../assets/InActiveCheckboxIcon.svg'
import CheckBox from '../CheckBox'
import {AdapterDayjs} from '@mui/x-date-pickers/AdapterDayjs'
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider'
import InputMask from 'react-input-mask'
import {DatePicker} from '@mui/x-date-pickers/DatePicker'
import CreateIcon from '@mui/icons-material/Create'
import {ru} from 'date-fns/locale/ru'
import {AdapterDateFns} from '@mui/x-date-pickers/AdapterDateFnsV3'
import ScheduleDate from '../ScheduleDate/index'
import ScheduleIcon from '@mui/icons-material/Schedule'
import FileDownloadIcon from '@mui/icons-material/FileDownload'
import TimeSelector from '../Timer/index'
import uploadFile from '../../assets/UploadFile.svg'
import Input from '../Input'
import FileNLinks from '../FileNLinks'
import EyeT from '../../assets/EyeVisibilityT.svg'
import EyeF from '../../assets/EyeVisibilityF.svg'
import socket from '../../socket'
import {useSelector} from 'react-redux'

interface IMyCabinet {}

const MyCabinet = ({}: IMyCabinet) => {
	const [name, setName] = useState<string>('')
	const [email, setEmail] = useState<string>('')
	const [password, setPassword] = useState<string>('')
	const [repeatPassword, setRepeatPassword] = useState<string>('')
	const [edit, setEdit] = useState<number>(1)

	const [comment, setComment] = useState<string>('')

	const [showPassword, setShowPassword] = useState<boolean>(false)
	const [showRepeatPassword, setShowRepeatPassword] = useState<boolean>(false)

	const [errorPwd, setErrorPwd] = useState<boolean>(false)
	const [myBuyOpen, setMyBuyOpen] = useState<boolean>(false)
	const [fileOpen, setFileOpen] = useState<boolean>(false)
	const [questionOpen, setQuestionOpen] = useState<boolean>(false)

	const user = useSelector((state: any) => state.user)
	const token = user?.token

	useEffect(() => {
		socket.emit('getUserData', token)
		socket.once('getUserData', (data) => {
			console.log(data)
			setName(data.userName)
			setEmail(data.email)
		})
	}, [])

	const saveFunc = () => {
		if (password !== repeatPassword) {
			return setErrorPwd(true)
		}
		socket.emit('setUserData', {
			token: token,
			name: name,
			email: email,
			password: password,
		})

		setEdit(1)
		setErrorPwd(false)
	}
	return (
		<div className={s.wrapper}>
			<div className={s.Header}>
				<h1 className={s.Title}>Личный кабинет</h1>
				{/* USERNAME */}
				<p className={s.GrayTitle}>{name}</p>
			</div>
			<div className={s.MainBlock}>
				<div className={s.InputBlock}>
					<label htmlFor="name">ФИО</label>
					<input
						type="text"
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						placeholder="Test"
						disabled={edit === 1}
					/>
				</div>
				<div className={s.InputBlock}>
					<label htmlFor="email">E-mail</label>
					<input
						type="email"
						id="email"
						placeholder="Test"
						value={email}
						onChange={(e) => setEmail(e.target.value)}
						disabled={edit === 1}
					/>
				</div>
				<div className={s.InputBlockPwd}>
					<div className={s.Password}>
						<label htmlFor="pwd">Новый пароль</label>
						<input
							type={showPassword ? 'text' : 'password'}
							id="pwd"
							placeholder="Новый пароль"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={edit === 1}
						/>
					</div>
					<button onClick={() => setShowPassword(!showPassword)}>
						<img src={showPassword ? EyeT : EyeF} />
					</button>
				</div>
				<div className={s.InputBlockPwd}>
					<div className={s.Password}>
						<label htmlFor="pwdRep">Повторите пароль</label>
						<input
							type={showRepeatPassword ? 'text' : 'password'}
							id="pwdRep"
							placeholder="Повторите пароль"
							value={repeatPassword}
							onChange={(e) => setRepeatPassword(e.target.value)}
							disabled={edit === 1}
						/>
					</div>
					<button onClick={() => setShowRepeatPassword(!showRepeatPassword)}>
						<img src={showRepeatPassword ? EyeT : EyeF} />
					</button>
				</div>
				<p
					style={{
						color: 'red',
						display: errorPwd ? 'block' : 'none',
						marginBottom: '10px',
					}}>
					Пароли не совпадают
				</p>
				<div className={s.FooterButton}>
					<div className={s.EditNSave}>
						<button
							onClick={() => setEdit(2)}
							className={`${s.Edit} ${edit === 2 ? s.EditActive : ''}`}>
							<p>Редактировать</p>
						</button>
						<button
							onClick={saveFunc}
							className={`${s.Save} ${edit === 2 ? s.SaveActive : ''}`}>
							<p>Сохранить</p>
						</button>
					</div>
				</div>
				<div className={s.Memory}>
					<p>Облачная память</p>
					<div className={s.MemoryBlock}>
						<p>5.05% (0.1MB/2.0MB)</p>
						<div
							className={s.MemoryBar}
							style={{
								background: '#ccc',
								height: '10px',
								borderRadius: '8px',
								width: '100%',
								clipPath: `inset(calc(100% - 35.05%)) 0 0 0`,
								backgroundColor: '#000',
							}}></div>
					</div>
				</div>

				<div className={s.BuyMemory}>
					<p className={s.GrayTitle}>Купить память</p>
					<div className={s.ChooseMemoryBuyWrap}>
						<div className={s.ChooseLine}>
							<p>10 мб</p>
							<p>100 р</p>
							<button>Купить</button>
						</div>

						<Line width="100%" className={s.Line} />
						<div className={s.ChooseLine}>
							<p>20 мб</p>
							<p>200 р</p>
							<button>Купить</button>
						</div>

						<Line width="100%" className={s.Line} />
						<div className={s.ChooseLine}>
							<p>50 мб</p>
							<p>500 р</p>
							<button>Купить</button>
						</div>
						<Line width="100%" className={s.Line} />
						<div className={s.ChooseLine}>
							<p>100 мб</p>
							<p>1000 р</p>
							<button>Купить</button>
						</div>
					</div>
					<mui.ListItemButton
						className={s.ListItemButton}
						style={{marginTop: '10px'}}
						onClick={() => setMyBuyOpen(!myBuyOpen)}>
						<mui.ListItemText primary="Мои покупки" />
						{myBuyOpen ? <ExpandLess /> : <ExpandMore />}
					</mui.ListItemButton>

					<mui.Collapse in={myBuyOpen} timeout="auto" unmountOnExit>
						<mui.List
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexDirection: 'column',
							}}
							component="div"
							disablePadding>
							<Line width="336px" className={s.Line} />
							{/* <p>Список пока пуст</p> */}
							<div className={s.myBuyList}>
								<p>22.09.2022</p>
								<p>Репетитор</p>
								<p>1000 ₽</p>
							</div>
							<Line width="336px" className={s.Line} />
							<div className={s.myBuyList}>
								<p>22.09.2022</p>
								<p>Репетитор</p>
								<p>1000 ₽</p>
							</div>
							<Line width="336px" className={s.Line} />
							<div className={s.myBuyList}>
								<p>22.09.2022</p>
								<p>Репетитор</p>
								<p>1000 ₽</p>
							</div>
							<Line width="336px" className={s.Line} />
							<div className={s.myBuyList}>
								<p>22.09.2022</p>
								<p>Репетитор</p>
								<p>1000 ₽</p>
							</div>
							<Line width="336px" className={s.Line} />
						</mui.List>
					</mui.Collapse>
					<FileNLinks className={s.ListItemButton} />
					<mui.ListItemButton
						className={s.ListItemButton}
						style={{marginTop: '10px'}}
						onClick={() => setQuestionOpen(!questionOpen)}>
						<mui.ListItemText primary="Мои покупки" />
						{questionOpen ? <ExpandLess /> : <ExpandMore />}
					</mui.ListItemButton>

					<mui.Collapse in={questionOpen} timeout="auto" unmountOnExit>
						<mui.List
							style={{
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								flexDirection: 'column',
							}}
							component="div"
							disablePadding>
							<Line width="336px" className={s.Line} />
							<p>Список пока пуст</p>
						</mui.List>
					</mui.Collapse>
				</div>
				<div className={s.CallBack}>
					<p className={s.GrayTitle}>Обратная связь</p>
					<Line width="336px" className={s.Line} />
					<textarea className={s.TextArea} placeholder="Написать" />
				</div>
				<button className={s.Send}>Отправить</button>
			</div>
		</div>
	)
}

export default MyCabinet
