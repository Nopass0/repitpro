import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.scss'
import {createStore} from 'redux'
import {IUser} from './types.ts'
import {Provider} from 'react-redux'
import {Navigate, RouterProvider, createBrowserRouter} from 'react-router-dom'
import Header from './components/Header/index.tsx'
import Login from './pages/Login/index.tsx'
import Main from './pages/Main/index.tsx'

let defaultState = {
	user: {
		token: '123',
	} as IUser,
}

const reducer = (state = defaultState, action: any) => {
	switch (action.type) {
		default:
			return state
	}
}

let store = createStore(reducer)

function getWHeader(router_element: any, isPrivate: boolean) {
	// console.log(defaultState.user.user_id, 'user')

	return (
		<>
			{isPrivate && !defaultState.user.token ? (
				<Navigate to="/login" />
			) : (
				<>
					{!isPrivate && !defaultState.user.token ? (
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
]

let privateLinks = [
	{
		element: getWHeader(<Main />, true),
		path: '/',
	},
]

const getLinks = () => {
	if (store.getState().user.token) {
		return privateLinks
	} else {
		return publicLinks
	}
}

const router = createBrowserRouter(getLinks())
ReactDOM.createRoot(document.getElementById('root')!).render(
	<Provider store={store}>
		<RouterProvider router={router} />
	</Provider>,
)
