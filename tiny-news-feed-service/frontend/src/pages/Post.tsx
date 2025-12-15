import React, { useState } from 'react';
import { postService } from '../utils/post.service';


interface ProductCrudModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ProductCrudModal: React.FC<ProductCrudModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) {
    return null; // Don't render anything if the modal is closed
  }

  const [content, setContent] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await postService(content);

    onClose(); 
  };

  return (

    <div
      id="crud-modal"
      tabIndex={-1}
      aria-hidden={!isOpen}
      className="fixed min-h-screen bg-gray-50 z-50 inset-0 flex items-center bg-gray justify-center overflow-y-auto overflow-x-hidden"
      onClick={onClose} // Close modal when clicking the backdrop
    >
      {/* Modal content container: max-w-md, centered */}
      <div 
        className="relative p-4 w-full max-w-md max-h-full"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing the modal
      >
        {/* Modal body */}
        <div className="relative bg-neutral-primary-soft border border-default rounded-base shadow-sm p-4 md:p-6">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-default pb-4 md:pb-5">
            <h3 className="text-lg font-medium text-heading">
              Add Post
            </h3>
            {/* Close button */}
            <button
              type="button"
              className="text-body  hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center"
              onClick={onClose}
              aria-label="Close modal"
            >
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18 17.94 6M18 18 6.06 6" />
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 grid-cols-2 py-4 md:py-6">
              
              {/* Description Textarea */}
              <div className="col-span-2">
                <label htmlFor="description" className="block mb-2.5 text-sm font-medium text-heading">Content</label>
                <textarea
                  id="description"
                  rows={4}
                  onChange={(e)=>setContent(e.target.value)}

                  className="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand w-full p-3.5 shadow-xs placeholder:text-body"
                  placeholder="Share something with the world!"
                ></textarea>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="flex items-center space-x-4 border-t border-default pt-4 md:pt-6">
              
              {/* Submit Button */}
              <button
                type="submit"
                className="inline-flex items-center bg-indigo-600 text-white box-border border focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5"
              >
                Submit
              </button>
              
              {/* Cancel Button */}
              <button
                type="button"
                onClick={onClose}
                className="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- 2. Example Usage Component to manage state ---

const PostForm: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  return (
    <div className='fixed top-4 right-4 z-10'>      
      {/* Button to open the modal */}
      <button
        onClick={toggleModal}
        className="inline-flex items-center bg-blue-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors rounded-base text-sm px-4 py-2.5 focus:outline-none"
        type="button"
      >
            <svg className="w-4 h-4 me-1.5 -ms-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
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
// You would export ProductCrudModal and use it where needed.