import React from 'react'
import s from './index.module.scss'
import socket from '../../socket'
import {useNavigate} from 'react-router-dom'
import {useDispatch} from 'react-redux'

interface ILogin {}

const Login = ({}: ILogin) => {
	const navigator = useNavigate()
	const dispatch = useDispatch()

	const [login, setlogin] = React.useState<string>()
	const [password, setpassword] = React.useState<string>()
	const [error, setError] = React.useState<boolean>(false)
	const handleLogin = () => {
		console.log(login, password)
		socket.emit('login', {login, password})
		socket.once('login', (data) => {
			if (data.error) {
				setError(true)
			} else {
				console.log('Req:', data)

				dispatch({type: 'SET_TOKEN', payload: data.token})
				navigator('/')
			}
		})
	}

	return (
		<div className={s.wrapper}>
			<div className={s.window}>
				<div className={s.HeaderWindow}>
					<h1>Авторизация</h1>
				</div>
				<div className={s.BodyWindow}>
					<div className={s.InputName}>
						{error && <p className={s.Error}>Пожалуйста, введите правильные имя пользователя и пароль. Оба поля могут быть чувствительны к регистру.</p>}
						<p>Имя пользователя:</p>
						<input
							onChange={(e) => setlogin(e.target.value)}
							value={login}
							type="text"
							placeholder="Логин"
						/>
					</div>
					<div className={s.InputPswd}>
						<p>Пароль:</p>
						<input
							onChange={(e) => setpassword(e.target.value)}
							value={password}
							type="password"
							placeholder="Пароль"
						/>
					</div>
					<button className={s.BtnLogin} onClick={handleLogin}>
						Войти
					</button>
					<p>Ещё нет аккаунта?</p>
					<button
						className={s.BtnRegister}
						onClick={() => navigator('/register')}>
						Регистрация
					</button>
				</div>
			</div>
		</div>
	)
}

export default Login
