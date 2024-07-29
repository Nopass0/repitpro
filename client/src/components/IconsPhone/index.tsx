import React from 'react'
import s from './index.module.scss'

import phoneIcon from '../../assets/PhoneSVG.svg'
import EmailIcon from '../../assets/EmailSVG.svg'
import TelegramIcon from '../../assets/TelegramSVG.svg'
import WhatsAppIcon from '../../assets/WhatsUPSVG.svg'
import {Link} from 'react-router-dom'
interface IIconsPhone {
	phoneNumber?: string
	email?: string
}

const IconsPhone: React.FC<IIconsPhone> = ({
	phoneNumber,
	email,
}: IIconsPhone) => {
	let phone = phoneNumber && phoneNumber.replace(/[^0-9]/g, '')
	return (
		<div className={s.Icons}>
			<Link
				rel="noopener noreferrer"
				target="_blank"
				className={`${!!phone ? '' : s.disabled}`}
				onClick={(e) => e.preventDefault()}
				to={`${!!phone ? 'tel:' + phone : ''}`}>
				<img src={phoneIcon} alt="phoneIcon" />
			</Link>
			<Link
				rel="noopener noreferrer"
				target="_blank"
				className={`${!!email ? '' : s.disabled}`}
				to={`${!!email ? 'mailto:' + email : ''}`}>
				<img src={EmailIcon} alt="EmailIcon" />
			</Link>
			<Link
				rel="noopener noreferrer"
				target="_blank"
				className={`${!!phone ? '' : s.disabled}`}
				to={`${!!phone ? 'https://t.me/+' + phone : ''}`}>
				<img src={TelegramIcon} alt="TelegramIcon" />
			</Link>
			<Link
				rel="noopener noreferrer"
				target="_blank"
				className={`${!!phone ? '' : s.disabled}`}
				to={`${!!phone ? 'https://wa.me/' + phone : ''}`}>
				<img src={WhatsAppIcon} alt="WhatsApp" />
			</Link>
		</div>
	)
}

export default IconsPhone
