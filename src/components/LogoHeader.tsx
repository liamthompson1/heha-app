import Link from "next/link";
import Image from "next/image";

export default function LogoHeader() {
  return (
    <Link href="/" className="logo-header">
      <Image
        src="/heha-logo.png"
        alt="HEHA"
        width={100}
        height={32}
        priority
      />
    </Link>
  );
}
