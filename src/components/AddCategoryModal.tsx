import React, { useState } from 'react';

interface AddCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string, budget: number) => void;
}

export const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [budget, setBudget] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!name.trim()) {
      alert('Please enter a category name');
      return;
    }
    const parsed = parseFloat(budget);
    if (isNaN(parsed) || parsed <= 0) {
      alert('Please enter a valid budget amount');
      return;
    }
    onAdd(name, parsed);
    setName('');
    setBudget('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 no-capture animate-in fade-in">
      <div className="bg-gray-800 rounded-2xl w-full max-w-sm p-6 border border-gray-700 shadow-2xl">
        <h3 className="text-xl font-bold text-white mb-4">Add New Category</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Category Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Investments"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Monthly Budget</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
};
