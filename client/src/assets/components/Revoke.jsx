import { useState, useEffect } from "react";
import { useContract, useAddress } from "@thirdweb-dev/react";
import CryptoJS from 'crypto-js';

const Revoke = () => {
  const { contract, isLoading } = useContract("0xf1725A52E1543c37e45DdB28d3cc63bbFC11875F");
  const address = useAddress();
  const [msg, setMsg] = useState([]);
  const [cid, setCid] = useState("Qmc5dAkjELhjdvnWHcsS3d8MVtABeauNHqQSTaAuXJLZBC");
  const [selectDate, onDate] = useState(new Date());
  const [email, setemail] = useState("");
  const [popup, setIsPopupOpen] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!isLoading) {
        const data = await contract.call("getFiles", [address]);
        setMsg(data);
      }
    };
    fetchData();
  }, [address, contract, isLoading]);

  const handleGrantAccess = () => {
    const data = { selectDate, cid };
    const jsonData = JSON.stringify(data);
    const encryptedDate = CryptoJS.AES.encrypt(jsonData, 'secret key').toString();
    console.log(encryptedDate);
    sendOTP();
  };

  return (
    // Your JSX markup here...
    <input
      type="date"
      min={new Date().toISOString().split("T")[0]}
      value={selectDate.toISOString().split("T")[0]} // Ensure correct format
      onChange={(e) => onDate(new Date(e.target.value))}
      className="border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-full"
    />
  );
};

export default Revoke;
