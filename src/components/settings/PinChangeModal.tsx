import React, { useState } from 'react';
import { AuthService } from '../../services/authService';

interface PinChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PinChangeModal: React.FC<PinChangeModalProps> = ({ isOpen, onClose }) => {
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const reset = () => {
    setOldPin('');
    setNewPin('');
    setConfirmNewPin('');
    setError('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleChangePin = async () => {
    setError('');
    if (newPin.length < 4) {
      setError('PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmNewPin) {
      setError('New PINs do not match');
      return;
    }
    try {
      const success = await AuthService.changePin(oldPin, newPin);
      if (success) {
        alert('PIN changed successfully!');
        handleClose();
      } else {
        setError('Current PIN is incorrect');
      }
    } catch {
      setError('Failed to change PIN');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full border border-gray-700">
        <h2 className="text-xl font-bold text-white mb-4">Change PIN</h2>
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-200 text-sm">{error}</div>
        )}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Current PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={oldPin}
              onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••"
              aria-label="Current PIN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••"
              aria-label="New PIN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="••••"
              aria-label="Confirm New PIN"
            />
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePin}
              className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Change PIN
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
