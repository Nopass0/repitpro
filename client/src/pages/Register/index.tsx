import React from 'react'
import s from './index.module.scss'
import socket from '../../socket'
import {useNavigate} from 'react-router-dom'
import {useDispatch} from 'react-redux'

interface IRegister {}

const Register = ({}: IRegister) => {
	const navigator = useNavigate()
	const dispatch = useDispatch()

	const [login, setlogin] = React.useState<string>()
	const [password, setpassword] = React.useState<string>()
	const [repeatPassword, setrepeatPassword] = React.useState<string>()
	const [error, setError] = React.useState<boolean>(false)

	const handleLogin = () => {
		if (password === repeatPassword) {
			setError(false)
			socket.emit('register', {login, password})
			console.log(login, password)

			socket.once('register', (data) => {
				console.log('Req:', data)

				dispatch({type: 'SET_TOKEN', payload: data.token})
				// navigator('/')
				window.location.href = '/'
			})
		} else {
			setpassword('')
			setrepeatPassword('')
			setError(true)
		}
	}

	return (
		<div className={s.wrapper}>
			<div className={s.window}>
				<div className={s.HeaderWindow}>
					<h1>Регистрация</h1>
				</div>
				<div className={s.BodyWindow}>
					<div className={s.InputName}>
						<p>Имя пользователя:</p>
						<input
							onChange={(e) => setlogin(e.target.value)}
							value={login}
							type="text"
						/>
					</div>
					<div className={s.InputPswd}>
						<p>Пароль:</p>
						<input
							onChange={(e) => setpassword(e.target.value)}
							value={password}
							type="password"
						/>
						{error && <p className={s.Error}>Введенные пароли не совпадают</p>}
					</div>
					<div className={s.InputPswd}>
						<p>Подтверждение пароль:</p>
						<input
							onChange={(e) => setrepeatPassword(e.target.value)}
							value={repeatPassword}
							type="password"
						/>
					</div>
					<button className={s.BtnLogin} onClick={handleLogin}>
						Зарегистрироваться
					</button>
					<p>Уже зарегистрированы?</p>
					<button className={s.BtnRegister} onClick={() => navigator('/login')}>
						Войти
					</button>
				</div>
			</div>
		</div>
	)
}

export default Register
