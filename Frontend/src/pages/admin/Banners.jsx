// src/pages/admin/Banners.jsx

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import adminService from "../../services/adminService";
import Modal from "../../components/common/Modal";
import Input from "../../components/common/Input";
import Badge from "../../components/common/Badge";

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: { position: "hero" },
  });

  const loadBanners = () => {
    setLoading(true);
    adminService.getBannersAdmin().then((data) => {
      setBanners(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadBanners();
  }, []);

  const onSubmit = async (data) => {
    if (!imageFile) {
      toast.error("Please upload a banner image");
      return;
    }
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });
      formData.append("image", imageFile);

      await adminService.createBanner(formData);
      toast.success("Banner created");
      setShowModal(false);
      reset();
      setImageFile(null);
      loadBanners();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create banner");
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Delete banner "${title}"?`)) return;
    try {
      await adminService.deleteBanner(id);
      toast.success("Banner deleted");
      loadBanners();
    } catch (err) {
      toast.error("Failed to delete banner");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Banners
        </h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary px-4 py-2 text-sm flex items-center gap-2"
        >
          <FiPlus size={16} /> Add Banner
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : banners.length === 0 ? (
        <p className="text-gray-400 text-sm">No banners yet</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {banners.map((banner) => (
            <div key={banner._id} className="card p-4">
              <img
                src={banner.image?.url}
                alt={banner.title}
                className="w-full aspect-[3/1] rounded-lg object-cover mb-3"
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800 dark:text-gray-100">
                    {banner.title}
                  </p>
                  <p className="text-xs text-gray-400">{banner.position}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={banner.isActive ? "green" : "gray"}>
                    {banner.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <button
                    onClick={() => handleDelete(banner._id, banner.title)}
                    className="p-2 text-gray-400 hover:text-red-500"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Add Banner"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Title"
            error={errors.title?.message}
            {...register("title", { required: "Required" })}
          />
          <Input label="Subtitle (optional)" {...register("subtitle")} />
          <Input
            label="Link URL (optional)"
            placeholder="/category/fruits-vegetables"
            {...register("linkUrl")}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Position
            </label>
            <select className="input-field" {...register("position")}>
              <option value="hero">Hero (Homepage top)</option>
              <option value="secondary">Secondary</option>
              <option value="category_page">Category Page</option>
            </select>
          </div>

          <Input
            label="Display Order"
            type="number"
            defaultValue={0}
            {...register("displayOrder")}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files[0])}
              className="input-field"
            />
          </div>

          <button type="submit" className="btn-primary w-full py-2.5">
            Create Banner
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default Banners;
