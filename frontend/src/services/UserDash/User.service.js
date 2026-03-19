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
      const response = await fetch(
        `${API_BASE_URL}/api/wallet/dashboard`,
        {
          method: "GET",
          headers: getAuthHeaders(),
        }
      );

      console.log("API URL:", `${API_BASE_URL}/api/wallet/dashboard`);

      if (!response.ok) {
        throw new Error("Failed to fetch wallet dashboard");
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error("Wallet Dashboard API Error:", error);
      throw error;
    }
  }


  // ================= ADD WALLET CREDIT =================
  async creditWallet(amount) {
  const response = await fetch(`${API_BASE_URL}/api/wallet/credit`, {
    method: "POST",
   headers: getAuthHeaders(),
    body: JSON.stringify({ amount: Number(amount) })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to credit wallet");
  }

  return data;
}

}

export default new UserService();