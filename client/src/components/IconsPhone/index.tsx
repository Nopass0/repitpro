import React, {useState} from 'react'
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

const IconsPhone: React.FC<IIconsPhone> = ({phoneNumber, email}: IIconsPhone) => {
	return (
		<div className={s.Icons}>
			<Link to={`tel:${phoneNumber}`}>
				<img src={phoneIcon} alt="phoneIcon" />
			</Link>
			<Link to={`mailto:${email}`}>
				<img src={EmailIcon} alt="EmailIcon" />
			</Link>
			<Link to={`tg://resolve?domain=${phoneNumber}`}>
				<img src={TelegramIcon} alt="TelegramIcon" />
			</Link>
			<Link to={`https://wa.me/${phoneNumber}`}>
				<img src={WhatsAppIcon} alt="WhatsApp" />
			</Link>
		</div>
	)
}

export default IconsPhone
