import React, {useEffect, useState, useRef} from 'react'
import s from './index.module.scss'
import {Collapse, List, ListItemButton, ListItemText} from '@mui/material'
import Line from '../Line'
import uploadFile from '../../assets/UploadFile.svg'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import socket from '../../socket'
import {useSelector} from 'react-redux'

interface IFileNLinks {
	className?: string
	alreadyUploaded?: {
		id?: string
		name: string
		size?: number
		type: string
		isLink?: boolean
	}[]
	callback?: (file: any, name: string, size: number, type: string) => void
	typeCard?: string
	submitLinks?: (links: string[]) => void
	deleteItem?: (item: any, index: number) => void
	fileInputId?: string
}

const FileNLinks: React.FC<IFileNLinks> = ({
	className,
	alreadyUploaded,
	callback,
	typeCard = 'student',
	submitLinks,
	deleteItem,
	fileInputId,
}: IFileNLinks) => {
	const [open, setOpen] = useState<boolean>(false)
	const [items, setItems] = useState<any[]>([])
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number
		mouseY: number
	} | null>(null)

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const handleClick = () => {
		setOpen(!open)
	}

	const sendDelete = (id: string) => {
		socket.emit('deleteAudio', {
			token,
			id,
			type: typeCard,
		})
	}

	const getFileLinkById = (id: string) => {
		const baseLinkToThisSite = `${window.location.origin}`
		window.open(`${baseLinkToThisSite}/files/${id}`, '_blank')
	}

	const openLocalFile = (file: any) => {
		const url = URL.createObjectURL(file)
		window.open(url, '')
	}

	const handleAddLink = async () => {
		try {
			const text = await navigator.clipboard.readText()
			if (text && text.trim() !== '') {
				const newItem = {name: text, isLink: true, type: 'link'}
				setItems((prevItems) => [...prevItems, newItem])
				submitLinks &&
					submitLinks([
						...items.filter((item) => item.isLink).map((item) => item.name),
						text,
					])
			} else {
				alert('Буфер обмена пуст или не содержит текст.')
			}
		} catch (err) {
			console.error('Failed to read clipboard contents: ', err)
			alert('Не удалось прочитать содержимое буфера обмена.')
		}
		setContextMenu(null)
	}

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const DefFiles = Array.from(e.target.files || [])
		DefFiles.forEach((file: File) => {
			callback && callback(file, file.name, file.size, file.type)
			setItems((prevItems) => [
				...prevItems,
				{
					name: file.name,
					type: file.type,
					size: file.size,
					file: file,
					isLink: false,
				},
			])
		})

		// Обновляем ссылки после добавления файлов
		const updatedLinks = [
			...items.filter((item) => item.isLink).map((item) => item.name),
			...DefFiles.map((file) => file.name),
		]
		submitLinks && submitLinks(updatedLinks)
	}

	useEffect(() => {
		if (alreadyUploaded) {
			setItems(alreadyUploaded)
		}
	}, [alreadyUploaded])
	
	useEffect(() => {
		console.log(items)
	},[items])
	return (
		<>
			<ListItemButton
				className={className}
				style={{marginTop: '10px'}}
				onClick={handleClick}
				onContextMenu={(event) => {
					event.preventDefault()
					setContextMenu({mouseX: event.clientX, mouseY: event.clientY})
				}}>
				<input
					type="file"
					id={`fileInput__${fileInputId}`}
					multiple
					style={{display: 'none'}}
					onChange={
						handleFileChange
						// 	(e) => {
						// 	const DefFiles = Array.from(e.target.files)
						// 	DefFiles.forEach((file: any) => {
						// 		callback && callback(file, file.name, file.type, file.size)
						// 		setItems((prevItems) => [
						// 			...prevItems,
						// 			{
						// 				name: file.name,
						// 				type: file.type,
						// 				size: file.size,
						// 				file: file,
						// 				isLink: false,
						// 			},
						// 		])
						// 	})
						// }
					}
				/>
				<label
					htmlFor={`fileInput__${fileInputId}`}
					style={{cursor: 'pointer'}}
					className={s.LabelForFile}
					onContextMenu={(event) => {
						event.preventDefault()
						setContextMenu({mouseX: event.clientX, mouseY: event.clientY})
					}}>
					<img src={uploadFile} className={s.ImgForFile} alt={uploadFile} />
				</label>
				<ListItemText primary="Файлы/ссылки" />
				{open ? <ExpandLess /> : <ExpandMore />}
			</ListItemButton>

			<Collapse in={open} timeout="auto" unmountOnExit>
				<List
					style={{
						display: 'flex',
						justifyContent: 'center',
						flexDirection: 'column',
					}}
					component="div"
					disablePadding>
					<Line width="100%" className={s.Line} />
					<div className={s.ItemList}>
						{items.length ? (
							items.map((item: any, index: number) => (
								<React.Fragment key={index}>
									<div
										className={s.Item}
										onClick={() => {
											if (item.isLink) {
												window.open(item.name, '_blank')
											} else if (item.id) {
												getFileLinkById(item.id)
											} else {
												openLocalFile(item.file)
											}
										}}>
										<p>
											{item.name.length > 20
												? `${item.name.slice(0, 20)}...`
												: item.name}
										</p>
										<button
											onClick={(e) => {
												e.stopPropagation()
												setItems((prevItems) =>
													prevItems.filter((_, i) => i !== index),
												)
												if (item.id) sendDelete(item.id)
												deleteItem && deleteItem(item, index)
											}}>
											<DeleteOutlineIcon />
										</button>
									</div>
									{index !== items.length - 1 && (
										<Line width="100%" className={s.ItemLine} />
									)}
								</React.Fragment>
							))
						) : (
							<p style={{textAlign: 'center', width: '100%'}}>
								Список файлов и ссылок пока пуст
							</p>
						)}
					</div>
				</List>
			</Collapse>
			{contextMenu && (
				<div
					style={{
						position: 'absolute',
						left: contextMenu.mouseX,
						top: contextMenu.mouseY,
						backgroundColor: 'white',
						padding: '10px',
						border: '1px solid gray',
						boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
					}}>
					<p>Вставить ссылку из буфера обмена?</p>
					<button onClick={handleAddLink} style={{marginRight: '10px'}}>
						Да
					</button>
					<button onClick={() => setContextMenu(null)}>Нет</button>
				</div>
			)}
		</>
	)
}

export default FileNLinks
