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
  trialLessonTime?: {
    startTime: {
      hour: number;
      minute: number;
    };
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

export interface IStudentCardResponse {
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
  token: string;
}

export interface IUploadFiles {
  name: string;
  file: Buffer;
  type: string;
  size: number;
}

export interface Student {
  id: string;
  nameStudent: string;
  contactFace: string;
  phoneNumber: string;
  email: string;
  address: string;
  linkStudent: string;
  costStudent: string;
  commentStudent: string;
  prePayCost: string;
  prePayDate: Date | null;
  storyLesson: string;
  costOneLesson: string;
  targetLessonStudent: string;
  todayProgramStudent: string;
  isArchived: boolean;
  groupId: string;
  userId: string;
  files: string[];
}

export interface CreateStudentInput {
  nameStudent: string;
  contactFace: string;
  phoneNumber: string;
  email: string;
  address: string;
  linkStudent: string;
  costStudent: string;
  commentStudent: string;
  prePayCost: string;
  prePayDate?: Date;
  storyLesson: string;
  costOneLesson: string;
  targetLessonStudent: string;
  todayProgramStudent: string;
  isArchived?: boolean;
  groupId: string;
  userId: string;
  items: ItemInput[];
  token: string;
  files: IUploadFiles[];
  audios: IUploadFiles[];
}

export interface ItemInput {
  itemName: string;
  tryLessonCheck?: boolean;
  tryLessonCost?: string;
  todayProgramStudent?: string;
  targetLesson?: string;
  programLesson?: string;
  typeLesson: number;
  placeLesson?: string;
  timeLesson?: string;
  valueMuiSelectArchive?: number;
  startLesson?: Date;
  endLesson?: Date;
  nowLevel?: number;
  costOneLesson?: string;
  lessonDuration?: number | null;
  timeLinesArray?: TimeLine[];
}

export interface IUploadFiles {
  name: string;
  type: string;
  size: number;
  file: Buffer;
}

export interface TimeLine {
  id: number;
  day: string;
  active: boolean;
  endTime: { hour: number; minute: number };
  startTime: { hour: number; minute: number };
  editingEnd: boolean;
  editingStart: boolean;
}

export interface ICardFile {
  id: string;
  name: string;
  type: string;
  size: number;
  path: string;
  hashSum: string;
  extraType: string;
  userId: string;
}
