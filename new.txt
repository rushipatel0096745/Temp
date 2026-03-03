"use client";

import { getCompanyColumns, getCompanyList } from "@/app/services/super-admin/companyList";
import { getBySessionName } from "@/app/utils/helper";
import Link from "next/link";
import React, { Suspense, useEffect, useState } from "react";

interface Company {
  id: number;
  company_id: number;
  company_name: string;
  street: string;
  street2: string;
  city: string;
  state: string;
  country: string;
  postal_code: string;
  email: string;
  gst_or_tax_id: string;
  status: boolean;
  allowed_asset_limit: number;
  is_delete: boolean;
  subscription_validity: string;
  created_at: string;
  updated_at: string;
}

interface Filter {
  field: string;
  condition: string;
  text: string;
}

interface Column {
  name: string;
  type: string;
}

const EMPTY_FILTER: Filter = { field: "", condition: "", text: "" };

const CompanyPage = () => {
  const [sessionId, setSessionId] = useState<string>("");
  const [companyList, setCompanyList] = useState<Company[]>([]);
  const [page, setPage] = useState<number>(1);

  // Applied filters (sent to API)
  const [appliedFilters, setAppliedFilters] = useState<Filter[]>([]);

  // Draft filters (what user is building in the UI)
  const [draftFilters, setDraftFilters] = useState<Filter[]>([{ ...EMPTY_FILTER }]);

  const [columns, setColumns] = useState<Column[]>([]);
  const [conditions, setConditions] = useState<any>({});
  const [showFilter, setShowFilter] = useState<boolean>(false);

  useEffect(() => {
    const fetchSessionId = async () => {
      const id = await getBySessionName("user-session");
      setSessionId(id || "");
    };
    fetchSessionId();
  }, []);

  async function getList() {
    const companies = await getCompanyList(page, appliedFilters);
    setCompanyList(companies || []);
  }

  async function getColumns() {
    const [cols, conds] = await getCompanyColumns();
    setColumns(cols);
    setConditions(conds);
  }

  useEffect(() => {
    getList();
  }, [page, appliedFilters, sessionId]);

  useEffect(() => {
    getColumns();
  }, []);

  // Update a specific draft filter row
  function updateDraftFilter(index: number, key: keyof Filter, value: string) {
    setDraftFilters((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  }

  // Add a new empty filter row
  function addFilterRow() {
    setDraftFilters((prev) => [...prev, { ...EMPTY_FILTER }]);
  }

  // Remove a filter row
  function removeFilterRow(index: number) {
    setDraftFilters((prev) => prev.filter((_, i) => i !== index));
  }

  // Apply: push draft filters to appliedFilters (triggers API)
  function handleApply() {
    const valid = draftFilters.filter((f) => f.field && f.condition && f.text);
    setAppliedFilters(valid);
    setPage(1);
  }

  // Reset everything
  function handleReset() {
    setPage(1);
    setAppliedFilters([]);
    setDraftFilters([{ ...EMPTY_FILTER }]);
  }

  return (
    <div className="main p-4">
      <div className="heading mb-3">
        <h2>Companies</h2>
      </div>

      <div className="filters border-2 border-black p-4 rounded-2xl mb-10">
        <div className="flex justify-between border-2 border-black p-4 rounded-2xl mb-5">
          <div className="title items-center">
            <button className="text-xl" onClick={() => setShowFilter((prev) => !prev)}>
              Filters
            </button>
          </div>
          <div className="actions">
            <button className="border-2 rounded-2xl p-1 mr-2" type="button" onClick={handleReset}>
              Reset
            </button>
            <button className="border-2 rounded-2xl p-1" type="button" onClick={handleApply}>
              Apply filter
            </button>
          </div>
        </div>

        {showFilter && (
          <>
            {draftFilters.map((filter, index) => (
              <div key={index} className="grid grid-cols-[1fr_28px] gap-4 items-end mb-4">
                <div className="flex gap-6 w-full">
                  {/* Column selector */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Select the column</label>
                    <select
                      className="mt-1 w-full rounded-md border-2 border-gray-500"
                      value={filter.field}
                      onChange={(e) => updateDraftFilter(index, "field", e.target.value)}
                    >
                      <option value="">Select the column</option>
                      {columns.map((col) => (
                        <option value={col.name} key={col.name}>
                          {col.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Condition selector */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Select the condition</label>
                    <select
                      className="mt-1 w-full rounded-md border-2 border-gray-500"
                      value={filter.condition}
                      onChange={(e) => updateDraftFilter(index, "condition", e.target.value)}
                    >
                      <option value="">Select the condition</option>
                      {Object?.entries(conditions).map(([label, value]: any) => (
                        <option value={value} key={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Value input */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700">Enter value</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border-2 border-gray-500"
                      value={filter.text}
                      onChange={(e) => updateDraftFilter(index, "text", e.target.value)}
                    />
                  </div>
                </div>

                {/* Remove row */}
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeFilterRow(index)}
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="add-filter-field mt-3">
              <button className="p-2 border rounded-xl" onClick={addFilterRow}>
                + Add
              </button>
            </div>
          </>
        )}
      </div>

      {/* Company list table — unchanged */}
      <div className="company-list border-2 border-black rounded-2xl p-4">
        {/* ... your existing table code ... */}
      </div>
    </div>
  );
};

export default CompanyPage;