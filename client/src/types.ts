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
}

export interface IStudent {
	nameStudent: string
	contactFace: string
	phoneNumber: string
	email: string
	address: string
	linkStudent: string
	costStudent: string
	commentStudent: string
	prePayCost: string
	prePayDate: string
	selectedDate: null
	costOneLesson: string
	storyLesson: string
	targetLessonStudent: string
	todayProgramStudent: string
	startLesson: Date | null
	endLesson: Date | null
}

export interface IHistoryLessons {
	date: Date
	itemName: string
	isDone: boolean
	price: string
	isPaid: boolean
}
