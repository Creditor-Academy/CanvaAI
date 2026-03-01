import { useUIStore } from "../store/useUIStore";

export const withHybridLoader = async (
  asyncFn,
  type = "top",
  message = ""
) => {
  const { startLoading, stopLoading } = useUIStore.getState();

  try {
    startLoading(type, message);

    const result = await asyncFn();

    setTimeout(() => {
      stopLoading();
    }, 2000);

    return result;
  } catch (error) {
    stopLoading();
    throw error;
  }
};