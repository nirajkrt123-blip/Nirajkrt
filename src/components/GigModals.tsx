import { Upload, X } from 'lucide-react';
import React, { useState } from 'react';
import { useGigKids } from '../context/GigKidsContext';
import { Gig, GigCategory } from '../types/gigkids';
import { formatInr } from '../utils/formatters';

function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 640;
        const scale = img.width > maxWidth ? maxWidth / img.width : 1;
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(reader.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => reject(new Error('Could not process image'));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

interface ProofModalProps {
  gig: Gig;
  onClose: () => void;
}

export function SubmitProofModal({ gig, onClose }: ProofModalProps) {
  const { submitGigProof } = useGigKids();
  const [note, setNote] = useState(gig.proofNote ?? '');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(
    gig.proofImageDataUrl
  );
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError('');
    try {
      const resized = await resizeImageFile(file);
      setPhotoDataUrl(resized);
    } catch {
      setUploadError('Please pick a valid JPG or PNG photo.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitGigProof(gig.id, note, photoDataUrl);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500">
              {gig.category === 'brain' ? 'Brain Gig' : 'Action Gig'} ·{' '}
              <span className="font-mono tabular-nums">{formatInr(gig.rewardInr)}</span>
            </p>
            <h3 id="proof-modal-title" className="text-lg font-semibold text-slate-900 mt-0.5">
              Submit Proof: {gig.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="proof-note"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              What did you complete or discover?
            </label>
            <textarea
              id="proof-note"
              required
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., Swept balcony, wiped railing, or saved ₹1,200 by comparing 3 stores..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div>
            <span className="block text-sm font-medium text-slate-700 mb-1.5">
              Photo Proof (optional)
            </span>
            {photoDataUrl ? (
              <div className="space-y-2">
                <img
                  src={photoDataUrl}
                  alt="Uploaded gig proof preview"
                  className="w-full h-44 object-cover rounded-lg border border-slate-200"
                />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(undefined)}
                  className="text-xs font-medium text-slate-600 hover:text-slate-900 underline cursor-pointer"
                >
                  Remove photo
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center gap-1.5 border border-dashed border-slate-300 rounded-lg p-5 text-center hover:bg-slate-50 cursor-pointer transition-colors">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  Upload photo proof
                </span>
                <span className="text-xs text-slate-500">
                  JPG or PNG snapshot of your finished work or comparison
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="sr-only"
                />
              </label>
            )}
            {uploadError && <p className="mt-1 text-xs text-red-600">{uploadError}</p>}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              Send for Approval
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface ProposeGigModalProps {
  onClose: () => void;
}

export function ProposeGigModal({ onClose }: ProposeGigModalProps) {
  const { proposeCustomGig } = useGigKids();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GigCategory>('brain');
  const [rewardInr, setRewardInr] = useState(250);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    proposeCustomGig({
      title,
      description,
      category,
      rewardInr,
      estimatedMinutes,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="propose-modal-title"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4"
    >
      <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg p-6">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500">Custom Gig Pitch · Entrepreneurial Thinking</p>
            <h3 id="propose-modal-title" className="text-lg font-semibold text-slate-900 mt-0.5">
              Propose Your Own Gig
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label htmlFor="custom-title" className="block text-sm font-medium text-slate-700 mb-1">
              Gig Title
            </label>
            <input
              id="custom-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Organise photo albums or Research cheaper broadband plan"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="block text-sm font-medium text-slate-700 mb-1">Type</span>
              <div className="flex p-1 bg-slate-100 rounded-lg">
                {(['brain', 'action'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      category === cat
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    {cat === 'brain' ? 'Brain' : 'Action'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="custom-reward"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Suggested Price (₹)
              </label>
              <input
                id="custom-reward"
                type="number"
                min={20}
                step={10}
                required
                value={rewardInr}
                onChange={(e) => setRewardInr(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>

            <div>
              <label
                htmlFor="custom-mins"
                className="block text-sm font-medium text-slate-700 mb-1"
              >
                Est. Minutes
              </label>
              <input
                id="custom-mins"
                type="number"
                min={5}
                step={5}
                required
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-mono tabular-nums text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="custom-desc" className="block text-sm font-medium text-slate-700 mb-1">
              How does this create value?
            </label>
            <textarea
              id="custom-desc"
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what you'll deliver and how it helps the family..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-1 focus:ring-indigo-600"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg cursor-pointer"
            >
              Send Pitch to Parent
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
