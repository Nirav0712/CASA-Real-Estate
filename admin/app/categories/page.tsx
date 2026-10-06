'use client';

import * as React from 'react';
import { Card, Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/contexts/toast-context';
import { Layers, Plus, Trash2, Upload, X } from 'lucide-react';

interface CategoryItem {
  _id?: string;
  id?: string;
  code: string;
  name: string;
  description: string;
  totalListings?: number;
  isActive?: boolean;
  imageUrl?: string;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

export default function CategoriesPage() {
  const toast = useToast();
  const [categories, setCategories] = React.useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [uploadedCatImage, setUploadedCatImage] = React.useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [newCat, setNewCat] = React.useState({
    name: '',
    code: '',
    description: '',
  });

  const loadCategories = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/properties/categories/all`);
      const json = await res.json();
      const cats = json.data || json || [];
      setCategories(Array.isArray(cats) ? cats : []);
    } catch {
      toast.error('Notice', 'Could not load categories from live API.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle local PC file upload for category image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.warning('Invalid File', 'Please upload an image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      if (uploadEvent.target?.result) {
        setUploadedCatImage(uploadEvent.target.result as string);
        toast.info('Image Uploaded', `Category photo selected from PC.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) {
      toast.warning('Required Field', 'Please enter a Category Name.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/properties/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCat.name.trim(),
          code: newCat.code.trim() || undefined,
          description: newCat.description.trim() || `${newCat.name} category`,
          imageUrl: uploadedCatImage || undefined,
        }),
      });

      if (res.ok) {
        toast.success(
          'Category Created Live',
          `"${newCat.name}" is now stored in MongoDB Atlas with custom PC photo!`,
        );
        setIsAddOpen(false);
        setUploadedCatImage('');
        setNewCat({ name: '', code: '', description: '' });
        await loadCategories();
      } else {
        const err = await res.json();
        toast.error('Failed to create category', err.message || 'Error occurred');
      }
    } catch {
      toast.error('Error', 'Failed to reach API server');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (cat: CategoryItem) => {
    const id = cat._id || cat.id || cat.code;
    try {
      const res = await fetch(`${API_BASE}/properties/categories/${id}/toggle`, {
        method: 'PATCH',
      });
      if (res.ok) {
        setCategories((prev) =>
          prev.map((c) => (c.code === cat.code ? { ...c, isActive: !c.isActive } : c)),
        );
        toast.success('Category Updated', `Visibility toggled for "${cat.name}".`);
      }
    } catch {
      toast.error('Error', 'Could not toggle category status.');
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    if (!confirm(`Are you sure you want to remove "${cat.name}" category?`)) return;
    const id = cat._id || cat.id || cat.code;
    try {
      const res = await fetch(`${API_BASE}/properties/categories/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        toast.success('Category Removed', `"${cat.name}" deleted from database.`);
        setCategories((prev) => prev.filter((c) => c.code !== cat.code));
      }
    } catch {
      toast.error('Error', 'Could not delete category.');
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-casa-brand-subtle rounded-xl text-casa-brand">
              <Layers className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-casa-text-primary">
              Live Property Categories (MongoDB Atlas)
            </h1>
          </div>
          <p className="text-xs md:text-sm text-casa-text-secondary mt-1">
            Create, configure, and manage property categories shown across CASA marketplace filters.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsAddOpen(true)}
          className="text-xs flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-xs text-casa-text-muted">
          Loading live categories from database...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat, idx) => (
            <Card
              key={cat.code || cat._id || idx}
              className={`p-5 bg-casa-surface border shadow-subtle flex flex-col justify-between transition-all ${
                cat.isActive !== false
                  ? 'border-casa-border-light hover:border-casa-brand/40'
                  : 'opacity-60 border-casa-border-light/60 bg-casa-canvas'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-casa-subtle text-casa-text-muted">
                    #{idx + 1} {cat.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggle(cat)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                        cat.isActive !== false
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-zinc-100 text-zinc-500 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400'
                      }`}
                    >
                      {cat.isActive !== false ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      title="Delete Category"
                      className="p-1 text-zinc-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  {cat.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={cat.imageUrl}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-casa-border-light flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-casa-subtle flex items-center justify-center text-casa-text-muted flex-shrink-0">
                      <Layers className="w-6 h-6 opacity-40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-casa-text-primary truncate">{cat.name}</h3>
                    <p className="text-xs text-casa-text-secondary line-clamp-2 mt-0.5">{cat.description}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-casa-border-light flex items-center justify-between text-xs text-casa-text-muted">
                <span>{cat.totalListings || 0} Live Listings</span>
                <span className="text-casa-brand font-medium">MongoDB Atlas</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add Category Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Real Estate Category (From PC Photo)"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Category Display Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g., Luxury Penthouse / Studio Apartment"
              value={newCat.name}
              onChange={(e) => {
                const name = e.target.value;
                const autoCode = name.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
                setNewCat({ ...newCat, name, code: autoCode });
              }}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl focus:ring-2 focus:ring-casa-brand/30 text-casa-text-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Category Code (Unique Identifier)
            </label>
            <input
              type="text"
              placeholder="e.g., PENTHOUSE"
              value={newCat.code}
              onChange={(e) => setNewCat({ ...newCat, code: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl font-mono text-casa-text-primary"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Describe what types of properties belong in this category..."
              value={newCat.description}
              onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-casa-canvas border border-casa-border-light rounded-xl text-casa-text-primary resize-none"
            />
          </div>

          {/* Category PC Image Upload */}
          <div>
            <label className="text-xs font-semibold text-casa-text-primary block mb-1">
              Category Icon / Photo from PC (Optional)
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            {uploadedCatImage ? (
              <div className="relative inline-block rounded-xl overflow-hidden border border-casa-border-light h-20 w-20 bg-casa-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={uploadedCatImage} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setUploadedCatImage('')}
                  className="absolute top-1 right-1 p-0.5 rounded-full bg-red-600 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-casa-border-light hover:border-casa-brand rounded-xl p-3 text-center cursor-pointer bg-casa-canvas/50 transition-colors"
              >
                <Upload className="w-5 h-5 text-casa-brand mx-auto mb-1" />
                <div className="text-xs font-semibold text-casa-text-primary">
                  Choose Category Image from PC
                </div>
                <div className="text-[10px] text-casa-text-muted">JPG, PNG, WebP</div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-casa-border-light">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isSubmitting}
              className="bg-casa-brand hover:bg-casa-brand-hover text-white text-xs"
            >
              {isSubmitting ? 'Saving to Database...' : 'Add Category'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
