import React, {useState} from 'react'
import s from './index.module.scss'
import microSVG from '../../assets/Microphone1.svg'
import Listen from '../../assets/Listen.svg'
interface IRecordNListen {

}

const RecordNListen: React.FC<IRecordNListen> = ({

}: IRecordNListen) => {


	return (
		<div className={s.RecordNListen}>
			<button className={s.Record}>
				<p>Аудио</p>
				<img src={microSVG} alt={microSVG} />
			</button>
			<button className={s.Listen}>
				<p>Прослушать</p>
				<img src={Listen} alt={Listen} />
			</button>
		</div>
	)
}

export default RecordNListen
