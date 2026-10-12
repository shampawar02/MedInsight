import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '../../api/axios';

const UploadBox = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState(null);

  const steps = [
    { title: 'Uploading Document', desc: 'Securely transferring report to server' },
    { title: 'Document Parsing & OCR', desc: 'Extracting digital text and table layouts' },
    { title: 'Medical Biomarker NER', desc: 'Identifying clinical tests, values, and reference ranges' },
    { title: 'Abnormality Detection', desc: 'Comparing results against clinical intervals' },
    { title: 'RAG & ML Insights', desc: 'Generating FAISS vector index, risk screening, and SHAP' },
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile) => {
    const validExtensions = ['pdf', 'png', 'jpg', 'jpeg'];
    const ext = selectedFile.name.split('.').pop().toLowerCase();

    if (!validExtensions.includes(ext)) {
      setError('Please upload a supported PDF, JPG or PNG file.');
      return false;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('The uploaded file exceeds the allowed 15MB size limit.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setCurrentStep(0);
    setError(null);

    // Dynamic progress step timers to simulate the pipeline phases accurately
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1800);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/reports/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      clearInterval(stepInterval);
      setCurrentStep(steps.length); // All done

      setTimeout(() => {
        if (response.data?.report?._id) {
          navigate(`/reports/${response.data.report._id}`);
        } else {
          navigate('/dashboard');
        }
      }, 1000);
    } catch (err) {
      clearInterval(stepInterval);
      setUploading(false);
      console.error('Upload Error:', err);
      setError(
        err.response?.data?.message ||
        'An error occurred during medical report analysis. Please check that the file is legible and try again.'
      );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upload Medical Report</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Upload laboratory tests, blood panels, or metabolic profiles (PDF, PNG, JPG)
        </p>
      </div>

      {/* Drag & Drop Zone */}
      {!uploading ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-sky-500 bg-sky-50/60 scale-[1.01]'
              : 'border-slate-200 hover:border-sky-400 hover:bg-slate-50/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mx-auto mb-4 border border-sky-100 shadow-xs">
            <Upload className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <p className="font-semibold text-slate-800 text-base">
              Drag and drop your file here
            </p>
            <p className="text-slate-400 text-xs sm:text-sm">or click to browse from your computer</p>
          </div>

          <button
            type="button"
            className="mt-4 px-5 py-2.5 bg-white border border-slate-200 hover:border-sky-300 text-slate-700 text-xs font-semibold rounded-xl shadow-xs inline-flex items-center space-x-1.5 transition-colors"
          >
            <span>Choose File</span>
          </button>

          <p className="text-[11px] text-slate-400 mt-4">
            PDF, JPG, PNG up to 10MB
          </p>

          {file && (
            <div className="mt-4 p-3 bg-sky-50 border border-sky-200 rounded-xl inline-flex items-center space-x-2 text-xs text-sky-950">
              <FileText className="w-4 h-4 text-sky-600" />
              <span className="font-semibold">{file.name}</span>
              <span className="text-sky-600">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </div>
      ) : (
        /* Processing Pipeline Progress UI */
        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-6">
          <div className="text-center space-y-1">
            <div className="inline-flex p-3 bg-brand-50 rounded-2xl text-brand-600 mb-2">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Analyzing Document & Biomarkers...</h4>
            <p className="text-xs text-slate-500">Please wait while the AI pipeline structures your data</p>
          </div>

          {/* Steps list */}
          <div className="space-y-3">
            {steps.map((step, idx) => {
              const isCompleted = currentStep > idx;
              const isCurrent = currentStep === idx;

              return (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                    isCompleted
                      ? 'bg-white border-emerald-200 text-slate-800'
                      : isCurrent
                      ? 'bg-brand-50/70 border-brand-300 text-brand-950 font-medium'
                      : 'bg-white/50 border-slate-200/60 text-slate-400'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-4 h-4 text-brand-600 animate-spin flex-shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex-shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold">{step.title}</div>
                      <div className="text-[10px] text-slate-400">{step.desc}</div>
                    </div>
                  </div>
                  {isCompleted && <span className="text-[10px] text-emerald-600 font-semibold">Done</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Action CTA Button */}
      {!uploading && (
        <div className="flex justify-end space-x-3">
          {file && (
            <button
              onClick={() => setFile(null)}
              className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleUpload}
            disabled={!file}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-2"
          >
            <span>Analyze Report</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadBox;
