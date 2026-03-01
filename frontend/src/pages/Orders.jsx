import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import api from "../utils/api";
import { formatDate } from "../utils/dateUtils";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [suppliers, setSuppliers] = useState([]);

  // Autocomplete search states
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [showMaterialDropdown, setShowMaterialDropdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const location = useLocation();
  const [formData, setFormData] = useState({
    material: "",
    supplier: "",
    quantity: "",
    expectedDeliveryDate: "",
    notes: "",
  });

  const [userRole, setUserRole] = useState("user");

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserRole(parsedUser.role || "user");
      }
    } catch (e) {
      console.error("Invalid user object found in localStorage");
    }
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch orders");
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [matRes, supRes] = await Promise.all([
        api.get("/materials", config),
        api.get("/suppliers", config),
      ]);

      setMaterials(matRes.data.data || matRes.data);
      setSuppliers(supRes.data.data || supRes.data);
      await fetchOrders();
    } catch (err) {
      setError("Failed to fetch required data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle pre-fill from navigation state
  useEffect(() => {
    if (location.state?.prefillMaterial && materials.length > 0) {
      setFormData((prev) => ({
        ...prev,
        material: location.state.prefillMaterial,
        supplier: location.state.prefillSupplier || "",
      }));

      const prefilledMat = materials.find(
        (m) => m._id === location.state.prefillMaterial,
      );
      if (prefilledMat) {
        setMaterialSearchTerm(
          `${prefilledMat.materialId ? `#${prefilledMat.materialId} - ` : ""}${prefilledMat.name}`,
        );
      }

      setIsModalOpen(true);
      // Clear state so a refresh doesn't pop the modal again
      window.history.replaceState({}, document.title);
    }
  }, [location, materials]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMaterialSearch = (e) => {
    setMaterialSearchTerm(e.target.value);
    setShowMaterialDropdown(true);
    // If the user clears the input, clear the selected material ID as well
    if (e.target.value === "") {
      setFormData((prev) => ({ ...prev, material: "", supplier: "" }));
    }
  };

  const selectMaterial = (mat) => {
    setMaterialSearchTerm(
      `${mat.materialId ? `#${mat.materialId} - ` : ""}${mat.name}`,
    );
    setFormData((prev) => ({
      ...prev,
      material: mat._id,
      supplier: mat.supplier || "",
    }));
    setShowMaterialDropdown(false);
  };

  const filteredMaterials = materials.filter((mat) => {
    const search = materialSearchTerm.toLowerCase();
    const nameMatch = mat.name.toLowerCase().includes(search);
    const idMatch =
      mat.materialId && mat.materialId.toLowerCase().includes(search);
    return nameMatch || idMatch;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await api.post(
        "/orders",
        {
          ...formData,
          quantity: Number(formData.quantity),
        },
        config,
      );

      setIsModalOpen(false);
      setFormData({
        material: "",
        supplier: "",
        quantity: "",
        expectedDeliveryDate: "",
        notes: "",
      });
      setMaterialSearchTerm("");
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create order");
    }
  };

  const handleReceiveStock = async () => {
    if (!selectedOrder) return;
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await api.put(
        `/orders/${selectedOrder._id}/status`,
        { status: "Received" },
        config,
      );

      setReceiveModalOpen(false);
      setSelectedOrder(null);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update stock");
    }
  };

  const handleApproveOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to approve this order?")) return;
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await api.put(
        `/orders/${orderId}/status`,
        // Status can be advanced from Pending -> Ordered by Manager/Admin
        { status: "Ordered" },
        config,
      );
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to approve order");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Purchase Orders</h2>
          <p className="text-sm text-slate-500 mt-1">
            Manage stock replenishment requests from suppliers
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center"
        >
          <svg
            className="w-5 h-5 mr-1.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Create Order
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Order ID / Date
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Material / Quantity
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Supplier
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Expected Delivery
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Status
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    <div className="font-mono text-teal-700 font-bold mb-1">
                      {order.orderId || "N/A"}
                    </div>
                    {formatDate(order.createdAt, "MM/DD/YYYY")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">
                      {order.material?.name || "Unknown Material"}
                    </div>
                    <div className="text-sm text-slate-500">
                      {order.quantity} {order.material?.unit}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-900">
                      {order.supplier?.name || "Unknown Supplier"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                    {order.expectedDeliveryDate
                      ? formatDate(order.expectedDeliveryDate, "MM/DD/YYYY")
                      : "Not Set"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.status === "Received"
                          ? "bg-green-100 text-green-800"
                          : order.status === "In Transit"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : order.status === "Approved"
                                ? "bg-indigo-100 text-indigo-800"
                                : order.status === "Ordered"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-100 text-slate-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {/* Approve button for admins/managers on Pending orders */}
                    {order.status === "Pending" &&
                      (userRole === "admin" || userRole === "manager") && (
                        <button
                          onClick={() => handleApproveOrder(order._id)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium mr-4"
                        >
                          Approve First
                        </button>
                      )}

                    {/* Disabled pending text for basic users */}
                    {order.status === "Pending" && userRole === "user" && (
                      <span className="text-slate-400 italic font-medium mr-4">
                        Appr. Required
                      </span>
                    )}

                    {order.status !== "Received" &&
                      order.status !== "Cancelled" &&
                      order.status !== "Pending" && (
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setReceiveModalOpen(true);
                          }}
                          className="text-teal-600 hover:text-teal-900 font-medium"
                        >
                          Mark Received
                        </button>
                      )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-slate-500"
                  >
                    <svg
                      className="mx-auto h-12 w-12 text-slate-400 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p className="text-lg font-medium">
                      No purchase orders found
                    </p>
                    <p className="text-sm">
                      Click "Create Order" to request new inventory.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Order Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                Create Purchase Order
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
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
            <div className="p-6 overflow-y-auto">
              <form
                id="orderForm"
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                <div className="relative">
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Material
                  </label>
                  <input
                    type="text"
                    value={materialSearchTerm}
                    onChange={handleMaterialSearch}
                    onFocus={() => setShowMaterialDropdown(true)}
                    onBlur={() =>
                      setTimeout(() => setShowMaterialDropdown(false), 200)
                    }
                    placeholder="Search by 6-digit ID or Name..."
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                    required={!formData.material}
                  />
                  {showMaterialDropdown && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {filteredMaterials.length > 0 ? (
                        filteredMaterials.map((mat) => (
                          <li
                            key={mat._id}
                            onMouseDown={() => selectMaterial(mat)}
                            className="px-4 py-2 hover:bg-teal-50 cursor-pointer flex justify-between items-center border-b border-slate-100 last:border-b-0"
                          >
                            <span className="font-medium text-slate-800">
                              {mat.materialId ? (
                                <span className="text-teal-600 mr-2 font-mono">
                                  #{mat.materialId}
                                </span>
                              ) : (
                                ""
                              )}
                              {mat.name}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                              Stock: {mat.currentStock} {mat.unit}
                            </span>
                          </li>
                        ))
                      ) : (
                        <li className="px-4 py-3 text-sm text-slate-500 text-center">
                          No materials found matching "{materialSearchTerm}"
                        </li>
                      )}
                    </ul>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Supplier
                  </label>
                  <select
                    name="supplier"
                    value={formData.supplier}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                    required
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((sup) => (
                      <option key={sup._id} value={sup._id}>
                        {sup.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Quantity to Order
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    min="1"
                    value={formData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Expected Delivery Date
                  </label>
                  <input
                    type="date"
                    name="expectedDeliveryDate"
                    value={formData.expectedDeliveryDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-900"
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end space-x-3 rounded-b-xl">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="orderForm"
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors shadow-sm"
              >
                Create Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Stock Modal */}
      {receiveModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mb-4 mx-auto">
                <svg
                  className="w-6 h-6 text-teal-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-center text-slate-800 mb-2">
                Receive Stock
              </h3>
              <p className="text-sm text-center text-slate-500 mb-6">
                Are you sure you want to mark this stock as received? This will
                automatically add{" "}
                <span className="font-bold text-slate-800">
                  {selectedOrder.quantity} {selectedOrder.material?.unit}
                </span>{" "}
                to your inventory for{" "}
                <span className="font-bold text-slate-800">
                  {selectedOrder.material?.name}
                </span>
                .
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setReceiveModalOpen(false);
                    setSelectedOrder(null);
                  }}
                  className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReceiveStock}
                  className="flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
