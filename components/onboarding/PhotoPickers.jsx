'use client';

import { useEffect, useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';

const MAX_BYTES = 20 * 1024 * 1024;
const ACCEPT = 'image/jpeg,image/png,image/webp';

/** Object URLs have to be revoked, or every re-pick leaks the previous blob. */
const usePreview = (file) => {
  const [url, setUrl] = useState(null);

  // An object URL is an external resource with a lifetime to manage, not
  // derived state — it must be created and revoked in step with the file.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return url;
};

const validate = (file, onError) => {
  if (!file) return false;
  if (file.size > MAX_BYTES) {
    onError?.('That image is over 20MB. Please pick a smaller one.');
    return false;
  }
  return true;
};

/** Single image well — workshop logo (square) and owner selfie (round). */
export function PhotoWell({
  file,
  onChange,
  onError,
  label = 'Upload image',
  placeholder = 'image',
  round = false,
  size = 96,
}) {
  const inputRef = useRef(null);
  const preview = usePreview(file);

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const picked = e.target.files?.[0];
          if (validate(picked, onError)) onChange(picked);
          e.target.value = '';
        }}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-center overflow-hidden text-[12px] cursor-pointer shrink-0"
        style={{
          width: size,
          height: size,
          borderRadius: round ? 999 : 16,
          background: round ? 'var(--color-primary-tint)' : 'var(--color-divider)',
          color: round ? 'var(--color-primary)' : 'var(--color-disabled)',
        }}
      >
        {preview ? (
          // Blob previews are not known to next/image, and the file never
          // reaches a URL loader, so a plain img is the right element here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          placeholder
        )}
      </button>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="text-[12.5px] font-bold text-[var(--color-primary)] cursor-pointer inline-flex items-center gap-2"
      >
        <Upload size={14} />
        {label}
      </button>

      {file && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[12.5px] font-bold text-[var(--color-danger)] cursor-pointer"
        >
          Remove
        </button>
      )}
    </div>
  );
}

/** Shop images: 120×86 tiles plus a dashed add tile. */
export function PhotoGrid({ photos = [], onAdd, onRemove, onError }) {
  const inputRef = useRef(null);

  return (
    <div className="flex gap-3 flex-wrap">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => {
          Array.from(e.target.files ?? []).forEach((file) => {
            if (validate(file, onError)) onAdd(file);
          });
          e.target.value = '';
        }}
      />

      {photos.map((photo, index) => (
        <PhotoTile key={`${photo.name}-${index}`} file={photo} onRemove={() => onRemove(index)} />
      ))}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-[120px] h-[86px] rounded-[14px] flex items-center justify-center text-[20px] text-[var(--color-disabled)] cursor-pointer"
        style={{ border: '2px dashed var(--color-line)' }}
        aria-label="Add workshop image"
      >
        +
      </button>
    </div>
  );
}

function PhotoTile({ file, onRemove }) {
  const preview = usePreview(file);

  return (
    <div
      className="relative w-[120px] h-[86px] rounded-[14px] overflow-hidden flex items-center justify-center text-[11.5px] text-[var(--color-disabled)]"
      style={{ background: 'var(--color-divider)' }}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={preview} alt={file.name} className="w-full h-full object-cover" />
      ) : (
        file.name
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
        className="absolute top-1.5 right-1.5 w-[22px] h-[22px] rounded-full flex items-center justify-center cursor-pointer"
        style={{ background: 'rgba(17,24,39,.55)' }}
      >
        <X size={12} color="#fff" />
      </button>
    </div>
  );
}
