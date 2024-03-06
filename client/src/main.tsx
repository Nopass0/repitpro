import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import {createStore} from 'redux'
import {IUser} from './types.ts'
import {Provider} from 'react-redux'
import {Navigate, RouterProvider, createBrowserRouter} from 'react-router-dom'
import Header from './components/Header'
import Login from './pages/Login'
import Main from './pages/Main'
import socket from './socket'
import Register from './pages/Register/index.tsx'

socket.on('connect', () => {
	console.log(socket.id) // "G5p5..."
})

let defaultState = {
	user: {
		token: localStorage.getItem('token') || '',
	} as IUser,
}

if (defaultState.user.token !== '') {
	socket.emit('checkAccount', defaultState.user.token, (data: any) => {
		if (data.status !== 'ok') {
			localStorage.removeItem('token')
			defaultState.user.token = ''
		}
	})
}

const reducer = (state = defaultState, action: any) => {
	switch (action.type) {
		case 'SET_TOKEN':
			//save to local storage
			localStorage.setItem('token', action.payload)

			return {...state, user: {...state.user, token: action.payload}}
		case 'LOGOUT':
			localStorage.removeItem('token')

			return {...state, user: {...state.user, token: ''}}
		default:
			return state
	}
}

let store = createStore(reducer)

function getWHeader(router_element: any, isPrivate: boolean) {
	// console.log(defaultState.user.user_id, 'user')

	return (
		<>
			{isPrivate && defaultState.user.token === '' ? (
				<Navigate to="/login" />
			) : (
				<>
					{!isPrivate && defaultState.user.token !== '' ? (
						<Navigate to="/" />
					) : (
						<>
							<Header />
							{router_element}
						</>
					)}
				</>
			)}
		</>
	)
}

let publicLinks = [
	{
		element: getWHeader(<Login />, false),
		path: '/login',
	},

	{
		element: getWHeader(<Register />, false),
		path: '/register',
	},
]

let privateLinks = [
	{
		element: getWHeader(<Main />, true),
		path: '/',
	},
]

const getLinks = () => {
	return privateLinks.concat(publicLinks)
	// if (store.getState().user.token) {
	// 	return privateLinks
	// } else {
	// 	return publicLinks
	// }
}

const router = createBrowserRouter(getLinks())
ReactDOM.createRoot(document.getElementById('root')!).render(
	<Provider store={store}>
		<RouterProvider router={router} />
	</Provider>,
)
