import React, { useState } from 'react'
import s from './index.module.scss'

interface INowLevel {
	className?: string
	style?: React.CSSProperties
	children?: React.ReactNode
	amountInputs?: number
}

const NowLevel: React.FC<INowLevel> = ({
	className,
	style,
	children,
	amountInputs = 5,
}: INowLevel) => {
	const [activeButton, setActiveButton] = useState<number | null>(null)

	const handleClick = (index: number) => {
		if (index === activeButton) {
			setActiveButton(null)
		} else {
			setActiveButton(index)
		}
	}

	return (
		<div className={s.wrapper}>
			{Array.from({ length: amountInputs }, (_, i) => (
				<button
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

