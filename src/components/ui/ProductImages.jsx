import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2, Star, Link as LinkIcon, ImageOff } from 'lucide-react';
import { uploadApi } from '../../api/services';
import { useToast } from '../../context/ToastContext';
import { thumbUrl, uploadToCloudinary, validateImageFile } from '../../utils/upload';

// The upload configuration never changes at runtime, so fetch it once.
let statusPromise = null;
const getUploadStatus = () => {
  if (!statusPromise) {
    statusPromise = uploadApi.status().then((r) => r.data).catch(() => ({ enabled: false }));
  }
  return statusPromise;
};

/**
 * Product image gallery.
 *
 * Uploads go straight from the browser to Cloudinary with a signature issued by
 * our API, so files never pass through the backend. The first image is the
 * primary one shown in listings; the rest appear on the product page.
 */
export default function ProductImages({ images = [], onChange, disabled = false }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [enabled, setEnabled] = useState(false);
  const [progress, setProgress] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [urlDraft, setUrlDraft] = useState('');
  const [showUrl, setShowUrl] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getUploadStatus().then((status) => {
      if (!cancelled) setEnabled(Boolean(status.enabled));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const uploading = progress !== null;

  const addFiles = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;

    setError('');
    const added = [];

    for (const file of list) {
      const invalid = validateImageFile(file);
      if (invalid) {
        setError(invalid);
        // eslint-disable-next-line no-continue
        continue;
      }

      setProgress(0);
      try {
        // eslint-disable-next-line no-await-in-loop
        const signed = (await uploadApi.signature()).data;
        // eslint-disable-next-line no-await-in-loop
        const result = await uploadToCloudinary(file, signed, setProgress);
        added.push({ url: result.imageUrl, publicId: result.imagePublicId, alt: '' });
      } catch (err) {
        setError(err.message || 'Upload failed');
      } finally {
        setProgress(null);
      }
    }

    if (added.length) {
      onChange([...images, ...added]);
      toast.success(`${added.length} image${added.length === 1 ? '' : 's'} uploaded`);
    }
  };

  const makePrimary = (index) => {
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  const removeAt = (index) => {
    // The old Cloudinary asset is cleaned up by the API when the product saves.
    onChange(images.filter((_, i) => i !== index));
  };

  const addUrl = () => {
    const url = urlDraft.trim();
    if (!url) return;
    onChange([...images, { url, publicId: '', alt: '' }]);
    setUrlDraft('');
  };

  return (
    <div className="field">
      <label className="field-label">Product images</label>

      {images.length > 0 && (
        <div className="pi-grid">
          {images.map((image, index) => (
            <div className={`pi-tile ${index === 0 ? 'primary' : ''}`} key={`${image.url}-${index}`}>
              {image.url ? (
                <img src={thumbUrl(image.url, 200)} alt={image.alt || ''} />
              ) : (
                <span className="center" style={{ height: '100%' }}>
                  <ImageOff size={18} color="var(--ink-400)" />
                </span>
              )}

              {index === 0 && (
                <span className="pi-badge">
                  <Star size={10} /> Primary
                </span>
              )}

              <div className="pi-actions">
                {index !== 0 && (
                  <button
                    type="button"
                    title="Make this the primary image"
                    onClick={() => makePrimary(index)}
                    disabled={disabled}
                  >
                    <Star size={13} />
                  </button>
                )}
                <button
                  type="button"
                  title="Remove"
                  onClick={() => removeAt(index)}
                  disabled={disabled}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {enabled ? (
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
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            if (!disabled && !uploading) addFiles(e.dataTransfer.files);
          }}
        >
          {uploading ? (
            <div style={{ width: '100%', maxWidth: 240 }}>
              <div className="text-sm text-strong">Uploading... {progress}%</div>
              <div className="bar-track mt-8">
                <div className="bar-fill" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : (
            <>
              <div className="empty-icon" style={{ margin: 0, width: 40, height: 40 }}>
                <ImagePlus size={18} />
              </div>
              <div className="text-strong mt-8">
                {images.length ? 'Add more images' : 'Click to upload or drag images here'}
              </div>
              <div className="text-xs text-muted">
                JPG, PNG, WEBP, GIF or AVIF - up to 5 MB each. The first image is the primary one.
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="alert alert-info">
          Image uploads are switched off. Set the <code>CLOUDINARY_*</code> variables on the API to
          enable them, or add an image URL below.
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const { files } = e.target;
          e.target.value = '';
          addFiles(files);
        }}
      />

      {error && <span className="field-error">{error}</span>}

      {(!enabled || showUrl) && (
        <div className="row gap-8 mt-8">
          <input
            className="input grow"
            type="url"
            placeholder="https://example.com/image.jpg"
            value={urlDraft}
            disabled={disabled}
            onChange={(e) => setUrlDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addUrl();
              }
            }}
          />
          <button type="button" className="btn btn-secondary" onClick={addUrl} disabled={disabled}>
            Add
          </button>
        </div>
      )}

      {enabled && !showUrl && (
        <button
          type="button"
          className="btn btn-ghost btn-sm mt-8"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => setShowUrl(true)}
        >
          <LinkIcon size={14} /> Add an image by URL instead
        </button>
      )}
    </div>
  );
}
