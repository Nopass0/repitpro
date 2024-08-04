import React, {useState, useRef} from 'react'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/ui/context-menu'
import {Button} from '@/ui/button'
import {
	CloudUpload,
	ClipboardPaste,
	File,
	Trash2,
	Link,
	Upload,
} from 'lucide-react'
import {motion, AnimatePresence} from 'framer-motion'

const Uploader = () => {
	const [items, setItems] = useState([])
	const [isDragging, setIsDragging] = useState(false)
	const fileInputRef = useRef(null)
	const dropAreaRef = useRef(null)

	const handleDragEnter = (e) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)
	}

	const handleDragLeave = (e) => {
		e.preventDefault()
		e.stopPropagation()
		if (e.target === dropAreaRef.current) {
			setIsDragging(false)
		}
	}

	const handleDragOver = (e) => {
		e.preventDefault()
		e.stopPropagation()
	}

	const handleDrop = (e) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)

		const files = Array.from(e.dataTransfer.files)
		addItems(files)
	}

	const handleFileInput = (e) => {
		const files = Array.from(e.target.files)
		addItems(files)
	}

	const addItems = (newItems) => {
		const itemsToAdd = newItems.map((item) => ({
			id: Math.random().toString(36).substr(2, 9),
			name: item.name || 'Unnamed item',
			type: item instanceof File ? 'file' : 'link',
			content: item,
			date: new Date().toLocaleString(),
		}))
		setItems((prev) => [...prev, ...itemsToAdd])
	}

	const removeItem = (id) => {
		setItems((prev) => prev.filter((item) => item.id !== id))
	}

	const handlePasteLink = () => {
		navigator.clipboard.readText().then((text) => {
			if (text.startsWith('http://') || text.startsWith('https://')) {
				addItems([{name: text, type: 'link'}])
			}
		})
	}

	return (
		<div className="w-[300px]">
			<div
				ref={dropAreaRef}
				onDragEnter={handleDragEnter}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onDrop={handleDrop}
				className="relative">
				<ContextMenu>
					<ContextMenuTrigger>
						<motion.div
							whileHover={{scale: 1.02}}
							className={`h-[56px] flex flex-row items-center transition-colors ${
								isDragging ? 'bg-secondary' : 'hover:bg-secondary'
							} rounded-md cursor-pointer border ${isDragging ? 'border-dashed border-primary' : 'border-transparent'}`}
							onClick={() => fileInputRef.current.click()}>
							<CloudUpload className="h-10 w-7 bg-primary text-primary-foreground p-2 rounded-md ml-2" />
							<div
								className={`flex flex-col ml-2 flex-grow ${isDragging ? 'hidden' : 'block'}`}>
								<p className="font-medium">Загрузить файл</p>
								<p className="font-normal text-xs text-muted-foreground">
									По нажатию на правую кнопку мыши можно вставить ссылку
								</p>
							</div>
							{isDragging && (
								<div className="flex items-center justify-center w-full">
									<Upload className="mr-2 h-5 w-5 text-primary" />
									<p className="text-primary">Отпустите файлы здесь</p>
								</div>
							)}
						</motion.div>
					</ContextMenuTrigger>

					<input
						type="file"
						ref={fileInputRef}
						onChange={handleFileInput}
						className="hidden"
						multiple
					/>

					<ContextMenuContent className="w-52">
						<ContextMenuItem onClick={handlePasteLink}>
							<ClipboardPaste className="mr-2 h-4 w-4" />
							<span>Вставить ссылку</span>
						</ContextMenuItem>
						<ContextMenuItem onClick={() => fileInputRef.current.click()}>
							<File className="mr-2 h-4 w-4" />
							<span>Вставить файл</span>
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			</div>

			<AnimatePresence>
				{items.length > 0 && (
					<motion.div
						initial={{opacity: 0, y: -10}}
						animate={{opacity: 1, y: 0}}
						exit={{opacity: 0, y: -10}}
						className="mt-4 p-2 bg-secondary rounded-md">
						{items.map((item) => (
							<motion.div
								key={item.id}
								initial={{opacity: 0, y: -10}}
								animate={{opacity: 1, y: 0}}
								exit={{opacity: 0, y: -10}}
								className="flex items-center justify-between py-2 border-b border-input last:border-b-0">
								<div className="flex items-center">
									{item.type === 'file' ? (
										<File className="text-primary mr-2" size={20} />
									) : (
										<Link className="text-primary mr-2" size={20} />
									)}
									<div>
										<p className="text-sm font-medium truncate w-48">
											{item.name}
										</p>
										<p className="text-xs text-muted-foreground">{item.date}</p>
									</div>
								</div>
								<Button
									variant="ghost"
									size="icon"
									className="hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
									onClick={() => removeItem(item.id)}>
									<Trash2 size={16} />
								</Button>
							</motion.div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default Uploader
