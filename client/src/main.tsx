import React, {useLayoutEffect} from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import {createStore} from 'redux'
import {EPagePopUpExit, IUser} from './types.ts'
import {Provider} from 'react-redux'
import {Navigate, RouterProvider, createBrowserRouter} from 'react-router-dom'
import Header from './components/Header'
import Login from './pages/Login'
import Main from './pages/Main'
import socket from './socket'
import Register from './pages/Register/index.tsx'
import Test from './pages/Test/index.tsx'
import LeftMenu from './components/LeftMenu/index.tsx'
import Statistics from './pages/Statistics/index'
import {ELeftMenuPage, ECurrentDayPopUp} from './types.ts'
import axios from 'axios'

socket.on('connect', () => {
	console.log(socket.id) // "G5p5..."
})

const defaultState = {
	user: {
		token: localStorage.getItem('token') || '',
	} as IUser,
	currentMonth: new Date().getMonth(),
	currentYear: new Date(Date.now()).getFullYear(),
	leftMenu: ELeftMenuPage.MainPage,
	pagePopUpExit: EPagePopUpExit.None,
	calendarNowPopupDay: '0',
	calendarNowPopupMonth: '0',
	calendarNowPopupYear: '0',
	hiddenNum: false,
	details: false,
	students: [],
	currentOpenedStudent: '', //ID of current opened student
	currentOpenedClient: '', //ID of current opened client
	currentOpenedGroup: '', //ID of current opened group
	currentScheduleDay: '', //ID of schedule dayIndex
	mobileLeft: true,
	currentScheduleDayClientId: '',
	currentPopUpType: ECurrentDayPopUp.None,
	dayStudents: [],
	editedCards: false,
	addStudentExit: false,
	addGroupExit: false,
	addClientExit: false,
	isEditDayPopUp: false,
	dayPopUpExit: EPagePopUpExit.None,
}
socket.emit('getMonth', {
	currentMonth: defaultState.currentMonth,
	currentYear: defaultState.currentYear,
	token: defaultState.user.token,
})
if (localStorage.getItem('token') !== '') {
	socket.emit('checkAccount', defaultState.user.token, (data: any) => {
		if (data.status !== 'ok') {
			localStorage.removeItem('token')
			defaultState.user.token = ''
			//redirect to login page
			window.location.href = '/login'
		}
	})
}

// useLayoutEffect(() => {
// 	// socket.emit('checkAccount', defaultState.user.token, (data: any) => {
// 	// 	if (data.status !== 'ok') {
// 	// 		localStorage.removeItem('token')
// 	// 		defaultState.user.token = ''
// 	// 	}
// 	// })
// axios
// 	.get('http://localhost:3000/check-occupied-slots', {
// 		params: {token: defaultState.user.token},
// 	})
// 	.then((data) => {
// 		console.log(
// 			`\ncheck-occupied-slots\n${JSON.stringify(data.data, null, 2)}\n`,
// 		)
// 	})
// }, [])

const reducer = (state = defaultState, action: any) => {
	switch (action.type) {
		case 'SET_TOKEN':
			//save to local storage
			localStorage.setItem('token', action.payload)

			return {...state, user: {...state.user, token: action.payload}}

		case 'SET_DAY_STUDENTS':
			return {...state, dayStudents: action.payload}
		case 'SET_CURRENT_OPENED_SCHEDULE_DAY':
			return {...state, currentScheduleDay: action.payload}

		case 'SET_CURRENT_POPUP_TYPE':
			return {...state, currentPopUpType: action.payload}

		case 'SET_CURRENT_SCHEDULE_DAY_CLIENT_ID':
			return {...state, currentScheduleDayClientId: action.payload}

		case 'SET_CURRENT_MONTH':
			socket.emit('getMonth', {
				currentMonth: action.payload.month,
				currentYear: action.payload.year,
				token: defaultState.user.token,
			})
			return {...state, currentMonth: action.payload.month}

		case 'SET_CURRENT_OPENED_STUDENT':
			return {...state, currentOpenedStudent: action.payload}

		case 'SET_CURRENT_OPENED_CLIENT':
			return {...state, currentOpenedClient: action.payload}
		case 'SET_CURRENT_OPENED_GROUP':
			return {...state, currentOpenedGroup: action.payload}
		case 'SET_CALENDAR_NOW_POPUP':
			console.log('SET_CALENDAR_NOW_POPUP', action.payload)
			return {
				...state,
				calendarNowPopupDay: action.payload.day,
				calendarNowPopupMonth: action.payload.month,
				calendarNowPopupYear: action.payload.year,
			}
		case 'UPDATE_STUDENTS':
			console.log('UPDATE_STUDENTS', action.payload)
			//change by id
			const key = action.payload.key

			return {
				...state,
				students: action.payload.students,
				[key]: action.payload.students,
			}

		case 'SET_CURRENT_YEAR':
			return {...state, currentYear: action.payload}
		case 'SET_LEFT_MENU_PAGE':
			return {...state, leftMenu: action.payload}

		case 'SET_PAGE_POPUP_EXIT':
			return {...state, pagePopUpExit: action.payload}

		case 'LOGOUT':
			localStorage.removeItem('token')
			return {...state, user: {...state.user, token: ''}}
		case 'SET_HIDDEN_NUM':
			return {...state, hiddenNum: action.payload}

		case 'SET_DETAILS':
			return {...state, details: action.payload}
		case 'SET_MOBILE_LEFT':
			return {...state, mobileLeft: action.payload}

		case 'SET_EDITED_CARDS':
			return {...state, editedCards: action.payload}
		case 'SET_ADD_STUDENT_EXIT':
			return {...state, addStudentExit: action.payload}
		case 'SET_ADD_GROUP_EXIT':
			return {...state, addGroupExit: action.payload}
		case 'SET_ADD_CLIENT_EXIT':
			return {...state, addClientExit: action.payload}
		case 'SET_IS_EDIT_DAY_POPUP':
			return {...state, isEditDayPopUp: action.payload}
		case 'SET_DAY_POPUP_EXIT':
			return {...state, dayPopUpExit: action.payload}
		default:
			return state
	}
}

const store = createStore(reducer)

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
									<div className="container">
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

const publicLinks = [
	{
		element: <Login />,
		path: '/login',
	},

	{
		element: <Register />,
		path: '/register',
	},
]

const privateLinks = [
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
