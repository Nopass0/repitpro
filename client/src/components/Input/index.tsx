import React from 'react'
import s from './index.module.scss'

interface IInput {
	className?: string
	style?: React.CSSProperties
	children?: React.ReactNode
	type?: string
	value?: string
	onChange?: (e: any) => void
	onClick?: (e: any) => void
	num?: boolean
	disabled?: boolean
	width?: string
	maxWidth?: string
	minWidth?:string
}

const Input: React.FC<IInput> = ({
	className,
	style,
	children,
	type,
	value,
	onChange,
	onClick,
	disabled,
	num,
	width = '100%',
	maxWidth = '181px',
	minWidth,
}: IInput) => {
	const onlyNumbers = (event: React.ChangeEvent<HTMLInputElement>) => {
		const regex = /[^0-9]/g
		event.target.value = event.target.value.replace(regex, '')
		if (onChange) {
			onChange(event)
		}
	}

	return (
		<input
			style={{...style, width: width, maxWidth: maxWidth, minWidth: '2ch'}}
			className={`${s.input} ${className}`}
			type={type ? type : 'text'}
			value={value}
			disabled={disabled}
			onChange={(e) => {
				if (num) {
					onlyNumbers(e)
				}
				onChange(e)
			}}
		/>
	)
}

export default Input
