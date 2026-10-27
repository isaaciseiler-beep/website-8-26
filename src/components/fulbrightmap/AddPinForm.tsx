"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Camera, Loader2, MapPin, X } from "lucide-react";

import {
  ACCEPTED_IMAGE_TYPES,
  validateImageFile,
} from "@/lib/fulbrightmap/image";
import type { PendingLocation } from "@/lib/fulbrightmap/types";

const CAPTION_LIMIT = 200;

export type AddPinFormValues = {
  authorName: string;
  placeName: string;
  caption: string;
  image: File | null;
};

type FormErrors = Partial<Record<keyof AddPinFormValues, string>>;

const INITIAL_VALUES: AddPinFormValues = {
  authorName: "",
  placeName: "",
  caption: "",
  image: null,
};

export default function AddPinForm({
  location,
  submitting,
  onDismiss,
  onSubmit,
}: {
  location: PendingLocation;
  submitting: boolean;
  onDismiss: () => void;
  onSubmit: (values: AddPinFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) onDismiss();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onDismiss, submitting]);

  useEffect(() => {
    if (!values.image) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(values.image);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [values.image]);

  const coordinateLabel = useMemo(
    () => `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
    [location.lat, location.lng],
  );

  function updateField(
    field: keyof AddPinFormValues,
    value: string | File | null,
  ) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      updateField("image", null);
      return;
    }

    const error = validateImageFile(file);
    if (error) {
      setErrors((current) => ({ ...current, image: error }));
      event.target.value = "";
      return;
    }

    updateField("image", file);
  }

  function validate() {
    const nextErrors: FormErrors = {};

    if (!values.authorName.trim()) nextErrors.authorName = "Your name is required.";
    if (!values.placeName.trim()) nextErrors.placeName = "Place name is required.";
    if (!values.caption.trim()) nextErrors.caption = "Caption is required.";
    if (values.caption.trim().length > CAPTION_LIMIT) {
      nextErrors.caption = `Keep the caption to ${CAPTION_LIMIT} characters or fewer.`;
    }
    if (!values.image) nextErrors.image = "A place image is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit({
      ...values,
      authorName: values.authorName.trim(),
      placeName: values.placeName.trim(),
      caption: values.caption.trim(),
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-pin-title"
      className="fulbright-modal-scrim fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-3 backdrop-blur-sm sm:items-center sm:p-6"
    >
      <form
        onSubmit={handleSubmit}
        className="fulbright-modal-card w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-white/15 bg-neutral-950 text-white shadow-2xl shadow-black/40"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
              <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
              {coordinateLabel}
            </div>
            <h2 id="add-pin-title" className="mt-2 text-2xl font-semibold">
              Add your favorite spot
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close add spot form"
            disabled={submitting}
            onClick={onDismiss}
            className="rounded-full p-2 text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70 disabled:opacity-40"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100svh-9rem)] space-y-4 overflow-y-auto p-5">
          <label className="block">
            <span className="text-sm font-medium text-white/85">Your name</span>
            <input
              value={values.authorName}
              onChange={(event) => updateField("authorName", event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white focus:ring-2 focus:ring-white/25"
              placeholder="Mina"
              disabled={submitting}
            />
            {errors.authorName ? (
              <span className="mt-1 block text-sm text-rose-200">{errors.authorName}</span>
            ) : null}
          </label>

          <label className="block">
            <span className="text-sm font-medium text-white/85">Place name</span>
            <input
              value={values.placeName}
              onChange={(event) => updateField("placeName", event.target.value)}
              className="mt-2 h-11 w-full rounded-2xl border border-white/15 bg-white/10 px-4 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white focus:ring-2 focus:ring-white/25"
              placeholder="Tamsui riverside at sunset"
              disabled={submitting}
            />
            {errors.placeName ? (
              <span className="mt-1 block text-sm text-rose-200">{errors.placeName}</span>
            ) : null}
          </label>

          <label className="block">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-white/85">Brief caption</span>
              <span className="text-xs text-white/45">
                {values.caption.length}/{CAPTION_LIMIT}
              </span>
            </div>
            <textarea
              value={values.caption}
              onChange={(event) => updateField("caption", event.target.value)}
              maxLength={CAPTION_LIMIT}
              rows={4}
              className="mt-2 w-full resize-none rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm leading-5 text-white outline-none transition placeholder:text-white/35 focus:border-white focus:ring-2 focus:ring-white/25"
              placeholder="What makes this place worth discovering?"
              disabled={submitting}
            />
            {errors.caption ? (
              <span className="mt-1 block text-sm text-rose-200">{errors.caption}</span>
            ) : null}
          </label>

          <div>
            <label className="block">
              <span className="text-sm font-medium text-white/85">Place image</span>
              <span className="mt-2 flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/10 p-4 text-center transition hover:border-white/70 hover:bg-white/15">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Selected place preview"
                    className="h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <>
                    <Camera aria-hidden="true" className="h-8 w-8 text-white/80" />
                    <span className="mt-2 text-sm font-medium">Upload a photo</span>
                    <span className="mt-1 text-xs text-white/45">
                      JPG, PNG, WebP, or GIF. Up to 5MB.
                    </span>
                  </>
                )}
              </span>
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES.join(",")}
                onChange={onImageChange}
                className="sr-only"
                disabled={submitting}
              />
            </label>
            {errors.image ? (
              <span className="mt-1 block text-sm text-rose-200">{errors.image}</span>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-white/10 p-5">
          <button
            type="button"
            onClick={onDismiss}
            disabled={submitting}
            className="h-11 rounded-[7px] px-4 text-sm font-semibold text-white/75 transition duration-200 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/70 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-white px-5 text-sm font-semibold text-neutral-950 shadow-lg shadow-black/25 transition duration-200 hover:-translate-y-0.5 hover:bg-neutral-200 hover:shadow-xl hover:shadow-black/35 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-white/80 disabled:cursor-wait disabled:bg-white/15 disabled:text-white/55 disabled:shadow-none disabled:hover:translate-y-0"
          >
            {submitting ? (
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            ) : null}
            {submitting ? "Adding spot" : "Add spot"}
          </button>
        </div>
      </form>
    </div>
  );
}
