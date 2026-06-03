import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill window.alert to prevent iframe crashes in the AI Studio environment
(window as any).alert = function(message: string) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl z-[9999] animate-fade-in font-sans text-sm font-bold border-r-4 border-[#D4AF37] max-w-sm';
    toast.style.direction = 'rtl';
    toast.innerHTML = `<div class="flex items-center gap-3"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-[#D4AF37]"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg> <span>${message}</span></div>`;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s';
        setTimeout(() => toast.remove(), 500);
    }, 4000);
};

// Global preventDefault on any unhandled form sumissions to completely eradicate accidental page refreshes
document.addEventListener('submit', (e) => {
    e.preventDefault();
}, true);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Global script protection - prevent errors from triggering recovery reloads
window.onerror = function() {
    console.warn("Caught a global error. Preventing automated reload.");
    return true; // Prevents the browser from doing standard error handling which might reload
};

window.onunhandledrejection = function(event) {
    console.warn("Caught unhandled promise rejection:", event.reason);
    event.preventDefault();
};

root.render(
  <App />
);

// Aggressive protection against page refresh/close
window.addEventListener('beforeunload', (e) => {
    e.preventDefault();
    e.returnValue = 'آیا مطمئن هستید؟ تغییرات ذخیره نشده ممکن است از دست بروند.';
    return e.returnValue;
});

// Suppress Vite HMR reloads at the client level if possible
if (typeof window !== 'undefined') {
  (window as any).__VITE_HMR_ENABLE__ = false;
}
