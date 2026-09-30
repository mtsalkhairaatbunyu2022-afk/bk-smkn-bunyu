import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  FileText,
  Trash2,
  Edit2,
  Download,
  X,
  Image as ImageIcon,
  CheckCircle2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Eye,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';
import * as docx from 'docx-preview';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { TataTertibDocument } from '../types';
import { useConfirm } from '../context/ConfirmContext';

// Set worker URL for pdfjs-dist locally
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
} catch (e) {
  console.warn('PDF.js worker URL setup fallback:', e);
}

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

function getFileType(fileName: string, fileData: string = ''): 'pdf' | 'word' | 'image' | 'text' {
  const nameLower = (fileName || '').toLowerCase();
  const dataLower = (fileData || '').toLowerCase();

  if (
    nameLower.endsWith('.png') ||
    nameLower.endsWith('.jpg') ||
    nameLower.endsWith('.jpeg') ||
    nameLower.endsWith('.webp') ||
    nameLower.endsWith('.gif') ||
    dataLower.startsWith('data:image/')
  ) {
    return 'image';
  }

  if (
    nameLower.endsWith('.pdf') ||
    dataLower.includes('pdf') ||
    dataLower.startsWith('data:application/pdf') ||
    dataLower.startsWith('data:application/x-pdf')
  ) {
    return 'pdf';
  }

  if (
    nameLower.endsWith('.docx') ||
    nameLower.endsWith('.doc') ||
    dataLower.includes('wordprocessingml') ||
    dataLower.includes('msword') ||
    dataLower.includes('officedocument')
  ) {
    return 'word';
  }

  return 'text';
}

const DocumentTextReader: React.FC<{ title?: string; text: string }> = ({ title, text }) => {
  return (
    <div className="w-full bg-slate-950 text-slate-100 rounded-xl p-3 sm:p-5 border border-slate-800 shadow-2xl font-sans">
      <div className="max-w-4xl mx-auto bg-white text-slate-950 rounded-xl p-6 sm:p-10 shadow-2xl border-2 border-slate-300">
        {title && (
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <h2 className="text-lg sm:text-2xl font-black text-slate-950 tracking-wide uppercase">{title}</h2>
          </div>
        )}
        <div className="prose max-w-none text-slate-950 whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed space-y-4 font-semibold">
          {text}
        </div>
      </div>
    </div>
  );
};

const WordViewer: React.FC<{ fileData: string; fileName: string; extractedText?: string; isDraft?: boolean }> = ({
  fileData,
  fileName,
  extractedText,
  isDraft = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mammothHtml, setMammothHtml] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function renderDocx() {
      try {
        setLoading(true);
        setError(false);
        setMammothHtml(null);

        const base64 = fileData.split(',')[1] || fileData;
        const binaryStr = atob(base64);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }

        if (containerRef.current) {
          containerRef.current.innerHTML = '';
          try {
            await docx.renderAsync(bytes.buffer, containerRef.current, undefined, {
              className: 'docx-render-wrapper',
              inWrapper: true,
              ignoreWidth: false,
              ignoreHeight: false,
              ignoreFonts: false,
              breakPages: true,
              ignoreLastRenderedPageBreak: false,
              experimental: true,
              useBase64URL: true,
              renderHeaders: true,
              renderFooters: true,
              renderFootnotes: true,
              renderEndnotes: true
            });

            if (isMounted) {
              const pages = containerRef.current.querySelectorAll('.docx-page, section.docx');
              if (pages.length > 0) {
                setPageCount(pages.length);
              }
              setLoading(false);
              return;
            }
          } catch (renderErr) {
            console.warn('docx.renderAsync gagal, beralih ke mammoth HTML fallback:', renderErr);
          }
        }

        // Mammoth HTML Fallback
        const result = await mammoth.convertToHtml({ arrayBuffer: bytes.buffer });
        if (isMounted) {
          if (result.value && result.value.trim().length > 0) {
            setMammothHtml(result.value);
          } else {
            setError(true);
          }
          setLoading(false);
        }
      } catch (err) {
        console.warn('Gagal membaca file Word:', err);
        if (isMounted) {
          setError(true);
          setLoading(false);
        }
      }
    }

    renderDocx();
    return () => {
      isMounted = false;
    };
  }, [fileData]);

  if (error && extractedText) {
    return <DocumentTextReader title={fileName} text={extractedText} />;
  }

  return (
    <div className={`w-full flex flex-col items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl ${isDraft ? 'max-h-[450px]' : ''}`}>
      {/* Header Info Bar */}
      <div className="w-full bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/20 rounded-lg flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Format Microsoft Word (Render 1:1 Presisi Asli)</span>
          </span>
          {pageCount && (
            <span className="text-xs font-black px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg">
              Total {pageCount} Halaman
            </span>
          )}
        </div>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-slate-950 w-full">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-300 text-xs font-bold">Memuat & Menyesuaikan Tata Letak Word Real-Time...</p>
        </div>
      )}

      {mammothHtml && !loading && (
        <div className={`w-full overflow-y-auto p-4 sm:p-8 bg-slate-900/60 ${isDraft ? 'max-h-[360px]' : 'max-h-[85vh]'}`}>
          <div
            className="max-w-4xl mx-auto bg-white text-slate-950 rounded-xl p-6 sm:p-10 shadow-2xl border-2 border-slate-300 prose max-w-none"
            dangerouslySetInnerHTML={{ __html: mammothHtml }}
          />
        </div>
      )}

      <div
        ref={containerRef}
        className={`w-full overflow-x-auto overflow-y-auto p-4 sm:p-8 bg-slate-900/60 flex flex-col items-center ${
          mammothHtml ? 'hidden' : ''
        } ${isDraft ? 'max-h-[360px]' : 'max-h-[85vh]'}`}
      />

      <style>{`
        .docx-render-wrapper {
          background-color: transparent !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
          width: 100%;
        }
        .docx-render-wrapper > section.docx,
        .docx-render-wrapper .docx-page {
          background-color: #ffffff !important;
          color: #020617 !important;
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5) !important;
          border-radius: 4px !important;
          margin-bottom: 20px !important;
          border: 1px solid #cbd5e1 !important;
          position: relative !important;
          max-width: 100% !important;
        }
        .docx-render-wrapper p,
        .docx-render-wrapper span,
        .docx-render-wrapper td,
        .docx-render-wrapper th {
          color: #0f172a !important;
        }
        .docx-render-wrapper table {
          border-collapse: collapse !important;
        }
      `}</style>
    </div>
  );
};

const ImageViewer: React.FC<{ fileData: string; fileName: string; isDraft?: boolean }> = ({ fileData, fileName, isDraft = false }) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  return (
    <div className={`w-full flex flex-col items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl ${isDraft ? 'max-h-[450px]' : ''}`}>
      <div className="w-full bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-slate-200">
        <span className="text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Scan Gambar Kop & Stempel TTD Kepsek (100% Resolusi Tajam Asli)</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRotation(r => (r + 90) % 360)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Putar Gambar 90 Derajat"
          >
            <RotateCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.max(z - 25, 50))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Perkecil Gambar"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-slate-400 min-w-[45px] text-center">{zoomLevel}%</span>
          <button
            type="button"
            onClick={() => setZoomLevel(z => Math.min(z + 25, 250))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
            title="Perbesar Gambar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoomLevel(100);
              setRotation(0);
            }}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
      <div className={`w-full overflow-auto p-4 flex items-center justify-center bg-slate-900/60 ${isDraft ? 'max-h-[360px]' : 'max-h-[85vh]'}`}>
        <img
          src={fileData}
          alt={fileName}
          style={{
            transform: `rotate(${rotation}deg)`,
            width: zoomLevel === 100 ? 'auto' : `${zoomLevel}%`,
            maxWidth: zoomLevel === 100 ? '100%' : 'none',
            imageRendering: '-webkit-optimize-contrast'
          }}
          className="rounded-lg shadow-2xl border-2 border-slate-300 bg-white transition-all duration-200 object-contain"
        />
      </div>
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

        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const viewport = page.getViewport({ scale });
        const hiResViewport = page.getViewport({ scale: scale * dpr });

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
        console.warn(`Gagal merender halaman PDF ${pageNumber}:`, err);
      }
    }
    renderPage();
    return () => {
      isMounted = false;
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div className="flex flex-col items-center my-2 w-full max-w-4xl touch-pan-y">
      <div className="text-xs font-black text-amber-300 bg-slate-900 border border-amber-400/30 px-3.5 py-1 rounded-full mb-2 shadow-md">
        Halaman {pageNumber}
      </div>
      <canvas
        ref={canvasRef}
        style={{ imageRendering: '-webkit-optimize-contrast' }}
        className="shadow-2xl rounded-md bg-white max-w-full border border-slate-300"
      />
    </div>
  );
};

const PdfViewer: React.FC<{
  fileData: string;
  fileName: string;
  height?: string;
  extractedText?: string;
  isDraft?: boolean;
}> = ({ fileData, fileName, height = '750px', extractedText, isDraft = false }) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showAllPages, setShowAllPages] = useState<boolean>(!isDraft);
  const [scale, setScale] = useState<number>(isDraft ? 1.0 : 1.3);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'canvas' | 'native'>('canvas');
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  useEffect(() => {
    let isMounted = true;
    const url = getBlobUrlFromDataUrl(fileData);
    if (url) setBlobUrl(url);

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

        const loadingTask = pdfjsLib.getDocument({
          data: bytes.buffer,
          disableFontFace: false
        });
        const pdf = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        console.warn('PDF.js canvas renderer error, switching to native fallback mode:', err);
        if (isMounted) {
          setViewMode('native');
          setLoading(false);
        }
      }
    }

    loadPdf();
    return () => {
      isMounted = false;
    };
  }, [fileData]);

  const handleOpenNative = () => {
    if (blobUrl) {
      window.open(blobUrl, '_blank');
    }
  };

  return (
    <div className={`w-full flex flex-col items-center bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-2xl ${isDraft ? 'max-h-[450px]' : ''}`}>
      {/* Controls Header */}
      <div className="w-full bg-slate-900 border-b border-slate-800 p-3 flex flex-wrap items-center justify-between gap-3 text-slate-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold px-3 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-lg flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" />
            <span>Mode Lembaran PDF 100% Offline</span>
          </span>

          <div className="flex items-center gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('canvas')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'canvas'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Canvas 1:1
            </button>
            <button
              type="button"
              onClick={() => setViewMode('native')}
              className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all ${
                viewMode === 'native'
                  ? 'bg-amber-400 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Viewer Tersemat
            </button>
          </div>

          {blobUrl && (
            <button
              type="button"
              onClick={handleOpenNative}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1 shadow"
              title="Buka dokumen PDF di tab / aplikasi bawaan"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Buka Bawaan</span>
            </button>
          )}
        </div>

        {/* Page & Zoom Controls for Canvas Mode */}
        {viewMode === 'canvas' && (
          <div className="flex items-center gap-2 flex-wrap">
            {numPages > 1 && (
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
                <button
                  type="button"
                  disabled={currentPage <= 1 || showAllPages}
                  onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                  className="px-2 py-0.5 rounded bg-slate-800 disabled:opacity-40 text-amber-300 font-bold"
                >
                  &lt;
                </button>
                <span className="text-slate-300 font-bold px-1.5">
                  {showAllPages ? `Semua (${numPages})` : `${currentPage} / ${numPages}`}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= numPages || showAllPages}
                  onClick={() => setCurrentPage(p => Math.min(p + 1, numPages))}
                  className="px-2 py-0.5 rounded bg-slate-800 disabled:opacity-40 text-amber-300 font-bold"
                >
                  &gt;
                </button>

                <button
                  type="button"
                  onClick={() => setShowAllPages(s => !s)}
                  className="ml-1 px-2 py-0.5 rounded bg-slate-800 text-[10px] text-amber-400 font-bold hover:bg-slate-700"
                >
                  {showAllPages ? 'Per Halaman' : 'Lihat Semua'}
                </button>
              </div>
            )}

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setScale(s => Math.max(s - 0.2, 0.6))}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white transition-colors"
                title="Perkecil Tampilan"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-slate-400 min-w-[35px] text-center">
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
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 bg-slate-950 w-full">
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-300 text-xs font-bold">Menyiapkan Pratinjau Halaman PDF Real-Time...</p>
        </div>
      )}

      {/* Mode 1: Canvas Render */}
      {!loading && viewMode === 'canvas' && pdfDocRef.current && (
        <div
          className={`w-full overflow-y-auto overflow-x-auto p-3 sm:p-6 flex flex-col items-center bg-slate-900/60 space-y-6 touch-pan-y ${
            isDraft ? 'max-h-[360px]' : ''
          }`}
          style={{ maxHeight: isDraft ? '360px' : height, WebkitOverflowScrolling: 'touch' }}
        >
          {showAllPages ? (
            Array.from({ length: numPages }, (_, index) => (
              <PdfPageCanvas
                key={`pdf-page-${index + 1}`}
                pdfDoc={pdfDocRef.current!}
                pageNumber={index + 1}
                scale={scale}
              />
            ))
          ) : (
            <PdfPageCanvas
              key={`pdf-page-${currentPage}`}
              pdfDoc={pdfDocRef.current!}
              pageNumber={currentPage}
              scale={scale}
            />
          )}
        </div>
      )}

      {/* Mode 2: Native Embedded PDF Object/iFrame Fallback */}
      {(!loading && viewMode === 'native') || error ? (
        <div className={`w-full p-2 bg-slate-900/80 flex flex-col items-center ${isDraft ? 'h-[360px]' : 'h-[750px]'}`}>
          <object
            data={blobUrl || fileData}
            type="application/pdf"
            className="w-full h-full rounded-lg border border-slate-700 shadow-xl bg-white"
          >
            <iframe
              src={blobUrl || fileData}
              title={fileName}
              className="w-full h-full rounded-lg border border-slate-700 shadow-xl bg-white"
            />
          </object>
        </div>
      ) : null}
    </div>
  );
};

export const LiveDocumentRenderer: React.FC<{
  fileData: string;
  fileName: string;
  extractedText?: string;
  isDraft?: boolean;
}> = ({ fileData, fileName, extractedText, isDraft = false }) => {
  const type = getFileType(fileName, fileData);

  if (type === 'image') {
    return <ImageViewer fileData={fileData} fileName={fileName} isDraft={isDraft} />;
  }

  if (type === 'pdf') {
    return (
      <PdfViewer
        fileData={fileData}
        fileName={fileName}
        extractedText={extractedText}
        isDraft={isDraft}
        height="750px"
      />
    );
  }

  if (type === 'word') {
    return (
      <WordViewer
        fileData={fileData}
        fileName={fileName}
        extractedText={extractedText}
        isDraft={isDraft}
      />
    );
  }

  if (extractedText) {
    return <DocumentTextReader title={fileName} text={extractedText} />;
  }

  return (
    <div className="w-full bg-white text-slate-950 rounded-xl p-4 sm:p-6 shadow-2xl border-2 border-slate-300 flex flex-col items-center">
      <h4 className="text-base font-extrabold text-slate-950 mb-3 w-full border-b pb-2">{fileName}</h4>
      <iframe
        src={fileData}
        title={fileName}
        className="w-full h-[550px] rounded-lg border border-slate-300 bg-slate-100"
      />
    </div>
  );
};

export const TataTertibView: React.FC<TataTertibViewProps> = ({
  tataTertibList,
  onAddTataTertib,
  onDeleteTataTertib,
}) => {
  const { confirmAction } = useConfirm();
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [uploadDraft, setUploadDraft] = useState<{
    fileName: string;
    fileData: string;
    fileSizeFormatted: string;
    extractedText?: string;
  } | null>(null);
  const [uploadFileNameInput, setUploadFileNameInput] = useState('');
  const [docToDelete, setDocToDelete] = useState<TataTertibDocument | null>(null);
  const [editingDoc, setEditingDoc] = useState<TataTertibDocument | null>(null);
  const [editFileName, setEditFileName] = useState('');
  const [editFileData, setEditFileData] = useState<string | null>(null);
  const [activeDocId, setActiveDocId] = useState<string>(() => {
    return tataTertibList.length > 0 ? tataTertibList[0].id : '';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Sync activeDocId with available documents
  useEffect(() => {
    if (tataTertibList.length > 0) {
      if (!tataTertibList.some(d => d.id === activeDocId)) {
        setActiveDocId(tataTertibList[0].id);
      }
    } else {
      setActiveDocId('');
    }
  }, [tataTertibList, activeDocId]);

  const activeDoc = tataTertibList.find(d => d.id === activeDocId) || tataTertibList[0];

  const handleOpenEdit = async (doc: TataTertibDocument) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Edit Dokumen',
      message: `Apakah Anda yakin ingin mengedit/mengubah dokumen "${doc.fileName}"?`,
      type: 'edit',
      confirmText: 'Ya, Edit'
    });
    if (!confirmed) return;

    setEditingDoc(doc);
    setEditFileName(doc.fileName);
    setEditFileData(doc.fileData);
  };

  const handleSaveEditDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDoc || !editFileName.trim()) return;

    const confirmed = await confirmAction({
      title: 'Konfirmasi Simpan Edit Dokumen',
      message: `Apakah Anda yakin ingin menyimpan perubahan dokumen "${editFileName}"?`,
      type: 'edit',
      confirmText: 'Ya, Simpan Edit'
    });
    if (!confirmed) return;

    const updatedDoc: TataTertibDocument = {
      ...editingDoc,
      fileName: editFileName,
      fileData: editFileData || editingDoc.fileData,
      uploadedAt: new Date().toISOString()
    };

    onAddTataTertib(updatedDoc);
    setActiveDocId(updatedDoc.id);
    setEditingDoc(null);
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

  const processFile = async (file: File) => {
    const nameLower = file.name.toLowerCase();
    const isValidFormat =
      nameLower.endsWith('.doc') ||
      nameLower.endsWith('.docx') ||
      nameLower.endsWith('.pdf') ||
      nameLower.endsWith('.png') ||
      nameLower.endsWith('.jpg') ||
      nameLower.endsWith('.jpeg') ||
      nameLower.endsWith('.webp') ||
      file.type.includes('word') ||
      file.type.includes('pdf') ||
      file.type.startsWith('image/');

    if (!isValidFormat) {
      alert('Harap unggah file dalam format Word (.doc/.docx), PDF (.pdf), atau Gambar (.png/.jpg/.jpeg)');
      return;
    }

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const fileData = event.target?.result as string;
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2) + ' MB';
      let extractedText: string | undefined = undefined;

      // Extract text in background for Word files
      if (nameLower.endsWith('.docx') || nameLower.endsWith('.doc')) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const raw = await mammoth.extractRawText({ arrayBuffer });
          if (raw.value) {
            extractedText = raw.value;
          }
        } catch (e) {
          console.warn('Text extraction skipped:', e);
        }
      }

      setUploadDraft({
        fileName: file.name,
        fileData: fileData,
        fileSizeFormatted: fileSizeMB,
        extractedText
      });
      setUploadFileNameInput(file.name);
      setIsUploading(false);
    };

    reader.onerror = () => {
      alert('Gagal membaca file.');
      setIsUploading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirmSaveUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDraft) return;

    let finalName = uploadFileNameInput.trim() || uploadDraft.fileName;
    const origExt = uploadDraft.fileName.includes('.')
      ? uploadDraft.fileName.slice(uploadDraft.fileName.lastIndexOf('.'))
      : '';
    if (origExt && !finalName.toLowerCase().endsWith(origExt.toLowerCase())) {
      finalName = `${finalName}${origExt}`;
    }

    const confirmed = await confirmAction({
      title: 'Konfirmasi Unggah Dokumen',
      message: `Apakah Anda yakin ingin mengunggah dan menyimpan dokumen "${finalName}"?`,
      type: 'upload',
      confirmText: 'Ya, Unggah & Simpan'
    });
    if (!confirmed) return;

    const newDoc: TataTertibDocument = {
      id: `tt-${Date.now()}`,
      fileName: finalName,
      fileData: uploadDraft.fileData,
      uploadedAt: new Date().toISOString(),
      fileSizeFormatted: uploadDraft.fileSizeFormatted,
      extractedText: uploadDraft.extractedText
    };

    onAddTataTertib(newDoc);
    setActiveDocId(newDoc.id);

    setUploadDraft(null);
    setUploadFileNameInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => {
      const el = document.getElementById(`doc-preview-single`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  const handleDownload = async (doc: TataTertibDocument) => {
    const confirmed = await confirmAction({
      title: 'Konfirmasi Unduh Dokumen',
      message: `Apakah Anda yakin ingin mengunduh dokumen "${doc.fileName}"?`,
      type: 'download',
      confirmText: 'Ya, Unduh Dokumen'
    });
    if (!confirmed) return;

    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFileBadge = (fileName: string) => {
    const type = getFileType(fileName);
    if (type === 'pdf') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">PDF</span>;
    }
    if (type === 'image') {
      return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">GAMBAR</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">WORD</span>;
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
            Mendukung dokumen resmi ber-Kop Surat Sekolah & Stempel TTD Kepala Sekolah (Format Word, PDF, JPG, PNG)
          </p>
        </div>

        <div>
          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95">
            <Upload className="w-4 h-4" />
            <span>{isUploading ? 'Mengunggah...' : 'Unggah Dokumen'}</span>
            <input
              type="file"
              accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,.webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
              className="hidden"
              onChange={handleFileUpload}
              disabled={isUploading}
              ref={fileInputRef}
            />
          </label>
        </div>
      </div>

      {/* Kotak Area Drag & Drop Dokumen dengan Real-Time Attachment Preview */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-6 transition-all duration-300 flex flex-col items-center justify-center text-center ${
          isDraggingOver
            ? 'border-amber-400 bg-amber-400/10 scale-[1.01] shadow-2xl shadow-amber-500/20'
            : uploadDraft
            ? 'border-emerald-500/60 bg-slate-900/95 shadow-xl'
            : 'border-slate-700 hover:border-blue-500/60 bg-slate-900/60 hover:bg-slate-900/90'
        }`}
      >
        {uploadDraft ? (
          /* File Langsung Terlampir & Ditampilkan Real-Time di Dalam Kotak Drag & Drop */
          <div className="w-full bg-slate-950/90 border border-emerald-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-4 animate-fade-in text-left">
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Terlampir Real-Time</span>
                    </span>
                    {getFileBadge(uploadDraft.fileName)}
                  </div>
                  <h4 className="text-sm font-black text-white mt-1 truncate max-w-sm sm:max-w-md">
                    {uploadDraft.fileName}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  {uploadDraft.fileSizeFormatted}
                </span>
              </div>
            </div>

            {/* LIVE ATTACHMENT PREVIEWER WINDOW */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300 px-1">
                <span className="flex items-center gap-1.5 text-amber-300">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Pratinjau Langsung (Live Render):</span>
                </span>
                <span className="text-[11px] text-slate-400">Pastikan tata letak dokumen sudah sesuai</span>
              </div>
              <div className="rounded-xl border border-slate-800 overflow-hidden shadow-inner bg-slate-950">
                <LiveDocumentRenderer
                  fileData={uploadDraft.fileData}
                  fileName={uploadDraft.fileName}
                  extractedText={uploadDraft.extractedText}
                  isDraft={true}
                />
              </div>
            </div>

            <form onSubmit={handleConfirmSaveUpload} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Judul Dokumen Tata Tertib:
                </label>
                <input
                  type="text"
                  required
                  value={uploadFileNameInput}
                  onChange={(e) => setUploadFileNameInput(e.target.value)}
                  placeholder="Masukkan judul dokumen tata tertib..."
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setUploadDraft(null);
                    setUploadFileNameInput('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                >
                  Batal / Ganti File
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan & Tampilkan Dokumen</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Tampilan Kotak Area Drag & Drop Saat Kosong */
          <div
            className="flex flex-col items-center justify-center space-y-2.5 cursor-pointer py-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isDraggingOver
                  ? 'bg-amber-400 text-slate-950 scale-110 shadow-lg'
                  : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
              }`}
            >
              <Upload className="w-6 h-6 animate-bounce" />
            </div>

            <div className="space-y-0.5">
              <p className="text-sm font-black text-white">
                {isDraggingOver ? 'Lepaskan File di Sini!' : 'Tarik & Lepas File ke Sini untuk Mengunggah'}
              </p>
              <p className="text-xs text-slate-400">
                Atau <span className="text-amber-400 font-bold underline">klik di sini</span> untuk memilih file (Word, PDF, JPG, PNG)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dokumen Tab Selector jika ada lebih dari 1 dokumen */}
      {tataTertibList.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          <span className="text-xs font-bold text-slate-400 shrink-0 mr-1 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" />
            <span>Pilih Dokumen:</span>
          </span>
          {tataTertibList.map((doc) => (
            <button
              key={doc.id}
              onClick={() => setActiveDocId(doc.id)}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shrink-0 transition-all ${
                doc.id === activeDoc?.id
                  ? 'bg-amber-400 text-slate-950 shadow-lg shadow-amber-400/20'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate max-w-[200px]">{doc.fileName}</span>
              {getFileBadge(doc.fileName)}
            </button>
          ))}
        </div>
      )}

      {/* SATU-SATUNYA TEMPAT PREVIEW UTAMA DOKUMEN TATIB */}
      <div id="doc-preview-single" className="space-y-4">
        {!activeDoc ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-slate-900/50 rounded-2xl border border-dashed border-slate-700">
            <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-slate-300 font-bold mb-1">Belum ada dokumen tata tertib</h3>
            <p className="text-slate-500 text-sm text-center max-w-md">
              Silakan unggah file Tata Tertib sekolah (Word, PDF, atau Gambar Scan Kop & TTD Stempel Kepsek). Dokumen akan langsung dilampirkan dan ditampilkan secara penuh.
            </p>
          </div>
        ) : (
          <div id={`doc-card-${activeDoc.id}`} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xl">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-extrabold text-white">{activeDoc.fileName}</h3>
                    {getFileBadge(activeDoc.fileName)}
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Diunggah: {new Date(activeDoc.uploadedAt).toLocaleDateString('id-ID', {
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
                <button
                  type="button"
                  onClick={() => handleDownload(activeDoc)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all active:scale-95"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh File</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEdit(activeDoc)}
                  className="p-2 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-400 transition-colors border border-amber-400/20"
                  title="Edit Judul / Ganti File"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDocToDelete(activeDoc)}
                  className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors border border-rose-500/20"
                  title="Hapus Dokumen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Direct Full Inline View Container */}
            <div className="w-full bg-slate-950 rounded-xl p-2 sm:p-4 border border-slate-800 flex flex-col items-center justify-center min-h-[350px]">
              <LiveDocumentRenderer
                fileData={activeDoc.fileData}
                fileName={activeDoc.fileName}
                extractedText={activeDoc.extractedText}
                isDraft={false}
              />
            </div>
          </div>
        )}
      </div>

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
                      accept=".doc,.docx,.pdf,.png,.jpg,.jpeg,.webp,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf,image/*"
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

      {/* Modal Confirmation for Deleting Document */}
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
