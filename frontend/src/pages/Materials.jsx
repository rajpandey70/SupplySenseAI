import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const Materials = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Tower Components",
    currentStock: 0,
    unit: "Units",
    reorderLevel: 0,
    unitCost: 0,
    supplier: null,
    description: "",
    autoReorder: false,
    minimumReorderQuantity: 0,
  });
  const [suppliers, setSuppliers] = useState([]);

  // Quick Stock Update State
  const [quickUpdateSearchTerm, setQuickUpdateSearchTerm] = useState("");
  const [showQuickUpdateDropdown, setShowQuickUpdateDropdown] = useState(false);
  const [quickUpdateMaterialId, setQuickUpdateMaterialId] = useState("");
  const [quickUpdateQuantity, setQuickUpdateQuantity] = useState("");

  const fetchMaterials = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/materials");
      // Transform data to match UI requirements
      const formattedMaterials = response.data.data.map((m) => ({
        id: m._id,
        materialId: m.materialId || "N/A",
        name: m.name,
        category: m.category,
        stock: `${m.currentStock} ${m.unit}`,
        reorder: `${m.reorderLevel} ${m.unit}`,
        cost: `₹${m.unitCost}`,
        supplier: m.supplier?.name || "Unknown Supplier", // For display
        supplierId: m.supplier?._id || null, // For editing
        status: m.status,
        date: new Date(m.updatedAt).toISOString().split("T")[0],
        // Raw fields for editing
        rawStock: m.currentStock,
        unit: m.unit,
        rawReorder: m.reorderLevel,
        rawCost: m.unitCost,
        autoReorder: m.autoReorder || false,
        minimumReorderQuantity: m.minimumReorderQuantity || 0,
        description: m.description || "",
      }));
      setMaterials(formattedMaterials);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching materials:", error);
      setLoading(false);
    }
  }, []);

  const fetchSuppliers = async () => {
    try {
      const response = await api.get("/suppliers");
      setSuppliers(response.data.data);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchMaterials();
      fetchSuppliers();
    }, 0);
  }, [fetchMaterials]);

  const handleInputChange = (e) => {
    const target = e.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      name: "",
      category: "Tower Components",
      currentStock: 0,
      unit: "Units",
      reorderLevel: 0,
      unitCost: 0,
      supplier: null,
      description: "",
      autoReorder: false,
      minimumReorderQuantity: 0,
    });
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Prepare form data, convert empty supplier to null
      const submitData = {
        ...formData,
        supplier: formData.supplier === "" ? null : formData.supplier,
      };

      if (editingId) {
        await api.put(`/materials/${editingId}`, submitData);
      } else {
        await api.post("/materials", submitData);
      }
      setShowModal(false);
      resetForm();
      fetchMaterials(); // Refresh list
    } catch (error) {
      console.error("Error saving material:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to save material";
      alert(errorMessage);
    }
  };

  const handleEdit = (material) => {
    setFormData({
      name: material.name,
      category: material.category,
      currentStock: material.rawStock,
      unit: material.unit,
      reorderLevel: material.rawReorder,
      unitCost: material.rawCost,
      supplier: material.supplierId || null,
      description: material.description,
      autoReorder: material.autoReorder,
      minimumReorderQuantity: material.minimumReorderQuantity,
    });
    setEditingId(material.id);
    setShowModal(true);
  };

  const handleReorder = (material) => {
    navigate("/app/orders", {
      state: {
        prefillMaterial: material.id,
        prefillSupplier: material.supplierId,
      },
    });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await api.delete(`/materials/${id}`);
        fetchMaterials();
      } catch (error) {
        console.error("Error deleting material:", error);
        const errorMessage =
          error.response?.data?.message || "Failed to delete material";
        alert(errorMessage);
      }
    }
  };

  // Quick Stock Logic
  const handleQuickSearch = (e) => {
    setSearchTerm(e.target.value);
    setQuickUpdateSearchTerm(e.target.value);
    setShowQuickUpdateDropdown(true);
    if (e.target.value === "") {
      setQuickUpdateMaterialId("");
    }
  };

  const selectQuickMaterial = (mat) => {
    setQuickUpdateSearchTerm(
      `${mat.materialId && mat.materialId !== "N/A" ? `#${mat.materialId} - ` : ""}${mat.name}`,
    );
    setQuickUpdateMaterialId(mat.id);
    setShowQuickUpdateDropdown(false);
  };

  const filteredQuickMaterials = materials.filter((mat) => {
    const search = quickUpdateSearchTerm.toLowerCase();
    const nameMatch = mat.name.toLowerCase().includes(search);
    const idMatch =
      mat.materialId && mat.materialId.toLowerCase().includes(search);
    return nameMatch || idMatch;
  });

  const handleQuickStockUpdate = async (type) => {
    if (!quickUpdateMaterialId) return alert("Please select a material first.");

    const qty = Number(quickUpdateQuantity);
    if (!qty || qty <= 0)
      return alert("Please enter a valid quantity greater than 0.");

    const mat = materials.find((m) => m.id === quickUpdateMaterialId);
    if (!mat) return alert("Material not found in state.");

    let newStock;
    if (type === "add") {
      newStock = mat.rawStock + qty;
    } else if (type === "remove") {
      newStock = mat.rawStock - qty;
      if (newStock < 0)
        return alert("Cannot remove more stock than is currently available.");
    }

    try {
      await api.put(`/materials/${quickUpdateMaterialId}`, {
        currentStock: newStock,
      });

      // Reset and refresh
      setSearchTerm("");
      setQuickUpdateSearchTerm("");
      setQuickUpdateMaterialId("");
      setQuickUpdateQuantity("");
      fetchMaterials();
    } catch (err) {
      console.error("Error quick-updating stock:", err);
      alert(err.response?.data?.message || "Failed to update stock");
    }
  };

  const filteredMaterials = materials.filter((m) => {
    // We use quickUpdateSearchTerm for the grid filter to avoid the "ID - Name" lock string
    const searchLow = quickUpdateSearchTerm.toLowerCase();
    const matchesSearch =
      m.name.toLowerCase().includes(searchLow) ||
      (m.materialId && m.materialId.toLowerCase().includes(searchLow));
    const matchesCategory =
      category === "All Categories" || m.category === category;
    const matchesStatus = status === "All Status" || m.status === status;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="fade-in">
      {loading && materials.length === 0 ? (
        <div className="text-center py-10">Loading materials...</div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Unified Search & Quick Action Group */}
              <div className="flex-grow flex flex-wrap items-center gap-2 max-w-2xl bg-slate-50 p-2 rounded-lg border border-slate-100">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setQuickUpdateSearchTerm(e.target.value);
                      setShowQuickUpdateDropdown(true);
                      if (e.target.value === "") {
                        setQuickUpdateMaterialId("");
                      }
                    }}
                    onFocus={() => setShowQuickUpdateDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowQuickUpdateDropdown(false), 200)
                    }
                    placeholder="Search or select material by ID/Name..."
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 sm:text-sm bg-white"
                  />
                  {showQuickUpdateDropdown && searchTerm && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                      {filteredMaterials.length > 0 ? (
                        filteredMaterials.map((mat) => (
                          <li
                            key={mat.id}
                            onMouseDown={() => {
                              setSearchTerm(
                                `${mat.materialId && mat.materialId !== "N/A" ? `#${mat.materialId} - ` : ""}${mat.name}`,
                              );
                              // Keep the grid filtered by just the raw name instead of the huge formatted stamp
                              setQuickUpdateSearchTerm(mat.name);
                              setQuickUpdateMaterialId(mat.id);
                              setShowQuickUpdateDropdown(false);
                            }}
                            className="px-4 py-2 hover:bg-teal-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-b-0"
                          >
                            <span className="font-medium text-slate-800 text-sm">
                              {mat.materialId && mat.materialId !== "N/A" ? (
                                <span className="text-teal-600 font-mono mr-2">
                                  #{mat.materialId}
                                </span>
                              ) : null}
                              {mat.name}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              Stock: {mat.stock}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-slate-500 text-center">
                          No matches found
                        </li>
                      )}
                    </ul>
                  )}
                </div>

                {/* Quick Action Buttons (inline with search) */}
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={quickUpdateQuantity}
                    onChange={(e) => setQuickUpdateQuantity(e.target.value)}
                    placeholder="Qty"
                    className="w-20 px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-teal-400 sm:text-sm bg-white"
                  />
                  <button
                    onClick={() => handleQuickStockUpdate("add")}
                    title="Add to current stock"
                    className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-3 text-center rounded-md font-bold transition-colors shadow-sm whitespace-nowrap"
                  >
                    + Add Stock
                  </button>
                  <button
                    onClick={() => handleQuickStockUpdate("remove")}
                    title="Remove from current stock"
                    className="bg-rose-500 hover:bg-rose-600 text-white py-2 px-3 text-center rounded-md font-bold transition-colors shadow-sm whitespace-nowrap"
                  >
                    - Remove Stock
                  </button>
                </div>
              </div>
              {/* End Unified Search & Quick Action Group */}

              <div className="flex items-center gap-4 ml-auto">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                >
                  <option>All Categories</option>
                  <option>Tower Components</option>
                  <option>Transmission Line</option>
                  <option>Sub-station Fittings</option>
                  <option>Foundation Materials</option>
                </select>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-md border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm"
                >
                  <option>All Status</option>
                  <option>In Stock</option>
                  <option>Low Stock</option>
                  <option>Out of Stock</option>
                </select>
                <button
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                  className="bg-slate-800 text-white py-2 px-4 rounded-md hover:bg-slate-900 font-semibold"
                >
                  Add Material
                </button>
              </div>
            </div>
          </div>

          {filteredMaterials.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
              <p className="text-lg">No materials found.</p>
              <p className="text-sm">
                Click "Add Material" to create a new entry.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMaterials.map((material, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {material.materialId !== "N/A" && (
                        <div className="mb-1">
                          <span className="text-xs font-mono font-bold bg-slate-800 text-white px-2 py-1 rounded shadow-sm">
                            ID: #{material.materialId}
                          </span>
                        </div>
                      )}
                      <h4 className="text-lg font-semibold text-slate-800">
                        {material.name}
                      </h4>
                      <p className="text-sm text-slate-500">
                        {material.category}
                      </p>
                    </div>
                    <span
                      className={`status-badge status-${material.status.toLowerCase().replace(" ", "-")}`}
                    >
                      {material.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm my-4 flex-grow">
                    <div>
                      <p className="text-slate-500">Current Stock:</p>
                      <p className="font-medium text-slate-700">
                        {material.stock}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 flex items-center gap-1">
                        Reorder Level:
                        {material.autoReorder ? (
                          <span
                            title={`Auto-Reorder enabled for ${material.minimumReorderQuantity || 0} units`}
                            className="inline-flex items-center justify-center p-0.5 bg-teal-100 text-teal-800 rounded-full"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="3"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                          </span>
                        ) : null}
                      </p>
                      <p className="font-medium text-slate-700">
                        {material.reorder}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Unit Cost:</p>
                      <p className="font-medium text-slate-700">
                        {material.cost}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Supplier:</p>
                      <p className="font-medium text-slate-700">
                        {material.supplier}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-slate-400 mt-2">
                    Last Updated: {material.date}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleEdit(material)}
                      className="flex-1 bg-slate-200 text-slate-800 py-2 px-4 rounded-md hover:bg-slate-300 font-semibold text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleReorder(material)}
                      className="flex-1 bg-teal-100 text-teal-800 py-2 px-4 rounded-md hover:bg-teal-200 font-semibold text-sm"
                    >
                      Reorder
                    </button>
                    <button
                      onClick={() => handleDelete(material.id)}
                      className="flex-none bg-red-100 text-red-800 py-2 px-3 rounded-md hover:bg-red-200 font-semibold text-sm"
                      title="Delete Material"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Material Modal */}
          {showModal && (
            <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="text-lg font-semibold text-slate-800">
                    {editingId ? "Edit Material" : "Add New Material"}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <form
                  onSubmit={handleSubmit}
                  className="p-6 space-y-4 max-h-[75vh] overflow-y-auto"
                >
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Material Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Category
                      </label>
                      <select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option>Tower Components</option>
                        <option>Transmission Line</option>
                        <option>Sub-station Fittings</option>
                        <option>Foundation Materials</option>
                        <option>Accessories</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Unit
                      </label>
                      <select
                        name="unit"
                        value={formData.unit}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option>Units</option>
                        <option>Kilometers</option>
                        <option>Metric Tons</option>
                        <option>Cubic Meters</option>
                        <option>kg</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Current Stock
                      </label>
                      <input
                        type="number"
                        name="currentStock"
                        required
                        min="0"
                        value={formData.currentStock}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Reorder Level
                      </label>
                      <input
                        type="number"
                        name="reorderLevel"
                        required
                        min="0"
                        value={formData.reorderLevel}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Unit Cost (₹)
                    </label>
                    <input
                      type="number"
                      name="unitCost"
                      required
                      min="0"
                      step="0.01"
                      value={formData.unitCost}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Supplier
                    </label>
                    <select
                      name="supplier"
                      value={formData.supplier || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="">Select Supplier</option>
                      {suppliers.map((supplier) => (
                        <option key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                    ></textarea>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 flex items-center">
                          <svg
                            className="w-4 h-4 mr-1 text-teal-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                          Auto-Reorder
                        </h4>
                        <p className="text-xs text-slate-500">
                          Automatically creates a Purchase Order when stock hits
                          the Reorder Level.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          name="autoReorder"
                          checked={formData.autoReorder}
                          onChange={handleInputChange}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                      </label>
                    </div>

                    {formData.autoReorder && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Minimum Reorder Quantity
                        </label>
                        <input
                          type="number"
                          name="minimumReorderQuantity"
                          min="1"
                          value={formData.minimumReorderQuantity}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-teal-500 focus:border-teal-500"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-white bg-teal-600 hover:bg-teal-700 rounded-md font-medium"
                    >
                      {editingId ? "Update Material" : "Create Material"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Materials;
