import Link from "next/link";
import Image from "next/image";

export default function LogoHeader() {
  return (
    <div className="logo-header" aria-hidden="true">
      <Link href="/" className="logo-header-link">
        <Image
          src="/heha-logo.png"
          alt="HEHA"
          width={100}
          height={50}
          priority
          style={{ height: 32, width: "auto" }}
        />
      </Link>
    </div>
  );
}
