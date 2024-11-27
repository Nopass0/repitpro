import {z} from 'zod'

export interface IUser {
	token: string
	hiddenNum: boolean
	details: boolean
}

export interface ICell {
	workCount: number
	id: number
	day: number
	month: number

	lessonsCount: number
	lessonsPrice: number
	workPrice: number
}

export enum ELeftMenuPage {
	AddStudent = 'AddStudent',
	AddGroup = 'AddGroup',
	AddClient = 'AddClient',
	MyCabinet = 'MyCabinet',
	MainPage = 'MainPage',
}

export enum ECurrentDayPopUp {
	Student = 'Student',
	Client = 'Client',
	Group = 'Group',
	None = 'None',
}

export enum EPagePopUpExit {
	Exit = 'Exit',
	None = 'None',
}

export interface ITimeLine {
	id: number
	day: string
	active: boolean
	startTime: {
		hour: number
		minute: number
	}
	endTime: {
		hour: number
		minute: number
	}
	editingStart: boolean
	editingEnd: boolean
}

// Обновленный тип для IItemCard
export interface IItemCard {
	itemName: string
	costOneLesson: string
	tryLessonCheck: boolean
	tryLessonCost: string
	todayProgramStudent: string
	targetLesson: string
	files: any
	lessonDuration: number | null
	programLesson: string
	typeLesson: string
	placeLesson: string
	timeLesson: string
	valueMuiSelectArchive: number
	startLesson: Date | null
	endLesson: Date | null
	nowLevel: number | undefined
	timeLinesArray: ITimeLine[]
	commentItem?: string
	trialLessonDate?: Date
}

export interface IGroupHistoryLessons {
	date: Date
	isDone: boolean
	isPaid: boolean
	itemName: string
	price: number
}

export interface IStudent {
	nameStudent: string
	contactFace: string
	phoneNumber: string
	email: string
	files: any
	address: string
	linkStudent: string
	costStudent: string
	commentStudent: string
	prePayCost: string
	prePayDate: Date
	prePayCostValue: string
	selectedDate: null
	nowLevel: number
	tryLessonCheck: boolean
	tryLessonCost: string
	costOneLesson: string
	storyLesson: string
	targetLessonStudent: string
	todayProgramStudent: string
	startLesson: Date | null
	endLesson: Date | null
	prePay: IPrePayList[]
}

export interface IHistoryLessons {
	date: Date
	itemName: string
	isDone: boolean
	price: string
	isPaid: boolean
}

export interface Dataset {
	label: string
	data: number[]
	fill: boolean
	backgroundColor: string
	borderColor: string
}

export interface ChartData {
	labels: string[]
	datasets: Dataset[]
}

export interface IlinksArray {
	tag?: string
	linkedId?: string
	links: string[]
	token: string
}

export interface IDayGroupStudent {
	id: string
	itemName: string
	nameStudent: string
	typeLesson: number
	homeFiles: any[]
	classFiles: any[]
	homeAudios: any[]
	classAudios: any[]
	homeWork: string
	place: string
	classWork: string
	isCheck: boolean
	tryLessonCheck: boolean
	startTime: {
		hour: number
		minute: number
	}
	endTime: {
		hour: number
		minute: number
	}
	homeStudentsPoints: IStudentPoints[]
	classStudentsPoints: IStudentPoints[]
	groupName: string
	groupId: string
	students: {
		id: string
		nameStudent: string
		costOneLesson: string
		targetLessonStudent: string
		todayProgramStudent: string
	}[]
}

export interface IStudentPoints {
	studentId: string
	studentName?: string
	points: number
}

export interface IFile {
	file: any
	name: string
	type: string
	size: number
}

export interface IPrePayList {
	id: number
	date: Date
	cost: string
}

// Base schemas
export const TimeSchema = z.object({
	hour: z.number().min(0).max(23),
	minute: z.number().min(0).max(59),
})

export const TimeLineSchema = z.object({
	id: z.number(),
	day: z.string(),
	active: z.boolean(),
	startTime: TimeSchema,
	endTime: TimeSchema,
	editingStart: z.boolean(),
	editingEnd: z.boolean(),
})

export const ItemSchema = z.object({
	id: z.string(),
	itemName: z.string(),
	tryLessonCheck: z.boolean(),
	tryLessonCost: z.string().optional(),
	trialLessonDate: z.date().optional(),
	trialLessonTime: z
		.object({
			startTime: TimeSchema,
			endTime: TimeSchema,
		})
		.optional(),
	todayProgramStudent: z.string(),
	targetLesson: z.string(),
	programLesson: z.string(),
	typeLesson: z.string(),
	placeLesson: z.string(),
	timeLesson: z.string(),
	valueMuiSelectArchive: z.number(),
	costOneLesson: z.string(),
	startLesson: z.date(),
	endLesson: z.date(),
	nowLevel: z.number().optional(),
	lessonDuration: z.number().nullable(),
	timeLinesArray: z.array(TimeLineSchema),
	files: z.array(z.unknown()),
})

export const StudentSchema = z.object({
	id: z.string(),
	nameStudent: z.string(),
	contactFace: z.string(),
	phoneNumber: z.string(),
	email: z.string().email().optional(),
	linkStudent: z.string(),
	costStudent: z.string(),
	commentStudent: z.string(),
	items: z.array(ItemSchema),
	prePayList: z.array(
		z.object({
			id: z.number(),
			cost: z.string(),
			date: z.date(),
		}),
	),
	historyLessons: z.array(
		z.object({
			id: z.string(),
			date: z.date(),
			itemName: z.string(),
			price: z.string(),
			isDone: z.boolean(),
			isPaid: z.boolean(),
			isCancel: z.boolean(),
		}),
	),
})

// Infer types from schemas
export type Time = z.infer<typeof TimeSchema>
export type TimeLine = z.infer<typeof TimeLineSchema>
export type Item = z.infer<typeof ItemSchema>
export type Student = z.infer<typeof StudentSchema>

// API Response types
export const StudentListResponseSchema = z.object({
	students: z.array(
		z.object({
			id: z.string(),
			nameStudent: z.string(),
		}),
	),
})

export type StudentListResponse = z.infer<typeof StudentListResponseSchema>

// Navigation state type
export interface NavigationState {
	currentStudentIndex: number
	currentItemIndex: number
	totalStudents: number
	totalItems: number
}
