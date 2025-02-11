import React, { useEffect, useState } from "react";
import { z } from "zod";
import axios from "axios";
import InputMask from 'react-input-mask'

import s from './index.module.scss'
import useCard, { CardData } from "../Card";
import TextAreaInputBlock from "../TextAreaInputBlock";
import IconsPhone from "../IconsPhone";
import { Separator } from "@/ui/separator";
import { cn } from "@/lib/utils";
import Input from "../Input";

/* =============================================================================
  1. Определяем кастомную схему для карточки ученика.
     Базовые поля (id, name, description, subCards) добавляются автоматически.
============================================================================= */
const StudentCustomSchema = z.object({
  description: z.string().optional(),
  contactFace: z.string().optional(),
  phoneNumber: z.string().optional(),
  costStudent: z.string().default(""),
  email: z.string().optional(),
  subCards: z
    .array(
      z.object({
        title: z.string(),
        content: z.string().optional(),
      })
    )
    .optional(),
});

/* =============================================================================
  2. Экспортируем тип карточки ученика – объединяет базовые поля с кастомной схемой.
============================================================================= */
export type StudentCardData = CardData<typeof StudentCustomSchema>;

/* =============================================================================
  3. Компонент содержимого карточки ученика.
============================================================================= */
interface AddStudentContentProps {
  data: StudentCardData;
  setField: <K extends keyof StudentCardData>(
    key: K,
    value: StudentCardData[K]
  ) => void;
  isEditing: boolean;
}

const AddStudentContentComponent: React.FC<AddStudentContentProps> = ({
  data,
  setField,
  isEditing,
}) => {
  return (
    <div className={s.wrapperMenu}>
      <div className={s.StudentCard}>
        <div className={cn("mb-3")}>
          <TextAreaInputBlock
            title="Контактное лицо:"
            value={data.contactFace || ""}
            disabled={!isEditing}
            onChange={(e) => setField("contactFace", e.target.value)}
            textIndent="140px"
            firstMinSymbols={20}
          />
        </div>
      </div>
      <Separator/>
      <div className="flex flex-col">
        <div className="flex items-center">
          <div className="flex-grow my-5 ">
            <label className="flex items-center">
              <span className="mr-2 font-bold ">Тел:</span>
              <InputMask
                type="text"
                mask="+7 (999) 999-99-99"
                maskChar="_"
                value={data.phoneNumber}
                disabled={!isEditing}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField("phoneNumber", e.target.value)}
                placeholder="+7 (___) ___-__"
                className="w-full outline-none"
              />
            </label>
          </div>
          <div className="ml-2">
            <IconsPhone phoneNumber={data.phoneNumber} email={data.email} />
          </div>
        </div>
      </div>
      <Separator/>
      <div className={cn("mb-3", `${s.StudentCard} `)}>
        <p>Расходы по ученику:</p>
        <Input
          width={`${(data.costStudent || "").length}ch`}
          num
          type="text"
          value={data.costStudent}
          disabled={!isEditing}
          onChange={(e: any) => setField("costStudent", e.target.value)}
          style={{borderBottom: '1px solid #e2e2e9'}}
        />
        <p>₽</p>
      </div>
      <Separator/>
      {/* Дополнительные поля можно добавить по необходимости */}
   
    </div>
  
  );
};

// Мемоизируем компонент, сравнивая только используемые в нём поля
const AddStudentContent = React.memo(
  AddStudentContentComponent,
  (prevProps, nextProps) =>
    prevProps.data.contactFace === nextProps.data.contactFace &&
    prevProps.data.phoneNumber === nextProps.data.phoneNumber &&
    prevProps.isEditing === nextProps.isEditing
);

/* =============================================================================
  4. Основной компонент AddStudent.
============================================================================= */
const AddStudent: React.FC = () => {
  const [serverData, setServerData] = useState<StudentCardData | undefined>(undefined);

  // Эмуляция загрузки данных (например, через 1 секунду)
  useEffect(() => {
    setTimeout(() => {
      setServerData({
        id: "student-123",
        name: "Иван Иванов",
        description: "Иван Иванович",
        subCards: [],
      });
    }, 1000);
  }, []);

  const { renderCard } = useCard(StudentCustomSchema, serverData);

  const handleSave = async (cardData: StudentCardData) => {
    if (cardData.id.startsWith("new-")) {
      console.log("Сохранение новой карточки:", cardData);
      // Пример запроса: await axios.post("/api/student/create", cardData);
    } else {
      console.log("Обновление карточки ученика:", cardData);
      // Пример запроса: await axios.post("/api/student/update", cardData);
    }
  };

  return (
    <div className="wrapper">
      <React.Suspense fallback={<div>Загрузка...</div>}>
        {renderCard({
          namePlaceholder: "Введите название карточки",
          onSave: handleSave,
          onArchive: (cardData) => console.log("В архив:", cardData),
          onDelete: (cardData) => console.log("Удалить:", cardData),
          onPrev: () => console.log("Предыдущая карточка"),
          onNext: () => console.log("Следующая карточка"),
          children: ({ data, setField, isEditing }) => (
            // Компонент AddStudentContent сам мемоизирован – изменения поля name не влияют
            <AddStudentContent data={data} setField={setField} isEditing={isEditing} />
          ),
        })}
      </React.Suspense>
    </div>
  );
};

export default AddStudent;
