// src/pages/admin/Categories.jsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiPlus, FiEdit2, FiTrash2, FiList } from 'react-icons/fi';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Category create/edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Subcategory management modal state
  const [showSubModal, setShowSubModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);
  const [subCategories, setSubCategories] = useState([]);
  const [subLoading, setSubLoading] = useState(false);
  const [subImageFile, setSubImageFile] = useState(null);
  const {
    register: registerSub,
    handleSubmit: handleSubSubmit,
    reset: resetSubForm,
    formState: { errors: subErrors },
  } = useForm();

  const loadCategories = () => {
    setLoading(true);
    adminService.getCategoriesAdmin().then((data) => {
      setCategories(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // -------------------------------------------
  // Category CRUD
  // -------------------------------------------
  const openCreateModal = () => {
    setEditingCategory(null);
    reset({ name: '', description: '', displayOrder: 0 });
    setImageFile(null);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setEditingCategory(category);
    setValue('name', category.name);
    setValue('description', category.description);
    setValue('displayOrder', category.displayOrder);
    setImageFile(null);
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    if (!editingCategory && !imageFile) {
      toast.error('Please upload an image');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('description', data.description || '');
      formData.append('displayOrder', data.displayOrder || 0);
      if (imageFile) formData.append('image', imageFile);

      if (editingCategory) {
        await adminService.updateCategory(editingCategory._id, formData);
        toast.success('Category updated');
      } else {
        await adminService.createCategory(formData);
        toast.success('Category created');
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? Subcategories must be removed first.`)) return;
    try {
      await adminService.deleteCategory(id);
      toast.success('Category deleted');
      loadCategories();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  // -------------------------------------------
  // Subcategory management (per category)
  // -------------------------------------------
  const openSubModal = async (category) => {
    setActiveCategory(category);
    setSubImageFile(null);
    resetSubForm({ name: '', description: '', displayOrder: 0 });
    setShowSubModal(true);
    setSubLoading(true);
    try {
      const all = await adminService.getSubCategoriesAdmin();
      setSubCategories(all.filter((s) => s.category?._id === category._id || s.category === category._id));
    } catch (err) {
      toast.error('Failed to load subcategories');
    } finally {
      setSubLoading(false);
    }
  };

  const onSubSubmit = async (data) => {
    if (!subImageFile) {
      toast.error('Please upload an image');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('category', activeCategory._id);
      formData.append('description', data.description || '');
      formData.append('displayOrder', data.displayOrder || 0);
      formData.append('image', subImageFile);

      const created = await adminService.createSubCategory(formData);
      setSubCategories((prev) => [...prev, created]);
      resetSubForm({ name: '', description: '', displayOrder: 0 });
      setSubImageFile(null);
      toast.success('Subcategory added');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add subcategory');
    }
  };

  const handleDeleteSub = async (id, name) => {
    if (!window.confirm(`Delete subcategory "${name}"?`)) return;
    try {
      await adminService.deleteSubCategory(id);
      setSubCategories((prev) => prev.filter((s) => s._id !== id));
      toast.success('Subcategory deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete subcategory (it may have products assigned)');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
        <button onClick={openCreateModal} className="btn-primary px-4 py-2 text-sm flex items-center gap-2">
          <FiPlus size={16} /> Add Category
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <div key={cat._id} className="card p-4">
              <img src={cat.image?.url} alt={cat.name} className="w-full aspect-square rounded-lg object-cover mb-3" />
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm text-gray-800 dark:text-gray-100 truncate">{cat.name}</p>
                <Badge variant={cat.isActive ? 'green' : 'gray'}>{cat.isActive ? 'Active' : 'Inactive'}</Badge>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => openEditModal(cat)} className="btn-secondary flex-1 text-xs py-1.5 flex items-center justify-center gap-1">
                  <FiEdit2 size={12} /> Edit
                </button>
                <button onClick={() => handleDelete(cat._id, cat.name)} className="p-2 text-gray-400 hover:text-red-500">
                  <FiTrash2 size={14} />
                </button>
              </div>
              <button
                onClick={() => openSubModal(cat)}
                className="btn-secondary w-full text-xs py-1.5 flex items-center justify-center gap-1 mt-2"
              >
                <FiList size={12} /> Manage Subcategories
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Category Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingCategory ? 'Edit Category' : 'Add Category'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Name" error={errors.name?.message} {...register('name', { required: 'Required' })} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Description
            </label>
            <textarea rows={2} className="input-field" {...register('description')} />
          </div>
          <Input label="Display Order" type="number" {...register('displayOrder')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {editingCategory ? 'Replace Image (optional)' : 'Image'}
            </label>
            <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} className="input-field" />
          </div>
          <button type="submit" className="btn-primary w-full py-2.5">
            {editingCategory ? 'Update' : 'Create'}
          </button>
        </form>
      </Modal>

      {/* Subcategory Management Modal */}
      <Modal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
        title={`Subcategories — ${activeCategory?.name || ''}`}
      >
        <div className="space-y-4">
          {subLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : subCategories.length === 0 ? (
            <p className="text-sm text-gray-400">No subcategories yet for this category.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {subCategories.map((sub) => (
                <div key={sub._id} className="flex items-center gap-3 p-2 border border-gray-100 dark:border-gray-800 rounded-lg">
                  <img src={sub.image?.url} alt={sub.name} className="w-10 h-10 rounded-lg object-cover" />
                  <span className="flex-1 text-sm font-medium text-gray-800 dark:text-gray-100">{sub.name}</span>
                  <button onClick={() => handleDeleteSub(sub._id, sub.name)} className="p-1.5 text-gray-400 hover:text-red-500">
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Add New Subcategory</p>
            <form onSubmit={handleSubSubmit(onSubSubmit)} className="space-y-3">
              <Input label="Name" error={subErrors.name?.message} {...registerSub('name', { required: 'Required' })} />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Image</label>
                <input type="file" accept="image/*" onChange={(e) => setSubImageFile(e.target.files[0])} className="input-field" />
              </div>
              <button type="submit" className="btn-primary w-full py-2">
                Add Subcategory
              </button>
            </form>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;