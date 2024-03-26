export interface IUser {
	token: string
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
}

export interface IItemCard {
	itemName: string | null | undefined
	tryLessonCheck: boolean | null | undefined
	tryLessonCost: string | null | undefined

	todayProgramStudent: string | null | undefined
	targetLesson: string | null | undefined
	programLesson: string | null | undefined
	typeLesson: string | null | undefined
	placeLesson: string | null | undefined
	timeLesson: string | null | undefined
	valueMuiSelectArchive: number | null | undefined
	startLesson: string | null | undefined
	endLesson: string | null | undefined
	nowLevel: number | null | undefined
}
