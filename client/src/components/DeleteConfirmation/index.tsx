import React, {useRef, useEffect} from 'react'
import {createPortal} from 'react-dom'
import s from './index.module.scss'

export const DeleteConfirmation = ({
	className = '',
	onDelete,
	onCancel,
	buttonRef,
}) => {
	const popupRef = useRef(null)

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				popupRef.current &&
				!popupRef.current.contains(event.target) &&
				buttonRef.current &&
				!buttonRef.current.contains(event.target)
			) {
				onCancel()
			}
		}

		const positionPopup = () => {
			if (buttonRef.current && popupRef.current) {
				const buttonRect = buttonRef.current.getBoundingClientRect()
				const popupRect = popupRef.current.getBoundingClientRect()

				// Позиционируем над кнопкой
				let top = buttonRect.top - popupRect.height - 10
				let left = buttonRect.left + (buttonRect.width - popupRect.width) / 2

				// Проверяем границы экрана
				if (top < 10) {
					// Если места сверху мало, показываем под кнопкой
					top = buttonRect.bottom + 10
					popupRef.current.classList.add(s.PopupBelow)
				} else {
					popupRef.current.classList.remove(s.PopupBelow)
				}

				// Проверяем горизонтальные границы
				if (left < 10) left = 10
				if (left + popupRect.width > window.innerWidth - 10) {
					left = window.innerWidth - popupRect.width - 10
				}

				popupRef.current.style.position = 'fixed'
				popupRef.current.style.top = `${top}px`
				popupRef.current.style.left = `${left}px`
			}
		}

		// Добавляем слушатели с небольшой задержкой для корректного рендеринга
		setTimeout(positionPopup, 0)

		document.addEventListener('mousedown', handleClickOutside)
		window.addEventListener('resize', positionPopup)
		window.addEventListener('scroll', positionPopup)

		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
			window.removeEventListener('resize', positionPopup)
			window.removeEventListener('scroll', positionPopup)
		}
	}, [onCancel, buttonRef])

	const handleDeleteClick = (e) => {
		e.stopPropagation()
		onDelete()
	}

	const handleCancelClick = (e) => {
		e.stopPropagation()
		onCancel()
	}

	return createPortal(
		<div
			ref={popupRef}
			className={`${s.PopupContainer} ${className}`}
			onClick={(e) => e.stopPropagation()}>
			<div className={s.ExitPopUp}>
				<div className={s.PopUpHeader}>
					<p>Подтверждение удаления</p>
				</div>
				<div className={s.PopUpBody}>
					<p>Вы действительно хотите удалить?</p>
				</div>
				<div className={s.PopUpFooter}>
					<button className={s.PopUpYes} onClick={handleDeleteClick}>
						<p>Да</p>
					</button>
					<button className={s.PopUpNo} onClick={handleCancelClick}>
						<p>Нет</p>
					</button>
				</div>
			</div>
		</div>,
		document.body,
	)
}

export default DeleteConfirmation
