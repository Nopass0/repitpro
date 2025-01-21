import type React from 'react'
import {useState, useRef, useEffect} from 'react'
import {motion} from 'framer-motion'
import {
	ChevronLeft,
	ChevronRight,
	X,
	Plus,
	Copy,
	Trash2,
	Home,
	Users,
	Video,
	PlusIcon,
	Volume2,
	Link2,
	ChevronUp,
	ChevronDown,
	Square,
	Mic,
	File,
	Play,
	Pause,
	ExternalLink,
} from 'lucide-react'
import {Button} from '@/ui/button'
import {ScrollArea} from '@/ui/scroll-area'
import {Separator} from '@/ui/separator'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/ui/select'
import {Input} from '@/ui/input'
import {Checkbox} from '@/ui/checkbox'
import {cn} from '@/lib/utils'
import {
	ContextMenu,
	ContextMenuTrigger,
	ContextMenuContent,
	ContextMenuItem,
} from '@/ui/context-menu'
import {Popover, PopoverContent, PopoverTrigger} from '@/ui/popover'

import type {StorageItem} from '@/types/student'
import FileUploader from '../FileUploader'

// AudioFile component
const AudioFile: React.FC<{
	file: StorageItem
	onRemove: (id: string) => void
}> = ({file, onRemove}) => {
	const [isPlaying, setIsPlaying] = useState(false)
	const [duration, setDuration] = useState<number | null>(null)
	const [currentTime, setCurrentTime] = useState(0)
	const [isPopoverOpen, setIsPopoverOpen] = useState(false) // Added state
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

			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				{' '}
				{/* Changed Popover */}
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="opacity-100 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0"
						onClick={(e) => {
							e.stopPropagation()
							if (isPlaying && audioRef.current) {
								audioRef.current.pause()
							}
						}}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<div className="p-4">
						<p className="text-sm font-medium mb-2">Удалить аудио файл?</p>
						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={(e) => {
									e.stopPropagation()
									setIsPopoverOpen(false) // Changed onClick
								}}>
								Отмена
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={(e) => {
									e.stopPropagation()
									onRemove(file.id)
								}}>
								Удалить
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</motion.div>
	)
}

// FileOrLink component
const FileOrLink: React.FC<{
	file: StorageItem
	onRemove: (id: string) => void
}> = ({file, onRemove}) => {
	const [isPopoverOpen, setIsPopoverOpen] = useState(false) // Added state
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
		return `${Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
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

			<Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
				{' '}
				{/* Changed Popover */}
				<PopoverTrigger asChild>
					<Button
						variant="ghost"
						size="icon"
						className="opacity-100 group-hover:opacity-100 transition-opacity h-8 w-8 shrink-0"
						onClick={(e) => {
							e.stopPropagation()
						}}>
						<Trash2 className="h-4 w-4" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<div className="p-4">
						<p className="text-sm font-medium mb-2">
							Удалить {file.type === 'link' ? 'ссылку' : 'файл'}?
						</p>
						<div className="flex justify-end space-x-2">
							<Button
								variant="outline"
								size="sm"
								onClick={(e) => {
									e.stopPropagation()
									setIsPopoverOpen(false) // Changed onClick
								}}>
								Отмена
							</Button>
							<Button
								variant="destructive"
								size="sm"
								onClick={(e) => {
									e.stopPropagation()
									onRemove(file.id)
								}}>
								Удалить
							</Button>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</motion.div>
	)
}

// AudioListPopover component
const AudioListPopover: React.FC<{
	audioFiles: StorageItem[]
	onItemRemove: (id: string) => void
	onClose: () => void
}> = ({audioFiles, onItemRemove, onClose}) => {
	return (
		<PopoverContent className="w-80">
			<div className="flex items-center justify-between p-3 border-b">
				<h3 className="text-sm font-medium">Список аудио</h3>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<ScrollArea className="h-60">
				<div className="p-3 space-y-2">
					{audioFiles.map((file) => (
						<AudioFile key={file.id} file={file} onRemove={onItemRemove} />
					))}
				</div>
			</ScrollArea>
		</PopoverContent>
	)
}

// FileListPopover component
const FileListPopover: React.FC<{
	files: StorageItem[]
	onItemRemove: (id: string) => void
	onClose: () => void
}> = ({files, onItemRemove, onClose}) => {
	return (
		<PopoverContent className="w-80">
			<div className="flex items-center justify-between p-3 border-b">
				<h3 className="text-sm font-medium">Список файлов</h3>
				<Button
					variant="ghost"
					size="icon"
					className="h-8 w-8"
					onClick={onClose}>
					<X className="h-4 w-4" />
				</Button>
			</div>
			<ScrollArea className="h-60">
				<div className="p-3 space-y-2">
					{files.map((file) => (
						<FileOrLink key={file.id} file={file} onRemove={onItemRemove} />
					))}
				</div>
			</ScrollArea>
		</PopoverContent>
	)
}

// AudioRecorder component
const AudioRecorder: React.FC<{
	files: StorageItem[]
	onAudioRecord: (blob: Blob) => void
	onItemRemove: (id: string) => void
}> = ({files, onAudioRecord, onItemRemove}) => {
	const [isRecording, setIsRecording] = useState(false)
	const [recordingTime, setRecordingTime] = useState(0)
	const [isListening, setIsListening] = useState(false)
	const [isAudioListOpen, setIsAudioListOpen] = useState(false) // Added state
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
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const audioFiles = files
		.filter((f) => f.type === 'audio')
		.sort((a, b) => a.name.localeCompare(b.name))

	return (
		<div className="space-y-2 max-w-full">
			<div className="flex items-center gap-2">
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
				<Popover open={isAudioListOpen} onOpenChange={setIsAudioListOpen}>
					{' '}
					{/* Updated Popover */}
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="flex items-center gap-2 justify-center w-36">
							<Volume2 className="h-4 w-4 shrink-0" />
							<span className="text-sm font-medium">Слушать</span>
						</Button>
					</PopoverTrigger>
					<AudioListPopover
						audioFiles={audioFiles}
						onItemRemove={onItemRemove}
						onClose={() => setIsAudioListOpen(false)}
					/>
				</Popover>
			</div>
		</div>
	)
}

// FileAndLinkUploader component
const FileAndLinkUploader: React.FC<{
	files: StorageItem[]
	onFileUpload: (file: File) => void
	onLinkAdd: (url: string) => void
	onItemRemove: (id: string) => void
	sortBy: 'name' | 'type'
	onSortChange: (sort: 'name' | 'type') => void
}> = ({files, onFileUpload, onLinkAdd, onItemRemove, sortBy, onSortChange}) => {
	const [isViewingFiles, setIsViewingFiles] = useState(false)
	const [isFileListOpen, setIsFileListOpen] = useState(false)

	const sortedFiles = [...files]
		.filter((f) => f.type !== 'audio')
		.sort((a, b) => {
			if (sortBy === 'name') {
				return a.name.localeCompare(b.name)
			}
			return a.type.localeCompare(b.type)
		})

	return (
		<div className="space-y-2 max-w-full">
			<div className="flex items-center gap-2">
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
				<Popover open={isFileListOpen} onOpenChange={setIsFileListOpen}>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className="flex items-center gap-2 justify-center w-36">
							<File className="h-4 w-4 shrink-0" />
							<span className="text-sm font-medium">Просмотр файлов</span>
						</Button>
					</PopoverTrigger>
					<FileListPopover
						files={sortedFiles}
						onItemRemove={onItemRemove}
						onClose={() => setIsFileListOpen(false)}
					/>
				</Popover>
			</div>
		</div>
	)
}

export {AudioRecorder, FileAndLinkUploader}
