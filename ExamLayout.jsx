import React, { useEffect, useState, useRef, useCallback } from "react";
import { useExam } from "../../context/useExam";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

// Helper to format seconds -> MM:SS
function formatTime(seconds) {
    if (seconds <= 0) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
}

const ExamViewLayout = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));
    const url = `http://localhost:5000/api/exams/${examId}/questions`;

    const [exam, setExam] = useState({ title: "", time_duration: "" });
    const [subjects, setSubjects] = useState([]);
    const [activeSubject, setActiveSubject] = useState(null);
    const [subjectQuestions, setSubjectQuestions] = useState([]);
    const [selectQuestion, setSelectQuestion] = useState({});
    const [selectedOption, setSelectedOption] = useState(null);
    const [questionsStatus, setQuestionsStatus] = useState([]);
    const [userAnswers, setUserAnswers] = useState([]);
    const [lockedSubjects, setLockedSubjects] = useState([]); // subject ids that expired

    // --- TIMER STATE ---
    // Total exam timer (seconds remaining)
    const [totalTimeLeft, setTotalTimeLeft] = useState(null);
    // Per-subject timers: { [subjectId]: secondsRemaining }
    const [subjectTimers, setSubjectTimers] = useState({});

    // Refs to avoid stale closures in intervals
    const totalTimerRef = useRef(null);
    const subjectTimerRef = useRef(null);
    const activeSubjectIdRef = useRef(null);
    const subjectTimersRef = useRef({});
    const lockedSubjectsRef = useRef([]);
    const userAnswersRef = useRef([]);
    const examIdRef = useRef(examId);

    const { handleClearResponse } = useExam();

    // Keep refs in sync with state
    useEffect(() => { subjectTimersRef.current = subjectTimers; }, [subjectTimers]);
    useEffect(() => { lockedSubjectsRef.current = lockedSubjects; }, [lockedSubjects]);
    useEffect(() => { userAnswersRef.current = userAnswers; }, [userAnswers]);

    // -------------------------
    // SUBMIT LOGIC
    // -------------------------
    const submitAnswers = useCallback(async (answers) => {
        try {
            const res = await fetch(`http://localhost:5000/api/exams/submit-result/${examIdRef.current}`, {
                method: "POST",
                body: JSON.stringify({ userId: user.id, answers }),
                headers: { "Content-Type": "application/json" },
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            console.log("Answers submitted:", result);
        } catch (error) {
            console.log("Error submitting answers:", error.message);
        }
    }, [user.id]);

    const submitExam = useCallback(async () => {
        try {
            const res = await fetch(`http://localhost:5000/api/exams/user/create`, {
                method: "POST",
                body: JSON.stringify({ examId: examIdRef.current, userId: user.id }),
                headers: { "Content-Type": "application/json" },
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            console.log("Exam submitted:", result);
        } catch (error) {
            console.log("Error submitting exam:", error.message);
        }
    }, [user.id]);

    const handleFinalSubmit = useCallback(async () => {
        // Clear all timers
        clearInterval(totalTimerRef.current);
        clearInterval(subjectTimerRef.current);

        await submitAnswers(userAnswersRef.current);
        await submitExam();
        navigate("/student/result");
    }, [submitAnswers, submitExam, navigate]);

    // -------------------------
    // TOTAL EXAM TIMER
    // -------------------------
    function startTotalTimer(durationMinutes) {
        const totalSeconds = durationMinutes * 60;
        setTotalTimeLeft(totalSeconds);

        clearInterval(totalTimerRef.current);
        let remaining = totalSeconds;

        totalTimerRef.current = setInterval(() => {
            remaining -= 1;
            setTotalTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(totalTimerRef.current);
                clearInterval(subjectTimerRef.current);
                alert("Total exam time is up! Auto-submitting.");
                handleFinalSubmit();
            }
        }, 1000);
    }

    // -------------------------
    // SUBJECT TIMER
    // -------------------------
    function startSubjectTimer(subjectId) {
        clearInterval(subjectTimerRef.current);

        subjectTimerRef.current = setInterval(() => {
            const current = subjectTimersRef.current[subjectId];

            if (current === undefined || lockedSubjectsRef.current.includes(subjectId)) {
                clearInterval(subjectTimerRef.current);
                return;
            }

            const next = current - 1;

            setSubjectTimers((prev) => ({ ...prev, [subjectId]: next }));

            if (next <= 0) {
                clearInterval(subjectTimerRef.current);
                // Lock the subject
                setLockedSubjects((prev) => [...prev, subjectId]);
                alert(`Time's up for this subject! It has been locked.`);
            }
        }, 1000);
    }

    function pauseSubjectTimer() {
        clearInterval(subjectTimerRef.current);
    }

    // -------------------------
    // FETCH QUESTIONS
    // -------------------------
    async function fetchQuestions() {
        try {
            const res = await fetch(url);
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            const examData = result.exam;
            setExam({
                title: examData.title,
                time_duration: examData.total_duration_minutes,
            });
            setSubjects(result.subjects);

            // Initialize subject timers from API data
            const timers = {};
            result.subjects.forEach((sub) => {
                timers[sub.id] = sub.subject_duration_minutes * 60;
            });
            setSubjectTimers(timers);
            subjectTimersRef.current = timers;

            // Set first subject active
            const firstSubject = result.subjects[0];
            setActiveSubject(firstSubject);
            activeSubjectIdRef.current = firstSubject.id;
            setSubjectQuestions(firstSubject?.questions);
            setSelectQuestion(firstSubject?.questions[0]);

            // Start total exam timer
            startTotalTimer(examData.total_duration_minutes);
            // Start first subject timer
            startSubjectTimer(firstSubject.id);
        } catch (error) {
            console.log("Error fetching questions:", error);
        }
    }

    // -------------------------
    // SUBJECT SWITCH
    // -------------------------
    function handleSubject(subjectId) {
        if (lockedSubjects.includes(subjectId)) {
            alert("This subject's time has expired and is locked.");
            return;
        }

        // Pause current subject timer
        pauseSubjectTimer();

        // Switch subject
        const subject = subjects.find((s) => s.id === subjectId);
        if (subject) {
            setActiveSubject(subject);
            activeSubjectIdRef.current = subjectId;
            setSubjectQuestions(subject.questions);
            setSelectQuestion(subject.questions[0]);
            setSelectedOption(null);

            // Resume this subject's timer from where it left off
            startSubjectTimer(subjectId);
        }
    }

    // -------------------------
    // QUESTION NAVIGATION
    // -------------------------
    function handleQuestion(questionId) {
        const question = subjectQuestions.find((q) => q.id === questionId);
        if (question) {
            setSelectQuestion(question);
            const savedAnswer = userAnswers.find((ans) => ans.questionId === questionId);
            setSelectedOption(savedAnswer ? savedAnswer.selectedOptionId : null);
        }
    }

    function goToNextQuestion() {
        const currentIndex = subjectQuestions.findIndex((q) => q.id === selectQuestion?.id);
        if (currentIndex !== -1 && currentIndex < subjectQuestions.length - 1) {
            const nextQuestion = subjectQuestions[currentIndex + 1];
            setSelectQuestion(nextQuestion);
        }
    }

    function handleOptionChange(event) {
        setSelectedOption(Number(event.target.value));
    }

    function clearSelection() {
        setSelectedOption(null);
    }

    function handleQuestionStatus(questionId, status) {
        setQuestionsStatus((prev) => {
            const exists = prev.find((q) => q.questionId === questionId);
            if (!exists) return [...prev, { questionId, status }];
            return prev.map((q) => q.questionId === questionId ? { ...q, status } : q);
        });
    }

    function saveAnswer(questionId, optionId) {
        setUserAnswers((prev) => {
            const existing = prev.find((ans) => ans.questionId === questionId);
            if (existing) {
                return prev.map((ans) =>
                    ans.questionId === questionId ? { ...ans, selectedOptionId: optionId } : ans
                );
            }
            return [...prev, { questionId, selectedOptionId: optionId }];
        });
    }

    useEffect(() => {
        fetchQuestions();
        return () => {
            // Cleanup timers on unmount
            clearInterval(totalTimerRef.current);
            clearInterval(subjectTimerRef.current);
        };
    }, []);

    const isSubjectLocked = activeSubject && lockedSubjects.includes(activeSubject.id);
    const activeSubjectTimeLeft = activeSubject ? subjectTimers[activeSubject.id] : null;

    return (
        <div className='container-fluid h-100'>
            <div className='row h-30'>
                <div className='col-8 border'>
                    <h4>{exam.title}</h4>
                    <div className='d-flex flex-end'>
                        {subjects.map((subject) => (
                            <div className='sub-btn' key={subject.id}>
                                <button
                                    className={`btn ${lockedSubjects.includes(subject.id) ? "btn-danger" : "btn-primary"} mx-1`}
                                    onClick={() => handleSubject(subject.id)}>
                                    {subject.name}
                                    {lockedSubjects.includes(subject.id) && " 🔒"}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className='col-4 border'>
                    <p><b className='fs-3'>{user.full_name}</b></p>
                    <div>
                        {/* Total exam timer — turns red when under 5 mins */}
                        <p style={{ color: totalTimeLeft <= 300 ? "red" : "inherit", fontWeight: "bold" }}>
                            Total Time Left: {formatTime(totalTimeLeft)}
                        </p>
                        {/* Subject timer — turns red when under 2 mins */}
                        <p style={{ color: activeSubjectTimeLeft <= 120 ? "red" : "inherit", fontWeight: "bold" }}>
                            Subject Time Left: {isSubjectLocked ? "🔒 Locked" : formatTime(activeSubjectTimeLeft)}
                        </p>
                    </div>
                </div>
            </div>

            <div className='row h-70'>
                <div className='col-8 border'>
                    {isSubjectLocked && (
                        <div className='alert alert-danger mt-2'>
                            This subject is locked. Time expired.
                        </div>
                    )}
                    <div className='question mt-2'>{selectQuestion?.question_text}</div>
                    <div className='options mt-3'>
                        {selectQuestion?.options?.map((opt) => (
                            <div className='option' key={opt.id}>
                                <label htmlFor={`opt-${opt.id}`}>
                                    <input
                                        type='radio'
                                        name='option'
                                        checked={selectedOption === opt.id}
                                        onChange={handleOptionChange}
                                        id={`opt-${opt.id}`}
                                        value={opt.id}
                                        disabled={isSubjectLocked}
                                    />{" "}
                                    {opt.option_text}
                                </label>
                            </div>
                        ))}
                    </div>

                    <div className='save-response d-flex justify-content-between mt-3 mb-2'>
                        <div className='mark-review'>
                            <button
                                className='btn btn-primary mx-2'
                                disabled={isSubjectLocked}
                                onClick={() => {
                                    handleQuestionStatus(selectQuestion?.id, "marked-for-review");
                                    goToNextQuestion();
                                }}>
                                Mark for review & Save
                            </button>
                            <button
                                className='btn btn-primary'
                                disabled={isSubjectLocked}
                                onClick={() => {
                                    handleClearResponse(selectQuestion?.id);
                                    handleQuestionStatus(selectQuestion?.id, "not-answered");
                                    clearSelection();
                                }}>
                                Clear response
                            </button>
                        </div>
                        <div className='save'>
                            <button
                                className='btn btn-primary'
                                disabled={isSubjectLocked}
                                onClick={() => {
                                    if (!selectedOption) {
                                        handleQuestionStatus(selectQuestion?.id, "not-answered");
                                    } else {
                                        saveAnswer(selectQuestion?.id, selectedOption);
                                        handleQuestionStatus(selectQuestion?.id, "answered");
                                    }
                                    goToNextQuestion();
                                }}>
                                Save & Next
                            </button>
                        </div>
                    </div>
                </div>

                <div className='col-4 border'>
                    <div className='question-pallet'>
                        <p className='text-center'>Question Palette</p>
                        <div className='row g-4 text-center'>
                            {subjectQuestions?.map((que, index) => {
                                let btn = "primary";
                                const status = questionsStatus.find((q) => q.questionId === que.id);
                                if (status?.status === "marked-for-review") btn = "info";
                                else if (status?.status === "answered") btn = "success";
                                else if (status?.status === "not-answered") btn = "danger";

                                return (
                                    <div className='pal-btn col-4' key={que.id}>
                                        <button
                                            className={`btn btn-${btn} col-4`}
                                            onClick={() => handleQuestion(que.id)}>
                                            {index + 1}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className='row mt-5 mb-2'>
                        <div className='col-12 text-center'>
                            <button
                                className='btn btn-primary'
                                onClick={handleFinalSubmit}>
                                Submit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExamViewLayout;
