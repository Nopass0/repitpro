import React, {
  useState,
  useEffect,
  Component,
  ReactNode,
  useCallback,
  useMemo,
  useRef,
  useContext,
} from "react";
import { z, ZodObject } from "zod";
import { create } from "zustand";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // используется только в DynamicTextFields
import { Separator } from "@/ui/separator"; // импорт из shadcn/ui
import styles from "./index.module.scss";
import "./index.css";
import { Button } from "@/ui/button";
import { EPagePopUpExit, ELeftMenuPage } from "../../types";
import { useDispatch } from "react-redux";

/* =============================================================================
  1. Глобальное хранилище через Zustand – для доступа к текущей карточке
============================================================================= */
interface CardState<T> {
  currentCard: T | null;
  setCurrentCard: (card: T) => void;
}
export const useCardStore = create<CardState<any>>((set) => ({
  currentCard: null,
  setCurrentCard: (card) => set({ currentCard: card }),
}));

/* =============================================================================
  2. Базовая схема и тип для карточки
============================================================================= */
export const BaseCardSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  subCards: z
    .array(
      z.object({
        title: z.string(),
        content: z.string().optional(),
      })
    )
    .optional(),
});
// Объединённый тип: базовые поля плюс поля из пользовательской схемы
export type CardData<T extends ZodObject<any>> = z.infer<typeof BaseCardSchema> & z.infer<T>;

/* =============================================================================
  3. Компоненты для всплывающих окон и отлова ошибок
============================================================================= */
interface ConfirmationPopupProps {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}
export const ConfirmationPopup: React.FC<ConfirmationPopupProps> = ({
  title,
  message,
  onConfirm,
  onCancel,
}) => (
  <div className={styles.PopupContainer}>
    <div className={styles.ExitPopUp}>
      <div className={styles.PopUpHeader}>
        <p>{title}</p>
      </div>
      <div className={styles.PopUpBody}>
        <p>{message}</p>
      </div>
      <div className={styles.PopUpFooter}>
        <button className={styles.PopUpNo} onClick={onCancel}>
          Отмена
        </button>
        <button className={styles.PopUpYes} onClick={onConfirm}>
          Да
        </button>
      </div>
    </div>
  </div>
);

interface ErrorDialogProps {
  title: string;
  errors: z.ZodError;
  onClose: () => void;
}
function ErrorDialog({ title, errors, onClose }: ErrorDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-red-600">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mb-6">
          <ul className="list-disc list-inside space-y-2">
            {errors.errors.map((error, index) => (
              <li key={index} className="text-gray-700">
                {error.message}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("Ошибка в карточке:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <h2>Что-то пошло не так.</h2>;
    }
    return this.props.children;
  }
}

/* =============================================================================
  4. Контекст для TextCardField – для автоматической нумерации полей
============================================================================= */
interface TextFieldContextType {
  getNextIndex: () => number;
}
const TextFieldContext = React.createContext<TextFieldContextType>({
  getNextIndex: () => 0,
});
const TextFieldProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const countRef = useRef(0);
  const getNextIndex = useCallback(() => {
    const index = countRef.current;
    countRef.current++;
    return index;
  }, []);
  return (
    <TextFieldContext.Provider value={{ getNextIndex }}>
      {children}
    </TextFieldContext.Provider>
  );
};

/* =============================================================================
  5. Компонент TextCardField – рендерит textarea или input с разделителем
============================================================================= */
export const TextCardField: React.FC<{
  value: string;
  onChange: (value: string) => void;
  long?: boolean;
}> = ({ value, onChange, long }) => {
  const { getNextIndex } = useContext(TextFieldContext);
  const index = useMemo(() => getNextIndex(), [getNextIndex]);
  return (
    <>
      {index > 0 && <Separator className="my-2" />}
      {long ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-b border-gray-300 outline-none text-base w-full"
          style={{ resize: "none" }}
          rows={1}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-b border-gray-300 outline-none text-base w-full"
        />
      )}
    </>
  );
};

/* =============================================================================
  6. Компонент DynamicTextFields – динамически добавляет поля с анимацией
============================================================================= */
export const DynamicTextFields: React.FC<{
  values: string[];
  onChange: (values: string[]) => void;
  long?: boolean;
}> = ({ values, onChange, long }) => {
  const addNewField = useCallback(() => {
    onChange([...values, ""]);
  }, [values, onChange]);
  const updateField = useCallback(
    (index: number, value: string) => {
      const newValues = [...values];
      newValues[index] = value;
      onChange(newValues);
      if (index === values.length - 1 && value.trim() !== "") {
        addNewField();
      }
    },
    [values, onChange, addNewField]
  );

  return (
    <AnimatePresence>
      {values.map((val, index) => (
        <motion.div
          key={index} // Если возможно, используйте уникальный ключ вместо индекса
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          {index > 0 && <Separator className="my-2" />}
          <TextCardField
            value={val}
            onChange={(v) => updateField(index, v)}
            long={long}
          />
        </motion.div>
      ))}
    </AnimatePresence>
  );
};

/* =============================================================================
  7. Компонент CardHeader – отдельный компонент для ввода имени карточки,
     чтобы избежать лишних ререндеров и потери фокуса.
============================================================================= */
interface CardHeaderProps {
  name: string;
  placeholder?: string;
  isEditing: boolean;
  onNameChange: (newName: string) => void;
}

const CardHeader: React.FC<CardHeaderProps> = ({
  name,
  placeholder,
  isEditing,
  onNameChange,
}) => {
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onNameChange(e.target.value);
  }, [onNameChange]);

  return (
    <div className={styles.StudNameHead}>
      <div className={styles.StudentCardName}>
        <div className={styles.StudentCardInput}>
          <input
            type="text"
            value={name}
            placeholder={placeholder || "Введите имя..."}
            onChange={handleChange}
            className="w-full outline-none text-base pl-10"
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );
};

const MemoizedCardHeader = React.memo(
  CardHeader,
  (prevProps, nextProps) =>
    prevProps.name === nextProps.name &&
    prevProps.isEditing === nextProps.isEditing &&
    prevProps.placeholder === nextProps.placeholder
);

/* =============================================================================
  8. Хук useCard – объединяет кастомную zod-схему с базовой, управляет состоянием,
     обеспечивает функциональность редактирования, сохранения и навигации.
============================================================================= */
export function useCard<T extends ZodObject<any>>(
  customSchema: T,
  initialData?: z.infer<T>
) {
  const mergedSchema = BaseCardSchema.merge(customSchema);
  type MergedType = z.infer<typeof mergedSchema>;

  const [data, setData] = useState<MergedType>(
    initialData
      ? (initialData as MergedType)
      : mergedSchema.parse({
          id: "new-" + Date.now(),
          name: "",
          description: "",
          subCards: [],
        })
  );
  const [initial, setInitial] = useState<MergedType>(data);
  const [initialized, setInitialized] = useState<boolean>(false);
  useEffect(() => {
    if (!initialized && initialData) {
      setData(initialData as MergedType);
      setInitial(initialData as MergedType);
      setInitialized(true);
    }
  }, [initialData, initialized]);

  // Используем функциональное обновление, чтобы гарантировать, что не затираются другие поля
  const setField = useCallback(
    <K extends keyof MergedType>(key: K, value: MergedType[K]) => {
      setData((prevData) => {
        const newData = { ...prevData, [key]: value };
        const parsed = mergedSchema.safeParse(newData);
        if (!parsed.success) {
          console.error("Ошибка валидации поля", key, parsed.error);
          return prevData;
        }
        return newData;
      });
    },
    [mergedSchema]
  );

  const isDirty = JSON.stringify(data) !== JSON.stringify(initial);
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const cardState = useMemo(
    () => ({
      data,
      setField,
      isDirty,
      setData,
      isEditing,
      setIsEditing,
    }),
    [data, setField, isDirty, setData, isEditing]
  );

  interface CardComponentProps {
    namePlaceholder?: string;
    onPrev?: () => void;
    onNext?: () => void;
    onSave?: (data: MergedType) => Promise<void> | void;
    onArchive?: (data: MergedType) => void;
    onDelete?: (data: MergedType) => void;
    children: (props: {
      data: MergedType;
      setField: <K extends keyof MergedType>(
        key: K,
        value: MergedType[K]
      ) => void;
      isEditing: boolean;
    }) => ReactNode;
    cardState: typeof cardState;
  }

  const CardComponentInner: React.FC<CardComponentProps> = ({
    namePlaceholder = "Введите имя...",
    onPrev,
    onNext,
    onSave,
    onArchive,
    onDelete,
    children,
    cardState,
  }) => {
    const dispatch = useDispatch();
    const [showExitConfirm, setShowExitConfirm] = useState<boolean>(false);
    const [loading] = useState<boolean>(false);
    const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
    const [totalItems, setTotalItems] = useState<number>(1);
    const [validationError, setValidationError] = useState<z.ZodError | null>(null);
    const [isExiting, setIsExiting] = useState<boolean>(false);

    const { data, setField, isDirty } = cardState;
    const { isEditing, setIsEditing } = cardState;

    // Передаём ВСЕ данные в children, чтобы контент всегда получал актуальные значения.
    const content = children({
      data,
      setField,
      isEditing,
    });

    const cleanupAndNavigate = useCallback(() => {
      useCardStore.getState().setCurrentCard(null);
      dispatch({
        type: "SET_LEFT_MENU_PAGE",
        payload: ELeftMenuPage.MainPage,
      });
      dispatch({
        type: "SET_PAGE_POPUP_EXIT",
        payload: EPagePopUpExit.Exit,
      });
      dispatch({
        type: "SET_CURRENT_OPENED_STUDENT",
        payload: "",
      });
      dispatch({
        type: "RELOAD_STUDENT_CARD",
      });
      setIsExiting(true);
    }, [dispatch]);

    const handleExit = useCallback(() => {
      if (isDirty) {
        setShowExitConfirm(true);
      } else {
        cleanupAndNavigate();
      }
    }, [isDirty, cleanupAndNavigate]);

    const handleConfirmExit = useCallback(() => {
      setShowExitConfirm(false);
      cleanupAndNavigate();
    }, [cleanupAndNavigate]);

    const setCurrentCard = useCardStore((state) => state.setCurrentCard);
    useEffect(() => {
      setCurrentCard(data);
    }, [data, setCurrentCard]);

    const handleSave = async () => {
      try {
        const parsed = mergedSchema.safeParse(data);
        if (!parsed.success) {
          setValidationError(parsed.error);
          return;
        }
        if (onSave) {
          await onSave(data);
        }
        setIsEditing(false);
      } catch (err) {
        console.error("Ошибка сохранения:", err);
      }
    };

    if (isExiting) return null;

    return (
      <ErrorBoundary>
        <div>
          {loading ? (
            <div className={styles.Spin}>
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-green-500"></div>
              </div>
            </div>
          ) : (
            <>
              <div className={styles.wrapper}>
                {/* Header */}
                <div className={styles.Header}>
                  <div className="flex items-center w-full rounded-md gap-2 border border-green-500 px-0.5 py-1 justify-between">
                    <div className="flex items-center bg-zinc-50 justify-between w-full mb-2 p-4 border-[2px] border-solid border-green-500 rounded-lg outline-none ring-0">
                      <div className="flex items-center w-full gap-2 justify-between">
                        <Button variant="ghost" size="icon" onClick={onPrev}>
                          <ChevronLeft className="h-5 w-5" />
                        </Button>
                        <h2 className="text-lg font-medium">
                          Ученик {currentItemIndex + 1}/{totalItems}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onNext}>
                          <ChevronRight className="h-5 w-5" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleExit}
                        className="hover:text-red-500"
                      >
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                  {/* Отдельный, мемоизированный компонент для ввода имени */}
                  <MemoizedCardHeader
                    name={data.name}
                    onNameChange={(value) => setField("name", value)}
                    isEditing={isEditing}
                    placeholder={namePlaceholder}
                  />
                </div>
                {/* Контент карточки */}
                <div className={styles.wrapperMenu}>
                  <TextFieldProvider>{content}</TextFieldProvider>
                </div>
                {/* Footer */}
                <div className={styles.FooterWrapper}>
                  <div className={styles.FooterButton}>
                    <div className={styles.EditNSave}>
                      <button
                        className={styles.Edit}
                        onClick={() => setIsEditing(true)}
                      >
                        Редактировать
                      </button>
                      <button className={styles.Save} onClick={handleSave}>
                        Сохранить
                      </button>
                    </div>
                    <div className={styles.ArchiveNDelete}>
                      <button
                        className={styles.Archive}
                        onClick={() => onArchive && onArchive(data)}
                      >
                        В архив
                      </button>
                      <button
                        className={styles.Delete}
                        onClick={() => onDelete && onDelete(data)}
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {showExitConfirm && (
                <ConfirmationPopup
                  title="Выйти без сохранения?"
                  message="Есть несохранённые изменения. Вы действительно хотите выйти?"
                  onConfirm={handleConfirmExit}
                  onCancel={() => setShowExitConfirm(false)}
                />
              )}
              {validationError && (
                <ErrorDialog
                  title="Ошибка валидации"
                  errors={validationError}
                  onClose={() => setValidationError(null)}
                />
              )}
            </>
          )}
        </div>
      </ErrorBoundary>
    );
  };

  const MemoizedCardComponent = useMemo(
    () => React.memo(CardComponentInner),
    []
  );

  const renderCard = (props: Omit<CardComponentProps, "cardState">) => (
    <MemoizedCardComponent {...props} cardState={cardState} />
  );

  return { renderCard, schema: mergedSchema, data, setField, isDirty, setData };
}

export default useCard;
