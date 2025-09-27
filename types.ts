export interface EbookImage {
  url: string;
  caption: string;
}

export interface Chapter {
  title: string;
  content: string;
  images: EbookImage[];
}

/**
 * Representa os dados do conteúdo de um ebook gerado pela IA.
 */
export type GeneratedEbook = {
  title: string;
  introduction: string;
  chapters: Chapter[];
}

/**
 * Representa a estrutura completa de um ebook salvo localmente,
 * incluindo metadados como id e datas de criação/atualização.
 */
export interface Ebook extends GeneratedEbook {
  id: string;
  createdAt: string;
  updatedAt: string;
}
