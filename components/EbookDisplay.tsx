import React, { useState } from 'react';
import { marked } from 'marked';
import type { Ebook } from '../types';

interface EbookDisplayProps {
  ebook: Ebook;
  onBack: () => void;
  onEdit?: () => void;
}

const DocumentDownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 9.707a1 1 0 011.414 0L9 11.086V3a1 1 0 112 0v8.086l1.293-1.379a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const CopyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
        <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h6a2 2 0 00-2-2H5z" />
    </svg>
);

const EditIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
      <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
      <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
    </svg>
);

const ExternalLinkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor" {...props}>
        <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
        <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
    </svg>
);


const ReadOnlyField: React.FC<{ html: string; className?: string, as?: 'div' | 'h1' | 'h2' | 'h3' }> = 
({ html, className, as: Component = 'div' }) => {
    return (
        <Component
            className={className}
            dangerouslySetInnerHTML={{ __html: marked(html) as string }}
        />
    );
};


const EbookDisplay: React.FC<EbookDisplayProps> = ({ ebook, onBack, onEdit }) => {
  const [copyButtonText, setCopyButtonText] = useState('Copiar Markdown');

  const getMarkdownContent = () => {
    const chaptersMarkdown = ebook.chapters.map((chapter, index) => {
        const imagesMarkdown = chapter.images?.map(image => 
            `\n![${image.caption}](${image.url})\n*${image.caption}*`
        ).join('') || '';

        return `
## Capítulo ${index + 1}: ${chapter.title}
${chapter.content}
${imagesMarkdown}
`;
    }).join('\n');

    return `
# ${ebook.title}

## Introdução
${ebook.introduction}
${chaptersMarkdown}
    `.trim();
  }

  const handleCopyToClipboard = () => {
    const markdownContent = getMarkdownContent();
    // FIX: Use window.navigator to avoid type errors with missing DOM library.
    // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
    (window as any).navigator.clipboard.writeText(markdownContent).then(() => {
        setCopyButtonText('Copiado!');
        setTimeout(() => setCopyButtonText('Copiar Markdown'), 2000);
    }).catch(err => {
        console.error('Falha ao copiar texto: ', err);
    });
  };

  const getFullHtmlContent = () => {
    const chaptersHtml = ebook.chapters.map((chapter, index) => {
        const imagesHtml = chapter.images?.map(image => `
            <div style="text-align: center; margin: 2em 0;">
                <img src="${image.url}" alt="${image.caption}" style="max-width: 90%; height: auto; display: block; margin: 0 auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
                <p style="text-align: center; font-style: italic; color: #555; font-size: 10pt; margin-top: 8px;">${image.caption}</p>
            </div>
        `).join('') || '';
        return `
            <h2>Capítulo ${index + 1}: ${chapter.title}</h2>
            <div>${marked(chapter.content) as string}</div>
            ${imagesHtml}
        `;
    }).join('');
    return `
        <!DOCTYPE html><html lang="pt-br"><head><meta charset="UTF-8"><title>${ebook.title}</title><style>body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 2em auto; padding: 0 1em; } h1 { font-size: 2.5rem; color: #2c5282; text-align: center; margin-bottom: 2rem; } h2 { font-size: 1.75rem; color: #2d3748; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; margin-top: 2.5rem; } h3 { font-size: 1.25rem; color: #2d3748; } p, li { font-size: 1rem; text-align: justify; } ul, ol { padding-left: 2rem; } strong { font-weight: 600; color: #000; } em { font-style: italic; } blockquote { border-left: 4px solid #a0aec0; padding-left: 1rem; margin-left: 0; color: #4a5568; font-style: italic; }</style></head>
        <body><h1>${ebook.title}</h1><h2>Introdução</h2><div>${marked(ebook.introduction) as string}</div>${chaptersHtml}</body></html>`;
  }

  const handleExportToDoc = () => {
    const htmlContent = getFullHtmlContent();
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    // FIX: Use window.document to avoid type errors with missing DOM library.
    // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
    const link = (window as any).document.createElement('a');
    link.href = url;
    const safeFilename = ebook.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeFilename}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleOpenInNewTab = () => {
    const htmlContent = getFullHtmlContent();
    // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
    const newTab = (window as any).open();
    if (newTab) {
        newTab.document.open();
        newTab.document.write(htmlContent);
        newTab.document.close();
        newTab.focus();
    } else {
        // @google/genai-fix: Cast `window` to `any` to access DOM properties without DOM lib types.
        (window as any).alert("Por favor, permita pop-ups para abrir o ebook em uma nova guia.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 w-full max-w-7xl animate-fade-in overflow-hidden">
        <header className="p-8 text-center border-b border-slate-200">
            <ReadOnlyField as="h1"
                className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 prose"
                html={ebook.title}
            />
        </header>

        <div className="flex flex-col md:flex-row">
            <aside className="w-full md:w-80 flex-shrink-0 p-8 border-b md:border-b-0 md:border-r border-slate-200 md:sticky top-16 self-start bg-slate-50/50">
                <h4 className="text-lg font-semibold mb-4 text-slate-900">Sumário</h4>
                <nav>
                    <ul className="space-y-2">
                        <li><a href="#introduction" className="group flex items-center p-2 rounded-md transition-colors text-slate-600 hover:text-blue-600 hover:bg-blue-50"><span className="font-semibold">Introdução</span></a></li>
                        {ebook.chapters.map((chapter, index) => (
                            <li key={index}><a href={`#chapter-${index}`} className="group flex items-center p-2 rounded-md transition-colors text-slate-600 hover:text-blue-600 hover:bg-blue-50"><span className="font-bold mr-2 text-slate-400 group-hover:text-blue-500">Cap. {index + 1}:</span> <span className="truncate">{chapter.title}</span></a></li>
                        ))}
                    </ul>
                </nav>
            </aside>
            <div className="flex-1 min-w-0">
                <section id="introduction" className="p-8 md:p-12 border-b border-slate-200 scroll-mt-24">
                    <h2 className="text-2xl font-bold mb-4 text-slate-900">Introdução</h2>
                    <ReadOnlyField
                        className="prose prose-lg max-w-none text-slate-700"
                        html={ebook.introduction}
                    />
                </section>
                <article className="p-8 md:p-12">
                    {ebook.chapters.map((chapter, index) => (
                        <section key={index} id={`chapter-${index}`} className="mb-16 scroll-mt-24">
                            <div className="relative mb-6">
                                <span className="absolute -left-4 -top-8 text-8xl font-black text-slate-200/80 select-none z-0">{index + 1}</span>
                                <ReadOnlyField as="h3"
                                    className="relative text-3xl font-bold text-slate-900 z-10 prose"
                                    html={chapter.title}
                                />
                            </div>
                            <ReadOnlyField
                                className="prose prose-lg max-w-none text-slate-700 prose-headings:text-slate-800 prose-a:text-blue-600 prose-strong:text-slate-900 prose-blockquote:border-blue-500 prose-blockquote:text-slate-600"
                                html={chapter.content}
                            />
                            {chapter.images && chapter.images.length > 0 && (
                                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {chapter.images.map((image, imgIndex) => (
                                        <figure key={imgIndex}><img src={image.url} alt={image.caption} className="w-full h-auto rounded-lg shadow-md border border-slate-200"/><figcaption className="mt-3 text-center text-sm text-slate-600">{image.caption}</figcaption></figure>
                                    ))}
                                </div>
                            )}
                        </section>
                    ))}
                </article>
            </div>
        </div>

        <footer className="p-6 border-t border-slate-200 bg-slate-50/50 flex flex-wrap justify-center items-center gap-4">
            {onEdit && (
                 <button onClick={onEdit} className="inline-flex items-center justify-center bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors shadow-sm"><EditIcon />Editar Ebook</button>
            )}
            <button onClick={handleExportToDoc} className="inline-flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-5 rounded-lg transition-colors border border-slate-300 shadow-sm"><DocumentDownloadIcon />Exportar para Doc</button>
            <button onClick={handleOpenInNewTab} className="inline-flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-5 rounded-lg transition-colors border border-slate-300 shadow-sm"><ExternalLinkIcon />Abrir em nova guia</button>
            <button onClick={handleCopyToClipboard} className="inline-flex items-center justify-center bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-5 rounded-lg transition-colors border border-slate-300 shadow-sm"><CopyIcon />{copyButtonText}</button>
            <button onClick={onBack} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-5 rounded-lg transition-all transform hover:scale-105 shadow-md">Voltar ao Histórico</button>
        </footer>
    </div>
  );
};

export default EbookDisplay;