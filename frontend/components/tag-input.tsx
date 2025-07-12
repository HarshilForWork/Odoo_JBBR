"use client"

import React from "react"
import CreatableSelect from "react-select/creatable"
import { MultiValue, ActionMeta } from "react-select"

interface TagOption {
  label: string
  value: string
}

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export function TagInput({ value, onChange, placeholder = "Add tags...", maxTags = 5 }: TagInputProps) {
  const options = value.map((tag) => ({ label: tag, value: tag }))

  const handleChange = (selected: MultiValue<TagOption>, _actionMeta: ActionMeta<TagOption>) => {
    if (!selected) return onChange([])
    if (selected.length > maxTags) return
    onChange(selected.map((opt) => opt.value))
  }

  return (
    <CreatableSelect
      isMulti
      value={options}
      onChange={handleChange}
      placeholder={placeholder}
      isClearable
      maxMenuHeight={150}
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({ ...base, minHeight: 44 }),
        multiValue: (base) => ({ ...base, backgroundColor: '#e0e7ff', color: '#3730a3' }),
        multiValueLabel: (base) => ({ ...base, color: '#3730a3' }),
      }}
      formatCreateLabel={(inputValue) => `Create tag "${inputValue}"`}
      noOptionsMessage={() => "Type to create a tag"}
      isValidNewOption={(inputValue, selectValue) =>
        !!inputValue &&
        selectValue.length < maxTags &&
        !selectValue.some((opt: TagOption) => opt.value === inputValue)
      }
    />
  )
} 