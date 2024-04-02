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
