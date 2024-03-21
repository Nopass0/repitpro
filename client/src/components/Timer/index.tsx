import React, {useState} from 'react'
import s from './index.module.scss' // Импорт SCSS-модуля

const TimeSelector = () => {
	const [hours, setHours] = useState(8)
	const [minutes, setMinutes] = useState(0)

	const incrementHours = () => {
		setHours((prevHours) => (prevHours + 1) % 24)
	}

	const decrementHours = () => {
		setHours((prevHours) => (prevHours - 1 + 24) % 24)
	}

	const incrementMinutes = () => {
		setMinutes((prevMinutes) => (prevMinutes + 1) % 60)
	}

	const decrementMinutes = () => {
		setMinutes((prevMinutes) => (prevMinutes - 1 + 60) % 60)
	}

	return (
		<div className={s.container}>
			<div
				className={s.Header}>
				<h2 className={s.HeaderTitle}>
					Начало занятия
				</h2>
				<button className={`${s.text} ${s.textRed}`}>X</button>
			</div>
			<div
				className={`${s.flex} ${s.justifyBetween} ${s.itemsCenter} ${s.mb4}`}>
				<div>
					<button
						onClick={decrementHours}
						className={`${s.bgGray} ${s.p2} ${s.roundedFull}`}>
						-
					</button>
					<h2
						className={`${s.text} ${s.textBlack} ${s.text2xl} ${s.inlineBlock}`}>
						{hours < 10 ? `0${hours}` : hours}
					</h2>
					<button
						onClick={incrementHours}
						className={`${s.bgGray} ${s.p2} ${s.roundedFull}`}>
						+
					</button>
				</div>
				<div>
					<button
						onClick={decrementMinutes}
						className={`${s.bgGray} ${s.p2} ${s.roundedFull}`}>
						-
					</button>
					<h2
						className={`${s.text} ${s.textBlack} ${s.text2xl} ${s.inlineBlock}`}>
						{minutes < 10 ? `0${minutes}` : minutes}
					</h2>
					<button
						onClick={incrementMinutes}
						className={`${s.bgGray} ${s.p2} ${s.roundedFull}`}>
						+
					</button>
				</div>
			</div>
			<button
				className={`${s.bgGreen} ${s.textWhite} ${s.py2} ${s.px4} ${s.roundedFull} ${s.wFull}`}>
				Далее
			</button>
		</div>
	)
}

export default TimeSelector
