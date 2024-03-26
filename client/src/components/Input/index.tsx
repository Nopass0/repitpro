import React, {useState} from 'react'
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
}

const Input: React.FC<IInput> = ({
	className,
	style,
	children,
	type,
	value,
	onChange,
	onClick,
	num,
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
			style={style}
			className={`${s.input} ${className}`}
			type={type ? type : 'text'}
			value={value}
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
