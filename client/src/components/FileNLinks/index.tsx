import {useState} from 'react'
import s from './index.module.scss'
import {Collapse, List, ListItemButton, ListItemText} from '@mui/material'
import Line from '../Line'
import uploadFile from '../../assets/UploadFile.svg'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
interface IFileNLinks {
	className?: string
	stateName?: string
	stateSet?: string
}

const FileNLinks: React.FC<IFileNLinks> = ({className}: IFileNLinks) => {
	const [open, setOpen] = useState(true)
	const [files, setFiles] = useState<any>([])
	const handleClick = () => {
		setOpen(!open)
	}

	return (
		<>
			<ListItemButton
				className={className}
				style={{marginTop: '10px'}}
				onClick={handleClick}>
				<input
					type="file"
					id="file"
					multiple
					style={{display: 'none'}}
					onChange={(e) => {
						const DefFiles = Array.from(e.target.files)
						DefFiles.forEach((file) => {
							const fileReader = new FileReader()
							fileReader.onload = () => {
								const arrayBuffer = fileReader.result as ArrayBuffer
								const byteArray = new Uint8Array(arrayBuffer)
								const blob = new Blob([byteArray])
								const url = URL.createObjectURL(blob)
								setFiles((prevFiles) => [...prevFiles, {name: file.name, url}])
							}
							fileReader.readAsArrayBuffer(file)
						})
					}}
				/>
				<label htmlFor="file" style={{cursor: 'pointer'}}>
					<img src={uploadFile} alt={uploadFile} />
				</label>
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
					<div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
						{files.length ? (
							files.map((file, index) => (
								<div
									key={index}
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										width: '100%',
									}}>
									<p>
										{file.name.length > 20
											? `${file.name.slice(0, 20)}...`
											: file.name}
									</p>
									<button
										onClick={() =>
											setFiles((prevFiles) =>
												prevFiles.filter((_, i) => i !== index),
											)
										}>
										<DeleteOutlineIcon />
									</button>
								</div>
							))
						) : (
							<>
								<p>Список пока пуст</p>
							</>
						)}
					</div>
				</List>
			</Collapse>
			{/* Hide input file after upload */}
			<input type="file" style={{display: 'none'}} />
		</>
	)
}

export default FileNLinks
