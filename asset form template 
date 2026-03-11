import BooleanInput from "./BooleanInput";
import TextInput from "./TextInput";
import SelectInput from "./SelectInput";
import CheckboxInput from "./CheckboxInput";

interface Props {
  question: {
    id: number;
    question: string;
    question_type: "boolean" | "text" | "select" | "checkbox";
    options?: string[]; // for select/checkbox types
  };
  onChange: (questionId: number, value: any) => void;
  value: any;
}

const QuestionRenderer = ({ question, onChange, value }: Props) => {
  const renderInput = () => {
    switch (question.question_type) {
      case "boolean":
        return <BooleanInput value={value} onChange={(v) => onChange(question.id, v)} />;
      case "text":
        return <TextInput value={value} onChange={(v) => onChange(question.id, v)} />;
      case "select":
        return <SelectInput options={question.options || []} value={value} onChange={(v) => onChange(question.id, v)} />;
      case "checkbox":
        return <CheckboxInput options={question.options || []} value={value} onChange={(v) => onChange(question.id, v)} />;
      default:
        return <TextInput value={value} onChange={(v) => onChange(question.id, v)} />;
    }
  };

  return (
    <div className="template-question-item w-full">
      <p className="question font-semibold">{question.question}</p>
      <div className="template-question-item-type mt-4">
        <div className="template-question-item-type_label mb-2.5 text-[#797979]">
          Question Type: <span className="font-medium text-[#17181a]">{question.question_type}</span>
        </div>
        {renderInput()}
        <hr className="border-0 m-4 border-t border-solid border-[#ebebeb] h-px p-0 block" />
      </div>
    </div>
  );
};

export default QuestionRenderer;


const TextInput = ({ value, onChange }) => (
  <textarea
    className="form-textarea min-h-25 bg-[#f5f6fa] border border-solid border-[#efefef] rounded-[10px] w-full text-[14px] py-2.5 px-3"
    placeholder="Type your answer here"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
  />
);
export default TextInput;


const SelectInput = ({ options, value, onChange }) => (
  <select
    className="form-select bg-[#f5f6fa] border border-[#efefef] rounded-[10px] w-full h-[44px] px-[14px] text-[14px]"
    value={value || ""}
    onChange={(e) => onChange(e.target.value)}
  >
    <option value="">Select an option</option>
    {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
  </select>
);
export default SelectInput;


const CheckboxInput = ({ options, value = [], onChange }) => (
  <div className="flex flex-col gap-2">
    {options.map((opt) => (
      <label key={opt} className="flex items-center gap-2 text-[14px]">
        <input
          type="checkbox"
          checked={value.includes(opt)}
          onChange={(e) => {
            const updated = e.target.checked
              ? [...value, opt]
              : value.filter((v) => v !== opt);
            onChange(updated);
          }}
        />
        {opt}
      </label>
    ))}
  </div>
);
export default CheckboxInput;


// Add answers state to track responses
const [answers, setAnswers] = useState<Record<number, any>>({});

function handleAnswerChange(questionId: number, value: any) {
  const updated = { ...answers, [questionId]: value };
  setAnswers(updated);
  updateForm("pre_use_answers", updated); // send answers up to parent
}

// Replace the questions rendering section:
<div className='col w-full'>
  {questions && questions.length > 0 && (
    <div className='card-box-inner border-3 solid border-[#f5f6fa] rounded-[18px] p-5.5'>
      <h3 className='h3 title mb-4 text-[18px] font-semibold leading-6'>All Questions</h3>
      <ul className='template-questions bg-[#f5f6fa] border border-solid border-[#efefef] px-4 pt-4 pl-8 flex flex-col gap-[6px] list-none'>
        {questions.map((q) => (
          <li key={q.id} className='list-item'>
            <QuestionRenderer
              question={q}
              value={answers[q.id]}
              onChange={handleAnswerChange}
            />
          </li>
        ))}
      </ul>
    </div>
  )}
</div>