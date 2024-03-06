import React from 'react'
import s from './index.scss'
import socket from '../../socket'
import {useNavigate} from 'react-router-dom'
import {useDispatch} from 'react-redux'

interface ILogin {}

const Login = ({}: ILogin) => {
	const navigator = useNavigate()
	const dispatch = useDispatch()

	const [login, setlogin] = React.useState<string>()
	const [password, setpassword] = React.useState<string>()

	const handleLogin = () => {
		console.log(login, password)
		socket.emit('login', {login, password})

		socket.once('login', (data) => {
			console.log('Req:', data)

			dispatch({type: 'SET_TOKEN', payload: data.token})
			navigator('/')
		})
	}

	return (
		<div>
			<h1>Login</h1>
			<input
				onChange={(e) => setlogin(e.target.value)}
				value={login}
				type="text"
				placeholder="Логин"
			/>
			<input
				onChange={(e) => setpassword(e.target.value)}
				value={password}
				type="password"
				placeholder="Пароль"
			/>
			<button onClick={handleLogin}>Войти</button>
			<button onClick={() => navigator('/register')}>Регистрация</button>
		</div>
	)
}

export default Login
