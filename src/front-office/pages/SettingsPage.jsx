import React, { useEffect, useRef, useState } from "react";
import { useFrontOffice } from "../context/FrontOfficeContext";
import {
  EmptyState,
  Field,
  Modal,
  btnPrimary,
  btnSecondary,
  inputClass,
  selectClass,
} from "../components/ui";

const FIELD_TYPES = ["Text", "Number", "Dropdown", "Date", "Checkbox", "Phone"];

const MASTER_SOURCE_HINT = {
  staff: "Staff · from ERP / Users",
  classes: "Classes · from ERP Program",
  fees: "Fee structures · from ERP",
};

function systemFieldTypeLabel(f) {
  if (f.source && MASTER_SOURCE_HINT[f.source]) {
    return MASTER_SOURCE_HINT[f.source];
  }
  return f.type;
}

function FieldActionsMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        aria-label="More actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="h-5 w-5"
          aria-hidden
        >
          <circle cx="12" cy="5" r="1.75" />
          <circle cx="12" cy="12" r="1.75" />
          <circle cx="12" cy="19" r="1.75" />
        </svg>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 min-w-[8.5rem] overflow-hidden rounded-md border border-gray-200 bg-white py-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              className={`flex w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                item.danger ? "text-red-600" : "text-gray-700"
              }`}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function SettingsPage() {
  const {
    customFields,
    systemFields,
    addCustomField,
    updateCustomField,
    deleteCustomField,
    updateSystemField,
    deleteSystemField,
  } = useFrontOffice();

  const [fieldModal, setFieldModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [editingSystem, setEditingSystem] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    label: "",
    type: "Text",
    required: false,
    options: [""],
  });

  const openNewField = () => {
    setEditingField(null);
    setEditingSystem(false);
    setFieldForm({ label: "", type: "Text", required: false, options: [""] });
    setFieldModal(true);
  };

  const openEditField = (f, isSystem = false) => {
    setEditingField(f);
    setEditingSystem(isSystem);
    setFieldForm({
      label: f.label,
      type: f.type,
      required: !!f.required,
      options: f.options?.length ? [...f.options] : [""],
    });
    setFieldModal(true);
  };

  const dropdownOptions = () =>
    (fieldForm.options || []).map((o) => o.trim()).filter(Boolean);

  const saveField = (e) => {
    e.preventDefault();
    if (!fieldForm.label.trim()) return;
    if (editingSystem && editingField) {
      const linked = Boolean(editingField.source);
      updateSystemField({
        id: editingField.id,
        label: fieldForm.label.trim(),
        required: fieldForm.required,
        ...(linked
          ? {}
          : {
              type: fieldForm.type,
              options:
                fieldForm.type === "Dropdown" ? dropdownOptions() : [],
            }),
      });
      setFieldModal(false);
      return;
    }
    const payload = {
      label: fieldForm.label.trim(),
      type: fieldForm.type,
      required: fieldForm.required,
      options: fieldForm.type === "Dropdown" ? dropdownOptions() : [],
    };
    if (editingField) {
      updateCustomField({ id: editingField.id, ...payload });
    } else {
      addCustomField(payload);
    }
    setFieldModal(false);
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500">
          Configure admission enquiry form fields.
        </p>
      </div>

      <div className="space-y-4 rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Admission Enquiry Fields</h3>
          <button type="button" className={btnPrimary} onClick={openNewField}>
            + Add New Field
          </button>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
            System fields
          </p>
          <ul className="space-y-2">
            {systemFields.map((f) => (
              <li
                key={f.id}
                className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                  f.active === false
                    ? "border-gray-200 bg-gray-50 opacity-60"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900">
                    {f.label}
                    {f.required ? (
                      <span className="text-red-500"> *</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">
                    {systemFieldTypeLabel(f)}
                    {f.active === false ? " · Hidden" : ""}
                  </p>
                </div>
                <FieldActionsMenu
                  items={[
                    {
                      label: "Edit",
                      onClick: () => openEditField(f, true),
                    },
                    {
                      label: "Delete",
                      danger: true,
                      onClick: () => {
                        if (
                          window.confirm(
                            `Delete "${f.label}" from the enquiry form?`
                          )
                        ) {
                          deleteSystemField(f.id);
                        }
                      },
                    },
                  ]}
                />
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase text-gray-400">
            Custom fields
          </p>
          {customFields.length === 0 ? (
            <EmptyState message="No custom fields yet. Add one to extend the enquiry form." />
          ) : (
            <ul className="space-y-2">
              {customFields.map((f) => (
                <li
                  key={f.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm ${
                    f.active === false
                      ? "border-gray-200 bg-gray-50 opacity-60"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {f.label}
                      {f.required ? (
                        <span className="text-red-500"> *</span>
                      ) : null}
                    </p>
                    <p className="text-xs text-gray-500">
                      {f.type}
                      {f.type === "Dropdown"
                        ? ` · ${(f.options || []).join(", ")}`
                        : ""}
                      {f.active === false ? " · Deactivated" : ""}
                    </p>
                  </div>
                  <FieldActionsMenu
                    items={[
                      {
                        label: "Edit",
                        onClick: () => openEditField(f),
                      },
                      {
                        label:
                          f.active === false ? "Activate" : "Deactivate",
                        onClick: () =>
                          updateCustomField({
                            id: f.id,
                            active: f.active === false,
                          }),
                      },
                      {
                        label: "Delete",
                        danger: true,
                        onClick: () => {
                          if (
                            window.confirm(
                              `Delete custom field "${f.label}"?`
                            )
                          ) {
                            deleteCustomField(f.id);
                          }
                        },
                      },
                    ]}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <Modal
        open={fieldModal}
        title={
          editingSystem
            ? "Edit System Field"
            : editingField
              ? "Edit Custom Field"
              : "Add Custom Field"
        }
        onClose={() => setFieldModal(false)}
      >
        <form className="space-y-4" onSubmit={saveField}>
          <Field label="Field Label" required>
            <input
              className={inputClass}
              value={fieldForm.label}
              onChange={(e) =>
                setFieldForm((p) => ({ ...p, label: e.target.value }))
              }
            />
          </Field>
          {editingSystem && editingField?.source ? (
            <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
              {MASTER_SOURCE_HINT[editingField.source] || editingField.type}.
              Values are loaded from the backend — not configured as static
              options here.
            </p>
          ) : (
            <>
              <Field label="Field Type">
                <select
                  className={selectClass}
                  value={fieldForm.type}
                  onChange={(e) =>
                    setFieldForm((p) => ({ ...p, type: e.target.value }))
                  }
                >
                  {FIELD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </Field>
              {fieldForm.type === "Dropdown" ? (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-gray-800">
                    Options
                  </p>
                  <div className="space-y-2">
                    {(fieldForm.options || [""]).map((opt, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          className={inputClass}
                          value={opt}
                          onChange={(e) => {
                            const next = [...fieldForm.options];
                            next[index] = e.target.value;
                            setFieldForm((p) => ({ ...p, options: next }));
                          }}
                          placeholder={`Option ${index + 1}`}
                        />
                        <button
                          type="button"
                          className={`${btnSecondary} shrink-0 text-red-600`}
                          disabled={(fieldForm.options || []).length <= 1}
                          onClick={() => {
                            const next = fieldForm.options.filter(
                              (_, i) => i !== index
                            );
                            setFieldForm((p) => ({
                              ...p,
                              options: next.length ? next : [""],
                            }));
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className={btnSecondary}
                      onClick={() =>
                        setFieldForm((p) => ({
                          ...p,
                          options: [...(p.options || []), ""],
                        }))
                      }
                    >
                      + Add Option
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={fieldForm.required}
              onChange={(e) =>
                setFieldForm((p) => ({ ...p, required: e.target.checked }))
              }
            />
            Required
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className={btnSecondary}
              onClick={() => setFieldModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className={btnPrimary}>
              Save Field
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
