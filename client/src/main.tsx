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
import {elements} from 'chart.js'
import Test from './pages/Test/index.tsx'
import LeftMenu from './components/LeftMenu/index.tsx'
import Statistics from './pages/Statistics/index.tsx'
import {ELeftMenuPage} from './types.ts'

socket.on('connect', () => {
	console.log(socket.id) // "G5p5..."
})

let defaultState = {
	user: {
		token: localStorage.getItem('token') || '',
	} as IUser,
	currentMonth: new Date().getMonth(),
	currentYear: new Date(Date.now()).getFullYear(),
	leftMenu: ELeftMenuPage.MyCabinet,
}
socket.emit('getMonth', {
	currentMonth: defaultState.currentMonth,
	currentYear: defaultState.currentYear,
	token: defaultState.user.token,
})
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
		case 'SET_CURRENT_MONTH':
			socket.emit('getMonth', {
				currentMonth: action.payload.month,
				currentYear: action.payload.year,
				token: defaultState.user.token,
			})
			// alert('year' + action.payload.year + 'month' + action.payload.month)
			return {...state, currentMonth: action.payload.month}
		case 'SET_CURRENT_YEAR':
			return {...state, currentYear: action.payload}
		case 'SET_LEFT_MENU_PAGE':
			return {...state, leftMenu: action.payload}
		case 'LOGOUT':
			localStorage.removeItem('token')

			return {...state, user: {...state.user, token: ''}}
		default:
			return state
	}
}

let store = createStore(reducer)

function getWHeader(router_element: any, isPrivate: boolean) {
	console.log(defaultState, 'user')

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
							{window.location.pathname !== '/login' &&
							window.location.pathname !== '/register' ? (
								<>
									<Header />
									<div
										style={{
											display: 'flex',
											flexDirection: 'row',
											// width: '100%',
											maxWidth: '1920px',
										}}>
										<LeftMenu />
										{[router_element]}
									</div>
								</>
							) : (
								<>{[router_element]}</>
							)}
						</>
					)}
				</>
			)}
		</>
	)
}

let publicLinks = [
	{
		element: <Login />,
		path: '/login',
	},

	{
		element: <Register />,
		path: '/register',
	},
]

let privateLinks = [
	{
		element: getWHeader(<Main />, true),
		path: '/',
	},
	{
		element: getWHeader(<Test />, true),
		path: '/test',
	},
	{
		element: getWHeader(<Statistics />, true),
		path: '/statistics',
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
