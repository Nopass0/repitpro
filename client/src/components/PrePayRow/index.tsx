import {IPrePayList} from '@/types'
import {useEffect, useState} from 'react'
import s from './index.module.scss'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Input from '../Input'
import MiniCalendar from '../MiniCalendar'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel'
interface IPrePayRow {
	id: number
	cost: string
	date: Date
	onDelete: () => void
	onEdit: () => void
	isEditing: boolean
	onEditDone: (newDate: Date, newCost: string) => void
	finishEditing: () => void
	onAcceptDelete: () => void
	isDeleted: boolean
	finishDelete: () => void
}

const PrePayRow: React.FC<IPrePayRow> = ({
	id,
	cost,
	date,
	onDelete,
	onEdit,
	isEditing,
	onEditDone,
	finishEditing,
	onAcceptDelete,
	isDeleted,
	finishDelete,
}) => {
	const [prePayCost, setPrePayCost] = useState<string>(cost)
	const [prePayDate, setPrePayDate] = useState<Date>(new Date(Date.now()))
	const formatDate = (date: any) => {
		// Проверка, является ли date объектом Date
		if (!(date instanceof Date)) {
			// Преобразуем в объект Date, если это строка или число
			date = new Date(date)
		}

		// Если преобразование не удалось и дата все еще является Invalid Date
		if (isNaN(date.getTime())) {
			return 'Invalid Date' // Или можно вернуть пустую строку или другой дефолтный формат
		}

		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = String(date.getFullYear()).slice(-2) // Берем последние 2 цифры года

		return `${day}.${month}.${year}`
	}

	const handlePrePayDate = (newDate: any) => setPrePayDate(new Date(newDate))
	const handleSave = () => {
		onEditDone(prePayDate, prePayCost)
	}
	return (
		<>
			<>
				<div key={id} id={`prePayId-${id}`} className={s.ListObject}>
					{!isEditing ? (
						<>
							<p
								style={{
									fontWeight: '500',
									fontSize: '14px',
									marginRight: '5px',
									display: 'flex',
									flexDirection: 'row',
									alignItems: 'center',
								}}>
								<div
									style={{
										width: '10px',
										height: '35px',
										borderTopLeftRadius: '8px',
										borderBottomLeftRadius: '8px',
										marginRight: '5px',
									}}></div>
								{formatDate(date)}
							</p>
							<p
								style={{
									fontWeight: '300',
									fontSize: '16px',
									width: '120px',
									minWidth: '95px',
									maxWidth: '95px',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
								}}>
								Предоплата
							</p>

							<p
								style={{
									fontSize: '14px',
									width: '100px',
									textAlign: 'end',
								}}>
								{cost}₽
							</p>
							{!isDeleted ? (
								<>
									<button onClick={onEdit}>
										<EditIcon />
									</button>
									<button onClick={onAcceptDelete}>
										<DeleteIcon color="error" />
									</button>
								</>
							) : (
								<>
									<button onClick={onDelete}>
										<CheckCircleIcon color="success" />
									</button>
									<button onClick={finishDelete}>
										<CancelIcon color="error" />
									</button>
								</>
							)}
						</>
					) : (
						<div className={s.ListObject}>
							<MiniCalendar
								value={prePayDate}
								onChange={(newDate) => handlePrePayDate(newDate)}
								calendarId={`prePayId-${id}`}
								NeedCalendarMonthIcon={false}
							/>
							<p
								style={{
									fontWeight: '300',
									fontSize: '16px',
									width: '120px',
									minWidth: '95px',
									maxWidth: '95px',
									whiteSpace: 'nowrap',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
								}}>
								Предоплата
							</p>
							<Input
								num
								className={s.PrePayCostInput}
								type="text"
								value={prePayCost}
								onChange={(e) => setPrePayCost(e.target.value)}
								defaultValue={cost}
							/>
							<p>₽</p>
							<button style={{marginLeft: '5px'}} onClick={handleSave}>
								<CheckCircleIcon color="success" />
							</button>
							<button onClick={finishEditing}>
								<CancelIcon color="error" />
							</button>
						</div>
					)}
				</div>
			</>
		</>
	)
}

export default PrePayRow
