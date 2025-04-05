import Image from "next/image";
import Link from "next/link";
import { Inter, Quicksand } from "next/font/google";

import NotFoundPic from '@/public/not-found-pic.png';

const inter = Inter({
    weight:'900',
    style:'italic',
    subsets: ['latin', 'latin-ext'],
    preload: true,
})

const quicksand = Quicksand({
    weight:'500',
    style:'normal',
    subsets: ['latin', 'latin-ext'],
    preload: true,
})

export default function NotFound() {
    return (
        <div className="flex flex-col justify-center items-center">
            <div className="animate-float flex justify-between items-center mt-[6rem] mb-5">
                <div>
                    <Image
                        src={NotFoundPic}
                        alt="not found"
                        className="w-[8rem] md:w-[15rem]"
                    />
                </div>
                <div className="italic text-md md:text-2xl text-center">You&apos;re not <br/>gonna get rich here</div>
            </div>
            <div className={`${inter.className} text-9xl`}>404</div>
            <div className={`${quicksand.className}`}>Page Not found</div>
            <Link href="/" className={`${quicksand.className} text-3xl mt-8 border-b-white border-b-2`}>Get back home</Link>
        </div>
    )
}