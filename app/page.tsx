"use client";

import { Quicksand, Inter } from "next/font/google";
import Image from 'next/image';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import BgImage from '../public/pic3.png';
import MultipleCsvUploader from "./components/MultipleCsvUploader";

const quicksand2 = Quicksand({
  weight:"500",
  style:"normal",
  subsets: ['latin', 'latin-ext'],
  preload: true,
})

const inter = Inter({
  weight:'900',
  style:'italic',
  subsets: ['latin', 'latin-ext'],
  preload: true,
})

const interLight = Inter({
  weight:'500',
  style:'normal',
  subsets: ['latin', 'latin-ext'],
  preload: true,
})

export default function Home () {
  const router = useRouter();
  const [noOfFiles, setNoOfFiles] = useState<number>(0);

  const goToAnalyze = () => {
    if (noOfFiles > 0) {
      if (noOfFiles == 1) {
        router.push("/analyze");
      } else {
        router.push("/compare");
      }
    }
  }

  return(
    <main className="w-full h-max flex flex-col justify-center items-center inset-0 -z-10 p-4 [background:radial-gradient(125%_100%_at_50%_10%,#000_40%,#63e_100%)]">
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
      <div>
        <Image
          src={BgImage}
          alt='bg image'
          className='w-[20rem]'
        />
      </div>
      <div className={`${inter.className} text-5xl md:text-7xl mb-2`}>Analyze &</div>
      <div className={`${inter.className} text-5xl md:text-6xl flex justify-center items-center text-gray-200 my-2`}>
        <div>Get the &nbsp;</div>
        <div className="relative p-3 cursor-pointer border-orange-600 border-[4px] border-dashed hover:rounded-2xl hover:scale-90 transition-all duration-300 ease-in-out group shake-on-hover">
          <div className="glow-text shake-text">Ticks</div>

          <div className="absolute -top-5 -left-5 transition-transform duration-300 ease-in-out group-hover:-rotate-45">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="lucide lucide-plus-icon lucide-plus size-8">
              <path d="M5 12h14"/>
              <path d="M12 5v14"/>
            </svg>
          </div>

          <div className="absolute -bottom-5 -right-5 transition-transform duration-300 ease-in-out group-hover:rotate-45">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" 
                viewBox="0 0 24 24" fill="none" stroke="currentColor" 
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
                className="lucide lucide-plus-icon lucide-plus size-8 text-purple-700">
              <path d="M5 12h14"/>
              <path d="M12 5v14"/>
            </svg>
          </div>
        </div>
      </div>
      <div className={`${inter.className} text-5xl md:text-7xl`}>Right !!</div>
      <div className="my-6 flex">
        <a
          href="#upload-section"
          rel="noopener noreferrer"
          className="inline-flex"
        >
          <span className="relative inline-block overflow-hidden rounded-full p-[1px]">
            <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#a9a9a9_0%,#0c0c0c_50%,#a9a9a9_100%)] dark:bg-[conic-gradient(from_90deg_at_50%_50%,#171717_0%,#737373_50%,#171717_100%)]" />
            <div className="inline-flex h-full w-full cursor-pointer justify-center rounded-full bg-white px-3 py-1 text-xs font-medium leading-5 text-slate-600 backdrop-blur-xl dark:bg-black dark:text-slate-200">
              Dive Deeper ⚡️
              <span className="inline-flex items-center pl-2 text-black dark:text-white">
                Trade Smarter{' '}
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right-icon lucide-arrow-right pl-0.5 text-white size-4">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </span>
            </div>
          </span>
        </a>
      </div>
      <MultipleCsvUploader setNoOfFiles={setNoOfFiles}/>
      <div
        onClick={() => goToAnalyze()}
        className={`${interLight.className} rounded-xl bg-gray-200 text-gray-800 mt-0 md:mt-[1rem] mb-[10rem] px-[5rem] p-[1rem] md:px-[8rem] md:p-[1rem] text-md md:text-xl hover:opacity-65 cursor-pointer`}
      >
        Analyze
      </div>
      <div className={`${quicksand2.className} mt-20 mb-3 text-lg`}>
        Made with 💖 by &nbsp;<a href="https://github.com/ams003010/" target="_blank" className="hover:text-white hover:border-b-2 glow-text">Abhijith</a>
      </div>
    </main>
  )
}




