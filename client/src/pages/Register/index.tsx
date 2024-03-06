import React from 'react'
import s from './index.scss'
import socket from '../../socket'
import {useNavigate} from 'react-router-dom'
import {useDispatch} from 'react-redux'

interface IRegister {}

const Register = ({}: IRegister) => {
	const navigator = useNavigate()
	const dispatch = useDispatch()

	const [login, setlogin] = React.useState<string>()
	const [password, setpassword] = React.useState<string>()

	const handleLogin = () => {
		console.log(login, password)
		socket.emit('register', {login, password})

		socket.once('register', (data) => {
			console.log('Req:', data)

			dispatch({type: 'SET_TOKEN', payload: data.token})
			navigator('/')
		})
	}

	return (
		<div>
			<h1>Register</h1>
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
			<button onClick={handleLogin}>Зарегистрироваться</button>
			<button onClick={() => navigator('/login')}>Войти</button>
		</div>
	)
}

export default Register
