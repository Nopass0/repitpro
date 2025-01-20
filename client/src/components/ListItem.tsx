import type React from 'react'
import {ExpandLess, ExpandMore} from '@mui/icons-material'
import KeyboardReturnIcon from '@mui/icons-material/KeyboardReturn'
import s from './LeftMenu.module.scss'

interface ListItemProps {
	icon: string
	name: string
	isArchived: boolean
	isOpen: boolean
	onToggle: () => void
	onArchive: () => void
	onClick: () => void
}

export const ListItem: React.FC<ListItemProps> = ({
	icon,
	name,
	isArchived,
	isOpen,
	onToggle,
	onArchive,
	onClick,
}) => (
	<div className={`${s.ListWrapper} ${isArchived && s.Archive}`}>
		<button className={s.btn} onClick={onClick}>
			<img src={icon || '/placeholder.svg'} alt={name} />
		</button>
		<p>{name}</p>
		{isArchived && (
			<button className={s.Icons} onClick={onArchive}>
				<KeyboardReturnIcon />
			</button>
		)}
		<div className={s.Icons} onClick={onToggle}>
			{isOpen ? <ExpandLess /> : <ExpandMore />}
		</div>
	</div>
)
