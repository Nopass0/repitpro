import React, {useRef, useState} from 'react'
import {motion} from 'framer-motion'
import {Upload, X, File, Link2, Music} from 'lucide-react'
import {Button} from '@/ui/button'
import {ScrollArea} from '@/ui/scroll-area'
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@/ui/context-menu'
import {cn} from '@/lib/utils'
import {StorageItem} from '@/types/student'

interface FileUploaderProps {
	onNewFile: (file: File) => void
	files: StorageItem[]
	className?: string
}

const getFileIcon = (type: string) => {
	if (type === 'audio') return Music
	if (type === 'link') return Link2
	return File
}

const getFileColor = (type: string) => {
	if (type === 'audio') return 'text-purple-500'
	if (type === 'link') return 'text-blue-500'
	return 'text-gray-500'
}

export const FileUploader: React.FC<FileUploaderProps> = ({
	onNewFile,
	files = [],
	className,
}) => {
	const [isDragging, setIsDragging] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const handleDragEnter = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(true)
	}

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)
	}

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setIsDragging(false)

		const droppedFiles = Array.from(e.dataTransfer.files)
		droppedFiles.forEach((file) => onNewFile(file))
	}

	const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files?.length) {
			Array.from(e.target.files).forEach((file) => onNewFile(file))
			// Reset input value to allow uploading the same file multiple times
			e.target.value = ''
		}
	}

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return ''
		const units = ['B', 'KB', 'MB', 'GB']
		let size = bytes
		let unitIndex = 0
		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024
			unitIndex++
		}
		return `${size.toFixed(1)} ${units[unitIndex]}`
	}

	return (
		<div className={cn('space-y-4', className)}>
			<motion.div
				animate={{
					scale: isDragging ? 1.02 : 1,
					borderColor: isDragging ? 'rgb(34, 197, 94)' : 'rgb(226, 232, 240)',
				}}
				className={cn(
					'relative rounded-md border-2 border-dashed transition-colors',
					isDragging ? 'bg-green-50' : 'bg-transparent',
				)}
				onDragEnter={handleDragEnter}
				onDragLeave={handleDragLeave}
				onDragOver={handleDragOver}
				onDrop={handleDrop}>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					multiple
					onChange={handleFileInputChange}
				/>
				<Button
					variant="outline"
					className="w-full"
					onClick={() => fileInputRef.current?.click()}>
					<Upload className="h-4 w-4 mr-2" />
					{isDragging ? 'Отпустите файлы здесь' : 'Загрузить файлы'}
				</Button>
			</motion.div>
		</div>
	)
}

export default FileUploader
