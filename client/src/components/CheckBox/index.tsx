import React from 'react'
import * as mui from '@mui/material'
import {styled} from '@mui/material/styles'

interface ILine {
	size: string
	className?: string
	func?: () => void
	checked?: boolean
	onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
	color?: string
	disabled?: boolean
	borderRadius?: number
	idCheckbox?: string
}

const CheckBox: React.FC<ILine> = ({
	size,
	className,
	func,
	checked,
	color,
	onChange,
	disabled,
	borderRadius,
	idCheckbox,
}: ILine) => {
	const BpIcon = styled('span')(({theme}) => ({
		borderRadius: borderRadius || 3,
		width: size,
		height: size,
		boxShadow:
			theme.palette.mode === 'dark'
				? '0 0 0 1px rgb(16 22 26 / 40%)'
				: 'inset 0 0 0 1px rgba(16,22,26,.2), inset 0 -1px 0 rgba(16,22,26,.1)',
		backgroundColor: theme.palette.mode === 'dark' ? '#394b59' : '#f5f8fa',
		'.Mui-focusVisible &': {
			outline: '2px auto #25991C',
			outlineOffset: 2,
		},
		'input:hover ~ &': {
			backgroundColor: theme.palette.mode === 'dark' ? '#30404d' : '#ebf1f5',
		},
		'input:disabled ~ &': {
			boxShadow: 'none',
			background: '#b0b0b4',
			opacity: 0.999,
		},
		'&::before': {
			display: 'block',
			width: size,
			height: size,
			background:
				"url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
				" fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
				"1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%23CCC'/%3E%3C/svg%3E\")",
			content: '""',
		},
	}))

	const BpCheckedIcon = styled(BpIcon)({
		backgroundColor: color || '#25991C',
		backgroundImage:
			'linear-gradient(180deg,hsla(0,0%,100%,.1),hsla(0,0%,100%,0))',
		'&::before': {
			display: 'block',
			width: size,
			height: size,
			backgroundImage:
				"url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Cpath" +
				" fill-rule='evenodd' clip-rule='evenodd' d='M12 5c-.28 0-.53.11-.71.29L7 9.59l-2.29-2.3a1.003 " +
				"1.003 0 00-1.42 1.42l3 3c.18.18.43.29.71.29s.53-.11.71-.29l5-5A1.003 1.003 0 0012 5z' fill='%23fff'/%3E%3C/svg%3E\")",
			content: '""',
		},
		'input:hover ~ &': {
			backgroundColor: color || '#25991C',
		},
		// Добавляем стили для disabled состояния
		'input:disabled ~ &': {
			backgroundColor: color || '#25991C',
			opacity: 0.99,
			cursor: 'not-allowed',
		},
	})

	return (
		<mui.Checkbox
			sx={{
				'&:hover': {bgcolor: 'transparent'},
				// Добавляем стили для disabled состояния
				'&.Mui-disabled': {
					opacity: 0.5,
					cursor: 'not-allowed',
				},
			}}
			id={idCheckbox}
			className={className}
			checked={checked}
			onChange={onChange}
			disableRipple
			color="default"
			disabled={disabled}
			checkedIcon={<BpCheckedIcon />}
			icon={<BpIcon />}
			inputProps={{'aria-label': 'Checkbox demo'}}
		/>
	)
}

export default CheckBox
