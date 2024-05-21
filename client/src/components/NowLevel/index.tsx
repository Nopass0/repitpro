import React, {useEffect, useState} from 'react'
import s from './index.module.scss'

interface INowLevel {
	className?: string
	style?: React.CSSProperties
	children?: React.ReactNode
	amountInputs?: number
	value?: number // Added value prop
	onChange?: (value: number) => void
	disabled?: boolean
}

const NowLevel: React.FC<INowLevel> = ({
	className,
	style,
	children,
	amountInputs = 5,
	value, // Destructuring value prop
	onChange,
	disabled,
}: INowLevel) => {
	const [activeButton, setActiveButton] = useState<number | null>(
		value !== undefined ? value - 1 : null,
	) // Initializing activeButton based on value prop

	const handleClick = (index: number) => {
		if (index === activeButton) {
			setActiveButton(null)
		} else {
			setActiveButton(index)
		}
		onChange && onChange(index + 1) // Adjusting index to match value
	}
	// console.log(value, 'VALUE', activeButton)

	useEffect(() => {
		setActiveButton(value !== undefined ? value - 1 : null)
	}, [value])

	return (
		<div className={`${s.wrapper} ${className}`}>
			{Array.from({length: amountInputs}, (_, i) => (
				<button
				disabled={disabled}
					key={i}
					className={`${s.button} ${activeButton === i ? s.active : ''}`}
					value={i + 1}
					onClick={() => handleClick(i)}>
					{i + 1}
				</button>
			))}
		</div>
	)
}

export default NowLevel
