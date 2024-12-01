import {cn} from '@/lib/utils'
import {StorageItem} from '@/types/student'
import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuItem,
} from '@/ui/context-menu'
import {ScrollArea} from '@/ui/scroll-area'
import {AnimatePresence, motion} from 'framer-motion'
import {
	Volume2,
	Link2,
	ChevronUp,
	ChevronDown,
	Square,
	Mic,
	File,
	X,
	Play,
	Pause,
	ExternalLink,
} from 'lucide-react'
import React, {useRef, useState, useEffect} from 'react'
import {Button} from '@/ui/button'
import FileUploader from '../FileUploader'

// Компонент для аудио файла
const AudioFile: React.FC<{
	file: StorageItem
	onRemove: (id: string) => void
}> = ({file, onRemove}) => {
	const [isPlaying, setIsPlaying] = useState(false)
	const [duration, setDuration] = useState<number | null>(null)
	const [currentTime, setCurrentTime] = useState(0)
	const audioRef = useRef<HTMLAudioElement | null>(null)

	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		const handleLoadedMetadata = () => {
			if (audio.duration && !isNaN(audio.duration)) {
				setDuration(audio.duration)
			}
		}

		const handleTimeUpdate = () => {
			if (audio.currentTime && !isNaN(audio.currentTime)) {
				setCurrentTime(audio.currentTime)
			}
		}

		const handleEnded = () => {
			setIsPlaying(false)
			setCurrentTime(0)
		}

		audio.addEventListener('loadedmetadata', handleLoadedMetadata)
		audio.addEventListener('timeupdate', handleTimeUpdate)
		audio.addEventListener('ended', handleEnded)

		return () => {
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
			audio.removeEventListener('timeupdate', handleTimeUpdate)
			audio.removeEventListener('ended', handleEnded)
		}
	}, [])

	const togglePlay = (e: React.MouseEvent) => {
		e.stopPropagation()
		if (audioRef.current) {
			if (isPlaying) {
				audioRef.current.pause()
			} else {
				audioRef.current.play()
			}
			setIsPlaying(!isPlaying)
		}
	}

	const formatTime = (time: number) => {
		if (!time || isNaN(time)) return '00:00'
		const minutes = Math.floor(time / 60)
		const seconds = Math.floor(time % 60)
		return `${minutes}:${seconds.toString().padStart(2, '0')}`
	}

	return (
		<motion.div
			layout
			initial={{opacity: 0, y: -10}}
			animate={{opacity: 1, y: 0}}
			exit={{opacity: 0, y: 10}}
			className="flex items-center max-w-[310px] justify-between p-2 rounded-lg hover:bg-gray-50 group">
			<div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8 shrink-0"
					onClick={togglePlay}>
					{isPlaying ? (
						<Pause className="h-4 w-4 text-purple-500" />
					) : (
						<Play className="h-4 w-4 text-purple-500" />
					)}
				</Button>

				<div className="flex flex-col min-w-0 flex-1">
					<span className="font-medium truncate text-sm">{file.name}</span>
					<div className="flex items-center gap-2 w-full">
						<span className="text-xs text-gray-500 w-8 shrink-0">
							{formatTime(currentTime)}
						</span>
						<div className="flex-1 h-1 bg-gray-200 rounded-full min-w-[40px]">
							<div
								className="h-full bg-purple-500 rounded-full"
								style={{
									width: `${duration ? (currentTime / duration) * 100 : 0}%`,
								}}
							/>
						</div>
						<span className="text-xs text-gray-500 w-8 shrink-0">
							{formatTime(duration || 0)}
						</span>
					</div>
				</div>
			</div>

			<audio ref={audioRef} src={file.url} preload="metadata" />

			<Button
				variant="ghost"
				size="icon"
				className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0"
				onClick={(e) => {
					e.stopPropagation()
					if (isPlaying && audioRef.current) {
						audioRef.current.pause()
					}
					onRemove(file.id)
				}}>
				<X className="h-4 w-4" />
			</Button>
		</motion.div>
	)
}

// Компонент для файла или ссылки
const FileOrLink: React.FC<{
	file: StorageItem
	onRemove: (id: string) => void
}> = ({file, onRemove}) => {
	const handleClick = () => {
		if (file.url) {
			window.open(file.url, '_blank')
		}
	}

	const getFileIcon = (type: string) => {
		switch (type) {
			case 'link':
				return <Link2 className="h-4 w-4 text-blue-500" />
			default:
				return <File className="h-4 w-4 text-gray-500" />
		}
	}

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return ''
		const k = 1024
		const sizes = ['B', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
	}

	return (
		<motion.div
			layout
			initial={{opacity: 0, y: -10}}
			animate={{opacity: 1, y: 0}}
			exit={{opacity: 0, y: 10}}
			className="flex items-center max-w-[310px] justify-between p-2 rounded-lg hover:bg-gray-50 group cursor-pointer"
			onClick={handleClick}>
			<div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
				<span className="shrink-0">{getFileIcon(file.type)}</span>
				<div className="flex flex-col min-w-0 flex-1">
					<span className="font-medium truncate text-sm">{file.name}</span>
					{file.size && (
						<span className="text-xs text-gray-500">
							{formatFileSize(file.size)}
						</span>
					)}
				</div>
				{file.type === 'link' && (
					<ExternalLink className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
				)}
			</div>

			<Button
				variant="ghost"
				size="icon"
				className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0"
				onClick={(e) => {
					e.stopPropagation()
					onRemove(file.id)
				}}>
				<X className="h-4 w-4" />
			</Button>
		</motion.div>
	)
}

export const StudentMedia: React.FC<{
	files: StorageItem[]
	isExpanded: boolean
	onToggle: () => void
	onFileUpload: (file: File) => void
	onLinkAdd: (url: string) => void
	onAudioRecord: (blob: Blob) => void
	onItemRemove: (id: string) => void
	sortBy: 'name' | 'type'
	onSortChange: (sort: 'name' | 'type') => void
}> = ({
	files,
	isExpanded,
	onToggle,
	onFileUpload,
	onLinkAdd,
	onAudioRecord,
	onItemRemove,
	sortBy,
	onSortChange,
}) => {
	const [isRecording, setIsRecording] = useState(false)
	const [recordingTime, setRecordingTime] = useState(0)
	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])
	const timerRef = useRef<NodeJS.Timer>()

	const startRecording = async () => {
		try {
			const stream = await navigator.mediaDevices.getUserMedia({audio: true})
			const mediaRecorder = new MediaRecorder(stream)
			mediaRecorderRef.current = mediaRecorder
			audioChunksRef.current = []

			mediaRecorder.ondataavailable = (e) => {
				if (e.data.size > 0) {
					audioChunksRef.current.push(e.data)
				}
			}

			mediaRecorder.onstop = () => {
				const audioBlob = new Blob(audioChunksRef.current, {
					type: 'audio/webm',
				})
				onAudioRecord(audioBlob)
				stream.getTracks().forEach((track) => track.stop())
				setRecordingTime(0)
			}

			mediaRecorder.start(10)
			setIsRecording(true)

			timerRef.current = setInterval(() => {
				setRecordingTime((prev) => prev + 1)
			}, 1000)
		} catch (err) {
			console.error('Failed to start recording:', err)
		}
	}

	const stopRecording = () => {
		if (
			mediaRecorderRef.current &&
			mediaRecorderRef.current.state !== 'inactive'
		) {
			mediaRecorderRef.current.stop()
			setIsRecording(false)
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}
		}
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs
			.toString()
			.padStart(2, '0')}`
	}

	const sortedFiles = [...files].sort((a, b) => {
		if (sortBy === 'name') {
			return a.name.localeCompare(b.name)
		}
		return a.type.localeCompare(b.type)
	})

	return (
		<div className="space-y-4 max-w-full">
			<div
				className="flex items-center justify-between cursor-pointer"
				onClick={onToggle}>
				<h3 className="text-lg font-medium">Файлы и материалы</h3>
				{isExpanded ? <ChevronUp /> : <ChevronDown />}
			</div>

			<AnimatePresence>
				{isExpanded && (
					<motion.div
						initial={{height: 0, opacity: 0}}
						animate={{height: 'auto', opacity: 1}}
						exit={{height: 0, opacity: 0}}
						className="overflow-hidden">
						<div className="flex items-center gap-2 mb-4">
							<div className="w-48">
								<ContextMenu>
									<ContextMenuTrigger>
										<FileUploader onNewFile={onFileUpload} files={files} />
									</ContextMenuTrigger>
									<ContextMenuContent>
										<ContextMenuItem
											onClick={async () => {
												try {
													const text = await navigator.clipboard.readText()
													if (text.startsWith('http')) {
														onLinkAdd(text)
													}
												} catch (err) {
													console.error('Failed to read clipboard:', err)
												}
											}}>
											<Link2 className="mr-2 h-4 w-4" />
											Вставить ссылку
										</ContextMenuItem>
									</ContextMenuContent>
								</ContextMenu>
							</div>

							<Button
								variant={isRecording ? 'destructive' : 'outline'}
								onClick={isRecording ? stopRecording : startRecording}
								className={cn(
									'flex items-center gap-2 justify-center w-36',
									isRecording && 'animate-pulse',
								)}>
								{isRecording ? (
									<>
										<Square className="h-4 w-4 shrink-0" />
										<span className="text-sm font-medium">
											{formatTime(recordingTime)}
										</span>
									</>
								) : (
									<>
										<Mic className="h-4 w-4 shrink-0" />
										<span className="text-sm font-medium">Запись</span>
									</>
								)}
							</Button>
						</div>

						{files.length > 0 && (
							<>
								<div className="flex justify-end gap-2 mb-2">
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onSortChange('name')}
										className={sortBy === 'name' ? 'bg-gray-100' : ''}>
										По имени
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onClick={() => onSortChange('type')}
										className={sortBy === 'type' ? 'bg-gray-100' : ''}>
										По типу
									</Button>
								</div>

								<ScrollArea className="h-[200px] rounded-md border">
									<div className="p-4 space-y-2">
										{sortedFiles.map((file) =>
											file.type === 'audio' ? (
												<AudioFile
													key={file.id}
													file={file}
													onRemove={onItemRemove}
												/>
											) : (
												<FileOrLink
													key={file.id}
													file={file}
													onRemove={onItemRemove}
												/>
											),
										)}
									</div>
								</ScrollArea>
							</>
						)}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}

export default StudentMedia
