import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { postService } from '../utils/post.service';

interface ProductCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductCrudModal: React.FC<ProductCrudModalProps> = ({ isOpen, onClose }) => {
  const [content, setContent] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await postService(content);

    onClose(); 
  };

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      id="crud-modal"
      tabIndex={-1}
      aria-hidden={!isOpen}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/80 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-transparent blur-2xl" aria-hidden />

        <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-slate-900/90 shadow-2xl shadow-sky-900/40">
          <div className="flex items-center justify-between px-5 py-4 sm:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Compose</p>
              <h3 className="text-lg font-semibold text-white">Share an update</h3>
            </div>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-200 transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 px-5 pb-5 sm:px-6 sm:pb-6">
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium text-slate-200">
                What&apos;s happening?
              </label>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-950/70 shadow-inner shadow-slate-950/80">
                <textarea
                  id="description"
                  rows={5}
                  value={content}
                  onChange={(e)=>setContent(e.target.value)}
                  className="block w-full resize-none bg-transparent px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none"
                  placeholder="Share something with the community..."
                ></textarea>
                <div className="flex items-center justify-between border-t border-white/5 px-4 py-2 text-xs text-slate-400">
                  <span>Markdown not supported yet</span>
                  <span>{content.length}/280</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-slate-100 transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
              >
                <svg className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m5 12 4 4L19 6" />
                </svg>
                Post it
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

type PostFormProps = {
  className?: string;
};

const PostForm: React.FC<PostFormProps> = ({ className = "" }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className={className}>      
      {/* Button to open the modal */}
      <button
        onClick={toggleModal}
        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-900/30 transition hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
        type="button"
      >
        <svg className="h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h14m-7 7V5" />
        </svg>

        Add New Post
      </button>

      {/* The Modal */}
      <ProductCrudModal
        isOpen={isModalOpen}
        onClose={toggleModal}
      />
      
      </div>
  );
};

export default PostForm;
