import { Redirect } from "expo-router";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AuthIndex() {
  const [loading, setLoading] = useState(true);
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem("token");
      setLogged(!!token);
      setLoading(false);
    };

    checkLogin();
  }, []);

  if (loading) return null;

  return <Redirect href={logged ? "/(tabs)" : "/login"} />;
}
