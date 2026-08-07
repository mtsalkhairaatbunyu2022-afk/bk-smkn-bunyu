import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Trash2, Edit2, Download, Eye, X, Image as ImageIcon, CheckCircle2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { TataTertibDocument } from '../types';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface TataTertibViewProps {
  tataTertibList: TataTertibDocument[];
  onAddTataTertib: (doc: TataTertibDocument) => void;
  onDeleteTataTertib: (id: string) => void;
}

function getBlobUrlFromDataUrl(dataUrl: string): string | null {
  try {
    if (!dataUrl) return null;
    if (dataUrl.startsWith('blob:')) return dataUrl;
    
    const parts = dataUrl.split(',');
    if (parts.length < 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/pdf';
    
    const binaryStr = atob(parts[1]);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mime });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Gagal mengonversi dataURL ke blob:', err);
    return null;
  }
}

const WordViewer: React.FC<{ fileData: string; fileName: string }> = ({ fileData, fileName }) => {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function parseWord() {
      try {
        setLoading(true);
        setError(false);
        const base64 = fileData.split(',')[1] || fileData;
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        if (isMounted) {
          setHtmlContent(result.value || '<p className="text-slate-500">Dokumen tidak memiliki konten teks.</p>');
          setLoading(false);
        }
      } catch (err) {
        console.warn('Gagal memproses file Word:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }
    parseWord();
    return () => { isMounted = false; };
  }, [fileData]);

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 text-xs font-semibold">Memuat & Menampilkan Dokumen Word...</p>
      </div>
    );
  }

  if (error || !htmlContent) {
    return (
      <div className="py-10 px-6 flex flex-col items-center text-center space-y-3">
        <FileText className="w-12 h-12 text-blue-400" />
        <h4 className="text-white font-extrabold text-lg">{fileName}</h4>
        <p className="text-slate-200 text-sm max-w-md leading-relaxed font-semibold">
          Dokumen Word tersimpan dengan aman di dalam sistem dan dapat diunduh untuk diedit kembali.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-h-[800px] overflow-y-auto bg-white text-slate-950 rounded-xl p-6 sm:p-10 shadow-2xl border-2 border-slate-300 text-base leading-relaxed space-y-4">
      <style>{`
        .word-document-content {
          color: #020617 !important;
          font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
          font-size: 16px !important;
          line-height: 1.8 !important;
          -webkit-font-smoothing: antialiased;
        }
        .word-document-content p, 
        .word-document-content span, 
        .word-document-content li, 
        .word-document-content div, 
        .word-document-content td, 
        .word-document-content th {
          color: #020617 !important;
          font-weight: 600 !important;
          font-size: 15px !important;
        }
        .word-document-content h1, 
        .word-document-content h2, 
        .word-document-content h3, 
        .word-document-content h4, 
        .word-document-content h5, 
        .word-document-content h6 {
          color: #000000 !important;
          font-weight: 900 !important;
          margin-top: 1.2em !important;
          margin-bottom: 0.5em !important;
        }
        .word-document-content table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 1.2rem 0 !important;
          border: 2px solid #020617 !important;
        }
        .word-document-content th, 
        .word-document-content td {
          border: 1.5px solid #1e293b !important;
          padding: 10px 14px !important;
          background-color: #ffffff !important;
          color: #020617 !important;
        }
        .word-document-content th {
          background-color: #f1f5f9 !important;
          font-weight: 800 !important;
        }
      `}</style>
      <div 
        className="word-document-content prose max-w-none font-sans"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
    </div>
  );
};

const PdfPageCanvas: React.FC<{
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  scale: number;
}> = ({ pdfDoc, pageNumber, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function renderPage() {
      try {
        const page = await pdfDoc.getPage(pageNumber);
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        // Use ultra-high resolution (4x supersampling) for razor-sharp vector text rendering
        const dpr = window.devicePixelRatio || 1;
        const qualityMultiplier = Math.max(dpr * 2, 4.0);

        const viewport = page.getViewport({ scale });
        const hiResViewport = page.getViewport({ scale: scale * qualityMultiplier });

        canvas.width = Math.floor(hiResViewport.width);
        canvas.height = Math.floor(hiResViewport.height);
        canvas.style.width = '100%';
        canvas.style.maxWidth = `${Math.floor(viewport.width)}px`;
        canvas.style.height = 'auto';

        const renderContext = {
          canvasContext: context,
          viewport: hiResViewport,
        };
        await page.render(renderContext).promise;
      } catch (err) {
        console.warn(`Gagal merender halaman ${pageNumber}:`, err);
      }
    }
    renderPage();
    return () => { isMounted = false; };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div className="flex flex-col items-center my-4 w-full">
      <div className="text-xs font-black text-amber-300 bg-slate-900 border border-amber-400/30 px-4 py-1.5 rounded-full mb-3 shadow-md">
        Halaman {pageNumber}
      </div>
      <canvas ref={canvasRef} className="shadow-2xl rounded-lg bg-white max-w-full border-2 border-slate-300" />
    </div>
  );
};

const PdfViewer: React.FC<{ fileData: string; fileName: string; height?: string; onClose?: () => void }> = ({ fileData, fileName, height = '750px', onClose }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.8);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPdf() {
      try {
        setLoading(true);
        setError(false);
        const base64 = fileData.split(',')[1] || fileData;
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument({ data: bytes.buffer });
        const pdf = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setLoading(false);
      } catch (err) {
        console.warn('Gagal memuat PDF via pdfjs-dist:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => { isMounted = false; };
  }, [fileData]);

  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center justify-center space-y-3 bg-slate-950 rounded-xl border border-slate-800 w-full">
        <div className="w-9 h-9 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-300 text-xs font-bold">Memuat & Menampilkan Dokumen PDF (Mode Scroll Kualitas Tinggi)...</p>
      </div>
    );
  }

  if (error || !numPages) {
    return (
      <div className="py-12 px-6 flex flex-col items-center text-center space-y-4 bg-slate-950 rounded-xl border border-slate-800 w-full">
        <FileText className="w-12 h-12 text-rose-400" />
        <h4 className="text-white font-bold text-base">{fileName}</h4>
        <p className="text-slate-400 text-xs max-w-md">
          Dokumen PDF tersimpan dengan aman di dalam sistem.
        </p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Tutup (X)</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Controls Header */}
      <div className="w-full bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1 bg-slate-950 rounded-lg border border-slate-800 text-amber-400 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Total {numPages} Halaman (Mode Scrolldown)</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setScale(s => Math.max(s - 0.2, 0.6))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Perkecil Tampilan"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-400 min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setScale(s => Math.min(s + 0.2, 2.5))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Perbesar Tampilan"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="ml-2 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-rose-500/30"
              title="Tutup Dokumen (X)"
            >
              <X className="w-4 h-4" />
              <span>Tutup (X)</span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Continuous Vertical Scroll Viewport */}
      <div className="w-full overflow-y-auto p-4 sm:p-6 flex flex-col items-center bg-slate-900/60 space-y-6" style={{ maxHeight: height }}>
        {Array.from({ length: numPages }, (_, index) => (
          <PdfPageCanvas
            key={`pdf-page-${index + 1}`}
            pdfDoc={pdfDocRef.current!}
            pageNumber={index + 1}
            scale={scale}
          />
        ))}
      </div>
    </div>
  );
};

export const TataTertibView: React.FC<TataTertibViewProps> = ({
  tataTertibList,
  onAddTataTertib,
  onDeleteTataTertib,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDraft, setUploadDraft] = useState<{ fileName: string; fileData: string; fileSizeFormatted: string } | null>(null);
  const [uploadFileNameInput, setUploadFileNameInput] = useState('');
  const [previewDoc, setPreviewDoc] = useState<TataTertibDocument | null>(null);
  const [docToDelete, setDocToDelete] = useState<TataTertibDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<TataTertibDocument | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editFileData, setEditFileData] = useState<string | null>(null);
  const [collapsedDocs, setCollapsedDocs] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenEdit = (doc: TataTertibDocument) => {
    setEditingDoc(doc);
    setEditFileName(doc.fileName);
    setEditFileData(doc.fileData);
  };

  const handleSaveEditDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editFileName.trim()) return;

    const updatedDoc: TataTertibDocument = {
      ...editingDoc,
      fileName: editFileName,
      fileData: editFileData || editingDoc.fileData,
      uploadedAt: new Date().toISOString()
    };

    onAddTataTertib(updatedDoc);
    setEditingDoc(null);
    alert(`Dokumen "${editFileName}" berhasil diperbarui!`);
  };

  const handleReplaceFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setEditFileData(event.target.result as string);
        if (!editFileName || editFileName === editingDoc?.fileName) {
          setEditFileName(file.name);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if file is word doc, pdf, or image
    const nameLower = file.name.toLowerCase();
    const isValidFormat = 
      nameLower.endsWith('.doc') || 
      nameLower.endsWith('.docx') || 
      nameLower.endsWith('.pdf') || 
      nameLower.endsWith('.png') || 
      nameLower.endsWith('.jpg') || 
      nameLower.endsWith('.jpeg') || 
      file.type.includes('word') ||
      file.type.includes('pdf') ||
      file.type.startsWith('image/');

    if (!isValidFormat) {
      alert('Harap unggah file dalam format Word (.doc/.docx), PDF (.pdf), atau Gambar (.png/.jpg)');
      e.target.value = '';
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const fileData = event.target?.result as string;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      
      setUploadDraft({
        fileName: file.name,
        fileData: fileData,
        fileSizeFormatted: fileSizeMB,
      });
      setUploadFileNameInput(file.name);
      setIsUploading(false);
    };
    
    reader.onerror = () => {
      alert('Gagal membaca file');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleConfirmSaveUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDraft) return;

    const finalName = uploadFileNameInput.trim() || uploadDraft.fileName;
    const newDoc: TataTertibDocument = {
      id: `tt-${Date.now()}`,
      fileName: finalName,
      fileData: uploadDraft.fileData,
      uploadedAt: new Date().toISOString(),
    };

    onAddTataTertib(newDoc);
    setUploadDraft(null);
    setUploadFileNameInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownload = (doc: TataTertibDocument) => {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileBadge = (fileName: string) => {
    const nameLower = fileName.toLowerCase();
    if (nameLower.endsWith('.pdf')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">PDF</span>;
    }
    if (nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg')) {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">GAMBAR</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">WORD</span>;
  };

  const isPreviewable = (fileName: string) => {
    const nameLower = fileName.toLowerCase();
    return nameLower.endsWith('.pdf') || nameLower.endsWith('.docx') || nameLower.endsWith('.doc') || nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || fileName.startsWith('data:');
  };

  return (
    <div className="bg-[#071533]/80 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl animate-fade-in space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Tata Tertib & Peraturan Sekolah</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Mendukung dokumen ber-Kop Surat Sekolah & Stempel TTD Kepala Sekolah (Format .doc, .docx, .pdf, .jpg, .png)
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-blue-600/20">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Mengunggah...' : 'Unggah Dokumen'}</span>
            <input
              type="file"
              accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>

      {/* Info Banner explaining Image/Header support */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/20 flex items-start gap-3">
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 space-y-1">
          <p className="font-bold text-white">
            Bisa dan Sangat Diumpamakan!
          </p>
          <p className="text-slate-400 leading-relaxed">
            Anda dapat mengunggah file yang memuat <span className="text-amber-300 font-semibold">Kop Sekolah, Logo, Tanda Tangan, & Stempel Cap Basah Kepala Sekolah</span>. File Word (.docx), PDF, maupun Scan Gambar (.png / .jpg) akan tersimpan utuh sesuai dengan format aslinya tanpa mengurangi kualitas gambar.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {tataTertibList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-slate-300 font-bold mb-1">Belum ada dokumen tata tertib</h3>
            <p className="text-slate-500 text-sm text-center max-w-md">
              Silakan unggah file Tata Tertib sekolah (Word, PDF, atau Gambar Scan Kop & TTD Stempel Kepsek). Dokumen akan langsung ditampilkan secara penuh di halaman ini.
            </p>
          </div>
        ) : (
          tataTertibList.map((doc) => {
            const nameLower = doc.fileName.toLowerCase();
            const isImg = nameLower.endsWith('.png') || nameLower.endsWith('.jpg') || nameLower.endsWith('.jpeg') || doc.fileData.startsWith('data:image/');
            const isPdf = nameLower.endsWith('.pdf') || doc.fileData.startsWith('data:application/pdf');
            const isWord = nameLower.endsWith('.docx') || nameLower.endsWith('.doc') || doc.fileData.includes('wordprocessingml') || doc.fileData.includes('msword');

            return (
              <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xl">
                {/* Header Bar for each document */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                      {isImg ? (
                        <ImageIcon className="w-5 h-5 text-amber-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-extrabold text-white">{doc.fileName}</h3>
                        {getFileBadge(doc.fileName)}
                      </div>
                      <p className="text-slate-400 text-xs mt-0.5">
                        Diunggah: {new Date(doc.uploadedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
                    {isPreviewable(doc.fileName) && (
                      <button
                        type="button"
                        onClick={() => setPreviewDoc(doc)}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs flex items-center gap-1.5 transition-colors border border-amber-400/20"
                        title="Buka Layar Penuh"
                      >
                        <Eye className="w-4 h-4" />
                        <span>Layar Penuh</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh File</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(doc)}
                      className="p-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 transition-colors border border-amber-400/20"
                      title="Edit Dokumen"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDocToDelete(doc)}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setCollapsedDocs(prev => ({ ...prev, [doc.id]: !prev[doc.id] }))}
                      className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors border ${
                        collapsedDocs[doc.id]
                          ? 'bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border-amber-400/40'
                          : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                      title={collapsedDocs[doc.id] ? "Buka Tampilan Dokumen" : "Tutup Tampilan Dokumen"}
                    >
                      <X className="w-4 h-4" />
                      <span>{collapsedDocs[doc.id] ? 'Buka View' : 'Tutup View (X)'}</span>
                    </button>
                  </div>
                </div>

                {/* Direct Inline View Container */}
                {!collapsedDocs[doc.id] ? (
                  <div className="w-full bg-slate-950 rounded-xl p-2 sm:p-4 border border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
                    {isImg ? (
                      <div className="w-full flex flex-col items-center">
                        <img
                          src={doc.fileData}
                          alt={doc.fileName}
                          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border-2 border-slate-300 bg-white"
                        />
                      </div>
                    ) : isPdf ? (
                      <PdfViewer
                        fileData={doc.fileData}
                        fileName={doc.fileName}
                        height="700px"
                        onClose={() => setCollapsedDocs(prev => ({ ...prev, [doc.id]: true }))}
                      />
                    ) : isWord ? (
                      <WordViewer fileData={doc.fileData} fileName={doc.fileName} />
                    ) : (
                      <div className="py-12 px-6 flex flex-col items-center text-center space-y-3">
                        <FileText className="w-12 h-12 text-blue-400" />
                        <h4 className="text-white font-bold text-base">{doc.fileName}</h4>
                        <button
                          onClick={() => handleDownload(doc)}
                          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                        >
                          <Download className="w-4 h-4" />
                          <span>Unduh File ({doc.fileName})</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full bg-slate-950/60 rounded-xl p-6 border border-slate-800 border-dashed flex flex-col items-center justify-center text-center space-y-3">
                    <FileText className="w-8 h-8 text-slate-500" />
                    <p className="text-xs text-slate-400 font-semibold">
                      Tampilan dokumen disembunyikan / ditutup.
                    </p>
                    <button
                      type="button"
                      onClick={() => setCollapsedDocs(prev => ({ ...prev, [doc.id]: false }))}
                      className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs shadow-md transition-colors"
                    >
                      Buka Tampilkan Dokumen
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Preview Modal for Images and PDFs */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-5xl w-full p-5 sm:p-6 shadow-2xl relative max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-extrabold text-white truncate max-w-md">{previewDoc.fileName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Tutup Halaman (X)"
              >
                <X className="w-4 h-4" />
                <span>Tutup (X)</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-slate-950 rounded-xl p-2 flex items-center justify-center min-h-[350px]">
              {previewDoc.fileName.toLowerCase().endsWith('.pdf') || previewDoc.fileData.startsWith('data:application/pdf') ? (
                <PdfViewer
                  fileData={previewDoc.fileData}
                  fileName={previewDoc.fileName}
                  height="650px"
                  onClose={() => setPreviewDoc(null)}
                />
              ) : previewDoc.fileName.toLowerCase().endsWith('.docx') || previewDoc.fileName.toLowerCase().endsWith('.doc') || previewDoc.fileData.includes('wordprocessingml') ? (
                <WordViewer fileData={previewDoc.fileData} fileName={previewDoc.fileName} />
              ) : (
                <img src={previewDoc.fileData} alt={previewDoc.fileName} className="max-w-full max-h-[650px] object-contain rounded-lg shadow-2xl bg-white border-2 border-slate-300" />
              )}
            </div>

            <div className="pt-4 mt-3 flex items-center justify-between gap-3 border-t border-slate-800">
              <p className="text-xs text-slate-400">Mode Pratinjau Dokumen Layar Penuh</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-600/80 text-slate-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Tutup Halaman</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(previewDoc)}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Dokumen Tata Tertib */}
      {editingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Dokumen Tata Tertib</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDoc(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditDoc} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Judul / Nama File Dokumen</label>
                <input
                  type="text"
                  required
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-amber-400/60"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Ganti File Dokumen (Opsional)</label>
                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs cursor-pointer border border-slate-700 flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    <span>Pilih File Baru...</span>
                    <input
                      type="file"
                      ref={editFileInputRef}
                      onChange={handleReplaceFile}
                      accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
                      className="hidden"
                    />
                  </label>
                  {editFileData !== editingDoc.fileData && (
                    <span className="text-[11px] text-emerald-400 font-semibold">File baru siap diunggah</span>
                  )}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingDoc(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hasil Unggahan Dokumen */}
      {uploadDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0B1B47] border border-slate-700 text-slate-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <span>Konfirmasi & Simpan Unggahan</span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setUploadDraft(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400">Status Berkas:</span>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Siap Disimpan
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400">Ukuran File:</span>
                <span className="text-xs font-bold text-slate-200">{uploadDraft.fileSizeFormatted}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-400">Tipe Dokumen:</span>
                {getFileBadge(uploadDraft.fileName)}
              </div>
            </div>

            <form onSubmit={handleConfirmSaveUpload} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-200 font-bold mb-1.5">
                  Nama / Judul Dokumen Tata Tertib
                </label>
                <input
                  type="text"
                  required
                  value={uploadFileNameInput}
                  onChange={(e) => setUploadFileNameInput(e.target.value)}
                  placeholder="Masukkan judul dokumen..."
                  className="w-full p-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold focus:outline-none focus:border-amber-400"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Anda dapat meninjau atau mengubah judul dokumen sebelum mengonfirmasi penyimpanan.
                </p>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setUploadDraft(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Konfirmasi & Simpan Dokumen</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Modal Confirmation for Deleting Document */}
      {docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Konfirmasi Hapus Dokumen</h3>
                <p className="text-slate-400 text-xs mt-0.5">Tindakan ini tidak dapat dibatalkan.</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800 leading-relaxed">
              Apakah Anda yakin ingin menghapus dokumen <span className="text-amber-300 font-bold">"{docToDelete.fileName}"</span>?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDocToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTataTertib(docToDelete.id);
                  setDocToDelete(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-600/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Dokumen</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

