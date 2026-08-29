import { DndContext, type DragEndEvent, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { QuestionEditorCard } from "./QuestionEditorCard";
import type { DraftQuestion } from "./draftTypes";

function SortableItem({
  question,
  index,
  onChange,
  onRemove,
  disabled,
}: {
  question: DraftQuestion;
  index: number;
  onChange: (question: DraftQuestion) => void;
  onRemove: () => void;
  disabled?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: question.key, disabled });

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}>
      <QuestionEditorCard
        question={question}
        index={index}
        onChange={onChange}
        onRemove={onRemove}
        disabled={disabled}
        dragHandleProps={{ attributes, listeners }}
      />
    </div>
  );
}

export function QuestionList({
  questions,
  onChange,
  disabled,
}: {
  questions: DraftQuestion[];
  onChange: (questions: DraftQuestion[]) => void;
  disabled?: boolean;
}) {
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = questions.findIndex((q) => q.key === active.id);
    const newIndex = questions.findIndex((q) => q.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(questions, oldIndex, newIndex));
  }

  function updateAt(index: number, question: DraftQuestion) {
    onChange(questions.map((q, i) => (i === index ? question : q)));
  }
  function removeAt(index: number) {
    onChange(questions.filter((_, i) => i !== index));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={questions.map((q) => q.key)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {questions.map((question, index) => (
            <SortableItem
              key={question.key}
              question={question}
              index={index}
              disabled={disabled}
              onChange={(q) => updateAt(index, q)}
              onRemove={() => removeAt(index)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
