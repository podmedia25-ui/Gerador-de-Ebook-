import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import { marked } from 'marked';
import type { Ebook, Chapter } from '../types';

interface EbookEditorProps {
  ebook: Ebook;
  onSave: (updatedEbook: Ebook) => void;
  onBack: () => void;
}

const EbookEditor: React.FC<EbookEditorProps> = ({ ebook, onSave, onBack }) => {
    const [editedData, setEditedData] = useState<Ebook>(ebook);

    const handleFieldChange = (field: keyof Omit<Ebook, 'chapters'>, value: string) => {
        setEditedData(prev => ({ ...prev, [field]: value }));
    };

    const handleChapterChange = (index: number, field: keyof Chapter, value: string) => {
        setEditedData(prev => {
            const newChapters = [...prev.chapters];
            const chapterToUpdate = { ...newChapters[index], [field]: value };
            newChapters[index] = chapterToUpdate;
            return { ...prev, chapters: newChapters };
        });
    };

    const toHtml = (text: string): string => {
        if (!text) return '';
        const isHtml = /<[a-z][\s\S]*>/i.test(text);
        return isHtml ? text : marked(text) as string;
    };

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            ['link'],
            [{ 'color': [] }, { 'background': [] }],
            ['clean']
        ],
    };
    
    // Módulos simplificados para os campos de título
    const quillTitleModules = {
         toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'color': [] }],
         ]
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200/80 w-full max-w-4xl animate-fade-in overflow-hidden">
            <div className="p-8 md:p-12">
                <header className="text-center mb-12">
                     <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Título do Ebook</h2>
                     <ReactQuill
                        theme="snow"
                        value={toHtml(editedData.title)}
                        onChange={(html) => handleFieldChange('title', html)}
                        modules={quillTitleModules}
                        className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 quill-title-editor"
                     />
                </header>

                <section id="introduction" className="mb-12">
                    <h2 className="text-2xl font-bold mb-4 text-slate-900 border-b pb-2">Introdução</h2>
                    <ReactQuill
                        theme="snow"
                        value={toHtml(editedData.introduction)}
                        onChange={(html) => handleFieldChange('introduction', html)}
                        modules={quillModules}
                        className="prose prose-lg max-w-none"
                    />
                </section>

                <article>
                    {editedData.chapters.map((chapter, index) => (
                        <section key={index} id={`chapter-${index}`} className="mb-16">
                            <h3 className="text-xl font-bold text-slate-500 mb-2 uppercase tracking-wider">Capítulo {index + 1} - Título</h3>
                            <ReactQuill
                                theme="snow"
                                value={toHtml(chapter.title)}
                                onChange={(html) => handleChapterChange(index, 'title', html)}
                                modules={quillTitleModules}
                                className="text-3xl font-bold text-slate-900 mb-4 quill-title-editor"
                            />

                            <h3 className="text-xl font-bold text-slate-500 mb-2 uppercase tracking-wider mt-6">Capítulo {index + 1} - Conteúdo</h3>
                             <ReactQuill
                                theme="snow"
                                value={toHtml(chapter.content)}
                                onChange={(html) => handleChapterChange(index, 'content', html)}
                                modules={quillModules}
                                className="prose prose-lg max-w-none"
                            />
                        </section>
                    ))}
                </article>
            </div>
            <footer className="p-6 border-t border-slate-200 bg-slate-50/50 flex flex-wrap justify-center items-center gap-4">
                <button onClick={onBack} className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-5 rounded-lg transition-colors border border-slate-300 shadow-sm">Cancelar</button>
                <button onClick={() => onSave(editedData)} className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-5 rounded-lg transition-all transform hover:scale-105 shadow-md">Salvar Ebook</button>
            </footer>
        </div>
    );
};

export default EbookEditor;
