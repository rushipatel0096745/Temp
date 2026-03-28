"use client";

import Link from "next/link";
import React, { useEffect, useRef, useState } from "react";
import { AssetData } from "../../(admin)/asset/edit/[id]/page";
import { getAssetLocations } from "@/app/services/company-admin/location";
import {
  getMaintenanceTemplateAssetList,
  getManualTemplateAssetList,
  getPreuseTemplateAssetList,
} from "@/app/services/company-admin/template-actions";
import { Location } from "../../(admin)/location-master/page";
import { editAsset } from "@/app/services/company-admin/asset-actions";
import { useRouter } from "next/navigation";
import UpdateQuestionModal from "../Templates/UpdateQuestionModal";
import { DeleteAsset, GetAsset } from "@/app/services/company-admin/assets";
import AssignTagModal from "../Tag/AssignTagModal";
import TagAssign from "./TagAssignModal";
import TagAssignModal from "./TagAssignModal";

interface Props {
  initialAssetData: AssetData;
  id: string;
}

type QuestionType = "boolean" | "text" | "checkbox" | "select";

interface Template {
  id: number;
  title: string;
  questions: Question[];
}

interface Question {
  id: number;
  question: string;
  type: QuestionType;
  options?: string[] | null;
}

type QuestionTypes = {
  boolean: string;
  select: string;
  text: string;
  checkbox: string;
};

interface FormattedQuestion {
  id: number;
  question: string;
  type: QuestionType;
  multiselect_value?: Record<string, string>;
}

const EditAsset = ({ initialAssetData, id }: Props) => {
  // console.log(initialData)
  const [initialData, setInitialData] = useState<AssetData | undefined>(
    initialAssetData,
  );
  const [loactionList, setLocationList] = useState<Location[]>([]);
  const [manualTemplateList, setManualTemplateList] = useState<Template[]>([]);
  const [preuseTemplateList, setPreUseTemplateList] = useState<Template[]>([]);
  const [maintenanceTemplateList, setMaintenanceTemplateList] = useState<
    Template[]
  >([]);

  const [preuseTemplateQuestions, setPreuseTemplateQuestions] = useState<
    Question[] | undefined
  >([]);
  const [maintenanceTemplateQuestions, setMaintenanceTemplateQuestions] =
    useState<Question[] | undefined>([]);

  const [tagUid, setTagUid] = useState(initialData?.tag?.uid);
  const [name, setName] = useState(initialData?.name);
  const [location, setLocation] = useState(Number(initialData?.location?.id));
  const [batchCode, setBatchCode] = useState(initialData?.batch_code);
  const [status, setStatus] = useState(initialData?.status);
  const [manualTemplateId, setManualTemplateId] = useState<number | undefined>(
    initialData?.manual_template?.id,
  );
  const [preuseTemplateId, setPreuseTemplateId] = useState<number | undefined>(
    initialData?.pre_use_template?.id,
  );
  const [maintenanceTemplateId, setMaintenanceTemplateId] = useState(
    initialData?.maintenance_template?.id,
  );
  const [image, setImage] = useState<any>();
  const [third_party_certificate, set_third_party_certificate] = useState<any>(
    initialData?.third_party_certificate?.third_party_certificate,
  );
  const [third_party_start_date, set_third_party_start_date] = useState(
    initialData?.third_party_certificate?.third_party_start_date ?? "",
  );
  const [third_party_expiry_date, set_third_party_expiry_date] = useState(
    initialData?.third_party_certificate?.third_party_expiry_date ?? "",
  );

  const [errors, setErrors] = useState<Record<string, string>>();
  const [formError, setFormError] = useState("");
  const [showMsg, setShowMsg] = useState<string>("");

  async function fetchAsset() {
    const response = await GetAsset(Number(id));
    if (!response.success) {
      setFormError(response.error);
      return;
    }
    if (response.success) {
      setInitialData(response.data);
    }
  }
  useEffect(() => {
    fetchAsset();
  }, []);

  async function handleDelete() {
    const result = await DeleteAsset(Number(id));

    if (!result.success) {
      setFormError(result.error);
    }

    if (result.success) {
      router.push("/company-admin/asset?delete=true");
    }
  }

  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [editingSource, setEditingSource] = useState<
    "preuse" | "maintenance" | null
  >(null);

  function handleSaveUpdatedQuestion(updated: Question) {
    if (editingSource === "preuse") {
      setNewPreuseQuestions((prev) =>
        prev.map((q) => (q.id === updated.id ? updated : q)),
      );
    } else if (editingSource === "maintenance") {
      setNewMaintenanceQuestions((prev) =>
        prev.map((q) => (q.id === updated.id ? updated : q)),
      );
    }
    setEditingQuestion(null);
    setEditingSource(null);
  }

  async function getData() {
    const locations = await getAssetLocations();
    setLocationList(locations);
    const manualTemplates = await getManualTemplateAssetList();
    setManualTemplateList(manualTemplates);
    const preuseTemplates = await getPreuseTemplateAssetList();
    setPreUseTemplateList(preuseTemplates);
    const maintenanceTemplates = await getMaintenanceTemplateAssetList();
    setMaintenanceTemplateList(maintenanceTemplates);
  }

  function validate() {
    const newErrors = {} as Record<string, string>;

    if (!name) newErrors.name = "Name is required";
    if (!location) newErrors.location = "Location is required";
    if (!batchCode) newErrors.batchCode = "Batch code is required";
    if (status === undefined || status === null)
      newErrors.status = "Select the status";
    if (!maintenanceTemplateId)
      newErrors.maintenanceTemplateId = "Select the Maintenance Template";
    if (!preuseTemplateId)
      newErrors.preuseTemplateId = "Select Preuse Template";
    if (third_party_certificate) {
      if (!third_party_start_date)
        newErrors.third_party_start_date = "Select the start date";
      if (!third_party_expiry_date)
        newErrors.third_party_expiry_date = "Select the expiry date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handlePreuseQuestions(id: any) {
    // console.log("handler called")
    // console.log("pre use id: ", preuseTemplateId)
    const preUseTemplateObject = preuseTemplateList.find(
      (tmp: any) => tmp.id === Number(id),
    );
    if (preUseTemplateObject) {
      setPreuseTemplateQuestions(preUseTemplateObject.questions as Question[]);
    } else {
      setPreuseTemplateQuestions([]);
    }
  }

  function handleMaintenanceQuestions(id: any) {
    const maintenaceObject = maintenanceTemplateList.find(
      (tmp: any) => tmp.id === Number(id),
    );
    if (maintenaceObject) {
      setMaintenanceTemplateQuestions(maintenaceObject.questions);
    } else {
      setMaintenanceTemplateQuestions([]);
    }
  }

  useEffect(() => {
    getData();
    // setPreuseTemplateQuestions(initialData?.pre_use_template?.questions as Question[]);
    // setMaintenanceTemplateQuestions(initialData?.maintenance_template?.questions as Question[]);
    // console.log("preuse id: ", preuseTemplateId);
  }, []);

  useEffect(() => {
    if (!initialData) return;

    setTagUid(initialData?.tag?.uid ?? "");
    setName(initialData?.name);
    setLocation(Number(initialData?.location?.id));
    setBatchCode(initialData?.batch_code);
    setStatus(initialData?.status);
    setManualTemplateId(initialData?.manual_template?.id);
    setPreuseTemplateId(initialData?.pre_use_template?.id);
    setMaintenanceTemplateId(initialData?.maintenance_template?.id);
    set_third_party_certificate(
      initialData?.third_party_certificate?.third_party_certificate,
    );
    set_third_party_start_date(
      initialData?.third_party_certificate?.third_party_start_date ?? "",
    );
    set_third_party_expiry_date(
      initialData?.third_party_certificate?.third_party_expiry_date ?? "",
    );
    setPreuseTemplateQuestions(
      initialData?.pre_use_template?.questions as Question[],
    );
    setMaintenanceTemplateQuestions(
      initialData?.maintenance_template?.questions as Question[],
    );

    const maintenanceQs =
      reverseFormatQuestionBody(initialData?.asset_maintenance_questions) || [];
    const preuseQs =
      reverseFormatQuestionBody(initialData?.asset_pre_use_questions) || [];
    setNewMaintenanceQuestions(maintenanceQs);
    setNewPreuseQuestions(preuseQs);
  }, [initialData]);

  const questionTypes: QuestionTypes = {
    boolean: "Yes/No",
    select: "Select",
    text: "Textfield",
    checkbox: "Checkbox",
  };

  // ---------------------------------------------------------------------------------------
  // for dynamic addtion of maintenace template questions
  // const [existedMaintenanceQuestions, setExistedMaintenanceQuestions] = useState([]);
  const intitalMaintenanceQuestions =
    reverseFormatQuestionBody(initialData?.asset_maintenance_questions) || [];
  const [newMaintenanceQuestions, setNewMaintenanceQuestions] = useState<
    Question[]
  >(intitalMaintenanceQuestions);
  const [maintenanceQuestionText, setMaintenanceQuestionText] = useState("");
  const [maintenanceQuestionType, setMaintenanceQuestionType] = useState("");
  const [maintenanceQuestionOptions, setMaintenanceQuestionOptions] = useState<
    string[]
  >([]);
  const [maintenanceQuestionOption, setMaintenanceQuestionOption] =
    useState("");

  useEffect(() => {
    console.log("new maintenace questions: ", newMaintenanceQuestions);
  }, [newMaintenanceQuestions]);

  function handleMaintenanceNewAddQuestion() {
    const questionObj: Question = {
      id: Date.now(),
      question: maintenanceQuestionText,
      type: maintenanceQuestionType as QuestionType,
      options:
        maintenanceQuestionType === "boolean" ||
        maintenanceQuestionType === "text"
          ? null
          : maintenanceQuestionOptions,
    };

    setNewMaintenanceQuestions((prev) => [...prev, questionObj]);

    // reset form
    setMaintenanceQuestionText("");
    setMaintenanceQuestionType("");
    setMaintenanceQuestionOptions([]);
    setMaintenanceQuestionOption("");
  }

  function handleMaintenanceQuestionOptions() {
    if (!maintenanceQuestionOption.trim()) return;

    setMaintenanceQuestionOptions((prev) => [
      ...prev,
      maintenanceQuestionOption,
    ]);
    setMaintenanceQuestionOption("");
  }

  function deleteNewMaintenaceQuestion(id: number) {
    setNewMaintenanceQuestions(
      newMaintenanceQuestions.filter((q) => q.id !== id),
    );
  }

  function handleDeleteMaintenanceOption(index: number) {
    setMaintenanceQuestionOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateMaintenanceOption(value: string, index: number) {
    const updated = [...maintenanceQuestionOptions];
    updated[index] = value;
    setMaintenanceQuestionOptions(updated);
  }
  // -----------------------------------------------------------------------------
  // for dynamic addtion of preuse template questions
  // const [existedMaintenanceQuestions, setExistedMaintenanceQuestions] = useState([]);
  const intitalPreuseQuestions =
    reverseFormatQuestionBody(initialData?.asset_pre_use_questions) || [];
  const [newPreuseQuestions, setNewPreuseQuestions] = useState<Question[]>(
    intitalPreuseQuestions,
  );
  const [preuseQuestionText, setPreuseQuestionText] = useState("");
  const [preuseQuestionType, setPreuseQuestionType] = useState("");
  const [preuseQuestionOptions, setPreuseQuestionOptions] = useState<string[]>(
    [],
  );
  const [preuseQuestionOption, setPreuseQuestionOption] = useState("");

  const [sortSource, setSortSource] = useState<"preuse" | "maintenance" | null>(
    null,
  );

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  function handleDragSort() {
    if (sortSource === "preuse") {
      const items = [...newPreuseQuestions];
      const draggedItem = items.splice(dragItem.current!, 1)[0];
      items.splice(dragOverItem.current!, 0, draggedItem);
      dragItem.current = null;
      dragOverItem.current = null;
      setNewPreuseQuestions(items);
    }
    if (sortSource === "maintenance") {
      const items = [...newMaintenanceQuestions];
      const draggedItem = items.splice(dragItem.current!, 1)[0];
      items.splice(dragOverItem.current!, 0, draggedItem);
      dragItem.current = null;
      dragOverItem.current = null;
      setNewMaintenanceQuestions(items);
    }
  }

  useEffect(() => {
    console.log("new pre use questions: ", newPreuseQuestions);
    console.log("new maintenance questions: ", newMaintenanceQuestions);
  }, [newPreuseQuestions, newMaintenanceQuestions]);

  function handlePreuseNewAddQuestion() {
    const questionObj: Question = {
      id: Date.now(),
      question: preuseQuestionText,
      type: preuseQuestionType as QuestionType,
      options:
        preuseQuestionType === "boolean" || preuseQuestionType === "text"
          ? null
          : preuseQuestionOptions,
    };

    setNewPreuseQuestions((prev) => [...prev, questionObj]);

    // reset form
    setPreuseQuestionText("");
    setPreuseQuestionType("");
    setPreuseQuestionOptions([]);
    setPreuseQuestionOption("");
  }

  function handlePreuseQuestionOptions() {
    if (!preuseQuestionOption.trim()) return;

    setPreuseQuestionOptions((prev) => [...prev, preuseQuestionOption]);
    setPreuseQuestionOption("");
  }

  function deleteNewPreuseQuestion(id: number) {
    setNewPreuseQuestions(newPreuseQuestions.filter((q) => q.id !== id));
  }

  function handleDeleteOption(index: number) {
    setPreuseQuestionOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function handleUpdateOption(value: string, index: number) {
    const updated = [...preuseQuestionOptions];
    updated[index] = value;
    setPreuseQuestionOptions(updated);
  }

  const router = useRouter();

  async function handleSubmit() {
    setShowMsg("");

    if (!initialData?.id) {
      setFormError("Asset ID is missing");
      return;
    }

    if (!validate()) {
      return;
    } else {
      const formData = new FormData();
      name && formData.append("name", name);
      location && formData.append("location_id", String(location));
      batchCode && formData.append("batch_code", batchCode);
      status && formData.append("status", String(status));
      if (manualTemplateId)
        formData.append("manual_template_id", String(manualTemplateId));
      preuseTemplateId &&
        formData.append("pre_use_template_id", String(preuseTemplateId));
      maintenanceTemplateId &&
        formData.append(
          "maintenance_template_id",
          String(maintenanceTemplateId),
        );
      image && formData.append("image", image);
      third_party_certificate &&
        formData.append("third_party_certificate", third_party_certificate);
      if (third_party_certificate) {
        if (third_party_start_date)
          formData.append("third_party_start_date", third_party_start_date);
        if (third_party_expiry_date)
          formData.append("third_party_expiry_date", third_party_expiry_date);
      }

      newPreuseQuestions.length !== 0 &&
        formData.append(
          "asset_pre_use_questions",
          JSON.stringify(formatQuestionBody(newPreuseQuestions)),
        );
      newMaintenanceQuestions.length !== 0 &&
        formData.append(
          "asset_maintenance_questions",
          JSON.stringify(formatQuestionBody(newMaintenanceQuestions)),
        );

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await editAsset(initialData.id, formData);
      if (response.success) {
        setShowMsg("Asset updated successfully");
        router.refresh();
      } else if (!response.success && response.error) {
        setFormError(response.error);
      } else {
        setShowMsg("Asset not able to update");
      }
    }
  }

  function formatQuestionBody(questions: Question[]) {
    const newQuestions = questions.map((q) => {
      const newQuestion = {} as FormattedQuestion;
      newQuestion.question = q.question;
      newQuestion.type = q.type;
      if (q.type === "select" || q.type === "checkbox") {
        let multiselect_value = {} as Record<string, string>;
        if (q.options) {
          q.options.map((option) => {
            multiselect_value[option] = option;
          });
        }
        newQuestion.multiselect_value = multiselect_value;
      }
      return newQuestion;
    });
    return newQuestions;
  }

  function reverseFormatQuestionBody(questions: any[]) {
    const newQuestions = questions?.map((q, index) => {
      const newQuestion = {} as Question;
      newQuestion.id = Date.now() + index;
      newQuestion.question = q.question;
      newQuestion.type = q.type;
      if (q.type === "select" || q.type === "checkbox") {
        let options: string[] = [];
        Object.entries(q.multiselect_value).map(([k, v]) => {
          options.push(k);
        });
        newQuestion.options = options;
      }
      return newQuestion;
    });
    return newQuestions;
  }

  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // const [showMsg, setShowMsg] = useState("")
  const [permError, setPermError] = useState("");

  const imageInputRef = useRef<HTMLInputElement>(null);

  function handleRemoveImage() {
    setImagePreview(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = "";
    }
  }
  return (
    <>
      <TagAssignModal
        isOpen={isModalOpen}
        isClose={closeModal}
        permError={setPermError}
        showMsg={setShowMsg}
        assetId={initialData?.id}
        fetchAssets={fetchAsset}
      />
      {editingQuestion && (
        <UpdateQuestionModal
          question={editingQuestion}
          onClose={() => {
            setEditingQuestion(null);
            setEditingSource(null);
          }}
          onSave={handleSaveUpdatedQuestion}
        />
      )}
      {/* rest of your JSX */}
      <div className="main flex flex-col p-6 bg-white rounded-lg shadow-sm">
        {/* Header */}
        {showMsg && (
          <div className="text-green-600">
            <p>{showMsg}</p>
          </div>
        )}

        {permError && (
          <div className="text-red-500">
            <p>{permError}</p>
          </div>
        )}
        {/* {formError && <div className='text-red-500'>{formError}</div>} */}
        <div className="header flex items-center justify-between mb-6">
          <h4 className="text-xl font-semibold text-gray-800">Edit Asset</h4>

          <div className="flex gap-2">
            <Link
              href="/company-admin/asset"
              className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 rounded text-sm font-medium"
            >
              Back
            </Link>

            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm"
            >
              Delete
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
            >
              Save
            </button>

            {!initialData?.tag?.id && (
              <button
                type="button"
                onClick={openModal}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
              >
                Assign Tag
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            {/* UID */}
            <div className="col-span-2">
              <label className="form-label">UID</label>
              <input
                type="text"
                placeholder={tagUid}
                readOnly
                className="form-input"
              />
            </div>

            {/* Name */}
            <div>
              <label className="form-label">Name</label>
              <input
                type="text"
                className="form-input"
                value={name}
                name="name"
                onChange={(e) => setName(e.target.value)}
              />
              {errors?.name && <p className="text-red-500">{errors?.name}</p>}
            </div>

            {/* Location */}
            <div>
              <label className="form-label">Location</label>
              <select
                className="form-input"
                value={location}
                name="location_id"
                onChange={(e) => setLocation(Number(e.target.value))}
              >
                {loactionList.map((location) => (
                  <option value={location?.id} key={location?.id}>
                    {location?.name}
                  </option>
                ))}
                <option>Test</option>
              </select>
              {errors?.location && (
                <p className="text-red-500">{errors?.location}</p>
              )}
            </div>

            {/* Batch Code */}
            <div>
              <label className="form-label">Batch Code</label>
              <input
                type="text"
                className="form-input"
                value={batchCode}
                name="batch_code"
                onChange={(e) => setBatchCode(e.target.value)}
              />
              {errors?.batchCode && (
                <p className="text-red-500 inline-block">{errors?.batchCode}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="form-label">Status</label>
              <select
                className="form-input"
                value={status}
                name="status"
                onChange={(e) => setStatus(Number(e.target.value))}
              >
                <option value="">Select Status</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
              {errors?.status && (
                <p className="text-red-500 inline-block">{errors?.status}</p>
              )}
            </div>
          </div>

          {/* Upload Section */}
          <div className="grid grid-cols-2 gap-6">
            {/* Image Upload */}
            <div>
              <h5 className="form-section-title">Add Image</h5>
              <div className="upload-box">
                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 w-full">
                  <input
                    ref={imageInputRef}
                    type="file"
                    className="hidden"
                    name="image"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setImage(file);
                        setImagePreview(URL.createObjectURL(file));
                      }
                    }}
                  />
                  <span className="text-sm font-medium">Upload Image</span>
                  <span className="text-xs">Max 5 MB</span>
                </label>
              </div>

              {/* for already uploaded images */}
              {initialData?.image && (
                <div className="relative w-[180px] h-[180px] rounded-[10px] overflow-hidden border border-solid border-[#c9d5ff]">
                  <h4>Uploaded Image</h4>
                  <img
                    src={"https://api.tagxl.com/" + initialData?.image}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {image && imagePreview && (
                <div className="relative w-[180px] h-[180px] rounded-[10px] overflow-hidden border border-solid border-[#c9d5ff]">
                  <p>Asset Image: {image?.name}</p>

                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute top-1.5 right-1.5 z-20 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs shadow"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Certificate Upload */}
            <div>
              <h5 className="form-section-title">Third Party Certificate</h5>
              <div className="upload-box">
                <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-500 w-full">
                  <input
                    type="file"
                    className="hidden"
                    name="third_party_certificate"
                    onChange={(e) =>
                      set_third_party_certificate(
                        e.target.files && e.target.files[0],
                      )
                    }
                  />

                  <div className="flex flex-col items-center gap-2 text-gray-500">
                    <span className="text-sm font-medium">
                      Upload Certificate
                    </span>
                    <span className="text-xs">Max 5 MB</span>
                  </div>
                </label>
              </div>
              {initialData?.third_party_certificate?.length !== 0 &&
                initialData?.third_party_certificate?.map((certi) => (
                  <div className="flex justify-around gap-2" key={certi.id}>
                    <p>
                      Third party certificate: {certi.third_party_certificate.split("/")[3]}
                    </p>
                    <div>
                      <p>
                        Start Date:{" "}
                        {certi.third_party_start_date?.split("T")[0]}
                      </p>
                      <p>
                        End Date: {certi.third_party_expiry_date?.split("T")[0]}
                      </p>
                    </div>
                  </div>
                ))}
              {/* {third_party_certificate && (
                                <div className='show-certificate flex justify-around gap-2'>
                                    <p>Third party certificate: {third_party_certificate.name}</p>

                                    <div className='form-group flex flex-col gap-2'>
                                        <div className='fancy-input relative'>
                                            <input
                                                id='third_party_start_date'
                                                type='date'
                                                name='third_party_start_date'
                                                value={third_party_start_date}
                                                onChange={(e) => set_third_party_start_date(e.target.value)}
                                                className='peer w-full h-12 border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm focus:outline-none focus:border-blue-500'
                                            />

                                            <label
                                                htmlFor='third_party_start_date'
                                                className={`absolute left-3 px-1 bg-white text-gray-500 transition-all duration-200
                                                            ${third_party_start_date ? "top-1 text-xs text-blue-500" : "top-1/2 -translate-y-1/2 text-sm"}
                                                            peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500
                                                            `}>
                                                Start Date
                                            </label>

                                            {errors?.third_party_start_date && (
                                                <p className='text-red-500 text-xs mt-1'>
                                                    {errors.third_party_start_date}
                                                </p>
                                            )}
                                        </div>

                                        <div className='form-group flex gap-2'>
                                            <div className='fancy-input relative'>
                                                <input
                                                    id='third_party_end_date'
                                                    type='date'
                                                    name='third_party_end_date'
                                                    value={third_party_expiry_date}
                                                    onChange={(e) => set_third_party_expiry_date(e.target.value)}
                                                    className='peer w-full h-12 border border-gray-300 rounded-lg px-3 pt-5 pb-2 text-sm focus:outline-none focus:border-blue-500'
                                                />

                                                <label
                                                    htmlFor='third_party_start_date'
                                                    className={`absolute left-3 px-1 bg-white text-gray-500 transition-all duration-200
                                                            ${third_party_start_date ? "top-1 text-xs text-blue-500" : "top-1/2 -translate-y-1/2 text-sm"}
                                                            peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-500
                                                            `}>
                                                    Expiry Date
                                                </label>

                                                {errors?.third_party_end_date && (
                                                    <p className='text-red-500 text-xs mt-1'>
                                                        {errors.third_party_end_date}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )} */}
            </div>
          </div>

          {/* oem certificate */}
          <div className="col-6 w-full border-3 border-solid border-[#f5f6fa] p-5.5">
            <h3 className="mb-4 font-bold">OEM Ceritficate</h3>
            <div className="oem-certificate-block flex justify-between">
              <p className="underline text-sm">
                {initialData?.oem_certificate}
              </p>
              {initialData?.oem_certificate && (
                <Link
                  href={"https://api.tagxl.com/" + initialData?.oem_certificate}
                  download={initialData?.oem_certificate}
                  type="button"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                >
                  Download
                </Link>
              )}
            </div>
          </div>

          {/* manual template */}
          <div className="col-6 w-full border-3 border-solid border-[#f5f6fa] p-5.5">
            <h3 className="mb-4 font-bold">Manual Template</h3>
            <div>
              <label className="form-label">Manual Template</label>
              <select
                className="form-input"
                value={manualTemplateId}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setManualTemplateId(value);
                }}
              >
                <option value={0}>Select</option>
                {manualTemplateList.map((temp: any) => (
                  <option value={temp.id} key={temp.id}>
                    {temp.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* pre use template */}
          <div className="col w-full border-3 border-solid border-[#f5f6fa] p-5.5">
            <h3 className="mb-4 font-bold">Selected Pre-use Check Template</h3>
            <div className="flex flex-col gap-4">
              <div className="select-input">
                <label className="form-label">Pre Use Template</label>
                <select
                  className="form-input"
                  value={preuseTemplateId}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setPreuseTemplateId(value);
                    handlePreuseQuestions(e.target.value);
                  }}
                >
                  {/* <option value=''>Select</option> */}
                  {preuseTemplateList.map((tmp: any) => (
                    <option value={tmp.id} key={tmp.id}>
                      {tmp.title}
                    </option>
                  ))}
                </select>

                {errors?.preuseTemplateId && (
                  <p className="text-red-500 inline-block">
                    {errors.preuseTemplateId}
                  </p>
                )}
              </div>
              <div>
                <h5 className="font-semibold">All Pre Use Check Questions</h5>
              </div>

              {preuseTemplateQuestions?.length !== 0 && (
                <div className="selected-pre-use-quetions  border-3 border-solid border-[#f5f6fa] p-5.5 flex flex-wrap">
                  <div className="title w-full">
                    <h5>Selected Pre-Use Template Questions</h5>
                  </div>

                  <div className="selected-questions flex flex-col gap-2 w-full">
                    {preuseTemplateQuestions?.map((question) => {
                      const question_type = questionTypes[question.type];

                      return (
                        <div
                          className="question-content flex justify-between p-2.5 border rounded-xl border-solid border-gray-400"
                          key={question.id}
                        >
                          <div className="question-text">
                            <p>{question.question}</p>
                          </div>
                          <div className="question-type">
                            <p className="text-black">
                              <span className="text-gray-500">Type: </span>
                              {question_type}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* new asset questions */}
              {/* added new questions */}
              {newPreuseQuestions.length !== 0 && (
                <div className="selected-pre-use-quetions  border-3 border-solid border-[#f5f6fa] p-5.5 flex flex-wrap">
                  <div className="title w-full">
                    <h5>New Asset-Specific Pre-Use Template Questions</h5>
                  </div>
                  {newPreuseQuestions.map((question, index) => {
                    const question_type = questionTypes[question.type];

                    return (
                      <div
                        className="selected-questions w-full"
                        key={question.id}
                        draggable
                        onDragStart={() => (dragItem.current = index)}
                        onDragEnter={() => (dragOverItem.current = index)}
                        onDragEnd={() => {
                          setSortSource("preuse");
                          handleDragSort();
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        style={{ cursor: "grab" }}
                      >
                        <div className="question-content flex justify-between p-2.5 border rounded-xl border-solid border-gray-400">
                          <div className="question-text">
                            <p>{question.question}</p>
                          </div>
                          <div className="question-type gap-2 flex justify-between">
                            <p className="text-black ">
                              <span className="text-gray-500">Type: </span>
                              {question_type}
                            </p>
                            <div className="action-btn flex justify-between gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuestion(question);
                                  setEditingSource("preuse");
                                }}
                                className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 text-sm rounded"
                              >
                                Upadate
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  deleteNewPreuseQuestion(question.id)
                                }
                                className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 text-sm rounded"
                              >
                                Delete
                              </button>
                              <span className="text-gray-400 mr-2 select-none">
                                ⠿
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* new asset questions input */}
              <div className="selected-pre-use-quetions border-3 border-solid border-[#f5f6fa] p-5.5 flex flex-wrap">
                <div className="title w-full">
                  <h5 className="font-semibold">
                    Add New Asset-Specific Pre-Use Template Questions
                  </h5>
                </div>
                <div className="new-questions flex flex-col gap-4 justify-between p-2.5 border rounded-xl border-solid border-gray-400 w-full">
                  <div className="input w-full p-2.5">
                    <textarea
                      value={preuseQuestionText}
                      rows={4}
                      className="form-input resize-none"
                      placeholder="Type your question here"
                      onChange={(e) => setPreuseQuestionText(e.target.value)}
                    />
                  </div>
                  <div className="select-input w-full">
                    <label className="form-label">Select question type</label>
                    <select
                      className="form-input"
                      value={preuseQuestionType}
                      onChange={(e) => setPreuseQuestionType(e.target.value)}
                    >
                      <option value={""}>Selct the question type</option>
                      <option value="boolean">Yes/No</option>
                      <option value="text">Textfield</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  {(preuseQuestionType === "select" ||
                    preuseQuestionType === "checkbox") && (
                    <>
                      {preuseQuestionOptions.map((option, index) => (
                        <div
                          className="select-options flex gap-2 mb-2"
                          key={index}
                        >
                          <input
                            type="text"
                            className="form-input"
                            value={option}
                            onChange={(e) =>
                              handleUpdateOption(e.target.value, index)
                            }
                          />

                          <button
                            type="button"
                            onClick={() => handleDeleteOption(index)}
                            className="bg-red-500 text-white py-1 px-2 text-sm rounded"
                          >
                            Delete
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="form-input"
                          value={preuseQuestionOption}
                          onChange={(e) =>
                            setPreuseQuestionOption(e.target.value)
                          }
                          placeholder="Add option"
                        />

                        <button
                          type="button"
                          onClick={handlePreuseQuestionOptions}
                          className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 text-sm rounded"
                        >
                          Add Option
                        </button>
                      </div>
                    </>
                  )}

                  <div className="action-btn">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handlePreuseNewAddQuestion();
                      }}
                      className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 text-sm rounded"
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* maintenance template */}
          <div className="col w-full border-3 border-solid border-[#f5f6fa] p-5.5">
            <h3 className="mb-4 font-bold">Selected Maintenance Template</h3>
            <div className="flex flex-col gap-4">
              <div className="select-input">
                <label className="form-label">Maintenance Template</label>
                <select
                  className="form-input"
                  value={maintenanceTemplateId}
                  onChange={(e) => {
                    setMaintenanceTemplateId(Number(e.target.value));
                    handleMaintenanceQuestions(e.target.value);
                  }}
                >
                  {/* <option value=''>Select</option> */}
                  {maintenanceTemplateList.map((item) => (
                    <option value={item.id} key={item.id}>
                      {item.title}
                    </option>
                  ))}
                </select>
                {errors?.maintenanceTemplateId && (
                  <p className="text-red-500 inline-block">
                    {errors.maintenanceTemplateId}
                  </p>
                )}
              </div>
              <div>
                <h5 className="font-semibold">
                  All Maintenance Template Questions
                </h5>
              </div>

              {/* selected maintenace questions */}
              {maintenanceTemplateQuestions?.length !== 0 && (
                <div className="selected-pre-use-quetions  border-3 border-solid border-[#f5f6fa] p-5.5 flex flex-wrap">
                  <div className="title w-full">
                    <h5>Selected Maintenance Template Questions</h5>
                  </div>
                  <div className="selected-questions w-full">
                    {maintenanceTemplateQuestions?.map((question) => {
                      const question_type = questionTypes[question.type];
                      return (
                        <div
                          className="question-content flex justify-between p-2.5 border rounded-xl border-solid border-gray-400"
                          key={question.id}
                        >
                          <div className="question-text">
                            <p>{question.question}</p>
                          </div>
                          <div className="question-type">
                            <p className="text-black">
                              <span className="text-gray-500">Type: </span>
                              {question_type}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* new asset questions */}
              {/* added new questions for maintanance */}
              {newMaintenanceQuestions.length !== 0 && (
                <div className="selected-pre-use-quetions  border-3 border-solid border-[#f5f6fa] p-5.5 flex flex-wrap">
                  <div className="title w-full">
                    <h5>New Asset-Specific Maintenace Template Questions</h5>
                  </div>
                  {newMaintenanceQuestions.map((question, index) => {
                    const question_type = questionTypes[question.type];

                    return (
                      <div
                        className="selected-questions w-full"
                        key={question.id}
                        draggable
                        onDragStart={() => (dragItem.current = index)}
                        onDragEnter={() => (dragOverItem.current = index)}
                        onDragEnd={() => {
                          setSortSource("maintenance");
                          handleDragSort();
                        }}
                        onDragOver={(e) => e.preventDefault()}
                        style={{ cursor: "grab" }}
                      >
                        <div className="question-content flex justify-between p-2.5 border rounded-xl border-solid border-gray-400">
                          <div className="question-text">
                            <p>{question.question}</p>
                          </div>
                          <div className="question-type gap-2 flex justify-between">
                            <p className="text-black ">
                              <span className="text-gray-500">Type: </span>
                              {question_type}
                            </p>
                            <div className="action-btn flex justify-between gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingQuestion(question);
                                  setEditingSource("maintenance");
                                }}
                                className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 text-sm rounded"
                              >
                                Upadate
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  deleteNewMaintenaceQuestion(question.id)
                                }
                                className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 text-sm rounded"
                              >
                                Delete
                              </button>
                              <span className="text-gray-400 mr-2 select-none">
                                ⠿
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* maintance input for adding new questions */}
              <div className="selected-pre-use-quetions border-3 border-solid border-[#f5f6fa] p-5.5 flex flex-wrap">
                <div className="title w-full">
                  <h5 className="font-semibold">
                    Add New Asset-Specific Maintenance Template Questions
                  </h5>
                </div>
                <div className="new-questions flex flex-col gap-4 justify-between p-2.5 border rounded-xl border-solid border-gray-400 w-full">
                  <div className="input w-full p-2.5">
                    <textarea
                      value={maintenanceQuestionText}
                      rows={4}
                      className="form-input resize-none"
                      placeholder="Type your question here"
                      onChange={(e) =>
                        setMaintenanceQuestionText(e.target.value)
                      }
                    />
                  </div>
                  <div className="select-input w-full">
                    <label className="form-label">Select question type</label>
                    <select
                      className="form-input"
                      value={maintenanceQuestionType}
                      onChange={(e) =>
                        setMaintenanceQuestionType(e.target.value)
                      }
                    >
                      <option value={""}>Selct the question type</option>
                      <option value="boolean">Yes/No</option>
                      <option value="text">Textfield</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="select">Select</option>
                    </select>
                  </div>
                  {(maintenanceQuestionType === "select" ||
                    maintenanceQuestionType === "checkbox") && (
                    <>
                      {maintenanceQuestionOptions.map((option, index) => (
                        <div
                          className="select-options flex gap-2 mb-2"
                          key={index}
                        >
                          <input
                            type="text"
                            className="form-input"
                            value={option}
                            onChange={(e) =>
                              handleUpdateMaintenanceOption(
                                e.target.value,
                                index,
                              )
                            }
                          />

                          <button
                            type="button"
                            onClick={() => handleDeleteMaintenanceOption(index)}
                            className="bg-red-500 text-white py-1 px-2 text-sm rounded"
                          >
                            Delete
                          </button>
                        </div>
                      ))}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="form-input"
                          value={maintenanceQuestionOption}
                          onChange={(e) =>
                            setMaintenanceQuestionOption(e.target.value)
                          }
                          placeholder="Add option"
                        />

                        <button
                          type="button"
                          onClick={handleMaintenanceQuestionOptions}
                          className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 text-sm rounded"
                        >
                          Add Option
                        </button>
                      </div>
                    </>
                  )}

                  <div className="action-btn">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleMaintenanceNewAddQuestion();
                      }}
                      className="bg-blue-500 hover:bg-blue-700 text-white py-1 px-2 text-sm rounded"
                    >
                      Add Question
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditAsset;
