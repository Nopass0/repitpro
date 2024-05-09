import {useEffect, useState} from 'react'
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
	alreadyUploaded?: {file: any; name: string; size: number; type: string}[]
	callback?: (file: any, name: string, size: number, type: string) => void
}

const FileNLinks: React.FC<IFileNLinks> = ({
	className,
	alreadyUploaded,
	callback,
}: IFileNLinks) => {
	const [open, setOpen] = useState<boolean>(false)
	const [files, setFiles] = useState<any>([])
	const [filesToUpload, setFilesToUpload] = useState<
		{name: string; type: string; size: number; file: any}[]
	>([])
	const handleClick = () => {
		setOpen(!open)
	}

	useEffect(() => {
		console.log(
			'\n------------alreadyUploaded----------------\n',
			alreadyUploaded,
			'\n------------alreadyUploaded----------------\n',
		)
		setFiles(alreadyUploaded)
		console.log(files)
	}, [alreadyUploaded])

	const idRdn = Math.random().toString()

	return (
		<>
			<ListItemButton
				className={className}
				style={{marginTop: '10px'}}
				onClick={handleClick}>
				<input
					type="file"
					//random id
					id={idRdn}
					multiple
					style={{display: 'none'}}
					onChange={(e) => {
						const DefFiles = Array.from(e.target.files)

						DefFiles.forEach((file) => {
							// setFilesToUpload((prevFiles) => [
							// 	...prevFiles,
							// 	{name: file.name, type: file.type, size: file.size, file: file},
							// ])
							callback && callback(file, file.name, file.type, file.size)
							setFiles((prevFiles: any) => [
								...prevFiles,
								{
									name: file.name,
									type: file.type,
									size: file.size,
									file: file,
								},
							])
							// const fileReader = new FileReader()
							// fileReader.onload = () => {
							// 	const arrayBuffer = fileReader.result as ArrayBuffer
							// 	const byteArray = new Uint8Array(arrayBuffer)
							// 	const blob = new Blob([byteArray])
							// 	const url = URL.createObjectURL(blob)
							// 	setFiles((prevFiles) => [...prevFiles, {name: file.name, url}])
							// }
							// fileReader.readAsArrayBuffer(file)
						})
					}}
				/>
				<label
					htmlFor={idRdn}
					style={{cursor: 'pointer'}}
					className={s.LabelForFile}>
					<img src={uploadFile} className={s.ImgForFile} alt={uploadFile} />
				</label>
				<ListItemText primary="Файлы/ссылки" />
				{open ? <ExpandLess /> : <ExpandMore />}
			</ListItemButton>

			<Collapse in={open} timeout="auto" unmountOnExit>
				<List
					style={{
						display: 'flex',
						// alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'column',
					}}
					component="div"
					disablePadding>
					<Line width="100%" className={s.Line} />
					<div className={s.FileList}>
						{files.length ? (
							files.map((file, index) => (
								<>
									<div key={index} className={s.FileItem}>
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
									{index === files.length - 1 && (
										<Line width="100%" className={s.FileLine} />
									)}
								</>
							))
						) : (
							<>
								<p style={{textAlign: 'center', width: '100%'}}>
									Список пока пуст
								</p>
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
