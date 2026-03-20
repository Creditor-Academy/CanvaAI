import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// Helper to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

class UserService {

  // ================= WALLET DASHBOARD =================
  async getWalletDashboard() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/wallet/dashboard`,
        {
          headers: getAuthHeaders(),
        }
      );

      console.log("API URL:", `${API_BASE_URL}/api/wallet/dashboard`);

      return response.data;

    } catch (error) {
      console.error("Wallet Dashboard API Error:", error);
      throw new Error(
        error.response?.data?.message || "Failed to fetch wallet dashboard"
      );
    }
  }


  // ================= ADD WALLET CREDIT =================
  async creditWallet(amount) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/wallet/credit`,
        { amount: Number(amount) },
        {
          headers: getAuthHeaders(),
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message || "Failed to credit wallet"
      );
    }
  }

}

export default new UserService();