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
