import {useState} from 'react'
import s from './index.module.scss'
import {Collapse, List, ListItemButton, ListItemText} from '@mui/material'
import Line from '../Line'
import uploadFile from '../../assets/UploadFile.svg'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
interface IFileNLinks {
	className?: string
	stateName?: string
	stateSet?: string
}

const FileNLinks: React.FC<IFileNLinks> = ({className}: IFileNLinks) => {
	const [open, setOpen] = useState(true)

	const handleClick = () => {
		setOpen(!open)
	}

	return (
		<>
			<ListItemButton
				className={className}
				style={{marginTop: '10px'}}
				onClick={handleClick}>
				<img src={uploadFile} alt={uploadFile} />
				<ListItemText primary="Файлы/ссылки" />
				{open ? <ExpandLess /> : <ExpandMore />}
			</ListItemButton>

			<Collapse in={open} timeout="auto" unmountOnExit>
				<List
					style={{
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'column',
					}}
					component="div"
					disablePadding>
					<Line width="296px" className={s.Line} />
					<p>Список пока пуст</p>
				</List>
			</Collapse>
		</>
	)
}

export default FileNLinks
