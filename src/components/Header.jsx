import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export default function Header() {
  const { user } = useContext(AuthContext);
  return (
    <>
    </>
  );
}
