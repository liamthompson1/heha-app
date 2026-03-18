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
          height={32}
          priority
        />
      </Link>
    </div>
  );
}
