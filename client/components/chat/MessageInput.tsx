'use client';

export default function MessageInput() {
  return (
    <div className="p-4 bg-white border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          className="flex-1 bg-gray-100 border-transparent rounded-full px-4 py-2.5 text-sm focus:bg-white focus:border-gray-300 focus:ring-2 focus:ring-black outline-none transition-all cursor-not-allowed"
          placeholder="Type a message..."
          disabled
        />
        <button 
          disabled
          className="bg-black text-white p-2.5 rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
