import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, Link as LinkIcon, ImageOff } from 'lucide-react';
import { uploadApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { thumbUrl, uploadToCloudinary, validateImageFile } from '../../utils/upload';

// The upload configuration never changes at runtime, so fetch it once per session.
let statusPromise = null;
const getUploadStatus = () => {
  if (!statusPromise) {
    statusPromise = uploadApi.status().then((r) => r.data).catch(() => ({ enabled: false }));
  }
  return statusPromise;
};

/**
 * Image picker for the product form.
 *
 * Uploads go straight from the browser to Cloudinary using a signature issued
 * by our API, so the file never passes through the backend. When Cloudinary is
 * not configured the component degrades to a plain URL field.
 */
export default function ImageUpload({ value, publicId, onChange, disabled = false }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [enabled, setEnabled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [showUrlField, setShowUrlField] = useState(false);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUploadStatus().then((status) => {
      if (!cancelled) setEnabled(Boolean(status.enabled));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => setBroken(false), [value]);

  const handleFile = async (file) => {
    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setProgress(0);
    try {
      const signed = (await uploadApi.signature()).data;
      const result = await uploadToCloudinary(file, signed, setProgress);
      onChange(result);
      toast.success('Image uploaded');
    } catch (err) {
      setError(err.message || 'Upload failed');
      toast.error(err.message || 'Upload failed');
    } finally {
      setProgress(null);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled || progress !== null) return;
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const clear = () => {
    // The previous Cloudinary asset is deleted by the API when the product is
    // saved, so removing here only clears the form.
    onChange({ imageUrl: '', imagePublicId: '' });
    setError('');
  };

  const uploading = progress !== null;

  return (
    <div className="field">
      <label className="field-label">Product image</label>

      {value ? (
        <div className="image-preview">
          {broken ? (
            <div className="image-preview-thumb center">
              <ImageOff size={22} color="var(--ink-400)" />
            </div>
          ) : (
            <img
              className="image-preview-thumb"
              src={thumbUrl(value, 160)}
              alt="Product"
              onError={() => setBroken(true)}
            />
          )}

          <div className="grow" style={{ minWidth: 0 }}>
            <div className="text-strong">{publicId ? 'Uploaded to Cloudinary' : 'External image URL'}</div>
            <div className="text-xs text-muted truncate" title={value}>
              {broken ? 'This image could not be loaded' : value}
            </div>
            <div className="row gap-8 mt-8">
              {enabled && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => inputRef.current?.click()}
                  disabled={disabled || uploading}
                >
                  <ImagePlus size={14} /> Replace
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={clear}
                disabled={disabled || uploading}
              >
                <Trash2 size={14} color="var(--danger-600)" /> Remove
              </button>
            </div>
          </div>
        </div>
      ) : enabled ? (
        <div
          className={`image-drop ${dragging ? 'dragging' : ''} ${uploading ? 'busy' : ''}`.trim()}
          role="button"
          tabIndex={0}
          onClick={() => !disabled && !uploading && inputRef.current?.click()}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled && !uploading) {
              inputRef.current?.click();
            }
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
        >
          {uploading ? (
            <div style={{ width: '100%', maxWidth: 260 }}>
              <div className="text-sm text-strong">Uploading... {progress}%</div>
              <div className="bar-track mt-8">
                <div className="bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className="empty-icon" style={{ margin: 0, width: 44, height: 44 }}>
                <ImagePlus size={20} />
              </div>
              <div className="text-strong mt-8">Click to upload or drag an image here</div>
              <div className="text-xs text-muted">JPG, PNG, WEBP, GIF or AVIF - up to 5 MB</div>
            </>
          )}
        </div>
      ) : (
        <div className="alert alert-info">
          Image uploads are switched off. Set the <code>CLOUDINARY_*</code> variables on the API to
          enable them, or paste an image URL below.
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so choosing the same file twice still fires a change event.
          e.target.value = '';
          if (file) handleFile(file);
        }}
      />

      {error && <span className="field-error">{error}</span>}

      {(!enabled || showUrlField) && (
        <input
          className="input mt-8"
          type="url"
          placeholder="https://example.com/image.jpg"
          value={publicId ? '' : value || ''}
          disabled={disabled || Boolean(publicId)}
          onChange={(e) => onChange({ imageUrl: e.target.value, imagePublicId: '' })}
        />
      )}

      {enabled && !showUrlField && !value && (
        <button
          type="button"
          className="btn btn-ghost btn-sm mt-8"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => setShowUrlField(true)}
        >
          <LinkIcon size={14} /> Paste a URL instead
        </button>
      )}
    </div>
  );
}
