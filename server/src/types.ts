export interface ICell {
  workCount: number;
  id: number;
  day: number;
  month: number;
  year: number;
  lessonsCount: number;
  lessonsPrice: number;
  workPrice: number;
}

export interface ITimeLine {
  day: string;
  startTime: {
    hour: number;
    minute: number;
  };
  endTime: {
    hour: number;
    minute: number;
  };
}

export interface IItemCard {
  itemName: string;
  tryLessonCheck: boolean;
  tryLessonCost: string;
  todayProgramStudent: string;
  targetLesson: string;
  programLesson: string;
  typeLesson: number;
  placeLesson: string;
  timeLesson: string;
  valueMuiSelectArchive: number;
  startLesson: Date | string;
  endLesson: Date | string;
  nowLevel: number;
  lessonDuration: number;
  timeLinesArray: ITimeLine[];
}

export interface IStudentCard {
  nameStudent: string;
  phoneNumber: string;
  contactFace: string;
  email: string;
  prePayCost: string;
  prePayDate: Date | string;
  costOneLesson: string;
  commentStudent: string;
  link: string;
  cost: string;
  items: IItemCard[];
}
