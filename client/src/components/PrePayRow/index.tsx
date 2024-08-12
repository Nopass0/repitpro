import {IPrePayList} from '@/types'
import {useEffect, useState} from 'react'
import s from './index.module.scss'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import Input from '../Input'
import MiniCalendar from '../MiniCalendar'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import CancelIcon from '@mui/icons-material/Cancel';
interface IPrePayRow {
	id: number
	cost: string
	date: Date
	onDelete: () => void
	onEdit: () => void
	isEditing: boolean
	onEditDone: (newDate: Date, newCost: string) => void
	finishEditing: () => void;

}

const PrePayRow: React.FC<IPrePayRow> = ({
	id,
	cost,
	date,
	onDelete,
	onEdit,
	isEditing,
	onEditDone,
	finishEditing
}) => {
	const [prePayCost, setPrePayCost] = useState<string>(cost)
	const [prePayDate, setPrePayDate] = useState<any>(new Date(Date.now()))
	const formatDate = (date: Date) => {
		const day = String(date.getDate()).padStart(2, '0')
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const year = String(date.getFullYear()).slice(-2) // Take last 2 digits of the year

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
							<button onClick={onEdit}>
								<EditIcon />
							</button>
							<button onClick={onDelete}>
								<DeleteIcon />
							</button>
						</>
					) : (
						<div className={s.ListObject}>
							<MiniCalendar
								value={prePayDate}
								onChange={(newDate) => handlePrePayDate(newDate)}
								calendarId={`prePayId-${id}`}
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
							<button onClick={handleSave}>
								<CheckCircleIcon />
							</button>
							<button onClick={finishEditing}>
								<CancelIcon />
							</button>
						</div>
					)}
				</div>
			</>
		</>
	)
}

export default PrePayRow
