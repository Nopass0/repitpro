import React, {useRef, useState} from 'react'
import s from './index.module.scss'

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
	placeholder?: string
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
	placeholder,
	firstMinSymbols = 36,
}: ITextArea) => {
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const currentHeight = 19
	const [height, setHeight] = useState<number>(currentHeight) // Начальная высота 19px
	// В одной строке 56 символов, с 94 включительно начинается 2-я строка
	const getAdjustedHeight = () => {
		if (textareaRef.current) {
			setHeight(textareaRef.current.scrollHeight) // currentHeight
			console.log(height, textareaRef.current.value.length)
		}
	}
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
						placeholder={placeholder}
					/>
				</label>
			</div>
		</>
	)
}

export default TextAreaInputBlock
