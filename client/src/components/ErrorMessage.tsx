import type React from 'react'

interface ErrorMessageProps {
	message: string
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({message}) => (
	<div className="flex items-center justify-center h-screen">
		<div className="text-2xl font-bold text-red-500">{message}</div>
	</div>
)

export default ErrorMessage
