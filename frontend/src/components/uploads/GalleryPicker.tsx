'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/modal';
import Button from '@/components/ui/button';
import { Upload, ImageIcon, Loader2 } from 'lucide-react';

interface GalleryImage {
  url: string;
  filename: string;
}

interface GalleryPickerProps {
  onSelect: (url: string) => void;
  onClose: () => void;
}

export function GalleryPicker({ onSelect, onClose }: GalleryPickerProps) {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchGallery = async () => {
    try {
      const list = await api.listGallery();
      setImages(list);
    } catch {
      setImages([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGallery(); }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await api.uploadImage(file);
      setImages((prev) => [...prev, result]);
    } catch (err: any) {
      alert(err.message);
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Galeria de Imagens</h3>
        <div>
          <Button variant="secondary" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} type="button">
            {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="ml-1">{uploading ? 'Enviando...' : 'Upload'}</span>
          </Button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon size={48} className="mx-auto mb-2 opacity-40" />
          <p>Nenhuma imagem na galeria</p>
          <p className="text-sm">Faça upload de imagens para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
          {images.map((img) => (
            <button
              key={img.filename}
              type="button"
              onClick={() => onSelect(img.url)}
              className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-primary-500 transition-colors"
            >
              <img src={img.url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function GalleryButton({ onSelect }: { onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)} type="button">
        <ImageIcon size={16} className="mr-1" /> Galeria
      </Button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title="Selecionar Imagem" size="lg">
        <GalleryPicker onSelect={(url) => { onSelect(url); setOpen(false); }} onClose={() => setOpen(false)} />
      </Modal>
    </>
  );
}
