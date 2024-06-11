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
	alreadyUploaded?: {file: any; name: string; size: number; type: string}[]
	callback?: (file: any, name: string, size: number, type: string) => void
	typeCard?: string
	submitLinks?: () => void
	deleteLink?: (link: string, index: number) => void
	linksArray?: string[]
	fileInputId?: string
}

const FileNLinks: React.FC<IFileNLinks> = ({
	className,
	alreadyUploaded,
	callback,
	typeCard = 'student',
	submitLinks,
	linksArray,
	deleteLink,
	fileInputId,
}: IFileNLinks) => {
	const [open, setOpen] = useState<boolean>(false)
	const [files, setFiles] = useState<any>([])
	const [links, setLinks] = useState<string[]>([])
	const [contextMenu, setContextMenu] = useState<{
		mouseX: number
		mouseY: number
	}>({mouseX: 0, mouseY: 0})
	const [pasteLinkModalOpen, setPasteLinkModalOpen] = useState<boolean>(false)
	const [linkValue, setLinkValue] = useState<string>('')

	const user = useSelector((state: any) => state.user)
	const token = user.token

	const modalRef = useRef(null)
	const inputRef = useRef<HTMLInputElement>(null)

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

	const handleClickOutside = (event) => {
		if (modalRef.current && !modalRef.current.contains(event.target)) {
			setContextMenu({mouseX: 0, mouseY: 0})
		}
	}

	useEffect(() => {
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	const getFileLinkById = (id: string) => {
		const baseLinkToThisSite = `${window.location.origin}:3000`
		window.open(`${baseLinkToThisSite}/files/${id}`, '_blank')
	}

	const openLocalFile = (file: any) => {
		const url = URL.createObjectURL(file)
		window.open(url, '')
	}

	const handlePaste = (event: ClipboardEvent) => {
		const pastedText = event.clipboardData?.getData('Text')
		if (pastedText) {
			setLinkValue(pastedText)
		}
	}

	const handleSubmit = () => {
		setLinks((prevLinks) => [...prevLinks, linkValue])
		submitLinks && submitLinks([...links, linkValue])
		setLinkValue('')
		setPasteLinkModalOpen(false)
	}

	useEffect(() => {
		linksArray && setLinks(linksArray)
	}, [linksArray])

	useEffect(() => {
		console.log(
			'\n------------alreadyUploaded----------------\n',
			alreadyUploaded,
			'\n------------alreadyUploaded----------------\n',
		)
		setFiles(alreadyUploaded)
		console.log(files)
	}, [alreadyUploaded])
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
					onChange={(e) => {
						const DefFiles = Array.from(e.target.files)

						DefFiles.forEach((file) => {
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
						})
					}}
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
					<div className={s.FileList}>
						{files.length ? (
							files.map((file: any, index: number) => (
								<>
									<div
										key={index}
										className={s.FileItem}
										onClick={() => {
											if (file.id) {
												getFileLinkById(file.id)
											} else {
												openLocalFile(file.file)
											}
										}}>
										<p>
											{file.name.length > 20
												? `${file.name.slice(0, 20)}...`
												: file.name}
										</p>
										<button
											onClick={() => {
												setFiles((prevFiles) =>
													prevFiles.filter((_, i) => i !== index),
												)
												sendDelete(file.id)
											}}>
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
									Список файлов пока пуст
								</p>
							</>
						)}
					</div>
					<Line width="100%" className={s.Line} />
					<div className={s.LinkList}>
						{links.length ? (
							links.map((link: string, index: number) => (
								<>
									<div key={index} className={s.LinkItem}>
										<a href={link} target="_blank" rel="noopener noreferrer">
											{link}
										</a>
										<button
											onClick={() => {
												setLinks((prevLinks) =>
													prevLinks.filter((_, i) => i !== index),
												)
												deleteLink && deleteLink(link, index)
											}}>
											<DeleteOutlineIcon />
										</button>
									</div>
									{index === links.length - 1 && (
										<Line width="100%" className={s.FileLine} />
									)}
								</>
							))
						) : (
							<>
								<p style={{textAlign: 'center', width: '100%'}}>
									Список ссылок пока пуст
								</p>
							</>
						)}
					</div>
				</List>
			</Collapse>
			<button onClick={() => setPasteLinkModalOpen(true)}>
				Вставить ссылку из буфера
			</button>
			{contextMenu.mouseX !== 0 && contextMenu.mouseY !== 0 && (
				<div
					ref={modalRef}
					style={{
						position: 'absolute',
						left: contextMenu.mouseX,
						top: contextMenu.mouseY,
						backgroundColor: 'white',
						padding: '10px',
						border: '1px solid gray',
						boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
					}}>
					<input
						ref={inputRef}
						type="text"
						value={linkValue}
						onChange={(e) => setLinkValue(e.target.value)}
						onPaste={handlePaste}
						placeholder="Вставьте ссылку..."
					/>
					<button onClick={handleSubmit} style={{marginRight: '10px'}}>
						Отправить
					</button>
					<button onClick={() => setPasteLinkModalOpen(false)}>Отменить</button>
				</div>
			)}
			<input type="file" style={{display: 'none'}} />
		</>
	)
}

export default FileNLinks
