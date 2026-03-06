"use client";

import React, { useState } from "react";

type TagType = "rfid" | "qr" | "manual" | "";

interface TagItem {
    tag_type: TagType;
    uid: string;
}

const AddTag = () => {
    const initialList: TagItem[] = [
        {
            tag_type: "",
            uid: "",
        },
    ];

    const [tagList, setTagList] = useState<TagItem[]>(initialList);

    const handleAddInput = () => {
        setTagList([...tagList, { tag_type: "", uid: "" }]);
    };

    const handleUidChange = (event: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const { value } = event.target;
        const updated = [...tagList];
        updated[index].uid = value;
        setTagList(updated);
    };

    const handleTagTypeSelect = (type: TagType, index: number) => {
        const updated = [...tagList];
        updated[index].tag_type = type;
        setTagList(updated);
    };

    const handleDeleteInput = (index: number) => {
        if (tagList.length === 1) return; // keep at least one row
        const newArray = [...tagList];
        newArray.splice(index, 1);
        setTagList(newArray);
    };

    const handleSave = () => {
        // Filter out empty rows
        const apiBody = tagList.filter((item) => item.tag_type && item.uid);
        console.log("API Body:", apiBody);
        // e.g: [{ tag_type: "rfid", uid: "7889" }, ...]
    };

    const tagTypeOptions: { label: string; value: TagType }[] = [
        { label: "RFID", value: "rfid" },
        { label: "QR", value: "qr" },
        { label: "Manual", value: "manual" },
    ];

    return (
        <div className='tab-content border border-solid border-[#ededed] rounded-2xl p-5.5'>
            <div className='block'>
                <div className='add-one-by-one_content'>
                    <h4 className='title h4 mb-5 text-[16px] font-semibold leading-5.5'>Add Tags One-by-One</h4>
                    <div className='add-one-by-one_items flex flex-col gap-2.5'>
                        {tagList.map((item, index) => (
                            <div
                                className='add-one-by-one_item grid grid-cols-[316px_1fr_28px] gap-2.5'
                                key={index}>
                                {/* Tag Type Selector */}
                                <div className='actions-btn flex items-center justify-between gap-2'>
                                    {tagTypeOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            type='button'
                                            onClick={() => handleTagTypeSelect(option.value, index)}
                                            className={`btn min-w-25 cursor-pointer text-center rounded-4xl justify-center items-center gap-[6px] h-[38px] px-[10px] py-[14px] text-[14px] font-medium inline-flex border border-solid transition-all duration-150
                                                ${
                                                    item.tag_type === option.value
                                                        ? "bg-[#263f94] border-[#263f94] text-white"
                                                        : "bg-[#f5f6fa] border-[#c9d5ff] text-[#111c43]"
                                                }`}>
                                            {option.label}
                                        </button>
                                    ))}
                                </div>

                                {/* UID Input */}
                                <div className='fancy-input relative'>
                                    <input
                                        placeholder=''
                                        type='text'
                                        value={item.uid}
                                        name='uid'
                                        className='text-[#17181a] bg-[#f5f6fa] border border-solid border-[#efefef] rounded-[10px] w-full h-11 text-[14px] font-medium pt-[18px] px-[14px] pb-[8px]'
                                        onChange={(event) => handleUidChange(event, index)}
                                    />
                                    <label className='form-label absolute left-3 px-0 py-0.5 text-[#676767] top-1 text-[11px] pointer-events-none'>
                                        UID<span className='text-red-500'>*</span>
                                    </label>
                                </div>

                                {/* Delete Button */}
                                <div className='actions-btn flex items-center justify-center'>
                                    <button
                                        className='icon-button delete relative inline-flex items-center justify-center cursor-pointer p-0 border-0 disabled:opacity-30'
                                        type='button'
                                        disabled={tagList.length === 1}
                                        onClick={() => handleDeleteInput(index)}>
                                        <span className='icon-circle'>
                                            <svg
                                                xmlns='http://www.w3.org/2000/svg'
                                                width={16}
                                                height={16}
                                                viewBox='0 0 16 16'
                                                fill='none'>
                                                <path
                                                    d='M11.9997 4.66675H3.99967V13.3334C3.99967 13.4499 4.06459 13.6223 4.22103 13.7787C4.37746 13.9352 4.54983 14.0001 4.66634 14.0001H11.333C11.4495 14.0001 11.6219 13.9352 11.7783 13.7787C11.9348 13.6223 11.9997 13.4499 11.9997 13.3334V4.66675ZM5.99967 11.3334V7.33341C5.99967 6.96522 6.29815 6.66675 6.66634 6.66675C7.03453 6.66675 7.33301 6.96522 7.33301 7.33341V11.3334C7.33301 11.7016 7.03453 12.0001 6.66634 12.0001C6.29815 12.0001 5.99967 11.7016 5.99967 11.3334ZM8.66634 11.3334V7.33341C8.66634 6.96522 8.96482 6.66675 9.33301 6.66675C9.7012 6.66675 9.99967 6.96522 9.99967 7.33341V11.3334C9.99967 11.7016 9.7012 12.0001 9.33301 12.0001C8.96482 12.0001 8.66634 11.7016 8.66634 11.3334ZM9.99967 2.66675C9.99967 2.55024 9.93476 2.37787 9.77832 2.22144C9.62188 2.065 9.44952 2.00008 9.33301 2.00008H6.66634C6.54983 2.00008 6.37747 2.065 6.22103 2.22144C6.06459 2.37787 5.99967 2.55024 5.99967 2.66675V3.33341H9.99967V2.66675ZM11.333 3.33341H13.9997C14.3679 3.33341 14.6663 3.63189 14.6663 4.00008C14.6663 4.36827 14.3679 4.66675 13.9997 4.66675H13.333V13.3334C13.333 13.8836 13.0646 14.3779 12.721 14.7214C12.3775 15.065 11.8832 15.3334 11.333 15.3334H4.66634C4.11619 15.3334 3.62188 15.065 3.27832 14.7214C2.93476 14.3779 2.66634 13.8836 2.66634 13.3334V4.66675H1.99967C1.63148 4.66675 1.33301 4.36827 1.33301 4.00008C1.33301 3.63189 1.63148 3.33341 1.99967 3.33341H4.66634V2.66675C4.66634 2.11659 4.93476 1.62229 5.27832 1.27873C5.62188 0.935163 6.11619 0.666748 6.66634 0.666748H9.33301C9.88316 0.666748 10.3775 0.935163 10.721 1.27873C11.0646 1.62229 11.333 2.11659 11.333 2.66675V3.33341Z'
                                                    fill='#F56262'
                                                />
                                            </svg>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className='actions-btn mt-8 flex gap-2 items-center'>
                        <button
                            type='button'
                            onClick={handleAddInput}
                            className='inline-flex h-[38px] items-center justify-center gap-[6px] rounded-[40px] border border-[#263f94] bg-[#263f94] px-[14px] py-[10px] text-center text-[14px] font-medium text-white transition-all duration-200 cursor-pointer box-border'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width={20}
                                height={20}
                                viewBox='0 0 20 20'
                                fill='none'>
                                <path
                                    fillRule='evenodd'
                                    clipRule='evenodd'
                                    d='M10 4C10.355 4 10.6429 4.28782 10.6429 4.64286V9.35714H15.3571C15.7122 9.35714 16 9.64496 16 10C16 10.355 15.7122 10.6429 15.3571 10.6429H10.6429V15.3571C10.6429 15.7122 10.355 16 10 16C9.64496 16 9.35714 15.7122 9.35714 15.3571V10.6429H4.64286C4.28782 10.6429 4 10.355 4 10C4 9.64496 4.28782 9.35714 4.64286 9.35714H9.35714V4.64286C9.35714 4.28782 9.64496 4 10 4Z'
                                    fill='#fff'
                                />
                            </svg>
                            Add New Tag
                        </button>
                        <button
                            type='button'
                            onClick={handleSave}
                            className='inline-flex h-[38px] items-center justify-center gap-[6px] rounded-[40px] border border-[#2aa466] bg-[#2aa466] px-[14px] py-[10px] text-center text-[14px] font-medium text-white transition-all duration-200 cursor-pointer box-border'>
                            <svg
                                xmlns='http://www.w3.org/2000/svg'
                                width={20}
                                height={20}
                                viewBox='0 0 20 20'
                                fill='none'>
                                <path
                                    d='M7.09144 2.0001C7.59088 1.99989 7.95921 1.99539 8.31382 2.08041C8.61102 2.15167 8.89538 2.26899 9.15598 2.42864L9.2704 2.50326C9.53288 2.68626 9.76857 2.92752 10.0777 3.23669L16.2209 9.37984C16.6447 9.80365 16.9941 10.1523 17.2542 10.4587C17.5198 10.7715 17.7351 11.088 17.8576 11.465C18.0475 12.0495 18.0474 12.6792 17.8576 13.2637C17.7351 13.6407 17.5198 13.9579 17.2542 14.2708C16.9941 14.5771 16.6446 14.9251 16.2209 15.3489L15.3489 16.2209C14.9251 16.6446 14.5771 16.9941 14.2708 17.2542C13.9579 17.5198 13.6407 17.7351 13.2637 17.8576C12.6792 18.0474 12.0495 18.0475 11.465 17.8576C11.0881 17.7351 10.7715 17.5198 10.4587 17.2542C10.1523 16.9941 9.80365 16.6447 9.37985 16.2209L3.23669 10.0777C2.9275 9.76854 2.68627 9.5329 2.50327 9.2704L2.42865 9.15598C2.26899 8.89536 2.15167 8.61103 2.08041 8.31382C1.99541 7.9592 1.99988 7.59088 2.0001 7.09144L2.00081 6.21943C2.00108 5.62071 2.00066 5.12792 2.0335 4.7277C2.06707 4.31893 2.13857 3.94285 2.31849 3.5899C2.59749 3.04257 3.04258 2.59751 3.5899 2.31849L3.72351 2.25595C4.03749 2.12121 4.37001 2.06286 4.72771 2.0335C5.12792 2.00066 5.6207 2.00105 6.21943 2.00081L7.09144 2.0001ZM6.54066 5.33605C7.09098 5.39208 7.5207 5.85687 7.5207 6.42198C7.52057 7.02465 7.03175 7.51343 6.42909 7.51359C5.86396 7.51359 5.39917 7.0839 5.34316 6.53355L5.33748 6.42198L5.34316 6.3104C5.39896 5.75984 5.86381 5.33036 6.42909 5.33036L6.54066 5.33605ZM3.45558 7.09144C3.45533 7.66042 3.45987 7.8267 3.49538 7.97482C3.531 8.12331 3.58975 8.26533 3.6695 8.39554C3.74907 8.52543 3.86344 8.64634 4.26576 9.04866L10.4089 15.1918C10.8497 15.6326 11.1498 15.9322 11.4003 16.1448C11.6443 16.352 11.7934 16.4337 11.9149 16.4732C12.2071 16.5681 12.5223 16.5681 12.8146 16.4732C12.936 16.4337 13.0847 16.3517 13.3284 16.1448C13.5789 15.9322 13.879 15.6326 14.3198 15.1918L15.1918 14.3198C15.6326 13.8791 15.9322 13.5789 16.1448 13.3284C16.3517 13.0847 16.4337 12.936 16.4732 12.8146C16.5682 12.5223 16.5681 12.2072 16.4732 11.9149C16.4337 11.7934 16.352 11.6443 16.1448 11.4003C15.9322 11.1498 15.6326 10.8497 15.1918 10.4089L9.04796 4.26576C8.64571 3.86351 8.52542 3.74906 8.39555 3.6695C8.26534 3.58974 8.12331 3.531 7.97482 3.49538C7.82671 3.45986 7.6604 3.45535 7.09144 3.45558L6.22014 3.45629C5.59732 3.45654 5.17366 3.45714 4.84639 3.48401C4.5278 3.51018 4.36456 3.55752 4.25084 3.61548C3.97733 3.75497 3.75496 3.97732 3.61549 4.25084C3.55751 4.36457 3.51019 4.52771 3.48401 4.84639C3.45714 5.17368 3.45657 5.59726 3.45629 6.22014L3.45558 7.09144Z'
                                    fill='white'
                                />
                            </svg>
                            Save Tag
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddTag;
