import React, {useMemo} from 'react'
import CheckBox from '../CheckBox'
import s from './index.module.scss'

const calculatePrepayment = (history, prePay, currentDate) => {
	let sortedPrePay = []
	if (Array.isArray(prePay)) {
		sortedPrePay = [...prePay].sort(
			(a, b) => new Date(a.date) - new Date(b.date),
		)
	} else if (typeof prePay === 'object' && prePay !== null) {
		// If prePay is an object, convert it to an array
		sortedPrePay = [prePay].sort((a, b) => new Date(a.date) - new Date(b.date))
	}

	let sortedHistory =
		Array.isArray(history) &&
		history.length > 0 &&
		Array.isArray(history[0].historyLessons)
			? [...history[0].historyLessons].sort(
					(a, b) => new Date(a.date) - new Date(b.date),
				)
			: []

	let balance = 0
	let lastPrePay = null
	let remainingPrePay = 0

	sortedPrePay.forEach((pay) => {
		if (new Date(pay.date) <= currentDate) {
			balance += parseFloat(pay.cost || 0)
			lastPrePay = pay
		}
	})

	sortedHistory.forEach((lesson) => {
		if (new Date(lesson.date) <= currentDate) {
			if (balance >= parseFloat(lesson.price || 0)) {
				balance -= parseFloat(lesson.price || 0)
				lesson.isPaid = true
			}
		}
	})

	remainingPrePay = balance

	return {lastPrePay, remainingPrePay, sortedHistory}
}

const PrepaymentComponent = ({student, currentDate}) => {
	const {lastPrePay, remainingPrePay, sortedHistory} = useMemo(
		() => calculatePrepayment(student.history, student.prePay, currentDate),
		[student, currentDate],
	)

	const todayLesson = sortedHistory.find(
		(lesson) =>
			new Date(lesson.date).toDateString() === currentDate.toDateString(),
	)

	return (
		<div className={s.PrePay}>
			<p onClick={() => console.log('lastPrePay', student, lastPrePay, sortedHistory)}>
				{/* {lastPrePay
					? `${lastPrePay.cost || 0} ₽ (${new Date(lastPrePay.date).toLocaleDateString()})`
					: 'Нет предоплат'} */}
					{student && `${student.costOneLesson}₽` }
			</p>
			<div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
				<CheckBox checked={todayLesson?.isPaid || false} size="16px" />
				<p>Предоплата, остаток {remainingPrePay.toFixed(0)} ₽</p>
			</div>
		</div>
	)
}

export default PrepaymentComponent
