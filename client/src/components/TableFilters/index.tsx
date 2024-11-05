import React from 'react'
import Line from '../../components/Line'
import MiniCalendar from '@/components/MiniCalendar'
import {
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Checkbox,
} from '@mui/material'
import s from './index.module.scss'

const TableFilters = ({
	subjects,
	selectedSubjects,
	setSelectedSubjects,
	dateState,
	onDateChange,
	dateStart,
	onDateStartChange,
	dateEnd,
	onDateEndChange,
	title,
}) => {
	// Handle multiple subject selection
	const handleSubjectChange = (event) => {
		const {
			target: {value},
		} = event
		setSelectedSubjects(typeof value === 'string' ? value.split(',') : value)
	}

	return (
		<div className={s.MenuForGraphic}>
			<p className={s.TitleTable}>{title}</p>
			<FormControl variant="standard" className={s.formControl}>
				<InputLabel id="subjects-select-label">Выберите предметы</InputLabel>
				<Select
					labelId="subjects-select-label"
					multiple
					value={selectedSubjects}
					onChange={handleSubjectChange}
					className={s.muiSelect}
					renderValue={(selected) =>
						selected.map((s) => s.itemName).join(', ')
					}>
					{subjects.map((subject) => (
						<MenuItem key={subject.id} value={subject}>
							<Checkbox
								checked={selectedSubjects.some((s) => s.id === subject.id)}
							/>
							{subject.itemName}
						</MenuItem>
					))}
				</Select>
			</FormControl>
			<FormControl variant="standard" className={s.formControl}>
				<InputLabel id="date-select-label">Выберите период</InputLabel>
				<Select
					labelId="date-select-label"
					className={s.muiSelect}
					value={dateState}
					onChange={onDateChange}
					defaultValue={0}>
					<MenuItem value={0}>За последние 30 дней</MenuItem>
					<MenuItem value={1}>С начала месяца</MenuItem>
					<MenuItem value={2}>С начала года</MenuItem>
					<MenuItem value={3}>За всё время</MenuItem>
				</Select>
			</FormControl>
			<Line width="260px" />
			<div className={s.Dates}>
				<div className={s.DatePicker}>
					<MiniCalendar
						value={dateStart}
						onChange={onDateStartChange}
						calendarId={'table-left'}
					/>
				</div>
				<Line width="20px" className={s.LineDate} />
				<div className={s.DatePicker}>
					<MiniCalendar
						value={dateEnd}
						onChange={onDateEndChange}
						calendarId={'table-right'}
					/>
				</div>
			</div>
		</div>
	)
}

export default TableFilters
