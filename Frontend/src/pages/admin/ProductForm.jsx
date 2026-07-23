// src/pages/admin/ProductForm.jsx

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import adminService from '../../services/adminService';
import axiosInstance from '../../services/axiosInstance';
import Input from '../../components/common/Input';
import Loader from '../../components/common/Loader';

const UNITS = ['kg', 'g', 'litre', 'ml', 'piece', 'pack', 'dozen', 'box'];

const ProductForm = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEdit);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    adminService.getCategoriesAdmin().then(setCategories);
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setSubCategories([]);
      return;
    }
    axiosInstance
      .get('/subcategories', { params: { category: selectedCategory } })
      .then((res) => setSubCategories(res.data.data.subCategories));
  }, [selectedCategory]);

  useEffect(() => {
    if (!isEdit) return;
    axiosInstance.get(`/products/admin`).then((res) => {
      const product = res.data.data.products.find((p) => p._id === id);
      if (product) {
        setValue('name', product.name);
        setValue('description', product.description);
        setValue('brand', product.brand);
        setValue('mrp', product.mrp);
        setValue('sellingPrice', product.sellingPrice);
        setValue('unit', product.unit);
        setValue('unitValue', product.unitValue);
        setValue('stock', product.stock);
        setValue('tags', product.tags?.join(', '));
        setValue('category', product.category?._id);
        setSelectedCategory(product.category?._id);
        setValue('subCategory', product.subCategory?._id);
        setExistingImages(product.images || []);
      }
      setLoading(false);
    });
  }, [isEdit, id, setValue]);

  const onSubmit = async (data) => {
    if (!isEdit && imageFiles.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== '') formData.append(key, value);
      });
      imageFiles.forEach((file) => formData.append('images', file));

      if (isEdit) {
        await adminService.updateProduct(id, formData);
        toast.success('Product updated successfully');
      } else {
        await adminService.createProduct(formData);
        toast.success('Product created successfully');
      }
      navigate('/admin/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveExistingImage = async (publicId) => {
    try {
      await adminService.removeProductImage(id, publicId);
      setExistingImages((prev) => prev.filter((img) => img.publicId !== publicId));
      toast.success('Image removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove image');
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {isEdit ? 'Edit Product' : 'Add New Product'}
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <Input label="Product Name" error={errors.name?.message} {...register('name', { required: 'Required' })} />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            className="input-field"
            {...register('description')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Category
            </label>
            <select
              className="input-field"
              {...register('category', { required: 'Required' })}
              onChange={(e) => {
                setValue('category', e.target.value);
                setSelectedCategory(e.target.value);
              }}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Subcategory
            </label>
            <select className="input-field" {...register('subCategory', { required: 'Required' })}>
              <option value="">Select subcategory</option>
              {subCategories.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            {errors.subCategory && <p className="mt-1 text-xs text-red-500">{errors.subCategory.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input label="MRP (₹)" type="number" step="0.01" error={errors.mrp?.message} {...register('mrp', { required: 'Required', min: 0 })} />
          <Input label="Selling Price (₹)" type="number" step="0.01" error={errors.sellingPrice?.message} {...register('sellingPrice', { required: 'Required', min: 0 })} />
          <Input label="Stock" type="number" error={errors.stock?.message} {...register('stock', { required: 'Required', min: 0 })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Unit</label>
            <select className="input-field" {...register('unit', { required: 'Required' })}>
              <option value="">Select unit</option>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
            {errors.unit && <p className="mt-1 text-xs text-red-500">{errors.unit.message}</p>}
          </div>
          <Input label="Unit Value" type="number" step="0.01" error={errors.unitValue?.message} {...register('unitValue', { required: 'Required', min: 0.01 })} />
        </div>

        <Input label="Brand (optional)" {...register('brand')} />
        <Input label="Tags (comma-separated)" placeholder="fresh, organic, imported" {...register('tags')} />

        {isEdit && existingImages.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Images
            </label>
            <div className="flex flex-wrap gap-3">
              {existingImages.map((img) => (
                <div key={img.publicId} className="relative">
                  <img src={img.url} alt="" className="w-20 h-20 rounded-lg object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveExistingImage(img.publicId)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
            {isEdit ? 'Add More Images' : 'Product Images'}
          </label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setImageFiles(Array.from(e.target.files))}
            className="input-field"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting} className="btn-primary px-6 py-2.5">
            {submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary px-6 py-2.5">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;