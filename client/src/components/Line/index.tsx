import React from 'react'
import s from './index.module.scss'

interface ILine {
	width?: string
	className?: string
}

const Line: React.FC<ILine> = ({width, className}: ILine) => {
	return (
		<div
			className={s.line + ' ' + className}
			style={{width: width ? width : '308px'}}></div>
	)
}

export default Line
