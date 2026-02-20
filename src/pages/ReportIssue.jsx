import React, { useState } from 'react';
import { Button } from '../components/ui/Button';

export default function ReportIssue() {
  const [formData, setFormData] = useState({ fullName: '', category: '', location: '', description: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Mock Payload Submitted:", formData);
    alert("Issue reported successfully! Check console for payload.");
  };

  // Common input styling for a clean, light theme
  const lightInputClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300";

  return (
    <div className="min-h-[calc(100vh-80px)] bg-mesh py-12 px-4 flex items-center justify-center font-sans">
      
      {/* Light Glassmorphism Card matching the Home Page */}
      <div className="w-full max-w-2xl bg-white/80 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden animate-slide-up rounded-4xl shadow-xl border border-slate-100">
        
        {/* Subtle decorative glows behind the form */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl -z-10 animate-float"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl -z-10 animate-float" style={{ animationDelay: '2s' }}></div>

        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Submit an Issue</h2>
        <p className="text-slate-500 mb-10 text-lg">Help us identify and fix problems in your neighborhood.</p>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Full Name</label>
              <input required type="text" name="fullName" onChange={handleChange} className={lightInputClass} placeholder="e.g. John Doe" />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Category</label>
              <select required name="category" onChange={handleChange} className={`${lightInputClass} appearance-none`}>
                <option value="" className="text-slate-400">Select Category...</option>
                <option value="roads">Roads & Potholes</option>
                <option value="sanitation">Sanitation & Garbage</option>
                <option value="water">Water Supply & Leaks</option>
                <option value="electricity">Streetlights & Power</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Location</label>
            <input required type="text" name="location" onChange={handleChange} className={lightInputClass} placeholder="Enter exact address or landmark" />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Description</label>
            <textarea required name="description" rows="4" onChange={handleChange} className={`${lightInputClass} resize-none`} placeholder="Please describe the issue in detail..."></textarea>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Photo Evidence</label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-10 text-center hover:bg-slate-50 hover:border-blue-400 transition-all duration-300 cursor-pointer group bg-white">
              <svg className="w-10 h-10 mx-auto mb-3 text-slate-400 group-hover:text-blue-500 transition-colors animate-float" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
              <p className="text-slate-600 text-sm font-medium">Drag and drop an image, or <span className="text-blue-600 hover:text-blue-700 underline decoration-blue-200 underline-offset-4">click to browse</span></p>
            </div>
          </div>

          <Button variant="primary" type="submit" className="w-full mt-6">
            Submit Report
          </Button>
        </form>
      </div>
    </div>
  );
}