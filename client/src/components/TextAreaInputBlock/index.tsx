import React, {useEffect, useRef, useState} from 'react'
import s from './index.module.scss'
import {debounce} from 'lodash'

interface ITextArea {
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
	minWidth?: string
	title?: string
	textIndent?: string
	firstMinSymbols?: number
}

const TextAreaInputBlock: React.FC<ITextArea> = ({
	className,
	style,
	children,
	type,
	value,
	onChange,
	onClick,
	disabled,
	title,
	textIndent,
	firstMinSymbols = 36,
}: ITextArea) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const currentHeight = 19
	const [height, setHeight] = useState<number>(currentHeight) // Начальная высота 19px
	const [lines, setLines] = useState<number>()
	const getAdjustedHeight = () => {
		if (textareaRef.current) {
			// const heightClient = textareaRef.current.clientHeight
			// const isWrapped = textareaRef.current.scrollHeight > heightClient
			// console.log(
			// 	isWrapped,
			// 	textareaRef.current.scrollHeight,
			// 	textareaRef.current.clientHeight,
			// 	Math.floor((value?.length - 36) / 57),
			// 	value?.length,
			// )
			// if (isWrapped) {
			// 	return setHeight(heightClient + 30)
			// } else if (textareaRef.current.scrollHeight === heightClient) {
			// 	return setHeight(heightClient)
			// } else if (Math.floor(value?.length - 36 / 57) >= 0) {
			// 	return setHeight(Math.max(heightClient - 30, 19))
			// }

			setHeight(textareaRef.current.scrollHeight) // currentHeight
		}
	}
	// const debouncedAdjustTextareaHeight = debounce(getAdjustedHeight, 3)

	// const getAdjustedHeight = () => {
	// 	if (value?.length > firstMinSymbols - 1) {
	// 		setLines(Math.floor((value?.length - firstMinSymbols) / 57))
	// 	}
	// 	if (value?.length < firstMinSymbols) {
	// 		setLines(-1)
	// 	}
	// }

	// useEffect(() => {
	// 	if (lines + 1 === 1) {
	// 		console.log('1234')

	// 		setHeight(48)
	// 	} else if (value?.length < firstMinSymbols || lines === -1) {
	// 		console.log('ABG')

	// 		setHeight(19)
	// 	} else {
	// 		setHeight((lines + 1) * 30)
	// 	}
	// 	console.log('useEFFECT')
	// }, [lines])

	// console.log(lines, 'LENGTH', value?.length)

	// const [lines, setLines] = useState<number>(0)
	// let oldLines = 0
	// const getAdjustedHeight = () => {
	// 	if (value?.length < 36) {
	// 		setHeight(currentHeight)
	// 	} else {
	// 		// setLines(value?.split('\n').length)
	// 		setLines(value?.length % 57)
	// 		oldLines = value?.length % 57
	// 		console.log(lines, oldLines, 'LINES')
	// 	}
	// }
	// useEffect(() => {
	// 	if (oldLines !== lines) {
	// 		setHeight(currentHeight + 30)
	// 	}
	// }, [lines])

	// const getAdjustedHeight = () => {
	// 	const newHeight = textareaRef.current.scrollHeight // Minimum height of 19px
	// 	setHeight(newHeight)
	// }

	// // Call getAdjustedHeight on initial render and whenever value changes
	// useEffect(() => {
	// 	getAdjustedHeight()
	// }, [value])

	return (
		<>
			<div className={s.StudentCard} style={{height: `${height}px`}}>
				<label>
					<p>{title}</p>
					<textarea
						className={`${s.textarea} ${className}`}
						value={value}
						disabled={disabled}
						onChange={(e) => {
							if (onChange) {
								onChange(e)
							}
							getAdjustedHeight()
						}}
						onClick={(e) => {
							if (onClick) {
								onClick(e)
							}
						}}
						onKeyDown={(e) => {
							if (e.key === 'Enter') {
								e.preventDefault()
							}
						}}
						style={{
							...style,
							height: `${height}px`,
							textIndent: `${textIndent ? textIndent : '120px'}`,
						}}
						ref={textareaRef}
					/>
				</label>
			</div>
		</>
	)
}

export default TextAreaInputBlock
