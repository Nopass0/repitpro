import React from 'react'
import s from './index.module.scss'
import Arrow, {ArrowType} from '../../assets/arrow'

interface IDataSlidePicker {
	defaultValueId: number
	data: string[]
	onChange?: (id: number, data: string) => void
	className?: string
}

const DataSlidePicker = ({
	defaultValueId,
	data,
	onChange,
	className,
}: IDataSlidePicker) => {
	const [value, setValue] = React.useState(defaultValueId)

	const handleChange = (id: number) => {
		if (id === -1) id = data.length - 1
		if (id === data.length) id = 0
		setValue(id)
		if (onChange) onChange(id, data[id])
	}

	return (
		<div className={s.dataSlidePicker + ' ' + (className || '')}>
			<button className={s.btn} onClick={() => handleChange(value - 1)}>
				<span>
					<Arrow direction={ArrowType.left} />
				</span>
			</button>
			<p className={s.btnText}>{data[value]}</p>
			<button className={s.btn} onClick={() => handleChange(value + 1)}>
				<span>
					<Arrow direction={ArrowType.right} />
				</span>
			</button>
		</div>
	)
}

export default DataSlidePicker
