import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react'
import {motion, AnimatePresence} from 'framer-motion'
import {format, addDays, subDays} from 'date-fns'
import {ru} from 'date-fns/locale'
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
} from 'lucide-react'
import {useDispatch, useSelector} from 'react-redux'
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
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
} from '@/ui/dialog'
import {cn} from '@/lib/utils'
import {debounce} from 'lodash'

// Import icons
import icon1 from '@/assets/1.svg'
import icon2 from '@/assets/2.svg'
import icon3 from '@/assets/3.svg'
import icon4 from '@/assets/4.svg'
import icon5 from '@/assets/5.svg'
import icon6 from '@/assets/6.svg'

import socket from '@/socket'
import {ECurrentDayPopUp, EPagePopUpExit, ELeftMenuPage} from '@/types'

const LESSON_TYPES = {
	HOME: '1',
	HOME_STUDENT: '2',
	GROUP: '3',
	ONLINE: '4',
	GROUP_ONLINE: '5',
}

interface IDayCalendarPopUp {
	style?: React.CSSProperties
	onExit?: () => void
	iconClick?: () => void
	LineClick?: () => void
	className?: string
}

const LessonRow = ({
	lesson,
	isEditing,
	onToggleComplete,
	onCancel,
	onCopy,
	onUpdate,
	onRowClick,
	hiddenNum,
}) => {
	const [isHovered, setIsHovered] = useState(false)

	const handleTimeChange = (field, newTime) => {
		const [hours, minutes] = newTime.split(':')
		onUpdate(lesson.id, {
			[field]: {hour: parseInt(hours), minute: parseInt(minutes)},
		})
	}

	return (
		<motion.div
			initial={false}
			animate={{
				opacity: lesson.isCancelled ? 0.5 : 1,
				scale: 1,
			}}
			className={cn(
				'relative rounded-lg border p-4 transition-all',
				lesson.isCancelled && 'bg-red-50/50',
				lesson.isTest && 'border-green-500',
				isHovered && !lesson.isCancelled && 'bg-gray-50',
			)}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}>
			{lesson.isCancelled && (
				<div className="absolute -rotate-12 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border border-red-500 bg-red-500/10 px-3 py-1">
					<p className="text-sm font-medium text-red-500">Отменено</p>
				</div>
			)}

			{lesson.isTest && (
				<div className="absolute -rotate-12 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded border border-green-500 bg-green-500/10 px-3 py-1">
					<p className="text-sm font-medium text-green-500">Пробное</p>
				</div>
			)}

			<div className="flex items-center gap-4">
				{/* Icon selector */}
				{isEditing ? (
					<Select
						value={lesson.type}
						onValueChange={(value) => onUpdate(lesson.id, {type: value})}>
						<SelectTrigger className="w-[120px]">
							<div className="flex items-center gap-2">
								<img
									src={
										lesson.type === LESSON_TYPES.HOME
											? icon1
											: lesson.type === LESSON_TYPES.HOME_STUDENT
												? icon2
												: lesson.type === LESSON_TYPES.GROUP
													? icon3
													: lesson.type === LESSON_TYPES.ONLINE
														? icon4
														: icon5
									}
									alt={lesson.type}
									className="h-6 w-6"
								/>
							</div>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={LESSON_TYPES.HOME}>
								<div className="flex items-center gap-2">
									<Home className="h-4 w-4" />
									<span>Дома</span>
								</div>
							</SelectItem>
							<SelectItem value={LESSON_TYPES.HOME_STUDENT}>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									<span>У ученика</span>
								</div>
							</SelectItem>
							<SelectItem value={LESSON_TYPES.GROUP}>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									<span>Группа</span>
								</div>
							</SelectItem>
							<SelectItem value={LESSON_TYPES.ONLINE}>
								<div className="flex items-center gap-2">
									<Video className="h-4 w-4" />
									<span>Онлайн</span>
								</div>
							</SelectItem>
							<SelectItem value={LESSON_TYPES.GROUP_ONLINE}>
								<div className="flex items-center gap-2">
									<Users className="h-4 w-4" />
									<Video className="h-4 w-4 ml-1" />
									<span>Группа онлайн</span>
								</div>
							</SelectItem>
						</SelectContent>
					</Select>
				) : (
					<div
						className="shrink-0"
						onClick={() => !isEditing && onRowClick(lesson)}>
						<img
							src={
								lesson.type === LESSON_TYPES.HOME
									? icon1
									: lesson.type === LESSON_TYPES.HOME_STUDENT
										? icon2
										: lesson.type === LESSON_TYPES.GROUP
											? icon3
											: lesson.type === LESSON_TYPES.ONLINE
												? icon4
												: icon5
							}
							alt={lesson.type}
							className="h-10 w-10"
						/>
					</div>
				)}

				{/* Main content */}
				<div className="flex-1 grid grid-cols-[1fr_2fr_2fr_1fr] gap-4">
					{isEditing ? (
						<>
							<div className="flex items-center gap-2">
								<Input
									type="time"
									value={`${String(lesson.startTime.hour).padStart(2, '0')}:${String(lesson.startTime.minute).padStart(2, '0')}`}
									onChange={(e) =>
										handleTimeChange('startTime', e.target.value)
									}
									className="w-24"
								/>
								<span>-</span>
								<Input
									type="time"
									value={`${String(lesson.endTime.hour).padStart(2, '0')}:${String(lesson.endTime.minute).padStart(2, '0')}`}
									onChange={(e) => handleTimeChange('endTime', e.target.value)}
									className="w-24"
								/>
							</div>
							<Input
								value={lesson.studentName}
								onChange={(e) =>
									onUpdate(lesson.id, {studentName: e.target.value})
								}
								placeholder="Имя ученика"
							/>
							<Input
								value={lesson.subject}
								onChange={(e) => onUpdate(lesson.id, {subject: e.target.value})}
								placeholder="Предмет"
							/>
							<div className="flex items-center gap-2">
								<Input
									type="number"
									value={lesson.price}
									onChange={(e) => onUpdate(lesson.id, {price: e.target.value})}
									className="w-20"
									disabled={hiddenNum}
								/>
								<span className="text-gray-500">₽</span>
							</div>
						</>
					) : (
						<>
							<div
								className="text-sm cursor-pointer"
								onClick={() => !isEditing && onRowClick(lesson)}>
								{`${String(lesson.startTime.hour).padStart(2, '0')}:${String(lesson.startTime.minute).padStart(2, '0')}`}
								{' - '}
								{`${String(lesson.endTime.hour).padStart(2, '0')}:${String(lesson.endTime.minute).padStart(2, '0')}`}
							</div>
							<div
								className="font-medium cursor-pointer truncate"
								onClick={() => !isEditing && onRowClick(lesson)}>
								{lesson.studentName}
							</div>
							<div
								className="text-gray-600 truncate"
								onClick={() => !isEditing && onRowClick(lesson)}>
								{lesson.subject}
							</div>
							<div className="text-right">
								{!hiddenNum && <span>{lesson.price}₽</span>}
							</div>
						</>
					)}
				</div>

				{/* Actions */}
				<div className="flex items-center gap-2">
					<Checkbox
						checked={lesson.isCompleted}
						onCheckedChange={() => onToggleComplete(lesson.id)}
						disabled={lesson.isCancelled || isEditing}
					/>
					{(isHovered || isEditing) && !lesson.isCancelled && (
						<div className="flex items-center gap-1">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onCopy(lesson)}
								disabled={isEditing}>
								<Copy className="h-4 w-4" />
							</Button>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onCancel(lesson.id)}
								disabled={isEditing}
								className="text-red-500 hover:text-red-600">
								<Trash2 className="h-4 w-4" />
							</Button>
						</div>
					)}
				</div>
			</div>
		</motion.div>
	)
}

const ClientRow = ({client, isEditing, onRowClick, hiddenNum}) => {
	return (
		<div
			className="border rounded-lg p-4 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
			onClick={() => !isEditing && onRowClick(client)}>
			<div className="flex items-center gap-4">
				<img src={icon6} alt="Client" className="h-10 w-10" />
				<div className="flex-1">
					<div className="flex items-center justify-between mb-2">
						<h3 className="font-medium">{client.studentName}</h3>
						{!hiddenNum && <p className="font-medium">{client.workPrice}₽</p>}
					</div>
					<div className="text-sm text-gray-600">{client.itemName}</div>

					<div className="mt-2 flex items-center justify-between">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<span className="text-sm">Заказ принят</span>
								<Checkbox
									checked={client.workStages[0].firstPaymentPayed}
									disabled={isEditing}
								/>
							</div>
							<div className="flex items-center gap-2">
								<span className="text-sm">Оплачено</span>
								<Checkbox
									checked={client.workStages[0].endPaymentPayed}
									disabled={isEditing}
								/>
							</div>
						</div>
						<div className="w-12 h-12 flex items-center justify-center rounded-full bg-gray-100">
							<span className="text-sm font-medium">
								{Math.round((client.workPrice / client.totalWorkPrice) * 100)}%
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

// Основной компонент DayCalendarPopUp
const DayCalendarPopUp = ({
	style,
	onExit,
	iconClick,
	LineClick,
	className,
}: IDayCalendarPopUp) => {
	const dispatch = useDispatch()
	const mountedRef = useRef(false)
	const retryCountRef = useRef(0)

	// Redux state
	const user = useSelector((state: any) => state.user)
	const token = user?.token
	const calendarNowPopupDay = useSelector(
		(state: any) => state.calendarNowPopupDay,
	)
	const calendarNowPopupMonth = useSelector(
		(state: any) => state.calendarNowPopupMonth,
	)
	const calendarNowPopupYear = useSelector(
		(state: any) => state.calendarNowPopupYear,
	)
	const hiddenNum = useSelector((state: any) => state.hiddenNum)
	const isEditDayPopUp = useSelector((state: any) => state.isEditDayPopUp)
	const dayPopUpExit = useSelector((state: any) => state.dayPopUpExit)

	// Local state
	const [editMode, setEditMode] = useState(false)
	const [students, setStudents] = useState([])
	const [clients, setClients] = useState([])
	const [tempStudents, setTempStudents] = useState([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(null)
	const [editingNewLesson, setEditingNewLesson] = useState(null)
	const [pagePopup, setPagePopup] = useState(EPagePopUpExit.None)

	// Statistics
	const statistics = useMemo(() => {
		const activeStudents = students.filter((student) => !student.isCancel)
		return {
			lessonsCount: activeStudents.length,
			lessonsTotal: activeStudents.reduce(
				(sum, student) => sum + Number(student.costOneLesson || 0),
				0,
			),
			worksCount: clients?.length || 0,
			worksTotal:
				clients?.reduce(
					(sum, client) => sum + Number(client.workPrice || 0),
					0,
				) || 0,
		}
	}, [students, clients])

	// Data fetching
	const fetchData = useCallback(() => {
		console.log('Fetching data...')
		setIsLoading(true)
		setError(null)

		const params = {
			day: calendarNowPopupDay,
			month: calendarNowPopupMonth,
			year: calendarNowPopupYear,
			token,
		}

		socket.emit('getStudentsByDate', params)
		socket.emit('getClientsByDate', params)
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

	useEffect(() => {
		mountedRef.current = true
		return () => {
			mountedRef.current = false
		}
	}, [])

	// Socket event handlers
	useEffect(() => {
		const handleStudentsData = (data) => {
			if (mountedRef.current) {
				// Normalize data before setting
				const normalizedData = data.map((student) => ({
					...student,
					isCancel: Boolean(student.isCancel),
					costOneLesson: student.costOneLesson || '0',
					tryLessonCheck: Boolean(student.tryLessonCheck),
				}))
				setStudents(normalizedData)
				setIsLoading(false)
			}
		}

		const handleClientsData = (data) => {
			if (mountedRef.current) {
				setClients(data || [])
				setIsLoading(false)
			}
		}

		socket.on('getStudentsByDate', handleStudentsData)
		socket.on('getClientsByDate', handleClientsData)

		fetchData()

		return () => {
			socket.off('getStudentsByDate', handleStudentsData)
			socket.off('getClientsByDate', handleClientsData)
		}
	}, [calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token])

	// Navigation handlers
	const handleNavigateDay = (direction) => {
		const currentDate = new Date(
			calendarNowPopupYear,
			calendarNowPopupMonth - 1,
			calendarNowPopupDay,
		)
		const newDate =
			direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1)

		const newDay = String(newDate.getDate()).padStart(2, '0')
		const newMonth = String(newDate.getMonth() + 1).padStart(2, '0')
		const newYear = String(newDate.getFullYear())

		dispatch({
			type: 'SET_CALENDAR_NOW_POPUP',
			payload: {day: newDay, month: newMonth, year: newYear},
		})
		fetchData()
	}

	// Lesson handlers
	const handleLessonComplete = useCallback((lessonId) => {
		setStudents((prevStudents) => {
			return prevStudents.map((student) =>
				student.id === lessonId
					? {...student, tryLessonCheck: !student.tryLessonCheck}
					: student,
			)
		})
	}, [])

	const handleLessonCancel = useCallback(
		(lessonId) => {
			setPagePopup(EPagePopUpExit.Cancel)
			socket.emit('cancelLesson', {id: lessonId, token})

			setStudents((prevStudents) =>
				prevStudents.map((student) =>
					student.id === lessonId ? {...student, isCancel: true} : student,
				),
			)
		},
		[token],
	)

	const handleLessonCopy = useCallback(
		(lesson) => {
			socket.emit('createStudentSchedule', {
				token,
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				studentId: lesson.studentId,
				itemName: lesson.itemName,
				lessonsPrice: lesson.costOneLesson,
				studentName: lesson.nameStudent,
				copyBy: lesson.id,
			})
		},
		[calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token],
	)

	const handleLessonUpdate = useCallback(
		(lessonId, updates) => {
			setStudents((prevStudents) =>
				prevStudents.map((student) =>
					student.id === lessonId ? {...student, ...updates} : student,
				),
			)

			// Notify other components about the change
			socket.emit('studentScheduleChanged', {
				id: lessonId,
				...updates,
				day: calendarNowPopupDay,
				month: calendarNowPopupMonth,
				year: calendarNowPopupYear,
				token,
			})

			dispatch({type: 'SET_UPDATE_CARD', payload: true})
		},
		[calendarNowPopupDay, calendarNowPopupMonth, calendarNowPopupYear, token],
	)

	// Card navigation handlers
	const handleOpenStudentCard = (studentId) => {
		socket.emit('getGroupByStudentId', {token, studentId})
		dispatch({type: 'SET_CURRENT_OPENED_STUDENT', payload: studentId})
		dispatch({type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddStudent})
	}

	const handleOpenClientCard = (clientId) => {
		socket.emit('getClientById', {token, clientId})
		dispatch({type: 'SET_CURRENT_OPENED_CLIENT', payload: clientId})
		dispatch({type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddClient})
	}

	const handleOpenGroupCard = (groupId) => {
		socket.emit('getGroupById', {token, groupId})
		dispatch({type: 'SET_CURRENT_OPENED_GROUP', payload: groupId})
		dispatch({type: 'SET_LEFT_MENU_PAGE', payload: ELeftMenuPage.AddGroup})
	}

	// Save & Exit handlers
	const handleSave = async () => {
		const filledTempStudents = tempStudents.filter(
			(s) =>
				s.nameStudent &&
				s.itemName &&
				(s.startTime.hour !== 0 || s.startTime.minute !== 0),
		)

		try {
			const studentsToSave = [...students, ...filledTempStudents]
			await Promise.all(
				studentsToSave.map(
					(student) =>
						new Promise((resolve, reject) => {
							socket.emit('updateStudentSchedule', {
								id: student.id,
								day: calendarNowPopupDay,
								month: calendarNowPopupMonth,
								year: calendarNowPopupYear,
								lessonsPrice: student.costOneLesson || 0,
								studentName: student.nameStudent,
								itemName: student.itemName,
								typeLesson: student.typeLesson,
								startTime: student.startTime,
								endTime: student.endTime,
								isChecked: student.tryLessonCheck,
								isCancel: student.isCancel,
								token,
							})

							socket.once(`updateStudentSchedule_${student.id}`, (response) => {
								if (response.success) resolve(response)
								else reject(new Error('Failed to update student schedule'))
							})

							setTimeout(() => reject(new Error('Update timeout')), 5000)
						}),
				),
			)

			setTempStudents([])
			setEditMode(false)
			dispatch({type: 'SET_IS_EDIT_DAY_POPUP', payload: false})
			fetchData()
		} catch (error) {
			console.error('Error saving changes:', error)
		}
	}

	const handleClose = () => {
		if (editMode) {
			setPagePopup(EPagePopUpExit.Exit)
		} else {
			onExit?.()
		}
	}

	// Add new lesson
	const handleAddNewLesson = () => {
		const newLesson = {
			id: crypto.randomUUID(),
			type: LESSON_TYPES.HOME,
			startTime: {hour: 9, minute: 0},
			endTime: {hour: 10, minute: 0},
			studentName: '',
			subject: '',
			price: 0,
			isCompleted: false,
			isCancelled: false,
			isTest: false,
		}
		setEditingNewLesson(newLesson)
	}

	return (
		<>
			<motion.div
				initial={{opacity: 0, y: -20}}
				animate={{opacity: 1, y: 0}}
				exit={{opacity: 0, y: -20}}
				className="fixed top-20 left-[-300px]  w-[800px] bg-white rounded-xl shadow-lg overflow-hidden"
				style={{maxHeight: 'calc(100vh-120px)'}}>
				{/* Header */}
				<div className="p-4 border-b bg-white">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleNavigateDay('prev')}
								disabled={editMode}
								className="h-9 w-9">
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<h2 className="text-lg font-medium">
								{format(
									new Date(
										calendarNowPopupYear,
										calendarNowPopupMonth - 1,
										calendarNowPopupDay,
									),
									'd MMMM yyyy',
									{locale: ru},
								)}
							</h2>
							<Button
								variant="ghost"
								size="icon"
								onClick={() => handleNavigateDay('next')}
								disabled={editMode}
								className="h-9 w-9">
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
						<Button
							variant="ghost"
							size="icon"
							onClick={handleClose}
							className="h-9 w-9">
							<X className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Content */}
				<div className="flex flex-col h-[600px]">
					<ScrollArea className="flex-1 p-6">
						<div className="space-y-3">
							{isLoading ? (
								<div className="flex items-center justify-center py-8">
									<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
								</div>
							) : error ? (
								<div className="text-red-500 p-4">{error}</div>
							) : (
								<>
									{/* Clients */}
									{clients?.map((client) => (
										<ClientRow
											key={client.id}
											client={client}
											isEditing={editMode}
											onRowClick={() => handleOpenClientCard(client.id)}
											hiddenNum={hiddenNum}
										/>
									))}

									{clients?.length > 0 && <Separator className="my-6" />}

									{/* Regular Lessons */}
									{students.map((lesson) => (
										<LessonRow
											key={lesson.id}
											lesson={{
												...lesson,
												startTime: lesson.startTime,
												endTime: lesson.endTime,
												studentName: lesson.nameStudent,
												subject: lesson.itemName,
												price: lesson.costOneLesson,
												isCompleted: lesson.tryLessonCheck,
												isCancelled: lesson.isCancel,
												isTest: lesson.isTrial,
											}}
											isEditing={editMode}
											onToggleComplete={handleLessonComplete}
											onCancel={handleLessonCancel}
											onCopy={handleLessonCopy}
											onUpdate={handleLessonUpdate}
											onRowClick={
												lesson.type === 'group'
													? () => handleOpenGroupCard(lesson.groupId)
													: () => handleOpenStudentCard(lesson.studentId)
											}
											hiddenNum={hiddenNum}
										/>
									))}

									{/* New Lesson Form */}
									{editingNewLesson && (
										<motion.div
											initial={{opacity: 0, y: -10}}
											animate={{opacity: 1, y: 0}}>
											<Separator className="my-3" />
											<LessonRow
												lesson={editingNewLesson}
												isEditing={true}
												onToggleComplete={() => {}}
												onCancel={() => setEditingNewLesson(null)}
												onCopy={() => {}}
												onUpdate={(_, updates) =>
													setEditingNewLesson((prev) => ({...prev, ...updates}))
												}
												hiddenNum={hiddenNum}
											/>
										</motion.div>
									)}
								</>
							)}
						</div>
					</ScrollArea>

					{/* Footer */}
					<div className="p-4 border-t bg-white">
						<div className="flex justify-between items-center">
							<div className="flex gap-3">
								<Button
									size="default"
									variant={editMode ? 'outline' : 'default'}
									className="text-[13px]"
									onClick={() => (editMode ? handleSave() : setEditMode(true))}>
									{editMode ? 'Сохранить' : 'Редактировать'}
								</Button>
								{editMode && (
									<Button
										variant="ghost"
										size="default"
										className="text-[13px]"
										onClick={() => {
											setEditMode(false)
											fetchData()
										}}>
										Отмена
									</Button>
								)}
								<Button
									size="default"
									variant="ghost"
									className="text-[13px] flex items-center gap-1"
									onClick={handleAddNewLesson}
									disabled={!editMode}>
									<Plus className="h-4 w-4" />
									Добавить предмет
								</Button>
							</div>

							<div className="text-[13px] space-y-1.5">
								<div className="flex justify-between gap-8">
									<span>
										Занятий: <b>{statistics.lessonsCount}</b>
									</span>
									{!hiddenNum && <b>{statistics.lessonsTotal}₽</b>}
								</div>
								<div className="flex justify-between gap-8">
									<span>
										Работ: <b>{statistics.worksCount}</b>
									</span>
									{!hiddenNum && <b>{statistics.worksTotal}₽</b>}
								</div>
								<Separator className="my-1.5" />
								<div className="flex justify-between gap-8 font-medium">
									<span>ИТОГО</span>
									{!hiddenNum && (
										<span>
											{statistics.lessonsTotal + statistics.worksTotal}₽
										</span>
									)}
								</div>
							</div>
						</div>
					</div>
				</div>
			</motion.div>

			{/* Confirmation Dialogs */}
			<AnimatePresence>
				{pagePopup === EPagePopUpExit.Exit && (
					<motion.div
						initial={{opacity: 0}}
						animate={{opacity: 1}}
						exit={{opacity: 0}}
						className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg p-6 w-[400px]">
							<h3 className="text-lg font-medium mb-4">Сохранить изменения?</h3>
							<div className="flex justify-end gap-3">
								<Button
									variant="outline"
									onClick={() => {
										setEditMode(false)
										setPagePopup(EPagePopUpExit.None)
										onExit?.()
									}}>
									Не сохранять
								</Button>
								<Button
									onClick={async () => {
										await handleSave()
										setPagePopup(EPagePopUpExit.None)
										onExit?.()
									}}>
									Сохранить
								</Button>
							</div>
						</div>
					</motion.div>
				)}

				{pagePopup === EPagePopUpExit.Cancel && (
					<motion.div
						initial={{opacity: 0}}
						animate={{opacity: 1}}
						exit={{opacity: 0}}
						className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
						<div className="bg-white rounded-lg p-6 w-[400px]">
							<h3 className="text-lg font-medium mb-4">
								Вы действительно хотите отменить занятие?
							</h3>
							<div className="flex justify-end gap-3">
								<Button
									variant="outline"
									onClick={() => setPagePopup(EPagePopUpExit.None)}>
									Нет
								</Button>
								<Button
									variant="destructive"
									onClick={() => {
										const lessonToCancel = students.find((s) => s.isCancel)
										if (lessonToCancel) {
											handleLessonCancel(lessonToCancel.id)
										}
										setPagePopup(EPagePopUpExit.None)
									}}>
									Да, отменить
								</Button>
							</div>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</>
	)
}

export default DayCalendarPopUp
