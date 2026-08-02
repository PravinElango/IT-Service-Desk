import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Monitor,
  Laptop,
  Printer,
  Wifi,
  HelpCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Send,
  Building2,
  Phone,
  Barcode,
  FileText,
  AlertCircle,
  Sparkles,
  Paperclip,
  UploadCloud,
  Image as ImageIcon,
  File,
  X,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_CATEGORY_ICONS = {
  'PC Issue': Monitor,
  'Laptop Issue': Laptop,
  'Printer Issue': Printer,
  'Network Issue': Wifi
};

export default function RaiseTicketPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loadingMaster, setLoadingMaster] = useState(true);

  // Form State
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubOption, setSelectedSubOption] = useState('');
  const [description, setDescription] = useState('');
  const [assetId, setAssetId] = useState('');
  const [contactNumber, setContactNumber] = useState(user?.phone || '');
  const [selectedFloor, setSelectedFloor] = useState(user?.floor || '');
  const [attachments, setAttachments] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMasterData() {
      try {
        setLoadingMaster(true);
        const [catRes, locRes] = await Promise.all([
          api.get('/master/categories'),
          api.get('/master/locations')
        ]);
        if (catRes.data.success) {
          setCategories(catRes.data.categories);
        }
        if (locRes.data.success) {
          const activeLocs = locRes.data.locations.filter((l) => l.is_active === 1);
          setLocations(activeLocs);
          if (!selectedFloor && activeLocs.length > 0) {
            setSelectedFloor(activeLocs[0].name);
          }
        }
      } catch (err) {
        console.error('Failed to load master lookup data:', err);
      } finally {
        setLoadingMaster(false);
      }
    }
    loadMasterData();
  }, []);

  const activeCategoryObj = categories.find((c) => c.name === selectedCategory);
  const availableSubOptions = activeCategoryObj?.subOptions || [];

  const handleCategorySelect = (catName) => {
    setSelectedCategory(catName);
    setSelectedSubOption('');
    setError('');
    setCurrentStep(2);
  };

  const handleSubOptionSelect = (subName) => {
    setSelectedSubOption(subName);
    setError('');
    setCurrentStep(3);
  };

  const validateStep3 = () => {
    if (!description.trim()) {
      setError('Please enter a description of the problem you are experiencing.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep4 = () => {
    if (!assetId.trim() && !contactNumber.trim()) {
      setError('At least one of System Asset ID or Contact Number is required.');
      return false;
    }
    setError('');
    return true;
  };

  const validateStep5 = () => {
    if (!selectedFloor) {
      setError('Please select your location / floor.');
      return false;
    }
    setError('');
    return true;
  };

  const handleNext = () => {
    if (currentStep === 3) {
      if (validateStep3()) setCurrentStep(4);
    } else if (currentStep === 4) {
      if (validateStep4()) setCurrentStep(5);
    }
  };

  // Attachment handling
  const handleFiles = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) => {
      if (file.size > 15 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds maximum allowed size of 15MB.`);
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      alert('You can attach up to 5 files per ticket.');
      return;
    }

    const filesWithPreview = validFiles.map((file) => {
      const isImage = file.type.startsWith('image/');
      return {
        rawFile: file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: isImage ? URL.createObjectURL(file) : null
      };
    });

    setAttachments((prev) => [...prev, ...filesWithPreview]);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => {
      const target = prev[index];
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep5()) return;

    try {
      setSubmitting(true);
      setError('');

      const formData = new FormData();
      formData.append('category', selectedCategory);
      formData.append('sub_option', selectedSubOption);
      formData.append('description', description.trim());
      if (assetId.trim()) formData.append('asset_id', assetId.trim());
      if (contactNumber.trim()) formData.append('contact_number', contactNumber.trim());
      formData.append('floor', selectedFloor);

      attachments.forEach((att) => {
        formData.append('attachments', att.rawFile);
      });

      const res = await api.post('/tickets', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
        const createdTicket = res.data.ticket;
        navigate(`/tickets/${createdTicket.id}`, {
          state: { newlyCreated: true, ticketCode: createdTicket.ticket_code }
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (name) => {
    const IconComponent = DEFAULT_CATEGORY_ICONS[name] || HelpCircle;
    return <IconComponent className="w-8 h-8" />;
  };

  const steps = [
    { num: 1, label: 'Category' },
    { num: 2, label: 'Sub-Option' },
    { num: 3, label: 'Description & Media' },
    { num: 4, label: 'Asset & Contact' },
    { num: 5, label: 'Location & Confirm' }
  ];

  if (loadingMaster) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Step-by-Step Ticket Creator</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Raise IT Support Ticket
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Provide problem details and optionally attach screenshots or error logs for quick resolution.
            </p>
          </div>
          <div className="px-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
            <span className="font-semibold text-slate-900">Requester:</span> {user?.name}
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="grid grid-cols-5 gap-2">
            {steps.map((s) => {
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex flex-col items-center text-center">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-emerald-500 text-white shadow-md shadow-emerald-200'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-md shadow-indigo-200'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-4 h-4" /> : s.num}
                  </div>
                  <span
                    className={`text-[11px] font-semibold mt-2 hidden sm:block ${
                      isCurrent ? 'text-indigo-600 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* Main Wizard Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        {/* STEP 1: Category Selection */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Step 1 — Choose Issue Category</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select the primary hardware or system type experiencing trouble.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategorySelect(cat.name)}
                    className={`p-6 rounded-2xl border text-left transition-all relative flex flex-col justify-between group ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className={`p-3.5 rounded-2xl transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700 group-hover:bg-indigo-50 group-hover:text-indigo-600'
                        }`}
                      >
                        {getCategoryIcon(cat.name)}
                      </div>
                      <span className="text-xs font-bold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                        Select <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>

                    <div className="mt-4">
                      <h3 className="text-base font-bold text-slate-900">{cat.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{cat.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: Sub-Option Selection */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1">
                  Selected: {selectedCategory}
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 2 — Specify Problem Sub-Option
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select the specific symptom that best matches your issue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Change Category
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableSubOptions.map((sub) => {
                const isSelected = selectedSubOption === sub;
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => handleSubOptionSelect(sub)}
                    className={`p-4 rounded-xl border text-left font-semibold text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500'
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <span>{sub}</span>
                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Problem Description & Media Upload */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold mb-1">
                  {selectedCategory} &bull; {selectedSubOption}
                </div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 3 — Problem Description & Media Upload
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provide detailed information and attach screenshots or error logs if available.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div>

            {/* Description Textarea */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Problem Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what happened, any error messages displayed on screen, and steps to reproduce..."
                className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>

            {/* Media & Attachment Upload Zone */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Media & Attachments (Screenshots, Photos, Logs)</span>
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Max 5 files (up to 15MB each)
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt,.log,.zip,.rar"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFiles(e.target.files);
                  }
                }}
              />

              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-600 bg-indigo-50/70 scale-[1.01]'
                    : 'border-slate-300 hover:border-indigo-400 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Click to browse or drag & drop screenshots & documents
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Supports PNG, JPG, WEBP, PDF, TXT, LOG, and ZIP archives
                </p>
              </div>

              {/* Attachments Preview Grid */}
              {attachments.length > 0 && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        {att.previewUrl ? (
                          <img
                            src={att.previewUrl}
                            alt="preview"
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
                            <File className="w-5 h-5" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-800 truncate">{att.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium">
                            {formatFileSize(att.size)}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAttachment(idx);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all"
              >
                <span>Continue to Asset & Contact</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: Asset / Contact Info */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 4 — Asset / Contact Information
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  At least one of System Asset ID or Contact Number is required.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  System Asset ID <span className="text-slate-400 font-normal">(Optional if Phone is filled)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Barcode className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={assetId}
                    onChange={(e) => setAssetId(e.target.value)}
                    placeholder="e.g. ASSET-PC-1042 or PRNT-HP-401"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Located on the sticker barcode attached to the device.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Contact Number <span className="text-slate-400 font-normal">(Optional if Asset ID is filled)</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="e.g. +1-555-0101 or Extension #442"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Number the technician can call if they need access or clarification.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-1.5 transition-all"
              >
                <span>Continue to Location</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Location & Review */}
        {currentStep === 5 && (
          <form onSubmit={handleSubmit} className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Step 5 — Select Location & Confirm
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Specify which floor/location the technician should visit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="text-xs font-semibold text-slate-500 hover:text-indigo-600 flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Floor / Location <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {locations.map((loc) => {
                  const isSelected = selectedFloor === loc.name;
                  return (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => setSelectedFloor(loc.name)}
                      className={`p-3.5 rounded-xl border text-center font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500'
                          : 'border-slate-200 hover:border-indigo-300 text-slate-700'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      <span>{loc.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary Review Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-600" />
                Ticket Summary Review
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">Category:</span>
                  <span className="font-semibold text-slate-800">{selectedCategory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Sub-Option:</span>
                  <span className="font-semibold text-slate-800">{selectedSubOption}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Location:</span>
                  <span className="font-semibold text-slate-800">{selectedFloor}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Asset / Phone:</span>
                  <span className="font-semibold text-slate-800">
                    {assetId || contactNumber || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 text-xs">
                <span className="text-slate-400 block mb-0.5">Description:</span>
                <p className="text-slate-700 italic bg-white p-2.5 rounded-lg border border-slate-200/60 leading-relaxed">
                  "{description}"
                </p>
              </div>

              {attachments.length > 0 && (
                <div className="pt-2 border-t border-slate-200 text-xs">
                  <span className="text-slate-400 block mb-1">
                    Attached Files ({attachments.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {attachments.map((att, i) => (
                      <span
                        key={i}
                        className="px-2 py-1 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-[11px] font-medium flex items-center gap-1"
                      >
                        <Paperclip className="w-3 h-3" />
                        {att.name} ({formatFileSize(att.size)})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Previous
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit IT Support Ticket</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
