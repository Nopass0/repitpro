import React, { useRef, useState, useEffect } from 'react';
import { z } from 'zod';
import s from './index.module.scss';

/* =============================================================================
  1. Определяем zod-схему для пропсов компонента TextAreaInputBlock.
============================================================================= */
const TextAreaInputBlockSchema = z.object({
  className: z.string().optional(),
  style: z.object({}).passthrough().optional(),
  children: z.any().optional(),
  type: z.string().optional(),
  value: z.string().optional(),
  onChange: z
    .function()
    .args(z.any())
    .returns(z.void())
    .optional(),
  onClick: z
    .function()
    .args(z.any())
    .returns(z.void())
    .optional(),
  num: z.boolean().optional(),
  disabled: z.boolean().optional(),
  width: z.string().optional(),
  maxWidth: z.string().optional(),
  minWidth: z.string().optional(),
  title: z.string().optional(),
  textIndent: z.string().optional(),
  firstMinSymbols: z.number().optional(),
  placeholder: z.string().optional(),
});

export type ITextArea = z.infer<typeof TextAreaInputBlockSchema>;

/* =============================================================================
  2. Компонент TextAreaInputBlock.
  
  - Использует автоизменение высоты: при каждом изменении значения сначала
    сбрасывает высоту в "auto", затем устанавливает её равной scrollHeight.
  - Если значение пустое или его длина (без пробелов) меньше firstMinSymbols,
    высота сбрасывается до минимальной (одна строка).
============================================================================= */
const TextAreaInputBlock: React.FC<ITextArea> = ({
  className,
  style,
  children,
  type,
  value = "",
  onChange,
  onClick,
  disabled,
  title,
  textIndent,
  placeholder,
  firstMinSymbols = 36,
}: ITextArea) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const defaultMinHeight = 19; // минимальная высота – одна строка (19px)
  const [height, setHeight] = useState<number>(defaultMinHeight);

  const adjustHeight = () => {
    if (textareaRef.current) {
      // Сбрасываем высоту, чтобы получить актуальный scrollHeight
      textareaRef.current.style.height = "auto";
      const newScrollHeight = textareaRef.current.scrollHeight;

      // Если значение пустое или его длина меньше порога для первой строки,
      // то устанавливаем минимальную высоту.
      if (
        !textareaRef.current.value ||
        textareaRef.current.value.trim() === "" ||
        textareaRef.current.value.length < firstMinSymbols
      ) {
        setHeight(defaultMinHeight);
      } else {
        setHeight(newScrollHeight);
      }
    }
  };

  // Если компонент является управляемым (value меняется извне),
  // пересчитываем высоту при изменении value.
  useEffect(() => {
    adjustHeight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className={s.StudentCard} style={{ height: `${height}px` }}>
      <label>
        {title && <p>{title}</p>}
        <textarea
          className={`${s.textarea} ${className || ''}`}
          value={value}
          disabled={disabled}
          onChange={(e) => {
            if (onChange) {
              onChange(e);
            }
            adjustHeight();
          }}
          onClick={(e) => {
            if (onClick) {
              onClick(e);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          style={{
            ...style,
            height: `${height}px`,
            textIndent: textIndent || '120px',
          }}
          ref={textareaRef}
          placeholder={placeholder}
        />
      </label>
      {children}
    </div>
  );
};

export default TextAreaInputBlock;
